---
read_when:
    - 応答のテキスト読み上げを有効にすること
    - TTS provider または制限を設定すること
    - '`/tts` コマンドを使用すること'
summary: 送信応答向けテキスト読み上げ（TTS）
title: テキスト読み上げ
x-i18n:
    generated_at: "2026-04-23T04:52:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# テキスト読み上げ（TTS）

OpenClaw は、ElevenLabs、Google Gemini、Microsoft、MiniMax、OpenAI、または xAI を使って送信応答を音声に変換できます。
これは、OpenClaw が音声を送信できるあらゆる場所で動作します。

## 対応サービス

- **ElevenLabs**（主 provider またはフォールバック provider）
- **Google Gemini**（主 provider またはフォールバック provider。Gemini API TTS を使用）
- **Microsoft**（主 provider またはフォールバック provider。現在のバンドル実装は `node-edge-tts` を使用）
- **MiniMax**（主 provider またはフォールバック provider。T2A v2 API を使用）
- **OpenAI**（主 provider またはフォールバック provider。要約にも使用）
- **xAI**（主 provider またはフォールバック provider。xAI TTS API を使用）

### Microsoft speech に関する注意

現在バンドルされている Microsoft speech provider は、`node-edge-tts` ライブラリ経由で Microsoft Edge のオンライン
ニューラル TTS サービスを使用します。これはホスト型サービスであり（ローカルではありません）、
Microsoft エンドポイントを使用し、API キーは不要です。
`node-edge-tts` は speech 設定オプションと出力形式を公開していますが、
すべてのオプションがサービスでサポートされているわけではありません。`edge` を使うレガシー設定と directive 入力は
引き続き動作し、`microsoft` に正規化されます。

この経路は、公開された SLA やクォータのないパブリック Web サービスであるため、
ベストエフォートとして扱ってください。保証された制限とサポートが必要な場合は、
OpenAI または ElevenLabs を使用してください。

## 任意のキー

OpenAI、ElevenLabs、Google Gemini、MiniMax、または xAI を使いたい場合:

- `ELEVENLABS_API_KEY`（または `XI_API_KEY`）
- `GEMINI_API_KEY`（または `GOOGLE_API_KEY`）
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech には **API キーは不要** です。

複数の provider が設定されている場合、選択された provider が最初に使われ、残りはフォールバックオプションになります。
自動要約は設定された `summaryModel`（または `agents.defaults.model.primary`）を使用するため、
要約を有効にする場合は、その provider も認証されている必要があります。

## サービスリンク

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## デフォルトで有効ですか？

いいえ。自動 TTS はデフォルトで **オフ** です。設定の
`messages.tts.auto` で有効にするか、ローカルで `/tts on` を使って有効にしてください。

`messages.tts.provider` が未設定の場合、OpenClaw は registry の自動選択順で最初に設定された
speech provider を選びます。

## 設定

TTS 設定は `openclaw.json` の `messages.tts` 配下にあります。
完全なスキーマは [Gateway configuration](/ja-JP/gateway/configuration) にあります。

### 最小構成（有効化 + provider）

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

### OpenAI を主、ElevenLabs をフォールバックにする

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

### Microsoft を主にする（API キー不要）

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

### MiniMax を主にする

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

### Google Gemini を主にする

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

