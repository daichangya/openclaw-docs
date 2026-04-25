---
read_when:
    - 你想让一个 OpenClaw 智能体加入 Google Meet 通话
    - 你想让一个 OpenClaw 智能体创建新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确的 Meet URL，并使用默认的实时语音设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-25T07:22:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e03741b598614233496d208b2fff85077f31a4c37814c1c915dc6d6fda32ef2e
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw 的 Google Meet 参会支持——该插件在设计上就是显式的：

- 它只会加入明确的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建新的 Meet 空间，然后加入返回的 URL。
- `realtime` 语音是默认模式。
- 当需要更深入的推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 智能体通过 `mode` 选择加入行为：使用 `realtime` 进行实时收听/回话，或使用 `transcribe` 在不启用实时语音桥接的情况下加入/控制浏览器。
- 认证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 没有自动的同意提示公告。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码，以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流使用。

## 快速开始

安装本地音频依赖并配置一个后端实时语音提供商。OpenAI 是默认选项；Google Gemini Live 也可用，使用
`realtime.provider: "google"`：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序要求重启，macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两项是否都已就绪：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

启用插件：

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

设置输出旨在让智能体可读。它会报告 Chrome 配置文件、音频桥接、节点固定、延迟实时介绍，以及在配置了 Twilio 委派时，`voice-call` 插件和 Twilio 凭证是否已就绪。
在要求智能体加入之前，应将任何 `ok: false` 检查视为阻塞项。
对脚本或机器可读输出，请使用 `openclaw googlemeet setup --json`。

加入会议：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者让智能体通过 `google_meet` 工具加入：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

创建新会议并加入：

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

只创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：当已配置 Google Meet OAuth 凭证时使用。这是最确定性的路径，不依赖浏览器 UI 状态。
- 浏览器回退：当缺少 OAuth 凭证时使用。OpenClaw 会使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实的会议代码 URL，然后返回该 URL。这条路径要求节点上的 OpenClaw Chrome 配置文件已经登录 Google。
  浏览器自动化会处理 Meet 自己的首次运行麦克风提示；该提示不会被视为 Google 登录失败。
  加入和创建流程还会在打开新标签页之前尝试复用现有 Meet 标签页。匹配时会忽略无害的 URL 查询字符串，例如 `authuser`，因此智能体重试时应聚焦已打开的会议，而不是创建第二个 Chrome 标签页。

命令/工具输出包含一个 `source` 字段（`api` 或 `browser`），这样智能体就能说明使用了哪条路径。
`create` 默认会加入新会议，并返回 `joined: true` 以及加入会话。若只想生成 URL，请在 CLI 中使用
`create --no-join`，或向工具传递 `"join": false`。

你也可以告诉智能体：“创建一个 Google Meet，用实时语音加入它，然后把链接发给我。”
智能体应使用 `action: "create"` 调用 `google_meet`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

对于仅观察/浏览器控制的加入，请将 `"mode"` 设为 `"transcribe"`。这样不会启动双向实时模型桥接，因此它不会在会议中回话。

在实时会话期间，`google_meet` 状态会包含浏览器和音频桥接健康信息，例如 `inCall`、`manualActionRequired`、`providerConnected`、
`realtimeReady`、`audioInputActive`、`audioOutputActive`、最近输入/输出时间戳、字节计数以及桥接关闭状态。如果出现安全的 Meet 页面提示，浏览器自动化会在可能时处理它。登录、主持人准入以及浏览器/操作系统权限提示会作为手动操作报告，并带有原因和消息，供智能体转达。

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，选择 `BlackHole 2ch` 作为 OpenClaw 使用的麦克风/扬声器路径。为了获得干净的双工音频，请使用独立的虚拟设备或类似 Loopback 的音频图；单个 BlackHole 设备足够完成首次冒烟测试，但可能会产生回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不**需要在 macOS VM 中运行完整的 OpenClaw Gateway 网关或模型 API 密钥，仅仅为了让 VM 承担 Chrome。你可以在本地运行 Gateway 网关和智能体，然后在 VM 中运行一个节点主机。只需在 VM 中启用一次内置插件，这样节点就会通告 Chrome 命令：

各组件运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，让 macOS 暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 能看到音频设备和 SoX 命令：

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

如果 `<gateway-host>` 是局域网 IP，且你未使用 TLS，那么节点会拒绝明文 WebSocket，除非你为这个受信任的私有网络显式启用它：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时也要使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，不是
`openclaw.json` 设置。`openclaw node install` 会在安装命令中存在该变量时，将它存储到 LaunchAgent 环境中。

