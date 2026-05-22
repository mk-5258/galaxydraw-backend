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
  origin: [FRONTEND_URL, 'https://galaxydrawmk.great-site.net', 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json());

const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'https://galaxydrawmk.great-site.net', 'http://localhost:5500'],
    credentials: true
  },
  cookie: {
    secure: true,
    sameSite: 'none'
  }
});

io.engine.use(sessionMiddleware);

const ENGLISH_WORDS = [
  'cat','dog','elephant','giraffe','dolphin','penguin','butterfly','turtle',
  'rabbit','horse','lion','tiger','bear','wolf','fox','deer','owl','eagle',
  'shark','whale','monkey','gorilla','zebra','kangaroo','crocodile','parrot',
  'flamingo','octopus','jellyfish','seahorse','hamster','panda','koala',
  'pizza','hamburger','hotdog','sandwich','sushi','taco','pasta','bread',
  'cake','cookie','icecream','chocolate','popcorn','coffee','tea','juice',
  'apple','banana','orange','grape','watermelon','strawberry','pineapple',
  'mango','cherry','lemon','peach','mushroom','coconut','avocado','broccoli',
  'pencil','book','clock','key','camera','umbrella','backpack','wallet',
  'sunglasses','watch','ring','crown','sword','shield','candle','mirror',
  'cushion','carpet','pillow','blanket','soap','towel','compass','torch',
  'ladder','chair','table','window','door','bridge','anchor','telescope',
  'mountain','river','ocean','island','rainbow','star','moon','sun','cloud',
  'rain','snow','thunder','lightning','volcano','waterfall','cave','desert',
  'forest','flower','tree','rose','sunflower','cactus','bamboo',
  'airplane','rocket','bicycle','car','bus','train','boat','helicopter',
  'motorcycle','submarine','skateboard','scooter','truck','ambulance',
  'football','basketball','tennis','baseball','swimming','running','jumping',
  'skiing','surfing','boxing','archery','gymnastics','cycling','fishing',
  'piano','guitar','violin','drums','microphone','headphones','painting',
  'sculpture','ballet','theater','cinema',
  'castle','lighthouse','hospital','school','church','mosque','temple',
  'pyramid','igloo','treehouse','windmill','skyscraper',
  'planet','comet','meteor','satellite','astronaut','spaceship','nebula',
  'galaxy','constellation','eclipse','blackhole','asteroid',
  'dragon','unicorn','mermaid','wizard','robot','ghost','pumpkin','pirate',
  'ninja','viking','alien','superhero','fairy','vampire','werewolf',
  'birthday','balloon','fireworks','treasure','puzzle','maze',
  'kite','parachute','lollipop','magnet','hourglass','compass',
  'feather','nest','spider','bee','ant','ladybug','snail','worm',
  'cheese','egg','milk','bread','butter','jam','honey','rice','noodles',
  'bottle','cup','plate','bowl','fork','spoon','knife','pot','pan',
  'bed','desk','drawer','shelf','cabinet','curtain','rug','lamp',
  'road','path','gate','wall','roof','chimney','fence','garden',
  'sunrise','sunset','storm','fog','ice','flood','drought','breeze',
  'basket','bucket','rope','nail','hammer','drill','lock','flag',
  'diamond','ruby','gold','silver','bronze','pearl','crystal','coin',
  'sailor','knight','king','queen','prince','princess','giant','elf',
  'scarf','helmet','boot','shoe','glove','coin','button','zipper',
  'tent','cabin','cottage','barn','garage','stadium','museum','tower',
  'lunch','dinner','breakfast','snack','feast','grill','stove','oven'
];

