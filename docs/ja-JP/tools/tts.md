---
read_when:
    - 返信にtext-to-speechを有効にする
    - TTSプロバイダーまたは制限を設定する
    - '`/tts`コマンドを使う'
summary: 送信返信向けのText-to-speech (TTS)
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-05T13:01:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8487c8acef7585bd4eb5e3b39e2a063ebc6b5f0103524abdcbadd3a7781ffc46
    source_path: tools/tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClawは、ElevenLabs、Microsoft、MiniMax、またはOpenAIを使って送信返信を音声に変換できます。
これは、OpenClawが音声を送信できる場所ならどこでも動作します。

## サポートされているサービス

- **ElevenLabs**（プライマリまたはフォールバックプロバイダー）
- **Microsoft**（プライマリまたはフォールバックプロバイダー。現在のバンドル実装は`node-edge-tts`を使用）
- **MiniMax**（プライマリまたはフォールバックプロバイダー。T2A v2 APIを使用）
- **OpenAI**（プライマリまたはフォールバックプロバイダー。要約にも使用）

### Microsoft音声に関する注意

バンドル済みのMicrosoft speech providerは現在、Microsoft Edgeのオンライン
neural TTSサービスを`node-edge-tts`ライブラリ経由で使用しています。これはホスト型サービスであり（
localではありません）、Microsoftのエンドポイントを使用し、APIキーは不要です。
`node-edge-tts`は音声設定オプションと出力形式を公開していますが、
すべてのオプションがサービスでサポートされるわけではありません。`edge`を使うレガシー設定とdirective入力も
引き続き動作し、`microsoft`に正規化されます。

この経路は公開Webサービスであり、公開されたSLAやクォータがないため、
ベストエフォートとして扱ってください。保証された制限とサポートが必要な場合は、OpenAI
またはElevenLabsを使ってください。

## 任意のキー

OpenAI、ElevenLabs、またはMiniMaxを使いたい場合:

- `ELEVENLABS_API_KEY`（または`XI_API_KEY`）
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft音声には**APIキーは不要**です。

複数のプロバイダーが設定されている場合、選択されたプロバイダーが最初に使用され、他はフォールバックオプションになります。
自動要約は設定された`summaryModel`（または`agents.defaults.model.primary`）を使用するため、
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

いいえ。自動TTSはデフォルトで**オフ**です。
設定では`messages.tts.auto`で、またはセッションごとに`/tts always`（エイリアス: `/tts on`）で有効にしてください。

`messages.tts.provider`が未設定の場合、OpenClawは
レジストリの自動選択順で最初に設定されたspeech providerを選びます。

## 設定

TTS設定は`openclaw.json`の`messages.tts`配下にあります。
完全なschemaは[Gateway configuration](/ja-JP/gateway/configuration)にあります。

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

### OpenAIをプライマリ、ElevenLabsをフォールバックにする場合

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

### Microsoftをプライマリにする場合（APIキー不要）

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

### MiniMaxをプライマリにする場合

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

### Microsoft音声を無効にする

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

### カスタム制限 + prefsパス

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

### 受信音声メッセージの後だけ音声で返信する

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

その後、以下を実行します:

```
/tts summary off
```

### フィールドに関する注意

- `auto`: 自動TTSモード（`off`、`always`、`inbound`、`tagged`）。
  - `inbound`は、受信音声メッセージの後にだけ音声を送信します。
  - `tagged`は、返信に`[[tts]]`タグが含まれる場合にだけ音声を送信します。
- `enabled`: レガシートグル（doctorがこれを`auto`へ移行します）。
- `mode`: `"final"`（デフォルト）または`"all"`（ツール / block返信を含む）。
- `provider`: `"elevenlabs"`、`"microsoft"`、`"minimax"`、`"openai"`のようなspeech provider id（フォールバックは自動）。
- `provider`が**未設定**の場合、OpenClawはレジストリの自動選択順で最初に設定されたspeech providerを使います。
- レガシーの`provider: "edge"`も引き続き動作し、`microsoft`に正規化されます。
- `summaryModel`: 自動要約用の任意の低コストモデル。デフォルトは`agents.defaults.model.primary`です。
  - `provider/model`または設定済みmodel aliasを受け付けます。
- `modelOverrides`: モデルがTTS directiveを出力できるようにします（デフォルトでオン）。
  - `allowProvider`のデフォルトは`false`です（プロバイダー切り替えはオプトイン）。
