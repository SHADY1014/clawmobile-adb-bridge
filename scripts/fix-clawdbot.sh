#!/data/data/com.termux/files/usr/bin/bash
export HOME=/data/data/com.termux/files/home
export PATH=/data/data/com.termux/files/usr/bin:$HOME/.npm-global/bin:$PATH
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890

echo "[fix] Installing missing strip-ansi..."
cd $HOME/.npm-global/lib/node_modules/clawdbot
npm install strip-ansi --legacy-peer-deps --no-audit --no-fund 2>&1
echo "[fix] Done. Exit code: $?"

echo "[test] Testing clawdbot..."
node $HOME/.npm-global/lib/node_modules/clawdbot/dist/entry.js --help 2>&1 | head -15
echo "[test] Exit code: $?"
