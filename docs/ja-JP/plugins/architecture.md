---
read_when:
    - ネイティブOpenClawプラグインをビルドまたはデバッグしている
    - プラグインのケイパビリティモデルまたは所有権の境界を理解している
    - プラグインの読み込みパイプラインまたはレジストリに取り組んでいる
    - プロバイダーのランタイムフックまたはチャネルプラグインを実装している
sidebarTitle: Internals
summary: 'プラグイン内部: ケイパビリティモデル、所有権、コントラクト、読み込みパイプライン、ランタイムヘルパー'
title: プラグイン内部
x-i18n:
    generated_at: "2026-04-05T13:00:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# プラグイン内部

<Info>
  これは**詳細アーキテクチャリファレンス**です。実用的なガイドについては、以下を参照してください。
  - [プラグインをインストールして使う](/tools/plugin) — ユーザーガイド
  - [はじめに](/ja-JP/plugins/building-plugins) — 最初のプラグインチュートリアル
  - [チャネルプラグイン](/ja-JP/plugins/sdk-channel-plugins) — メッセージングチャネルを構築する
  - [プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins) — モデルプロバイダーを構築する
  - [SDK概要](/ja-JP/plugins/sdk-overview) — インポートマップと登録API
</Info>

このページでは、OpenClawプラグインシステムの内部アーキテクチャを扱います。

## 公開ケイパビリティモデル

ケイパビリティは、OpenClaw内の公開された**ネイティブプラグイン**モデルです。すべての
ネイティブOpenClawプラグインは、1つ以上のケイパビリティ種別に対して登録します。

| ケイパビリティ         | 登録メソッド                                     | プラグイン例                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| テキスト推論           | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI推論バックエンド    | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Webフェッチ            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web検索                | `api.registerWebSearchProvider(...)`             | `google`                             |
| チャネル / メッセージング | `api.registerChannel(...)`                    | `msteams`, `matrix`                  |

ケイパビリティを1つも登録せず、フック、ツール、または
サービスを提供するプラグインは、**レガシーhook-only**プラグインです。このパターンも引き続き完全にサポートされています。

### 外部互換性に関する方針

ケイパビリティモデルはすでにコアに導入されており、現在はバンドル済み / ネイティブプラグインで
使われていますが、外部プラグインの互換性については
「exportされている、したがって固定されている」より厳密な基準が依然として必要です。

現在のガイダンス:

- **既存の外部プラグイン:** フックベースの統合を動作させ続けること。
  これを互換性のベースラインとして扱います
- **新しいバンドル済み / ネイティブプラグイン:** ベンダー固有の直接参照や
  新しいhook-only設計よりも、明示的なケイパビリティ登録を優先します
- **ケイパビリティ登録を採用する外部プラグイン:** 許可されますが、
  ドキュメントでコントラクトが安定していると明示されない限り、
  ケイパビリティ固有のヘルパーサーフェスは進化中のものとして扱ってください

実践的なルール:

- ケイパビリティ登録APIは意図された方向性です
- レガシーフックは、移行期間中の外部プラグインにとって
  破壊的変更を避ける最も安全な経路のままです
- exportされたヘルパーsubpathはすべて同等ではありません。
  偶発的なヘルパーexportではなく、狭く文書化された
  コントラクトを優先してください

### プラグインの形状

OpenClawは、読み込まれた各プラグインを、実際の
登録挙動に基づいて形状に分類します（静的メタデータだけではありません）。

- **plain-capability** -- ちょうど1つのケイパビリティ種別だけを登録します（たとえば
  `mistral`のようなプロバイダー専用プラグイン）
- **hybrid-capability** -- 複数のケイパビリティ種別を登録します（たとえば
  `openai`はテキスト推論、音声、メディア理解、画像
  生成を所有します）
- **hook-only** -- フックのみを登録し（型付きまたはカスタム）、
  ケイパビリティ、ツール、コマンド、サービスは登録しません
- **non-capability** -- ツール、コマンド、サービス、またはルートを登録しますが、
  ケイパビリティは登録しません

