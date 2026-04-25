---
read_when:
    - ネイティブ OpenClaw Plugin を構築またはデバッグする♀♀♀analysis to=final code=None 买天天中彩票  天天爱彩票app
    - Plugin の capability モデルまたは ownership 境界を理解する
    - Plugin の load pipeline または registry を扱う
    - provider runtime hook または channel Plugin を実装する
sidebarTitle: Internals
summary: 'Plugin の内部構造: capability モデル、ownership、契約、load pipeline、および runtime helper'
title: Plugin の内部構造
x-i18n:
    generated_at: "2026-04-25T13:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

これは OpenClaw Plugin システムの**詳細なアーキテクチャリファレンス**です。実践的なガイドについては、まず以下の対象別ページのいずれかから始めてください。

<CardGroup cols={2}>
  <Card title="Plugin をインストールして使う" icon="plug" href="/ja-JP/tools/plugin">
    Plugin の追加、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Plugin を構築する" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小の動作する manifest を使った最初の Plugin チュートリアル。
  </Card>
  <Card title="Channel Plugin" icon="comments" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネル Plugin を構築する。
  </Card>
  <Card title="Provider Plugin" icon="microchip" href="/ja-JP/plugins/sdk-provider-plugins">
    モデル provider Plugin を構築する。
  </Card>
  <Card title="SDK 概要" icon="book" href="/ja-JP/plugins/sdk-overview">
    import map と登録 API リファレンス。
  </Card>
</CardGroup>

## 公開 capability モデル

capability は、OpenClaw 内の公開された**ネイティブ Plugin** モデルです。すべての
ネイティブ OpenClaw Plugin は、1 つ以上の capability type に対して登録されます。

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| テキスト推論           | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / messaging    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway discovery      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

capability を 1 つも登録せず、hooks、tools、discovery
services、または background services を提供する Plugin は、**legacy hook-only** Plugin です。このパターンも
引き続き完全にサポートされています。

### 外部互換性の方針

capability モデルは core に導入済みで、現在バンドル済み/ネイティブ Plugin が
使用していますが、外部 Plugin の互換性については「export されている、ゆえに
凍結されている」よりも厳格な基準が必要です。

| Plugin の状況                                   | ガイダンス                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 既存の外部 Plugin                               | hook ベースの統合を動作させ続ける。これが互換性の基準線です。                               |
| 新しいバンドル済み/ネイティブ Plugin            | vendor 固有の reach-in や新しい hook-only 設計よりも、明示的な capability 登録を優先する。 |
| capability 登録を採用する外部 Plugin            | 使用は可能だが、docs で stable と明記されるまでは capability 固有の helper surface は進化中とみなす。 |

capability 登録が意図された方向性です。移行期間中、legacy hook は外部 Plugin にとって最も
破壊的変更の少ない安全な経路であり続けます。export された helper subpath はすべて同等ではありません。偶発的な helper export よりも、狭く文書化された契約を優先してください。

### Plugin の形状

OpenClaw は、読み込まれた各 Plugin を、静的メタデータだけではなく実際の
登録動作に基づいて shape に分類します。

- **plain-capability**: ちょうど 1 種類の capability type を登録する（たとえば
  `mistral` のような provider 専用 Plugin）。
- **hybrid-capability**: 複数の capability type を登録する（たとえば
  `openai` は text inference、speech、media understanding、image
  generation を持つ）。
- **hook-only**: hook のみを登録し（typed または custom）、capability、
  tools、commands、services は登録しない。
- **non-capability**: tools、commands、services、または routes は登録するが
  capability は登録しない。

