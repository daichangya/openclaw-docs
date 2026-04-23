---
read_when:
    - 添加或修改 Doctor 迁移逻辑
    - 引入破坏性配置更改
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-04-23T20:48:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 783ea62808bd3d4407d2c5981aaec63ada98e7d60cca9c0af297929a1a4d119a
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它用于修复过时的
配置/状态、执行健康检查，并提供可执行的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无头 / 自动化

```bash
openclaw doctor --yes
```

接受默认选项而不提示（在适用时，包括重启/服务/沙箱修复步骤）。

```bash
openclaw doctor --repair
```

无需提示即可应用推荐修复（在安全情况下执行修复 + 重启）。

```bash
openclaw doctor --repair --force
```

也应用激进修复（会覆盖自定义 supervisor 配置）。

```bash
openclaw doctor --non-interactive
```

在无提示模式下运行，并且只应用安全迁移（配置规范化 + 磁盘状态迁移）。会跳过需要人工确认的重启/服务/沙箱操作。
检测到旧版状态迁移时会自动运行。

```bash
openclaw doctor --deep
```

扫描系统服务中的额外 Gateway 网关安装（launchd/systemd/schtasks）。

如果你想先检查更改再写入，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会做什么（概要）

- 针对 git 安装的可选预检查更新（仅交互模式）。
- UI 协议新鲜度检查（当协议 schema 更新时重建控制 UI）。
- 健康检查 + 重启提示。
- Skills 状态摘要（可用/缺失/阻止）和插件状态。
- 针对旧值的配置规范化。
- 将旧版扁平 `talk.*` 字段迁移为 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
- 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移检查。
- OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
- 针对 OpenAI Codex OAuth 配置的 OAuth TLS 前提条件检查。
- 旧版磁盘状态迁移（sessions/智能体目录/WhatsApp 身份验证）。
- 旧版插件 manifest 合约键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- 旧版 Cron 存储迁移（`jobId`、`schedule.cron`、顶层投递/负载字段、负载中的 `provider`、简单的 `notify: true` webhook 回退作业）。
- 会话锁文件检查和过期锁清理。
- 状态完整性和权限检查（sessions、转录、状态目录）。
- 在本地运行时检查配置文件权限（chmod 600）。
- 模型身份验证健康检查：检查 OAuth 过期情况，可刷新即将过期的令牌，并报告 auth-profile 冷却/禁用状态。
- 额外工作区目录检测（`~/openclaw`）。
- 启用沙箱隔离时的沙箱镜像修复。
- 旧版服务迁移和额外 Gateway 网关检测。
- Matrix 渠道旧版状态迁移（在 `--fix` / `--repair` 模式下）。
- Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
- 渠道状态警告（从运行中的 Gateway 网关探测）。
- Supervisor 配置审计（launchd/systemd/schtasks），并可选择修复。
- Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
- Gateway 网关端口冲突诊断（默认 `18789`）。
- 针对开放私信策略的安全警告。
- 本地令牌模式下的 Gateway 网关身份验证检查（当不存在令牌来源时，提供生成令牌；不会覆盖 token SecretRef 配置）。
- 设备配对故障检测（首次配对请求待处理、角色/作用域升级待处理、本地设备令牌缓存过期漂移，以及已配对记录的身份验证漂移）。
- Linux 上的 systemd linger 检查。
- 工作区引导文件大小检查（对上下文文件进行截断/接近上限警告）。
- Shell 补全状态检查和自动安装/升级。
- Memory 搜索嵌入提供商就绪状态检查（本地模型、远程 API 密钥或 QMD 二进制）。
- 源代码安装检查（pnpm 工作区不匹配、缺失 UI 资源、缺失 tsx 二进制）。
- 写入更新后的配置 + 向导元数据。

## Dreams UI 回填和重置

控制 UI 的 Dreams 场景包含用于 grounded dreaming 工作流的 **Backfill**、**Reset** 和 **Clear Grounded**
操作。这些操作使用 gateway
doctor 风格的 RPC 方法，但它们**不是** `openclaw doctor` CLI
修复/迁移的一部分。

