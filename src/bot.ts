import { Bot, Context, session } from 'grammy';
import { BOT_TOKEN } from './config';
import { 
  mainMenu, attackMenu, upgradeMenu, petMenu, settingsMenu, 
  avatarSelection, playerList 
} from './keyboards';
import { 
  getPlayer, createPlayer, getAllPlayers, getOnlinePlayers, updatePlayer 
} from './database';
import { 
  attackPlayer, mineResources, upgradeStat, feedPet, 
  getPlayerState, getTopPlayers 
} from './gameLogic';
import { AVATARS } from './config';

const bot = new Bot(BOT_TOKEN);

// Сессия для временного хранения
bot.use(session({
  initial: () => ({ 
    action: '', 
    targetId: 0,
    page: 0 
  })
}));

// Приветствие + регистрация
bot.command('start', async (ctx) => {
  const userId = ctx.from.id;
  let player = getPlayer(userId);
  
  if (!player) {
    await ctx.reply(
      `🏴‍☠️ **Добро пожаловать в игру ПИРАТЫ!**\n\n`
      + `Придумай себе пиратское имя (никнейм):`
    );
    // Ждем ответ
    const response = await ctx.reply('Напиши свой ник (от 3 до 20 символов):');
    // Дальше обрабатываем в текстовом сообщении
    return;
  }
  
  await ctx.reply(
    `⚓ С возвращением, ${player.avatar} **${player.nickname}**!\n`
    + `Твой уровень: ${player.level}\n`
    + `Побед: ${player.wins} | Поражений: ${player.losses}`,
    { reply_markup: mainMenu() }
  );
});

// Обработка ника (регистрация)
bot.on('message:text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  
  if (text.length < 3 || text.length > 20) {
    await ctx.reply('❌ Ник должен быть от 3 до 20 символов. Попробуй снова:');
    return;
  }
  
  const player = createPlayer(userId, text);
  await ctx.reply(
    `✅ Отлично! Ты зарегистрирован как **${player.avatar} ${player.nickname}**\n\n`
    + `⚓ Твой корабль готов к плаванию!\n`
    + `Используй кнопки для управления.`,
    { reply_markup: mainMenu() }
  );
});

// Callback-обработчики
bot.callbackQuery('profile', async (ctx) => {
  const player = getPlayer(ctx.from.id);
  if (!player) return ctx.reply('❌ Ты не зарегистрирован! /start');
  
  const profile = 
    `🏴‍☠️ **ПРОФИЛЬ**\n\n`
    + `${player.avatar} **${player.nickname}**\n`
    + `Уровень: ${player.level} | Опыт: ${player.exp}/${player.maxExp}\n`
    + `❤️ HP: ${player.health}/${player.maxHealth}\n\n`
    + `📊 **Статы:**\n`
    + `💪 Сила: ${player.stats.strength}\n`
    + `🛡️ Защита: ${player.stats.defense}\n`
    + `💨 Ловкость: ${player.stats.agility}\n`
    + `🎯 Мастерство: ${player.stats.mastery}\n`
    + `❤️ Живучесть: ${player.stats.vitality}\n\n`
    + `💰 Ресурсы:\n`
    + `🪙 Золото: ${player.resources.gold}\n`
    + `🪵 Древесина: ${player.resources.wood}\n`
    + `🍾 Ром: ${player.resources.rum}\n`
    + `💎 Дублоны: ${player.resources.doubloons}\n\n`
    + `🏆 Побед: ${player.wins} | Поражений: ${player.losses}\n`
    + `🦜 Попугай: ${player.pet.name} (ур.${player.pet.level}) +${player.pet.bonus}% бонус`;
  
  await ctx.editMessageText(profile, { 
    parse_mode: 'Markdown', 
    reply_markup: mainMenu() 
  });
  await ctx.answerCallbackQuery();
});

// Атака - меню выбора
bot.callbackQuery('attack_menu', async (ctx) => {
  const online = getOnlinePlayers();
  const players = online.map(p => ({
    userId: p.userId,
    nickname: p.nickname,
    avatar: p.avatar
  }));
  
  if (players.length === 0) {
    await ctx.editMessageText('🌊 В море никого нет... Попробуй позже.', {
      reply_markup: attackMenu()
    });
    return;
  }
  
  await ctx.editMessageText('⚔️ **Выбери противника:**', {
    parse_mode: 'Markdown',
    reply_markup: playerList(players)
  });
  await ctx.answerCallbackQuery();
});

// Атака на конкретного игрока
bot.callbackQuery(/attack_(\d+)/, async (ctx) => {
  const targetId = parseInt(ctx.match[1]);
  const result = attackPlayer(ctx.from.id, targetId);
  await ctx.editMessageText(result, {
    parse_mode: 'Markdown',
    reply_markup: mainMenu()
  });
  await ctx.answerCallbackQuery();
});

// Добыча
bot.callbackQuery('mine', async (ctx) => {
  const result = mineResources(ctx.from.id);
  await ctx.editMessageText(result, {
    parse_mode: 'Markdown',
    reply_markup: mainMenu()
  });
  await ctx.answerCallbackQuery();
});

