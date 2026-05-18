require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'galaxydraw_secret_123';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json());

const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:5500'],
    credentials: true
  },
  cookie: {
    secure: true,
    sameSite: 'none'
  }
});

io.engine.use(sessionMiddleware);

const ENGLISH_WORDS = [
  'apple', 'banana', 'orange', 'grape', 'watermelon', 'strawberry', 'pineapple', 'mango',
  'elephant', 'giraffe', 'dolphin', 'penguin', 'butterfly', 'turtle', 'rabbit', 'horse',
  'sunflower', 'rose', 'tulip', 'daisy', 'tree', 'mountain', 'river', 'ocean', 'island',
  'rainbow', 'star', 'moon', 'sun', 'cloud', 'rain', 'snow', 'thunder', 'castle',
  'bridge', 'house', 'school', 'church', 'hospital', 'airplane', 'rocket', 'bicycle',
  'piano', 'guitar', 'violin', 'drums', 'camera', 'pencil', 'book', 'clock', 'key',
  'heart', 'crown', 'sword', 'shield', 'diamond', 'ring', 'flower', 'garden', 'forest',
  'desert', 'waterfall', 'volcano', 'cave', 'lighthouse', 'anchor', 'sailboat', 'treasure',
  'dragon', 'unicorn', 'mermaid', 'wizard', 'robot', 'ghost', 'skeleton', 'pumpkin',
  'birthday', 'balloon', 'fireworks', 'ladder', 'umbrella', 'chair', 'table', 'window',
  'football', 'basketball', 'tennis', 'baseball', 'swimming', 'running', 'jumping', 'flying',
  'pizza', 'hamburger', 'fries', 'cake', 'cookie', 'icecream', 'chocolate', 'popcorn',
  'coffee', 'tea', 'juice', 'milk', 'sandwich', 'salad', 'soup', 'bread', 'cheese',
  'egg', 'chicken', 'fish', 'shrimp', 'crab', 'lobster', 'cat', 'dog', 'bird', 'mouse',
  'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'owl', 'eagle', 'shark', 'whale',
  'planet', 'comet', 'meteor', 'satellite', 'telescope', 'astronaut', 'spaceship',
  'nebula', 'galaxy', 'constellation', 'eclipse', 'orbit', 'gravity', 'laser', 'portal',
  'puzzle', 'maze', 'labyrinth', 'parachute', 'kite', 'compass', 'torch', 'candle',
  'mirror', 'cushion', 'curtain', 'carpet', 'pillow', 'blanket', 'soap', 'towel',
  'backpack', 'wallet', 'sunglasses', 'watch', 'necklace', 'bracelet', 'earrings',
  'lollipop', 'mushroom', 'cactus', 'bamboo', 'coconut', 'cherry', 'lemon', 'peach'
];

const MALAYALAM_WORDS = [
  'വീട്', 'മരം', 'പൂച്ച', 'നായ', 'മീൻ', 'ആന', 'കാർ', 'പൂക്കൾ', 'മഴ', 'കടൽ',
  'ചന്ദ്രൻ', 'സൂര്യൻ', 'പക്ഷി', 'പഴം', 'പുസ്തകം', 'വെള്ളം', 'അഗ്നി', 'ഭൂമി', 'ആകാശം', 'നക്ഷത്രം',
  'കളിപ്പാട്ടം', 'പാലം', 'പറമ്പ്', 'കുന്ന്', 'പുഴ', 'കായൽ', 'വയൽ', 'തോട്', 'കിണർ', 'വഴി',
  'പള്ളി', 'അമ്പലം', 'വിദ്യാലയം', 'ആശുപത്രി', 'കട', 'ചന്ത', 'പറക്കും', 'ഓട്ടം', 'ചിരി', 'കരച്ചിൽ',
  'പാട്ട്', 'നൃത്തം', 'ചിത്രം', 'ശിൽപ്പം', 'കവിത', 'കഥ', 'നാടകം', 'സിനിമ', 'വാർത്ത', 'പത്രം',
  'മിഠായി', 'അപ്പം', 'പായസം', 'കറി', 'ചോറ്', 'ഇഡ്ഡലി', 'ദോശ', 'പപ്പടം', 'തൈര്', 'മോര്',
  'കമ്പ്യൂട്ടർ', 'ഫോൺ', 'ലാപ്ടോപ്പ്', 'ക്യാമറ', 'ടെലിവിഷൻ', 'റേഡിയോ', 'ഫാൻ', 'ലൈറ്റ്', 'ബാറ്ററി', 'കേബിൾ',
  'പാമ്പ്', 'തവള', 'കുരങ്ങൻ', 'പശു', 'എരുമ', 'കുതിര', 'കഴുത', 'ആട്', 'കോഴി', 'താറാവ്'
];

