---
read_when:
    - プロバイダーのランタイムフック、チャネルライフサイクル、またはpackage packを実装する場合
    - Pluginの読み込み順序またはレジストリ状態をデバッグする場合
    - 新しいPlugin機能またはコンテキストエンジンPluginを追加する場合
summary: 'Pluginアーキテクチャの内部: 読み込みパイプライン、レジストリ、ランタイムフック、HTTPルート、リファレンステーブル'
title: Pluginアーキテクチャの内部
x-i18n:
    generated_at: "2026-04-25T13:52:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

公開の機能モデル、Pluginの形状、所有/実行
契約については、[Plugin architecture](/ja-JP/plugins/architecture)を参照してください。このページは、
内部メカニズムのリファレンスです: 読み込みパイプライン、レジストリ、ランタイムフック、
Gateway HTTPルート、インポートパス、スキーマテーブル。

## 読み込みパイプライン

起動時、OpenClawはおおむね次のことを行います。

1. 候補Pluginルートを検出する
2. nativeまたは互換bundleのmanifestとpackage metadataを読む
3. 安全でない候補を拒否する
4. Plugin設定を正規化する（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 各候補の有効化可否を決める
6. 有効なnative moduleを読み込む: ビルド済みのバンドルmoduleはnative loaderを使い、
   未ビルドのnative Pluginはjitiを使う
7. native `register(api)`フックを呼び、登録内容をplugin registryへ収集する
8. registryをコマンド/ランタイムサーフェスへ公開する

<Note>
`activate`は`register`のレガシー別名です。loaderは存在する方（`def.register ?? def.activate`）を解決し、同じタイミングで呼び出します。すべてのバンドル済みPluginは`register`を使っています。新しいPluginでは`register`を推奨します。
</Note>

安全性ゲートは、ランタイム実行**前**に行われます。候補は、
エントリがplugin rootから外へ逃げる場合、パスがworld-writableである場合、または
バンドル済みでないPluginについてパス所有権が不審に見える場合にブロックされます。

### manifest優先の挙動

manifestはcontrol-planeの信頼できる情報源です。OpenClawはこれを使って次を行います。

- Pluginを識別する
- 宣言されたchannel/Skills/config schemaまたはbundle capabilityを検出する
- `plugins.entries.<id>.config`を検証する
- Control UIのラベル/プレースホルダーを補強する
- install/catalog metadataを表示する
- Pluginランタイムを読み込まずに、低コストなactivationとsetup記述子を保持する

native Pluginでは、ランタイムmoduleがdata-plane部分です。これは
フック、ツール、コマンド、providerフローなどの実際の挙動を登録します。

任意のmanifest `activation`および`setup`ブロックはcontrol-planeにとどまります。
これらはactivation planningとsetup discoveryのためのmetadata-only記述子であり、
ランタイム登録、`register(...)`、`setupEntry`の代わりにはなりません。
最初のライブactivation consumerは、manifestのcommand、channel、providerヒントを使って、
より広いregistry materializationの前にPlugin読み込みを絞り込みます。

- CLI読み込みは、要求された主要commandを所有するPluginに絞り込まれます
- channel setup/plugin解決は、要求された
  channel idを所有するPluginに絞り込まれます
- 明示的なprovider setup/runtime解決は、要求された
  provider idを所有するPluginに絞り込まれます

activation plannerは、既存呼び出し元向けのids-only APIと、
新しいdiagnostics向けのplan APIの両方を公開します。plan entryは、
なぜそのPluginが選ばれたかを報告し、明示的な`activation.*` plannerヒントと、
`providers`、`channels`、`commandAliases`、`setup.providers`,
`contracts.tools`、hooksなどのmanifest ownershipフォールバックを分離します。この理由の分離が互換性境界です:
既存のPlugin metadataは引き続き動作し、新しいコードは
ランタイム読み込みセマンティクスを変えずに、広いヒントやフォールバック挙動を検出できます。

setup discoveryは現在、`setup.providers`や`setup.cliBackends`のような
descriptor所有idを優先して候補Pluginを絞り込み、その後で
setup時ランタイムフックがまだ必要なPlugin向けに`setup-api`へフォールバックします。provider
setupフローは最初にmanifest `providerAuthChoices`を使い、その後
互換性のためにランタイムwizard choicesとinstall-catalog choicesへフォールバックします。明示的な
`setup.requiresRuntime: false`はdescriptor-onlyの打ち切りであり、省略された
`requiresRuntime`は互換性のためレガシーsetup-apiフォールバックを維持します。検出された
複数Pluginが同じ正規化済みsetup providerまたはCLI
backend idを主張した場合、setup lookupは検出順に頼らず、その曖昧なownerを拒否します。setupランタイムが実行される場合でも、registry diagnosticsは
`setup.providers` / `setup.cliBackends`と、setup-apiによって登録されたproviderまたはCLI
backendの間のずれを、レガシーPluginをブロックせずに報告します。

### loaderがキャッシュするもの

OpenClawは、短命のプロセス内キャッシュとして次を保持します。

- discovery結果
- manifest registryデータ
- 読み込み済みplugin registry

これらのキャッシュは、バースト的な起動や繰り返しコマンドのオーバーヘッドを削減します。これは
永続化ではなく、短命のパフォーマンスキャッシュとして考えてください。

パフォーマンス注記:

- これらのキャッシュを無効にするには`OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1`または
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`を設定します。
- キャッシュ期間は`OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS`および
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`で調整します。

## レジストリモデル

読み込まれたPluginは、コアのランダムなグローバルを直接変更しません。代わりに、
中央plugin registryへ登録します。

