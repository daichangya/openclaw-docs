---
read_when:
    - 设置新机器
    - 你希望获得“最新且最强”的体验，同时又不破坏你的个人设置
summary: OpenClaw 的高级设置与开发工作流
title: 设置
x-i18n:
    generated_at: "2026-04-19T06:50:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# 设置

<Note>
如果这是你第一次设置，请先阅读 [入门指南](/zh-CN/start/getting-started)。
如需了解新手引导详情，请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。
</Note>

## TL;DR

- **个性化配置保存在仓库之外：** `~/.openclaw/workspace`（工作区）+ `~/.openclaw/openclaw.json`（配置）。
- **稳定工作流：** 安装 macOS 应用；让它运行内置的 Gateway 网关。
- **前沿工作流：** 通过 `pnpm gateway:watch` 自行运行 Gateway 网关，然后让 macOS 应用在本地模式下连接。

## 先决条件（从源码开始）

- 推荐使用 Node 24（也仍支持 Node 22 LTS，目前为 `22.14+`）
- 优先使用 `pnpm`（或者如果你有意使用 [Bun 工作流](/zh-CN/install/bun)，也可使用 Bun）
- Docker（可选；仅用于容器化设置 / e2e —— 参见 [Docker](/zh-CN/install/docker)）

## 个性化策略（这样更新就不会伤到你）

如果你想要“100% 为我量身定制”，_同时_ 又想轻松更新，请把你的自定义内容放在：

- **配置：** `~/.openclaw/openclaw.json`（类似 JSON / JSON5）
- **工作区：** `~/.openclaw/workspace`（skills、提示词、记忆；建议将其设为私有 git 仓库）

初始化一次：

```bash
openclaw setup
```

在这个仓库内，使用本地 CLI 入口：

```bash
openclaw setup
```

如果你还没有全局安装，请通过 `pnpm openclaw setup` 运行（如果你使用 Bun 工作流，则使用 `bun run openclaw setup`）。

## 从这个仓库运行 Gateway 网关

执行 `pnpm build` 后，你可以直接运行打包后的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 稳定工作流（优先使用 macOS 应用）

1. 安装并启动 **OpenClaw.app**（菜单栏应用）。
2. 完成新手引导 / 权限检查清单（TCC 提示）。
3. 确保 Gateway 网关处于 **Local** 模式并正在运行（由应用管理）。
4. 关联各个渠道（例如：WhatsApp）：

```bash
openclaw channels login
```

5. 进行安装完整性检查：

```bash
openclaw health
```

如果你的构建中没有提供新手引导：

- 运行 `openclaw setup`，然后运行 `openclaw channels login`，接着手动启动 Gateway 网关（`openclaw gateway`）。

## 前沿工作流（在终端中运行 Gateway 网关）

目标：开发 TypeScript Gateway 网关、获得热重载，同时保持 macOS 应用 UI 已连接。

### 0) （可选）也从源码运行 macOS 应用

如果你也想使用前沿版本的 macOS 应用：

```bash
./scripts/restart-mac.sh
```

### 1) 启动开发版 Gateway 网关

```bash
pnpm install
# 仅首次运行时需要（或在重置本地 OpenClaw 配置 / 工作区后）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 会以监视模式运行 Gateway 网关，并在相关源码、配置以及内置插件元数据发生变化时重新加载。
`pnpm openclaw setup` 是针对全新检出的代码仓库执行的一次性本地配置 / 工作区初始化步骤。
`pnpm gateway:watch` 不会重建 `dist/control-ui`，因此在 `ui/` 发生变更后，请重新运行 `pnpm ui:build`，或者在开发 Control UI 时使用 `pnpm ui:dev`。

如果你有意使用 Bun 工作流，对应命令是：

```bash
bun install
# 仅首次运行时需要（或在重置本地 OpenClaw 配置 / 工作区后）
bun run openclaw setup
bun run gateway:watch
```

### 2) 让 macOS 应用指向你正在运行的 Gateway 网关

在 **OpenClaw.app** 中：

- 连接模式：**Local**
  应用会连接到配置端口上正在运行的 Gateway 网关。

### 3) 验证

- 应用内的 Gateway 网关状态应显示为 **“Using existing gateway …”**
- 或者通过 CLI：

```bash
openclaw health
```

### 常见易错点

- **端口错误：** Gateway 网关 WS 默认是 `ws://127.0.0.1:18789`；请确保应用和 CLI 使用同一个端口。
- **状态数据存放位置：**
  - 渠道 / 提供商状态：`~/.openclaw/credentials/`
  - 模型凭证配置：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 会话：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭证存储映射

在调试认证问题或决定要备份哪些内容时，请参考这里：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 机器人令牌**：配置 / 环境变量，或 `channels.telegram.tokenFile`（仅允许常规文件；拒绝符号链接）
- **Discord 机器人令牌**：配置 / 环境变量，或 SecretRef（env / file / exec 提供商）
- **Slack 令牌**：配置 / 环境变量（`channels.slack.*`）
- **配对允许列表**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账号）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账号）
- **模型凭证配置**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **基于文件的 secrets 负载（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
  更多详情： [安全](/zh-CN/gateway/security#credential-storage-map)。

## 更新（不破坏你的设置）

- 将 `~/.openclaw/workspace` 和 `~/.openclaw/` 视为“你的东西”；不要把个人提示词 / 配置放进 `openclaw` 仓库。
- 更新源码：`git pull` + 你选择的包管理器安装步骤（默认 `pnpm install`；Bun 工作流则使用 `bun install`）+ 继续使用对应的 `gateway:watch` 命令。

## Linux（systemd 用户服务）

Linux 安装使用 systemd **用户**服务。默认情况下，systemd 会在你登出 / 空闲时停止用户服务，这会终止 Gateway 网关。新手引导会尝试为你启用 lingering（可能会提示输入 sudo）。如果它仍未启用，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于始终在线或多用户服务器，建议考虑使用 **系统**服务，而不是用户服务（无需 lingering）。有关 systemd 的说明，请参阅 [Gateway 网关运行手册](/zh-CN/gateway)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)（标志、监管、端口）
- [Gateway 网关配置](/zh-CN/gateway/configuration)（配置 schema + 示例）
- [Discord](/zh-CN/channels/discord) 和 [Telegram](/zh-CN/channels/telegram)（回复标签 + `replyToMode` 设置）
- [OpenClaw 助手设置](/zh-CN/start/openclaw)
- [macOS 应用](/zh-CN/platforms/macos)（Gateway 网关生命周期）
