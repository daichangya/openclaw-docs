---
read_when:
    - OpenClaw で OpenAI モデルを使いたい場合
    - API キーの代わりに Codex サブスクリプション認証を使いたい場合
    - より厳格な GPT-5 エージェント実行動作が必要な場合
summary: OpenClawでAPIキーまたはCodexサブスクリプションを使ってOpenAIを利用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T04:50:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775a937680731ff09181dd58d2be1ca1a751c9193ac299ba6657266490a6a9b7
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI は GPT モデル向けの開発者 API を提供しています。OpenClaw は 2 つの認証ルートをサポートします。

  - **API キー** — 従量課金の直接 OpenAI Platform アクセス（`openai/*` モデル）
  - **Codex サブスクリプション** — サブスクリプションアクセス付きの ChatGPT/Codex サインイン（`openai-codex/*` モデル）

  OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

  ## OpenClaw の機能対応状況

  | OpenAI の機能 | OpenClaw surface | 状態 |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses | `openai/<model>` モデル provider | はい |
  | Codex サブスクリプションモデル | `openai-codex/<model>` モデル provider | はい |
  | サーバーサイド Web search | ネイティブ OpenAI Responses ツール | はい。Web search が有効で provider が固定されていない場合 |
  | 画像 | `image_generate` | はい |
  | 動画 | `video_generate` | はい |
  | テキスト読み上げ | `messages.tts.provider: "openai"` / `tts` | はい |
  | バッチ speech-to-text | `tools.media.audio` / メディア理解 | はい |
  | ストリーミング speech-to-text | Voice Call `streaming.provider: "openai"` | はい |
  | リアルタイム音声 | Voice Call `realtime.provider: "openai"` | はい |
  | 埋め込み | メモリ埋め込み provider | はい |

  ## はじめに

  希望する認証方法を選び、セットアップ手順に従ってください。

  <Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途:** 直接 API アクセスと従量課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) で API キーを作成またはコピーします。
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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | ルート | 認証 |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex サインインは `openai/*` ではなく `openai-codex/*` を通ります。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw は直接 API パスでは `openai/gpt-5.3-codex-spark` を**公開しません**。実際の OpenAI API リクエストはそのモデルを拒否します。Spark は Codex 専用です。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別の API キーではなく ChatGPT/Codex サブスクリプションを使う場合。Codex cloud には ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | ルート | 認証 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex サインイン（権限に依存） |

    <Note>
    このルートは `openai/gpt-5.4` とは意図的に分離されています。直接 Platform アクセスには API キー付きの `openai/*` を使い、Codex サブスクリプションアクセスには `openai-codex/*` を使ってください。
    </Note>

    ### 設定例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    オンボーディングで既存の Codex CLI ログインを再利用した場合、その認証情報は Codex CLI によって管理されたままです。有効期限が切れると、OpenClaw は最初に外部の Codex ソースを再読み込みし、更新された認証情報を Codex ストレージに書き戻します。
    </Tip>

    ### コンテキストウィンドウ上限

    OpenClaw は、モデルメタデータとランタイムのコンテキスト上限を別の値として扱います。

    `openai-codex/gpt-5.4` の場合:

    - ネイティブ `contextWindow`: `1050000`
    - デフォルトのランタイム `contextTokens` 上限: `272000`

    このより小さいデフォルト上限は、実運用ではより良いレイテンシと品質特性を持ちます。`contextTokens` で上書きできます:

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
    ネイティブのモデルメタデータを宣言するには `contextWindow` を使用します。ランタイムのコンテキスト予算を制限するには `contextTokens` を使用します。
    </Note>

  </Tab>
</Tabs>

## 画像生成

バンドルされた `openai` plugin は、`image_generate` ツールを通じて画像生成を登録します。

