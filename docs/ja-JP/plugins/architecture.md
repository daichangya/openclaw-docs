---
read_when:
    - ネイティブなOpenClaw Pluginを構築またはデバッグしている
    - Pluginのcapabilityモデルやownership boundaryを理解する
    - Pluginのload pipelineまたはregistryを扱っている
    - provider runtime hookまたはchannel pluginを実装している
sidebarTitle: Internals
summary: 'Plugin内部構造: capabilityモデル、ownership、contract、load pipeline、およびruntime helper'
title: Plugin内部構造
x-i18n:
    generated_at: "2026-04-24T08:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

これはOpenClaw Pluginシステムの**詳細アーキテクチャリファレンス**です。実践的なガイドについては、まず以下の各ページから始めてください。

<CardGroup cols={2}>
  <Card title="Pluginのインストールと使用" icon="plug" href="/ja-JP/tools/plugin">
    Pluginの追加、有効化、トラブルシューティングのためのエンドユーザー向けガイド。
  </Card>
  <Card title="Pluginの構築" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小限の動作するmanifestを使った最初のPluginチュートリアル。
  </Card>
  <Card title="Channel Plugin" icon="comments" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングchannel Pluginを構築する。
  </Card>
  <Card title="Provider Plugin" icon="microchip" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルprovider Pluginを構築する。
  </Card>
  <Card title="SDK概要" icon="book" href="/ja-JP/plugins/sdk-overview">
    import mapと登録APIのリファレンス。
  </Card>
</CardGroup>

## 公開capabilityモデル

capabilityは、OpenClaw内における公開の**native plugin**モデルです。すべての
native OpenClaw Pluginは、1つ以上のcapability typeに対して登録されます。

| Capability             | 登録メソッド                                     | Pluginの例                           |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| テキスト推論           | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI推論バックエンド    | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Webフェッチ            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web検索                | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / メッセージング | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |
| Gateway discovery      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

capabilityを1つも登録せず、hook、tool、discovery
service、またはbackground serviceを提供するPluginは、**legacy
hook-only** Pluginです。このパターンも引き続き完全にサポートされています。

### 外部互換性の方針

capabilityモデルはすでにcoreに導入されており、現在bundled/native
Pluginで使用されていますが、外部Plugin互換性については「exportされている、したがって固定されている」という基準よりも、さらに厳密な基準が必要です。

| Pluginの状況                                   | ガイダンス                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既存の外部Plugin                               | hookベースの統合を動作させ続けること。これが互換性の基準線です。                                 |
| 新しいbundled/native Plugin                    | vendor固有のreach-inや新しいhook-only設計より、明示的なcapability登録を優先してください。      |
| capability登録を採用する外部Plugin             | 許可されますが、ドキュメントでstableと明記されていない限り、capability固有のhelper surfaceは進化中のものとして扱ってください。 |

capability登録が意図された方向性です。legacy hookは、移行期間中の外部Pluginにとって、引き続き最も安全な非破壊パスです。exportされたhelper subpathはすべて同等ではありません。偶発的なhelper exportよりも、狭く文書化されたcontractを優先してください。

### Pluginの形状

OpenClawは、読み込まれた各Pluginを、実際の登録動作に基づいて形状分類します（静的metadataだけではありません）。

- **plain-capability**: 正確に1つのcapability typeだけを登録する（例:
  `mistral`のようなprovider専用Plugin）。
- **hybrid-capability**: 複数のcapability typeを登録する（例:
  `openai`はテキスト推論、音声、メディア理解、画像生成を所有する）。
- **hook-only**: hook（型付きまたはcustom）のみを登録し、capability、
  tool、command、serviceは登録しない。
- **non-capability**: tool、command、service、またはrouteを登録するが、capabilityは登録しない。

