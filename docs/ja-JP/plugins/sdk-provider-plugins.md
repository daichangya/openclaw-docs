---
read_when:
    - 新しいモデルプロバイダーPluginを構築しています
    - OpenAI互換プロキシまたはカスタムLLMをOpenClawに追加したいです
    - プロバイダー認証、カタログ、実行時hookを理解する必要があります
sidebarTitle: Provider Plugins
summary: OpenClaw向けモデルプロバイダーPluginを構築するためのステップバイステップガイド
title: プロバイダーPluginの構築
x-i18n:
    generated_at: "2026-04-22T04:26:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99376d2abfc968429ed19f03451beb0f3597d57c703f2ce60c6c51220656e850
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# プロバイダーPluginの構築

このガイドでは、OpenClawにモデルプロバイダー
（LLM）を追加するプロバイダーPluginの構築方法を説明します。完了するころには、モデルカタログ、
API key認証、動的モデル解決を備えたプロバイダーが完成します。

<Info>
  まだOpenClaw Pluginを一度も作成したことがない場合は、まず
  基本的なパッケージ構造とマニフェスト設定について
  [はじめに](/ja-JP/plugins/building-plugins)を読んでください。
</Info>

<Tip>
  プロバイダーPluginは、OpenClawの通常の推論ループにモデルを追加します。モデルが
  スレッド、Compaction、またはツールイベントを所有するネイティブagent daemon経由で動作する必要がある場合は、
  daemon protocolの詳細をコアに入れるのではなく、
  プロバイダーを[agent harness](/ja-JP/plugins/sdk-agent-harness)と組み合わせてください。
</Tip>