registryが追跡するもの:

- plugin record（identity、source、origin、status、diagnostics）
- tools
- legacy hooksとtyped hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin所有command

その後、コア機能はplugin moduleへ直接話しかける代わりに、そのregistryから読み取ります。これにより、読み込みは一方向に保たれます。

- plugin module -> registry registration
- core runtime -> registry consumption

この分離は保守性に重要です。つまり、ほとんどのコアサーフェスは
1つの統合点だけを必要とします: 「registryを読む」であり、「各plugin moduleを特別扱いする」ではありません。

## 会話バインディングコールバック

会話をバインドするPluginは、承認が解決されたときに反応できます。

bindリクエストが承認または拒否された後にコールバックを受け取るには、
`api.onConversationBindingResolved(...)`を使います。

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // このplugin + conversationに対するbindingが存在するようになった。
        console.log(event.binding?.conversationId);
        return;
      }

      // リクエストは拒否された。ローカルのpending状態をクリアする。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

コールバックペイロードのフィールド:

- `status`: `"approved"`または`"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または`"deny"`
- `binding`: 承認済みリクエストに対する解決済みbinding
- `request`: 元のリクエスト要約、detach hint、sender id、
  conversation metadata

このコールバックは通知専用です。誰が会話をバインド可能かは変更せず、
コアの承認処理が完了した後に実行されます。

## providerランタイムフック

provider Pluginには3つのレイヤーがあります。

- **manifest metadata**: 安価なランタイム前lookup用:
  `setup.providers[].envVars`、非推奨の互換性用`providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`
- **設定時フック**: `catalog`（レガシーの`discovery`）と
  `applyConfigDefaults`
- **ランタイムフック**: auth、model解決、
  stream wrapping、thinking levels、replay policy、usage endpointをカバーする40以上の任意フック。完全な一覧は
  [Hook order and usage](#hook-order-and-usage)を参照。

OpenClawは引き続き、汎用agent loop、failover、transcript処理、そして
tool policyを所有します。これらのフックは、provider固有挙動のための拡張サーフェスであり、
完全なカスタム推論transportを必要としません。

providerに、汎用auth/status/model-picker経路がproviderランタイムを読み込まずに認識すべき環境変数ベース認証情報がある場合は、manifest `setup.providers[].envVars`を使います。非推奨の`providerAuthEnvVars`も、非推奨期間中は互換アダプターで引き続き読まれ、
それを使う非バンドルPluginにはmanifest diagnosticが付与されます。あるprovider idが別のprovider idのenv vars、auth profiles、
config-backed auth、API-key onboarding choiceを再利用すべき場合は、manifest
`providerAuthAliases`を使います。onboarding/auth-choice CLIサーフェスが、providerランタイムを読み込まずに
そのproviderのchoice id、group label、単純な1フラグauth配線を知る必要がある場合は、manifest
`providerAuthChoices`を使います。operator向けヒント、たとえばonboarding labelやOAuth
client-id/client-secret設定変数のような用途には、providerランタイム
`envVars`を保持してください。

channelに、汎用shell-envフォールバック、config/statusチェック、またはsetup promptが
channelランタイムを読み込まずに認識すべきenv駆動のauthまたはsetupがある場合は、manifest `channelEnvVars`を使います。

### フック順序と用途

model/provider Pluginについて、OpenClawはおおむね次の順でフックを呼びます。
「When to use」列は、すばやい判断ガイドです。

| #   | フック | 役割 | 使用する場面 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json`生成中に、provider設定を`models.providers`へ公開する                                | providerがcatalogまたはbase URLのデフォルトを所有している場合                                                                                                  |
| 2   | `applyConfigDefaults`             | 設定の具体化中に、providerが所有するグローバル設定デフォルトを適用する                                      | デフォルトがauth mode、env、またはproviderのmodel-familyセマンティクスに依存する場合                                                                         |
| --  | _(built-in model lookup)_         | OpenClawは最初に通常のregistry/catalog経路を試す                                                          | _(pluginフックではありません)_                                                                                                                         |
| 3   | `normalizeModelId`                | lookup前に、レガシーまたはpreviewのmodel-idエイリアスを正規化する                                                     | 正規のmodel解決の前に、providerがエイリアスクリーンアップを所有している場合                                                                                 |
| 4   | `normalizeTransport`              | 汎用model組み立ての前に、provider-familyの`api` / `baseUrl`を正規化する                                      | 同じtransport family内のカスタムprovider idに対するtransportクリーンアップをproviderが所有している場合                                                          |
| 5   | `normalizeConfig`                 | ランタイム/provider解決の前に`models.providers.<id>`を正規化する                                           | pluginとともにあるべき設定クリーンアップがproviderに必要な場合。バンドル済みGoogle-familyヘルパーも、対応するGoogle設定エントリの後方支援を行います   |
| 6   | `applyNativeStreamingUsageCompat` | 設定providerに対してnative streaming-usage互換性の書き換えを適用する                                               | providerが、endpoint駆動のnative streaming usage metadata修正を必要とする場合                                                                          |
| 7   | `resolveConfigApiKey`             | ランタイムauth読み込み前に、設定provider用のenv-marker authを解決する                                       | providerがprovider所有のenv-marker APIキー解決を持つ場合。`amazon-bedrock`には、ここに組み込みのAWS env-marker resolverもあります                  |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル/セルフホストまたはconfig-backed authを表面化する                                   | providerが合成/ローカル認証情報マーカーで動作できる場合                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | provider所有の外部auth profileを重ねる。デフォルトの`persistence`はCLI/app所有認証情報に対して`runtime-only` | providerが、コピーしたrefresh tokenを永続化せずに外部auth認証情報を再利用する場合。manifestに`contracts.externalAuthProviders`を宣言してください |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの合成profileプレースホルダーの優先順位を、env/config-backed authより下げる                                      | providerが、優先されるべきでない合成プレースホルダーprofileを保存する場合                                                                 |
| 11  | `resolveDynamicModel`             | まだローカルregistryにないprovider所有model idに対する同期フォールバック                                       | providerが任意のupstream model idを受け入れる場合                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップを行い、その後`resolveDynamicModel`が再実行される                                                           | providerが未知id解決前にネットワークmetadataを必要とする場合                                                                                  |
| 13  | `normalizeResolvedModel`          | embedded runnerが解決済みmodelを使う前の最終書き換え                                               | providerがtransport書き換えを必要とするが、依然としてコアtransportを使う場合                                                                             |
| 14  | `contributeResolvedModelCompat`   | 別の互換transportの背後にあるvendor modelに対して互換フラグを提供する                                  | provider自体を引き継がずに、proxy transport上で自分のmodelを認識したい場合                                                       |
| 15  | `capabilities`                    | 共有コアロジックで使われるprovider所有のtranscript/tooling metadata                                           | providerがtranscript/provider-family固有の癖を必要とする場合                                                                                              |
| 16  | `normalizeToolSchemas`            | embedded runnerが参照する前にツールschemaを正規化する                                                    | providerがtransport-familyのschemaクリーンアップを必要とする場合                                                                                                |
| 17  | `inspectToolSchemas`              | 正規化後にprovider所有のschema diagnosticsを表面化する                                                  | コアへprovider固有ルールを教え込まずに、providerがキーワード警告を出したい場合                                                                 |
| 18  | `resolveReasoningOutputMode`      | nativeまたはtaggedのreasoning-output契約を選択する                                                              | native fieldの代わりにtaggedなreasoning/final outputをproviderが必要とする場合                                                                         |
| 19  | `prepareExtraParams`              | 汎用stream option wrapperの前にリクエストパラメーターを正規化する                                              | providerがデフォルトrequest paramsまたはproviderごとのparamクリーンアップを必要とする場合                                                                           |
| 20  | `createStreamFn`                  | カスタムtransportで通常のstream経路を完全に置き換える                                                   | wrapperだけではなく、providerがカスタムwire protocolを必要とする場合                                                                                     |
| 21  | `wrapStreamFn`                    | 汎用wrapper適用後のstream wrapper                                                              | カスタムtransportなしで、providerがrequest header/body/model互換wrapperを必要とする場合                                                          |
| 22  | `resolveTransportTurnState`       | nativeなターンごとのtransport headerまたはmetadataを付与する                                                           | providerが、provider-nativeなturn identityを汎用transportで送信したい場合                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | nativeなWebSocket headerまたはsession cool-down policyを付与する                                                    | providerが、session headerまたはフォールバックポリシーを汎用WS transportで調整したい場合                                                               |
| 24  | `formatApiKey`                    | auth-profile formatter: 保存済みprofileをランタイムの`apiKey`文字列にする                                     | providerが追加のauth metadataを保存し、カスタムのランタイムtoken形状を必要とする場合                                                                    |
| 25  | `refreshOAuth`                    | カスタムrefresh endpointまたはrefresh-failure policy向けのOAuth refresh上書き                                  | providerが共有の`pi-ai` refresherに適合しない場合                                                                                           |
| 26  | `buildAuthDoctorHint`             | OAuth refresh失敗時に追記される修復ヒント                                                                  | refresh失敗後にprovider所有のauth修復ガイダンスを必要とする場合                                                                      |
| 27  | `matchesContextOverflowError`     | provider所有のcontext-window overflow matcher                                                                 | 汎用ヒューリスティクスでは見逃すraw overflow errorをproviderが持つ場合                                                                                |
| 28  | `classifyFailoverReason`          | provider所有のfailover reason分類                                                                  | raw API/transport errorをrate-limit/overloadなどへproviderがマッピングできる場合                                                                          |
| 29  | `isCacheTtlEligible`              | proxy/backhaul provider向けのprompt-cacheポリシー                                                               | providerがproxy固有のcache TTL gatingを必要とする場合                                                                                                |
| 30  | `buildMissingAuthMessage`         | 汎用missing-auth recovery messageの置き換え                                                      | provider固有のmissing-auth recoveryヒントをproviderが必要とする場合                                                                                 |
| 31  | `suppressBuiltInModel`            | 古いupstream modelの抑制と、任意のユーザー向けerror hint                                          | providerが古いupstream行を隠すか、vendor hintに置き換える必要がある場合                                                                 |
| 32  | `augmentModelCatalog`             | discovery後にsynthetic/final catalog行を追加する                                                          | `models list`やpickerで、providerがsyntheticなforward-compat行を必要とする場合                                                                     |
| 33  | `resolveThinkingProfile`          | model固有の`/think`レベル集合、表示ラベル、デフォルト                                                 | providerが、選択したmodel向けにカスタムthinkingラダーまたは二値ラベルを公開する場合                                                                 |
| 34  | `isBinaryThinking`                | on/offのreasoningトグル互換フック                                                                     | providerが二値のthinking on/offのみを公開する場合                                                                                                  |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning対応の互換フック                                                                   | providerが、modelの一部サブセットに対してのみ`xhigh`を提供したい場合                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | デフォルト`/think`レベルの互換フック                                                                      | model familyに対するデフォルト`/think`ポリシーをproviderが所有する場合                                                                                      |
| 37  | `isModernModelRef`                | ライブprofile filterとsmoke選択のためのmodern-model matcher                                              | ライブ/smoke向けの優先modelマッチングをproviderが所有する場合                                                                                             |
| 38  | `prepareRuntimeAuth`              | 推論直前に、設定済み認証情報を実際のランタイムtoken/keyへ交換する                       | providerがtoken交換または短命のrequest credentialを必要とする場合                                                                             |
| 39  | `resolveUsageAuth`                | `/usage`および関連ステータスサーフェス向けに、usage/billing認証情報を解決する                                     | providerがカスタムusage/quota tokenパースまたは別のusage credentialを必要とする場合                                                               |
| 40  | `fetchUsageSnapshot`              | auth解決後に、provider固有のusage/quotaスナップショットを取得して正規化する                             | providerがprovider固有のusage endpointまたはpayload parserを必要とする場合                                                                           |
| 41  | `createEmbeddingProvider`         | memory/search向けにprovider所有のembedding adapterを構築する                                                     | memory embedding挙動がprovider pluginに属する場合                                                                                    |
| 42  | `buildReplayPolicy`               | provider向けのtranscript handlingを制御するreplay policyを返す                                        | providerがカスタムtranscript policy（例: thinking-block stripping）を必要とする場合                                                               |
| 43  | `sanitizeReplayHistory`           | 汎用transcript cleanup後にreplay historyを書き換える                                                        | 共有Compactionヘルパーを超えて、provider固有のreplay書き換えをproviderが必要とする場合                                                             |
| 44  | `validateReplayTurns`             | embedded runner前の最終replay-turn検証または再整形                                           | provider transportが、汎用sanitation後により厳密なturn検証を必要とする場合                                                                    |
| 45  | `onModelSelected`                 | modelがアクティブになったときに、provider所有の選択後副作用を実行する                                                                 | modelが有効になった際に、telemetryまたはprovider所有stateをproviderが必要とする場合                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig`は、最初に一致した
provider pluginを確認し、その後、実際にmodel idまたはtransport/configを変更するものが出るまで、他のフック対応provider pluginへフォールスルーします。これにより、
呼び出し元がどのバンドル済みpluginが書き換えを所有しているかを知らなくても、
alias/互換provider shimが機能します。どのproviderフックも対応する
Google-family configエントリを書き換えない場合でも、バンドル済みGoogle config normalizerが
その互換性クリーンアップを適用します。

providerが完全にカスタムなwire protocolやカスタムrequest executorを必要とする場合、
それは別クラスの拡張です。これらのフックは、依然としてOpenClawの通常の推論ループ上で動作するprovider挙動向けです。

### providerの例

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 組み込みの例

バンドル済みprovider pluginは、上記フックを組み合わせて各vendorのcatalog、
auth、thinking、replay、usage要件に適合させています。信頼できるフック集合は
各pluginの`extensions/`配下にあり、このページでは一覧をそのまま複製するのではなく
形状を示しています。

<AccordionGroup>
  <Accordion title="パススルーcatalog provider">
    OpenRouter、Kilocode、Z.AI、xAIは`catalog`に加えて
    `resolveDynamicModel` / `prepareDynamicModel`を登録し、OpenClawの静的catalogより前に
    upstream model idを表面化できるようにしています。
  </Accordion>
  <Accordion title="OAuthとusage endpoint provider">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.aiは
    `prepareRuntimeAuth`または`formatApiKey`と、`resolveUsageAuth` +
    `fetchUsageSnapshot`を組み合わせて、token交換と`/usage`統合を所有します。
  </Accordion>
  <Accordion title="replayとtranscript cleanup family">
    共有の名前付きfamily（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各pluginが
    cleanupを再実装する代わりに、providerは`buildReplayPolicy`で
    transcript policyへオプトインできます。
  </Accordion>
  <Accordion title="catalog-only provider">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、および
    `volcengine`は`catalog`だけを登録し、共有推論ループに乗ります。
  </Accordion>
  <Accordion title="Anthropic固有のstream helper">
    Beta header、`/fast` / `serviceTier`、`context1m`は
    汎用SDK内ではなく、Anthropic pluginの公開`api.ts` / `contract-api.ts`シーム
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）の中にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Pluginは`api.runtime`経由で、選択されたコアヘルパーへアクセスできます。TTSの場合:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

注:

- `textToSpeech`は、ファイル/音声ノート向けサーフェス用の通常のコアTTS出力ペイロードを返します。
- コアの`messages.tts`設定とprovider選択を使います。
- PCM音声buffer + sample rateを返します。Plugin側でprovider向けにresample/encodeする必要があります。
- `listVoices`はproviderごとに任意です。vendor所有のvoice pickerやsetupフローに使います。
- voice一覧には、provider対応picker向けにlocale、gender、personality tagのような、より豊富なmetadataを含められます。
- 現在、telephonyに対応しているのはOpenAIとElevenLabsです。Microsoftは未対応です。

Pluginは`api.registerSpeechProvider(...)`経由でspeech providerを登録することもできます。

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

注:

- TTSのポリシー、フォールバック、返信配信はコアに残してください。
- vendor所有の音声合成挙動にはspeech providerを使います。
- レガシーのMicrosoft `edge`入力は`microsoft` provider idへ正規化されます。
- 推奨される所有モデルは企業単位です。OpenClawがそれらの
  capability contractを追加していくにつれ、1つのvendor pluginが
  text、speech、image、将来のmedia providerをまとめて所有できます。

画像/音声/動画の理解については、Pluginは汎用key/value bagではなく、
1つのtypedなmedia-understanding providerを登録します。

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注:

- オーケストレーション、フォールバック、設定、チャネル配線はコアに残してください。
- vendor挙動はprovider pluginに残してください。
- 加法的な拡張はtypedのままであるべきです: 新しい任意メソッド、新しい任意の
  result field、新しい任意capability。
- 動画生成もすでに同じパターンに従っています:
  - コアがcapability contractとruntime helperを所有する
  - vendor pluginが`api.registerVideoGenerationProvider(...)`を登録する
  - feature/channel pluginが`api.runtime.videoGeneration.*`を利用する

media-understandingのランタイムヘルパーについて、Pluginは次を呼び出せます。

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

音声文字起こしについては、Pluginはmedia-understandingランタイム
または古いSTT aliasのどちらも使えます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIMEを確実に推定できない場合は任意:
  mime: "audio/ogg",
});
```

