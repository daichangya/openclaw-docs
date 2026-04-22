---
read_when:
    - ネイティブ OpenClaw Plugin の構築またはデバッグ
    - Plugin の capability モデルまたは所有権の境界を理解する
    - Plugin のロードパイプラインまたは registry の作業
    - provider ランタイム hook または channel Plugin の実装
sidebarTitle: Internals
summary: 'Plugin の内部構造: capability モデル、所有権、コントラクト、ロードパイプライン、およびランタイムヘルパー'
title: Plugin の内部構造
x-i18n:
    generated_at: "2026-04-22T04:24:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin の内部構造

<Info>
  これは**詳細なアーキテクチャリファレンス**です。実践的なガイドについては、次を参照してください:
  - [Install and use plugins](/ja-JP/tools/plugin) — ユーザーガイド
  - [はじめに](/ja-JP/plugins/building-plugins) — 最初の plugin チュートリアル
  - [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — メッセージングチャンネルを構築する
  - [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — モデル provider を構築する
  - [SDK Overview](/ja-JP/plugins/sdk-overview) — import map と登録 API
</Info>

このページでは、OpenClaw plugin system の内部アーキテクチャを扱います。

## 公開 capability モデル

Capability は、OpenClaw 内部における公開 **ネイティブ plugin** モデルです。すべての
ネイティブ OpenClaw plugin は、1 つ以上の capability type に対して登録します:

| Capability             | 登録メソッド                                      | 例の plugin                            |
| ---------------------- | ------------------------------------------------ | -------------------------------------- |
| テキスト推論           | `api.registerProvider(...)`                      | `openai`, `anthropic`                  |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                  |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`              |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                               |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                               |
| media 理解             | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                     |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`   |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                    |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                                 |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                            |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                               |
| Channel / メッセージング | `api.registerChannel(...)`                     | `msteams`, `matrix`                    |

capability を 1 つも登録せず、hook、tool、service だけを提供する plugin は
**レガシー hook-only** plugin です。このパターンも引き続き完全にサポートされています。

### 外部互換性の立場

capability モデルはすでに core に導入されており、現在バンドル済み/ネイティブ plugin
で使われていますが、外部 plugin の互換性については「export されているから凍結済み」と
みなすより厳密な基準がまだ必要です。

現在のガイダンス:

- **既存の外部 plugin:** hook ベースの統合を動作し続けるようにする。これを互換性の基準とみなす
- **新しいバンドル済み/ネイティブ plugin:** vendor 固有の深い依存や新しい hook-only 設計よりも、明示的な capability 登録を優先する
- **capability 登録を採用する外部 plugin:** 使用は可能だが、capability 固有の helper surface は、docs で契約が stable と明示されるまでは進化中と扱う

実用的なルール:

- capability 登録 API が意図された方向です
- 移行期間中、レガシー hook は外部 plugin にとって最も安全な非破壊パスのままです
- export された helper subpath はすべて同等ではありません。偶発的な helper export ではなく、狭く文書化されたコントラクトを優先してください

### Plugin の形

OpenClaw は、各ロード済み plugin を、静的 metadata ではなく実際の
登録動作に基づいて shape に分類します:

- **plain-capability** -- capability type をちょうど 1 つ登録する（例:
  `mistral` のような provider 専用 plugin）
- **hybrid-capability** -- 複数の capability type を登録する（例
  `openai` は text inference、speech、media understanding、image
  generation を所有します）
- **hook-only** -- hook（typed または custom）のみを登録し、capability、
  tool、command、service を登録しない
- **non-capability** -- tool、command、service、route は登録するが
  capability は登録しない

plugin の shape と capability の内訳を見るには `openclaw plugins inspect <id>` を使用してください。詳細は [CLI reference](/cli/plugins#inspect) を参照してください。

### レガシー hook

`before_agent_start` hook は、hook-only plugin の互換性パスとして引き続きサポートされます。レガシーな実運用 plugin は今もこれに依存しています。

方向性:

- 動作を維持する
- レガシーとして文書化する
- model/provider の上書き作業には `before_model_resolve` を優先する
- prompt の変更作業には `before_prompt_build` を優先する
- 実際の利用が減り、fixture coverage により移行の安全性が確認できるまでは削除しない

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、
次のいずれかのラベルが表示される場合があります:

| シグナル                 | 意味                                                        |
| ------------------------ | ----------------------------------------------------------- |
| **config valid**         | config は正常に parse され、plugin も解決される            |
| **compatibility advisory** | plugin はサポートされているが古いパターン（例: `hook-only`）を使用している |
| **legacy warning**       | plugin は非推奨の `before_agent_start` を使用している       |
| **hard error**           | config が無効、または plugin のロードに失敗した            |

`hook-only` も `before_agent_start` も、現時点では plugin を壊しません --
`hook-only` は advisory であり、`before_agent_start` は警告を出すだけです。これらの
シグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw の plugin system は 4 つの層を持ちます:

1. **Manifest + discovery**
   OpenClaw は、設定済みパス、workspace root、
   global extension root、バンドル済み extension から候補 plugin を見つけます。Discovery は、ネイティブな
   `openclaw.plugin.json` manifest と、サポートされた bundle manifest を最初に読み取ります。
2. **Enablement + validation**
   Core は、見つかった plugin が有効、無効、ブロック済み、または
   memory のような排他的スロットに選択されているかどうかを判断します。
3. **Runtime loading**
   ネイティブ OpenClaw plugin は jiti により in-process でロードされ、
   capability を central registry に登録します。互換 bundle は、ランタイムコードを import せずに
   registry record に正規化されます。
4. **Surface consumption**
   OpenClaw のその他の部分は、registry を読み取って tool、channel、provider
   setup、hook、HTTP route、CLI command、service を公開します。

plugin CLI に特有の話として、root command discovery は 2 段階に分かれています:

- parse 時の metadata は `registerCli(..., { descriptors: [...] })` から取得されます
- 実際の plugin CLI module は lazy のままにでき、最初の呼び出し時に登録されます

これにより、plugin が所有する CLI code を plugin 内に保ちつつ、OpenClaw が
parse 前に root command 名を予約できるようになります。

重要な設計境界:

- discovery + config validation は、plugin code を実行せずに **manifest/schema metadata**
  から動作するべきです
- ネイティブ runtime の動作は plugin module の `register(api)` パスから来ます

この分離により、OpenClaw は完全な runtime がアクティブになる前に、config の検証、欠落/無効 plugin の説明、
UI/schema hint の構築を行えます。

### Channel Plugin と共有 message tool

Channel Plugin は、通常の chat action のために別個の send/edit/react tool を登録する必要はありません。OpenClaw は core に 1 つの共有 `message` tool を保持し、channel Plugin はその背後にあるチャンネル固有の discovery と execution を所有します。

現在の境界は次のとおりです:

- core は共有 `message` tool host、prompt wiring、session/thread
  bookkeeping、execution dispatch を所有します
- channel Plugin は scope 付き action discovery、capability discovery、および
  channel 固有の schema fragment を所有します
- channel Plugin は、conversation id が thread id をどのように encode するか、
  親 conversation からどのように継承するかといった、provider 固有の session conversation grammar を所有します
- channel Plugin は action adapter を通じて最終 action を実行します

channel Plugin に対する SDK surface は
`ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一 discovery
call により、plugin は可視 action、capability、schema
contribution をまとめて返せるため、これらの部分が乖離しません。

channel 固有の message-tool param がローカルパスやリモート media URL などの
media source を持つ場合、plugin は
`describeMessageTool(...)` から `mediaSourceParams` も返すべきです。Core はこの明示的な
リストを使って、plugin 所有の param 名をハードコードせずに sandbox path の正規化と外向き media-access hint の適用を行います。
そこでは channel 全体のフラットなリストではなく、action スコープの map を優先してください。そうしないと、
profile 専用の media param が `send` のような無関係な action でも正規化されてしまいます。

Core は runtime scope をその discovery step に渡します。重要な field には次が含まれます:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- trusted な受信 `requesterSenderId`

これはコンテキスト依存の plugin にとって重要です。チャンネルは、アクティブアカウント、現在の room/thread/message、または trusted な requester identity に基づいて、
core の `message` tool に channel 固有の分岐をハードコードせずに message action を隠したり公開したりできます。

そのため、embedded-runner のルーティング変更は今でも plugin の仕事です。runner は、
現在の chat/session identity を plugin discovery 境界に転送し、共有 `message`
tool が現在のターンに対して正しい channel 所有 surface を公開するようにする責務を持ちます。

channel 所有の execution helper については、バンドル済み plugin は execution
runtime を自分たちの extension module 内に保持するべきです。Core はもはや Discord、
Slack、Telegram、WhatsApp の message-action runtime を `src/agents/tools`
配下に所有しません。個別の `plugin-sdk/*-action-runtime` subpath は公開しておらず、バンドル済み
plugin は自分たちのローカル runtime code を extension 所有 module から直接 import するべきです。

同じ境界は、一般的に provider 名付き SDK seam にも適用されます。Core は Slack、Discord、Signal、
WhatsApp、その他類似 extension 向けの channel 固有 convenience barrel を import するべきではありません。Core がある動作を必要とするなら、
バンドル済み plugin 自身の `api.ts` / `runtime-api.ts` barrel を利用するか、
その必要性を共有 SDK 内の狭い汎用 capability に昇格させてください。

poll に関しては、実行パスが 2 つあります:

- `outbound.sendPoll` は、共通の poll モデルに適合するチャンネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、channel 固有の poll semantics や追加の poll parameter に対する推奨パスです

Core は現在、plugin の poll dispatch が action を辞退した後まで共有 poll parse を延期するため、plugin 所有の poll handler は、
最初に汎用 poll parser にブロックされることなく、channel 固有の poll field を受け付けられます。

完全な起動シーケンスについては [Load pipeline](#load-pipeline) を参照してください。

## Capability 所有権モデル

OpenClaw は、ネイティブ plugin を **company** または **feature** の所有境界として扱い、
無関係な統合の寄せ集めとはみなしません。

これは次を意味します:

- company plugin は通常、その company の OpenClaw 向け surface をすべて所有するべきです
- feature plugin は通常、それが導入する feature surface 全体を所有するべきです
- channel は、provider の動作を場当たり的に再実装するのではなく、共有 core capability を利用するべきです

例:

- バンドル済みの `openai` plugin は、OpenAI の model-provider 動作と、OpenAI の
  speech + realtime-voice + media-understanding + image-generation の動作を所有します
- バンドル済みの `elevenlabs` plugin は ElevenLabs の speech 動作を所有します
- バンドル済みの `microsoft` plugin は Microsoft の speech 動作を所有します
- バンドル済みの `google` plugin は Google の model-provider 動作に加えて、Google の
  media-understanding + image-generation + web-search の動作を所有します
- バンドル済みの `firecrawl` plugin は Firecrawl の web-fetch 動作を所有します
- バンドル済みの `minimax`、`mistral`、`moonshot`、`zai` plugin は、それぞれの
  media-understanding backend を所有します
- バンドル済みの `qwen` plugin は Qwen の text-provider 動作に加えて、
  media-understanding と video-generation の動作を所有します
- `voice-call` plugin は feature plugin です。call transport、tool、
  CLI、route、Twilio media-stream bridging を所有しますが、vendor plugin を直接 import する代わりに、
  共有 speech と realtime-transcription および realtime-voice capability を利用します

意図されている最終状態は次のとおりです:

- OpenAI は、text model、speech、image、将来の video にまたがっていても、1 つの plugin に存在する
- 他の vendor も、自身の surface area に対して同じことができる
- channel は、どの vendor plugin が provider を所有しているかを気にせず、
  core が公開する共有 capability contract を利用する

これが重要な区別です:

- **plugin** = 所有権の境界
- **capability** = 複数の plugin が実装または利用できる core contract

そのため、OpenClaw が video のような新しいドメインを追加する場合、最初の問いは
「どの provider が video handling をハードコードすべきか」ではありません。最初の問いは「
core の video capability contract は何か」です。その contract が存在すれば、
vendor plugin はそれに対して登録でき、channel/feature plugin はそれを利用できます。

capability がまだ存在しない場合、通常取るべき正しい手順は次のとおりです:

1. core で不足している capability を定義する
2. それを typed な形で plugin API/runtime 経由に公開する
3. channel/feature をその capability に対して接続する
4. vendor plugin に実装を登録させる

これにより、所有権を明示的に保ちつつ、単一 vendor や一回限りの plugin 固有コードパスに依存する core 動作を避けられます。

### Capability のレイヤー構造

コードの配置先を決めるときは、次のメンタルモデルを使ってください:

- **core capability レイヤー**: 共有オーケストレーション、policy、fallback、config
  merge ルール、delivery semantics、typed contract
- **vendor plugin レイヤー**: vendor 固有 API、auth、model catalog、speech
  synthesis、image generation、将来の video backend、usage endpoint
- **channel/feature plugin レイヤー**: Slack/Discord/voice-call などの統合で、
  core capability を利用して surface に提示するもの

たとえば、TTS はこの形に従います:

- core は reply 時の TTS policy、fallback 順序、prefs、channel delivery を所有します
- `openai`、`elevenlabs`、`microsoft` は synthesis 実装を所有します
- `voice-call` は telephony TTS ランタイム helper を利用します

今後の capability でも同じパターンを優先するべきです。

### 複数 capability を持つ company plugin の例

company plugin は、外から見て一貫性があるべきです。OpenClaw に model、speech、realtime transcription、realtime voice、media
understanding、image generation、video generation、web fetch、web search の共有
contract があるなら、vendor は自身の surface を 1 か所で所有できます:

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

重要なのは正確な helper 名ではありません。重要なのは形です:

- 1 つの plugin が vendor surface を所有する
- core は引き続き capability contract を所有する
- channel と feature plugin は vendor code ではなく `api.runtime.*` helper を利用する
- contract test は、その plugin が所有すると主張している capability を登録したことを検証できる

### Capability の例: video understanding

OpenClaw はすでに、image/audio/video understanding を 1 つの共有
capability として扱っています。ここでも同じ所有権モデルが適用されます:

1. core が media-understanding contract を定義する
2. vendor plugin が、該当する場合に `describeImage`、`transcribeAudio`、
   `describeVideo` を登録する
3. channel と feature plugin は vendor code に直接結び付けるのではなく、
   共有 core 動作を利用する

これにより、ある provider の video 前提を core に焼き付けることを避けられます。plugin は
vendor surface を所有し、core は capability contract と fallback 動作を所有します。

video generation もすでに同じ流れを使っています。core が typed な
capability contract とランタイム helper を所有し、vendor plugin が
`api.registerVideoGenerationProvider(...)` 実装を登録します。

具体的なロールアウトチェックリストが必要ですか。[
Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

## コントラクトと強制

plugin API surface は意図的に typed であり、`OpenClawPluginApi` に
集約されています。この contract は、サポートされる登録ポイントと、plugin が依存できる
runtime helper を定義します。

これが重要な理由:

- plugin author は 1 つの安定した内部標準を得られる
- core は、2 つの plugin が同じ provider id を登録するような重複所有を拒否できる
- 起動時に、不正な登録に対して実行可能な診断を表示できる
- contract test はバンドル済み plugin の所有権を強制し、静かな drift を防げる

強制には 2 つの層があります:

1. **runtime 登録の強制**
   plugin registry は、plugin のロード時に登録を検証します。例:
   重複した provider id、重複した speech provider id、不正な
   登録は、未定義動作ではなく plugin 診断を生成します。
2. **contract test**
   バンドル済み plugin は test 実行中に contract registry に記録されるため、
   OpenClaw は所有権を明示的に検証できます。現在これは model
   provider、speech provider、web search provider、およびバンドル済み登録の
   所有権に使われています。

実際の効果として、OpenClaw はどの plugin がどの
surface を所有するかを事前に把握しています。これにより、所有権が暗黙ではなく、宣言され、typed で、テスト可能であるため、
core と channel はシームレスに合成できます。

### 何が contract に属するか

良い plugin contract は次の特徴を持ちます:

- typed である
- 小さい
- capability 固有である
- core が所有する
- 複数の plugin で再利用できる
- vendor の知識なしに channel/feature が利用できる

悪い plugin contract は次のようなものです:

- core に隠された vendor 固有 policy
- registry を迂回する一回限りの plugin escape hatch
- vendor 実装に直接到達する channel code
- `OpenClawPluginApi` や
  `api.runtime` の一部ではない ad hoc な runtime object

迷ったら抽象化レベルを上げてください。まず capability を定義し、その後 plugin をそこに差し込めるようにします。

## 実行モデル

ネイティブ OpenClaw plugin は Gateway と **同一プロセス内** で実行されます。sandbox 化されません。ロード済みのネイティブ plugin は、
core code と同じプロセスレベルの trust boundary を持ちます。

影響:

- ネイティブ plugin は tool、network handler、hook、service を登録できる
- ネイティブ plugin の bug は Gateway をクラッシュまたは不安定化させる可能性がある
- 悪意あるネイティブ plugin は、OpenClaw process 内での任意コード実行と同等である

互換 bundle は、OpenClaw が現在それらを metadata/content pack として扱うため、
デフォルトでより安全です。現在のリリースでは、これは主にバンドル済みの
Skills を意味します。

バンドルされていない plugin には allowlist と明示的な install/load path を使用してください。workspace plugin は
production のデフォルトではなく、開発時の code として扱ってください。

バンドル済み workspace package 名については、plugin id を npm
名に固定してください。デフォルトでは `@openclaw/<id>`、または
`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` のような承認済み typed suffix を使用します。これは package が意図的により狭い plugin role を公開する場合です。

重要な trust に関する注記:

- `plugins.allow` は **plugin id** を信頼し、ソース provenance は信頼しません。
- バンドル済み plugin と同じ id を持つ workspace plugin は、その workspace plugin が有効/allowlist 済みであれば、意図的にバンドル済みコピーを shadow します。
- これは正常であり、ローカル開発、patch テスト、hotfix に有用です。

## Export 境界

OpenClaw が export するのは capability であり、実装上の convenience ではありません。

capability 登録は public のままにします。非 contract の helper export は削減します:

- バンドル済み plugin 固有の helper subpath
- public API を意図していない runtime plumbing subpath
- vendor 固有の convenience helper
- 実装詳細である setup/onboarding helper

一部のバンドル済み plugin helper subpath は、互換性とバンドル済み plugin の保守のために、生成された SDK export
map にまだ残っています。現在の例には
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、およびいくつかの `plugin-sdk/matrix*` seam が含まれます。これらは
新しいサードパーティ plugin に対する推奨 SDK パターンではなく、予約済みの実装詳細 export として扱ってください。

## ロードパイプライン

起動時、OpenClaw は概ね次のことを行います:

1. 候補 plugin root を検出する
2. ネイティブまたは互換 bundle の manifest と package metadata を読み取る
3. 安全でない候補を拒否する
4. plugin config（`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`）を正規化する
5. 各候補の有効化を決定する
6. 有効なネイティブ module を jiti でロードする
7. ネイティブの `register(api)`（またはレガシー別名の `activate(api)`）hook を呼び出し、登録内容を plugin registry に収集する
8. registry を command/runtime surface に公開する

<Note>
`activate` は `register` のレガシー別名です。loader は存在する方（`def.register ?? def.activate`）を解決して同じ箇所で呼び出します。すべてのバンドル済み plugin は `register` を使用しています。新しい plugin では `register` を優先してください。
</Note>

安全性ゲートは runtime 実行 **前** に行われます。entry が plugin root を逸脱している場合、path が world-writable である場合、または
バンドルされていない plugin で path ownership が不審に見える場合、候補はブロックされます。

### Manifest-first の動作

manifest は control-plane の source of truth です。OpenClaw はこれを使って:

- plugin を識別する
- 宣言された channel/Skills/config schema または bundle capability を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI の label/placeholder を拡張する
- install/catalog metadata を表示する
- plugin runtime をロードせずに、軽量な activation と setup descriptor を保持する

ネイティブ plugin では、runtime module が data-plane 部分です。これは hook、tool、command、provider flow などの
実際の動作を登録します。

任意の manifest `activation` と `setup` block は control plane に残ります。
これらは activation 計画と setup discovery のための metadata 専用 descriptor であり、
runtime 登録、`register(...)`、`setupEntry` を置き換えるものではありません。
最初の live activation consumer は現在、manifest の command、channel、provider hint を使って、より広い registry materialization の前に plugin ロードを絞り込みます:

- CLI ロードは、要求された primary command を所有する plugin に絞り込まれます
- channel setup/plugin 解決は、要求された
  channel id を所有する plugin に絞り込まれます
- 明示的な provider setup/runtime 解決は、要求された
  provider id を所有する plugin に絞り込まれます

セットアップ discovery は現在、`setup.providers` や `setup.cliBackends` のような descriptor 所有 id を優先して候補 plugin を絞り込み、その後、セットアップ時の runtime hook がまだ必要な plugin についてのみ `setup-api` にフォールバックします。見つかった複数の plugin が同じ正規化済み setup provider または CLI backend
id を主張した場合、setup lookup は discovery 順序に依存せず、曖昧な owner を拒否します。

### loader がキャッシュするもの

OpenClaw は、短期間の in-process キャッシュとして次を保持します:

- discovery 結果
- manifest registry data
- ロード済み plugin registry

これらのキャッシュにより、突発的な起動負荷と繰り返し command のオーバーヘッドが減ります。これらは永続化ではなく、短命なパフォーマンスキャッシュとして考えるのが安全です。

パフォーマンスに関する注記:

- これらのキャッシュを無効にするには `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定します。
- キャッシュ期間は `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` と
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整します。

## Registry モデル

ロード済み plugin は、無作為な core global を直接変更しません。代わりに、
central plugin registry に登録します。

registry は次を追跡します:

- plugin record（identity、source、origin、status、diagnostics）
- tool
- レガシー hook と typed hook
- channel
- provider
- Gateway RPC handler
- HTTP route
- CLI registrar
- バックグラウンド service
- plugin 所有 command

その後、core feature は plugin module と直接やり取りする代わりに、その registry を読み取ります。これによりロードは一方向に保たれます:

- plugin module -> registry への登録
- core runtime -> registry の利用

この分離は保守性にとって重要です。つまり、ほとんどの core surface は
「registry を読む」という 1 つの統合ポイントだけを必要とし、「各 plugin module を個別に特別扱いする」必要がありません。

## Conversation binding callback

conversation を bind する plugin は、approval が解決されたときに反応できます。

bind request が承認または拒否された後に callback を受け取るには
`api.onConversationBindingResolved(...)` を使用します:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // この plugin + conversation に対する binding が作成されました。
        console.log(event.binding?.conversationId);
        return;
      }

      // request は拒否されました。ローカルの pending state をクリアします。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

callback payload field:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認済み request に対する解決済み binding
- `request`: 元の request の要約、detach hint、sender id、および
  conversation metadata

この callback は通知専用です。誰が conversation を bind できるかは変更せず、
core の approval 処理が完了した後に実行されます。

## provider ランタイム hook

provider Plugin は現在 2 層あります:

- manifest metadata: runtime load 前に軽量な provider env-auth lookup を行うための `providerAuthEnvVars`、auth を共有する provider variant 向けの `providerAuthAliases`、runtime
  load 前に軽量な channel env/setup lookup を行うための `channelEnvVars`、さらに runtime load 前に軽量な onboarding/auth-choice label と
  CLI flag metadata を扱うための `providerAuthChoices`
- config-time hook: `catalog` / レガシーの `discovery` と `applyConfigDefaults`
- runtime hook: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw は引き続き汎用 agent loop、failover、transcript handling、tool policy を所有します。
これらの hook は、provider 固有の動作を、完全にカスタムな inference transport を必要とせずに拡張するための surface です。

provider に env ベースの認証情報があり、汎用 auth/status/model-picker パスが plugin runtime をロードせずにそれを認識すべき場合は、manifest の `providerAuthEnvVars` を使用してください。ある provider id が別の provider id の env var、auth profile、config ベース auth、API-key オンボーディング選択を再利用すべき場合は、manifest の `providerAuthAliases` を使用してください。オンボーディング/auth-choice の CLI surface が provider runtime をロードせずに provider の choice id、group label、単純な 1 フラグ auth 配線を知る必要がある場合は、manifest の `providerAuthChoices` を使用してください。provider runtime の
`envVars` は、オンボーディング label や OAuth
client-id/client-secret セットアップ変数のような operator 向け hint 用に残してください。

channel に env 駆動の auth または setup があり、汎用 shell-env fallback、config/status check、または setup prompt が channel runtime をロードせずにそれを認識すべき場合は、manifest の `channelEnvVars` を使用してください。

### hook の順序と使い方

model/provider Plugin では、OpenClaw は概ねこの順序で hook を呼び出します。
「When to use」列は、素早く判断するためのガイドです。

| #   | Hook                              | 役割                                                                                                           | 使うべき場面                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成時に provider config を `models.providers` に公開する                                      | provider が catalog または base URL のデフォルトを所有している場合                                                                         |
| 2   | `applyConfigDefaults`             | config materialization 中に provider 所有のグローバル config デフォルトを適用する                            | デフォルトが auth mode、env、または provider の model-family semantics に依存する場合                                                     |
| --  | _(built-in model lookup)_         | OpenClaw はまず通常の registry/catalog パスを試す                                                             | _(plugin hook ではありません)_                                                                                                              |
| 3   | `normalizeModelId`                | lookup 前にレガシーまたは preview の model-id alias を正規化する                                              | 正規の model 解決前に provider が alias の整理を所有している場合                                                                           |
| 4   | `normalizeTransport`              | 汎用 model 組み立て前に provider-family の `api` / `baseUrl` を正規化する                                     | 同じ transport family 内のカスタム provider id に対して、provider が transport の整理を所有している場合                                   |
| 5   | `normalizeConfig`                 | runtime/provider 解決前に `models.providers.<id>` を正規化する                                                | plugin とともにあるべき config 整理が provider に必要な場合。バンドル済み Google-family helper は、サポートされる Google config エントリの backstop も担います |
| 6   | `applyNativeStreamingUsageCompat` | config provider に native streaming-usage 互換の書き換えを適用する                                            | provider が endpoint 駆動の native streaming usage metadata 修正を必要とする場合                                                           |
| 7   | `resolveConfigApiKey`             | runtime auth 読み込み前に config provider 向けの env-marker auth を解決する                                   | provider が provider 所有の env-marker API-key 解決を持つ場合。`amazon-bedrock` にはここに組み込みの AWS env-marker resolver もあります |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに local/self-hosted または config ベースの auth を公開する                                   | provider が synthetic/local credential marker で動作できる場合                                                                             |
| 9   | `resolveExternalAuthProfiles`     | provider 所有の外部 auth profile を overlay する。デフォルトの `persistence` は CLI/app 所有認証情報向けに `runtime-only` | provider がコピーした refresh token を永続化せずに外部 auth 認証情報を再利用する場合                                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済み synthetic profile placeholder の優先度を env/config ベース auth より下げる                           | provider が、優先されるべきでない synthetic placeholder profile を保存する場合                                                             |
| 11  | `resolveDynamicModel`             | まだローカル registry にない provider 所有 model id の同期 fallback                                           | provider が任意の upstream model id を受け付ける場合                                                                                       |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップを行い、その後 `resolveDynamicModel` を再実行する                                          | 不明な id を解決する前に provider が network metadata を必要とする場合                                                                     |
| 13  | `normalizeResolvedModel`          | embedded runner が解決済み model を使う前の最終書き換え                                                       | provider が transport の書き換えを必要とするが、引き続き core transport を使う場合                                                        |
| 14  | `contributeResolvedModelCompat`   | 別の互換 transport の背後にある vendor model の compat flag を提供する                                        | provider が provider 自体を引き継がずに、proxy transport 上で自分の model を認識する場合                                                  |
| 15  | `capabilities`                    | 共有 core ロジックで使われる provider 所有の transcript/tooling metadata                                      | provider が transcript/provider-family 固有の癖を必要とする場合                                                                            |
| 16  | `normalizeToolSchemas`            | embedded runner が見る前に tool schema を正規化する                                                           | provider が transport-family ごとの schema 整理を必要とする場合                                                                            |
| 17  | `inspectToolSchemas`              | 正規化後に provider 所有の schema 診断を公開する                                                              | provider 固有ルールを core に教え込まずに、keyword 警告を出したい場合                                                                      |
| 18  | `resolveReasoningOutputMode`      | native または tagged の reasoning-output contract を選択する                                                   | provider が native field ではなく tagged reasoning/final output を必要とする場合                                                           |
| 19  | `prepareExtraParams`              | 汎用 stream option wrapper 前に request param を正規化する                                                     | provider がデフォルト request param または provider ごとの param 整理を必要とする場合                                                     |
| 20  | `createStreamFn`                  | 通常の stream パスを完全に置き換えてカスタム transport を使う                                                  | provider が単なる wrapper ではなく、カスタム wire protocol を必要とする場合                                                                |
| 21  | `wrapStreamFn`                    | 汎用 wrapper 適用後に stream をラップする                                                                      | provider がカスタム transport なしで request header/body/model 互換 wrapper を必要とする場合                                              |
| 22  | `resolveTransportTurnState`       | native なターン単位 transport header または metadata を付加する                                                | provider が、汎用 transport から provider-native な turn identity を送らせたい場合                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | native WebSocket header または session cool-down policy を付加する                                             | provider が、汎用 WS transport で session header または fallback policy を調整したい場合                                                  |
| 24  | `formatApiKey`                    | auth-profile formatter: 保存済み profile を runtime の `apiKey` 文字列に変換する                              | provider が追加の auth metadata を保存し、カスタムな runtime token 形式を必要とする場合                                                   |
| 25  | `refreshOAuth`                    | カスタム refresh endpoint または refresh 失敗 policy のための OAuth refresh 上書き                            | provider が共有 `pi-ai` refresher に適合しない場合                                                                                         |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 失敗時に付加される修復ヒント                                                                     | refresh 失敗後に provider 所有の auth 修復ガイダンスが必要な場合                                                                          |
| 27  | `matchesContextOverflowError`     | provider 所有の context-window overflow matcher                                                                | provider に、生の overflow error があり、汎用 heuristic では拾えない場合                                                                   |
| 28  | `classifyFailoverReason`          | provider 所有の failover 理由分類                                                                              | provider が生の API/transport error を rate-limit/overload などへマップできる場合                                                         |
| 29  | `isCacheTtlEligible`              | proxy/backhaul provider 向けの prompt-cache policy                                                             | provider が proxy 固有の cache TTL 制御を必要とする場合                                                                                   |
| 30  | `buildMissingAuthMessage`         | 汎用 missing-auth 回復メッセージの置き換え                                                                     | provider が provider 固有の missing-auth 回復ヒントを必要とする場合                                                                       |
| 31  | `suppressBuiltInModel`            | 古い upstream model の抑制と、任意のユーザー向け error hint                                                    | provider が古い upstream row を隠す、または vendor ヒントに置き換える必要がある場合                                                       |
| 32  | `augmentModelCatalog`             | discovery 後に synthetic/final catalog row を追加する                                                          | provider が `models list` や picker で synthetic な forward-compat row を必要とする場合                                                   |
| 33  | `resolveThinkingProfile`          | model 固有の `/think` level セット、表示ラベル、デフォルト                                                     | provider が選択された model に対してカスタムな thinking 段階または binary label を公開する場合                                           |
| 34  | `isBinaryThinking`                | on/off の reasoning toggle 互換 hook                                                                           | provider が binary な thinking の on/off だけを公開する場合                                                                                |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning サポート互換 hook                                                                            | provider が一部の model にのみ `xhigh` を適用したい場合                                                                                    |
| 36  | `resolveDefaultThinkingLevel`     | デフォルトの `/think` level 互換 hook                                                                          | provider が model family に対するデフォルトの `/think` policy を所有する場合                                                              |
| 37  | `isModernModelRef`                | live profile filter と smoke selection のための modern-model matcher                                           | provider が live/smoke 向け preferred-model matching を所有する場合                                                                        |
| 38  | `prepareRuntimeAuth`              | 推論直前に、設定済みの認証情報を実際のランタイム token/key に交換する                                          | provider が token 交換または短命の request 認証情報を必要とする場合                                                                       |
| 39  | `resolveUsageAuth`                | `/usage` と関連する status surface 向けの usage/billing 認証情報を解決する                                    | provider がカスタムの usage/quota token parse、または別の usage 認証情報を必要とする場合                                                 |
| 40  | `fetchUsageSnapshot`              | auth 解決後に provider 固有の usage/quota snapshot を取得して正規化する                                       | provider が provider 固有の usage endpoint または payload parser を必要とする場合                                                         |
| 41  | `createEmbeddingProvider`         | memory/search 向けの provider 所有 embedding adapter を構築する                                                | memory の embedding 動作が provider plugin に属する場合                                                                                   |
| 42  | `buildReplayPolicy`               | provider に対する transcript handling を制御する replay policy を返す                                          | provider がカスタム transcript policy（例: thinking block の除去）を必要とする場合                                                       |
| 43  | `sanitizeReplayHistory`           | 汎用 transcript cleanup の後に replay history を書き換える                                                     | provider が共有 Compaction helper を超える provider 固有の replay 書き換えを必要とする場合                                               |
| 44  | `validateReplayTurns`             | embedded runner の前に replay turn の最終検証または再整形を行う                                                | provider transport が汎用 sanitization 後により厳密な turn 検証を必要とする場合                                                          |
| 45  | `onModelSelected`                 | model が選択された後に provider 所有の副作用を実行する                                                         | model がアクティブになったときに provider が telemetry または provider 所有 state を必要とする場合                                      |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致した
provider Plugin を確認し、その後、実際に model id や transport/config を変更するものが現れるまで、他の hook 対応 provider Plugin に順にフォールスルーします。これにより、
呼び出し元がどのバンドル済み plugin がその書き換えを所有しているかを知らなくても、
alias/互換 provider shim が機能し続けます。provider hook がサポート対象の
Google-family config エントリを書き換えない場合でも、バンドル済み Google config normalizer がその互換性 cleanup を引き続き適用します。

provider が完全にカスタムな wire protocol またはカスタム request executor を必要とする場合、
それは別種の拡張です。これらの hook は、OpenClaw の通常の inference loop 上で
引き続き動作する provider 振る舞いのためのものです。

### provider の例

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

- Anthropic は `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、
  `resolveThinkingProfile`、`applyConfigDefaults`、`isModernModelRef`、
  `wrapStreamFn` を使用します。これは Claude 4.6 の forward-compat、
  provider-family hint、auth 修復ガイダンス、usage endpoint 統合、
  prompt-cache 適格性、auth を考慮した config デフォルト、Claude の
  デフォルト/適応的 thinking policy、および beta header、
  `/fast` / `serviceTier`、`context1m` のための Anthropic 固有の stream shaping を所有しているためです。
- Anthropic の Claude 固有 stream helper は、現時点では引き続きバンドル済み Plugin 自身の
  public `api.ts` / `contract-api.ts` seam に留まります。その package surface は、
  ある provider の beta-header ルールに合わせて汎用 SDK を広げる代わりに、
  `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、およびより低レベルの
  Anthropic wrapper builder を export します。
- OpenAI は `resolveDynamicModel`、`normalizeResolvedModel`、
  `capabilities` に加えて `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`resolveThinkingProfile`、`isModernModelRef`
  を使用します。これは GPT-5.4 の forward-compat、直接の OpenAI
  `openai-completions` -> `openai-responses` 正規化、Codex 対応 auth
  hint、Spark の抑制、synthetic な OpenAI list row、GPT-5 の thinking /
  live-model policy を所有しているためです。`openai-responses-defaults` stream family は、
  attribution header、
  `/fast`/`serviceTier`、text verbosity、ネイティブ Codex web search、
  reasoning-compat payload shaping、および Responses context management のための
  共有ネイティブ OpenAI Responses wrapper を所有します。
- OpenRouter は `catalog` に加えて `resolveDynamicModel` と
  `prepareDynamicModel` を使用します。provider が pass-through であり、
  OpenClaw の静的 catalog が更新される前に新しい model id を公開することがあるためです。また、
  provider 固有の request header、routing metadata、reasoning patch、
  prompt-cache policy を core の外に保つために、`capabilities`、`wrapStreamFn`、`isCacheTtlEligible` も使います。その replay policy は
  `passthrough-gemini` family から来ており、`openrouter-thinking` stream family は
  proxy reasoning injection と、未サポート model / `auto` の skip を所有します。
- GitHub Copilot は `catalog`、`auth`、`resolveDynamicModel`、
  `capabilities` に加えて `prepareRuntimeAuth` と `fetchUsageSnapshot` を使います。provider 所有の device login、model fallback 動作、Claude transcript
  の癖、GitHub token -> Copilot token 交換、および provider 所有の usage endpoint が必要なためです。
- OpenAI Codex は `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth`、`augmentModelCatalog` に加えて
  `prepareExtraParams`、`resolveUsageAuth`、`fetchUsageSnapshot` を使います。依然として
  core の OpenAI transport 上で動作しますが、その transport/base URL
  正規化、OAuth refresh fallback policy、デフォルト transport 選択、
  synthetic な Codex catalog row、および ChatGPT usage endpoint 統合を所有しているためです。direct OpenAI と同じ `openai-responses-defaults` stream family を共有します。
- Google AI Studio と Gemini CLI OAuth は `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn`、`isModernModelRef` を使います。これは
  `google-gemini` replay family が Gemini 3.1 の forward-compat fallback、
  ネイティブ Gemini replay validation、bootstrap replay sanitation、tagged
  reasoning-output mode、modern-model matching を所有し、
  `google-thinking` stream family が Gemini thinking payload normalization を所有するためです。
  Gemini CLI OAuth はさらに `formatApiKey`、`resolveUsageAuth`、`fetchUsageSnapshot`
  も使用し、token formatting、token parse、quota endpoint
  wiring を行います。
- Anthropic Vertex は
  `anthropic-by-model` replay family を通じて `buildReplayPolicy` を使用します。これにより、Claude 固有の replay cleanup が、すべての `anthropic-messages` transport ではなく Claude id に限定されます。
- Amazon Bedrock は `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason`、`resolveThinkingProfile` を使用します。これは
  Anthropic-on-Bedrock トラフィック向けの Bedrock 固有の throttle/not-ready/context-overflow error 分類を所有するためです。その replay policy は引き続き
  Claude 専用の `anthropic-by-model` ガードを共有します。
- OpenRouter、Kilocode、Opencode、Opencode Go は `buildReplayPolicy`
  を `passthrough-gemini` replay family 経由で使用します。Gemini
  model を OpenAI 互換 transport 経由で proxy し、ネイティブ Gemini replay validation や
  bootstrap rewrite なしで Gemini thought-signature sanitation を必要とするためです。
- MiniMax は `buildReplayPolicy` を
  `hybrid-anthropic-openai` replay family 経由で使用します。1 つの provider が Anthropic-message と OpenAI 互換の両方の semantics を所有するためです。Anthropic 側では Claude 専用の
  thinking-block dropping を維持しつつ、reasoning
  output mode を native に戻します。また、`minimax-fast-mode` stream family は
  共有 stream path 上で fast-mode の model 書き換えを所有します。
- Moonshot は `catalog`、`resolveThinkingProfile`、`wrapStreamFn` を使用します。依然として共有
  OpenAI transport を使いますが、provider 所有の thinking payload normalization が必要なためです。
  `moonshot-thinking` stream family は config と `/think` state を
  ネイティブの binary thinking payload にマップします。
- Kilocode は `catalog`、`capabilities`、`wrapStreamFn`、
  `isCacheTtlEligible` を使用します。provider 所有の request header、
  reasoning payload normalization、Gemini transcript hint、および Anthropic
  cache-TTL 制御が必要なためです。`kilocode-thinking` stream family は共有 proxy stream path 上で
  Kilo thinking injection を維持しつつ、`kilo/auto` やその他の
  明示的 reasoning payload をサポートしない proxy model id を skip します。
- Z.AI は `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`resolveThinkingProfile`、`isModernModelRef`、
  `resolveUsageAuth`、`fetchUsageSnapshot` を使用します。GLM-5 fallback、
  `tool_stream` デフォルト、binary thinking UX、modern-model matching、さらに
  usage auth と quota 取得の両方を所有しているためです。`tool-stream-default-on` stream family は、
  デフォルト有効の `tool_stream` wrapper を provider ごとの手書き glue の外に保ちます。
- xAI は `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel`、`isModernModelRef`
  を使用します。ネイティブ xAI Responses transport 正規化、Grok の fast-mode
  alias 書き換え、デフォルトの `tool_stream`、strict-tool / reasoning-payload
  cleanup、plugin 所有 tool のための fallback auth 再利用、forward-compat な Grok
  model 解決、および xAI tool-schema
  profile、未サポート schema keyword、ネイティブ `web_search`、HTML entity
  で encode された tool-call argument の decode といった provider 所有の compat patch を所有しているためです。
- Mistral、OpenCode Zen、OpenCode Go は `capabilities` のみを使用して、
  transcript/tooling の癖を core の外に保ちます。
- `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` のような catalog 専用のバンドル済み provider は
  `catalog` のみを使用します。
- Qwen は text provider に対して `catalog` を使い、その multimodal surface に対して
  共有の media-understanding と video-generation 登録を使用します。
- MiniMax と Xiaomi は `catalog` に加えて usage hook も使用します。推論自体は共有 transport 経由で動作するものの、その `/usage`
  動作が plugin 所有であるためです。

## ランタイムヘルパー

Plugin は `api.runtime` 経由で選択された core helper にアクセスできます。TTS の場合:

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

- `textToSpeech` は file/voice-note surface 向けの通常の core TTS output payload を返します。
- core の `messages.tts` 設定と provider 選択を使用します。
- PCM audio buffer + sample rate を返します。Plugin は provider 用に resample/encode する必要があります。
- `listVoices` は provider ごとに任意です。vendor 所有の voice picker や setup flow に使用してください。
- Voice list には、provider 対応 picker 向けに locale、gender、personality tag などのより豊富な metadata を含めることができます。
- OpenAI と ElevenLabs は現在 telephony をサポートしています。Microsoft はサポートしていません。

Plugin は `api.registerSpeechProvider(...)` 経由で speech provider も登録できます。

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

- TTS policy、fallback、reply delivery は core に維持してください。
- vendor 所有の synthesis 動作には speech provider を使用してください。
- レガシーな Microsoft `edge` 入力は `microsoft` provider id に正規化されます。
- 推奨される所有権モデルは company 指向です。OpenClaw がそれらの
  capability contract を追加するにつれて、1 つの vendor plugin が
  text、speech、image、将来の media provider を所有できます。

image/audio/video understanding については、Plugin は汎用の key/value bag ではなく、
1 つの typed な media-understanding provider を登録します:

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

- オーケストレーション、fallback、config、channel wiring は core に維持してください。
- vendor の動作は provider Plugin に維持してください。
- 加算的な拡張は typed のままに保つべきです。新しい任意メソッド、新しい任意の
  result field、新しい任意 capability です。
- video generation もすでに同じパターンに従っています:
  - core が capability contract とランタイム helper を所有する
  - vendor Plugin が `api.registerVideoGenerationProvider(...)` を登録する
  - feature/channel Plugin が `api.runtime.videoGeneration.*` を利用する

media-understanding のランタイム helper については、Plugin は次のように呼び出せます:

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

音声文字起こしについては、Plugin は media-understanding ランタイムまたは
古い STT alias のどちらも使用できます:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME を確実に推定できない場合は任意:
  mime: "audio/ogg",
});
```

注:

- `api.runtime.mediaUnderstanding.*` は、
  image/audio/video understanding のための推奨共有 surface です。
- core の media-understanding 音声設定（`tools.media.audio`）と provider fallback 順序を使用します。
- 文字起こし出力が生成されなかった場合（たとえば入力が skip/未サポートの場合）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換 alias として残っています。

Plugin は `api.runtime.subagent` を通じてバックグラウンド subagent run も起動できます:

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

- `provider` と `model` は run ごとの任意 override であり、永続的な session 変更ではありません。
- OpenClaw は、それらの override field を trusted な呼び出し元に対してのみ尊重します。
- Plugin 所有の fallback run では、operator は `plugins.entries.<id>.subagent.allowModelOverride: true` でオプトインする必要があります。
- trusted Plugin を特定の正規 `provider/model` target に制限するには `plugins.entries.<id>.subagent.allowedModels` を、任意の target を明示的に許可するには `"*"` を使用してください。
- untrusted な Plugin の subagent run も引き続き動作しますが、override request は黙って fallback される代わりに拒否されます。

web search については、Plugin は agent tool wiring に直接到達する代わりに
共有ランタイム helper を利用できます:

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

Plugin は
`api.registerWebSearchProvider(...)` を通じて web-search provider も登録できます。

注:

- provider 選択、credential 解決、共有 request semantics は core に維持してください。
- vendor 固有の search transport には web-search provider を使用してください。
- `api.runtime.webSearch.*` は、agent tool wrapper に依存せずに検索動作を必要とする feature/channel Plugin 向けの推奨共有 surface です。

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

- `generate(...)`: 設定された image-generation provider chain を使って画像を生成します。
- `listProviders(...)`: 利用可能な image-generation provider とその capability を一覧表示します。

## Gateway HTTP route

Plugin は `api.registerHttpRoute(...)` で HTTP endpoint を公開できます。

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

route の field:

- `path`: Gateway HTTP サーバー配下の route path。
- `auth`: 必須。通常の Gateway auth を要求するには `"gateway"` を、Plugin 管理の auth/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じ Plugin が自分自身の既存 route 登録を置き換えることを許可します。
- `handler`: route が request を処理した場合は `true` を返します。

注:

- `api.registerHttpHandler(...)` は削除されており、Plugin ロードエラーの原因になります。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin route は `auth` を明示的に宣言しなければなりません。
- 正確に同じ `path + match` の競合は、`replaceExisting: true` がない限り拒否され、ある Plugin は別の Plugin の route を置き換えることはできません。
- `auth` レベルが異なる重複 route は拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ auth レベル内のみにしてください。
- `auth: "plugin"` の route は **自動では** operator ランタイム scope を受け取りません。これは Plugin 管理の Webhook/署名検証用であり、特権付き Gateway helper 呼び出し用ではありません。
- `auth: "gateway"` の route は Gateway request のランタイム scope 内で実行されますが、その scope は意図的に保守的です:
  - 共有シークレット bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が `x-openclaw-scopes` を送信しても、Plugin route のランタイム scope は `operator.write` に固定されます
  - trusted identity を伴う HTTP mode（たとえば `trusted-proxy` や private ingress 上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes` が明示的に存在する場合にのみそれを尊重します
  - それらの identity を伴う plugin-route request で `x-openclaw-scopes` がない場合、ランタイム scope は `operator.write` にフォールバックします
- 実用的なルール: Gateway auth の Plugin route を暗黙の admin surface だと考えないでください。route に admin 専用動作が必要なら、identity を伴う auth mode を要求し、明示的な `x-openclaw-scopes` header contract を文書化してください。

## Plugin SDK import path

Plugin を作成するときは、巨大な `openclaw/plugin-sdk` import ではなく
SDK subpath を使用してください:

- plugin 登録プリミティブには `openclaw/plugin-sdk/plugin-entry`。
- 汎用の共有 plugin 向け contract には `openclaw/plugin-sdk/core`。
- ルート `openclaw.json` Zod schema
  export（`OpenClawSchema`）には `openclaw/plugin-sdk/config-schema`。
- `openclaw/plugin-sdk/channel-setup`、
  `openclaw/plugin-sdk/setup-runtime`、
  `openclaw/plugin-sdk/setup-adapter-runtime`、
  `openclaw/plugin-sdk/setup-tools`、
  `openclaw/plugin-sdk/channel-pairing`、
  `openclaw/plugin-sdk/channel-contract`、
  `openclaw/plugin-sdk/channel-feedback`、
  `openclaw/plugin-sdk/channel-inbound`、
  `openclaw/plugin-sdk/channel-lifecycle`、
  `openclaw/plugin-sdk/channel-reply-pipeline`、
  `openclaw/plugin-sdk/command-auth`、
  `openclaw/plugin-sdk/secret-input`、および
  `openclaw/plugin-sdk/webhook-ingress` のような stable な channel primitive は、共有の setup/auth/reply/Webhook
  wiring に使用します。`channel-inbound` は debounce、mention matching、
  受信 mention-policy helper、envelope formatting、受信 envelope
  context helper の共有ホームです。
  `channel-setup` は狭い optional-install setup seam です。
  `setup-runtime` は `setupEntry` /
  deferred startup で使われる runtime-safe な setup surface で、import-safe な setup patch adapter を含みます。
  `setup-adapter-runtime` は env-aware な account-setup adapter seam です。
  `setup-tools` は小さな CLI/archive/docs helper seam（`formatCliCommand`、
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`）です。
- `openclaw/plugin-sdk/channel-config-helpers`、
  `openclaw/plugin-sdk/allow-from`、
  `openclaw/plugin-sdk/channel-config-schema`、
  `openclaw/plugin-sdk/telegram-command-config`、
  `openclaw/plugin-sdk/channel-policy`、
  `openclaw/plugin-sdk/approval-gateway-runtime`、
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`、
  `openclaw/plugin-sdk/approval-handler-runtime`、
  `openclaw/plugin-sdk/approval-runtime`、
  `openclaw/plugin-sdk/config-runtime`、
  `openclaw/plugin-sdk/infra-runtime`、
  `openclaw/plugin-sdk/agent-runtime`、
  `openclaw/plugin-sdk/lazy-runtime`、
  `openclaw/plugin-sdk/reply-history`、
  `openclaw/plugin-sdk/routing`、
  `openclaw/plugin-sdk/status-helpers`、
  `openclaw/plugin-sdk/text-runtime`、
  `openclaw/plugin-sdk/runtime-store`、および
  `openclaw/plugin-sdk/directory-runtime` のようなドメイン subpath は、共有ランタイム/config helper に使用します。
  `telegram-command-config` は Telegram カスタム
  command の正規化/検証のための狭い public seam であり、バンドル済み
  Telegram contract surface が一時的に利用できない場合でも引き続き利用可能です。
  `text-runtime` は共有の text/markdown/logging seam で、
  assistant-visible-text の除去、markdown render/chunking helper、redaction
  helper、directive-tag helper、安全な text utility を含みます。
- approval 固有の channel seam では、Plugin 上の 1 つの `approvalCapability`
  contract を優先するべきです。そうすれば core は、approval auth、delivery、render、
  native-routing、lazy native-handler の動作を、無関係な Plugin field に approval 動作を混在させる代わりに、
  その 1 つの capability を通じて読み取れます。
- `openclaw/plugin-sdk/channel-runtime` は非推奨であり、
  古い Plugin 向けの互換 shim としてのみ残っています。新しいコードは代わりにより狭い
  generic primitive を import するべきであり、repo code も shim の新規 import を追加するべきではありません。
- バンドル済み extension の内部構造は private のままです。外部 Plugin は
  `openclaw/plugin-sdk/*` subpath のみを使用してください。OpenClaw の core/test code は、
  `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js`、および
  `login-qr-api.js` のような狭くスコープされた file など、plugin package root 配下の repo
  public entry point を使用できます。core からも他の extension からも、
  plugin package の `src/*` を import してはいけません。
- repo entry point の分割:
  `<plugin-package-root>/api.js` は helper/types の barrel、
  `<plugin-package-root>/runtime-api.js` は runtime 専用 barrel、
  `<plugin-package-root>/index.js` はバンドル済み Plugin entry、
  `<plugin-package-root>/setup-entry.js` は setup Plugin entry です。
- 現在のバンドル済み provider の例:
  - Anthropic は Claude stream helper（
    `wrapAnthropicProviderStream`、beta-header helper、`service_tier`
    parse など）に `api.js` / `contract-api.js` を使用します。
  - OpenAI は provider builder、default-model helper、
    realtime provider builder に `api.js` を使用します。
  - OpenRouter は provider builder と onboarding/config
    helper に `api.js` を使用し、`register.runtime.js` は引き続き repo ローカル用途のために generic な
    `plugin-sdk/provider-stream` helper を再 export できます。
- facade 読み込みの public entry point は、存在する場合はアクティブなランタイム config snapshot を優先し、
  OpenClaw がまだランタイム snapshot を提供していない場合は disk 上の解決済み config file にフォールバックします。
- generic な共有 primitive は引き続き推奨 public SDK contract です。バンドル済み channel ブランド付き helper seam の、小さな予約済み互換セットがまだ存在します。これらは
  新しいサードパーティ import target ではなく、バンドル済み保守/互換 seam として扱ってください。新しい cross-channel contract は引き続き
  generic な `plugin-sdk/*` subpath または plugin ローカルの `api.js` /
  `runtime-api.js` barrel に配置するべきです。

互換性に関する注記:

- 新しいコードではルートの `openclaw/plugin-sdk` barrel を避けてください。
- まず狭く安定した primitive を優先してください。新しい setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool subpath が、新しい
  バンドル済みおよび外部 plugin 作業に対する意図されたコントラクトです。
  target の parse/match は `openclaw/plugin-sdk/channel-targets` に属します。
  message action gate と reaction の message-id helper は
  `openclaw/plugin-sdk/channel-actions` に属します。
- バンドル済み extension 固有の helper barrel は、デフォルトでは stable ではありません。
  helper がバンドル済み extension にのみ必要な場合は、
  `openclaw/plugin-sdk/<extension>` に昇格させるのではなく、その extension の
  ローカル `api.js` または `runtime-api.js` seam の背後に置いてください。
- 新しい共有 helper seam は、channel ブランド付きではなく generic であるべきです。共有 target
  parse は `openclaw/plugin-sdk/channel-targets` に属し、channel 固有の
  internals は所有する plugin のローカル `api.js` または `runtime-api.js`
  seam の背後に残すべきです。
- `image-generation`、
  `media-understanding`、`speech` のような capability 固有 subpath は、現在バンドル済み/ネイティブ plugin が
  それらを使っているため存在します。それらが存在すること自体は、export されたすべての helper が
  長期的に凍結された外部コントラクトであることを意味しません。

## Message tool schema

Plugin は、reaction、read、poll のような非 message primitive に対する
channel 固有の `describeMessageTool(...)` schema
contribution を所有するべきです。共有 send presentation には、provider-native な button、component、block、card field ではなく、
汎用の `MessagePresentation` contract を使用するべきです。
contract、fallback ルール、provider mapping、plugin author 向けチェックリストについては
[Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

send 可能な Plugin は、message capability を通じて何を render できるかを宣言します:

- semantic presentation block（`text`、`context`、`divider`、`buttons`、`select`）用の `presentation`
- pinned-delivery request 用の `delivery-pin`

Core は、その presentation をネイティブに render するか、text に degrade するかを決定します。
汎用 message tool から provider-native UI escape hatch を公開しないでください。
レガシー native schema 向けの非推奨 SDK helper は既存の
サードパーティ plugin 向けに引き続き export されていますが、新しい plugin はそれらを使うべきではありません。

## Channel target 解決

Channel Plugin は channel 固有の target semantics を所有するべきです。共有
outbound host は generic のままにし、provider ルールには messaging adapter surface を使用してください:

- `messaging.inferTargetChatType({ to })` は、directory lookup 前に、正規化された target を `direct`、`group`、`channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、directory search ではなく、ある入力をそのまま id 風の解決へ進めるべきかどうかを core に伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または
  directory miss 後に core が最終的な provider 所有の解決を必要とする場合の plugin 側 fallback です。
- `messaging.resolveOutboundSessionRoute(...)` は、target が解決された後の provider 固有の session
  route 構築を所有します。

推奨される分割:

- peer/group を検索する前に行うべきカテゴリ判断には `inferTargetChatType` を使用する。
- 「これを明示的/ネイティブな target id として扱う」判定には `looksLikeId` を使用する。
- broad な directory search には使わず、provider 固有の正規化 fallback には `resolveTarget` を使用する。
- chat id、thread id、JID、handle、room
  id のような provider-native id は、汎用 SDK field ではなく、`target` 値または provider 固有 param の中に保持する。

## config ベースの directory

config から directory エントリを導出する Plugin は、そのロジックを
plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有 helper を再利用するべきです。

これは、channel が次のような config ベースの peer/group を必要とする場合に使用します:

- allowlist 駆動の DM peer
- 設定済み channel/group map
- account スコープの静的 directory fallback

`directory-runtime` 内の共有 helper は、汎用操作のみを扱います:

- query filtering
- limit の適用
- dedupe/正規化 helper
- `ChannelDirectoryEntry[]` の構築

channel 固有の account 検査と id 正規化は、plugin 実装内に残すべきです。

## provider catalog

provider Plugin は、
`registerProvider({ catalog: { run(...) { ... } } })` を使って推論用の model catalog を定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むのと同じ形を返します:

- 1 つの provider エントリには `{ provider }`
- 複数の provider エントリには `{ providers }`

plugin が provider 固有の model id、base URL
デフォルト、または auth 制御された model metadata を所有する場合は `catalog` を使用してください。

`catalog.order` は、OpenClaw の組み込み implicit provider と比べて plugin の catalog がいつマージされるかを制御します:

- `simple`: プレーンな API-key または env 駆動 provider
- `profile`: auth profile が存在すると現れる provider
- `paired`: 複数の関連 provider エントリを合成する provider
- `late`: 他の implicit provider の後、最後のパス

後の provider がキー競合時に勝つため、plugin は同じ provider id を持つ組み込み provider エントリを意図的に上書きできます。

互換性:

- `discovery` は引き続きレガシー alias として動作します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します

## 読み取り専用の channel 検査

plugin が channel を登録する場合、`resolveAccount(...)` と並んで
`plugin.config.inspectAccount(cfg, accountId)` を実装することを推奨します。

理由:

- `resolveAccount(...)` は runtime パスです。認証情報が
  完全に materialize されていることを前提にでき、必要な secret が欠けていれば即座に失敗してかまいません。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`、doctor/config
  修復フローのような読み取り専用 command パスは、単に設定を説明するためだけに runtime 認証情報を materialize する必要があるべきではありません。

推奨される `inspectAccount(...)` の動作:

- 記述的な account 状態のみを返す。
- `enabled` と `configured` を保持する。
- relevant な場合は credential source/status field を含める。たとえば:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の可用性を報告するためだけに raw token 値を返す必要はありません。status 形式の command には
  `tokenStatus: "available"`（および対応する source field）を返せば十分です。
- credential が SecretRef 経由で設定されているが現在の command path では利用できない場合は
  `configured_unavailable` を使用してください。

これにより、読み取り専用 command は、クラッシュしたり account を未設定と誤報したりする代わりに、
「この command path では設定済みだが利用不可」と報告できます。

## Package pack

plugin ディレクトリには、`openclaw.extensions` を持つ `package.json` を含めることができます:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリは plugin になります。pack が複数の extension を列挙している場合、plugin id
は `name/<fileBase>` になります。

plugin が npm 依存関係を import する場合は、そのディレクトリにインストールして
`node_modules` が利用可能になるようにしてください（`npm install` / `pnpm install`）。

セキュリティ上のガードレール: すべての `openclaw.extensions` エントリは、symlink 解決後も
plugin ディレクトリ内に留まらなければなりません。package ディレクトリの外へ出るエントリは
拒否されます。

セキュリティ注記: `openclaw plugins install` は plugin の依存関係を
`npm install --omit=dev --ignore-scripts` でインストールします（lifecycle script なし、runtime 時の dev dependency なし）。plugin の dependency
tree は「pure JS/TS」に保ち、`postinstall` build を必要とする package は避けてください。

任意: `openclaw.setupEntry` は軽量な setup 専用 module を指すことができます。
OpenClaw が無効な channel plugin の setup surface を必要とする場合、または
channel plugin が有効でもまだ未設定の場合、完全な plugin entry の代わりに `setupEntry`
をロードします。これにより、main plugin entry が tool、hook、その他の runtime 専用
code も設定している場合に、起動と setup を軽量に保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
を使用すると、channel plugin がすでに設定済みであっても、Gateway の
pre-listen 起動フェーズ中に同じ `setupEntry` パスを選択できます。

これを使うのは、`setupEntry` が Gateway が listen を開始する前に存在していなければならない起動 surface を完全にカバーしている場合だけにしてください。実際には、setup entry が、起動時に依存するあらゆる channel 所有 capability を登録しなければならないことを意味します。たとえば:

- channel 登録そのもの
- Gateway が listen を開始する前に利用可能でなければならない HTTP route
- 同じ時間帯に存在していなければならない Gateway method、tool、service

完全な entry が依然として必要な起動 capability を所有している場合は、このフラグを有効にしないでください。
デフォルト動作のままにし、OpenClaw に起動中に完全な entry をロードさせてください。

バンドル済み channel は、完全な channel runtime がロードされる前に core が参照できる
setup 専用 contract-surface helper を公開することもできます。現在の setup
promotion surface は次のとおりです:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core は、完全な plugin entry をロードせずに、レガシーな単一アカウント channel
config を `channels.<id>.accounts.*` に昇格する必要があるときに、その surface を使用します。
Matrix が現在のバンドル済みの例です。named account がすでに存在する場合、auth/bootstrap key のみを名前付き昇格アカウントへ移動し、
常に `accounts.default` を作成するのではなく、設定済みの非 canonical な default-account key を保持できます。

これらの setup patch adapter により、バンドル済み contract-surface discovery は lazy のまま保たれます。import
時間は軽く保たれ、promotion surface は module import 時にバンドル済み channel 起動へ再突入する代わりに、
最初に使用される時点でのみロードされます。

それらの起動 surface に Gateway RPC method が含まれる場合は、
plugin 固有の prefix に保ってください。core の admin namespace（`config.*`、
`exec.approvals.*`, `wizard.*`, `update.*`）は引き続き予約済みであり、
plugin がより狭い scope を要求していても、常に `operator.admin` に解決されます。

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

Channel Plugin は `openclaw.channel` 経由で setup/discovery metadata を、
`openclaw.install` 経由で install hint を公開できます。これにより core catalog を data-free に保てます。

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

最小例以外で有用な `openclaw.channel` field:

- `detailLabel`: より豊かな catalog/status surface 向けの補助ラベル
- `docsLabel`: docs リンクのリンクテキストを上書きする
- `preferOver`: この catalog エントリが優先して上位に来るべき、より低優先度の plugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection surface の文言制御
- `markdownCapable`: 外向き formatting の判断のため、この channel を markdown 対応としてマークする
- `exposure.configured`: `false` に設定すると、configured-channel 一覧 surface からこの channel を非表示にする
- `exposure.setup`: `false` に設定すると、interactive setup/configure picker からこの channel を非表示にする
- `exposure.docs`: docs ナビゲーション surface でこの channel を internal/private としてマークする
- `showConfigured` / `showInSetup`: 互換性のため引き続き受け付けられるレガシー alias。`exposure` を推奨
- `quickstartAllowFrom`: この channel を標準クイックスタート `allowFrom` フローに参加させる
- `forceAccountBinding`: account が 1 つしか存在しない場合でも明示的な account binding を必須にする
- `preferSessionLookupForAnnounceTarget`: announce target 解決時に session lookup を優先する

OpenClaw は **外部 channel catalog**（たとえば MPM
registry export）もマージできます。JSON file を次のいずれかに置いてください:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または `OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で
1 つ以上の JSON file を指定します（カンマ/セミコロン/`PATH` 区切り）。各 file は
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含む必要があります。parser は `"entries"` キーのレガシー alias として `"packages"` または `"plugins"` も受け付けます。

## Context engine Plugin

Context engine Plugin は、ingest、assembly、
Compaction のための session context オーケストレーションを所有します。plugin から
`api.registerContextEngine(id, factory)` で登録し、アクティブ engine は
`plugins.slots.contextEngine` で選択します。

これは、plugin が単に memory search や hook を追加するのではなく、
デフォルトの context pipeline を置き換えるか拡張する必要がある場合に使用します。

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

engine が Compaction アルゴリズムを**所有しない**場合でも、`compact()`
は実装し、明示的に委譲してください:

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

## 新しい capability の追加

plugin が現在の API に収まらない動作を必要とする場合、private な reach-in で
plugin system を迂回しないでください。不足している capability を追加してください。

推奨される手順:

1. core contract を定義する
   core が所有すべき共有動作を決めます: policy、fallback、config merge、
   lifecycle、channel 向け semantics、ランタイム helper の形。
2. typed な plugin 登録/runtime surface を追加する
   最小限で有用な typed capability surface で `OpenClawPluginApi` および/または `api.runtime` を拡張します。
3. core + channel/feature consumer を接続する
   channel と feature plugin は、新しい capability を vendor 実装を直接 import するのではなく、
   core 経由で利用するべきです。
4. vendor 実装を登録する
   その後、vendor Plugin がその capability に対して backend を登録します。
5. contract coverage を追加する
   所有権と登録形状が時間とともに明示的なままであるように test を追加します。

これが、OpenClaw が 1 つの
provider の worldview にハードコードされることなく、意見を持った設計を保つ方法です。具体的な file チェックリストと実例については [Capability Cookbook](/ja-JP/plugins/architecture)
を参照してください。

### Capability チェックリスト

新しい capability を追加するときは、実装は通常これらの
surface をまとめて触るべきです:

- `src/<capability>/types.ts` 内の core contract type
- `src/<capability>/runtime.ts` 内の core runner/runtime helper
- `src/plugins/types.ts` 内の plugin API 登録 surface
- `src/plugins/registry.ts` 内の plugin registry wiring
- feature/channel
  plugin がそれを利用する必要がある場合の `src/plugins/runtime/*` 内の plugin runtime 公開
- `src/test-utils/plugin-registration.ts` 内の capture/test helper
- `src/plugins/contracts/registry.ts` 内の所有権/contract assertion
- `docs/` 内の operator/plugin docs

これらの surface のどれかが欠けている場合、それは通常、
その capability がまだ完全には統合されていないサインです。

### Capability テンプレート

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

// feature/channel plugin 向けの共有ランタイム helper
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

contract test パターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これによりルールはシンプルに保たれます:

- core が capability contract + オーケストレーションを所有する
- vendor Plugin が vendor 実装を所有する
- feature/channel Plugin はランタイム helper を利用する
- contract test が所有権を明示的に保つ
