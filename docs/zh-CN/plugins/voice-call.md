---
read_when:
    - 你想从 OpenClaw 发起一个呼出语音通话
    - 你正在配置或开发语音通话插件
summary: 语音通话插件：通过 Twilio/Telnyx/Plivo 进行呼出 + 呼入通话（插件安装 + 配置 + CLI）
title: 语音通话插件
x-i18n:
    generated_at: "2026-04-25T04:54:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54fff21558f5a8788f85a91ed84a60a3d74a4fa8da8edbe81a23adc9a9065e2f
    source_path: plugins/voice-call.md
    workflow: 15
---

# 语音通话（插件）

通过插件为 OpenClaw 提供语音通话。支持呼出通知，以及带有呼入策略的多轮对话。

当前提供商：

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（开发环境 / 无网络）

快速理解模型：

- 安装插件
- 重启 Gateway 网关
- 在 `plugins.entries.voice-call.config` 下进行配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 运行位置（本地 vs 远程）

语音通话插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在 **运行 Gateway 网关的机器** 上安装 / 配置该插件，然后重启 Gateway 网关以加载它。

## 安装

### 选项 A：从 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启 Gateway 网关。

### 选项 B：从本地文件夹安装（开发环境，不复制文件）

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
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

          realtime: {
            enabled: false,
            provider: "google", // optional; first registered realtime voice provider when unset
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

在使用真实提供商测试之前，先检查设置：

```bash
openclaw voicecall setup
```

默认输出在聊天日志和终端会话中都易于阅读。它会检查插件是否已启用、提供商和凭证是否存在、Webhook 暴露是否已配置，以及是否只启用了一个音频模式。脚本使用时可执行 `openclaw voicecall setup --json`。

对于 Twilio、Telnyx 和 Plivo，设置必须解析为公共 Webhook URL。如果已配置的 `publicUrl`、隧道 URL、Tailscale URL 或 serve 回退地址解析到 loopback 或私有网络空间，则 setup 会失败，而不会启动一个无法接收真实运营商 Webhook 的提供商。

若要进行一个不出意外的冒烟测试，请运行：

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

第二个命令仍然是一次 dry run。添加 `--yes` 以发起一个简短的呼出通知电话：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

说明：

- Twilio/Telnyx 需要一个 **可被公网访问的** Webhook URL。
- Plivo 需要一个 **可被公网访问的** Webhook URL。
- `mock` 是一个本地开发用提供商（无网络调用）。
- 如果旧配置仍在使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键，请运行 `openclaw doctor --fix` 来重写它们。
- 除非 `skipSignatureVerification` 为 true，否则 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
- `skipSignatureVerification` 仅用于本地测试。
- 如果你使用 ngrok 免费层，请将 `publicUrl` 设置为确切的 ngrok URL；签名验证始终会强制执行。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许 Twilio Webhook 使用无效签名。仅用于本地开发。
- Ngrok 免费层 URL 可能会变化或增加中间页行为；如果 `publicUrl` 漂移，Twilio 签名校验将失败。在生产环境中，优先使用稳定域名或 Tailscale funnel。
- `realtime.enabled` 会启动完整的语音到语音实时对话；不要与 `streaming.enabled` 同时启用。
- 流式传输安全默认值：
  - `streaming.preStartTimeoutMs` 会关闭那些从未发送有效 `start` 帧的套接字。
- `streaming.maxPendingConnections` 限制未认证预启动套接字的总数。
- `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证预启动套接字数量。
- `streaming.maxConnections` 限制打开的媒体流套接字总数（待处理 + 活动）。
- 运行时回退目前仍接受这些旧的 voice-call 键，但重写路径是 `openclaw doctor --fix`，该兼容垫片只是临时方案。

## 实时语音对话

`realtime` 为实时通话音频选择一个全双工实时语音提供商。

它与 `streaming` 分开，后者只会把音频转发给实时转写提供商。

当前运行时行为：

- `realtime.enabled` 支持用于 Twilio Media Streams。
- `realtime.enabled` 不能与 `streaming.enabled` 组合使用。
- `realtime.provider` 是可选的。未设置时，语音通话会使用第一个已注册的实时语音提供商。
- 内置的实时语音提供商包括 Google Gemini Live（`google`）和 OpenAI（`openai`），它们由各自的提供商插件注册。
- 提供商拥有的原始配置位于 `realtime.providers.<providerId>` 下。
- 默认情况下，语音通话会暴露共享的 `openclaw_agent_consult` 实时工具。当来电者请求更深入的推理、当前信息或普通 OpenClaw 工具时，实时模型可以调用它。
- `realtime.toolPolicy` 控制 consult 运行：
  - `safe-read-only`：暴露 consult 工具，并将常规智能体限制为使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
  - `owner`：暴露 consult 工具，并允许常规智能体使用普通智能体工具策略。
  - `none`：不暴露 consult 工具。自定义 `realtime.tools` 仍会透传给实时提供商。
- Consult 会话键会在可用时复用现有语音会话，然后回退到来电 / 被叫电话号码，以便后续 consult 调用在通话期间保持上下文。
- 如果 `realtime.provider` 指向未注册的提供商，或根本没有注册任何实时语音提供商，语音通话会记录一条警告并跳过实时媒体，而不是让整个插件失败。

Google Gemini Live 实时默认值：

- API 密钥：`realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`
- 模型：`gemini-2.5-flash-native-audio-preview-12-2025`
- 语音：`Kore`

示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

改用 OpenAI：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

有关特定提供商的实时语音选项，请参阅 [Google provider](/zh-CN/providers/google) 和 [OpenAI provider](/zh-CN/providers/openai)。

## 流式转写

`streaming` 为实时通话音频选择一个实时转写提供商。

当前运行时行为：

- `streaming.provider` 是可选的。未设置时，语音通话会使用第一个已注册的实时转写提供商。
- 内置的实时转写提供商包括 Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），它们由各自的提供商插件注册。
- 提供商拥有的原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向未注册的提供商，或根本没有注册任何实时转写提供商，语音通话会记录一条警告并跳过媒体流式传输，而不是让整个插件失败。

OpenAI 流式转写默认值：

- API 密钥：`streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`
- 模型：`gpt-4o-transcribe`
- `silenceDurationMs`：`800`
- `vadThreshold`：`0.5`

xAI 流式转写默认值：

- API 密钥：`streaming.providers.xai.apiKey` 或 `XAI_API_KEY`
- 端点：`wss://api.x.ai/v1/stt`
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
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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
                apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

旧键仍可由 `openclaw doctor --fix` 自动迁移：

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 过期通话清理器

使用 `staleCallReaperSeconds` 来结束那些始终未收到终止 Webhook 的通话（例如，始终未完成的通知模式通话）。默认值为 `0`（禁用）。

推荐范围：

- **生产环境：** 对于通知式流程，使用 `120`–`300` 秒。
- 将此值保持为 **高于 `maxDurationSeconds`**，这样正常通话才能完成。一个不错的起始值是 `maxDurationSeconds + 30–60` 秒。

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

当代理或隧道位于 Gateway 网关前面时，插件会重建公共 URL 以进行签名验证。这些选项用于控制哪些转发头会被信任。

`webhookSecurity.allowedHosts` 允许通过转发头传递的主机名白名单。

`webhookSecurity.trustForwardingHeaders` 在没有允许列表的情况下信任转发头。

`webhookSecurity.trustedProxyIPs` 仅在请求远程 IP 与列表匹配时才信任转发头。

Twilio 和 Plivo 启用了 Webhook 重放保护。被重放的有效 Webhook 请求会被确认，但会跳过副作用处理。

Twilio 对话轮次在 `<Gather>` 回调中包含每轮专用令牌，因此过期 / 重放的语音回调无法满足较新的待处理转写轮次。

当提供商要求的签名头缺失时，未认证的 Webhook 请求会在读取正文之前被拒绝。

voice-call Webhook 在签名验证之前使用共享的预认证 body 配置文件（64 KB / 5 秒）以及基于每个 IP 的并发上限。

使用稳定公共主机的示例：

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

语音通话会使用核心 `messages.tts` 配置来实现通话中的流式语音。你可以在插件配置下使用 **相同结构** 覆盖它 —— 它会与 `messages.tts` 进行深度合并。

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

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）可由 `openclaw doctor --fix` 修复；提交的配置应使用 `tts.providers.<provider>`。
- **Microsoft speech 会被语音通话忽略**（电话音频需要 PCM；当前 Microsoft 传输方式不暴露电话用 PCM 输出）。
- 启用 Twilio 媒体流时会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已处于活动状态，语音通话不会回退到 TwiML `<Say>`。在该状态下，如果电话 TTS 不可用，则播放请求会失败，而不是混用两条播放路径。
- 当电话 TTS 回退到次级提供商时，语音通话会记录一条包含提供商链（`from`、`to`、`attempts`）的警告，以便调试。
- 当 Twilio 插话或流拆除清除待处理 TTS 队列时，排队的播放请求会结束，而不会让正在等待播放完成的来电者一直挂起。

### 更多示例

仅使用核心 TTS（不覆盖）：

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

仅为通话覆盖为 ElevenLabs（其他地方保留核心默认值）：

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

仅覆盖通话使用的 OpenAI 模型（深度合并示例）：

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

呼入策略默认值为 `disabled`。要启用呼入通话，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` 是一种低保障的来电显示筛选方式。插件会规范化提供商给出的 `From` 值，并将其与 `allowFrom` 进行比较。Webhook 验证可以验证提供商投递和载荷完整性，但不能证明 PSTN/VoIP 来电号码的归属权。请将 `allowFrom` 视为来电显示过滤，而不是强来电身份认证。

自动响应使用智能体系统。可通过以下项进行调整：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 语音输出约定

对于自动响应，语音通话会向系统提示附加一个严格的语音输出约定：

- `{"spoken":"..."}`

然后语音通话会以防御式方式提取语音文本：

- 忽略标记为推理 / 错误内容的载荷。
- 解析直接 JSON、围栏 JSON 或内联 `"spoken"` 键。
- 回退为纯文本，并删除可能的规划 / 元信息引导段落。

这样可以让语音播放聚焦于面向来电者的文本，并避免将规划文本泄漏到音频中。

### 对话启动行为

对于呼出的 `conversation` 通话，首条消息处理与实时播放状态绑定：

- 仅当初始问候正在主动播放时，才会抑制插话队列清除和自动响应。
- 如果初始播放失败，通话会返回 `listening` 状态，且初始消息会继续保留在队列中等待重试。
- Twilio 流式传输的初始播放会在流连接时立即开始，无额外延迟。
- 插话会中止当前播放，并清除那些已排队但尚未开始播放的 Twilio TTS 条目。被清除的条目会以已跳过状态结束，因此后续响应逻辑可以继续，而不必等待那些永远不会播放的音频。
- 实时语音对话使用实时流自身的开场轮次。语音通话不会为该初始消息发送旧版 `<Say>` TwiML 更新，因此呼出的 `<Connect><Stream>` 会话会保持附着状态。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，语音通话会等待 `2000ms` 后再自动结束通话：

- 如果流在该时间窗口内重新连接，则自动结束会被取消。
- 如果宽限期过后仍未重新注册任何流，则该通话会被结束，以防止通话卡在活动状态。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` 会从默认的 voice-call 存储路径读取 `calls.jsonl`。使用 `--file <path>` 指向其他日志文件，使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包括轮次延迟和监听等待时间的 p50/p90/p99。

## 智能体工具

工具名称：`voice_call`

操作：

- `initiate_call`（message, to?, mode?）
- `continue_call`（callId, message）
- `speak_to_user`（callId, message）
- `send_dtmf`（callId, digits）
- `end_call`（callId）
- `get_status`（callId）

此仓库提供了对应的 skill 文档，路径为 `skills/voice-call/SKILL.md`。

## Gateway 网关 RPC

- `voicecall.initiate`（`to?`, `message`, `mode?`）
- `voicecall.continue`（`callId`, `message`）
- `voicecall.speak`（`callId`, `message`）
- `voicecall.dtmf`（`callId`, `digits`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）

## 相关内容

- [Text-to-speech](/zh-CN/tools/tts)
- [Talk mode](/zh-CN/nodes/talk)
- [Voice wake](/zh-CN/nodes/voicewake)
