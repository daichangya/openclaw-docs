---
read_when:
    - システムプロンプトのテキスト、ツール一覧、または時刻 / heartbeat セクションを編集する場合
    - ワークスペースのブートストラップまたは Skills の注入動作を変更する場合
summary: OpenClaw のシステムプロンプトに何が含まれ、どのように組み立てられるか
title: System Prompt
x-i18n:
    generated_at: "2026-04-05T12:42:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86b2fa496b183b64e86e6ddc493e4653ff8c9727d813fe33c8f8320184d022f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System Prompt

OpenClaw は、エージェント実行ごとにカスタムのシステムプロンプトを構築します。このプロンプトは **OpenClaw が管理** しており、pi-coding-agent のデフォルトプロンプトは使用しません。

このプロンプトは OpenClaw によって組み立てられ、各エージェント実行に注入されます。

## 構造

このプロンプトは意図的にコンパクトで、固定セクションを使用します:

- **Tooling**: 現在のツール一覧 + 短い説明。
- **Safety**: 権力追求行動や監督の回避を避けるための短いガードレールのリマインダー。
- **Skills**（利用可能な場合）: 必要に応じて skill の指示を読み込む方法をモデルに伝えます。
- **OpenClaw Self-Update**: `config.schema.lookup` で安全に config を確認する方法、`config.patch` で config にパッチを適用する方法、`config.apply` で config 全体を置き換える方法、そして明示的なユーザー要求がある場合にのみ `update.run` を実行する方法。owner 専用の `gateway` ツールも、レガシーの `tools.bash.*` エイリアスが保護された exec パスに正規化される場合を含め、`tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。
- **Workspace**: 作業ディレクトリ（`agents.defaults.workspace`）。
- **Documentation**: OpenClaw ドキュメントのローカルパス（repo または npm package）と、それを読むべきタイミング。
- **Workspace Files (injected)**: ブートストラップファイルが以下に含まれていることを示します。
- **Sandbox**（有効な場合）: サンドボックス化された実行時環境、サンドボックスパス、昇格された exec が利用可能かどうかを示します。
- **Current Date & Time**: ユーザーのローカル時刻、タイムゾーン、時刻形式。
- **Reply Tags**: 対応プロバイダー向けの任意の返信タグ構文。
- **Heartbeats**: heartbeat プロンプトと ack の動作。
- **Runtime**: ホスト、OS、node、モデル、repo ルート（検出された場合）、thinking レベル（1 行）。
- **Reasoning**: 現在の可視性レベル + `/reasoning` 切り替えのヒント。

Tooling セクションには、長時間実行される作業向けの実行時ガイダンスも含まれます:

- 未来のフォローアップ（`check back later`、リマインダー、定期作業）には、`exec` の sleep ループ、`yieldMs` の遅延トリック、繰り返しの `process` ポーリングではなく cron を使用する
- `exec` / `process` は、今すぐ開始してバックグラウンドで実行し続けるコマンドにのみ使用する
- 自動完了 wake が有効な場合は、コマンドを一度だけ開始し、出力が出たときや失敗したときの push ベースの wake パスに依存する
- 実行中コマンドのログ、状態、入力、または介入を確認する必要がある場合は `process` を使用する
- タスクが大きい場合は `sessions_spawn` を優先する。サブエージェントの完了は push ベースで、依頼元に自動通知される
- 完了を待つためだけに `subagents list` / `sessions_list` をループでポーリングしない

システムプロンプト内の Safety ガードレールは助言的なものです。これらはモデルの動作を導きますが、ポリシーを強制するものではありません。厳格な強制にはツールポリシー、exec 承認、サンドボックス化、チャネル allowlist を使用してください。これらは設計上、運用者が無効にできます。

ネイティブの承認カード / ボタンを持つチャネルでは、実行時プロンプトはエージェントに対して、まずそのネイティブ承認 UI に依存するよう伝えるようになりました。手動の `/approve` コマンドを含めるのは、ツール結果がチャット承認を利用できないと示す場合、または手動承認だけが唯一の経路である場合に限られます。

## プロンプトモード

OpenClaw はサブエージェント向けに、より小さいシステムプロンプトをレンダリングできます。実行時は各実行に対して
`promptMode` を設定します（ユーザー向け config ではありません）:

- `full`（デフォルト）: 上記のすべてのセクションを含みます。
- `minimal`: サブエージェントに使用されます。**Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies**、**Heartbeats** を省略します。Tooling、**Safety**、Workspace、Sandbox、Current Date & Time（判明している場合）、Runtime、および注入されたコンテキストは引き続き利用できます。
- `none`: ベースの識別行だけを返します。

`promptMode=minimal` の場合、追加で注入されるプロンプトには **Group Chat Context** ではなく **Subagent Context** というラベルが付きます。

## ワークスペースブートストラップの注入

ブートストラップファイルはトリミングされ、**Project Context** の下に追記されます。これにより、モデルは明示的に読み込まなくても識別情報と profile コンテキストを把握できます:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（まったく新しいワークスペースでのみ）
- `MEMORY.md`。存在しない場合は小文字のフォールバックとして `memory.md`

これらのファイルはすべて、毎ターン **コンテキストウィンドウに注入** されます。つまり、トークンを消費します。簡潔に保ってください。特に `MEMORY.md` は時間とともに肥大化し、予想以上にコンテキスト使用量が増え、compaction がより頻繁に発生する原因になります。

> **注:** `memory/*.md` の日次ファイルは自動では注入されません。これらは `memory_search` と `memory_get` ツールを通じてオンデマンドでアクセスされるため、モデルが明示的に読み取らない限り、コンテキストウィンドウにはカウントされません。

大きなファイルはマーカー付きで切り詰められます。ファイルごとの最大サイズは
`agents.defaults.bootstrapMaxChars`（デフォルト: 20000）で制御されます。ファイル全体にわたる
注入済みブートストラップ内容の合計は `agents.defaults.bootstrapTotalMaxChars`
（デフォルト: 150000）で上限が設定されます。存在しないファイルは短い missing-file マーカーを注入します。切り詰めが発生した場合、OpenClaw は Project Context に警告ブロックを注入できます。これは
`agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`、デフォルト: `once`）で制御します。

サブエージェントセッションでは `AGENTS.md` と `TOOLS.md` だけが注入されます（サブエージェントのコンテキストを小さく保つため、その他のブートストラップファイルは除外されます）。

内部 hook は `agent:bootstrap` を介してこのステップを横取りし、注入されるブートストラップファイルを変更または置換できます（たとえば `SOUL.md` を別の persona に差し替えるなど）。

エージェントの話し方をより汎用的でなくしたい場合は、まず
[SOUL.md Personality Guide](/concepts/soul) から始めてください。

注入された各ファイルがどれだけ寄与しているか（生のサイズと注入後のサイズ、切り詰め、さらにツールスキーマのオーバーヘッド）を確認するには、`/context list` または `/context detail` を使用してください。[Context](/concepts/context) を参照してください。

## 時刻の扱い

ユーザーのタイムゾーンが分かっている場合、システムプロンプトには専用の **Current Date & Time** セクションが含まれます。プロンプトキャッシュを安定させるため、現在は **タイムゾーン** のみを含みます（動的な時計や時刻形式は含みません）。

エージェントが現在時刻を必要とする場合は `session_status` を使用してください。ステータスカードにはタイムスタンプ行が含まれます。同じツールで、セッションごとのモデルオーバーライドを任意で設定することもできます（`model=default` でクリア）。

設定項目:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完全な動作の詳細は [Date & Time](/date-time) を参照してください。

## Skills

対象となる Skills が存在する場合、OpenClaw は、各 skill の **ファイルパス** を含むコンパクトな **available skills list**（`formatSkillsForPrompt`）を注入します。プロンプトは、一覧に記載された場所（workspace、managed、または bundled）にある SKILL.md を `read` で読み込むようモデルに指示します。対象となる skill がない場合、Skills セクションは省略されます。

対象判定には、skill メタデータのゲート、実行時環境 / config チェック、および
`agents.defaults.skills` または `agents.list[].skills` が設定されている場合の実効的なエージェント skill allowlist が含まれます。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

これにより、必要な skill の利用を可能にしつつ、ベースプロンプトを小さく保てます。

## Documentation

利用可能な場合、システムプロンプトには **Documentation** セクションが含まれ、ローカルの OpenClaw ドキュメントディレクトリ（repo ワークスペース内の `docs/` または同梱された npm package の docs）を指し示します。また、公開ミラー、ソース repo、コミュニティ Discord、Skills 発見用の ClawHub（[https://clawhub.ai](https://clawhub.ai)）についても記載します。プロンプトは、OpenClaw の動作、コマンド、設定、またはアーキテクチャについては、まずローカルドキュメントを参照し、可能であれば `openclaw status` を自分で実行するようモデルに指示します（アクセスできない場合のみユーザーに尋ねます）。