プラグインの形状とケイパビリティの
内訳を確認するには、`openclaw plugins inspect <id>`を使用してください。詳細は[CLIリファレンス](/cli/plugins#inspect)を参照してください。

### レガシーフック

`before_agent_start`フックは、hook-onlyプラグイン向けの
互換性経路として引き続きサポートされています。現実のレガシープラグインは依然としてこれに依存しています。

方向性:

- 動作させ続ける
- レガシーとして文書化する
- モデル / プロバイダーのオーバーライド作業には`before_model_resolve`を優先する
- プロンプト変更作業には`before_prompt_build`を優先する
- 実際の利用が減り、フィクスチャカバレッジが移行の安全性を証明した後にのみ削除する

### 互換性シグナル

`openclaw doctor`または`openclaw plugins inspect <id>`を実行すると、
次のいずれかのラベルが表示されることがあります。

| シグナル                   | 意味                                                          |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 設定は正常に解析され、プラグインも解決される                 |
| **compatibility advisory** | プラグインがサポートされているが古いパターンを使っている（例: `hook-only`） |
| **legacy warning**         | プラグインが非推奨の`before_agent_start`を使っている         |
| **hard error**             | 設定が無効、またはプラグインの読み込みに失敗した             |

`hook-only`も`before_agent_start`も、現時点ではプラグインを壊しません --
`hook-only`は助言的なものに過ぎず、`before_agent_start`も警告を出すだけです。これらの
シグナルは`openclaw status --all`および`openclaw plugins doctor`にも表示されます。

## アーキテクチャ概要

OpenClawのプラグインシステムは4つのレイヤーを持ちます。

1. **マニフェスト + 検出**
   OpenClawは、設定されたパス、ワークスペースルート、
   グローバル拡張ルート、およびバンドル済み拡張から候補プラグインを見つけます。
   検出では、まずネイティブ`openclaw.plugin.json`マニフェストと、サポートされたバンドルマニフェストを読み込みます。
2. **有効化 + 検証**
   コアは、検出されたプラグインが有効、無効、ブロック済み、
   またはメモリーのような排他的スロットに選択されたものかを決定します。
3. **ランタイム読み込み**
   ネイティブOpenClawプラグインは、jitiを介してプロセス内で読み込まれ、
   中央レジストリにケイパビリティを登録します。互換性のあるバンドルは、
   ランタイムコードをimportせずにレジストリレコードへ正規化されます。
4. **サーフェス消費**
   OpenClawの他の部分はレジストリを読んで、ツール、チャネル、プロバイダー
   セットアップ、フック、HTTPルート、CLIコマンド、およびサービスを公開します。

特にプラグインCLIについては、ルートコマンドの検出は2段階に分かれます。

- parse時メタデータは`registerCli(..., { descriptors: [...] })`から取得されます
- 実際のプラグインCLIモジュールは遅延のままにでき、最初の呼び出し時に登録できます

これにより、OpenClawが解析前にルートコマンド名を確保しつつ、
プラグイン所有のCLIコードをプラグイン内に保持できます。

重要な設計境界:

- 検出 + config検証は、プラグインコードを実行せずに
  **manifest/schemaメタデータ**から機能するべきです
- ネイティブのランタイム挙動は、プラグインモジュールの`register(api)`経路から来ます

この分離により、OpenClawは、完全なランタイムが有効になる前に、
設定を検証し、不足 / 無効なプラグインを説明し、
UI / schemaヒントを構築できます。

### チャネルプラグインと共有messageツール

チャネルプラグインは、通常のチャット操作のために、
個別の送信 / 編集 / リアクションツールを別途登録する必要はありません。OpenClawはコアに
1つの共有`message`ツールを保持し、その背後にあるチャネル固有の検出と実行は
チャネルプラグインが所有します。

現在の境界は次のとおりです。

- コアは共有`message`ツールホスト、プロンプト配線、セッション / スレッド
  の記録、および実行ディスパッチを所有します
- チャネルプラグインはスコープ付きアクション検出、ケイパビリティ検出、および
  任意のチャネル固有schemaフラグメントを所有します
- チャネルプラグインは、スレッドIDを会話IDがどのようにエンコードするか、
  または親会話から継承するかといった、
  プロバイダー固有のセッション会話文法を所有します
- チャネルプラグインは、そのアクションアダプターを通じて最終アクションを実行します

チャネルプラグイン向けのSDKサーフェスは
`ChannelMessageActionAdapter.describeMessageTool(...)`です。この統合された検出呼び出しにより、
プラグインは表示されるアクション、ケイパビリティ、およびschemaへの寄与をまとめて返せるため、
これらの要素がずれません。

コアは、その検出ステップにランタイムスコープを渡します。重要なフィールドは次のとおりです。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼された受信`requesterSenderId`

これはコンテキスト依存のプラグインにとって重要です。チャネルは、
アクティブなアカウント、現在のルーム / スレッド / メッセージ、または
信頼されたリクエスターIDに基づいて、
messageアクションを隠したり公開したりできます。コアの
`message`ツールにチャネル固有の分岐をハードコードする必要はありません。

これが、埋め込みランナーのルーティング変更が依然としてプラグイン作業である理由です。ランナーは、
共有`message`ツールが
現在のターンに対して正しいチャネル所有サーフェスを公開できるよう、
現在のチャット / セッションIDをプラグイン検出境界へ転送する責任を持ちます。

チャネル所有の実行ヘルパーについては、バンドル済みプラグインは実行
ランタイムを自分自身の拡張モジュール内に保持するべきです。コアはもはや、
`src/agents/tools`配下でDiscord、
Slack、Telegram、WhatsAppのmessage-actionランタイムを所有しません。
個別の`plugin-sdk/*-action-runtime` subpathは公開しておらず、バンドル済み
プラグインは、自身の拡張所有モジュールから
ローカルランタイムコードを直接importするべきです。

同じ境界は、一般にプロバイダー名付きSDKシームにも当てはまります。コアは
Slack、Discord、Signal、
WhatsApp、または類似の拡張向けのチャネル固有コンビニエンスbarrelをimportすべきではありません。
コアがある挙動を必要とする場合は、バンドル済みプラグイン自身の
`api.ts` / `runtime-api.ts` barrelを使うか、
必要性を共有SDK内の狭い汎用ケイパビリティへ昇格させてください。

特にpollについては、2つの実行経路があります。

- `outbound.sendPoll`は、共通の
  pollモデルに適合するチャネル向けの共有ベースラインです
- `actions.handleAction("poll")`は、チャネル固有の
  pollセマンティクスまたは追加のpollパラメーター向けの推奨経路です

コアは、プラグインpollディスパッチがアクションを拒否した後まで
共有poll解析を延期するようになったため、プラグイン所有のpollハンドラーは、
汎用pollパーサーに先にブロックされることなく、チャネル固有のpoll
フィールドを受け取れます。

完全な起動シーケンスについては、[読み込みパイプライン](#load-pipeline)を参照してください。

## ケイパビリティ所有権モデル

OpenClawは、ネイティブプラグインを、無関係な統合の寄せ集めではなく、
**企業**または**機能**の所有権境界として扱います。

これは次を意味します。

- 企業プラグインは、通常、その企業のOpenClaw向け
  サーフェスをすべて所有するべきです
- 機能プラグインは、通常、導入する機能サーフェス全体を所有するべきです
- チャネルは、プロバイダー挙動をアドホックに再実装するのではなく、
  共有コアケイパビリティを消費するべきです

例:

- バンドル済み`openai`プラグインは、OpenAIのモデルプロバイダー挙動と、OpenAIの
  音声 + リアルタイム音声 + メディア理解 + 画像生成の挙動を所有します
- バンドル済み`elevenlabs`プラグインは、ElevenLabsの音声挙動を所有します
- バンドル済み`microsoft`プラグインは、Microsoftの音声挙動を所有します
- バンドル済み`google`プラグインは、Googleのモデルプロバイダー挙動に加えて、Googleの
  メディア理解 + 画像生成 + Web検索の挙動を所有します
- バンドル済み`firecrawl`プラグインは、FirecrawlのWebフェッチ挙動を所有します
- バンドル済み`minimax`、`mistral`、`moonshot`、`zai`プラグインは、
  それぞれのメディア理解バックエンドを所有します
- `voice-call`プラグインは機能プラグインです。通話トランスポート、ツール、
  CLI、ルート、およびTwilioメディアストリームのブリッジを所有しますが、
  ベンダープラグインを直接importするのではなく、
  共有音声 + リアルタイム文字起こし + リアルタイム音声ケイパビリティを消費します

意図された最終状態:

- OpenAIは、テキストモデル、音声、画像、そして
  将来の動画にまたがっても1つのプラグイン内に存在します
- 他のベンダーも、自身のサーフェス領域について同じことができます
- チャネルは、どのベンダープラグインがそのプロバイダーを所有しているかを気にしません。
  コアが公開する共有ケイパビリティコントラクトを消費します

これが重要な区別です。

- **plugin** = 所有権境界
- **capability** = 複数のプラグインが実装または消費できるコアコントラクト

したがって、OpenClawが動画のような新しいドメインを追加する場合、最初の問いは
「どのプロバイダーが動画処理をハードコードするべきか」ではありません。
最初の問いは「コアの動画ケイパビリティコントラクトは何か」です。
そのコントラクトが存在すれば、ベンダープラグインは
それに対して登録でき、チャネル / 機能プラグインはそれを消費できます。

そのケイパビリティがまだ存在しない場合、通常は次が正しい対応です。

1. コアで不足しているケイパビリティを定義する
2. それをプラグインAPI / ランタイムを通じて型付きで公開する
3. チャネル / 機能をそのケイパビリティに対して配線する
4. ベンダープラグインに実装を登録させる

これにより、所有権を明示したまま、
単一ベンダーや一回限りのプラグイン固有コードパスに依存するコア挙動を避けられます。

### ケイパビリティのレイヤリング

コードをどこに置くべきかを判断する際は、次のメンタルモデルを使ってください。

- **コアケイパビリティレイヤー**: 共有オーケストレーション、ポリシー、フォールバック、config
  マージルール、配信セマンティクス、および型付きコントラクト
- **ベンダープラグインレイヤー**: ベンダー固有API、認証、モデルカタログ、音声
  合成、画像生成、将来の動画バックエンド、利用量エンドポイント
- **チャネル / 機能プラグインレイヤー**: Slack / Discord / voice-callなどの統合。
  コアケイパビリティを消費し、サーフェス上に提示します

たとえば、TTSは次の形に従います。

- コアは返信時TTSポリシー、フォールバック順序、設定、チャネル配信を所有します
- `openai`、`elevenlabs`、`microsoft`は合成実装を所有します
- `voice-call`は電話向けTTSランタイムヘルパーを消費します

将来のケイパビリティについても、同じパターンを優先するべきです。

### 複数ケイパビリティを持つ企業プラグインの例

企業プラグインは、外から見て一貫性があるように感じられるべきです。OpenClawに、
モデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア
理解、画像生成、動画生成、Webフェッチ、およびWeb検索に関する共有
コントラクトがあるなら、ベンダーはそのすべてのサーフェスを1か所で所有できます。

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

重要なのは正確なヘルパー名ではありません。重要なのは形です。

- 1つのプラグインがベンダーサーフェスを所有する
- コアは依然としてケイパビリティコントラクトを所有する
- チャネルと機能プラグインは、ベンダーコードではなく`api.runtime.*`ヘルパーを消費する
- コントラクトテストは、プラグインが所有すると主張するケイパビリティを
  実際に登録したことを検証できる

### ケイパビリティ例: 動画理解

OpenClawはすでに、画像 / 音声 / 動画理解を1つの共有
ケイパビリティとして扱っています。同じ所有権モデルがここにも当てはまります。

1. コアがmedia-understandingコントラクトを定義する
2. ベンダープラグインが、該当するものとして`describeImage`、`transcribeAudio`、
   `describeVideo`を登録する
3. チャネルと機能プラグインは、ベンダーコードに直接配線するのではなく、
   共有コア挙動を消費する

これにより、あるプロバイダーの動画に関する前提がコアに焼き付くのを防げます。プラグインが
ベンダーサーフェスを所有し、コアがケイパビリティコントラクトとフォールバック挙動を所有します。

動画生成もすでに同じ流れに従っています。コアが型付き
ケイパビリティコントラクトとランタイムヘルパーを所有し、ベンダープラグインが
`api.registerVideoGenerationProvider(...)`実装をそれに対して登録します。

具体的なロールアウトチェックリストが必要ですか。以下を参照してください。
[Capability Cookbook](/tools/capability-cookbook)。

## コントラクトと強制

プラグインAPIサーフェスは、意図的に型付けされ、
`OpenClawPluginApi`に集約されています。このコントラクトは、
サポートされる登録ポイントと、プラグインが依存できる
ランタイムヘルパーを定義します。

これが重要な理由:

- プラグイン作者は、1つの安定した内部標準を得られる
- コアは、2つのプラグインが同じ
  provider idを登録するような重複所有を拒否できる
- 起動時に、不正な登録に対する実用的な診断を提示できる
- コントラクトテストは、バンドル済みプラグインの所有権を強制し、
  静かなドリフトを防げる

強制には2つのレイヤーがあります。

1. **ランタイム登録の強制**
   プラグインレジストリは、プラグイン読み込み時に登録を検証します。例:
   重複するprovider id、重複するspeech provider id、および不正な
   登録は、未定義動作ではなくプラグイン診断を生成します。
2. **コントラクトテスト**
   バンドル済みプラグインは、テスト実行中にコントラクトレジストリへ捕捉されるため、
   OpenClawは所有権を明示的に検証できます。現在、これはモデル
   プロバイダー、音声プロバイダー、Web検索プロバイダー、およびバンドル済み登録
   所有権に使われています。

実際の効果として、OpenClawは事前に、
どのプラグインがどのサーフェスを所有するかを把握します。これにより、
所有権が暗黙ではなく、宣言され、型付けされ、テスト可能であるため、
コアとチャネルがシームレスに構成できます。

### コントラクトに含めるべきもの

良いプラグインコントラクトは次のとおりです。

- 型付き
- 小さい
- ケイパビリティ固有
- コアが所有
- 複数のプラグインで再利用可能
- ベンダー知識なしにチャネル / 機能が消費可能

悪いプラグインコントラクトは次のとおりです。

- コアに隠されたベンダー固有ポリシー
- レジストリを迂回する一回限りのプラグイン用エスケープハッチ
- ベンダー実装へ直接到達するチャネルコード
- `OpenClawPluginApi`または
  `api.runtime`の一部ではないアドホックなランタイムオブジェクト

迷ったら、抽象化レベルを上げてください。まずケイパビリティを定義し、
その上でプラグインをそこへ接続させます。

## 実行モデル

ネイティブOpenClawプラグインは、Gatewayと**同一プロセス内**で動作します。
サンドボックス化はされていません。読み込まれたネイティブプラグインは、
コアコードと同じプロセスレベルの信頼境界を持ちます。

影響:

- ネイティブプラグインは、ツール、ネットワークハンドラー、フック、サービスを登録できます
- ネイティブプラグインのバグはgatewayをクラッシュさせたり不安定化させたりできます
- 悪意あるネイティブプラグインは、OpenClawプロセス内での任意コード実行と同等です

互換性のあるバンドルは、OpenClawが現在それらを
メタデータ / コンテンツパックとして扱っているため、デフォルトでより安全です。現在のリリースでは、これは主にバンドル済み
Skillsを意味します。

バンドルされていないプラグインには、allowlistと明示的なインストール / 読み込みパスを使ってください。ワークスペースプラグインは
本番デフォルトではなく開発時コードとして扱ってください。

バンドル済みワークスペースパッケージ名については、プラグインidをnpm
名に固定してください。デフォルトでは`@openclaw/<id>`、または
意図的により狭いプラグインの役割を公開する場合は、
`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding`のような
承認された型付きサフィックスを使います。

重要な信頼上の注意:

- `plugins.allow`は**plugin id**を信頼し、ソースの来歴は信頼しません。
- バンドル済みプラグインと同じidを持つワークスペースプラグインは、
  そのワークスペースプラグインが有効化 / allowlist入りされている場合、
  意図的にバンドル済みコピーをシャドウします。
- これは正常であり、ローカル開発、パッチテスト、ホットフィックスに役立ちます。

## export境界

OpenClawは、実装上の便宜ではなくケイパビリティをexportします。

ケイパビリティ登録は公開のままにしつつ、非コントラクトのヘルパーexportは削減してください。

- バンドル済みプラグイン固有のhelper subpath
- 公開APIとして意図されていないランタイム配管subpath
- ベンダー固有のコンビニエンスヘルパー
- 実装詳細であるsetup / オンボーディングヘルパー

一部のバンドル済みプラグインhelper subpathは、互換性とバンドル済みプラグイン
保守のために、生成されたSDK exportマップに今も残っています。現在の例には
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、およびいくつかの`plugin-sdk/matrix*`シームがあります。これらは
新しいサードパーティプラグイン向けの推奨SDKパターンではなく、
予約済みの実装詳細exportとして扱ってください。

## 読み込みパイプライン

起動時に、OpenClawは概ね次の処理を行います。

1. 候補プラグインルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み込む
3. 安全でない候補を拒否する
4. プラグイン設定を正規化する（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 各候補の有効化可否を決定する
6. 有効なネイティブモジュールをjiti経由で読み込む
7. ネイティブの`register(api)`（または`activate(api)` — レガシーエイリアス）フックを呼び出し、登録をプラグインレジストリへ収集する
8. レジストリをコマンド / ランタイムサーフェスに公開する

<Note>
`activate`は`register`のレガシーエイリアスです — ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じ地点で呼び出します。すべてのバンドル済みプラグインは`register`を使用しています。新しいプラグインでは`register`を優先してください。
</Note>

安全ゲートは、ランタイム実行**前**に発生します。候補は、
エントリーがプラグインルートの外へ逃げる場合、パスがworld-writableである場合、
またはバンドルされていないプラグインについてパスの所有権が不審に見える場合にブロックされます。

### Manifest-firstの挙動

manifestはコントロールプレーンの真実の源です。OpenClawはこれを使って次を行います。

- プラグインを識別する
- 宣言されたチャネル / Skills / config schemaまたはバンドル機能を検出する
- `plugins.entries.<id>.config`を検証する
- Control UIのラベル / プレースホルダーを拡張する
- インストール / カタログメタデータを表示する

ネイティブプラグインでは、ランタイムモジュールがデータプレーン部分です。ここで、
フック、ツール、コマンド、またはプロバイダーフローのような実際の挙動を登録します。

### ローダーがキャッシュするもの

OpenClawは、短期間のプロセス内キャッシュを次のために保持します。

- 検出結果
- manifestレジストリデータ
- 読み込み済みプラグインレジストリ

これらのキャッシュは、突発的な起動負荷と繰り返しコマンドのオーバーヘッドを減らします。これらは
永続化ではなく、短命なパフォーマンスキャッシュとして考えるのが適切です。

パフォーマンス上の注意:

- これらのキャッシュを無効にするには、`OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1`または
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`を設定してください。
- キャッシュ期間は`OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS`と
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`で調整できます。

## レジストリモデル

読み込まれたプラグインは、ランダムなコアグローバルを直接変更しません。中央の
プラグインレジストリに登録します。

レジストリは次を追跡します。

- プラグインレコード（識別情報、ソース、出所、状態、診断）
- ツール
- レガシーフックと型付きフック
- チャネル
- プロバイダー
- Gateway RPCハンドラー
- HTTPルート
- CLI登録子
- バックグラウンドサービス
- プラグイン所有コマンド

その後、コア機能はプラグインモジュールへ直接話しかけるのではなく、
このレジストリから読み取ります。これにより、読み込みは一方向に保たれます。

- プラグインモジュール -> レジストリ登録
- コアランタイム -> レジストリ消費

この分離は保守性にとって重要です。これは、多くのコアサーフェスが
「レジストリを読む」という1つの統合ポイントだけを必要とし、
「各プラグインモジュールを特別扱いする」必要がないことを意味します。

## 会話バインディングコールバック

会話をバインドするプラグインは、承認が解決されたときに反応できます。

バインド要求が承認または拒否された後にコールバックを受け取るには、
`api.onConversationBindingResolved(...)`を使用してください。

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // このプラグイン + 会話のバインディングが存在するようになりました。
        console.log(event.binding?.conversationId);
        return;
      }

      // リクエストは拒否されました。ローカルの保留状態を消去してください。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

コールバックのペイロードフィールド:

- `status`: `"approved"`または`"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または`"deny"`
- `binding`: 承認済みリクエストの解決済みバインディング
- `request`: 元のリクエスト概要、デタッチヒント、sender id、および
  会話メタデータ

このコールバックは通知専用です。誰が会話をバインドできるかは変更せず、
コアの承認処理が完了した後に実行されます。

## プロバイダーのランタイムフック

プロバイダープラグインは現在、2つのレイヤーを持ちます。

- manifestメタデータ: ランタイム読み込み前の
  安価なenv認証参照用の`providerAuthEnvVars`、およびランタイム読み込み前の
  安価なオンボーディング / auth-choice
  ラベルやCLIフラグメタデータ用の`providerAuthChoices`
- config時フック: `catalog` / レガシー`discovery`および`applyConfigDefaults`
- ランタイムフック: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
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

OpenClawは、依然として汎用エージェントループ、フェイルオーバー、トランスクリプト処理、および
ツールポリシーを所有しています。これらのフックは、プロバイダー固有の挙動向けの拡張サーフェスであり、
プロバイダー専用の推論トランスポート全体を必要としません。

プロバイダーがenvベースの認証情報を持ち、汎用のauth / status / model-picker経路が
プロバイダーランタイムを読み込まずにそれを認識する必要がある場合は、manifestの`providerAuthEnvVars`を使用してください。
オンボーディング / auth-choice CLI
サーフェスが、プロバイダーランタイムを読み込まずにそのプロバイダーのchoice id、
group label、および単純な
単一フラグ認証配線を認識する必要がある場合は、manifestの`providerAuthChoices`を使ってください。プロバイダーランタイムの
`envVars`は、オンボーディングラベルやOAuth
client-id / client-secret設定変数のような、
運用者向けヒントとして保持してください。

### フック順序と使い方

モデル / プロバイダープラグインについて、OpenClawは概ね次の順序でフックを呼び出します。
「When to use」列は、素早い判断ガイドです。

| #   | フック                            | 役割                                                                                     | 使うべき場面                                                                                                                               |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json`生成時に、プロバイダー設定を`models.providers`へ公開する                   | プロバイダーがカタログまたはbase URLデフォルトを所有している                                                                               |
| 2   | `applyConfigDefaults`             | config具体化時に、プロバイダー所有のグローバルconfigデフォルトを適用する                | デフォルトがauthモード、env、またはプロバイダーのモデルファミリー意味論に依存する                                                          |
| --  | _(built-in model lookup)_         | OpenClawはまず通常のレジストリ / カタログ経路を試す                                     | _(プラグインフックではない)_                                                                                                                |
| 3   | `normalizeModelId`                | lookup前に、レガシーまたはプレビューのmodel-idエイリアスを正規化する                    | 正規のモデル解決前に、プロバイダーがエイリアスクリーンアップを所有している                                                                 |
| 4   | `normalizeTransport`              | 汎用モデル構築前に、プロバイダーファミリーの`api` / `baseUrl`を正規化する               | 同じトランスポートファミリー内のカスタムprovider id向けトランスポートクリーンアップをプロバイダーが所有している                            |
| 5   | `normalizeConfig`                 | ランタイム / プロバイダー解決前に`models.providers.<id>`を正規化する                    | プロバイダーが、プラグイン内にあるべきconfigクリーンアップを必要としている。バンドル済みGoogleファミリーヘルパーは、サポートされるGoogle configエントリーも後方保護する |
| 6   | `applyNativeStreamingUsageCompat` | config providersに対して、ネイティブstreaming-usage互換リライトを適用する              | エンドポイント駆動のネイティブstreaming usageメタデータ修正が必要                                                                          |
| 7   | `resolveConfigApiKey`             | ランタイムauth読み込み前に、config providers向けのenv-marker認証を解決する              | プロバイダー所有のenv-marker APIキー解決がある。`amazon-bedrock`にもここにbuilt-inのAWS env-marker resolverがある                         |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、local / self-hostedまたはconfig-backed認証を表面化する              | プロバイダーがsynthetic / local credential markerで動作できる                                                                              |
| 9   | `shouldDeferSyntheticProfileAuth` | 保存されたsynthetic profile placeholderを、env / config-backed authより低優先にする     | プロバイダーが優先されるべきでないsynthetic placeholder profileを保存している                                                              |
| 10  | `resolveDynamicModel`             | ローカルレジストリにまだないプロバイダー所有model id向けの同期フォールバック            | プロバイダーが任意のupstream model idを受け付ける                                                                                          |
| 11  | `prepareDynamicModel`             | 非同期ウォームアップ後に、`resolveDynamicModel`を再実行する                              | 不明なidを解決する前にネットワークメタデータが必要                                                                                         |
| 12  | `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使う前の最終リライト                                  | プロバイダーがトランスポートリライトを必要とするが、依然としてコアトランスポートを使う                                                    |
| 13  | `contributeResolvedModelCompat`   | 別の互換トランスポートの背後にあるベンダーモデル向けのcompatフラグを提供する            | プロバイダーを乗っ取らずに、プロキシトランスポート上で自分のモデルを認識する                                                               |
| 14  | `capabilities`                    | 共有コアロジックで使われる、プロバイダー所有のトランスクリプト / ツールメタデータ       | プロバイダーがtranscript / provider-familyの癖を必要とする                                                                                 |
| 15  | `normalizeToolSchemas`            | 埋め込みランナーが見る前にtool schemaを正規化する                                       | プロバイダーがtransport-family schemaクリーンアップを必要とする                                                                            |
| 16  | `inspectToolSchemas`              | 正規化後に、プロバイダー所有のschema診断を表面化する                                    | コアにプロバイダー固有ルールを教えずに、プロバイダーがキーワード警告を出したい                                                             |
| 17  | `resolveReasoningOutputMode`      | ネイティブまたはtaggedなreasoning-output contractを選択する                             | プロバイダーがネイティブフィールドの代わりに、tagged reasoning / final outputを必要とする                                                  |
| 18  | `prepareExtraParams`              | 汎用stream option wrapper前のリクエストパラメーター正規化                               | デフォルトリクエストパラメーターまたはプロバイダーごとのパラメータークリーンアップが必要                                                   |
| 19  | `createStreamFn`                  | 通常のstream path全体をカスタムトランスポートに置き換える                               | ラッパーではなく、カスタムwire protocolが必要                                                                                               |
| 20  | `wrapStreamFn`                    | 汎用ラッパー適用後のstreamラッパー                                                      | カスタムトランスポートではなく、リクエストヘッダー / body / model互換ラッパーが必要                                                        |
| 21  | `resolveTransportTurnState`       | ネイティブのターン単位トランスポートヘッダーまたはメタデータを付加する                  | 汎用トランスポートで、プロバイダーネイティブのターンIDを送信したい                                                                          |
| 22  | `resolveWebSocketSessionPolicy`   | ネイティブWebSocketヘッダーまたはセッションクールダウンポリシーを付加する               | 汎用WSトランスポートで、セッションヘッダーやフォールバックポリシーを調整したい                                                             |
| 23  | `formatApiKey`                    | auth-profile formatter: 保存済みprofileをランタイム`apiKey`文字列にする                 | プロバイダーが追加のauthメタデータを保存し、カスタムのランタイムトークン形状を必要とする                                                   |
| 24  | `refreshOAuth`                    | カスタムrefresh endpointまたはrefresh失敗ポリシー向けのOAuth refreshオーバーライド      | 共有`pi-ai` refresherに適合しない                                                                                                          |
| 25  | `buildAuthDoctorHint`             | OAuth refresh失敗時に付加される修復ヒント                                               | プロバイダー所有のauth修復ガイダンスが必要                                                                                                  |
| 26  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウあふれマッチャー                                | 汎用ヒューリスティックでは見落とす生のoverflow errorがある                                                                                  |
| 27  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                              | 生のAPI / transport errorを、rate-limit / overloadなどにマップできる                                                                        |
| 28  | `isCacheTtlEligible`              | proxy / backhaul provider向けのプロンプトキャッシュポリシー                             | proxy固有のcache TTLゲーティングが必要                                                                                                      |
| 29  | `buildMissingAuthMessage`         | 汎用missing-auth復旧メッセージの置き換え                                                | プロバイダー固有のmissing-auth復旧ヒントが必要                                                                                              |
| 30  | `suppressBuiltInModel`            | 古いupstream modelの抑制と、任意のユーザー向けエラーヒント                              | 古いupstream行を隠したり、ベンダーヒントに置き換えたい                                                                                      |
| 31  | `augmentModelCatalog`             | 検出後に、synthetic / 最終catalog行を追記する                                            | `models list`やpickerにsyntheticなforward-compat行が必要                                                                                    |
| 32  | `isBinaryThinking`                | binary-thinking provider向けのオン / オフ推論トグル                                     | プロバイダーがbinary thinkingのオン / オフのみを公開する                                                                                    |
| 33  | `supportsXHighThinking`           | 選択されたモデル向けの`xhigh`推論サポート                                               | プロバイダーが一部のモデルだけで`xhigh`を有効にしたい                                                                                       |
| 34  | `resolveDefaultThinkingLevel`     | 特定モデルファミリー向けのデフォルト`/think`レベル                                      | そのモデルファミリー向けのデフォルト`/think`ポリシーをプロバイダーが所有している                                                            |
| 35  | `isModernModelRef`                | live profile filterおよびsmoke選択向けのmodern-model matcher                            | live / smoke優先モデルマッチングをプロバイダーが所有している                                                                                |
| 36  | `prepareRuntimeAuth`              | 推論直前に、設定済み認証情報を実際のランタイムトークン / キーへ交換する                 | トークン交換または短命リクエスト認証情報が必要                                                                                              |
| 37  | `resolveUsageAuth`                | `/usage`および関連statusサーフェス向けの利用量 / 課金認証を解決する                     | カスタムのusage / quotaトークン解析、または異なるusage認証情報が必要                                                                        |
| 38  | `fetchUsageSnapshot`              | auth解決後に、プロバイダー固有のusage / quotaスナップショットを取得して正規化する       | プロバイダー固有のusage endpointまたはpayload parserが必要                                                                                  |
| 39  | `createEmbeddingProvider`         | メモリー / 検索向けの、プロバイダー所有embedding adapterを構築する                      | メモリーembedding挙動はプロバイダープラグインに属する                                                                                       |
| 40  | `buildReplayPolicy`               | プロバイダー向けのtranscript処理を制御するreplay policyを返す                           | カスタムtranscript policy（たとえばthinking block除去）が必要                                                                               |
| 41  | `sanitizeReplayHistory`           | 汎用transcriptクリーンアップ後にreplay historyを書き換える                              | 共有compaction helperを超える、プロバイダー固有replay書き換えが必要                                                                         |
| 42  | `validateReplayTurns`             | 埋め込みランナー前の最終replay turn検証または整形                                       | 汎用sanitation後でも、provider transportがより厳密なturn検証を必要とする                                                                    |
| 43  | `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                | モデルが有効になったときのtelemetryやプロバイダー所有stateが必要                                                                            |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig`はまず
一致したprovider pluginを確認し、その後、実際にmodel idまたは
transport / configを変更するものが現れるまで、他のフック対応provider pluginへフォールスルーします。これにより、
callerがどのバンドル済みプラグインがそのリライトを所有しているかを知る必要なく、
alias / compat provider shimが動作し続けます。いずれのprovider hookも
サポートされたGoogleファミリーconfigエントリーを書き換えない場合、
バンドル済みGoogle config normalizerがその互換性クリーンアップを引き続き適用します。

プロバイダーが完全なカスタムwire protocolまたはカスタムリクエスト実行器を必要とする場合、
それは別種の拡張です。これらのフックは、
OpenClawの通常の推論ループ上で動作するプロバイダー挙動向けです。

### プロバイダー例

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

### 組み込み例

- Anthropicは`resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、
  `resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、
  および`wrapStreamFn`を使います。これはClaude 4.6のforward-compat、
  provider-familyヒント、auth修復ガイダンス、usage endpoint統合、
  prompt-cache適格性、auth対応configデフォルト、Claudeの
  default / adaptive thinkingポリシー、およびbeta
  header、`/fast` / `serviceTier`、`context1m`向けのAnthropic固有stream shapingを所有するためです。
- AnthropicのClaude固有stream helperは、現時点では
  バンドル済みプラグイン自身の公開`api.ts` / `contract-api.ts`シーム内に留まっています。そのパッケージサーフェスは
  `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、およびより低レベルの
  Anthropic wrapper builderをexportしており、1つのプロバイダーのbeta-headerルールのために
  汎用SDKを広げていません。
- OpenAIは`resolveDynamicModel`、`normalizeResolvedModel`、
  `capabilities`に加えて、`buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`supportsXHighThinking`、`isModernModelRef`を使います。
  これはGPT-5.4のforward-compat、直接のOpenAI
  `openai-completions` -> `openai-responses`正規化、Codex対応auth
  ヒント、Spark抑制、syntheticなOpenAI list行、およびGPT-5のthinking /
  live-modelポリシーを所有するためです。`openai-responses-defaults` stream familyは、
  attribution header、
  `/fast` / `serviceTier`、text verbosity、ネイティブCodex Web検索、
  reasoning-compat payload shaping、およびResponses context管理向けの
  共有ネイティブOpenAI Responses wrapperを所有します。
- OpenRouterは`catalog`に加えて`resolveDynamicModel`と
  `prepareDynamicModel`を使います。これはプロバイダーがパススルーであり、
  OpenClawの静的カタログが更新される前に新しい
  model idを公開しうるためです。また、
  provider固有リクエストヘッダー、ルーティングメタデータ、reasoningパッチ、および
  prompt-cacheポリシーをコアの外に保つために、
  `capabilities`、`wrapStreamFn`、`isCacheTtlEligible`も使います。そのreplay policyは
  `passthrough-gemini` familyから来ており、`openrouter-thinking` stream familyは
  proxy reasoning注入と未対応モデル / `auto`スキップを所有します。
- GitHub Copilotは`catalog`、`auth`、`resolveDynamicModel`、
  `capabilities`に加えて`prepareRuntimeAuth`と`fetchUsageSnapshot`を使います。
  これは、プロバイダー所有のdevice login、モデルフォールバック挙動、Claudeのtranscriptの癖、
  GitHub token -> Copilot token交換、およびプロバイダー所有のusage endpointが必要なためです。
- OpenAI Codexは`catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth`、`augmentModelCatalog`に加えて
  `prepareExtraParams`、`resolveUsageAuth`、`fetchUsageSnapshot`を使います。
  これは依然としてコアOpenAIトランスポート上で動作しつつ、
  そのトランスポート / base URL正規化、OAuth refreshフォールバックポリシー、
  デフォルトトランスポート選択、syntheticなCodexカタログ行、およびChatGPT usage endpoint統合を所有するためです。
  direct OpenAIと同じ`openai-responses-defaults` stream familyを共有します。
- Google AI StudioとGemini CLI OAuthは`resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn`、`isModernModelRef`を使います。これは
  `google-gemini` replay familyがGemini 3.1のforward-compatフォールバック、
  ネイティブGemini replay検証、bootstrap replay sanitization、tagged
  reasoning-output mode、およびmodern-model matchingを所有し、
  `google-thinking` stream familyがGemini thinking payload正規化を所有するためです。
  Gemini CLI OAuthはさらに、トークン整形、トークン解析、およびquota endpoint
  配線のために`formatApiKey`、`resolveUsageAuth`、`fetchUsageSnapshot`も使います。
- Anthropic Vertexは、
  `anthropic-by-model` replay familyを通じて`buildReplayPolicy`を使います。これにより、
  Claude固有replayクリーンアップが、すべての`anthropic-messages` transportではなく、
  Claude idに限定されます。
- Amazon Bedrockは`buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason`、`resolveDefaultThinkingLevel`を使います。これは
  Anthropic-on-Bedrockトラフィック向けのBedrock固有
  throttle / not-ready / context-overflowエラー分類を所有するためです。
  そのreplay policyは、依然として同じ
  Claude専用`anthropic-by-model`ガードを共有します。
- OpenRouter、Kilocode、Opencode、Opencode Goは`buildReplayPolicy`を
  `passthrough-gemini` replay family経由で使います。これは
  OpenAI互換トランスポートを通じてGeminiモデルをプロキシし、
  ネイティブGemini replay検証や
  bootstrapリライトなしにGemini thought-signature sanitizationを必要とするためです。
- MiniMaxは、
  `hybrid-anthropic-openai` replay family経由で`buildReplayPolicy`を使います。これは
  1つのプロバイダーがAnthropic-messageとOpenAI互換セマンティクスの両方を所有するためです。
  Anthropic側ではClaude専用thinking-block除去を維持しつつ、
  reasoning output modeをネイティブへ上書きし、
  `minimax-fast-mode` stream familyが共有stream path上の
  fast-mode modelリライトを所有します。
- Moonshotは`catalog`に加えて`wrapStreamFn`を使います。これは依然として共有
  OpenAI transportを使いながら、プロバイダー所有のthinking payload正規化を必要とするためです。
  `moonshot-thinking` stream familyは、configと`/think`状態を
  ネイティブbinary thinking payloadへマッピングします。
- Kilocodeは`catalog`、`capabilities`、`wrapStreamFn`、
  `isCacheTtlEligible`を使います。これはプロバイダー所有のrequest header、
  reasoning payload正規化、Gemini transcriptヒント、およびAnthropic
  cache-TTLゲーティングを必要とするためです。`kilocode-thinking` stream familyは、
  `kilo/auto`やその他の
  明示的reasoning payloadをサポートしないproxy model idをスキップしつつ、
  共有proxy stream path上でKilo thinking注入を保持します。
- Z.AIは`resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、
  `resolveUsageAuth`、`fetchUsageSnapshot`を使います。これはGLM-5フォールバック、
  `tool_stream`デフォルト、binary thinking UX、modern-model matching、および
  usage auth + quota取得の両方を所有するためです。`tool-stream-default-on` stream familyは、
  デフォルトオンの`tool_stream` wrapperをプロバイダーごとの手書き glueの外へ保ちます。
- xAIは`normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel`、`isModernModelRef`を使います。
  これはネイティブxAI Responses transport正規化、Grok fast-mode
  aliasリライト、デフォルト`tool_stream`、strict-tool / reasoning-payload
  クリーンアップ、plugin所有ツール向けのフォールバックauth再利用、
  forward-compatなGrokモデル解決、およびxAI tool-schema
  profile、未対応schema keyword、ネイティブ`web_search`、HTML entity
  tool-call引数デコードのような、プロバイダー所有compat patchを所有するためです。
- Mistral、OpenCode Zen、OpenCode Goは、transcript / toolingの癖を
  コアの外に保つために`capabilities`のみを使います。
- `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine`のような
  カタログ専用バンドル済みプロバイダーは、`catalog`のみを使います。
- Qwenは、テキストプロバイダー向けの`catalog`に加えて、
  そのマルチモーダルサーフェス向けに共有media-understandingと
  video-generation登録を使います。
- MiniMaxとXiaomiは、推論自体は共有トランスポートを通って動作するものの、
  その`/usage`挙動がプラグイン所有であるため、
  `catalog`に加えてusageフックも使います。

## ランタイムヘルパー

プラグインは、`api.runtime`を通じて選択されたコアヘルパーにアクセスできます。TTSの場合:

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

- `textToSpeech`は、ファイル / ボイスノートサーフェス向けの通常のコアTTS出力ペイロードを返します。
- コアの`messages.tts`設定とプロバイダー選択を使用します。
- PCM音声バッファー + サンプルレートを返します。プラグイン側でプロバイダー向けにリサンプリング / エンコードする必要があります。
- `listVoices`は、プロバイダーごとに任意です。ベンダー所有の音声ピッカーやセットアップフローに使ってください。
- 音声一覧には、プロバイダー対応ピッカー向けに、locale、gender、personality tagなどのより豊富なメタデータを含められます。
- 電話対応は現時点でOpenAIとElevenLabsがサポートします。Microsoftはサポートしません。

プラグインは、`api.registerSpeechProvider(...)`を通じてspeech providerも登録できます。

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

- TTSポリシー、フォールバック、返信配信はコアに維持してください。
- ベンダー所有の合成挙動にはspeech providerを使ってください。
- レガシーMicrosoftの`edge`入力は、`microsoft` provider idへ正規化されます。
- 推奨される所有権モデルは企業指向です。OpenClawが
  これらのケイパビリティコントラクトを追加していくにつれ、1つのベンダープラグインが
  テキスト、音声、画像、将来のメディアプロバイダーを所有できます。

画像 / 音声 / 動画理解については、プラグインは汎用
key / value bagではなく、1つの型付き
media-understanding providerを登録します。

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

- オーケストレーション、フォールバック、config、チャネル配線はコアに維持してください。
- ベンダー挙動はプロバイダープラグインに維持してください。
- 加法的拡張は型付きのままであるべきです。新しい任意メソッド、新しい任意
  結果フィールド、新しい任意ケイパビリティの形にしてください。
- 動画生成はすでに同じパターンに従います。
  - コアがケイパビリティコントラクトとランタイムヘルパーを所有する
  - ベンダープラグインが`api.registerVideoGenerationProvider(...)`を登録する
  - 機能 / チャネルプラグインが`api.runtime.videoGeneration.*`を消費する

media-understandingランタイムヘルパーについて、プラグインは次を呼び出せます。

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

音声文字起こしについては、プラグインはmedia-understandingランタイム
または古いSTTエイリアスのいずれかを使えます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIMEを確実に推測できない場合は任意:
  mime: "audio/ogg",
});
```

注意:

- `api.runtime.mediaUnderstanding.*`は、
  画像 / 音声 / 動画理解向けの推奨共有サーフェスです。
- コアのmedia-understanding音声設定（`tools.media.audio`）とプロバイダーフォールバック順序を使用します。
- 文字起こし出力が生成されない場合（たとえばスキップ / 未対応入力）は、`{ text: undefined }`を返します。
- `api.runtime.stt.transcribeAudioFile(...)`は互換性エイリアスとして残っています。

プラグインは`api.runtime.subagent`を通じてバックグラウンドsubagent実行も開始できます。

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

- `provider`と`model`は、永続的なセッション変更ではなく、実行ごとの任意オーバーライドです。
- OpenClawは、それらのオーバーライドフィールドを信頼された呼び出し元に対してのみ受け付けます。
- プラグイン所有のフォールバック実行については、運用者が`plugins.entries.<id>.subagent.allowModelOverride: true`で明示的にオプトインする必要があります。
- 信頼されたプラグインを特定の正規`provider/model`ターゲットに制限するには`plugins.entries.<id>.subagent.allowedModels`を使い、任意ターゲットを明示的に許可するには`"*"`を使ってください。
- 信頼されていないプラグインのsubagent実行も動作しますが、オーバーライド要求は黙ってフォールバックされるのではなく拒否されます。

Web検索については、プラグインはエージェントツール配線へ
直接到達するのではなく、共有ランタイムヘルパーを消費できます。

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

プラグインは
`api.registerWebSearchProvider(...)`を通じてWeb検索プロバイダーも登録できます。

注意:

- プロバイダー選択、認証情報解決、および共有リクエストセマンティクスはコアに維持してください。
- ベンダー固有検索トランスポートにはWeb検索プロバイダーを使ってください。
- `api.runtime.webSearch.*`は、エージェントツールラッパーに依存せずに
  検索挙動を必要とする機能 / チャネルプラグイン向けの推奨共有サーフェスです。

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

- `generate(...)`: 設定された画像生成プロバイダーチェーンを使って画像を生成します。
- `listProviders(...)`: 利用可能な画像生成プロバイダーとそのケイパビリティを一覧表示します。

## Gateway HTTPルート

プラグインは`api.registerHttpRoute(...)`でHTTPエンドポイントを公開できます。

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

- `path`: gateway HTTPサーバー配下のルートパス。
- `auth`: 必須。通常のgateway認証を要求するには`"gateway"`、プラグイン管理の認証 / webhook検証には`"plugin"`を使います。
- `match`: 任意。`"exact"`（デフォルト）または`"prefix"`。
- `replaceExisting`: 任意。同じプラグインが自分自身の既存ルート登録を置き換えることを許可します。
- `handler`: ルートがリクエストを処理した場合は`true`を返します。

注意:

- `api.registerHttpHandler(...)`は削除されており、プラグイン読み込みエラーになります。代わりに`api.registerHttpRoute(...)`を使ってください。
- プラグインルートは`auth`を明示的に宣言する必要があります。
- 同一の`path + match`競合は、`replaceExisting: true`がない限り拒否され、あるプラグインが別のプラグインのルートを置き換えることはできません。
- `auth`レベルが異なる重複ルートは拒否されます。`exact` / `prefix`のフォールスルーチェーンは同じauthレベル内にのみ保ってください。
- `auth: "plugin"`ルートは、運用者ランタイムスコープを自動では受け取り**ません**。これはプラグイン管理のwebhook / 署名検証向けであり、特権Gatewayヘルパー呼び出し向けではありません。
- `auth: "gateway"`ルートはGatewayリクエストランタイムスコープ内で実行されますが、そのスコープは意図的に保守的です。
  - 共有シークレットbearer認証（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が`x-openclaw-scopes`を送信しても、プラグインルートのランタイムスコープは`operator.write`に固定されます
  - 信頼されたID付きHTTPモード（たとえば`trusted-proxy`や、プライベートingress上の`gateway.auth.mode = "none"`）では、`x-openclaw-scopes`ヘッダーが明示的に存在する場合にのみそれを尊重します
  - それらのID付きプラグインルートリクエストで`x-openclaw-scopes`が存在しない場合、ランタイムスコープは`operator.write`へフォールバックします
- 実践的なルール: gateway-authプラグインルートを暗黙の管理者サーフェスだと思わないでください。ルートが管理者専用挙動を必要とするなら、ID付き認証モードを要求し、明示的な`x-openclaw-scopes`ヘッダー契約を文書化してください。

## Plugin SDK importパス

プラグイン作成時には、単一の`openclaw/plugin-sdk` importではなく、
SDK subpathを使ってください。

- プラグイン登録プリミティブには`openclaw/plugin-sdk/plugin-entry`。
- 汎用の共有プラグイン向けコントラクトには`openclaw/plugin-sdk/core`。
- ルート`openclaw.json` Zod schema
  export（`OpenClawSchema`）には`openclaw/plugin-sdk/config-schema`。
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
  `openclaw/plugin-sdk/webhook-ingress`のような安定したチャネルプリミティブは、
  共有setup / auth / reply / webhook
  配線向けです。`channel-inbound`は、debounce、mentionマッチング、
  envelope整形、および受信envelope context helperの共有ホームです。
  `channel-setup`は狭いoptional-install setupシームです。
  `setup-runtime`は、`setupEntry` /
  遅延起動で使われるランタイム安全なsetupサーフェスであり、
  import安全なsetup patch adapterを含みます。
  `setup-adapter-runtime`はenv対応account-setup adapterシームです。
  `setup-tools`は、小さなCLI / archive / docs helperシーム（`formatCliCommand`、
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`）です。
- `openclaw/plugin-sdk/channel-config-helpers`、
  `openclaw/plugin-sdk/allow-from`、
  `openclaw/plugin-sdk/channel-config-schema`、
  `openclaw/plugin-sdk/telegram-command-config`、
  `openclaw/plugin-sdk/channel-policy`、
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
  `openclaw/plugin-sdk/directory-runtime`のようなドメインsubpathは、
  共有ランタイム / config helper向けです。
  `telegram-command-config`は、Telegramカスタム
  コマンド正規化 / 検証向けの狭い公開シームであり、
  バンドル済みTelegramコントラクトサーフェスが一時的に利用不能な場合でも利用可能なままです。
  `text-runtime`は、assistant-visible-text除去、
  markdown render / chunking helper、redaction
  helper、directive-tag helper、およびsafe-text utilityを含む、
  共有text / markdown / loggingシームです。