| 機能 | 値 |
| ------------------------- | ---------------------------------- |
| デフォルトモデル | `openai/gpt-image-2` |
| リクエストごとの最大画像数 | 4 |
| 編集モード | 有効（参照画像は最大5枚） |
| サイズ上書き | サポートあり。2K/4K サイズを含む |
| アスペクト比 / 解像度 | OpenAI Images API には転送されない |

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
共通ツールパラメータ、provider 選択、failover 動作については、[Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は、OpenAI のテキストから画像生成と画像
編集の両方のデフォルトです。`gpt-image-1` は明示的なモデル上書きとして引き続き使用できますが、新しい
OpenAI 画像ワークフローでは `openai/gpt-image-2` を使用してください。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="OpenClaw on macOS の洗練されたローンチポスター" size=3840x2160 count=1
```

編集:

```
/tool image_generate model=openai/gpt-image-2 prompt="物体の形状は維持し、素材を半透明のガラスに変更する" image=/path/to/reference.png size=1024x1536
```

## 動画生成

バンドルされた `openai` plugin は、`video_generate` ツールを通じて動画生成を登録します。

| 機能 | 値 |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2` |
| モード | テキストから動画、画像から動画、単一動画の編集 |
| 参照入力 | 画像1枚または動画1本 |
| サイズ上書き | サポートあり |
| その他の上書き | `aspectRatio`, `resolution`, `audio`, `watermark` はツール警告付きで無視される |

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
共通ツールパラメータ、provider 選択、failover 動作については、[Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 プロンプト寄与

OpenClaw は、provider をまたぐ GPT-5 ファミリー実行に対して、共有の GPT-5 プロンプト寄与を追加します。これは model id に基づいて適用されるため、`openai/gpt-5.4`、`openai-codex/gpt-5.4`、`openrouter/openai/gpt-5.4`、`opencode/gpt-5.4`、およびその他の互換 GPT-5 ref はすべて同じオーバーレイを受け取ります。古い GPT-4.x モデルには適用されません。

バンドルされたネイティブ Codex harness provider（`codex/*`）も、Codex app-server developer instructions を通じて同じ GPT-5 動作と Heartbeat オーバーレイを使用するため、`codex/gpt-5.x` セッションでも、Codex がそれ以外の harness prompt を所有していても、同じ追従性と積極的な Heartbeat ガイダンスが維持されます。

GPT-5 の寄与は、ペルソナ維持、実行安全性、ツール規律、出力形状、完了チェック、および検証のためのタグ付き動作コントラクトを追加します。チャネル固有の応答および無音メッセージ動作は、共有の OpenClaw システムプロンプトと送信配信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルでは常に有効です。フレンドリーな対話スタイル層は別であり、設定可能です。

| 値 | 効果 |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（デフォルト） | フレンドリーな対話スタイル層を有効にする |
| `"on"` | `"friendly"` の別名 |
| `"off"` | フレンドリーなスタイル層のみを無効にする |

<Tabs>
  <Tab title="設定">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
値はランタイムでは大文字小文字を区別しないため、`"Off"` と `"off"` はどちらもフレンドリーなスタイル層を無効にします。
</Tip>

<Note>
レガシーの `plugins.entries.openai.config.personality` も、共有設定 `agents.defaults.promptOverlays.gpt5.personality` が設定されていない場合は、互換性フォールバックとして引き続き読み取られます。
</Note>

## 音声と speech

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    バンドルされた `openai` plugin は、`messages.tts` surface 向けに音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスノートでは `opus`、ファイルでは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能なモデル: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能な音声: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

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
    チャット API エンドポイントに影響を与えずに TTS の base URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定してください。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    バンドルされた `openai` plugin は、
    OpenClaw のメディア理解文字起こし surface を通じてバッチ speech-to-text を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - OpenClaw では、受信音声文字起こしが
      `tools.media.audio` を使用するあらゆる場所でサポートされます。これには Discord 音声チャネルのセグメントやチャネルの
      音声添付ファイルが含まれます

    受信音声文字起こしで OpenAI を強制するには:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    言語ヒントとプロンプトヒントは、
    共有音声メディア設定または呼び出しごとの文字起こしリクエストから与えられた場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドルされた `openai` plugin は、Voice Call plugin 向けにリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | （未設定） |
    | プロンプト | `...openai.prompt` | （未設定） |
    | 無音継続時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用し、G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声を扱います。このストリーミング provider は Voice Call のリアルタイム文字起こしパス向けです。Discord 音声は現在、短いセグメントを録音し、代わりにバッチの `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドルされた `openai` plugin は、Voice Call plugin 向けにリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | 音声 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音継続時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `azureEndpoint` および `azureDeployment` 設定キーを介して Azure OpenAI をサポートします。双方向のツール呼び出しをサポートします。G.711 u-law 音声形式を使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート（WebSocket vs SSE）">
    OpenClaw は、`openai/*` と `openai-codex/*` の両方で、WebSocket 優先・SSE フォールバック（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次のように動作します。
    - 初期の WebSocket 障害を 1 回だけ再試行してから SSE にフォールバックする
    - 障害発生後、WebSocket を約60秒間 degraded としてマークし、クールダウン中は SSE を使う
    - 再試行と再接続のために、安定したセッション ID とターン ID のヘッダーを付与する
    - トランスポート差異をまたいで使用量カウンター（`input_tokens` / `prompt_tokens`）を正規化する

    | 値 | 動作 |
    |-------|----------|
    | `"auto"`（デフォルト） | WebSocket 優先、SSE フォールバック |
    | `"sse"` | SSE のみを強制 |
    | `"websocket"` | WebSocket のみを強制 |

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

    関連する OpenAI ドキュメント:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ウォームアップ">
    OpenClaw は、最初のターンのレイテンシを減らすため、`openai/*` でデフォルトで WebSocket ウォームアップを有効にします。

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
    OpenClaw は、`openai/*` と `openai-codex/*` の両方に対して共通の高速モード切り替えを提供します。

    - **Chat/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は高速モードを OpenAI の優先処理（`service_tier = "priority"`）にマッピングします。既存の `service_tier` 値は保持され、高速モードは `reasoning` や `text.verbosity` を書き換えません。

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
    セッション上書きは設定より優先されます。Sessions UI でセッション上書きをクリアすると、セッションは設定されたデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理（service_tier）">
    OpenAI の API は `service_tier` を介して優先処理を公開しています。OpenClaw ではモデルごとに設定できます。

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
    `serviceTier` は、ネイティブ OpenAI エンドポイント（`api.openai.com`）およびネイティブ Codex エンドポイント（`chatgpt.com/backend-api`）にのみ転送されます。いずれかの provider をプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバーサイド Compaction（Responses API）">
    直接 OpenAI Responses モデル（`api.openai.com` 上の `openai/*`）について、OpenClaw はサーバーサイド Compaction を自動有効化します。

    - `store: true` を強制する（model compat が `supportsStore: false` を設定している場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入する
    - デフォルトの `compact_threshold`: `contextWindow` の70%（不明な場合は `80000`）

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントで有用です。

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
    `responsesServerCompaction` が制御するのは `context_management` の注入だけです。直接 OpenAI Responses モデルでは、compat が `supportsStore: false` を設定していない限り、依然として `store: true` が強制されます。
    </Note>

  </Accordion>

  <Accordion title="strict-agentic GPT モード">
    `openai/*` および `openai-codex/*` 上の GPT-5 ファミリー実行では、OpenClaw はより厳格な埋め込み実行コントラクトを使用できます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次のように動作します。
    - ツールアクションが利用可能な場合、プランのみのターンを成功した進捗として扱わなくなる
    - act-now steer を付けてターンを再試行する
    - 重要な作業では `update_plan` を自動有効化する
    - モデルが行動せずにプランニングを続ける場合、明示的な blocked 状態を表面化する

    <Note>
    OpenAI と Codex の GPT-5 ファミリー実行のみにスコープされます。その他の provider と古いモデルファミリーはデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接 OpenAI、Codex、Azure OpenAI のエンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なるものとして扱います。

    **ネイティブルート**（`openai/*`、`openai-codex/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルに対してのみ `reasoning: { effort: "none" }` を維持する
    - `reasoning.effort: "none"` を拒否するモデルやプロキシでは、無効化された reasoning を省略する
    - ツールスキーマをデフォルトで strict モードにする
    - 検証済みネイティブホストにのみ隠し attribution ヘッダーを付与する
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、reasoning-compat、prompt-cache hints）を維持する

    **プロキシ/互換ルート:**
    - より緩い compat 動作を使用する
    - strict ツールスキーマやネイティブ専用ヘッダーを強制しない

    Azure OpenAI はネイティブのトランスポートと compat 動作を使用しますが、隠し attribution ヘッダーは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover 動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通画像ツールパラメータと provider 選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通動画ツールパラメータと provider 選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>
