---
read_when:
    - 你需要登录网站以进行浏览器自动化
    - 你想将更新发布到 X/Twitter
summary: 用于浏览器自动化 + X/Twitter 发帖的手动登录
title: 浏览器登录
x-i18n:
    generated_at: "2026-04-23T23:04:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 15
---

# 浏览器登录 + X/Twitter 发帖

## 手动登录（推荐）

当某个网站要求登录时，请在**主机**浏览器配置文件（即 openclaw 浏览器）中**手动登录**。

**不要**将你的凭证提供给模型。自动化登录通常会触发反机器人防护，并可能导致账号被锁定。

返回主浏览器文档：[浏览器](/zh-CN/tools/browser)。

## 使用的是哪个 Chrome 配置文件？

OpenClaw 控制的是一个**专用 Chrome 配置文件**（名为 `openclaw`，UI 带橙色色调）。它与你日常使用的浏览器配置文件是分开的。

对于智能体浏览器工具调用：

- 默认选择：智能体应使用其隔离的 `openclaw` 浏览器。
- 仅当现有登录会话很重要，且用户本人就在电脑前可以点击/批准任何附加提示时，才使用 `profile="user"`。
- 如果你有多个用户浏览器配置文件，请显式指定配置文件，而不要猜测。

有两种简单方式访问它：

1. **让智能体打开浏览器**，然后你自己完成登录。
2. **通过 CLI 打开它**：

```bash
openclaw browser start
openclaw browser open https://x.com
```

如果你有多个配置文件，请传入 `--browser-profile <name>`（默认是 `openclaw`）。

## X/Twitter：推荐流程

- **阅读/搜索/线程：** 使用**主机**浏览器（手动登录）。
- **发布更新：** 使用**主机**浏览器（手动登录）。

## 沙箱隔离 + 主机浏览器访问

沙箱隔离浏览器会话**更容易**触发机器人检测。对于 X/Twitter（以及其他严格网站），请优先使用**主机**浏览器。

如果智能体处于沙箱隔离中，浏览器工具默认会使用沙箱。若要允许控制主机浏览器：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

然后将目标设为主机浏览器：

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

或者为负责发布更新的智能体禁用沙箱隔离。

## 相关

- [浏览器](/zh-CN/tools/browser)
- [浏览器 Linux 故障排除](/zh-CN/tools/browser-linux-troubleshooting)
- [浏览器 WSL2 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
