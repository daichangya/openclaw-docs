---
read_when:
    - プロバイダーランタイムフック、チャネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序やレジストリ状態のデバッグ
    - 新しい Plugin capability またはコンテキストエンジン Plugin の追加
summary: 'Plugin アーキテクチャの内部: ロードパイプライン、レジストリ、ランタイムフック、HTTPルート、リファレンステーブル'
title: Plugin アーキテクチャの内部
x-i18n:
    generated_at: "2026-04-24T08:58:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

公開 capability モデル、Plugin の形状、所有権/実行契約については、[Plugin architecture](/ja-JP/plugins/architecture) を参照してください。このページは、内部メカニズムのリファレンスです。ロードパイプライン、レジストリ、ランタイムフック、Gateway HTTPルート、インポートパス、スキーマテーブルを扱います。

## ロードパイプライン

起動時に、OpenClaw はおおよそ次の処理を行います。

1. 候補となる Plugin ルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）を正規化する
5. 各候補について有効化するかどうかを決定する
6. 有効なネイティブモジュールをロードする: ビルド済みバンドルモジュールはネイティブローダーを使用し、
   未ビルドのネイティブ Plugin は jiti を使用する
7. ネイティブな `register(api)` フックを呼び出し、登録内容を Plugin レジストリに収集する
8. レジストリをコマンド/ランタイムの各サーフェスに公開する

<Note>
`activate` は `register` のレガシーエイリアスです。ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じタイミングで呼び出します。バンドル済み Plugin はすべて `register` を使用しています。新しい Plugin では `register` を推奨します。
</Note>

安全性ゲートは、ランタイム実行**前**に行われます。候補は、
エントリが Plugin ルート外に出ている場合、パスが world-writable の場合、または
バンドルされていない Plugin でパス所有権が不審に見える場合にブロックされます。

### マニフェスト優先の動作

マニフェストは、コントロールプレーンにおける信頼できる唯一の情報源です。OpenClaw はこれを使って次を行います。

- Plugin を識別する
- 宣言されたチャネル/Skills/設定スキーマまたはバンドル capability を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI のラベル/プレースホルダーを補強する
- インストール/カタログのメタデータを表示する
- Plugin ランタイムをロードせずに軽量な有効化記述子とセットアップ記述子を保持する

ネイティブ Plugin では、ランタイムモジュールがデータプレーン部分です。フック、ツール、コマンド、またはプロバイダーフローのような実際の動作を登録します。

オプションのマニフェスト `activation` および `setup` ブロックはコントロールプレーンに留まります。
これらは有効化計画とセットアップ検出のためのメタデータ専用記述子であり、
ランタイム登録、`register(...)`、または `setupEntry` の代替ではありません。
最初のライブ有効化コンシューマーは現在、マニフェストのコマンド、チャネル、プロバイダーヒントを使用して、
より広いレジストリ実体化の前に Plugin ロードを絞り込みます。

- CLIロードは、要求された主要コマンドを所有する Plugin に絞り込みます
- チャネルセットアップ/Plugin 解決は、要求された
  チャネルidを所有する Plugin に絞り込みます
- 明示的なプロバイダーセットアップ/ランタイム解決は、要求された
  プロバイダーidを所有する Plugin に絞り込みます

有効化プランナーは、既存呼び出し元向けの ids-only API と、
新しい診断向けの plan API の両方を公開します。plan エントリは、なぜその Plugin が選ばれたかを報告し、
明示的な `activation.*` プランナーヒントと、`providers`、`channels`、`commandAliases`、
`setup.providers`、`contracts.tools`、フックなどのマニフェスト所有権フォールバックを分離します。
この理由分離が互換性境界です。既存の Plugin メタデータはそのまま機能し、
新しいコードはランタイムロードの意味論を変えずに、広いヒントや
フォールバック動作を検出できます。

セットアップ検出では現在、`setup-api` へフォールバックする前に、
`setup.providers` や `setup.cliBackends` のような記述子所有idを優先して候補 Plugin を絞り込みます。
これは、セットアップ時ランタイムフックがまだ必要な Plugin のためです。
検出された複数の Plugin が同じ正規化済みセットアッププロバイダーまたは CLI バックエンド
id を主張した場合、セットアップ検索は検出順に依存する代わりに、
その曖昧な所有者を拒否します。

### ローダーがキャッシュするもの

OpenClaw は、短期間のインプロセスキャッシュを次のために保持します。

- 検出結果
- マニフェストレジストリデータ
- ロード済み Plugin レジストリ

これらのキャッシュは、バースト的な起動や繰り返しコマンドのオーバーヘッドを減らします。これらは
永続化ではなく、短命な性能キャッシュとして考えるのが安全です。

性能に関する注記:

- これらのキャッシュを無効にするには、`OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定します。
- キャッシュ時間は、`OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` と
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整します。

## レジストリモデル

ロード済み Plugin は、コアのランダムなグローバル状態を直接変更しません。代わりに、
中央の Plugin レジストリへ登録します。

レジストリは次を追跡します。

- Plugin レコード（識別子、ソース、オリジン、状態、診断）
- ツール
- レガシーフックと型付きフック
- チャネル
- プロバイダー
- Gateway RPCハンドラー
- HTTPルート
- CLIレジストラ
- バックグラウンドサービス
- Plugin 所有コマンド

その後、コア機能は Plugin モジュールと直接やり取りする代わりに、
このレジストリから読み取ります。これにより、ロードは一方向に保たれます。

- Plugin モジュール -> レジストリ登録
- コアランタイム -> レジストリ消費

この分離は保守性のために重要です。つまり、ほとんどのコアサーフェスは
「レジストリを読む」という 1 つの統合ポイントだけを必要とし、
「すべての Plugin モジュールを特別扱いする」必要はありません。

## 会話バインディングコールバック

会話をバインドする Plugin は、承認が解決されたときに反応できます。

バインド要求が承認または拒否された後にコールバックを受け取るには、
`api.onConversationBindingResolved(...)` を使用します。

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // この Plugin + 会話に対するバインディングが存在するようになった。
        console.log(event.binding?.conversationId);
        return;
      }

      // 要求は拒否された。ローカルの保留状態を消去する。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

コールバックペイロードのフィールド:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認済み要求に対して解決されたバインディング
- `request`: 元の要求サマリー、デタッチヒント、送信者id、
  会話メタデータ

このコールバックは通知専用です。誰が会話をバインドできるかは変更せず、
コアの承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダー Plugin には 3 つのレイヤーがあります。

- **マニフェストメタデータ**: 安価なランタイム前参照のための
  `providerAuthEnvVars`、`providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`
- **設定時フック**: `catalog`（レガシーの `discovery`）および
  `applyConfigDefaults`
- **ランタイムフック**: 認証、モデル解決、
  ストリームラップ、thinkingレベル、再生ポリシー、使用量エンドポイントをカバーする 40 以上のオプションフック。完全な一覧は
  [フック順序と使い方](#hook-order-and-usage) を参照してください。

OpenClaw は、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、
ツールポリシーを引き続き所有します。これらのフックは、プロバイダー固有動作のための拡張サーフェスであり、
完全にカスタムな推論転送を必要としません。

プロバイダーに env ベースの認証情報があり、汎用の認証/状態/モデルピッカー経路から
Plugin ランタイムをロードせずに見えるようにしたい場合は、マニフェストの `providerAuthEnvVars` を使用してください。
あるプロバイダーidが別のプロバイダーidの env var、認証プロファイル、
設定ベース認証、APIキーオンボーディング選択を再利用する必要がある場合は、
マニフェストの `providerAuthAliases` を使用してください。オンボーディング/認証選択の
CLIサーフェスが、Plugin ランタイムをロードせずにプロバイダーの choice id、
グループラベル、単純な1フラグ認証配線を知る必要がある場合は、
マニフェストの `providerAuthChoices` を使用してください。プロバイダーランタイムの
`envVars` は、オンボーディングラベルや OAuth
client-id/client-secret セットアップ変数のような、運用者向けヒント用に維持してください。

チャネルに env 駆動の認証またはセットアップがあり、汎用の
シェルenvフォールバック、設定/状態チェック、またはセットアッププロンプトから
チャネルランタイムをロードせずに見えるようにしたい場合は、マニフェストの `channelEnvVars` を使用してください。

### フック順序と使い方

モデル/プロバイダー Plugin では、OpenClaw はおおよそ次の順序でフックを呼び出します。
「When to use」列は、素早く判断するためのガイドです。

| # | フック | 役割 | 使用する場面 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `catalog` | `models.json` 生成時に、プロバイダー設定を `models.providers` に公開する | プロバイダーがカタログまたはベースURLのデフォルトを所有している場合 |
| 2 | `applyConfigDefaults` | 設定の具体化時に、プロバイダー所有のグローバル設定デフォルトを適用する | デフォルトが認証モード、env、またはプロバイダーのモデルファミリーの意味論に依存する場合 |
| -- | _(組み込みモデル検索)_ | OpenClaw はまず通常のレジストリ/カタログ経路を試す | _(Plugin フックではありません)_ |
| 3 | `normalizeModelId` | 検索前に、レガシーまたはプレビューのモデルidエイリアスを正規化する | 正式なモデル解決の前に、プロバイダーがエイリアスクリーンアップを所有している場合 |
| 4 | `normalizeTransport` | 汎用モデル組み立ての前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する | 同じ転送ファミリー内のカスタムプロバイダーidに対する転送クリーンアップをプロバイダーが所有している場合 |
| 5 | `normalizeConfig` | ランタイム/プロバイダー解決の前に、`models.providers.<id>` を正規化する | Plugin とともに置くべき設定クリーンアップがプロバイダーに必要な場合。バンドル済みGoogleファミリーヘルパーは、サポートされるGoogle設定エントリのバックストップも行います |
| 6 | `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブのストリーミング使用量互換リライトを適用する | エンドポイント駆動のネイティブなストリーミング使用量メタデータ修正がプロバイダーに必要な場合 |
| 7 | `resolveConfigApiKey` | ランタイム認証ロード前に、設定プロバイダー向けのenv-marker認証を解決する | プロバイダー所有のenv-marker APIキー解決がある場合。`amazon-bedrock` には、ここで組み込みのAWS env-marker リゾルバーもあります |
| 8 | `resolveSyntheticAuth` | 平文を永続化せずに、ローカル/セルフホストまたは設定ベースの認証を表面化する | 合成/ローカル認証マーカーでプロバイダーを動作させられる場合 |
| 9 | `resolveExternalAuthProfiles` | プロバイダー所有の外部認証プロファイルをオーバーレイする。CLI/アプリ所有資格情報のデフォルト `persistence` は `runtime-only` | コピーした更新トークンを永続化せずに、外部認証資格情報をプロバイダーが再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言してください |
| 10 | `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーを、env/設定ベース認証より後ろに下げる | 優先されるべきでない合成プレースホルダープロファイルをプロバイダーが保存する場合 |
| 11 | `resolveDynamicModel` | ローカルレジストリにまだないプロバイダー所有モデルid向けの同期フォールバック | 任意の上流モデルidをプロバイダーが受け入れる場合 |
| 12 | `prepareDynamicModel` | 非同期ウォームアップ後に、`resolveDynamicModel` を再度実行する | 未知のidを解決する前に、プロバイダーがネットワークメタデータを必要とする場合 |
| 13 | `normalizeResolvedModel` | 埋め込みランナーが解決済みモデルを使用する前の最終リライト | コア転送を使い続けつつ、プロバイダーが転送リライトを必要とする場合 |
| 14 | `contributeResolvedModelCompat` | 別の互換転送の背後にあるベンダーモデル向けの互換フラグを追加する | プロバイダー自体を引き継がずに、プロキシ転送上で自前モデルを認識する場合 |
| 15 | `capabilities` | 共有コアロジックで使われる、プロバイダー所有のトランスクリプト/ツールメタデータ | トランスクリプト/プロバイダーファミリーの癖がプロバイダーに必要な場合 |
| 16 | `normalizeToolSchemas` | 埋め込みランナーが見る前に、ツールスキーマを正規化する | 転送ファミリーのスキーマクリーンアップがプロバイダーに必要な場合 |
| 17 | `inspectToolSchemas` | 正規化後に、プロバイダー所有のスキーマ診断を表面化する | コアにプロバイダー固有ルールを教えずに、キーワード警告を出したい場合 |
| 18 | `resolveReasoningOutputMode` | ネイティブかタグ付きかのreasoning出力契約を選択する | ネイティブフィールドの代わりに、タグ付きreasoning/最終出力がプロバイダーに必要な場合 |
| 19 | `prepareExtraParams` | 汎用ストリームオプションラッパー前のリクエストパラメータ正規化 | デフォルトのリクエストパラメータや、プロバイダーごとのパラメータクリーンアップが必要な場合 |
| 20 | `createStreamFn` | 通常のストリーム経路を完全にカスタム転送で置き換える | 単なるラッパーではなく、カスタムのワイヤープロトコルが必要な場合 |
| 21 | `wrapStreamFn` | 汎用ラッパー適用後のストリームラッパー | カスタム転送なしで、リクエストヘッダー/ボディ/モデル互換ラッパーが必要な場合 |
| 22 | `resolveTransportTurnState` | ネイティブなターン単位の転送ヘッダーまたはメタデータを付与する | 汎用転送で、プロバイダーネイティブなターン識別を送りたい場合 |
| 23 | `resolveWebSocketSessionPolicy` | ネイティブWebSocketヘッダーまたはセッションクールダウンポリシーを付与する | 汎用WS転送で、セッションヘッダーやフォールバックポリシーを調整したい場合 |
| 24 | `formatApiKey` | 認証プロファイル整形子: 保存済みプロファイルをランタイムの `apiKey` 文字列にする | 追加の認証メタデータをプロバイダーが保存し、カスタムのランタイムトークン形式を必要とする場合 |
| 25 | `refreshOAuth` | カスタム更新エンドポイントまたは更新失敗ポリシー向けのOAuth更新オーバーライド | プロバイダーが共有 `pi-ai` リフレッシャーに適合しない場合 |
| 26 | `buildAuthDoctorHint` | OAuth更新失敗時に追加される修復ヒント | 更新失敗後に、プロバイダー所有の認証修復ガイダンスが必要な場合 |
| 27 | `matchesContextOverflowError` | プロバイダー所有のコンテキストウィンドウ超過マッチャー | 汎用ヒューリスティックでは見逃す生の超過エラーがプロバイダーにある場合 |
| 28 | `classifyFailoverReason` | プロバイダー所有のフェイルオーバー理由分類 | 生のAPI/転送エラーを、レート制限/過負荷などへプロバイダーがマッピングできる場合 |
| 29 | `isCacheTtlEligible` | プロキシ/バックホールプロバイダー向け prompt-cache ポリシー | プロキシ固有のキャッシュTTLゲーティングが必要な場合 |
| 30 | `buildMissingAuthMessage` | 汎用の認証不足回復メッセージの置き換え | プロバイダー固有の認証不足回復ヒントが必要な場合 |
| 31 | `suppressBuiltInModel` | 古い上流モデルの抑制と、任意のユーザー向けエラーヒント | 古い上流行を隠したり、ベンダーヒントに置き換えたりする必要がある場合 |
| 32 | `augmentModelCatalog` | 検出後に追加される合成/最終カタログ行 | `models list` やピッカーで、前方互換の合成行がプロバイダーに必要な場合 |
| 33 | `resolveThinkingProfile` | モデル固有の `/think` レベルセット、表示ラベル、デフォルト | 選択したモデル向けに、カスタムの thinking 段階または二値ラベルをプロバイダーが公開する場合 |
| 34 | `isBinaryThinking` | on/off reasoning トグル互換フック | reasoning の on/off 二値のみをプロバイダーが公開する場合 |
| 35 | `supportsXHighThinking` | `xhigh` reasoning サポート互換フック | モデルの一部でのみ `xhigh` を有効にしたい場合 |
| 36 | `resolveDefaultThinkingLevel` | デフォルト `/think` レベル互換フック | モデルファミリー向けのデフォルト `/think` ポリシーをプロバイダーが所有する場合 |
| 37 | `isModernModelRef` | ライブプロファイルフィルターとスモーク選択向けのモダンモデルマッチャー | ライブ/スモークの優先モデルマッチングをプロバイダーが所有している場合 |
| 38 | `prepareRuntimeAuth` | 推論直前に、設定済み資格情報を実際のランタイムトークン/キーへ交換する | トークン交換または短命なリクエスト資格情報がプロバイダーに必要な場合 |
| 39 | `resolveUsageAuth` | `/usage` および関連する状態サーフェス向けの使用量/課金資格情報を解決する | カスタムの使用量/クォータトークン解析、または別の使用量資格情報が必要な場合 |
| 40 | `fetchUsageSnapshot` | 認証解決後に、プロバイダー固有の使用量/クォータスナップショットを取得して正規化する | プロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要な場合 |
| 41 | `createEmbeddingProvider` | メモリ/検索向けの、プロバイダー所有 embedding アダプターを構築する | メモリ embedding の動作をプロバイダー Plugin とともに置くべき場合 |
| 42 | `buildReplayPolicy` | そのプロバイダー向けのトランスクリプト処理を制御するリプレイポリシーを返す | カスタムのトランスクリプトポリシー（例: thinking ブロックの除去）が必要な場合 |
| 43 | `sanitizeReplayHistory` | 汎用トランスクリプトクリーンアップ後に、リプレイ履歴を書き換える | 共有 Compaction ヘルパーを超える、プロバイダー固有のリプレイ書き換えが必要な場合 |
| 44 | `validateReplayTurns` | 埋め込みランナー前の最終的なリプレイターン検証または整形 | 汎用サニタイズ後に、より厳密なターン検証がプロバイダー転送で必要な場合 |
| 45 | `onModelSelected` | プロバイダー所有の選択後副作用を実行する | モデルがアクティブになったときに、テレメトリまたはプロバイダー所有状態が必要な場合 |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず
一致したプロバイダー Plugin を確認し、その後、実際にモデルidまたは
転送/設定を変更するフック対応の他のプロバイダー Plugin へフォールスルーします。
これにより、呼び出し側がどのバンドル済み Plugin がリライトを所有しているかを知らなくても、
エイリアス/互換プロバイダー shim が機能します。
サポートされるGoogleファミリー設定エントリをどのプロバイダーフックもリライトしない場合でも、
バンドル済みGoogle設定ノーマライザーがその互換クリーンアップを引き続き適用します。

プロバイダーに完全にカスタムなワイヤープロトコルまたはカスタムのリクエスト実行器が必要な場合、
それは別種の拡張です。これらのフックは、
OpenClaw の通常の推論ループ上で引き続き動作するプロバイダー動作向けです。

### プロバイダーの例

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

バンドル済みプロバイダー Plugin は、上記のフックを組み合わせて、各ベンダーのカタログ、
認証、thinking、リプレイ、使用量の要件に対応します。信頼できるフックセットは
各 Plugin の `extensions/` 配下にあり、このページは一覧をそのまま反映するのではなく、
形状を説明しています。

<AccordionGroup>
  <Accordion title="パススルーカタログプロバイダー">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録し、
    OpenClaw の静的カタログより前に上流モデルidを表面化できるようにしています。
  </Accordion>
  <Accordion title="OAuthおよび使用量エンドポイントプロバイダー">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は
    `prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` +
    `fetchUsageSnapshot` と組み合わせ、トークン交換と `/usage` 統合を所有します。
  </Accordion>
  <Accordion title="リプレイおよびトランスクリプトクリーンアップのファミリー">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各プロバイダーは
    各 Plugin でクリーンアップを再実装する代わりに、
    `buildReplayPolicy` でトランスクリプトポリシーへオプトインできます。
  </Accordion>
  <Accordion title="カタログ専用プロバイダー">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine`
    は `catalog` のみを登録し、共有の推論ループに乗ります。
  </Accordion>
  <Accordion title="Anthropic固有のストリームヘルパー">
    ベータヘッダー、`/fast` / `serviceTier`、`context1m` は、
    汎用SDKではなく、Anthropic Plugin の公開 `api.ts` / `contract-api.ts` 境界
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Plugin は、`api.runtime` 経由で選択されたコアヘルパーへアクセスできます。TTS の場合:

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