从 Gateway 网关主机批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关能看到该节点，并且它同时通告了 `googlemeet.chrome`
和浏览器能力/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway 网关主机上通过该节点路由 Meet：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
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

现在你可以从 Gateway 网关主机正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者要求智能体使用 `google_meet` 工具，并设置 `transport: "chrome-node"`。

对于一个单命令冒烟测试，它会创建或复用会话、说出已知短语并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在加入期间，OpenClaw 浏览器自动化会填写访客名称，点击“加入/请求加入”，并在出现该提示时接受 Meet 首次运行的“使用麦克风”选项。在仅浏览器创建会议期间，如果 Meet 没有暴露使用麦克风按钮，它也可以在不启用麦克风的情况下继续通过同一个提示。
如果浏览器配置文件未登录、Meet 正在等待主持人准入、Chrome 需要麦克风/摄像头权限，或者 Meet 卡在自动化无法解决的提示上，那么加入/`test-speech` 结果会报告
`manualActionRequired: true`，并包含 `manualActionReason` 和
`manualActionMessage`。智能体应停止重试加入，报告该精确消息以及当前的 `browserUrl`/`browserTitle`，并且只在手动浏览器操作完成后重试。

如果省略了 `chromeNode.node`，只有在恰好只有一个已连接节点同时通告 `googlemeet.chrome` 和浏览器控制时，OpenClaw 才会自动选择。
如果连接了多个有能力的节点，请将 `chromeNode.node` 设置为节点 id、显示名称或远程 IP。

常见故障检查：

- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，批准配对，并确保在 VM 中运行过 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。还要确认 Gateway 网关主机允许这两个节点命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch` 并重启 VM。
- Chrome 打开了但无法加入：在 VM 内的浏览器配置文件中登录，或者保持设置 `chrome.guestName` 用于访客加入。访客自动加入使用 OpenClaw 通过节点浏览器代理执行的浏览器自动化；请确保节点浏览器配置指向你想使用的配置文件，例如
  `browser.defaultProfile: "user"` 或某个已有会话的命名配置文件。
- Meet 标签页重复：保持启用 `chrome.reuseExistingTab: true`。OpenClaw 会在打开新标签页之前先激活同一个 Meet URL 的现有标签页，而浏览器会议创建也会在打开另一个标签页之前复用进行中的 `https://meet.google.com/new` 或 Google 账户提示标签页。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；使用独立的虚拟设备或类似 Loopback 的路由以获得干净的双工音频。

## 安装说明

Chrome 实时默认值使用两个外部工具：

- `sox`：命令行音频工具。插件使用它的 `rec` 和 `play`
  命令作为默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 `BlackHole 2ch`
  音频设备，供 Chrome/Meet 路由使用。

OpenClaw 不会内置或重新分发这两个软件包。文档要求用户通过 Homebrew 将它们作为主机依赖安装。SoX 的许可为
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建了一个将 BlackHole 与 OpenClaw 一起打包的安装器或设备，请查看 BlackHole 的上游许可条款，或从 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输方式会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查是否存在 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 前运行音频桥接健康检查命令和启动命令。当 Chrome/音频位于 Gateway 网关主机上时，请使用 `chrome`；当 Chrome/音频位于已配对节点（例如 Parallels macOS VM）上时，请使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

将 Chrome 麦克风和扬声器音频通过本地 OpenClaw 音频桥接进行路由。如果未安装 `BlackHole 2ch`，加入会因设置错误而失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输方式是一个严格的拨号计划，委派给 Voice Call 插件处理。它不会解析 Meet 页面中的电话号码。

当无法使用 Chrome 参会，或者你想要电话拨入作为回退方案时，请使用此方式。Google Meet 必须为该会议公开电话拨入号码和 PIN；OpenClaw 不会从 Meet 页面中发现这些信息。

在 Gateway 网关主机上启用 Voice Call 插件，而不是在 Chrome 节点上：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

通过环境变量或配置提供 Twilio 凭证。使用环境变量可以让密钥不出现在 `openclaw.json` 中：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后，重启或重新加载 Gateway 网关；在 Gateway 网关进程重新加载之前，插件配置更改不会出现在已经运行的 Gateway 网关进程中。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委派已正确接线时，`googlemeet setup` 会包含成功的
`twilio-voice-call-plugin` 和 `twilio-voice-call-credentials` 检查。

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

