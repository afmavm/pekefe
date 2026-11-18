import fs from 'fs';
import path from 'path';

const LOCAL_ACCOUNTS_PATH = path.join(process.cwd(), 'data', 'current_accounts_db.json');

function ensureAccountsFileExists() {
  try {
    const dir = path.dirname(LOCAL_ACCOUNTS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_ACCOUNTS_PATH)) {
      fs.writeFileSync(LOCAL_ACCOUNTS_PATH, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring local current accounts DB file:', err);
  }
}

export function readLocalAccounts(): any[] {
  try {
    ensureAccountsFileExists();
    if (fs.existsSync(LOCAL_ACCOUNTS_PATH)) {
      const raw = fs.readFileSync(LOCAL_ACCOUNTS_PATH, 'utf-8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error('Error reading local current accounts DB:', err);
  }
  return [];
}

export function saveLocalAccount(account: any): any {
  try {
    ensureAccountsFileExists();
    const accounts = readLocalAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id || (account.cariKod && a.cariKod === account.cariKod));
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...account, updatedAt: new Date().toISOString() };
    } else {
      accounts.unshift({ ...account, createdAt: account.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    fs.writeFileSync(LOCAL_ACCOUNTS_PATH, JSON.stringify(accounts, null, 2), 'utf-8');
    return account;
  } catch (err) {
    console.error('Error saving local current account:', err);
    return account;
  }
}

export function updateLocalAccount(id: string, updates: any): any {
  try {
    ensureAccountsFileExists();
    const accounts = readLocalAccounts();
    const index = accounts.findIndex(a => a.id === id || a.cariKod === id);
    if (index >= 0) {
      accounts[index] = { ...accounts[index], ...updates, updatedAt: new Date().toISOString() };
      fs.writeFileSync(LOCAL_ACCOUNTS_PATH, JSON.stringify(accounts, null, 2), 'utf-8');
      return accounts[index];
    }
    const newAcc = { id, ...updates, updatedAt: new Date().toISOString() };
    accounts.unshift(newAcc);
    fs.writeFileSync(LOCAL_ACCOUNTS_PATH, JSON.stringify(accounts, null, 2), 'utf-8');
    return newAcc;
  } catch (err) {
    console.error('Error updating local current account:', err);
    return { id, ...updates };
  }
}

export function deleteLocalAccount(id: string): boolean {
  try {
    ensureAccountsFileExists();
    const accounts = readLocalAccounts();
    const filtered = accounts.filter(a => a.id !== id && a.cariKod !== id);
    fs.writeFileSync(LOCAL_ACCOUNTS_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error deleting local current account:', err);
    return false;
  }
}
