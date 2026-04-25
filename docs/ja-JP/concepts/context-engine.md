---
read_when:
    - OpenClawがどのようにモデルコンテキストを組み立てるかを理解したい場合
    - 従来のエンジンとPluginエンジンを切り替えています
    - コンテキストエンジンPluginを構築しています
summary: 'コンテキストエンジン: プラグ可能なコンテキスト組み立て、Compaction、およびサブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-04-25T13:45:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

**コンテキストエンジン** は、OpenClawが各実行でどのようにモデルコンテキストを構築するかを制御します。
どのメッセージを含めるか、古い履歴をどう要約するか、そしてサブエージェント境界をまたいで
コンテキストをどう管理するかを決めます。

OpenClawには組み込みの `legacy` エンジンがあり、デフォルトでこれを使用します。ほとんどの
ユーザーは変更する必要がありません。異なる組み立て、Compaction、またはセッションをまたぐ
リコール動作が必要な場合にのみ、Pluginエンジンをインストールして選択してください。

## クイックスタート

どのエンジンがアクティブか確認します:

```bash
openclaw doctor
# または設定を直接確認:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### コンテキストエンジンPluginのインストール

コンテキストエンジンPluginは、他のOpenClaw Pluginと同様にインストールします。まず
インストールし、その後スロットでエンジンを選択します:

```bash
# npmからインストール
openclaw plugins install @martian-engineering/lossless-claw

# またはローカルパスからインストール（開発用）
openclaw plugins install -l ./my-context-engine
```

その後、Pluginを有効にし、設定でアクティブなエンジンとして選択します:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // Pluginが登録したエンジンidと一致している必要があります
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin固有の設定はここに記述します（Pluginのドキュメントを参照）
      },
    },
  },
}
```

インストールと設定の後、Gatewayを再起動してください。

組み込みエンジンに戻すには、`contextEngine` を `"legacy"` に設定します（または
キー自体を削除します。`"legacy"` がデフォルトです）。

## 仕組み

OpenClawがモデルプロンプトを実行するたびに、コンテキストエンジンは
4つのライフサイクルポイントに参加します:

1. **Ingest** — 新しいメッセージがセッションに追加されたときに呼ばれます。エンジンは
   自身のデータストアにメッセージを保存またはインデックスできます。
2. **Assemble** — 各モデル実行前に呼ばれます。エンジンはトークン予算内に収まる
   順序付きメッセージ集合（および任意の `systemPromptAddition`）を返します。
3. **Compact** — コンテキストウィンドウがいっぱいになったとき、またはユーザーが
   `/compact` を実行したときに呼ばれます。エンジンは古い履歴を要約して空きを作ります。
4. **After turn** — 実行完了後に呼ばれます。エンジンは状態を永続化したり、
   バックグラウンドCompactionをトリガーしたり、インデックスを更新したりできます。

バンドル済みの非ACP Codex harnessでは、OpenClawは、組み立てたコンテキストを
Codex開発者向け指示と現在ターンのプロンプトへ投影することで、同じライフサイクルを適用します。
Codexは依然としてネイティブのスレッド履歴とネイティブのcompactorを所有します。

### サブエージェントのライフサイクル（任意）

OpenClawは2つの任意のサブエージェントライフサイクルフックを呼び出します:

- **prepareSubagentSpawn** — 子実行の開始前に共有コンテキスト状態を準備します。
  このフックは、親/子セッションキー、`contextMode`
  （`isolated` または `fork`）、利用可能なtranscript id/ファイル、
  および任意のTTLを受け取ります。ロールバックハンドルを返した場合、
  準備成功後にspawnが失敗するとOpenClawがそれを呼び出します。
- **onSubagentEnded** — サブエージェントセッションが完了したとき、または掃除されたときに
  クリーンアップします。

### システムプロンプト追加

`assemble` メソッドは `systemPromptAddition` 文字列を返せます。OpenClawは
これをその実行のシステムプロンプトの先頭に付加します。これによりエンジンは、
静的なワークスペースファイルを必要とせずに、動的なリコールガイダンス、
取得指示、またはコンテキスト認識ヒントを注入できます。