Google Gemini TTS は Gemini API キー経路を使用します。Gemini API のみに制限された Google Cloud Console API キーはここで有効であり、バンドルされた Google 画像生成 provider が使用するキーと同じ種類です。解決順序は
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY` です。

### xAI を主にする

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

xAI TTS は、バンドルされた Grok モデル provider と同じ `XAI_API_KEY` 経路を使用します。
解決順序は `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY` です。
現在利用可能な音声は `ara`, `eve`, `leo`, `rex`, `sal`, `una` で、`eve` が
デフォルトです。`language` は BCP-47 タグまたは `auto` を受け付けます。

### Microsoft speech を無効にする

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

### カスタム制限 + prefs パス

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

### 受信した音声メッセージの後だけ音声で返信する

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 長い応答に対する自動要約を無効にする

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

その後、次を実行します。

```
/tts summary off
```

### フィールドに関する注意

- `auto`: 自動 TTS モード（`off`, `always`, `inbound`, `tagged`）。
  - `inbound` は、受信した音声メッセージの後にのみ音声を送信します。
  - `tagged` は、応答に `[[tts:key=value]]` directive または `[[tts:text]]...[[/tts:text]]` ブロックが含まれる場合にのみ音声を送信します。
- `enabled`: レガシートグル（doctor がこれを `auto` に移行します）。
- `mode`: `"final"`（デフォルト）または `"all"`（ツール/ブロック応答を含む）。
- `provider`: `"elevenlabs"`、`"google"`、`"microsoft"`、`"minimax"`、`"openai"` などの speech provider id（フォールバックは自動）。
- `provider` が**未設定**の場合、OpenClaw は registry の自動選択順で最初に設定された speech provider を使用します。
- レガシーの `provider: "edge"` も引き続き動作し、`microsoft` に正規化されます。
- `summaryModel`: 自動要約用の任意の低コストモデル。デフォルトは `agents.defaults.model.primary`。
  - `provider/model` または設定済みモデルエイリアスを受け付けます。
- `modelOverrides`: モデルが TTS directive を出力できるようにします（デフォルトでオン）。
  - `allowProvider` のデフォルトは `false`（provider 切り替えはオプトイン）。
- `providers.<id>`: speech provider id をキーにした provider 所有設定。
- レガシーの直接 provider ブロック（`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`）は、読み込み時に `messages.tts.providers.<id>` へ自動移行されます。
- `maxTextLength`: TTS 入力のハード上限（文字数）。超過した場合、`/tts audio` は失敗します。
- `timeoutMs`: リクエストタイムアウト（ms）。
- `prefsPath`: ローカル prefs JSON パス（provider/limit/summary）の上書き。
- `apiKey` 値は env var にフォールバックします（`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`）。
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URL を上書きします。
- `providers.openai.baseUrl`: OpenAI TTS エンドポイントを上書きします。
  - 解決順序: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - デフォルト以外の値は OpenAI 互換 TTS エンドポイントとして扱われるため、カスタムモデル名と音声名が受け付けられます。
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0`（1.0 = 通常）
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 文字の ISO 639-1（例: `en`, `de`）
- `providers.elevenlabs.seed`: 整数 `0..4294967295`（ベストエフォートの決定性）
- `providers.minimax.baseUrl`: MiniMax API base URL を上書きします（デフォルト `https://api.minimax.io`、env: `MINIMAX_API_HOST`）。
- `providers.minimax.model`: TTS モデル（デフォルト `speech-2.8-hd`、env: `MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`: 音声識別子（デフォルト `English_expressive_narrator`、env: `MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`: 再生速度 `0.5..2.0`（デフォルト 1.0）。
- `providers.minimax.vol`: 音量 `(0, 10]`（デフォルト 1.0。0 より大きい必要があります）。
- `providers.minimax.pitch`: ピッチシフト `-12..12`（デフォルト 0）。
- `providers.google.model`: Gemini TTS モデル（デフォルト `gemini-3.1-flash-tts-preview`）。
- `providers.google.voiceName`: Gemini の組み込み音声名（デフォルト `Kore`。`voice` も受け付けます）。
- `providers.google.baseUrl`: Gemini API base URL を上書きします。`https://generativelanguage.googleapis.com` のみ受け付けられます。
  - `messages.tts.providers.google.apiKey` が省略されている場合、TTS は env へのフォールバック前に `models.providers.google.apiKey` を再利用できます。
