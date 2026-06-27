const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const express = require('express');

// Express server for uptime monitoring
const app = express();
app.get('/', (req, res) => {
  res.send('Bot activo');
});
app.listen(3000, () => console.log('[WEB] Server listening on port 3000'));

// Bot configuration
const SERVER = {
  host: 'LOSNEGROS.aternos.me',
  port: 52617,
  username: 'BotAFK123'
};

let bot = null;
let isMoving = false;
let lastMoveTime = Date.now();
let isConnected = false;

// Create bot instance
function createBot() {
  console.log('[BOT] Creating bot instance...');
  
  bot = mineflayer.createBot({
    host: SERVER.host,
    port: SERVER.port,
    username: SERVER.username,
    hideErrors: false,
    logErrors: true
  });

  // Load pathfinder plugin
  bot.loadPlugin(pathfinder);

  // Bot spawned
  bot.on('spawn', () => {
    console.log('[BOT] Bot spawned successfully');
    isConnected = true;
    setupBot();
  });

  // Handle disconnects
  bot.on('end', () => {
    console.log('[BOT] Bot disconnected');
    isConnected = false;
    reconnect();
  });

  // Handle errors
  bot.on('error', (err) => {
    console.error('[ERROR]', err.message);
    isConnected = false;
  });

  // Handle kicks
  bot.on('kicked', (reason) => {
    console.log('[BOT] Bot was kicked:', reason);
    isConnected = false;
  });

  // Handle deaths
  bot.on('death', () => {
    console.log('[BOT] Bot died, respawning...');
    setTimeout(() => {
      if (bot) bot.setControlState('jump', false);
    }, 1000);
  });

  // Uncaught error handler
  process.on('uncaughtException', (err) => {
    console.error('[FATAL]', err);
    reconnect();
  });
}

// Setup bot behaviors
function setupBot() {
  if (!bot || !isConnected) return;

  // Initial behavior cycle
  startBehaviorCycle();
}

// Main behavior cycle
function startBehaviorCycle() {
  if (!isConnected) return;

  const randomDelay = Math.random() * 60000 + 10000; // 10-70 seconds
  
  setTimeout(() => {
    if (!isConnected) return;

    const action = Math.random();

    if (action < 0.6) {
      // 60% chance: explore
      performExploration();
    } else if (action < 0.85) {
      // 25% chance: idle/look around
      performIdleBehavior();
    } else {
      // 15% chance: jump and look
      performJumpBehavior();
    }

    startBehaviorCycle();
  }, randomDelay);
}

// Exploration movement
function performExploration() {
  if (!isConnected || !bot) return;

  try {
    // Generate random nearby target
    const randomDistance = Math.random() * 60 + 20; // 20-80 blocks
    const randomAngle = Math.random() * Math.PI * 2;
    
    const targetX = bot.entity.position.x + Math.cos(randomAngle) * randomDistance;
    const targetZ = bot.entity.position.z + Math.sin(randomAngle) * randomDistance;

    // Get safe Y coordinate
    const targetY = bot.entity.position.y;

    const goal = new (require('mineflayer-pathfinder').goals.GoalXZ)(targetX, targetZ);
    
    if (bot.pathfinder) {
      const movements = new Movements(bot);
      movements.allow1by1towers = false;
      movements.canDig = false;
      bot.pathfinder.setMovements(movements);
      
      bot.pathfinder.goto(goal).then(() => {
        console.log('[BOT] Reached exploration point');
      }).catch((err) => {
        console.log('[BOT] Pathfinding failed, changing direction');
      });

      isMoving = true;
      lastMoveTime = Date.now();
    }
  } catch (err) {
    console.error('[ERROR] Exploration error:', err.message);
  }
}

// Idle behavior with head movement
function performIdleBehavior() {
  if (!isConnected || !bot) return;

  try {
    // Stop movement
    if (bot.pathfinder) {
      bot.pathfinder.stop();
    }
    isMoving = false;

    // Random head movement (human-like looking around)
    const yaw = (Math.random() - 0.5) * Math.PI;
    const pitch = (Math.random() - 0.5) * 0.5;
    
    bot.look(bot.entity.yaw + yaw, bot.entity.pitch + pitch, false);

    console.log('[BOT] Idle behavior - looking around');

    // Sometimes crouch
    if (Math.random() < 0.3) {
      bot.setControlState('sneak', true);
      setTimeout(() => {
        if (bot) bot.setControlState('sneak', false);
      }, Math.random() * 5000 + 1000);
    }
  } catch (err) {
    console.error('[ERROR] Idle behavior error:', err.message);
  }
}

// Jump and look behavior
function performJumpBehavior() {
  if (!isConnected || !bot) return;

  try {
    if (bot.pathfinder) {
      bot.pathfinder.stop();
    }

    // Random jump
    bot.setControlState('jump', true);
    setTimeout(() => {
      if (bot) bot.setControlState('jump', false);
    }, 100);

    // Look in random direction
    const yaw = Math.random() * Math.PI * 2;
    const pitch = (Math.random() - 0.5) * Math.PI;
    bot.look(yaw, pitch, false);

    console.log('[BOT] Jump behavior');
  } catch (err) {
    console.error('[ERROR] Jump behavior error:', err.message);
  }
}

// Anti-stuck system
function checkStuck() {
  if (!isConnected || !bot) return;

  setInterval(() => {
    if (!isConnected) return;

    const timeSinceMove = Date.now() - lastMoveTime;

    // If stuck for more than 15 seconds, force new goal
    if (isMoving && timeSinceMove > 15000) {
      console.log('[BOT] Stuck detected, changing direction');
      
      if (bot.pathfinder) {
        bot.pathfinder.stop();
      }
      
      performExploration();
      lastMoveTime = Date.now();
    }
  }, 5000); // Check every 5 seconds
}

// Reconnect system
function reconnect() {
  console.log('[BOT] Attempting reconnection in 10 seconds...');
  setTimeout(() => {
    try {
      if (bot) {
        bot.quit();
      }
    } catch (e) {
      console.log('[BOT] Could not quit previous bot');
    }
    
    bot = null;
    isConnected = false;
    createBot();
  }, 10000);
}

// Health check interval
setInterval(() => {
  if (!isConnected && bot) {
    console.log('[BOT] Bot not connected, initiating reconnect');
    reconnect();
  }
}, 30000);

// Start the bot
console.log('[BOT] Starting Minecraft bot...');
createBot();

// Check for stuck situations
setTimeout(checkStuck, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[BOT] Shutting down gracefully...');
  if (bot) {
    bot.quit();
  }
  process.exit(0);
});
