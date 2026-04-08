---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-04-08T16:05:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2f701f5c22cd5afc6b62cf2d916f183155ee55b5cebf03ef0d1272b94121cf7
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复陈旧的配置/状态、执行健康检查，并提供可执行的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无头 / 自动化

```bash
openclaw doctor --yes
```

接受默认值而不进行提示（包括在适用时的重启/服务/沙箱修复步骤）。

```bash
openclaw doctor --repair
```

不经提示应用推荐的修复（在安全时执行修复 + 重启）。

```bash
openclaw doctor --repair --force
```

也应用激进修复（会覆盖自定义 supervisor 配置）。

```bash
openclaw doctor --non-interactive
```

无提示运行，并且只应用安全迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱操作。
检测到旧版状态迁移时会自动运行。

```bash
openclaw doctor --deep
```

扫描系统服务中的额外 Gateway 网关安装（`launchd`/`systemd`/`schtasks`）。

如果你想在写入前先查看变更，先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会做什么（摘要）

- 针对 git 安装的可选预检更新（仅交互模式）。
- UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
- 健康检查 + 重启提示。
- Skills 状态摘要（可用/缺失/被阻止）和插件状态。
- 对旧版值执行配置规范化。
- 将旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
- 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移检查。
- OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuth 覆盖警告（`models.providers.openai-codex`）。
- OpenAI Codex OAuth 配置的 OAuth TLS 前置条件检查。
- 旧版磁盘状态迁移（会话/智能体目录/WhatsApp 认证）。
- 旧版插件清单契约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、简单 `notify: true` webhook 回退任务）。
- 会话锁文件检查和陈旧锁清理。
- 状态完整性和权限检查（会话、转录、状态目录）。
- 本地运行时的配置文件权限检查（`chmod 600`）。
- 模型认证健康状态：检查 OAuth 过期情况，可刷新即将过期的令牌，并报告 auth-profile 冷却/禁用状态。
- 检测额外的工作区目录（`~/openclaw`）。
- 启用沙箱隔离时执行沙箱镜像修复。
- 旧版服务迁移和额外 Gateway 网关检测。
- Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
- Gateway 网关运行时检查（服务已安装但未运行；缓存的 `launchd` 标签）。
- 渠道状态警告（从正在运行的 Gateway 网关探测）。
- Supervisor 配置审计（`launchd`/`systemd`/`schtasks`），并可选择修复。
- Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
- Gateway 网关端口冲突诊断（默认 `18789`）。
- 针对开放私信策略的安全警告。
- 本地令牌模式的 Gateway 网关认证检查（当没有令牌来源时提供令牌生成功能；不会覆盖令牌 SecretRef 配置）。
- Linux 上的 `systemd linger` 检查。
- 工作区 bootstrap 文件大小检查（上下文文件截断/接近上限警告）。
- shell 自动补全状态检查和自动安装/升级。
- Memory 搜索嵌入提供商就绪状态检查（本地模型、远程 API key 或 QMD 二进制文件）。
- 源码安装检查（`pnpm` 工作区不匹配、缺失 UI 资源、缺失 `tsx` 二进制文件）。
- 写入更新后的配置 + 向导元数据。

## 详细行为与原因说明

### 0）可选更新（git 安装）

如果这是一个 git 检出副本，并且 doctor 在交互模式下运行，它会在运行 doctor 之前提供更新选项（`fetch`/`rebase`/`build`）。

### 1）配置规范化

如果配置包含旧版值形状（例如没有渠道专用覆盖的 `messages.ackReaction`），doctor 会将它们规范化为当前 schema。

这也包括旧版 Talk 扁平字段。当前公开的 Talk 配置是
`talk.provider` + `talk.providers.<provider>`。Doctor 会将旧的
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` 形式重写为 provider 映射。

### 2）旧版配置键迁移

当配置包含已弃用的键时，其他命令会拒绝运行，并要求你运行
`openclaw doctor`。

Doctor 将会：

- 说明发现了哪些旧版键。
- 展示它应用的迁移。
- 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

当 Gateway 网关在启动时检测到旧版配置格式，也会自动运行 doctor 迁移，因此无需人工干预也能修复陈旧配置。
Cron 任务存储迁移由 `openclaw doctor --fix` 处理。

当前迁移包括：

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 顶层 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- 旧版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` （`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` （`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` （`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` （`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 对于配置了具名 `accounts` 但仍残留单账户顶层渠道值的渠道，将这些账户作用域的值移动到该渠道所选的提升账户中（大多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的具名/默认目标）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` （`tools`/`elevated`/`exec`/`sandbox`/`subagents`）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- 移除 `browser.relayBindHost`（旧版扩展 relay 设置）

