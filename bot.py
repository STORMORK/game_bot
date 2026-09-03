import asyncio
import logging
import random
import sqlite3
import os
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command
from aiogram.types import (
    InlineKeyboardButton, 
    InlineKeyboardMarkup, 
    LabeledPrice, 
    PreCheckoutQuery,
    WebAppInfo
)

# Токен берем из переменных окружения сервера
BOT_TOKEN = os.getenv("BOT_TOKEN")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Инициализация базы данных пиратов
def init_db():
    conn = sqlite3.connect("pirates.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS captains (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            ship_level INTEGER DEFAULT 1,
            piastres INTEGER DEFAULT 100,
            rum_energy INTEGER DEFAULT 20,
            max_rum INTEGER DEFAULT 20
        )
    """)
    conn.commit()
    conn.close()

# Получение данных капитана
def get_captain(user_id, username):
    conn = sqlite3.connect("pirates.db")
    cursor = conn.cursor()
    cursor.execute("SELECT ship_level, piastres, rum_energy, max_rum FROM captains WHERE user_id = ?", (user_id,))
    captain = cursor.fetchone()
    
    if not captain:
        cursor.execute("INSERT INTO captains (user_id, username) VALUES (?, ?)", (user_id, username))
        conn.commit()
        captain = (1, 100, 20, 20)
    
    conn.close()
    return captain

# Главное меню бота (включает кнопку перехода в WebApp)
def main_keyboard():
    # Замените ссылку ниже на вашу ссылку из GitHub Pages после ее активации
    WEB_APP_URL = "https://your-github-username.github.io/game_bot/" 
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🏴‍☠️ Играть (Открыть Корабль)", web_app=WebAppInfo(url=WEB_APP_URL))],
        [InlineKeyboardButton(text="⚔️ Морской Абордаж (-1 Ром)", callback_data="raid")],
        [InlineKeyboardButton(text="📜 Капитанский Профиль", callback_data="profile")],
        [InlineKeyboardButton(text="🍾 Сундук с Ромом (10 Stars)", callback_data="buy_rum")]
    ])
    return keyboard

# Старт бота
@dp.message(Command("start"))
async def start_cmd(message: types.Message):
    get_captain(message.from_user.id, message.from_user.username or "Captain")
    await message.answer(
        "🏴‍☠️ **Добро пожаловать на борт, Капитан!**\n\n"
        "Поднимайте черные паруса! Отправляйтесь в плавание, грабьте торговые шхуны и копите пиастры.",
        reply_markup=main_keyboard(),
        parse_mode="Markdown"
    )

# Профиль капитана
@dp.callback_query(F.data == "profile")
async def profile_callback(callback: types.CallbackQuery):
    ship_lvl, piastres, rum, max_rum = get_captain(callback.from_user.id, callback.from_user.username)
    text = (
        f"🏴‍☠️ **Профиль Капитана:**\n\n"
        f"⚓ Уровень корабля: {ship_lvl}\n"
        f"🪙 Пиастры: {piastres}\n"
        f"🍾 Запас Рома: {rum}/{max_rum} ед."
    )
    await callback.message.edit_text(text, reply_markup=main_keyboard(), parse_mode="Markdown")
    await callback.answer()

# Набег / Абордаж
@dp.callback_query(F.data == "raid")
async def raid_callback(callback: types.CallbackQuery):
    conn = sqlite3.connect("pirates.db")
    cursor = conn.cursor()
    cursor.execute("SELECT rum_energy, piastres FROM captains WHERE user_id = ?", (callback.from_user.id,))
    rum, piastres = cursor.fetchone()

    if rum <= 0:
        await callback.answer("❌ Ром закончился! Зайдите в таверну или купите бочонок за Stars.", show_alert=True)
        conn.close()
        return

    targets = ["Торговый Галеон", "Испанская Шхуна", "Купеческий Бриг", "Морское Чудовище"]
    target = random.choice(targets)
    loot = random.randint(15, 45)
    new_rum = rum - 1
    new_piastres = piastres + loot

    cursor.execute("UPDATE captains SET rum_energy = ?, piastres = ? WHERE user_id = ?", 
                   (new_rum, new_piastres, callback.from_user.id))
    conn.commit()
    conn.close()

    result_text = (
        f"⚔️ **Абордажная команда в бою!**\n\n"
        f"🛳 На горизонте захвачен: **{target}**\n"
        f"💥 Вы одержали чистую победу!\n"
        f"🪙 Награблено: +{loot} Пиастр\n"
        f"🍾 Осталось рома: {new_rum}"
    )
    await callback.message.edit_text(result_text, reply_markup=main_keyboard(), parse_mode="Markdown")
    await callback.answer()

# Донат: Покупка Рома за Telegram Stars
@dp.callback_query(F.data == "buy_rum")
async def buy_rum_callback(callback: types.CallbackQuery):
    await bot.send_invoice(
        chat_id=callback.from_user.id,
        title="Бочонок Выдержанного Рома",
        description="Полный запуск энергии +20 ед. для новых морских походов",
        payload="rum_pack_20",
        provider_token="",  # Пустая строка для Telegram Stars
        currency="XTR",     # Код Stars
        prices=[LabeledPrice(label="20 ед. Рома", amount=10)]
    )
    await callback.answer()

# Подтверждение платежа
@dp.pre_checkout_query()
async def pre_checkout(query: PreCheckoutQuery):
    await query.answer(ok=True)

# Успешная оплата
@dp.message(F.successful_payment)
async def successful_payment(message: types.Message):
    conn = sqlite3.connect("pirates.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE captains SET rum_energy = max_rum WHERE user_id = ?", (message.from_user.id,))
    conn.commit()
    conn.close()
    await message.answer("🎉 Оплата принята! Запас рома полностью восстановлен.", reply_markup=main_keyboard())

async def main():
    init_db()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