注:

- `api.runtime.mediaUnderstanding.*`は、
  画像/音声/動画理解のための推奨される共有サーフェスです。
- コアのmedia-understanding音声設定（`tools.media.audio`）とproviderフォールバック順を使います。
- 文字起こし出力が生成されなかった場合（たとえばスキップ/未対応入力）は`{ text: undefined }`を返します。
- `api.runtime.stt.transcribeAudioFile(...)`は、互換性aliasとして引き続き存在します。

Pluginは`api.runtime.subagent`を通じて、バックグラウンドsubagent実行を起動することもできます。

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注:

- `provider`と`model`は、永続的なセッション変更ではなく、実行ごとの任意上書きです。
- OpenClawは、それらの上書きフィールドを信頼された呼び出し元に対してのみ反映します。
- plugin所有のフォールバック実行については、operatorが`plugins.entries.<id>.subagent.allowModelOverride: true`でオプトインする必要があります。
- 信頼されたpluginを特定の正規`provider/model`ターゲットに制限するには`plugins.entries.<id>.subagent.allowedModels`を、任意ターゲットを明示的に許可するには`"*"`を使います。
- 信頼されていないpluginのsubagent実行も動作しますが、上書きリクエストは黙ってフォールバックされるのではなく拒否されます。

web検索については、Pluginはagent tool配線へ直接入り込む代わりに、
共有ランタイムヘルパーを利用できます。

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Pluginは
`api.registerWebSearchProvider(...)`経由でweb-search providerを登録することもできます。

