import { InlineKeyboard } from 'grammy';

export function mainMenu() {
  return new InlineKeyboard()
    .text('🏴‍☠️ Статус', 'status')
    .text('⛏️ Добыча', 'mine')
    .row()
    .text('⚔️ Налёт', 'raid')
    .text('⛵ Улучшить корабль', 'upgrade')
    .row()
    .text('📜 Помощь', 'help');
}