#!/system/bin/sh
export HOME=/data/data/com.termux/files/home
export PATH=/data/data/com.termux/files/usr/bin:$HOME/.npm-global/bin:$PATH
NODE=/data/data/com.termux/files/usr/bin/node
GATEWAY=$HOME/.npm-global/lib/node_modules/openclaw/dist/entry.js
ADBNODE=$HOME/src/adb-node.js

# Kill all node processes
echo "Killing old processes..."
for pid in $(ps aux | grep node | grep -v grep | awk '{print $2}'); do
  kill $pid 2>/dev/null
done
sleep 2

# Clear logs
> $HOME/gateway.log
> $HOME/adb-node.log

# Start gateway
echo "Starting gateway..."
nohup $NODE $GATEWAY gateway --port 18789 --allow-unconfigured >> $HOME/gateway.log 2>&1 &
GWPID=$!
echo "Gateway PID: $GWPID"
sleep 8

# Verify gateway
if ss -tlnp | grep -q 18789; then
  echo "Gateway is listening"
else
  echo "Gateway FAILED to start"
  cat $HOME/gateway.log
  exit 1
fi

# Start adb-node
echo "Starting adb-node..."
nohup $NODE $ADBNODE >> $HOME/adb-node.log 2>&1 &
ADBPID=$!
echo "adb-node PID: $ADBPID"
sleep 5

# Show status
echo ""
echo "=== Gateway log ==="
tail -5 $HOME/gateway.log
echo ""
echo "=== adb-node log ==="
cat $HOME/adb-node.log
echo ""
echo "=== Node status ==="
$NODE $HOME/.npm-global/bin/openclaw nodes status 2>&1 | head -10
