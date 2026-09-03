import { Markup } from 'telegraf';

export const mainMenu = () =>
  Markup.inlineKeyboard([
    Markup.button.callback('⚔️ Налёт на лагерь', 'raid'),
    Markup.button.callback('🗓️ Ежедневный бонус', 'daily'),
  ], { columns: 1 }).resize();

export const shopMenu = () =>
  Markup.inlineKeyboard([
    Markup.button.callback('🛒 Подзарядить энергию', 'buy_energy'),
    Markup.button.callback('◀️ Назад', 'back_main'),
  ], { columns: 1 }).resize();
