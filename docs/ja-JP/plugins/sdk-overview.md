---
read_when:
    - どのSDK subpathからimportすべきかを知る必要がある
    - OpenClawPluginApiのすべての登録メソッドに関するリファレンスが欲しい
    - 特定のSDK exportを調べている
sidebarTitle: SDK overview
summary: import map、登録APIリファレンス、およびSDKアーキテクチャ
title: Plugin SDK概要
x-i18n:
    generated_at: "2026-04-24T09:01:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

plugin SDKは、pluginとcoreの間の型付きcontractです。このページは、**何をimportするか**と**何を登録できるか**のリファレンスです。

<Tip>
  手順ガイドを探していますか?

- 最初のPluginですか? [Pluginの構築](/ja-JP/plugins/building-plugins)から始めてください。
- Channel Pluginですか? [Channel plugins](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- Provider Pluginですか? [Provider plugins](/ja-JP/plugins/sdk-provider-plugins)を参照してください。
  </Tip>

## import規約

必ず特定のsubpathからimportしてください:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各subpathは、小さく自己完結したmoduleです。これにより起動を高速に保ち、循環依存の問題を防ぎます。channel固有のentry/build helperには、`openclaw/plugin-sdk/core`よりも`openclaw/plugin-sdk/channel-core`を優先してください。`openclaw/plugin-sdk/core`は、より広いumbrella surfaceと、`buildChannelConfigSchema`のような共有helper向けに使ってください。

<Warning>
  providerまたはchannel名付きのconvenience seam（たとえば
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をimportしないでください。
  bundled pluginは、汎用SDK subpathを自分たちの`api.ts` /
  `runtime-api.ts` barrel内で構成します。core consumerは、それらのpluginローカル
  barrelを使うか、必要性が本当にcross-channelである場合にだけ、狭い汎用SDK contractを追加してください。

bundled-plugin helper seamの小さな一群（`plugin-sdk/feishu`、
`plugin-sdk/zalo`、`plugin-sdk/matrix*`など）は、生成されたexport mapにまだ現れます。これらはbundled-plugin保守専用であり、新しいサードパーティplugin向けの推奨import pathではありません。
</Warning>

## subpathリファレンス

plugin SDKは、領域ごとにまとめられた狭いsubpath群として公開されています（plugin
entry、channel、provider、auth、runtime、capability、memory、および予約済みbundled-plugin helper）。完全なカタログをグループ化・リンク付きで見るには、[Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths)を参照してください。

200超のsubpathからなる生成済みリストは`scripts/lib/plugin-sdk-entrypoints.json`にあります。

## 登録API

`register(api)`コールバックは、次のメソッドを持つ`OpenClawPluginApi` objectを受け取ります:

### capability登録

| Method                                           | 登録するもの                           |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                    |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルagent executor         |
| `api.registerCliBackend(...)`                    | ローカルCLI推論バックエンド            |
| `api.registerChannel(...)`                       | メッセージングchannel                  |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis         |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングのリアルタイム文字起こし |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声session          |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画解析                     |
| `api.registerImageGenerationProvider(...)`       | 画像生成                               |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                               |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                               |
| `api.registerWebFetchProvider(...)`              | Webフェッチ / スクレイプprovider       |
| `api.registerWebSearchProvider(...)`             | Web検索                                |

### toolとcommand

| Method                          | 登録するもの                                 |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | agent tool（必須、または`{ optional: true }`） |
| `api.registerCommand(def)`      | custom command（LLMをバイパスする）          |

### インフラストラクチャ

| Method                                          | 登録するもの                           |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | event hook                             |
| `api.registerHttpRoute(params)`                 | Gateway HTTP endpoint                  |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPCメソッド                    |
| `api.registerGatewayDiscoveryService(service)`  | ローカルGateway discovery advertiser   |
| `api.registerCli(registrar, opts?)`             | CLI subcommand                         |
| `api.registerService(service)`                  | バックグラウンドservice                |
| `api.registerInteractiveHandler(registration)`  | interactive handler                    |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi embedded-runner extension factory   |
| `api.registerMemoryPromptSupplement(builder)`   | 加算的なmemory隣接prompt section       |
| `api.registerMemoryCorpusSupplement(adapter)`   | 加算的なmemory search/read corpus      |

<Note>
  予約済みのcore admin namespace（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、pluginがより狭いgateway method scopeを割り当てようとしても、常に`operator.admin`のままです。
  plugin所有のmethodには、plugin固有のprefixを優先してください。
</Note>

<Accordion title="registerEmbeddedExtensionFactoryを使うべきタイミング">
  `api.registerEmbeddedExtensionFactory(...)`は、pluginがOpenClaw embedded run中にPiネイティブの
  event timingを必要とする場合に使います。たとえば、最終的なtool-result
  messageが送信される前に行わなければならない、非同期の`tool_result`
  rewriteなどです。

これは現在bundled-plugin seamです。登録できるのはbundled pluginだけで、`openclaw.plugin.json`で
`contracts.embeddedExtensionFactories: ["pi"]`を宣言しなければなりません。
より低レベルなseamを必要としないものについては、通常のOpenClaw plugin hookを使ってください。
</Accordion>

### Gateway discovery登録

`api.registerGatewayDiscoveryService(...)`を使うと、pluginはmDNS/Bonjourのようなローカルdiscovery transport上でアクティブなGatewayを通知できます。OpenClawはローカルdiscoveryが有効なときにGateway起動中にこのserviceを呼び出し、現在のGateway portとsecretではないTXT hint dataを渡し、Gateway shutdown中に返された`stop` handlerを呼び出します。

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway discovery pluginは、通知されるTXT値をsecretやauthenticationとして扱ってはなりません。discoveryはrouting hintです。trustは引き続きGateway authとTLS pinningが担います。

### CLI登録metadata

`api.registerCli(registrar, opts?)`は、2種類のトップレベルmetadataを受け付けます:

- `commands`: registrarが所有する明示的なcommand root
- `descriptors`: root CLI help、routing、およびlazy plugin CLI登録に使われるparse-time command descriptor

通常のroot CLI pathでplugin commandをlazy-loadのままにしたい場合は、そのregistrarが公開するすべてのトップレベルcommand rootをカバーする`descriptors`を指定してください。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrixアカウント、認証、device、およびprofile stateを管理する",
        hasSubcommands: true,
      },
    ],
  },
);
```

lazy root CLI登録が不要な場合にのみ、`commands`単体を使ってください。このeager互換パスは引き続きサポートされていますが、parse-time lazy loading用のdescriptor-backed placeholderはインストールしません。

### CLI backend登録

`api.registerCliBackend(...)`を使うと、pluginは`codex-cli`のようなローカル
AI CLI backendのデフォルトconfigを所有できます。

- backendの`id`は、`codex-cli/gpt-5`のようなmodel refでprovider prefixになります。
- backendの`config`は、`agents.defaults.cliBackends.<id>`と同じ形を使います。
- user configが常に優先されます。OpenClawはCLIを実行する前に、plugin defaultの上に`agents.defaults.cliBackends.<id>`をmergeします。
- backendがmerge後に互換性rewritesを必要とする場合（たとえば古いflag形状の正規化）には、`normalizeConfig`を使ってください。

### exclusive slot

| Method                                     | 登録するもの                                                                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine（一度に1つだけ有効）。`assemble()`コールバックは`availableTools`と`citationsMode`を受け取るため、engineはそれに応じてprompt追加内容を調整できます。 |
| `api.registerMemoryCapability(capability)` | 統合memory capability                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Memory prompt section builder                                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Memory flush plan resolver                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Memory runtime adapter                                                                                                                                         |

### memory embedding adapter

| Method                                         | 登録するもの                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブplugin向けのmemory embedding adapter    |

- `registerMemoryCapability`は、推奨されるexclusive memory-plugin APIです。
- `registerMemoryCapability`は`publicArtifacts.listArtifacts(...)`も公開できるため、companion pluginは特定のmemory pluginのprivate layoutにreachする代わりに、`openclaw/plugin-sdk/memory-host-core`を通じてexportされたmemory artifactを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime`は、legacy互換のexclusive memory-plugin APIです。
- `registerMemoryEmbeddingProvider`により、アクティブなmemory pluginは1つ以上のembedding adapter id（たとえば`openai`、`gemini`、またはcustom plugin定義id）を登録できます。
- `agents.defaults.memorySearch.provider`や
  `agents.defaults.memorySearch.fallback`のようなuser configは、それらの登録済みadapter idに対して解決されます。

