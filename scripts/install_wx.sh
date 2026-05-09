#!/system/bin/sh
export HOME=/data/data/com.termux/files/home
export PATH=/data/data/com.termux/files/usr/bin:$HOME/.npm-global/bin:$PATH
export npm_config_prefix=$HOME/.npm-global

# Delete proxy first
$HOME/.npm-global/bin/node $HOME/.npm-global/lib/node_modules/npm/bin/npm-cli.js config delete proxy 2>/dev/null
$HOME/.npm-global/bin/node $HOME/.npm-global/lib/node_modules/npm/bin/npm-cli.js config delete https-proxy 2>/dev/null

# Install WeChat plugin via openclaw
$HOME/.npm-global/bin/node $HOME/.npm-global/lib/node_modules/openclaw/openclaw.mjs plugins install @tencent-weixin/openclaw-weixin

echo DONE_EXIT=$?
