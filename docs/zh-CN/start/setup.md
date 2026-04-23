---
read_when:
    - 设置一台新机器
    - 你希望获得“最新最强”，但又不破坏你的个人设置
summary: OpenClaw 的高级设置与开发工作流
title: 设置
x-i18n:
    generated_at: "2026-04-23T21:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: adab2d265c52feb90db2532501d552e8e05a029d1c96f8f252f4b6f6f1effad9
    source_path: start/setup.md
    workflow: 15
---

<Note>
如果你是首次设置，请先从[入门指南](/zh-CN/start/getting-started)开始。
关于新手引导细节，请参阅[新手引导（CLI）](/zh-CN/start/wizard)。
</Note>

## TL;DR

- **个性化定制放在仓库之外：** `~/.openclaw/workspace`（工作区）+ `~/.openclaw/openclaw.json`（配置）。
- **稳定工作流：** 安装 macOS 应用；让它运行内置 Gateway 网关。
- **前沿工作流：** 你自己通过 `pnpm gateway:watch` 运行 Gateway 网关，然后让 macOS 应用以本地模式附加。

## 前置条件（从源码）

- 推荐 Node 24（也仍支持 Node 22 LTS，目前为 `22.14+`）
- 优先使用 `pnpm`（或者如果你有意使用 [Bun 工作流](/zh-CN/install/bun)，则可使用 Bun）
- Docker（可选；仅用于容器化设置/e2e——参见 [Docker](/zh-CN/install/docker)）

## 个性化定制策略（这样更新就不会伤到你）

如果你希望“100% 适配我自己”并且还能轻松更新，请把你的自定义内容放在：

- **配置：** `~/.openclaw/openclaw.json`（JSON/近似 JSON5）
- **工作区：** `~/.openclaw/workspace`（skills、提示、记忆；建议将其设为私有 git 仓库）

首次初始化：

```bash
openclaw setup
```

在这个仓库内部，使用本地 CLI 入口：

```bash
openclaw setup
```

如果你还没有全局安装，请通过 `pnpm openclaw setup` 运行（如果你使用的是 Bun 工作流，则使用 `bun run openclaw setup`）。

## 从这个仓库运行 Gateway 网关

执行 `pnpm build` 后，你可以直接运行打包好的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 稳定工作流（macOS 应用优先）

1. 安装并启动 **OpenClaw.app**（菜单栏应用）。
2. 完成新手引导/权限清单（TCC 提示）。
3. 确保 Gateway 网关为**本地模式**并正在运行（由应用管理）。
4. 连接各界面（例如：WhatsApp）：

```bash
openclaw channels login
```

5. 完整性检查：

```bash
openclaw health
```

如果你的构建中没有新手引导：

- 运行 `openclaw setup`，然后运行 `openclaw channels login`，接着手动启动 Gateway 网关（`openclaw gateway`）。

## 前沿工作流（在终端中运行 Gateway 网关）

目标：开发 TypeScript Gateway 网关，获得热重载，同时保持 macOS 应用 UI 已附加。

### 0）（可选）也从源码运行 macOS 应用

如果你也希望 macOS 应用保持在前沿版本：

```bash
./scripts/restart-mac.sh
```

### 1）启动开发版 Gateway 网关

```bash
pnpm install
# 仅第一次运行时需要（或在重置本地 OpenClaw 配置/工作区之后）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 会以 watch 模式运行 gateway，并在相关源码、
配置和内置插件元数据变化时重新加载。
`pnpm openclaw setup` 是针对全新检出的、一次性的本地配置/工作区初始化步骤。
`pnpm gateway:watch` 不会重建 `dist/control-ui`，因此在修改 `ui/` 后请重新运行 `pnpm ui:build`，或者在开发 Control UI 时使用 `pnpm ui:dev`。

如果你有意使用 Bun 工作流，对应命令是：

```bash
bun install
# 仅第一次运行时需要（或在重置本地 OpenClaw 配置/工作区之后）
bun run openclaw setup
bun run gateway:watch
```

### 2）让 macOS 应用指向你正在运行的 Gateway 网关

在 **OpenClaw.app** 中：

- Connection Mode：**本地**
  应用会附加到配置端口上正在运行的 gateway。

### 3）验证

- 应用内 Gateway 网关状态应显示为 **“Using existing gateway …”**
- 或通过 CLI：

```bash
openclaw health
```

### 常见陷阱

- **端口错误：** Gateway WS 默认为 `ws://127.0.0.1:18789`；请确保应用和 CLI 使用同一端口。
- **状态存放位置：**
  - 渠道/provider 状态：`~/.openclaw/credentials/`
  - 模型 auth profiles：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 会话：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭证存储映射

当你要调试认证问题或决定该备份哪些内容时，请参考这里：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：配置/环境变量，或 `channels.telegram.tokenFile`（仅支持常规文件；符号链接会被拒绝）
- **Discord bot token**：配置/环境变量，或 SecretRef（env/file/exec providers）
- **Slack tokens**：配置/环境变量（`channels.slack.*`）
- **配对允许列表**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账户）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账户）
- **模型 auth profiles**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **文件支持的 secrets payload（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
  更多细节：[安全](/zh-CN/gateway/security#credential-storage-map)。

## 更新（不破坏你的设置）

- 把 `~/.openclaw/workspace` 和 `~/.openclaw/` 视为“你自己的内容”；不要把个人提示/配置放进 `openclaw` 仓库。
- 更新源码：`git pull` + 你选择的包管理器安装步骤（默认 `pnpm install`；Bun 工作流则为 `bun install`）+ 继续使用匹配的 `gateway:watch` 命令。

## Linux（systemd 用户服务）

Linux 安装使用的是 systemd **用户**服务。默认情况下，systemd 会在注销/空闲时停止用户
服务，这会杀掉 Gateway 网关。新手引导会尝试为你启用 lingering（可能会提示 sudo）。如果它仍然是关闭状态，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于始终在线或多用户服务器，请考虑使用 **系统级** 服务，而不是
用户服务（这样就不需要 lingering）。systemd 相关说明请参阅 [Gateway 网关运行手册](/zh-CN/gateway)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)（标志、监管、端口）
- [Gateway 网关配置](/zh-CN/gateway/configuration)（配置 schema + 示例）
- [Discord](/zh-CN/channels/discord) 和 [Telegram](/zh-CN/channels/telegram)（回复标签 + `replyToMode` 设置）
- [OpenClaw 助手设置](/zh-CN/start/openclaw)
- [macOS 应用](/zh-CN/platforms/macos)（gateway 生命周期）
