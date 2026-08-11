import { NextRequest, NextResponse } from 'next/server';
import { getBackupConfig, backupDatabase, saveBackupConfig } from '@/lib/backup-utility';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token');

    // Also check Bearer Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 401 });
    }

    const config = getBackupConfig();

    if (token !== config.cronToken) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 403 });
    }

    // Trigger backup
    console.log('[BACKUP SYSTEM] External Cron triggered. Running backup...');
    const filename = await backupDatabase(true);
    
    // Update last backup date in configuration
    const todayStr = new Date().toISOString().slice(0, 10);
    config.lastAutoBackupDate = todayStr;
    saveBackupConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Automatic backup executed successfully via external CRON.',
      filename,
    });
  } catch (error: any) {
    console.error('CRON backup execution error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Support GET requests as well for simple web hooks (e.g. some cron services only support GET)
export async function GET(request: NextRequest) {
  // Convert GET to POST logic internally
  return POST(request);
}
