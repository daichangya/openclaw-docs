---
read_when:
    - 返信用にテキスト読み上げを有効にするとき
    - TTSプロバイダーや制限を設定するとき
    - '`/tts` コマンドを使うとき'
summary: 送信返信向けのテキスト読み上げ（TTS）
title: Text-to-Speech（レガシーパス）
x-i18n:
    generated_at: "2026-04-05T13:01:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca61773996299a582ab88e5a5db12d8f22ce8a28292ce97cc5dd5fdc2d3b83
    source_path: tts.md
    workflow: 15
---

# テキスト読み上げ（TTS）

OpenClaw は、ElevenLabs、Microsoft、MiniMax、または OpenAI を使用して、送信する返信を音声に変換できます。
これは、OpenClaw が音声を送信できる場所ならどこでも動作します。

## 対応サービス

- **ElevenLabs**（プライマリまたはフォールバックプロバイダー）
- **Microsoft**（プライマリまたはフォールバックプロバイダー。現在の同梱実装は `node-edge-tts` を使用）
- **MiniMax**（プライマリまたはフォールバックプロバイダー。T2A v2 API を使用）
- **OpenAI**（プライマリまたはフォールバックプロバイダー。要約にも使用）

### Microsoft speech に関する注意

同梱の Microsoft speech プロバイダーは現在、`node-edge-tts` ライブラリ経由で Microsoft Edge のオンライン
ニューラルTTSサービスを使用しています。これはホスト型サービスであり（ローカルではありません）、
Microsoft のエンドポイントを使用し、APIキーは不要です。
`node-edge-tts` は speech 設定オプションと出力形式を公開していますが、
すべてのオプションがサービスでサポートされるわけではありません。レガシー設定および directive 入力で
`edge` を使う場合も引き続き動作し、`microsoft` に正規化されます。

この経路は公開ウェブサービスであり、公開されたSLAやクォータがないため、
ベストエフォートとして扱ってください。保証された制限やサポートが必要な場合は、OpenAI
または ElevenLabs を使用してください。

## 任意のキー

OpenAI、ElevenLabs、または MiniMax を使いたい場合:

- `ELEVENLABS_API_KEY`（または `XI_API_KEY`）
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft speech には APIキーは **不要** です。

複数のプロバイダーが設定されている場合、選択されたプロバイダーが最初に使われ、他はフォールバックになります。
自動要約では、設定された `summaryModel`（または `agents.defaults.model.primary`）が使われるため、
要約を有効にする場合はそのプロバイダーも認証されている必要があります。

## サービスリンク

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## デフォルトで有効ですか？

いいえ。自動TTSはデフォルトで **オフ** です。設定の
`messages.tts.auto`、またはセッションごとに `/tts always`（別名: `/tts on`）で有効にしてください。

`messages.tts.provider` が未設定の場合、OpenClaw はレジストリの自動選択順で最初に設定済みの
speech プロバイダーを選びます。

## 設定

TTS 設定は `openclaw.json` の `messages.tts` の下にあります。
完全なスキーマは [Gateway configuration](/ja-JP/gateway/configuration) にあります。

### 最小設定（有効化 + プロバイダー）

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

### OpenAI をプライマリ、ElevenLabs をフォールバックにする

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

### Microsoft をプライマリにする（APIキー不要）

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

### MiniMax をプライマリにする

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

### 長い返信で自動要約を無効にする

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

- `auto`: 自動TTSモード（`off`、`always`、`inbound`、`tagged`）。
  - `inbound` は受信した音声メッセージの後にのみ音声を送信します。
  - `tagged` は返信に `[[tts]]` タグが含まれる場合にのみ音声を送信します。
- `enabled`: レガシートグル（doctor がこれを `auto` に移行します）。
- `mode`: `"final"`（デフォルト）または `"all"`（ツール/ブロック返信も含む）。
- `provider`: `"elevenlabs"`、`"microsoft"`、`"minimax"`、`"openai"` などの speech プロバイダーID（フォールバックは自動）。
- `provider` が **未設定** の場合、OpenClaw はレジストリ自動選択順で最初に設定済みの speech プロバイダーを使います。
- レガシーの `provider: "edge"` も引き続き動作し、`microsoft` に正規化されます。
- `summaryModel`: 自動要約用の任意の軽量モデル。デフォルトは `agents.defaults.model.primary`。
  - `provider/model` または設定済みモデルエイリアスを受け付けます。
