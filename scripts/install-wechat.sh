#!/data/data/com.termux/files/usr/bin/bash
export HOME=/data/data/com.termux/files/home
export PATH=/data/data/com.termux/files/usr/bin:$HOME/.npm-global/bin:$PATH
openclaw plugins install "@tencent-weixin/openclaw-weixin"
echo "exit_code=$?"
