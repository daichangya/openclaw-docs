---
read_when:
    - OpenClaw がどのようにモデルコンテキストを組み立てるかを理解したい場合
    - レガシーエンジンと Plugin エンジンを切り替えている場合
    - コンテキストエンジン Plugin を構築している場合
sidebarTitle: Context engine
summary: 'コンテキストエンジン: プラグ可能なコンテキストアセンブリ、Compaction、サブエージェントのライフサイクル'
title: コンテキストエンジン
x-i18n:
    generated_at: "2026-04-26T11:27:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

**コンテキストエンジン** は、OpenClaw が各実行のモデルコンテキストをどのように構築するかを制御します。どのメッセージを含めるか、古い履歴をどのように要約するか、サブエージェント境界をまたいでコンテキストをどう管理するかを決めます。

OpenClaw には組み込みの `legacy` エンジンが同梱されており、デフォルトでこれが使われます。ほとんどのユーザーはこれを変更する必要はありません。異なるアセンブリ、Compaction、またはセッション横断の再呼び出し動作が必要な場合にのみ、Plugin エンジンをインストールして選択してください。

## クイックスタート

<Steps>
  <Step title="どのエンジンが有効か確認する">
    ```bash
    openclaw doctor
    # または config を直接確認:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Plugin エンジンをインストールする">
    コンテキストエンジン Plugin は、他の OpenClaw Plugin と同じようにインストールします。

    <Tabs>
      <Tab title="npm から">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="ローカルパスから">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="エンジンを有効化して選択する">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // Plugin が登録したエンジン id と一致している必要があります
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin 固有の config はここに書きます（Plugin のドキュメントを参照）
          },
        },
      },
    }
    ```

    インストールと設定の後に Gateway を再起動してください。

  </Step>
  <Step title="legacy に戻す（任意）">
    `contextEngine` を `"legacy"` に設定します（またはキー自体を削除します — デフォルトは `"legacy"` です）。
  </Step>
</Steps>

## 仕組み

OpenClaw がモデルプロンプトを実行するたびに、コンテキストエンジンは 4 つのライフサイクルポイントに関与します。

<AccordionGroup>
  <Accordion title="1. Ingest">
    新しいメッセージがセッションに追加されたときに呼び出されます。エンジンはそのメッセージを独自のデータストアに保存またはインデックス化できます。
  </Accordion>
  <Accordion title="2. Assemble">
    各モデル実行の前に呼び出されます。エンジンは、トークン予算内に収まる順序付きメッセージ集合（および任意の `systemPromptAddition`）を返します。
  </Accordion>
  <Accordion title="3. Compact">
    コンテキストウィンドウがいっぱいになったとき、またはユーザーが `/compact` を実行したときに呼び出されます。エンジンは古い履歴を要約して空きを作ります。
  </Accordion>
  <Accordion title="4. After turn">
    実行完了後に呼び出されます。エンジンは状態を永続化したり、バックグラウンド Compaction をトリガーしたり、インデックスを更新したりできます。
  </Accordion>
</AccordionGroup>

バンドル済みの非 ACP Codex ハーネスでは、OpenClaw は組み立てられたコンテキストを Codex の developer instructions と現在のターンプロンプトに投影することで、同じライフサイクルを適用します。Codex は引き続き自身のネイティブなスレッド履歴とネイティブな compactor を管理します。

### サブエージェントのライフサイクル（任意）

OpenClaw は 2 つの任意のサブエージェントライフサイクルフックを呼び出します。

<ParamField path="prepareSubagentSpawn" type="method">
  子実行が開始する前に共有コンテキスト状態を準備します。このフックは parent/child のセッションキー、`contextMode`（`isolated` または `fork`）、利用可能な transcript id/file、および任意の TTL を受け取ります。ロールバックハンドルを返した場合、準備成功後に spawn が失敗したとき OpenClaw はそれを呼び出します。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  サブエージェントセッションが完了または掃除されたときにクリーンアップします。
</ParamField>

### システムプロンプト追加

