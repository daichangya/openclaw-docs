---
read_when:
    - 你希望一个 OpenClaw 智能体加入 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确指定的 Meet URL，并使用默认的实时语音设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-24T15:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 920ed629e7089dd6576ca8aec31f48425b3abb3bf62ef90b00bb48bf72ef4262
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet（插件）

为 OpenClaw 提供 Google Meet 参与者支持。

该插件在设计上是显式的：

- 它只会加入明确指定的 `https://meet.google.com/...` URL。
- `realtime` 语音是默认模式。
- 当需要更深入的推理或工具时，实时语音可以回调完整的 OpenClaw 智能体。
- 认证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 没有自动同意声明。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留用于更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖，并配置一个后端实时语音提供商。OpenAI 是默认选项；Google Gemini Live 也可以使用，配合
`realtime.provider: "google"`：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序要求重启后，macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两项都已就绪：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

启用该插件：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

检查设置：

```bash
openclaw googlemeet setup
```

加入会议：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者让智能体通过 `google_meet` 工具加入：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，选择 `BlackHole 2ch` 作为 OpenClaw 使用的麦克风/扬声器路径。为了获得干净的双工音频，请使用独立的虚拟设备或类似 Loopback 的音频图；单个 BlackHole 设备足以进行首次冒烟测试，但可能会产生回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不**需要在 macOS VM 中运行完整的 OpenClaw Gateway 网关或配置模型 API 密钥，只是为了让 VM 承载 Chrome。你可以在本地运行 Gateway 网关和智能体，然后在 VM 中运行一个节点主机。只需在 VM 上启用一次内置插件，这样节点就会声明 Chrome 命令：

各部分运行位置如下：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥，或模型提供商设置。

安装 VM 依赖项：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，以便 macOS 暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 可以看到音频设备和 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

在 VM 中安装或更新 OpenClaw，然后在那里启用内置插件：

```bash
openclaw plugins enable google-meet
```

在 VM 中启动节点主机：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是局域网 IP 且你没有使用 TLS，节点会拒绝明文 WebSocket，除非你为该受信任私有网络显式启用：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时，也要使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境变量，不是 `openclaw.json` 设置。`openclaw node install` 会在安装命令中检测到它存在时，将其存储到 LaunchAgent 环境中。

从 Gateway 网关主机批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关能够看到该节点，并且它声明了 `googlemeet.chrome`：

```bash
openclaw nodes status
```

在 Gateway 网关主机上通过该节点路由 Meet：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

现在可以像平常一样从 Gateway 网关主机加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者让智能体使用 `google_meet` 工具，并设置 `transport: "chrome-node"`。

如果你想进行一个单命令冒烟测试，它会创建或复用一个会话、说出一段已知短语，并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

如果省略 `chromeNode.node`，只有在恰好有一个已连接节点声明 `googlemeet.chrome` 时，OpenClaw 才会自动选择。如果连接了多个可用节点，请将 `chromeNode.node` 设置为节点 id、显示名称或远程 IP。

常见故障检查：

- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet`。同时确认 Gateway 网关主机允许该节点命令，即配置了 `gateway.nodes.allowCommands: ["googlemeet.chrome"]`。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch` 并重启 VM。
- Chrome 打开了但无法加入：在 VM 内登录 Chrome，或保持设置 `chrome.guestName` 以访客身份加入。访客自动加入使用 Chrome Apple Events；如果它报告自动化警告，请启用 Chrome > View > Developer > Allow JavaScript from Apple Events，然后重试。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw 会先激活相同 Meet URL 的现有标签页，然后才会打开新标签页。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；为获得干净的双工音频，请使用独立的虚拟设备或类似 Loopback 的路由方式。

## 安装说明

Chrome 实时默认路径使用两个外部工具：

- `sox`：命令行音频工具。该插件使用它的 `rec` 和 `play` 命令来构建默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 `BlackHole 2ch` 音频设备，供 Chrome/Meet 进行音频路由。

OpenClaw 不会内置或重新分发这两个软件包。文档要求用户通过 Homebrew 将它们作为主机依赖安装。SoX 的许可证是
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 是 GPL-3.0。如果你要构建一个将 BlackHole 与 OpenClaw 一起打包的安装程序或设备，请审查 BlackHole 上游的许可条款，或从 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输方式会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查是否存在 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 之前运行音频桥健康检查命令和启动命令。当 Chrome/音频位于 Gateway 网关主机上时，请使用 `chrome`；当 Chrome/音频位于已配对节点（例如 Parallels macOS VM）上时，请使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

将 Chrome 的麦克风和扬声器音频路由到本地 OpenClaw 音频桥。如果未安装 `BlackHole 2ch`，加入操作会以设置错误失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输方式是委托给 Voice Call 插件的严格拨号计划。它不会解析 Meet 页面来提取电话号码。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

