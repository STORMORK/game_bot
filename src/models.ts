export interface Player {
  userId: number;
  nickname: string;
  avatar: string; // эмодзи или ссылка
  stats: {
    strength: number;   // Сила (урон)
    defense: number;    // Защита (блок)
    agility: number;    // Ловкость (уклонение)
    mastery: number;    // Мастерство (критический удар)
    vitality: number;   // Живучесть (здоровье)
  };
  resources: {
    gold: number;
    wood: number;
    rum: number;
    doubloons: number; // премиум-валюта
  };
  level: number;
  exp: number;
  maxExp: number;
  health: number;
  maxHealth: number;
  shipLevel: number;
  wins: number;
  losses: number;
  medalions: string[]; // список достижений
  pet: {
    name: string;
    level: number;
    bonus: number; // % к статам
  };
  lastAttack: number; // timestamp для кулдауна
  isOnline: boolean;
  lastSeen: number;
}