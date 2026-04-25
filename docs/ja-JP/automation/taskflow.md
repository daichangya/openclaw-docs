---
read_when:
    - TaskFlowがバックグラウンドタスクとどのように関係するかを理解したい場合
    - リリースノートやドキュメントでTaskFlowまたはopenclaw tasks flowを見かける場合
    - 永続的なフロー状態を調査または管理したい場合
summary: バックグラウンドタスクの上位にあるタスクフローのオーケストレーション層
title: タスクフロー
x-i18n:
    generated_at: "2026-04-25T13:41:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlowは、[バックグラウンドタスク](/ja-JP/automation/tasks)の上位にあるフローのオーケストレーション基盤です。個々のタスクは引き続き分離された作業の単位である一方、TaskFlowは独自の状態、リビジョン追跡、同期セマンティクスを備えた永続的なマルチステップフローを管理します。

## TaskFlowを使うべき場合

作業が複数の順次または分岐するステップにまたがり、Gatewayの再起動をまたいで永続的な進捗追跡が必要な場合は、TaskFlowを使用します。単一のバックグラウンド操作には、通常の[タスク](/ja-JP/automation/tasks)で十分です。

| シナリオ | 使用するもの |
| ------------------------------------- | -------------------- |
| 単一のバックグラウンドジョブ | 通常のタスク |
| マルチステップのパイプライン（Aの後にB、その後C） | TaskFlow（managed） |
| 外部で作成されたタスクを監視する | TaskFlow（mirrored） |
| 単発のリマインダー | Cronジョブ |

## 信頼性の高いスケジュール済みワークフローパターン

市場インテリジェンスのブリーフィングのような定期的なワークフローでは、スケジュール、オーケストレーション、信頼性チェックを別々のレイヤーとして扱います。

1. タイミングには[Scheduled Tasks](/ja-JP/automation/cron-jobs)を使用します。
2. ワークフローが以前のコンテキストを土台にすべき場合は、永続的なcronセッションを使用します。
3. 決定論的なステップ、承認ゲート、再開トークンには[Lobster](/ja-JP/tools/lobster)を使用します。
4. 子タスク、待機、再試行、Gatewayの再起動をまたいでマルチステップ実行を追跡するにはTaskFlowを使用します。

cronの形の例:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

定期的なワークフローで意図的な履歴、前回実行の要約、または継続的なコンテキストが必要な場合は、`isolated`ではなく`session:<id>`を使用します。各実行を新規に開始し、必要な状態がすべてワークフロー内で明示されているべき場合は、`isolated`を使用します。

ワークフロー内では、LLMの要約ステップの前に信頼性チェックを配置します。

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

推奨される事前チェック:

- ブラウザの可用性とプロファイルの選択。たとえば、管理された状態には`openclaw`、サインイン済みのChromeセッションが必要な場合は`user`です。[Browser](/ja-JP/tools/browser)を参照してください。
- 各ソースのAPI認証情報とクォータ。
- 必要なエンドポイントへのネットワーク到達性。
- `lobster`、`browser`、`llm-task`など、エージェントで必要なツールが有効になっていること。
- 事前チェックの失敗が可視化されるように、cronの失敗送信先が設定されていること。[Scheduled Tasks](/ja-JP/automation/cron-jobs#delivery-and-output)を参照してください。

収集された各項目に推奨されるデータ来歴フィールド:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

ワークフローでは、要約前に古い項目を拒否するか、古いとマークするようにします。LLMステップには構造化JSONのみを渡し、その出力で`sourceUrl`、`retrievedAt`、`asOf`を保持するよう求めるべきです。ワークフロー内でスキーマ検証されたモデルステップが必要な場合は、[LLM Task](/ja-JP/tools/llm-task)を使用します。

再利用可能なチームまたはコミュニティ向けワークフローでは、CLI、`.lobster`ファイル、およびセットアップメモをskillまたはpluginとしてパッケージ化し、[ClawHub](/ja-JP/tools/clawhub)を通じて公開します。plugin APIに必要な汎用機能が不足していない限り、ワークフロー固有のガードレールはそのパッケージ内に保持してください。

## 同期モード

### Managed mode

TaskFlowがライフサイクル全体をエンドツーエンドで所有します。フローステップとしてタスクを作成し、それらを完了まで進め、フロー状態を自動的に進行させます。

例: 週次レポートフローが、(1) データを収集し、(2) レポートを生成し、(3) 配信します。TaskFlowは各ステップをバックグラウンドタスクとして作成し、完了を待ってから次のステップに進みます。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mirrored mode

TaskFlowは外部で作成されたタスクを監視し、タスク作成の所有権を持たずにフロー状態を同期させ続けます。これは、タスクがcronジョブ、CLIコマンド、または他のソースから発生し、それらの進捗をフローとして一元的に確認したい場合に便利です。

例: 3つの独立したcronジョブが、まとめて「朝の運用」ルーチンを構成している場合です。mirroredフローは、それらの実行時期や実行方法を制御せずに、全体の進捗を追跡します。

## 永続的な状態とリビジョン追跡

各フローは独自の状態を永続化し、リビジョンを追跡するため、進捗はGatewayの再起動後も維持されます。リビジョン追跡により、複数のソースが同時に同じフローを進めようとした場合の競合検出が可能になります。

## キャンセルの動作

`openclaw tasks flow cancel`は、フローに固定的なキャンセル意図を設定します。フロー内のアクティブなタスクはキャンセルされ、新しいステップは開始されません。キャンセル意図は再起動後も保持されるため、すべての子タスクが終了する前にGatewayが再起動しても、キャンセルされたフローはキャンセルされたままです。

## CLIコマンド

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| コマンド | 説明 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list` | ステータスと同期モード付きで追跡中のフローを表示します |
| `openclaw tasks flow show <id>` | フローIDまたはlookupキーで1つのフローを調査します |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセルします |

## フローとタスクの関係

フローはタスクを置き換えるのではなく、タスクを調整します。1つのフローがその存続期間中に複数のバックグラウンドタスクを動かすことがあります。個々のタスクレコードを調査するには`openclaw tasks`を使用し、オーケストレーションを行うフローを調査するには`openclaw tasks flow`を使用します。

## 関連

- [Background Tasks](/ja-JP/automation/tasks) — フローが調整する、分離された作業の台帳
- [CLI: tasks](/ja-JP/cli/tasks) — `openclaw tasks flow`のCLIコマンドリファレンス
- [Automation Overview](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Cron Jobs](/ja-JP/automation/cron-jobs) — フローに入力される可能性があるスケジュール済みジョブ
