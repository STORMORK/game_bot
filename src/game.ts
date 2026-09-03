export type PirateClass = 'новичок' | 'корсар' | 'морской волк';

export type UserState = {
  userId: number;
  name?: string;

  // Прогресс
  level: number;
  xp: number;

  // Ресурсы
  coins: number;     // монеты
  energy: number;    // энергия на действия
  energyMax: number;

  // Бой
  class: PirateClass;
  attack: number;
  defense: number;

  // Квесты/серии
  wins: number;
  lastDailyAt?: number;
};

const BASES = {
  'новичок': { attack: 5, defense: 2, energyMax: 8 },
  'корсар': { attack: 9, defense: 4, energyMax: 12 },
  'морской волк': { attack: 13, defense: 6, energyMax: 16 },
} as const;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function createNewUser(userId: number, name?: string): UserState {
  const cls: PirateClass = 'новичок';
  const b = BASES[cls];
  return {
    userId,
    name,
    level: 1,
    xp: 0,
    coins: 0,
    energy: b.energyMax,
    energyMax: b.energyMax,
    class: cls,
    attack: b.attack,
    defense: b.defense,
    wins: 0,
  };
}

export function getNextClass(level: number): PirateClass {
  if (level >= 10) return 'морской волк';
  if (level >= 4) return 'корсар';
  return 'новичок';
}

export function xpNeededForLevel(level: number) {
  // формула: 1->100, 2->130, ...
  return Math.floor(100 + (level - 1) * 30);
}

export function addXp(state: UserState, amount: number): { leveledUp?: boolean } {
  state.xp += amount;
  let leveledUp = false;

  while (state.xp >= xpNeededForLevel(state.level)) {
    state.xp -= xpNeededForLevel(state.level);
    state.level += 1;
    leveledUp = true;

    // авто-настройка класса по уровню
    const newClass = getNextClass(state.level);
    if (newClass !== state.class) {
      state.class = newClass;
      const b = BASES[newClass];
      state.attack = b.attack + Math.floor(state.level * 0.6);
      state.defense = b.defense + Math.floor(state.level * 0.35);
      state.energyMax = b.energyMax;
    } else {
      state.attack += 2;
      state.defense += 1;
      state.energyMax = Math.max(state.energyMax, BASES[state.class].energyMax);
    }
  }

  // подлечим энергию до max после левелапов (по желанию)
  state.energy = clamp(state.energy, 0, state.energyMax);

  return { leveledUp };
}

export type BattleResult = {
  outcome: 'win' | 'lose' | 'skip';
  damageDealt: number;
  damageTaken: number;
  rewardCoins: number;
  rewardXp: number;
};

export function battleRaid(state: UserState): { ok: boolean; result?: BattleResult; reason?: string } {
  if (state.energy < 1) {
    return { ok: false, reason: 'Недостаточно энергии. Забери ежедневный бонус или подожди.' };
  }

  state.energy -= 1;

  // Пиратский лагерь противника: масштабируется по уровню игрока
  const enemyPower = state.level + Math.floor(Math.random() * 3);
  const enemyHp = 8 + enemyPower * 2;
  let enemyRemaining = enemyHp;

  const playerAtk = Math.max(1, state.attack + Math.floor(Math.random() * 4) - 1);
  const playerDef = Math.max(0, state.defense + Math.floor(Math.random() * 3) - 1);

  const rounds = 2 + Math.floor(Math.random() * 2);
  let damageDealt = 0;
  let damageTaken = 0;

  for (let i = 0; i < rounds; i++) {
    // урон игрока
    const dealt = Math.max(1, Math.floor(playerAtk * (0.7 + Math.random() * 0.6)) - Math.floor(enemyPower / 3));
    enemyRemaining -= dealt;
    damageDealt += dealt;

    if (enemyRemaining <= 0) break;

    // урон по игроку (чем лучше защита — тем меньше)
    const takenRaw = Math.floor((enemyPower + 3) * (0.7 + Math.random() * 0.7));
    const taken = Math.max(0, takenRaw - playerDef);
    damageTaken += taken;
  }

  if (enemyRemaining <= 0) {
    state.wins += 1;

    const rewardCoins = 10 + state.level * 6 + Math.floor(Math.random() * 10);
    const rewardXp = 18 + state.level * 7 + Math.floor(Math.random() * 10);

    addXp(state, rewardXp);
    state.coins += rewardCoins;

    return {
      ok: true,
      result: {
        outcome: 'win',
        damageDealt,
        damageTaken,
        rewardCoins,
        rewardXp,
      },
    };
  }

  return {
    ok: true,
    result: {
      outcome: 'lose',
      damageDealt,
      damageTaken,
      rewardCoins: 0,
      rewardXp: 5 + state.level,
    },
  };
}

export function dailyBonus(state: UserState): { ok: boolean; bonusCoins: number; bonusEnergy: number; reason?: string } {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (state.lastDailyAt && now - state.lastDailyAt < dayMs) {
    return { ok: false, bonusCoins: 0, bonusEnergy: 0, reason: 'Ежедневный бонус уже был. Попробуй позже.' };
  }

  const bonusCoins = 30 + state.level * 10;
  const bonusEnergy = Math.min(state.energyMax, 3 + Math.floor(state.level / 2));

  state.coins += bonusCoins;
  state.energy = clamp(state.energy + bonusEnergy, 0, state.energyMax);
  state.lastDailyAt = now;

  return { ok: true, bonusCoins, bonusEnergy };
}

export function buyEnergy(state: UserState): { ok: boolean; reason?: string } {
  const cost = 25 + state.level * 5;
  if (state.coins < cost) return { ok: false, reason: 'Не хватает монет.' };

  state.coins -= cost;
  state.energy = clamp(state.energy + 5, 0, state.energyMax);
  return { ok: true };
}