- 承認固有チャネルシームでは、プラグイン上の1つの`approvalCapability`
  コントラクトを優先してください。するとコアは、その1つのケイパビリティを通じて
  approval auth、delivery、render、およびnative-routing挙動を読み取り、
  approval挙動を無関係なプラグインフィールドへ混ぜる必要がなくなります。
- `openclaw/plugin-sdk/channel-runtime`は非推奨で、
  古いプラグイン向けの互換性shimとしてのみ残っています。新しいコードでは、
  代わりにより狭い汎用プリミティブをimportするべきであり、repoコードでも
  このshimへの新規importを追加すべきではありません。
- バンドル済み拡張の内部は非公開のままです。外部プラグインは
  `openclaw/plugin-sdk/*` subpathのみを使うべきです。OpenClawのコア / テストコードは、
  `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js`、および
  `login-qr-api.js`のような狭く限定されたファイルなど、プラグインパッケージルート配下の
  repo公開エントリポイントを使えます。コアまたは別拡張から、
  プラグインパッケージの`src/*`をimportしてはいけません。
- repoエントリポイント分割:
  `<plugin-package-root>/api.js`はhelper / types barrel、
  `<plugin-package-root>/runtime-api.js`はruntime-only barrel、
  `<plugin-package-root>/index.js`はバンドル済みプラグインエントリー、
  `<plugin-package-root>/setup-entry.js`はsetupプラグインエントリーです。