注:

- provider選択、認証情報解決、共有requestセマンティクスはコアに残してください。
- vendor固有の検索transportにはweb-search providerを使ってください。
- `api.runtime.webSearch.*`は、agent tool wrapperに依存せずに検索挙動を必要とするfeature/channel plugin向けの推奨共有サーフェスです。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: 設定済みimage-generation provider chainを使って画像を生成します。
- `listProviders(...)`: 利用可能なimage-generation providerとそのcapabilityを一覧表示します。

## Gateway HTTPルート

Pluginは`api.registerHttpRoute(...)`でHTTP endpointを公開できます。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

ルートフィールド:

- `path`: gateway HTTPサーバー配下のルートパス
- `auth`: 必須。通常のgateway authを要求するには`"gateway"`を、plugin管理のauth/Webhook検証には`"plugin"`を使います。
- `match`: 任意。`"exact"`（デフォルト）または`"prefix"`。
- `replaceExisting`: 任意。同じpluginが自分自身の既存ルート登録を置き換えることを許可します。
- `handler`: ルートがリクエストを処理したときに`true`を返します。

注:

- `api.registerHttpHandler(...)`は削除されており、plugin読み込みエラーの原因になります。代わりに`api.registerHttpRoute(...)`を使ってください。
- Pluginルートは`auth`を明示的に宣言する必要があります。
- 完全一致の`path + match`競合は、`replaceExisting: true`でない限り拒否され、あるpluginが別のpluginのルートを置き換えることはできません。
- `auth`レベルが異なる重複ルートは拒否されます。`exact`/`prefix`フォールスルーチェーンは同じauthレベル内のみにしてください。
- `auth: "plugin"`ルートは、operatorランタイムスコープを自動では受け取りません。これらはplugin管理のWebhook/署名検証用であり、特権Gateway helper呼び出し用ではありません。
- `auth: "gateway"`ルートはGatewayリクエストランタイムスコープ内で実行されますが、そのスコープは意図的に保守的です:
  - 共有シークレットbearer auth（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が`x-openclaw-scopes`を送っても、plugin-routeランタイムスコープは`operator.write`に固定されます
  - 信頼されたidentity-bearing HTTPモード（たとえば`trusted-proxy`またはプライベートingress上の`gateway.auth.mode = "none"`）では、`x-openclaw-scopes`ヘッダーが明示的に存在する場合にのみそれを尊重します
  - それらのidentity-bearing plugin-route requestで`x-openclaw-scopes`が存在しない場合、ランタイムスコープは`operator.write`へフォールバックします
