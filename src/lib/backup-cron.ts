import { getBackupConfig, saveBackupConfig, backupDatabase } from './backup-utility';

declare global {
  var backupCronInterval: NodeJS.Timeout | undefined;
}

export const initBackupCron = (): void => {
  // Prevent multiple intervals in dev mode due to Next.js hot reloads
  if (global.backupCronInterval) {
    clearInterval(global.backupCronInterval);
    global.backupCronInterval = undefined;
  }

  console.log('[BACKUP SYSTEM] Initializing automatic backup scheduler...');

  const checkAndBackup = async () => {
    try {
      const config = getBackupConfig();
      if (!config.autoBackup) return;

      const now = new Date();
      const currentHour = now.getHours();

      // Check if it is the scheduled backup hour
      if (currentHour === config.scheduleHour) {
        const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

        // Verify we haven't already backed up today
        if (config.lastAutoBackupDate !== todayStr) {
          console.log(`[BACKUP SYSTEM] Starting scheduled backup for date: ${todayStr}`);
          
          const filename = await backupDatabase(true);
          console.log(`[BACKUP SYSTEM] Scheduled backup completed successfully: ${filename}`);

          // Update last backup date in configuration
          config.lastAutoBackupDate = todayStr;
          saveBackupConfig(config);
        }
      }
    } catch (e) {
      console.error('[BACKUP SYSTEM] Scheduled backup failed:', e);
    }
  };

  // Run immediately on startup, then every 15 minutes
  checkAndBackup();
  global.backupCronInterval = setInterval(checkAndBackup, 15 * 60 * 1000);
};