- 現在のバンドル済みプロバイダー例:
  - Anthropicは、`wrapAnthropicProviderStream`、beta-header helper、`service_tier`
    解析などのClaude stream helper向けに`api.js` / `contract-api.js`を使います。
  - OpenAIは、provider builder、default-model helper、realtime provider builder向けに
    `api.js`を使います。
  - OpenRouterは、そのprovider builderに加えてonboarding / config
    helper向けに`api.js`を使い、`register.runtime.js`は依然としてrepoローカル用途向けに
    汎用`plugin-sdk/provider-stream` helperを再exportできます。
- facade読み込みされる公開エントリポイントは、利用可能な場合はアクティブな
  ランタイムconfigスナップショットを優先し、OpenClawがまだランタイム
  スナップショットを提供していない場合は、ディスク上の解決済みconfigファイルへフォールバックします。
- 汎用共有プリミティブは、引き続き推奨される公開SDKコントラクトです。
  バンドル済みチャネルブランド付きhelperシームの小さな予約済み互換セットは今も存在します。これらは
  バンドル保守 / 互換性シームとして扱い、新しい
  サードパーティimportターゲットとしては扱わないでください。新しいクロスチャネルコントラクトは、
  引き続き汎用`plugin-sdk/*` subpathまたはプラグインローカルの`api.js` /
  `runtime-api.js` barrelに置くべきです。