const MALAYALAM_WORDS = [
  'വീട്','മരം','പൂച്ച','നായ','മീൻ','ആന','കാർ','പൂക്കൾ',
  'മഴ','കടൽ','ചന്ദ്രൻ','സൂര്യൻ','പക്ഷി','പഴം','പുസ്തകം',
  'വെള്ളം','അഗ്നി','ഭൂമി','ആകാശം','നക്ഷത്രം','കളിപ്പാട്ടം',
  'പാലം','പറമ്പ്','കുന്ന്','പുഴ','കായൽ','വയൽ','കിണർ',
  'പള്ളി','അമ്പലം','വിദ്യാലയം','ആശുപത്രി','ചന്ത','പാട്ട്',
  'നൃത്തം','ചിത്രം','കഥ','സിനിമ','മിഠായി','അപ്പം','പായസം',
  'കറി','ചോറ്','ഇഡ്ഡലി','ദോശ','കമ്പ്യൂട്ടർ','ഫോൺ','ടെലിവിഷൻ',
  'പാമ്പ്','തവള','കുരങ്ങൻ','പശു','കുതിര','ആട്','കോഴി',
  'മഞ്ഞ്','കാറ്റ്','തീ','കടൽത്തീരം','മേഘം','വെള്ളച്ചാട്ടം',
  'പൂട്ട്','വീൽ','കത്തി','ചൂല്','കിടക്ക','കണ്ണാടി','മേശ',
  'കസേര','വാതിൽ','ജനൽ','കൊടി','ചക്രം','കൊട്ട','വള',
  'മാമ്പഴം','തേങ്ങ','പപ്പായ','ഇത്തിക്കണ്ണി','വഴുതന','പാവയ്ക്ക',
  'പുളി','ഇഞ്ചി','മഞ്ഞൾ','മുളക്','ഉപ്പ്','പഞ്ചസാര',
  'പൂവൻ','കുളം','പറക്കും','കൊതുക്','ഈച്ച','ചിലന്തി','പുഴു',
  'താറാവ്','പ്രാവ്','കാക്ക','കിളി','മയിൽ','കോകില','കുയിൽ',
  'ആമ','ഞണ്ട്','ചെമ്മീൻ','കണവ','നത്ത','ഒട്ടകം','സിംഹം',
  'ഉപ്പുമാവ്','പുട്ട്','കഞ്ഞി','ബിരിയാണി','സാമ്പാർ','അവിയൽ',
  'ഓട്ട','പന്ത്','പട്ടം','വണ്ടി','തോണി','ശാസ്ത്രം','ഗണിതം',
  'തക്കാളി','കാരറ്റ്','ബീൻസ്','കാബേജ്','പയർ','മുള്ളങ്കി',
  'വസന്തം','വർഷം','ശിശിരം','മാരി','ഇടി','മിന്നൽ','കൊടുങ്കാറ്റ്',
  'തേൻ','പാല്','തൈര്','വെണ്ണ','നെയ്യ്','മോര്'
];

const rooms = {};
const onlinePlayers = new Map();
const tokenMap = new Map();
const xpStore = new Map();
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

function getLevel(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 10);
}

function addXP(discordId, amount) {
  if (!discordId) return { xp: 0, level: 1, levelUp: false };
  if (!xpStore.has(discordId)) {
    xpStore.set(discordId, { xp: 0, level: 1, gamesPlayed: 0, wins: 0, bestScore: 0, timesDrawn: 0, achievements: [] });
  }
  const data = xpStore.get(discordId);
  const oldLevel = data.level;
  data.xp += amount;
  data.level = getLevel(data.xp);
  const levelUp = data.level > oldLevel;
  return { xp: data.xp, level: data.level, levelUp };
}

function getPublicRoomsList() {
  const list = [];
  for (const [code, room] of Object.entries(rooms)) {
    if (room.visibility === 'public' && (room.status === 'lobby' || room.status === 'playing')) {
      list.push({
        code,
        name: room.name,
        players: room.players.map(p => ({ socketId: p.socketId, user: p.user })),
        maxPlayers: room.maxPlayers,
        playerCount: room.players.length,
        status: room.status,
        visibility: room.visibility
      });
    }
  }
  return list;
}

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function getWord(room) {
  const list = room.language === 'ml' ? MALAYALAM_WORDS : ENGLISH_WORDS;
  let word;
  let attempts = 0;
  do {
    word = list[Math.floor(Math.random() * list.length)];
    attempts++;
  } while (room.usedWords && room.usedWords.includes(word) && attempts < 50);
  return word;
}