Doctor 警告还包括多账户渠道的默认账户指导：

- 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有设置 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 会警告回退路由可能会选中意料之外的账户。
- 如果 `channels.<channel>.defaultAccount` 被设置为未知账户 ID，doctor 会发出警告并列出已配置的账户 ID。

### 2b）OpenCode 提供商覆盖

如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，
它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。
这可能会把模型强制路由到错误的 API，或者把成本归零。Doctor 会发出警告，以便你移除该覆盖并恢复按模型进行的 API 路由 + 成本。

### 2c）浏览器迁移和 Chrome MCP 就绪状态

如果你的浏览器配置仍然指向已移除的 Chrome 扩展路径，doctor 会将其规范化为当前主机本地 Chrome MCP 附加模型：

- `browser.profiles.*.driver: "extension"` 会变为 `"existing-session"`
- `browser.relayBindHost` 会被移除

当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` profile 时，
Doctor 还会审计主机本地 Chrome MCP 路径：

- 检查默认自动连接 profile 所在主机是否安装了 Google Chrome
- 检查检测到的 Chrome 版本，并在版本低于 Chrome 144 时发出警告
- 提醒你在浏览器检查页面启用远程调试（例如
  `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`，
  或 `edge://inspect/#remote-debugging`）

Doctor 不能替你启用 Chrome 侧设置。主机本地 Chrome MCP
仍然需要：

- Gateway 网关/节点主机上安装 Chromium 内核浏览器 144+
- 浏览器在本地运行
- 在该浏览器中启用远程调试
- 在浏览器中批准首次附加同意提示

这里的就绪状态仅指本地附加前置条件。Existing-session 会保留当前 Chrome MCP 路由限制；像 `responsebody`、PDF 导出、下载拦截和批量操作这样的高级路由，仍然需要托管浏览器或原始 CDP profile。

此检查**不**适用于 Docker、沙箱、remote-browser 或其他无头流程。那些流程会继续使用原始 CDP。

### 2d）OAuth TLS 前置条件

当配置了 OpenAI Codex OAuth profile 时，doctor 会探测 OpenAI
授权端点，以验证本地 Node/OpenSSL TLS 栈能否校验证书链。如果探测因证书错误失败（例如
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），
doctor 会打印平台专用修复指导。在 macOS 上使用 Homebrew Node 时，
修复方式通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，
即使 Gateway 网关处于健康状态，也会运行该探测。

### 2c）Codex OAuth 提供商覆盖

如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，
它们可能会遮蔽较新版本自动使用的内置 Codex OAuth
提供商路径。Doctor 会在它看到这些旧传输设置与 Codex OAuth 并存时发出警告，
这样你就可以移除或重写陈旧的传输覆盖，重新获得内置的路由/回退行为。
自定义代理和仅头部覆盖仍然受支持，不会触发此警告。

### 3）旧版状态迁移（磁盘布局）

Doctor 可以将较旧的磁盘布局迁移到当前结构：

- 会话存储 + 转录：
  - 从 `~/.openclaw/sessions/` 迁移到 `~/.openclaw/agents/<agentId>/sessions/`
- 智能体目录：
  - 从 `~/.openclaw/agent/` 迁移到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
  - 迁移到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

这些迁移会尽力执行并保持幂等；如果保留了任何旧版文件夹作为备份，doctor 会发出警告。
Gateway 网关/CLI 在启动时也会自动迁移旧版会话 + 智能体目录，因此历史记录/认证/模型会进入按智能体划分的路径，无需手动运行 doctor。WhatsApp 认证则有意只通过 `openclaw doctor` 迁移。Talk provider/provider-map 规范化现在按结构相等性进行比较，因此仅键顺序不同的差异不会再触发重复的空操作 `doctor --fix` 变更。