互換性に関する注意:

- 新しいコードでは、ルートの`openclaw/plugin-sdk` barrelは避けてください。
- まず狭い安定プリミティブを優先してください。新しいsetup / pairing / reply /
  feedback / contract / inbound / threading / command / secret-input / webhook / infra /
  allowlist / status / message-tool subpathが、新しい
  バンドル済みおよび外部プラグイン作業向けの意図されたコントラクトです。
  target解析 / マッチングは`openclaw/plugin-sdk/channel-targets`に属します。
  message action gateおよびreaction message-id helperは
  `openclaw/plugin-sdk/channel-actions`に属します。
- バンドル済み拡張固有helper barrelは、デフォルトでは安定していません。
  あるhelperがバンドル済み拡張にしか必要ない場合は、
  `openclaw/plugin-sdk/<extension>`へ昇格させるのではなく、
  その拡張のローカル`api.js`または`runtime-api.js`シームの背後に保ってください。
- 新しい共有helperシームは、チャネルブランド付きではなく汎用であるべきです。共有target
  解析は`openclaw/plugin-sdk/channel-targets`に属し、チャネル固有
  内部は、そのプラグイン所有のローカル`api.js`または`runtime-api.js`
  シームの背後に留まります。
- `image-generation`、
  `media-understanding`、`speech`のようなケイパビリティ固有subpathは、
  バンドル済み / ネイティブプラグインが現在それらを使っているため存在します。
  それらが存在すること自体は、exportされたすべてのhelperが
  長期的に凍結された外部コントラクトであることを意味しません。