- 実務上のルール: gateway-auth pluginルートを暗黙のadminサーフェスだと想定しないでください。admin専用の挙動が必要なら、identity-bearing auth modeを要求し、明示的な`x-openclaw-scopes`ヘッダー契約を文書化してください。

## Plugin SDKインポートパス

新しいPluginを作成するときは、巨大な`openclaw/plugin-sdk`ルート
barrelではなく、狭いSDK subpathを使ってください。コアsubpath:

| Subpath                             | 用途                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin登録プリミティブ                     |
| `openclaw/plugin-sdk/channel-core`  | Channel entry/build helper                        |
| `openclaw/plugin-sdk/core`          | 汎用共有helperと包括的な契約       |
| `openclaw/plugin-sdk/config-schema` | ルート`openclaw.json` Zod schema（`OpenClawSchema`） |

Channel Pluginは、狭いシーム群から選択します — `channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`,
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`,
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`,
`channel-targets`、`channel-actions`。承認の挙動は、無関係な
pluginフィールドをまたいで混在させるのではなく、1つの`approvalCapability`契約に
集約すべきです。[Channel plugins](/ja-JP/plugins/sdk-channel-plugins)を参照してください。

ランタイムおよび設定helperは、対応する`*-runtime` subpath配下にあります
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`,
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store`など）。