`assemble` メソッドは `systemPromptAddition` 文字列を返せます。OpenClaw はこれをその実行のシステムプロンプトの先頭に追加します。これによりエンジンは、静的なワークスペースファイルを必要とせずに、動的な再呼び出しガイダンス、取得指示、またはコンテキスト依存のヒントを注入できます。

## legacy エンジン

組み込みの `legacy` エンジンは OpenClaw の元の動作を維持します。

- **Ingest**: no-op（メッセージの永続化はセッションマネージャが直接処理します）。
- **Assemble**: パススルー（ランタイム内の既存の sanitize → validate → limit パイプラインがコンテキスト組み立てを処理します）。
- **Compact**: 組み込みの要約 Compaction に委譲し、古いメッセージの単一要約を作成しつつ最近のメッセージはそのまま保持します。
- **After turn**: no-op。

legacy エンジンはツールを登録せず、`systemPromptAddition` も提供しません。

`plugins.slots.contextEngine` が設定されていない場合（または `"legacy"` に設定されている場合）、このエンジンが自動的に使用されます。

## Plugin エンジン

Plugin は Plugin API を使ってコンテキストエンジンを登録できます。

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

その後、config で有効化します。

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

| メンバー           | 種別     | 目的                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | エンジン id、名前、バージョン、および Compaction を所有するか |
| `ingest(params)`   | Method   | 単一メッセージを保存                                     |
| `assemble(params)` | Method   | モデル実行用のコンテキストを構築（`AssembleResult` を返す） |
| `compact(params)`  | Method   | コンテキストを要約/縮小                                  |

`assemble` は次を含む `AssembleResult` を返します。

<ParamField path="messages" type="Message[]" required>
  モデルに送る順序付きメッセージ。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  組み立てられたコンテキスト内の総トークン数についてのエンジン側推定値。OpenClaw はこれを Compaction のしきい値判断と診断レポートに使用します。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  システムプロンプトの先頭に追加されます。
</ParamField>

任意メンバー:

| メンバー                       | 種別   | 目的                                                                                             |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------ |
| `bootstrap(params)`            | Method | セッション用のエンジン状態を初期化します。エンジンがセッションを初めて認識したときに 1 回だけ呼ばれます（例: 履歴のインポート）。 |
| `ingestBatch(params)`          | Method | 完了したターンをバッチとして Ingest します。実行完了後、そのターンの全メッセージをまとめて一度に呼び出されます。 |
| `afterTurn(params)`            | Method | 実行後のライフサイクル処理（状態の永続化、バックグラウンド Compaction のトリガー）。 |
| `prepareSubagentSpawn(params)` | Method | 子セッション開始前に共有状態をセットアップします。                                               |
| `onSubagentEnded(params)`      | Method | サブエージェント終了後にクリーンアップします。                                                   |
| `dispose()`                    | Method | リソースを解放します。Gateway シャットダウン時または Plugin リロード時に呼ばれ、セッションごとではありません。 |

### ownsCompaction

