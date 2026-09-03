import fs from 'fs';
import { STORAGE_PATH } from './config';

export interface PlayerData {
  userId: number;
  resources: {
    gold: number;
    wood: number;
    rum: number;
    crew: number;
  };
  shipLevel: number;
  lastRaid: number; // timestamp
  wins: number;
}

export function loadData(): Record<number, PlayerData> {
  try {
    const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveData(data: Record<number, PlayerData>) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
}

export function getPlayer(userId: number): PlayerData {
  const data = loadData();
  if (!data[userId]) {
    data[userId] = {
      userId,
      resources: { gold: 100, wood: 50, rum: 20, crew: 10 },
      shipLevel: 1,
      lastRaid: 0,
      wins: 0,
    };
    saveData(data);
  }
  return data[userId];
}

export function updatePlayer(userId: number, updates: Partial<PlayerData>) {
  const data = loadData();
  if (!data[userId]) return;
  data[userId] = { ...data[userId], ...updates };
  saveData(data);
}