对于创建 Meet 链接来说，OAuth 是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当你想使用官方 API 创建、空间解析或 Meet Media API 预检时，请配置 OAuth。

Google Meet API 访问使用用户 OAuth：创建一个 Google Cloud OAuth 客户端，请求所需作用域，授权一个 Google 账户，然后将生成的刷新令牌存储到 Google Meet 插件配置中，或提供
`OPENCLAW_GOOGLE_MEET_*` 环境变量。

OAuth 不能替代 Chrome 加入路径。Chrome 和 Chrome-node 传输方式在你使用浏览器参会时，仍然通过已登录的 Chrome 配置文件、BlackHole/SoX 以及已连接节点进行加入。OAuth 仅用于官方 Google Meet API 路径：创建会议空间、解析空间以及运行 Meet Media API 预检。

### 创建 Google 凭证

在 Google Cloud Console 中：

1. 创建或选择一个 Google Cloud 项目。
2. 为该项目启用 **Google Meet REST API**。
3. 配置 OAuth 同意屏幕。
   - **Internal** 对 Google Workspace 组织来说最简单。
   - **External** 适用于个人/测试设置；当应用处于 Testing 状态时，将每个要授权该应用的 Google 账户添加为测试用户。
4. 添加 OpenClaw 请求的作用域：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 创建一个 OAuth 客户端 ID。
   - 应用类型：**Web application**。
   - 已获授权的重定向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 复制客户端 ID 和客户端密钥。

`meetings.space.created` 是 Google Meet `spaces.create` 所必需的。
`meetings.space.readonly` 让 OpenClaw 可以将 Meet URL/代码解析为空间。
`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体相关工作；实际使用 Media API 时，Google 可能要求加入开发者预览计划。
如果你只需要基于浏览器的 Chrome 加入，请完全跳过 OAuth。

### 生成刷新令牌

配置 `oauth.clientId`，并可选择配置 `oauth.clientSecret`，或者将它们作为环境变量传入，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印一个带有刷新令牌的 `oauth` 配置块。它使用 PKCE、本地主机回调 `http://localhost:8085/oauth2callback`，并支持通过 `--manual` 使用手动复制/粘贴流程。

示例：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

当浏览器无法访问本地回调时，请使用手动模式：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 输出包括：

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

将 `oauth` 对象存储在 Google Meet 插件配置下：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

如果你不希望将刷新令牌写入配置，优先使用环境变量。
如果配置值和环境变量值同时存在，插件会优先解析配置，然后再回退到环境变量。

OAuth 同意内容包括 Meet 空间创建、Meet 空间读取访问和 Meet conference media 读取访问。如果你在会议创建支持存在之前就已完成身份验证，请重新运行 `openclaw googlemeet auth login --json`，以便刷新令牌具备 `meetings.space.created` 作用域。

### 使用 doctor 验证 OAuth

当你想进行快速、非敏感信息的健康检查时，运行 OAuth Doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

这不会加载 Chrome 运行时，也不需要连接的 Chrome 节点。它会检查 OAuth 配置是否存在，以及刷新令牌是否能生成访问令牌。JSON 报告只包含 `ok`、`configured`、`tokenSource`、`expiresAt` 和检查消息等状态字段；不会打印访问令牌、刷新令牌或客户端密钥。

常见结果：

| 检查项                | 含义                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`        | 存在 `oauth.clientId` 加 `oauth.refreshToken`，或存在缓存的访问令牌。                   |
| `oauth-token`         | 缓存的访问令牌仍然有效，或者刷新令牌已生成新的访问令牌。                                 |
| `meet-spaces-get`     | 可选的 `--meeting` 检查解析了一个现有 Meet 空间。                                        |
| `meet-spaces-create`  | 可选的 `--create-space` 检查创建了一个新的 Meet 空间。                                   |

若还要证明 Google Meet API 已启用以及 `spaces.create` 作用域也可用，请运行带副作用的创建检查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 会创建一个一次性的 Meet URL。当你需要确认 Google Cloud 项目已启用 Meet API，并且已授权账户具备 `meetings.space.created` 作用域时，请使用它。

若要证明对现有会议空间的读取访问：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 可以证明对已授权 Google 账户可访问的现有空间具有读取权限。这些检查返回 `403` 通常意味着 Google Meet REST API 未启用、用户同意的刷新令牌缺少所需作用域，或者该 Google 账户无法访问该 Meet 空间。若是刷新令牌错误，则表示需要重新运行 `openclaw googlemeet auth login
--json` 并存储新的 `oauth` 块。

浏览器回退模式不需要 OAuth 凭证。在该模式下，Google 认证来自所选节点上已登录的 Chrome 配置文件，而不是 OpenClaw 配置。

接受以下环境变量作为回退：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 或 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 或 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 或
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 或 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 或 `GOOGLE_MEET_PREVIEW_ACK`

通过 `spaces.get` 解析 Meet URL、代码或 `spaces/{id}`：

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

在进行媒体相关工作前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

在 Meet 创建 conference records 之后，列出会议工件和出席情况：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

配合 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的 conference record。若你想获取该会议的所有保留记录，请传递 `--all-conference-records`。

Calendar 查找可以先从 Google Calendar 解析会议 URL，然后再读取 Meet 工件：

```bash
openclaw googlemeet latest --today
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 会在今天的 `primary` 日历中查找包含 Google Meet 链接的 Calendar 事件。使用 `--event <query>` 搜索匹配的事件文本，使用 `--calendar <id>` 指定非主日历。Calendar 查找需要重新进行一次 OAuth 登录，并包含 Calendar events readonly 作用域。

