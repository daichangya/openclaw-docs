---
read_when:
    - OpenClaw がどのようにモデルコンテキストを構築するかを理解したい場合
    - レガシーエンジンとプラグインエンジンを切り替える場合
    - コンテキストエンジンプラグインを構築している場合
summary: 'コンテキストエンジン: プラグ可能なコンテキスト構築、コンパクション、サブエージェントのライフサイクル'
title: Context Engine
x-i18n:
    generated_at: "2026-04-05T12:41:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# Context Engine

**context engine** は、OpenClaw が各実行に対してどのようにモデルコンテキストを構築するかを制御します。
どのメッセージを含めるか、古い履歴をどのように要約するか、そしてサブエージェントの境界をまたいでコンテキストをどのように管理するかを決定します。

OpenClaw には、組み込みの `legacy` エンジンが付属しています。プラグインは、
アクティブな context-engine のライフサイクルを置き換える代替エンジンを登録できます。

## クイックスタート

どのエンジンがアクティブかを確認します:

```bash
openclaw doctor
# または config を直接確認:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### コンテキストエンジンプラグインのインストール

コンテキストエンジンプラグインは、他の OpenClaw plugin と同様にインストールします。まずインストールし、
次に slot でエンジンを選択します:

```bash
# npm からインストール
openclaw plugins install @martian-engineering/lossless-claw

# またはローカルパスからインストール（開発用）
openclaw plugins install -l ./my-context-engine
```

その後、プラグインを有効にし、config でそれをアクティブなエンジンとして選択します:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // プラグインが登録した engine id と一致している必要があります
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // プラグイン固有の config はここに入ります（プラグインのドキュメントを参照）
      },
    },
  },
}
```

インストールと設定の後、Gateway を再起動してください。

組み込みエンジンに戻すには、`contextEngine` を `"legacy"` に設定します（または
キーを完全に削除します。`"legacy"` がデフォルトです）。

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、context engine は
4 つのライフサイクルポイントで関与します:

1. **Ingest** — 新しいメッセージがセッションに追加されたときに呼び出されます。エンジンは
   そのメッセージを独自のデータストアに保存またはインデックス化できます。
2. **Assemble** — 各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる
   順序付きのメッセージセット（および任意の `systemPromptAddition`）を返します。
3. **Compact** — コンテキストウィンドウがいっぱいになったとき、またはユーザーが
   `/compact` を実行したときに呼び出されます。エンジンは古い履歴を要約して空き領域を作ります。
4. **After turn** — 実行の完了後に呼び出されます。エンジンは状態を永続化したり、
   バックグラウンドコンパクションをトリガーしたり、インデックスを更新したりできます。

### サブエージェントのライフサイクル（任意）

OpenClaw は現在、1 つのサブエージェントライフサイクルフックを呼び出します:

- **onSubagentEnded** — サブエージェントセッションが完了またはクリーンアップされたときに後始末します。

`prepareSubagentSpawn` フックは将来の利用のためにインターフェースに含まれていますが、
実行時はまだこれを呼び出しません。

### システムプロンプト追加

`assemble` メソッドは `systemPromptAddition` 文字列を返すことができます。OpenClaw は
これをその実行のシステムプロンプトの先頭に追加します。これにより、エンジンは
静的なワークスペースファイルを必要とせずに、動的な想起ガイダンス、検索指示、
またはコンテキスト認識ヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは、OpenClaw の元の動作を維持します:

- **Ingest**: no-op（セッションマネージャーがメッセージの永続化を直接処理します）。
- **Assemble**: パススルー（実行時の既存の sanitize → validate → limit パイプラインが
  コンテキスト構築を処理します）。
- **Compact**: 組み込みの要約コンパクションに委譲し、
  古いメッセージの単一の要約を作成して最近のメッセージをそのまま保持します。
- **After turn**: no-op。

legacy エンジンはツールを登録せず、`systemPromptAddition` も提供しません。

`plugins.slots.contextEngine` が設定されていない場合（または `"legacy"` に設定されている場合）、
このエンジンが自動的に使用されます。

## プラグインエンジン

プラグインは、プラグイン API を使用して context engine を登録できます:

```ts
export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // メッセージをデータストアに保存
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget }) {
      // 予算内に収まるメッセージを返す
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // 古いコンテキストを要約
      return { ok: true, compacted: true };
    },
  }));
}
```

次に config で有効にします:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine インターフェース

必須メンバー:

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | エンジン id、名前、バージョン、および compaction を所有するかどうか |
| `ingest(params)`   | Method   | 単一のメッセージを保存する                                   |
| `assemble(params)` | Method   | モデル実行用のコンテキストを構築する（`AssembleResult` を返す） |
| `compact(params)`  | Method   | コンテキストを要約 / 縮小する                                 |

`assemble` は次を含む `AssembleResult` を返します:

- `messages` — モデルに送信する順序付きメッセージ。
- `estimatedTokens`（必須、`number`）— 構築されたコンテキスト内の
  合計トークン数に対するエンジンの推定値。OpenClaw はこれを compaction のしきい値判断と
  診断レポートに使用します。