### eventとlifecycle

| Method                                       | 役割                           |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | 型付きlifecycle hook           |
| `api.onConversationBindingResolved(handler)` | conversation binding callback  |

### hook decisionセマンティクス

- `before_tool_call`: `{ block: true }`を返すと最終決定になります。いずれかのhandlerがこれを設定すると、それより低い優先度のhandlerはスキップされます。
- `before_tool_call`: `{ block: false }`を返しても、上書きではなく決定なしとして扱われます（`block`を省略した場合と同じです）。
- `before_install`: `{ block: true }`を返すと最終決定になります。いずれかのhandlerがこれを設定すると、それより低い優先度のhandlerはスキップされます。
- `before_install`: `{ block: false }`を返しても、上書きではなく決定なしとして扱われます（`block`を省略した場合と同じです）。
- `reply_dispatch`: `{ handled: true, ... }`を返すと最終決定になります。いずれかのhandlerがdispatchを引き受けると、それより低い優先度のhandlerとデフォルトのmodel dispatch pathはスキップされます。
- `message_sending`: `{ cancel: true }`を返すと最終決定になります。いずれかのhandlerがこれを設定すると、それより低い優先度のhandlerはスキップされます。
- `message_sending`: `{ cancel: false }`を返しても、上書きではなく決定なしとして扱われます（`cancel`を省略した場合と同じです）。
- `message_received`: 受信したthread/topic routingが必要な場合は、typedな`threadId` fieldを使ってください。`metadata`はchannel固有の追加情報用に残してください。
- `message_sending`: channel固有の`metadata`にフォールバックする前に、typedな`replyToId` / `threadId` routing fieldを使ってください。
- `gateway_start`: 内部の`gateway:startup` hookに依存するのではなく、gateway所有の起動stateには`ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()`を使ってください。