## Messageツールschema

プラグインは、チャネル固有の`describeMessageTool(...)` schema
寄与を所有するべきです。プロバイダー固有フィールドは、共有コアではなく
プラグイン内に保持してください。

共有の移植可能schemaフラグメントについては、
`openclaw/plugin-sdk/channel-actions`経由でexportされる汎用helperを再利用してください。

- ボタングリッド形式のpayloadには`createMessageToolButtonsSchema()`
- 構造化カードpayloadには`createMessageToolCardSchema()`

あるschema形状が1つのプロバイダーにしか意味を持たないなら、
共有SDKへ昇格させるのではなく、そのプラグイン自身の
ソース内で定義してください。

## チャネルtarget解決

チャネルプラグインは、チャネル固有のtargetセマンティクスを所有するべきです。共有
outbound hostは汎用のままにし、メッセージングadapterサーフェスをプロバイダールールに使ってください。

- `messaging.inferTargetChatType({ to })`は、正規化されたtargetを
  directory lookup前に`direct`、`group`、または`channel`として扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)`は、ある入力が
  directory searchではなく、明示的 / ネイティブtarget id解決へ直接進むべきかどうかをコアに伝えます。
- `messaging.targetResolver.resolveTarget(...)`は、正規化後または
  directory miss後に、コアが最終的なプロバイダー所有解決を必要とする場合のプラグイン側フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)`は、target解決後の
  プロバイダー固有セッションルート構築を所有します。

