#!/system/bin/sh
TEXT=$(cat /sdcard/jd_search.txt)
cmd clipboard set "$TEXT" 2>/dev/null || am broadcast -a clipper.set -e text "$TEXT" 2>/dev/null
echo "clipboard set done"