<Info>
`openclaw/plugin-sdk/channel-runtime`は非推奨です — 古いplugin向けの互換shimです。新しいコードでは、より狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のentry point（各バンドル済みplugin package rootごと）:

- `index.js` — バンドル済みplugin entry
- `api.js` — helper/types barrel
- `runtime-api.js` — ランタイム専用barrel
- `setup-entry.js` — setup plugin entry

外部Pluginは`openclaw/plugin-sdk/*` subpathのみをインポートすべきです。コアからも別pluginからも、別plugin packageの`src/*`を
インポートしてはいけません。Facade読み込みentry pointは、存在する場合は
アクティブなランタイム設定スナップショットを優先し、なければディスク上の解決済み設定ファイルへフォールバックします。

`image-generation`、`media-understanding`、`speech`のような
capability固有subpathは、今日バンドル済みPluginがそれらを使っているため存在します。これらは
自動的に長期凍結された外部契約というわけではありません。依存する場合は、関連するSDK
referenceページを確認してください。

## Messageツールschema

Pluginは、reaction、read、pollのような非messageプリミティブに対する
channel固有の`describeMessageTool(...)` schema
contributionを所有すべきです。共有send presentationには、provider-nativeなbutton、component、block、card fieldではなく、汎用`MessagePresentation`契約を使ってください。
契約、フォールバックルール、provider mapping、plugin author向けチェックリストについては[Message Presentation](/ja-JP/plugins/message-presentation)を参照してください。

送信可能Pluginは、message capabilityを通じて何を描画できるかを宣言します。

- セマンティックpresentation block（`text`、`context`、`divider`、`buttons`、`select`）に対する`presentation`
- pinされた配信要求に対する`delivery-pin`

presentationをnativeに描画するか、textへ劣化させるかはコアが決定します。
汎用message toolからprovider-native UI escape hatchを公開しないでください。
レガシーnative schema用の非推奨SDK helperは、既存サードパーティPlugin向けに引き続きエクスポートされていますが、新しいPluginでは使うべきではありません。

## Channel target解決

Channel Pluginは、channel固有のtargetセマンティクスを所有すべきです。共有
outbound hostは汎用に保ち、providerルールにはmessaging adapter surfaceを使ってください。

- `messaging.inferTargetChatType({ to })`は、正規化されたtargetを
  directory lookup前に`direct`、`group`、`channel`のどれとして扱うべきかを決めます。
- `messaging.targetResolver.looksLikeId(raw, normalized)`は、ある
  入力をdirectory searchではなくid風解決へ直行させるべきかどうかをコアへ伝えます。
- `messaging.targetResolver.resolveTarget(...)`は、正規化後または
  directory miss後に、最終的なprovider所有解決が必要なときのpluginフォールバックです。
- `messaging.resolveOutboundSessionRoute(...)`は、target解決後のprovider固有セッション
  route構築を所有します。

推奨される分担:

- peer/group検索前に行うべきカテゴリ判定には`inferTargetChatType`を使う。
- 「これを明示的/native target idとして扱う」判定には`looksLikeId`を使う。
- provider固有の正規化フォールバックには`resolveTarget`を使い、
  広範なdirectory searchには使わない。
- chat id、thread id、JID、handle、room
  idのようなprovider-native idは、汎用SDK fieldではなく、`target`値またはprovider固有param内に保持する。

## config-backed directory

設定からdirectory entryを導出するPluginは、そのロジックを
plugin内に保持し、
`openclaw/plugin-sdk/directory-runtime`の共有helperを再利用すべきです。

これは、channelが次のようなconfig-backed peer/groupを必要とする場合に使います。

- allowlist駆動のDM peer
- 設定済みchannel/group map
- accountスコープの静的directoryフォールバック

`directory-runtime`内の共有helperが扱うのは汎用操作のみです。

- query filtering
- limit適用
- dedupe/normalization helper
- `ChannelDirectoryEntry[]`の構築

channel固有のaccount inspectionとid normalizationは、
plugin実装内にとどめるべきです。

## Provider catalog

provider Pluginは、
`registerProvider({ catalog: { run(...) { ... } } })`で推論用model catalogを定義できます。

`catalog.run(...)`が返す形状は、OpenClawが
`models.providers`へ書き込むものと同じです。

- 1つのprovider entryに対して`{ provider }`
- 複数provider entryに対して`{ providers }`

provider固有model id、base URLデフォルト、またはauthで制御されるmodel metadataをpluginが所有する場合は、`catalog`を使ってください。

`catalog.order`は、OpenClawの組み込み暗黙providerに対して、
pluginのcatalogがいつマージされるかを制御します。

- `simple`: 単純なAPIキーまたはenv駆動provider
- `profile`: auth profileが存在すると現れるprovider
- `paired`: 複数の関連provider entryを合成するprovider
- `late`: 最終パス。他の暗黙providerの後

後のproviderほどキー競合時に勝つため、pluginは同じprovider idを持つ
組み込みprovider entryを意図的に上書きできます。

互換性:

- `discovery`は引き続きレガシー別名として動作します
- `catalog`と`discovery`の両方が登録された場合、OpenClawは`catalog`を使います