- `modelOverrides`: モデルがTTS directive を出力できるようにします（デフォルトでオン）。
  - `allowProvider` のデフォルトは `false` です（プロバイダー切り替えはオプトイン）。
- `providers.<id>`: speech プロバイダーIDをキーとする、プロバイダー所有の設定。
- レガシーの直接プロバイダーブロック（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）は、読み込み時に自動で `messages.tts.providers.<id>` に移行されます。
- `maxTextLength`: TTS入力のハード上限（文字数）。超えた場合 `/tts audio` は失敗します。
- `timeoutMs`: リクエストタイムアウト（ms）。
- `prefsPath`: ローカル prefs JSON パスを上書きします（プロバイダー/制限/要約）。
- `apiKey` 値は環境変数にフォールバックします（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`）。
- `providers.elevenlabs.baseUrl`: ElevenLabs API ベースURLを上書きします。
- `providers.openai.baseUrl`: OpenAI TTS エンドポイントを上書きします。
  - 解決順序: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - デフォルト以外の値は OpenAI 互換のTTSエンドポイントとして扱われるため、カスタムモデル名や音声名も受け付けます。
- `providers.elevenlabs.voiceSettings`:
  - `stability`、`similarityBoost`、`style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0`（1.0 = 通常）
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2文字の ISO 639-1（例: `en`、`de`）
- `providers.elevenlabs.seed`: 整数 `0..4294967295`（ベストエフォートの決定論性）
- `providers.minimax.baseUrl`: MiniMax API ベースURLを上書きします（デフォルト `https://api.minimax.io`、環境変数: `MINIMAX_API_HOST`）。
- `providers.minimax.model`: TTSモデル（デフォルト `speech-2.8-hd`、環境変数: `MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`: 音声識別子（デフォルト `English_expressive_narrator`、環境変数: `MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`: 再生速度 `0.5..2.0`（デフォルト 1.0）。
- `providers.minimax.vol`: 音量 `(0, 10]`（デフォルト 1.0。0より大きい必要があります）。
- `providers.minimax.pitch`: ピッチシフト `-12..12`（デフォルト 0）。
- `providers.microsoft.enabled`: Microsoft speech の利用を許可します（デフォルト `true`。APIキー不要）。
- `providers.microsoft.voice`: Microsoft neural voice 名（例: `en-US-MichelleNeural`）。
- `providers.microsoft.lang`: 言語コード（例: `en-US`）。
- `providers.microsoft.outputFormat`: Microsoft 出力形式（例: `audio-24khz-48kbitrate-mono-mp3`）。
  - 有効な値は Microsoft Speech output formats を参照してください。同梱の Edge ベース転送では、すべての形式がサポートされるわけではありません。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: パーセント文字列（例: `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`: 音声ファイルと一緒にJSON字幕を書き込みます。
- `providers.microsoft.proxy`: Microsoft speech リクエスト用のプロキシURL。
- `providers.microsoft.timeoutMs`: リクエストタイムアウト上書き（ms）。
- `edge.*`: 同じ Microsoft 設定のレガシー別名。

## モデル駆動の上書き（デフォルトでオン）

デフォルトでは、モデルは単一の返信に対して TTS directive を出力 **できます**。
`messages.tts.auto` が `tagged` の場合、音声をトリガーするにはこれらの directive が必要です。

有効な場合、モデルは単一返信用に音声を上書きする `[[tts:...]]` directive を出力でき、
さらに、音声にのみ含めるべき表現タグ（笑い、歌う合図など）を提供するための
任意の `[[tts:text]]...[[/tts:text]]` ブロックも使えます。

`provider=...` directive は、`modelOverrides.allowProvider: true` でない限り無視されます。

返信ペイロード例:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

利用可能な directive キー（有効な場合）:

- `provider`（登録済み speech プロバイダーID。たとえば `openai`、`elevenlabs`、`minimax`、`microsoft`。`allowProvider: true` が必要）
- `voice`（OpenAI voice）または `voiceId`（ElevenLabs / MiniMax）
- `model`（OpenAI TTS モデル、ElevenLabs model id、または MiniMax モデル）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量、0-10）
- `pitch`（MiniMax ピッチ、-12 から 12）
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

任意のallowlist（他のノブを設定可能なまま、プロバイダー切り替えを有効化）:

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

