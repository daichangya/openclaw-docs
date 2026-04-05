---
read_when:
    - OpenClawで「コンテキスト」が何を意味するのか理解したい
    - なぜモデルが何かを「知っている」のか（または忘れたのか）をデバッグしている
    - コンテキストのオーバーヘッドを減らしたい（`/context`、`/status`、`/compact`）
summary: 'コンテキスト: モデルが何を見るのか、それがどのように構築されるのか、そしてそれをどう確認するか'
title: Context
x-i18n:
    generated_at: "2026-04-05T12:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Context

「コンテキスト」とは、**実行のためにOpenClawがモデルへ送るすべてのもの**です。これはモデルの**コンテキストウィンドウ**（トークン上限）によって制限されます。

初心者向けのイメージ:

- **システムプロンプト**（OpenClawが構築）: ルール、ツール、Skills一覧、時刻/ランタイム、注入されたワークスペースファイル。
- **会話履歴**: このセッションにおけるあなたのメッセージ + assistantのメッセージ。
- **tool call/result + 添付**: コマンド出力、ファイル読み取り、画像/音声など。

コンテキストは「memory」とは_同じものではありません_。memoryはディスクに保存して後で再読み込みできますが、コンテキストはモデルの現在のウィンドウ内に入っているものです。

## クイックスタート（コンテキストを確認する）

- `/status` → 「ウィンドウがどれくらい埋まっているか」の素早い表示 + セッション設定。
- `/context list` → 何が注入されているか + おおよそのサイズ（ファイルごと + 合計）。
- `/context detail` → より詳細な内訳: ファイルごと、tool schemaごと、skill entryごと、およびシステムプロンプトのサイズ。
- `/usage tokens` → 通常の返信に返信ごとの使用量フッターを追加。
- `/compact` → 古い履歴をcompactエントリーに要約して、ウィンドウ容量を空ける。

関連項目: [Slash commands](/tools/slash-commands)、[Token use & costs](/reference/token-use)、[Compaction](/concepts/compaction)。

## 出力例

値はモデル、プロバイダー、toolポリシー、ワークスペース内の内容によって変わります。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## コンテキストウィンドウに含まれるもの

モデルが受け取るものはすべてカウントされます。たとえば次のものです。

- システムプロンプト（すべてのセクション）。
- 会話履歴。
- tool call + tool result。
- 添付/文字起こし（画像/音声/ファイル）。
- compaction summaryとpruning artifact。
- プロバイダーの「ラッパー」や隠しヘッダー（見えなくてもカウントされます）。

## OpenClawがシステムプロンプトを構築する方法

システムプロンプトは**OpenClaw側で管理**され、実行ごとに再構築されます。含まれるものは次のとおりです。

- ツール一覧 + 短い説明。
- Skills一覧（メタデータのみ。詳細は後述）。
- ワークスペースの場所。
- 時刻（UTC + 設定されていれば変換済みのユーザー時刻）。
- ランタイムメタデータ（host/OS/model/thinking）。
- **Project Context** 以下に注入されるワークスペースのbootstrapファイル。

完全な内訳: [System Prompt](/concepts/system-prompt)。

## 注入されるワークスペースファイル（Project Context）

デフォルトでは、OpenClawは固定のワークスペースファイル群を注入します（存在する場合）。

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（初回実行のみ）

大きいファイルは、`agents.defaults.bootstrapMaxChars`（デフォルト `20000` 文字）を使ってファイルごとに切り詰められます。OpenClawはまた、ファイル全体にまたがるbootstrap注入の合計上限として `agents.defaults.bootstrapTotalMaxChars`（デフォルト `150000` 文字）も適用します。`/context` は**rawサイズとinjectedサイズ**、および切り詰めが発生したかどうかを表示します。

切り詰めが発生すると、ランタイムはProject Context配下にプロンプト内警告ブロックを注入できます。これは `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`。デフォルトは `once`）で設定します。