function getPlayerState(room) {
  return room.players.map(p => ({
    socketId: p.socketId,
    user: p.user || { id: p.socketId, username: 'Player', avatar: null },
    score: room.scores[p.socketId] || 0,
    isDrawer: p.socketId === room.currentDrawer
  }));
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
  room.drawerIdleTimeouts = 0;

  clearTimeout(room.wordChoiceTimeout);
  clearTimeout(room.roundFailsafeTimeout);

  room.players.forEach(p => {
    if (p.socketId === room.currentDrawer) {
      io.to(p.socketId).emit('round-start', {
        round: room.round,
        maxRounds: room.maxRounds,
        drawer: room.players[drawerIndex].user,
        drawerSocketId: room.currentDrawer,
        wordLength: room.currentWord.length,
        language: room.language,
        drawTime: room.drawTime,
        isDrawer: true
      });
      io.to(p.socketId).emit('choose-word', {
        words: generateWordChoices(room),
        timeout: 10
      });
    } else {
      io.to(p.socketId).emit('round-start', {
        round: room.round,
        maxRounds: room.maxRounds,
        drawer: room.players[drawerIndex].user,
        drawerSocketId: room.currentDrawer,
        wordLength: room.currentWord.length,
        language: room.language,
        drawTime: room.drawTime,
        isDrawer: false
      });
    }
  });

  room.wordChoiceTimeout = setTimeout(() => {
    if (room.status === 'choosing') {
      selectWordAndStart(room, room.currentWord);
    }
  }, 10000);

  room.roundFailsafeTimeout = setTimeout(() => {
    if (room && (room.status === 'choosing' || room.status === 'drawing')) {
      if (room.status === 'choosing') {
        selectWordAndStart(room, room.currentWord);
      }
    }
  }, 12000);
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
  clearTimeout(room.roundFailsafeTimeout);
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
  clearTimeout(room.roundFailsafeTimeout);
  room.status = 'round-end';

  if (allGuessed && room.currentDrawer) {
    const drawerPlayer = room.players.find(p => p.socketId === room.currentDrawer);
    if (drawerPlayer && drawerPlayer.user) {
      addXP(drawerPlayer.user.id, 40);
    }
  }

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

  const winner = sorted[0];
  if (winner && winner.user) {
    addXP(winner.user.id, 100);
  }

  room.players.forEach(p => {
    if (p.user) {
      if (!xpStore.has(p.user.id)) {
        xpStore.set(p.user.id, { xp: 0, level: 1, gamesPlayed: 0, wins: 0, bestScore: 0, timesDrawn: 0, achievements: [] });
      }
      const data = xpStore.get(p.user.id);
      data.gamesPlayed++;
      if (p.user.id === winner?.user?.id) {
        data.wins++;
      }
      const score = room.scores[p.socketId] || 0;
      if (score > data.bestScore) data.bestScore = score;
    }
  });

  io.to(room.code).emit('game-end', { scores: sorted });
}

function startAutoCountdown(room) {
  if (room.autoStartInterval) return;
  let count = 5;
  room.autoStartInterval = setInterval(() => {
    io.to(room.code).emit('auto-start-countdown', { count });
    count--;
    if (count < 0) {
      clearInterval(room.autoStartInterval);
      room.autoStartInterval = null;
      if (room && room.status === 'lobby' && room.players.length >= 2) {
        room.status = 'playing';
        room.currentDrawerIndex = 0;
        room.round = 1;
        io.to(room.code).emit('game-starting', { players: room.players });
        io.emit('public-rooms', getPublicRoomsList());
        setTimeout(() => startRound(room), 2000);
      }
    }
  }, 1000);
}

function cancelAutoCountdown(room) {
  if (room.autoStartInterval) {
    clearInterval(room.autoStartInterval);
    room.autoStartInterval = null;
    io.to(room.code).emit('auto-start-cancelled');
  }
}

function getRoom(socket) {
  return rooms[socket.roomCode];
}

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

    const userData = { id: userRes.data.id, username: userRes.data.username, avatar: userRes.data.avatar };
    res.redirect(`${FRONTEND_URL}/lobby.html?user=${encodeURIComponent(JSON.stringify(userData))}`);
  } catch (err) {
    console.error('Discord auth error:', err.message);
    res.redirect(FRONTEND_URL);
  }
});

