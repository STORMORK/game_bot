import { Bot, Context, InlineKeyboard } from 'grammy';
import { BOT_TOKEN } from './config';
import { mainMenu } from './keyboards';
import { getPlayerState, mineResources, raid, upgradeShip, getStatus } from './game';

const bot = new Bot(BOT_TOKEN);

// Старт
bot.command('start', async (ctx) => {
  const msg = `🏴‍☠️ Добро пожаловать, пират!

Ты — капитан нового корабля. Добывай ресурсы, совершай налёты, улучшай судно и становись легендой!

Используй кнопки ниже для управления.`;
  await ctx.reply(msg, { reply_markup: mainMenu() });
});

// Обработка callback-запросов
bot.callbackQuery('status', async (ctx) => {
  const status = getStatus(ctx.from.id);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(status, { parse_mode: 'Markdown', reply_markup: mainMenu() });
});

bot.callbackQuery('mine', async (ctx) => {
  const result = mineResources(ctx.from.id);
  await ctx.answerCallbackQuery(result);
  const status = getStatus(ctx.from.id);
  await ctx.editMessageText(status + '\n\n' + result, { parse_mode: 'Markdown', reply_markup: mainMenu() });
});

bot.callbackQuery('raid', async (ctx) => {
  const result = raid(ctx.from.id);
  await ctx.answerCallbackQuery(result);
  const status = getStatus(ctx.from.id);
  await ctx.editMessageText(status + '\n\n' + result, { parse_mode: 'Markdown', reply_markup: mainMenu() });
});

bot.callbackQuery('upgrade', async (ctx) => {
  const result = upgradeShip(ctx.from.id);
  await ctx.answerCallbackQuery(result);
  const status = getStatus(ctx.from.id);
  await ctx.editMessageText(status + '\n\n' + result, { parse_mode: 'Markdown', reply_markup: mainMenu() });
});

bot.callbackQuery('help', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `📜 **Помощь**:
- Добыча — приносит базовые ресурсы.
- Налёт — рискованное предприятие, может принести золото или убытки.
- Улучшение корабля — повышает шанс налёта и добычу.

Все данные сохраняются автоматически.
Разработано для @${ctx.me.username}`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

export { bot };