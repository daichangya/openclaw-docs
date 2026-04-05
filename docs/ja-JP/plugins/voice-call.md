---
read_when:
    - OpenClawから音声の発信通話を行いたい場合
    - voice-call pluginを設定または開発している場合
summary: 'Voice Call plugin: Twilio/Telnyx/Plivo経由の発信 + 着信通話（pluginのインストール + 設定 + CLI）'
title: Voice Call Plugin
x-i18n:
    generated_at: "2026-04-05T12:53:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call（plugin）

plugin経由でOpenClawに音声通話機能を追加します。着信ポリシーを備えた
発信通知とマルチターン会話に対応しています。

現在のprovider:

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（開発用 / ネットワークなし）

簡単な考え方:

- pluginをインストールする
- Gatewayを再起動する
- `plugins.entries.voice-call.config` 配下で設定する
- `openclaw voicecall ...` または `voice_call` toolを使う

## 実行場所（local vs remote）

Voice Call pluginは**Gateway process内**で動作します。

remote Gatewayを使う場合は、**Gatewayを実行しているマシン**にpluginをインストール/設定し、
その後pluginを読み込むためにGatewayを再起動してください。

## インストール

### オプションA: npmからインストールする（推奨）

```bash
openclaw plugins install @openclaw/voice-call
```

その後、Gatewayを再起動してください。

### オプションB: ローカルフォルダーからインストールする（開発用、コピーなし）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gatewayを再起動してください。

## 設定

設定は `plugins.entries.voice-call.config` 配下に置きます:

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
        },
      },
    },
  },
}
```

注意:

- Twilio/Telnyxでは**公開到達可能な** webhook URLが必要です。
- Plivoでも**公開到達可能な** webhook URLが必要です。
- `mock` はローカル開発用providerです（ネットワーク呼び出しなし）。
- 古い設定で `provider: "log"`、`twilio.from`、またはlegacyな `streaming.*` OpenAI keysを使っている場合は、`openclaw doctor --fix` を実行して書き換えてください。
- Telnyxでは、`skipSignatureVerification` がtrueでない限り `telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
- `skipSignatureVerification` はローカルテスト専用です。
- ngrokの無料tierを使う場合は、`publicUrl` に正確なngrok URLを設定してください。署名検証は常に強制されます。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` がloopback
  （ngrok local agent）の場合にのみ、無効な署名を持つTwilio webhooksを許可します。ローカル開発専用です。
- ngrok無料tierのURLは変わったり、中間画面の挙動が加わったりすることがあります。`publicUrl` がずれると、Twilio署名は失敗します。本番では、安定したドメインまたはTailscale funnelを推奨します。
- ストリーミングのセキュリティデフォルト:
  - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送らないソケットを閉じます。
- `streaming.maxPendingConnections` は、未認証のpre-startソケット総数を制限します。
- `streaming.maxPendingConnectionsPerIp` は、送信元IPごとの未認証pre-startソケット数を制限します。
- `streaming.maxConnections` は、開いているmedia streamソケット総数（pending + active）を制限します。
- ランタイムのフォールバックは、今のところそれらの古いvoice-call keysも引き続き受け付けますが、
  書き換え経路は `openclaw doctor --fix` であり、この互換shimは一時的なものです。

## ストリーミング音声文字起こし

`streaming` は、通話中のライブ音声向けにrealtime transcription providerを選択します。

現在のランタイム挙動:

- `streaming.provider` は任意です。未設定の場合、Voice Callは最初に
  登録されたrealtime transcription providerを使います。
- 現在のbundled providerはOpenAIで、bundled `openai`
  pluginによって登録されます。
- provider所有のraw configは `streaming.providers.<providerId>` 配下に置きます。
- `streaming.provider` が未登録providerを指している場合、またはrealtime
  transcription providerがまったく登録されていない場合、Voice Callは警告を記録し、
  plugin全体を失敗させる代わりにmedia streamingをスキップします。

OpenAIストリーミング文字起こしのデフォルト:

- API key: `streaming.providers.openai.apiKey` または `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

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

legacy keysは、引き続き `openclaw doctor --fix` によって自動移行されます:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 古い通話のreaper

終端webhookを受け取らないまま残る通話を終了するには、
`staleCallReaperSeconds` を使います
（たとえば、完了しないnotify-mode通話）。デフォルトは `0`
（無効）です。

推奨範囲:

- **本番:** notifyスタイルフローでは `120`〜`300` 秒。
- 通常の通話が完了できるよう、この値は **`maxDurationSeconds` より大きく** してください。
  良い初期値は `maxDurationSeconds + 30〜60` 秒です。

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

## Webhook Security

proxyまたはtunnelがGatewayの前段にある場合、pluginは署名検証のために
公開URLを再構築します。これらのオプションは、どのforwarded
headersを信頼するかを制御します。

`webhookSecurity.allowedHosts` は、forwarding headers内のhostをallowlist化します。

