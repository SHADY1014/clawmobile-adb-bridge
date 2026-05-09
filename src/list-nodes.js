// Query gateway for node list and their commands
const crypto = require('crypto');
const fs = require('fs');

function base64url(buf) { return buf.toString('base64url'); }
function hex(buf) { return buf.toString('hex'); }

const KEY_FILE = '/data/data/com.termux/files/home/.openclaw/adb-node/ed25519.json';
const jwk = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
const keys = {
  publicKey: crypto.createPublicKey({ key: jwk.publicKey, format: 'jwk' }),
  privateKey: crypto.createPrivateKey({ key: jwk.privateKey, format: 'jwk' }),
};
const pubDer = keys.publicKey.export({ type: 'spki', format: 'der' });
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const rawKey = pubDer.subarray(ED25519_SPKI_PREFIX.length);
const deviceId = hex(crypto.createHash('sha256').update(rawKey).digest());
const pubB64 = base64url(rawKey);

const SESSION_FILE = '/data/data/com.termux/files/home/.openclaw/adb-node/session.json';
let deviceToken = '';
try { deviceToken = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')).deviceToken; } catch {}

let msgId = 0;
const WebSocket = globalThis.WebSocket;
const ws = new WebSocket('ws://127.0.0.1:18789');

ws.addEventListener('open', () => {});

ws.addEventListener('message', (event) => {
  const frame = JSON.parse(event.data.toString());

  if (frame.event === 'connect.challenge') {
    const nonce = frame.payload.nonce;
    const signedAt = Date.now();
    const authPayload = ['v3', deviceId, 'webchat-ui', 'webchat', 'webchat', 'chat.agent,chat.messages', String(signedAt), deviceToken, nonce, 'android-webchat', ''].join('|');
    const sig = crypto.sign(null, Buffer.from(authPayload, 'utf8'), keys.privateKey);
    const sigB64 = base64url(sig);

    ws.send(JSON.stringify({
      type: 'req', id: 'p' + (++msgId), method: 'connect',
      params: {
        minProtocol: 3, maxProtocol: 3,
        client: { id: 'webchat-ui', version: '1.0.0', platform: 'android-webchat', mode: 'webchat' },
        role: 'webchat',
        scopes: ['chat.agent', 'chat.messages'],
        device: { id: deviceId, publicKey: pubB64, signature: sigB64, signedAt, nonce },
      },
    }));
    return;
  }

  if (frame.ok && frame.payload?.type === 'hello-ok') {
    // Request node list
    ws.send(JSON.stringify({ type: 'req', id: 'p' + (++msgId), method: 'node.list', params: {} }));
    return;
  }

  // Print node.list result
  if (frame.ok && frame.type === 'res') {
    console.log('RES:', JSON.stringify(frame.payload, null, 2));
  }
  if (!frame.ok) {
    console.log('ERR:', frame.error?.message, frame.error?.code);
    process.exit(1);
  }
});

ws.addEventListener('error', (e) => { console.log('WS ERR:', e.message); process.exit(1); });
ws.addEventListener('close', (e) => { console.log('WS CLOSE:', e.code); process.exit(1); });
setTimeout(() => { process.exit(0); }, 8000);