### 3a）旧版插件清单迁移

Doctor 会扫描所有已安装插件的清单，查找已弃用的顶层能力键
（`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、
`webSearchProviders`）。发现后，它会提供将它们移动到 `contracts`
对象中的选项，并原地重写清单文件。此迁移是幂等的；
如果 `contracts` 键已经包含相同的值，旧版键会被移除，
不会重复数据。

### 3b）旧版 cron 存储迁移

Doctor 还会检查 cron 任务存储（默认是 `~/.openclaw/cron/jobs.json`，
或在覆盖时使用 `cron.store`），查找调度器为了兼容性仍然接受的旧任务形状。

当前 cron 清理包括：

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 顶层 payload 字段（`message`、`model`、`thinking`、...）→ `payload`
- 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payload `provider` delivery 别名 → 显式 `delivery.channel`
- 简单的旧版 `notify: true` webhook 回退任务 → 显式 `delivery.mode="webhook"`，并设置 `delivery.to=cron.webhook`

只有在不改变行为的前提下，doctor 才会自动迁移 `notify: true` 任务。
如果某个任务把旧版 notify 回退与现有的非 webhook delivery 模式组合使用，
doctor 会发出警告，并将该任务保留给人工审查。

### 3c）会话锁清理

Doctor 会扫描每个智能体会话目录中的陈旧写锁文件——这些文件是在会话异常退出时遗留的。
对于找到的每个锁文件，它会报告：
路径、PID、该 PID 是否仍存活、锁龄，以及它是否
被视为陈旧（PID 已死亡或超过 30 分钟）。在 `--fix` / `--repair`
模式下，它会自动移除陈旧锁文件；否则它会打印说明，并指示你使用 `--fix` 重新运行。

### 4）状态完整性检查（会话持久化、路由和安全）

状态目录是运行中的核心中枢。如果它消失了，你会失去
会话、凭证、日志和配置（除非你在别处有备份）。

Doctor 会检查：

- **状态目录缺失**：警告灾难性的状态丢失，提示重新创建
  目录，并提醒你它无法恢复丢失的数据。
- **状态目录权限**：验证可写性；提供修复权限的选项
  （当检测到所有者/组不匹配时会给出 `chown` 提示）。
- **macOS 云同步状态目录**：当状态路径位于 iCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或
  `~/Library/CloudStorage/...` 下时发出警告，因为由同步支持的路径可能导致更慢的 I/O
  以及锁/同步竞争。
- **Linux SD 或 eMMC 状态目录**：当状态路径解析到 `mmcblk*`
  挂载源时发出警告，因为基于 SD 或 eMMC 的随机 I/O 在
  会话和凭证写入负载下可能更慢且磨损更快。
- **会话目录缺失**：`sessions/` 和会话存储目录是
  持久化历史记录并避免 `ENOENT` 崩溃所必需的。
- **转录不匹配**：当近期会话条目缺少
  转录文件时发出警告。
- **主会话“单行 JSONL”**：当主转录只有一行时发出标记
  （历史记录没有持续累积）。
- **多个状态目录**：当多个主目录下存在多个 `~/.openclaw` 文件夹，
  或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能在不同安装之间分裂）。
- **远程模式提醒**：如果 `gateway.mode=remote`，doctor 会提醒你在
  远程主机上运行它（状态存储在那里）。
- **配置文件权限**：如果 `~/.openclaw/openclaw.json`
  对组/所有人可读，则发出警告，并提供收紧为 `600` 的选项。

### 5）模型认证健康状态（OAuth 过期）

Doctor 会检查认证存储中的 OAuth profile，在令牌即将过期/已过期时发出警告，
并在安全时进行刷新。如果 Anthropic
OAuth/令牌 profile 已过期，它会建议使用 Anthropic API key 或
Anthropic setup-token 路径。
仅在交互模式（TTY）下才会显示刷新提示；`--non-interactive`
会跳过刷新尝试。

当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、
`invalid_grant`，或提供商提示你需要重新登录），doctor 会报告
需要重新认证，并打印需要运行的精确命令
`openclaw models auth login --provider ...`。

Doctor 还会报告由于以下原因而暂时不可用的 auth-profile：

- 短暂冷却（速率限制/超时/认证失败）
- 更长时间的禁用（计费/额度失败）

### 6）Hooks 模型验证

如果设置了 `hooks.gmail.model`，doctor 会根据目录和 allowlist 验证该模型引用，
并在其无法解析或被禁止时发出警告。

### 7）沙箱镜像修复

启用沙箱隔离时，doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称的选项。

### 7b）内置插件运行时依赖

Doctor 会验证内置插件运行时依赖（例如
Discord 插件运行时包）是否存在于 OpenClaw 安装根目录中。
如果缺失，doctor 会报告这些包，并在
`openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。

