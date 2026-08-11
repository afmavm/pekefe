import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import fs from 'fs';
import path from 'path';
import {
  getBackupConfig,
  saveBackupConfig,
  getDatabaseProvider,
  getDatabaseSize,
  backupDatabase,
  restoreDatabase
} from '@/lib/backup-utility';

export const dynamic = 'force-dynamic';

const getBackupDir = (): string => {
  const dir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const backupDir = getBackupDir();
    const files = fs.readdirSync(backupDir);
    
    const backups = files
      .filter(file => file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sqlite')))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const dbSize = await getDatabaseSize();
    const dbProvider = getDatabaseProvider();
    const totalBackups = backups.length;
    const totalSize = backups.reduce((acc, curr) => acc + curr.size, 0);
    const lastBackupDate = backups.length > 0 ? backups[0].createdAt : null;

    const config = getBackupConfig();

    return NextResponse.json({
      backups,
      stats: {
        dbSize,
        dbProvider,
        totalBackups,
        totalSize,
        lastBackupDate,
      },
      config,
    });
  } catch (error: any) {
    console.error('Error in GET /api/backup:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'backup') {
      const filename = await backupDatabase(false);
      return NextResponse.json({ success: true, message: 'Yedek başarıyla oluşturuldu.', filename });
    }

    if (action === 'restore') {
      const { filename } = body;
      if (!filename) {
        return NextResponse.json({ error: 'Dosya adı belirtilmedi.' }, { status: 400 });
      }
      await restoreDatabase(filename);
      return NextResponse.json({ success: true, message: 'Veritabanı başarıyla geri yüklendi.' });
    }

    if (action === 'delete') {
      const { filename } = body;
      if (!filename) {
        return NextResponse.json({ error: 'Dosya adı belirtilmedi.' }, { status: 400 });
      }
      const backupDir = getBackupDir();
      const filePath = path.join(backupDir, filename);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 404 });
      }
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: 'Yedek dosyası silindi.' });
    }

    if (action === 'updateConfig') {
      const { config } = body;
      if (!config) {
        return NextResponse.json({ error: 'Konfigürasyon eksik.' }, { status: 400 });
      }
      const currentConfig = getBackupConfig();
      const newConfig = {
        ...currentConfig,
        autoBackup: config.autoBackup ?? currentConfig.autoBackup,
        scheduleHour: Number(config.scheduleHour ?? currentConfig.scheduleHour),
        retentionDays: Number(config.retentionDays ?? currentConfig.retentionDays),
      };
      saveBackupConfig(newConfig);
      return NextResponse.json({ success: true, message: 'Ayarlar güncellendi.', config: newConfig });
    }

    return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/backup:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