`webhookSecurity.trustForwardingHeaders` は、allowlistなしでforwarded headersを信頼します。

`webhookSecurity.trustedProxyIPs` は、リクエストの
remote IPがこの一覧に一致する場合にのみforwarded headersを信頼します。

Webhook replay protectionはTwilioとPlivoで有効です。再送された有効なwebhook
requestsは受理されますが、副作用はスキップされます。

Twilio conversation turnsには、`<Gather>` callbacksにturnごとのtokenが含まれるため、
古い / 再送されたspeech callbacksが新しいpending transcript turnを満たしてしまうことはありません。

未認証のwebhook requestsは、provider必須の署名headersが欠けていると、
bodyを読む前に拒否されます。

voice-call webhookは、共有のpre-auth body profile（64 KB / 5秒）と、
署名検証前のIPごとのin-flight上限を使います。

安定した公開hostを使う例:

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

## 通話用TTS

Voice Callは、通話上のストリーミング音声に対してコアの `messages.tts` 設定を使用します。
plugin config配下で**同じ形**のまま上書きでき、
`messages.tts` とdeep-mergeされます。

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

- plugin config内のlegacyな `tts.<provider>` keys（`openai`, `elevenlabs`, `microsoft`, `edge`）は、読み込み時に自動で `tts.providers.<provider>` へ移行されます。コミットするconfigでは `providers` 形式を推奨します。
- **Microsoft speechはvoice callsでは無視されます**（電話音声にはPCMが必要ですが、現在のMicrosoft transportは電話向けPCM出力を公開していません）。
- Twilio media streamingが有効な場合はコアTTSが使われ、それ以外では通話はproviderネイティブ音声へフォールバックします。
- Twilio media streamがすでに有効な場合、Voice CallはTwiML `<Say>` へフォールバックしません。その状態でtelephony TTSが使えない場合、2つの再生経路を混在させる代わりに再生リクエストは失敗します。
- telephony TTSが二次providerへフォールバックした場合、Voice Callはデバッグ用に
  provider chain（`from`, `to`, `attempts`）付きの警告を記録します。

### さらに例

コアTTSだけを使う（上書きなし）:

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

通話だけElevenLabsへ上書きする（コアのデフォルトは他で維持）:

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

通話用にOpenAI modelだけを上書きする（deep-merge例）:

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

着信ポリシーのデフォルトは `disabled` です。着信通話を有効にするには、次を設定します:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` は、低保証のcaller-IDチェックです。pluginは
providerから渡された `From` 値を正規化し、`allowFrom` と比較します。
Webhook verificationはproviderによる配送とpayload整合性を認証しますが、
PSTN/VoIPの発信番号所有権を証明するものではありません。`allowFrom` は
強い発信者本人確認ではなく、caller-IDフィルタリングとして扱ってください。

自動応答はagent systemを使います。次で調整できます:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 音声出力契約

自動応答では、Voice Callは厳格な音声出力契約をsystem promptへ追加します:

- `{"spoken":"..."}`

その後Voice Callは、防御的にspeech textを抽出します:

- reasoning/error contentとしてマークされたpayloadは無視します。
- 直接JSON、fenced JSON、またはインラインの `"spoken"` keysを解析します。
- プレーンテキストへフォールバックし、計画/メタ説明らしい先頭段落を除去します。

これにより、音声再生は発信者向けテキストに集中し、計画テキストが音声に漏れるのを防ぎます。

### 会話開始時の挙動

発信 `conversation` 通話では、最初のメッセージ処理はライブ再生状態に結び付いています。

- Barge-inのキュークリアと自動応答の抑制は、最初の挨拶が実際に話されている間だけ行われます。
- 最初の再生に失敗した場合、通話は `listening` に戻り、最初のメッセージは再試行用にキューに残ります。
- Twilio streamingの最初の再生は、追加遅延なしでstream接続時に開始されます。

### Twilio stream切断時の猶予

Twilio media streamが切断されると、Voice Callは通話を自動終了する前に `2000ms` 待機します:

- その間にstreamが再接続した場合、自動終了はキャンセルされます。
- 猶予期間後もstreamが再登録されない場合、activeなまま固まった通話を防ぐために通話は終了されます。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` は、デフォルトのvoice-call保存パスにある `calls.jsonl` を読みます。
別のlogを指定するには `--file <path>` を使い、分析対象を直近N件
（デフォルト200件）に制限するには `--last <n>` を使います。出力には、
turn latencyとlisten-wait時間のp50/p90/p99が含まれます。

## Agent tool

Tool名: `voice_call`

アクション:

- `initiate_call` (`message`, `to?`, `mode?`)
- `continue_call` (`callId`, `message`)
- `speak_to_user` (`callId`, `message`)
- `end_call` (`callId`)
- `get_status` (`callId`)

このrepoには、対応するskill docが `skills/voice-call/SKILL.md` に含まれています。

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
