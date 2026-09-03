import { getPlayer, updatePlayer } from './storage';
import { INITIAL_RESOURCES, RAID_COOLDOWN, SHIP_UPGRADE_COST } from './config';

// Проверка и восстановление ресурсов (если нужно)
export function getPlayerState(userId: number) {
  return getPlayer(userId);
}

// Добыча (каждые 5 минут автоматически, но здесь — ручной клик)
export function mineResources(userId: number): string {
  const player = getPlayer(userId);
  const base = 10 + player.shipLevel * 2;
  player.resources.gold += base;
  player.resources.wood += Math.floor(base * 0.7);
  player.resources.rum += Math.floor(base * 0.3);
  updatePlayer(userId, { resources: player.resources });
  return `⚓ Вы добыли: ${base} золота, ${Math.floor(base*0.7)} дерева, ${Math.floor(base*0.3)} рома.`;
}

// Налёт на другой корабль (PvE-симуляция)
export function raid(userId: number): string {
  const player = getPlayer(userId);
  const now = Date.now();
  if (now - player.lastRaid < RAID_COOLDOWN) {
    const left = Math.ceil((RAID_COOLDOWN - (now - player.lastRaid)) / 1000);
    return `⏳ Подожди ${left} секунд перед новым налётом.`;
  }
  
  // Шанс успеха: 60% + уровень корабля * 3%
  const chance = 0.6 + player.shipLevel * 0.03;
  const success = Math.random() < chance;
  
  let reward = 0;
  if (success) {
    reward = 20 + Math.floor(Math.random() * 30) + player.shipLevel * 5;
    player.resources.gold += reward;
    player.wins += 1;
    updatePlayer(userId, { 
      resources: player.resources, 
      wins: player.wins, 
      lastRaid: now 
    });
    return `🏴‍☠️ Успешный налёт! +${reward} золота. Победы: ${player.wins}`;
  } else {
    // Потеря части ресурсов при неудаче
    const loss = Math.floor(player.resources.gold * 0.1);
    player.resources.gold = Math.max(0, player.resources.gold - loss);
    updatePlayer(userId, { resources: player.resources, lastRaid: now });
    return `💥 Налёт провален! Потеряно ${loss} золота.`;
  }
}

// Улучшение корабля
export function upgradeShip(userId: number): string {
  const player = getPlayer(userId);
  if (player.resources.wood < SHIP_UPGRADE_COST.wood || player.resources.gold < SHIP_UPGRADE_COST.gold) {
    return `❌ Не хватает ресурсов. Нужно: ${SHIP_UPGRADE_COST.wood} дерева, ${SHIP_UPGRADE_COST.gold} золота.`;
  }
  player.resources.wood -= SHIP_UPGRADE_COST.wood;
  player.resources.gold -= SHIP_UPGRADE_COST.gold;
  player.shipLevel += 1;
  updatePlayer(userId, { 
    resources: player.resources, 
    shipLevel: player.shipLevel 
  });
  return `⛵ Корабль улучшен до уровня ${player.shipLevel}!`;
}

// Формирование статуса
export function getStatus(userId: number): string {
  const p = getPlayer(userId);
  return `
🏴‍☠️ **Капитан** (ID: ${userId})
⚓ Корабль: уровень ${p.shipLevel}
💰 Золото: ${p.resources.gold}
🪵 Древесина: ${p.resources.wood}
🍾 Ром: ${p.resources.rum}
👨‍✈️ Команда: ${p.resources.crew}
🏆 Побед: ${p.wins}
  `;
}