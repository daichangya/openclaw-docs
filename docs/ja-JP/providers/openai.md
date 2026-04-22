---
read_when:
    - OpenClawでOpenAIモデルを使いたい
    - APIキーではなくCodexサブスクリプション認証を使いたい
    - GPT-5エージェントの実行動作をより厳格にしたい
summary: OpenClawでOpenAIをAPIキーまたはCodexサブスクリプション経由で使用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-22T04:27:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692615b77885c0387d339d47c02ff056ba95d3608aa681882893a46d2a0f723f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAIはGPTモデル向けの開発者APIを提供しています。OpenClawは2つの認証ルートをサポートします。

- **APIキー** — 従量課金によるOpenAI Platformへの直接アクセス（`openai/*`モデル）
- **Codexサブスクリプション** — サブスクリプションアクセス付きのChatGPT/Codexサインイン（`openai-codex/*`モデル）

OpenAIは、OpenClawのような外部ツールやワークフローでのサブスクリプションOAuth利用を明示的にサポートしています。

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="APIキー（OpenAI Platform）">
    **最適な用途:** 直接APIアクセスと従量課金。

    <Steps>
      <Step title="APIキーを取得する">
        [OpenAI Platformダッシュボード](https://platform.openai.com/api-keys)でAPIキーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | OpenAI Platform APIへの直接アクセス | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | OpenAI Platform APIへの直接アクセス | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codexサインインは`openai/*`ではなく`openai-codex/*`経由にルーティングされます。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClawは、直接APIルートで`openai/gpt-5.3-codex-spark`を**公開しません**。実際のOpenAI APIリクエストではそのモデルは拒否されます。SparkはCodex専用です。
    </Warning>

  </Tab>

  <Tab title="Codexサブスクリプション">
    **最適な用途:** 別のAPIキーではなく、ChatGPT/Codexサブスクリプションを使用する場合。Codex cloudにはChatGPTサインインが必要です。

    <Steps>
      <Step title="Codex OAuthを実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuthを直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codexサインイン |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codexサインイン（entitlement依存） |

    <Note>
    このルートは`openai/gpt-5.4`とは意図的に分離されています。OpenAI Platformへ直接アクセスするにはAPIキー付きで`openai/*`を、Codexサブスクリプションアクセスには`openai-codex/*`を使用してください。
    </Note>

    ### 設定例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    オンボーディングが既存のCodex CLIログインを再利用した場合、その認証情報は引き続きCodex CLIによって管理されます。有効期限切れ時には、OpenClawはまず外部のCodexソースを再読込し、更新された認証情報をCodexストレージへ書き戻します。
    </Tip>

    ### コンテキストウィンドウ上限

    OpenClawは、モデルメタデータとランタイムのコンテキスト上限を別の値として扱います。

    `openai-codex/gpt-5.4`では:

    - ネイティブ`contextWindow`: `1050000`
    - デフォルトのランタイム`contextTokens`上限: `272000`

    実運用では、このより小さいデフォルト上限の方がレイテンシと品質の特性が優れています。`contextTokens`で上書きできます。

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ネイティブモデルメタデータを宣言するには`contextWindow`を使用してください。ランタイムのコンテキスト予算を制限するには`contextTokens`を使用してください。
    </Note>

  </Tab>
</Tabs>

## 画像生成

組み込みの`openai`Pluginは、`image_generate`ツールを通じて画像生成を登録します。

| Capability                | Value                              |
| ------------------------- | ---------------------------------- |
| Default model             | `openai/gpt-image-2`               |
| Max images per request    | 4                                  |
| Edit mode                 | 有効（参照画像は最大5枚）          |
| Size overrides            | サポート済み。2K/4Kサイズを含む    |
| Aspect ratio / resolution | OpenAI Images APIには転送されない  |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
共有ツールパラメータ、provider選択、failover動作については[Image Generation](/ja-JP/tools/image-generation)を参照してください。
</Note>

`gpt-image-2`は、OpenAIのtext-to-image生成と画像編集の両方でデフォルトです。`gpt-image-1`も明示的なモデル上書きとして引き続き使用できますが、新しいOpenAI画像ワークフローでは`openai/gpt-image-2`を使用してください。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

編集:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 動画生成

組み込みの`openai`Pluginは、`video_generate`ツールを通じて動画生成を登録します。

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Default model    | `openai/sora-2`                                                                   |
| Modes            | text-to-video、image-to-video、単一動画編集                                       |
| Reference inputs | 画像1枚または動画1本                                                              |
| Size overrides   | サポート済み                                                                       |
| Other overrides  | `aspectRatio`、`resolution`、`audio`、`watermark`はツール警告付きで無視されます   |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
共有ツールパラメータ、provider選択、failover動作については[Video Generation](/ja-JP/tools/video-generation)を参照してください。
</Note>

## GPT-5プロンプト寄与

OpenClawは、`openai/*`および`openai-codex/*`のGPT-5系実行に対して、OpenAI固有のGPT-5プロンプト寄与を追加します。これは組み込みのOpenAI Plugin内にあり、`gpt-5`、`gpt-5.2`、`gpt-5.4`、`gpt-5.4-mini`のようなmodel idに適用され、古いGPT-4.xモデルには適用されません。

GPT-5寄与は、personaの維持、実行安全性、ツール規律、出力形状、完了チェック、検証のためのタグ付き動作コントラクトを追加します。チャネル固有の返信動作とサイレントメッセージ動作は、共有のOpenClaw system promptと送信配信ポリシーに残ります。GPT-5ガイダンスは、該当するモデルに対して常に有効です。フレンドリーな対話スタイル層は別で、設定可能です。

| Value                  | Effect                                        |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (default) | フレンドリーな対話スタイル層を有効にする      |
| `"on"`                 | `"friendly"`のエイリアス                      |
| `"off"`                | フレンドリーなスタイル層のみを無効にする      |

<Tabs>
  <Tab title="設定">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
値はランタイムでは大文字小文字を区別しないため、`"Off"`でも`"off"`でもフレンドリーなスタイル層を無効にします。
</Tip>

## 音声とspeech

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    組み込みの`openai`Pluginは、`messages.tts`サーフェス向けの音声合成を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | （未設定） |
    | Instructions | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts`のみ） |
    | Format | `messages.tts.providers.openai.responseFormat` | ボイスノートでは`opus`、ファイルでは`mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY`にフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能なモデル: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能なvoice: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    チャットAPI endpointに影響を与えずにTTS base URLを上書きするには、`OPENAI_TTS_BASE_URL`を設定してください。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    組み込みの`openai`Pluginは、Voice Call Plugin向けのリアルタイム文字起こしを登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY`にフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime`へのWebSocket接続とG.711 u-law音声を使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    組み込みの`openai`Pluginは、Voice Call Plugin向けのリアルタイム音声を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY`にフォールバック |

    <Note>
    `azureEndpoint`および`azureDeployment`設定キー経由でAzure OpenAIをサポートします。双方向ツール呼び出しをサポートします。G.711 u-law音声形式を使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート（WebSocket vs SSE）">
    OpenClawは、`openai/*`と`openai-codex/*`の両方で、SSEフォールバック付きのWebSocket優先（`"auto"`）を使用します。

    `"auto"`モードでは、OpenClawは次を行います。
    - 初期のWebSocket失敗を1回再試行してからSSEへフォールバック
    - 失敗後、WebSocketを約60秒間degradedとしてマークし、クールダウン中はSSEを使用
    - 再試行と再接続のために安定したsessionおよびturn IDヘッダーを付与
    - トランスポート差異間でusageカウンター（`input_tokens` / `prompt_tokens`）を正規化

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (default) | WebSocket優先、SSEフォールバック |
    | `"sse"` | SSEのみを強制 |
    | `"websocket"` | WebSocketのみを強制 |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    OpenAI関連ドキュメント:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocketウォームアップ">
    OpenClawは、最初のターンのレイテンシを減らすために、`openai/*`向けでデフォルトでWebSocketウォームアップを有効にしています。

    ```json5
    // ウォームアップを無効化
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="高速モード">
    OpenClawは、`openai/*`と`openai-codex/*`の両方に対して共有の高速モード切り替えを公開しています。

    - **Chat/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClawは高速モードをOpenAIの優先処理（`service_tier = "priority"`）にマップします。既存の`service_tier`値は保持され、高速モードは`reasoning`や`text.verbosity`を書き換えません。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    セッション上書きは設定より優先されます。Sessions UIでセッション上書きをクリアすると、そのセッションは設定済みデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理（service_tier）">
    OpenAIのAPIは、`service_tier`を通じて優先処理を公開しています。OpenClawではモデルごとに設定できます。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    サポートされる値: `auto`, `default`, `flex`, `priority`。

    <Warning>
    `serviceTier`は、ネイティブOpenAI endpoint（`api.openai.com`）およびネイティブCodex endpoint（`chatgpt.com/backend-api`）にのみ転送されます。いずれかのproviderをproxy経由でルーティングしている場合、OpenClawは`service_tier`を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側Compaction（Responses API）">
    直接のOpenAI Responsesモデル（`api.openai.com`上の`openai/*`）では、OpenClawはサーバー側Compactionを自動有効化します。

    - `store: true`を強制します（model compatが`supportsStore: false`を設定している場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]`を注入します
    - デフォルトの`compact_threshold`: `contextWindow`の70%（利用できない場合は`80000`）

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responsesのような互換endpointで有用です。

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="カスタムしきい値">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="無効化">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction`は`context_management`の注入のみを制御します。直接のOpenAI Responsesモデルでは、compatが`supportsStore: false`を設定しない限り、引き続き`store: true`が強制されます。
    </Note>

  </Accordion>

  <Accordion title="strict-agentic GPTモード">
    `openai/*`および`openai-codex/*`でのGPT-5系実行では、OpenClawはより厳格な埋め込み実行コントラクトを使用できます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic`では、OpenClawは次のように動作します。
    - ツールアクションが利用可能なとき、planのみのターンを成功した進捗として扱わなくなる
    - act-nowの誘導付きでターンを再試行する
    - 重要な作業では`update_plan`を自動有効化する
    - モデルが行動せずに計画し続ける場合、明示的なblocked状態を表面化する

    <Note>
    OpenAIおよびCodexのGPT-5系実行にのみ適用されます。他のproviderおよび古いモデルファミリーはデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="ネイティブ経路とOpenAI互換経路">
    OpenClawは、直接のOpenAI、Codex、Azure OpenAI endpointを、汎用のOpenAI互換`/v1` proxyとは異なる扱いにします。

    **ネイティブ経路**（`openai/*`、`openai-codex/*`、Azure OpenAI）:
    - OpenAIの`none` effortをサポートするモデルに対してのみ`reasoning: { effort: "none" }`を保持
    - `reasoning.effort: "none"`を拒否するモデルまたはproxyでは、無効なreasoningを省略
    - ツールスキーマをデフォルトでstrict modeにする
    - 検証済みのネイティブhostに対してのみ隠しattribution headerを付与
    - OpenAI専用のリクエスト整形（`service_tier`、`store`、reasoning-compat、prompt-cache hint）を維持

    **proxy/互換経路:**
    - より緩いcompat動作を使用
    - strictなツールスキーマやネイティブ専用headerを強制しない

    Azure OpenAIはネイティブのtransportとcompat動作を使用しますが、隠しattribution headerは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメータとprovider選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメータとprovider選択。
  </Card>
  <Card title="OAuthと認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>
