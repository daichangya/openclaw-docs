---
read_when:
    - 你想从 OpenClaw 发起一个外呼语音电话
    - 你正在配置或开发 voice-call 插件
summary: Voice Call 插件：通过 Twilio / Telnyx / Plivo 进行外呼 + 呼入（插件安装 + 配置 + CLI）
title: Voice call 插件
x-i18n:
    generated_at: "2026-04-23T20:58:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d98dcabb6f03f3b6dd3b5cfaf0ea1ba684a343f778720662267c1af5ff49425
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call（插件）

用于 OpenClaw 的语音通话插件。支持外呼通知以及带呼入策略的
多轮对话。

当前提供商：

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（开发 / 无网络）

快速理解：

- 安装插件
- 重启 Gateway 网关
- 在 `plugins.entries.voice-call.config` 下进行配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 运行位置（本地 vs 远程）

Voice Call 插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器**上安装 / 配置该插件，然后重启 Gateway 网关以加载它。

## 安装

### 方案 A：从 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启 Gateway 网关。

### 方案 B：从本地文件夹安装（开发，无复制）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之后重启 Gateway 网关。

## 配置

在 `plugins.entries.voice-call.config` 下设置配置：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // 来自 Telnyx Mission Control Portal 的 Telnyx webhook 公钥
            //（Base64 字符串；也可通过 TELNYX_PUBLIC_KEY 设置）。
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook 服务器
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook 安全（推荐用于隧道 / 代理）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公网暴露（任选其一）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 可选；未设置时使用第一个已注册的实时转录提供商
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // 如果已设置 OPENAI_API_KEY，则可选
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

说明：

- Twilio / Telnyx 需要一个**公网可达**的 webhook URL。
- Plivo 需要一个**公网可达**的 webhook URL。
- `mock` 是本地开发提供商（无网络调用）。
- 如果旧配置仍在使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键，请运行 `openclaw doctor --fix` 来重写它们。
- 除非 `skipSignatureVerification` 为 true，否则 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
- `skipSignatureVerification` 仅用于本地测试。
- 如果你使用 ngrok 免费层，请将 `publicUrl` 设置为精确的 ngrok URL；签名验证始终会强制执行。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许带无效签名的 Twilio webhook。仅用于本地开发。
- ngrok 免费层 URL 可能变化，或加入中间页行为；如果 `publicUrl` 发生漂移，Twilio 签名就会失败。对于生产环境，优先选择稳定域名或 Tailscale funnel。
- 流式传输安全默认值：
  - `streaming.preStartTimeoutMs` 会关闭那些从未发送有效 `start` 帧的 socket。
- `streaming.maxPendingConnections` 限制总的未认证预启动 socket 数。
- `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证预启动 socket 数。
- `streaming.maxConnections` 限制总的打开媒体流 socket 数（待启动 + 活跃）。
- 目前运行时仍会接受这些旧的 voice-call 键作为回退，但标准重写路径是 `openclaw doctor --fix`，而兼容 shim 是临时的。

## 流式转录

`streaming` 用于为实时通话音频选择一个实时转录提供商。

当前运行时行为：

- `streaming.provider` 是可选的。未设置时，Voice Call 会使用第一个
  已注册的实时转录提供商。
- 内置的实时转录提供商包括 Deepgram（`deepgram`）、
  ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI
  （`xai`），它们由各自的提供商插件注册。
- 提供商自有原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向一个未注册的提供商，或者根本没有注册任何实时
  转录提供商，Voice Call 会记录警告并跳过媒体流，而不是让整个插件失败。

OpenAI 流式转录默认值：

- API key：`streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`
- model：`gpt-4o-transcribe`
- `silenceDurationMs`：`800`
- `vadThreshold`：`0.5`

xAI 流式转录默认值：

- API key：`streaming.providers.xai.apiKey` 或 `XAI_API_KEY`
- endpoint：`wss://api.x.ai/v1/stt`
- `encoding`：`mulaw`
- `sampleRate`：`8000`
- `endpointingMs`：`800`
- `interimResults`：`true`

示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // 如果已设置 OPENAI_API_KEY，则可选
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

改用 xAI：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // 如果已设置 XAI_API_KEY，则可选
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

旧版键仍可通过 `openclaw doctor --fix` 自动迁移：

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 过期通话回收器

使用 `staleCallReaperSeconds` 可结束那些从未收到终态 webhook 的通话
（例如永远不完成的 notify 模式通话）。默认值为 `0`
（禁用）。

推荐范围：

- **生产环境：** 对于 notify 风格流程，使用 `120`–`300` 秒。
- 请将此值保持为**高于 `maxDurationSeconds`**，以便正常通话可以
  完成。一个较好的起点是 `maxDurationSeconds + 30–60` 秒。

示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook 安全