- `systemPromptAddition`（任意、`string`）— システムプロンプトの先頭に追加されます。

任意メンバー:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | セッション用のエンジン状態を初期化する。エンジンがセッションを初めて認識したときに一度だけ呼び出されます（例: 履歴のインポート）。 |
| `ingestBatch(params)`          | Method | 完了したターンをバッチとして ingest する。実行完了後に、そのターンの全メッセージをまとめて呼び出されます。     |
| `afterTurn(params)`            | Method | 実行後のライフサイクル処理（状態の永続化、バックグラウンド compaction のトリガー）。                                         |
| `prepareSubagentSpawn(params)` | Method | 子セッション用の共有状態をセットアップする。                                                                        |
| `onSubagentEnded(params)`      | Method | サブエージェント終了後の後始末をする。                                                                                 |
| `dispose()`                    | Method | リソースを解放する。Gateway のシャットダウン時または plugin の再読み込み時に呼び出され、セッションごとではありません。                           |

### ownsCompaction

`ownsCompaction` は、その実行に対して Pi の組み込み in-attempt auto-compaction を
有効のままにするかどうかを制御します:

- `true` — エンジンが compaction 動作を所有します。OpenClaw はその実行に対して Pi の組み込み
  auto-compaction を無効にし、エンジンの `compact()` 実装が `/compact`、オーバーフロー回復 compaction、
  および `afterTurn()` で行いたい任意の先回り compaction を担当します。
- `false` または未設定 — プロンプト実行中に Pi の組み込み auto-compaction が引き続き実行される場合がありますが、
  アクティブなエンジンの `compact()` メソッドは `/compact` とオーバーフロー回復のために引き続き呼び出されます。

`ownsCompaction: false` は、OpenClaw が自動的に
legacy エンジンの compaction パスにフォールバックすることを意味しません。

つまり、有効なプラグインパターンは 2 つあります:

- **Owning mode** — 独自の compaction アルゴリズムを実装し、
  `ownsCompaction: true` を設定します。
- **Delegating mode** — `ownsCompaction: false` を設定し、`compact()` から
  `openclaw/plugin-sdk/core` の `delegateCompactionToRuntime(...)` を呼び出して、
  OpenClaw の組み込み compaction 動作を使用します。

active な non-owning エンジンに対する no-op `compact()` は安全ではありません。これは、
そのエンジンスロットに対する通常の `/compact` とオーバーフロー回復 compaction パスを無効にするためです。

## config リファレンス

```json5
{
  plugins: {
    slots: {
      // アクティブな context engine を選択します。デフォルト: "legacy"。
      // plugin エンジンを使用するには plugin id に設定します。
      contextEngine: "legacy",
    },
  },
}
```

この slot は実行時には排他的であり、特定の実行または compaction 操作に対して
解決される登録済み context engine は 1 つだけです。他の有効な
`kind: "context-engine"` plugin も引き続き読み込まれ、登録コードを実行できます。
`plugins.slots.contextEngine` は、OpenClaw が context engine を必要とするときに
どの登録済み engine id を解決するかだけを選択します。

## compaction と memory との関係

- **Compaction** は context engine の責務の 1 つです。legacy エンジンは
  OpenClaw の組み込み要約に委譲します。プラグインエンジンは任意の compaction 戦略
  （DAG 要約、ベクター検索など）を実装できます。
- **Memory plugins**（`plugins.slots.memory`）は context engine とは別物です。
  memory plugins は検索 / 取得を提供し、context engine はモデルが何を見るかを制御します。
  これらは連携できます。たとえば context engine は構築中に memory
  plugin のデータを使用する場合があります。
- **Session pruning**（古いツール結果のインメモリでのトリミング）は、
  どの context engine がアクティブであるかに関係なく引き続き実行されます。

## ヒント

- `openclaw doctor` を使用して、エンジンが正しく読み込まれていることを確認してください。
- エンジンを切り替えた場合でも、既存のセッションは現在の履歴を維持したまま継続されます。
  新しいエンジンは今後の実行に対して引き継ぎます。
- エンジンエラーはログに記録され、診断情報に表示されます。プラグインエンジンの
  登録に失敗した場合、または選択した engine id を解決できない場合、OpenClaw は
  自動的にはフォールバックしません。plugin を修正するか、
  `plugins.slots.contextEngine` を `"legacy"` に戻すまで、実行は失敗します。
- 開発時には、`openclaw plugins install -l ./my-engine` を使用して
  ローカル plugin ディレクトリをコピーせずにリンクしてください。

参照: [Compaction](/concepts/compaction), [Context](/concepts/context),
[Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest).

## 関連

- [Context](/concepts/context) — エージェントターン用のコンテキストがどのように構築されるか
- [Plugin Architecture](/plugins/architecture) — context engine plugin の登録
- [Compaction](/concepts/compaction) — 長い会話の要約