当会议需要自定义序列时，使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和预检

Google Meet Media API 访问优先使用个人 OAuth 客户端。配置
`oauth.clientId`，并可选配置 `oauth.clientSecret`，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印一个包含刷新令牌的 `oauth` 配置块。它使用 PKCE、位于 `http://localhost:8085/oauth2callback` 的 localhost 回调，以及配合 `--manual` 的手动复制/粘贴流程。

以下环境变量可作为回退：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 或 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 或 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 或
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 或 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 或 `GOOGLE_MEET_PREVIEW_ACK`

通过 `spaces.get` 解析 Meet URL、会议代码或 `spaces/{id}`：

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

在进行媒体操作前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

仅在确认你的 Cloud 项目、OAuth 主体和会议参与者都已加入 Google Workspace Developer Preview Program for Meet media APIs 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome 实时路径只需要启用该插件、安装 BlackHole、SoX，以及配置一个后端实时语音提供商密钥。OpenAI 是默认选项；设置
`realtime.provider: "google"` 可使用 Google Gemini Live：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

在 `plugins.entries.google-meet.config` 下设置插件配置：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

默认值：

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`：`chrome-node` 的可选节点 id/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在未登录 Meet 的访客界面上使用的名称
- `chrome.autoJoin: true`：尽力自动填写访客名称并点击立即加入
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是打开重复标签页
- `chrome.waitForInCallMs: 20000`：等待 Meet 标签页报告已在通话中，然后再触发实时介绍
- `chrome.audioInputCommand`：将 8 kHz G.711 mu-law 音频写入 stdout 的 SoX `rec` 命令
- `chrome.audioOutputCommand`：从 stdin 读取 8 kHz G.711 mu-law 音频的 SoX `play` 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的口语回复，并在需要更深入回答时使用
  `openclaw_agent_consult`
- `realtime.introMessage`：当实时桥接连接时的简短语音就绪检查；将其设置为 `""` 可静默加入

可选覆盖项：

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "请严格照说：我到了。",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

仅 Twilio 配置：

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

## 工具

智能体可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

当 Chrome 运行在 Gateway 网关主机上时，使用 `transport: "chrome"`。当 Chrome 运行在已配对节点（例如 Parallels VM）上时，使用
`transport: "chrome-node"`。在这两种情况下，实时模型和 `openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭证会保留在那里。

使用 `action: "status"` 可列出活动会话，或检查某个会话 ID。使用带有 `sessionId` 和 `message` 的 `action: "speak"`，可让实时智能体立即发言。使用 `action: "test_speech"` 可创建或复用会话、触发一段已知短语，并在 Chrome 主机能够报告时返回 `inCall` 健康状态。使用 `action: "leave"` 可将某个会话标记为已结束。

`status` 在可用时包含 Chrome 健康状态：

- `inCall`：Chrome 看起来已在 Meet 通话中
- `micMuted`：尽力检测的 Meet 麦克风状态
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：桥接最近一次接收或发送音频的时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "请严格照说：我已到场并正在收听。"
}
```

## 实时智能体咨询

Chrome 实时模式针对实时语音回路进行了优化。实时语音提供商会听取会议音频，并通过已配置的音频桥接发声。当实时模型需要更深入的推理、最新信息或普通 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规 OpenClaw 智能体，附带最近的会议转录上下文，并向实时语音会话返回简洁的口语化回答。随后，语音模型就可以将该回答重新说回会议中。

`realtime.toolPolicy` 控制咨询运行方式：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为使用
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
  `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用正常的智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按 Meet 会话隔离，因此在同一次会议期间，后续咨询调用可以复用先前的咨询上下文。

如果要在 Chrome 完全加入通话后强制执行一次语音就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

用于完整的加入并发言冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 说明

Google Meet 的官方媒体 API 偏向接收，因此要在 Meet 通话中发声，仍然需要一个参与者路径。此插件会将这一边界保持清晰可见：Chrome 负责浏览器参与和本地音频路由；Twilio 负责电话拨入参与。

Chrome 实时模式需要以下其中之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 拥有实时模型桥接，并在这些命令与所选实时语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请将 Meet 输出和 Meet 麦克风路由到独立的虚拟设备，或使用类似 Loopback 的虚拟设备图。单个共享的 BlackHole 设备可能会把其他参与者的声音回送进通话中。

`googlemeet speak` 会触发某个 Chrome 会话的活动实时音频桥接。`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委托的 Twilio 会话，`leave` 还会挂断底层语音通话。

## 相关内容

- [Voice call 插件](/zh-CN/plugins/voice-call)
- [通话模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)
