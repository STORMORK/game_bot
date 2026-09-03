import dotenv from 'dotenv';
dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
export const STORAGE_PATH = './data.json';

export const ATTACK_COOLDOWN = 30 * 1000; // 30 секунд
export const XP_PER_LEVEL = 100;

export const AVATARS = [
  '🏴‍☠️', '⚓', '🦜', '🗡️', '🏹', 
  '💀', '👑', '🐙', '🌊', '🔥'
];

export const MEDALIONS = {
  FIRST_BLOOD: '🩸 Первая кровь',
  PIRATE_LORD: '👑 Лорд пиратов',
  INVINCIBLE: '🛡️ Непобедимый',
  RICH_MAN: '💰 Богач',
  PET_LOVER: '🦜 Любитель попугаев'
};