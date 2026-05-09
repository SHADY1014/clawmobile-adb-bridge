#!/data/data/com.termux/files/usr/bin/bash
# ClawMobile Gateway 启动脚本
# 在 Termux 里直接运行: bash start-clawmobile.sh

export HOME=/data/data/com.termux/files/home
export PATH=$HOME/.npm-global/bin:$PATH
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890

echo "Starting ClawMobile Gateway..."
echo "Model: deepseek/deepseek-v4-pro"
echo "Port: 18789"

node $HOME/.npm-global/lib/node_modules/clawdbot/dist/entry.js gateway --port 18789