### 8）Gateway 网关服务迁移和清理提示

Doctor 会检测旧版 Gateway 网关服务（`launchd`/`systemd`/`schtasks`），
并提供移除它们、然后使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。
它还可以扫描额外的类 Gateway 网关服务并打印清理提示。
以 profile 命名的 OpenClaw Gateway 网关服务会被视为一等公民，不会被标记为“额外”。

### 8b）启动 Matrix 迁移

当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，
doctor（在 `--fix` / `--repair` 模式下）会先创建迁移前快照，
然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版
加密状态准备。这两个步骤都不是致命性的；错误会被记录，启动会继续。
在只读模式下（不带 `--fix` 的 `openclaw doctor`）此检查会被完全跳过。

### 9）安全警告

当某个提供商对私信开放但没有 allowlist，或策略配置方式存在危险时，doctor 会发出警告。

### 10）`systemd linger`（Linux）

如果作为 `systemd` 用户服务运行，doctor 会确保已启用 lingering，以便
Gateway 网关在登出后仍保持运行。

### 11）工作区状态（Skills、插件和旧版目录）

Doctor 会打印默认智能体的工作区状态摘要：

- **Skills 状态**：统计可用、缺少要求以及被 allowlist 阻止的 Skills 数量。
- **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录
  与当前工作区并存时发出警告。
- **插件状态**：统计已加载/已禁用/出错的插件数量；列出所有
  出错插件的插件 ID；报告 bundle 插件能力。
- **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
- **插件诊断**：显示插件注册表发出的任何加载时警告或错误。

### 11b）Bootstrap 文件大小