- `providers.xai.apiKey`: xAI TTS API キー（env: `XAI_API_KEY`）。
- `providers.xai.baseUrl`: xAI TTS base URL を上書きします（デフォルト `https://api.x.ai/v1`、env: `XAI_BASE_URL`）。
- `providers.xai.voiceId`: xAI voice id（デフォルト `eve`。現在利用可能な音声: `ara`, `eve`, `leo`, `rex`, `sal`, `una`）。
- `providers.xai.language`: BCP-47 言語コードまたは `auto`（デフォルト `en`）。
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw`, または `alaw`（デフォルト `mp3`）。
- `providers.xai.speed`: provider ネイティブの速度上書き。
- `providers.microsoft.enabled`: Microsoft speech の使用を許可します（デフォルト `true`。API キー不要）。
- `providers.microsoft.voice`: Microsoft ニューラル音声名（例: `en-US-MichelleNeural`）。
- `providers.microsoft.lang`: 言語コード（例: `en-US`）。
- `providers.microsoft.outputFormat`: Microsoft 出力形式（例: `audio-24khz-48kbitrate-mono-mp3`）。
  - 有効な値は Microsoft Speech output formats を参照してください。すべての形式が、バンドルされた Edge ベースのトランスポートでサポートされているわけではありません。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: パーセント文字列（例: `+10%`, `-5%`）。
- `providers.microsoft.saveSubtitles`: 音声ファイルと一緒に JSON 字幕を書き込みます。
- `providers.microsoft.proxy`: Microsoft speech リクエスト用プロキシ URL。
- `providers.microsoft.timeoutMs`: リクエストタイムアウト上書き（ms）。
- `edge.*`: 同じ Microsoft 設定用のレガシー別名。

## モデル駆動上書き（デフォルトでオン）

デフォルトでは、モデルは単一の応答に対して TTS directive を出力**できます**。
`messages.tts.auto` が `tagged` の場合、音声をトリガーするにはこれらの directive が必須です。

有効な場合、モデルは単一の応答について音声を上書きするために `[[tts:...]]` directive を出力でき、さらに任意で `[[tts:text]]...[[/tts:text]]` ブロックを使って、
音声にのみ含めるべき表現タグ（笑い声、歌唱キューなど）を提供できます。

`provider=...` directive は、`modelOverrides.allowProvider: true` でない限り無視されます。

応答 payload の例:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

有効時に使える directive キー:

- `provider`（登録済み speech provider id。例: `openai`, `elevenlabs`, `google`, `minimax`, `microsoft`。`allowProvider: true` が必要）
- `voice`（OpenAI 音声）、`voiceName` / `voice_name` / `google_voice`（Google 音声）、または `voiceId`（ElevenLabs / MiniMax / xAI）
- `model`（OpenAI TTS モデル、ElevenLabs model id、または MiniMax モデル）または `google_model`（Google TTS モデル）
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量、0〜10）
- `pitch`（MiniMax ピッチ、-12〜12）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

すべてのモデル上書きを無効にする:

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

任意の allowlist（他のノブを設定可能なまま provider 切り替えを有効にする）:

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

スラッシュコマンドはローカル上書きを `prefsPath` に書き込みます（デフォルト:
`~/.openclaw/settings/tts.json`。`OPENCLAW_TTS_PREFS` または
`messages.tts.prefsPath` で上書き可能）。

保存されるフィールド:

- `enabled`
- `provider`
- `maxLength`（要約しきい値。デフォルト 1500 文字）
- `summarize`（デフォルト `true`）

これらは、そのホストに対して `messages.tts.*` を上書きします。

## 出力形式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**: Opus 音声メッセージ（ElevenLabs の `opus_48000_64`、OpenAI の `opus`）。
  - 48kHz / 64kbps は音声メッセージとして良いトレードオフです。
- **その他のチャネル**: MP3（ElevenLabs の `mp3_44100_128`、OpenAI の `mp3`）。
  - 44.1kHz / 128kbps は音声明瞭性に対するデフォルトのバランスです。
- **MiniMax**: MP3（`speech-2.8-hd` モデル、32kHz サンプルレート）。ボイスノート形式はネイティブではサポートされません。Opus 音声メッセージを確実に使いたい場合は OpenAI または ElevenLabs を使用してください。
- **Google Gemini**: Gemini API TTS は生の 24kHz PCM を返します。OpenClaw はそれを音声添付用には WAV としてラップし、Talk/テレフォニー用には PCM を直接返します。ネイティブの Opus ボイスノート形式はこの経路ではサポートされません。
- **xAI**: デフォルトでは MP3。`responseFormat` は `mp3`, `wav`, `pcm`, `mulaw`, `alaw` を指定できます。OpenClaw は xAI のバッチ REST TTS エンドポイントを使い、完全な音声添付を返します。xAI のストリーミング TTS WebSocket はこの provider 経路では使用されません。ネイティブの Opus ボイスノート形式はこの経路ではサポートされません。
- **Microsoft**: `microsoft.outputFormat` を使います（デフォルト `audio-24khz-48kbitrate-mono-mp3`）。
  - バンドルされたトランスポートは `outputFormat` を受け付けますが、すべての形式がサービスから利用できるわけではありません。
  - 出力形式の値は Microsoft Speech output formats に従います（Ogg/WebM Opus を含む）。
  - Telegram の `sendVoice` は OGG/MP3/M4A を受け付けます。Opus 音声メッセージを確実に使いたい場合は OpenAI/ElevenLabs を使用してください。
  - 設定された Microsoft 出力形式が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI/ElevenLabs の出力形式はチャネルごとに固定です（上記参照）。

## 自動 TTS の動作

有効な場合、OpenClaw は次のように動作します。

- 応答にすでにメディアまたは `MEDIA:` directive が含まれている場合は TTS をスキップします。
- 非常に短い応答（10文字未満）はスキップします。
- 長い応答は、有効な場合 `agents.defaults.model.primary`（または `summaryModel`）を使って要約します。
- 生成された音声を応答に添付します。

応答が `maxLength` を超えていて、要約がオフ（または要約モデル用の API キーがない）場合、
音声はスキップされ、通常のテキスト応答が送信されます。

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

## スラッシュコマンドの使い方

コマンドは `/tts` の1つだけです。
有効化の詳細については、[Slash commands](/ja-JP/tools/slash-commands) を参照してください。

Discord に関する注意: `/tts` は Discord 組み込みコマンドなので、OpenClaw は
そこでネイティブコマンドとして `/voice` を登録します。テキストの `/tts ...` は引き続き動作します。

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
- 設定 `messages.tts.auto` は `off|always|inbound|tagged` を受け付けます。
- `/tts on` はローカル TTS 設定を `always` に書き込み、`/tts off` は `off` に書き込みます。
- `inbound` または `tagged` をデフォルトにしたい場合は設定を使ってください。
- `limit` と `summary` はメイン設定ではなくローカル prefs に保存されます。
- `/tts audio` は1回限りの音声応答を生成します（TTS をオンには切り替えません）。
- `/tts status` には、最新の試行に対するフォールバック可視性が含まれます:
  - 成功したフォールバック: `Fallback: <primary> -> <used>` に加えて `Attempts: ...`
  - 失敗: `Error: ...` に加えて `Attempts: ...`
  - 詳細診断: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI および ElevenLabs API の失敗には、パースされた provider エラー詳細とリクエスト ID（provider が返した場合）が含まれるようになっており、TTS エラー/ログに表示されます。

## エージェントツール

`tts` ツールはテキストを音声に変換し、
応答配信用の音声添付を返します。チャネルが Feishu、Matrix、Telegram、または WhatsApp の場合、
音声はファイル添付ではなく音声メッセージとして配信されます。

## Gateway RPC

Gateway メソッド:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