它们的作用：

- **Backfill** 会扫描当前活动
  工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM diary 流程，并将可逆的回填
  条目写入 `DREAMS.md`。
- **Reset** 只会从 `DREAMS.md` 中移除那些已标记的回填 diary 条目。
- **Clear Grounded** 只会移除那些来自历史回放、且尚未积累实时回忆或每日支持的
  暂存 grounded-only 短期条目。

它们**不会**自动执行的事：

- 不会编辑 `MEMORY.md`
- 不会运行完整的 doctor 迁移
- 不会自动将 grounded 候选项暂存到实时短期
  提升存储中，除非你先显式运行对应的暂存 CLI 路径

如果你希望 grounded 历史回放影响正常的深度提升
流程，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这会将 grounded 持久候选项暂存到短期 dreaming 存储中，同时
保留 `DREAMS.md` 作为审核界面。

## 详细行为和原理

### 0）可选更新（git 安装）

如果这是一个 git 检出，并且 doctor 以交互模式运行，它会在运行 doctor 之前提供
更新（fetch/rebase/build）选项。

### 1）配置规范化

如果配置中包含旧版值形态（例如 `messages.ackReaction`
没有渠道专属覆盖），doctor 会将它们规范化为当前
schema。

这也包括旧版 Talk 扁平字段。当前公开的 Talk 配置是
`talk.provider` + `talk.providers.<provider>`。Doctor 会将旧版
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` 形式重写为提供商映射。

### 2）旧版配置键迁移

当配置中包含已弃用键时，其他命令会拒绝运行，并要求
你运行 `openclaw doctor`。

Doctor 将会：

- 说明发现了哪些旧版键。
- 显示它应用的迁移。
- 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

当 Gateway 网关在启动时检测到旧版配置格式时，也会自动运行 doctor 迁移，
因此过期配置无需手动干预也会被修复。
Cron 作业存储迁移由 `openclaw doctor --fix` 处理。

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
- `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 对于配置了具名 `accounts` 但仍保留单账户顶层渠道值的渠道，将这些账户作用域值移动到该渠道选定的提升账户中（大多数渠道为 `accounts.default`；Matrix 可保留已有的匹配具名/默认目标）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- 移除 `browser.relayBindHost`（旧版扩展 relay 设置）

Doctor 警告还包括针对多账户渠道的默认账户指引：

- 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 会警告回退路由可能会选中意外的账户。
- 如果 `channels.<channel>.defaultAccount` 设置为未知账户 ID，doctor 会发出警告并列出已配置的账户 ID。

### 2b）OpenCode 提供商覆盖

如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，
它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。
这可能导致模型被强制走错误的 API，或把费用清零。Doctor 会发出警告，以便你删除该覆盖并恢复按模型路由 API + 费用。

### 2c）浏览器迁移和 Chrome MCP 就绪状态

如果你的浏览器配置仍然指向已移除的 Chrome 扩展路径，doctor
会将其规范化为当前基于主机本地的 Chrome MCP 附加模型：

- `browser.profiles.*.driver: "extension"` 会变为 `"existing-session"`
- `browser.relayBindHost` 会被移除

当你使用 `defaultProfile:
"user"` 或配置了 `existing-session` 配置文件时，doctor 也会审计主机本地的 Chrome MCP 路径：

- 检查在同一主机上是否安装了 Google Chrome，以支持默认
  自动连接配置文件
- 检查检测到的 Chrome 版本，并在版本低于 Chrome 144 时发出警告
- 提醒你在浏览器 inspect 页面中启用远程调试（例如
  `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`
  或 `edge://inspect/#remote-debugging`）

Doctor 无法替你启用 Chrome 端设置。主机本地 Chrome MCP
仍然要求：

- 在 gateway/节点主机上安装 144+ 的 Chromium 内核浏览器
- 浏览器在本地运行
- 在该浏览器中启用远程调试
- 在浏览器中批准首次附加的同意提示

