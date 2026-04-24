---
read_when:
    - 为 Claude Code / Codex / Gemini CLI 安装或配置 `acpx` harness
    - 启用 `plugin-tools` 或 OpenClaw-tools MCP 桥接器
    - 配置 ACP 权限模式
summary: 设置 ACP 智能体：`acpx` harness 配置、插件设置、权限
title: ACP 智能体——设置
x-i18n:
    generated_at: "2026-04-24T02:39:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

关于概览、运维手册和核心概念，请参见 [ACP 智能体](/zh-CN/tools/acp-agents)。
本页介绍 `acpx` harness 配置、MCP 桥接器的插件设置，以及权限配置。

## `acpx` harness 支持（当前）

当前 `acpx` 内置 harness 别名：

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI：`cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

当 OpenClaw 使用 `acpx` 后端时，除非你的 `acpx` 配置定义了自定义智能体别名，否则建议为 `agentId` 优先使用这些值。
如果你本地安装的 Cursor 仍然将 ACP 暴露为 `agent acp`，请在你的 `acpx` 配置中覆盖 `cursor` 智能体命令，而不是修改内置默认值。

直接使用 `acpx` CLI 时，也可以通过 `--agent <command>` 指向任意适配器，但这个原始逃生口是 `acpx` CLI 的功能（不是 OpenClaw 常规的 `agentId` 路径）。

## 必需配置

核心 ACP 基线配置：

```json5
{
  acp: {
    enabled: true,
    // 可选。默认值为 true；设为 false 可暂停 ACP 分发，同时保留 /acp 控制。
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

线程绑定配置与渠道适配器相关。以下是 Discord 的示例：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

如果基于线程绑定的 ACP 派生不起作用，请先检查适配器功能开关：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前会话绑定不需要创建子线程。它们需要一个活跃的会话上下文，以及一个暴露 ACP 会话绑定能力的渠道适配器。

参见 [Configuration Reference](/zh-CN/gateway/configuration-reference)。

## `acpx` 后端的插件设置

全新安装默认会启用内置的 `acpx` 运行时插件，因此 ACP 通常无需手动安装插件即可工作。

先运行：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想切换到本地开发检出版本，请使用显式插件路径：

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间安装本地工作区版本：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状态：

```text
/acp doctor
```

### `acpx` 命令与版本配置

默认情况下，内置的 `acpx` 插件使用其插件本地固定版本的二进制文件（插件包内的 `node_modules/.bin/acpx`）。启动时会先将后端注册为未就绪状态，并由后台任务验证 `acpx --version`；如果缺少该二进制文件或版本不匹配，它会运行 `npm install --omit=dev --no-save acpx@<pinned>`，然后再次验证。整个过程中，Gateway 网关始终保持非阻塞。

你可以在插件配置中覆盖命令或版本：

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` 接受绝对路径、相对路径（相对于 OpenClaw 工作区解析）或命令名。
- `expectedVersion: "any"` 会禁用严格版本匹配。
- 自定义 `command` 路径会禁用插件本地自动安装。

参见 [Plugins](/zh-CN/tools/plugin)。

### 自动安装依赖

当你通过 `npm install -g openclaw` 全局安装 OpenClaw 时，`acpx`
运行时依赖（平台相关二进制文件）会通过 `postinstall` 钩子自动安装。如果自动安装失败，Gateway 网关仍会正常启动，并通过 `openclaw acp doctor` 报告缺失的依赖。

### Plugin tools MCP 桥接器

默认情况下，ACPX 会话**不会**将 OpenClaw 插件注册的工具暴露给
ACP harness。

如果你希望 Codex 或 Claude Code 等 ACP 智能体调用已安装的
OpenClaw 插件工具，例如 memory recall/store，请启用专用桥接器：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

这会带来以下效果：

- 在 ACPX 会话引导过程中注入一个名为 `openclaw-plugin-tools` 的内置 MCP 服务器。
- 暴露已安装并启用的 OpenClaw 插件已注册的插件工具。
- 使该功能保持显式启用，且默认关闭。

安全与信任说明：

- 这会扩大 ACP harness 的工具暴露面。
- ACP 智能体只能访问 Gateway 网关中已经激活的插件工具。
- 请将其视为与允许这些插件在 OpenClaw 自身中执行相同的信任边界。
- 启用前请检查已安装的插件。

自定义 `mcpServers` 仍然和以前一样可用。内置的 `plugin-tools` 桥接器只是额外的可选便利功能，不是通用 MCP 服务器配置的替代方案。

### OpenClaw tools MCP 桥接器

默认情况下，ACPX 会话也**不会**通过 MCP 暴露 OpenClaw 内置工具。当 ACP 智能体需要使用 `cron` 等选定的内置工具时，请启用单独的核心工具桥接器：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

这会带来以下效果：

- 在 ACPX 会话引导过程中注入一个名为 `openclaw-tools` 的内置 MCP 服务器。
- 暴露选定的 OpenClaw 内置工具。初始服务器会暴露 `cron`。
- 使核心工具暴露保持显式启用，且默认关闭。

### 运行时超时配置

内置的 `acpx` 插件默认将嵌入式运行时轮次的超时时间设置为 120 秒。这让 Gemini CLI 等较慢的 harness 有足够时间完成 ACP 启动和初始化。如果你的主机需要不同的运行时限制，可以覆盖此值：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

修改此值后，请重启 Gateway 网关。

### 健康探测智能体配置

内置的 `acpx` 插件在判断嵌入式运行时后端是否就绪时，会探测一个 harness 智能体。默认值为 `codex`。如果你的部署使用其他默认 ACP 智能体，请将探测智能体设置为相同的 id：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

修改此值后，请重启 Gateway 网关。

## 权限配置

ACP 会话以非交互方式运行——没有 TTY 可用于批准或拒绝文件写入和 shell 执行权限提示。`acpx` 插件提供了两个配置键，用于控制权限处理方式：

这些 ACPX harness 权限与 OpenClaw 的执行审批是分开的，也与 CLI 后端供应商的绕过标志分开，例如 Claude CLI 的 `--permission-mode bypassPermissions`。对于 ACP 会话，ACPX 的 `approve-all` 是 harness 层级的紧急放开开关。

### `permissionMode`

控制 harness 智能体无需提示即可执行哪些操作。

| 值              | 行为                                        |
| --------------- | ------------------------------------------- |
| `approve-all`   | 自动批准所有文件写入和 shell 命令。         |
| `approve-reads` | 仅自动批准读取；写入和执行仍需要提示。      |
| `deny-all`      | 拒绝所有权限提示。                          |

### `nonInteractivePermissions`

控制当本应显示权限提示但没有可交互 TTY 时会发生什么（ACP 会话始终都是这种情况）。

| 值     | 行为                                                              |
| ------ | ----------------------------------------------------------------- |
| `fail` | 使用 `AcpRuntimeError` 中止会话。**（默认）**                     |
| `deny` | 静默拒绝该权限并继续执行（优雅降级）。                            |

### 配置方式

通过插件配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

修改这些值后，请重启 Gateway 网关。

> **重要：** OpenClaw 当前默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何触发权限提示的写入或执行操作都可能因 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 而失败。
>
> 如果你需要限制权限，请将 `nonInteractivePermissions` 设为 `deny`，这样会话会优雅降级，而不是直接崩溃。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents) —— 概览、运维手册、核心概念
- [Sub-agents](/zh-CN/tools/subagents)
- [Multi-agent routing](/zh-CN/concepts/multi-agent)
