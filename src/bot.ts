import { Telegraf, Context } from 'telegraf';
import { config } from './config';
import { Storage } from './storage';
import { addXp, battleRaid, buyEnergy, createNewUser, dailyBonus, getNextClass, UserState } from './game';
import { mainMenu, shopMenu } from './keyboards';

type MyContext = Context & {
  state: {
    user?: UserState;
  };
};

const bot = new Telegraf<MyContext>(config.botToken);
const storage = new Storage();

function formatProfile(u: UserState) {
  return [
    `🏴‍☠️ *Пират:* ${u.name ? u.name : 'Безымянный'}`,
    `💎 *Класс:* ${u.class}`,
    `⭐ *Уровень:* ${u.level} (XP: ${u.xp}/${u.level <= 0 ? 0 : 100 + (u.level - 1) * 30}*)`,
    `🪙 *Монеты:* ${u.coins}`,
    `⚡ *Энергия:* ${u.energy}/${u.energyMax}`,
    `🛡️ *Атака:* ${u.attack} | *Защита:* ${u.defense}`,
    `🏆 *Побед:* ${u.wins}`,
  ].join('\n');
}

function ensureUser(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) return null;

  let u = storage.getUser<UserState>(userId);
  if (!u) {
    u = createNewUser(userId, ctx.from?.first_name);
    storage.setUser(userId, u);
  }
  return u;
}

bot.start(async (ctx) => {
  const u = ensureUser(ctx);
  if (!u) return;

  // если вдруг класс не соответствует уровню (после обновлений)
  const newClass = getNextClass(u.level);
  if (newClass !== u.class) {
    u.class = newClass;
  }
  storage.setUser(u.userId, u);

  await ctx.reply(`Добро пожаловать, капитан!`);
  await ctx.reply(formatProfile(u), { parse_mode: 'Markdown', ...mainMenu() });
});

bot.command('profile', async (ctx) => {
  const u = ensureUser(ctx);
  if (!u) return;
  storage.setUser(u.userId, u);
  await ctx.reply(formatProfile(u), { parse_mode: 'Markdown', ...mainMenu() });
});

bot.action('raid', async (ctx) => {
  const u = ensureUser(ctx);
  if (!u) return;

  const res = battleRaid(u);
  storage.setUser(u.userId, u);

  if (!res.ok) {
    await ctx.answerCbQuery(res.reason);
    return;
  }

  const r = res.result!;
  if (r.outcome === 'win') {
    await ctx.answerCbQuery('Победа! 🎉');
    await ctx.editMessageText(
      `⚔️ *Налёт завершён: ПОБЕДА*\n` +
      `Урон: ${r.damageDealt} | Принято урона: ${r.damageTaken}\n` +
      `Награда: +${r.rewardCoins} монет, +${r.rewardXp} XP`,
      { parse_mode: 'Markdown', ...mainMenu() }
    );
  } else {
    await ctx.answerCbQuery('Похоже, не ваш день…');
    await ctx.editMessageText(
      `⚔️ *Налёт завершён: ПОРАЖЕНИЕ*\n` +
      `Урон: ${r.damageDealt} | Принято урона: ${r.damageTaken}\n` +
      `Утешительный приз: +${r.rewardXp} XP`,
      { parse_mode: 'Markdown', ...mainMenu() }
    );
  }
});

bot.action('daily', async (ctx) => {
  const u = ensureUser(ctx);
  if (!u) return;

  const res = dailyBonus(u);
  storage.setUser(u.userId, u);

  if (!res.ok) {
    await ctx.answerCbQuery(res.reason || 'Нельзя сейчас');
    return;
  }

  await ctx.answerCbQuery('Бонус получен!');
  await ctx.editMessageText(
    `🗓️ *Ежедневный бонус*\n` +
    `+${res.bonusCoins} монет, +${res.bonusEnergy} энергии\n\n` +
    formatProfile(u),
    { parse_mode: 'Markdown', ...mainMenu() }
  );
});

bot.action('buy_energy', async (ctx) => {
  const u = ensureUser(ctx);
  if (!u) return;

  const res = buyEnergy(u);
  storage.setUser(u.userId, u);

  if (!res.ok) {
    await ctx.answerCbQuery(res.reason || 'Не получилось');
    return;
  }

  await ctx.answerCbQuery('Энергия пополнена!');
  await ctx.editMessageText(
    `🛒 *Магазин: Подзарядка*\n\n${formatProfile(u)}`,
    { parse_mode: 'Markdown', ...mainMenu() }
  );
});

bot.action('back_main', async (ctx) => {
  const u = ensureUser(ctx);
  if (!u) return;
  await ctx.answerCbQuery();
  await ctx.editMessageText(formatProfile(u), { parse_mode: 'Markdown', ...mainMenu() });
});

export { bot };
