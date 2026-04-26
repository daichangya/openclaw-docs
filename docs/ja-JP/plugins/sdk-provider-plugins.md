---
read_when:
    - 新しいモデルプロバイダーPluginを構築しています
    - OpenClawにOpenAI互換プロキシまたはカスタムLLMを追加したい場合
    - プロバイダーの認証、カタログ、およびランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw用のモデルプロバイダーPluginを構築するためのステップバイステップガイド
title: プロバイダーPluginの構築
x-i18n:
    generated_at: "2026-04-26T11:36:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

このガイドでは、OpenClawにモデルプロバイダー（LLM）を追加するプロバイダーPluginの構築手順を説明します。完了するころには、モデルカタログ、APIキー認証、動的モデル解決を備えたプロバイダーができあがります。

<Info>
  まだOpenClaw Pluginを一度も構築したことがない場合は、基本的なパッケージ構造とマニフェスト設定について、まず[はじめに](/ja-JP/plugins/building-plugins)を読んでください。
</Info>

<Tip>
  プロバイダーPluginは、OpenClawの通常の推論ループにモデルを追加します。モデルをスレッド、Compaction、またはツールイベントを管理するネイティブエージェントデーモン経由で実行する必要がある場合は、デーモンプロトコルの詳細をコアに入れるのではなく、プロバイダーを[agent harness](/ja-JP/plugins/sdk-agent-harness)と組み合わせてください。
</Tip>

## ウォークスルー