如果你已经知道 conference record id，可以直接指定它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

写出可读报告：

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
```

`artifacts` 会返回 conference record 元数据，以及当 Google 为该会议公开这些内容时，参与者、录音、转录、结构化 transcript-entry 和 smart-note 资源元数据。对大型会议，请使用 `--no-transcript-entries` 跳过条目查找。`attendance` 会将参与者展开为 participant-session 行，包含首次/最后出现时间、总会话时长、迟到/提前离开标记，以及按已登录用户或显示名称合并的重复参与者资源。传递 `--no-merge-duplicates` 可保持原始参与者资源彼此分离，传递 `--late-after-minutes` 可调整迟到判定，传递 `--early-before-minutes` 可调整提前离开判定。

`export` 会写出一个文件夹，其中包含 `summary.md`、`attendance.csv`、
`transcript.md`、`artifacts.json` 和 `attendance.json`。这些命令仅对 Meet 资源使用 Meet REST API；Google Docs/Drive 文档正文下载被有意排除在范围之外，因为那需要单独的 Google Docs/Drive 访问权限。

创建一个新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri`、来源和加入会话。有 OAuth 凭证时，它会使用官方 Google Meet API。没有 OAuth 凭证时，它会回退为使用固定 Chrome 节点上已登录的浏览器配置文件。智能体可以使用带有 `action: "create"` 的 `google_meet` 工具，一步完成创建和加入。若只创建 URL，请传递 `"join": false`。

来自浏览器回退的 JSON 输出示例：

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

如果浏览器回退在创建 URL 之前遇到 Google 登录或 Meet 权限阻塞，Gateway 网关方法会返回失败响应，而 `google_meet` 工具会返回结构化细节，而不是普通字符串：

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

当智能体看到 `manualActionRequired: true` 时，它应报告
`manualActionMessage` 以及浏览器节点/标签页上下文，并停止打开新的 Meet 标签页，直到操作员完成该浏览器步骤。

来自 API 创建的 JSON 输出示例：

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

创建 Meet 默认也会加入。Chrome 或 Chrome-node 传输方式仍然需要一个已登录的 Google Chrome 配置文件，才能通过浏览器加入。如果该配置文件已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作员先完成 Google 登录，再重试。

仅在确认你的 Cloud 项目、OAuth 主体和会议参与者都已加入 Google Workspace Developer Preview Program for Meet media APIs 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome 实时路径只需要启用插件、安装 BlackHole 和 SoX，并提供一个后端实时语音提供商密钥。OpenAI 是默认选项；设置
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
- `chromeNode.node`：用于 `chrome-node` 的可选节点 id/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在未登录的 Meet 访客界面上使用的名称
- `chrome.autoJoin: true`：通过 OpenClaw 浏览器自动化，在 `chrome-node` 上尽力完成访客名称填写并点击“立即加入”
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是打开重复标签页
- `chrome.waitForInCallMs: 20000`：等待 Meet 标签页报告已在通话中，然后再触发实时介绍
- `chrome.audioInputCommand`：将 8 kHz G.711 mu-law 音频写入 stdout 的 SoX `rec` 命令
- `chrome.audioOutputCommand`：从 stdin 读取 8 kHz G.711 mu-law 音频的 SoX `play` 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的口语回复，较深入的回答使用
  `openclaw_agent_consult`
- `realtime.introMessage`：实时桥接连接时的简短口头就绪检查；将其设为 `""` 可静默加入

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
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

