#!/data/data/com.termux/files/usr/bin/bash
export HOME=/data/data/com.termux/files/home
export PATH=/data/data/com.termux/files/usr/bin:$HOME/.npm-global/bin:$PATH

# Clear npm proxy
npm config delete proxy 2>/dev/null
npm config delete https-proxy 2>/dev/null

# Install WeChat plugin
openclaw plugins install @tencent-weixin/openclaw-weixin

echo DONE_EXIT=$?
