#!/usr/bin/env bash
# phone-type.sh — 从电脑输入文本，推到手机剪贴板并粘贴到当前输入框
# 用法: ./phone-type.sh "你要打的文字"

if [ -z "$1" ]; then
  echo "用法: ./phone-type.sh \"要输入的文字\""
  exit 1
fi

ADB="/c/Users/Shady/platform-tools/adb"
TEXT="$1"

# 写文字到本地文件 (UTF-8)
echo "$TEXT" > /tmp/phone_type_text.txt

# 推到手机
MSYS_NO_PATHCONV=1 "$ADB" push /tmp/phone_type_text.txt /sdcard/phone_type_text.txt 2>&1

# 在手机上设剪贴板（读文件避开 shell 编码问题）
MSYS_NO_PATHCONV=1 "$ADB" shell "su -c 'cat /sdcard/phone_type_text.txt | while read line; do cmd clipboard set \"\$line\" 2>/dev/null; done; am broadcast -a clipper.set -e text \"\$(cat /sdcard/phone_type_text.txt)\" 2>/dev/null; echo DONE'"

echo "已推到手机剪贴板: $TEXT"
echo "在看手机上，长按输入框点「粘贴」即可"
