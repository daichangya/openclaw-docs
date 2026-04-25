---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置更改
summary: Doctor 命令：运行状况检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-04-25T17:39:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13204a57facd19459fc812a8daa0fe629b6725bdabb014f59f871fa64c22e71d
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过期的配置/状态，检查运行状况，并提供可执行的修复步骤。

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

应用建议的修复而不提示（在安全情况下执行修复 + 重启）。

```bash
openclaw doctor --repair --force
```

也应用激进修复（会覆盖自定义 supervisor 配置）。

```bash
openclaw doctor --non-interactive
```

在不提示的情况下运行，并且只应用安全迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱操作。
检测到旧状态迁移时会自动运行。

```bash
openclaw doctor --deep
```

扫描系统服务以查找额外的 Gateway 网关安装（`launchd`/`systemd`/`schtasks`）。

如果你想在写入之前先查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会执行什么（摘要）

- 针对 git 安装的可选飞行前更新（仅交互模式）。
- UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
- 运行状况检查 + 重启提示。
- Skills 状态摘要（可用/缺失/受阻）和插件状态。
- 针对旧值的配置规范化。
- 将旧版扁平 `talk.*` 字段迁移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
- 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪情况的浏览器迁移检查。
- OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
- OpenAI Codex OAuth 配置文件的 OAuth TLS 前置条件检查。
- 旧版磁盘状态迁移（会话/智能体目录/WhatsApp 认证）。
- 旧版插件清单契约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 `delivery`/`payload` 字段、`payload.provider`、简单的 `notify: true` webhook 回退任务）。
- 会话锁文件检查和过期锁清理。
- 状态完整性和权限检查（会话、转录记录、状态目录）。
- 本地运行时的配置文件权限检查（`chmod 600`）。
- 模型认证运行状况：检查 OAuth 过期情况，可刷新即将过期的令牌，并报告 auth-profile 冷却/禁用状态。
- 额外工作区目录检测（`~/openclaw`）。
- 启用沙箱隔离时的沙箱镜像修复。
- 旧版服务迁移和额外 Gateway 网关检测。
- Matrix 渠道旧状态迁移（在 `--fix` / `--repair` 模式下）。
- Gateway 网关运行时检查（已安装服务但未运行；缓存的 `launchd` 标签）。
- 渠道状态警告（从正在运行的 Gateway 网关探测）。
- supervisor 配置审计（`launchd`/`systemd`/`schtasks`），可选择修复。
- Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
- Gateway 网关端口冲突诊断（默认 `18789`）。
- 面向开放私信策略的安全警告。
- 本地令牌模式的 Gateway 网关认证检查（在没有令牌来源时提供生成令牌；不会覆盖令牌 `SecretRef` 配置）。
- 设备配对问题检测（首次配对请求待处理、角色/作用域升级待处理、过期的本地设备令牌缓存漂移，以及已配对记录的认证漂移）。
- Linux 上的 `systemd linger` 检查。
- 工作区引导文件大小检查（针对上下文文件的截断/接近限制警告）。
- Shell 自动补全状态检查以及自动安装/升级。
- Memory 搜索嵌入提供商就绪情况检查（本地模型、远程 API 密钥或 QMD 二进制文件）。
- 源码安装检查（`pnpm` 工作区不匹配、缺失 UI 资源、缺失 `tsx` 二进制文件）。
- 写入更新后的配置 + 向导元数据。

## Dreams UI 回填和重置

Control UI 的 Dreams 场景包含 **Backfill**、**Reset** 和 **Clear Grounded**
操作，用于 grounded dreaming 工作流。这些操作使用 Gateway 网关风格的
doctor RPC 方法，但它们**不是** `openclaw doctor` CLI
修复/迁移的一部分。

它们的作用：

- **Backfill** 会扫描当前工作区中的历史 `memory/YYYY-MM-DD.md` 文件，
  运行 grounded REM 日记流程，并将可逆的回填条目写入 `DREAMS.md`。
