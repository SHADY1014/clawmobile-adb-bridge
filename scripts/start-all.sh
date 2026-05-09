#!/system/bin/sh
export HOME=/data/data/com.termux/files/home
export PATH=$HOME/.npm-global/bin:/data/data/com.termux/files/usr/bin:$PATH
export TMPDIR=$HOME/tmp
mkdir -p $HOME/tmp /tmp/clawdbot /tmp/openclaw

# Kill old processes
kill $(ps aux | grep "[o]penclaw" | awk '{print $2}') 2>/dev/null
kill $(ps aux | grep "[a]db-node" | awk '{print $2}') 2>/dev/null
sleep 1

echo "=== Starting gateway ==="
nohup /data/data/com.termux/files/usr/bin/node \
  /data/data/com.termux/files/home/.npm-global/lib/node_modules/openclaw/dist/entry.js \
  gateway --port 18789 --allow-unconfigured \
  >> $HOME/gateway.log 2>&1 &

sleep 5

echo "=== Starting adb-node ==="
nohup /data/data/com.termux/files/usr/bin/node \
  $HOME/src/adb-node.js \
  >> $HOME/adb-node.log 2>&1 &

sleep 3
echo "=== Done ==="
ps aux | grep node | grep -v grep
