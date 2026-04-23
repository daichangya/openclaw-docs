---
read_when:
    - OpenClawから発信のvoice callを行いたいです
    - voice-call pluginを設定または開発しています
summary: 'Voice Call Plugin: Twilio/Telnyx/Plivo経由の発信 + 着信通話（plugin install + config + CLI）'
title: Voice Call Plugin
x-i18n:
    generated_at: "2026-04-23T04:49:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call（plugin）

plugin経由でOpenClawにvoice call機能を追加します。発信通知と、着信ポリシー付きの複数ターン会話をサポートします。

現在のprovider:

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（開発用 / ネットワークなし）

簡単なイメージ:

- pluginをinstall
- Gatewayを再起動
- `plugins.entries.voice-call.config` 配下で設定
- `openclaw voicecall ...` または `voice_call` toolを使う

## 実行場所（local vs remote）

Voice Call pluginは**Gateway process内**で実行されます。

remote Gatewayを使っている場合は、**Gatewayを実行しているマシン**にpluginをinstall / 設定し、その後Gatewayを再起動して読み込ませてください。

## Install

### Option A: npmからinstallする（推奨）

```bash
openclaw plugins install @openclaw/voice-call
```

その後でGatewayを再起動してください。

### Option B: ローカルfolderからinstallする（開発用、コピーなし）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後でGatewayを再起動してください。

## Config

configは `plugins.entries.voice-call.config` 配下に設定します。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // または "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control PortalのTelnyx webhook公開鍵
            // （Base64文字列。TELNYX_PUBLIC_KEYでも設定可能）。
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

          // Webhook security（tunnel / proxyでは推奨）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure（いずれか1つを選択）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 任意。未設定時は最初に登録されたrealtime transcription provider
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY が設定済みなら任意
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

注:

- Twilio/Telnyxは**外部から到達可能な** webhook URLが必要です。
- Plivoも**外部から到達可能な** webhook URLが必要です。
- `mock` はローカル開発用providerです（ネットワーク呼び出しなし）。
- 古いconfigで `provider: "log"`、`twilio.from`、または旧 `streaming.*` OpenAI keyを使っている場合は、`openclaw doctor --fix` を実行して書き換えてください。
- Telnyxでは、`skipSignatureVerification` がtrueでない限り `telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
- `skipSignatureVerification` はローカルテスト専用です。
- ngrokのfree tierを使う場合は、正確なngrok URLを `publicUrl` に設定してください。署名検証は常に強制されます。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` を設定すると、`tunnel.provider="ngrok"` かつ `serve.bind` がloopback（ngrok local agent）のときに限り、無効な署名のTwilio webhookを許可します。ローカル開発専用です。
- ngrok free tierのURLは変わったりinterstitial挙動を追加したりすることがあります。`publicUrl` がずれるとTwilio署名検証は失敗します。本番では安定したdomainまたはTailscale funnelを推奨します。
- ストリーミングのsecurityデフォルト:
  - `streaming.preStartTimeoutMs` は、有効な `start` frameを一度も送らないsocketを閉じます。
- `streaming.maxPendingConnections` は、未認証のpre-start socket総数を制限します。
- `streaming.maxPendingConnectionsPerIp` は、送信元IPごとの未認証pre-start socket数を制限します。
- `streaming.maxConnections` は、開いているmedia stream socket総数（pending + active）を制限します。
- runtimeのフォールバックは現時点では古いvoice-call keyも受け付けますが、書き換え経路は `openclaw doctor --fix` であり、この互換shimは一時的です。

## Streaming transcription

`streaming` は、live call audio用のrealtime transcription providerを選択します。

現在のruntime動作:

- `streaming.provider` は任意です。未設定の場合、Voice Callは最初に登録された
  realtime transcription providerを使います。
- 同梱のrealtime transcription providerには、Deepgram（`deepgram`）、
  ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）、xAI
  （`xai`）があり、それぞれ対応するprovider pluginによって登録されます。
- provider所有の生configは `streaming.providers.<providerId>` 配下に置きます。
- `streaming.provider` が未登録providerを指している場合、またはrealtime
  transcription providerが1つも登録されていない場合、Voice Callは警告を出して
  plugin全体を失敗させる代わりにmedia streamingをスキップします。

OpenAI streaming transcriptionのデフォルト:

- API key: `streaming.providers.openai.apiKey` または `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI streaming transcriptionのデフォルト:

- API key: `streaming.providers.xai.apiKey` または `XAI_API_KEY`
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
                apiKey: "sk-...", // OPENAI_API_KEY が設定済みなら任意
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

代わりにxAIを使う場合:

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
                apiKey: "${XAI_API_KEY}", // XAI_API_KEY が設定済みなら任意
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

旧keyは引き続き `openclaw doctor --fix` で自動移行されます。

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Stale call reaper

終端webhookを受け取らないcall（たとえば notify modeのcallが完了しない場合）を終了するには、
`staleCallReaperSeconds` を使います。デフォルトは `0`
（無効）です。

推奨範囲:

- **本番:** notify型flowでは `120`〜`300` 秒。
- 通常のcallが完了できるよう、この値は **`maxDurationSeconds` より大きく**
  してください。開始値としては `maxDurationSeconds + 30〜60` 秒が適切です。

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

proxyやtunnelがGatewayの前段にある場合、pluginは署名検証のために
public URLを再構築します。これらのoptionは、どのforwarded
headerを信頼するかを制御します。

`webhookSecurity.allowedHosts` は、forwarding header内のhostを許可リスト化します。

`webhookSecurity.trustForwardingHeaders` は、allowlistなしでforwarded headerを信頼します。

`webhookSecurity.trustedProxyIPs` は、リクエストのremote IPがlistに一致する場合にのみ
forwarded headerを信頼します。

webhook replay protectionはTwilioとPlivoで有効です。再送された有効なwebhook
requestは受理されますが、副作用はスキップされます。

Twilio conversation turnは `<Gather>` callbackにturnごとのtokenを含むため、
古い / 再送されたspeech callbackが、より新しい保留中transcript turnを満たすことはできません。

未認証webhook requestは、providerで必須の署名headerが欠けている場合、
bodyを読む前に拒否されます。

voice-call webhookは、署名検証前に、共有pre-auth body profile（64 KB / 5秒）と
IPごとのin-flight上限を使います。

安定したpublic hostを使う例:

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

Voice Callは、通話中のspeech streamingに
coreの `messages.tts` 設定を使います。plugin config配下で
**同じ構造** で上書きでき、`messages.tts` とdeep‑mergeされます。

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

注:

- plugin config内の旧 `tts.<provider>` key（`openai`、`elevenlabs`、`microsoft`、`edge`）は、読み込み時に `tts.providers.<provider>` へ自動移行されます。コミットするconfigでは `providers` 形式を推奨します。
- **Microsoft speechはvoice callでは無視されます**（電話音声ではPCMが必要ですが、現在のMicrosoft transportは電話向けPCM出力を公開していません）。
- Twilio media streamingが有効な場合はcore TTSが使われ、それ以外ではcallはproviderネイティブvoiceにフォールバックします。
- Twilio media streamがすでに有効な場合、Voice CallはTwiML `<Say>` へはフォールバックしません。その状態でtelephony TTSが利用できない場合、2つの再生経路を混在させるのではなく、再生requestは失敗します。
- telephony TTSが二次providerへフォールバックした場合、Voice Callはデバッグ用にprovider chain（`from`、`to`、`attempts`）を含む警告を記録します。

### 追加の例

core TTSのみを使う（上書きなし）:

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

callに限ってElevenLabsへ上書きする（他ではcore defaultを維持）:

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

callに限ってOpenAI modelだけを上書きする（deep‑mergeの例）:

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
  inboundGreeting: "こんにちは。ご用件をどうぞ。",
}
```

`inboundPolicy: "allowlist"` は、低保証のcaller IDフィルタです。pluginは
providerから渡された `From` 値を正規化し、`allowFrom` と比較します。
webhook検証はproviderによる配信とpayload完全性を認証しますが、
PSTN/VoIPの発信番号の所有を証明するものではありません。`allowFrom` は
強い発信者本人確認ではなく、caller IDによるフィルタリングとして扱ってください。

自動応答はagent systemを使います。調整には次を使います。

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 発話出力contract

自動応答では、Voice Callはsystem promptに厳格な発話出力contractを追加します。

- `{"spoken":"..."}`

その後、Voice Callは防御的にspeech textを抽出します。

- reasoning/error contentとしてマークされたpayloadは無視します。
- 直接JSON、fenced JSON、またはインラインの `"spoken"` keyをparseします。
- プレーンテキストにフォールバックし、計画やメタ情報らしい先頭paragraphを除去します。

これにより、発話再生は発信者向けテキストに集中し、計画テキストがaudioへ漏れるのを防ぎます。

### 会話開始時の動作

発信 `conversation` callでは、最初のメッセージ処理はlive playback状態に連動します。

- barge-inのqueue clearと自動応答は、最初のgreetingが実際に発話中の間だけ抑制されます。
- 最初のplaybackに失敗した場合、callは `listening` に戻り、最初のmessageは再試行用にqueueされたまま残ります。
- Twilio streamingの最初のplaybackは、追加の遅延なしでstream接続時に開始します。

### Twilio stream切断時の猶予

Twilio media streamが切断されたとき、Voice Callはcallを自動終了する前に `2000ms` 待ちます。

- その間にstreamが再接続された場合、自動終了はキャンセルされます。
- 猶予期間後もstreamが再登録されない場合、active callが詰まったままになるのを防ぐため、callは終了されます。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call の alias
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # ログからturn latencyを要約
openclaw voicecall expose --mode funnel
```

`latency` は、デフォルトのvoice-call storage pathから `calls.jsonl` を読みます。
別のlogを指定するには `--file <path>` を使い、分析対象を直近N件に制限するには
`--last <n>` を使ってください（デフォルトは200）。出力には、turn
latencyおよびlisten-wait timeのp50/p90/p99が含まれます。

## Agent tool

tool名: `voice_call`

action:

- `initiate_call`（message, to?, mode?）
- `continue_call`（callId, message）
- `speak_to_user`（callId, message）
- `end_call`（callId）
- `get_status`（callId）

このrepoには、対応するskill docが `skills/voice-call/SKILL.md` に含まれています。

## Gateway RPC

- `voicecall.initiate`（`to?`, `message`, `mode?`）
- `voicecall.continue`（`callId`, `message`）
- `voicecall.speak`（`callId`, `message`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）