- **Reset** 仅从 `DREAMS.md` 中删除这些已标记的回填日记条目。
- **Clear Grounded** 仅删除那些来自历史回放、且尚未累积实时 recall 或每日
  supporting 的 staged grounded-only 短期条目。

它们**不会**自行执行的事情：

- 它们不会编辑 `MEMORY.md`
- 它们不会运行完整的 Doctor 迁移
- 除非你先显式运行 staged CLI 路径，否则它们不会自动将 grounded 候选项
  放入实时短期提升存储中

如果你希望 grounded 历史回放影响正常的深度提升通道，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将 grounded 持久候选项放入短期 dreaming 存储中，同时把 `DREAMS.md`
保留为审查界面。

## 详细行为和原因说明

### 0）可选更新（git 安装）

如果这是一个 git 检出，并且 Doctor 以交互模式运行，它会先提供
更新（fetch/rebase/build），然后再运行 Doctor。

### 1）配置规范化

如果配置包含旧版值结构（例如 `messages.ackReaction`
没有渠道特定覆盖），Doctor 会将其规范化为当前
schema。

这也包括旧版 Talk 扁平字段。当前公开的 Talk 配置是
`talk.provider` + `talk.providers.<provider>`。Doctor 会把旧的
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` 结构重写到 provider 映射中。

### 2）旧版配置键迁移

当配置包含已弃用的键时，其他命令会拒绝运行，并要求
你运行 `openclaw doctor`。

Doctor 会：

- 说明找到了哪些旧版键。
- 展示它应用的迁移。
- 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

Gateway 网关在启动时如果检测到旧版配置格式，也会自动运行 Doctor 迁移，
因此过期配置无需手动干预即可修复。
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
- `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` 和 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 和 `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` 和 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 和 `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 对于配置了具名 `accounts` 但仍保留单账户顶层渠道值的渠道，将这些账户范围的值移动到为该渠道选定的提升账户中（大多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的具名/默认目标）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（`tools`/`elevated`/`exec`/`sandbox`/`subagents`）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- 移除 `browser.relayBindHost`（旧版扩展 relay 设置）

Doctor 警告还包括针对多账户渠道的账户默认值指引：

- 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有设置 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 会警告回退路由可能会选中意料之外的账户。
- 如果 `channels.<channel>.defaultAccount` 被设置为未知账户 ID，Doctor 会发出警告并列出已配置的账户 ID。

### 2b）OpenCode 提供商覆盖

如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，
它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。
这可能会把模型强制路由到错误的 API，或者让成本变成 0。Doctor 会发出警告，
以便你移除该覆盖并恢复按模型的 API 路由 + 成本。

### 2c）浏览器迁移和 Chrome MCP 就绪情况

如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，Doctor 会
将其规范化为当前的主机本地 Chrome MCP 附加模型：

- `browser.profiles.*.driver: "extension"` 会变为 `"existing-session"`
- `browser.relayBindHost` 会被移除

当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置文件时，
Doctor 还会审计主机本地 Chrome MCP 路径：

- 检查 Google Chrome 是否安装在同一主机上，用于默认
  自动连接配置文件
- 检查检测到的 Chrome 版本，并在其低于 Chrome 144 时发出警告
- 提醒你在浏览器 inspect 页面中启用远程调试（例如
  `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`
  或 `edge://inspect/#remote-debugging`）

Doctor 不能替你启用 Chrome 侧设置。主机本地 Chrome MCP
仍然要求：

- Gateway 网关/节点主机上安装 Chromium 内核浏览器 144+
- 浏览器在本地运行
- 在该浏览器中启用远程调试
- 在浏览器中批准首次附加同意提示

这里的就绪情况仅涉及本地附加前置条件。`existing-session` 会保留
当前 Chrome MCP 路由限制；像 `responsebody`、PDF 导出、
下载拦截和批量操作这类高级路由，仍然需要托管浏览器
或原始 CDP 配置文件。

此检查**不**适用于 Docker、沙箱、remote-browser 或其他
无头流程。那些流程会继续使用原始 CDP。

