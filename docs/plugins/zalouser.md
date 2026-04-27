---
read_when:
    - 你想在 OpenClaw 中使用 Zalo Personal（非官方）支持
    - 你正在配置或开发 zalouser 插件
summary: Zalo Personal 插件：通过原生 zca-js 进行二维码登录 + 消息收发（插件安装 + 渠道配置 + 工具）
title: Zalo personal 插件
x-i18n:
    generated_at: "2026-04-23T23:01:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal（插件）

通过插件为 OpenClaw 提供 Zalo Personal 支持，使用原生 `zca-js` 自动化普通 Zalo 个人账号。

> **警告：** 非官方自动化可能导致账号被暂停或封禁。请自行承担风险。

## 命名

渠道 id 为 `zalouser`，以明确表示这是对 **个人 Zalo 用户账号**（非官方）的自动化支持。我们保留 `zalo`，以便未来可能接入官方 Zalo API 集成。

## 运行位置

该插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器上**安装/配置它，然后重启 Gateway 网关。

不需要外部 `zca`/`openzca` CLI 二进制文件。

## 安装

### 方案 A：从 npm 安装

```bash
openclaw plugins install @openclaw/zalouser
```

之后重启 Gateway 网关。

### 方案 B：从本地文件夹安装（开发）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之后重启 Gateway 网关。

## 配置

渠道配置位于 `channels.zalouser` 下（不是 `plugins.entries.*`）：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## 智能体工具

工具名称：`zalouser`

操作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

渠道消息操作还支持 `react`，用于消息回应。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [社区插件](/zh-CN/plugins/community)