`openclaw plugins inspect <id>`を使用すると、Pluginの形状とcapabilityの内訳を確認できます。詳細は[CLIリファレンス](/ja-JP/cli/plugins#inspect)を参照してください。

### Legacy hook

`before_agent_start` hookは、hook-only
Plugin向けの互換性パスとして引き続きサポートされます。実際のlegacy
Pluginは今でもこれに依存しています。

方向性:

- 動作を維持する
- legacyとして文書化する
- model/provider override作業には`before_model_resolve`を優先する
- prompt変更作業には`before_prompt_build`を優先する
- 実使用が減少し、fixture coverageで安全な移行が証明された後にのみ削除する

### 互換性シグナル

`openclaw doctor`または`openclaw plugins inspect <id>`を実行すると、次のいずれかのラベルが表示されることがあります。

| Signal                     | 意味                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | configは正常にparseされ、Pluginも解決される                  |
| **compatibility advisory** | Pluginがサポート済みだが古いパターン（例: `hook-only`）を使用している |
| **legacy warning**         | Pluginが非推奨の`before_agent_start`を使用している           |
| **hard error**             | configが無効、またはPluginの読み込みに失敗した               |

`hook-only`も`before_agent_start`も、現時点であなたのPluginを壊しません。
`hook-only`はadvisoryであり、`before_agent_start`はwarningを出すだけです。これらの
signalは`openclaw status --all`と`openclaw plugins doctor`にも表示されます。

## アーキテクチャ概要

OpenClawのPluginシステムは4つの層で構成されています。

1. **Manifest + discovery**
   OpenClawは、設定されたpath、workspace root、global plugin
   root、およびbundled pluginから候補Pluginを見つけます。discoveryは、native
   `openclaw.plugin.json` manifestとサポートされるbundle manifestを最初に読み込みます。
2. **有効化 + 検証**
   coreは、見つかったPluginが有効、無効、ブロック済み、またはmemoryのようなexclusive
   slotに選ばれているかを決定します。
3. **ランタイム読み込み**
   native OpenClaw Pluginはjiti経由でin-processに読み込まれ、central
   registryにcapabilityを登録します。互換bundleは、ランタイムコードをimportせずにregistry
   recordへ正規化されます。
4. **surface消費**
   OpenClawの他の部分はregistryを読み取り、tool、channel、provider
   setup、hook、HTTP route、CLI command、およびserviceを公開します。

特にPlugin CLIでは、root command discoveryは2段階に分かれています。

- parse-time metadataは`registerCli(..., { descriptors: [...] })`から取得される
- 実際のplugin CLI moduleはlazyのままにでき、最初の呼び出し時に登録される

これにより、Plugin所有のCLIコードをPlugin内部に保ちつつ、OpenClawはparse前にroot
command名を予約できます。

重要な設計boundary:

- discovery + config validationは、Pluginコードを実行せずに**manifest/schema
  metadata**から動作すべき
- nativeランタイム動作はPlugin moduleの`register(api)` pathから来る

この分離により、OpenClawは完全なランタイムがアクティブになる前にconfigを検証し、不足または無効なPluginを説明し、UI/schema
hintを構築できます。

### Activation planning

activation planningはcontrol planeの一部です。呼び出し元は、より広いruntime
registryを読み込む前に、どのPluginが具体的なcommand、provider、channel、
route、agent harness、またはcapabilityに関連するかを問い合わせできます。

plannerは現在のmanifest動作との互換性を維持します。

- `activation.*` fieldは明示的なplanner hintです
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools`, およびhookはmanifest ownership fallbackのままです
- ids-only planner APIは既存の呼び出し元向けに引き続き利用可能です
- plan APIはreason labelを報告するため、診断で明示的hintとownership
  fallbackを区別できます

`activation`をlifecycle hookや`register(...)`の代替とみなさないでください。これは読み込みを絞るために使うmetadataです。関係性をすでにownership
fieldで表現できるなら、そちらを優先してください。`activation`は追加のplanner
hintが必要な場合にのみ使ってください。

### Channel Pluginと共有message tool

Channel Pluginは、通常のchat
actionのために別個のsend/edit/react toolを登録する必要はありません。OpenClawはcore内に1つの共有`message`
toolを保持し、channel Pluginはその背後にあるchannel固有のdiscoveryとexecutionを所有します。

現在のboundaryは次のとおりです。

- coreは共有`message` tool host、prompt wiring、session/thread
  bookkeeping、およびexecution dispatchを所有する
- channel Pluginはscoped action discovery、capability
  discovery、およびchannel固有のschema fragmentを所有する
- channel Pluginはprovider固有のsession conversation
  grammarを所有する。たとえばconversation
  idがthread idをどうencodeするか、または親conversationからどう継承するか
- channel Pluginはaction adapterを通じて最終actionを実行する

channel Plugin向けのSDK surfaceは
`ChannelMessageActionAdapter.describeMessageTool(...)`です。この統合discovery
callにより、Pluginは表示するaction、capability、schema
contributionをまとめて返せるため、それらが互いにずれません。

channel固有のmessage-tool paramがローカルpathやremote media
URLのようなmedia sourceを持つ場合、Pluginはさらに
`describeMessageTool(...)`から`mediaSourceParams`を返すべきです。coreはこの明示的なリストを使って、Plugin所有のparam名をhardcodeせずにsandbox
path normalizationとoutbound media-access hintを適用します。
そこではchannel全体の平坦なリストではなく、action単位のmapを優先してください。そうしないと、profile専用のmedia
paramが`send`のような無関係なactionでも正規化されてしまいます。

coreはruntime scopeをこのdiscovery stepに渡します。重要なfieldには以下が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼されたinbound `requesterSenderId`

これはcontext-sensitiveなPluginにとって重要です。channelは、active
account、現在のroom/thread/message、または信頼されたrequester
identityに基づいてmessage
actionを隠したり公開したりでき、coreの`message`
toolにchannel固有の分岐をhardcodeする必要がありません。

これが、embedded-runner routingの変更が依然としてPlugin作業である理由です。runnerは、共有`message`
toolが現在のturnに対して正しいchannel所有surfaceを公開できるように、現在のchat/session
identityをPlugin discovery boundaryへ転送する責任を負います。

channel所有のexecution helperについては、bundled
Pluginはexecution runtimeを自分たちのextension module内に保持すべきです。coreはもはやDiscord、
Slack、Telegram、WhatsAppのmessage-action runtimeを`src/agents/tools`配下で所有しません。
別個の`plugin-sdk/*-action-runtime` subpathは公開しておらず、bundled
Pluginは自分たちのextension所有moduleからローカルruntime
codeを直接importすべきです。

この同じboundaryは、一般にprovider名付きSDK seamにも適用されます。coreはSlack、
Discord、Signal、WhatsApp、または類似extension向けのchannel固有convenience
barrelをimportすべきではありません。coreがある動作を必要とする場合は、そのbundled
Plugin自身の`api.ts` / `runtime-api.ts`
barrelを消費するか、その必要性を共有SDK内の狭い汎用capabilityへ昇格させてください。

pollについては、特に2つのexecution pathがあります:

- `outbound.sendPoll`は、共通のpollモデルに適合するchannel向けの共有ベースラインです
- `actions.handleAction("poll")`は、channel固有のpollセマンティクスや追加のpollパラメータ向けの推奨パスです

coreは現在、pluginのpoll dispatchがそのactionを拒否した後まで共有poll parsingを遅延させるため、plugin所有のpoll handlerは、先に汎用poll parserにブロックされることなくchannel固有のpoll fieldを受け取れます。

完全な起動シーケンスについては、[Plugin architecture internals](/ja-JP/plugins/architecture-internals)を参照してください。

## capability ownershipモデル

OpenClawは、native pluginを、無関係なintegrationの寄せ集めではなく、**会社**または**機能**のownership boundaryとして扱います。

つまり:

- company pluginは通常、その会社のOpenClaw向けsurfaceをすべて所有するべきです
- feature pluginは通常、自身が導入する機能surface全体を所有するべきです
- channelはprovider動作を場当たり的に再実装するのではなく、共有core capabilityを利用するべきです

<Accordion title="bundled plugin全体でのownershipパターン例">
  - **Vendor multi-capability**: `openai`は、テキスト推論、音声、リアルタイム音声、メディア理解、画像生成を所有します。`google`は、テキスト推論に加えて、メディア理解、画像生成、Web検索を所有します。`qwen`は、テキスト推論に加えて、メディア理解と動画生成を所有します。
  - **Vendor single-capability**: `elevenlabs`と`microsoft`は音声を所有し、`firecrawl`はWebフェッチを所有し、`minimax` / `mistral` / `moonshot` / `zai`はmedia-understandingバックエンドを所有します。
  - **Feature plugin**: `voice-call`は、通話transport、tool、CLI、route、およびTwilio media-stream bridgingを所有しますが、vendor pluginを直接importする代わりに、共有の音声、リアルタイム文字起こし、リアルタイム音声capabilityを利用します。
</Accordion>

意図されている最終形は次のとおりです。

- OpenAIは、テキストモデル、音声、画像、将来の動画にまたがっていても、1つのplugin内に存在する
- 別のvendorも、自分のsurface areaについて同じことができる
- channelは、どのvendor pluginがproviderを所有しているかを気にせず、coreが公開する共有capability contractを利用する

ここでの重要な区別は次のとおりです。

- **plugin** = ownership boundary
- **capability** = 複数のpluginが実装または利用できるcore contract

したがって、OpenClawが動画のような新しいdomainを追加する場合、最初の問いは「どのproviderがvideo handlingをhardcodeすべきか」ではありません。最初の問いは「core video capability contractとは何か」です。そのcontractが存在すれば、vendor pluginはそれに対して登録でき、channel/feature pluginはそれを利用できます。

capabilityがまだ存在しない場合、通常は次の手順が正しい動きです。

1. coreで不足しているcapabilityを定義する
2. それをplugin API/runtimeを通じて型付きで公開する
3. channel/featureをそのcapabilityに対して接続する
4. vendor pluginに実装を登録させる

これにより、ownershipを明示的に保ちながら、単一vendorや一回限りのplugin固有コードパスに依存するcore動作を避けられます。

### capability layering

コードをどこに置くべきか決めるときは、次のメンタルモデルを使ってください。

- **core capability layer**: 共有のorchestration、policy、fallback、config merge rule、delivery semantics、および型付きcontract
- **vendor plugin layer**: vendor固有のAPI、auth、model catalog、音声合成、画像生成、将来の動画バックエンド、usage endpoint
- **channel/feature plugin layer**: Slack/Discord/voice-callなどのintegrationで、core capabilityを利用してsurface上に提示するもの

たとえば、TTSは次の形に従います。

- coreは、返信時TTS policy、fallback順序、prefs、およびchannel deliveryを所有する
- `openai`、`elevenlabs`、`microsoft`は合成実装を所有する
- `voice-call`はtelephony TTS runtime helperを利用する

将来のcapabilityでも、同じパターンを優先すべきです。

### multi-capability company pluginの例

company pluginは、外部から見て一貫性があるべきです。OpenClawに、モデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Webフェッチ、Web検索の共有contractがある場合、vendorはそれらすべてのsurfaceを1か所で所有できます。

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

重要なのは正確なhelper名ではありません。重要なのは形です。

- 1つのpluginがvendor surfaceを所有する
- coreは引き続きcapability contractを所有する
- channelとfeature pluginはvendor codeではなく`api.runtime.*` helperを利用する
- contract testで、そのpluginが所有を主張するcapabilityを登録したことを検証できる

### capabilityの例: 動画理解

OpenClawはすでに、画像/音声/動画理解を1つの共有capabilityとして扱っています。そこでも同じownershipモデルが適用されます。

1. coreがmedia-understanding contractを定義する
2. vendor pluginが、該当するものとして`describeImage`、`transcribeAudio`、`describeVideo`を登録する
3. channelとfeature pluginは、vendor codeに直接接続するのではなく、共有core動作を利用する

これにより、1つのproviderの動画前提をcoreに埋め込むことを避けられます。pluginがvendor surfaceを所有し、coreがcapability contractとfallback動作を所有します。

動画生成もすでに同じ流れを使っています。coreが型付きcapability contractとruntime helperを所有し、vendor pluginがそれに対して`api.registerVideoGenerationProvider(...)`実装を登録します。

具体的なロールアウトチェックリストが必要ですか。 [Capability Cookbook](/ja-JP/plugins/architecture)を参照してください。

## contractとenforcement

plugin API surfaceは、意図的に型付きであり、`OpenClawPluginApi`に一元化されています。このcontractは、サポートされる登録ポイントと、pluginが依存できるruntime helperを定義します。

これが重要な理由:

- plugin作者は1つの安定した内部標準を得られる
- coreは、2つのpluginが同じprovider idを登録するような重複ownershipを拒否できる
- 起動時に、不正な登録に対して実用的なdiagnosticsを提示できる
- contract testでbundled-plugin ownershipを強制し、静かなdriftを防げる

enforcementには2つの層があります。

1. **runtime registration enforcement**
   plugin registryは、pluginの読み込み時に登録を検証します。例:
   重複したprovider id、重複したspeech provider id、不正な登録は、未定義動作ではなくplugin diagnosticsを生成します。
2. **contract test**
   bundled pluginは、テスト実行中にcontract registryへ取り込まれるため、OpenClawはownershipを明示的に検証できます。現在はmodel provider、speech provider、Web検索provider、およびbundled registration ownershipに対して使用されています。

実際の効果として、OpenClawは、どのpluginがどのsurfaceを所有するかを事前に把握できます。これにより、ownershipが暗黙的ではなく宣言され、型付けされ、テスト可能になるため、coreとchannelはシームレスに構成できます。

### contractに属するもの

良いplugin contractは次の性質を持ちます。

- 型付き
- 小さい
- capability固有
- coreが所有する
- 複数のpluginで再利用できる
- vendor知識なしにchannel/featureから利用できる

悪いplugin contractは次のようなものです。

- core内に隠されたvendor固有policy
- registryを回避する一回限りのplugin escape hatch
- vendor実装へ直接reachするchannel code
- `OpenClawPluginApi`または`api.runtime`の一部ではない場当たり的runtime object

迷ったら、抽象度を上げてください。まずcapabilityを定義し、その後pluginがそこに接続できるようにします。

## executionモデル

native OpenClaw PluginはGatewayと**同一プロセス内**で実行されます。sandbox化されていません。読み込まれたnative pluginは、core codeと同じプロセスレベルのtrust boundaryを持ちます。

含意:

- native pluginはtool、network handler、hook、serviceを登録できる
- native pluginのbugはgatewayをクラッシュまたは不安定化させる可能性がある
- 悪意あるnative pluginは、OpenClaw process内部での任意コード実行と同等である

互換bundleは、OpenClawが現在それらをmetadata/content packとして扱うため、デフォルトではより安全です。現在のリリースでは、これは主にbundled Skillsを意味します。

bundledではないpluginにはallowlistと明示的なinstall/load pathを使用してください。workspace pluginは本番デフォルトではなく、開発時コードとして扱ってください。

bundled workspace package名では、plugin idをnpm名に固定してください。デフォルトは`@openclaw/<id>`、またはpluginが意図的により狭いplugin roleを公開する場合は、承認済みの型付きsuffixである`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding`を使用します。

重要なtrust note:

- `plugins.allow`が信頼するのは**plugin id**であり、source provenanceではありません。
- bundled pluginと同じidを持つworkspace pluginは、そのworkspace pluginが有効化またはallowlist化されていれば、意図的にbundled copyをshadowします。
- これは正常であり、ローカル開発、patch test、hotfixに有用です。
- bundled-plugin trustは、install metadataではなく、source snapshot—つまり読み込み時点のdisk上のmanifestとcode—から解決されます。破損または置換されたinstall recordによって、実際のsourceが主張する範囲を超えてbundled pluginのtrust surfaceが密かに広がることはありません。

## export boundary

OpenClawがexportするのは実装上のconvenienceではなく、capabilityです。

capability registrationは公開のままにしてください。contractではないhelper exportは削減してください。

- bundled-plugin固有のhelper subpath
- 公開APIとして意図されていないruntime plumbing subpath
- vendor固有のconvenience helper
- 実装詳細であるsetup/onboarding helper

一部のbundled-plugin helper subpathは、互換性とbundled-plugin保守のため、生成されたSDK export map内にまだ残っています。現在の例には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、およびいくつかの`plugin-sdk/matrix*` seamが含まれます。これらは、新しいサードパーティplugin向けの推奨SDKパターンではなく、予約された実装詳細exportとして扱ってください。

## 内部実装とリファレンス

load pipeline、registryモデル、provider runtime hook、Gateway HTTP route、message tool schema、channel target resolution、provider catalog、context engine plugin、および新しいcapability追加ガイドについては、[Plugin architecture internals](/ja-JP/plugins/architecture-internals)を参照してください。

## 関連

- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Plugin manifest](/ja-JP/plugins/manifest)