### 2d）OAuth TLS 前置条件

当配置了 OpenAI Codex OAuth 配置文件时，Doctor 会探测 OpenAI
授权端点，以验证本地 Node/OpenSSL TLS 栈是否能够
校验证书链。如果探测因证书错误而失败（例如
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），
Doctor 会打印针对平台的修复指引。在 macOS 上使用 Homebrew 安装的 Node 时，
修复方式通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，
即使 Gateway 网关处于健康状态，此探测也会运行。

### 2c）Codex OAuth 提供商覆盖

如果你之前在
`models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，
它们可能会遮蔽较新版本自动使用的内置 Codex OAuth
提供商路径。Doctor 在看到这些旧传输设置与 Codex OAuth
同时存在时会发出警告，这样你就可以删除或重写过期的传输覆盖，
并恢复内置的路由/回退行为。自定义代理和仅 header 的覆盖仍然受支持，
不会触发此警告。

### 3）旧版状态迁移（磁盘布局）

Doctor 可以将旧版磁盘布局迁移到当前结构：

- 会话存储 + 转录记录：
  - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
- 智能体目录：
  - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
  - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

这些迁移会尽力而为且具备幂等性；如果留下任何旧版文件夹作为备份，
Doctor 会发出警告。Gateway 网关/CLI 在启动时也会自动迁移
旧版会话 + 智能体目录，因此历史记录/认证/模型会进入
按智能体划分的路径，而无需手动运行 Doctor。WhatsApp 认证则有意只通过
`openclaw doctor` 迁移。Talk provider/provider-map 规范化现在
按结构相等性比较，因此仅键顺序不同的差异不再触发重复的无操作
`doctor --fix` 变更。

### 3a）旧版插件清单迁移

Doctor 会扫描所有已安装插件清单中已弃用的顶层能力
键（`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、
`webSearchProviders`）。找到后，它会提供将它们移动到 `contracts`
对象中并原地重写清单文件的选项。此迁移具备幂等性；
如果 `contracts` 键已经包含相同的值，则会移除旧版键，
而不会重复数据。

### 3b）旧版 cron 存储迁移

Doctor 还会检查 cron 任务存储（默认是 `~/.openclaw/cron/jobs.json`，
或者在覆盖时使用 `cron.store`）中调度器仍为兼容性而接受的旧任务结构。

当前的 cron 清理包括：

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 顶层 payload 字段（`message`、`model`、`thinking`、...）→ `payload`
- 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payload `provider` delivery 别名 → 显式 `delivery.channel`
- 简单旧版 `notify: true` webhook 回退任务 → 显式 `delivery.mode="webhook"`，并设置 `delivery.to=cron.webhook`

Doctor 只会在能够做到而不改变行为时，自动迁移 `notify: true`
任务。如果某个任务将旧版通知回退与现有
非 webhook 传递模式组合在一起，Doctor 会发出警告，并将该任务留给人工审查。

### 3c）会话锁清理

Doctor 会扫描每个智能体会话目录中的过期写锁文件——这些文件是会话异常退出时
留下的。对于找到的每个锁文件，它会报告：
路径、PID、该 PID 是否仍然存活、锁年龄，以及它是否
被视为过期（PID 已死或超过 30 分钟）。在 `--fix` / `--repair`
模式下，它会自动删除过期锁文件；否则它会打印说明，
并指示你使用 `--fix` 重新运行。

### 4）状态完整性检查（会话持久化、路由和安全）

状态目录是运行层面的中枢。如果它消失了，你会失去
会话、凭证、日志和配置（除非你在别处有备份）。

Doctor 会检查：

- **状态目录缺失**：警告灾难性的状态丢失，提示重新创建
  目录，并提醒你它无法恢复缺失的数据。
- **状态目录权限**：验证可写性；提供修复权限的选项
  （并在检测到所有者/组不匹配时给出 `chown` 提示）。