## ウォークスルー

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

    このマニフェストは`providerAuthEnvVars`を宣言し、OpenClawが
    Plugin実行時をロードせずに認証情報を検出できるようにします。プロバイダーバリアントが
    別のプロバイダーIDの認証を再利用すべき場合は、`providerAuthAliases`を追加してください。`modelSupport`
    は任意で、実行時hookが存在する前に`acme-large`のような短縮
    モデルIDからOpenClawがプロバイダーPluginを自動ロードできるようにします。プロバイダーを
    ClawHubで公開する場合、これらの`openclaw.compat`と`openclaw.build`フィールドは
    `package.json`内で必須です。

  </Step>

  <Step title="プロバイダーを登録する">
    最小のプロバイダーには、`id`、`label`、`auth`、`catalog`が必要です:

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
    `openclaw onboard --acme-ai-api-key <key>`を実行して、
    モデルとして`acme-ai/acme-large`を選択できるようになります。

    上流プロバイダーがOpenClawと異なる制御トークンを使用する場合は、
    streamパス全体を置き換えるのではなく、小さな双方向テキスト変換を追加してください:

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

    `input`は、transport前に最終的なsystem promptとテキストメッセージ内容を書き換えます。
    `output`は、assistantのテキストdeltaと最終テキストを、OpenClawが自身の
    制御マーカーやチャンネル配信を解析する前に書き換えます。

    1つのテキストプロバイダーだけをAPI key
    認証と単一のcatalogバック実行時で登録するバンドル済みプロバイダーでは、より限定的な
    `defineSingleProviderPluginEntry(...)`ヘルパーを優先してください:

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

    `buildProvider`は、OpenClawが実際の
    プロバイダー認証を解決できるときに使われるliveカタログ経路です。プロバイダー固有の検出を行っても構いません。
    `buildStaticProvider`は、認証設定前でも安全に表示できるオフライン行にのみ使用してください。
    これは認証情報を必要とせず、ネットワークリクエストも行ってはいけません。
    OpenClawの`models list --all`表示は現在、
    バンドル済みプロバイダーPluginに対してのみ静的カタログを実行し、空の設定、空の環境変数、agent/workspaceパスなしで動作します。

    認証フローでオンボーディング時に`models.providers.*`、エイリアス、
    agentのデフォルトモデルもパッチする必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard`のpresetヘルパーを使用してください。もっとも限定的なヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)`です。

    プロバイダーのネイティブendpointが通常の
    `openai-completions` transport上でstreamed usage blocksをサポートする場合は、プロバイダーIDのチェックをハードコードするのではなく、
    `openclaw/plugin-sdk/provider-catalog-shared`の共有catalogヘルパーを優先してください。
    `supportsNativeStreamingUsageCompat(...)`と
    `applyProviderNativeStreamingUsageCompat(...)`は、endpoint capability mapからサポートを検出するため、
    カスタムプロバイダーIDを使っているPluginでも、ネイティブMoonshot/DashScopeスタイルendpointが
    オプトインできます。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダーが任意のモデルID（プロキシやrouterのような）を受け付ける場合は、
    `resolveDynamicModel`を追加します:

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

    解決にネットワーク呼び出しが必要な場合は、非同期
    ウォームアップに`prepareDynamicModel`を使用してください。完了後に`resolveDynamicModel`が再度実行されます。

  </Step>

  <Step title="実行時hookを追加する（必要に応じて）">
    ほとんどのプロバイダーは`catalog` + `resolveDynamicModel`だけで十分です。プロバイダーが必要とするぶんだけ、
    hookを段階的に追加してください。

    共有ヘルパービルダーが、現在もっとも一般的なreplay/tool互換
    ファミリーをカバーしているため、通常Pluginでは各hookを1つずつ手で配線する必要はありません:

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

    | ファミリー | 配線される内容 |
    | --- | --- |
    | `openai-compatible` | OpenAI互換transport向けの共有OpenAIスタイルreplayポリシー。tool-call-idサニタイズ、assistant-first順序修正、およびtransportが必要とする場合の汎用Geminiターン検証を含みます |
    | `anthropic-by-model` | `modelId`によって選ばれるClaude対応replayポリシー。Anthropic-message transportでは、解決済みモデルが実際にClaude IDのときだけClaude固有のthinking-blockクリーンアップを取得します |
    | `google-gemini` | ネイティブGemini replayポリシーに加え、bootstrap replayサニタイズとタグ付きreasoning-outputモード |
    | `passthrough-gemini` | OpenAI互換プロキシtransport経由で動作するGeminiモデル向けのGemini thought-signatureサニタイズ。ネイティブGemini replay検証やbootstrap書き換えは有効化しません |
    | `hybrid-anthropic-openai` | 1つのPlugin内でAnthropic-messageとOpenAI互換モデル画面を混在させるプロバイダー向けハイブリッドポリシー。任意のClaude専用thinking-block削除はAnthropic側に限定されます |

    実際のバンドル例:

    - `google`および`google-gemini-cli`: `google-gemini`
    - `openrouter`、`kilocode`、`opencode`、`opencode-go`: `passthrough-gemini`
    - `amazon-bedrock`および`anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai`、`zai`: `openai-compatible`

    現在利用可能なstreamファミリー:

    | ファミリー | 配線される内容 |
    | --- | --- |
    | `google-thinking` | 共有streamパス上でのGemini thinkingペイロード正規化 |
    | `kilocode-thinking` | 共有proxy streamパス上でのKilo reasoningラッパー。`kilo/auto`および未対応のproxy reasoning IDでは挿入thinkingをスキップ |
    | `moonshot-thinking` | 設定 + `/think`レベルからのMoonshotバイナリnative-thinkingペイロードマッピング |
    | `minimax-fast-mode` | 共有streamパス上でのMiniMax fast-modeモデル書き換え |
    | `openai-responses-defaults` | 共有のネイティブOpenAI/Codex Responsesラッパー: attributionヘッダー、`/fast`/`serviceTier`、テキストverbosity、ネイティブCodex web search、reasoning互換ペイロード整形、およびResponsesコンテキスト管理 |
    | `openrouter-thinking` | proxyルート向けOpenRouter reasoningラッパー。未対応モデル/`auto`スキップは中央で処理 |
    | `tool-stream-default-on` | Z.AIのように明示的に無効化されない限りtool streamingを望むプロバイダー向けの、デフォルトオン`tool_stream`ラッパー |

    実際のバンドル例:

    - `google`および`google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax`および`minimax-portal`: `minimax-fast-mode`
    - `openai`および`openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared`は、replay-family
    enumと、それらのファミリーが基づく共有ヘルパーもexportします。一般的な公開export
    には次が含まれます:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)`、および
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`のような共有replayビルダー
    - `sanitizeGoogleGeminiReplayHistory(...)`
      および`resolveTaggedReasoningOutputMode()`のようなGemini replayヘルパー
    - `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)`、および
      `normalizeNativeXaiModelId(...)`のようなendpoint/modelヘルパー

    `openclaw/plugin-sdk/provider-stream`は、familyビルダーと、
    それらのファミリーが再利用する公開ラッパーヘルパーの両方を公開します。一般的な公開export
    には次が含まれます:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)`、および
      `createCodexNativeWebSearchWrapper(...)`のような共有OpenAI/Codexラッパー
    - `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)`、および`createMinimaxFastModeWrapper(...)`のような共有proxy/プロバイダーラッパー

    一部のstreamヘルパーは意図的にプロバイダーローカルのままです。現在のバンドル
    例: `@openclaw/anthropic-provider`は、
    公開`api.ts` /
    `contract-api.ts`境界から`wrapAnthropicProviderStream`、
    `resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および
    より低レベルのAnthropicラッパービルダーをexportします。これらのヘルパーは
    Claude OAuthベータ処理と`context1m`制御もエンコードしているため、Anthropic固有のままです。

    他のバンドル済みプロバイダーも、その動作がファミリー間で
    きれいに共有できない場合は、transport固有ラッパーをローカルに保持しています。現在の例: バンドル済みxAI Pluginは、
    `wrapStreamFn`内にネイティブxAI Responses整形を保持しており、`/fast`エイリアス書き換え、デフォルト`tool_stream`、
    未対応strict-toolクリーンアップ、およびxAI固有reasoning-payload
    削除を含みます。

    `openclaw/plugin-sdk/provider-tools`は現在、1つの共有
    tool-schemaファミリーと共有schema/互換ヘルパーを公開しています:

    - `ProviderToolCompatFamily`は、現在の共有ファミリー一覧を文書化します。
    - `buildProviderToolCompatFamilyHooks("gemini")`は、Gemini安全なtool schemaが必要なプロバイダー向けに、
      Gemini schemaクリーンアップ + 診断を配線します。
    - `normalizeGeminiToolSchemas(...)`と`inspectGeminiToolSchemas(...)`
      は、その基盤となる公開Gemini schemaヘルパーです。
    - `resolveXaiModelCompatPatch()`は、バンドル済みxAI互換パッチを返します:
      `toolSchemaProfile: "xai"`、未対応schemaキーワード、ネイティブ
      `web_search`サポート、およびHTML entityなtool-call引数デコード。
    - `applyXaiModelCompat(model)`は、その同じxAI互換パッチを、
      runnerへ到達する前の解決済みモデルへ適用します。

    実際のバンドル例: xAI Pluginは、`normalizeResolvedModel`と
    `contributeResolvedModelCompat`を使って、その互換メタデータをコアにxAIルールをハードコードする代わりに
    プロバイダー所有のままにしています。

    同じpackage rootパターンは他のバンドル済みプロバイダーも支えています:

    - `@openclaw/openai-provider`: `api.ts`はプロバイダービルダー、
      default-modelヘルパー、およびrealtimeプロバイダービルダーをexportします
    - `@openclaw/openrouter-provider`: `api.ts`はプロバイダービルダー
      に加え、オンボーディング/設定ヘルパーをexportします

    <Tabs>
      <Tab title="トークン交換">
        推論呼び出しのたびにトークン交換が必要なプロバイダーの場合:

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
        カスタムリクエストヘッダーや本文修正が必要なプロバイダーの場合:

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
      <Tab title="ネイティブtransport ID">
        汎用HTTPまたはWebSocket transport上でネイティブのリクエスト/セッションヘッダーやメタデータが必要なプロバイダーの場合:

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

    <Accordion title="利用可能なすべてのプロバイダーhook">
      OpenClawはこの順番でhookを呼び出します。ほとんどのプロバイダーは2〜3個しか使いません:

      | # | Hook | 使用する場面 |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはベースURLデフォルト |
      | 2 | `applyConfigDefaults` | 設定実体化時のプロバイダー所有グローバルデフォルト |
      | 3 | `normalizeModelId` | 検索前の従来/プレビューモデルIDエイリアスクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のプロバイダーファミリー`api` / `baseUrl`クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>`設定の正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | 設定プロバイダー向けネイティブstreaming-usage互換書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有の環境変数マーカー認証解決 |
      | 8 | `resolveSyntheticAuth` | local/セルフホストまたは設定ベースsynthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic保存プロファイルプレースホルダーを環境変数/設定認証より後ろへ下げる |
      | 10 | `resolveDynamicModel` | 任意の上流モデルIDを受け付ける |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner前のtransport書き換え |

    実行時フォールバックに関する注記:

    - `normalizeConfig`は、まず一致したプロバイダーを確認し、その後
      実際に設定を変更したものが見つかるまで、他の
      hook対応プロバイダーPluginを確認します。
      どのプロバイダーhookもサポートされるGoogleファミリー設定項目を書き換えない場合、
      バンドル済みGoogle設定正規化が引き続き適用されます。
    - `resolveConfigApiKey`は、公開されている場合はプロバイダーhookを使用します。バンドル済み
      `amazon-bedrock`経路には、ここに組み込みAWS環境変数マーカーリゾルバーもあります。
      ただし、Bedrock実行時認証自体は引き続きAWS SDKのデフォルト
      チェーンを使用します。
      | 13 | `contributeResolvedModelCompat` | 別の互換transport背後にあるベンダーモデル向け互換フラグ |
      | 14 | `capabilities` | 従来の静的capability bag。互換専用 |
      | 15 | `normalizeToolSchemas` | 登録前のプロバイダー所有tool-schemaクリーンアップ |
      | 16 | `inspectToolSchemas` | プロバイダー所有tool-schema診断 |
      | 17 | `resolveReasoningOutputMode` | タグ付き vs ネイティブreasoning-output契約 |
      | 18 | `prepareExtraParams` | デフォルトリクエストパラメーター |
      | 19 | `createStreamFn` | 完全にカスタムなStreamFn transport |
      | 20 | `wrapStreamFn` | 通常streamパス上のカスタムヘッダー/本文ラッパー |
      | 21 | `resolveTransportTurnState` | ネイティブのターンごとヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブWSセッションヘッダー/クールダウン |
      | 23 | `formatApiKey` | カスタム実行時トークン形式 |
      | 24 | `refreshOAuth` | カスタムOAuth更新 |
      | 25 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 26 | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | 27 | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷分類 |
      | 28 | `isCacheTtlEligible` | prompt cache TTL制御 |
      | 29 | `buildMissingAuthMessage` | カスタム認証不足ヒント |
      | 30 | `suppressBuiltInModel` | 古い上流行を非表示にする |
      | 31 | `augmentModelCatalog` | synthetic forward-compat行 |
      | 32 | `resolveThinkingProfile` | モデル固有の`/think`オプション集合 |
      | 33 | `isBinaryThinking` | バイナリthinkingオン/オフ互換 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoningサポート互換 |
      | 35 | `resolveDefaultThinkingLevel` | デフォルト`/think`ポリシー互換 |
      | 36 | `isModernModelRef` | live/smokeモデル一致 |
      | 37 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 38 | `resolveUsageAuth` | カスタム使用量認証情報解析 |
      | 39 | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | 40 | `createEmbeddingProvider` | memory/search向けのプロバイダー所有embeddingアダプター |
      | 41 | `buildReplayPolicy` | カスタムtranscript replay/Compactionポリシー |
      | 42 | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有replay書き換え |
      | 43 | `validateReplayTurns` | 埋め込みrunner前の厳密なreplay-turnバリデーション |
      | 44 | `onModelSelected` | 選択後コールバック（例: テレメトリー） |

      Promptチューニングに関する注記:

      - `resolveSystemPromptContribution`を使うと、プロバイダーはモデルファミリー向けに
        キャッシュ対応のsystem promptガイダンスを注入できます。挙動が1つのプロバイダー/モデル
        ファミリーに属し、stable/dynamicキャッシュ分割を維持すべき場合は、
        `before_prompt_build`よりこちらを優先してください。

      詳細な説明と実例については、
      [Internals: Provider Runtime Hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。
    </Accordion>

  </Step>

  <Step title="追加capabilityを加える（任意）">
    <a id="step-5-add-extra-capabilities"></a>
    プロバイダーPluginは、テキスト推論に加えて、音声、リアルタイム文字起こし、リアルタイム
    音声、media understanding、画像生成、動画生成、web fetch、
    web searchを登録できます:

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

    OpenClawはこれを**hybrid-capability** Pluginとして分類します。これは
    企業Plugin（ベンダーごとに1 Plugin）に推奨されるパターンです。詳細は
    [Internals: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model)を参照してください。

    動画生成では、上に示したモード認識capability形式を優先してください:
    `generate`、`imageToVideo`、`videoToVideo`。`maxInputImages`、
    `maxInputVideos`、`maxDurationSeconds`のようなフラットな集約フィールドだけでは、
    変換モードサポートや無効モードをきれいに広告するには不十分です。

    音楽生成プロバイダーも同じパターンに従うべきです:
    プロンプトのみの生成には`generate`、参照画像ベースの
    生成には`edit`。`maxInputImages`、
    `supportsLyrics`、`supportsFormat`のようなフラットな集約フィールドだけでは、
    editサポートを広告するには不十分です。明示的な`generate` / `edit`
    ブロックが期待される契約です。

  </Step>

  <Step title="テスト">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // index.ts または専用ファイルからプロバイダー設定オブジェクトを export してください
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("動的モデルを解決する", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("キーが利用可能なときにカタログを返す", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("キーがないときはnullカタログを返す", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## ClawHubへ公開

プロバイダーPluginは、他の外部コードPluginと同じ方法で公開します:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは従来のskill専用publishエイリアスは使用しないでください。Pluginパッケージでは
`clawhub package publish`を使用する必要があります。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # provider auth metadata を含むマニフェスト
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # usage endpoint（任意）
```

## Catalog順序リファレンス

`catalog.order`は、組み込み
プロバイダーに対してどのタイミングでカタログをマージするかを制御します。

| 順序 | タイミング | 用途 |
| --------- | ------------- | ----------------------------------------------- |
| `simple` | 最初のパス | 通常のAPI keyプロバイダー |
| `profile` | simpleの後 | 認証プロファイルに依存するプロバイダー |
| `paired` | profileの後 | 関連する複数のエントリを合成する |
| `late` | 最後のパス | 既存プロバイダーを上書きする（衝突時に勝つ） |

## 次のステップ

- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — Pluginがチャンネルも提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime`ヘルパー（TTS、検索、subagent）
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Plugin Internals](/ja-JP/plugins/architecture#provider-runtime-hooks) — hook詳細とバンドル例