`openclaw plugins inspect <id>` を使うと、Plugin の shape と capability の内訳を確認できます。詳細は [CLI reference](/ja-JP/cli/plugins#inspect) を参照してください。

### Legacy hooks

`before_agent_start` hook は、hook-only Plugin 向けの互換経路として引き続きサポートされます。実運用の
legacy Plugin は依然としてこれに依存しています。

方向性:

- 動作させ続ける
- legacy として文書化する
- model/provider override には `before_model_resolve` を優先する
- prompt 変更には `before_prompt_build` を優先する
- 実利用が減少し、fixture coverage が移行の安全性を証明した後にのみ削除する

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、
次のいずれかのラベルが表示されることがあります。

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 設定は正常に解析され、Plugin も解決される                    |
| **compatibility advisory** | Plugin がサポートされているが古いパターンを使っている（例: `hook-only`） |
| **legacy warning**         | Plugin が非推奨の `before_agent_start` を使っている          |
| **hard error**             | 設定が無効、または Plugin の読み込みに失敗した               |

`hook-only` も `before_agent_start` も、現時点では Plugin を壊しません。
`hook-only` は advisory であり、`before_agent_start` は warning を出すだけです。これらの
シグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw の Plugin システムは 4 つのレイヤーを持ちます。

1. **Manifest + discovery**  
   OpenClaw は、設定済み path、workspace root、
   グローバル plugin root、およびバンドル済み Plugin から候補 Plugin を見つけます。discovery はまずネイティブ
   `openclaw.plugin.json` manifest と、サポートされる bundle manifest を読み取ります。
2. **Enablement + validation**  
   Core は、検出された Plugin が有効、無効、blocked、または
   memory のような排他的スロット向けに選択されるかを決定します。
3. **Runtime loading**  
   ネイティブ OpenClaw Plugin は jiti 経由でインプロセス読み込みされ、
   capability を central registry に登録します。互換 bundle は
   runtime code を import せずに registry record へ正規化されます。
4. **Surface consumption**  
   OpenClaw の残りの部分は registry を読み取り、tools、channels、provider
   setup、hooks、HTTP routes、CLI commands、および services を公開します。

Plugin CLI に関しては、root command discovery は 2 段階に分かれています。

- parse-time metadata は `registerCli(..., { descriptors: [...] })` から取得する
- 実際の Plugin CLI module は lazy のままにして、最初の呼び出し時に登録できる

これにより、Plugin 管理の CLI code を Plugin 内に保ったまま、
OpenClaw が parsing 前に root command 名を予約できます。

重要な設計境界:

- manifest/config validation は、Plugin code を実行せずに
  **manifest/schema metadata** から機能すべき
- ネイティブ capability discovery は、信頼済み Plugin entry code を読み込んで
  非アクティブな registry snapshot を構築してもよい
- ネイティブ runtime 動作は、`api.registrationMode === "full"` の
  Plugin module の `register(api)` 経路から来る

この分離により、OpenClaw は config を検証し、欠落/無効な Plugin を説明し、
完全な runtime が有効になる前に UI/schema hint を構築できます。

### Activation planning

Activation planning は control plane の一部です。呼び出し元は、より広い runtime registry を読み込む前に、具体的な command、provider、channel、route、agent harness、または capability に対してどの Plugin が関係するかを問い合わせられます。

planner は現在の manifest 動作との互換性を維持します。

- `activation.*` フィールドは明示的な planner hint
- `providers`、`channels`、`commandAliases`、`setup.providers`、
  `contracts.tools`、および hooks は manifest ownership fallback のまま
- ids-only の planner API は既存の呼び出し元向けに引き続き利用可能
- plan API は reason label を報告するため、診断では明示的
  hint と ownership fallback を区別できる

`activation` を lifecycle hook や
`register(...)` の置き換えとして扱わないでください。これは loading を絞り込むための metadata です。ownership field がすでに関係を説明している場合はそちらを優先し、追加の planner hint が必要な場合にのみ `activation` を使ってください。

### Channel Plugin と共有 message tool

通常の chat action に対して、Channel Plugin は別個の send/edit/react tool を登録する必要はありません。OpenClaw は core に 1 つの共有 `message` tool を保持し、その背後にあるチャネル固有の discovery と execution は Channel Plugin が管理します。

現在の境界は次のとおりです。

- core は共有 `message` tool host、prompt wiring、session/thread
  bookkeeping、および execution dispatch を管理する
- Channel Plugin はスコープ付き action discovery、capability discovery、および
  任意のチャネル固有 schema fragment を管理する
- Channel Plugin は provider 固有の session conversation grammar を管理する。たとえば
  conversation id がどのように thread id を encode するか、または親 conversation から継承するかなど
- Channel Plugin は action adapter を通じて最終 action を実行する

Channel Plugin 向け SDK surface は
`ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一された discovery
call により、Plugin は可視 action、capability、および schema
contribution をまとめて返せるため、それらが互いにずれません。

チャネル固有の message-tool param が、ローカル path やリモート media URL のような
media source を持つ場合、Plugin は
`describeMessageTool(...)` から `mediaSourceParams` も返す必要があります。Core はこの明示的な
リストを使って、Plugin 管理の param 名をハードコードせずに、sandbox path の正規化と outbound media-access hint を適用します。  
そこではチャネル全体のフラットなリストではなく、action スコープの map を優先してください。そうすることで、
profile 専用の media param が `send` のような無関係な action で正規化されません。

Core は、その discovery step に runtime scope を渡します。重要なフィールドには次が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済み受信元の `requesterSenderId`

これはコンテキスト依存の Plugin にとって重要です。チャネルは、アクティブ account、現在の room/thread/message、または信頼済みの要求元 identity に基づいて message action を隠したり公開したりできます。core の `message` tool にチャネル固有の分岐をハードコードする必要はありません。

これが、embedded-runner の routing 変更が依然として Plugin の仕事である理由です。runner は、現在の chat/session identity を Plugin discovery 境界へ転送し、共有 `message` tool が現在のターンに対して正しいチャネル管理 surface を公開できるようにする責任を持ちます。

チャネル管理の execution helper については、バンドル済み Plugin は execution
runtime を自分自身の extension module 内に保持すべきです。Core はもはや Discord、
Slack、Telegram、または WhatsApp の message-action runtime を `src/agents/tools` 配下で管理しません。  
別個の `plugin-sdk/*-action-runtime` subpath は公開しておらず、バンドル済み
Plugin は自分自身の extension 管理 module からローカル runtime code を直接 import すべきです。

同じ境界は、一般に provider 名付き SDK seam にも適用されます。Core は Slack、Discord、Signal、WhatsApp、または類似 extension 向けのチャネル固有 convenience barrel を import すべきではありません。Core がある動作を必要とする場合は、バンドル済み Plugin 自身の `api.ts` / `runtime-api.ts` barrel を利用するか、その必要性を共有 SDK の狭い汎用 capability へ昇格させてください。

poll に関しては、特に 2 つの実行経路があります。

- `outbound.sendPoll` は、共通の
  poll モデルに適合するチャネル向けの共有ベースライン
- `actions.handleAction("poll")` は、チャネル固有の
  poll セマンティクスや追加の poll パラメータ向けの推奨経路

Core は現在、Plugin 側の poll dispatch がその action を辞退した後まで共有 poll parsing を遅延させます。そのため Plugin 管理の poll handler は、最初に generic poll parser にブロックされることなく、チャネル固有の poll field を受け入れられます。

完全な起動シーケンスは [Plugin architecture internals](/ja-JP/plugins/architecture-internals) を参照してください。

## Capability ownership モデル

OpenClaw は、ネイティブ Plugin を、無関係な統合の寄せ集めとしてではなく、**会社**または**機能**に対する ownership 境界として扱います。

これは次を意味します。

- 会社の Plugin は通常、その会社に属する OpenClaw 向け
  surface をすべて持つべき
- 機能 Plugin は通常、自身が導入する機能 surface 全体を持つべき
- channel は、provider 動作を場当たり的に再実装するのではなく、共有 core capability を利用すべき

<Accordion title="バンドル済み Plugin 全体での ownership パターン例">
  - **Vendor multi-capability**: `openai` は text inference、speech、realtime
    voice、media understanding、image generation を持ちます。`google` は text
    inference に加えて media understanding、image generation、web search を持ちます。
    `qwen` は text inference に加えて media understanding と video generation を持ちます。
  - **Vendor single-capability**: `elevenlabs` と `microsoft` は speech を持ちます。
    `firecrawl` は web-fetch を持ちます。`minimax` / `mistral` / `moonshot` / `zai` は
    media-understanding backend を持ちます。
  - **Feature Plugin**: `voice-call` は call transport、tools、CLI、routes、
    および Twilio media-stream bridging を持ちますが、vendor
    Plugin を直接 import する代わりに、共有 speech、realtime
    transcription、および realtime voice capability を利用します。
</Accordion>

意図された最終状態は次のとおりです。

- OpenAI は、text models、speech、images、そして将来の video にまたがっていても 1 つの Plugin 内に存在する
- 別の vendor も、自身の surface area に対して同じことができる
- channel は、どの vendor Plugin が provider を持つかを気にしない。core が公開する共有 capability contract を利用する

これが重要な区別です。

- **plugin** = ownership 境界
- **capability** = 複数の Plugin が実装または利用できる core contract

したがって、OpenClaw が video のような新しい domain を追加する場合、最初の問いは
「どの provider が video handling をハードコードすべきか」ではありません。最初の問いは
「core の video capability contract は何か」です。その contract が存在すれば、vendor Plugin は
そこに対して登録でき、channel/feature Plugin はそれを利用できます。

capability がまだ存在しない場合、通常の正しい進め方は次のとおりです。

1. 欠けている capability を core で定義する
2. それを typed な形で plugin API/runtime 経由に公開する
3. その capability に対して channel/feature を接続する
4. vendor Plugin に実装を登録させる

これにより ownership を明示したまま、単一 vendor や単発の Plugin 固有 code path に依存する core 動作を避けられます。

### Capability layering

コードの置き場所を決めるときは、次のメンタルモデルを使ってください。

- **core capability layer**: 共有 orchestration、policy、fallback、config
  merge rules、delivery semantics、および typed contract
- **vendor plugin layer**: vendor 固有 API、auth、model catalog、speech
  synthesis、image generation、将来の video backend、usage endpoint
- **channel/feature plugin layer**: Slack/Discord/voice-call などの統合で、
  core capability を利用し、それを surface に提示するもの

たとえば TTS はこの形に従います。

- core は reply 時の TTS policy、fallback order、prefs、および channel delivery を持つ
- `openai`、`elevenlabs`、`microsoft` は synthesis implementation を持つ
- `voice-call` は telephony TTS runtime helper を利用する

同じパターンは、将来の capability でも優先されるべきです。

### Multi-capability company Plugin の例

会社 Plugin は、外から見て一貫性があるべきです。OpenClaw に models、speech、realtime transcription、realtime voice、media
understanding、image generation、video generation、web fetch、web search 向けの共有
contract がある場合、vendor はその surface 全体を 1 か所で持てます。

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
      // vendor speech config — SpeechProviderPlugin interface を直接実装
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

重要なのは、正確な helper 名ではありません。重要なのは shape です。

- 1 つの Plugin が vendor surface を持つ
- core は引き続き capability contract を持つ
- channel と feature Plugin は vendor code ではなく `api.runtime.*` helper を利用する
- contract test は、その Plugin が主張する capability を実際に登録したことを検証できる

### Capability の例: video understanding

OpenClaw はすでに image/audio/video understanding を 1 つの共有
capability として扱っています。同じ ownership モデルがそこにも適用されます。

1. core が media-understanding contract を定義する
2. vendor Plugin が、該当する場合に `describeImage`、`transcribeAudio`、および
   `describeVideo` を登録する
3. channel と feature Plugin は vendor code に直接接続するのではなく、共有 core 動作を利用する

これにより、ある provider の video 前提を core に焼き込まずに済みます。Plugin が
vendor surface を持ち、core は capability contract と fallback 動作を持ちます。

video generation もすでに同じ流れを使っています。core が typed な
capability contract と runtime helper を持ち、vendor Plugin が
`api.registerVideoGenerationProvider(...)` 実装をそこに登録します。

具体的なロールアウトチェックリストが必要ですか。  
[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

## Contracts と enforcement

Plugin API surface は意図的に typed であり、
`OpenClawPluginApi` に集約されています。この contract は、サポートされる registration point と、
Plugin が依存してよい runtime helper を定義します。

これが重要な理由:

- Plugin 作者は、1 つの安定した内部標準を得られる
- core は、同じ provider id を 2 つの Plugin が登録するような ownership の重複を拒否できる
- 起動時に、不正な登録に対して実用的な診断を提示できる
- contract test により、バンドル済み Plugin の ownership を強制し、静かな drift を防げる

enforcement には 2 つの層があります。

1. **runtime registration enforcement**  
   Plugin registry は、Plugin の読み込み時に登録を検証します。たとえば、
   重複 provider id、重複 speech provider id、または不正な
   登録は、未定義動作ではなく Plugin 診断として扱われます。
2. **contract tests**  
   バンドル済み Plugin はテスト実行中に contract registry に取り込まれ、
   OpenClaw が ownership を明示的に検証できるようになります。現在これは model
   provider、speech provider、web search provider、およびバンドル済み registration
   ownership に使用されています。

実際の効果として、OpenClaw は、どの Plugin がどの
surface を持つかを事前に把握しています。ownership が暗黙ではなく、宣言され、
typed で、テスト可能であるため、core と channel は滑らかに合成できます。

### Contract に含めるべきもの

良い Plugin contract は次の性質を持ちます。

- typed
- 小さい
- capability 固有
- core が持つ
- 複数 Plugin が再利用できる
- vendor の知識なしで channel/feature が利用できる

悪い Plugin contract は次のようなものです。

- core に隠された vendor 固有 policy
- registry を迂回する単発の Plugin escape hatch
- vendor implementation に直接 reach-in する channel code
- `OpenClawPluginApi` や
  `api.runtime` の一部ではない ad hoc な runtime object

迷った場合は、抽象度を上げてください。まず capability を定義し、その後で Plugin をそこへ接続させます。

## Execution model

ネイティブ OpenClaw Plugin は Gateway と**同一プロセス内**で実行されます。sandbox 化されません。読み込まれたネイティブ Plugin は、core code と同じプロセスレベルの trust boundary を持ちます。

影響:

- ネイティブ Plugin は tools、network handler、hooks、および services を登録できる
- ネイティブ Plugin の bug は gateway をクラッシュさせたり不安定化させたりできる
- 悪意のあるネイティブ Plugin は、OpenClaw process 内での任意コード実行と同等である

互換 bundle は、OpenClaw が現在それらを metadata/content pack として扱うため、デフォルトではより安全です。現行リリースでは、主にバンドル済み
Skills がこれにあたります。

バンドルされていない Plugin には allowlist と明示的な install/load path を使用してください。
workspace Plugin は、本番の default ではなく開発時 code として扱ってください。

バンドル済み workspace package 名では、Plugin id は npm
名に固定してください。デフォルトでは `@openclaw/<id>`、または
意図的により狭い Plugin 役割を公開する場合は、承認された typed suffix（`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding`）を使用してください。

重要な trust に関する注意:

- `plugins.allow` が信頼するのは**Plugin id**であり、ソースの provenance ではない。
- バンドル済み Plugin と同じ id を持つ workspace Plugin は、その workspace Plugin が有効/allowlist されている場合、意図的にバンドル済みコピーを shadow する。
- これは正常であり、ローカル開発、patch テスト、hotfix に有用である。
- バンドル済み Plugin の trust は install metadata ではなく、ソース snapshot から解決される。つまり、読み込み時の manifest と disk 上の code から解決される。破損または差し替えられた install record によって、実際のソースが主張する以上にバンドル済み Plugin の trust surface が黙って広がることはない。

## Export boundary

OpenClaw が export するのは implementation convenience ではなく capability です。

capability registration は公開したままにします。contract ではない helper export は削減します。

- バンドル済み Plugin 固有の helper subpath
- 公開 API を意図していない runtime plumbing subpath
- vendor 固有の convenience helper
- implementation detail である setup/onboarding helper

一部のバンドル済み Plugin helper subpath は、互換性とバンドル済み Plugin の保守のため、
生成された SDK export
map に依然として残っています。現在の例には `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、およびいくつかの `plugin-sdk/matrix*` seam が含まれます。これらは、
新しいサードパーティ Plugin に推奨される SDK パターンではなく、予約された implementation-detail export として扱ってください。

## 内部構造とリファレンス

load pipeline、registry model、provider runtime hook、Gateway HTTP
route、message tool schema、channel target resolution、provider catalog、
context engine Plugin、および新しい capability を追加するためのガイドについては、
[Plugin architecture internals](/ja-JP/plugins/architecture-internals) を参照してください。

## 関連

- [Plugin を構築する](/ja-JP/plugins/building-plugins)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Plugin manifest](/ja-JP/plugins/manifest)