推奨される分割:

- peer / group検索前に行うべきカテゴリ判定には`inferTargetChatType`を使う
- 「これを明示的 / ネイティブtarget idとして扱う」判定には`looksLikeId`を使う
- `resolveTarget`は、広範なdirectory searchではなく、
  プロバイダー固有の正規化フォールバックに使う
- chat id、thread id、JID、handle、room idのようなプロバイダーネイティブidは、
  汎用SDKフィールドではなく、`target`値またはプロバイダー固有パラメーター内に保持する

## configベースのdirectory

configからdirectoryエントリーを導出するプラグインは、そのロジックを
プラグイン内に保持し、
`openclaw/plugin-sdk/directory-runtime`の共有helperを再利用するべきです。

これは、あるチャネルが次のようなconfigベースpeer / groupを必要とする場合に使ってください。

- allowlist駆動のDM peer
- 設定されたchannel / group map
- accountスコープの静的directoryフォールバック

`directory-runtime`の共有helperは、汎用操作のみを扱います。

- クエリフィルタリング
- limit適用
- dedupe / 正規化helper
- `ChannelDirectoryEntry[]`の構築

チャネル固有のaccount検査とid正規化は、
プラグイン実装内に留めるべきです。

## プロバイダーカタログ

プロバイダープラグインは、
`registerProvider({ catalog: { run(...) { ... } } })`で推論向けモデルカタログを定義できます。

`catalog.run(...)`は、OpenClawが`models.providers`へ書き込むのと同じ形状を返します。

- 1つのproviderエントリーには`{ provider }`
- 複数のproviderエントリーには`{ providers }`

プラグインがプロバイダー固有のmodel id、base URLデフォルト、
または認証ゲート付きモデルメタデータを所有する場合は、`catalog`を使ってください。

`catalog.order`は、プラグインのカタログがOpenClawの
組み込み暗黙プロバイダーに対してどのタイミングでマージされるかを制御します。

- `simple`: 単純なAPIキーまたはenv駆動プロバイダー
- `profile`: auth profileが存在すると現れるプロバイダー
- `paired`: 複数の関連providerエントリーを合成するプロバイダー
- `late`: 最終パス。他の暗黙プロバイダーの後

後のプロバイダーがキー衝突時に勝つため、プラグインは
同じprovider idを持つ組み込みproviderエントリーを意図的に上書きできます。

互換性:

- `discovery`はレガシーエイリアスとして引き続き動作します
- `catalog`と`discovery`の両方が登録されている場合、OpenClawは`catalog`を使います

## 読み取り専用チャネル検査

プラグインがチャネルを登録する場合は、
`resolveAccount(...)`と並んで
`plugin.config.inspectAccount(cfg, accountId)`の実装を優先してください。

理由:

