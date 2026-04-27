---
read_when:
    - 添加或修改 Doctor 迁移
    - 引入破坏性配置变更
sidebarTitle: Doctor
summary: Doctor 命令：健康检查、配置迁移和修复步骤
title: Doctor
x-i18n:
    generated_at: "2026-04-27T04:42:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5198e143ce79041fc19a6e45f436ba4e938e99d95cb00ef5aa4ad62d5f76fb1
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它会修复过时的配置/状态、检查健康状况，并提供可执行的修复步骤。

## 快速开始

```bash
openclaw doctor
```

### 无头模式和自动化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    接受默认选项而不提示（包括在适用时的重启/服务/沙箱修复步骤）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不经提示应用推荐修复（在安全情况下执行修复 + 重启）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    还会应用激进修复（覆盖自定义 supervisor 配置）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    在不提示的情况下运行，并且只应用安全迁移（配置规范化 + 磁盘上的状态移动）。跳过需要人工确认的重启/服务/沙箱操作。检测到旧状态时，会自动运行旧状态迁移。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    扫描系统服务以查找额外的 Gateway 网关安装（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在写入前先查看变更，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 它会做什么（摘要）

<AccordionGroup>
  <Accordion title="健康状况、UI 和更新">
    - 可选的 git 安装预更新（仅交互模式）。
    - UI 协议新鲜度检查（当协议 schema 更新时重建 Control UI）。
    - 健康检查 + 重启提示。
    - Skills 状态摘要（可用/缺失/受阻）和插件状态。
  </Accordion>
  <Accordion title="配置和迁移">
    - 针对旧值的配置规范化。
    - 将旧式扁平 `talk.*` 字段迁移为 `talk.provider` + `talk.providers.<provider>` 的 Talk 配置迁移。
    - 针对旧版 Chrome 扩展配置和 Chrome MCP 就绪状态的浏览器迁移检查。
    - OpenCode 提供商覆盖警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - 针对 OpenAI Codex OAuth 配置的 OAuth TLS 前置条件检查。
    - 旧版磁盘状态迁移（sessions/agent 目录/WhatsApp 身份验证）。
    - 旧版插件 manifest 合同键迁移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 旧版 cron 存储迁移（`jobId`、`schedule.cron`、顶层 delivery/payload 字段、payload `provider`、简单的 `notify: true` webhook 回退任务）。
    - 将旧版智能体 runtime-policy 迁移到 `agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。
  </Accordion>
  <Accordion title="状态和完整性">
    - 会话锁文件检查和过期锁清理。
    - 修复受影响的 2026.4.24 构建创建的重复 prompt-rewrite 分支的会话转录。
    - 状态完整性和权限检查（sessions、transcripts、state 目录）。
    - 本地运行时的配置文件权限检查（`chmod 600`）。
    - 模型身份验证健康状况：检查 OAuth 过期情况，可以刷新即将过期的令牌，并报告 auth-profile 冷却/禁用状态。
    - 额外工作区目录检测（`~/openclaw`）。
  </Accordion>
  <Accordion title="Gateway 网关、服务和 supervisors">
    - 在启用沙箱隔离时修复沙箱镜像。
    - 旧版服务迁移和额外 Gateway 网关检测。
    - Matrix 渠道旧状态迁移（在 `--fix` / `--repair` 模式下）。
    - Gateway 网关运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
    - 渠道状态警告（从运行中的 Gateway 网关探测）。
    - supervisor 配置审计（launchd/systemd/schtasks）以及可选修复。
    - Gateway 网关运行时最佳实践检查（Node 与 Bun、版本管理器路径）。
    - Gateway 网关端口冲突诊断（默认 `18789`）。
  </Accordion>
  <Accordion title="身份验证、安全性和配对">
    - 针对开放私信策略的安全警告。
    - 本地令牌模式下的 Gateway 网关身份验证检查（当不存在令牌来源时提供令牌生成功能；不会覆盖令牌 SecretRef 配置）。
    - 设备配对问题检测（首次配对请求待处理、角色/作用域升级待处理、过期的本地设备令牌缓存漂移，以及已配对记录的身份验证漂移）。
  </Accordion>
  <Accordion title="工作区和 shell">
    - Linux 上的 systemd linger 检查。
    - 工作区引导文件大小检查（针对上下文文件的截断/接近限制警告）。
    - shell 补全状态检查以及自动安装/升级。
    - Memory 搜索嵌入提供商就绪检查（本地模型、远程 API 密钥或 QMD 二进制文件）。
    - 源码安装检查（pnpm 工作区不匹配、缺失 UI 资源、缺失 tsx 二进制文件）。
    - 写入更新后的配置 + 向导元数据。
  </Accordion>
</AccordionGroup>

## Dreams UI 回填和重置

Control UI 的 Dreams 场景为 grounded dreaming 工作流提供 **Backfill**、**Reset** 和 **Clear Grounded** 操作。这些操作使用 Gateway 网关风格的 doctor RPC 方法，但它们**不是** `openclaw doctor` CLI 修复/迁移的一部分。

它们的作用：

- **Backfill** 会扫描活动工作区中的历史 `memory/YYYY-MM-DD.md` 文件，运行 grounded REM diary 流程，并将可逆的回填条目写入 `DREAMS.md`。
- **Reset** 只会从 `DREAMS.md` 中移除这些已标记的回填 diary 条目。
- **Clear Grounded** 只会移除那些来自历史回放、且尚未累积实时 recall 或每日支持的已暂存 grounded-only 短期条目。

它们**本身不会**做的事：

- 不会编辑 `MEMORY.md`
- 不会运行完整的 doctor 迁移
- 不会自动将 grounded 候选项暂存到实时短期提升存储中，除非你先显式运行已暂存的 CLI 路径

如果你希望 grounded 历史回放影响正常的深度提升流程，请改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这样会将 grounded 持久候选项暂存到短期 dreaming 存储中，同时保留 `DREAMS.md` 作为审查界面。

## 详细行为和原因说明

<AccordionGroup>
  <Accordion title="0. 可选更新（git 安装）">
    如果这是一个 git 检出，且 doctor 以交互方式运行，它会在运行 doctor 之前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 配置规范化">
    如果配置包含旧版值结构（例如没有渠道特定覆盖的 `messages.ackReaction`），doctor 会将其规范化为当前 schema。

    这也包括旧版 Talk 扁平字段。当前公开的 Talk 配置为 `talk.provider` + `talk.providers.<provider>`。Doctor 会将旧版 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 结构重写到提供商映射中。

  </Accordion>
  <Accordion title="2. 旧版配置键迁移">
    当配置包含已弃用键时，其他命令会拒绝运行，并要求你运行 `openclaw doctor`。

    Doctor 将会：

    - 说明发现了哪些旧版键。
    - 显示它应用的迁移。
    - 使用更新后的 schema 重写 `~/.openclaw/openclaw.json`。

    当 Gateway 网关在启动时检测到旧版配置格式，也会自动运行 doctor 迁移，因此过期配置无需手动干预即可修复。Cron 作业存储迁移由 `openclaw doctor --fix` 处理。

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
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 对于具有命名 `accounts`、但仍残留单账户顶层渠道值的渠道，将这些账户作用域的值移动到为该渠道选定的提升账户中（大多数渠道使用 `accounts.default`；Matrix 可以保留现有匹配的命名/默认目标）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（旧版扩展 relay 设置）
    - 旧版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 网关启动时也会跳过 `api` 被设置为未来或未知枚举值的提供商，而不是以封闭失败方式直接报错）

    Doctor 警告还包括针对多账户渠道的账户默认值指导：

    - 如果配置了两个或更多 `channels.<channel>.accounts` 条目，但没有设置 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 会警告回退路由可能会选中意外的账户。
    - 如果 `channels.<channel>.defaultAccount` 被设置为未知账户 ID，doctor 会发出警告并列出已配置的账户 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供商覆盖">
    如果你手动添加了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode 目录。这可能会强制模型走错误的 API，或者将成本归零。Doctor 会发出警告，以便你移除该覆盖并恢复按模型路由的 API + 成本设置。
  </Accordion>
  <Accordion title="2c. 浏览器迁移和 Chrome MCP 就绪状态">
    如果你的浏览器配置仍指向已移除的 Chrome 扩展路径，doctor 会将其规范化为当前宿主机本地的 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 会变为 `"existing-session"`
    - `browser.relayBindHost` 会被移除

    当你使用 `defaultProfile: "user"` 或已配置的 `existing-session` 配置时，doctor 还会审计宿主机本地的 Chrome MCP 路径：

    - 检查同一宿主机上是否安装了 Google Chrome，以支持默认自动连接配置
    - 检查检测到的 Chrome 版本，并在低于 Chrome 144 时发出警告
    - 提醒你在浏览器的 inspect 页面中启用远程调试（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 无法为你启用 Chrome 侧设置。宿主机本地的 Chrome MCP 仍然需要：

    - Gateway 网关/节点宿主机上安装基于 Chromium 的 144+ 浏览器
    - 浏览器在本地运行
    - 在该浏览器中启用远程调试
    - 在浏览器中批准首次附加的同意提示

    这里的就绪状态仅针对本地附加前置条件。Existing-session 会保留当前 Chrome MCP 路由限制；像 `responsebody`、PDF 导出、下载拦截和批量操作这样的高级路由，仍然需要托管浏览器或原始 CDP 配置。

    此检查**不**适用于 Docker、沙箱、remote-browser 或其他无头流程。这些流程会继续使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置条件">
    当配置了 OpenAI Codex OAuth 配置时，doctor 会探测 OpenAI 授权端点，以验证本地 Node/OpenSSL TLS 栈是否能够校验证书链。如果探测因证书错误而失败（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、证书过期或自签名证书），doctor 会打印平台特定的修复指导。在使用 Homebrew Node 的 macOS 上，修复方式通常是 `brew postinstall ca-certificates`。使用 `--deep` 时，即使 Gateway 网关健康，此探测也会运行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供商覆盖">
    如果你之前在 `models.providers.openai-codex` 下添加了旧版 OpenAI 传输设置，它们可能会遮蔽新版本自动使用的内置 Codex OAuth 提供商路径。当 doctor 发现这些旧传输设置与 Codex OAuth 并存时，会发出警告，这样你就可以移除或重写过时的传输覆盖，并恢复内置的路由/回退行为。自定义代理和仅请求头覆盖仍然受支持，不会触发此警告。
  </Accordion>
  <Accordion title="2f. Codex 插件路由警告">
    当内置的 Codex 插件启用时，doctor 还会检查 `openai-codex/*` 主模型引用是否仍通过默认的 PI runner 解析。当你想通过 PI 使用 Codex OAuth/订阅身份验证时，这种组合是有效的，但它很容易与原生 Codex app-server harness 混淆。Doctor 会发出警告，并指向显式的 app-server 形式：`openai/*` 加上 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不会自动修复这一点，因为这两种路由都有效：

    - `openai-codex/*` + PI 表示“通过常规 OpenClaw runner 使用 Codex OAuth/订阅身份验证。”
    - `openai/*` + `runtime: "codex"` 表示“通过原生 Codex app-server 运行嵌入式 turn。”
    - `/codex ...` 表示“从聊天中控制或绑定一个原生 Codex 会话。”
    - `/acp ...` 或 `runtime: "acp"` 表示“使用外部 ACP/acpx 适配器。”

    如果出现该警告，请选择你原本想要的路由，并手动编辑配置。如果有意使用 PI Codex OAuth，则保留该警告即可。

  </Accordion>
  <Accordion title="3. 旧版状态迁移（磁盘布局）">
    Doctor 可以将较旧的磁盘布局迁移到当前结构：

    - Sessions 存储 + transcripts：
      - 从 `~/.openclaw/sessions/` 迁移到 `~/.openclaw/agents/<agentId>/sessions/`
    - 智能体目录：
      - 从 `~/.openclaw/agent/` 迁移到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 身份验证状态（Baileys）：
      - 从旧版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 迁移到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

    这些迁移采用尽力而为且幂等的方式；如果保留了任何旧版文件夹作为备份，doctor 会发出警告。Gateway 网关/CLI 在启动时也会自动迁移旧版 sessions + 智能体目录，因此历史记录/身份验证/模型会落到每个智能体各自的路径中，而无需手动运行 doctor。WhatsApp 身份验证则有意只通过 `openclaw doctor` 迁移。Talk 提供商/提供商映射规范化现在会按结构相等性比较，因此仅键顺序不同的差异不再触发重复的无操作 `doctor --fix` 变更。

  </Accordion>
  <Accordion title="3a. 旧版插件 manifest 迁移">
    Doctor 会扫描所有已安装插件的 manifest，查找已弃用的顶层能力键（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。发现后，它会提供将这些键移动到 `contracts` 对象中并原地重写 manifest 文件的选项。此迁移是幂等的；如果 `contracts` 键中已经有相同值，则会移除旧版键，而不会重复数据。
  </Accordion>
  <Accordion title="3b. 旧版 cron 存储迁移">
    Doctor 还会检查 cron 作业存储（默认是 `~/.openclaw/cron/jobs.json`，如果被覆盖则使用 `cron.store`），查找调度器出于兼容性仍接受的旧作业结构。

    当前的 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 顶层 payload 字段（`message`、`model`、`thinking`、...）→ `payload`
    - 顶层 delivery 字段（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload 中的 `provider` 投递别名 → 显式 `delivery.channel`
    - 简单旧版 `notify: true` webhook 回退作业 → 显式 `delivery.mode="webhook"`，并设置 `delivery.to=cron.webhook`

    只有在不改变行为的情况下，doctor 才会自动迁移 `notify: true` 作业。如果某个作业将旧版 notify 回退与现有非 webhook 投递模式组合在一起，doctor 会发出警告，并将该作业留给你手动审查。

  </Accordion>
  <Accordion title="3c. 会话锁清理">
    Doctor 会扫描每个智能体的会话目录，查找过期的写锁文件——这些文件通常是在会话异常退出时遗留下来的。对于找到的每个锁文件，它都会报告：路径、PID、该 PID 是否仍然存活、锁龄，以及是否被视为过期（PID 已死或超过 30 分钟）。在 `--fix` / `--repair` 模式下，它会自动移除过期锁文件；否则会打印说明并指示你使用 `--fix` 重新运行。
  </Accordion>
  <Accordion title="3d. 会话转录分支修复">
    Doctor 会扫描智能体会话 JSONL 文件，查找由 2026.4.24 prompt transcript 重写 bug 产生的重复分支结构：一个已放弃的用户 turn 含有 OpenClaw 内部运行时上下文，同时还有一个活跃的同级分支，包含相同的可见用户提示。在 `--fix` / `--repair` 模式下，doctor 会在原文件旁边备份每个受影响文件，并将转录重写为活跃分支，以便 Gateway 网关历史记录和 Memory 读取器不再看到重复 turn。
  </Accordion>
  <Accordion title="4. 状态完整性检查（会话持久化、路由和安全性）">
    状态目录是运行层面的中枢。如果它消失了，你将丢失 sessions、凭证、日志和配置（除非你在其他地方有备份）。

    Doctor 会检查：

    - **状态目录缺失**：警告可能发生灾难性的状态丢失，提示重新创建目录，并提醒你它无法恢复丢失的数据。
    - **状态目录权限**：验证是否可写；提供修复权限的选项（并在检测到所有者/组不匹配时给出 `chown` 提示）。
    - **macOS 云同步状态目录**：当状态路径解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下时发出警告，因为基于同步的路径可能导致较慢的 I/O 以及锁/同步竞争。
    - **Linux SD 或 eMMC 状态目录**：当状态路径解析到 `mmcblk*` 挂载源时发出警告，因为在 sessions 和凭证写入下，基于 SD 或 eMMC 的随机 I/O 可能更慢且磨损更快。
    - **会话目录缺失**：`sessions/` 和会话存储目录是持久化历史记录并避免 `ENOENT` 崩溃所必需的。
    - **转录不匹配**：当最近的会话条目存在缺失的 transcript 文件时发出警告。
    - **主会话 “1-line JSONL”**：当主 transcript 只有一行时进行标记（说明历史记录没有持续累积）。
    - **多个状态目录**：当不同 home 目录下存在多个 `~/.openclaw` 文件夹，或 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史记录可能在不同安装之间分裂）。
    - **远程模式提醒**：如果 `gateway.mode=remote`，doctor 会提醒你在远程宿主机上运行它（状态存储在那里）。
    - **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对组/全局可读，则发出警告，并提供收紧到 `600` 的选项。

  </Accordion>
  <Accordion title="5. 模型身份验证健康状况（OAuth 过期）">
    Doctor 会检查 auth 存储中的 OAuth 配置，在令牌即将过期/已过期时发出警告，并在安全情况下尝试刷新。如果 Anthropic OAuth/令牌配置已过期，它会建议你使用 Anthropic API 密钥或 Anthropic setup-token 路径。只有在交互模式（TTY）下才会显示刷新提示；`--non-interactive` 会跳过刷新尝试。

    当 OAuth 刷新永久失败时（例如 `refresh_token_reused`、`invalid_grant`，或提供商提示你需要重新登录），doctor 会报告需要重新认证，并打印确切的 `openclaw models auth login --provider ...` 命令供你运行。

    Doctor 还会报告那些因以下原因而暂时不可用的身份验证配置：

    - 短期冷却（速率限制/超时/身份验证失败）
    - 较长时间的禁用（计费/额度失败）

  </Accordion>
  <Accordion title="6. Hooks 模型验证">
    如果设置了 `hooks.gmail.model`，doctor 会根据目录和允许列表验证该模型引用，并在其无法解析或不被允许时发出警告。
  </Accordion>
  <Accordion title="7. 沙箱镜像修复">
    启用沙箱隔离时，doctor 会检查 Docker 镜像，并在当前镜像缺失时提供构建或切换到旧版名称的选项。
  </Accordion>
  <Accordion title="7b. 内置插件运行时依赖">
    Doctor 只会验证当前配置中已激活，或由其内置 manifest 默认启用的内置插件的运行时依赖，例如 `plugins.entries.discord.enabled: true`、旧版 `channels.discord.enabled: true`，或默认启用的内置提供商。如果缺少任何依赖，doctor 会报告这些包，并在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下安装它们。外部插件仍然使用 `openclaw plugins install` / `openclaw plugins update`；doctor 不会为任意插件路径安装依赖。

    Gateway 网关和本地 CLI 也可以在导入活跃的内置插件之前，按需修复其运行时依赖。这些安装会限定在插件运行时安装根目录下、在禁用脚本的情况下运行、不会写入 package lock，并通过安装根目录锁来保护，因此并发的 CLI 或 Gateway 网关启动不会同时修改同一个 `node_modules` 树。

  </Accordion>
  <Accordion title="8. Gateway 网关服务迁移和清理提示">
    Doctor 会检测旧版 Gateway 网关服务（launchd/systemd/schtasks），并提供移除它们并使用当前 Gateway 网关端口安装 OpenClaw 服务的选项。它还可以扫描额外的类 Gateway 网关服务并打印清理提示。带有 profile 名称的 OpenClaw Gateway 网关服务被视为一等公民，不会被标记为“额外”。
  </Accordion>
  <Accordion title="8b. 启动 Matrix 迁移">
    当 Matrix 渠道账户存在待处理或可执行的旧版状态迁移时，doctor（在 `--fix` / `--repair` 模式下）会先创建迁移前快照，然后运行尽力而为的迁移步骤：旧版 Matrix 状态迁移和旧版加密状态准备。这两个步骤都不是致命的；错误会被记录，启动会继续。在只读模式下（不带 `--fix` 的 `openclaw doctor`），此检查会被完全跳过。
  </Accordion>
  <Accordion title="8c. 设备配对和身份验证漂移">
    Doctor 现在会将设备配对状态检查纳入常规健康检查流程。

    它会报告的内容包括：

    - 待处理的首次配对请求
    - 已配对设备待处理的角色升级
    - 已配对设备待处理的作用域升级
    - 公钥不匹配修复：设备 ID 仍匹配，但设备身份已不再与已批准记录匹配
    - 已配对记录中缺少已批准角色的有效令牌
    - 已配对令牌的作用域漂移到已批准配对基线之外
    - 当前机器上的本地缓存设备令牌条目早于 Gateway 网关侧令牌轮换，或带有过时的作用域元数据

    Doctor 不会自动批准配对请求，也不会自动轮换设备令牌。它会直接打印精确的后续步骤：

    - 使用 `openclaw devices list` 检查待处理请求
    - 使用 `openclaw devices approve <requestId>` 批准指定请求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 轮换新的令牌
    - 使用 `openclaw devices remove <deviceId>` 移除并重新批准过期记录

    这解决了常见的“已经配对但仍然提示需要配对”的问题：doctor 现在能够区分首次配对、待处理的角色/作用域升级，以及过期令牌/设备身份漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    当某个提供商对私信开放但没有 allowlist，或某项策略以危险方式配置时，doctor 会发出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果作为 systemd 用户服务运行，doctor 会确保启用了 lingering，以便 Gateway 网关在注销后继续存活。
  </Accordion>
  <Accordion title="11. 工作区状态（Skills、插件和旧版目录）">
    Doctor 会打印默认智能体的工作区状态摘要：

    - **Skills 状态**：统计可用、缺少要求和被 allowlist 阻止的 Skills 数量。
    - **旧版工作区目录**：当 `~/openclaw` 或其他旧版工作区目录与当前工作区并存时发出警告。
    - **插件状态**：统计已启用/已禁用/出错插件数量；列出所有出错插件的插件 ID；报告内置插件能力。
    - **插件兼容性警告**：标记与当前运行时存在兼容性问题的插件。
    - **插件诊断**：显示插件注册表在加载时发出的任何警告或错误。

  </Accordion>
  <Accordion title="11b. 引导文件大小">
    Doctor 会检查工作区引导文件（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文文件）是否接近或超过配置的字符预算。它会报告每个文件的原始字符数与注入后字符数、截断百分比、截断原因（`max/file` 或 `max/total`），以及总注入字符数占总预算的比例。当文件被截断或接近限制时，doctor 会打印调整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的建议。
  </Accordion>
  <Accordion title="11c. shell 补全">
    Doctor 会检查当前 shell（zsh、bash、fish 或 PowerShell）是否已安装 Tab 补全：

    - 如果 shell 配置文件使用的是较慢的动态补全模式（`source <(openclaw completion ...)`），doctor 会将其升级为更快的缓存文件方案。
    - 如果配置文件中已配置补全，但缓存文件缺失，doctor 会自动重新生成缓存。
    - 如果完全未配置补全，doctor 会提示安装（仅交互模式；`--non-interactive` 会跳过）。

    运行 `openclaw completion --write-state` 可手动重新生成缓存。

  </Accordion>
  <Accordion title="12. Gateway 网关身份验证检查（本地令牌）">
    Doctor 会检查本地 Gateway 网关令牌身份验证的就绪状态。

    - 如果令牌模式需要令牌且不存在令牌来源，doctor 会提供生成令牌的选项。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，doctor 会发出警告，并且不会用明文覆盖它。
    - 仅当未配置令牌 SecretRef 时，`openclaw doctor --generate-gateway-token` 才会强制生成令牌。

  </Accordion>
  <Accordion title="12b. 感知 SecretRef 的只读修复">
    某些修复流程需要检查已配置凭证，但又不能削弱运行时快速失败行为。

    - `openclaw doctor --fix` 现在会像 Status 系列命令一样，使用相同的只读 SecretRef 摘要模型来执行定向配置修复。
    - 示例：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修复会在可用时尝试使用已配置的 bot 凭证。
    - 如果 Telegram bot 令牌通过 SecretRef 配置，但在当前命令路径中不可用，doctor 会报告该凭证为“已配置但不可用”，并跳过自动解析，而不是崩溃或误报令牌缺失。

  </Accordion>
  <Accordion title="13. Gateway 网关健康检查 + 重启">
    Doctor 会运行健康检查，并在 Gateway 网关看起来不健康时提供重启选项。
  </Accordion>
  <Accordion title="13b. Memory 搜索就绪状态">
    Doctor 会检查为默认智能体配置的 Memory 搜索嵌入提供商是否已就绪。其行为取决于配置的后端和提供商：

    - **QMD 后端**：探测 `qmd` 二进制文件是否可用且可启动。如果不可用，会打印修复指导，包括 npm 包和手动二进制路径选项。
    - **显式本地提供商**：检查本地模型文件或已识别的远程/可下载模型 URL 是否存在。如果缺失，会建议切换到远程提供商。
    - **显式远程提供商**（`openai`、`voyage` 等）：验证环境或 auth 存储中是否存在 API 密钥。如果缺失，会打印可执行的修复提示。
    - **自动提供商**：先检查本地模型可用性，然后按自动选择顺序依次尝试每个远程提供商。

    当 Gateway 网关探测结果可用时（检查期间 Gateway 网关健康），doctor 会将其结果与 CLI 可见配置进行交叉比对，并注明任何差异。

    使用 `openclaw memory status --deep` 可在运行时验证嵌入就绪状态。

  </Accordion>
  <Accordion title="14. 渠道状态警告">
    如果 Gateway 网关健康，doctor 会运行渠道状态探测，并报告警告及建议修复方案。
  </Accordion>
  <Accordion title="15. supervisor 配置审计 + 修复">
    Doctor 会检查已安装的 supervisor 配置（launchd/systemd/schtasks）中是否缺少默认项或默认项已过期（例如 systemd 的 network-online 依赖和重启延迟）。当发现不匹配时，它会建议更新，并可将服务文件/任务重写为当前默认值。

    注意事项：

    - `openclaw doctor` 会在重写 supervisor 配置前提示确认。
    - `openclaw doctor --yes` 会接受默认修复提示。
    - `openclaw doctor --repair` 会在无提示的情况下应用推荐修复。
    - `openclaw doctor --repair --force` 会覆盖自定义 supervisor 配置。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 会让 doctor 在 Gateway 网关服务生命周期方面保持只读。它仍会报告服务健康状态并运行非服务修复，但会跳过服务安装/启动/重启/引导、supervisor 配置重写以及旧版服务清理，因为该生命周期由外部 supervisor 接管。
    - 如果令牌身份验证需要令牌，且 `gateway.auth.token` 由 SecretRef 管理，doctor 在服务安装/修复时会验证该 SecretRef，但不会将解析出的明文令牌值持久化到 supervisor 服务环境元数据中。
    - 如果令牌身份验证需要令牌，而配置的令牌 SecretRef 无法解析，doctor 会阻止安装/修复路径，并提供可执行的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，而 `gateway.auth.mode` 未设置，doctor 会阻止安装/修复，直到显式设置 mode。
    - 对于 Linux user-systemd 单元，doctor 的令牌漂移检查现在会在比较服务身份验证元数据时同时包含 `Environment=` 和 `EnvironmentFile=` 来源。
    - 当配置最后一次由较新版本写入时，doctor 服务修复会拒绝重写、停止或重启来自较旧 OpenClaw 二进制文件的 Gateway 网关服务。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你始终可以通过 `openclaw gateway install --force` 强制执行完整重写。

  </Accordion>
  <Accordion title="16. Gateway 网关运行时 + 端口诊断">
    Doctor 会检查服务运行时（PID、上次退出状态），并在服务已安装但实际上未运行时发出警告。它还会检查 Gateway 网关端口（默认 `18789`）上的端口冲突，并报告可能原因（Gateway 网关已在运行、SSH 隧道）。
  </Accordion>
  <Accordion title="17. Gateway 网关运行时最佳实践">
    当 Gateway 网关服务运行在 Bun 或由版本管理器管理的 Node 路径（`nvm`、`fnm`、`volta`、`asdf` 等）上时，doctor 会发出警告。WhatsApp + Telegram 渠道需要 Node，而版本管理器路径在升级后可能会失效，因为服务不会加载你的 shell 初始化脚本。Doctor 会在可用时提供迁移到系统 Node 安装的选项（Homebrew/apt/choco）。
  </Accordion>
  <Accordion title="18. 配置写入 + 向导元数据">
    Doctor 会持久化所有配置更改，并写入向导元数据以记录本次 doctor 运行。
  </Accordion>
  <Accordion title="19. 工作区提示（备份 + memory 系统）">
    当工作区缺少 memory 系统时，doctor 会给出建议；如果工作区尚未纳入 git，它还会打印备份提示。

    参见 [/concepts/agent-workspace](/zh-CN/concepts/agent-workspace) 以获取工作区结构和 git 备份（推荐使用私有 GitHub 或 GitLab）的完整指南。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