这里的就绪状态仅针对本地附加前提条件。Existing-session 仍保留
当前 Chrome MCP 路由限制；`responsebody`、PDF
导出、下载拦截和批量操作等高级路由仍然需要托管浏览器
或原始 CDP 配置文件。

此检查**不适用于** Docker、沙箱、remote-browser 或其他
无头流程。这些流程仍然使用原始 CDP。

### 2d）OAuth TLS 前提条件

当配置了 OpenAI Codex OAuth 配置文件时，doctor 会探测 OpenAI
授权端点，以验证本地 Node/OpenSSL TLS 栈是否可以校验证书链。如果探测因证书错误失败（例如
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），
doctor 会输出按平台区分的修复指引。在 macOS 上使用 Homebrew 安装的 Node 时，
修复通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 gateway 健康，探测也会运行。

### 2c）Codex OAuth 提供商覆盖

如果你之前在
`models.providers.openai-codex` 下添加过旧版 OpenAI 传输设置，它们可能会遮蔽较新版本自动使用的内置 Codex OAuth
提供商路径。Doctor 在发现这些旧传输设置与 Codex OAuth 并存时会发出警告，
这样你就可以删除或重写过时的传输覆盖，并恢复内置的路由/回退行为。
自定义代理和仅请求头覆盖仍然受支持，不会触发此警告。

### 3）旧版状态迁移（磁盘布局）

Doctor 可以将较旧的磁盘布局迁移到当前结构：

- 会话存储 + 转录：
  - 从 `~/.openclaw/sessions/` 迁移到 `~/.openclaw/agents/<agentId>/sessions/`
- 智能体目录：
  - 从 `~/.openclaw/agent/` 迁移到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 身份验证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
  - 迁移到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 id：`default`）

这些迁移会尽力而为，并且是幂等的；当 doctor
将任何旧版文件夹保留为备份时，会发出警告。Gateway 网关/CLI 在启动时也会自动迁移
旧版 sessions + 智能体目录，因此历史记录/身份验证/模型会落入
按智能体划分的路径，而无需手动运行 doctor。WhatsApp 身份验证则有意只
通过 `openclaw doctor` 迁移。Talk provider/provider-map 规范化现在按结构相等性比较，
因此仅键顺序不同不再触发重复的无操作 `doctor --fix` 更改。

### 3a）旧版插件 manifest 迁移