仅使用 Twilio 的配置：

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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输方式时，它会将实际的 PSTN 呼叫和 DTMF 委派给 Voice Call 插件。如果未启用 `voice-call`，Google Meet 仍然可以验证并记录拨号计划，但无法发起 Twilio 呼叫。

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

当 Chrome 运行在 Gateway 网关主机上时，使用
`transport: "chrome"`。当 Chrome 运行在已配对节点上，例如 Parallels
VM 时，使用 `transport: "chrome-node"`。在这两种情况下，实时模型和 `openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭证会留在那里。

使用 `action: "status"` 列出活动会话或检查某个会话 ID。使用
`action: "speak"` 并提供 `sessionId` 和 `message`，可以让实时智能体立即发言。使用 `action: "test_speech"` 可创建或复用会话、触发一个已知短语，并在 Chrome 主机能够报告时返回 `inCall` 健康状态。使用 `action: "leave"` 将会话标记为结束。

在可用时，`status` 包含 Chrome 健康信息：

- `inCall`：Chrome 看起来已进入 Meet 通话
- `micMuted`：尽力获取的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：浏览器配置文件需要手动登录、Meet 主持人准入、权限授权或浏览器控制修复，语音功能才能正常工作
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：最后一次从桥接收到或发送到桥接的音频时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 实时智能体咨询

Chrome 实时模式针对实时语音循环进行了优化。实时语音提供商会听取会议音频，并通过已配置的音频桥接发声。当实时模型需要更深入的推理、当前信息或普通 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在幕后运行常规 OpenClaw 智能体，并结合最近的会议转录上下文，向实时语音会话返回简洁的口头答复。然后语音模型可以把该答复说回会议中。它与 Voice Call 共用相同的实时咨询工具。

`realtime.toolPolicy` 控制咨询运行方式：

- `safe-read-only`：公开咨询工具，并将常规智能体限制为使用
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
  `memory_get`。
- `owner`：公开咨询工具，并允许常规智能体使用正常的智能体工具策略。
- `none`：不向实时语音模型公开咨询工具。

咨询会话键按每个 Meet 会话划分作用域，因此在同一场会议中，后续咨询调用可以复用之前的咨询上下文。

要在 Chrome 完全加入通话后强制执行口头就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

对于完整的加入并发言冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 实时测试清单

在将会议交给无人值守的智能体之前，请使用以下顺序：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome-node 状态：

- `googlemeet setup` 全部为绿色。
- 当 `chrome-node` 是默认传输方式或已固定节点时，`googlemeet setup` 会包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接。
- 所选节点同时通告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页成功加入通话，且 `test-speech` 返回的 Chrome 健康状态中包含
  `inCall: true`。

对于远程 Chrome 主机，例如 Parallels macOS VM，在更新 Gateway 网关或 VM 后，这是最短且安全的检查方式：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这可以证明 Gateway 网关插件已加载、VM 节点使用当前令牌完成连接，并且 Meet 音频桥接可用，然后智能体才会打开真实的会议标签页。

对于 Twilio 冒烟测试，请使用一个公开了电话拨入详细信息的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期的 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin` 和
  `twilio-voice-call-credentials` 检查。
- Gateway 网关重新加载后，CLI 中可用 `voicecall`。
- 返回的会话包含 `transport: "twilio"` 和一个 `twilio.voiceCallId`。
- `googlemeet leave <sessionId>` 会挂断委派出去的语音呼叫。

## 故障排除

### 智能体看不到 Google Meet 工具

确认该插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。正在运行的智能体只能看到由当前 Gateway 网关进程注册的插件工具。

### 没有已连接的 Google Meet 可用节点

在节点主机上运行：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 网关主机上，批准该节点并验证命令：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

