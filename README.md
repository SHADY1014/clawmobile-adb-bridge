# ClawMobile ADB Agent Bridge

<div align="center">

[🇨🇳 中文](#chinese) · [🇺🇸 English](#english)

AI 驱动的 Android 手机控制网关 · AI-powered Android phone control gateway

</div>

---

## chinese

# ClawMobile ADB Agent Bridge

<div align="center">

**通过微信发送自然语言指令操控手机**

[![English](https://img.shields.io/badge/lang-English-blue?style=flat-square)](#english)

</div>

---

## 项目简介

构建了一个**三层的 AI 手机控制架构**：

```
微信 (用户交互层) → OpenClaw Gateway (AI 代理层) → ADB Node Bridge (设备控制层) → Android 手机
```

用户通过微信发送自然语言指令 → OpenClaw AI 理解并规划 → ADB 桥执行屏幕点击、文本输入、应用操作 → 实现"用 AI 控制手机"。

---

## 架构

### 三层设计

| 层级 | 组件 | 作用 |
|------|------|------|
| **交互层** | 微信 / ClawBot 面板 | 用户通过聊天或 Web UI 发送指令 |
| **AI 代理层** | OpenClaw Gateway | LLM 驱动的 AI 代理（DeepSeek），工具规划，通道路由 |
| **设备控制层** | ADB Node Bridge (`adb-node.js`) | WebSocket ↔ ADB 桥，暴露手机控制 API |

### 通信流程

```
用户微信消息 → OpenClaw Gateway (AI 解析意图) → 调用 node.invoke → ADB Node Bridge → 执行 su -c ADB 命令 → Android 手机
```

### 认证与安全

- Ed25519 非对称加密密钥对用于设备身份认证
- Challenge-response 握手协议防重放攻击
- 基于作用域的权限控制（`node.execute`, `node.capabilities`）

---

## 创新点

1. **三层协议桥** — 不是简单的 ADB 脚本，而是 WebSocket 长连接 + Ed25519 加密认证的设备节点协议，让 AI agent 能实时调用手机能力
2. **微信集成** — 通过 OpenClaw 的微信通道，用户直接在微信里发消息就能控制手机，不需要额外 App
3. **ADB 设备节点** — `adb-node.js` 实现了一个完整的 OpenClaw 设备节点（Gateway Device Node），遵循 gateway RPC 协议，有认证、授权、作用域控制
4. **全栈 Root 方案** — 在已 Root 的 Android 设备上通过 KernelSU + Termux 环境运行，开机自启，持久化运行

### 与类似项目对比

| 项目 | 相似点 | 关键区别 |
|------|--------|----------|
| **Appium / UI Automator** | ADB + 手机自动化 | 无 AI 集成，纯脚本驱动 |
| **Termux:API** | 通过 Termux 调用手机能力 | HTTP 接口，非 WebSocket 长连接，无 AI agent 层 |
| **Android Agent (Nexusflow)** | AI 控制手机 | 独立 App，不支持微信通道 |
| **Rabbit R1 / Humane AI Pin** | AI + 手机操作 | 专用硬件，非通用 Android 手机 |
| **OpenClaw phone-control** | OpenClaw 自带插件 | 功能有限，使用系统 Accessibility API，非 ADB |

---

## 快速开始

### 前置条件

- 已 Root 的 Android 手机（KernelSU / Magisk）
- 安装 Termux
- Termux 中安装 OpenClaw CLI
- 启用 ADB 调试

### 安装

```bash
# 1. 在 Termux 中安装 OpenClaw
npm install -g openclaw

# 2. 配置 OpenClaw gateway

# 3. 启动 ADB 节点桥
node src/adb-node.js

# 4. 启动 OpenClaw gateway
openclaw gateway --port 18789

# 5. （可选）微信通道登录
openclaw channels login --channel openclaw-weixin
```

> 详细步骤参见 `scripts/setup-clawmobile.sh`。

### 开机自启

在 KernelSU 的 `/data/adb/service.d/` 中放置启动脚本，可实现开机自动启动 gateway 和 ADB 节点。

---

## ADB 桥工具列表

| 工具 | 描述 |
|------|------|
| `app.list` | 列出已安装应用 |
| `app.launch` | 通过包名启动应用 |
| `app.force_stop` | 强制停止应用 |
| `input.tap` | 点击屏幕坐标 |
| `input.swipe` | 滑动屏幕 |
| `input.text` | 输入文本 |
| `input.key` | 发送按键事件（HOME、BACK 等） |
| `screen.info` | 获取屏幕分辨率和密度 |
| `screen.capture` | 截屏 |
| `clipboard.get/set` | 读写剪贴板 |
| `shell.exec` | 以 root 身份执行任意 shell 命令 |

---

## 项目结构

```
├── src/                # 核心 JS 源码
│   ├── adb-node.js     # WebSocket ↔ ADB 桥
│   ├── proxy.js        # HTTP CONNECT 代理
│   ├── clipboard-stub.js
│   └── ...
├── config/             # 配置文件模板
│   ├── clawdbot.json
│   └── openclaw-updated.json
├── scripts/            # 部署和运维脚本
│   ├── setup-clawmobile.sh
│   ├── start-all.sh
│   └── ...
├── README.md           # 本文档（中文默认，英文可切换）
└── TOOLS.md            # ADB 节点工具参考
```

---

## 许可

MIT

---

## 免责声明

本项目仅供学习和研究。使用手机自动化功能时请遵守当地法律法规和用户协议。

---

## english

# ClawMobile ADB Agent Bridge

<div align="center">

**AI-powered Android phone control via WeChat**

[![中文](https://img.shields.io/badge/语言-中文-red?style=flat-square)](#chinese)

</div>

---

## Overview

A **3-layer AI phone control architecture**:

```
WeChat (Interaction) → OpenClaw Gateway (AI Agent) → ADB Node Bridge (Device Control) → Android Phone
```

Users send natural language commands via WeChat → OpenClaw AI understands and plans → ADB bridge executes screen taps, text input, app operations → AI-powered phone control.

---

## Architecture

| Layer | Component | Role |
|-------|-----------|------|
| **Interaction** | WeChat / ClawBot Dashboard | User sends commands via chat or web UI |
| **AI Agent** | OpenClaw Gateway | LLM-powered agent (DeepSeek), tool planning, channel routing |
| **Device Control** | ADB Node Bridge | WebSocket ↔ ADB bridge, exposes phone control APIs |

### Auth & Security

- Ed25519 asymmetric keypair for device identity
- Challenge-response handshake to prevent replay attacks
- Scope-based permission control (`node.execute`, `node.capabilities`)

---

## Innovation

1. **Three-Layer Protocol Bridge** — Not a simple ADB script. Full WebSocket persistent connection with Ed25519 encrypted auth as a device node, enabling real-time AI agent phone control
2. **WeChat Integration** — Control your phone directly from WeChat via OpenClaw's WeChat channel — no extra app needed
3. **ADB Device Node** — Implements a complete OpenClaw Gateway Device Node with RPC protocol, auth, authorization, and scope control
4. **Full-Stack Root Solution** — Runs on rooted Android via KernelSU + Termux, auto-start on boot, persistent operation

### Comparison

| Project | Similarity | Difference |
|---------|-----------|------------|
| **Appium / UI Automator** | ADB + automation | No AI, script-only |
| **Termux:API** | Phone control via Termux | HTTP, no WebSocket, no AI agent |
| **Android Agent (Nexusflow)** | AI controls phone | Standalone app, no WeChat |
| **Rabbit R1 / Humane AI Pin** | AI + phone ops | Dedicated hardware |
| **OpenClaw phone-control** | Built-in plugin | Limited, uses Accessibility API |

---

## Quick Start

### Prerequisites

- Rooted Android phone (KernelSU / Magisk)
- Termux installed
- OpenClaw CLI in Termux
- ADB debugging enabled

### Installation

```bash
# 1. Install OpenClaw (in Termux)
npm install -g openclaw

# 2. Configure OpenClaw gateway

# 3. Start ADB node bridge
node src/adb-node.js

# 4. Start OpenClaw gateway
openclaw gateway --port 18789

# 5. (Optional) WeChat channel login
openclaw channels login --channel openclaw-weixin
```

---

## ADB Bridge Tools

| Tool | Description |
|------|-------------|
| `app.list` | List installed apps |
| `app.launch` | Launch app by package name |
| `app.force_stop` | Force stop an app |
| `input.tap` | Tap screen at coordinates |
| `input.swipe` | Swipe on screen |
| `input.text` | Type text |
| `input.key` | Send key events (HOME, BACK, etc.) |
| `screen.info` | Get screen resolution/density |
| `screen.capture` | Take screenshot |
| `clipboard.get/set` | Read/write clipboard |
| `shell.exec` | Execute any shell command as root |

---

## License

MIT

---

## Disclaimer

For educational and research purposes only. Follow local laws and ToS when using phone automation.