- **macOS 云同步状态目录**：当状态路径解析到 iCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或
  `~/Library/CloudStorage/...` 下时发出警告，因为基于同步的路径可能导致更慢的 I/O
  以及锁/同步竞争。
- **Linux SD 或 eMMC 状态目录**：当状态路径解析到 `mmcblk*`
  挂载源时发出警告，因为基于 SD 或 eMMC 的随机 I/O 在会话和凭证写入场景下可能更慢，
  且磨损更快。
- **会话目录缺失**：`sessions/` 和会话存储目录
  是持久化历史记录并避免 `ENOENT` 崩溃所必需的。
- **转录记录不匹配**：当最近的会话条目存在缺失的
  转录文件时发出警告。
- **主会话“单行 JSONL”**：当主转录文件只有一行时发出标记
  （历史记录没有累积）。
- **多个状态目录**：当不同 home 目录下存在多个 `~/.openclaw`
  文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告
  （历史记录可能在不同安装之间分裂）。
- **远程模式提醒**：如果 `gateway.mode=remote`，Doctor 会提醒你在
  远程主机上运行它（状态存储在那里）。
- **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对
  组/全体用户可读，则发出警告，并提供收紧到 `600` 的选项。

### 5）模型认证运行状况（OAuth 过期）

Doctor 会检查 auth 存储中的 OAuth 配置文件，在令牌
即将过期/已过期时发出警告，并在安全时执行刷新。如果 Anthropic
OAuth/令牌配置文件已过期，它会建议使用 Anthropic API 密钥或
Anthropic setup-token 路径。
只有在交互模式（TTY）下运行时才会出现刷新提示；`--non-interactive`
会跳过刷新尝试。

当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、
`invalid_grant`，或提供商要求你重新登录），Doctor 会报告
需要重新认证，并打印需要运行的精确
`openclaw models auth login --provider ...`
命令。

Doctor 还会报告因以下原因而暂时不可用的 auth 配置文件：

- 短暂冷却（速率限制/超时/认证失败）
- 更长时间的禁用（计费/额度失败）

### 6）Hooks 模型验证

如果设置了 `hooks.gmail.model`，Doctor 会根据
目录和 allowlist 验证该模型引用，并在其无法解析或不被允许时发出警告。

### 7）沙箱镜像修复

启用沙箱隔离时，Doctor 会检查 Docker 镜像，并在当前镜像缺失时
提供构建或切换到旧版名称的选项。

### 7b）内置插件运行时依赖