Doctor 会扫描所有已安装插件的 manifest，查找已弃用的顶层能力
键（`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、
`webSearchProviders`）。发现后，它会提供将它们移动到 `contracts`
对象中的选项，并原地重写 manifest 文件。该迁移是幂等的；
如果 `contracts` 键中已经包含相同的值，则会移除旧版键，
而不会重复数据。

### 3b）旧版 Cron 存储迁移

Doctor 还会检查 Cron 作业存储（默认是 `~/.openclaw/cron/jobs.json`，
如果覆盖则使用 `cron.store`）中调度器仍为兼容性而接受的旧作业形态。

当前的 Cron 清理包括：

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 顶层负载字段（`message`、`model`、`thinking`、...）→ `payload`
- 顶层投递字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- 负载中的 `provider` 投递别名 → 显式的 `delivery.channel`
- 简单的旧版 `notify: true` webhook 回退作业 → 显式的 `delivery.mode="webhook"` 并设置 `delivery.to=cron.webhook`

Doctor 仅在能够保证**不改变行为**的前提下，
才会自动迁移 `notify: true` 作业。如果某个作业将旧版 notify 回退与现有
非 webhook 投递模式混用，doctor 会发出警告，并将该作业留待手动审查。

### 3c）会话锁清理

Doctor 会扫描每个智能体会话目录中的过期写锁文件 —— 这些文件通常是
会话异常退出后遗留下来的。对于发现的每个锁文件，它会报告：
路径、PID、该 PID 是否仍然存活、锁文件年龄，以及它是否
被视为过期（PID 已失效或超过 30 分钟）。在 `--fix` / `--repair`
模式下，它会自动移除过期锁文件；否则它会打印说明，并
提示你使用 `--fix` 重新运行。

### 4）状态完整性检查（会话持久化、路由和安全性）

状态目录是运行层面的中枢神经。如果它消失了，你将丢失
会话、凭证、日志和配置（除非你在别处有备份）。

Doctor 会检查：

- **状态目录缺失**：警告可能发生灾难性状态丢失，提示重新创建
  该目录，并提醒你它无法恢复丢失的数据。
- **状态目录权限**：验证是否可写；可提供修复权限选项
  （并在检测到所有者/组不匹配时给出 `chown` 提示）。
- **macOS 云同步状态目录**：当状态路径解析到 iCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或
  `~/Library/CloudStorage/...` 下时发出警告，因为基于同步的路径可能导致更慢的 I/O
  和锁/同步竞争。
- **Linux SD 或 eMMC 状态目录**：当状态路径解析到 `mmcblk*`
  挂载源时发出警告，因为基于 SD 或 eMMC 的随机 I/O 在会话和凭证写入场景下可能更慢且磨损更快。
- **会话目录缺失**：`sessions/` 和会话存储目录是持久化历史记录和避免 `ENOENT` 崩溃所必需的。
- **转录不匹配**：当最近的会话条目缺少
  转录文件时发出警告。
- **主会话 “1 行 JSONL”**：当主转录只有一行时发出标记（表明历史未持续累积）。
- **多个状态目录**：当多个 `~/.openclaw` 文件夹存在于不同
  home 目录中，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史可能会在不同安装之间分裂）。
- **远程模式提醒**：如果 `gateway.mode=remote`，doctor 会提醒你在
  远程主机上运行它（状态存放在那里）。
- **配置文件权限**：如果 `~/.openclaw/openclaw.json` 允许
  组/所有人读取，doctor 会发出警告并提供收紧到 `600` 的选项。

### 5）模型身份验证健康检查（OAuth 过期）

Doctor 会检查身份验证存储中的 OAuth 配置，在令牌即将
过期/已过期时发出警告，并在安全时刷新它们。如果 Anthropic
OAuth/令牌配置已过期，它会建议使用 Anthropic API 密钥或
Anthropic setup-token 路径。
仅在交互式运行（TTY）时才会出现刷新提示；`--non-interactive`
会跳过刷新尝试。

当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、
`invalid_grant`，或提供商要求你重新登录），doctor 会报告
需要重新身份验证，并打印需要运行的精确 `openclaw models auth login --provider ...`
命令。

Doctor 还会报告因以下原因而暂时不可用的身份验证配置：

- 短期冷却（速率限制/超时/身份验证失败）
- 较长期禁用（计费/额度失败）

### 6）Hooks 模型验证

如果设置了 `hooks.gmail.model`，doctor 会根据目录和 allowlist
验证该模型引用，并在其无法解析或不被允许时发出警告。

### 7）沙箱镜像修复

启用沙箱隔离时，doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或
切换到旧版名称的选项。

### 7b）内置插件运行时依赖

Doctor 只会验证当前配置中处于活动状态或由其内置 manifest 默认启用的内置插件的运行时依赖，例如
`plugins.entries.discord.enabled: true`、旧版
`channels.discord.enabled: true`，或默认启用的内置提供商。如果缺失，
doctor 会报告这些包，并在
`openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。外部插件仍需
使用 `openclaw plugins install` / `openclaw plugins update`；doctor 不会为任意插件路径
安装依赖。

### 8）Gateway 网关服务迁移和清理提示

Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并
提供移除它们以及使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的类似 gateway 服务，并输出清理提示。
带 profile 名称的 OpenClaw gateway 服务被视为一等公民，不会
被标记为“额外”。

### 8b）启动时 Matrix 迁移

当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，
doctor（在 `--fix` / `--repair` 模式下）会先创建迁移前快照，然后
执行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版
加密状态准备。这两个步骤都不是致命的；错误会被记录，启动会继续。在只读模式下（不带 `--fix` 的 `openclaw doctor`），此检查
会被完全跳过。

