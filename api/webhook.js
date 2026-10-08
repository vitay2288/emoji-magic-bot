const TelegramBot = require('node-telegram-bot-api');
const sharp = require('sharp');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN);

const userPhotos = {};

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
        `📸 Пришли фото — и я превращу его в стикер.\n\n` +
        `🎨 Потом можешь добавить текст!`
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

      userPhotos[chatId] = buffer;

      const stickerBuffer = await sharp(buffer)
        .resize(512, 512, { fit: 'cover' })
        .webp({ quality: 90 })
        .toBuffer();

      await bot.sendSticker(chatId, stickerBuffer);
      await bot.sendMessage(chatId,
        '✅ Стикер готов!\n\n' +
        '💬 Напиши короткий текст (до 50 символов) — и я добавлю его на стикер.'
      );

      res.status(200).send('OK');
      return;
    }

    if (text && text.length > 0 && text !== '/start' && text !== '/help') {
      if (userPhotos[chatId] && text.length < 50) {
        const buffer = userPhotos[chatId];

        const svgText = `
          <svg width="512" height="512">
            <text x="256" y="480" font-family="Arial, sans-serif" font-size="42" 
                  font-weight="bold" fill="white" stroke="black" stroke-width="4" 
                  text-anchor="middle">${escapeXml(text)}</text>
          </svg>
        `;

        const stickerBuffer = await sharp(buffer)
          .resize(512, 512, { fit: 'cover' })
          .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
          .webp({ quality: 90 })
          .toBuffer();

        await bot.sendSticker(chatId, stickerBuffer);
        await bot.sendMessage(chatId,
          '✅ Готово!\n\n' +
          '📸 Пришли новое фото — или напиши другой текст.'
        );
        res.status(200).send('OK');
        return;
      }
    }

    await bot.sendMessage(chatId, '📸 Пришли мне фото — и я сделаю стикер!');
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(200).send('OK');
  }
};

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}