Doctor 会检查工作区 bootstrap 文件（例如 `AGENTS.md`、
`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过已配置的
字符预算。它会报告每个文件的原始字符数与注入后字符数、截断
百分比、截断原因（`max/file` 或 `max/total`），以及总注入
字符数占总预算的比例。当文件被截断或接近上限时，
doctor 会打印关于调整 `agents.defaults.bootstrapMaxChars`
和 `agents.defaults.bootstrapTotalMaxChars` 的建议。

### 11c）Shell 自动补全

Doctor 会检查当前 shell 是否已安装 tab 自动补全
（`zsh`、`bash`、`fish` 或 PowerShell）：

- 如果 shell profile 使用了较慢的动态补全模式
  （`source <(openclaw completion ...)`），doctor 会将其升级为更快的
  缓存文件变体。
- 如果 profile 中已配置补全，但缓存文件缺失，
  doctor 会自动重新生成缓存。
- 如果完全没有配置补全，它会提示安装
  （仅交互模式；使用 `--non-interactive` 时跳过）。

运行 `openclaw completion --write-state` 可手动重新生成缓存。

### 12）Gateway 网关认证检查（本地令牌）

Doctor 会检查本地 Gateway 网关令牌认证就绪状态。

- 如果令牌模式需要令牌但没有令牌来源，doctor 会提供生成令牌的选项。
- 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，doctor 会发出警告，且不会用明文覆盖它。
- `openclaw doctor --generate-gateway-token` 仅在未配置令牌 SecretRef 时强制生成。

### 12b）只读 SecretRef 感知修复

某些修复流程需要检查已配置的凭证，而不能削弱运行时快速失败行为。

- `openclaw doctor --fix` 现在使用与 status 系列命令相同的只读 SecretRef 摘要模型，用于有针对性的配置修复。
- 示例：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修复会在可用时尝试使用已配置的 bot 凭证。
- 如果 Telegram bot 令牌通过 SecretRef 配置，但在当前命令路径中不可用，doctor 会报告该凭证“已配置但不可用”，并跳过自动解析，而不是崩溃或误报令牌缺失。

### 13）Gateway 网关健康检查 + 重启

Doctor 会执行健康检查，并在 Gateway 网关看起来
不健康时提供重启选项。

### 13b）Memory 搜索就绪状态

Doctor 会检查为默认智能体配置的 Memory 搜索嵌入提供商是否已就绪。
其行为取决于所配置的后端和提供商：

- **QMD 后端**：探测 `qmd` 二进制文件是否可用并可启动。
  如果不可用，会打印修复指导，包括 npm 包和手动二进制路径选项。
- **显式本地提供商**：检查本地模型文件或可识别的
  远程/可下载模型 URL。如果缺失，会建议切换到远程提供商。
- **显式远程提供商**（`openai`、`voyage` 等）：验证环境或认证存储中
  是否存在 API key。如果缺失，会打印可执行的修复提示。
- **自动提供商**：先检查本地模型可用性，然后按自动选择顺序依次尝试各个远程
  提供商。

当 Gateway 网关探测结果可用时（检查时 Gateway 网关处于健康状态），
doctor 会将其结果与 CLI 可见配置交叉比对，并说明
任何差异。

使用 `openclaw memory status --deep` 可在运行时验证嵌入就绪状态。

### 14）渠道状态警告

如果 Gateway 网关健康，doctor 会运行渠道状态探测，并报告
附带修复建议的警告。

### 15）Supervisor 配置审计 + 修复

Doctor 会检查已安装的 supervisor 配置（`launchd`/`systemd`/`schtasks`），查看是否存在
缺失或过期的默认值（例如 `systemd network-online` 依赖和
重启延迟）。发现不匹配时，它会建议更新，并且可以
将服务文件/任务重写为当前默认值。

说明：

- `openclaw doctor` 在重写 supervisor 配置前会提示确认。
- `openclaw doctor --yes` 会接受默认修复提示。
- `openclaw doctor --repair` 会不经提示应用推荐修复。
- `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
- 如果令牌认证需要令牌，而 `gateway.auth.token` 由 SecretRef 管理，doctor 在服务安装/修复时会验证 SecretRef，但不会把解析出的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌认证需要令牌，而已配置的令牌 SecretRef 无法解析，doctor 会阻止安装/修复流程，并提供可执行指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但 `gateway.auth.mode` 未设置，doctor 会阻止安装/修复，直到显式设置 mode。
- 对于 Linux user-systemd 单元，doctor 的令牌漂移检查现在会同时包含 `Environment=` 和 `EnvironmentFile=` 来源，以比较服务认证元数据。
- 你始终可以通过 `openclaw gateway install --force` 强制完整重写。

### 16）Gateway 网关运行时 + 端口诊断

Doctor 会检查服务运行时（PID、最近退出状态），并在
服务已安装但实际上未运行时发出警告。它还会检查 Gateway 网关端口
（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、
SSH 隧道）。

### 17）Gateway 网关运行时最佳实践

当 Gateway 网关服务运行在 Bun 或版本管理的 Node 路径
（`nvm`、`fnm`、`volta`、`asdf` 等）上时，doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，
而版本管理器路径在升级后可能失效，因为服务不会
加载你的 shell 初始化。Doctor 会在可用时提供迁移到系统 Node 安装的选项
（Homebrew/`apt`/`choco`）。

### 18）配置写入 + 向导元数据

Doctor 会持久化任何配置更改，并写入向导元数据来记录此次
doctor 运行。

### 19）工作区提示（备份 + memory system）

当工作区缺少 memory system 时，Doctor 会给出建议；如果工作区
尚未纳入 git，它还会打印备份提示。

参见 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace) 了解关于
工作区结构和 git 备份的完整指南（推荐使用私有 GitHub 或 GitLab）。
