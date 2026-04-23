---
read_when:
    - 查找特定的新手引导步骤或标志
    - 使用非交互模式自动化新手引导
    - 调试新手引导行为
sidebarTitle: Onboarding Reference
summary: CLI 新手引导的完整参考：每一步、每个标志和每个配置字段
title: 新手引导参考
x-i18n:
    generated_at: "2026-04-23T21:05:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccebd9b187df1b3b86814d83ff4507cbd89b2ade3339d0b3bd660358739f5368
    source_path: reference/wizard.md
    workflow: 15
---

这是 `openclaw onboard` 的完整参考。
高层概览请参阅 [设置向导（CLI）](/zh-CN/start/wizard)。

## 流程细节（本地模式）

<Steps>
  <Step title="现有配置检测">
    - 如果存在 `~/.openclaw/openclaw.json`，可选择 **Keep / Modify / Reset**。
    - 重新运行新手引导**不会**清空任何内容，除非你明确选择 **Reset**
      （或传入 `--reset`）。
    - CLI `--reset` 默认作用于 `config+creds+sessions`；使用 `--reset-scope full`
      可额外移除工作区。
    - 如果配置无效或包含旧版键名，向导会停止，并要求
      你先运行 `openclaw doctor` 再继续。
    - Reset 使用 `trash`（绝不使用 `rm`），并提供以下范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完全重置（也会移除工作区）
  </Step>
  <Step title="模型 / 认证">
    - **Anthropic API key**：如果存在 `ANTHROPIC_API_KEY` 就使用它，否则提示输入 key，然后保存以供守护进程使用。
    - **Anthropic API key**：是新手引导 / configure 中 Anthropic 助手的首选方式。
    - **Anthropic setup-token**：在新手引导 / configure 中仍可用，不过 OpenClaw 现在在可用时更倾向于复用 Claude CLI。
    - **OpenAI Code（Codex）订阅（OAuth）**：浏览器流程；粘贴 `code#state`。
      - 当模型未设置，或已经是 OpenAI 家族时，会将 `agents.defaults.model` 设为 `openai/gpt-5.5`。
    - **OpenAI Code（Codex）订阅（设备配对）**：浏览器配对流程，使用短时有效的设备码。
      - 当模型未设置，或已经是 OpenAI 家族时，会将 `agents.defaults.model` 设为 `openai/gpt-5.5`。
    - **OpenAI API key**：如果存在 `OPENAI_API_KEY` 就使用它，否则提示输入 key，然后将其存储到认证配置中。
      - 当模型未设置、为 `openai/*`，或为 `openai-codex/*` 时，会将 `agents.defaults.model` 设为 `openai/gpt-5.5`。
    - **xAI（Grok）API key**：提示输入 `XAI_API_KEY`，并将 xAI 配置为模型提供商。
    - **OpenCode**：提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可从 https://opencode.ai/auth 获取），并让你选择 Zen 或 Go 目录。
    - **Ollama**：首先提供 **Cloud + Local**、**Cloud only** 或 **Local only**。`Cloud only` 会提示输入 `OLLAMA_API_KEY` 并使用 `https://ollama.com`；依赖主机的模式会提示输入 Ollama base URL，发现可用模型，并在需要时自动拉取所选本地模型；`Cloud + Local` 还会检查该 Ollama 主机是否已登录以启用云访问。
    - 更多细节： [Ollama](/zh-CN/providers/ollama)
    - **API key**：会帮你保存 key。
    - **Vercel AI Gateway 网关（多模型代理）**：提示输入 `AI_GATEWAY_API_KEY`。
    - 更多细节： [Vercel AI Gateway 网关](/zh-CN/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway 网关**：提示输入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多细节： [Cloudflare AI Gateway 网关](/zh-CN/providers/cloudflare-ai-gateway)
    - **MiniMax**：会自动写入配置；托管默认值为 `MiniMax-M2.7`。
      API key 设置使用 `minimax/...`，OAuth 设置使用
      `minimax-portal/...`。
    - 更多细节： [MiniMax](/zh-CN/providers/minimax)
    - **StepFun**：会自动写入 StepFun 标准版或 Step Plan 在中国区或全球端点的配置。
    - 标准版当前包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    - 更多细节： [StepFun](/zh-CN/providers/stepfun)
    - **Synthetic（Anthropic 兼容）**：提示输入 `SYNTHETIC_API_KEY`。
    - 更多细节： [Synthetic](/zh-CN/providers/synthetic)
    - **Moonshot（Kimi K2）**：会自动写入配置。
    - **Kimi Coding**：会自动写入配置。
    - 更多细节： [Moonshot AI](/zh-CN/providers/moonshot)
    - **Skip**：暂不配置认证。
    - 从检测到的选项中选择默认模型（或手动输入 provider / model）。为了获得最佳质量并降低提示词注入风险，请选择你提供商栈中可用的最强最新一代模型。
    - 新手引导会执行模型检查，并在配置的模型未知或缺少认证时给出警告。
    - API key 存储模式默认使用明文 auth-profile 值。使用 `--secret-input-mode ref` 可改为存储基于环境变量的引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - 认证配置位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API key + OAuth）。`~/.openclaw/credentials/oauth.json` 仅用于旧版导入。
    - 更多细节： [/concepts/oauth](/zh-CN/concepts/oauth)
    <Note>
    无头 / 服务器提示：先在有浏览器的机器上完成 OAuth，然后复制
    该智能体的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或对应的
    `$OPENCLAW_STATE_DIR/...` 路径）到 Gateway 网关主机。`credentials/oauth.json`
    仅是旧版导入来源。
    </Note>
  </Step>
  <Step title="工作区">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 会初始化智能体 bootstrap 仪式所需的工作区文件。
    - 完整工作区布局 + 备份指南： [智能体工作区](/zh-CN/concepts/agent-workspace)
  </Step>
  <Step title="Gateway 网关">
    - 端口、绑定、认证模式、Tailscale 暴露。
    - 认证建议：即使是 loopback，也保留 **Token**，这样本地 WS 客户端也必须认证。
    - 在 token 模式下，交互式设置会提供：
      - **生成 / 存储明文 token**（默认）
      - **使用 SecretRef**（可选启用）
      - 快速开始会在新手引导探测 / dashboard bootstrap 中复用现有的 `gateway.auth.token` SecretRef，适用于 `env`、`file` 和 `exec` 提供商。
      - 如果该 SecretRef 已配置但无法解析，新手引导会尽早失败并给出清晰修复信息，而不是悄悄降级运行时认证。
    - 在 password 模式下，交互式设置同样支持明文或 SecretRef 存储。
    - 非交互式 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求新手引导进程环境中存在非空环境变量。
      - 不能与 `--gateway-token` 同时使用。
    - 只有在你完全信任所有本地进程时才禁用认证。
    - 非 loopback 绑定仍然需要认证。
  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选 QR 登录。
    - [Telegram](/zh-CN/channels/telegram)：bot token。
    - [Discord](/zh-CN/channels/discord)：bot token。
    - [Google Chat](/zh-CN/channels/googlechat)：service account JSON + webhook audience。
    - [Mattermost](/zh-CN/channels/mattermost)（插件）：bot token + base URL。
    - [Signal](/zh-CN/channels/signal)：可选 `signal-cli` 安装 + 账户配置。
    - [BlueBubbles](/zh-CN/channels/bluebubbles)：**推荐用于 iMessage**；服务器 URL + password + webhook。
    - [iMessage](/zh-CN/channels/imessage)：旧版 `imsg` CLI 路径 + DB 访问。
    - 私信安全：默认为配对。首次私信会发送验证码；通过 `openclaw pairing approve <channel> <code>` 批准，或使用允许列表。
  </Step>
  <Step title="网页搜索">
    - 选择一个支持的提供商，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG 或 Tavily（或跳过）。
    - 基于 API 的提供商可以使用环境变量或现有配置进行快速设置；无 key 的提供商则使用各自提供商特定的前提条件。
    - 使用 `--skip-search` 跳过。
    - 之后配置：`openclaw configure --section web`。
  </Step>
  <Step title="安装守护进程">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头场景，请使用自定义 LaunchDaemon（未随产品提供）。
    - Linux（以及通过 WSL2 的 Windows）：systemd 用户单元
      - 新手引导会尝试通过 `loginctl enable-linger <user>` 启用 lingering，这样 Gateway 网关在登出后仍可继续运行。
      - 可能会提示输入 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试无 sudo。
    - **运行时选择：** Node（推荐；WhatsApp / Telegram 必需）。**不推荐**使用 Bun。
    - 如果 token 认证需要 token，且 `gateway.auth.token` 由 SecretRef 管理，则安装守护进程时会验证它，但不会将解析后的明文 token 值持久写入 supervisor 服务环境元数据。
    - 如果 token 认证需要 token，而配置的 token SecretRef 无法解析，则会阻止安装守护进程，并给出可执行的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，而 `gateway.auth.mode` 未设置，则在显式设置 mode 之前会阻止安装守护进程。
  </Step>
  <Step title="健康检查">
    - 如有需要会启动 Gateway 网关，并运行 `openclaw health`。
    - 提示：`openclaw status --deep` 会在状态输出中加入实时 Gateway 网关健康探测，包括在受支持时的渠道探测（要求 Gateway 网关可达）。
  </Step>
  <Step title="Skills（推荐）">
    - 读取可用 Skills 并检查依赖项。
    - 让你选择一个节点管理器：**npm / pnpm**（不推荐 bun）。
    - 安装可选依赖（部分在 macOS 上会使用 Homebrew）。
  </Step>
  <Step title="完成">
    - 显示摘要 + 后续步骤，包括可用于扩展功能的 iOS / Android / macOS 应用。
  </Step>
</Steps>

<Note>
如果未检测到 GUI，新手引导会打印 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源，新手引导会尝试构建它们；回退命令是 `pnpm ui:build`（会自动安装 UI 依赖）。
</Note>

## 非交互模式

使用 `--non-interactive` 可自动化或脚本化新手引导：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

添加 `--json` 可获得机器可读的摘要。

非交互模式下的 Gateway 网关 token SecretRef：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` 和 `--gateway-token-ref-env` 互斥。

<Note>
`--json` **不会**隐含非交互模式。对于脚本，请使用 `--non-interactive`（以及 `--workspace`）。
</Note>

各提供商专用命令示例请参阅 [CLI 自动化](/zh-CN/start/wizard-cli-automation#provider-specific-examples)。
本参考页用于说明标志语义和步骤顺序。

### 添加智能体（非交互）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway 网关向导 RPC

Gateway 网关通过 RPC 暴露新手引导流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。
客户端（macOS 应用、Control UI）可渲染这些步骤，而无需重新实现新手引导逻辑。

## Signal 设置（signal-cli）

新手引导可以从 GitHub releases 安装 `signal-cli`：

- 下载合适的 release 资源。
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 将 `channels.signal.cliPath` 写入你的配置。

说明：

- JVM 构建需要 **Java 21**。
- 在可用时会使用原生构建。
- Windows 使用 WSL2；signal-cli 安装会在 WSL 内遵循 Linux 流程。

## 向导会写入什么

通常会写入 `~/.openclaw/openclaw.json` 中的以下字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择了 MiniMax）
- `tools.profile`（本地新手引导在未设置时默认为 `"coding"`；现有显式值会被保留）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（行为细节： [CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在提示中选择启用时，会写入渠道允许列表（Slack / Discord / Matrix / Microsoft Teams）（在可能时，名称会解析为 ID）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置仍可通过直接设置 `skills.install.nodeManager` 来使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 会写入 `agents.list[]` 以及可选的 `bindings`。

WhatsApp 凭证位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

某些渠道以插件形式提供。当你在设置期间选择它们时，新手引导
会提示先安装该插件（npm 或本地路径），然后才能进行配置。

## 相关文档

- 新手引导概览： [设置向导（CLI）](/zh-CN/start/wizard)
- macOS 应用新手引导： [新手引导](/zh-CN/start/onboarding)
- 配置参考： [Gateway 网关配置](/zh-CN/gateway/configuration)
- 提供商： [WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)、[Google Chat](/zh-CN/channels/googlechat)、[Signal](/zh-CN/channels/signal)、[BlueBubbles](/zh-CN/channels/bluebubbles)（iMessage）、[iMessage](/zh-CN/channels/imessage)（旧版）
- Skills： [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)
