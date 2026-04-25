---
read_when:
    - OpenClaw から外向きの音声通話を発信したいです
    - voice-call Plugin を設定または開発しています
summary: 'Voice Call Plugin: Twilio/Telnyx/Plivo 経由の発信 + 着信通話（Plugin のインストール + config + CLI）'
title: 音声通話 Plugin
x-i18n:
    generated_at: "2026-04-25T13:56:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

OpenClaw 向けの Plugin による音声通話です。受信ポリシー付きの発信通知とマルチターン会話をサポートします。

現在の provider:

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（開発用/ネットワークなし）

すばやいイメージ:

- Plugin をインストールする
- Gateway を再起動する
- `plugins.entries.voice-call.config` の下で設定する
- `openclaw voicecall ...` または `voice_call` ツールを使う

## 実行場所（ローカル vs リモート）

Voice Call Plugin は **Gateway プロセス内** で実行されます。

リモート Gateway を使う場合は、**Gateway を実行しているマシン** に Plugin をインストール/設定し、その後 Gateway を再起動して読み込ませてください。

## インストール

### オプション A: npm からインストール（推奨）

```bash
openclaw plugins install @openclaw/voice-call
```

その後に Gateway を再起動してください。

### オプション B: ローカルフォルダーからインストール（開発用、コピーなし）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後に Gateway を再起動してください。

## config

`plugins.entries.voice-call.config` の下に config を設定します。

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

実際の provider でテストする前にセットアップを確認してください。

```bash
openclaw voicecall setup
```

デフォルト出力はチャットログやターミナルセッションで読みやすい形式です。Plugin が有効か、provider と認証情報があるか、Webhook の公開が設定されているか、音声モードが 1 つだけ有効かを確認します。スクリプトでは `openclaw voicecall setup --json` を使ってください。

Twilio、Telnyx、Plivo では、setup はパブリックな Webhook URL に解決される必要があります。設定された `publicUrl`、トンネル URL、Tailscale URL、または serve フォールバックが loopback やプライベートネットワーク空間に解決される場合、実際のキャリア Webhook を受け取れない provider を起動する代わりに setup は失敗します。

予想外のないスモークテストを行うには、次を実行します。

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

2 つ目のコマンドもまだドライランです。短い発信通知通話を行うには `--yes` を追加してください。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

注意:

- Twilio/Telnyx には**パブリックに到達可能な** Webhook URL が必要です。
- Plivo には**パブリックに到達可能な** Webhook URL が必要です。
- `mock` はローカル開発用 provider です（ネットワーク呼び出しなし）。
- 旧 config がまだ `provider: "log"`、`twilio.from`、またはレガシーな `streaming.*` OpenAI キーを使っている場合は、`openclaw doctor --fix` を実行して書き換えてください。
- `skipSignatureVerification` が true でない限り、Telnyx には `telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
- `skipSignatureVerification` はローカルテスト専用です。
- ngrok の無料 tier を使う場合は、`publicUrl` を正確な ngrok URL に設定してください。署名検証は常に強制されます。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が loopback（ngrok ローカルエージェント）の場合にのみ、無効な署名の Twilio Webhook を許可します。ローカル開発専用で使ってください。
- ngrok の無料 tier URL は変更されたりインタースティシャル動作が追加されたりすることがあるため、`publicUrl` がずれると Twilio の署名は失敗します。本番環境では、安定したドメインまたは Tailscale funnel を推奨します。
- `realtime.enabled` は完全な音声対音声会話を開始します。`streaming.enabled` と同時に有効にしないでください。
- Streaming のセキュリティデフォルト:
  - `streaming.preStartTimeoutMs` は、有効な `start` フレームを一度も送らないソケットを閉じます。
- `streaming.maxPendingConnections` は、認証前の pre-start ソケット総数を上限設定します。
- `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの認証前 pre-start ソケット数を上限設定します。
- `streaming.maxConnections` は、開いているメディアストリームソケット総数（pending + active）を上限設定します。
- ランタイムフォールバックは今のところこれらの古い voice-call キーも引き続き受け付けますが、書き換えパスは `openclaw doctor --fix` であり、この互換 shim は一時的なものです。

## リアルタイム音声会話

`realtime` はライブ通話音声用の全二重リアルタイム音声 provider を選択します。
これは、音声をリアルタイム文字起こし provider に転送するだけの `streaming` とは別です。

現在のランタイム動作:

