#!/data/data/com.termux/files/usr/bin/bash
# =============================================
# ClawMobile + DeepSeek V4 一键部署脚本
# =============================================
set -e

export HOME=/data/data/com.termux/files/home
export PREFIX=/data/data/com.termux/files/usr
export PATH=$PREFIX/bin:$HOME/.npm-global/bin:$PATH
export LD_LIBRARY_PATH=$PREFIX/lib
export TMPDIR=$HOME/tmp

# Clash proxy
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890

echo "=========================================="
echo "  ClawMobile + DeepSeek V4 Setup"
echo "=========================================="

# ---- Step 1: Update packages ----
echo "[1/5] Updating packages..."
export DEBIAN_FRONTEND=noninteractive

# Fix any previously broken packages
dpkg --configure -a --force-confdef --force-confold 2>/dev/null || true

apt update -y -qq
apt upgrade -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
echo "  -> Done"

# ---- Step 2: Install dependencies ----
echo "[2/5] Installing dependencies..."
apt install -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" nodejs git openssh tmux coreutils
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
export PATH=$HOME/.npm-global/bin:$PATH
echo "  -> Done. Node: $(node -v), npm: $(npm -v)"

# ---- Step 3: Install OpenClaw ----
echo "[3/5] Installing OpenClaw (this may take a while)..."
npm install -g openclaw@beta --no-audit --no-fund 2>&1 | tail -5
echo "  -> Done. OpenClaw: $(which openclaw 2>/dev/null || echo 'checking...')"

# ---- Step 4: Configure DeepSeek ----
echo "[4/5] Configuring DeepSeek V4..."
mkdir -p ~/.clawdbot

cat > ~/.clawdbot/clawdbot.json << 'EOF'
{
  "models": {
    "mode": "merge",
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com/anthropic",
        "apiKey": "YOUR_DEEPSEEK_API_KEY",
        "api": "anthropic",
        "models": [
          {
            "id": "deepseek-v4-pro",
            "name": "DeepSeek V4 Pro",
            "reasoning": true,
            "input": ["text"],
            "contextWindow": 128000,
            "maxTokens": 65536
          },
          {
            "id": "deepseek-v4-flash",
            "name": "DeepSeek V4 Flash",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-v4-pro"
      }
    }
  }
}
EOF

echo 'export DEEPSEEK_API_KEY="YOUR_DEEPSEEK_API_KEY"' >> ~/.bashrc
echo "  -> Config written to ~/.clawdbot/clawdbot.json"

# ---- Step 5: Test & Launch ----
echo "[5/5] Testing configuration..."
openclaw doctor 2>&1 || echo "  (doctor check skipped - run manually if needed)"

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "  Start gateway:"
echo "    tmux new -s openclaw"
echo "    openclaw gateway --port 18789"
echo ""
echo "  Then from PC browser:"
echo "    http://<phone-ip>:18789"
echo ""
echo "  Attach to session:"
echo "    tmux attach -t openclaw"
echo "=========================================="
