---
read_when:
    - システムプロンプトのテキスト、tools 一覧、または時刻/Heartbeat セクションを編集すること
    - workspace bootstrap または Skills 注入の動作を変更すること
summary: OpenClaw のシステムプロンプトに何が含まれているか、およびそれがどのように組み立てられるか
title: システムプロンプト
x-i18n:
    generated_at: "2026-04-25T13:46:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw は、すべてのエージェント実行ごとにカスタムシステムプロンプトを構築します。このプロンプトは **OpenClaw 管理** であり、pi-coding-agent のデフォルトプロンプトは使用しません。

プロンプトは OpenClaw によって組み立てられ、各エージェント実行に注入されます。

プロバイダー Plugin は、OpenClaw 管理の完全なプロンプトを置き換えることなく、キャッシュ対応のプロンプトガイダンスを提供できます。プロバイダーランタイムは次のことができます。

- 名前付きコアセクションの小さな集合（`interaction_style`、
  `tool_call_style`、`execution_bias`）を置き換える
- プロンプトキャッシュ境界の上に **stable prefix** を注入する
- プロンプトキャッシュ境界の下に **dynamic suffix** を注入する

モデルファミリー固有の調整には、プロバイダー管理の寄与を使ってください。従来の
`before_prompt_build` によるプロンプト変更は、互換性のためか、本当にグローバルなプロンプト変更のために残し、通常のプロバイダー動作には使わないでください。

OpenAI GPT-5 ファミリーのオーバーレイは、コアの実行ルールを小さく保ちつつ、ペルソナ固定、簡潔な出力、ツール規律、並列参照、成果物カバレッジ、検証、不足コンテキスト、ターミナルツール衛生に関するモデル固有ガイダンスを追加します。

## 構造

プロンプトは意図的にコンパクトで、固定セクションを使用します。

