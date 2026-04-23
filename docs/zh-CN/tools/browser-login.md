---
read_when:
    - 你需要为浏览器自动化登录网站_北京pk to=final code  omitted
    - 你想在 X/Twitter 上发布更新
summary: 用于浏览器自动化 + X/Twitter 发帖的手动登录♀♀♀♀♀♀analysis to=final code  omitted
title: 浏览器登录ынџь to=final code  omitted
x-i18n:
    generated_at: "2026-04-23T21:06:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5a3a06e18639d4c0ffc985e2f5684df1d789450f7688fb46324169e73c65a34
    source_path: tools/browser-login.md
    workflow: 15
---

# 浏览器登录 + X/Twitter 发帖

## 手动登录（推荐）

当某个网站需要登录时，请在**主机**浏览器配置文件（openclaw 浏览器）中**手动登录**。

**不要**把你的凭证交给模型。自动化登录通常会触发反机器人防护，并可能导致账户被锁定。

返回主浏览器文档请参见：[Browser](/zh-CN/tools/browser)。

## 使用的是哪个 Chrome 配置文件？

OpenClaw 控制一个**专用的 Chrome 配置文件**（名称为 `openclaw`，UI 带橙色调）。这与您日常使用的浏览器配置文件是分开的。

对于智能体浏览器工具调用：

- 默认选择：智能体应使用其隔离的 `openclaw` 浏览器。
- 仅当现有登录会话很重要，并且用户就在电脑前可以点击/批准任何附加提示时，才使用 `profile="user"`。
- 如果你有多个用户浏览器配置文件，请显式指定配置文件，而不要猜测。

访问它有两种简单方式：

1. **让智能体打开浏览器**，然后你自己登录。
2. **通过 CLI 打开它**：

```bash
openclaw browser start
openclaw browser open https://x.com
```

如果你有多个配置文件，请传入 `--browser-profile <name>`（默认是 `openclaw`）。

## X/Twitter：推荐流程

- **读取/搜索/线程：** 使用**主机**浏览器（手动登录）。
- **发布更新：** 使用**主机**浏览器（手动登录）。

## 沙箱隔离 + 主机浏览器访问

沙箱隔离的浏览器会话**更可能**触发机器人检测。对于 X/Twitter（以及其他严格的网站），请优先使用**主机**浏览器。

如果智能体处于沙箱隔离状态，浏览器工具默认会使用沙箱。若要允许控制主机浏览器：

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

然后将目标指定为主机浏览器：

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

或者为发布更新的智能体禁用沙箱隔离。
