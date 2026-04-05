---
read_when:
    - Task Flow がバックグラウンドタスクとどう関係するかを理解したい
    - リリースノートやドキュメントで Task Flow または openclaw tasks flow を見かけた
    - 永続的なフロー状態を調査または管理したい
summary: バックグラウンドタスクの上にある Task Flow のフローオーケストレーション層
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T12:34:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow は、[バックグラウンドタスク](/automation/tasks) の上位にあるフローオーケストレーション基盤です。個々のタスクは切り離された作業の単位のままでありながら、独自の状態、リビジョン追跡、同期セマンティクスを持つ永続的な複数ステップのフローを管理します。

## Task Flow を使うタイミング

作業が複数の連続したステップまたは分岐ステップにまたがり、Gateway の再起動をまたいで永続的な進捗追跡が必要な場合は、Task Flow を使用します。単一のバックグラウンド操作であれば、通常の [task](/automation/tasks) で十分です。

| シナリオ                              | 使用するもの         |
| ------------------------------------- | -------------------- |
| 単一のバックグラウンドジョブ          | 通常のタスク         |
| 複数ステップのパイプライン（A→B→C）   | Task Flow（管理型）  |
| 外部で作成されたタスクを監視する      | Task Flow（ミラー型） |
| 単発のリマインダー                    | Cron ジョブ          |

## 同期モード

### 管理型モード

Task Flow はライフサイクル全体をエンドツーエンドで所有します。フローステップとしてタスクを作成し、それらを完了まで進め、フロー状態を自動的に前進させます。

例: 毎週のレポートフローでは、(1) データを収集し、(2) レポートを生成し、(3) 配信します。Task Flow は各ステップをバックグラウンドタスクとして作成し、完了を待ってから次のステップに進みます。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### ミラー型モード

Task Flow は外部で作成されたタスクを監視し、タスク作成の所有権を持たずにフロー状態を同期させます。これは、タスクが Cron ジョブ、CLI コマンド、またはその他のソースから発生し、それらの進捗をフローとして統合的に把握したい場合に役立ちます。

例: 3 つの独立した Cron ジョブが一緒になって「morning ops」ルーチンを構成している場合です。ミラー型フローは、それらがいつどのように実行されるかを制御せずに、集合的な進捗を追跡します。

## 永続状態とリビジョン追跡

各フローは独自の状態を永続化し、進捗が Gateway の再起動をまたいでも維持されるようにリビジョンを追跡します。リビジョン追跡により、複数のソースが同じフローを同時に進めようとしたときの競合検出が可能になります。

## キャンセル動作

`openclaw tasks flow cancel` は、フローに対して持続的なキャンセル意図を設定します。フロー内のアクティブなタスクはキャンセルされ、新しいステップは開始されません。キャンセル意図は再起動をまたいで保持されるため、すべての子タスクが終了する前に Gateway が再起動しても、キャンセルされたフローはキャンセルされたままです。

## CLI コマンド

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| コマンド                          | 説明                                          |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | 追跡中のフローをステータスと同期モード付きで表示 |
| `openclaw tasks flow show <id>`   | フロー ID または lookup key で 1 つのフローを調査 |
| `openclaw tasks flow cancel <id>` | 実行中のフローとそのアクティブなタスクをキャンセル |

## フローとタスクの関係

フローはタスクを調整するものであり、置き換えるものではありません。1 つのフローがそのライフタイムの間に複数のバックグラウンドタスクを動かすことがあります。個々のタスクレコードを調べるには `openclaw tasks` を使用し、オーケストレーションを行うフローを調べるには `openclaw tasks flow` を使用してください。

## 関連

- [Background Tasks](/automation/tasks) — フローが調整する、切り離された作業の台帳
- [CLI: tasks](/cli/index#tasks) — `openclaw tasks flow` の CLI コマンドリファレンス
- [Automation Overview](/automation) — すべての自動化メカニズムの概要
- [Cron Jobs](/automation/cron-jobs) — フローへの入力元になり得るスケジュール済みジョブ
