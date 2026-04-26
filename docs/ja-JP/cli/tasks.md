---
read_when:
    - バックグラウンドタスクの記録を確認、監査、またはキャンセルしたい場合
    - '`openclaw tasks flow` の下にある TaskFlow コマンドをドキュメント化している場合'
summary: '`openclaw tasks` の CLI リファレンス（バックグラウンドタスク台帳と TaskFlow 状態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

永続的なバックグラウンドタスクと TaskFlow 状態を確認します。サブコマンドなしの
`openclaw tasks` は `openclaw tasks list` と同等です。

ライフサイクルと配信モデルについては、[Background Tasks](/ja-JP/automation/tasks) を参照してください。

## 使用方法

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## ルートオプション

- `--json`: JSON を出力します。
- `--runtime <name>`: 種別で絞り込みます: `subagent`、`acp`、`cron`、または `cli`。
- `--status <name>`: ステータスで絞り込みます: `queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled`、または `lost`。

## サブコマンド

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

追跡中のバックグラウンドタスクを新しい順に一覧表示します。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

タスク ID、実行 ID、またはセッションキーで 1 件のタスクを表示します。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

実行中タスクの通知ポリシーを変更します。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

実行中のバックグラウンドタスクをキャンセルします。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

古い、lost、配信失敗、またはその他の不整合なタスクおよび TaskFlow レコードを検出します。`cleanupAfter` まで保持される lost タスクは警告です。期限切れ、またはスタンプのない lost タスクはエラーです。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

タスクおよび TaskFlow の整合、クリーンアップスタンプ付与、削除のプレビューまたは適用を行います。
Cron タスクでは、古いアクティブタスクを `lost` とマークする前に、整合処理で永続化された実行ログ/ジョブ状態を使用するため、
メモリ内の Gateway ランタイム状態が失われただけで、完了済み Cron 実行が誤った監査エラーになることはありません。
オフラインの CLI 監査は、Gateway のプロセスローカルな Cron アクティブジョブ集合に対しては
決定的ではありません。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

タスク台帳配下の永続的な TaskFlow 状態を確認またはキャンセルします。

## 関連

- [CLI reference](/ja-JP/cli)
- [Background tasks](/ja-JP/automation/tasks)
