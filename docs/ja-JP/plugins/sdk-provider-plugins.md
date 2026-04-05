---
read_when:
    - 新しいモデルプロバイダープラグインを構築している場合
    - OpenAI互換プロキシまたはカスタムLLMをOpenClawに追加したい場合
    - プロバイダー認証、カタログ、およびランタイムフックを理解する必要がある場合
sidebarTitle: Provider Plugins
summary: OpenClaw向けモデルプロバイダープラグインを構築するためのステップごとのガイド
title: プロバイダープラグインの構築
x-i18n:
    generated_at: "2026-04-05T12:53:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e781e5fc436b2189b9f8cc63e7611f49df1fd2526604a0596a0631f49729b085
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# プロバイダープラグインの構築

このガイドでは、OpenClawにモデルプロバイダー
（LLM）を追加するプロバイダープラグインの構築方法を説明します。最後には、モデルカタログ、
APIキー認証、および動的モデル解決を備えたプロバイダーが完成します。

<Info>
  まだOpenClawプラグインを一度も作成したことがない場合は、まず
  基本的なパッケージ構造とmanifest設定について [はじめに](/plugins/building-plugins) を読んでください。
</Info>

## 手順

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとmanifest">
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

    manifestでは `providerAuthEnvVars` を宣言し、OpenClawが
    プラグインランタイムを読み込まずに認証情報を検出できるようにします。`modelSupport` は任意で、
    `acme-large` のような短縮モデルIDから、ランタイムフックが存在する前でも
    OpenClawがプロバイダープラグインを自動読み込みできるようにします。プロバイダーを
    ClawHubで公開する場合は、`package.json` 内の
    `openclaw.compat` と `openclaw.build` フィールドが必須です。

  </Step>

  <Step title="プロバイダーを登録する">
    最小限のプロバイダーに必要なのは、`id`、`label`、`auth`、`catalog` です:

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

    これで動作するプロバイダーになります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行して、
    `acme-ai/acme-large` をモデルとして選択できるようになります。

    APIキー認証を持つ1つのテキストプロバイダーと、単一のcatalogベースランタイムだけを登録するバンドル済みプロバイダーでは、
    より狭い `defineSingleProviderPluginEntry(...)` ヘルパーを優先してください:

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

    認証フローで、オンボーディング中に `models.providers.*`、エイリアス、および
    エージェントのデフォルトモデルも書き換える必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard` のpresetヘルパーを使ってください。最も狭いヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の
    `openai-completions` トランスポート上でstreamed usageブロックをサポートする場合、
    プロバイダーIDチェックをハードコードする代わりに
    `openclaw/plugin-sdk/provider-catalog-shared` の共有catalogヘルパーを優先してください。
    `supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` は
    エンドポイントcapabilityマップからサポートを検出するため、カスタムプロバイダーIDを使うプラグインでも
    ネイティブMoonshot/DashScope系エンドポイントをopt inできます。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダーが任意のモデルID（プロキシやルーターのようなもの）を受け付ける場合は、
    `resolveDynamicModel` を追加します:

    ```typescript
    api.registerProvider({
      // ... 上記の id、label、auth、catalog

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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップに
    `prepareDynamicModel` を使ってください。`resolveDynamicModel` は完了後に再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する（必要に応じて）">
    ほとんどのプロバイダーに必要なのは `catalog` + `resolveDynamicModel` だけです。必要に応じて
    フックを段階的に追加してください。

    共有ヘルパービルダーは、現在最も一般的なreplay/tool-compat
    ファミリーをカバーしているため、プラグインは通常、各フックを1つずつ手作業で配線する必要がありません:

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
    | `openai-compatible` | OpenAI互換トランスポート向けの共有OpenAIスタイルreplayポリシー。tool-call-idサニタイズ、assistant-first順序修正、およびトランスポートが必要とする場合の汎用Geminiターン検証を含む |
    | `anthropic-by-model` | `modelId` によって選ばれるClaude対応replayポリシー。これによりAnthropic-messageトランスポートは、解決済みモデルが実際にClaude IDである場合にのみClaude固有のthinking-blockクリーンアップを受けます |
    | `google-gemini` | ネイティブGemini replayポリシーに加え、bootstrap replayサニタイズとタグ付きreasoning-output mode |
    | `passthrough-gemini` | OpenAI互換プロキシトランスポート経由で動作するGeminiモデル向けのGemini thought-signatureサニタイズ。ネイティブGemini replay検証やbootstrap rewriteは有効にしません |
    | `hybrid-anthropic-openai` | 1つのプラグイン内でAnthropic-messageとOpenAI互換モデル画面を混在させるプロバイダー向けのハイブリッドポリシー。任意のClaude専用thinking-block除去はAnthropic側に限定されます |

    実際のバンドル済み例:

    - `google` と `google-gemini-cli`: `google-gemini`
    - `openrouter`、`kilocode`、`opencode`、`opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` と `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai`、`zai`: `openai-compatible`

    現在利用可能なstreamファミリー:

    | Family | 配線される内容 |
    | --- | --- |
    | `google-thinking` | 共有stream経路上のGemini thinkingペイロード正規化 |
    | `kilocode-thinking` | 共有proxy stream経路上のKilo reasoningラッパー。`kilo/auto` と未サポートのproxy reasoning IDではthinking注入をスキップ |
    | `moonshot-thinking` | 設定 + `/think` レベルからのMoonshot binary native-thinkingペイロードマッピング |
    | `minimax-fast-mode` | 共有stream経路上のMiniMax fast-modeモデル書き換え |
    | `openai-responses-defaults` | 共有ネイティブOpenAI/Codex Responsesラッパー: attribution header、`/fast`/`serviceTier`、text verbosity、ネイティブCodex web search、reasoning-compatペイロード整形、およびResponsesコンテキスト管理 |
    | `openrouter-thinking` | proxyルート向けOpenRouter reasoningラッパー。未サポートモデル/`auto` のスキップを中央で処理 |
    | `tool-stream-default-on` | Z.AIのように、明示的に無効化されない限りtool streamingを有効にしたいプロバイダー向けのデフォルトオン `tool_stream` ラッパー |

    実際のバンドル済み例:

    - `google` と `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` と `minimax-portal`: `minimax-fast-mode`
    - `openai` と `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` は、replay-family
    enumと、それらのファミリーが構築に使用する共有ヘルパーもエクスポートします。一般的な公開
    エクスポートには次が含まれます:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)`、および
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)` などの共有replayビルダー
    - `sanitizeGoogleGeminiReplayHistory(...)`
      と `resolveTaggedReasoningOutputMode()` などのGemini replayヘルパー
    - `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)`、および
      `normalizeNativeXaiModelId(...)` などのendpoint/modelヘルパー

    `openclaw/plugin-sdk/provider-stream` は、family builderと、
    それらのファミリーが再利用する公開ラッパーヘルパーの両方を公開します。一般的な公開
    エクスポートには次が含まれます:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)`、および
      `createCodexNativeWebSearchWrapper(...)` などの共有OpenAI/Codexラッパー
    - `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)`、および `createMinimaxFastModeWrapper(...)` などの共有proxy/providerラッパー

    一部のstreamヘルパーは、意図的にプロバイダーローカルのままです。現在のバンドル済み
    例: `@openclaw/anthropic-provider` は
    `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および
    低レベルのAnthropicラッパービルダーを、公開 `api.ts` /
    `contract-api.ts` シームからエクスポートします。これらのヘルパーは、
    Claude OAuth beta処理や `context1m` ゲーティングもエンコードするため、Anthropic固有のままです。

    ほかのバンドル済みプロバイダーも、その動作がファミリー間で
    きれいに共有できない場合には、トランスポート固有ラッパーをローカルに保っています。現在の
    例: バンドル済みxAIプラグインは、ネイティブxAI Responses整形を自身の
    `wrapStreamFn` 内に保持しており、`/fast` エイリアス書き換え、デフォルト `tool_stream`、
    未サポートstrict-toolクリーンアップ、およびxAI固有のreasoning-payload
    除去を含みます。

    `openclaw/plugin-sdk/provider-tools` は現在、1つの共有
    tool-schemaファミリーに加え、共有schema/compatヘルパーを公開しています:

    - `ProviderToolCompatFamily` は、現時点の共有ファミリー一覧を文書化します。
    - `buildProviderToolCompatFamilyHooks("gemini")` は、Gemini安全なtool schemaを必要とするプロバイダー向けにGemini schema
      クリーンアップ + 診断を配線します。
    - `normalizeGeminiToolSchemas(...)` と `inspectGeminiToolSchemas(...)`
      は、基礎となる公開Gemini schemaヘルパーです。
    - `resolveXaiModelCompatPatch()` は、バンドル済みxAI compat patchを返します:
      `toolSchemaProfile: "xai"`、未サポートschemaキーワード、ネイティブ
      `web_search` サポート、およびHTML entityなtool-call引数デコード。
    - `applyXaiModelCompat(model)` は、同じxAI compat patchを
      runnerに到達する前の解決済みモデルへ適用します。

    実際のバンドル済み例: xAIプラグインは、コアにxAIルールをハードコードする代わりに、
    そのcompatメタデータをプロバイダー所有に保つために `normalizeResolvedModel` と
    `contributeResolvedModelCompat` を使用します。

    同じpackage-rootパターンは、ほかのバンドル済みプロバイダーでも使われています:

    - `@openclaw/openai-provider`: `api.ts` がプロバイダービルダー、
      default-modelヘルパー、およびrealtime provider builderをエクスポート
    - `@openclaw/openrouter-provider`: `api.ts` がprovider builder
      に加え、onboarding/configヘルパーをエクスポート

    <Tabs>
      <Tab title="トークン交換">
        各推論呼び出し前にトークン交換が必要なプロバイダー向け:

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
        カスタムリクエストヘッダーまたは本文変更が必要なプロバイダー向け:

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
      <Tab title="ネイティブトランスポートID">
        汎用HTTPまたはWebSocketトランスポート上で、
        ネイティブなリクエスト/セッションヘッダーやメタデータが必要なプロバイダー向け:

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
        使用量/課金データを公開するプロバイダー向け:

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
      OpenClawは次の順序でフックを呼び出します。ほとんどのプロバイダーが使うのは2〜3個だけです:

      | # | Hook | 使用する場面 |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはbase URLデフォルト |
      | 2 | `applyConfigDefaults` | 設定具現化中のプロバイダー所有グローバルデフォルト |
      | 3 | `normalizeModelId` | ルックアップ前のレガシー/プレビューモデルIDエイリアスクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のプロバイダーファミリー `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` 設定を正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | 設定済みプロバイダー向けネイティブstreaming-usage compat書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有のenv-marker認証解決 |
      | 8 | `resolveSyntheticAuth` | local/self-hostedまたは設定ベースのsynthetic認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 保存済みsynthetic profile placeholderをenv/config認証より下位にする |
      | 10 | `resolveDynamicModel` | 任意のupstream model IDを受け付ける |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner前のトランスポート書き換え |

    ランタイムフォールバックの注記:

    - `normalizeConfig` は、まず一致したプロバイダーを確認し、その後
      実際に設定を変更するまでほかのhook対応プロバイダープラグインを順に確認します。
      対応するGoogleファミリー設定エントリーを書き換えるプロバイダーフックがない場合、
      バンドル済みGoogle設定正規化が引き続き適用されます。
    - `resolveConfigApiKey` は、公開されている場合にプロバイダーフックを使います。バンドル済み
      `amazon-bedrock` 経路は、Bedrockランタイム認証自体はAWS SDKデフォルト
      チェーンを使うにもかかわらず、ここにも組み込みAWS env-markerリゾルバーを持ちます。
      | 13 | `contributeResolvedModelCompat` | 別の互換トランスポート背後にあるベンダーモデル向けcompatフラグ |
      | 14 | `capabilities` | レガシー静的capability bag。互換性専用 |
      | 15 | `normalizeToolSchemas` | 登録前のプロバイダー所有tool-schemaクリーンアップ |
      | 16 | `inspectToolSchemas` | プロバイダー所有tool-schema診断 |
      | 17 | `resolveReasoningOutputMode` | タグ付きまたはネイティブreasoning-output契約 |
      | 18 | `prepareExtraParams` | デフォルトリクエストパラメーター |
      | 19 | `createStreamFn` | 完全カスタムのStreamFnトランスポート |
      | 20 | `wrapStreamFn` | 通常stream経路上のカスタムヘッダー/本文ラッパー |
      | 21 | `resolveTransportTurnState` | ネイティブなターンごとのヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブWSセッションヘッダー/クールダウン |
      | 23 | `formatApiKey` | カスタムランタイムトークン形式 |
      | 24 | `refreshOAuth` | カスタムOAuth更新 |
      | 25 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 26 | `matchesContextOverflowError` | プロバイダー所有overflow検出 |
      | 27 | `classifyFailoverReason` | プロバイダー所有rate-limit/overload分類 |
      | 28 | `isCacheTtlEligible` | prompt cache TTLゲーティング |
      | 29 | `buildMissingAuthMessage` | カスタムmissing-authヒント |
      | 30 | `suppressBuiltInModel` | 古いupstream行を隠す |
      | 31 | `augmentModelCatalog` | synthetic forward-compat行 |
      | 32 | `isBinaryThinking` | 二値thinkingオン/オフ |
      | 33 | `supportsXHighThinking` | `xhigh` reasoningサポート |
      | 34 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー |
      | 35 | `isModernModelRef` | live/smokeモデル一致 |
      | 36 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 37 | `resolveUsageAuth` | カスタムusage認証情報解析 |
      | 38 | `fetchUsageSnapshot` | カスタムusage endpoint |
      | 39 | `createEmbeddingProvider` | メモリ/検索向けのプロバイダー所有embedding adapter |
      | 40 | `buildReplayPolicy` | カスタムtranscript replay/compactionポリシー |
      | 41 | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有replay書き換え |
      | 42 | `validateReplayTurns` | 埋め込みrunner前の厳密なreplay-turn検証 |
      | 43 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      詳細な説明と実例については、
      [Internals: Provider Runtime Hooks](/plugins/architecture#provider-runtime-hooks) を参照してください。
    </Accordion>

  </Step>

  <Step title="追加capabilityを追加する（任意）">
    <a id="step-5-add-extra-capabilities"></a>
    プロバイダープラグインは、テキスト推論に加えて、speech、realtime transcription、realtime
    voice、media understanding、image generation、video generation、web fetch、
    およびweb searchを登録できます:

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
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
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

    OpenClawはこれを **hybrid-capability** プラグインとして分類します。これは
    企業向けプラグイン（ベンダーごとに1プラグイン）に推奨されるパターンです。詳細は
    [Internals: Capability Ownership](/plugins/architecture#capability-ownership-model) を参照してください。

  </Step>

  <Step title="テストする">
    <a id="step-6-test"></a>
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

プロバイダープラグインは、ほかの外部コードプラグインと同じ方法で公開します:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは、レガシーなskill専用公開エイリアスは使わないでください。プラグインパッケージでは
`clawhub package publish` を使用する必要があります。

## ファイル構造

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # providerAuthEnvVars を含むmanifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # usage endpoint（任意）
```

## catalog順序リファレンス

`catalog.order` は、組み込み
プロバイダーに対してあなたのcatalogがいつマージされるかを制御します:

| Order     | タイミング    | 用途                                        |
| --------- | ------------- | ------------------------------------------- |
| `simple`  | 第1パス       | 単純なAPIキープロバイダー                   |
| `profile` | simpleの後    | auth profileで制御されるプロバイダー        |
| `paired`  | profileの後   | 複数の関連エントリーを合成する              |
| `late`    | 最終パス      | 既存プロバイダーを上書きする（衝突時に勝つ） |

## 次のステップ

- [Channel Plugins](/plugins/sdk-channel-plugins) — プラグインがchannelも提供する場合
- [SDK Runtime](/plugins/sdk-runtime) — `api.runtime` ヘルパー（TTS、search、subagent）
- [SDK Overview](/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Plugin Internals](/plugins/architecture#provider-runtime-hooks) — フック詳細とバンドル済み例
