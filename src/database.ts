import fs from 'fs';
import { STORAGE_PATH, AVATARS } from './config';
import { Player } from './models';

export function loadData(): Record<number, Player> {
  try {
    const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveData(data: Record<number, Player>) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
}

export function getPlayer(userId: number): Player | null {
  const data = loadData();
  return data[userId] || null;
}

export function createPlayer(userId: number, nickname: string): Player {
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const player: Player = {
    userId,
    nickname,
    avatar,
    stats: {
      strength: 5,
      defense: 5,
      agility: 5,
      mastery: 5,
      vitality: 5,
    },
    resources: {
      gold: 100,
      wood: 50,
      rum: 20,
      doubloons: 0,
    },
    level: 1,
    exp: 0,
    maxExp: 100,
    health: 100,
    maxHealth: 100,
    shipLevel: 1,
    wins: 0,
    losses: 0,
    medalions: [],
    pet: {
      name: 'Коко',
      level: 1,
      bonus: 5,
    },
    lastAttack: 0,
    isOnline: true,
    lastSeen: Date.now(),
  };
  const data = loadData();
  data[userId] = player;
  saveData(data);
  return player;
}

export function updatePlayer(userId: number, updates: Partial<Player>) {
  const data = loadData();
  if (!data[userId]) return;
  data[userId] = { ...data[userId], ...updates };
  saveData(data);
}

export function getAllPlayers(): Player[] {
  const data = loadData();
  return Object.values(data);
}

export function getOnlinePlayers(): Player[] {
  const data = loadData();
  const now = Date.now();
  return Object.values(data).filter(p => p.isOnline && (now - p.lastSeen < 60000));
}