スラッシュコマンドはローカル上書きを `prefsPath`（デフォルト:
`~/.openclaw/settings/tts.json`、`OPENCLAW_TTS_PREFS` または
`messages.tts.prefsPath` で上書き可能）へ書き込みます。

保存されるフィールド:

- `enabled`
- `provider`
- `maxLength`（要約しきい値。デフォルト 1500文字）
- `summarize`（デフォルト `true`）

これらは、そのホスト上では `messages.tts.*` を上書きします。

## 出力形式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**: Opus 音声メッセージ（ElevenLabs では `opus_48000_64`、OpenAI では `opus`）。
  - 48kHz / 64kbps は音声メッセージとして良いバランスです。
- **その他のチャネル**: MP3（ElevenLabs では `mp3_44100_128`、OpenAI では `mp3`）。
  - 44.1kHz / 128kbps は発話の明瞭さに対するデフォルトのバランスです。
- **MiniMax**: MP3（`speech-2.8-hd` モデル、32kHz サンプルレート）。voice note 形式はネイティブ対応していません。確実に Opus 音声メッセージが必要なら OpenAI または ElevenLabs を使ってください。
- **Microsoft**: `microsoft.outputFormat` を使用します（デフォルト `audio-24khz-48kbitrate-mono-mp3`）。
  - 同梱の転送は `outputFormat` を受け付けますが、すべての形式がサービスで利用可能なわけではありません。
  - 出力形式の値は Microsoft Speech output formats に従います（Ogg/WebM Opus を含む）。
  - Telegram の `sendVoice` は OGG/MP3/M4A を受け付けます。確実に Opus 音声メッセージが必要なら OpenAI/ElevenLabs を使用してください。
  - 設定した Microsoft 出力形式が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI/ElevenLabs の出力形式はチャネルごとに固定です（上記参照）。

## 自動TTSの挙動

有効な場合、OpenClaw は次のように動作します。

- 返信にすでにメディアまたは `MEDIA:` directive が含まれている場合は TTS をスキップする。
- 非常に短い返信（10文字未満）をスキップする。
- 有効な場合、長い返信を `agents.defaults.model.primary`（または `summaryModel`）を使って要約する。
- 生成した音声を返信に添付する。

返信が `maxLength` を超えていて、要約がオフ（または
要約モデル用のAPIキーがない）場合、
音声はスキップされ、通常のテキスト返信が送信されます。

## フローダイアグラム

```
Reply -> TTS enabled?
  no  -> テキストを送信
  yes -> media / MEDIA: / short がある?
          yes -> テキストを送信
          no  -> 長さ > 上限?
                   no  -> TTS -> 音声を添付
                   yes -> 要約は有効?
                            no  -> テキストを送信
                            yes -> 要約する（summaryModel または agents.defaults.model.primary）
                                      -> TTS -> 音声を添付
```

## スラッシュコマンドの使い方

コマンドは1つだけです: `/tts`。
有効化の詳細は [Slash commands](/tools/slash-commands) を参照してください。

Discord に関する注意: `/tts` は Discord の組み込みコマンドなので、OpenClaw は
ネイティブコマンドとして `/voice` を登録します。テキストの `/tts ...` も引き続き動作します。

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

注意:

- コマンドには認可された送信者が必要です（allowlist/owner ルールは引き続き適用されます）。
- `commands.text` またはネイティブコマンド登録が有効である必要があります。
- `off|always|inbound|tagged` はセッションごとの切り替えです（`/tts on` は `/tts always` の別名です）。
- `limit` と `summary` はメイン設定ではなく、ローカル prefs に保存されます。
- `/tts audio` は1回限りの音声返信を生成します（TTS をオンにはしません）。
- `/tts status` には最新の試行に対するフォールバック可視性が含まれます:
  - フォールバック成功: `Fallback: <primary> -> <used>` と `Attempts: ...`
  - 失敗: `Error: ...` と `Attempts: ...`
  - 詳細診断: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI および ElevenLabs API 失敗には、解析済みのプロバイダーエラー詳細とリクエストID（プロバイダーが返す場合）が含まれるようになっており、TTS エラー/ログに表示されます。

## エージェントツール

`tts` ツールはテキストを音声へ変換し、返信配信用の音声添付を返します。チャネルが Feishu、Matrix、Telegram、または WhatsApp の場合、
その音声はファイル添付ではなく音声メッセージとして配信されます。

## Gateway RPC

Gateway メソッド:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