- `realtime.enabled` は Twilio Media Streams でサポートされています。
- `realtime.enabled` は `streaming.enabled` と併用できません。
- `realtime.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム音声 provider を使用します。
- バンドル済みのリアルタイム音声 provider には、provider Plugin によって登録される Google Gemini Live（`google`）と OpenAI（`openai`）が含まれます。
- provider 所有の生 config は `realtime.providers.<providerId>` の下にあります。
- Voice Call は共有の `openclaw_agent_consult` リアルタイムツールをデフォルトで公開します。発信者がより深い推論、最新情報、または通常の OpenClaw ツールを求めたとき、リアルタイムモデルはこれを呼び出せます。
- `realtime.toolPolicy` は consult 実行を制御します:
  - `safe-read-only`: consult ツールを公開し、通常エージェントを `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get` に制限します。
  - `owner`: consult ツールを公開し、通常エージェントに通常のエージェントツールポリシーを使わせます。
  - `none`: consult ツールを公開しません。カスタム `realtime.tools` は引き続きリアルタイム provider に渡されます。
- consult セッションキーは、利用可能な場合は既存の音声セッションを再利用し、その後発信元/着信先の電話番号にフォールバックするため、後続の consult 呼び出しでも通話中のコンテキストを維持します。
- `realtime.provider` が未登録の provider を指している場合、またはリアルタイム音声 provider がまったく登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログし、リアルタイムメディアをスキップします。

Google Gemini Live のリアルタイムデフォルト:

- API キー: `realtime.providers.google.apiKey`、`GEMINI_API_KEY`、または `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

例:

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

代わりに OpenAI を使う場合:

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

provider 固有のリアルタイム音声オプションについては、[Google provider](/ja-JP/providers/google) と [OpenAI provider](/ja-JP/providers/openai) を参照してください。

## Streaming 文字起こし

`streaming` はライブ通話音声用のリアルタイム文字起こし provider を選択します。

現在のランタイム動作:

- `streaming.provider` は任意です。未設定の場合、Voice Call は最初に登録されたリアルタイム文字起こし provider を使用します。
- バンドル済みのリアルタイム文字起こし provider には、provider Plugin によって登録される Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）、xAI（`xai`）が含まれます。
- provider 所有の生 config は `streaming.providers.<providerId>` の下にあります。
- `streaming.provider` が未登録の provider を指している場合、またはリアルタイム文字起こし provider がまったく登録されていない場合、Voice Call は Plugin 全体を失敗させる代わりに警告をログし、メディア streaming をスキップします。

OpenAI の streaming 文字起こしデフォルト:

- API キー: `streaming.providers.openai.apiKey` または `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI の streaming 文字起こしデフォルト:

- API キー: `streaming.providers.xai.apiKey` または `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

例:

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

代わりに xAI を使う場合:

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

レガシーキーは引き続き `openclaw doctor --fix` によって自動移行されます。

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 古い通話の回収

端末 Webhook を受信しないままの通話（たとえば、完了しない notify モードの通話）を終了するには `staleCallReaperSeconds` を使用します。デフォルトは `0`（無効）です。

推奨範囲:

- **本番環境:** notify スタイルのフローでは `120`〜`300` 秒。
- 通常の通話が完了できるよう、この値は **`maxDurationSeconds` より大きく** 保ってください。よい開始値は `maxDurationSeconds + 30〜60` 秒です。

例:

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

## Webhook セキュリティ

プロキシまたはトンネルが Gateway の前段にある場合、Plugin は署名検証のためにパブリック URL を再構築します。これらのオプションは、どの転送ヘッダーを信頼するかを制御します。

`webhookSecurity.allowedHosts` は、転送ヘッダー内のホストを許可リスト化します。

`webhookSecurity.trustForwardingHeaders` は、許可リストなしで転送ヘッダーを信頼します。

`webhookSecurity.trustedProxyIPs` は、リクエストのリモート IP がリストと一致する場合にのみ転送ヘッダーを信頼します。

Webhook のリプレイ保護は Twilio と Plivo で有効です。リプレイされた有効な Webhook リクエストは受理されますが、副作用はスキップされます。

Twilio の会話ターンには `<Gather>` コールバック内にターンごとのトークンが含まれるため、古い/リプレイされた音声コールバックが、より新しい保留中の文字起こしターンを満たすことはできません。

認証されていない Webhook リクエストは、provider が必須とする署名ヘッダーが欠けている場合、本文読み取り前に拒否されます。

voice-call Webhook は、共有の pre-auth ボディプロファイル（64 KB / 5 秒）に加えて、署名検証前の IP ごとの in-flight 上限を使用します。

安定したパブリックホストを使う例:

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

## 通話用 TTS

Voice Call は、通話でのストリーミング音声にコアの `messages.tts` 設定を使用します。Plugin config の下で**同じ形状**で上書きでき、`messages.tts` とディープマージされます。

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

注意:

