---
read_when:
    - 返信で text-to-speech を有効にする
    - TTS provider または制限を設定する
    - '`/tts` コマンドを使う'
summary: 送信返信向けの text-to-speech（TTS）
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-25T14:02:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw は、ElevenLabs、Google Gemini、Gradium、Local CLI、Microsoft、MiniMax、OpenAI、Vydra、xAI、または Xiaomi MiMo を使って、送信する返信を音声へ変換できます。  
OpenClaw が音声を送信できる場所であればどこでも動作します。

## 対応サービス

- **ElevenLabs**（primary または fallback provider）
- **Google Gemini**（primary または fallback provider。Gemini API TTS を使用）
- **Gradium**（primary または fallback provider。voice-note と telephony 出力をサポート）
- **Local CLI**（primary または fallback provider。設定済みのローカル TTS コマンドを実行）
- **Microsoft**（primary または fallback provider。現在のバンドル済み実装は `node-edge-tts` を使用）
- **MiniMax**（primary または fallback provider。T2A v2 API を使用）
- **OpenAI**（primary または fallback provider。summary にも使用）
- **Vydra**（primary または fallback provider。共有の image、video、および speech provider）
- **xAI**（primary または fallback provider。xAI TTS API を使用）
- **Xiaomi MiMo**（primary または fallback provider。Xiaomi chat completions 経由で MiMo TTS を使用）

### Microsoft speech に関する注意

バンドル済みの Microsoft speech provider は現在、`node-edge-tts` ライブラリを通じて Microsoft Edge のオンライン neural
TTS サービスを使用します。これは hosted service であり（ローカルではなく）、
Microsoft endpoint を使用し、API key は不要です。  
`node-edge-tts` は speech 設定オプションと出力形式を公開しますが、
すべてのオプションがサービスでサポートされるわけではありません。`edge` を使うレガシーな設定や directive 入力も引き続き動作し、`microsoft` に正規化されます。

この経路は公開 web service であり、公開された SLA や quota がないため、
ベストエフォートとして扱ってください。保証された上限とサポートが必要であれば、OpenAI
または ElevenLabs を使用してください。

## 任意のキー

OpenAI、ElevenLabs、Google Gemini、Gradium、MiniMax、Vydra、xAI、または Xiaomi MiMo を使いたい場合:

- `ELEVENLABS_API_KEY`（または `XI_API_KEY`）
- `GEMINI_API_KEY`（または `GOOGLE_API_KEY`）
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS は
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, または
  `MINIMAX_CODING_API_KEY` による Token Plan auth も受け付けます
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI と Microsoft speech には **API key は不要** です。

複数の provider が設定されている場合、選択された provider が最初に使われ、他は fallback option になります。  
自動 summary は設定された `summaryModel`（または `agents.defaults.model.primary`）を使うため、
summary を有効にする場合は、その provider も認証されている必要があります。

