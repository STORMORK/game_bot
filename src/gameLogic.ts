import { Player } from './models';
import { getPlayer, updatePlayer, getAllPlayers, getOnlinePlayers } from './database';
import { XP_PER_LEVEL, ATTACK_COOLDOWN, MEDALIONS } from './config';

// Расчет урона
function calculateDamage(attacker: Player, defender: Player): number {
  const base = 10 + attacker.stats.strength * 2;
  const crit = Math.random() < 0.1 + attacker.stats.mastery * 0.02;
  const critMultiplier = crit ? 2 : 1;
  const defenseReduction = 1 - (defender.stats.defense / 100);
  const dodge = Math.random() < defender.stats.agility * 0.01;
  
  if (dodge) return 0; // Уклонение
  
  let damage = base * critMultiplier * defenseReduction;
  damage = Math.max(1, Math.floor(damage));
  return damage;
}

// PvP атака
export function attackPlayer(attackerId: number, targetId: number): string {
  const attacker = getPlayer(attackerId);
  const target = getPlayer(targetId);
  
  if (!attacker || !target) return '❌ Игрок не найден';
  if (attackerId === targetId) return '❌ Нельзя атаковать себя';
  if (!target.isOnline) return '❌ Игрок не в сети';
  
  const now = Date.now();
  if (now - attacker.lastAttack < ATTACK_COOLDOWN) {
    const left = Math.ceil((ATTACK_COOLDOWN - (now - attacker.lastAttack)) / 1000);
    return `⏳ Подожди ${left} секунд перед новой атакой`;
  }
  
  // Бой
  const damage = calculateDamage(attacker, target);
  target.health -= damage;
  
  let result = '';
  let attackerWon = false;
  
  if (target.health <= 0) {
    // Победа атакующего
    target.health = target.maxHealth;
    attackerWon = true;
    attacker.wins += 1;
    target.losses += 1;
    
    // Грабеж ресурсов (20% от ресурсов цели)
    const stolenGold = Math.floor(target.resources.gold * 0.2);
    const stolenWood = Math.floor(target.resources.wood * 0.2);
    const stolenRum = Math.floor(target.resources.rum * 0.2);
    
    attacker.resources.gold += stolenGold;
    attacker.resources.wood += stolenWood;
    attacker.resources.rum += stolenRum;
    
    target.resources.gold -= stolenGold;
    target.resources.wood -= stolenWood;
    target.resources.rum -= stolenRum;
    
    // Опыт
    const xpGain = 20 + attacker.level * 5;
    attacker.exp += xpGain;
    
    // Проверка медальонов
    checkMedalions(attacker);
    
    result = `⚔️ **ПОБЕДА!**\n`
      + `🗡️ Нанесено урона: ${damage}\n`
      + `💰 Ограблено: ${stolenGold} золота, ${stolenWood} дерева, ${stolenRum} рома\n`
      + `⭐ Опыт: +${xpGain}`;
      
    // Левелап
    if (attacker.exp >= attacker.maxExp) {
      levelUp(attacker);
      result += `\n🎉 **УРОВЕНЬ ПОВЫШЕН!** Теперь ${attacker.level} уровень!`;
    }
  } else {
    // Бой продолжается
    result = `⚔️ **АТАКА!**\n🗡️ Урон: ${damage}\n❤️ У противника осталось: ${target.health}/${target.maxHealth} HP`;
    
    // Ответный удар (только если цель жива)
    if (target.health > 0 && Math.random() < 0.3) {
      const counterDamage = calculateDamage(target, attacker);
      attacker.health -= counterDamage;
      result += `\n🔄 Контратака! Вы получили ${counterDamage} урона`;
      
      if (attacker.health <= 0) {
        attacker.health = attacker.maxHealth;
        attacker.losses += 1;
        result += `\n💀 Вы проиграли бой!`;
      }
    }
  }
  
  // Обновление
  updatePlayer(attackerId, { 
    ...attacker, 
    lastAttack: now,
    isOnline: true,
    lastSeen: now 
  });
  updatePlayer(targetId, { 
    ...target, 
    isOnline: true,
    lastSeen: now 
  });
  
  return result;
}

