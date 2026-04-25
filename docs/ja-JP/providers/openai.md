---
read_when:
    - OpenClaw で OpenAI モデルを使いたい場合
    - API key ではなく Codex subscription auth を使いたい場合
    - より厳格な GPT-5 エージェント実行動作が必要な場合
summary: OpenClaw で API key または Codex subscription を使って OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:57:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI は、GPT モデル向けの developer API を提供しています。OpenClaw は 3 つの OpenAI 系ルートをサポートしています。モデル prefix によってルートが選択されます。

- **API key** — 使用量課金による OpenAI Platform への直接アクセス（`openai/*` モデル）
- **PI 経由の Codex subscription** — subscription access を使う ChatGPT/Codex サインイン（`openai-codex/*` モデル）
- **Codex app-server harness** — ネイティブ Codex app-server 実行（`openai/*` モデル + `agents.defaults.embeddedHarness.runtime: "codex"`）

OpenAI は、OpenClaw のような外部ツールやワークフローでの subscription OAuth 利用を明示的にサポートしています。

provider、model、runtime、および channel はそれぞれ別のレイヤーです。これらのラベルが
混ざっている場合は、config を変更する前に
[Agent runtimes](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| Goal                                          | Use                                                      | Notes                                                                        |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| API key による直接課金                        | `openai/gpt-5.4`                                         | `OPENAI_API_KEY` を設定するか、OpenAI API-key onboarding を実行する。        |
| ChatGPT/Codex subscription auth で GPT-5.5 を使う | `openai-codex/gpt-5.5`                                   | Codex OAuth 向けのデフォルト PI ルート。subscription 構成での第一選択。     |
| ネイティブ Codex app-server 動作で GPT-5.5 を使う | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"`    | 公開 OpenAI API ルートではなく Codex app-server harness を使用する。        |
| 画像生成または編集                            | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` または OpenAI Codex OAuth のどちらでも動作する。            |

<Note>
GPT-5.5 は現在、OpenClaw では subscription/OAuth ルート経由で利用できます:
PI runner では `openai-codex/gpt-5.5`、Codex app-server harness では
`openai/gpt-5.5` を使用します。`openai/gpt-5.5` への直接 API-key アクセスは、
OpenAI が GPT-5.5 を公開 API で有効化し次第サポートされます。それまでは、
`OPENAI_API_KEY` 構成では `openai/gpt-5.4` のような API 対応モデルを使用してください。
</Note>

<Note>
OpenAI Plugin を有効にしたり、`openai-codex/*` モデルを選択したりしても、
バンドル済み Codex app-server Plugin は有効になりません。OpenClaw がその Plugin を有効化するのは、
`embeddedHarness.runtime: "codex"` でネイティブ Codex harness を明示的に選択した場合、またはレガシーな `codex/*` model ref を使った場合のみです。
</Note>

## OpenClaw の機能カバレッジ

| OpenAI capability         | OpenClaw surface                                           | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>` model provider                            | Yes                                                    |
| Codex subscription models | `openai-codex/<model>` と `openai-codex` OAuth            | Yes                                                    |
| Codex app-server harness  | `openai/<model>` と `embeddedHarness.runtime: codex`      | Yes                                                    |
| サーバー側 web search     | ネイティブ OpenAI Responses tool                           | Yes, web search が有効で provider 固定がない場合       |
| 画像                      | `image_generate`                                           | Yes                                                    |
| 動画                      | `video_generate`                                           | Yes                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | Yes                                                    |
| バッチ speech-to-text     | `tools.media.audio` / media understanding                  | Yes                                                    |
| ストリーミング speech-to-text | Voice Call `streaming.provider: "openai"`              | Yes                                                    |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Yes                                                    |
| Embeddings                | memory embedding provider                                  | Yes                                                    |

## はじめに

希望する auth 方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key（OpenAI Platform）">
    **最適な用途:** 直接 API access と使用量課金。

    <Steps>
      <Step title="API key を取得する">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys) で API key を作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または key を直接渡します:

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
    | `openai/gpt-5.4` | Direct OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Direct OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | OpenAI が API で GPT-5.5 を有効化した後の将来的な direct API ルート | `OPENAI_API_KEY` |

    <Note>
    `openai/*` は、Codex app-server harness を明示的に強制しない限り、直接の OpenAI API-key ルートです。GPT-5.5 自体は現在 subscription/OAuth
    のみです。デフォルト PI runner 経由の Codex OAuth には `openai-codex/*` を使うか、
    ネイティブ Codex app-server 実行には
    `embeddedHarness.runtime: "codex"` とともに `openai/gpt-5.5` を使ってください。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw は **`openai/gpt-5.3-codex-spark` を公開していません**。実際の OpenAI API request はそのモデルを拒否し、現在の Codex catalog にもそれは存在しません。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適な用途:** 別の API key ではなく ChatGPT/Codex subscription を使いたい場合。Codex cloud には ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または OAuth を直接実行します:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        headless または localhost callback に不向きな構成では、`--device-code` を追加すると、localhost browser callback の代わりに ChatGPT device-code flow でサインインできます:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
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
    | `openai-codex/gpt-5.5` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server auth |

    <Note>
    auth/profile コマンドには、引き続き `openai-codex` provider id を使ってください。  
    `openai-codex/*` model prefix は、Codex OAuth 向けの明示的な PI ルートでもあります。これはバンドル済み Codex app-server harness を選択したり自動有効化したりはしません。
    </Note>

    ### 設定例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    オンボーディングは、`~/.codex` から OAuth 情報をもう import しません。browser OAuth（デフォルト）または上記の device-code flow でサインインしてください。OpenClaw は生成された credential を自分自身の agent auth store で管理します。
    </Note>

    ### ステータス表示

    chat の `/status` は、現在のセッションでどの model runtime が有効かを表示します。  
    デフォルトの PI harness は `Runtime: OpenClaw Pi Default` と表示されます。  
    バンドル済み Codex app-server harness が選択されている場合、`/status` には
    `Runtime: OpenAI Codex` と表示されます。既存セッションは記録済み harness id を保持するため、
    `embeddedHarness` を変更した後に `/status` に新しい PI/Codex 選択を反映させたい場合は
    `/new` または `/reset` を使用してください。

    ### コンテキストウィンドウ上限

    OpenClaw は model metadata と runtime context cap を別の値として扱います。

    Codex OAuth 経由の `openai-codex/gpt-5.5` では:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルト runtime `contextTokens` cap: `272000`

    この小さめのデフォルト cap は、実運用上、より良いレイテンシと品質特性を持ちます。`contextTokens` で上書きできます:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ネイティブ model metadata を宣言するには `contextWindow` を使ってください。runtime context budget を制限するには `contextTokens` を使ってください。
    </Note>

    ### カタログ復旧

    OpenClaw は、存在する場合 `gpt-5.5` に対して upstream Codex catalog metadata を使用します。  
    live Codex discovery で、アカウントが認証済みなのに `openai-codex/gpt-5.5` 行が欠落している場合、
    OpenClaw はその OAuth model 行を合成するため、cron、sub-agent、および設定済み default-model 実行が
    `Unknown model` で失敗しません。

  </Tab>
</Tabs>

## 画像生成

バンドル済みの `openai` Plugin は、`image_generate` tool を通じて画像生成を登録します。  
同じ `openai/gpt-image-2` model ref を使って、OpenAI API-key による画像生成と、
Codex OAuth による画像生成の両方をサポートします。

| Capability                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth sign-in           |
| Transport                 | OpenAI Images API                  | Codex Responses backend              |
| Max images per request    | 4                                  | 4                                    |
| Edit mode                 | Enabled（最大 5 枚の reference image） | Enabled（最大 5 枚の reference image） |
| Size overrides            | Supported, 2K/4K サイズを含む       | Supported, 2K/4K サイズを含む         |
| Aspect ratio / resolution | OpenAI Images API には転送されない  | 安全な場合は対応サイズへマッピングされる |

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
共有 tool parameter、provider selection、および failover 動作については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は、OpenAI の text-to-image generation と image
editing の両方におけるデフォルトです。`gpt-image-1` も明示的な model override としては引き続き使えますが、新しい
OpenAI image workflow では `openai/gpt-image-2` を使うべきです。

Codex OAuth を使うインストールでは、同じ `openai/gpt-image-2` ref を維持してください。  
`openai-codex` OAuth profile が設定されている場合、OpenClaw は保存済みの OAuth
access token を解決し、画像リクエストを Codex Responses backend 経由で送信します。  
そのリクエストに対して `OPENAI_API_KEY` を先に試したり、API key へ暗黙的にフォールバックしたりはしません。  
代わりに direct OpenAI Images API
ルートを使いたい場合は、`models.providers.openai` を API key、
カスタム base URL、または Azure endpoint で明示的に設定してください。  
そのカスタム image endpoint が信頼済み LAN/private address 上にある場合は、
さらに `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。  
このオプトインがない限り、OpenClaw は private/internal な OpenAI-compatible image endpoint をブロックしたままにします。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

編集:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 動画生成

バンドル済みの `openai` Plugin は、`video_generate` tool を通じて動画生成を登録します。

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Default model    | `openai/sora-2`                                                                   |
| Modes            | Text-to-video、image-to-video、single-video edit                                  |
| Reference inputs | 1 image または 1 video                                                            |
| Size overrides   | Supported                                                                         |
| Other overrides  | `aspectRatio`, `resolution`, `audio`, `watermark` は tool warning とともに無視される |

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
共有 tool parameter、provider selection、および failover 動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 prompt contribution

OpenClaw は、provider をまたぐ GPT-5 ファミリー実行に対して共有の GPT-5 prompt contribution を追加します。これは model id ベースで適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.4`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、およびその他の互換 GPT-5 ref は同じ overlay を受け取ります。古い GPT-4.x モデルには適用されません。

バンドル済みのネイティブ Codex harness も、Codex app-server developer instructions を通じて同じ GPT-5 動作と Heartbeat overlay を使用するため、`embeddedHarness.runtime: "codex"` を強制した `openai/gpt-5.x` セッションでも、harness prompt の残りを Codex が管理していても、同じ follow-through と proactive Heartbeat ガイダンスが維持されます。

GPT-5 contribution は、persona persistence、execution safety、tool discipline、output shape、completion check、および verification 向けのタグ付き動作契約を追加します。チャネル固有の reply と silent-message の動作は、共有の OpenClaw system prompt と outbound delivery policy に残ります。GPT-5 ガイダンスは、該当するモデルでは常に有効です。フレンドリーな対話スタイル層は別になっており、設定可能です。

| Value                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（デフォルト） | フレンドリーな対話スタイル層を有効にする      |
| `"on"`                 | `"friendly"` の alias                       |
| `"off"`                | フレンドリーなスタイル層のみ無効にする       |

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
値は runtime では大文字小文字を区別しないため、`"Off"` と `"off"` のどちらでもフレンドリーなスタイル層を無効にできます。
</Tip>

<Note>
共有の `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、レガシーな `plugins.entries.openai.config.personality` も互換フォールバックとして引き続き読み取られます。
</Note>

## 音声と speech

<AccordionGroup>
  <Accordion title="Speech synthesis（TTS）">
    バンドル済みの `openai` Plugin は、`messages.tts` surface 向けの speech synthesis を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | （未設定） |
    | Instructions | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | Format | `messages.tts.providers.openai.responseFormat` | voice note では `opus`、file では `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能モデル: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能 voice: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

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
    chat API endpoint に影響を与えずに TTS base URL を上書きするには `OPENAI_TTS_BASE_URL` を設定してください。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    バンドル済みの `openai` Plugin は、
    OpenClaw の media-understanding transcription surface を通じてバッチ speech-to-text を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - 入力経路: multipart 音声ファイルアップロード
    - 受信音声文字起こしで `tools.media.audio` を使うあらゆる場所でサポートされます。これには Discord voice-channel segment と channel
      audio attachment を含みます

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

    言語および prompt hint は、共有 audio media config または呼び出しごとの transcription request によって与えられた場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="Realtime transcription">
    バンドル済みの `openai` Plugin は、Voice Call Plugin 向けの realtime transcription を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | （未設定） |
    | Prompt | `...openai.prompt` | （未設定） |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime` への WebSocket 接続を、G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声で使用します。この streaming provider は Voice Call の realtime transcription 経路向けです。Discord voice は現在、短い segment を録音して、バッチの `tools.media.audio` transcription 経路を使います。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    バンドル済みの `openai` Plugin は、Voice Call Plugin 向けの realtime voice を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `azureEndpoint` および `azureDeployment` 設定キーによる Azure OpenAI をサポートします。双方向 tool calling をサポートします。G.711 u-law 音声形式を使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoint

バンドル済みの `openai` provider は、
base URL を上書きすることで Azure OpenAI resource を image
generation 向けに対象化できます。image-generation 経路では、OpenClaw は
`models.providers.openai.baseUrl` 上の Azure hostname を検出すると、自動的に
Azure の request shape へ切り替えます。

<Note>
Realtime voice は別の設定経路
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`）
を使うため、`models.providers.openai.baseUrl` の影響を受けません。Azure
設定については [音声と speech](#音声と-speech) 配下の **Realtime
voice** アコーディオンを参照してください。
</Note>

次のような場合に Azure OpenAI を使います。

- すでに Azure OpenAI subscription、quota、または enterprise agreement を持っている
- Azure が提供する regional data residency または compliance control が必要
- 既存の Azure tenancy 内にトラフィックを維持したい

### 設定

バンドル済み `openai` provider 経由で Azure 画像生成を使うには、
`models.providers.openai.baseUrl` を Azure resource に向け、`apiKey` を
Azure OpenAI key（OpenAI Platform key ではない）に設定します。

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw は、Azure image-generation
route 向けに次の Azure host suffix を認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure host に対する image-generation request では、OpenClaw は:

- `Authorization: Bearer` ではなく `api-key` header を送信する
- deployment スコープ path（`/openai/deployments/{deployment}/...`）を使用する
- 各 request に `?api-version=...` を付加する

その他の base URL（public OpenAI、OpenAI-compatible proxy）では、標準の
OpenAI image request shape を維持します。

<Note>
`openai` provider の image-generation path に対する Azure routing には
OpenClaw 2026.4.22 以降が必要です。以前の version では、任意のカスタム
`openai.baseUrl` を public OpenAI endpoint のように扱うため、Azure
image deployment に対しては失敗します。
</Note>

### API version

Azure image-generation path で特定の Azure preview または GA version を固定するには、
`AZURE_OPENAI_API_VERSION` を設定してください。

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合のデフォルトは `2024-12-01-preview` です。

### モデル名は deployment 名

Azure OpenAI はモデルを deployment に結び付けます。バンドル済み `openai` provider 経由で
ルーティングされる Azure image-generation request では、OpenClaw の `model`
field は、public な OpenAI model id ではなく、Azure portal で設定した**Azure deployment 名**である必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` という deployment を作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じ deployment-name ルールは、バンドル済み `openai` provider 経由で
ルーティングされる image-generation 呼び出しにも適用されます。

### 地域提供状況

Azure image generation は現在、一部の region でのみ利用可能です
（例: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`）。deployment を作成する前に、Microsoft の最新 region 一覧を確認し、
その model が対象 region で提供されていることを確認してください。

### パラメータの違い

Azure OpenAI と public OpenAI は、常に同じ画像パラメータを受け付けるわけではありません。  
Azure は、public OpenAI で許可されるオプション（たとえば
`gpt-image-2` の特定の `background` 値）を拒否することがあり、また特定の model
version でのみ公開する場合もあります。これらの違いは Azure と基盤モデルに由来するものであり、OpenClaw によるものではありません。Azure request が validation error で失敗した場合は、
Azure portal で、その特定の deployment と API version がサポートする
parameter set を確認してください。

<Note>
Azure OpenAI はネイティブ transport と compat 動作を使用しますが、
OpenClaw の hidden attribution header は受け取りません。詳しくは [高度な設定](#高度な設定) 配下の **Native vs OpenAI-compatible
routes** アコーディオンを参照してください。

Azure 上の chat または Responses トラフィック（画像生成以外）には、
onboarding flow または専用の Azure provider 設定を使ってください。`openai.baseUrl` だけでは
Azure API/auth shape は選択されません。別の
`azure-openai-responses/*` provider が存在します。詳しくは
以下の Server-side compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Transport（WebSocket vs SSE）">
    OpenClaw は、`openai/*` と `openai-codex/*` の両方で、WebSocket 優先 + SSE フォールバック（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は:
    - 早期の WebSocket failure を 1 回だけ再試行してから SSE にフォールバックする
    - failure の後、WebSocket を約 60 秒間 degraded とマークし、cool-down 中は SSE を使用する
    - retry と reconnect のために、安定した session と turn identity header を付与する
    - transport variant 間で usage counter（`input_tokens` / `prompt_tokens`）を正規化する

    | Value | Behavior |
    |-------|----------|
    | `"auto"`（デフォルト） | WebSocket 優先、SSE フォールバック |
    | `"sse"` | SSE のみを強制 |
    | `"websocket"` | WebSocket のみを強制 |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    関連する OpenAI docs:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw は、初回ターンのレイテンシを減らすため、`openai/*` と `openai-codex/*` でデフォルトで WebSocket warm-up を有効にします。

    ```json5
    // warm-up を無効化
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

  <Accordion title="Fast mode">
    OpenClaw は、`openai/*` と `openai-codex/*` に対して共有 fast-mode toggle を公開します。

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効化すると、OpenClaw は fast mode を OpenAI の priority processing（`service_tier = "priority"`）へマッピングします。既存の `service_tier` 値は保持され、fast mode は `reasoning` や `text.verbosity` を書き換えません。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    セッション上書きは config より優先されます。Sessions UI で session override をクリアすると、そのセッションは設定済みデフォルトへ戻ります。
    </Note>

  </Accordion>

  <Accordion title="Priority processing（service_tier）">
    OpenAI の API は `service_tier` による priority processing を公開しています。OpenClaw では model ごとに設定します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    対応値: `auto`, `default`, `flex`, `priority`。

    <Warning>
    `serviceTier` は、ネイティブ OpenAI endpoint（`api.openai.com`）とネイティブ Codex endpoint（`chatgpt.com/backend-api`）にのみ転送されます。いずれかの provider を proxy 経由でルーティングしている場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction（Responses API）">
    direct OpenAI Responses model（`api.openai.com` 上の `openai/*`）では、OpenAI Plugin の Pi-harness stream wrapper が server-side compaction を自動有効化します。

    - `store: true` を強制する（model compat が `supportsStore: false` を設定している場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入する
    - デフォルト `compact_threshold`: `contextWindow` の 70%（不明な場合は `80000`）

    これは、内蔵 Pi harness 経路と、embedded run に使われる OpenAI provider hook に適用されます。ネイティブ Codex app-server harness は Codex を通じて独自に context を管理し、`agents.defaults.embeddedHarness.runtime` で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換 endpoint で有用です:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="カスタム threshold">
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
    `responsesServerCompaction` が制御するのは `context_management` の注入だけです。direct OpenAI Responses model は、compat が `supportsStore: false` を設定しない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT モード">
    `openai/*` 上の GPT-5 ファミリー実行では、OpenClaw はより厳格な embedded execution contract を使用できます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は:
    - tool action が利用可能な場合に、plan-only turn を成功した進捗として扱わない
    - act-now steer を付けてターンを再試行する
    - 大きな作業には `update_plan` を自動有効化する
    - モデルが行動せず計画だけを続ける場合、明示的な blocked state を出す

    <Note>
    OpenAI と Codex の GPT-5 ファミリー実行にのみスコープされます。他の provider と古い model family はデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw は、direct OpenAI、Codex、および Azure OpenAI endpoint を、汎用の OpenAI-compatible `/v1` proxy と区別して扱います。

    **Native routes**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルに対してのみ `reasoning: { effort: "none" }` を維持する
    - `reasoning.effort: "none"` を拒否するモデルや proxy に対しては disabled reasoning を省略する
    - tool schema をデフォルトで strict mode にする
    - hidden attribution header は検証済み native host に対してのみ付与する
    - OpenAI 専用 request shaping（`service_tier`, `store`, reasoning-compat, prompt-cache hint）を維持する

    **Proxy/compatible routes:**
    - より緩い compat 動作を使う
    - 非ネイティブな `openai-completions` payload から Completions の `store` を除去する
    - OpenAI-compatible Completions proxy 向けに、高度な `params.extra_body`/`params.extraBody` の pass-through JSON を受け付ける
    - strict tool schema や native 専用 header は強制しない

    Azure OpenAI はネイティブ transport と compat 動作を使いますが、hidden attribution header は受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、および failover 動作の選択。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有 image tool parameter と provider selection。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有 video tool parameter と provider selection。
  </Card>
  <Card title="OAuth と auth" href="/ja-JP/gateway/authentication" icon="key">
    auth の詳細と credential 再利用ルール。
  </Card>
</CardGroup>
