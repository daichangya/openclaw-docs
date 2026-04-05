---
read_when:
    - 保存されたsessionsを一覧表示して最近のアクティビティを確認したい場合
summary: '`openclaw sessions`のCLIリファレンス（保存されたsessionsと使用状況の一覧）'
title: sessions
x-i18n:
    generated_at: "2026-04-05T12:39:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

保存された会話sessionを一覧表示します。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

スコープ選択:

- デフォルト: 設定されたdefault agent store
- `--verbose`: 詳細ログ
- `--agent <id>`: 1つの設定済みagent store
- `--all-agents`: すべての設定済みagent storesを集約
- `--store <path>`: 明示的なstoreパス（`--agent`または`--all-agents`とは併用不可）

`openclaw sessions --all-agents`は設定済みagent storesを読み取ります。GatewayとACPの
session discoveryはこれより広く、デフォルトの`agents/`ルートまたは
テンプレート化された`session.store`ルート配下で見つかったディスク上のみのstoresも含みます。これらの
検出されたstoresは、agentルート内の通常の`sessions.json`ファイルに解決される必要があります。
symlinkおよびルート外パスはスキップされます。

JSON例:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Cleanupメンテナンス

次の書き込みサイクルを待たずに、今すぐメンテナンスを実行します:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`はconfigの`session.maintenance`設定を使用します。

- スコープに関する注記: `openclaw sessions cleanup`がメンテナンスするのはsession stores/transcriptsのみです。cron実行ログ（`cron/runs/<jobId>.jsonl`）は削除しません。これらは[cron設定](/automation/cron-jobs#configuration)の`cron.runLog.maxBytes`および`cron.runLog.keepLines`で管理され、[Cronメンテナンス](/automation/cron-jobs#maintenance)で説明されています。

- `--dry-run`: 書き込みを行わずに、何件のエントリがprune/capされるかをプレビューします。
  - テキストモードでは、dry-runはsessionごとのアクションテーブル（`Action`、`Key`、`Age`、`Model`、`Flags`）を表示するため、何が保持され、何が削除されるかを確認できます。
- `--enforce`: `session.maintenance.mode`が`warn`でもメンテナンスを適用します。
- `--fix-missing`: transcriptファイルが存在しないエントリを削除します。通常であればage/count条件で対象外であっても削除します。
- `--active-key <key>`: 特定のアクティブkeyをディスク予算によるevictionから保護します。
- `--agent <id>`: 1つの設定済みagent storeに対してcleanupを実行します。
- `--all-agents`: すべての設定済みagent storesに対してcleanupを実行します。
- `--store <path>`: 特定の`sessions.json`ファイルに対して実行します。
- `--json`: JSON要約を出力します。`--all-agents`では、storeごとに1つの要約が出力されます。

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

関連:

- Session設定: [Configuration reference](/gateway/configuration-reference#session)
