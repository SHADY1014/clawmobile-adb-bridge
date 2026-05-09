#!/data/data/com.termux/files/usr/bin/bash
export HOME=/data/data/com.termux/files/home
export PATH=/data/data/com.termux/files/usr/bin:$HOME/.npm-global/bin:$PATH

echo "=== Claw Chat ==="
echo ""

while true; do
  printf "\033[36mYou: \033[0m"
  read -r msg
  if [ -z "$msg" ]; then continue; fi
  if [ "$msg" = "quit" ] || [ "$msg" = "exit" ]; then
    echo "bye."
    break
  fi
  echo ""
  $HOME/.npm-global/bin/openclaw agent -m "$msg" --json 2>&1 \
    | grep -oE '"text":"[^"]*"' \
    | sed 's/^"text":"//;s/"$//' \
    | while IFS= read -r line; do
        printf "%b" "$line"
      done
  echo ""
  echo ""
done
