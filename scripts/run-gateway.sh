#!/data/data/com.termux/files/usr/bin/bash

export HOME=/data/data/com.termux/files/home
export PATH=$HOME/.npm-global/bin:/data/data/com.termux/files/usr/bin:$PATH
export TMPDIR=$HOME/tmp

mkdir -p $HOME/tmp /tmp/openclaw

# Kill everything
echo ">>> Cleaning up..."
su -c "pkill -9 -f 'src/adb-node.js'" 2>/dev/null || true
su -c "pkill -9 -f 'openclaw/dist/entry.js'" 2>/dev/null || true
su -c "pkill -9 -f 'openclaw'" 2>/dev/null || true
sleep 2

# Reset pairing state to avoid "scope upgrade" deadlock
echo '{}' > $HOME/.openclaw/devices/paired.json
echo '{}' > $HOME/.openclaw/nodes/paired.json
rm -f $HOME/.openclaw/adb-node/session.json

# Start ADB node first (will wait for gateway)
echo ">>> Starting adb-node..."
> $HOME/adb-node.log
nohup node $HOME/src/adb-node.js >> $HOME/adb-node.log 2>&1 &
echo "    adb-node PID: $!"

sleep 2
cat $HOME/adb-node.log

# Start gateway
echo ""
echo ">>> Starting Gateway..."
> $HOME/gateway.log
exec node $HOME/.npm-global/lib/node_modules/openclaw/dist/entry.js gateway --port 18789 2>&1 | tee $HOME/gateway.log