- Plugin config 内のレガシーな `tts.<provider>` キー（`openai`、`elevenlabs`、`microsoft`、`edge`）は `openclaw doctor --fix` によって修復されます。コミットされる config では `tts.providers.<provider>` を使用してください。
- **音声通話では Microsoft speech は無視されます**（電話音声には PCM が必要ですが、現在の Microsoft トランスポートは電話用 PCM 出力を公開していません）。
- Twilio メディアストリーミングが有効な場合はコア TTS が使用されます。それ以外の場合、通話は provider ネイティブ音声にフォールバックします。
- Twilio メディアストリームがすでにアクティブな場合、Voice Call は TwiML `<Say>` にフォールバックしません。その状態で電話用 TTS が利用できない場合、2 つの再生経路を混在させる代わりに再生リクエストは失敗します。
- 電話用 TTS がセカンダリ provider にフォールバックした場合、Voice Call はデバッグ用に provider チェーン（`from`、`to`、`attempts`）付きの警告をログします。
- Twilio の割り込み発話やストリーム終了によって保留中の TTS キューがクリアされると、キュー済みの再生リクエストは、再生完了を待っている発信者をハングさせる代わりに解決されます。

### さらに例

コア TTS のみを使う（上書きなし）:

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

通話に対してのみ ElevenLabs に上書きする（それ以外ではコアのデフォルトを維持）:

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

通話用に OpenAI model だけを上書きする（ディープマージの例）:

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

## 着信通話

着信ポリシーのデフォルトは `disabled` です。着信通話を有効にするには、次を設定します。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` は低保証の発信者番号スクリーニングです。Plugin は provider から渡された `From` 値を正規化し、`allowFrom` と比較します。Webhook 検証は provider の配信とペイロード整合性を認証しますが、PSTN/VoIP の発信者番号所有権を証明するものではありません。`allowFrom` は強い発信者本人性ではなく、発信者番号フィルタリングとして扱ってください。

自動応答はエージェントシステムを使用します。次で調整できます。

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 音声出力コントラクト

自動応答では、Voice Call はシステムプロンプトに厳密な音声出力コントラクトを追加します。

- `{"spoken":"..."}`

その後 Voice Call は、防御的に音声テキストを抽出します。

- 推論/エラーコンテンツとしてマークされたペイロードは無視します。
- 直接の JSON、フェンス付き JSON、またはインラインの `"spoken"` キーを解析します。
- プレーンテキストにフォールバックし、計画/メタの導入段落らしい部分を削除します。

これにより、音声再生は発信者向けテキストに集中し、計画テキストが音声に漏れるのを防ぎます。

### 会話開始時の動作

発信 `conversation` 通話では、最初のメッセージ処理はライブ再生状態に結び付けられています。

- 割り込み発話キューのクリアと自動応答は、初期あいさつが実際に再生中である間だけ抑制されます。
- 初期再生に失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューされたままになります。
- Twilio streaming の初期再生は、ストリーム接続時に追加遅延なしで開始されます。
- 割り込み発話はアクティブな再生を中断し、キュー済みだがまだ再生されていない Twilio TTS エントリをクリアします。クリアされたエントリはスキップとして解決されるため、後続の応答ロジックは再生されない音声を待たずに継続できます。
- リアルタイム音声会話は、リアルタイムストリーム自身の開始ターンを使用します。Voice Call はその初期メッセージに対してレガシーな `<Say>` TwiML 更新を投稿しないため、発信 `<Connect><Stream>` セッションは接続されたまま保たれます。

### Twilio ストリーム切断の猶予時間

Twilio メディアストリームが切断されると、Voice Call は通話を自動終了する前に `2000ms` 待機します。

- その間にストリームが再接続した場合、自動終了はキャンセルされます。
- 猶予期間後もストリームが再登録されない場合、アクティブ通話が停止状態になるのを防ぐために通話が終了されます。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call のエイリアス
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # ログからターンレイテンシを要約
openclaw voicecall expose --mode funnel
```

`latency` は、デフォルトの voice-call 保存パスから `calls.jsonl` を読み取ります。別のログを指定するには `--file <path>` を使用し、解析対象を最後の N レコード（デフォルト 200）に制限するには `--last <n>` を使用してください。出力には、ターンレイテンシと listen-wait 時間の p50/p90/p99 が含まれます。

## エージェントツール

ツール名: `voice_call`

アクション:

- `initiate_call`（message、to?、mode?）
- `continue_call`（callId、message）
- `speak_to_user`（callId、message）
- `send_dtmf`（callId、digits）
- `end_call`（callId）
- `get_status`（callId）

このリポジトリには、対応する Skill ドキュメントが `skills/voice-call/SKILL.md` に含まれています。

## Gateway RPC

- `voicecall.initiate`（`to?`、`message`、`mode?`）
- `voicecall.continue`（`callId`、`message`）
- `voicecall.speak`（`callId`、`message`）
- `voicecall.dtmf`（`callId`、`digits`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）

## 関連

- [Text-to-speech](/ja-JP/tools/tts)
- [Talk mode](/ja-JP/nodes/talk)
- [Voice wake](/ja-JP/nodes/voicewake)