### 8c）设备配对和身份验证漂移

Doctor 现在会将设备配对状态纳入常规健康检查。

它会报告：

- 首次配对请求待处理
- 已配对设备的角色升级待处理
- 已配对设备的作用域升级待处理
- 公钥不匹配修复：设备 id 仍匹配，但设备
  身份已与批准记录不一致
- 已批准角色的配对记录缺少有效令牌
- 已配对令牌的作用域漂移到已批准配对基线之外
- 当前机器的本地缓存设备令牌条目早于
  gateway 端令牌轮换，或携带过期的作用域元数据

Doctor 不会自动批准配对请求，也不会自动轮换设备令牌。它
会直接打印精确的下一步操作：

- 使用 `openclaw devices list` 检查待处理请求
- 使用 `openclaw devices approve <requestId>` 批准对应请求
- 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新的令牌
- 使用 `openclaw devices remove <deviceId>` 删除并重新批准过期记录

这填补了常见的“已配对但仍提示需要配对”
问题：doctor 现在可以区分首次配对、待处理角色/作用域
升级，以及过期令牌/设备身份漂移。

### 9）安全警告

当某个提供商在没有 allowlist 的情况下对私信开放时，或
某个策略配置方式存在危险时，doctor 会发出警告。

### 10）systemd linger（Linux）

如果作为 systemd 用户服务运行，doctor 会确保启用了 lingering，以便
gateway 在注销后仍能保持运行。

### 11）工作区状态（Skills、插件和旧版目录）

Doctor 会输出默认智能体工作区状态的摘要：

- **Skills 状态**：统计可用、缺少要求和被 allowlist 阻止的 Skills 数量。
- **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录
  与当前工作区并存时发出警告。
- **插件状态**：统计已加载/已禁用/出错的插件数量；列出出现
  错误的插件 ID；报告内置插件能力。
- **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
- **插件诊断**：显示插件注册表在加载时发出的任何警告或错误。

### 11b）引导文件大小

