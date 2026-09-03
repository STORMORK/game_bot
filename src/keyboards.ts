import { InlineKeyboard } from 'grammy';

export function mainMenu() {
  return new InlineKeyboard()
    .text('🏴‍☠️ Профиль', 'profile')
    .text('⛏️ Добыча', 'mine')
    .row()
    .text('⚔️ Атаковать', 'attack_menu')
    .text('🛡️ Защита', 'defense')
    .row()
    .text('⬆️ Прокачка', 'upgrade_menu')
    .text('🦜 Попугай', 'pet_menu')
    .row()
    .text('🏆 Медальоны', 'medals')
    .text('📊 Топ игроков', 'top')
    .row()
    .text('⚙️ Настройки', 'settings');
}

export function attackMenu() {
  return new InlineKeyboard()
    .text('⚔️ Атака на игрока', 'attack_player')
    .text('🔄 Обновить список', 'refresh_players')
    .row()
    .text('🔙 Назад', 'back_main');
}

export function upgradeMenu() {
  return new InlineKeyboard()
    .text('💪 Сила', 'upgrade_strength')
    .text('🛡️ Защита', 'upgrade_defense')
    .row()
    .text('💨 Ловкость', 'upgrade_agility')
    .text('🎯 Мастерство', 'upgrade_mastery')
    .row()
    .text('❤️ Живучесть', 'upgrade_vitality')
    .text('🔙 Назад', 'back_main');
}

export function petMenu() {
  return new InlineKeyboard()
    .text('🍗 Покормить (5 рома)', 'feed_pet')
    .text('📊 Статус попугая', 'pet_status')
    .row()
    .text('🔙 Назад', 'back_main');
}

export function settingsMenu() {
  return new InlineKeyboard()
    .text('👤 Сменить ник', 'change_nick')
    .text('🖼️ Сменить аватар', 'change_avatar')
    .row()
    .text('🔙 Назад', 'back_main');
}

export function avatarSelection() {
  const avatars = ['🏴‍☠️', '⚓', '🦜', '🗡️', '🏹', '💀', '👑', '🐙', '🌊', '🔥'];
  const keyboard = new InlineKeyboard();
  avatars.forEach((emoji, index) => {
    keyboard.text(emoji, `avatar_${index}`);
    if ((index + 1) % 5 === 0) keyboard.row();
  });
  keyboard.row().text('🔙 Назад', 'back_main');
  return keyboard;
}

export function playerList(players: { userId: number; nickname: string; avatar: string }[]) {
  const keyboard = new InlineKeyboard();
  players.forEach(p => {
    keyboard.text(`${p.avatar} ${p.nickname}`, `attack_${p.userId}`);
    keyboard.row();
  });
  keyboard.row().text('🔄 Обновить', 'refresh_players');
  keyboard.row().text('🔙 Назад', 'back_main');
  return keyboard;
}