## legacyエンジン

組み込みの `legacy` エンジンは、OpenClaw本来の動作を維持します:

- **Ingest**: no-op（セッションマネージャーがメッセージ永続化を直接処理します）。
- **Assemble**: pass-through（runtime内の既存の sanitize → validate → limit パイプラインが
  コンテキスト組み立てを処理します）。
- **Compact**: 組み込みの要約Compactionへ委譲します。これは古いメッセージの単一要約を作成し、
  最近のメッセージはそのまま保持します。
- **After turn**: no-op。

legacyエンジンはツールを登録せず、`systemPromptAddition` も提供しません。

`plugins.slots.contextEngine` が未設定（または `"legacy"` に設定）であれば、
このエンジンが自動的に使用されます。

## Pluginエンジン

Pluginは、Plugin APIを使ってコンテキストエンジンを登録できます:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // メッセージを自分のデータストアに保存
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // 予算内に収まるメッセージを返す
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // 古いコンテキストを要約
      return { ok: true, compacted: true };
    },
  }));
}
```

その後、設定で有効にします:

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

### ContextEngineインターフェース

必須メンバー:

| メンバー           | 種類     | 目的                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | エンジンid、名前、バージョン、およびCompactionを所有するか |
| `ingest(params)`   | Method   | 単一メッセージを保存する                                 |
| `assemble(params)` | Method   | モデル実行向けコンテキストを構築する（`AssembleResult` を返す） |
| `compact(params)`  | Method   | コンテキストを要約/削減する                              |

`assemble` は次を含む `AssembleResult` を返します:

- `messages` — モデルへ送信する順序付きメッセージ。
- `estimatedTokens`（必須、`number`）— 組み立てたコンテキスト全体に対する
  エンジンのトークン推定値。OpenClawはこれをCompactionしきい値判定と
  診断レポートに使用します。
- `systemPromptAddition`（任意、`string`）— システムプロンプトの先頭に付加されます。

任意メンバー:

| メンバー                     | 種類   | 目的                                                                                                  |
| ---------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`          | Method | セッション向けエンジン状態を初期化します。エンジンが最初にセッションを見たときに1回呼ばれます（例: 履歴の取り込み）。 |
| `ingestBatch(params)`        | Method | 完了したターンを一括でIngestします。実行完了後、そのターンの全メッセージをまとめて呼ばれます。         |
| `afterTurn(params)`          | Method | 実行後のライフサイクル処理（状態永続化、バックグラウンドCompactionのトリガー）。                      |
| `prepareSubagentSpawn(params)` | Method | 子セッション開始前に共有状態をセットアップします。                                                   |
| `onSubagentEnded(params)`    | Method | サブエージェント終了後にクリーンアップします。                                                        |
| `dispose()`                  | Method | リソースを解放します。GatewayシャットダウンまたはPlugin再読み込み時に呼ばれます。セッション単位ではありません。 |

### ownsCompaction

`ownsCompaction` は、その実行でPiの組み込みin-attempt自動Compactionを
有効なままにするかどうかを制御します:

- `true` — エンジンがCompaction動作を所有します。OpenClawはその実行で
  Piの組み込み自動Compactionを無効にし、エンジンの `compact()` 実装が
  `/compact`、オーバーフロー回復Compaction、および `afterTurn()` 内で
  行いたい任意の先回りCompactionを担当します。OpenClawは引き続き
  プロンプト前のオーバーフロー保護を実行する場合があります。完全なtranscriptが
  オーバーフローすると予測した場合、回復パスは別のプロンプトを送信する前に
  アクティブなエンジンの `compact()` を呼び出します。
- `false` または未設定 — Piの組み込み自動Compactionはプロンプト実行中に
  引き続き動作する場合がありますが、アクティブなエンジンの `compact()` メソッドは
  `/compact` とオーバーフロー回復のために引き続き呼ばれます。