// Меню прокачки
bot.callbackQuery('upgrade_menu', async (ctx) => {
  await ctx.editMessageText(
    `⬆️ **Прокачка статов**\n`
    + `Стоимость: 50 + уровень*10 дублонов\n`
    + `💎 Твои дублоны: ${getPlayer(ctx.from.id)?.resources.doubloons || 0}`,
    { parse_mode: 'Markdown', reply_markup: upgradeMenu() }
  );
  await ctx.answerCallbackQuery();
});

// Прокачка статов
bot.callbackQuery(/upgrade_(\w+)/, async (ctx) => {
  const stat = ctx.match[1] as keyof Player['stats'];
  const result = upgradeStat(ctx.from.id, stat);
  await ctx.editMessageText(result, {
    parse_mode: 'Markdown',
    reply_markup: upgradeMenu()
  });
  await ctx.answerCallbackQuery();
});

// Попугай
bot.callbackQuery('pet_menu', async (ctx) => {
  await ctx.editMessageText(
    `🦜 **Твой попугай**\n`
    + `Имя: ${getPlayer(ctx.from.id)?.pet.name}\n`
    + `Уровень: ${getPlayer(ctx.from.id)?.pet.level}\n`
    + `Бонус: +${getPlayer(ctx.from.id)?.pet.bonus}% к добыче\n\n`
    + `🍗 Кормление: 5 рома = +1 уровень`,
    { parse_mode: 'Markdown', reply_markup: petMenu() }
  );
  await ctx.answerCallbackQuery();
});

bot.callbackQuery('feed_pet', async (ctx) => {
  const result = feedPet(ctx.from.id);
  await ctx.editMessageText(result, {
    parse_mode: 'Markdown',
    reply_markup: petMenu()
  });
  await ctx.answerCallbackQuery();
});

// Медальоны
bot.callbackQuery('medals', async (ctx) => {
  const player = getPlayer(ctx.from.id);
  if (!player) return;
  
  const medals = player.medalion.length > 0 
    ? player.medalion.join('\n') 
    : '❌ Пока нет медальонов';
  
  await ctx.editMessageText(
    `🏆 **Твои медальоны:**\n\n${medals}`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
  await ctx.answerCallbackQuery();
});

// Топ игроков
bot.callbackQuery('top', async (ctx) => {
  const players = getAllPlayers()
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);
  
  let topList = '📊 **ТОП 10 ПИРАТОВ:**\n\n';
  players.forEach((p, i) => {
    topList += `${i+1}. ${p.avatar} **${p.nickname}** — ${p.wins} побед (ур.${p.level})\n`;
  });
  
  await ctx.editMessageText(topList, {
    parse_mode: 'Markdown',
    reply_markup: mainMenu()
  });
  await ctx.answerCallbackQuery();
});

// Настройки
bot.callbackQuery('settings', async (ctx) => {
  await ctx.editMessageText(
    `⚙️ **Настройки**\n\n`
    + `👤 Ник: ${getPlayer(ctx.from.id)?.nickname}\n`
    + `🖼️ Аватар: ${getPlayer(ctx.from.id)?.avatar}`,
    { parse_mode: 'Markdown', reply_markup: settingsMenu() }
  );
  await ctx.answerCallbackQuery();
});

// Смена аватара
bot.callbackQuery('change_avatar', async (ctx) => {
  await ctx.editMessageText(
    '🖼️ **Выбери новый аватар:**',
    { parse_mode: 'Markdown', reply_markup: avatarSelection() }
  );
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/avatar_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  const avatar = AVATARS[index];
  updatePlayer(ctx.from.id, { avatar });
  await ctx.editMessageText(
    `✅ Аватар изменен на ${avatar}`,
    { reply_markup: settingsMenu() }
  );
  await ctx.answerCallbackQuery();
});

// Смена ника
bot.callbackQuery('change_nick', async (ctx) => {
  await ctx.editMessageText(
    '✏️ Напиши новый ник (от 3 до 20 символов):',
    { reply_markup: settingsMenu() }
  );
  await ctx.answerCallbackQuery();
});

// Назад в главное меню
bot.callbackQuery('back_main', async (ctx) => {
  await ctx.editMessageText(
    `🏴‍☠️ **Главное меню**`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
  await ctx.answerCallbackQuery();
});

// Обновление списка игроков
bot.callbackQuery('refresh_players', async (ctx) => {
  await bot.api.callbackQuery.answer(ctx.callbackQuery.id);
  await ctx.editMessageText('🔄 Список обновлен!', {
    reply_markup: attackMenu()
  });
});

// Авто-офлайн через 5 минут
setInterval(() => {
  const players = getAllPlayers();
  const now = Date.now();
  players.forEach(p => {
    if (now - p.lastSeen > 300000) { // 5 минут
      updatePlayer(p.userId, { isOnline: false });
    }
  });
}, 60000);

export { bot };