## 読み取り専用channel inspection

pluginがchannelを登録する場合、`resolveAccount(...)`と並んで
`plugin.config.inspectAccount(cfg, accountId)`を実装することを推奨します。

理由:

- `resolveAccount(...)`はランタイム経路です。認証情報が
  完全に具体化されている前提でよく、必要なシークレットが欠けていれば即失敗して構いません。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`、doctor/config
  repairフローのような読み取り専用コマンド経路は、設定内容を記述するだけのために
  ランタイム認証情報を具体化する必要があるべきではありません。

推奨される`inspectAccount(...)`の挙動:

- 説明的なaccount stateのみを返す。
- `enabled`と`configured`を保持する。
- 必要に応じて、認証情報のsource/status fieldを含める。例:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の
  利用可能性を報告するだけなら、raw token値を返す必要はありません。`tokenStatus: "available"`（および対応するsource
  field）を返せば、status系コマンドには十分です。
- SecretRef経由で認証情報が設定されているが、
  現在のコマンド経路では利用できない場合は`configured_unavailable`を使います。

これにより、読み取り専用コマンドはクラッシュしたり、accountを未設定と誤報したりせず、
「このコマンド経路では設定済みだが利用できない」と報告できます。

## Package pack

pluginディレクトリには、`openclaw.extensions`を含む`package.json`を置けます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各entryは1つのpluginになります。packに複数extensionが列挙されている場合、plugin idは
`name/<fileBase>`になります。

pluginがnpm依存関係をインポートする場合は、そのディレクトリ内で
`node_modules`が利用可能になるようにインストールしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての`openclaw.extensions` entryは、symlink解決後もplugin
ディレクトリ内にとどまる必要があります。packageディレクトリ外へ出るentryは
拒否されます。

セキュリティ注記: `openclaw plugins install`は、plugin依存関係を
`npm install --omit=dev --ignore-scripts`でインストールします（ライフサイクルスクリプトなし、ランタイムでdev dependencyなし）。plugin dependency
treeは「pure JS/TS」に保ち、`postinstall`ビルドを必要とするpackageは避けてください。

任意: `openclaw.setupEntry`は、軽量なsetup専用moduleを指せます。
OpenClawが無効なchannel pluginのsetupサーフェスを必要とするとき、または
channel pluginが有効だが未設定のときには、完全なplugin entryの代わりに`setupEntry`を読み込みます。これにより、メインplugin entryがツール、フック、その他ランタイム専用
コードも配線する場合に、起動とsetupを軽量化できます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`を使うと、channel pluginは
gatewayのpre-listen起動フェーズ中に、channelがすでに設定済みでも同じ`setupEntry`経路へ
オプトインできます。

これを使うのは、`setupEntry`がgatewayがlisten開始前に存在しなければならない
起動サーフェスを完全にカバーしている場合だけにしてください。実際には、setup entryが
起動時に依存するすべてのchannel所有capabilityを登録しなければならない、という意味です。たとえば:

- channel登録そのもの
- gatewayがlisten開始前に利用可能でなければならないHTTPルート
- その同じ時間帯に存在しなければならないgateway method、tool、service

完全entryが依然として必要な起動capabilityを所有している場合は、
このフラグを有効にしないでください。デフォルト挙動のままにして、OpenClawに
起動中に完全entryを読み込ませてください。

バンドル済みchannelは、完全なchannelランタイムが読み込まれる前にコアが参照できる
setup専用contract-surface helperを公開することもできます。現在のsetup
promotion surfaceは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全plugin entryを読み込まずに、レガシー単一account channel
configを`channels.<id>.accounts.*`へ昇格する必要があるときにこのサーフェスを使います。
現在のバンドル済み例はMatrixです。名前付きaccountがすでに存在する場合、
auth/bootstrap keyのみを名前付き昇格accountへ移動し、
常に`accounts.default`を作るのではなく、設定済みの非canonicalなdefault-account keyを保持できます。

これらのsetup patch adapterにより、バンドル済みcontract-surface discoveryは遅延したまま保たれます。インポート時は軽く、promotion surfaceはモジュールインポートでバンドル済みchannel起動へ再入する代わりに、最初の使用時にのみ読み込まれます。

それらの起動サーフェスにgateway RPC methodが含まれる場合は、
plugin固有prefixに保ってください。コアadmin namespace（`config.*`、
`exec.approvals.*`, `wizard.*`, `update.*`）は予約済みであり、pluginが
より狭いscopeを要求しても、常に`operator.admin`へ解決されます。

例:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Channel catalog metadata

Channel Pluginは`openclaw.channel`でsetup/discovery metadataを、
`openclaw.install`でinstall hintを通知できます。これによりコアcatalogはデータフリーに保たれます。

例:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Nextcloud Talk Webhook bot経由のセルフホスト型チャット。",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

最小例以外で便利な`openclaw.channel`フィールド:

- `detailLabel`: より豊富なcatalog/statusサーフェス向けの二次ラベル
- `docsLabel`: docsリンクのリンクテキストを上書き
- `preferOver`: このcatalog entryが優先して上位に来るべき、低優先度のplugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection-surface文言の制御
- `markdownCapable`: 送信フォーマット判断のために、そのchannelをmarkdown対応としてマークする
- `exposure.configured`: `false`にすると設定済みchannel一覧サーフェスからそのchannelを隠す
- `exposure.setup`: `false`にすると対話型setup/configure pickerからそのchannelを隠す
- `exposure.docs`: docsナビゲーションサーフェスでそのchannelをinternal/privateとしてマークする
- `showConfigured` / `showInSetup`: 互換性のために引き続き受け付けられるレガシー別名。`exposure`を推奨
- `quickstartAllowFrom`: 標準クイックスタート`allowFrom`フローへそのchannelをオプトインさせる
- `forceAccountBinding`: accountが1つしかなくても明示的なaccount bindingを要求する
- `preferSessionLookupForAnnounceTarget`: announce target解決時にsession lookupを優先する

