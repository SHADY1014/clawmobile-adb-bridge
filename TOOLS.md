# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Android ADB Node

A rooted Android device node is connected with ADB capabilities. All commands run as root on the device.

- **Node ID**: `<your-device-node-id>`
- **Capabilities**: adb, android

### How to use

Use the `exec` tool with `host: "node"` and `nodeId` set to the node ID above. The `command` is a standard Android shell command — the node executes it as root.

### Available operations

| Operation | Shell command |
|-----------|--------------|
| List installed packages | `pm list packages` |
| Launch app | `am start PACKAGE` |
| Force stop app | `am force-stop PACKAGE` |
| Tap screen | `input tap X Y` |
| Swipe | `input swipe X1 Y1 X2 Y2 [DURATION]` |
| Type text | `input text 'TEXT'` |
| Key event | `input keyevent CODE` (HOME=3, BACK=4, ENTER=66, POWER=26, VOLUME_UP=24, VOLUME_DOWN=25) |
| Screen info | `wm size && wm density` |
| Screenshot | `screencap -p /sdcard/adbnode_screen.png` |
| Read clipboard | `cmd clipboard get` |
| Set clipboard | `cmd clipboard set 'TEXT'` |
| Any root shell | Any shell command |

### Example

To list installed packages:
- tool: `exec`
- `host`: `node`
- `nodeId`: `<your-device-node-id>`
- `command`: `pm list packages | head -20`

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Related

- [Agent workspace](/concepts/agent-workspace)