节点必须已连接，并列出 `googlemeet.chrome` 和 `browser.proxy`。
Gateway 网关配置必须允许这些节点命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 的 `chrome-node-connected` 检查失败，或者 Gateway 网关日志报告
`gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启节点。对于局域网 Gateway 网关，通常意味着：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

然后重新加载节点服务并再次运行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 浏览器已打开，但智能体无法加入

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状态。如果它报告 `manualActionRequired: true`，请向操作员显示 `manualActionMessage`，并在浏览器操作完成之前停止重试。

常见的手动操作：

- 登录 Chrome 配置文件。
- 通过 Meet 主持人账户准入该访客。
- 当 Chrome 的原生权限提示出现时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅仅因为 Meet 显示“Do you want people to hear you in the meeting?” 就报告“未登录”。那是 Meet 的音频选择过渡页；在可用时，OpenClaw 会通过浏览器自动化点击 **Use microphone**，并继续等待真正的会议状态。对于仅创建的浏览器回退，OpenClaw 可能会点击 **Continue without microphone**，因为创建 URL 不需要实时音频路径。

### 会议创建失败

当已配置 OAuth 凭证时，`googlemeet create` 会首先使用 Google Meet API 的 `spaces.create` 端点。没有 OAuth 凭证时，它会回退到固定的 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在添加创建支持之后生成的。较旧的令牌可能缺少 `meetings.space.created` 作用域；请重新运行 `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 和
  `chromeNode.node` 指向一个已连接节点，且该节点具备 `browser.proxy` 和
  `googlemeet.chrome`。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录 Google，并且能够打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会复用现有的 `https://meet.google.com/new` 或 Google 账户提示标签页，而不是打开新标签页。如果智能体超时，请重试工具调用，而不是手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用返回的
  `browser.nodeId`、`browser.targetId`、`browserUrl` 和
  `manualActionMessage` 来引导操作员。在该操作完成前，不要循环重试。
- 对于浏览器回退：如果 Meet 显示“Do you want people to hear you in the
  meeting?”，请保持标签页打开。OpenClaw 应通过浏览器自动化点击 **Use microphone**，或者在仅创建的回退中点击 **Continue without microphone**，然后继续等待生成的 Meet URL。如果它无法做到，错误应提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体已加入，但没有说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "realtime"` 进行收听/回话。`mode: "transcribe"` 按设计不会启动双向实时语音桥接。

还要验证：

- Gateway 网关主机上可用一个实时提供商密钥，例如
  `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- 在 Chrome 主机上可以看到 `BlackHole 2ch`。
- 在 Chrome 主机上存在 `rec` 和 `play`。
- Meet 的麦克风和扬声器已通过 OpenClaw 使用的虚拟音频路径进行路由。

`googlemeet doctor [session-id]` 会打印会话、节点、是否在通话中、手动操作原因、实时提供商连接状态、`realtimeReady`、音频输入/输出活动、最近的音频时间戳、字节计数以及浏览器 URL。当你需要原始 JSON 时，请使用
`googlemeet status [session-id]`。当你需要验证 Google Meet OAuth 刷新且不暴露令牌时，请使用 `googlemeet doctor --oauth`；当你还需要 Google Meet API 证明时，可添加 `--meeting` 或 `--create-space`。

如果智能体超时，而你能看到已有一个 Meet 标签页打开，请在不打开新标签页的情况下检查该标签页：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

对应的工具动作是 `recover_current_tab`。它会聚焦并检查已配置 Chrome 节点上的现有 Meet 标签页。它不会打开新标签页，也不会创建新会话；它会报告当前阻塞项，例如登录、准入、权限或音频选择状态。CLI 命令会与已配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行，且 Chrome 节点必须已连接。

### Twilio 设置检查失败

当 `voice-call` 未被允许或未启用时，`twilio-voice-call-plugin` 会失败。请将它添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，然后重新加载 Gateway 网关。

当 Twilio 后端缺少 account SID、auth token 或 caller number 时，`twilio-voice-call-credentials` 会失败。请在 Gateway 网关主机上设置这些值：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

然后重启或重新加载 Gateway 网关，并运行：

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 默认仅检查就绪状态。若要对特定号码进行 dry-run：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你明确想发起真实的出站通知呼叫时，才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 呼叫已开始，但始终未进入会议

确认 Meet 事件公开了电话拨入详细信息。传入准确的拨入号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商在输入 PIN 前需要暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

## 说明

Google Meet 的官方媒体 API 偏向接收，因此要向 Meet 通话中发言，仍然需要一个参会者路径。该插件让这一边界保持可见：
Chrome 负责浏览器参会和本地音频路由；Twilio 负责电话拨入参会。

Chrome 实时模式需要以下之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 拥有实时模型桥接，并在这些命令与所选实时语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请通过独立的虚拟设备或类似 Loopback 的虚拟设备图来路由 Meet 输出和 Meet 麦克风。单个共享的 BlackHole 设备可能会把其他参与者的声音回送到通话中。

`googlemeet speak` 会触发 Chrome 会话的活动实时音频桥接。
`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委派的 Twilio 会话，`leave` 还会挂断底层语音呼叫。

## 相关内容

- [Voice call plugin](/zh-CN/plugins/voice-call)
- [Talk mode](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)