## Skills: 注入されるものとオンデマンド読み込みされるもの

システムプロンプトにはコンパクトな**Skills一覧**（名前 + 説明 + 場所）が含まれます。この一覧には実際のオーバーヘッドがあります。

skillの指示自体はデフォルトでは含まれません。モデルは必要なときだけそのskillの `SKILL.md` を `read` することが想定されています。

## Tools: コストは2種類ある

toolsは2つの形でコンテキストに影響します。

1. システムプロンプト内の**tool listテキスト**（「Tooling」として見えるもの）。
2. **tool schema**（JSON）。これはモデルがtoolsを呼び出せるようにモデルへ送られます。プレーンテキストとして見えなくてもコンテキストに含まれます。

`/context detail` は最大のtool schemaを分解して、何が支配的かを確認できるようにします。

## コマンド、ディレクティブ、「インラインショートカット」

スラッシュコマンドはGatewayが処理します。いくつか異なる動作があります。

- **単独コマンド**: メッセージが `/...` のみなら、コマンドとして実行されます。
- **ディレクティブ**: `/think`、`/verbose`、`/reasoning`、`/elevated`、`/model`、`/queue` は、モデルがメッセージを見る前に取り除かれます。
  - ディレクティブだけのメッセージはセッション設定を永続化します。
  - 通常メッセージ内のインラインディレクティブは、メッセージ単位のヒントとして機能します。
- **インラインショートカット**（許可リストに入った送信者のみ）: 通常メッセージ内の特定の `/...` トークンは即座に実行されることがあります（例: 「hey /status」）。その後、残りのテキストがモデルに見える前に取り除かれます。

詳細: [Slash commands](/tools/slash-commands)。

## セッション、compaction、pruning（何が永続化されるか）

メッセージをまたいで何が永続化されるかは、仕組みによって異なります。

- **通常の履歴**は、ポリシーによってcompact/pruneされるまでセッショントランスクリプトに残ります。
- **Compaction**は要約をトランスクリプトに永続化し、最近のメッセージはそのまま保持します。
- **Pruning**は、実行用の_メモリ内_プロンプトから古いtool resultを削除しますが、トランスクリプト自体は書き換えません。

ドキュメント: [Session](/concepts/session)、[Compaction](/concepts/compaction)、[Session pruning](/concepts/session-pruning)。

デフォルトでは、OpenClawは組み立てと
compactionに組み込みの `legacy` context engineを使用します。`kind: "context-engine"` を提供するプラグインをインストールし、
`plugins.slots.contextEngine` でそれを選択すると、OpenClawはcontextの
組み立て、`/compact`、および関連するsubagent context lifecycle hookをその
engineに委譲します。`ownsCompaction: false` はlegacy
engineへの自動フォールバックを意味しません。アクティブなengineは依然として `compact()` を正しく実装している必要があります。完全な
プラガブルインターフェース、lifecycle hook、設定については
[Context Engine](/concepts/context-engine)を参照してください。

## `/context` が実際に報告する内容

`/context` は、利用可能であれば最新の**実行時に構築された**システムプロンプトレポートを優先します。

- `System prompt (run)` = 最後の埋め込み実行（tool対応）から取得され、セッションストアに永続化されたもの。
- `System prompt (estimate)` = 実行レポートが存在しない場合、またはそのレポートを生成しないCLIバックエンド経由で実行している場合に、その場で計算されたもの。

いずれの場合も、サイズと上位の寄与要因を報告します。完全なシステムプロンプトやtool schema自体は出力しません。

## 関連

- [Context Engine](/concepts/context-engine) — プラグインによるカスタムcontext注入
- [Compaction](/concepts/compaction) — 長い会話の要約
- [System Prompt](/concepts/system-prompt) — システムプロンプトの構築方法
- [Agent Loop](/concepts/agent-loop) — エージェント実行サイクル全体
