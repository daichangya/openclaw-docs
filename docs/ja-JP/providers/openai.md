---
read_when:
    - OpenClawでOpenAIモデルを使いたい
    - APIキーではなくCodexサブスクリプション認証を使いたい
    - より厳格なGPT-5 agent実行動作が必要だ
summary: OpenClawでAPIキーまたはCodexサブスクリプションを使ってOpenAIを利用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T09:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAIはGPTモデル向けのdeveloper APIを提供しています。OpenClawは3つのOpenAI系ルートをサポートしています。model prefixでルートを選択します:

- **API key** — 従量課金の直接OpenAI Platformアクセス（`openai/*` models）
- **PI経由のCodex subscription** — subscription access付きのChatGPT/Codexサインイン（`openai-codex/*` models）
- **Codex app-server harness** — ネイティブCodex app-server実行（`openai/*` modelsと`agents.defaults.embeddedHarness.runtime: "codex"`）

OpenAIは、OpenClawのような外部toolやworkflowでのsubscription OAuth利用を明示的にサポートしています。

<Note>
GPT-5.5は現在、OpenClawでsubscription/OAuthルートを通じて利用できます:
`openai-codex/gpt-5.5`をPI runnerで使うか、`openai/gpt-5.5`を
Codex app-server harnessで使います。`openai/gpt-5.5`への直接API-keyアクセスは、
OpenAIが公開APIでGPT-5.5を有効にした時点でサポートされます。それまでは
`OPENAI_API_KEY`構成では`openai/gpt-5.4`のようなAPI対応modelを使ってください。
</Note>

<Note>
OpenAI pluginを有効にしたり、`openai-codex/*` modelを選択したりしても、
bundled Codex app-server pluginは有効になりません。OpenClawがそのpluginを有効にするのは、
`embeddedHarness.runtime: "codex"`でネイティブCodex harnessを明示的に選択した場合、
またはlegacyの`codex/*` model refを使った場合だけです。
</Note>

## OpenClawの機能対応状況

