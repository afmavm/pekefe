import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'deploy.log');
const STATUS_FILE_PATH = path.join(process.cwd(), 'deploy-status.json');

interface DeployStatus {
  status: 'idle' | 'running' | 'success' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

// Helper to read deploy status
function getDeployStatus(): DeployStatus {
  try {
    if (fs.existsSync(STATUS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading deploy status:', err);
  }
  return { status: 'idle', startedAt: null, completedAt: null, error: null };
}

// Helper to write deploy status
function writeDeployStatus(status: DeployStatus) {
  try {
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(status, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing deploy status:', err);
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const dbUrl = process.env.DATABASE_URL || '';
    const isSQLite = !dbUrl || dbUrl.startsWith('file:') || dbUrl.includes('.db');
    const isMySQL = dbUrl.startsWith('mysql:') || dbUrl.startsWith('mysql://');
    const dbProvider = isSQLite ? 'SQLite' : isMySQL ? 'MySQL' : 'PostgreSQL';

    // 1. Git Bilgilerini Al
    let gitInfo = {
      branch: 'Bilinmiyor',
      hash: 'Bilinmiyor',
      author: 'Bilinmiyor',
      message: 'Bilinmiyor',
      date: 'Bilinmiyor',
      status: 'Clean',
      behind: 0
    };

    try {
      gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
      gitInfo.hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
      gitInfo.author = execSync('git log -1 --format="%an"', { encoding: 'utf-8' }).trim();
      gitInfo.message = execSync('git log -1 --format="%s"', { encoding: 'utf-8' }).trim();
      gitInfo.date = execSync('git log -1 --format="%cd"', { encoding: 'utf-8' }).trim();
      
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
      if (gitStatus) {
        gitInfo.status = 'Modified';
      }
      
      // Git fetch ve arkada kalma kontrolü (Canlı ortamda çalışır)
      exec('git fetch', (err) => {
        if (!err) {
          try {
            const count = execSync('git rev-list --count HEAD..origin/main', { encoding: 'utf-8' }).trim();
            gitInfo.behind = parseInt(count) || 0;
          } catch {}
        }
      });
    } catch (gitErr: any) {
      console.warn('[DEPLOYS_GIT_DIAGNOSTICS_WARNING]:', gitErr.message);
    }

    // 2. PM2 Bilgilerini Al
    let pm2Info = {
      active: false,
      uptime: '0s',
      memory: '0 MB',
      restarts: 0,
      status: 'offline',
      pid: 0
    };

    try {
      const pm2ListOutput = execSync('pm2 jlist', { encoding: 'utf-8' });
      const apps = JSON.parse(pm2ListOutput);
      const mainApp = apps.find((app: any) => app.name === 'b2b-ecommerce');
      if (mainApp) {
        pm2Info.active = true;
        pm2Info.status = mainApp.pm2_env?.status || 'offline';
        pm2Info.restarts = mainApp.pm2_env?.restart_time || 0;
        pm2Info.pid = mainApp.pid || 0;
        
        // Memory calculation
        const memBytes = mainApp.monit?.memory || 0;
        pm2Info.memory = `${Math.round(memBytes / 1024 / 1024)} MB`;

        // Uptime calculation
        const uptimeMs = mainApp.pm2_env?.pm_uptime ? (Date.now() - mainApp.pm2_env.pm_uptime) : 0;
        const uptimeSecs = Math.floor(uptimeMs / 1000);
        if (uptimeSecs < 60) {
          pm2Info.uptime = `${uptimeSecs}s`;
        } else if (uptimeSecs < 3600) {
          pm2Info.uptime = `${Math.floor(uptimeSecs / 60)}dk`;
        } else {
          pm2Info.uptime = `${Math.floor(uptimeSecs / 3600)}sa ${Math.floor((uptimeSecs % 3600) / 60)}dk`;
        }
      }
    } catch (pm2Err: any) {
      // PM2 sunucuda yüklü değilse hata vermesin
      console.warn('[DEPLOYS_PM2_DIAGNOSTICS_WARNING]: PM2 listed error / not found', pm2Err.message);
    }

    // 3. Güncelleme Logunu Oku
    let logContent = '';
    if (fs.existsSync(LOG_FILE_PATH)) {
      logContent = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    }

    // 4. Güncel Durumu Al
    const deployStatus = getDeployStatus();

    return NextResponse.json({
      success: true,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        database: dbProvider
      },
      git: gitInfo,
      pm2: pm2Info,
      deploy: {
        ...deployStatus,
        logs: logContent
      }
    });

  } catch (error: any) {
    console.error('[API_ADMIN_DEPLOY_GET_ERROR]:', error);
    return NextResponse.json(
      { error: 'Sistem bilgileri alınırken hata oluştu.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const currentStatus = getDeployStatus();
  if (currentStatus.status === 'running') {
    return NextResponse.json(
      { error: 'Zaten aktif bir güncelleme işlemi devam ediyor.' },
      { status: 400 }
    );
  }

  // Yeni dağıtımı başlat
  writeDeployStatus({
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null
  });

  // Log dosyasını temizle
  try {
    fs.writeFileSync(LOG_FILE_PATH, '--- Dağıtım İşlemi Başlatıldı ---\n', 'utf-8');
  } catch (err) {
    console.error('Error clearing deploy log file:', err);
  }

  // Dağıtımı arka planda başlat (asenkron)
  const isWindows = process.platform === 'win32';
  const scriptPath = path.join(process.cwd(), isWindows ? 'deploy.bat' : 'deploy.sh');
  const command = isWindows ? `"${scriptPath}"` : `bash "${scriptPath}"`;
  
  // Komutu arka planda çalıştırıyoruz ve çıktıyı deploy.log dosyasına yönlendiriyoruz
  const deployProcess = exec(`${command} > "${LOG_FILE_PATH}" 2>&1`, (error) => {
    const status = getDeployStatus();
    if (error) {
      console.error('[DEPLOYMENT_BACKGROUND_FAILED]:', error);
      writeDeployStatus({
        ...status,
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: error.message
      });
      // Log dosyasına da ekleyelim
      fs.appendFileSync(LOG_FILE_PATH, `\n\nHATA: Dağıtım başarısız oldu!\nHata Detayı: ${error.message}\n`, 'utf-8');
    } else {
      writeDeployStatus({
        ...status,
        status: 'success',
        completedAt: new Date().toISOString(),
        error: null
      });
      fs.appendFileSync(LOG_FILE_PATH, `\n\nBAŞARILI: Dağıtım işlemi başarıyla tamamlandı! 🎉\n`, 'utf-8');
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Güncelleme işlemi arka planda başlatıldı.'
  });
}