`ownsCompaction: false` は、OpenClawが自動的にlegacyエンジンの
Compactionパスへフォールバックすることを**意味しません**。

つまり、有効なPluginパターンは2つあります:

- **所有モード** — 独自のCompactionアルゴリズムを実装し、
  `ownsCompaction: true` を設定します。
- **委譲モード** — `ownsCompaction: false` を設定し、`compact()` から
  `openclaw/plugin-sdk/core` の `delegateCompactionToRuntime(...)` を呼んで
  OpenClaw組み込みのCompaction動作を使います。

アクティブな非所有エンジンで no-op の `compact()` を実装するのは安全ではありません。
そのエンジンスロットに対する通常の `/compact` とオーバーフロー回復Compactionパスが
無効になるためです。

## 設定リファレンス

```json5
{
  plugins: {
    slots: {
      // アクティブなコンテキストエンジンを選択します。デフォルト: "legacy"。
      // Pluginエンジンを使うにはPlugin idを設定します。
      contextEngine: "legacy",
    },
  },
}
```

このスロットは実行時に排他的です。特定の実行またはCompaction操作に対しては、
登録済みコンテキストエンジンのうち1つだけが解決されます。他の有効な
`kind: "context-engine"` Pluginも読み込まれ、登録コードを実行できます。
`plugins.slots.contextEngine` は、OpenClawがコンテキストエンジンを必要としたときに
どの登録済みエンジンidを解決するかを選ぶだけです。

## Compactionおよびメモリとの関係

- **Compaction** はコンテキストエンジンの責務の1つです。legacyエンジンは
  OpenClaw組み込みの要約へ委譲します。Pluginエンジンは任意のCompaction戦略
  （DAG要約、ベクター取得など）を実装できます。
- **Memory Plugin**（`plugins.slots.memory`）はコンテキストエンジンとは別です。
  Memory Pluginは検索/取得を提供し、コンテキストエンジンはモデルが何を見るかを制御します。
  両者は連携できます。たとえばコンテキストエンジンが、組み立て中にmemory
  Pluginのデータを使うことがあります。アクティブなメモリプロンプトパスを使いたい
  Pluginエンジンは、`openclaw/plugin-sdk/core` の
  `buildMemorySystemPromptAddition(...)` を優先してください。これはアクティブな
  メモリプロンプトセクションを、先頭付加可能な `systemPromptAddition` に変換します。
  エンジンがより低レベルの制御を必要とする場合は、引き続き
  `openclaw/plugin-sdk/memory-host-core` の
  `buildActiveMemoryPromptSection(...)` を通じて生の行を取得できます。
- **セッションpruning**（古いツール結果のインメモリ切り詰め）は、
  どのコンテキストエンジンがアクティブでも引き続き実行されます。

## ヒント

- エンジンが正しく読み込まれているか確認するには `openclaw doctor` を使ってください。
- エンジンを切り替えても、既存セッションは現在の履歴を保持したまま継続します。
  新しいエンジンは今後の実行に対して引き継ぎます。
- エンジンエラーはログに記録され、診断にも表示されます。Pluginエンジンの
  登録に失敗した場合、または選択されたエンジンidを解決できない場合、
  OpenClawは自動フォールバックしません。Pluginを修正するか、
  `plugins.slots.contextEngine` を `"legacy"` に戻すまで、実行は失敗します。
- 開発では、`openclaw plugins install -l ./my-engine` を使って、
  ローカルPluginディレクトリをコピーせずにリンクできます。

参照: [Compaction](/ja-JP/concepts/compaction), [Context](/ja-JP/concepts/context),
[Plugins](/ja-JP/tools/plugin), [Plugin manifest](/ja-JP/plugins/manifest)。

## 関連

- [Context](/ja-JP/concepts/context) — エージェントターン向けにコンテキストがどう構築されるか
- [Plugin Architecture](/ja-JP/plugins/architecture) — コンテキストエンジンPluginの登録
- [Compaction](/ja-JP/concepts/compaction) — 長い会話の要約