- **Tooling**: structured-tool の source-of-truth リマインダーと、ランタイムの tool 使用ガイダンス。
- **Execution Bias**: 簡潔なやり切りガイダンス。実行可能な要求はそのターン内で実行し、完了またはブロックされるまで続行し、弱い tool 結果から回復し、可変状態は実環境で確認し、最終化前に検証します。
- **Safety**: 権力追求的な挙動や監視の回避を避けるための短いガードレールリマインダー。
- **Skills**（利用可能な場合）: 必要に応じて skill 指示を読み込む方法をモデルに伝えます。
- **OpenClaw Self-Update**: `config.schema.lookup` で安全に config を調べ、`config.patch` で config にパッチを当て、`config.apply` で config 全体を置き換え、明示的なユーザー要求がある場合にのみ `update.run` を実行する方法。owner 専用の `gateway` tool も、`tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。これには、それらの保護された exec パスに正規化される従来の `tools.bash.*` エイリアスも含まれます。
- **Workspace**: 作業ディレクトリ（`agents.defaults.workspace`）。
- **Documentation**: OpenClaw docs のローカルパス（repo または npm package）と、それを読むべきタイミング。
- **Workspace Files (injected)**: bootstrap ファイルが下に含まれていることを示します。
- **Sandbox**（有効時）: サンドボックス化されたランタイム、sandbox パス、昇格 exec が利用可能かどうかを示します。
- **Current Date & Time**: ユーザーローカルの時刻、タイムゾーン、時刻形式。
- **Reply Tags**: 対応プロバイダー向けの任意の reply tag 構文。
- **Heartbeats**: デフォルトエージェントで heartbeat が有効な場合の、Heartbeat プロンプトと ack 動作。
- **Runtime**: host、OS、node、model、repo ルート（検出時）、thinking level（1 行）。
- **Reasoning**: 現在の可視性レベル + /reasoning 切り替えヒント。

Tooling セクションには、長時間実行作業向けのランタイムガイダンスも含まれます。

- 将来のフォローアップ（`check back later`、リマインダー、定期作業）には、`exec` の sleep ループ、`yieldMs` の遅延トリック、繰り返しの `process` ポーリングではなく Cron を使う
- `exec` / `process` は、今すぐ開始してバックグラウンドで継続するコマンドにのみ使う
- 自動完了ウェイクが有効な場合は、コマンドを一度だけ開始し、出力または失敗時の push ベースのウェイク経路に依存する
- 実行中コマンドのログ、状態、入力、介入を確認する必要がある場合は `process` を使う
- タスクがより大きい場合は、`sessions_spawn` を優先する。sub-agent の完了は push ベースで、要求元に自動通知される
- 完了待ちのためだけに `subagents list` / `sessions_list` をループでポーリングしない

実験的な `update_plan` tool が有効な場合、Tooling ではさらに、これを自明でない複数ステップ作業にのみ使い、`in_progress` ステップを常にちょうど 1 つに保ち、更新のたびに計画全体を繰り返さないようモデルに指示します。

システムプロンプト内の Safety ガードレールは助言的です。モデルの挙動を導きますが、ポリシーを強制はしません。強制には tool policy、exec 承認、サンドボックス化、チャンネル許可リストを使ってください。運用者は設計上これらを無効化できます。

ネイティブ承認カード/ボタンがあるチャンネルでは、ランタイムプロンプトはエージェントにまずそのネイティブ承認 UI に依存するよう指示します。手動の
`/approve` コマンドを含めるべきなのは、tool 結果がチャット承認は利用できないと示す場合、または手動承認が唯一の経路である場合だけです。

## プロンプトモード

OpenClaw は sub-agent 向けにより小さなシステムプロンプトをレンダリングできます。ランタイムは各実行に `promptMode` を設定します（ユーザー向け config ではありません）。

- `full`（デフォルト）: 上記の全セクションを含みます。
- `minimal`: sub-agent に使用。**Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies**、**Heartbeats** を省略します。Tooling、**Safety**、Workspace、Sandbox、Current Date & Time（既知の場合）、Runtime、注入コンテキストは引き続き利用できます。
- `none`: ベースの identity 行だけを返します。

`promptMode=minimal` の場合、追加の注入プロンプトには **Group Chat Context** ではなく **Subagent Context** というラベルが付きます。

## Workspace bootstrap 注入

bootstrap ファイルはトリムされて **Project Context** の下に追加されるため、モデルは明示的な read を行わなくても identity と profile コンテキストを確認できます。

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（brand-new workspace のみ）
- `MEMORY.md`（存在する場合）

これらのファイルはすべて、ファイル固有のゲートが適用されない限り、毎ターン **コンテキストウィンドウに注入** されます。
通常実行では、デフォルトエージェントで heartbeat が無効な場合、または
`agents.defaults.heartbeat.includeSystemPromptSection` が false の場合、`HEARTBEAT.md` は省略されます。注入されるファイルは簡潔に保ってください。特に `MEMORY.md` は時間とともに大きくなり、予想外に高いコンテキスト使用量や、より頻繁な Compaction につながることがあります。

> **注:** `memory/*.md` の日次ファイルは、通常の bootstrap
> Project Context の一部ではありません。通常のターンでは、
> `memory_search` と `memory_get` tools を通じて必要に応じてアクセスされるため、
> モデルが明示的に読まない限りコンテキストウィンドウを消費しません。例外は
> 裸の `/new` と `/reset` ターンです。この最初のターンでは、ランタイムが最近の日次メモリを
> 一回限りの startup-context ブロックとして前置できる場合があります。

大きなファイルはマーカー付きで切り詰められます。ファイルごとの最大サイズは
`agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で制御されます。ファイル全体で注入される bootstrap
コンテンツの合計は `agents.defaults.bootstrapTotalMaxChars`
（デフォルト: 60000）に制限されます。ファイルがない場合は短い missing-file マーカーが注入されます。切り詰めが発生した場合、
OpenClaw は警告ブロックを Project Context に注入できます。これは
`agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；
デフォルト: `once`）で制御します。

sub-agent セッションでは、コンテキストを小さく保つために `AGENTS.md` と `TOOLS.md` だけを注入します（他の bootstrap ファイルは除外されます）。

内部フックは `agent:bootstrap` を通じてこのステップを横取りし、注入される bootstrap ファイルを変更または置き換えることができます（たとえば `SOUL.md` を別の persona に差し替えるなど）。

エージェントの話し方をあまり汎用的でなくしたい場合は、まず
[SOUL.md Personality Guide](/ja-JP/concepts/soul) から始めてください。

各注入ファイルの寄与量（生のサイズ vs 注入後、切り詰め、さらに tool schema オーバーヘッド）を確認するには、`/context list` または `/context detail` を使います。[Context](/ja-JP/concepts/context) を参照してください。

## 時刻処理

システムプロンプトには、ユーザータイムゾーンがわかっている場合に専用の **Current Date & Time** セクションが含まれます。プロンプトキャッシュを安定させるため、現在は **タイムゾーン** のみを含みます（動的な時計や時刻形式は含みません）。

エージェントが現在時刻を必要とする場合は `session_status` を使ってください。status カードにはタイムスタンプ行が含まれます。同じ tool でセッション単位の model 上書きも任意で設定できます（`model=default` でクリア）。

設定:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完全な挙動の詳細は [Date & Time](/ja-JP/date-time) を参照してください。

## Skills

適格な Skills が存在する場合、OpenClaw は各 skill の **file path** を含むコンパクトな **available skills list**（`formatSkillsForPrompt`）を注入します。プロンプトは、列挙された場所（workspace、managed、または bundled）にある SKILL.md を読み込むために `read` を使うようモデルに指示します。適格な skill が存在しない場合、Skills セクションは省略されます。

適格性には、skill メタデータゲート、ランタイム環境/config チェック、および `agents.defaults.skills` または
`agents.list[].skills` が設定されている場合の実効エージェント skill 許可リストが含まれます。

Plugin 同梱 skill は、その所有 Plugin が有効な場合にのみ適格です。
これにより tool Plugin は、すべての tool 説明にそのガイダンス全体を直接埋め込むことなく、
より深い運用ガイドを公開できます。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

これにより、ベースプロンプトを小さく保ちながら、対象を絞った skill 利用を可能にします。

skills list の予算は skills サブシステムが管理します。

- グローバルデフォルト: `skills.limits.maxSkillsPromptChars`
- エージェントごとの上書き: `agents.list[].skillsLimits.maxSkillsPromptChars`

汎用の境界付きランタイム抜粋は別サーフェスを使います。

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

この分離により、skills のサイズ設定を、`memory_get`、ライブ tool 結果、Compaction 後の AGENTS.md リフレッシュなどのランタイム read/注入サイズ設定から独立させています。

## Documentation

システムプロンプトには **Documentation** セクションが含まれます。ローカル docs が利用可能な場合は、
ローカルの OpenClaw docs ディレクトリ（Git チェックアウトでは `docs/`、npm
package では同梱 docs）を指します。ローカル docs が利用できない場合は、
[https://docs.openclaw.ai](https://docs.openclaw.ai) にフォールバックします。

同じセクションには OpenClaw のソース場所も含まれます。Git チェックアウトではローカルの
ソースルートが公開されるため、エージェントはコードを直接調べられます。package
インストールでは GitHub のソース URL が含まれ、docs が不完全または
古い場合にはそこでソースを確認するようエージェントに指示します。プロンプトにはさらに、
公開 docs ミラー、コミュニティ Discord、Skills 発見用の ClawHub
（[https://clawhub.ai](https://clawhub.ai)）も記載されます。OpenClaw の挙動、コマンド、設定、アーキテクチャについてはまず docs を参照するよう、
また可能なら `openclaw status` を自分で実行するようモデルに指示します
（アクセスできない場合のみユーザーに尋ねます）。

## 関連

- [Agent runtime](/ja-JP/concepts/agent)
- [Agent workspace](/ja-JP/concepts/agent-workspace)
- [Context engine](/ja-JP/concepts/context-engine)