const rooms = {};
const onlinePlayers = new Map();

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function getWord(room) {
  const list = room.language === 'ml' ? MALAYALAM_WORDS : ENGLISH_WORDS;
  let word;
  do {
    word = list[Math.floor(Math.random() * list.length)];
  } while (room.usedWords && room.usedWords.includes(word));
  return word;
}

function startRound(room) {
  if (room.round > room.maxRounds) {
    endGame(room);
    return;
  }
  const drawerIndex = room.currentDrawerIndex % room.players.length;
  room.currentDrawer = room.players[drawerIndex].socketId;
  room.currentWord = getWord(room);
  if (!room.usedWords) room.usedWords = [];
  room.usedWords.push(room.currentWord);
  room.status = 'choosing';
  room.guessedCorrectly = new Set();
  room.wordHint = room.currentWord.replace(/./g, '_').split('');
  room.roundStartTime = Date.now();

  io.to(room.code).emit('round-start', {
    round: room.round,
    maxRounds: room.maxRounds,
    drawer: room.players[drawerIndex].user,
    drawerSocketId: room.currentDrawer,
    wordLength: room.currentWord.length,
    language: room.language
  });

  io.to(room.currentDrawer).emit('choose-word', {
    words: generateWordChoices(room),
    timeout: 10
  });

  room.wordChoiceTimeout = setTimeout(() => {
    if (room.status === 'choosing') {
      selectWordAndStart(room, room.currentWord);
    }
  }, 10000);
}

function generateWordChoices(room) {
  const list = room.language === 'ml' ? MALAYALAM_WORDS : ENGLISH_WORDS;
  const choices = [room.currentWord];
  while (choices.length < 3) {
    const w = list[Math.floor(Math.random() * list.length)];
    if (!choices.includes(w)) choices.push(w);
  }
  return choices.sort(() => Math.random() - 0.5);
}

function selectWordAndStart(room, word) {
  if (room.status !== 'choosing') return;
  clearTimeout(room.wordChoiceTimeout);
  room.currentWord = word;
  room.status = 'drawing';
  room.wordHint = word.replace(/./g, '_').split('');

  io.to(room.code).emit('word-selected', {
    wordLength: word.length,
    language: room.language
  });

  io.to(room.currentDrawer).emit('your-word', { word });

  let secondsLeft = room.drawTime;
  room.timerInterval = setInterval(() => {
    secondsLeft--;
    io.to(room.code).emit('timer-tick', { secondsLeft });

    if (secondsLeft <= Math.floor(room.drawTime * 0.7) && secondsLeft > 0) {
      const hintCount = Math.max(1, Math.floor(word.length * (1 - secondsLeft / room.drawTime)));
      for (let i = 0; i < word.length && room.wordHint.filter(c => c !== '_').length < hintCount; i++) {
        if (room.wordHint[i] === '_') {
          room.wordHint[i] = word[i];
          break;
        }
      }
      io.to(room.code).emit('word-hint', { hint: room.wordHint.join(' ') });
    }

    if (secondsLeft <= 0) {
      clearInterval(room.timerInterval);
      endRound(room, false);
    }
  }, 1000);
}