OpenClawは**外部channel catalog**（たとえばMPM
registry export）もマージできます。JSONファイルを次のいずれかに置いてください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または`OPENCLAW_MPM_CATALOG_PATHS`）に
1つ以上のJSONファイルを指定します（カンマ/セミコロン/`PATH`区切り）。各ファイルには
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`を
含める必要があります。parserは`"entries"`キーに対するレガシー別名として
`"packages"`または`"plugins"`も受け付けます。

生成されたchannel catalog entryとprovider install catalog entryは、
rawな`openclaw.install`ブロックの横に正規化されたinstall-source factを公開します。正規化済みfactは、npm specが厳密バージョンか浮動selectorか、期待されるintegrity metadataが存在するか、ローカルsource pathも利用可能かを識別します。catalog/package identityがわかっている場合、正規化factは、パースされたnpm package名がそのidentityからずれていると警告します。
また、`defaultChoice`が無効である場合、利用不可能なsourceを指している場合、
そして有効なnpm
sourceなしでnpm integrity metadataが存在する場合にも警告します。consumerは、`installSource`を加法的な任意fieldとして扱うべきです。これにより、
古い手作りentryや互換shimがそれを合成する必要はありません。
これにより、onboardingとdiagnosticsはplugin runtimeをインポートせずにsource-plane stateを説明できます。

公式の外部npm entryでは、正確な`npmSpec`と
`expectedIntegrity`を推奨します。bare package nameやdist-tagも互換性のため引き続き動作しますが、source-plane warningを表面化するため、既存Pluginを壊さずにcatalogを
ピン留め済み・integrity検証済みインストールへ移行できます。
ローカルcatalog pathからonboardingインストールする場合は、
`source: "path"`と、可能ならworkspace相対の
`sourcePath`を持つ`plugins.installs` entryを記録します。絶対的な運用load pathは
`plugins.load.paths`に残り、install recordはローカルworkstation
pathを長寿命設定へ重複記録しません。これにより、source-plane diagnosticsに
ローカル開発インストールを可視に保ちつつ、2つ目のraw filesystem-path disclosure
surfaceを追加せずに済みます。

## コンテキストエンジンPlugin

コンテキストエンジンPluginは、ingest、assemble、
Compactionのためのsession context orchestrationを所有します。pluginから
`api.registerContextEngine(id, factory)`で登録し、
`plugins.slots.contextEngine`でアクティブなengineを選択します。

これは、pluginがデフォルトのcontext
pipelineを単にmemory searchやhookで拡張するのではなく、置き換えたり拡張したりする必要がある場合に使います。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

engineがCompactionアルゴリズムを**所有しない**場合でも、`compact()`
は実装したまま、明示的に委譲してください。

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 新しいcapabilityの追加

pluginが現在のAPIに収まらない挙動を必要とする場合、
plugin systemをprivateなreach-inで回避しないでください。不足しているcapabilityを追加してください。

推奨される手順:

1. コア契約を定義する
   コアが所有すべき共有挙動を決めます: policy、fallback、config merge、
   lifecycle、channel向けセマンティクス、runtime helperの形状。
2. typedなplugin登録/runtimeサーフェスを追加する
   `OpenClawPluginApi`および/または`api.runtime`を、最小限有用な
   typed capability surfaceで拡張します。
3. コア + channel/feature consumerを配線する
   channelとfeature pluginは、新しいcapabilityをコア経由で利用すべきであり、
   vendor実装を直接インポートしてはいけません。
4. vendor実装を登録する
   その後、vendor pluginがそのcapabilityに対してbackendを登録します。
5. 契約カバレッジを追加する
   所有権と登録形状が時間とともに明示的なまま保たれるように、テストを追加します。

これが、OpenClawが1つの
providerの世界観にハードコードされることなく、意見を持ち続ける方法です。具体的なファイルチェックリストと実例については、[Capability Cookbook](/ja-JP/plugins/architecture)
を参照してください。

### capabilityチェックリスト

新しいcapabilityを追加する場合、通常は実装が次の
サーフェスをまとめて触るべきです。

- `src/<capability>/types.ts`内のコア契約型
- `src/<capability>/runtime.ts`内のコアrunner/runtime helper
- `src/plugins/types.ts`内のplugin API登録サーフェス
- `src/plugins/registry.ts`内のplugin registry配線
- feature/channel
  pluginがそれを利用する必要がある場合の`src/plugins/runtime/*`内のplugin runtime公開
- `src/test-utils/plugin-registration.ts`内のcapture/test helper
- `src/plugins/contracts/registry.ts`内の所有権/契約アサーション
- `docs/`内のoperator/plugin docs

それらのサーフェスのどれかが欠けている場合、通常はそのcapabilityが
まだ完全には統合されていない兆候です。

### capabilityテンプレート

最小パターン:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// feature/channel plugin向けの共有runtime helper
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契約テストパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールはシンプルに保たれます。

- コアがcapability contract + orchestrationを所有する
- vendor pluginがvendor実装を所有する
- feature/channel pluginがruntime helperを利用する
- 契約テストが所有権を明示的に保つ

## 関連

- [Plugin architecture](/ja-JP/plugins/architecture) — 公開capability modelと形状
- [Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