app.post('/api/setuser', (req, res) => {
  const { user } = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ error: 'Invalid user data' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  tokenMap.set(token, {
    id: user.id,
    username: user.username,
    avatar: user.avatar
  });
  res.json({ token });
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(FRONTEND_URL);
  });
});

app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json(req.session.user);
  }
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token && tokenMap.has(token)) {
    return res.json(tokenMap.get(token));
  }
  res.status(401).json({ error: 'Not logged in' });
});

app.get('/api/stats', (req, res) => {
  res.json({ onlinePlayers: onlinePlayers.size });
});

app.get('/api/userinfo/:discordId', (req, res) => {
  const { discordId } = req.params;
  for (const [, player] of onlinePlayers.entries()) {
    if (player.user && player.user.id === discordId) {
      return res.json({ id: player.user.id, username: player.user.username, avatar: player.user.avatar });
    }
  }
  for (const [, room] of Object.entries(rooms)) {
    for (const p of room.players) {
      if (p.user && p.user.id === discordId) {
        return res.json({ id: p.user.id, username: p.user.username, avatar: p.user.avatar });
      }
    }
  }
  res.json({ id: discordId, username: 'Player', avatar: null });
});

app.get('/api/profile/:discordId', (req, res) => {
  const { discordId } = req.params;
  if (xpStore.has(discordId)) {
    res.json(xpStore.get(discordId));
  } else {
    res.json({ xp: 0, level: 1, gamesPlayed: 0, wins: 0, bestScore: 0, timesDrawn: 0, achievements: [] });
  }
});

app.get('/api/leaderboard', (req, res) => {
  const entries = [];
  for (const [id, data] of xpStore.entries()) {
    entries.push({ discordId: id, ...data });
  }
  entries.sort((a, b) => b.xp - a.xp);
  res.json(entries.slice(0, 100));
});

app.get('/api/public-rooms', (req, res) => {
  res.json(getPublicRoomsList());
});