- `resolveAccount(...)`はランタイム経路です。認証情報が
  完全に具体化されていることを前提にでき、必要なシークレットが不足していれば
  即座に失敗して構いません。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`、およびdoctor / config
  修復フローのような読み取り専用コマンド経路では、
  設定を説明するだけのためにランタイム認証情報を具体化する必要はありません。

推奨される`inspectAccount(...)`の挙動:

- 記述的なaccount状態のみを返す
- `enabled`と`configured`を保持する
- 関連する場合は、認証情報のsource / statusフィールドを含める。例:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の利用可能性を報告するためだけに、生のtoken値を返す必要はありません。
  `tokenStatus: "available"`（および対応するsourceフィールド）を返せば、
  status系コマンドには十分です。
- 認証情報がSecretRef経由で設定されているが、現在のコマンド経路では利用できない場合は
  `configured_unavailable`を使う

これにより、読み取り専用コマンドはクラッシュしたり、
accountが未設定だと誤報したりする代わりに、
「設定されているが、このコマンド経路では利用できない」と報告できます。

## パッケージパック

プラグインディレクトリには、`openclaw.extensions`を含む`package.json`を置けます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリーは1つのプラグインになります。packが複数の拡張を列挙している場合、
plugin idは`name/<fileBase>`になります。

プラグインがnpm依存関係をimportする場合は、そのディレクトリ内に
`node_modules`が使えるようインストールしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての`openclaw.extensions`エントリーは、
symlink解決後もプラグインディレクトリ内に留まる必要があります。パッケージディレクトリの外へ
逃げるエントリーは拒否されます。

セキュリティ上の注意: `openclaw plugins install`は、プラグイン依存関係を
`npm install --omit=dev --ignore-scripts`でインストールします（ライフサイクルスクリプトなし、ランタイムでdev dependencyなし）。プラグイン依存
ツリーは「pure JS/TS」に保ち、
`postinstall`ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry`は軽量のsetup専用モジュールを指せます。
OpenClawが無効なチャネルプラグイン向けにsetupサーフェスを必要とする場合、または
チャネルプラグインが有効でも未設定の場合、
完全なプラグインエントリーの代わりに`setupEntry`を読み込みます。これにより、
メインプラグインエントリーがツール、フック、その他のランタイム専用
コードも配線している場合に、起動とsetupを軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
は、チャネルがすでに設定済みであっても、
gatewayのpre-listen起動フェーズ中にチャネルプラグインを同じ`setupEntry`経路へ
オプトインさせることができます。

これを使うのは、`setupEntry`がgatewayがlisten開始前に
存在すべき起動サーフェスを完全にカバーしている場合だけにしてください。
実際には、setup entryが起動に依存する
すべてのチャネル所有ケイパビリティを登録する必要があることを意味します。たとえば:

- チャネル登録そのもの
- gatewayがlisten開始前に利用可能であるべき任意のHTTPルート
- 同じウィンドウ内で存在すべき任意のgatewayメソッド、ツール、またはサービス

完全エントリーが依然として必要な起動ケイパビリティを所有している場合は、
このフラグを有効にしないでください。デフォルト挙動のままにし、
起動時にOpenClawが完全エントリーを読み込むようにしてください。

バンドル済みチャネルは、完全なチャネルランタイムが読み込まれる前に
コアが参照できるsetup専用コントラクトサーフェスhelperも公開できます。現在のsetup
promotionサーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全なプラグインエントリーを読み込まずに、レガシー単一accountチャネル
configを`channels.<id>.accounts.*`へ昇格する必要があるときに
そのサーフェスを使います。現在のバンドル例はMatrixです。これは、
名前付きaccountがすでに存在する場合にauth / bootstrapキーだけを
名前付き昇格accountへ移動し、
常に`accounts.default`を作成するのではなく、
設定済みの非canonical default-accountキーを保持できます。

これらのsetup patch adapterにより、バンドル済みコントラクトサーフェス検出は遅延のままです。import
時は軽量に保たれ、promotionサーフェスはモジュールimport時に
バンドル済みチャネル起動へ再突入するのではなく、最初の使用時にのみ読み込まれます。

それらの起動サーフェスにgateway RPCメソッドが含まれる場合は、
プラグイン固有プレフィックスに保ってください。コア管理namespace（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は引き続き予約済みであり、
プラグインがより狭いスコープを要求しても、常に`operator.admin`へ解決されます。

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

### チャネルカタログメタデータ

チャネルプラグインは、`openclaw.channel`を通じてsetup / discoveryメタデータを、
`openclaw.install`を通じてインストールヒントを告知できます。これによりコアのカタログは
データフリーに保たれます。

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

最小例以外で有用な`openclaw.channel`フィールド:

- `detailLabel`: より豊かなcatalog / statusサーフェス向けの二次ラベル
- `docsLabel`: docsリンクのリンクテキスト上書き
- `preferOver`: このcatalogエントリーが上位に置くべき低優先度plugin / channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection-surfaceの文言制御
- `markdownCapable`: outbound整形判断のために、チャネルをmarkdown対応として示す
- `showConfigured`: `false`に設定すると、configured-channel一覧サーフェスからそのチャネルを隠す
- `quickstartAllowFrom`: チャネルを標準クイックスタート`allowFrom`フローへオプトインする
- `forceAccountBinding`: accountが1つしかなくても明示的account bindingを必須にする
- `preferSessionLookupForAnnounceTarget`: announce target解決時にsession lookupを優先する

OpenClawは**外部チャネルカタログ**（たとえばMPM
registry export）もマージできます。次のいずれかにJSONファイルを置いてください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または`OPENCLAW_PLUGIN_CATALOG_PATHS`（または`OPENCLAW_MPM_CATALOG_PATHS`）に、
1つ以上のJSONファイルを指させてください（カンマ / セミコロン / `PATH`区切り）。
各ファイルは`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`を含む必要があります。parserは
`"entries"`キーのレガシーエイリアスとして`"packages"`または`"plugins"`も受け付けます。

## コンテキストエンジンプラグイン

コンテキストエンジンプラグインは、取り込み、組み立て、
圧縮のためのセッションコンテキストオーケストレーションを所有します。
プラグインから`api.registerContextEngine(id, factory)`で登録し、
アクティブエンジンは`plugins.slots.contextEngine`で選択します。

これは、プラグインがデフォルトのコンテキスト
パイプラインを単にmemory searchやフックで追加するだけでなく、
置き換えたり拡張したりする必要がある場合に使ってください。

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

エンジンが圧縮アルゴリズムを**所有しない**場合でも、`compact()`
は実装し、明示的に委譲してください。

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 新しいケイパビリティの追加

プラグインが現在のAPIに収まらない挙動を必要とする場合は、
プライベートな直接参照でプラグインシステムを迂回しないでください。不足しているケイパビリティを追加してください。

推奨される順序:

1. コアコントラクトを定義する
   コアが所有すべき共有挙動を決めてください。ポリシー、フォールバック、configマージ、
   ライフサイクル、チャネル向けセマンティクス、およびランタイムヘルパーの形状です。
2. 型付きプラグイン登録 / ランタイムサーフェスを追加する
   最小限で有用な
   型付きケイパビリティサーフェスで`OpenClawPluginApi`および / または`api.runtime`を拡張します。
3. コア + チャネル / 機能コンシューマーを配線する
   チャネルと機能プラグインは、ベンダー実装を直接importするのではなく、
   コアを通じて新しいケイパビリティを消費するべきです。
4. ベンダー実装を登録する
   その後、ベンダープラグインがそのケイパビリティに対してバックエンドを登録します。
5. コントラクトカバレッジを追加する
   所有権と登録形状が時間とともに明示的に保たれるよう、テストを追加します。

これが、OpenClawが1つの
プロバイダーの世界観にハードコードされることなく、意見ある設計を保つ方法です。具体的なファイルチェックリストと実例については、
[Capability Cookbook](/tools/capability-cookbook)を参照してください。

### ケイパビリティチェックリスト

新しいケイパビリティを追加するとき、実装では通常、
これらのサーフェスをまとめて触るべきです。

- `src/<capability>/types.ts`のコアコントラクト型
- `src/<capability>/runtime.ts`のコアランナー / ランタイムヘルパー
- `src/plugins/types.ts`のプラグインAPI登録サーフェス
- `src/plugins/registry.ts`のプラグインレジストリ配線
- 機能 / チャネル
  プラグインがそれを消費する必要がある場合の`src/plugins/runtime/*`内のプラグインランタイム公開
- `src/test-utils/plugin-registration.ts`のcapture / test helper
- `src/plugins/contracts/registry.ts`の所有権 / コントラクト検証
- `docs/`の運用者 / プラグイン向けドキュメント

これらのサーフェスのどれかが欠けている場合、それは通常、
そのケイパビリティがまだ完全には統合されていない兆候です。

### ケイパビリティテンプレート

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

コントラクトテストパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これによりルールは単純に保たれます。

- コアがケイパビリティコントラクト + オーケストレーションを所有する
- ベンダープラグインがベンダー実装を所有する
- 機能 / チャネルプラグインがランタイムヘルパーを消費する
- コントラクトテストが所有権を明示的に保つ