<Steps>
  <Step title="パッケージとマニフェスト">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    マニフェストでは`providerAuthEnvVars`を宣言します。これによりOpenClawは、Pluginランタイムを読み込まずに認証情報を検出できます。プロバイダーのバリアントが別のプロバイダーidの認証を再利用すべき場合は、`providerAuthAliases`を追加してください。`modelSupport`は任意で、ランタイムフックが存在する前に、`acme-large`のような短縮モデルidからOpenClawがプロバイダーPluginを自動ロードできるようにします。プロバイダーをClawHubで公開する場合、`package.json`ではこれらの`openclaw.compat`および`openclaw.build`フィールドが必須です。

  </Step>

  <Step title="プロバイダーを登録する">
    最小限のプロバイダーには、`id`、`label`、`auth`、`catalog`が必要です。

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    これで動作するプロバイダーになります。ユーザーは`openclaw onboard --acme-ai-api-key <key>`を実行し、モデルとして`acme-ai/acme-large`を選択できるようになります。

    アップストリームプロバイダーがOpenClawと異なる制御トークンを使用する場合は、ストリームパスを置き換えるのではなく、小さな双方向テキスト変換を追加してください。

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input`は、転送前に最終的なシステムプロンプトとテキストメッセージ内容を書き換えます。`output`は、OpenClawが独自の制御マーカーやチャンネル配信を解析する前に、アシスタントのテキスト差分と最終テキストを書き換えます。

    APIキー認証を持つ1つのテキストプロバイダーと、単一のcatalogベースのランタイムだけを登録するバンドル済みプロバイダーでは、より限定的な`defineSingleProviderPluginEntry(...)`ヘルパーを使うことをおすすめします。

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider`は、OpenClawが実際のプロバイダー認証を解決できるときに使われるライブカタログパスです。ここでは、プロバイダー固有の検出を実行してもかまいません。`buildStaticProvider`は、認証が設定される前に表示して安全なオフライン行にのみ使ってください。認証情報を必要としたり、ネットワークリクエストを行ったりしてはいけません。OpenClawの`models list --all`表示は、現在、バンドル済みプロバイダーPluginに対してのみ、空の設定、空のenv、エージェント/ワークスペースパスなしで静的カタログを実行します。

    認証フローでオンボーディング中に`models.providers.*`、エイリアス、エージェントのデフォルトモデルも更新する必要がある場合は、`openclaw/plugin-sdk/provider-onboard`のプリセットヘルパーを使用してください。最も限定的なヘルパーは、`createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)`、`createModelCatalogPresetAppliers(...)`です。

    プロバイダーのネイティブエンドポイントが通常の`openai-completions`転送上でストリーミングされた使用量ブロックをサポートしている場合は、プロバイダーidチェックをハードコードするのではなく、`openclaw/plugin-sdk/provider-catalog-shared`の共有catalogヘルパーを使ってください。`supportsNativeStreamingUsageCompat(...)`と`applyProviderNativeStreamingUsageCompat(...)`は、エンドポイント機能マップからサポートを検出するため、カスタムプロバイダーidを使っているPluginでも、ネイティブのMoonshot/DashScopeスタイルのエンドポイントは引き続きオプトインできます。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダーが任意のモデルidを受け入れる場合（プロキシやルーターなど）は、`resolveDynamicModel`を追加してください。

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップのために`prepareDynamicModel`を使用してください。完了後に`resolveDynamicModel`が再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する（必要に応じて）">
    ほとんどのプロバイダーでは、`catalog` + `resolveDynamicModel`だけで十分です。プロバイダーで必要になったものから、段階的にフックを追加してください。

    共有ヘルパービルダーは現在、最も一般的なリプレイ/ツール互換ファミリーをカバーしているため、通常、Pluginで各フックを1つずつ手動配線する必要はありません。

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    現在利用可能なリプレイファミリーは次のとおりです。

    | ファミリー | 配線される内容 | バンドル済みの例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI互換転送向けの共有OpenAIスタイルリプレイポリシー。tool-call-idのサニタイズ、assistant-first順序の修正、および転送で必要な場合の汎用Geminiターン検証を含みます | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId`によって選択されるClaude対応リプレイポリシー。これにより、Anthropicメッセージ転送は、解決されたモデルが実際にClaude idである場合にのみ、Claude固有のthinking-blockクリーンアップを受けます | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブGeminiリプレイポリシーに加えて、ブートストラップリプレイのサニタイズとタグ付きreasoning-outputモード | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI互換プロキシ転送を通じて実行されるGeminiモデル向けのGemini thought-signatureサニタイズ。ネイティブGeminiリプレイ検証やブートストラップ書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1つのPlugin内でAnthropicメッセージ面とOpenAI互換モデル面を混在させるプロバイダー向けのハイブリッドポリシー。任意のClaude限定thinking-block除去はAnthropic側に限定されたままです | `minimax` |

    現在利用可能なストリームファミリー:

    | ファミリー | 配線される内容 | バンドル済みの例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパス上でのGemini thinkingペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパス上でのKilo reasoningラッパー。`kilo/auto`および未対応のプロキシreasoning idでは、注入されたthinkingをスキップします | `kilocode` |
    | `moonshot-thinking` | 設定と`/think`レベルからのMoonshotバイナリnative-thinkingペイロードマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパス上でのMiniMax fast-modeモデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブOpenAI/Codex Responsesラッパー: attributionヘッダー、`/fast`/`serviceTier`、text verbosity、ネイティブCodex web search、reasoning互換ペイロード整形、およびResponsesコンテキスト管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | プロキシルート向けのOpenRouter reasoningラッパー。未対応モデルや`auto`のスキップは中央で処理されます | `openrouter` |
    | `tool-stream-default-on` | Z.AIのように、明示的に無効化されない限りツールストリーミングを有効にしたいプロバイダー向けの、デフォルト有効の`tool_stream`ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支えるSDKシーム">
      各ファミリービルダーは、同じパッケージからエクスポートされる、より低レベルな公開ヘルパーで構成されています。プロバイダーが共通パターンから外れる必要がある場合は、それらを利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および生のリプレイビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Geminiリプレイヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と、エンドポイント/モデルヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、さらに共有OpenAI/Codexラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、および共有プロキシ/プロバイダーラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、基盤となるGeminiスキーマヘルパー（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`）、およびxAI互換ヘルパー（`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`）。バンドル済みのxAI Pluginは、`normalizeResolvedModel` + `contributeResolvedModelCompat`とこれらを組み合わせ、xAIルールの所有権をプロバイダー側に保っています。

      一部のストリームヘルパーは、意図的にプロバイダー固有のままにされています。`@openclaw/anthropic-provider`は、Claude OAuthベータ処理と`context1m`ゲーティングをエンコードしているため、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、およびより低レベルのAnthropicラッパービルダーを、自身の公開`api.ts` / `contract-api.ts`シーム内に保持しています。同様にxAI Pluginも、ネイティブxAI Responses整形を自身の`wrapStreamFn`内に保持しています（`/fast`エイリアス、デフォルトの`tool_stream`、未対応のstrict-toolクリーンアップ、xAI固有のreasoning-payload削除）。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、default-modelヘルパー、realtimeプロバイダービルダー）および`@openclaw/openrouter-provider`（プロバイダービルダーとオンボーディング/設定ヘルパー）も支えています。
    </Accordion>

    <Tabs>
      <Tab title="トークン交換">
        各推論呼び出しの前にトークン交換が必要なプロバイダーの場合:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="カスタムヘッダー">
        カスタムリクエストヘッダーやボディ変更が必要なプロバイダーの場合:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="ネイティブ転送アイデンティティ">
        汎用HTTPまたはWebSocket転送上で、ネイティブのリクエスト/セッションヘッダーやメタデータが必要なプロバイダーの場合:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="使用量と課金">
        使用量/課金データを公開するプロバイダーの場合:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="利用可能なすべてのプロバイダーフック">
      OpenClawはこの順序でフックを呼び出します。ほとんどのプロバイダーで使用するのは2〜3個だけです。

      | # | フック | 使用するタイミング |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはbase URLデフォルト |
      | 2 | `applyConfigDefaults` | configマテリアライズ時の、プロバイダー所有のグローバルデフォルト |
      | 3 | `normalizeModelId` | ルックアップ前のレガシー/プレビューmodel-idエイリアスクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前の、プロバイダーファミリー`api` / `baseUrl`クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` configの正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | configプロバイダー向けのネイティブstreaming-usage互換書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有のenv-marker認証解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたはconfigベースの合成認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 合成の保存済みプロファイルプレースホルダーをenv/config認証より後ろに下げる |
      | 10 | `resolveDynamicModel` | 任意のアップストリームモデルIDを受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | ランナー前の転送書き換え |
      | 13 | `contributeResolvedModelCompat` | 別の互換転送の背後にあるベンダーモデル向けの互換フラグ |
      | 14 | `capabilities` | レガシーな静的capabilityバッグ。互換性用のみ |
      | 15 | `normalizeToolSchemas` | 登録前の、プロバイダー所有のツールスキーマクリーンアップ |
      | 16 | `inspectToolSchemas` | プロバイダー所有のツールスキーマ診断 |
      | 17 | `resolveReasoningOutputMode` | タグ付きかネイティブかのreasoning-output契約 |
      | 18 | `prepareExtraParams` | デフォルトのリクエストパラメーター |
      | 19 | `createStreamFn` | 完全にカスタムなStreamFn転送 |
      | 20 | `wrapStreamFn` | 通常のストリームパス上でのカスタムヘッダー/ボディラッパー |
      | 21 | `resolveTransportTurnState` | ネイティブなターンごとのヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブWSセッションヘッダー/クールダウン |
      | 23 | `formatApiKey` | カスタムランタイムトークン形状 |
      | 24 | `refreshOAuth` | カスタムOAuth更新 |
      | 25 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 26 | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | 27 | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷分類 |
      | 28 | `isCacheTtlEligible` | プロンプトキャッシュTTLゲーティング |
      | 29 | `buildMissingAuthMessage` | カスタムの認証不足ヒント |
      | 30 | `suppressBuiltInModel` | 古くなったアップストリーム行を隠す |
      | 31 | `augmentModelCatalog` | 合成のforward-compat行 |
      | 32 | `resolveThinkingProfile` | モデル固有の`/think`オプションセット |
      | 33 | `isBinaryThinking` | バイナリthinkingオン/オフ互換性 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoningサポート互換性 |
      | 35 | `resolveDefaultThinkingLevel` | デフォルト`/think`ポリシー互換性 |
      | 36 | `isModernModelRef` | ライブ/スモークモデルマッチング |
      | 37 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 38 | `resolveUsageAuth` | カスタム使用量認証情報の解析 |
      | 39 | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | 40 | `createEmbeddingProvider` | メモリ/検索向けのプロバイダー所有embeddingアダプター |
      | 41 | `buildReplayPolicy` | カスタムのトランスクリプトリプレイ/Compactionポリシー |
      | 42 | `sanitizeReplayHistory` | 汎用クリーンアップ後の、プロバイダー固有リプレイ書き換え |
      | 43 | `validateReplayTurns` | 埋め込みランナー前の厳密なリプレイターン検証 |
      | 44 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      ランタイムフォールバックに関する注意:

      - `normalizeConfig`は、まず一致したプロバイダーを確認し、その後、実際にconfigを変更するものが見つかるまで、他のフック対応プロバイダーPluginを確認します。どのプロバイダーフックもサポートされているGoogleファミリーconfigエントリーを書き換えない場合でも、バンドル済みのGoogle config normalizerは引き続き適用されます。
      - `resolveConfigApiKey`は、公開されていればプロバイダーフックを使用します。バンドル済みの`amazon-bedrock`パスにも、ここに組み込みのAWS env-marker resolverがあります。ただし、Bedrockランタイム認証自体は依然としてAWS SDKデフォルトチェーンを使用します。
      - `resolveSystemPromptContribution`により、プロバイダーはモデルファミリー向けにキャッシュ対応のシステムプロンプトガイダンスを注入できます。動作が1つのプロバイダー/モデルファミリーに属し、安定/動的キャッシュ分割を維持すべき場合は、`before_prompt_build`よりこちらを優先してください。

      詳細な説明と実例については、[Internals: Provider Runtime Hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を追加する（任意）">
    プロバイダーPluginは、テキスト推論に加えて、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、web fetch、web searchを登録できます。OpenClawでは、これを**hybrid-capability** Pluginとして分類します。これは企業向けPlugin（ベンダーごとに1つのPlugin）に推奨されるパターンです。詳しくは、[Internals: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model)を参照してください。

    既存の`api.registerProvider(...)`呼び出しと並べて、各capabilityを`register(api)`内で登録します。必要なタブだけ選んでください。

    <Tabs>
      <Tab title="音声（TTS）">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        プロバイダーHTTP障害には`assertOkOrThrowProviderError(...)`を使用してください。これにより、Plugin間で、上限付きのエラーボディ読み取り、JSONエラー解析、およびrequest-idサフィックスを共有できます。
      </Tab>
      <Tab title="リアルタイム文字起こし">
        `createRealtimeTranscriptionWebSocketSession(...)`を優先してください。この共有ヘルパーは、プロキシキャプチャ、再接続バックオフ、クローズ時フラッシュ、readyハンドシェイク、音声キューイング、およびクローズイベント診断を処理します。Plugin側ではアップストリームイベントをマッピングするだけです。

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        multipart音声をPOSTするバッチSTTプロバイダーは、`openclaw/plugin-sdk/provider-http`の`buildAudioTranscriptionFormData(...)`を使用してください。このヘルパーはアップロードファイル名を正規化し、互換性のある文字起こしAPIでM4A形式のファイル名が必要なAACアップロードも含めて処理します。
      </Tab>
      <Tab title="リアルタイム音声">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
      </Tab>
      <Tab title="メディア理解">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="画像と動画の生成">
        動画capabilityは**mode-aware**な形状を使用します: `generate`、`imageToVideo`、`videoToVideo`。`maxInputImages` / `maxInputVideos` / `maxDurationSeconds`のようなフラットな集約フィールドだけでは、変換モード対応や無効なモードを明確に示すには不十分です。音楽生成も同じパターンに従い、明示的な`generate` / `edit`ブロックを使用します。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetchとsearch">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Acmeのレンダリングバックエンドを通してページを取得します。",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Acme Fetchを通してページを取得します。",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="テスト">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## ClawHubに公開する

プロバイダーPluginは、他の外部コードPluginと同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここではレガシーなskill専用publishエイリアスは使用しないでください。Pluginパッケージでは`clawhub package publish`を使用する必要があります。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # プロバイダー認証metadataを含むマニフェスト
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # 使用量エンドポイント（任意）
```

## catalog順序リファレンス

`catalog.order`は、組み込みプロバイダーに対して相対的に、カタログをいつマージするかを制御します。

| 順序 | タイミング | 使用例 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス    | プレーンなAPIキープロバイダー                         |
| `profile` | `simple`の後  | 認証プロファイルでゲートされるプロバイダー                |
| `paired`  | `profile`の後 | 関連する複数エントリーを合成する             |
| `late`    | 最後のパス     | 既存のプロバイダーを上書きする（競合時に優先） |

## 次のステップ

- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — Pluginがチャンネルも提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime`ヘルパー（TTS、search、subagent）
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Plugin Internals](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) — フックの詳細とバンドル済みの例

## 関連

- [Plugin SDKセットアップ](/ja-JP/plugins/sdk-setup)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [チャンネルPluginの構築](/ja-JP/plugins/sdk-channel-plugins)