io.on('connection', (socket) => {
  const sess = socket.request.session;
  let user = null;
  if (sess && sess.user) {
    user = sess.user;
  }
  if (!user && socket.handshake.auth && socket.handshake.auth.token) {
    const tokenUser = tokenMap.get(socket.handshake.auth.token);
    if (tokenUser) {
      user = tokenUser;
    }
  }
  if (!user && socket.handshake.auth && socket.handshake.auth.user) {
    const authUser = socket.handshake.auth.user;
    if (authUser && authUser.id) {
      user = { id: authUser.id, username: authUser.username || 'Player', avatar: authUser.avatar || null };
    }
  }

  onlinePlayers.set(socket.id, { socketId: socket.id, user });
  io.emit('online-count', onlinePlayers.size);
  io.emit('online-players', Array.from(onlinePlayers.values()));
  socket.emit('public-rooms', getPublicRoomsList());

  socket.on('player-online', (userData) => {
    if (userData && userData.id) {
      user = { id: userData.id, username: userData.username || 'Player', avatar: userData.avatar || null };
      onlinePlayers.set(socket.id, { socketId: socket.id, user });
      io.emit('online-players', Array.from(onlinePlayers.values()));
      io.emit('online-count', onlinePlayers.size);
    }
  });

  socket.on('get-online-players', () => {
    socket.emit('online-players', Array.from(onlinePlayers.values()));
  });

  socket.on('get-rooms', () => {
    const list = {};
    for (const [code, room] of Object.entries(rooms)) {
      if (room.status === 'lobby') {
        list[code] = {
          code,
          name: room.name,
          players: room.players.map(p => ({ socketId: p.socketId, user: p.user })),
          maxPlayers: room.maxPlayers,
          playerCount: room.players.length,
          status: room.status
        };
      }
    }
    socket.emit('room-list-update', list);
  });

  socket.on('create-room', (data, callback) => {
    const code = generateRoomCode();
    rooms[code] = {
      code,
      name: data.name || 'Room',
      host: socket.id,
      players: [{ socketId: socket.id, user: user || { id: socket.id, username: data.name || 'Player', avatar: null } }],
      status: 'lobby',
      currentDrawer: null,
      currentDrawerIndex: 0,
      currentWord: null,
      round: 1,
      maxPlayers: Math.min(data.maxPlayers || 16, 16),
      maxRounds: data.rounds || 5,
      drawTime: data.drawTime || 60,
      language: data.language || 'en',
      visibility: data.visibility || 'public',
      scores: {},
      usedWords: [],
      guessedCorrectly: new Set(),
      wordHint: null,
      timerInterval: null,
      wordChoiceTimeout: null,
      roundStartTime: null,
      autoStartInterval: null
    };
    rooms[code].scores[socket.id] = 0;
    socket.join(code);
    socket.roomCode = code;
    io.emit('public-rooms', getPublicRoomsList());
    callback({ success: true, code });
  });

  socket.on('join-room', (data, callback) => {
    const code = data.code.toUpperCase();
    let room = rooms[code];
    if (!room) return callback({ error: 'Room not found' });
    if (room.pendingDelete) {
      clearTimeout(room.pendingDelete);
      delete room.pendingDelete;
    }
    if (room.players.length >= (room.maxPlayers || 16)) return callback({ error: 'Room full' });
    if (room.status !== 'lobby') return callback({ error: 'Game already started' });

    let isRejoin = false;
    const existingIdx = room.players.findIndex(p => p.user?.id === user?.id);
    if (existingIdx !== -1) {
      const oldId = room.players[existingIdx].socketId;
      if (oldId !== socket.id && room.scores[oldId] !== undefined) {
        room.scores[socket.id] = room.scores[oldId];
        delete room.scores[oldId];
      }
      room.players[existingIdx].socketId = socket.id;
      room.players[existingIdx].user = user || room.players[existingIdx].user;
      if (room.host === oldId) room.host = socket.id;
      if (room.currentDrawer === oldId) room.currentDrawer = socket.id;
      isRejoin = true;
    } else {
      room.players.push({ socketId: socket.id, user: user || { id: socket.id, username: data.name || 'Player', avatar: null } });
      room.scores[socket.id] = 0;
    }
    socket.join(code);
    socket.roomCode = code;

    const playerState = getPlayerState(room);

    if (isRejoin) {
      io.to(code).emit('player-joined', { players: playerState });
    } else {
      io.to(code).emit('player-joined', { players: playerState });
      io.to(code).emit('chat-message', {
        type: 'system',
        text: `${user?.username || 'Player'} joined`
      });
    }
    io.emit('public-rooms', getPublicRoomsList());

    if (!isRejoin && room.players.length >= 2 && room.status === 'lobby') {
      startAutoCountdown(room);
    }

    callback({
      success: true,
      code,
      room: {
        code: room.code,
        name: room.name,
        host: room.host,
        players: playerState,
        status: room.status,
        maxRounds: room.maxRounds,
        drawTime: room.drawTime,
        language: room.language,
        round: room.round,
        maxPlayers: room.maxPlayers,
        currentDrawer: room.currentDrawer,
        scores: room.scores
      }
    });
  });

  socket.on('rejoin-room', (data, callback) => {
    const code = data.code.toUpperCase();
    const room = rooms[code];
    if (!room) return callback({ error: 'Room not found' });
    const existingPlayer = room.players.find(p => p.user?.id === user?.id);
    if (existingPlayer) {
      const oldId = existingPlayer.socketId;
      if (oldId !== socket.id && room.scores[oldId] !== undefined) {
        room.scores[socket.id] = room.scores[oldId];
        delete room.scores[oldId];
      }
      existingPlayer.socketId = socket.id;
      existingPlayer.user = user || existingPlayer.user;
      if (room.host === oldId) room.host = socket.id;
      if (room.currentDrawer === oldId) room.currentDrawer = socket.id;
    } else {
      if (room.players.length >= (room.maxPlayers || 16)) return callback({ error: 'Room full' });
      room.players.push({ socketId: socket.id, user: user || { id: socket.id, username: data.name || 'Player', avatar: null } });
      room.scores[socket.id] = 0;
    }
    socket.join(code);
    socket.roomCode = code;

    const playerState = getPlayerState(room);
    io.to(code).emit('player-joined', { players: playerState });

    callback({
      success: true,
      code,
      room: {
        code: room.code,
        name: room.name,
        host: room.host,
        players: playerState,
        status: room.status,
        maxRounds: room.maxRounds,
        drawTime: room.drawTime,
        language: room.language,
        round: room.round,
        maxPlayers: room.maxPlayers,
        currentDrawer: room.currentDrawer,
        scores: room.scores,
        currentWord: room.currentWord,
        wordHint: room.wordHint ? room.wordHint.join(' ') : null
      }
    });
  });

  socket.on('start-game', () => {
    const room = getRoom(socket);
    if (!room || room.host !== socket.id) return;
    cancelAutoCountdown(room);
    room.status = 'playing';
    room.currentDrawerIndex = 0;
    room.round = 1;
    io.to(room.code).emit('game-starting', { players: room.players });
    io.emit('public-rooms', getPublicRoomsList());
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

      const speedBonus = Math.max(0, Math.min(30, 30 - Math.floor(elapsed / 2)));
      addXP(user?.id, 50 + speedBonus);
      if (room.guessedCorrectly.size === 1) {
        addXP(user?.id, 30);
      }

      room.players.forEach(p => {
        if (p.socketId === room.currentDrawer) {
          room.scores[p.socketId] = (room.scores[p.socketId] || 0) + 15;
        }
      });

      io.to(room.code).emit('correct-guess', {
        socketId: socket.id,
        username: user?.username || 'Player',
        avatar: user?.avatar,
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
        avatar: user?.avatar,
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

  socket.on('reaction', (data) => {
    const room = getRoom(socket);
    if (!room) return;
    io.to(room.code).emit('reaction', data);
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
    clearTimeout(room.roundFailsafeTimeout);
    cancelAutoCountdown(room);
    io.to(room.code).emit('game-restarted', { players: room.players, host: room.host });
    io.emit('public-rooms', getPublicRoomsList());

    if (room.players.length >= 2) {
      startAutoCountdown(room);
    }
  });

  socket.on('disconnect', () => {
    onlinePlayers.delete(socket.id);
    io.emit('online-count', onlinePlayers.size);
    io.emit('online-players', Array.from(onlinePlayers.values()));

    const roomCode = socket.roomCode;
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;

    const idx = room.players.findIndex(p => p.socketId === socket.id);
    if (idx === -1) return;
    room.players.splice(idx, 1);

    if (room.autoStartInterval && room.players.length < 2) {
      cancelAutoCountdown(room);
    }

    if (room.players.length === 0) {
      clearInterval(room.timerInterval);
      clearTimeout(room.wordChoiceTimeout);
      clearTimeout(room.roundFailsafeTimeout);
      cancelAutoCountdown(room);
      room.pendingDelete = setTimeout(() => {
        delete rooms[roomCode];
        io.emit('public-rooms', getPublicRoomsList());
      }, 10000);
      return;
    }

    if (room.status === 'lobby') {
      if (room.host === socket.id) {
        room.host = room.players[0].socketId;
      }
      io.to(roomCode).emit('player-left', { players: getPlayerState(room), newHost: room.host });
      io.emit('public-rooms', getPublicRoomsList());
      return;
    }

    if (socket.id === room.currentDrawer) {
      clearInterval(room.timerInterval);
      clearTimeout(room.wordChoiceTimeout);
      clearTimeout(room.roundFailsafeTimeout);
      io.to(roomCode).emit('chat-message', {
        type: 'system',
        text: 'Round skipped - drawer disconnected'
      });
      room.round++;
      room.currentDrawerIndex++;
      startRound(room);
    } else {
      room.guessedCorrectly.delete(socket.id);
    }

    io.to(roomCode).emit('player-left', { players: getPlayerState(room), newHost: room.host });
    io.emit('public-rooms', getPublicRoomsList());
  });
});

server.listen(PORT, () => {
  console.log(`GalaxyDraw server running on port ${PORT}`);
});
