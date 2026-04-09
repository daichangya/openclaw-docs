---
read_when:
    - 新しいモデルprovider pluginを構築している
    - OpenClawにOpenAI互換プロキシまたはカスタムLLMを追加したい
    - provider認証、catalog、およびruntime hookを理解する必要がある
sidebarTitle: Provider Plugins
summary: OpenClaw向けモデルprovider pluginを構築するためのステップバイステップガイド
title: Provider Pluginsの構築
x-i18n:
    generated_at: "2026-04-09T01:31:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38d9af522dc19e49c81203a83a4096f01c2398b1df771c848a30ad98f251e9e1
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Provider Pluginsの構築

このガイドでは、OpenClawにモデルprovider
（LLM）を追加するprovider pluginの構築手順を説明します。最後には、モデルcatalog、APIキー認証、動的モデル解決を備えたproviderが完成します。

<Info>
  まだOpenClawプラグインを1つも作成したことがない場合は、まず
  基本的なパッケージ構造とマニフェスト設定について
  [はじめに](/ja-JP/plugins/building-plugins)を読んでください。
</Info>

## 手順

<Steps>
  <a id="step-1-package-and-manifest"></a>
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

    マニフェストでは`providerAuthEnvVars`を宣言することで、OpenClawが
    プラグインruntimeを読み込まずに認証情報を検出できるようになります。providerの派生形が別のprovider idの認証を再利用する場合は、`providerAuthAliases`を追加してください。`modelSupport`は任意で、runtime hookが存在する前でも、`acme-large`のような短縮model idからOpenClawがprovider pluginを自動読み込みできるようにします。providerをClawHubで公開する場合、`package.json`内のそれらの`openclaw.compat`および`openclaw.build`フィールドは必須です。

  </Step>

  <Step title="providerを登録する">
    最小限のproviderには、`id`、`label`、`auth`、および`catalog`が必要です。

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

    これで動作するproviderになります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    モデルとして`acme-ai/acme-large`を選択できるようになります。

    APIキー認証を持つ1つのテキストproviderと、catalogベースの単一runtimeだけを登録する同梱providerでは、より狭い
    `defineSingleProviderPluginEntry(...)`ヘルパーを使うのが適しています。

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
        },
      },
    });
    ```

    認証フローで、オンボーディング中に`models.providers.*`、エイリアス、およびagentのデフォルトモデルも更新する必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard`のpreset helperを使ってください。最も狭いhelperは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)`です。

    providerのネイティブendpointが通常の
    `openai-completions` transport上でストリーミングusage blockをサポートしている場合は、provider-idのチェックをハードコードするのではなく、
    `openclaw/plugin-sdk/provider-catalog-shared`の共有catalog helperを優先して使ってください。`supportsNativeStreamingUsageCompat(...)`と
    `applyProviderNativeStreamingUsageCompat(...)`はendpoint capability mapからサポートを検出するため、カスタムprovider idを使っているpluginでも、ネイティブのMoonshot/DashScope系endpointをオプトインできます。

  </Step>

  <Step title="動的モデル解決を追加する">
    providerが任意のmodel ID（プロキシやrouterのようなもの）を受け付ける場合は、
    `resolveDynamicModel`を追加してください。

    ```typescript
    api.registerProvider({
      // ... 上記の id, label, auth, catalog

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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップ用に
    `prepareDynamicModel`を使ってください。完了後に
    `resolveDynamicModel`が再び実行されます。

  </Step>

  <Step title="runtime hookを追加する（必要に応じて）">
    ほとんどのproviderでは`catalog` + `resolveDynamicModel`だけで十分です。providerに必要な場合にのみ、段階的にhookを追加してください。

    共有helper builderが現在、最も一般的なreplay/tool-compatファミリーをカバーしているため、通常pluginは各hookを1つずつ手作業で配線する必要はありません。

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

    現在利用可能なreplayファミリー:

    | Family | 配線される内容 |
    | --- | --- |
    | `openai-compatible` | OpenAI互換transport向けの共有OpenAIスタイルreplayポリシー。tool-call-idのサニタイズ、assistant-first順序修正、transportが必要とする場合の汎用Geminiターン検証を含みます |
    | `anthropic-by-model` | `modelId`で選択されるClaude対応replayポリシー。Anthropic message transportでは、解決されたモデルが実際にClaude idである場合にのみ、Claude固有のthinking blockクリーンアップを適用します |
    | `google-gemini` | ネイティブGemini replayポリシーに加え、bootstrap replayサニタイズとタグ付きreasoning-outputモード |
    | `passthrough-gemini` | OpenAI互換proxy transport経由で動作するGeminiモデル向けのGemini thought-signatureサニタイズ。ネイティブGemini replay検証やbootstrap書き換えは有効にしません |
    | `hybrid-anthropic-openai` | 1つのplugin内でAnthropic message系とOpenAI互換model surfaceが混在するprovider向けハイブリッドポリシー。任意のClaude専用thinking block削除はAnthropic側に限定されたままです |

    実際の同梱例:

    - `google` および `google-gemini-cli`: `google-gemini`
    - `openrouter`、`kilocode`、`opencode`、および `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` および `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai`、および `zai`: `openai-compatible`

    現在利用可能なstreamファミリー:

    | Family | 配線される内容 |
    | --- | --- |
    | `google-thinking` | 共有streamパス上でのGemini thinkingペイロード正規化 |
    | `kilocode-thinking` | 共有proxy streamパス上でのKilo reasoningラッパー。`kilo/auto`および未対応proxy reasoning idでは注入thinkingをスキップします |
    | `moonshot-thinking` | config + `/think`レベルからのMoonshotバイナリnative-thinkingペイロードマッピング |
    | `minimax-fast-mode` | 共有streamパス上でのMiniMax fast-modeモデル書き換え |
    | `openai-responses-defaults` | 共有のネイティブOpenAI/Codex Responsesラッパー: attribution header、`/fast`/`serviceTier`、text verbosity、ネイティブCodex web search、reasoning-compatペイロード整形、およびResponsesコンテキスト管理 |
    | `openrouter-thinking` | proxy route向けOpenRouter reasoningラッパー。未対応モデルや`auto`のスキップは中央で処理されます |
    | `tool-stream-default-on` | Z.AIのように明示的に無効化されない限りtool streamingを有効にしたいprovider向けのデフォルト有効`tool_stream`ラッパー |

    実際の同梱例:

    - `google` および `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` および `minimax-portal`: `minimax-fast-mode`
    - `openai` および `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared`は、replayファミリーenumと、それらのファミリーの構築に使われる共有helperもexportします。一般的な公開exportには次が含まれます。

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)`、および
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`のような共有replay builder
    - `sanitizeGoogleGeminiReplayHistory(...)`
      および `resolveTaggedReasoningOutputMode()`のようなGemini replay helper
    - `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)`、および
      `normalizeNativeXaiModelId(...)`のようなendpoint/model helper

    `openclaw/plugin-sdk/provider-stream`は、ファミリーbuilderと、それらのファミリーが再利用する公開wrapper helperの両方を公開します。一般的な公開exportには次が含まれます。

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)`、および
      `createCodexNativeWebSearchWrapper(...)`のような共有OpenAI/Codex wrapper
    - `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)`、および `createMinimaxFastModeWrapper(...)`のような共有proxy/provider wrapper

    一部のstream helperは意図的にproviderローカルのままです。現在の同梱例:
    `@openclaw/anthropic-provider`は、その公開`api.ts` /
    `contract-api.ts` seamから
    `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および下位レベルのAnthropic wrapper builderをexportします。これらのhelperは、Claude OAuth beta処理と`context1m` gatingもエンコードしているため、Anthropic固有のままになっています。

    他の同梱providerも、動作をファミリー間できれいに共有できない場合、transport固有のwrapperをローカルに保持しています。現在の例: 同梱xAI pluginは、`wrapStreamFn`内でネイティブxAI Responses整形を保持しており、`/fast`エイリアス書き換え、デフォルトの`tool_stream`、未対応strict-toolクリーンアップ、およびxAI固有のreasoningペイロード削除を含みます。

    `openclaw/plugin-sdk/provider-tools`は現在、1つの共有tool-schemaファミリーと共有schema/compat helperを公開しています。

    - `ProviderToolCompatFamily`は、現在の共有ファミリー一覧を文書化しています。
    - `buildProviderToolCompatFamilyHooks("gemini")`は、Gemini安全なtool schemaが必要なprovider向けにGemini schemaクリーンアップ + 診断を配線します。
    - `normalizeGeminiToolSchemas(...)`と`inspectGeminiToolSchemas(...)`は、その基盤となる公開Gemini schema helperです。
    - `resolveXaiModelCompatPatch()`は、同梱xAI compat patchを返します:
      `toolSchemaProfile: "xai"`、未対応schema keyword、ネイティブ
      `web_search`サポート、およびHTMLエンティティ化されたtool-call引数のデコードです。
    - `applyXaiModelCompat(model)`は、runnerに届く前の解決済みmodelに同じxAI compat patchを適用します。

    実際の同梱例: xAI pluginは`normalizeResolvedModel`と
    `contributeResolvedModelCompat`を使い、そのcompatメタデータをコアにxAIルールをハードコードするのではなく、provider所有のままにしています。

    同じpackage rootパターンは他の同梱providerも支えています。

    - `@openclaw/openai-provider`: `api.ts`はprovider builder、
      default-model helper、およびrealtime provider builderをexportします
    - `@openclaw/openrouter-provider`: `api.ts`はprovider builder
      とオンボーディング/config helperをexportします

    <Tabs>
      <Tab title="トークン交換">
        各推論呼び出しの前にトークン交換が必要なproviderの場合:

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
        カスタムリクエストヘッダーやボディ変更が必要なproviderの場合:

        ```typescript
        // wrapStreamFn は ctx.streamFn から派生した StreamFn を返します
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
      <Tab title="ネイティブtransport識別情報">
        汎用HTTPまたはWebSocket transport上で、ネイティブのリクエスト/セッションヘッダーまたはメタデータが必要なproviderの場合:

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
        使用量/課金データを公開するproviderの場合:

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

    <Accordion title="利用可能なすべてのprovider hook">
      OpenClawはこの順序でhookを呼び出します。ほとんどのproviderが使うのは2〜3個だけです。

      | # | Hook | 使う場面 |
      | --- | --- | --- |
      | 1 | `catalog` | モデルcatalogまたはbase URLのデフォルト |
      | 2 | `applyConfigDefaults` | config materialization中のprovider所有グローバルデフォルト |
      | 3 | `normalizeModelId` | lookup前の旧/preview model-idエイリアスクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のproviderファミリー`api` / `baseUrl`クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` configの正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config provider向けネイティブstreaming-usage compat書き換え |
      | 7 | `resolveConfigApiKey` | provider所有のenv-marker認証解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたはconfigベースのsynthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic保存profileプレースホルダーをenv/config authより後ろに下げる |
      | 10 | `resolveDynamicModel` | 任意のupstream model IDを受け付ける |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner前のtransport書き換え |

    Runtime fallbackに関する注意:

    - `normalizeConfig`は、最初に一致したproviderを確認し、その後、実際にconfigを変更するものが見つかるまで、他のhook対応provider pluginを確認します。
      どのprovider hookもサポート対象のGoogleファミリーconfigエントリーを書き換えなかった場合、同梱Google config normalizerが引き続き適用されます。
    - `resolveConfigApiKey`は、公開されている場合はprovider hookを使います。同梱
      `amazon-bedrock`パスには、Bedrock runtime auth自体は依然としてAWS SDKのdefault chainを使うものの、ここに組み込みのAWS env-marker resolverもあります。
      | 13 | `contributeResolvedModelCompat` | 別の互換transportの背後にあるvendor model向けcompatフラグ |
      | 14 | `capabilities` | 旧来の静的capability bag。互換性目的のみ |
      | 15 | `normalizeToolSchemas` | 登録前のprovider所有tool-schemaクリーンアップ |
      | 16 | `inspectToolSchemas` | provider所有tool-schema診断 |
      | 17 | `resolveReasoningOutputMode` | タグ付きまたはネイティブreasoning-output契約 |
      | 18 | `prepareExtraParams` | デフォルトのリクエストparams |
      | 19 | `createStreamFn` | 完全にカスタムなStreamFn transport |
      | 20 | `wrapStreamFn` | 通常streamパス上のカスタムヘッダー/ボディwrapper |
      | 21 | `resolveTransportTurnState` | ネイティブなターンごとのヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブWSセッションヘッダー/クールダウン |
      | 23 | `formatApiKey` | カスタムruntimeトークン形状 |
      | 24 | `refreshOAuth` | カスタムOAuth更新 |
      | 25 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 26 | `matchesContextOverflowError` | provider所有のオーバーフロー検出 |
      | 27 | `classifyFailoverReason` | provider所有のレート制限/過負荷分類 |
      | 28 | `isCacheTtlEligible` | プロンプトキャッシュTTLゲーティング |
      | 29 | `buildMissingAuthMessage` | カスタム未認証ヒント |
      | 30 | `suppressBuiltInModel` | 古くなったupstream行を隠す |
      | 31 | `augmentModelCatalog` | synthetic forward-compat行 |
      | 32 | `isBinaryThinking` | バイナリthinkingのオン/オフ |
      | 33 | `supportsXHighThinking` | `xhigh` reasoningサポート |
      | 34 | `resolveDefaultThinkingLevel` | デフォルトの`/think`ポリシー |
      | 35 | `isModernModelRef` | live/smoke model一致 |
      | 36 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 37 | `resolveUsageAuth` | カスタムusage認証情報解析 |
      | 38 | `fetchUsageSnapshot` | カスタムusage endpoint |
      | 39 | `createEmbeddingProvider` | memory/search向けprovider所有embedding adapter |
      | 40 | `buildReplayPolicy` | カスタムtranscript replay/compactionポリシー |
      | 41 | `sanitizeReplayHistory` | 汎用クリーンアップ後のprovider固有replay書き換え |
      | 42 | `validateReplayTurns` | 埋め込みrunner前の厳格なreplayターン検証 |
      | 43 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      プロンプト調整に関する注意:

      - `resolveSystemPromptContribution`を使うと、providerはモデルファミリー向けのキャッシュ対応システムプロンプトガイダンスを注入できます。この動作が1つのprovider/モデルファミリーに属し、stable/dynamic cache splitを維持すべき場合は、`before_prompt_build`よりこちらを優先してください。

      詳細な説明と実例については、
      [Internals: Provider Runtime Hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を加える（任意）">
    <a id="step-5-add-extra-capabilities"></a>
    provider pluginは、テキスト推論に加えて、speech、realtime transcription、realtime
    voice、media understanding、image generation、video generation、web fetch、
    およびweb searchを登録できます。

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Fetch pages through Acme's rendering backend.",
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
          description: "Fetch a page through Acme Fetch.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClawはこれを**hybrid-capability** pluginとして分類します。これは
    企業向けplugin（ベンダーごとに1プラグイン）に推奨されるパターンです。
    [Internals: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model)を参照してください。

    video generationでは、上記のモード認識capability形状を優先してください:
    `generate`、`imageToVideo`、および`videoToVideo`です。`maxInputImages`、
    `maxInputVideos`、`maxDurationSeconds`のようなフラットな集約フィールドだけでは、変換モードのサポートや無効モードをきれいに表現できません。

    music-generation providerも同じパターンに従うべきです:
    プロンプトのみの生成には`generate`、参照画像ベースの生成には`edit`です。`maxInputImages`、
    `supportsLyrics`、`supportsFormat`のようなフラットな集約フィールドだけでは、editサポートを表現するには不十分であり、明示的な`generate` / `edit`ブロックが期待される契約です。

  </Step>

  <Step title="テスト">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // provider config object を index.ts または専用ファイルから export してください
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

## ClawHubへ公開する

provider pluginは、他の外部コードpluginと同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは旧来のskill専用公開エイリアスを使わないでください。plugin packageは
`clawhub package publish`を使う必要があります。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers メタデータ
├── openclaw.plugin.json      # provider認証メタデータを含むマニフェスト
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # usage endpoint（任意）
```

## Catalog順序リファレンス

`catalog.order`は、組み込みproviderに対してcatalogをどのタイミングでマージするかを制御します。

| Order     | タイミング    | 用途                                        |
| --------- | ------------- | ------------------------------------------- |
| `simple`  | 最初のパス    | 単純なAPIキーprovider                        |
| `profile` | simpleの後    | auth profileで制御されるprovider             |
| `paired`  | profileの後   | 複数の関連エントリーを合成する               |
| `late`    | 最後のパス    | 既存providerを上書きする（衝突時に優先）     |

## 次のステップ

- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — pluginがchannelも提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime` helper（TTS、search、subagent）
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Plugin Internals](/ja-JP/plugins/architecture#provider-runtime-hooks) — hookの詳細と同梱例
