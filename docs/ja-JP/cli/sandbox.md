---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 隔離されたエージェント実行のための sandbox ランタイムを管理し、有効な sandbox ポリシーを確認する
title: Sandbox CLI
x-i18n:
    generated_at: "2026-04-05T12:39:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# Sandbox CLI

隔離されたエージェント実行のための sandbox ランタイムを管理します。

## 概要

OpenClaw は、セキュリティのために隔離された sandbox ランタイム内でエージェントを実行できます。`sandbox` コマンドは、更新や設定変更の後にそれらのランタイムを確認し、再作成するのに役立ちます。

現在、通常これに該当するものは次のとおりです。

- Docker sandbox コンテナ
- `agents.defaults.sandbox.backend = "ssh"` の場合の SSH sandbox ランタイム
- `agents.defaults.sandbox.backend = "openshell"` の場合の OpenShell sandbox ランタイム

`ssh` と OpenShell `remote` では、再作成は Docker より重要です。

- 初回シード後は、リモートワークスペースが正規のものになります
- `openclaw sandbox recreate` は、選択したスコープに対するその正規のリモートワークスペースを削除します
- 次回使用時に、現在のローカルワークスペースから再度シードされます

## コマンド

### `openclaw sandbox explain`

**有効な** sandbox の mode/scope/workspace access、sandbox tool policy、および昇格ゲートを確認します（修正用の config キーパス付き）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

すべての sandbox ランタイムを、そのステータスと設定とともに一覧表示します。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # browser コンテナのみを一覧表示
openclaw sandbox list --json     # JSON 出力
```

**出力に含まれる内容:**

- ランタイム名とステータス
- バックエンド（`docker`、`openshell` など）
- config ラベルと、現在の config に一致しているかどうか
- 経過時間（作成からの時間）
- アイドル時間（最後の使用からの時間）
- 関連する session/agent

### `openclaw sandbox recreate`

sandbox ランタイムを削除して、更新された config で再作成を強制します。

```bash
openclaw sandbox recreate --all                # すべてのコンテナを再作成
openclaw sandbox recreate --session main       # 特定の session
openclaw sandbox recreate --agent mybot        # 特定の agent
openclaw sandbox recreate --browser            # browser コンテナのみ
openclaw sandbox recreate --all --force        # 確認をスキップ
```

**オプション:**

- `--all`: すべての sandbox コンテナを再作成
- `--session <key>`: 特定の session のコンテナを再作成
- `--agent <id>`: 特定の agent のコンテナを再作成
- `--browser`: browser コンテナのみを再作成
- `--force`: 確認プロンプトをスキップ

**重要:** ランタイムは、次回エージェントが使用されるときに自動的に再作成されます。

## ユースケース

### Docker イメージ更新後

```bash
# 新しいイメージを取得
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 新しいイメージを使うように config を更新
# config を編集: agents.defaults.sandbox.docker.image（または agents.list[].sandbox.docker.image）

# コンテナを再作成
openclaw sandbox recreate --all
```

### sandbox 設定変更後

```bash
# config を編集: agents.defaults.sandbox.*（または agents.list[].sandbox.*）

# 新しい config を適用するために再作成
openclaw sandbox recreate --all
```

### SSH ターゲットまたは SSH 認証情報を変更した後

```bash
# config を編集:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

コアの `ssh` バックエンドでは、再作成により SSH ターゲット上のスコープごとのリモートワークスペースルートが削除されます。次回実行時にローカルワークスペースから再度シードされます。

### OpenShell の source、policy、または mode を変更した後

```bash
# config を編集:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` モードでは、再作成によりそのスコープの正規リモートワークスペースが削除されます。次回実行時にローカルワークスペースから再度シードされます。

### setupCommand 変更後

```bash
openclaw sandbox recreate --all
# または 1 つの agent のみ:
openclaw sandbox recreate --agent family
```

### 特定の agent のみ

```bash
# 1 つの agent のコンテナだけを更新
openclaw sandbox recreate --agent alfred
```

## なぜこれが必要なのか

**問題:** sandbox 設定を更新しても:

- 既存のランタイムは古い設定のまま動作し続ける
- ランタイムは 24 時間非アクティブになって初めて削除される
- 定期的に使用されるエージェントは、古いランタイムを無期限に生かし続ける

**解決策:** `openclaw sandbox recreate` を使って古いランタイムの削除を強制します。次回必要になったとき、現在の設定で自動的に再作成されます。

ヒント: 手動のバックエンド固有クリーンアップよりも `openclaw sandbox recreate` を優先してください。
これは Gateway のランタイムレジストリを使用するため、scope/session key が変わったときの不整合を避けられます。

## 設定

sandbox 設定は `~/.openclaw/openclaw.json` の `agents.defaults.sandbox` 配下にあります（agent ごとの上書きは `agents.list[].sandbox`）:

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // 24 時間アイドルで自動削除
          "maxAgeDays": 7, // 7 日後に自動削除
        },
      },
    },
  },
}
```

## 関連項目

- [Sandbox Documentation](/gateway/sandboxing)
- [Agent Configuration](/concepts/agent-workspace)
- [Doctor Command](/gateway/doctor) - sandbox セットアップを確認
