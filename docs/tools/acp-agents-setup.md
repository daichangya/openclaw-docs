---
read_when:
    - 为 Claude Code / Codex / Gemini CLI 安装或配置 acpx harness
    - 启用 plugin-tools 或 OpenClaw-tools MCP 桥接
    - 配置 ACP 权限模式
summary: 设置 ACP 智能体：acpx harness 配置、插件设置和权限
title: ACP 智能体 — 设置
x-i18n:
    generated_at: "2026-04-26T07:51:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

有关概览、操作员运行手册和概念，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

以下章节涵盖 acpx harness 配置、MCP 桥接的插件设置以及权限配置。

仅当你在设置 ACP/acpx 路线时使用本页。对于原生 Codex app-server 运行时配置，请使用 [Codex harness](/zh-CN/plugins/codex-harness)。对于 OpenAI API key 或 Codex OAuth 模型提供商配置，请使用 [OpenAI](/zh-CN/providers/openai)。

Codex 在 OpenClaw 中有两条路线：

| 路线 | 配置/命令 | 设置页面 |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| 原生 Codex app-server | `/codex ...`，`agentRuntime.id: "codex"` | [Codex harness](/zh-CN/plugins/codex-harness) |
| 显式 Codex ACP 适配器 | `/acp spawn codex`，`runtime: "acp", agentId: "codex"` | 本页 |

除非你明确需要 ACP/acpx 行为，否则优先使用原生路线。

## acpx harness 支持（当前）

当前 acpx 内置 harness 别名：

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

当 OpenClaw 使用 acpx 后端时，除非你的 acpx 配置定义了自定义智能体别名，否则推荐将这些值用于 `agentId`。  
如果你本地的 Cursor 安装仍将 ACP 暴露为 `agent acp`，请在你的 acpx 配置中覆盖 `cursor` 智能体命令，而不是更改内置默认值。

直接使用 acpx CLI 时，也可以通过 `--agent <command>` 指定任意适配器，但这个原始逃生口是 acpx CLI 功能（不是常规的 OpenClaw `agentId` 路径）。

模型控制取决于适配器能力。Codex ACP 模型引用会在启动前由 OpenClaw 进行规范化。其他 harness 需要 ACP `models` 加上 `session/set_model` 支持；如果某个 harness 既不暴露该 ACP 能力，也没有自身的启动模型标志，那么 OpenClaw/acpx 就无法强制选择模型。

## 必需配置

核心 ACP 基线：

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

线程绑定配置取决于渠道适配器。以下是 Discord 示例：

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

如果线程绑定的 ACP 启动无效，请先验证适配器功能标志：

- Discord：`channels.discord.threadBindings.spawnAcpSessions=true`

当前对话绑定不需要创建子线程。它们需要活动的对话上下文，以及暴露 ACP 对话绑定的渠道适配器。

参见 [配置参考](/zh-CN/gateway/configuration-reference)。

## acpx 后端的插件设置

全新安装默认启用内置的 `acpx` 运行时插件，因此 ACP 通常无需手动安装插件即可工作。

先执行：

```text
/acp doctor
```

如果你禁用了 `acpx`、通过 `plugins.allow` / `plugins.deny` 拒绝了它，或者想切换到本地开发检出版本，请使用显式插件路径：

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

开发期间的本地工作区安装：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

然后验证后端健康状态：

```text
/acp doctor
```

### acpx 命令和版本配置

默认情况下，内置 `acpx` 插件会注册嵌入式 ACP 后端，而不会在 Gateway 网关启动期间生成 ACP 智能体。运行 `/acp doctor` 可进行显式的实时探测。仅当你需要 Gateway 网关在启动时探测已配置智能体时，才设置 `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1`。

在插件配置中覆盖命令或版本：

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

### 自动依赖安装

当你通过 `npm install -g openclaw` 全局安装 OpenClaw 时，acpx 运行时依赖（平台特定二进制文件）会通过 postinstall 钩子自动安装。如果自动安装失败，Gateway 网关仍会正常启动，并通过 `openclaw acp doctor` 报告缺失的依赖。

### 插件工具 MCP 桥接

