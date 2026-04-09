---
read_when:
    - ネイティブ OpenClaw プラグインを構築またはデバッグしている
    - プラグインの capability モデルや所有権の境界を理解したい
    - プラグインのロードパイプラインやレジストリに取り組んでいる
    - プロバイダーランタイムフックやチャネルプラグインを実装している
sidebarTitle: Internals
summary: 'プラグイン内部: capability モデル、所有権、コントラクト、ロードパイプライン、ランタイムヘルパー'
title: プラグイン内部
x-i18n:
    generated_at: "2026-04-09T01:33:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2575791f835990589219bb06d8ca92e16a8c38b317f0bfe50b421682f253ef18
    source_path: plugins/architecture.md
    workflow: 15
---

# プラグイン内部

<Info>
  これは**詳細なアーキテクチャリファレンス**です。実用的なガイドについては、次を参照してください。
  - [Install and use plugins](/ja-JP/tools/plugin) — ユーザーガイド
  - [はじめに](/ja-JP/plugins/building-plugins) — 最初のプラグインチュートリアル
  - [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — メッセージングチャネルを構築する
  - [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — モデルプロバイダーを構築する
  - [SDK Overview](/ja-JP/plugins/sdk-overview) — import map と登録 API
</Info>

このページでは、OpenClaw プラグインシステムの内部アーキテクチャを扱います。

## 公開 capability モデル

capability は、OpenClaw 内部における公開された **ネイティブプラグイン** モデルです。すべてのネイティブ OpenClaw プラグインは、1 つ以上の capability タイプに対して登録されます。

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
| Web フェッチ           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web 検索               | `api.registerWebSearchProvider(...)`             | `google`                             |
| チャネル / メッセージング | `api.registerChannel(...)`                    | `msteams`, `matrix`                  |

capability を 1 つも登録せず、hooks、tools、または services を提供するプラグインは、**legacy hook-only** プラグインです。このパターンも引き続き完全にサポートされています。

### 外部互換性に関する立場

capability モデルはすでに core に導入され、現在 bundled/native plugins で使われていますが、外部プラグインの互換性については、「export されているから凍結済み」とみなすよりも厳密な基準が必要です。

現在のガイダンス:

- **既存の外部プラグイン:** hook ベースの統合を動作し続けるようにする。これを互換性の基準線として扱う
- **新しい bundled/native plugins:** ベンダー固有の直接依存や新たな hook-only 設計ではなく、明示的な capability 登録を優先する
- **capability 登録を採用する外部プラグイン:** 許可されるが、docs で明示的に安定したコントラクトと示されていない限り、capability 固有の helper surfaces は進化中と考える

実務上のルール:

- capability registration APIs が意図された方向性
- legacy hooks は、移行期間中の外部プラグインにとって最も破壊の少ない安全な経路であり続ける
- export されている helper subpaths はすべて同等ではない。偶発的な helper exports ではなく、文書化された狭いコントラクトを優先する

### プラグイン形状

OpenClaw は、読み込まれた各プラグインを、実際の登録動作に基づいて形状分類します（静的メタデータだけではありません）。

- **plain-capability** -- ちょうど 1 種類の capability を登録する（例: `mistral` のような provider-only プラグイン）
- **hybrid-capability** -- 複数種類の capability を登録する（例: `openai` は text inference、speech、media understanding、image generation を所有する）
- **hook-only** -- hooks（typed または custom）のみを登録し、capabilities、tools、commands、services は登録しない
- **non-capability** -- tools、commands、services、または routes を登録するが capability は登録しない

`openclaw plugins inspect <id>` を使用すると、プラグインの形状と capability の内訳を確認できます。詳細は [CLI reference](/cli/plugins#inspect) を参照してください。

### Legacy hooks

`before_agent_start` hook は、hook-only プラグイン向けの互換性経路として引き続きサポートされています。現実の legacy プラグインが今もこれに依存しています。

方向性:

- 動作し続けるようにする
- legacy として文書化する
- model/provider の上書きには `before_model_resolve` を優先する
- prompt の変更には `before_prompt_build` を優先する
- 実利用が減少し、fixture coverage が移行の安全性を証明するまで削除しない

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、次のいずれかのラベルが表示されることがあります。

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **設定は有効**             | Config は正常に解析され、plugins が解決される               |
| **互換性アドバイザリー**   | プラグインがサポートされているが古いパターンを使っている（例: `hook-only`） |
| **legacy warning**         | プラグインが `before_agent_start` を使っている。これは非推奨 |
| **hard error**             | Config が無効、またはプラグインの読み込みに失敗した          |

`hook-only` も `before_agent_start` も、現時点であなたのプラグインを壊すことはありません -- `hook-only` は助言であり、`before_agent_start` は警告を出すだけです。これらのシグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw のプラグインシステムは 4 つのレイヤーを持ちます。

1. **Manifest + discovery**
   OpenClaw は、設定されたパス、workspace roots、global extension roots、および bundled extensions から候補プラグインを見つけます。discovery は、ネイティブの `openclaw.plugin.json` manifests と、サポートされる bundle manifests を最初に読み取ります。
2. **Enablement + validation**
   Core は、発見されたプラグインが有効、無効、ブロック対象、または memory のような排他的スロットに選択されるべきかを決定します。
3. **Runtime loading**
   ネイティブ OpenClaw プラグインは jiti を通じてプロセス内で読み込まれ、capabilities を中央レジストリに登録します。互換 bundle はランタイムコードを import せずに registry records に正規化されます。
4. **Surface consumption**
   OpenClaw の残りの部分は registry を読み取り、tools、channels、provider setup、hooks、HTTP routes、CLI commands、services を公開します。

特にプラグイン CLI では、root command discovery は 2 段階に分かれます。

- parse-time metadata は `registerCli(..., { descriptors: [...] })` から取得される
- 実際の plugin CLI module は遅延読み込みのままにして、最初の呼び出し時に登録できる

これにより、OpenClaw は解析前に root command 名を予約しつつ、plugin-owned CLI code をプラグイン内部に保てます。

重要な設計境界:

- discovery + config validation は、プラグインコードを実行せずに **manifest/schema metadata** から動作できるべき
- ネイティブな runtime behavior は、プラグインモジュールの `register(api)` パスから生まれる

この分離により、OpenClaw はフルランタイム起動前でも、config を検証し、不足または無効な plugins を説明し、UI/schema hints を構築できます。

### チャネルプラグインと共有 message tool

チャネルプラグインは、通常のチャット操作のために個別の send/edit/react tool を登録する必要はありません。OpenClaw は core に 1 つの共有 `message` tool を保持し、チャネルプラグインはその背後のチャネル固有 discovery と execution を所有します。

現在の境界は次のとおりです。

- core は共有 `message` tool host、prompt wiring、session/thread bookkeeping、および execution dispatch を所有する
- channel plugins は、scoped action discovery、capability discovery、および channel 固有の schema fragments を所有する
- channel plugins は、conversation ids が thread ids をどのようにエンコードするか、または親 conversations をどう継承するかといった、provider 固有の session conversation grammar を所有する
- channel plugins は action adapter を通じて最終 action を実行する

チャネルプラグイン向けの SDK surface は `ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一された discovery call により、プラグインは表示される actions、capabilities、schema contributions をまとめて返すことができ、それらが食い違わないようにできます。

Core は、この discovery step に runtime scope を渡します。重要なフィールドには次が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼された inbound `requesterSenderId`

これはコンテキスト依存のプラグインにとって重要です。チャネルは、core の `message` tool にチャネル固有の分岐をハードコードすることなく、アクティブな account、現在の room/thread/message、または信頼された requester identity に基づいて、message actions を隠したり公開したりできます。

このため、embedded-runner routing の変更が依然として plugin 側の作業になるのです。runner は、共有 `message` tool が現在のターンに対して正しい channel-owned surface を公開できるよう、現在の chat/session identity を plugin discovery boundary に転送する責任があります。

channel-owned execution helpers については、bundled plugins は execution runtime を自分たちの extension modules 内に保持すべきです。Core はもはや `src/agents/tools` 配下で Discord、Slack、Telegram、または WhatsApp の message-action runtimes を所有しません。個別の `plugin-sdk/*-action-runtime` subpaths は公開しておらず、bundled plugins は自分たちの extension-owned modules からローカルな runtime code を直接 import すべきです。

同じ境界は、一般に provider 名付きの SDK seams にも適用されます。Core は Slack、Discord、Signal、WhatsApp、または類似の extensions 向け convenience barrels を import すべきではありません。Core がある振る舞いを必要とする場合は、bundled plugin 自身の `api.ts` / `runtime-api.ts` barrel を使うか、その必要性を shared SDK の狭い汎用 capability に昇格させてください。

polls については、特に 2 つの execution path があります。

- `outbound.sendPoll` は、共通の poll model に適合するチャネル向けの共有ベースライン
- `actions.handleAction("poll")` は、チャネル固有の poll semantics や追加 poll parameters に適した推奨パス

Core は現在、plugin poll dispatch が action を拒否した後まで共有 poll parsing を遅延させるため、plugin-owned poll handlers は generic poll parser に先にブロックされることなく、channel-specific な poll fields を受け入れられます。

完全な起動シーケンスについては、[Load pipeline](#load-pipeline) を参照してください。

## Capability 所有権モデル

OpenClaw は、ネイティブプラグインを、無関係な統合の寄せ集めではなく、**企業**または**機能**の所有権境界として扱います。

つまり:

- 企業プラグインは通常、その企業に関わる OpenClaw 向け surface をすべて所有すべき
- 機能プラグインは通常、自分が導入する機能 surface 全体を所有すべき
- channels は provider behavior をその場しのぎで再実装するのではなく、共有 core capabilities を利用すべき

例:

- bundled `openai` plugin は OpenAI の model-provider behavior と、OpenAI の speech + realtime-voice + media-understanding + image-generation behavior を所有する
- bundled `elevenlabs` plugin は ElevenLabs の speech behavior を所有する
- bundled `microsoft` plugin は Microsoft の speech behavior を所有する
- bundled `google` plugin は Google の model-provider behavior と、Google の media-understanding + image-generation + web-search behavior を所有する
- bundled `firecrawl` plugin は Firecrawl の web-fetch behavior を所有する
- bundled `minimax`, `mistral`, `moonshot`, `zai` plugins は、それぞれの media-understanding backends を所有する
- `qwen` plugin は Qwen の text-provider behavior と media-understanding、video-generation behavior を所有する
- `voice-call` plugin は feature plugin であり、call transport、tools、CLI、routes、Twilio media-stream bridging を所有するが、vendor plugins を直接 import せず、共有 speech と realtime-transcription、realtime-voice capabilities を利用する

意図された最終形は次のとおりです。

- OpenAI は、text models、speech、images、将来の video にまたがっても 1 つのプラグインに存在する
- 他のベンダーも自分の surface area 全体を同じように 1 か所で所有できる
- channels は、どの vendor plugin が provider を所有しているかを気にせず、core が公開する共有 capability contract を利用する

ここでの重要な区別は次のとおりです。

- **plugin** = 所有権境界
- **capability** = 複数の plugins が実装または利用できる core contract

したがって、OpenClaw が video のような新しいドメインを追加するとき、最初の問いは「どの provider が video handling をハードコードすべきか」ではありません。最初の問いは「core の video capability contract は何か」です。その contract が存在すれば、vendor plugins はそれに対して登録でき、channel/feature plugins はそれを利用できます。

capability がまだ存在しない場合、通常は次の手順が正しい対応です。

1. core で不足している capability を定義する
2. plugin API/runtime を通じて、それを型付きで公開する
3. channels/features をその capability に対して配線する
4. vendor plugins に実装を登録させる

これにより、所有権を明確に保ちながら、単一ベンダーや単発の plugin 固有コードパスに依存する core behavior を避けられます。

### Capability layering

コードの配置先を決めるときは、次のメンタルモデルを使ってください。

- **core capability layer**: 共有の orchestration、policy、fallback、config merge rules、delivery semantics、および typed contracts
- **vendor plugin layer**: ベンダー固有 API、auth、model catalogs、speech synthesis、image generation、将来の video backends、usage endpoints
- **channel/feature plugin layer**: Slack/Discord/voice-call などの統合で、core capabilities を利用し、それを surface として提示する層

たとえば、TTS は次の形になります。

- core は reply-time TTS policy、fallback order、prefs、channel delivery を所有する
- `openai`, `elevenlabs`, `microsoft` は synthesis implementations を所有する
- `voice-call` は telephony TTS runtime helper を利用する

将来の capabilities でも、この同じパターンを優先してください。

### 複数 capability を持つ企業プラグインの例

企業プラグインは、外から見て一貫性があるべきです。OpenClaw に models、speech、realtime transcription、realtime voice、media understanding、image generation、video generation、web fetch、web search の共有コントラクトがあるなら、ベンダーは自分の全 surface を 1 か所で所有できます。

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

重要なのは正確な helper 名ではありません。形が重要です。

- 1 つのプラグインが vendor surface を所有する
- core は capability contracts を所有し続ける
- channels と feature plugins は vendor code ではなく `api.runtime.*` helpers を使う
- contract tests は、そのプラグインが所有を主張する capabilities を登録したことを検証できる

### Capability の例: video understanding

OpenClaw はすでに image/audio/video understanding を 1 つの共有 capability として扱っています。同じ所有権モデルがここにも適用されます。

1. core が media-understanding contract を定義する
2. vendor plugins が必要に応じて `describeImage`、`transcribeAudio`、`describeVideo` を登録する
3. channels と feature plugins は vendor code に直接配線せず、共有 core behavior を利用する

これにより、特定 provider の video 前提が core に焼き込まれることを避けられます。plugin が vendor surface を所有し、core が capability contract と fallback behavior を所有します。

video generation もすでに同じ流れを使っています。core が typed capability contract と runtime helper を所有し、vendor plugins がそれに対して `api.registerVideoGenerationProvider(...)` 実装を登録します。

具体的なロールアウトのチェックリストが必要ですか。[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

## コントラクトと強制

プラグイン API surface は、意図的に型付けされ、`OpenClawPluginApi` に集約されています。この contract は、サポートされる登録ポイントと、プラグインが依存できる runtime helpers を定義します。

これが重要な理由:

- plugin authors は 1 つの安定した内部標準を得られる
- core は、2 つの plugins が同じ provider id を登録するような重複所有を拒否できる
- 起動時に不正な登録に対する実用的な diagnostics を提示できる
- contract tests により、bundled-plugin の所有権を強制し、無言の drift を防げる

強制には 2 つのレイヤーがあります。

1. **runtime registration enforcement**
   plugin registry は、plugins の読み込み中に登録を検証します。例: duplicate provider ids、duplicate speech provider ids、不正な登録は未定義動作ではなく plugin diagnostics を生成します。
2. **contract tests**
   bundled plugins はテスト実行中に contract registries に記録され、OpenClaw が所有権を明示的に検証できるようになります。現在は model providers、speech providers、web search providers、bundled registration ownership に使われています。

実際の効果として、OpenClaw は各 surface をどの plugin が所有しているかを事前に把握します。これにより、所有権が暗黙ではなく宣言され、型付けされ、テスト可能になるため、core と channels はスムーズに合成できます。

### コントラクトに含めるべきもの

良いプラグインコントラクトは次の特徴を持ちます。

- 型付きである
- 小さい
- capability 固有である
- core が所有する
- 複数の plugins で再利用できる
- channels/features がベンダー知識なしで利用できる

悪いプラグインコントラクトは次のようなものです。

- core に隠されたベンダー固有 policy
- registry を迂回する単発の plugin 用 escape hatch
- vendor implementation に直接入り込む channel code
- `OpenClawPluginApi` や `api.runtime` の一部ではない、その場しのぎの runtime objects

迷ったときは、抽象度を上げてください。まず capability を定義し、その後 plugins をそこに接続させます。

## 実行モデル

ネイティブ OpenClaw プラグインは、Gateway と **同一プロセス内** で実行されます。sandbox 化はされていません。読み込まれたネイティブプラグインは、core code と同じプロセスレベルの trust boundary を持ちます。

含意:

- ネイティブプラグインは tools、network handlers、hooks、services を登録できる
- ネイティブプラグインのバグは gateway をクラッシュまたは不安定化させ得る
- 悪意のあるネイティブプラグインは、OpenClaw process 内での任意コード実行と同等である

互換 bundles は、OpenClaw が現時点ではそれらを metadata/content packs として扱うため、デフォルトではより安全です。現在のリリースでは、これは主に bundled skills を意味します。

bundled されていないプラグインには allowlists と明示的な install/load paths を使ってください。workspace plugins は production defaults ではなく、開発時コードとして扱ってください。

bundled workspace package names では、plugin id を npm 名に固定してください。デフォルトでは `@openclaw/<id>`、または意図的により狭い plugin role を公開する場合は、`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` のような承認済み typed suffix を使います。

重要な trust に関する注意:

- `plugins.allow` が信頼するのは **plugin ids** であり、ソースの来歴ではありません。
- bundled plugin と同じ id を持つ workspace plugin は、その workspace plugin が enabled/allowlisted である場合、意図的に bundled copy をシャドーします。
- これは通常の動作であり、ローカル開発、パッチテスト、hotfix に有用です。

## Export 境界

OpenClaw が export するのは、実装上の便利機能ではなく capabilities です。

capability registration は公開されたままにしてください。非コントラクト helper exports は削減します。

- bundled-plugin 固有の helper subpaths
- public API として意図されていない runtime plumbing subpaths
- vendor-specific convenience helpers
- 実装詳細である setup/onboarding helpers

一部の bundled-plugin helper subpaths は、互換性と bundled-plugin 保守のために、生成された SDK export map にまだ残っています。現在の例には `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、およびいくつかの `plugin-sdk/matrix*` seams が含まれます。これらは、新しい third-party plugins に推奨される SDK パターンではなく、予約された実装詳細 export として扱ってください。

## Load pipeline

起動時に、OpenClaw は概ね次の処理を行います。

1. 候補 plugin roots を発見する
2. ネイティブまたは互換 bundle の manifests と package metadata を読み取る
3. 安全でない候補を拒否する
4. plugin config（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）を正規化する
5. 各候補の enablement を決定する
6. 有効なネイティブ modules を jiti 経由で読み込む
7. ネイティブ `register(api)`（または legacy alias の `activate(api)`）hooks を呼び出し、登録内容を plugin registry に集める
8. registry を commands/runtime surfaces に公開する

<Note>
`activate` は `register` の legacy alias です — loader は存在する方（`def.register ?? def.activate`）を解決し、同じタイミングで呼び出します。すべての bundled plugins は `register` を使用しています。新しい plugins では `register` を優先してください。
</Note>

安全性ゲートは、runtime execution **前** に行われます。entry が plugin root から逸脱している、path が world-writable、または non-bundled plugins に対して path ownership が疑わしい場合、候補はブロックされます。

### Manifest-first の動作

manifest は、control-plane における source of truth です。OpenClaw はこれを使って次を行います。

- plugin を識別する
- 宣言された channels/skills/config schema や bundle capabilities を発見する
- `plugins.entries.<id>.config` を検証する
- Control UI の labels/placeholders を補強する
- install/catalog metadata を表示する

ネイティブ plugins では、runtime module が data-plane 部分です。ここが hooks、tools、commands、provider flows などの実際の振る舞いを登録します。

### ローダーがキャッシュするもの

OpenClaw は、短期間の in-process caches を保持します。

- discovery results
- manifest registry data
- loaded plugin registries

これらの caches は、起動時の急激な負荷やコマンドの繰り返し実行時のオーバーヘッドを減らします。これらは永続化ではなく、短命な performance caches として考えるのが安全です。

パフォーマンスに関する注意:

- `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定すると、これらの caches を無効にできます。
- cache window は `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` と `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整できます。

## Registry モデル

読み込まれた plugins は、無秩序に core globals を直接変更しません。中央の plugin registry に登録します。

registry が追跡するもの:

- plugin records（identity、source、origin、status、diagnostics）
- tools
- legacy hooks と typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin-owned commands

その後、core features は plugin modules に直接話しかけるのではなく、この registry を読み取ります。これにより、読み込みは一方向になります。

- plugin module -> registry registration
- core runtime -> registry consumption

この分離は保守性のために重要です。ほとんどの core surfaces は、「registry を読む」という 1 つの統合ポイントだけを必要とし、「各 plugin module を特別扱いする」必要がなくなります。

## 会話バインディングのコールバック

会話をバインドするプラグインは、承認が解決されたときに反応できます。

`api.onConversationBindingResolved(...)` を使うと、bind request が承認または拒否された後にコールバックを受け取れます。

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // この plugin + conversation に対するバインディングが存在するようになった。
        console.log(event.binding?.conversationId);
        return;
      }

      // リクエストは拒否された。ローカルの pending state を消去する。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

コールバック payload のフィールド:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認された request に対する解決済み binding
- `request`: 元の request summary、detach hint、sender id、conversation metadata

このコールバックは通知専用です。誰が会話を bind できるかは変更せず、core の approval handling が完了した後に実行されます。

## Provider ランタイムフック

provider plugins には現在 2 つのレイヤーがあります。

- manifest metadata: ランタイム読み込み前に安価な provider env-auth lookup を行う `providerAuthEnvVars`、auth を共有する provider variants のための `providerAuthAliases`、ランタイム読み込み前に安価な channel env/setup lookup を行う `channelEnvVars`、さらにランタイム読み込み前に安価な onboarding/auth-choice labels と CLI flag metadata を提供する `providerAuthChoices`
- config-time hooks: `catalog` / legacy `discovery` と `applyConfigDefaults`
- runtime hooks: `normalizeModelId`, `normalizeTransport`,
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw は引き続き、汎用的な agent loop、failover、transcript handling、tool policy を所有します。これらの hooks は、provider-specific behavior のための extension surface であり、カスタム推論 transport 全体を必要としません。

provider が、generic auth/status/model-picker paths にランタイムを読み込まず認識されるべき env ベースの credentials を持つ場合は、manifest `providerAuthEnvVars` を使ってください。ある provider id が別の provider id の env vars、auth profiles、config-backed auth、API-key onboarding choice を再利用すべき場合は、manifest `providerAuthAliases` を使ってください。onboarding/auth-choice CLI surfaces がランタイムを読み込まずに、その provider の choice id、group labels、単純な one-flag auth wiring を知る必要がある場合は、manifest `providerAuthChoices` を使ってください。provider runtime の `envVars` は、onboarding labels や OAuth client-id/client-secret setup vars のような operator-facing hints 用に維持してください。

チャネルに、generic shell-env fallback、config/status checks、setup prompts がランタイムを読み込まず見えるようにすべき env-driven auth または setup がある場合は、manifest `channelEnvVars` を使ってください。

### フックの順序と使いどころ

model/provider plugins では、OpenClaw は概ね次の順序で hooks を呼び出します。「When to use」列は、素早い判断ガイドです。

| #   | Hook                              | What it does                                                                                                   | When to use                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成中に provider config を `models.providers` に公開する                                        | provider が catalog または base URL defaults を所有している                                                                                |
| 2   | `applyConfigDefaults`             | config materialization 中に provider-owned のグローバル config defaults を適用する                           | defaults が auth mode、env、または provider model-family semantics に依存する                                                              |
| --  | _(組み込み model lookup)_         | OpenClaw はまず通常の registry/catalog path を試す                                                             | _(plugin hook ではない)_                                                                                                                    |
| 3   | `normalizeModelId`                | lookup 前に legacy または preview の model-id aliases を正規化する                                            | provider が canonical model resolution 前の alias cleanup を所有している                                                                    |
| 4   | `normalizeTransport`              | 汎用 model assembly 前に provider-family の `api` / `baseUrl` を正規化する                                    | provider が同じ transport family 内の custom provider ids 向け transport cleanup を所有している                                            |
| 5   | `normalizeConfig`                 | runtime/provider resolution 前に `models.providers.<id>` を正規化する                                         | provider に plugin 側で持つべき config cleanup が必要。bundled Google-family helpers は、サポートされる Google config entries の保険にもなる |
| 6   | `applyNativeStreamingUsageCompat` | config providers に native streaming-usage compat rewrites を適用する                                         | provider が endpoint-driven な native streaming usage metadata fixes を必要とする                                                           |
| 7   | `resolveConfigApiKey`             | runtime auth loading 前に config providers の env-marker auth を解決する                                      | provider が provider-owned の env-marker API-key resolution を持つ。`amazon-bedrock` はここに組み込みの AWS env-marker resolver も持つ    |
| 8   | `resolveSyntheticAuth`            | plaintext を永続化せずに local/self-hosted または config-backed auth を表面化する                            | provider が synthetic/local credential marker で動作できる                                                                                  |
| 9   | `resolveExternalAuthProfiles`     | provider-owned の external auth profiles を重ね合わせる。`persistence` のデフォルトは CLI/app-owned creds に対して `runtime-only` | provider が copied refresh tokens を永続化せず external auth credentials を再利用する                                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済み synthetic profile placeholders の優先順位を env/config-backed auth より下げる                       | provider が precedence を持つべきでない synthetic placeholder profiles を保存する                                                           |
| 11  | `resolveDynamicModel`             | ローカル registry にまだない provider-owned model ids の同期 fallback                                          | provider が任意の upstream model ids を受け入れる                                                                                           |
| 12  | `prepareDynamicModel`             | 非同期 warm-up の後、`resolveDynamicModel` が再実行される                                                     | provider が未知の ids を解決する前に network metadata を必要とする                                                                          |
| 13  | `normalizeResolvedModel`          | embedded runner が resolved model を使う前の最終書き換え                                                      | provider が transport rewrites を必要とするが、なお core transport を使う                                                                   |
| 14  | `contributeResolvedModelCompat`   | 別の compatible transport 背後にある vendor models の compat flags を提供する                                | provider が provider を乗っ取らずに proxy transports 上の自社モデルを認識する                                                              |
| 15  | `capabilities`                    | shared core logic が使う provider-owned の transcript/tooling metadata                                         | provider が transcript/provider-family quirks を必要とする                                                                                  |
| 16  | `normalizeToolSchemas`            | embedded runner が見る前に tool schemas を正規化する                                                          | provider が transport-family の schema cleanup を必要とする                                                                                 |
| 17  | `inspectToolSchemas`              | 正規化後に provider-owned の schema diagnostics を表面化する                                                  | provider が core に provider 固有ルールを教えずに keyword warnings を出したい                                                              |
| 18  | `resolveReasoningOutputMode`      | native と tagged の reasoning-output contract を選択する                                                      | provider が native fields ではなく tagged reasoning/final output を必要とする                                                              |
| 19  | `prepareExtraParams`              | generic stream option wrappers 前の request-param 正規化                                                      | provider が default request params または per-provider param cleanup を必要とする                                                           |
| 20  | `createStreamFn`                  | 通常の stream path を完全に置き換えて custom transport を使う                                                 | provider がラッパーではなく custom wire protocol を必要とする                                                                               |
| 21  | `wrapStreamFn`                    | generic wrappers 適用後の stream wrapper                                                                      | provider が custom transport なしで request headers/body/model compat wrappers を必要とする                                                 |
| 22  | `resolveTransportTurnState`       | native な per-turn transport headers または metadata を付加する                                               | provider が generic transports に provider-native turn identity を送らせたい                                                                |
| 23  | `resolveWebSocketSessionPolicy`   | native WebSocket headers または session cool-down policy を付加する                                           | provider が generic WS transports に session headers や fallback policy の調整をさせたい                                                    |
| 24  | `formatApiKey`                    | auth-profile formatter: 保存済み profile を runtime `apiKey` string にする                                    | provider が追加 auth metadata を保存し、custom runtime token shape を必要とする                                                            |
| 25  | `refreshOAuth`                    | custom refresh endpoints または refresh-failure policy のための OAuth refresh override                        | provider が共有 `pi-ai` refreshers に適合しない                                                                                             |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 失敗時に付加される repair hint                                                                  | provider が refresh failure 後の provider-owned auth repair guidance を必要とする                                                          |
| 27  | `matchesContextOverflowError`     | provider-owned の context-window overflow matcher                                                              | generic heuristics が見逃す raw overflow errors を provider が持つ                                                                          |
| 28  | `classifyFailoverReason`          | provider-owned の failover reason classification                                                               | provider が raw API/transport errors を rate-limit/overload などにマッピングできる                                                         |
| 29  | `isCacheTtlEligible`              | proxy/backhaul providers 向け prompt-cache policy                                                             | provider が proxy 固有の cache TTL gating を必要とする                                                                                      |
| 30  | `buildMissingAuthMessage`         | generic missing-auth recovery message の置き換え                                                               | provider が provider-specific missing-auth recovery hint を必要とする                                                                       |
| 31  | `suppressBuiltInModel`            | 古い upstream model の抑制と、任意の user-facing error hint                                                   | provider が古い upstream rows を隠す、または vendor hint に置き換えたい                                                                    |
| 32  | `augmentModelCatalog`             | discovery 後に synthetic/final catalog rows を追加する                                                        | provider が `models list` や pickers に synthetic forward-compat rows を必要とする                                                         |
| 33  | `isBinaryThinking`                | binary-thinking providers 向けのオン/オフ reasoning toggle                                                    | provider が binary thinking の on/off のみを公開する                                                                                        |
| 34  | `supportsXHighThinking`           | 選択されたモデルに対する `xhigh` reasoning サポート                                                           | provider が一部の models にのみ `xhigh` を提供したい                                                                                       |
| 35  | `resolveDefaultThinkingLevel`     | 特定 model family 向けのデフォルト `/think` レベル                                                            | provider が model family 向け default `/think` policy を所有する                                                                            |
| 36  | `isModernModelRef`                | live profile filters と smoke selection のための modern-model matcher                                          | provider が live/smoke preferred-model matching を所有する                                                                                  |
| 37  | `prepareRuntimeAuth`              | 推論直前に設定済み credential を実際の runtime token/key に交換する                                           | provider が token exchange または短命な request credential を必要とする                                                                     |
| 38  | `resolveUsageAuth`                | `/usage` と関連 status surfaces のための usage/billing credentials を解決する                                 | provider が custom usage/quota token parsing または別の usage credential を必要とする                                                      |
| 39  | `fetchUsageSnapshot`              | auth 解決後に provider 固有の usage/quota snapshots を取得して正規化する                                     | provider が provider-specific usage endpoint または payload parser を必要とする                                                             |
| 40  | `createEmbeddingProvider`         | memory/search 用の provider-owned embedding adapter を構築する                                                | memory embedding behavior は provider plugin に属する                                                                                       |
| 41  | `buildReplayPolicy`               | provider の transcript handling を制御する replay policy を返す                                               | provider が custom transcript policy（例: thinking-block stripping）を必要とする                                                           |
| 42  | `sanitizeReplayHistory`           | generic transcript cleanup 後に replay history を書き換える                                                   | provider が shared compaction helpers を超える provider-specific replay rewrites を必要とする                                               |
| 43  | `validateReplayTurns`             | embedded runner の前に replay turns を最終検証または整形する                                                  | provider transport が generic sanitation 後に、より厳密な turn validation を必要とする                                                     |
| 44  | `onModelSelected`                 | provider-owned の post-selection side effects を実行する                                                      | provider が model が有効になったときの telemetry または provider-owned state を必要とする                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致した provider plugin を確認し、その後、実際に model id や transport/config を変更するまで、hook-capable な他の provider plugins にフォールスルーします。これにより、caller がどの bundled plugin が rewrite を所有しているかを知らなくても、alias/compat provider shims が動作し続けます。provider hook がサポートされる Google-family config entry を書き換えない場合でも、bundled Google config normalizer がその互換 cleanup を適用します。

provider が完全に custom な wire protocol や request executor を必要とする場合、それは別種の extension です。これらの hooks は、OpenClaw の通常の inference loop 上で動作する provider behavior のためのものです。

### Provider の例

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

- Anthropic は `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、`resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、`wrapStreamFn` を使います。これは Claude 4.6 の forward-compat、provider-family hints、auth repair guidance、usage endpoint integration、prompt-cache eligibility、auth-aware config defaults、Claude の default/adaptive thinking policy、および beta headers、`/fast` / `serviceTier`、`context1m` に対する Anthropic 固有の stream shaping を所有しているためです。
- Anthropic の Claude-specific stream helpers は、今のところ bundled plugin 自身の public `api.ts` / `contract-api.ts` seam に留まります。その package surface は、generic SDK を 1 つの provider の beta-header rules に合わせて広げる代わりに、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および下位レベルの Anthropic wrapper builders を export します。
- OpenAI は `resolveDynamicModel`、`normalizeResolvedModel`、`capabilities` に加えて `buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`supportsXHighThinking`、`isModernModelRef` を使います。これは GPT-5.4 の forward-compat、直接 OpenAI の `openai-completions` -> `openai-responses` 正規化、Codex-aware auth hints、Spark suppression、synthetic OpenAI list rows、GPT-5 thinking / live-model policy を所有しているためです。`openai-responses-defaults` stream family は、attribution headers、`/fast`/`serviceTier`、text verbosity、native Codex web search、reasoning-compat payload shaping、Responses context management 向けの shared native OpenAI Responses wrappers を所有します。
- OpenRouter は `catalog` に加えて `resolveDynamicModel` と `prepareDynamicModel` を使います。これは provider が pass-through であり、OpenClaw の静的 catalog 更新前に新しい model ids を公開する可能性があるためです。また、provider-specific request headers、routing metadata、reasoning patches、prompt-cache policy を core から切り離すために `capabilities`、`wrapStreamFn`、`isCacheTtlEligible` も使います。その replay policy は `passthrough-gemini` family から来ており、`openrouter-thinking` stream family は proxy reasoning injection と unsupported-model / `auto` skips を所有します。
- GitHub Copilot は `catalog`、`auth`、`resolveDynamicModel`、`capabilities` に加えて `prepareRuntimeAuth` と `fetchUsageSnapshot` を使います。これは provider-owned device login、model fallback behavior、Claude transcript quirks、GitHub token -> Copilot token exchange、provider-owned usage endpoint を必要とするためです。
- OpenAI Codex は `catalog`、`resolveDynamicModel`、`normalizeResolvedModel`、`refreshOAuth`、`augmentModelCatalog` に加えて `prepareExtraParams`、`resolveUsageAuth`、`fetchUsageSnapshot` を使います。これは依然として core OpenAI transports 上で動作する一方で、transport/base URL の正規化、OAuth refresh fallback policy、default transport choice、synthetic Codex catalog rows、ChatGPT usage endpoint integration を所有しているためです。直接 OpenAI と同じ `openai-responses-defaults` stream family を共有します。
- Google AI Studio と Gemini CLI OAuth は `resolveDynamicModel`、`buildReplayPolicy`、`sanitizeReplayHistory`、`resolveReasoningOutputMode`、`wrapStreamFn`、`isModernModelRef` を使います。これは `google-gemini` replay family が Gemini 3.1 の forward-compat fallback、native Gemini replay validation、bootstrap replay sanitation、tagged reasoning-output mode、modern-model matching を所有し、`google-thinking` stream family が Gemini thinking payload normalization を所有するためです。Gemini CLI OAuth は、token formatting、token parsing、quota endpoint wiring のために `formatApiKey`、`resolveUsageAuth`、`fetchUsageSnapshot` も使います。
- Anthropic Vertex は `anthropic-by-model` replay family を通じて `buildReplayPolicy` を使い、Claude-specific replay cleanup をすべての `anthropic-messages` transport ではなく Claude ids に限定します。
- Amazon Bedrock は `buildReplayPolicy`、`matchesContextOverflowError`、`classifyFailoverReason`、`resolveDefaultThinkingLevel` を使います。これは Anthropic-on-Bedrock traffic に対する Bedrock-specific な throttle/not-ready/context-overflow error classification を所有しているためです。その replay policy は同じ Claude 専用の `anthropic-by-model` guard を共有します。
- OpenRouter、Kilocode、Opencode、Opencode Go は、`passthrough-gemini` replay family を通じて `buildReplayPolicy` を使います。これは Gemini models を OpenAI-compatible transports 経由でプロキシし、native Gemini replay validation や bootstrap rewrites なしで Gemini thought-signature sanitation を必要とするためです。
- MiniMax は `hybrid-anthropic-openai` replay family を通じて `buildReplayPolicy` を使います。これは 1 つの provider が Anthropic-message と OpenAI-compatible semantics の両方を所有するためです。Anthropic 側では Claude 専用の thinking-block dropping を維持しつつ、reasoning output mode を native に戻します。`minimax-fast-mode` stream family は shared stream path 上の fast-mode model rewrites を所有します。
- Moonshot は `catalog` に加えて `wrapStreamFn` を使います。shared OpenAI transport を使い続けながら、provider-owned の thinking payload normalization を必要とするためです。`moonshot-thinking` stream family は config と `/think` state をその native binary thinking payload にマッピングします。
- Kilocode は `catalog`、`capabilities`、`wrapStreamFn`、`isCacheTtlEligible` を使います。provider-owned request headers、reasoning payload normalization、Gemini transcript hints、Anthropic cache-TTL gating を必要とするためです。`kilocode-thinking` stream family は shared proxy stream path 上で Kilo thinking injection を維持しつつ、`kilo/auto` やその他の reasoning payload を明示サポートしない proxy model ids をスキップします。
- Z.AI は `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、`isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、`resolveUsageAuth`、`fetchUsageSnapshot` を使います。GLM-5 fallback、`tool_stream` defaults、binary thinking UX、modern-model matching、usage auth + quota fetching の両方を所有しているためです。`tool-stream-default-on` stream family は、default-on の `tool_stream` wrapper を provider ごとの手書き glue から切り離します。
- xAI は `normalizeResolvedModel`、`normalizeTransport`、`contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、`resolveSyntheticAuth`、`resolveDynamicModel`、`isModernModelRef` を使います。native xAI Responses transport normalization、Grok fast-mode alias rewrites、default `tool_stream`、strict-tool / reasoning-payload cleanup、plugin-owned tools 用 fallback auth reuse、forward-compat Grok model resolution、xAI tool-schema profile、unsupported schema keywords、native `web_search`、HTML-entity tool-call argument decoding などの provider-owned compat patches を所有しているためです。
- Mistral、OpenCode Zen、OpenCode Go は、transcript/tooling quirks を core から切り離すために `capabilities` のみを使います。
- `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` のような catalog-only bundled providers は `catalog` のみを使います。
- Qwen は text provider 向けに `catalog` を使い、その multimodal surfaces 向けに shared media-understanding と video-generation registrations を行います。
- MiniMax と Xiaomi は `catalog` に加えて usage hooks を使います。推論自体は shared transports を通りますが、`/usage` behavior は plugin-owned だからです。

## ランタイムヘルパー

プラグインは `api.runtime` を通じて、一部の core helpers にアクセスできます。TTS の例:

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

注意:

- `textToSpeech` は file/voice-note surfaces 向けの通常の core TTS output payload を返します。
- core の `messages.tts` configuration と provider selection を使います。
- PCM audio buffer + sample rate を返します。plugins 側で provider に合わせて resample/encode する必要があります。
- `listVoices` は provider ごとに任意です。vendor-owned voice pickers や setup flows に使ってください。
- voice listings には locale、gender、personality tags のような、provider-aware pickers 向けのより豊富な metadata を含めることができます。
- telephony を現在サポートしているのは OpenAI と ElevenLabs です。Microsoft はサポートしていません。

プラグインは `api.registerSpeechProvider(...)` を通じて speech providers を登録することもできます。

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

注意:

- TTS policy、fallback、reply delivery は core に維持してください。
- vendor-owned synthesis behavior には speech providers を使ってください。
- legacy Microsoft `edge` input は `microsoft` provider id に正規化されます。
- 推奨される所有権モデルは企業指向です。OpenClaw がこれらの capability contracts を追加していく中で、1 つの vendor plugin が text、speech、image、将来の media providers を所有できます。

image/audio/video understanding については、plugins は generic key/value bag ではなく、1 つの typed media-understanding provider を登録します。

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注意:

- orchestration、fallback、config、channel wiring は core に維持してください。
- vendor behavior は provider plugin に維持してください。
- 追加的な拡張は型付きのままにしてください。新しい optional methods、新しい optional result fields、新しい optional capabilities。
- video generation もすでに同じパターンに従っています:
  - core が capability contract と runtime helper を所有する
  - vendor plugins が `api.registerVideoGenerationProvider(...)` を登録する
  - feature/channel plugins が `api.runtime.videoGeneration.*` を利用する

media-understanding runtime helpers について、plugins は次のように呼び出せます。

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

音声文字起こしについては、plugins は media-understanding runtime または古い STT alias のどちらかを使えます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME を確実に推定できない場合は任意:
  mime: "audio/ogg",
});
```

注意:

- `api.runtime.mediaUnderstanding.*` は image/audio/video understanding のための推奨共有 surface です。
- core の media-understanding audio configuration（`tools.media.audio`）と provider fallback order を使います。
- 文字起こし結果が生成されない場合（例: スキップされた入力、未対応入力）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換性 alias として残っています。

プラグインは `api.runtime.subagent` を通じてバックグラウンド subagent runs を起動することもできます。

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注意:

- `provider` と `model` は、永続的な session changes ではなく、run ごとの optional overrides です。
- OpenClaw は、信頼された callers に対してのみこれらの override fields を尊重します。
- plugin-owned fallback runs では、operators は `plugins.entries.<id>.subagent.allowModelOverride: true` で明示的に opt in する必要があります。
- 信頼された plugins を特定の canonical `provider/model` targets に制限するには `plugins.entries.<id>.subagent.allowedModels` を使い、明示的に任意の target を許可するには `"*"` を使います。
- 信頼されていない plugin subagent runs も動作はしますが、override requests は黙って fallback されるのではなく拒否されます。

web search について、plugins は agent tool wiring に直接入り込むのではなく、共有 runtime helper を利用できます。

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

プラグインは `api.registerWebSearchProvider(...)` を通じて web-search providers を登録することもできます。

注意:

- provider selection、credential resolution、shared request semantics は core に維持してください。
- vendor-specific search transports には web-search providers を使ってください。
- `api.runtime.webSearch.*` は、agent tool wrapper に依存せず検索機能を必要とする feature/channel plugins 向けの推奨共有 surface です。

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
- `listProviders(...)`: 利用可能な image-generation providers とその capabilities を一覧表示します。

## Gateway HTTP ルート

プラグインは `api.registerHttpRoute(...)` で HTTP endpoints を公開できます。

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

- `path`: gateway HTTP server 配下の route path
- `auth`: 必須。通常の gateway auth を要求するには `"gateway"`、plugin 側で auth/webhook verification を管理するには `"plugin"` を使います。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じ plugin が自分自身の既存 route registration を置き換えることを許可します。
- `handler`: route が request を処理したときに `true` を返します。

注意:

- `api.registerHttpHandler(...)` は削除されており、使うと plugin-load error になります。代わりに `api.registerHttpRoute(...)` を使ってください。
- Plugin routes は `auth` を明示的に宣言する必要があります。
- 完全に同一の `path + match` の衝突は、`replaceExisting: true` がない限り拒否されます。また、1 つの plugin が別の plugin の route を置き換えることはできません。
- `auth` レベルが異なる重複 routes は拒否されます。`exact`/`prefix` の fallthrough chains は同じ auth level のみで維持してください。
- `auth: "plugin"` routes は、operator runtime scopes を自動的には受け取りません。これらは plugin-managed な webhooks/signature verification 用であり、特権的な Gateway helper calls 用ではありません。
- `auth: "gateway"` routes は Gateway request runtime scope 内で動作しますが、その scope は意図的に保守的です:
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、caller が `x-openclaw-scopes` を送っても、plugin-route runtime scopes は `operator.write` に固定されます
  - 信頼された identity-bearing HTTP modes（例: `trusted-proxy` や private ingress 上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes` ヘッダーが明示的に存在するときにのみこれを尊重します
  - そのような identity-bearing plugin-route requests で `x-openclaw-scopes` がない場合、runtime scope は `operator.write` にフォールバックします
- 実務上のルール: gateway-auth の plugin route を暗黙の admin surface だと思わないでください。route が admin-only behavior を必要とする場合は、identity-bearing auth mode を要求し、明示的な `x-openclaw-scopes` header contract を文書化してください。

## Plugin SDK import paths

プラグインを作成する際は、巨大な `openclaw/plugin-sdk` import ではなく、SDK subpaths を使ってください。

- plugin registration primitives には `openclaw/plugin-sdk/plugin-entry`
- generic shared plugin-facing contract には `openclaw/plugin-sdk/core`
- ルート `openclaw.json` Zod schema export（`OpenClawSchema`）には `openclaw/plugin-sdk/config-schema`
- 共有 setup/auth/reply/webhook wiring には、`openclaw/plugin-sdk/channel-setup`、
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input`、`openclaw/plugin-sdk/webhook-ingress` のような stable channel primitives を使います。`channel-inbound` は debounce、mention matching、inbound mention-policy helpers、envelope formatting、inbound envelope context helpers の共有ホームです。
  `channel-setup` は、狭い optional-install setup seam です。
  `setup-runtime` は、`setupEntry` / deferred startup が使う runtime-safe な setup surface で、import-safe な setup patch adapters を含みます。
  `setup-adapter-runtime` は env-aware な account-setup adapter seam です。
  `setup-tools` は、小さな CLI/archive/docs helper seam（`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`）です。
- 共有 runtime/config helpers には、`openclaw/plugin-sdk/channel-config-helpers`、
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store`、`openclaw/plugin-sdk/directory-runtime` のような domain subpaths を使います。
  `telegram-command-config` は Telegram custom command の normalization/validation のための狭い public seam であり、bundled Telegram contract surface が一時的に利用できなくても提供され続けます。
  `text-runtime` は shared text/markdown/logging seam で、assistant-visible-text stripping、markdown render/chunking helpers、redaction helpers、directive-tag helpers、safe-text utilities を含みます。
- approval 固有の channel seams では、plugin 上の 1 つの `approvalCapability` contract を優先してください。そうすると core は、approval auth、delivery、render、native-routing、lazy native-handler behavior を、無関係な plugin fields に混ぜることなく、その 1 つの capability を通じて読み取れます。
- `openclaw/plugin-sdk/channel-runtime` は非推奨で、古い plugins 向け互換 shim としてのみ残っています。新しいコードではより狭い generic primitives を import し、repo code でも shim の新規 import を追加しないでください。
- Bundled extension internals は private のままです。外部 plugins は `openclaw/plugin-sdk/*` subpaths だけを使ってください。OpenClaw core/test code は、plugin package root 配下の repo public entry points、たとえば `index.js`、`api.js`、`runtime-api.js`、`setup-entry.js`、および `login-qr-api.js` のような狭く限定された files を使えます。core からも他 extension からも、plugin package の `src/*` を import してはいけません。
- Repo entry point の分割:
  `<plugin-package-root>/api.js` は helper/types barrel、
  `<plugin-package-root>/runtime-api.js` は runtime-only barrel、
  `<plugin-package-root>/index.js` は bundled plugin entry、
  `<plugin-package-root>/setup-entry.js` は setup plugin entry です。
- 現在の bundled provider の例:
  - Anthropic は `api.js` / `contract-api.js` を使って、`wrapAnthropicProviderStream`、beta-header helpers、`service_tier` parsing のような Claude stream helpers を公開しています。
  - OpenAI は provider builders、default-model helpers、realtime provider builders のために `api.js` を使います。
  - OpenRouter は provider builder と onboarding/config helpers のために `api.js` を使い、一方で `register.runtime.js` は repo-local use 向けに generic `plugin-sdk/provider-stream` helpers を再 export できます。
- Facade-loaded public entry points は、利用可能なら active runtime config snapshot を優先し、OpenClaw がまだ runtime snapshot を提供していない場合はディスク上の resolved config file にフォールバックします。
- generic shared primitives は、引き続き推奨される public SDK contract です。bundled channel-branded helper seams の小さな予約済み互換セットはまだ存在します。これらは bundled-maintenance/compatibility seams として扱い、新しい third-party import targets にはしないでください。新しい cross-channel contracts は、引き続き generic `plugin-sdk/*` subpaths または plugin-local の `api.js` / `runtime-api.js` barrels に置くべきです。

互換性に関する注意:

- 新しいコードでは root の `openclaw/plugin-sdk` barrel を避けてください。
- まず狭く安定した primitives を優先してください。新しい setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool subpaths は、新しい bundled および外部 plugin 作業における意図された contract です。
  target の parsing/matching は `openclaw/plugin-sdk/channel-targets` に置くべきです。
  message action gates と reaction message-id helpers は
  `openclaw/plugin-sdk/channel-actions` に置くべきです。
- Bundled extension 固有の helper barrels は、デフォルトでは安定していません。ある helper が bundled extension にしか必要ないなら、それを `openclaw/plugin-sdk/<extension>` に昇格させるのではなく、その extension のローカルな `api.js` または `runtime-api.js` seam の背後に置いてください。
- 新しい共有 helper seams は generic であるべきで、channel-branded であるべきではありません。共有 target parsing は `openclaw/plugin-sdk/channel-targets` に置き、channel-specific internals は所有する plugin のローカルな `api.js` または `runtime-api.js` seam の背後に維持してください。
- `image-generation`、`media-understanding`、`speech` のような capability-specific subpaths は、bundled/native plugins が今日これらを使っているため存在します。これらが存在すること自体は、export されるすべての helper が長期的に凍結された外部 contract であることを意味しません。

## Message tool schemas

プラグインは channel-specific な `describeMessageTool(...)` schema contributions を所有すべきです。provider-specific fields は shared core ではなく plugin に保持してください。

共有で持ち運び可能な schema fragments には、`openclaw/plugin-sdk/channel-actions` から export される generic helpers を再利用してください。

- button-grid 形式の payload には `createMessageToolButtonsSchema()`
- 構造化された card payload には `createMessageToolCardSchema()`

ある schema shape が 1 つの provider にしか意味を持たないなら、それを shared SDK に昇格させるのではなく、その plugin 自身のソースに定義してください。

## Channel target 解決

チャネルプラグインは channel-specific な target semantics を所有すべきです。共有 outbound host は generic に保ち、provider rules には messaging adapter surface を使ってください。

- `messaging.inferTargetChatType({ to })` は、正規化された target を directory lookup 前に `direct`、`group`、`channel` のどれとして扱うかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力が directory search を飛ばして id-like resolution に直行すべきかどうかを core に伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、core が normalization 後または directory miss 後に最終的な provider-owned resolution を必要とするときの plugin fallback です。
- `messaging.resolveOutboundSessionRoute(...)` は、target 解決後の provider-specific session route construction を所有します。

推奨される分割:

- peers/groups の検索前に行うべきカテゴリ判断には `inferTargetChatType` を使う
- 「これを明示的/ネイティブな target id として扱う」チェックには `looksLikeId` を使う
- `resolveTarget` は provider-specific な normalization fallback に使い、広範な directory search には使わない
- chat ids、thread ids、JIDs、handles、room ids のような provider-native ids は、generic SDK fields ではなく `target` values または provider-specific params に保持する

## Config-backed directories

config から directory entries を導出する plugins は、そのロジックを plugin 内に置き、`openclaw/plugin-sdk/directory-runtime` の shared helpers を再利用してください。

これは、チャネルが次のような config-backed peers/groups を必要とする場合に使います。

- allowlist-driven DM peers
- 設定された channel/group maps
- account-scoped static directory fallbacks

`directory-runtime` の shared helpers が扱うのは汎用操作のみです。

- query filtering
- limit application
- deduping/normalization helpers
- `ChannelDirectoryEntry[]` の構築

channel-specific な account inspection と id normalization は plugin 実装側に残してください。

## Provider catalogs

provider plugins は、`registerProvider({ catalog: { run(...) { ... } } })` により、推論用の model catalogs を定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むのと同じ形を返します。

- 1 つの provider entry には `{ provider }`
- 複数の provider entries には `{ providers }`

provider-specific な model ids、base URL defaults、auth-gated model metadata を plugin が所有する場合は `catalog` を使ってください。

`catalog.order` は、plugin の catalog が OpenClaw の組み込み implicit providers と比べてどの順序でマージされるかを制御します。

- `simple`: 単純な API-key または env-driven providers
- `profile`: auth profiles が存在すると出現する providers
- `paired`: 関連する複数の provider entries を合成する providers
- `late`: 他の implicit providers の後、最後のパス

後から来る providers が key collision で勝つため、plugins は同じ provider id を持つ built-in provider entry を意図的に上書きできます。

互換性:

- `discovery` は legacy alias として引き続き動作します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使います

## 読み取り専用の channel inspection

プラグインがチャネルを登録する場合、`resolveAccount(...)` と並んで `plugin.config.inspectAccount(cfg, accountId)` を実装することを推奨します。

理由:

- `resolveAccount(...)` は runtime path です。credentials が完全に materialize されている前提でよく、必要な secrets がなければ即失敗しても構いません。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、doctor/config repair flows のような読み取り専用コマンドは、設定を説明するだけのために runtime credentials を materialize する必要があるべきではありません。

推奨される `inspectAccount(...)` の振る舞い:

- 説明的な account state のみを返す
- `enabled` と `configured` を維持する
- 関連する場合は credential source/status fields を含める。例:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の利用可否を報告するだけなら、生の token values を返す必要はありません。`tokenStatus: "available"`（および対応する source field）を返せば、status-style commands には十分です。
- credential が SecretRef 経由で設定されているが現在の command path では利用できない場合は `configured_unavailable` を使う

これにより、読み取り専用コマンドは、クラッシュしたり未設定と誤報したりせず、「設定済みだがこの command path では利用不可」と報告できます。

## Package packs

プラグインディレクトリには、`openclaw.extensions` を含む `package.json` を置けます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各 entry は 1 つの plugin になります。pack に複数の extensions が listed されている場合、plugin id は `name/<fileBase>` になります。

plugin が npm deps を import する場合は、そのディレクトリ内にインストールして `node_modules` が利用できるようにしてください（`npm install` / `pnpm install`）。

セキュリティ上のガードレール: `openclaw.extensions` の各 entry は、symlink 解決後も plugin directory 内に留まらなければなりません。package directory の外に出る entries は拒否されます。

セキュリティに関する注意: `openclaw plugins install` は、plugin dependencies を `npm install --omit=dev --ignore-scripts` でインストールします（runtime では lifecycle scripts も dev dependencies もなし）。plugin dependency trees は「pure JS/TS」のままにし、`postinstall` builds を必要とする packages は避けてください。

任意: `openclaw.setupEntry` は軽量な setup-only module を指せます。OpenClaw が無効な channel plugin の setup surfaces を必要とするとき、または channel plugin が有効でもまだ未設定のとき、完全な plugin entry ではなく `setupEntry` を読み込みます。これにより、main plugin entry が tools、hooks、その他の runtime-only code を配線している場合でも、起動と setup を軽量に保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` は、gateway の pre-listen startup phase 中、チャネルがすでに設定済みでも、その channel plugin を同じ `setupEntry` path に opt in させることができます。

これは、`setupEntry` が gateway が listen を開始する前に存在しなければならない startup surface を完全にカバーしている場合にのみ使ってください。実際には、setup entry は起動時に依存するすべての channel-owned capability を登録しなければなりません。たとえば:

- チャネル登録そのもの
- gateway が listen を開始する前に利用可能でなければならない HTTP routes
- 同じタイミングで存在しなければならない gateway methods、tools、services

full entry が必要な startup capability をまだ所有しているなら、このフラグは有効にしないでください。デフォルトの動作のままにし、起動中に OpenClaw が full entry を読み込むようにしてください。

Bundled channels は、full channel runtime が読み込まれる前に core が参照できる setup-only contract-surface helpers を公開することもできます。現在の setup promotion surface は次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core は、full plugin entry を読み込まずに、legacy single-account channel config を `channels.<id>.accounts.*` に昇格させる必要があるときにこの surface を使います。Matrix が現在の bundled 例です。named accounts がすでに存在する場合は auth/bootstrap keys だけを named promoted account に移し、常に `accounts.default` を作るのではなく、設定済みの非 canonical default-account key を保持できます。

これらの setup patch adapters により、bundled contract-surface discovery は遅延されたままになります。import 時間は軽量に保たれ、promotion surface は module import 時に bundled channel startup を再突入することなく、最初の使用時にのみ読み込まれます。

これらの startup surfaces に gateway RPC methods が含まれる場合は、plugin-specific prefix に保ってください。Core の admin namespaces（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みであり、plugin がより狭い scope を要求しても、常に `operator.admin` に解決されます。

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

チャネルプラグインは、`openclaw.channel` を通じて setup/discovery metadata を、`openclaw.install` を通じて install hints を広告できます。これにより、core catalog をデータフリーに保てます。

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

最小例以外で有用な `openclaw.channel` fields:

- `detailLabel`: より豊かな catalog/status surfaces 向けの二次ラベル
- `docsLabel`: docs リンクのリンクテキストを上書きする
- `preferOver`: この catalog entry が優先すべき、より低優先の plugin/channel ids
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection-surface copy controls
- `markdownCapable`: outbound formatting decisions のため、この channel が markdown 対応であることを示す
- `exposure.configured`: `false` にすると configured-channel listing surfaces からその channel を隠す
- `exposure.setup`: `false` にすると interactive setup/configure pickers からその channel を隠す
- `exposure.docs`: docs navigation surfaces でその channel を internal/private として扱う
- `showConfigured` / `showInSetup`: legacy aliases も互換のため受け付けられるが、`exposure` を推奨
- `quickstartAllowFrom`: その channel を標準 quickstart `allowFrom` flow に opt in させる
- `forceAccountBinding`: account が 1 つしかなくても明示的な account binding を要求する
- `preferSessionLookupForAnnounceTarget`: announce target 解決時に session lookup を優先する

OpenClaw は **external channel catalogs**（例: MPM registry export）をマージすることもできます。JSON file を次のいずれかに置いてください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）を 1 つ以上の JSON files に向けてください（comma/semicolon/`PATH` 区切り）。各 file は `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含むべきです。parser は `"entries"` キーの legacy aliases として `"packages"` または `"plugins"` も受け付けます。

## Context engine プラグイン

Context engine plugins は、ingest、assemble、compaction のための session context orchestration を所有します。plugin から `api.registerContextEngine(id, factory)` で登録し、アクティブエンジンは `plugins.slots.contextEngine` で選択します。

これは、plugin が memory search や hooks を追加するだけでなく、デフォルトの context pipeline を置き換えたり拡張したりする必要がある場合に使います。

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

エンジンが compaction algorithm を所有しない場合でも、`compact()` は実装し、明示的に委譲してください。

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

## 新しい capability を追加する

プラグインが現在の API に収まらない振る舞いを必要とする場合、private reach-in でプラグインシステムを迂回しないでください。不足している capability を追加してください。

推奨される順序:

1. core contract を定義する
   core が所有すべき共有 behavior を決めます。policy、fallback、config merge、lifecycle、channel-facing semantics、runtime helper shape です。
2. 型付き plugin registration/runtime surfaces を追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限で有用な typed capability surface で拡張します。
3. core + channel/feature consumers を配線する
   channels と feature plugins は、vendor implementation を直接 import するのではなく、core を通じて新 capability を利用すべきです。
4. vendor implementations を登録する
   その後、vendor plugins がその capability に対して backends を登録します。
5. contract coverage を追加する
   ownership と registration shape が時間とともに明示的であり続けるよう、tests を追加します。

これが、OpenClaw が 1 つの provider の worldview にハードコードされることなく、意見を持ち続ける方法です。具体的な file checklist と worked example については [Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

### Capability チェックリスト

新しい capability を追加する場合、実装は通常、次の surfaces をまとめて触る必要があります。

- `src/<capability>/types.ts` の core contract types
- `src/<capability>/runtime.ts` の core runner/runtime helper
- `src/plugins/types.ts` の plugin API registration surface
- `src/plugins/registry.ts` の plugin registry wiring
- feature/channel plugins が利用する必要がある場合は `src/plugins/runtime/*` の plugin runtime exposure
- `src/test-utils/plugin-registration.ts` の capture/test helpers
- `src/plugins/contracts/registry.ts` の ownership/contract assertions
- `docs/` の operator/plugin docs

これらの surfaces のどれかが欠けている場合、通常はその capability がまだ完全に統合されていない兆候です。

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

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

contract test パターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールは単純に保たれます。

- core が capability contract + orchestration を所有する
- vendor plugins が vendor implementations を所有する
- feature/channel plugins が runtime helpers を利用する
- contract tests が所有権を明示的に保つ
