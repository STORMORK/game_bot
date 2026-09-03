import fs from 'node:fs';
import path from 'node:path';

type StorageData = Record<string, any>;

const FILE = path.resolve(process.cwd(), 'storage.json');

function readAll(): StorageData {
  if (!fs.existsSync(FILE)) return {};
  const raw = fs.readFileSync(FILE, 'utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as StorageData;
  } catch {
    return {};
  }
}

function writeAll(data: StorageData) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export class Storage {
  private key(userId: number) {
    return String(userId);
  }

  getUser<T>(userId: number): T | null {
    const data = readAll();
    return (data[this.key(userId)] ?? null) as T | null;
  }

  setUser(userId: number, value: any) {
    const data = readAll();
    data[this.key(userId)] = value;
    writeAll(data);
  }
}
