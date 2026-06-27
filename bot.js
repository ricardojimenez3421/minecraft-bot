const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');

const SERVER = {
  host: 'LOSNEGROS.aternos.me',
  port: 52617,
  username: 'BotAFK123'
};

function createBot() {
  const bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: SERVER.username,

    // ✅ versión estable y compatible
    version: '1.20.4',

    // Aternos normalmente es offline
    auth: 'offline'
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('[BOT] Conectado correctamente');
  });

  bot.on('error', (err) => {
    console.log('[ERROR]', err);
  });

  bot.on('kicked', (reason) => {
    console.log('[KICK]', reason);
  });

  bot.on('end', () => {
    console.log('[BOT] Desconectado, reconectando...');
    setTimeout(createBot, 10000);
  });
}

console.log('[BOT] Iniciando...');
createBot();