Doctor 会检查工作区引导文件（例如 `AGENTS.md`、
`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过已配置的
字符预算。它会报告每个文件的原始字符数与注入后字符数、截断
百分比、截断原因（`max/file` 或 `max/total`），以及总注入
字符数占总预算的比例。当文件被截断或接近上限时，doctor 会打印关于调整 `agents.defaults.bootstrapMaxChars`
和 `agents.defaults.bootstrapTotalMaxChars` 的建议。

### 11c）Shell 补全

Doctor 会检查当前 shell
（zsh、bash、fish 或 PowerShell）是否已安装 tab 补全：

- 如果 shell 配置文件使用的是较慢的动态补全模式
  （`source <(openclaw completion ...)`），doctor 会将其升级为更快的
  缓存文件方案。
- 如果配置文件中已配置补全，但缓存文件缺失，
  doctor 会自动重新生成缓存。
- 如果完全没有配置补全，doctor 会提示安装它
  （仅交互模式；`--non-interactive` 时跳过）。

运行 `openclaw completion --write-state` 可手动重新生成缓存。

### 12）Gateway 网关身份验证检查（本地令牌）

Doctor 会检查本地 Gateway 网关令牌身份验证是否就绪。

- 如果令牌模式需要令牌但不存在令牌来源，doctor 会提供生成令牌的选项。
- 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，doctor 会发出警告，且不会用明文覆盖它。
- `openclaw doctor --generate-gateway-token` 仅在未配置 token SecretRef 时才会强制生成。

### 12b）只读的 SecretRef 感知修复

某些修复流程需要检查已配置凭证，而又不能削弱运行时快速失败行为。

- `openclaw doctor --fix` 现在对目标配置修复使用与 status 系列命令相同的只读 SecretRef 摘要模型。
- 示例：Telegram `allowFrom` / `groupAllowFrom` 中 `@username` 的修复会在可用时尝试使用已配置的机器人凭证。
- 如果 Telegram 机器人令牌通过 SecretRef 配置，但在当前命令路径中不可用，doctor 会报告该凭证是“已配置但当前不可用”，并跳过自动解析，而不是崩溃或错误地将令牌报告为缺失。

### 13）Gateway 网关健康检查 + 重启

Doctor 会运行健康检查，并在 Gateway 网关看起来
不健康时提供重启选项。

### 13b）Memory 搜索就绪状态

Doctor 会检查为默认智能体配置的 memory 搜索嵌入提供商是否已就绪。
其行为取决于所配置的后端和提供商：

- **QMD 后端**：探测 `qmd` 二进制是否可用且可启动。
  如果不可用，会输出修复指引，包括 npm 包和手动二进制路径选项。
- **显式本地提供商**：检查本地模型文件或可识别的
  远程/可下载模型 URL。若缺失，会建议切换到远程提供商。
- **显式远程提供商**（`openai`、`voyage` 等）：验证环境或身份验证存储中是否存在 API 密钥。若缺失，会输出可执行的修复提示。
- **自动提供商**：先检查本地模型可用性，然后按自动选择顺序尝试每个远程
  提供商。

当 Gateway 网关探测结果可用时（即检查时 gateway 处于健康状态），doctor 会将该结果与 CLI 可见配置交叉比对，并标记
任何不一致之处。

使用 `openclaw memory status --deep` 可在运行时验证嵌入就绪状态。

### 14）渠道状态警告

如果 gateway 处于健康状态，doctor 会运行渠道状态探测，并输出
带有建议修复方式的警告。

### 15）Supervisor 配置审计 + 修复

Doctor 会检查已安装的 supervisor 配置（launchd/systemd/schtasks）中是否存在
缺失或过时的默认值（例如 systemd 的 network-online 依赖和
重启延迟）。发现不匹配时，它会建议更新，并可将
服务文件/任务重写为当前默认值。

说明：

- `openclaw doctor` 会在重写 supervisor 配置前提示确认。
- `openclaw doctor --yes` 会接受默认修复提示。
- `openclaw doctor --repair` 会在无提示下应用推荐修复。
- `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
- 如果令牌身份验证需要令牌，且 `gateway.auth.token` 由 SecretRef 管理，doctor 的服务安装/修复会验证该 SecretRef，但不会将解析后的明文令牌值持久化到 supervisor 服务环境元数据中。
- 如果令牌身份验证需要令牌，而配置的 token SecretRef 无法解析，doctor 会阻止安装/修复路径，并给出可执行指引。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但 `gateway.auth.mode` 未设置，doctor 会阻止安装/修复，直到显式设置 mode。
- 对于 Linux user-systemd 单元，doctor 的令牌漂移检查现在在比较服务身份验证元数据时会同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
- 你始终可以通过 `openclaw gateway install --force` 强制执行完整重写。

### 16）Gateway 网关运行时 + 端口诊断

Doctor 会检查服务运行时（PID、最近退出状态），并在
服务已安装但实际上未运行时发出警告。它还会检查 gateway 端口
（默认 `18789`）是否存在冲突，并报告可能原因（gateway 已在运行、
SSH tunnel）。

### 17）Gateway 网关运行时最佳实践

当 gateway 服务运行在 Bun 上，或使用版本管理器控制的 Node 路径
（`nvm`、`fnm`、`volta`、`asdf` 等）时，doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，
而版本管理器路径在升级后可能失效，因为服务不会
加载你的 shell 初始化。Doctor 会在系统 Node 可用时提供迁移到系统级 Node 安装的选项（Homebrew/apt/choco）。

### 18）配置写入 + 向导元数据

Doctor 会持久化所有配置更改，并写入向导元数据以记录
doctor 的运行情况。

### 19）工作区提示（备份 + memory 系统）

当工作区缺少 memory 系统时，doctor 会给出建议；如果工作区尚未纳入 git 管理，则会输出备份提示。

有关工作区结构和 git 备份（推荐使用私有 GitHub 或 GitLab）的完整指南，请参见 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace)。
