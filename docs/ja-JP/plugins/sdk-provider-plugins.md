---
read_when:
    - 新しいモデルプロバイダーPluginを構築している場合
    - OpenAI互換プロキシまたはカスタムLLMをOpenClawに追加したい場合
    - プロバイダー認証、カタログ、およびランタイムフックを理解する必要がある場合
sidebarTitle: Provider Plugins
summary: OpenClaw向けモデルプロバイダーPluginを構築するためのステップごとのガイド
title: プロバイダーPluginの構築
x-i18n:
    generated_at: "2026-04-23T04:48:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# プロバイダーPluginの構築

このガイドでは、OpenClawにモデルプロバイダー（LLM）を追加するプロバイダーPluginの構築方法を説明します。最後には、モデルカタログ、APIキー認証、動的モデル解決を備えたプロバイダーが完成します。

<Info>
  OpenClaw Pluginをまだ一度も作成したことがない場合は、まず
  基本的なパッケージ構造とmanifest設定について
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  プロバイダーPluginは、OpenClawの通常の推論ループにモデルを追加します。モデルを、スレッド、Compaction、またはツールイベントを管理するネイティブなエージェントデーモン経由で実行する必要がある場合は、デーモンプロトコルの詳細をcoreに入れるのではなく、プロバイダーを [agent harness](/ja-JP/plugins/sdk-agent-harness) と組み合わせてください。
</Tip>