Doctor 仅验证当前配置中处于激活状态，或由其内置清单默认启用的
内置插件的运行时依赖，例如
`plugins.entries.discord.enabled: true`、旧版
`channels.discord.enabled: true`，或默认启用的内置提供商。如果有任何依赖缺失，
Doctor 会报告这些包，并在
`openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。外部插件仍然
使用 `openclaw plugins install` / `openclaw plugins update`；Doctor 不会
为任意插件路径安装依赖。

Gateway 网关和本地 CLI 也可以在导入某个内置插件之前，
按需修复处于激活状态的内置插件运行时依赖。这些安装
限定在插件运行时安装根目录内，运行时禁用脚本，不会
写入 package lock，并且受安装根锁保护，因此并发的 CLI
或 Gateway 网关启动不会同时修改同一棵 `node_modules` 树。

### 8）Gateway 网关服务迁移和清理提示

Doctor 会检测旧版 Gateway 网关服务（`launchd`/`systemd`/`schtasks`），并
提供移除它们和使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。
它还可以扫描额外的类似 Gateway 网关服务，并打印清理提示。
带有配置文件名称的 OpenClaw Gateway 网关服务被视为一等公民，不会
被标记为“额外”。

### 8b）启动 Matrix 迁移

当某个 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，
Doctor（在 `--fix` / `--repair` 模式下）会先创建迁移前快照，然后
运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版
加密状态准备。这两个步骤都不是致命的；错误会被记录，且启动会继续。
在只读模式下（不带 `--fix` 的 `openclaw doctor`），此检查
会被完全跳过。

### 8c）设备配对和认证漂移

Doctor 现在会在常规运行状况检查中检查设备配对状态。

它会报告的内容：

- 待处理的首次配对请求
- 已配对设备的待处理角色升级
- 已配对设备的待处理作用域升级
- 公钥不匹配修复：设备 ID 仍然匹配，但设备
  身份已不再与已批准记录匹配
- 已配对记录中缺少已批准角色的活动令牌
- 已配对令牌的作用域漂移到已批准配对基线之外
- 当前机器上的本地缓存设备令牌条目，若其早于
  Gateway 网关侧令牌轮换，或带有过期作用域元数据

Doctor 不会自动批准配对请求，也不会自动轮换设备令牌。它
只会打印精确的下一步操作：

- 使用 `openclaw devices list` 检查待处理请求
- 使用 `openclaw devices approve <requestId>` 批准准确的请求
- 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新令牌
- 使用 `openclaw devices remove <deviceId>` 删除并重新批准过期记录

这填补了常见的“已经配对，但仍然收到需要配对提示”
漏洞：Doctor 现在能够区分首次配对、待处理的角色/作用域
升级，以及过期令牌/设备身份漂移。

### 9）安全警告

当某个提供商对私信开放但没有 allowlist，或
某项策略配置得很危险时，Doctor 会发出警告。

### 10）`systemd linger`（Linux）

如果作为 `systemd` 用户服务运行，Doctor 会确保已启用 lingering，这样
Gateway 网关在注销后仍能保持运行。

### 11）工作区状态（Skills、插件和旧版目录）

Doctor 会打印默认智能体的工作区状态摘要：

- **Skills 状态**：统计可用、缺少要求、以及被 allowlist 阻止的 Skills 数量。
- **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录
  与当前工作区并存时发出警告。
- **插件状态**：统计已启用/已禁用/出错的插件数量；列出任何
  出错插件的插件 ID；报告内置插件能力。
- **插件兼容性警告**：标记与
  当前运行时存在兼容性问题的插件。
- **插件诊断**：显示插件注册表在
  加载时发出的任何警告或错误。

### 11b）引导文件大小

Doctor 会检查工作区引导文件（例如 `AGENTS.md`、
`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的
字符预算。它会报告每个文件的原始字符数与注入字符数、截断
百分比、截断原因（`max/file` 或 `max/total`），以及总注入
字符数占总预算的比例。当文件被截断或接近限制时，
Doctor 会打印关于调整 `agents.defaults.bootstrapMaxChars`
和 `agents.defaults.bootstrapTotalMaxChars` 的建议。

### 11c）Shell 自动补全

Doctor 会检查当前 shell
（zsh、bash、fish 或 PowerShell）是否已安装 Tab 自动补全：

- 如果 shell 配置文件使用较慢的动态自动补全模式
  （`source <(openclaw completion ...)`），Doctor 会将其升级为速度更快的
  缓存文件变体。
- 如果配置文件中已配置自动补全，但缓存文件缺失，
  Doctor 会自动重新生成缓存。
- 如果完全没有配置自动补全，Doctor 会提示你安装它
  （仅交互模式；使用 `--non-interactive` 时跳过）。

运行 `openclaw completion --write-state` 可手动重新生成缓存。

### 12）Gateway 网关认证检查（本地令牌）

Doctor 会检查本地 Gateway 网关令牌认证的就绪情况。

- 如果令牌模式需要令牌且没有任何令牌来源，Doctor 会提供生成令牌的选项。
- 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 会发出警告，并且不会用明文覆盖它。
- `openclaw doctor --generate-gateway-token` 仅会在未配置令牌 SecretRef 时强制生成令牌。

### 12b）只读的 SecretRef 感知修复

某些修复流程需要检查已配置的凭证，而不能削弱运行时的快速失败行为。