function endRound(room, allGuessed) {
  clearInterval(room.timerInterval);
  clearTimeout(room.wordChoiceTimeout);
  room.status = 'round-end';

  io.to(room.code).emit('round-end', {
    word: room.currentWord,
    scores: room.scores,
    allGuessed
  });

  setTimeout(() => {
    room.round++;
    room.currentDrawerIndex++;
    startRound(room);
  }, 5000);
}

function endGame(room) {
  room.status = 'game-end';
  const sorted = room.players.map(p => ({
    user: p.user,
    score: room.scores[p.socketId] || 0
  })).sort((a, b) => b.score - a.score);

  io.to(room.code).emit('game-end', { scores: sorted });
}

const app2 = app;

app.get('/auth/discord', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
  res.redirect(url);
});

app.get('/auth/discord/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(FRONTEND_URL);

  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });

    req.session.user = {
      id: userRes.data.id,
      username: userRes.data.username,
      avatar: userRes.data.avatar,
      discriminator: userRes.data.discriminator
    };

    req.session.save(() => {
      res.redirect(`${FRONTEND_URL}/lobby.html`);
    });
  } catch (err) {
    console.error('Discord auth error:', err.message);
    res.redirect(FRONTEND_URL);
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(FRONTEND_URL);
  });
});

app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({ onlinePlayers: onlinePlayers.size });
});

