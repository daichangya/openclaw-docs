---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS provider、回退链或 persona
    - 使用 /tts 命令或指令
sidebarTitle: Text to speech (TTS)
summary: 用于外发回复的文本转语音 —— 提供商、persona、斜杠命令和按渠道输出
title: 文本转语音
x-i18n:
    generated_at: "2026-04-26T07:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw 可以将外发回复转换为音频，支持 **13 个语音提供商**，
并在 Feishu、Matrix、Telegram 和 WhatsApp 上发送原生语音消息，
在其他所有地方发送音频附件，以及为电话和 Talk 提供 PCM/Ulaw 流。

## 快速开始

<Steps>
  <Step title="选择一个提供商">
    OpenAI 和 ElevenLabs 是最可靠的托管选项。Microsoft 和
    Local CLI 无需 API 密钥即可使用。完整列表请参阅[提供商矩阵](#supported-providers)。
  </Step>
  <Step title="设置 API 密钥">
    导出你的提供商所需的环境变量（例如 `OPENAI_API_KEY`、
    `ELEVENLABS_API_KEY`）。Microsoft 和 Local CLI 不需要密钥。
  </Step>
  <Step title="在配置中启用">
    设置 `messages.tts.auto: "always"` 和 `messages.tts.provider`：

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="在聊天中试用">
    `/tts status` 会显示当前状态。`/tts audio Hello from OpenClaw`
    会发送一次性音频回复。
  </Step>
</Steps>

<Note>
自动 TTS 默认**关闭**。当 `messages.tts.provider` 未设置时，
OpenClaw 会按照注册表自动选择顺序选择第一个已配置的提供商。
</Note>

## 支持的提供商

| 提供商 | 认证 | 说明 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech** | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（也支持 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION`） | 原生 Ogg/Opus 语音便笺输出和电话支持。 |
| **ElevenLabs** | `ELEVENLABS_API_KEY` 或 `XI_API_KEY` | 支持语音克隆、多语言，可通过 `seed` 实现确定性。 |
| **Google Gemini** | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` | Gemini API TTS；通过 `promptTemplate: "audio-profile-v1"` 支持 persona。 |
| **Gradium** | `GRADIUM_API_KEY` | 支持语音便笺和电话输出。 |
| **Inworld** | `INWORLD_API_KEY` | 流式 TTS API。原生 Opus 语音便笺和 PCM 电话支持。 |
| **Local CLI** | none | 运行已配置的本地 TTS 命令。 |
| **Microsoft** | none | 通过 `node-edge-tts` 使用公开的 Edge neural TTS。尽力而为，无 SLA。 |
| **MiniMax** | `MINIMAX_API_KEY`（或 Token Plan：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`） | T2A v2 API。默认使用 `speech-2.8-hd`。 |
| **OpenAI** | `OPENAI_API_KEY` | 也用于自动摘要；支持 persona `instructions`。 |
| **OpenRouter** | `OPENROUTER_API_KEY`（可复用 `models.providers.openrouter.apiKey`） | 默认模型为 `hexgrad/kokoro-82m`。 |
| **Volcengine** | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`（旧版 AppID/token：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus（国际版） Seed Speech HTTP API。 |
| **Vydra** | `VYDRA_API_KEY` | 共享图像、视频和语音提供商。 |
| **xAI** | `XAI_API_KEY` | xAI 批量 TTS。**不**支持原生 Opus 语音便笺。 |
| **Xiaomi MiMo** | `XIAOMI_API_KEY` | 通过 Xiaomi 聊天补全实现 MiMo TTS。 |

如果配置了多个提供商，则会优先使用已选中的那个，
其他提供商作为回退选项。自动摘要使用 `summaryModel`（或
`agents.defaults.model.primary`），因此如果你保持摘要启用，
该提供商也必须已通过认证。

<Warning>
内置的 **Microsoft** provider 通过 `node-edge-tts` 使用 Microsoft Edge 的在线 neural TTS
服务。这是一个公开的 Web 服务，没有公布的
SLA 或配额 —— 请将其视为尽力而为。旧版 provider id `edge` 会被
规范化为 `microsoft`，而且 `openclaw doctor --fix` 会重写已持久化的
配置；新配置应始终使用 `microsoft`。
</Warning>

## 配置

TTS 配置位于 `~/.openclaw/openclaw.json` 的 `messages.tts` 下。选择一个
预设并调整 provider 块：

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (no key)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### 按智能体覆盖语音

当某个智能体需要使用不同的 provider、
voice、model、persona 或自动 TTS 模式时，请使用 `agents.list[].tts`。智能体块会在
`messages.tts` 之上执行深度合并，因此 provider 凭证可以保留在全局 provider 配置中：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

要固定某个智能体的 persona，请在 provider
配置旁设置 `agents.list[].tts.persona` —— 它只会覆盖该智能体的全局 `messages.tts.persona`。

自动回复、`/tts audio`、`/tts status` 以及
`tts` 智能体工具的优先级顺序如下：

1. `messages.tts`
2. 当前激活的 `agents.list[].tts`
3. 渠道覆盖（当该渠道支持 `channels.<channel>.tts` 时）
4. 账号覆盖（当渠道传入 `channels.<channel>.accounts.<id>.tts` 时）
5. 当前主机的本地 `/tts` 偏好设置
6. 启用[模型覆盖](#model-driven-directives)时的内联 `[[tts:...]]` 指令

渠道和账号覆盖使用与 `messages.tts` 相同的结构，并在更早的层之上执行
深度合并，因此共享的 provider 凭证可以保留在
`messages.tts` 中，而某个渠道或 bot 账号只更改 voice、model、persona
或自动模式：

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Personas

**persona** 是一种稳定的语音身份，可以在不同 provider 之间以确定性的方式
应用。它可以偏好某个 provider，定义与 provider 无关的提示意图，
并携带与 provider 相关的 voice、model、提示模板、
seed 和语音设置绑定。

### 最小 persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "旁白",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### 完整 persona（与 provider 无关的提示）

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "冷淡、温暖的英式管家旁白。",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "一位才华横溢的英国管家。冷幽默、机智、温暖、迷人、富有情感表达力，绝不显得平庸。",
            scene: "安静的深夜书房。为受信任的操作员进行近距离麦克风旁白。",
            sampleContext: "说话者正在以简洁的自信和冷静的温暖回应一个私人技术请求。",
            style: "精致、克制、略带 amused。",
            accent: "英式英语。",
            pacing: "节奏从容，带有短暂的戏剧性停顿。",
            constraints: ["不要大声读出配置值。", "不要解释这个 persona。"],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Persona 解析

当前 persona 会按确定性方式选择：

1. 如果设置了，则使用 `/tts persona <id>` 本地偏好。
2. 如果设置了，则使用 `messages.tts.persona`。
3. 否则不使用 persona。

Provider 选择按“显式优先”运行：

1. 直接覆盖（CLI、Gateway 网关、Talk、允许的 TTS 指令）。
2. `/tts provider <id>` 本地偏好。
3. 当前 persona 的 `provider`。
4. `messages.tts.provider`。
5. 注册表自动选择。

对于每次 provider 尝试，OpenClaw 会按以下顺序合并配置：

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 受信任请求覆盖
4. 允许的模型发出的 TTS 指令覆盖

### Provider 如何使用 persona 提示

Persona 提示字段（`profile`、`scene`、`sampleContext`、`style`、`accent`、
`pacing`、`constraints`）都是**与 provider 无关的**。每个 provider 会自行决定
如何使用它们：

<AccordionGroup>
  <Accordion title="Google Gemini">
    仅当有效的 Google provider 配置设置了 `promptTemplate: "audio-profile-v1"`
    或 `personaPrompt` 时，才会将 persona 提示字段包装成 Gemini TTS 提示结构。
    较旧的 `audioProfile` 和 `speakerName` 字段仍会
    作为 Google 专用提示文本预先附加。像
    `[whispers]` 或 `[laughs]` 这样的内联音频标签，如果位于 `[[tts:text]]` 块中，
    会保留在 Gemini 转录里；OpenClaw 不会生成这些标签。
  </Accordion>
  <Accordion title="OpenAI">
    仅当未显式配置 OpenAI `instructions` 时，
    才会将 persona 提示字段映射到请求的 `instructions` 字段。
    显式 `instructions` 始终优先。
  </Accordion>
  <Accordion title="其他 provider">
    仅使用 `personas.<id>.providers.<provider>` 下
    与 provider 相关的 persona 绑定。除非 provider 自己实现了 persona 提示映射，
    否则会忽略 persona 提示字段。
  </Accordion>
</AccordionGroup>

### 回退策略

`fallbackPolicy` 用于控制当 persona 对被尝试的 provider **没有绑定**时的行为：

| 策略 | 行为 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona` | **默认值。** 与 provider 无关的提示字段仍然可用；provider 可以使用它们，也可以忽略它们。 |
| `provider-defaults` | 在该次尝试的提示准备中省略 persona；provider 使用其中性默认值，同时继续回退到其他 provider。 |
| `fail` | 以 `reasonCode: "not_configured"` 和 `personaBinding: "missing"` 跳过该 provider 尝试。仍然会继续尝试回退 provider。 |

只有当**每个**被尝试的 provider 都被跳过
或失败时，整个 TTS 请求才会失败。

## 模型驱动指令

默认情况下，助手**可以**发出 `[[tts:...]]` 指令来为单次回复覆盖
voice、model 或 speed，并且还可以附带一个可选的
`[[tts:text]]...[[/tts:text]]` 块，用于只应出现在音频中的表现性提示：

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

当 `messages.tts.auto` 为 `"tagged"` 时，**必须使用指令**才会触发
音频。分块流式传输在渠道看到内容之前会将指令从可见文本中移除，即使它们被拆分在相邻的块中也是如此。

除非设置 `modelOverrides.allowProvider: true`，否则 `provider=...` 会被忽略。当某个
回复声明 `provider=...` 时，该指令中的其他键仅会由该 provider 解析；
不受支持的键会被移除，并报告为 TTS
指令警告。

**可用的指令键：**

- `provider`（已注册 provider id；需要 `allowProvider: true`）
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0–10）
- `pitch`（MiniMax 整数音高，−12 到 12；小数值会被截断）
- `emotion`（Volcengine 情感标签）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**完全禁用模型覆盖：**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**允许切换 provider，同时保持其他旋钮可配置：**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## 斜杠命令

单个命令 `/tts`。在 Discord 上，OpenClaw 还会注册 `/voice`，因为
`/tts` 是 Discord 的内置命令 —— 文本 `/tts ...` 仍然可用。

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
命令要求发送者已获授权（适用 allowlist/所有者规则），并且必须启用
`commands.text` 或原生命令注册。
</Note>

行为说明：

- `/tts on` 会将本地 TTS 偏好写为 `always`；`/tts off` 会写为 `off`。
- `/tts chat on|off|default` 会为当前聊天写入一个会话作用域的自动 TTS 覆盖。
- `/tts persona <id>` 会写入本地 persona 偏好；`/tts persona off` 会清除它。
- `/tts latest` 会从当前会话转录中读取最新的助手回复，并将其作为音频发送一次。它只会在会话条目上存储该回复的哈希，以抑制重复发送语音。
- `/tts audio` 会生成一次性音频回复（**不会**切换 TTS 为开启）。
- `limit` 和 `summary` 存储在**本地偏好**中，而不是主配置里。
- `/tts status` 包含最近一次尝试的回退诊断 —— `Fallback: <primary> -> <used>`、`Attempts: ...`，以及每次尝试的详细信息（`provider:outcome(reasonCode) latency`）。
- `/status` 会在启用 TTS 时显示当前 TTS 模式，以及已配置的 provider、model、voice 和已净化的自定义端点元数据。

## 按用户偏好

斜杠命令会将本地覆盖写入 `prefsPath`。默认路径是
`~/.openclaw/settings/tts.json`；可以通过 `OPENCLAW_TTS_PREFS` 环境变量
或 `messages.tts.prefsPath` 覆盖。

| 存储字段 | 效果 |
| ------------ | -------------------------------------------- |
| `auto` | 本地自动 TTS 覆盖（`always`、`off`、…） |
| `provider` | 本地主 provider 覆盖 |
| `persona` | 本地 persona 覆盖 |
| `maxLength` | 摘要阈值（默认 `1500` 个字符） |
| `summarize` | 摘要开关（默认 `true`） |

这些设置会覆盖当前主机上来自 `messages.tts` 加活动
`agents.list[].tts` 块的有效配置。

## 输出格式（固定）

TTS 语音投递由渠道能力驱动。渠道插件会声明
语音风格 TTS 是应要求 provider 输出原生 `voice-note` 目标，
还是保持常规 `audio-file` 合成，并仅将兼容输出标记为可用于语音投递。

- **支持语音便笺的渠道**：语音便笺回复优先使用 Opus（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。
  - 48 kHz / 64 kbps 是语音消息在质量与体积之间的良好平衡。
- **Feishu / WhatsApp**：当语音便笺回复生成为 MP3/WebM/WAV/M4A
  或其他可能的音频文件时，渠道插件会在发送原生语音消息之前，
  使用 `ffmpeg` 将其转码为 48 kHz
  Ogg/Opus。WhatsApp 会通过 Baileys 的 `audio` 负载发送结果，并带上 `ptt: true` 和
  `audio/ogg; codecs=opus`。如果转换失败，Feishu 会将原文件作为附件接收；WhatsApp 发送会失败，而不是发布不兼容的
  PTT 负载。
- **BlueBubbles**：保持 provider 合成走常规 audio-file 路径；MP3
  和 CAF 输出会被标记为用于 iMessage 语音备忘录投递。
- **其他渠道**：MP3（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。
  - 44.1 kHz / 128 kbps 是语音清晰度的默认平衡点。
- **MiniMax**：常规音频附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 采样率）。对于渠道声明的语音便笺目标，当渠道声明支持转码时，OpenClaw 会在投递前使用 `ffmpeg` 将 MiniMax MP3 转码为 48 kHz Opus。
- **Xiaomi MiMo**：默认使用 MP3，或在配置时使用 WAV。对于渠道声明的语音便笺目标，当渠道声明支持转码时，OpenClaw 会在投递前使用 `ffmpeg` 将 Xiaomi 输出转码为 48 kHz Opus。
- **Local CLI**：使用已配置的 `outputFormat`。语音便笺目标
  会被转换为 Ogg/Opus，电话输出会被转换为原始 16 kHz 单声道 PCM，
  使用 `ffmpeg` 完成。
- **Google Gemini**：Gemini API TTS 返回原始 24 kHz PCM。OpenClaw 会将其封装为 WAV 用于音频附件，将其转码为 48 kHz Opus 用于语音便笺目标，并为 Talk/电话直接返回 PCM。
- **Gradium**：音频附件使用 WAV，语音便笺目标使用 Opus，电话使用 8 kHz 的 `ulaw_8000`。
- **Inworld**：常规音频附件使用 MP3，语音便笺目标使用原生 `OGG_OPUS`，Talk/电话使用 22050 Hz 的原始 `PCM`。
- **xAI**：默认使用 MP3；`responseFormat` 可以是 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批量 REST TTS 端点并返回完整音频附件；此 provider 路径不使用 xAI 的流式 TTS WebSocket。不支持原生 Opus 语音便笺格式。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输接受 `outputFormat`，但服务并不提供所有格式。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要
    保证使用 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果已配置的 Microsoft 输出格式失败，OpenClaw 会回退重试 MP3。

OpenAI/ElevenLabs 输出格式按渠道固定（见上文）。

## 自动 TTS 行为

当启用 `messages.tts.auto` 时，OpenClaw 会：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过非常短的回复（少于 10 个字符）。
- 当启用摘要时，使用
  `summaryModel`（或 `agents.defaults.model.primary`）对长回复进行摘要。
- 将生成的音频附加到回复中。
- 在 `mode: "final"` 下，对于流式最终回复，仍会在文本流完成后发送仅音频 TTS；
  生成的媒体会经过与常规回复附件相同的渠道媒体规范化流程。

如果回复超过 `maxLength` 且摘要关闭（或摘要模型没有 API 密钥），
则会跳过音频，并发送常规文本回复。

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## 按渠道划分的输出格式

| 目标 | 格式 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 语音便笺回复优先使用 **Opus**（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。48 kHz / 64 kbps 在清晰度和体积之间取得平衡。 |
| 其他渠道 | **MP3**（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。44.1 kHz / 128 kbps 是语音的默认配置。 |
| Talk / 电话 | provider 原生 **PCM**（Inworld 22050 Hz、Google 24 kHz），或用于电话的 Gradium `ulaw_8000`。 |

各 provider 说明：

- **Feishu / WhatsApp 转码：** 当语音便笺回复生成为 MP3/WebM/WAV/M4A 时，渠道插件会使用 `ffmpeg` 将其转码为 48 kHz Ogg/Opus。WhatsApp 会通过 Baileys 发送，并带上 `ptt: true` 和 `audio/ogg; codecs=opus`。如果转换失败：Feishu 会回退为附加原始文件；WhatsApp 发送会失败，而不是发布不兼容的 PTT 负载。
- **MiniMax / Xiaomi MiMo：** 默认 MP3（MiniMax `speech-2.8-hd` 为 32 kHz）；对于语音便笺目标，会通过 `ffmpeg` 转码为 48 kHz Opus。
- **Local CLI：** 使用已配置的 `outputFormat`。语音便笺目标会被转换为 Ogg/Opus，电话输出会被转换为原始 16 kHz 单声道 PCM。
- **Google Gemini：** 返回原始 24 kHz PCM。OpenClaw 会将其封装为 WAV 用于附件，转码为 48 kHz Opus 用于语音便笺目标，并为 Talk/电话直接返回 PCM。
- **Inworld：** 附件使用 MP3，语音便笺使用原生 `OGG_OPUS`，Talk/电话使用 22050 Hz 原始 `PCM`。
- **xAI：** 默认 MP3；`responseFormat` 可以是 `mp3|wav|pcm|mulaw|alaw`。使用 xAI 的批量 REST 端点 —— **不**使用流式 WebSocket TTS。不支持原生 Opus 语音便笺格式。
- **Microsoft：** 使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要保证使用 Opus 语音消息，请使用 OpenAI/ElevenLabs。如果已配置的 Microsoft 格式失败，OpenClaw 会回退重试 MP3。

OpenAI 和 ElevenLabs 的输出格式按渠道固定，如上所列。

## 字段参考

<AccordionGroup>
  <Accordion title="顶层 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自动 TTS 模式。`inbound` 仅在收到入站语音消息后发送音频；`tagged` 仅在回复包含 `[[tts:...]]` 指令或 `[[tts:text]]` 块时发送音频。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      旧版开关。`openclaw doctor --fix` 会将其迁移到 `auto`。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` 除最终回复外，还包括工具/分块回复。
    </ParamField>
    <ParamField path="provider" type="string">
      语音 provider id。未设置时，OpenClaw 会按注册表自动选择顺序使用第一个已配置的 provider。旧版 `provider: "edge"` 会被 `openclaw doctor --fix` 重写为 `"microsoft"`。
    </ParamField>
    <ParamField path="persona" type="string">
      来自 `personas` 的当前 persona id。会规范化为小写。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      稳定的语音身份。字段包括：`label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。参见 [Personas](#personas)。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      用于自动摘要的低成本模型；默认是 `agents.defaults.model.primary`。接受 `provider/model` 或已配置的模型别名。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      允许模型发出 TTS 指令。`enabled` 默认为 `true`；`allowProvider` 默认为 `false`。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      由 provider 拥有的设置，按语音 provider id 作为键。旧版直接块（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）会被 `openclaw doctor --fix` 重写；提交时仅保留 `messages.tts.providers.<id>`。
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 输入字符数的硬上限。超过时，`/tts audio` 会失败。
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      请求超时时间（毫秒）。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      覆盖本地 prefs JSON 路径（provider/limit/summary）。默认是 `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">环境变量：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech 区域（例如 `eastus`）。环境变量：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">可选的 Azure Speech 端点覆盖（别名 `baseUrl`）。</ParamField>
    <ParamField path="voice" type="string">Azure voice ShortName。默认是 `en-US-JennyNeural`。</ParamField>
    <ParamField path="lang" type="string">SSML 语言代码。默认是 `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">标准音频的 Azure `X-Microsoft-OutputFormat`。默认是 `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">语音便笺输出的 Azure `X-Microsoft-OutputFormat`。默认是 `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">回退到 `ELEVENLABS_API_KEY` 或 `XI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">模型 id（例如 `eleven_multilingual_v2`、`eleven_v3`）。</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs voice id。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（各自范围 `0..1`），`useSpeakerBoost`（`true|false`），`speed`（`0.5..2.0`，`1.0` = 正常）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>文本规范化模式。</ParamField>
    <ParamField path="languageCode" type="string">2 字母 ISO 639-1（例如 `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">整数 `0..4294967295`，用于尽力而为的确定性。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 ElevenLabs API base URL。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">回退到 `GEMINI_API_KEY` / `GOOGLE_API_KEY`。如果省略，TTS 在回退到环境变量之前还可以复用 `models.providers.google.apiKey`。</ParamField>
    <ParamField path="model" type="string">Gemini TTS 模型。默认是 `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="voiceName" type="string">Gemini 预置 voice 名称。默认是 `Kore`。别名：`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">在朗读文本前附加的自然语言风格提示。</ParamField>
    <ParamField path="speakerName" type="string">当你的提示使用具名说话者时，在朗读文本前附加的可选说话者标签。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>设置为 `audio-profile-v1` 时，会将当前 persona 提示字段包装为确定性的 Gemini TTS 提示结构。</ParamField>
    <ParamField path="personaPrompt" type="string">附加到模板 Director's Notes 的 Google 专用额外 persona 提示文本。</ParamField>
    <ParamField path="baseUrl" type="string">仅接受 `https://generativelanguage.googleapis.com`。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">环境变量：`GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认是 `https://api.gradium.ai`。</ParamField>
    <ParamField path="voiceId" type="string">默认是 Emma（`YTpq7expH9539ERJ`）。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">环境变量：`INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认是 `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">默认是 `inworld-tts-1.5-max`。也支持：`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="voiceId" type="string">默认是 `Sarah`。</ParamField>
    <ParamField path="temperature" type="number">采样温度 `0..2`。</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">用于 CLI TTS 的本地可执行文件或命令字符串。</ParamField>
    <ParamField path="args" type="string[]">命令参数。支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` 占位符。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>预期的 CLI 输出格式。音频附件默认是 `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">命令超时时间（毫秒）。默认 `120000`。</ParamField>
    <ParamField path="cwd" type="string">可选的命令工作目录。</ParamField>
    <ParamField path="env" type="Record<string, string>">命令的可选环境变量覆盖。</ParamField>
  </Accordion>

  <Accordion title="Microsoft（无 API 密钥）">
    <ParamField path="enabled" type="boolean" default="true">允许使用 Microsoft 语音。</ParamField>
    <ParamField path="voice" type="string">Microsoft neural voice 名称（例如 `en-US-MichelleNeural`）。</ParamField>
    <ParamField path="lang" type="string">语言代码（例如 `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 输出格式。默认是 `audio-24khz-48kbitrate-mono-mp3`。并非所有格式都受内置的 Edge 后端传输支持。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">百分比字符串（例如 `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">在音频文件旁写入 JSON 字幕。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 语音请求的代理 URL。</ParamField>
    <ParamField path="timeoutMs" type="number">请求超时覆盖（毫秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>旧版别名。运行 `openclaw doctor --fix` 可将已持久化配置重写到 `providers.microsoft`。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">回退到 `MINIMAX_API_KEY`。Token Plan 认证通过 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认是 `https://api.minimax.io`。环境变量：`MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">默认是 `speech-2.8-hd`。环境变量：`MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="voiceId" type="string">默认是 `English_expressive_narrator`。环境变量：`MINIMAX_TTS_VOICE_ID`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。默认 `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。默认 `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。默认 `0`。小数值会在请求前被截断。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">回退到 `OPENAI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 模型 id（例如 `gpt-4o-mini-tts`）。</ParamField>
    <ParamField path="voice" type="string">voice 名称（例如 `alloy`、`cedar`）。</ParamField>
    <ParamField path="instructions" type="string">显式 OpenAI `instructions` 字段。设置后，persona 提示字段**不会**自动映射。</ParamField>
    <ParamField path="baseUrl" type="string">
      覆盖 OpenAI TTS 端点。解析顺序：配置 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。非默认值会被视为 OpenAI 兼容的 TTS 端点，因此接受自定义模型和 voice 名称。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">环境变量：`OPENROUTER_API_KEY`。可复用 `models.providers.openrouter.apiKey`。</ParamField>
    <ParamField path="baseUrl" type="string">默认是 `https://openrouter.ai/api/v1`。旧版 `https://openrouter.ai/v1` 会被规范化。</ParamField>
    <ParamField path="model" type="string">默认是 `hexgrad/kokoro-82m`。别名：`modelId`。</ParamField>
    <ParamField path="voice" type="string">默认是 `af_alloy`。别名：`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>默认是 `mp3`。</ParamField>
    <ParamField path="speed" type="number">provider 原生速度覆盖。</ParamField>
  </Accordion>

  <Accordion title="Volcengine（BytePlus（国际版） Seed Speech）">
    <ParamField path="apiKey" type="string">环境变量：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">默认是 `seed-tts-1.0`。环境变量：`VOLCENGINE_TTS_RESOURCE_ID`。当你的项目具有 TTS 2.0 权限时，请使用 `seed-tts-2.0`。</ParamField>
    <ParamField path="appKey" type="string">App key header。默认是 `aGjiRDfUWi`。环境变量：`VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 Seed Speech TTS HTTP 端点。环境变量：`VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="voice" type="string">voice 类型。默认是 `en_female_anna_mars_bigtts`。环境变量：`VOLCENGINE_TTS_VOICE`。</ParamField>
    <ParamField path="speedRatio" type="number">provider 原生速度比例。</ParamField>
    <ParamField path="emotion" type="string">provider 原生情感标签。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>旧版 Volcengine Speech Console 字段。环境变量：`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（默认 `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">环境变量：`XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认是 `https://api.x.ai/v1`。环境变量：`XAI_BASE_URL`。</ParamField>
    <ParamField path="voiceId" type="string">默认是 `eve`。实时语音有：`ara`、`eve`、`leo`、`rex`、`sal`、`una`。</ParamField>
    <ParamField path="language" type="string">BCP-47 语言代码或 `auto`。默认是 `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>默认是 `mp3`。</ParamField>
    <ParamField path="speed" type="number">provider 原生速度覆盖。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">环境变量：`XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认是 `https://api.xiaomimimo.com/v1`。环境变量：`XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">默认是 `mimo-v2.5-tts`。环境变量：`XIAOMI_TTS_MODEL`。也支持 `mimo-v2-tts`。</ParamField>
    <ParamField path="voice" type="string">默认是 `mimo_default`。环境变量：`XIAOMI_TTS_VOICE`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>默认是 `mp3`。环境变量：`XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">可选的自然语言风格说明，会作为用户消息发送；不会被朗读。</ParamField>
  </Accordion>
</AccordionGroup>

## 智能体工具

`tts` 工具可将文本转换为语音，并返回用于回复投递的音频附件。在 Feishu、Matrix、Telegram 和 WhatsApp 上，音频会作为语音消息投递，而不是文件附件。若 `ffmpeg` 可用，Feishu 和 WhatsApp 在此路径上还可以对非 Opus 的 TTS 输出进行转码。

WhatsApp 会通过 Baileys 将音频作为 PTT 语音便笺发送（带有
`ptt: true` 的 `audio`），并将可见文本与 PTT 音频**分开发送**，因为
客户端并不总是能稳定显示语音便笺上的标题。

该工具接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是
按调用生效的 provider 请求超时时间（毫秒）。

## Gateway 网关 RPC

| 方法 | 用途 |
| ----------------- | ---------------------------------------- |
| `tts.status` | 读取当前 TTS 状态和最近一次尝试。 |
| `tts.enable` | 将本地自动偏好设置为 `always`。 |
| `tts.disable` | 将本地自动偏好设置为 `off`。 |
| `tts.convert` | 一次性文本 → 音频。 |
| `tts.setProvider` | 设置本地 provider 偏好。 |
| `tts.setPersona` | 设置本地 persona 偏好。 |
| `tts.providers` | 列出已配置的 provider 及其状态。 |

## 服务链接

- [OpenAI text-to-speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/zh-CN/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/zh-CN/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/zh-CN/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/zh-CN/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 相关内容

- [媒体概览](/zh-CN/tools/media-overview)
- [音乐生成](/zh-CN/tools/music-generation)
- [视频生成](/zh-CN/tools/video-generation)
- [斜杠命令](/zh-CN/tools/slash-commands)
- [语音通话插件](/zh-CN/plugins/voice-call)
