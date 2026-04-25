---
read_when:
    - 新しい model provider Plugin を作成している場合
    - OpenAI 互換 proxy またはカスタム LLM を OpenClaw に追加したい場合
    - provider auth、catalog、ランタイムフックを理解する必要がある場合
sidebarTitle: Provider plugins
summary: OpenClaw 向け model provider Plugin の作成手順ガイド
title: provider Plugin の作成
x-i18n:
    generated_at: "2026-04-25T13:55:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

このガイドでは、OpenClaw に model provider
（LLM）を追加する provider Plugin の作成手順を説明します。最後には、model catalog、
API key auth、動的 model 解決を備えた provider が完成します。

<Info>
  OpenClaw Plugin をまだ一度も作成したことがない場合は、まず
  基本的なパッケージ構成と manifest セットアップについて
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  provider Plugin は、OpenClaw の通常の推論ループに model を追加します。その model が
  thread、Compaction、またはツールイベントを所有するネイティブ agent daemon 経由で実行される必要がある場合は、
  daemon プロトコル詳細を core に入れるのではなく、provider に [agent harness](/ja-JP/plugins/sdk-agent-harness)
  を組み合わせてください。
</Tip>

## 手順

<Steps>
  <Step title="パッケージと manifest">
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

    manifest では `providerAuthEnvVars` を宣言し、OpenClaw が
    Plugin ランタイムを読み込まずに資格情報を検出できるようにします。provider の変種が別の provider id の auth を再利用すべき場合は `providerAuthAliases`
    を追加してください。`modelSupport`
    は任意で、`acme-large` のような短縮 model id から、ランタイムフックが存在する前でも
    OpenClaw が provider Plugin を自動読み込みできるようにします。provider を
    ClawHub に公開する場合、`package.json` のそれらの `openclaw.compat` と `openclaw.build`
    フィールドは必須です。

  </Step>

  <Step title="provider を登録する">
    最小限の provider には `id`、`label`、`auth`、`catalog` が必要です。

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

    これで動作する provider になります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    `acme-ai/acme-large` を model として選択できるようになります。

    upstream provider が OpenClaw と異なる制御トークンを使う場合は、
    ストリーム経路全体を置き換えるのではなく、小さな双方向テキスト変換を追加してください。

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

    `input` は、転送前に最終 system prompt と text message content を書き換えます。
    `output` は、OpenClaw が自身の制御マーカーやチャネル配信を解析する前に、
    assistant の text delta と最終 text を書き換えます。

    API-key
    auth を持つ 1 つの text provider と、単一の catalog-backed runtime だけを登録するバンドル済み provider では、
    より狭い `defineSingleProviderPluginEntry(...)` ヘルパーを使う方が適しています。

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

    `buildProvider` は、OpenClaw が実際の
    provider auth を解決できるときに使われるライブ catalog 経路です。provider 固有の検出を行ってもかまいません。
    `buildStaticProvider` は、auth
    が未設定でも安全に表示できるオフライン行にだけ使ってください。資格情報を要求したりネットワークリクエストを行ってはいけません。
    OpenClaw の `models list --all` 表示は現在、静的 catalog を
    バンドル済み provider Plugin に対してのみ、空の config、空の env、agent/workspace path なしで実行します。

    auth フローがオンボーディング中に `models.providers.*`、aliases、agent デフォルト model の修正も必要とする場合は、
    `openclaw/plugin-sdk/provider-onboard` の preset ヘルパーを使ってください。より狭いヘルパーとしては
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、
    `createModelCatalogPresetAppliers(...)` があります。

    provider のネイティブエンドポイントが通常の
    `openai-completions` トランスポート上でストリーミング usage block をサポートしている場合は、
    provider-id チェックをハードコードする代わりに
    `openclaw/plugin-sdk/provider-catalog-shared` の共有 catalog ヘルパーを使ってください。`supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` は、エンドポイント機能マップからサポートを検出するため、
    Plugin がカスタム provider id を使っている場合でもネイティブ Moonshot/DashScope 風エンドポイントは引き続きオプトインできます。

  </Step>

  <Step title="動的 model 解決を追加する">
    provider が任意の model ID（proxy や router のようなもの）を受け付ける場合は、
    `resolveDynamicModel` を追加してください。

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

    解決にネットワーク呼び出しが必要なら、非同期の
    warm-up には `prepareDynamicModel` を使ってください。`resolveDynamicModel` はそれが完了した後に再度実行されます。

  </Step>

  <Step title="必要に応じてランタイムフックを追加する">
    ほとんどの provider は `catalog` + `resolveDynamicModel` だけで十分です。provider が必要とする場合にだけ
    フックを段階的に追加してください。

    共有ヘルパービルダーが現在、最も一般的な replay/tool-compat
    ファミリーをカバーしているため、通常 Plugin は各フックを 1 つずつ手作業で配線する必要がありません。

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

    現在利用可能な replay ファミリー:

    | ファミリー | 配線される内容 | バンドル済みの例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 互換トランスポート向けの共有 OpenAI 風 replay ポリシー。tool-call-id のサニタイズ、assistant-first 順序修正、およびそのトランスポートで必要な場合の汎用 Gemini ターン検証を含む | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` に応じて選ばれる Claude 対応 replay ポリシー。Anthropic-message トランスポートは、解決済み model が実際に Claude id の場合にのみ Claude 固有の thinking-block クリーンアップを受けます | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブ Gemini replay ポリシーに加え、bootstrap replay サニタイズとタグ付き reasoning-output モード | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換 proxy トランスポート上で動く Gemini model 向けの Gemini thought-signature サニタイズ。ネイティブ Gemini replay 検証や bootstrap 書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic-message と OpenAI 互換 model 画面を混在させる provider 向けのハイブリッドポリシー。任意の Claude 専用 thinking-block 除去は Anthropic 側に限定されます | `minimax` |

    現在利用可能な stream ファミリー:

    | ファミリー | 配線される内容 | バンドル済みの例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリーム経路上での Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有 proxy ストリーム経路上での Kilo reasoning ラッパー。`kilo/auto` と未対応 proxy reasoning id では注入された thinking をスキップ | `kilocode` |
    | `moonshot-thinking` | config + `/think` レベルからの Moonshot バイナリ native-thinking ペイロードマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリーム経路上での MiniMax fast-mode model 書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: attribution headers、`/fast`/`serviceTier`、text verbosity、ネイティブ Codex web search、reasoning-compat ペイロード整形、Responses context 管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | proxy ルート向け OpenRouter reasoning ラッパー。未対応 model/`auto` のスキップは中央管理 | `openrouter` |
    | `tool-stream-default-on` | Z.AI のように、明示的に無効にされない限り tool streaming を使いたい provider 向けのデフォルトオン `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK seam">
      各ファミリービルダーは、同じパッケージから export されるより低レベルの公開ヘルパーで構成されており、provider が共通パターンから外れる必要があるときに利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および生の replay builder（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini replay ヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と endpoint/model ヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）も export します。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、および共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）と、共有 proxy/provider ラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、基盤となる Gemini スキーマヘルパー（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`）、および xAI 互換ヘルパー（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。バンドル済み xAI Plugin は、xAI ルールの所有権を provider 側に保つために、これらとともに `normalizeResolvedModel` + `contributeResolvedModelCompat` を使います。

      一部の stream ヘルパーは意図的に provider ローカルのままにされています。`@openclaw/anthropic-provider` は、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、およびより低レベルの Anthropic ラッパービルダーを、自身の公開 `api.ts` / `contract-api.ts` seam に保持しています。これは、それらが Claude OAuth beta 処理と `context1m` のゲーティングを符号化しているためです。同様に xAI Plugin も、ネイティブ xAI Responses の整形を自身の `wrapStreamFn` に保持しています（`/fast` エイリアス、デフォルト `tool_stream`、未対応 strict-tool のクリーンアップ、xAI 固有の reasoning-payload 除去）。

      同じ package-root パターンは、`@openclaw/openai-provider`（provider builder、default-model ヘルパー、realtime provider builder）および `@openclaw/openrouter-provider`（provider builder と onboarding/config ヘルパー）も支えています。
    </Accordion>

    <Tabs>
      <Tab title="トークン交換">
        推論呼び出しごとにトークン交換が必要な provider では:

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
        カスタムリクエストヘッダーや body 変更が必要な provider では:

        ```typescript
        // wrapStreamFn は ctx.streamFn から派生した StreamFn を返す
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
      <Tab title="ネイティブトランスポート identity">
        汎用 HTTP または WebSocket トランスポート上で、ネイティブのリクエスト/セッションヘッダーやメタデータが必要な provider では:

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
        使用量/課金データを公開する provider では:

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

    <Accordion title="利用可能な provider フック一覧">
      OpenClaw は次の順にフックを呼び出します。ほとんどの provider は 2〜3 個しか使いません。

      | # | Hook | 使う場面 |
      | --- | --- | --- |
      | 1 | `catalog` | model catalog または base URL のデフォルト |
      | 2 | `applyConfigDefaults` | config 実体化時の provider 所有グローバルデフォルト |
      | 3 | `normalizeModelId` | lookup 前の旧/preview model-id エイリアスクリーンアップ |
      | 4 | `normalizeTransport` | 汎用 model 組み立て前の provider-family `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` config の正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config provider 向けネイティブ streaming-usage 互換書き換え |
      | 7 | `resolveConfigApiKey` | provider 所有の env-marker auth 解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホスト型または config ベースの synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic な保存済み profile プレースホルダーを env/config auth の後ろに下げる |
      | 10 | `resolveDynamicModel` | 任意の upstream model ID を受け付ける |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner 前のトランスポート書き換え |
      | 13 | `contributeResolvedModelCompat` | 別の互換トランスポートの背後にある vendor model 用の compat フラグ |
      | 14 | `capabilities` | 旧来の静的 capability bag。互換性目的のみ |
      | 15 | `normalizeToolSchemas` | 登録前の provider 所有ツールスキーマクリーンアップ |
      | 16 | `inspectToolSchemas` | provider 所有ツールスキーマ診断 |
      | 17 | `resolveReasoningOutputMode` | タグ付き vs ネイティブ reasoning-output コントラクト |
      | 18 | `prepareExtraParams` | デフォルトのリクエストパラメータ |
      | 19 | `createStreamFn` | 完全カスタムの StreamFn トランスポート |
      | 20 | `wrapStreamFn` | 通常ストリーム経路上のカスタムヘッダー/body ラッパー |
      | 21 | `resolveTransportTurnState` | ネイティブのターンごとのヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | 23 | `formatApiKey` | カスタムランタイムトークン形式 |
      | 24 | `refreshOAuth` | カスタム OAuth リフレッシュ |
      | 25 | `buildAuthDoctorHint` | auth 修復ガイダンス |
      | 26 | `matchesContextOverflowError` | provider 所有のオーバーフロー検出 |
      | 27 | `classifyFailoverReason` | provider 所有の rate-limit/overload 分類 |
      | 28 | `isCacheTtlEligible` | prompt cache TTL ゲーティング |
      | 29 | `buildMissingAuthMessage` | カスタム missing-auth ヒント |
      | 30 | `suppressBuiltInModel` | 古くなった upstream 行を隠す |
      | 31 | `augmentModelCatalog` | synthetic な forward-compat 行 |
      | 32 | `resolveThinkingProfile` | model 固有の `/think` オプションセット |
      | 33 | `isBinaryThinking` | バイナリ thinking on/off 互換性 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning サポート互換性 |
      | 35 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 36 | `isModernModelRef` | live/smoke model マッチング |
      | 37 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 38 | `resolveUsageAuth` | カスタム usage 資格情報解析 |
      | 39 | `fetchUsageSnapshot` | カスタム usage エンドポイント |
      | 40 | `createEmbeddingProvider` | memory/search 用の provider 所有 embedding アダプター |
      | 41 | `buildReplayPolicy` | カスタム transcript replay/Compaction ポリシー |
      | 42 | `sanitizeReplayHistory` | 汎用クリーンアップ後の provider 固有 replay 書き換え |
      | 43 | `validateReplayTurns` | embedded runner 前の厳格な replay-turn 検証 |
      | 44 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      ランタイムフォールバックに関する注意:

      - `normalizeConfig` は、まず一致した provider を確認し、その後、実際に config を変更するものが見つかるまで他の hook 対応 provider Plugin を確認します。Google 系の対応 config エントリを provider フックが書き換えない場合でも、バンドル済み Google config normalizer は引き続き適用されます。
      - `resolveConfigApiKey` は、公開されていれば provider フックを使います。バンドル済み `amazon-bedrock` 経路には、Bedrock ランタイム auth 自体は引き続き AWS SDK default chain を使うにもかかわらず、ここに組み込みの AWS env-marker resolver もあります。
      - `resolveSystemPromptContribution` を使うと、provider は model family 向けに cache-aware な system-prompt ガイダンスを注入できます。挙動が 1 つの provider/model family に属し、stable/dynamic cache 分割を保つべき場合は、`before_prompt_build` よりこちらを優先してください。

      詳細な説明と実例については、[Internals: Provider Runtime Hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
    </Accordion>

  </Step>

  <Step title="追加の capability を加える（任意）">
    provider Plugin は、speech、realtime transcription、realtime
    voice、media understanding、image generation、video generation、web fetch、
    web search を text inference と一緒に登録できます。OpenClaw はこれを
    **hybrid-capability** Plugin と分類します。これは company Plugin に推奨されるパターンです（ベンダーごとに 1 Plugin）。
    詳しくは
    [Internals: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model) を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、各 capability を `register(api)` 内で登録してください。必要なタブだけを選んでください:

    <Tabs>
      <Tab title="Speech（TTS）">
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

        provider HTTP 失敗には `assertOkOrThrowProviderError(...)` を使ってください。これにより
        Plugin 間で、上限付きのエラー body 読み取り、JSON エラー解析、
        request-id 接尾辞の扱いを共有できます。
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` を使うのが推奨です。共有
        ヘルパーが proxy 捕捉、再接続バックオフ、close 時のフラッシュ、ready
        handshake、audio queueing、close event 診断を処理します。Plugin 側は upstream event をマップするだけで済みます。

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

        multipart 音声を POST するバッチ型 STT provider では、
        `openclaw/plugin-sdk/provider-http` の
        `buildAudioTranscriptionFormData(...)` を使ってください。このヘルパーは upload
        filename を正規化します。特に、互換性のある文字起こし API で
        M4A 風 filename が必要な AAC upload を正しく扱えます。
      </Tab>
      <Tab title="Realtime voice">
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
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Image と video generation">
        video capability では **mode-aware** な形を使います: `generate`、
        `imageToVideo`、`videoToVideo`。`maxInputImages` / `maxInputVideos` / `maxDurationSeconds` のような
        平坦な集約フィールドだけでは、transform-mode サポートや無効な mode を
        きれいに表現できません。music generation も同じパターンで、明示的な `generate` /
        `edit` ブロックを使います。

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
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch と search">
        ```typescript
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="テスト">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // index.ts または専用ファイルから provider config object を export する
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("動的 model を解決する", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("key が利用可能なとき catalog を返す", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("key がないとき null catalog を返す", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## ClawHub に公開する

provider Plugin は、他の外部コード Plugin と同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは旧来の skill 専用 publish alias は使わないでください。Plugin パッケージでは
`clawhub package publish` を使うべきです。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers メタデータ
├── openclaw.plugin.json      # provider auth メタデータを含む manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # usage エンドポイント（任意）
```

## catalog order リファレンス

`catalog.order` は、組み込み
provider に対して自分の catalog をどのタイミングでマージするかを制御します。

| Order     | タイミング   | 用途                                            |
| --------- | ------------ | ----------------------------------------------- |
| `simple`  | 最初のパス   | 単純な API-key provider                         |
| `profile` | simple の後  | auth profile によってゲートされる provider      |
| `paired`  | profile の後 | 複数の関連エントリを合成する                    |
| `late`    | 最後のパス   | 既存 provider を上書きする（衝突時に勝つ）       |

## 次のステップ

- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — Plugin が channel も提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime` ヘルパー（TTS、search、subagent）
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [Plugin Internals](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) — フック詳細とバンドル済み例

## 関連

- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
- [Building channel plugins](/ja-JP/plugins/sdk-channel-plugins)
