import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN || '',
};

if (!config.botToken) {
  throw new Error('BOT_TOKEN is missing in environment variables');
}
