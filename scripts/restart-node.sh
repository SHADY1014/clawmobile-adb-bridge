#!/system/bin/sh
export HOME=/data/data/com.termux/files/home
export PATH=/data/data/com.termux/files/usr/bin:$HOME/.npm-global/bin:$PATH

# Kill old adb-node processes (not gateway)
for pid in $(ps -A | grep node | grep -v grep | awk '{print $1}'); do
  if ! ls -l /proc/$pid/cmdline 2>/dev/null | grep -q openclaw; then
    kill $pid 2>/dev/null
  fi
done
sleep 1

# Clear log and restart
> $HOME/adb-node.log
nohup /data/data/com.termux/files/usr/bin/node $HOME/src/adb-node.js >> $HOME/adb-node.log 2>&1 &
echo "Started PID: $!"
sleep 4
echo "=== Log ==="
tail -10 $HOME/adb-node.log
