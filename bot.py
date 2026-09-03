import os
import sqlite3
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

TOKEN = os.getenv("BOT_TOKEN")
WEB_APP_URL = "https://stormork.github.io/game_bot/"

bot = Bot(token=TOKEN)
dp = Dispatcher()

# Инициализация базы данных SQLite
def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            score INTEGER DEFAULT 0,
            rum INTEGER DEFAULT 3
        )
    """)
    conn.commit()
    conn.close()

init_db()

@dp.message(Command("start"))
async def cmd_start(message: Message):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO users (user_id, username) VALUES (?, ?)", 
                   (message.from_user.id, message.from_user.username))
    conn.commit()
    
    cursor.execute("SELECT score, rum FROM users WHERE user_id = ?", (message.from_user.id,))
    user_data = cursor.fetchone()
    conn.close()

    score, rum = user_data

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🏴‍☠️ Играть (Открыть Корабль)", web_app=WebAppInfo(url=WEB_APP_URL))],
        [InlineKeyboardButton(text=f"⚔️ Морской Абордаж (-1 Ром) [Осталось: {rum}]", callback_data="board_ship")],
        [InlineKeyboardButton(text="📦 Капитанский Профиль", callback_data="profile")],
        [InlineKeyboardButton(text="🍾 Сундук с Ромом (10 Stars)", callback_data="buy_rum")]
    ])

    await message.answer(
        "🏴‍☠️ **Добро пожаловать на борт, Капитан!**\n\n"
        "Поднимайте черные паруса! Отправляйтесь в плавание, грабьте торговые шхуны и копите пиастры.",
        reply_markup=keyboard,
        parse_mode="Markdown"
    )

@dp.callback_query(F.data == "profile")
async def show_profile(callback: types.CallbackQuery):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT score, rum FROM users WHERE user_id = ?", (callback.from_user.id,))
    user_data = cursor.fetchone()
    conn.close()

    score, rum = user_data
    await callback.answer()
    await callback.message.answer(
        f"📦 **Капитанский Профиль**\n\n"
        f"🪙 Пиастры: {score}\n"
        f"🍾 Запасы рома: {rum}",
        parse_mode="Markdown"
    )

@dp.callback_query(F.data == "board_ship")
async def board_ship(callback: types.CallbackQuery):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT rum, score FROM users WHERE user_id = ?", (callback.from_user.id,))
    rum, score = cursor.fetchone()

    if rum > 0:
        rum -= 1
        score += 50
        cursor.execute("UPDATE users SET rum = ?, score = ? WHERE user_id = ?", (rum, score, callback.from_user.id))
        conn.commit()
        conn.close()
        await callback.answer("Победа! Вы захватили шхуну (+50 пиастров).")
        await callback.message.answer(f"⚔️ Абордаж прошел успешно! Получено 50 пиастров. Баланс: {score} 🪙")
    else:
        conn.close()
        await callback.answer("У вас закончился ром!", show_alert=True)

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
