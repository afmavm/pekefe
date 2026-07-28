import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface BackupConfig {
  autoBackup: boolean;
  scheduleHour: number;
  retentionDays: number;
  cronToken: string;
  lastAutoBackupDate?: string;
}

const getPrismaClient = async () => {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
};

const getBackupDir = (): string => {
  const dir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const getConfigFile = (): string => {
  return path.join(getBackupDir(), 'backup-config.json');
};

const getSQLitePath = (): string => {
  const prismaPath = path.join(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(prismaPath)) return prismaPath;
  const rootPath = path.join(process.cwd(), 'dev.db');
  if (fs.existsSync(rootPath)) return rootPath;
  return prismaPath;
};

// Get backup configuration
export const getBackupConfig = (): BackupConfig => {
  const file = getConfigFile();
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return {
        autoBackup: data.autoBackup ?? true,
        scheduleHour: data.scheduleHour ?? 3,
        retentionDays: data.retentionDays ?? 30,
        cronToken: data.cronToken || crypto.randomBytes(16).toString('hex'),
        lastAutoBackupDate: data.lastAutoBackupDate,
      };
    } catch (e) {
      console.error('Error reading backup config, resetting to default:', e);
    }
  }

  // Default config if not exists or error
  const defaultConfig: BackupConfig = {
    autoBackup: true,
    scheduleHour: 3,
    retentionDays: 30,
    cronToken: crypto.randomBytes(16).toString('hex'),
  };
  saveBackupConfig(defaultConfig);
  return defaultConfig;
};

// Save backup configuration
export const saveBackupConfig = (config: BackupConfig): void => {
  const file = getConfigFile();
  fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf8');
};

// Detect database provider
export const getDatabaseProvider = (): 'mysql' | 'sqlite' => {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('mysql:') || dbUrl.startsWith('mysql://')) {
    return 'mysql';
  }
  return 'sqlite';
};

// Get database size in bytes
export const getDatabaseSize = async (): Promise<number> => {
  const provider = getDatabaseProvider();
  if (provider === 'sqlite') {
    const dbPath = getSQLitePath();
    if (fs.existsSync(dbPath)) {
      return fs.statSync(dbPath).size;
    }
    return 0;
  } else {
    try {
      const prisma = await getPrismaClient();
      const result = await prisma.$queryRawUnsafe<any[]>(
        `SELECT sum(data_length + index_length) as size_bytes 
         FROM information_schema.TABLES 
         WHERE table_schema = DATABASE()`
      );
      return Number(result[0]?.size_bytes || 0);
    } catch (e) {
      console.error('Error fetching MySQL DB size:', e);
      return 0;
    }
  }
};

// Create a database backup
export const backupDatabase = async (isAuto = false): Promise<string> => {
  const provider = getDatabaseProvider();
  const backupDir = getBackupDir();
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const type = isAuto ? 'auto' : 'manual';
  
  if (provider === 'sqlite') {
    const filename = `backup-${type}-${timestamp}.sqlite`;
    const destPath = path.join(backupDir, filename);
    const srcPath = getSQLitePath();

    if (!fs.existsSync(srcPath)) {
      throw new Error(`SQLite database file not found at path: ${srcPath}`);
    }

    fs.copyFileSync(srcPath, destPath);
    
    // Auto-clean old backups
    await cleanOldBackups();
    return filename;
  } else {
    // MySQL backup
    const filename = `backup-${type}-${timestamp}.sql`;
    const destPath = path.join(backupDir, filename);
    const prisma = await getPrismaClient();

    // Fetch all tables
    const tablesResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`
    );
    const tables = tablesResult.map(t => Object.values(t)[0] as string);

    let sqlDump = `-- NEXAB2B MySQL Database Backup\n`;
    sqlDump += `-- Date: ${new Date().toISOString()}\n`;
    sqlDump += `-- Type: ${isAuto ? 'Auto Scheduled' : 'Manual'}\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tables) {
      // 1. Table schema (CREATE TABLE)
      const createTableResult = await prisma.$queryRawUnsafe<any[]>(
        `SHOW CREATE TABLE \`${table}\``
      );
      const createTableSql = createTableResult[0]['Create Table'] as string;
      
      sqlDump += `-- Table structure for \`${table}\`\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      sqlDump += `${createTableSql};\n\n`;

      // 2. Table records
      sqlDump += `-- Dumping data for table \`${table}\`\n`;
      let offset = 0;
      const limit = 1000;
      
      while (true) {
        const rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM \`${table}\` LIMIT ${limit} OFFSET ${offset}`
        );
        if (rows.length === 0) break;

        for (const row of rows) {
          const keys = Object.keys(row);
          const values = keys.map(key => {
            const val = row[key];
            if (val === null) return 'NULL';
            if (typeof val === 'boolean') return val ? '1' : '0';
            if (typeof val === 'number') return String(val);
            if (val instanceof Date) {
              return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            if (typeof val === 'object') {
              return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
            }
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
          });

          sqlDump += `INSERT INTO \`${table}\` (\`${keys.join('\`, \`')}\`) VALUES (${values.join(', ')});\n`;
        }

        if (rows.length < limit) break;
        offset += limit;
      }
      sqlDump += `\n`;
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    fs.writeFileSync(destPath, sqlDump, 'utf8');

    // Auto-clean old backups
    await cleanOldBackups();
    return filename;
  }
};