- `providers.<id>`: speech provider idをキーにしたプロバイダー所有設定。
- レガシーの直接プロバイダーブロック（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）は、読み込み時に`messages.tts.providers.<id>`へ自動移行されます。
- `maxTextLength`: TTS入力のハード上限（文字数）。超過すると`/tts audio`は失敗します。
- `timeoutMs`: リクエストタイムアウト（ms）。
- `prefsPath`: local prefs JSONパスを上書きします（provider / limit / summary）。
- `apiKey`値はenv var（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`）へフォールバックします。
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URLを上書きします。
- `providers.openai.baseUrl`: OpenAI TTS endpointを上書きします。
  - 解決順序: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - デフォルト以外の値はOpenAI互換TTS endpointとして扱われるため、カスタムのmodel名とvoice名を受け付けます。
- `providers.elevenlabs.voiceSettings`:
  - `stability`、`similarityBoost`、`style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0`（1.0 = 通常）
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2文字のISO 639-1（例: `en`、`de`）
- `providers.elevenlabs.seed`: 整数`0..4294967295`（ベストエフォートな決定性）
- `providers.minimax.baseUrl`: MiniMax API base URLを上書きします（デフォルト`https://api.minimax.io`、env: `MINIMAX_API_HOST`）。
- `providers.minimax.model`: TTSモデル（デフォルト`speech-2.8-hd`、env: `MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`: voice識別子（デフォルト`English_expressive_narrator`、env: `MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`: 再生速度`0.5..2.0`（デフォルト1.0）。
- `providers.minimax.vol`: 音量`(0, 10]`（デフォルト1.0。0より大きい必要があります）。
- `providers.minimax.pitch`: ピッチシフト`-12..12`（デフォルト0）。
- `providers.microsoft.enabled`: Microsoft音声の使用を許可します（デフォルト`true`。APIキー不要）。
- `providers.microsoft.voice`: Microsoft neural voice名（例: `en-US-MichelleNeural`）。
- `providers.microsoft.lang`: 言語コード（例: `en-US`）。
- `providers.microsoft.outputFormat`: Microsoft出力形式（例: `audio-24khz-48kbitrate-mono-mp3`）。
  - 有効な値はMicrosoft Speech output formatsを参照してください。すべての形式がバンドル済みのEdgeバックエンドtransportでサポートされるわけではありません。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: パーセント文字列（例: `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`: 音声ファイルと一緒にJSON字幕を書き込みます。
- `providers.microsoft.proxy`: Microsoft音声リクエスト用のproxy URL。
- `providers.microsoft.timeoutMs`: リクエストタイムアウト上書き（ms）。
- `edge.*`: 同じMicrosoft設定用のレガシーエイリアス。

## モデル駆動オーバーライド（デフォルトでオン）

デフォルトでは、モデルは単一返信に対してTTS directiveを出力**できます**。
`messages.tts.auto`が`tagged`の場合、音声をトリガーするにはこれらのdirectiveが必要です。

有効な場合、モデルは単一返信のvoiceを上書きするために`[[tts:...]]` directiveを出力でき、
さらに任意で`[[tts:text]]...[[/tts:text]]`ブロックを出力できます。これは
笑い声、歌うキューなど、音声にだけ含めるべき表現タグを
提供するためのものです。

`provider=...` directiveは、`modelOverrides.allowProvider: true`でない限り無視されます。

返信payloadの例:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

使用可能なdirectiveキー（有効時）:

- `provider`（登録済みspeech provider id。例: `openai`、`elevenlabs`、`minimax`、`microsoft`。`allowProvider: true`が必要）
- `voice`（OpenAI voice）または`voiceId`（ElevenLabs / MiniMax）
- `model`（OpenAI TTS model、ElevenLabs model id、またはMiniMax model）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax volume、0-10）
- `pitch`（MiniMax pitch、-12から12）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

すべてのモデルオーバーライドを無効にする:

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

任意のallowlist（他の調整項目は設定可能なまま、プロバイダー切り替えを有効にする）:

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

スラッシュコマンドはlocal overrideを`prefsPath`へ書き込みます（デフォルト:
`~/.openclaw/settings/tts.json`。`OPENCLAW_TTS_PREFS`または
`messages.tts.prefsPath`で上書き可能）。