// Повышение уровня
function levelUp(player: Player) {
  player.level += 1;
  player.exp = 0;
  player.maxExp = XP_PER_LEVEL * player.level;
  player.maxHealth = 100 + player.level * 10;
  player.health = player.maxHealth;
  
  // +1 к статам за уровень
  const statPoints = 3;
  player.stats.strength += 1;
  player.stats.defense += 1;
  player.stats.agility += 1;
}

// Прокачка статов (за дублоны)
export function upgradeStat(playerId: number, stat: keyof Player['stats']): string {
  const player = getPlayer(playerId);
  if (!player) return '❌ Игрок не найден';
  
  const cost = 50 + player.stats[stat] * 10;
  if (player.resources.doubloons < cost) {
    return `❌ Не хватает дублонов. Нужно: ${cost}`;
  }
  
  player.resources.doubloons -= cost;
  player.stats[stat] += 1;
  updatePlayer(playerId, { stats: player.stats, resources: player.resources });
  return `✅ ${stat} повышен до ${player.stats[stat]}!`;
}

// Проверка медальонов
function checkMedalions(player: Player) {
  const medals = player.medalion;
  
  if (player.wins >= 1 && !medals.includes(MEDALIONS.FIRST_BLOOD)) {
    medals.push(MEDALIONS.FIRST_BLOOD);
  }
  if (player.wins >= 10 && !medals.includes(MEDALIONS.PIRATE_LORD)) {
    medals.push(MEDALIONS.PIRATE_LORD);
  }
  if (player.wins >= 50 && !medals.includes(MEDALIONS.INVINCIBLE)) {
    medals.push(MEDALIONS.INVINCIBLE);
  }
  if (player.resources.gold >= 1000 && !medals.includes(MEDALIONS.RICH_MAN)) {
    medals.push(MEDALIONS.RICH_MAN);
  }
  if (player.pet.level >= 5 && !medals.includes(MEDALIONS.PET_LOVER)) {
    medals.push(MEDALIONS.PET_LOVER);
  }
  
  updatePlayer(player.userId, { medalion: medals });
}

// Добыча ресурсов
export function mineResources(playerId: number): string {
  const player = getPlayer(playerId);
  if (!player) return '❌ Игрок не найден';
  
  const base = 15 + player.level * 3;
  const petBonus = 1 + player.pet.bonus / 100;
  const total = Math.floor(base * petBonus);
  
  player.resources.gold += Math.floor(total * 0.5);
  player.resources.wood += Math.floor(total * 0.3);
  player.resources.rum += Math.floor(total * 0.2);
  player.exp += 5;
  
  // Шанс найти дублоны
  if (Math.random() < 0.1) {
    player.resources.doubloons += 1;
  }
  
  updatePlayer(playerId, { 
    resources: player.resources, 
    exp: player.exp,
    lastSeen: Date.now(),
    isOnline: true 
  });
  
  if (player.exp >= player.maxExp) {
    levelUp(player);
    updatePlayer(playerId, { 
      level: player.level, 
      exp: player.exp, 
      maxExp: player.maxExp,
      maxHealth: player.maxHealth,
      health: player.health,
      stats: player.stats
    });
    return `⛏️ Добыто: ${total} ресурсов!\n🎉 УРОВЕНЬ ПОВЫШЕН! Теперь ${player.level} уровень!`;
  }
  
  return `⛏️ Добыто: ${total} ресурсов! (опыт +5)`;
}

// Кормление попугая
export function feedPet(playerId: number): string {
  const player = getPlayer(playerId);
  if (!player) return '❌ Игрок не найден';
  
  if (player.resources.rum < 5) {
    return '❌ Нет рома для попугая! Нужно: 5 рома';
  }
  
  player.resources.rum -= 5;
  player.pet.level += 1;
  player.pet.bonus = Math.min(50, player.pet.bonus + 2);
  
  updatePlayer(playerId, { 
    resources: player.resources, 
    pet: player.pet 
  });
  
  return `🦜 Попугай ${player.pet.name} накормлен! Уровень: ${player.pet.level}, бонус: ${player.pet.bonus}%`;
}