// Custom SQL statement splitter that handles quotes & escapes
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escaped = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      current += char;
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const stmt = current.trim();
      if (stmt) {
        statements.push(stmt);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const lastStmt = current.trim();
  if (lastStmt) {
    statements.push(lastStmt);
  }

  return statements;
}

// Restore database from a backup file
export const restoreDatabase = async (filename: string): Promise<void> => {
  const provider = getDatabaseProvider();
  const backupDir = getBackupDir();
  const srcPath = path.join(backupDir, filename);

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Backup file not found: ${filename}`);
  }

  if (provider === 'sqlite') {
    const destPath = getSQLitePath();
    const prisma = await getPrismaClient();

    // Disconnect prisma connection pool to release any active file handles
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.warn('Failed to disconnect Prisma client during restore:', e);
    }

    // Delete WAL and SHM files to prevent SQLite from applying old transactional logs on top of the restored DB
    const walPath = `${destPath}-wal`;
    const shmPath = `${destPath}-shm`;
    try {
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch (e) {
      console.warn('Failed to delete SQLite WAL/SHM sidecar files:', e);
    }

    // Windows filesystem locks might take a brief moment to release, try writing with retries
    let restored = false;
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        fs.copyFileSync(srcPath, destPath);
        restored = true;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Restore database write attempt ${attempt} failed: ${err.message}. Retrying in 100ms...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (!restored) {
      throw new Error(`SQLite database restore failed (file locked by active processes): ${lastError?.message}`);
    }
  } else {
    // MySQL restore
    const sqlContent = fs.readFileSync(srcPath, 'utf8');
    const statements = splitSqlStatements(sqlContent);
    const prisma = await getPrismaClient();

    // Run statements sequentially
    for (const statement of statements) {
      const trimmed = statement.trim();
      // Skip comment lines
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
        continue;
      }
      
      try {
        await prisma.$executeRawUnsafe(trimmed);
      } catch (err: any) {
        console.error(`Error executing SQL statement during restore:`, trimmed.substring(0, 100));
        throw new Error(`SQL Restore failed: ${err.message}`);
      }
    }
  }
};

// Clean old backups based on retention policy
export const cleanOldBackups = async (): Promise<number> => {
  const config = getBackupConfig();
  const backupDir = getBackupDir();
  const files = fs.readdirSync(backupDir);
  
  let deletedCount = 0;
  const now = Date.now();
  const maxAgeMs = config.retentionDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    // Skip backup-config.json
    if (file === 'backup-config.json') continue;
    
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const fileAgeMs = now - stats.mtimeMs;

    if (fileAgeMs > maxAgeMs) {
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted old backup file due to retention policy: ${file}`);
      } catch (e) {
        console.error(`Failed to delete old backup file ${file}:`, e);
      }
    }
  }

  return deletedCount;
};