保存されるフィールド:

- `enabled`
- `provider`
- `maxLength`（要約しきい値。デフォルト1500文字）
- `summarize`（デフォルト`true`）

これらは、そのホストに対して`messages.tts.*`を上書きします。

## 出力形式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**: Opus音声メッセージ（ElevenLabsでは`opus_48000_64`、OpenAIでは`opus`）。
  - 48kHz / 64kbpsは音声メッセージとして良いトレードオフです。
- **その他のチャネル**: MP3（ElevenLabsでは`mp3_44100_128`、OpenAIでは`mp3`）。
  - 44.1kHz / 128kbpsは、音声明瞭度のためのデフォルトのバランスです。
- **MiniMax**: MP3（`speech-2.8-hd`モデル、32kHzサンプルレート）。voice-note形式はネイティブにはサポートされません。Opus音声メッセージを確実に使いたい場合はOpenAIまたはElevenLabsを使ってください。
- **Microsoft**: `microsoft.outputFormat`を使用します（デフォルト`audio-24khz-48kbitrate-mono-mp3`）。
  - バンドル済みtransportは`outputFormat`を受け付けますが、すべての形式がサービスで利用可能なわけではありません。
  - 出力形式の値はMicrosoft Speech output formatsに従います（Ogg/WebM Opusを含む）。
  - Telegramの`sendVoice`はOGG / MP3 / M4Aを受け付けます。Opus音声メッセージを確実に使いたい場合はOpenAI / ElevenLabsを使ってください。
  - 設定されたMicrosoft出力形式が失敗した場合、OpenClawはMP3で再試行します。

OpenAI / ElevenLabsの出力形式はチャネルごとに固定です（上記参照）。

## 自動TTSの挙動

有効な場合、OpenClawは次のように動作します。

- 返信にすでにメディアまたは`MEDIA:` directiveが含まれている場合、TTSをスキップします。
- 非常に短い返信（10文字未満）はスキップします。
- 有効な場合、長い返信は`agents.defaults.model.primary`（または`summaryModel`）を使って要約します。
- 生成した音声を返信に添付します。

返信が`maxLength`を超えていて、要約がオフである場合（または
summary model用APIキーがない場合）は、音声は
スキップされ、通常のテキスト返信が送信されます。

## フロー図

```
Reply -> TTS enabled?
  no  -> テキストを送信
  yes -> メディア / MEDIA: / 短文か？
          yes -> テキストを送信
          no  -> 長さ > 制限？
                   no  -> TTS -> 音声を添付
                   yes -> 要約は有効か？
                            no  -> テキストを送信
                            yes -> 要約する（summaryModel または agents.defaults.model.primary）
                                      -> TTS -> 音声を添付
```

## スラッシュコマンドの使い方

コマンドは1つだけです: `/tts`。
有効化の詳細は[Slash commands](/tools/slash-commands)を参照してください。

Discordに関する注意: `/tts`はDiscordの組み込みコマンドであるため、OpenClawは
そこではネイティブコマンドとして`/voice`を登録します。テキストの`/tts ...`は引き続き動作します。

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

- コマンドには認可されたsenderが必要です（allowlist / ownerルールは引き続き適用されます）。
- `commands.text`またはネイティブコマンド登録が有効である必要があります。
- `off|always|inbound|tagged`はセッションごとのトグルです（`/tts on`は`/tts always`のエイリアス）。
- `limit`と`summary`はメイン設定ではなく、local prefsに保存されます。
- `/tts audio`は単発の音声返信を生成します（TTSをオンには切り替えません）。
- `/tts status`には、直近の試行に対するフォールバック可視性が含まれます:
  - 成功フォールバック: `Fallback: <primary> -> <used>` と `Attempts: ...`
  - 失敗: `Error: ...` と `Attempts: ...`
  - 詳細診断: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAIおよびElevenLabsのAPI失敗には、解析済みプロバイダーエラー詳細とリクエストid（プロバイダーが返した場合）が含まれるようになっており、TTSエラー / ログで表示されます。

## エージェントツール

`tts`ツールはテキストを音声へ変換し、
返信配信用の音声添付を返します。チャネルがFeishu、Matrix、Telegram、またはWhatsAppの場合、
音声はファイル添付ではなくボイスメッセージとして配信されます。

## Gateway RPC

Gatewayメソッド:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