默认情况下，ACPX 会话**不会**向 ACP harness 暴露 OpenClaw 插件注册的工具。

如果你希望 Codex 或 Claude Code 等 ACP 智能体能够调用已安装的 OpenClaw 插件工具（例如 memory recall/store），请启用专用桥接：

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

其作用如下：

- 在 ACPX 会话引导中注入一个名为 `openclaw-plugin-tools` 的内置 MCP 服务器。
- 暴露已安装并启用的 OpenClaw 插件注册的插件工具。
- 该功能是显式启用的，默认关闭。

安全和信任说明：

- 这会扩大 ACP harness 的工具表面。
- ACP 智能体仅能访问 Gateway 网关中已激活的插件工具。
- 应将这视为与允许这些插件在 OpenClaw 本身中执行相同的信任边界。
- 启用前请检查已安装的插件。

自定义 `mcpServers` 仍按原样工作。内置的 plugin-tools 桥接只是额外的可选便利功能，并不是通用 MCP 服务器配置的替代品。

### OpenClaw 工具 MCP 桥接

默认情况下，ACPX 会话也**不会**通过 MCP 暴露内置 OpenClaw 工具。当 ACP 智能体需要使用选定的内置工具（例如 `cron`）时，请启用独立的核心工具桥接：

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

其作用如下：

- 在 ACPX 会话引导中注入一个名为 `openclaw-tools` 的内置 MCP 服务器。
- 暴露选定的内置 OpenClaw 工具。初始服务器会暴露 `cron`。
- 核心工具暴露为显式启用，默认关闭。

### 运行时超时配置

内置 `acpx` 插件默认将嵌入式运行时轮次超时设为 120 秒。这为 Gemini CLI 等较慢的 harness 留出了足够时间来完成 ACP 启动和初始化。如果你的主机需要不同的运行时限制，可以覆盖它：

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

更改该值后请重启 Gateway 网关。

### 健康探针智能体配置

当 `/acp doctor` 或选择启用的启动探针检查后端时，内置 `acpx` 插件会探测一个 harness 智能体。如果设置了 `acp.allowedAgents`，则默认探测第一个允许的智能体；否则默认探测 `codex`。如果你的部署需要使用不同的 ACP 智能体进行健康检查，请显式设置探针智能体：

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

更改该值后请重启 Gateway 网关。

## 权限配置

ACP 会话以非交互方式运行——没有 TTY 可用于批准或拒绝文件写入和 shell 执行权限提示。acpx 插件提供了两个配置键来控制权限处理方式：

这些 ACPX harness 权限独立于 OpenClaw exec 批准，也独立于 CLI 后端供应商绕过标志，例如 Claude CLI `--permission-mode bypassPermissions`。ACPX `approve-all` 是 ACP 会话的 harness 级紧急放行开关。

### `permissionMode`

控制 harness 智能体可以在不提示的情况下执行哪些操作。

| 值 | 行为 |
| --------------- | --------------------------------------------------------- |
| `approve-all` | 自动批准所有文件写入和 shell 命令。 |
| `approve-reads` | 仅自动批准读取；写入和执行需要提示。 |
| `deny-all` | 拒绝所有权限提示。 |

### `nonInteractivePermissions`

控制当本应显示权限提示、但没有可用交互式 TTY 时会发生什么（对于 ACP 会话这始终如此）。

| 值 | 行为 |
| ------ | ----------------------------------------------------------------- |
| `fail` | 以 `AcpRuntimeError` 中止会话。**（默认）** |
| `deny` | 静默拒绝权限并继续（平滑降级）。 |

### 配置

通过插件配置设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

更改这些值后请重启 Gateway 网关。

> **重要：** OpenClaw 当前默认使用 `permissionMode=approve-reads` 和 `nonInteractivePermissions=fail`。在非交互式 ACP 会话中，任何触发权限提示的写入或执行操作都可能因 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` 而失败。
>
> 如果你需要限制权限，请将 `nonInteractivePermissions` 设为 `deny`，这样会话会平滑降级，而不是直接崩溃。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents) — 概览、操作员运行手册、概念
- [Sub-agents](/zh-CN/tools/subagents)
- [多智能体路由](/zh-CN/concepts/multi-agent)
