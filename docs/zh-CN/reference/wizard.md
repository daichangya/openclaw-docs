---
read_when:
    - 查找特定的新手引导步骤或标志
    - 使用非交互模式自动化新手引导
    - 调试新手引导行为
sidebarTitle: Onboarding Reference
summary: CLI 新手引导完整参考：每个步骤、标志和配置字段
title: 新手引导参考
x-i18n:
    generated_at: "2026-04-23T23:03:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

这是 `openclaw onboard` 的完整参考。
高层概览请参见 [设置向导（CLI）](/zh-CN/start/wizard)。

## 流程详情（本地模式）

<Steps>
  <Step title="现有配置检测">
    - 如果存在 `~/.openclaw/openclaw.json`，可选择 **Keep / Modify / Reset**。
    - 重新运行新手引导**不会**清除任何内容，除非你显式选择 **Reset**
      （或传入 `--reset`）。
    - CLI `--reset` 默认作用于 `config+creds+sessions`；使用 `--reset-scope full`
      可同时移除工作区。
    - 如果配置无效或包含旧版键，向导会停止，并要求
      你先运行 `openclaw doctor`，再继续。
    - 重置使用 `trash`（绝不使用 `rm`），并提供以下范围：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完全重置（同时移除工作区）
  </Step>
  <Step title="模型 / 认证">
    - **Anthropic API key**：如果存在则使用 `ANTHROPIC_API_KEY`，否则提示输入 key，然后保存以供守护进程使用。
    - **Anthropic API key**：在新手引导 / 配置中，作为 Anthropic 助手的首选选项。
    - **Anthropic setup-token**：在新手引导 / 配置中仍可用，尽管 OpenClaw 现在在可用时更倾向复用 Claude CLI。
    - **OpenAI Code（Codex）订阅（OAuth）**：浏览器流程；粘贴 `code#state`。
      - 当模型未设置，或已属于 OpenAI 家族时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.5`。
    - **OpenAI Code（Codex）订阅（设备配对）**：带短时有效 device code 的浏览器配对流程。
      - 当模型未设置，或已属于 OpenAI 家族时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.5`。
    - **OpenAI API key**：如果存在则使用 `OPENAI_API_KEY`，否则提示输入 key，然后将其存储到 auth 配置文件中。
      - 当模型未设置、为 `openai/*` 或 `openai-codex/*` 时，将 `agents.defaults.model` 设置为 `openai/gpt-5.4`。
    - **xAI（Grok）API key**：提示输入 `XAI_API_KEY`，并将 xAI 配置为模型 provider。
    - **OpenCode**：提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 获取），并允许你选择 Zen 或 Go 目录。
    - **Ollama**：首先提供 **Cloud + Local**、**Cloud only** 或 **Local only**。`Cloud only` 会提示输入 `OLLAMA_API_KEY` 并使用 `https://ollama.com`；基于主机的模式会提示输入 Ollama base URL，发现可用模型，并在需要时自动拉取所选本地模型；`Cloud + Local` 还会检查该 Ollama 主机是否已登录云访问。
    - 更多详情： [Ollama](/zh-CN/providers/ollama)
    - **API key**：会为你保存该 key。
    - **Vercel AI Gateway 网关（多模型代理）**：提示输入 `AI_GATEWAY_API_KEY`。
    - 更多详情： [Vercel AI Gateway 网关](/zh-CN/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway 网关**：提示输入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多详情： [Cloudflare AI Gateway 网关](/zh-CN/providers/cloudflare-ai-gateway)
    - **MiniMax**：会自动写入配置；托管默认值为 `MiniMax-M2.7`。
      API key 设置使用 `minimax/...`，OAuth 设置使用
      `minimax-portal/...`。
    - 更多详情： [MiniMax](/zh-CN/providers/minimax)
    - **StepFun**：会为中国或全球端点上的 StepFun standard 或 Step Plan 自动写入配置。
    - Standard 当前包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    - 更多详情： [StepFun](/zh-CN/providers/stepfun)
    - **Synthetic（兼容 Anthropic）**：提示输入 `SYNTHETIC_API_KEY`。
    - 更多详情： [Synthetic](/zh-CN/providers/synthetic)
    - **Moonshot（Kimi K2）**：会自动写入配置。
    - **Kimi Coding**：会自动写入配置。
    - 更多详情： [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
    - **Skip**：暂不配置认证。
    - 从检测到的选项中选择默认模型（或手动输入 provider/model）。为了获得最佳质量并降低提示词注入风险，请从你的 provider 栈中选择最强、最新一代的模型。
    - 新手引导会运行模型检查；如果配置的模型未知或缺失认证，会发出警告。
    - API key 存储模式默认为明文 auth 配置文件值。使用 `--secret-input-mode ref` 可改为存储基于环境变量的引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - auth 配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API keys + OAuth）。`~/.openclaw/credentials/oauth.json` 仅用于导入旧版数据。
    - 更多详情： [/concepts/oauth](/zh-CN/concepts/oauth)
    <Note>
    无头 / 服务器提示：请在有浏览器的机器上完成 OAuth，然后将
    该智能体的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或对应的
    `$OPENCLAW_STATE_DIR/...` 路径）复制到 Gateway 网关主机上。`credentials/oauth.json`
    只是旧版导入来源。
    </Note>
  </Step>
  <Step title="工作区">
    - 默认值为 `~/.openclaw/workspace`（可配置）。
    - 会填充智能体引导仪式所需的工作区文件。
    - 完整工作区布局和备份指南： [智能体工作区](/zh-CN/concepts/agent-workspace)
  </Step>
  <Step title="Gateway 网关">
    - 端口、绑定、认证模式、Tailscale 暴露方式。
    - 认证建议：即使在 loopback 情况下，也保持 **Token**，这样本地 WS 客户端仍必须认证。
    - 在 token 模式下，交互式设置提供：
      - **生成 / 存储明文 token**（默认）
      - **使用 SecretRef**（可选启用）
      - 快速开始会跨 `env`、`file` 和 `exec` providers 复用现有的 `gateway.auth.token` SecretRefs，用于新手引导探测 / dashboard 引导。
      - 如果该 SecretRef 已配置但无法解析，新手引导会尽早失败，并给出清晰的修复信息，而不是悄悄降级运行时认证。
    - 在 password 模式下，交互式设置同样支持明文或 SecretRef 存储。
    - 非交互 token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求在新手引导进程环境中存在一个非空环境变量。
      - 不能与 `--gateway-token` 同时使用。
    - 只有在你完全信任每一个本地进程时，才禁用认证。
    - 非 loopback 绑定仍然要求认证。
  </Step>
  <Step title="渠道">
    - [WhatsApp](/zh-CN/channels/whatsapp)：可选二维码登录。
    - [Telegram](/zh-CN/channels/telegram)：bot token。
    - [Discord](/zh-CN/channels/discord)：bot token。
    - [Google Chat](/zh-CN/channels/googlechat)：service account JSON + webhook audience。
    - [Mattermost](/zh-CN/channels/mattermost)（插件）：bot token + base URL。
    - [Signal](/zh-CN/channels/signal)：可选安装 `signal-cli` + 账户配置。
    - [BlueBubbles](/zh-CN/channels/bluebubbles)：**推荐用于 iMessage**；服务器 URL + 密码 + webhook。
    - [iMessage](/zh-CN/channels/imessage)：旧版 `imsg` CLI 路径 + DB 访问。
    - 私信安全：默认使用配对。首次私信会发送一个代码；通过 `openclaw pairing approve <channel> <code>` 批准，或使用 allowlists。
  </Step>
  <Step title="Web 搜索">
    - 选择一个受支持的 provider，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web 搜索、Perplexity、SearXNG 或 Tavily（或跳过）。
    - 基于 API 的 providers 可使用环境变量或现有配置进行快速设置；无 key 的 providers 则使用各自 provider 专属的前置要求。
    - 使用 `--skip-search` 跳过。
    - 稍后配置：`openclaw configure --section web`。
  </Step>
  <Step title="守护进程安装">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头环境，请使用自定义 LaunchDaemon（未随产品提供）。
    - Linux（以及通过 WSL2 的 Windows）：systemd user unit
      - 新手引导会尝试启用 `loginctl enable-linger <user>`，以便 Gateway 网关在登出后仍保持运行。
      - 可能会提示 sudo（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - **运行时选择：** Node（推荐；WhatsApp / Telegram 必需）。**不推荐** Bun。
    - 如果 token 认证需要 token，且 `gateway.auth.token` 由 SecretRef 管理，守护进程安装会验证它，但不会将已解析的明文 token 值持久化到 supervisor 服务环境元数据中。
    - 如果 token 认证需要 token，且配置的 token SecretRef 无法解析，守护进程安装会被阻止，并给出可执行的指导。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，守护进程安装会被阻止，直到显式设置 mode。
  </Step>
  <Step title="健康检查">
    - 启动 Gateway 网关（如有需要），并运行 `openclaw health`。
    - 提示：`openclaw status --deep` 会将实时 Gateway 网关健康探针加入状态输出中，包括在支持时的渠道探针（要求 Gateway 网关可访问）。
  </Step>
  <Step title="Skills（推荐）">
    - 读取可用的 Skills 并检查要求。
    - 允许你选择 node manager：**npm / pnpm**（不推荐 bun）。
    - 安装可选依赖（其中一些在 macOS 上使用 Homebrew）。
  </Step>
  <Step title="完成">
    - 输出摘要和后续步骤，包括 iOS / Android / macOS 应用以获取额外功能。
  </Step>
</Steps>

<Note>
如果未检测到 GUI，新手引导会输出用于 Control UI 的 SSH 端口转发说明，而不是打开浏览器。
如果缺少 Control UI 资源文件，新手引导会尝试构建它们；回退方案是 `pnpm ui:build`（会自动安装 UI 依赖）。
</Note>

## 非交互模式

使用 `--non-interactive` 自动化或脚本化新手引导：

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

在非交互模式中使用 Gateway 网关 token SecretRef：

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
`--json` **不会** 自动启用非交互模式。脚本中请使用 `--non-interactive`（以及 `--workspace`）。
</Note>

provider 专属命令示例位于 [CLI 自动化](/zh-CN/start/wizard-cli-automation#provider-specific-examples)。
本参考页面主要说明标志语义和步骤顺序。

### 添加智能体（非交互）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway 网关向导 RPC

Gateway 网关通过 RPC 暴露新手引导流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。
客户端（macOS 应用、Control UI）可以渲染这些步骤，而无需重新实现新手引导逻辑。

## Signal 设置（signal-cli）

新手引导可以从 GitHub releases 安装 `signal-cli`：

- 下载合适的 release 资源。
- 将其存储到 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 将 `channels.signal.cliPath` 写入你的配置。

说明：

- JVM 构建需要 **Java 21**。
- 如果可用，将使用原生构建。
- Windows 使用 WSL2；`signal-cli` 安装会在 WSL 中走 Linux 流程。

## 向导会写入什么

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择了 MiniMax）
- `tools.profile`（本地新手引导在未设置时默认为 `"coding"`；现有的显式值会被保留）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（行为详情： [CLI 设置参考](/zh-CN/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 当你在提示中选择启用时，还会写入渠道 allowlists（Slack / Discord / Matrix / Microsoft Teams）；在可能时会将名称解析为 ID。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置仍可通过直接设置 `skills.install.nodeManager` 使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 会写入 `agents.list[]` 以及可选的 `bindings`。

WhatsApp 凭证存储在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

某些渠道以插件形式提供。当你在设置期间选择它们时，新手引导会先提示安装它（npm 或本地路径），然后才能进行配置。

## 相关文档

- 新手引导概览： [设置向导（CLI）](/zh-CN/start/wizard)
- macOS 应用新手引导： [新手引导](/zh-CN/start/onboarding)
- 配置参考： [Gateway 网关配置](/zh-CN/gateway/configuration)
- providers： [WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)、[Google Chat](/zh-CN/channels/googlechat)、[Signal](/zh-CN/channels/signal)、[BlueBubbles](/zh-CN/channels/bluebubbles)（iMessage）、[iMessage](/zh-CN/channels/imessage)（旧版）
- Skills： [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config)