io.on('connection', (socket) => {
  const session = socket.request.session;
  let user = null;
  if (session && session.user) {
    user = session.user;
  }

  onlinePlayers.set(socket.id, { socketId: socket.id, user });
  io.emit('online-count', onlinePlayers.size);

  socket.on('create-room', (data, callback) => {
    const code = generateRoomCode();
    rooms[code] = {
      code,
      host: socket.id,
      players: [{ socketId: socket.id, user: user || { id: socket.id, username: data.name || 'Player', avatar: null } }],
      status: 'lobby',
      currentDrawer: null,
      currentDrawerIndex: 0,
      currentWord: null,
      round: 1,
      maxRounds: data.rounds || 5,
      drawTime: data.drawTime || 60,
      language: data.language || 'en',
      scores: {},
      usedWords: [],
      guessedCorrectly: new Set(),
      wordHint: null,
      timerInterval: null,
      wordChoiceTimeout: null,
      roundStartTime: null
    };
    rooms[code].scores[socket.id] = 0;
    socket.join(code);
    socket.roomCode = code;
    callback({ success: true, code });
  });

  socket.on('join-room', (data, callback) => {
    const code = data.code.toUpperCase();
    const room = rooms[code];
    if (!room) return callback({ error: 'Room not found' });
    if (room.players.length >= 12) return callback({ error: 'Room full' });
    if (room.status !== 'lobby') return callback({ error: 'Game already started' });

    room.players.push({ socketId: socket.id, user: user || { id: socket.id, username: data.name || 'Player', avatar: null } });
    room.scores[socket.id] = 0;
    socket.join(code);
    socket.roomCode = code;

    io.to(code).emit('player-joined', { players: room.players });
    io.to(code).emit('chat-message', {
      type: 'system',
      text: `👋 ${user?.username || 'Player'} joined`
    });

    callback({ success: true, code, room: { code: room.code, host: room.host, players: room.players, status: room.status, maxRounds: room.maxRounds, drawTime: room.drawTime, language: room.language, round: room.round } });
  });

  socket.on('start-game', () => {
    const room = getRoom(socket);
    if (!room || room.host !== socket.id) return;
    room.status = 'playing';
    room.currentDrawerIndex = 0;
    room.round = 1;
    io.to(room.code).emit('game-starting', { players: room.players });
    setTimeout(() => startRound(room), 2000);
  });

  socket.on('select-word', (data) => {
    const room = getRoom(socket);
    if (!room || room.currentDrawer !== socket.id || room.status !== 'choosing') return;
    selectWordAndStart(room, data.word);
  });

  socket.on('draw-data', (data) => {
    const room = getRoom(socket);
    if (!room || room.currentDrawer !== socket.id) return;
    socket.to(room.code).emit('draw-data', data);
  });

  socket.on('guess', (data) => {
    const room = getRoom(socket);
    if (!room || room.currentDrawer === socket.id) return;
    if (room.guessedCorrectly.has(socket.id)) return;

    const guess = data.message.trim().toLowerCase();
    const word = room.currentWord.toLowerCase();

    if (guess === word) {
      room.guessedCorrectly.add(socket.id);
      const elapsed = (Date.now() - room.roundStartTime) / 1000;
      let points = Math.max(50, 200 - Math.floor(elapsed * 2));
      if (room.guessedCorrectly.size === 1) points += 50;
      room.scores[socket.id] = (room.scores[socket.id] || 0) + points;

      room.players.forEach(p => {
        if (p.socketId === room.currentDrawer) {
          room.scores[p.socketId] = (room.scores[p.socketId] || 0) + 15;
        }
      });

      io.to(room.code).emit('correct-guess', {
        socketId: socket.id,
        username: user?.username || 'Player',
        score: room.scores[socket.id],
        points,
        drawerScore: room.scores[room.currentDrawer],
        drawerSocketId: room.currentDrawer
      });

      if (room.guessedCorrectly.size >= room.players.length - 1) {
        endRound(room, true);
      }
    } else {
      io.to(room.code).emit('chat-message', {
        type: 'guess',
        socketId: socket.id,
        username: user?.username || 'Player',
        text: guess
      });
    }
  });

  socket.on('chat-message', (data) => {
    const room = getRoom(socket);
    if (!room) return;
    if (socket.id === room.currentDrawer) return;
    io.to(room.code).emit('chat-message', {
      type: 'chat',
      socketId: socket.id,
      username: user?.username || 'Player',
      text: data.message,
      avatar: user?.avatar
    });
  });

  socket.on('clear-canvas', () => {
    const room = getRoom(socket);
    if (!room || room.currentDrawer !== socket.id) return;
    io.to(room.code).emit('canvas-cleared');
  });

  socket.on('restart-game', () => {
    const room = getRoom(socket);
    if (!room || room.host !== socket.id) return;
    room.status = 'lobby';
    room.currentDrawer = null;
    room.currentDrawerIndex = 0;
    room.currentWord = null;
    room.round = 1;
    room.usedWords = [];
    room.guessedCorrectly = new Set();
    room.scores = {};
    room.players.forEach(p => { room.scores[p.socketId] = 0; });
    clearInterval(room.timerInterval);
    clearTimeout(room.wordChoiceTimeout);
    io.to(room.code).emit('game-restarted', { players: room.players });
  });

  socket.on('disconnect', () => {
    onlinePlayers.delete(socket.id);
    io.emit('online-count', onlinePlayers.size);

    const roomCode = socket.roomCode;
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;

    const idx = room.players.findIndex(p => p.socketId === socket.id);
    if (idx === -1) return;
    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      clearInterval(room.timerInterval);
      clearTimeout(room.wordChoiceTimeout);
      delete rooms[roomCode];
      return;
    }

    if (room.status === 'lobby') {
      if (room.host === socket.id) {
        room.host = room.players[0].socketId;
      }
      io.to(roomCode).emit('player-left', { players: room.players, newHost: room.host });
      return;
    }

    if (socket.id === room.currentDrawer) {
      clearInterval(room.timerInterval);
      clearTimeout(room.wordChoiceTimeout);
      io.to(roomCode).emit('chat-message', {
        type: 'system',
        text: '⏭ Round skipped - drawer disconnected'
      });
      room.round++;
      room.currentDrawerIndex++;
      startRound(room);
    } else {
      room.guessedCorrectly.delete(socket.id);
    }

    io.to(roomCode).emit('player-left', { players: room.players, newHost: room.host });
  });
});

function getRoom(socket) {
  return rooms[socket.roomCode];
}

server.listen(PORT, () => {
  console.log(`GalaxyDraw server running on port ${PORT}`);
});