注記:

- `textToSpeech` は、ファイル/ボイスノート向けサーフェス用の通常のコアTTS出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダー選択を使用します。
- PCM音声バッファー + サンプルレートを返します。Plugin 側でプロバイダー向けに再サンプリング/エンコードする必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の音声ピッカーやセットアップフローに使用してください。
- 音声一覧には、ロケール、性別、パーソナリティタグなど、プロバイダー認識型ピッカー向けのより豊かなメタデータを含められます。
- 現在、OpenAI と ElevenLabs は telephony をサポートしています。Microsoft はサポートしていません。

Plugin は `api.registerSpeechProvider(...)` 経由で音声プロバイダーも登録できます。

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

注記:

- TTSポリシー、フォールバック、返信配信はコアに残してください。
- ベンダー所有の合成動作には speech provider を使用してください。
- レガシーな Microsoft `edge` 入力は `microsoft` プロバイダーidに正規化されます。
- 推奨される所有モデルは企業指向です。OpenClaw がこれらの
  capability 契約を追加していく中で、1つのベンダー Plugin が
  テキスト、音声、画像、将来のメディアプロバイダーを所有できます。

画像/音声/動画理解では、Plugin は汎用のキー/値バッグではなく、
1つの型付き media-understanding provider を登録します。

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注記:

- オーケストレーション、フォールバック、設定、チャネル配線はコアに残してください。
- ベンダー動作はプロバイダー Plugin 内に残してください。
- 加法的拡張は型付きのままにしてください: 新しい任意メソッド、新しい任意の
  結果フィールド、新しい任意の capability。
- 動画生成もすでに同じパターンに従っています:
  - コアが capability 契約とランタイムヘルパーを所有する
  - ベンダー Plugin が `api.registerVideoGenerationProvider(...)` を登録する
  - 機能/チャネル Plugin が `api.runtime.videoGeneration.*` を利用する

media-understanding のランタイムヘルパーには、Plugin から次を呼び出せます。

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

音声文字起こしには、Plugin は media-understanding ランタイム
または古い STT エイリアスのどちらも使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME を確実に推定できない場合は任意:
  mime: "audio/ogg",
});
```

注記:

- `api.runtime.mediaUnderstanding.*` は、
  画像/音声/動画理解向けの推奨共有サーフェスです。
- コアの media-understanding 音声設定（`tools.media.audio`）とプロバイダーフォールバック順序を使用します。
- 文字起こし出力が生成されなかった場合（たとえばスキップ/非対応入力）には `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換エイリアスとして引き続き残ります。

Plugin は `api.runtime.subagent` を通じてバックグラウンド subagent 実行も起動できます。

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注記:

- `provider` と `model` は、実行ごとの任意の上書きであり、永続的なセッション変更ではありません。
- OpenClaw は、信頼された呼び出し元に対してのみこれらの上書きフィールドを受け付けます。
- Plugin 所有のフォールバック実行では、運用者が `plugins.entries.<id>.subagent.allowModelOverride: true` でオプトインする必要があります。
- `plugins.entries.<id>.subagent.allowedModels` を使用すると、信頼された Plugin を特定の正規 `provider/model` ターゲットに制限できます。`"*"` を指定すると、任意のターゲットを明示的に許可します。
- 信頼されていない Plugin の subagent 実行も動作しますが、上書き要求は暗黙にフォールバックされるのではなく拒否されます。

Web検索では、Plugin はエージェントツール配線へ直接入る代わりに、
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

Plugin は
`api.registerWebSearchProvider(...)` 経由で web-search provider も登録できます。

注記:

- プロバイダー選択、資格情報解決、共有リクエスト意味論はコアに残してください。
- ベンダー固有の検索転送には web-search provider を使用してください。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せず検索動作を必要とする機能/チャネル Plugin 向けの推奨共有サーフェスです。

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

- `generate(...)`: 設定された画像生成プロバイダーチェーンを使用して画像を生成します。
- `listProviders(...)`: 利用可能な画像生成プロバイダーとその capability を一覧表示します。

## Gateway HTTPルート

Plugin は `api.registerHttpRoute(...)` で HTTPエンドポイントを公開できます。

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

- `path`: Gateway HTTPサーバー配下のルートパス。
- `auth`: 必須です。通常のGateway認証を要求するには `"gateway"` を、
  Plugin 管理認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じ Plugin が自分の既存ルート登録を置き換えることを許可します。
- `handler`: ルートがリクエストを処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除されており、Plugin ロードエラーの原因になります。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 正確に同じ `path + match` の競合は、`replaceExisting: true` でない限り拒否され、ある Plugin が別の Plugin のルートを置き換えることはできません。
- `auth` レベルが異なる重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ auth レベル内だけにしてください。
- `auth: "plugin"` ルートは、運用者ランタイムスコープを自動では**受け取りません**。これは特権付き Gateway ヘルパー呼び出しではなく、Plugin 管理の Webhook/署名検証向けです。
- `auth: "gateway"` ルートは Gateway リクエストランタイムスコープ内で実行されますが、そのスコープは意図的に保守的です:
  - 共有シークレットの bearer 認証（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が `x-openclaw-scopes` を送信しても、Plugin ルートのランタイムスコープは `operator.write` に固定されます
  - 信頼されたID保持HTTPモード（たとえば `trusted-proxy` や、プライベート ingress 上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes` ヘッダーが明示的に存在する場合にのみそれを反映します
  - それらのID保持 Plugin ルートリクエストで `x-openclaw-scopes` がない場合、ランタイムスコープは `operator.write` にフォールバックします
- 実務上のルール: gateway-auth の Plugin ルートを暗黙の管理者サーフェスだと想定しないでください。ルートに管理者専用動作が必要なら、ID保持認証モードを要求し、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDKインポートパス

新しい Plugin を作成する際は、巨大な `openclaw/plugin-sdk` ルート
barrel ではなく、より狭いSDKサブパスを使用してください。主要なサブパス:

| サブパス | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Plugin 登録プリミティブ |
| `openclaw/plugin-sdk/channel-core` | チャネルエントリ/ビルドヘルパー |
| `openclaw/plugin-sdk/core` | 汎用の共有ヘルパーとアンブレラ契約 |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

チャネル Plugin は、狭い境界のファミリーから選びます。`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets`、`channel-actions` です。承認動作は、無関係な
Plugin フィールドへ混在させるのではなく、1つの `approvalCapability` 契約へ統合してください。
[Channel plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムと設定ヘルパーは、対応する `*-runtime` サブパス配下にあります
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` など）。