- `openclaw doctor --fix` 现在使用与 Status 系列命令相同的只读 SecretRef 摘要模型来执行有针对性的配置修复。
- 例如：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修复会在可用时尝试使用已配置的 bot 凭证。
- 如果 Telegram bot 令牌通过 SecretRef 配置，但在当前命令路径中不可用，Doctor 会报告该凭证“已配置但不可用”，并跳过自动解析，而不是崩溃或误报令牌缺失。

### 13）Gateway 网关运行状况检查 + 重启

Doctor 会执行运行状况检查，并在 Gateway 网关看起来
不健康时提供重启选项。

### 13b）Memory 搜索就绪情况

Doctor 会检查为默认智能体配置的 Memory 搜索嵌入提供商是否已就绪。
其行为取决于已配置的后端和提供商：

- **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。
  如果不可用，会打印修复指引，包括 npm 包和手动二进制路径选项。
- **显式本地提供商**：检查本地模型文件或已识别的
  远程/可下载模型 URL 是否存在。如果缺失，会建议切换到远程提供商。
- **显式远程提供商**（`openai`、`voyage` 等）：验证环境变量
  或 auth 存储中是否存在 API 密钥。如果缺失，会打印可执行的修复提示。
- **自动提供商**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程
  提供商。

当 Gateway 网关探测结果可用时（检查时 Gateway 网关处于健康状态），
Doctor 会将其结果与 CLI 可见配置进行交叉比对，并指出
任何差异。

使用 `openclaw memory status --deep` 可验证运行时嵌入就绪情况。

### 14）渠道状态警告

如果 Gateway 网关处于健康状态，Doctor 会执行渠道状态探测，并报告
警告以及建议的修复方法。

### 15）supervisor 配置审计 + 修复

Doctor 会检查已安装的 supervisor 配置（`launchd`/`systemd`/`schtasks`）中
是否缺少默认值或默认值已过期（例如 `systemd` 的 `network-online` 依赖和
重启延迟）。当发现不匹配时，它会建议更新，并且可以
将服务文件/任务重写为当前默认值。

说明：

- `openclaw doctor` 会在重写 supervisor 配置前进行提示。
- `openclaw doctor --yes` 会接受默认修复提示。
- `openclaw doctor --repair` 会在不提示的情况下应用建议修复。
- `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
- 如果令牌认证需要令牌，而 `gateway.auth.token` 由 SecretRef 管理，Doctor 在服务安装/修复时会验证该 SecretRef，但不会将解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌认证需要令牌，而已配置的令牌 SecretRef 无法解析，Doctor 会阻止安装/修复路径，并提供可执行的指引。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，Doctor 会阻止安装/修复，直到显式设置模式。
- 对于 Linux user-systemd 单元，Doctor 的令牌漂移检查现在在比较服务认证元数据时会同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
- 你始终可以通过 `openclaw gateway install --force` 强制执行完整重写。

### 16）Gateway 网关运行时 + 端口诊断

Doctor 会检查服务运行时（PID、上次退出状态），并在
服务已安装但实际上未运行时发出警告。它还会检查 Gateway 网关端口上的端口冲突
（默认 `18789`），并报告可能原因（Gateway 网关已在运行、
SSH 隧道）。

### 17）Gateway 网关运行时最佳实践

当 Gateway 网关服务运行在 Bun 或版本管理的 Node 路径
（`nvm`、`fnm`、`volta`、`asdf` 等）上时，Doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，
而版本管理器路径可能会在升级后失效，因为服务不会
加载你的 shell 初始化。Doctor 会在系统 Node 安装可用时，提供迁移到
系统 Node 安装的选项（Homebrew/apt/choco）。

### 18）配置写入 + 向导元数据

Doctor 会持久化所有配置更改，并写入向导元数据以记录
本次 Doctor 运行。

### 19）工作区提示（备份 + Memory 系统）

当工作区缺少 Memory 系统时，Doctor 会提出建议；如果工作区尚未纳入 git，
它还会打印备份提示。

参见 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)，获取关于
工作区结构和 git 备份的完整指南（推荐使用私有 GitHub 或 GitLab）。

## 相关内容

- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
- [Gateway 网关运行手册](/zh-CN/gateway)
