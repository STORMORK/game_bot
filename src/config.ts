import dotenv from 'dotenv';
dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
export const STORAGE_PATH = './data.json'; // Файл для сохранения

// Игровые константы
export const INITIAL_RESOURCES = {
  gold: 100,
  wood: 50,
  rum: 20,
  crew: 10,
};

export const SHIP_UPGRADE_COST = {
  wood: 100,
  gold: 50,
};

export const RAID_COOLDOWN = 60 * 1000; // 1 минута в мс