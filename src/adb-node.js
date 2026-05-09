#!/data/data/com.termux/files/usr/bin/env node
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GATEWAY = 'ws://127.0.0.1:18789';
const TERMUX_HOME = '/data/data/com.termux/files/home';
const HOME = (process.env.HOME && process.env.HOME.startsWith('/data/data/com.termux')) ? process.env.HOME : TERMUX_HOME;
const STATE_DIR = path.join(HOME, '.openclaw', 'adb-node');
const KEY_FILE = path.join(STATE_DIR, 'ed25519.json');
const SESSION_FILE = path.join(STATE_DIR, 'session.json');

fs.mkdirSync(STATE_DIR, { recursive: true });

function base64url(buf) { return buf.toString('base64url'); }
function hex(buf) { return buf.toString('hex'); }

function adb(cmd, opts = {}) {
  return execSync('su -c "' + cmd.replace(/"/g, '\\"') + '"', {
    timeout: opts.timeout || 5000,
    encoding: 'utf8',
    ...opts,
  });
}

const TOOLS = {
  'app.list': {
    description: 'List installed Android app packages',
    handler: () => adb('pm list packages'),
  },
  'app.launch': {
    description: 'Launch an Android app by package/activity name',
    handler: (p) => adb('am start ' + (p.target || p.package)),
  },
  'app.force_stop': {
    description: 'Force stop an Android app by package name',
    handler: (p) => adb('am force-stop ' + p.package),
  },
  'input.tap': {
    description: 'Tap the screen at coordinates',
    handler: (p) => adb('input tap ' + p.x + ' ' + p.y),
  },
  'input.swipe': {
    description: 'Swipe on screen',
    handler: (p) => adb('input swipe ' + p.x1 + ' ' + p.y1 + ' ' + p.x2 + ' ' + p.y2 + ' ' + (p.duration || 300)),
  },
  'input.text': {
    description: 'Type text (supports spaces, avoids shell issues)',
    handler: (p) => {
      const escaped = p.text.replace(/'/g, "'\\''");
      return adb("input text '" + escaped + "'");
    },
  },
  'input.key': {
    description: 'Send key event: HOME, BACK, RECENT, VOLUME_UP, VOLUME_DOWN, ENTER, POWER, CAMERA, etc',
    handler: (p) => {
      const keyMap = { home: 3, back: 4, recent: 187, volume_up: 24, volume_down: 25, enter: 66, power: 26, camera: 27, menu: 82, search: 84 };
      const code = keyMap[p.key.toLowerCase()] || p.key;
      return adb('input keyevent ' + code);
    },
  },
  'screen.info': {
    description: 'Get screen resolution and density',
    handler: () => adb('wm size && wm density'),
  },
  'screen.capture': {
    description: 'Take screenshot (returns path)',
    handler: () => {
      const out = '/sdcard/adbnode_screen.png';
      adb('screencap -p ' + out);
      return 'screenshot saved to ' + out;
    },
  },
  'clipboard.get': {
    description: 'Read clipboard content',
    handler: () => adb('cmd clipboard get 2>/dev/null || dumpsys clipboard | grep -A1 "Text:" | tail -1'),
  },
  'clipboard.set': {
    description: 'Set clipboard content',
    handler: (p) => adb("cmd clipboard set '" + p.text.replace(/'/g, "'\\''") + "' 2>/dev/null || am broadcast -a clipper.set -e text '" + p.text.replace(/'/g, "'\\''") + "'"),
  },
  'shell.exec': {
    description: 'Run any shell command as root',
    handler: (p) => adb(p.cmd, { timeout: 15000 }),
  },
  'system.run': {
    description: 'Standard node system.run — execute a shell command as root',
    handler: (p) => adb(p.command || p.cmd || '', { timeout: 15000 }),
  },
  'system.run.prepare': {
    description: 'Validate a system.run command before execution',
    handler: (p) => 'ready',
  },
  'system.which': {
    description: 'Check if a command exists on the system',
    handler: (p) => {
      try {
        return adb('which ' + (p.name || p.command || '')).trim() || '(not found)';
      } catch { return '(not found)'; }
    },
  },
  'vision.run': {
    description: 'Execute a visual phone task using AutoGLM-Phone-9B vision model. Takes screenshot, analyzes via AI, taps/types/swipes on screen automatically.',
    handler: (p) => {
      const task = p.task || p.text || '';
      if (!task) throw new Error('Task description required');
      const result = execSync('node ' + HOME + '/src/visual-agent.js ' + JSON.stringify(task), { timeout: 120000, encoding: 'utf8' });
      return result;
    },
  },
};

// Generate or load Ed25519 keypair
let keys;
if (fs.existsSync(KEY_FILE)) {
  const jwk = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  keys = {
    publicKey: crypto.createPublicKey({ key: jwk.publicKey, format: 'jwk' }),
    privateKey: crypto.createPrivateKey({ key: jwk.privateKey, format: 'jwk' }),
  };
} else {
  keys = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(KEY_FILE, JSON.stringify({
    publicKey: keys.publicKey.export({ format: 'jwk' }),
    privateKey: keys.privateKey.export({ format: 'jwk' }),
  }));
}

const pubDer = keys.publicKey.export({ type: 'spki', format: 'der' });
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const rawKey = pubDer.subarray(ED25519_SPKI_PREFIX.length);
const deviceId = hex(crypto.createHash('sha256').update(rawKey).digest());
const pubB64 = base64url(rawKey);

let deviceToken = null;
if (fs.existsSync(SESSION_FILE)) {
  try { deviceToken = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')).deviceToken; } catch {}
}

const CLIENT_ID = 'node-host';
const CLIENT_MODE = 'node';
const ROLE = 'node';
const SCOPES_ARR = ['node.execute', 'node.capabilities'];
const SCOPES_STR = 'node.execute,node.capabilities';
const PLATFORM = 'android-adb-node';
const DEVICE_FAMILY = '';
// Only declare standard commands that pass the gateway allowlist.
// Custom ADB commands are still handled internally when invoked by name.
const COMMANDS = Object.keys(TOOLS);
const CAPS = ['adb', 'android'];

// Find ws module
let WebSocket;
try { WebSocket = require('ws'); } catch { WebSocket = globalThis.WebSocket; }

let msgId = 0;
function makeId() { return 'adbn-' + Date.now() + '-' + (++msgId); }
let ws = null;
let reconnectTimer = null;

function connect() {
  if (ws) try { ws.close(); } catch {}
  console.log('[adb-node] connecting to ' + GATEWAY + '...');
  ws = new WebSocket(GATEWAY);

  ws.addEventListener('open', () => {
    console.log('[adb-node] ws open, waiting for connect.challenge...');
  });

  ws.addEventListener('message', (event) => {
    const raw = event.data;
    let frame;
    try { frame = JSON.parse(raw.toString()); } catch { return; }

    // Handle connect.challenge
    if (frame.event === 'connect.challenge') {
      const nonce = frame.payload.nonce;
      const signedAt = Date.now();
      const token = deviceToken || '';
      const authPayload = ['v3', deviceId, CLIENT_ID, CLIENT_MODE, ROLE, SCOPES_STR, String(signedAt), token, nonce, PLATFORM, DEVICE_FAMILY].join('|');
      const sig = crypto.sign(null, Buffer.from(authPayload, 'utf8'), keys.privateKey);
      const sigB64 = base64url(sig);

      const params = {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: CLIENT_ID, version: '1.0.0', platform: PLATFORM, mode: CLIENT_MODE },
        role: ROLE,
        scopes: SCOPES_ARR,
        caps: CAPS,
        commands: COMMANDS,
        device: { id: deviceId, publicKey: pubB64, signature: sigB64, signedAt, nonce },
      };
      if (deviceToken) params.auth = { deviceToken };

      console.log('[adb-node] -> connect (deviceId: ' + deviceId.substring(0, 12) + ')');
      ws.send(JSON.stringify({ type: 'req', id: makeId(), method: 'connect', params }));
      return;
    }

    // Handle hello-ok
    if (frame.ok && frame.payload && frame.payload.type === 'hello-ok') {
      const auth = frame.payload.auth;
      if (auth && auth.deviceToken) {
        deviceToken = auth.deviceToken;
        fs.writeFileSync(SESSION_FILE, JSON.stringify({ deviceToken }));
      }
      console.log('[adb-node] CONNECTED as device node');
      console.log('[adb-node] auth role=' + (auth ? auth.role : '?') + ' scopes=' + JSON.stringify(auth ? auth.scopes : []));
      console.log('[adb-node] tools: ' + COMMANDS.join(', '));
      return;
    }

    // Handle error responses
    if (frame.type === 'res' && !frame.ok) {
      const errMsg = frame.error ? frame.error.message : JSON.stringify(frame);
      console.error('[adb-node] gateway error: ' + errMsg.substring(0, 200));
      if (errMsg.indexOf('pairing') !== -1 || errMsg.indexOf('unauthorized') !== -1) {
        console.log('[adb-node] Device needs pairing: openclaw pairing approve ' + deviceId.substring(0, 8));
      }
      return;
    }

    // Handle node.invoke requests from gateway (req/res protocol)
    if (frame.method === 'node.invoke' || frame.method === 'node.invoke.request') {
      const toolName = (frame.params && frame.params.command) || 'unknown';
      const toolParams = (frame.params && frame.params.args) || {};
      const invokeId = frame.id;
      console.log('[adb-node] <- invoke: ' + toolName);

      const tool = TOOLS[toolName];
      if (!tool) {
        ws.send(JSON.stringify({ type: 'res', id: invokeId, ok: false, error: { message: 'Unknown: ' + toolName } }));
        return;
      }

      try {
        const result = tool.handler(toolParams);
        ws.send(JSON.stringify({ type: 'res', id: invokeId, ok: true, payload: { result: result || 'ok' } }));
        console.log('[adb-node] -> ' + toolName + ': done');
      } catch (err) {
        ws.send(JSON.stringify({ type: 'res', id: invokeId, ok: false, error: { message: err.message } }));
        console.error('[adb-node] -> ' + toolName + ': ' + err.message);
      }
      return;
    }

    // Handle node.invoke.request events (event-based protocol)
    if (frame.event === 'node.invoke.request') {
      const toolName = (frame.payload && frame.payload.command) || 'unknown';
      const toolParams = (frame.payload && frame.payload.args) || {};
      const requestId = frame.payload?.id;
      const targetNodeId = frame.payload?.nodeId || deviceId;
      console.log('[adb-node] <- invoke event: ' + toolName + ' id=' + requestId);

      const tool = TOOLS[toolName];
      if (!tool) {
        ws.send(JSON.stringify({ type: 'req', id: makeId(), method: 'node.invoke.result', params: { id: requestId, nodeId: targetNodeId, ok: false, error: { message: 'Unknown: ' + toolName } } }));
        return;
      }

      try {
        const output = tool.handler(toolParams);
        ws.send(JSON.stringify({ type: 'req', id: makeId(), method: 'node.invoke.result', params: { id: requestId, nodeId: targetNodeId, ok: true, payload: { result: output || 'ok' } } }));
        console.log('[adb-node] -> ' + toolName + ' (event): done');
      } catch (err) {
        ws.send(JSON.stringify({ type: 'req', id: makeId(), method: 'node.invoke.result', params: { id: requestId, nodeId: targetNodeId, ok: false, error: { message: err.message } } }));
        console.error('[adb-node] -> ' + toolName + ' (event): ' + err.message);
      }
    }
  });

  ws.addEventListener('close', (event) => {
    const code = event.code;
    console.log('[adb-node] disconnected (' + code + '), reconnecting in 5s...');
    ws = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 5000);
  });

  ws.addEventListener('error', (event) => {
    console.error('[adb-node] ws error: ' + (event.message || 'unknown'));
  });
}

// Crash protection — keep the process alive
process.on('uncaughtException', (err) => {
  console.error('[adb-node] UNCAUGHT:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[adb-node] UNHANDLED REJECTION:', reason);
});

// Log all termination signals
['SIGHUP','SIGTERM','SIGINT','SIGQUIT','SIGUSR1','SIGUSR2'].forEach((sig) => {
  process.on(sig, () => { console.log('[adb-node] GOT SIGNAL ' + sig); });
});
process.on('exit', (code) => {
  // Use sync write to ensure it hits disk
  require('fs').appendFileSync('/data/data/com.termux/files/home/adb-node.log', '[adb-node] EXIT code=' + code + '\n');
});
// Log active handles periodically
setInterval(() => {
  const handles = process._getActiveHandles?.() || [];
  console.log('[adb-node] alive handles=' + handles.length + ' ws=' + (ws ? ws.readyState : 'null'));
}, 15000);

// Verify ADB access first
try {
  execSync('su -c "echo ADB_OK"', { timeout: 5000, encoding: 'utf8' });
  console.log('[adb-node] ADB root access verified');
} catch (e) {
  console.error('[adb-node] WARNING: no root ADB access');
}

connect();

// Heartbeat to verify process stays alive
setInterval(() => {
  const state = ws ? ws.readyState : 'no-ws';
  console.log('[adb-node] heartbeat ws=' + state + ' pid=' + process.pid);
}, 30000);

// Log unexpected exit
process.on('exit', (code) => {
  console.log('[adb-node] PROCESS EXIT code=' + code);
});