`ownsCompaction` は、その実行で Pi の組み込み in-attempt 自動 Compaction を有効のままにするかどうかを制御します。

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    エンジンが Compaction 動作を所有します。OpenClaw はその実行で Pi の組み込み自動 Compaction を無効化し、エンジンの `compact()` 実装が `/compact`、オーバーフロー回復 Compaction、および `afterTurn()` で行いたい任意の事前 Compaction を担当します。OpenClaw は引き続きプロンプト前のオーバーフロー保護を実行することがあります。完全な transcript がオーバーフローすると予測した場合、回復経路は別のプロンプトを送る前にアクティブなエンジンの `compact()` を呼び出します。
  </Accordion>
  <Accordion title="ownsCompaction: false または未設定">
    プロンプト実行中に Pi の組み込み自動 Compaction が引き続き実行されることがありますが、アクティブなエンジンの `compact()` メソッドは `/compact` とオーバーフロー回復のために引き続き呼び出されます。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` は、OpenClaw が自動的に legacy エンジンの Compaction 経路へフォールバックすることを **意味しません**。
</Warning>

つまり、有効な Plugin パターンは 2 つあります。

<Tabs>
  <Tab title="所有モード">
    独自の Compaction アルゴリズムを実装し、`ownsCompaction: true` を設定します。
  </Tab>
  <Tab title="委譲モード">
    `ownsCompaction: false` を設定し、OpenClaw 組み込みの Compaction 動作を使うために `compact()` から `openclaw/plugin-sdk/core` の `delegateCompactionToRuntime(...)` を呼び出します。
  </Tab>
</Tabs>

active な非所有エンジンで no-op の `compact()` を実装するのは安全ではありません。なぜなら、そのエンジンスロットに対する通常の `/compact` とオーバーフロー回復 Compaction 経路を無効化してしまうからです。

## 設定リファレンス

```json5
{
  plugins: {
    slots: {
      // アクティブなコンテキストエンジンを選択します。デフォルト: "legacy"。
      // Plugin エンジンを使うには Plugin id を設定します。
      contextEngine: "legacy",
    },
  },
}
```

<Note>
このスロットはランタイムでは排他的です。特定の実行または Compaction 操作では、登録済みコンテキストエンジンのうち 1 つだけが解決されます。他の有効化済み `kind: "context-engine"` Plugin も引き続きロードされ、登録コードを実行できます。`plugins.slots.contextEngine` は、OpenClaw がコンテキストエンジンを必要としたときに、どの登録済みエンジン id を解決するかを選ぶだけです。
</Note>

<Note>
**Plugin のアンインストール:** 現在 `plugins.slots.contextEngine` として選択されている Plugin をアンインストールすると、OpenClaw はそのスロットをデフォルト（`legacy`）に戻します。同じリセット動作は `plugins.slots.memory` にも適用されます。手動の config 編集は不要です。
</Note>

## Compaction および memory との関係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction はコンテキストエンジンの責務の 1 つです。legacy エンジンは OpenClaw の組み込み要約に委譲します。Plugin エンジンは任意の Compaction 戦略（DAG 要約、ベクトル取得など）を実装できます。
  </Accordion>
  <Accordion title="Memory Plugin">
    Memory Plugin（`plugins.slots.memory`）はコンテキストエンジンとは別物です。Memory Plugin は検索/取得を提供し、コンテキストエンジンはモデルに何を見せるかを制御します。両者は協調できます。たとえばコンテキストエンジンは assembly 中に memory Plugin のデータを使うことができます。active memory のプロンプト経路を使いたい Plugin エンジンでは、`openclaw/plugin-sdk/core` の `buildMemorySystemPromptAddition(...)` を優先して使ってください。これは active memory のプロンプトセクションを、先頭追加可能な `systemPromptAddition` に変換します。エンジンがより低レベルの制御を必要とする場合は、`openclaw/plugin-sdk/memory-host-core` の `buildActiveMemoryPromptSection(...)` を通じて生の行を取得することもできます。
  </Accordion>
  <Accordion title="セッションの削除">
    メモリ内の古いツール結果のトリミングは、どのコンテキストエンジンが active かに関係なく引き続き実行されます。
  </Accordion>
</AccordionGroup>

## ヒント

- エンジンが正しく読み込まれていることを確認するには `openclaw doctor` を使ってください。
- エンジンを切り替えても、既存のセッションは現在の履歴のまま継続します。新しいエンジンは今後の実行から引き継ぎます。
- エンジンエラーはログに記録され、診断にも表示されます。Plugin エンジンの登録に失敗した場合や、選択されたエンジン id を解決できない場合、OpenClaw は自動ではフォールバックしません。Plugin を修正するか、`plugins.slots.contextEngine` を `"legacy"` に戻すまで実行は失敗します。
- 開発時には、ローカル Plugin ディレクトリをコピーせずにリンクするために `openclaw plugins install -l ./my-engine` を使ってください。

## 関連

- [Compaction](/ja-JP/concepts/compaction) — 長い会話の要約
- [コンテキスト](/ja-JP/concepts/context) — エージェントターン用コンテキストの構築方法
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — コンテキストエンジン Plugin の登録
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — Plugin マニフェストのフィールド
- [Plugins](/ja-JP/tools/plugin) — Plugin の概要