## サービスリンク

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ja-JP/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Xiaomi MiMo speech synthesis](/ja-JP/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## デフォルトで有効ですか？

いいえ。自動 TTS はデフォルトで **off** です。config の
`messages.tts.auto` で有効にするか、`/tts on` でローカルに有効にしてください。

`messages.tts.provider` が未設定の場合、OpenClaw は
registry auto-select 順序で最初に設定された speech provider を選びます。

## 設定

TTS 設定は `openclaw.json` の `messages.tts` 配下にあります。  
完全なスキーマは [Gateway configuration](/ja-JP/gateway/configuration) にあります。

### 最小設定（有効化 + provider）

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

### OpenAI を primary、ElevenLabs を fallback にする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft を primary にする（API key なし）

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax を primary にする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

MiniMax TTS の auth 解決順序は、`messages.tts.providers.minimax.apiKey`、次に
保存済みの `minimax-portal` OAuth/token profile、次に Token Plan 環境キー
（`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`）、最後に `MINIMAX_API_KEY` です。明示的な TTS
`baseUrl` が設定されていない場合、OpenClaw は Token Plan speech 用に設定済みの `minimax-portal` OAuth
host を再利用できます。

### Google Gemini を primary にする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS は Gemini API key 経路を使用します。Gemini API に制限された
Google Cloud Console API key もここで有効であり、これはバンドル済み Google image-generation provider で使うキーと同じ種類です。解決順序は
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY` です。

### xAI を primary にする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS は、バンドル済み Grok model provider と同じ `XAI_API_KEY` 経路を使用します。  
解決順序は `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY` です。  
現在の live voice は `ara`, `eve`, `leo`, `rex`, `sal`, `una` で、デフォルトは `eve` です。`language` は BCP-47 tag または `auto` を受け付けます。

### Xiaomi MiMo を primary にする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS は、バンドル済み Xiaomi model
provider と同じ `XIAOMI_API_KEY` 経路を使用します。speech provider id は `xiaomi` で、
`mimo` は alias として受け付けられます。対象テキストは assistant message として送信され、これは Xiaomi の TTS
contract に一致します。任意の `style` は user instruction として送信され、読み上げられません。

### OpenRouter を primary にする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS は、バンドル済み
OpenRouter model provider と同じ `OPENROUTER_API_KEY` 経路を使用します。解決順序は
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY` です。

### Local CLI を primary にする

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

Local CLI TTS は、gateway host 上で設定済みコマンドを実行します。`{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}`, および `{{OutputBase}}` プレースホルダーは
`args` 内で展開されます。`{{Text}}` プレースホルダーが存在しない場合、OpenClaw は
読み上げるテキストを stdin に書き込みます。`outputFormat` は `mp3`, `opus`, または `wav` を受け付けます。  
voice-note target は Ogg/Opus に transcoded され、telephony 出力は
`ffmpeg` で raw 16 kHz mono PCM に transcoded されます。レガシー provider alias の
`cli` も引き続き動作しますが、新しい設定では `tts-local-cli` を使うべきです。

### Gradium を primary にする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Microsoft speech を無効化する

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### カスタム制限 + prefs path

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### 受信したボイスメッセージの後だけ音声で返信する

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 長い返信に対する自動 summary を無効化する

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

その後、次を実行します:

```
/tts summary off
```

### フィールドに関する注意

- `auto`: 自動 TTS モード（`off`, `always`, `inbound`, `tagged`）。
  - `inbound` は、受信したボイスメッセージの後にのみ音声を送信します。
  - `tagged` は、返信に `[[tts:key=value]]` directive または `[[tts:text]]...[[/tts:text]]` block が含まれる場合にのみ音声を送信します。
- `enabled`: レガシーな toggle（doctor がこれを `auto` に移行します）。
- `mode`: `"final"`（デフォルト）または `"all"`（tool/block reply を含む）。
- `provider`: `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"`, または `"xiaomi"` のような speech provider id（fallback は自動）。
- `provider` が **未設定** の場合、OpenClaw は registry auto-select 順序で最初に設定された speech provider を使用します。
- レガシーな `provider: "edge"` 設定は `openclaw doctor --fix` により修復され、
  `provider: "microsoft"` に書き換えられます。
- `summaryModel`: 自動 summary 用の任意の低コストモデル。デフォルトは `agents.defaults.model.primary`。
  - `provider/model` または設定済み model alias を受け付けます。
- `modelOverrides`: モデルが TTS directive を出せるようにします（デフォルトで on）。
  - `allowProvider` のデフォルトは `false`（provider 切り替えは opt-in）。
- `providers.<id>`: speech provider id をキーに持つ provider 管理設定。
- レガシーな direct provider block（`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`）は `openclaw doctor --fix` により修復されます。コミットされる設定では `messages.tts.providers.<id>` を使うべきです。
- レガシーな `messages.tts.providers.edge` も `openclaw doctor --fix` により修復されます。コミットされる設定では `messages.tts.providers.microsoft` を使うべきです。
- `maxTextLength`: TTS 入力のハード上限（文字数）。超過すると `/tts audio` は失敗します。
- `timeoutMs`: request timeout（ms）。
- `prefsPath`: ローカル prefs JSON path（provider/limit/summary）の上書き。
- `apiKey` 値は env var にフォールバックします（`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`）。
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URL の上書き。
- `providers.openai.baseUrl`: OpenAI TTS endpoint の上書き。
  - 解決順序: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 非デフォルト値は OpenAI-compatible TTS endpoint として扱われるため、カスタム model 名と voice 名が受け付けられます。
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0`（1.0 = 通常）
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 文字の ISO 639-1（例: `en`, `de`）
- `providers.elevenlabs.seed`: 整数 `0..4294967295`（ベストエフォートな決定性）
- `providers.minimax.baseUrl`: MiniMax API base URL の上書き（デフォルト `https://api.minimax.io`, env: `MINIMAX_API_HOST`）。
- `providers.minimax.model`: TTS model（デフォルト `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`: voice 識別子（デフォルト `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`: 再生速度 `0.5..2.0`（デフォルト 1.0）。
- `providers.minimax.vol`: 音量 `(0, 10]`（デフォルト 1.0。0 より大きい必要があります）。
- `providers.minimax.pitch`: 整数の pitch shift `-12..12`（デフォルト 0）。MiniMax T2A API は整数でない pitch 値を拒否するため、小数値は呼び出し前に切り捨てられます。
- `providers.tts-local-cli.command`: CLI TTS 用のローカル executable または command string。
- `providers.tts-local-cli.args`: command 引数。`{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, および `{{OutputBase}}` プレースホルダーをサポートします。
- `providers.tts-local-cli.outputFormat`: 想定される CLI 出力形式（`mp3`, `opus`, または `wav`。音声添付のデフォルトは `mp3`）。
- `providers.tts-local-cli.timeoutMs`: command timeout（ミリ秒、デフォルト `120000`）。
- `providers.tts-local-cli.cwd`: 任意の command working directory。
- `providers.tts-local-cli.env`: command 向けの任意の文字列 environment override。
- `providers.google.model`: Gemini TTS model（デフォルト `gemini-3.1-flash-tts-preview`）。
- `providers.google.voiceName`: Gemini の事前定義 voice 名（デフォルト `Kore`; `voice` も受け付けます）。
- `providers.google.audioProfile`: 読み上げテキストの前に追加される自然言語スタイル prompt。
- `providers.google.speakerName`: TTS prompt が名前付き speaker を使う場合に、読み上げテキストの前に追加される任意の speaker label。
- `providers.google.baseUrl`: Gemini API base URL の上書き。`https://generativelanguage.googleapis.com` のみ受け付けます。
  - `messages.tts.providers.google.apiKey` が省略されている場合、TTS は env fallback の前に `models.providers.google.apiKey` を再利用できます。
- `providers.gradium.baseUrl`: Gradium API base URL の上書き（デフォルト `https://api.gradium.ai`）。
- `providers.gradium.voiceId`: Gradium voice 識別子（デフォルト Emma, `YTpq7expH9539ERJ`）。
- `providers.xai.apiKey`: xAI TTS API key（env: `XAI_API_KEY`）。
- `providers.xai.baseUrl`: xAI TTS base URL の上書き（デフォルト `https://api.x.ai/v1`, env: `XAI_BASE_URL`）。
- `providers.xai.voiceId`: xAI voice id（デフォルト `eve`; 現在の live voice: `ara`, `eve`, `leo`, `rex`, `sal`, `una`）。
- `providers.xai.language`: BCP-47 言語コードまたは `auto`（デフォルト `en`）。
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw`, または `alaw`（デフォルト `mp3`）。
- `providers.xai.speed`: provider ネイティブの speed override。
- `providers.xiaomi.apiKey`: Xiaomi MiMo API key（env: `XIAOMI_API_KEY`）。
- `providers.xiaomi.baseUrl`: Xiaomi MiMo API base URL の上書き（デフォルト `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`）。
- `providers.xiaomi.model`: TTS model（デフォルト `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; `mimo-v2-tts` もサポート）。
- `providers.xiaomi.voice`: MiMo voice id（デフォルト `mimo_default`, env: `XIAOMI_TTS_VOICE`）。
- `providers.xiaomi.format`: `mp3` または `wav`（デフォルト `mp3`, env: `XIAOMI_TTS_FORMAT`）。
- `providers.xiaomi.style`: 任意の自然言語スタイル指示。user message として送られ、読み上げられません。
- `providers.openrouter.apiKey`: OpenRouter API key（env: `OPENROUTER_API_KEY`; `models.providers.openrouter.apiKey` を再利用可能）。
- `providers.openrouter.baseUrl`: OpenRouter TTS base URL の上書き（デフォルト `https://openrouter.ai/api/v1`; レガシーな `https://openrouter.ai/v1` は正規化されます）。
- `providers.openrouter.model`: OpenRouter TTS model id（デフォルト `hexgrad/kokoro-82m`; `modelId` も受け付けます）。
- `providers.openrouter.voice`: provider 固有の voice id（デフォルト `af_alloy`; `voiceId` も受け付けます）。
- `providers.openrouter.responseFormat`: `mp3` または `pcm`（デフォルト `mp3`）。
- `providers.openrouter.speed`: provider ネイティブの speed override。
- `providers.microsoft.enabled`: Microsoft speech 利用を許可（デフォルト `true`; API key なし）。
- `providers.microsoft.voice`: Microsoft neural voice 名（例: `en-US-MichelleNeural`）。
- `providers.microsoft.lang`: 言語コード（例: `en-US`）。
- `providers.microsoft.outputFormat`: Microsoft 出力形式（例: `audio-24khz-48kbitrate-mono-mp3`）。
  - 有効な値は Microsoft Speech output formats を参照してください。すべての形式が、バンドル済み Edge ベース transport でサポートされるわけではありません。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: パーセント文字列（例: `+10%`, `-5%`）。
- `providers.microsoft.saveSubtitles`: 音声ファイルと一緒に JSON subtitle を書き出します。
- `providers.microsoft.proxy`: Microsoft speech request 用の proxy URL。
- `providers.microsoft.timeoutMs`: request timeout override（ms）。
- `edge.*`: 同じ Microsoft 設定のレガシー alias。保存済み config を `providers.microsoft` に書き換えるには
  `openclaw doctor --fix` を実行してください。

## モデル駆動の override（デフォルトで有効）

デフォルトでは、モデルは **単一の返信に対して** TTS directive を出せます。  
`messages.tts.auto` が `tagged` の場合、これらの directive が音声をトリガーするために必須です。

有効時、モデルは単一の返信に対して voice を上書きするための `[[tts:...]]` directive に加えて、
音声にのみ含めるべき表現タグ（笑い声、歌唱キューなど）を提供するための任意の `[[tts:text]]...[[/tts:text]]` block を出せます。

`provider=...` directive は、`modelOverrides.allowProvider: true` でない限り無視されます。

reply payload の例:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

利用可能な directive key（有効時）:

- `provider`（登録済み speech provider id。例: `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai`, または `xiaomi`; `allowProvider: true` が必要）
- `voice`（OpenAI, Gradium, または Xiaomi の voice）、`voiceName` / `voice_name` / `google_voice`（Google の voice）、または `voiceId`（ElevenLabs / Gradium / MiniMax / xAI）
- `model`（OpenAI TTS model、ElevenLabs model id、MiniMax model、または Xiaomi MiMo TTS model）または `google_model`（Google TTS model）
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量、0-10）
- `pitch`（MiniMax の整数 pitch、-12 から 12。小数値は MiniMax request 前に切り捨てられます）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

すべての model override を無効化:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

任意の allowlist（provider 切り替えを有効にしつつ、他のノブは設定可能なままにする）:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## ユーザーごとの設定

slash command はローカル override を `prefsPath`（デフォルト:
`~/.openclaw/settings/tts.json`。`OPENCLAW_TTS_PREFS` または
`messages.tts.prefsPath` で上書き可能）に書き込みます。

保存される field:

- `enabled`
- `provider`
- `maxLength`（summary threshold。デフォルト 1500 文字）
- `summarize`（デフォルト `true`）

これらは、その host では `messages.tts.*` を上書きします。

## 出力形式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**: voice-note 返信では Opus を優先します（ElevenLabs では `opus_48000_64`、OpenAI では `opus`）。
  - 48kHz / 64kbps は、音声メッセージとして良いバランスです。
- **Feishu**: voice-note 返信が MP3/WAV/M4A またはその他の
  音声ファイルと思われる形式で生成された場合、Feishu Plugin は送信前に
  `ffmpeg` でそれを 48kHz Ogg/Opus に transcoding し、ネイティブな `audio` bubble として送信します。変換に失敗した場合、Feishu
  には元ファイルが attachment として送られます。
- **Other channels**: MP3（ElevenLabs では `mp3_44100_128`、OpenAI では `mp3`）。
  - 44.1kHz / 128kbps は、speech の明瞭さに対するデフォルトのバランスです。
- **MiniMax**: 通常の音声 attachment では MP3（`speech-2.8-hd` model、32kHz sample rate）。Feishu や Telegram のような voice-note target では、OpenClaw は配信前に `ffmpeg` で MiniMax の MP3 を 48kHz Opus に transcoding します。
- **Xiaomi MiMo**: デフォルトでは MP3、設定時は WAV。Feishu や Telegram のような voice-note target では、OpenClaw は配信前に `ffmpeg` で Xiaomi 出力を 48kHz Opus に transcoding します。
- **Local CLI**: 設定された `outputFormat` を使用します。voice-note target は Ogg/Opus に
  変換され、telephony 出力は `ffmpeg` で raw 16 kHz mono PCM に変換されます。
- **Google Gemini**: Gemini API TTS は raw 24kHz PCM を返します。OpenClaw は音声 attachment ではそれを WAV としてラップし、Talk/telephony では PCM を直接返します。ネイティブな Opus voice-note 形式はこの経路ではサポートされません。
- **Gradium**: 音声 attachment では WAV、voice-note target では Opus、telephony では 8 kHz の `ulaw_8000`。
- **xAI**: デフォルトでは MP3。`responseFormat` は `mp3`, `wav`, `pcm`, `mulaw`, または `alaw` にできます。OpenClaw は xAI のバッチ REST TTS endpoint を使い、完全な音声 attachment を返します。xAI の streaming TTS WebSocket はこの provider 経路では使用されません。ネイティブな Opus voice-note 形式はこの経路ではサポートされません。
- **Microsoft**: `microsoft.outputFormat` を使用します（デフォルト `audio-24khz-48kbitrate-mono-mp3`）。
  - バンドル済み transport は `outputFormat` を受け付けますが、すべての形式がサービスで利用可能なわけではありません。
  - 出力形式の値は Microsoft Speech output formats に従います（Ogg/WebM Opus を含む）。
  - Telegram の `sendVoice` は OGG/MP3/M4A を受け付けます。確実に Opus の音声メッセージが必要なら OpenAI/ElevenLabs を使ってください。
  - 設定された Microsoft 出力形式が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI/ElevenLabs の出力形式はチャネルごとに固定です（上記参照）。

## 自動 TTS の動作

有効時、OpenClaw は:

- 返信にすでに media または `MEDIA:` directive が含まれている場合は TTS をスキップする
- 非常に短い返信（10 文字未満）をスキップする
- 有効な場合、`agents.defaults.model.primary`（または `summaryModel`）を使って長い返信を要約する
- 生成した音声を返信に添付する

返信が `maxLength` を超え、summary が off の場合（または
summary model 用の API key がない場合）、音声はスキップされ、
通常のテキスト返信が送信されます。

## フローダイアグラム

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Slash command の使い方

コマンドは `/tts` の 1 つだけです。  
有効化の詳細は [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

Discord に関する注意: `/tts` は組み込みの Discord コマンドなので、OpenClaw は
そこでネイティブコマンドとして `/voice` を登録します。テキストの `/tts ...` も引き続き動作します。

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

注意:

- コマンドには認可された送信者が必要です（allowlist/owner ルールは引き続き適用されます）。
- `commands.text` またはネイティブコマンド登録が有効である必要があります。
- config `messages.tts.auto` は `off|always|inbound|tagged` を受け付けます。
- `/tts on` はローカル TTS 設定を `always` に書き込み、`/tts off` は `off` に書き込みます。
- `inbound` または `tagged` をデフォルトにしたい場合は config を使用してください。
- `limit` と `summary` は、メイン config ではなくローカル prefs に保存されます。
- `/tts audio` は 1 回限りの音声返信を生成します（TTS を on に切り替えるわけではありません）。
- `/tts status` には最新試行の fallback 可視化が含まれます:
  - success fallback: `Fallback: <primary> -> <used>` と `Attempts: ...`
  - failure: `Error: ...` と `Attempts: ...`
  - 詳細な診断: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI および ElevenLabs の API failure には、provider が返した場合、解析済みの provider error detail と request id が含まれるようになっており、TTS error/log に表示されます。

## エージェントツール

`tts` ツールはテキストを speech に変換し、返信配信用の音声 attachment を返します。  
channel が Feishu、Matrix、Telegram、または WhatsApp の場合、
音声は file attachment ではなく voice message として配信されます。  
Feishu は、この経路で `ffmpeg` が利用可能な場合、非 Opus の TTS 出力を transcoding できます。  
任意の `channel` および `timeoutMs` field を受け付けます。`timeoutMs` は
呼び出しごとの provider request timeout（ミリ秒）です。

## Gateway RPC

Gateway method:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## 関連

- [Media overview](/ja-JP/tools/media-overview)
- [Music generation](/ja-JP/tools/music-generation)
- [Video generation](/ja-JP/tools/video-generation)
