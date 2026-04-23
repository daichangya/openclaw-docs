---
read_when:
    - 你希望在 OpenClaw 中使用 Zalo Personal（非官方）支持
    - 你正在配置或开发 zalouser 插件
summary: Zalo Personal 插件：通过原生 zca-js 实现二维码登录 + 消息传递（插件安装 + 渠道配置 + 工具）
title: Zalo personal 插件
x-i18n:
    generated_at: "2026-04-23T20:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 806618b43d1285d1e47c9419b2f4f6f77c5784035c9b7073d0c5e97485876993
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal（插件）

通过插件为 OpenClaw 提供 Zalo Personal 支持，使用原生 `zca-js` 自动化普通 Zalo 个人账号。

> **警告：** 非官方自动化可能导致账号被暂停/封禁。使用风险由你自行承担。

## 命名

渠道 id 为 `zalouser`，以明确表示它自动化的是一个**个人 Zalo 用户账号**（非官方）。我们将 `zalo` 保留给未来可能出现的官方 Zalo API 集成。

## 运行位置

该插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器**上安装/配置该插件，然后重启 Gateway 网关。

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

动作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

渠道消息动作还支持用于消息 reaction 的 `react`。