<Info>
`openclaw/plugin-sdk/channel-runtime` は非推奨です。古い Plugin 向けの
互換 shim です。新しいコードでは、より狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリポイント（バンドル済み Plugin パッケージルートごと）:

- `index.js` — バンドル済み Plugin エントリ
- `api.js` — ヘルパー/型 barrel
- `runtime-api.js` — ランタイム専用 barrel
- `setup-entry.js` — セットアップ Plugin エントリ

外部 Plugin は `openclaw/plugin-sdk/*` サブパスだけをインポートしてください。
コアから、または別の Plugin から、他の Plugin パッケージの `src/*` を
インポートしてはいけません。facade ロードされたエントリポイントは、
利用可能ならアクティブなランタイム設定スナップショットを優先し、その後
ディスク上の解決済み設定ファイルへフォールバックします。

`image-generation`、`media-understanding`、`speech` のような
capability 固有サブパスが存在するのは、現在バンドル済み Plugin がそれらを使っているためです。
これらは自動的に長期固定された外部契約ではありません。依存する場合は、
関連するSDKリファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票のような非メッセージプリミティブ向けに、
チャネル固有の `describeMessageTool(...)` スキーマ追加分を所有するべきです。
共有送信プレゼンテーションでは、プロバイダーネイティブなボタン、
コンポーネント、ブロック、カードフィールドの代わりに、汎用の `MessagePresentation` 契約を使用してください。
契約、フォールバックルール、プロバイダーマッピング、Plugin 作成者向けチェックリストについては
[Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ capability を通じてレンダリング可能な内容を宣言します。

- セマンティックなプレゼンテーションブロック（`text`、`context`、`divider`、`buttons`、`select`）用の `presentation`
- ピン留め配信要求用の `delivery-pin`

コアは、プレゼンテーションをネイティブにレンダリングするか、テキストへ劣化させるかを決定します。
汎用メッセージツールから、プロバイダーネイティブなUIエスケープハッチを公開しないでください。
レガシーなネイティブスキーマ向けの非推奨SDKヘルパーは既存の
サードパーティ Plugin のために引き続きエクスポートされていますが、新しい Plugin はそれらを使うべきではありません。

## チャネルターゲット解決

チャネル Plugin は、チャネル固有のターゲット意味論を所有するべきです。共有の
アウトバウンドホストは汎用のままにし、プロバイダールールには messaging アダプターサーフェスを使ってください。

- `messaging.inferTargetChatType({ to })` は、正規化済みターゲットを
  ディレクトリ検索前に `direct`、`group`、`channel` のどれとして扱うかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、
  入力をディレクトリ検索ではなく id 風解決へ直接進めるべきかどうかをコアへ伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または
  ディレクトリ不一致後にコアが最後のプロバイダー所有解決を必要とするときの、
  Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後の
  プロバイダー固有セッションルート構築を所有します。

推奨される分割:

- peers/groups を検索する前に行うべきカテゴリ決定には `inferTargetChatType` を使用する
- 「これを明示的/ネイティブなターゲットidとして扱う」判定には `looksLikeId` を使用する
- プロバイダー固有の正規化フォールバックには `resolveTarget` を使用し、
  広いディレクトリ検索には使わない
- チャットid、スレッドid、JID、ハンドル、ルームid のようなプロバイダーネイティブidは、
  汎用SDKフィールドではなく `target` 値またはプロバイダー固有パラメータ内に保持する

## 設定ベースのディレクトリ

設定からディレクトリエントリを導出する Plugin は、そのロジックを
Plugin 内に置き、`openclaw/plugin-sdk/directory-runtime` の
共有ヘルパーを再利用するべきです。

これは、次のような設定ベースの peers/groups がチャネルに必要な場合に使います。

- allowlist 駆動のDM peer
- 設定済みチャネル/グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作だけを扱います。

- クエリフィルタリング
- limit の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャネル固有のアカウント検査とid正規化は、Plugin 実装側に残すべきです。

## プロバイダーカタログ

プロバイダー Plugin は、
`registerProvider({ catalog: { run(...) { ... } } })` で推論用モデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むのと同じ形を返します。

- 1つのプロバイダーエントリ用の `{ provider }`
- 複数のプロバイダーエントリ用の `{ providers }`

プロバイダー固有のモデルid、ベースURLのデフォルト、または
認証ゲート付きモデルメタデータを Plugin が所有する場合は `catalog` を使用してください。

`catalog.order` は、OpenClaw の
組み込み暗黙プロバイダーに対して、Plugin のカタログがいつマージされるかを制御します。

- `simple`: 単純なAPIキーまたは env 駆動のプロバイダー
- `profile`: 認証プロファイルが存在すると現れるプロバイダー
- `paired`: 複数の関連プロバイダーエントリを合成するプロバイダー
- `late`: 他の暗黙プロバイダー後の最終パス

後から来るプロバイダーがキー競合時に勝つため、Plugin は
同じプロバイダーidを持つ組み込みプロバイダーエントリを意図的に上書きできます。

互換性:

- `discovery` はレガシーエイリアスとして引き続き動作します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します

## 読み取り専用チャネル検査

Plugin がチャネルを登録する場合は、
`resolveAccount(...)` と並行して `plugin.config.inspectAccount(cfg, accountId)` の実装を推奨します。

理由:

- `resolveAccount(...)` はランタイム経路です。資格情報が
  完全に具体化されている前提で動作でき、必要なシークレットがない場合は即座に失敗して構いません。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`、doctor/config
  修復フローのような読み取り専用コマンド経路では、
  設定を説明するだけのためにランタイム資格情報を具体化する必要があるべきではありません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返す
- `enabled` と `configured` を保持する
- relevant な場合は資格情報ソース/状態フィールドを含める。たとえば:
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 読み取り専用の
  可用性を報告するだけなら、生のトークン値を返す必要はありません。
  `tokenStatus: "available"`（および対応するソースフィールド）を返せば、
  status 系コマンドには十分です。
- 資格情報が SecretRef 経由で設定されているが、
  現在のコマンド経路では利用できない場合は `configured_unavailable` を使用する

これにより、読み取り専用コマンドはクラッシュしたり、
アカウントを未設定と誤報したりする代わりに、
「設定済みだがこのコマンド経路では利用不可」と報告できます。

## パッケージパック

Plugin ディレクトリには、`openclaw.extensions` を持つ `package.json` を含められます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリは1つの Plugin になります。pack が複数の extensions を列挙する場合、Plugin id
は `name/<fileBase>` になります。

Plugin が npm 依存関係をインポートする場合は、そのディレクトリで
`node_modules` が利用できるようにインストールしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` エントリは、シンボリックリンク解決後も
Plugin ディレクトリ内に留まる必要があります。パッケージディレクトリ外へ出るエントリは
拒否されます。

セキュリティ注記: `openclaw plugins install` は、Plugin 依存関係を
`npm install --omit=dev --ignore-scripts` でインストールします（ライフサイクルスクリプトなし、ランタイム時に dev dependencies なし）。Plugin の依存関係ツリーは
「pure JS/TS」に保ち、`postinstall` ビルドが必要なパッケージは避けてください。

任意: `openclaw.setupEntry` は軽量なセットアップ専用モジュールを指せます。
OpenClaw が無効なチャネル Plugin 向けにセットアップサーフェスを必要とする場合、または
チャネル Plugin が有効でもまだ未設定の場合、
完全な Plugin エントリの代わりに `setupEntry` をロードします。これにより、
メインの Plugin エントリがツール、フック、その他ランタイム専用
コードも配線している場合に、起動とセットアップを軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
を使うと、Gateway の
pre-listen 起動フェーズ中に、チャネルがすでに設定済みでも同じ `setupEntry` 経路へ
チャネル Plugin をオプトインできます。

これを使うのは、`setupEntry` が Gateway の待ち受け開始前に
存在しなければならない起動サーフェスを完全にカバーしている場合だけにしてください。実際には、
セットアップエントリが、起動が依存するすべてのチャネル所有 capability を登録する必要があります。たとえば:

- チャネル登録そのもの
- Gateway が待ち受け開始する前に利用可能でなければならない HTTPルート
- 同じ時間帯に存在していなければならない Gateway メソッド、ツール、またはサービス

完全エントリがまだ必須の起動 capability を1つでも所有しているなら、
このフラグを有効にしないでください。デフォルト動作のままにし、
起動中は OpenClaw に完全エントリをロードさせてください。

バンドル済みチャネルは、完全なチャネルランタイムがロードされる前にコアが
参照できる、セットアップ専用の contract-surface ヘルパーも公開できます。現在のセットアップ
昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、レガシーな単一アカウントチャネル設定を
完全な Plugin エントリをロードせずに `channels.<id>.accounts.*` へ昇格する必要があるときに、
このサーフェスを使います。現在のバンドル済み例は Matrix です。Matrix は、名前付きアカウントがすでに存在する場合に
認証/ブートストラップキーだけを名前付き昇格アカウントへ移動し、
常に `accounts.default` を作るのではなく、
設定済みの非正規デフォルトアカウントキーを保持できます。

これらのセットアップ patch アダプターにより、バンドル済み contract-surface 検出は遅延化されたままになります。
インポート時間は軽いままで、昇格サーフェスはモジュールインポート時に
バンドル済みチャネル起動へ再入する代わりに、最初の使用時にのみロードされます。

それらの起動サーフェスに Gateway RPCメソッドが含まれる場合は、
Plugin 固有プレフィックス上に置いてください。コア管理名前空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みであり、
Plugin がより狭いスコープを要求しても、常に `operator.admin` に解決されます。

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

チャネル Plugin は、`openclaw.channel` を通じて
セットアップ/検出メタデータを、`openclaw.install` を通じて
インストールヒントを告知できます。これにより、コアのカタログをデータフリーに保てます。

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
      "blurb": "Webhook bot を介したセルフホストの Nextcloud Talk チャット。",
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

最小例以外で有用な `openclaw.channel` フィールド:

- `detailLabel`: より豊かなカタログ/状態サーフェス向けの副次ラベル
- `docsLabel`: ドキュメントリンクのリンクテキストを上書きする
- `preferOver`: このカタログエントリが上位に来るべき、優先度の低い Plugin /チャネルid
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェス向けコピー制御
- `markdownCapable`: アウトバウンド書式決定で、そのチャネルを markdown 対応としてマークする
- `exposure.configured`: `false` に設定すると、設定済みチャネル一覧サーフェスからそのチャネルを隠す
- `exposure.setup`: `false` に設定すると、対話型セットアップ/設定ピッカーからそのチャネルを隠す
- `exposure.docs`: ドキュメントナビゲーションサーフェス向けに、そのチャネルを internal/private としてマークする
- `showConfigured` / `showInSetup`: 互換性のために引き続き受け付けられるレガシーエイリアスです。`exposure` を推奨します
- `quickstartAllowFrom`: 標準クイックスタート `allowFrom` フローへそのチャネルをオプトインする
- `forceAccountBinding`: アカウントが1つしか存在しない場合でも、明示的なアカウントバインディングを要求する
- `preferSessionLookupForAnnounceTarget`: 通知ターゲット解決時にセッション検索を優先する

OpenClaw は **外部チャネルカタログ**（たとえば MPM
レジストリエクスポート）もマージできます。次のいずれかに JSON ファイルを配置してください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で
1つ以上の JSON ファイルを指定してください（カンマ/セミコロン/`PATH` 区切り）。
各ファイルには
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`
を含める必要があります。パーサーは `"entries"` キーのレガシーエイリアスとして
`"packages"` または `"plugins"` も受け付けます。

生成されたチャネルカタログエントリとプロバイダーインストールカタログエントリは、
生の `openclaw.install` ブロックの隣に正規化済みインストールソース情報を公開します。
その正規化情報は、npm spec が正確なバージョンか浮動セレクターか、
期待される整合性メタデータが存在するか、ローカルソースパスも利用可能かどうかを示します。
コンシューマーは `installSource` を加法的な任意フィールドとして扱うべきです。これにより、
古い手作業エントリや互換 shim がそれを合成する必要はありません。
これにより、オンボーディングや診断は Plugin ランタイムをインポートせずに
ソースプレーン状態を説明できます。

公式の外部 npm エントリでは、正確な `npmSpec` と
`expectedIntegrity` を推奨します。素のパッケージ名や dist-tag も
互換性のために引き続き動作しますが、ソースプレーン警告が表面化するため、
既存 Plugin を壊さずに、カタログを pin 済み・整合性検証付きインストールへ
移行できます。オンボーディングがローカルカタログパスからインストールする場合、
`source: "path"` と、可能であればワークスペース相対の
`sourcePath` を持つ `plugins.installs` エントリを記録します。
絶対的な実運用ロードパスは `plugins.load.paths` に残り、
インストールレコードではローカルワークステーションのパス重複を
長期設定へ持ち込みません。これにより、ローカル開発インストールを
ソースプレーン診断で可視化しつつ、生のファイルシステムパス開示サーフェスを
もう1つ追加せずに済みます。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、組み立て、
Compaction のセッションコンテキストオーケストレーションを所有します。
Plugin から `api.registerContextEngine(id, factory)` で登録し、
`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

これは、デフォルトのコンテキスト
パイプラインを単にメモリ検索やフックで追加するだけではなく、
置き換えたり拡張したりする必要がある場合に使用します。

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

エンジンが Compaction アルゴリズムを**所有しない**場合でも、
`compact()` は実装し、明示的に委譲してください。

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

Plugin に現在のAPIへ収まらない動作が必要な場合は、
private な reach-in で Plugin システムを迂回しないでください。
足りない capability を追加してください。

推奨される手順:

1. コア契約を定義する
   コアが所有すべき共有動作を決めます: ポリシー、フォールバック、設定マージ、
   ライフサイクル、チャネル向け意味論、ランタイムヘルパー形状。
2. 型付き Plugin 登録/ランタイムサーフェスを追加する
   `OpenClawPluginApi` および/または `api.runtime` を、
   最小限で有用な型付き capability サーフェスで拡張します。
3. コア + チャネル/機能コンシューマーを配線する
   チャネルや機能 Plugin は、新しい capability をコア経由で利用するべきであり、
   ベンダー実装を直接インポートするべきではありません。
4. ベンダー実装を登録する
   その後、ベンダー Plugin がその capability に対してバックエンドを登録します。
5. 契約カバレッジを追加する
   時間が経っても所有権と登録形状が明示的なままになるよう、テストを追加します。

これが、OpenClaw が特定プロバイダーの世界観にハードコードされることなく、
意見を持った設計を維持する方法です。具体的なファイルチェックリストと実例については、
[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

### capability チェックリスト

新しい capability を追加する場合、通常は次のサーフェスをまとめて変更します。

- `src/<capability>/types.ts` のコア契約型
- `src/<capability>/runtime.ts` のコアランナー/ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ配線
- 機能/チャネル
  Plugin がそれを利用する必要がある場合は `src/plugins/runtime/*` の Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` の capture/test ヘルパー
- `src/plugins/contracts/registry.ts` の所有権/契約アサーション
- `docs/` の運用者/Plugin ドキュメント

これらのサーフェスのいずれかが欠けている場合、それは通常、
その capability がまだ完全には統合されていない兆候です。

### capability テンプレート

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

契約テストパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールは単純に保たれます。

- コアが capability 契約 + オーケストレーションを所有する
- ベンダー Plugin がベンダー実装を所有する
- 機能/チャネル Plugin がランタイムヘルパーを利用する
- 契約テストが所有権を明示的に保つ

## 関連

- [Plugin architecture](/ja-JP/plugins/architecture) — 公開 capability モデルと形状
- [Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