## ウォークスルー

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

    manifestは `providerAuthEnvVars` を宣言することで、OpenClawがPluginランタイムを読み込まずに認証情報を検出できるようにします。プロバイダーのバリアントが別のプロバイダーIDの認証を再利用する必要がある場合は、`providerAuthAliases` を追加してください。`modelSupport`
    は任意ですが、ランタイムフックが存在する前でも、OpenClawが `acme-large` のような短縮モデルIDからプロバイダーPluginを自動読み込みできるようにします。プロバイダーをClawHubで公開する場合、これらの `openclaw.compat` と `openclaw.build` フィールドは `package.json` で必須です。

  </Step>

  <Step title="プロバイダーを登録する">
    最小限のプロバイダーには、`id`、`label`、`auth`、`catalog` が必要です。

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

    これで動作するプロバイダーになります。ユーザーは次のようにして
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    `acme-ai/acme-large` をモデルとして選択できるようになります。

    上流プロバイダーがOpenClawと異なる制御トークンを使用する場合は、
    ストリーム経路を置き換えるのではなく、小さな双方向テキスト変換を追加してください。

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

    `input` は、最終的なシステムプロンプトとテキストメッセージ内容を
    トランスポート前に書き換えます。`output` は、OpenClawが自身の制御マーカーやchannel配信を解析する前に、アシスタントのテキストデルタと最終テキストを書き換えます。

    APIキー認証を持つ1つのテキストプロバイダーと、単一のcatalogベースのランタイムだけを登録するバンドルプロバイダーでは、より限定的な
    `defineSingleProviderPluginEntry(...)` ヘルパーを優先してください。

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

    `buildProvider` は、OpenClawが実際のプロバイダー認証を解決できるときに使われるライブcatalog経路です。ここではプロバイダー固有の検出を実行できます。`buildStaticProvider` は、認証がまだ設定されていない段階でも安全に表示できるオフライン行にのみ使ってください。認証情報を必要としたり、ネットワークリクエストを行ったりしてはいけません。
    OpenClawの `models list --all` 表示は現在、バンドルされたプロバイダーPluginに対してのみ、空の設定、空の環境変数、エージェント/ワークスペースパスなしで静的catalogを実行します。

    認証フローで `models.providers.*`、エイリアス、およびオンボーディング中のエージェントデフォルトモデルも更新する必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使ってください。最も限定的なヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、
    `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが、通常の `openai-completions` トランスポート上でストリーミング使用量ブロックをサポートしている場合は、プロバイダーID判定をハードコードするのではなく、
    `openclaw/plugin-sdk/provider-catalog-shared` の共有catalogヘルパーを優先してください。`supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` は、エンドポイントの機能マップからサポートを検出するため、カスタムプロバイダーIDを使用しているPluginでも、ネイティブMoonshot/DashScope形式のエンドポイントをオプトインできます。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダーが任意のモデルIDを受け入れる場合（プロキシやルーターなど）は、
    `resolveDynamicModel` を追加してください。

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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップ用に
    `prepareDynamicModel` を使ってください。完了後に `resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する（必要に応じて）">
    ほとんどのプロバイダーでは `catalog` と `resolveDynamicModel` だけで十分です。プロバイダーに必要になった時点で、フックを段階的に追加してください。

    共有ヘルパービルダーは現在、最も一般的なreplay/tool互換ファミリーをカバーしているため、通常は各フックを1つずつ手作業で配線する必要はありません。

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
    | `openai-compatible` | OpenAI互換トランスポート向けの共有OpenAI形式replayポリシー。tool-call-idのサニタイズ、assistant-first順序の修正、そのトランスポートで必要な場合の一般的なGeminiターン検証を含む |
    | `anthropic-by-model` | `modelId` で選ばれるClaude対応replayポリシー。Anthropic messageトランスポートは、解決されたモデルが実際にClaude IDである場合にのみ、Claude固有のthinking-blockクリーンアップを受ける |
    | `google-gemini` | ネイティブGemini replayポリシーに加えて、bootstrap replayサニタイズとタグ付きreasoning-outputモード |
    | `passthrough-gemini` | OpenAI互換プロキシトランスポート経由で動作するGeminiモデル向けのGemini thought-signatureサニタイズ。ネイティブGemini replay検証やbootstrap書き換えは有効にしない |
    | `hybrid-anthropic-openai` | 1つのPlugin内でAnthropic message系とOpenAI互換モデル面を混在させるプロバイダー向けのハイブリッドポリシー。任意のClaude専用thinking-block削除はAnthropic側に限定される |

    実際のバンドル例:

    - `google` と `google-gemini-cli`: `google-gemini`
    - `openrouter`、`kilocode`、`opencode`、`opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` と `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai`、`zai`: `openai-compatible`

    現在利用可能なstreamファミリー:

    | Family | 配線される内容 |
    | --- | --- |
    | `google-thinking` | 共有stream経路上でのGemini thinkingペイロード正規化 |
    | `kilocode-thinking` | 共有プロキシstream経路上でのKilo reasoningラッパー。`kilo/auto` と未対応のプロキシreasoning IDでは注入thinkingをスキップ |
    | `moonshot-thinking` | 設定 + `/think` レベルからのMoonshotバイナリnative-thinkingペイロードマッピング |
    | `minimax-fast-mode` | 共有stream経路上でのMiniMax fast-modeモデル書き換え |
    | `openai-responses-defaults` | 共有のネイティブOpenAI/Codex Responsesラッパー: attributionヘッダー、`/fast`/`serviceTier`、text verbosity、ネイティブCodex web search、reasoning互換ペイロード整形、Responsesコンテキスト管理 |
    | `openrouter-thinking` | プロキシ経路向けのOpenRouter reasoningラッパー。未対応モデル/`auto` のスキップは共通処理 |
    | `tool-stream-default-on` | Z.AI のように、明示的に無効化されない限りtool streamingを使いたいプロバイダー向けのデフォルト有効 `tool_stream` ラッパー |

    実際のバンドル例:

    - `google` と `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` と `minimax-portal`: `minimax-fast-mode`
    - `openai` と `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` は、replayファミリーの
    enumと、それらのファミリーが構築される共有ヘルパーもエクスポートします。主な公開エクスポートには次が含まれます。

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)`、
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)` などの共有replayビルダー
    - `sanitizeGoogleGeminiReplayHistory(...)`
      と `resolveTaggedReasoningOutputMode()` などのGemini replayヘルパー
    - `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)`、
      `normalizeNativeXaiModelId(...)` などのendpoint/modelヘルパー

    `openclaw/plugin-sdk/provider-stream` は、ファミリービルダーと、
    それらのファミリーが再利用する公開ラッパーヘルパーの両方を公開します。主な公開エクスポートには次が含まれます。

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)`、
      `createCodexNativeWebSearchWrapper(...)` などの共有OpenAI/Codexラッパー
    - `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)`、`createMinimaxFastModeWrapper(...)` などの共有プロキシ/プロバイダーラッパー

    一部のstreamヘルパーは意図的にプロバイダー局所のままです。現在のバンドル例: `@openclaw/anthropic-provider` は
    `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および
    より低レベルのAnthropicラッパービルダーを、その公開 `api.ts` /
    `contract-api.ts` シームからエクスポートします。これらのヘルパーは、Claude OAuthベータ処理と `context1m` ゲーティングもエンコードしているため、Anthropic専用のままです。

    他のバンドルプロバイダーも、その挙動がファミリー間でうまく共有できない場合は、トランスポート固有ラッパーを局所のままにしています。現在の例: バンドルされたxAI Pluginは、ネイティブxAI Responses整形を自身の
    `wrapStreamFn` 内に保持しており、`/fast` エイリアスの書き換え、デフォルト `tool_stream`、未対応strict-toolのクリーンアップ、およびxAI固有のreasoningペイロード削除を含みます。

    `openclaw/plugin-sdk/provider-tools` は現在、1つの共有
    tool-schemaファミリーと、共有schema/互換ヘルパーを公開しています。

    - `ProviderToolCompatFamily` は、現在の共有ファミリー一覧を文書化します。
    - `buildProviderToolCompatFamilyHooks("gemini")` は、Gemini安全なtool schemaが必要なプロバイダー向けに、Gemini schemaクリーンアップ + diagnosticsを配線します。
    - `normalizeGeminiToolSchemas(...)` と `inspectGeminiToolSchemas(...)` は、基盤となる公開Gemini schemaヘルパーです。
    - `resolveXaiModelCompatPatch()` は、バンドルされたxAI compatパッチを返します:
      `toolSchemaProfile: "xai"`、未対応schemaキーワード、ネイティブ
      `web_search` サポート、およびHTMLエンティティのtool-call引数デコード。
    - `applyXaiModelCompat(model)` は、同じxAI compatパッチを、
      runnerへ渡る前の解決済みモデルに適用します。

    実際のバンドル例: xAI Pluginは `normalizeResolvedModel` と
    `contributeResolvedModelCompat` を使い、その互換メタデータをcoreにxAIルールをハードコードするのではなく、プロバイダー所有のままにしています。

    同じパッケージルートパターンは、他のバンドルプロバイダーでも使われています。

    - `@openclaw/openai-provider`: `api.ts` がプロバイダービルダー、
      デフォルトモデルヘルパー、およびrealtimeプロバイダービルダーをエクスポート
    - `@openclaw/openrouter-provider`: `api.ts` がプロバイダービルダー
      に加えてオンボーディング/設定ヘルパーをエクスポート

    <Tabs>
      <Tab title="トークン交換">
        各推論呼び出しの前にトークン交換が必要なプロバイダー向け:

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
        カスタムリクエストヘッダーまたはbody変更が必要なプロバイダー向け:

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
        汎用HTTPまたはWebSocketトランスポート上で、ネイティブな
        リクエスト/セッションヘッダーまたはメタデータが必要なプロバイダー向け:

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
      OpenClawはこの順序でフックを呼び出します。ほとんどのプロバイダーは2〜3個しか使いません:

      | # | Hook | 使う場面 |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはbase URLデフォルト |
      | 2 | `applyConfigDefaults` | 設定具体化時のプロバイダー所有グローバルデフォルト |
      | 3 | `normalizeModelId` | 参照前のレガシー/preview model-idエイリアスクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のプロバイダーファミリー `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` 設定の正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | configプロバイダー向けネイティブstreaming-usage compat書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有env-marker認証解決 |
      | 8 | `resolveSyntheticAuth` | local/self-hostedまたはconfigベースの合成認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 合成保存プロファイルプレースホルダーをenv/config認証より後ろに下げる |
      | 10 | `resolveDynamicModel` | 任意の上流モデルIDを受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner前のトランスポート書き換え |

    ランタイムフォールバックに関する注意:

    - `normalizeConfig` は、まず一致したプロバイダーを確認し、その後、
      実際に設定を変更するものが現れるまで、他の
      hook対応プロバイダーPluginを順に確認します。
      サポートされたGoogleファミリー設定エントリーを書き換える
      プロバイダーフックがない場合でも、バンドルされたGoogle設定正規化は引き続き適用されます。
    - `resolveConfigApiKey` は、公開されていればプロバイダーフックを使います。バンドルされた
      `amazon-bedrock` 経路には、ここで組み込みのAWS env-markerリゾルバーもありますが、Bedrockランタイム認証自体は引き続きAWS SDK default
      chainを使います。
      | 13 | `contributeResolvedModelCompat` | 別の互換トランスポート配下にあるベンダーモデル向け互換フラグ |
      | 14 | `capabilities` | レガシー静的capabilityバッグ。互換性用のみ |
      | 15 | `normalizeToolSchemas` | 登録前のプロバイダー所有tool-schemaクリーンアップ |
      | 16 | `inspectToolSchemas` | プロバイダー所有tool-schema diagnostics |
      | 17 | `resolveReasoningOutputMode` | タグ付きまたはネイティブreasoning-output契約 |
      | 18 | `prepareExtraParams` | デフォルトリクエストパラメーター |
      | 19 | `createStreamFn` | 完全カスタムのStreamFnトランスポート |
      | 20 | `wrapStreamFn` | 通常stream経路上のカスタムヘッダー/bodyラッパー |
      | 21 | `resolveTransportTurnState` | ネイティブなターンごとのヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブWSセッションヘッダー/クールダウン |
      | 23 | `formatApiKey` | カスタムランタイムトークン形状 |
      | 24 | `refreshOAuth` | カスタムOAuthリフレッシュ |
      | 25 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 26 | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | 27 | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷分類 |
      | 28 | `isCacheTtlEligible` | プロンプトキャッシュTTLゲーティング |
      | 29 | `buildMissingAuthMessage` | カスタム認証不足ヒント |
      | 30 | `suppressBuiltInModel` | 古い上流行を隠す |
      | 31 | `augmentModelCatalog` | 合成forward-compat行 |
      | 32 | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | 33 | `isBinaryThinking` | バイナリthinking on/off互換 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoningサポート互換 |
      | 35 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換 |
      | 36 | `isModernModelRef` | live/smokeモデル一致 |
      | 37 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 38 | `resolveUsageAuth` | カスタム使用量認証情報解析 |
      | 39 | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | 40 | `createEmbeddingProvider` | memory/search向けプロバイダー所有embedding adapter |
      | 41 | `buildReplayPolicy` | カスタムtranscript replay/Compactionポリシー |
      | 42 | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有replay書き換え |
      | 43 | `validateReplayTurns` | 埋め込みrunner前の厳密なreplay-turn検証 |
      | 44 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      プロンプト調整に関する注意:

      - `resolveSystemPromptContribution` を使うと、プロバイダーはモデルファミリー向けに、キャッシュを意識したシステムプロンプトガイダンスを注入できます。挙動が1つのプロバイダー/モデルファミリーに属し、stable/dynamicキャッシュ分割を維持すべき場合は、`before_prompt_build` よりこちらを優先してください。

      詳細な説明と実例については、
      [Internals: Provider Runtime Hooks](/ja-JP/plugins/architecture#provider-runtime-hooks) を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を加える（任意）">
    <a id="step-5-add-extra-capabilities"></a>
    プロバイダーPluginは、テキスト推論に加えて、音声、realtime transcription、realtime
    voice、メディア理解、画像生成、動画生成、web fetch、
    web searchも登録できます。

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

    OpenClawはこれを **hybrid-capability** Pluginとして分類します。これは
    企業向けPlugin（ベンダーごとに1 Plugin）に推奨されるパターンです。
    [Internals: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model) を参照してください。

    動画生成では、上に示したモード認識のcapability形状を優先してください:
    `generate`、`imageToVideo`、`videoToVideo`。`maxInputImages`、
    `maxInputVideos`、`maxDurationSeconds` のような平坦な集約フィールドだけでは、変換モード対応や無効化されたモードを明確に表現できません。

    ストリーミングSTTプロバイダーでは、共有WebSocketヘルパーを優先してください。これにより、providerコード側は上流イベントのマッピングだけを担当しつつ、プロキシキャプチャ、再接続バックオフ、クローズ時フラッシュ、readyハンドシェイク、音声キューイング、close-event diagnosticsがプロバイダー間で一貫します。

    multipart音声をPOSTするバッチSTTプロバイダーでは、
    `openclaw/plugin-sdk/provider-http` の
    `buildAudioTranscriptionFormData(...)` を、プロバイダーHTTPリクエストヘルパーと組み合わせて使ってください。このフォームヘルパーは、互換性のあるtranscription API向けにM4A形式のファイル名が必要なAACアップロードを含め、アップロードファイル名を正規化します。

    音楽生成プロバイダーも同じパターンに従う必要があります:
    プロンプトのみの生成には `generate`、参照画像ベースの生成には `edit` を使います。`maxInputImages`、
    `supportsLyrics`、`supportsFormat` のような平坦な集約フィールドだけでは `edit` サポートを表現できません。明示的な `generate` / `edit` ブロックが期待される契約です。

  </Step>

  <Step title="テスト">
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

## ClawHubへ公開する

プロバイダーPluginは、他の外部コードPluginと同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは旧来のskill専用publishエイリアスは使わないでください。Pluginパッケージでは
`clawhub package publish` を使う必要があります。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers メタデータ
├── openclaw.plugin.json      # プロバイダー認証メタデータ付きmanifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # 使用量エンドポイント（任意）
```

## Catalog order リファレンス

`catalog.order` は、組み込みプロバイダーに対してcatalogをいつマージするかを制御します。

| Order     | タイミング    | 用途                                        |
| --------- | ------------- | ------------------------------------------- |
| `simple`  | 最初のパス    | プレーンなAPIキープロバイダー               |
| `profile` | simpleの後    | 認証プロファイルで制御されるプロバイダー    |
| `paired`  | profileの後   | 複数の関連エントリーを合成する              |
| `late`    | 最後のパス    | 既存プロバイダーを上書きする（衝突時に優先） |

## 次のステップ

- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — Pluginがchannelも提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime` ヘルパー（TTS、search、subagent）
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Plugin Internals](/ja-JP/plugins/architecture#provider-runtime-hooks) — フック詳細とバンドル例