当 Gateway 网关前面有代理或隧道时，该插件会重建
用于签名验证的公网 URL。这些选项控制哪些转发头是可信的。

`webhookSecurity.allowedHosts` 用于允许列表转发头中的主机。

`webhookSecurity.trustForwardingHeaders` 用于在没有允许列表时也信任转发头。

`webhookSecurity.trustedProxyIPs` 仅在请求
远端 IP 与列表匹配时才信任转发头。

Twilio 和 Plivo 启用了 webhook 重放保护。对已重放但签名有效的 webhook
请求会予以确认，但跳过副作用处理。

Twilio 对话轮次会在 `<Gather>` 回调中包含一个每轮令牌，因此
过期 / 重放的语音回调无法满足更新的待处理转录轮次。

当提供商要求的签名头缺失时，未认证 webhook 请求会在读取请求体前被拒绝。

voice-call webhook 使用共享的预身份验证请求体策略（64 KB / 5 秒），并在签名验证前施加每 IP 的进行中请求上限。

使用稳定公网主机的示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## 用于通话的 TTS

Voice Call 使用核心 `messages.tts` 配置来进行
通话中的流式语音。你可以在插件配置下使用**相同结构**
进行覆盖 —— 它会与 `messages.tts` 深度合并。

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

说明：

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会在加载时自动迁移到 `tts.providers.<provider>`。在提交的配置中，请优先使用 `providers` 结构。
- **Microsoft speech 会被语音通话忽略**（电话音频需要 PCM；当前 Microsoft 传输不暴露电话 PCM 输出）。
- 当启用 Twilio 媒体流时，会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果某个 Twilio 媒体流已经处于活动状态，Voice Call 就不会回退到 TwiML `<Say>`。如果此时电话 TTS 不可用，播放请求会失败，而不是混用两条播放路径。
- 当电话 TTS 回退到次级提供商时，Voice Call 会记录一个警告，其中包含提供商链（`from`、`to`、`attempts`），便于调试。

### 更多示例

仅使用核心 TTS（无覆盖）：

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

仅对通话覆盖为 ElevenLabs（其他地方仍保留核心默认值）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

仅为通话覆盖 OpenAI 模型（深度合并示例）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## 呼入通话

呼入策略默认值为 `disabled`。如需启用呼入通话，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` 是一种低保障级别的来电号码筛选。插件会对
提供商传入的 `From` 值进行规范化，并将其与 `allowFrom`
进行比较。Webhook 验证可以验证提供商投递及负载完整性，但它无法证明
PSTN / VoIP 来电号码的真实归属。请将 `allowFrom` 视为
来电显示过滤，而不是强身份来电身份识别。

自动响应使用智能体系统。可通过以下项进行调节：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 语音输出契约

对于自动响应，Voice Call 会在系统提示词后附加一个严格的语音输出契约：

- `{"spoken":"..."}`

随后 Voice Call 会以防御性方式提取语音文本：

- 忽略被标记为推理 / 错误内容的负载。
- 解析直接 JSON、带围栏的 JSON，或内联 `"spoken"` 键。
- 回退为纯文本，并移除可能属于规划 / 元信息的开头段落。

这样可以让语音播放聚焦于面向来电者的文本，并避免把规划文字泄露到音频中。

### 对话启动行为

对于外呼 `conversation` 通话，首条消息处理与实时播放状态绑定：

- 仅当初始问候语正在主动播放时，才会抑制打断插话清队和自动响应。
- 如果初始播放失败，通话会返回到 `listening`，并保留首条消息以供重试。
- Twilio 流式传输的初始播放会在流连接建立后立即开始，无额外延迟。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 `2000ms` 后再自动结束通话：

- 如果流在该窗口内重新连接，则会取消自动结束。
- 如果宽限期后仍未重新注册流，则会结束通话，以防止通话卡在活动状态。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call 的别名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # 从日志汇总轮次延迟
openclaw voicecall expose --mode funnel
```

`latency` 会从默认 voice-call 存储路径中读取 `calls.jsonl`。使用
`--file <path>` 指向不同日志，并使用 `--last <n>` 将分析范围限制在
最后 N 条记录（默认 200）。输出包括轮次延迟和监听等待时间的
p50 / p90 / p99。

## 智能体工具

工具名称：`voice_call`

动作：

- `initiate_call`（message、to?、mode?）
- `continue_call`（callId、message）
- `speak_to_user`（callId、message）
- `end_call`（callId）
- `get_status`（callId）

此仓库在 `skills/voice-call/SKILL.md` 中附带了匹配的 Skills 文档。

## Gateway 网关 RPC

- `voicecall.initiate`（`to?`、`message`、`mode?`）
- `voicecall.continue`（`callId`、`message`）
- `voicecall.speak`（`callId`、`message`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）