### API object field

| Field                    | Type                      | 説明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                    |
| `api.name`               | `string`                  | 表示名                                                                                       |
| `api.version`            | `string?`                 | Plugin version（任意）                                                                       |
| `api.description`        | `string?`                 | Plugin description（任意）                                                                   |
| `api.source`             | `string`                  | Plugin source path                                                                           |
| `api.rootDir`            | `string?`                 | Plugin root directory（任意）                                                                |
| `api.config`             | `OpenClawConfig`          | 現在のconfig snapshot（利用可能な場合はアクティブなin-memory runtime snapshot）             |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`からのplugin固有config                                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime helper](/ja-JP/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | スコープ付きlogger（`debug`、`info`、`warn`、`error`）                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のload mode。`"setup-runtime"`は、軽量なfull-entry前のstartup/setup windowです           |
| `api.resolvePath(input)` | `(string) => string`      | plugin rootを基準にpathを解決する                                                            |

## 内部module規約

plugin内では、内部importにローカルbarrel fileを使ってください:

```
my-plugin/
  api.ts            # 外部consumer向けの公開export
  runtime-api.ts    # 内部専用runtime export
  index.ts          # Plugin entry point
  setup-entry.ts    # 軽量なsetup専用entry（任意）
```

<Warning>
  production codeから`openclaw/plugin-sdk/<your-plugin>`経由で自分自身のpluginをimportしないでください。
  内部importは`./api.ts`または`./runtime-api.ts`を経由させてください。
  SDK pathは外部contract専用です。
</Warning>

facadeロードされるbundled pluginの公開surface（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および類似の公開entry file）は、OpenClawがすでに動作中であればアクティブなruntime config snapshotを優先します。まだruntime snapshotが存在しない場合は、disk上で解決されたconfig fileにフォールバックします。

provider pluginは、helperが意図的にprovider固有であり、まだ汎用SDK
subpathに属さない場合、狭いpluginローカルcontract barrelを公開できます。bundledの例:

- **Anthropic**: Claudeのbeta-headerおよび`service_tier` stream helper向けの公開`api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**: `api.ts`がprovider builder、default-model helper、およびrealtime provider builderをexportします。
- **`@openclaw/openrouter-provider`**: `api.ts`がprovider builderに加えて、onboarding/config helperをexportします。

<Warning>
  extension production codeも、`openclaw/plugin-sdk/<other-plugin>`のimportを避けるべきです。
  helperが本当に共有されるべきものなら、2つのpluginを密結合させるのではなく、`openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別のcapability指向surfaceのような中立的なSDK subpathへ昇格させてください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="entry point" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
    `definePluginEntry`と`defineChannelPluginEntry`のオプション。
  </Card>
  <Card title="Runtime helper" icon="gears" href="/ja-JP/plugins/sdk-runtime">
    完全な`api.runtime` namespaceリファレンス。
  </Card>
  <Card title="Setupとconfig" icon="sliders" href="/ja-JP/plugins/sdk-setup">
    パッケージング、manifest、およびconfig schema。
  </Card>
  <Card title="テスト" icon="vial" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとlint rule。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ja-JP/plugins/sdk-migration">
    非推奨surfaceからの移行。
  </Card>
  <Card title="Plugin内部構造" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細アーキテクチャとcapabilityモデル。
  </Card>
</CardGroup>
