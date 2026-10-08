const TelegramBot = require('node-telegram-bot-api');
const sharp = require('sharp');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN);

module.exports = async (req, res) => {
  try {
    const { body } = req;
    if (!body || !body.message) {
      res.status(200).send('OK');
      return;
    }

    const msg = body.message;
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const firstName = msg.from?.first_name || 'друг';

    if (text === '/start') {
      await bot.sendMessage(chatId,
        `🎨 Привет, ${firstName}!\n\n` +
        `Я — Emoji Magic — делаю стикеры из твоих фото.\n\n` +
        `📸 Просто пришли мне фото — и я превращу его в стикер!`
      );
      res.status(200).send('OK');
      return;
    }

    if (msg.photo && msg.photo.length > 0) {
      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;

      const fileLink = await bot.getFileLink(fileId);
      
      const response = await fetch(fileLink);
      const buffer = Buffer.from(await response.arrayBuffer());

      const stickerBuffer = await sharp(buffer)
        .resize(512, 512, { fit: 'cover' })
        .webp({ quality: 90 })
        .toBuffer();

      await bot.sendSticker(chatId, stickerBuffer);
      res.status(200).send('OK');
      return;
    }

    await bot.sendMessage(chatId, '📸 Пришли мне фото — и я сделаю стикер!');
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(200).send('OK');
  }
};