| OpenAI capability         | OpenClaw surface                                           | 状態                                                   |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>` model provider                            | はい                                                   |
| Codex subscription models | `openai-codex/<model>`と`openai-codex` OAuth              | はい                                                   |
| Codex app-server harness  | `openai/<model>`と`embeddedHarness.runtime: codex`         | はい                                                   |
| サーバー側Web検索         | ネイティブOpenAI Responses tool                            | はい、Web検索が有効でprovider固定がない場合            |
| 画像                      | `image_generate`                                           | はい                                                   |
| 動画                      | `video_generate`                                           | はい                                                   |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | はい                                                   |
| バッチspeech-to-text      | `tools.media.audio` / media understanding                  | はい                                                   |
| ストリーミングspeech-to-text | Voice Call `streaming.provider: "openai"`               | はい                                                   |
| リアルタイム音声          | Voice Call `realtime.provider: "openai"` / Control UI Talk | はい                                                   |
| Embeddings                | memory embedding provider                                  | はい                                                   |

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **最適な用途:** 直接APIアクセスと従量課金。

    <Steps>
      <Step title="API keyを取得する">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys)でAPI keyを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、keyを直接渡します:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="modelが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | ルート | 認証 |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 直接OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | OpenAIがGPT-5.5をAPIで有効化した後の将来の直接APIルート | `OPENAI_API_KEY` |

    <Note>
    `openai/*`は、Codex app-server harnessを明示的に強制しない限り、直接のOpenAI API-keyルートです。
    GPT-5.5自体は現在subscription/OAuth専用です。デフォルトのPI runner経由のCodex OAuthには
    `openai-codex/*`を使ってください。
    </Note>

    ### config例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClawは**`openai/gpt-5.3-codex-spark`を公開していません**。実際のOpenAI API requestではそのmodelは拒否され、現在のCodex catalogでも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適な用途:** 別個のAPI keyではなく、ChatGPT/Codex subscriptionを使う場合。Codex cloudにはChatGPTサインインが必要です。

    <Steps>
      <Step title="Codex OAuthを実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuthを直接実行します:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        headless環境やcallbackに不向きな構成では、`--device-code`を追加して、localhost browser callbackの代わりにChatGPT device-code flowでサインインします:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="デフォルトmodelを設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="modelが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | ルート | 認証 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | PI経由のChatGPT/Codex OAuth | Codexサインイン |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server認証 |

    <Note>
    認証/profile commandでは引き続き`openai-codex` provider idを使ってください。
    `openai-codex/*` model prefixは、Codex OAuth用の明示的なPIルートでもあります。
    これはbundled Codex app-server harnessを選択したり自動有効化したりしません。
    </Note>

    ### config例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    オンボーディングは、`~/.codex`からOAuth素材をインポートしなくなりました。browser OAuth（デフォルト）または上記のdevice-code flowでサインインしてください。OpenClawは生成された認証情報を自前のagent auth storeで管理します。
    </Note>

    ### ステータス表示

    Chatの`/status`は、現在のsessionでどのembedded harnessが有効かを表示します。デフォルトのPI harnessは`Runner: pi (embedded)`と表示され、別個のbadgeは追加されません。bundled Codex app-server harnessが選択されている場合、`/status`は`Fast`の横にPIではないharness idを追加します。たとえば`Fast · codex`です。既存のsessionは記録されたharness idを保持するため、新しいPI/Codex選択を`/status`に反映させたい場合は、`embeddedHarness`変更後に`/new`または`/reset`を使ってください。

    ### context window cap

    OpenClawは、model metadataとruntime context capを別の値として扱います。

    Codex OAuth経由の`openai-codex/gpt-5.5`では:

    - ネイティブ`contextWindow`: `1000000`
    - デフォルトruntime `contextTokens` cap: `272000`

    実運用では、このより小さいデフォルトcapのほうがレイテンシと品質の特性が良好です。`contextTokens`で上書きできます:

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
    `contextWindow`はネイティブmodel metadataの宣言に使ってください。`contextTokens`はruntime context budgetを制限するために使ってください。
    </Note>

  </Tab>
</Tabs>

## 画像生成

bundledの`openai` pluginは、`image_generate` toolを通じて画像生成を登録します。
これは、OpenAI API-key画像生成とCodex OAuth画像生成の両方を、同じ
`openai/gpt-image-2` model refを通じてサポートします。

| Capability                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 認証                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuthサインイン         |
| Transport                 | OpenAI Images API                  | Codex Responses backend              |
| 1 requestあたりの最大画像数 | 4                                | 4                                    |
| 編集モード                | 有効（最大5枚の参照画像まで）      | 有効（最大5枚の参照画像まで）        |
| サイズ上書き              | サポート、2K/4Kサイズを含む        | サポート、2K/4Kサイズを含む          |
| アスペクト比 / 解像度     | OpenAI Images APIには転送されない  | 安全な場合は対応サイズにマップされる |

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
共有tool parameter、provider選択、フェイルオーバー動作については[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

`gpt-image-2`は、OpenAIのtext-to-image生成と画像編集の両方でデフォルトです。
`gpt-image-1`も明示的なmodel overrideとして引き続き使えますが、新しい
OpenAI画像workflowでは`openai/gpt-image-2`を使ってください。

Codex OAuth構成でも、同じ`openai/gpt-image-2` refを使ってください。
`openai-codex` OAuth profileが設定されている場合、OpenClawは保存済みOAuth
access tokenを解決し、Codex Responses backend経由で画像requestを送信します。
そのrequestに対して最初に`OPENAI_API_KEY`を試したり、暗黙にAPI keyへフォールバックしたりはしません。
直接のOpenAI Images APIルートを使いたい場合は、`models.providers.openai`を
API key、custom base URL、またはAzure endpoint付きで明示的に設定してください。
そのcustom image endpointが信頼済みLAN/プライベートアドレス上にある場合は、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`も設定してください。
このopt-inがない限り、OpenClawはプライベート/内部のOpenAI互換画像endpointをブロックしたままにします。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

編集:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 動画生成

bundledの`openai` pluginは、`video_generate` toolを通じて動画生成を登録します。

| Capability       | 値                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトmodel  | `openai/sora-2`                                                                   |
| モード           | text-to-video、image-to-video、single-video edit                                  |
| 参照入力         | 1つの画像または1つの動画                                                          |
| サイズ上書き     | サポート                                                                          |
| その他の上書き   | `aspectRatio`、`resolution`、`audio`、`watermark`はtool warning付きで無視される |

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
共有tool parameter、provider選択、フェイルオーバー動作については[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

## GPT-5 prompt contribution

OpenClawは、providerをまたぐGPT-5系run向けに共有のGPT-5 prompt contributionを追加します。これはmodel idに基づいて適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.4`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、および他の互換GPT-5 refは同じoverlayを受け取ります。古いGPT-4.x modelは対象ではありません。

bundledのネイティブCodex harnessは、Codex app-server developer instructionsを通じて同じGPT-5動作とHeartbeat overlayを使用するため、`embeddedHarness.runtime: "codex"`で強制された`openai/gpt-5.x` sessionでも、harness promptの残りをCodexが所有していても、同じフォロースルーと先回りしたHeartbeatガイダンスが維持されます。

GPT-5 contributionは、persona persistence、execution safety、tool discipline、output shape、completion check、およびverification向けのタグ付きbehavior contractを追加します。channel固有のreplyおよびsilent-message動作は、共有のOpenClaw system promptとoutbound delivery policy側に残ります。GPT-5 guidanceは、一致するmodelに対して常に有効です。friendly interaction-style layerは分離されており、設定可能です。

| Value                  | 効果                                        |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | friendly interaction-style layerを有効化    |
| `"on"`                 | `"friendly"`のエイリアス                    |
| `"off"`                | friendly style layerのみを無効化            |

<Tabs>
  <Tab title="Config">
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
値はランタイムでは大文字小文字を区別しないため、`"Off"`でも`"off"`でもfriendly style layerは無効になります。
</Tip>

<Note>
legacyの`plugins.entries.openai.config.personality`は、共有の`agents.defaults.promptOverlays.gpt5.personality`設定が未設定の場合、互換性のためのfallbackとして引き続き読み取られます。
</Note>

## 音声とspeech

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    bundledの`openai` pluginは、`messages.tts` surface向けに音声合成を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | (未設定) |
    | Instructions | `messages.tts.providers.openai.instructions` | (未設定、`gpt-4o-mini-tts`のみ) |
    | Format | `messages.tts.providers.openai.responseFormat` | voice noteでは`opus`、fileでは`mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY`にフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能なmodel: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能なvoice: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

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
    chat API endpointに影響を与えずにTTS base URLを上書きするには、`OPENAI_TTS_BASE_URL`を設定してください。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    bundledの`openai` pluginは、
    OpenClawのmedia-understanding transcription surfaceを通じてバッチspeech-to-textを登録します。

    - デフォルトmodel: `gpt-4o-transcribe`
    - endpoint: OpenAI REST `/v1/audio/transcriptions`
    - 入力path: multipart audio file upload
    - OpenClawでは、受信音声のtranscriptionが
      `tools.media.audio`を使う場所すべてでサポートされます。これにはDiscord voice-channel segmentやchannel
      audio attachmentが含まれます

    受信音声transcriptionでOpenAIを強制するには:

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

    言語およびprompt hintは、共有audio media configまたは呼び出しごとのtranscription requestで指定された場合、OpenAIに転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    bundledの`openai` pluginは、Voice Call plugin向けにリアルタイム文字起こしを登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | (未設定) |
    | Prompt | `...openai.prompt` | (未設定) |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY`にフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime`へのWebSocket接続と、G.711 u-law（`g711_ulaw` / `audio/pcmu`）audioを使用します。このstreaming providerはVoice Callのリアルタイム文字起こしpath向けです。Discord voiceは現在、短いsegmentを録音し、代わりにバッチの`tools.media.audio` transcription pathを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    bundledの`openai` pluginは、Voice Call plugin向けにリアルタイム音声を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY`にフォールバック |

    <Note>
    `azureEndpoint`および`azureDeployment` config keyを通じてAzure OpenAIをサポートします。双方向tool callingをサポートします。G.711 u-law audio formatを使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoint

bundledの`openai` providerは、base URLを上書きすることでAzure OpenAI resourceを画像生成先として指定できます。画像生成pathでは、OpenClawは`models.providers.openai.baseUrl`上のAzure hostnameを検出し、自動的にAzureのrequest shapeへ切り替えます。

<Note>
リアルタイム音声は別のconfig path
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`）
を使用し、`models.providers.openai.baseUrl`の影響を受けません。Azure
設定については、[音声とspeech](#voice-and-speech)配下の**リアルタイム音声**アコーディオンを参照してください。
</Note>

次の場合はAzure OpenAIを使用してください:

- すでにAzure OpenAI subscription、quota、またはenterprise agreementを持っている
- Azureが提供する地域データレジデンシーやcompliance controlが必要
- トラフィックを既存のAzure tenancy内に留めたい

### 設定

bundledの`openai` providerを通じてAzure画像生成を使うには、
`models.providers.openai.baseUrl`をAzure resourceに向け、`apiKey`に
OpenAI Platform keyではなくAzure OpenAI keyを設定します:

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

OpenClawは、Azure画像生成ルート向けに次のAzure host suffixを認識します:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識されたAzure hostでの画像生成requestでは、OpenClawは次のように動作します:

- `Authorization: Bearer`の代わりに`api-key` headerを送信する
- deploymentスコープのpath（`/openai/deployments/{deployment}/...`）を使う
- 各requestに`?api-version=...`を追加する

その他のbase URL（公開OpenAI、OpenAI互換proxy）では、標準の
OpenAI画像request shapeが維持されます。

<Note>
`openai` providerの画像生成pathに対するAzure routingには、
OpenClaw 2026.4.22以降が必要です。以前のversionでは、custom
`openai.baseUrl`はすべて公開OpenAI endpointのように扱われ、Azure
画像deploymentでは失敗します。
</Note>

### API version

Azure画像生成path向けに特定のAzure previewまたはGA versionを固定するには、
`AZURE_OPENAI_API_VERSION`を設定します:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合のデフォルトは`2024-12-01-preview`です。

### model名はdeployment名

Azure OpenAIはmodelをdeploymentにバインドします。bundledの`openai`
providerを経由するAzure画像生成requestでは、OpenClaw内の`model`
fieldは、公開OpenAI model idではなく、Azure portalで設定した**Azure deployment名**でなければなりません。

`gpt-image-2`を提供する`gpt-image-2-prod`というdeploymentを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じdeployment名ルールが、bundledの`openai` providerを経由する画像生成呼び出しにも適用されます。

### 地域ごとの利用可能性

Azure画像生成は現在、一部のregionでのみ利用可能です
（たとえば`eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。deploymentを作成する前にMicrosoftの最新region一覧を確認し、特定のmodelがそのregionで提供されていることを確認してください。

### パラメータの違い

Azure OpenAIと公開OpenAIが常に同じ画像パラメータを受け付けるとは限りません。
Azureは、公開OpenAIでは許可されるオプション（たとえば
`gpt-image-2`の特定の`background`値）を拒否したり、特定のmodel
versionでのみ公開したりすることがあります。これらの違いはAzureと基盤modelに由来するものであり、OpenClawによるものではありません。Azure requestがvalidation errorで失敗した場合は、Azure portalで、使用している特定のdeploymentとAPI versionがサポートするパラメータセットを確認してください。

<Note>
Azure OpenAIはネイティブtransportとcompat behaviorを使用しますが、
OpenClawのhidden attribution headerは受け取りません。これは
[Advanced configuration](#advanced-configuration)配下の**Native vs OpenAI-compatible
routes**アコーディオンを参照してください。

Azure上のchatまたはResponsesトラフィック（画像生成以外）については、
オンボーディングフローまたは専用のAzure provider configを使用してください。`openai.baseUrl`だけではAzure API/auth shapeは選択されません。別個の
`azure-openai-responses/*` providerが存在します。以下のServer-side compactionアコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Transport（WebSocket vs SSE）">
    OpenClawは、`openai/*`と`openai-codex/*`の両方に対して、SSE fallback付きのWebSocket優先（`"auto"`）を使用します。

    `"auto"` modeでは、OpenClawは次のように動作します:
    - 初期のWebSocket failureを1回再試行してからSSEにfallbackする
    - failure後、WebSocketを約60秒間degradedとしてマークし、cool-down中はSSEを使用する
    - retryとreconnectのために安定したsessionおよびturn identity headerを付与する
    - transport variantをまたいでusage counter（`input_tokens` / `prompt_tokens`）を正規化する

    | Value | 動作 |
    |-------|----------|
    | `"auto"` (default) | WebSocket優先、SSE fallback |
    | `"sse"` | SSEのみを強制 |
    | `"websocket"` | WebSocketのみを強制 |

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

    関連するOpenAIドキュメント:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClawは、初回turnのレイテンシを減らすために、`openai/*`と`openai-codex/*`でデフォルトでWebSocket warm-upを有効にします。

    ```json5
    // warm-upを無効化
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
    OpenClawは、`openai/*`と`openai-codex/*`向けに共有のfast-modeトグルを公開しています:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClawはfast modeをOpenAIのpriority processing（`service_tier = "priority"`）にマップします。既存の`service_tier`値は保持され、fast modeは`reasoning`や`text.verbosity`を書き換えません。

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
    session overrideはconfigより優先されます。Sessions UIでsession overrideをクリアすると、そのsessionは設定済みデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAIのAPIは、`service_tier`を通じてpriority processingを公開しています。OpenClawではmodelごとに設定します:

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

    サポートされる値: `auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier`は、ネイティブOpenAI endpoint（`api.openai.com`）とネイティブCodex endpoint（`chatgpt.com/backend-api`）にのみ転送されます。どちらかのproviderをproxy経由にした場合、OpenClawは`service_tier`をそのままにして変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側Compaction (Responses API)">
    直接のOpenAI Responses model（`api.openai.com`上の`openai/*`）では、OpenAI pluginのPi-harness stream wrapperが自動的にサーバー側Compactionを有効にします:

    - `store: true`を強制する（model compatで`supportsStore: false`が設定されている場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]`を注入する
    - デフォルトの`compact_threshold`: `contextWindow`の70%（利用できない場合は`80000`）

    これは組み込みのPi harness pathと、embedded runで使われるOpenAI provider hookに適用されます。ネイティブCodex app-server harnessは、Codexを通じて自前でcontextを管理し、`agents.defaults.embeddedHarness.runtime`で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responsesのような互換endpointで有用です:

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
      <Tab title="カスタムthreshold">
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
    `responsesServerCompaction`が制御するのは`context_management`の注入だけです。直接のOpenAI Responses modelは、compatで`supportsStore: false`が設定されていない限り、引き続き`store: true`を強制します。
    </Note>

  </Accordion>

  <Accordion title="厳格agentic GPT mode">
    `openai/*`上のGPT-5系runでは、OpenClawはより厳格なembedded execution contractを使用できます:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic`では、OpenClawは次のように動作します:
    - tool actionが利用可能なとき、plan-only turnを成功した進捗として扱わなくなる
    - act-now steer付きでturnを再試行する
    - 重要な作業では`update_plan`を自動有効化する
    - modelが行動せずに計画し続ける場合、明示的なblocked stateを表示する

    <Note>
    OpenAIおよびCodexのGPT-5系runのみにスコープされます。その他のproviderと古いmodel系統はデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="ネイティブ vs OpenAI互換ルート">
    OpenClawは、直接のOpenAI、Codex、Azure OpenAI endpointを、汎用のOpenAI互換`/v1` proxyとは異なる扱いにします:

    **ネイティブルート**（`openai/*`、Azure OpenAI）:
    - OpenAIの`none` effortをサポートするmodelに対してのみ`reasoning: { effort: "none" }`を維持する
    - `reasoning.effort: "none"`を拒否するmodelまたはproxyでは、無効化されたreasoningを省略する
    - tool schemaをデフォルトでstrict modeにする
    - hidden attribution headerは検証済みネイティブhostにのみ付与する
    - OpenAI専用のrequest shaping（`service_tier`、`store`、reasoning-compat、prompt-cache hint）を維持する

    **proxy/互換ルート:**
    - より緩いcompat behaviorを使う
    - strict tool schemaやネイティブ専用headerを強制しない

    Azure OpenAIはネイティブtransportとcompat behaviorを使用しますが、hidden attribution headerは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像tool parameterとprovider選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画tool parameterとprovider選択。
  </Card>
  <Card title="OAuthと認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細とcredential再利用ルール。
  </Card>
</CardGroup>
