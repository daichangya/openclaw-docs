---
read_when:
    - スクリプト内でまだ `openclaw daemon ...` を使っているとき
    - サービスのライフサイクルコマンド（install/start/stop/restart/status）が必要なとき
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理用のレガシーエイリアス）'
title: daemon
x-i18n:
    generated_at: "2026-04-05T12:38:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Gateway サービス管理コマンド用のレガシーエイリアスです。

`openclaw daemon ...` は、`openclaw gateway ...` のサービスコマンドと同じサービス制御画面にマッピングされます。

## 使用方法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## サブコマンド

- `status`: サービスのインストール状態を表示し、Gateway のヘルスをプローブ
- `install`: サービスをインストール（`launchd`/`systemd`/`schtasks`）
- `uninstall`: サービスを削除
- `start`: サービスを起動
- `stop`: サービスを停止
- `restart`: サービスを再起動

## 共通オプション

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- ライフサイクル（`uninstall|start|stop|restart`）: `--json`

注意:

- `status` は、可能な場合、プローブ認証用に設定済みの auth SecretRef を解決します。
- このコマンド経路で必須の auth SecretRef が未解決の場合、プローブ接続 / 認証に失敗すると `daemon status --json` は `rpc.authWarning` を報告します。`--token` / `--password` を明示的に渡すか、先にシークレットソースを解決してください。
- プローブが成功した場合、未解決の auth-ref 警告は誤検知を避けるため抑制されます。
- `status --deep` は、ベストエフォートのシステムレベルサービススキャンを追加します。他の gateway 類似サービスを検出した場合、人間向け出力ではクリーンアップのヒントを表示し、1 台のマシンにつき 1 つの gateway が依然として通常の推奨であることを警告します。
- Linux の systemd インストールでは、`status` のトークンドリフトチェックに `Environment=` と `EnvironmentFile=` の両方の unit ソースが含まれます。
- ドリフトチェックは、マージされたランタイム env（まずサービスコマンド env、その後 process env へのフォールバック）を使って `gateway.auth.token` SecretRef を解決します。
- トークン認証が実質的に有効でない場合（`gateway.auth.mode` が明示的に `password` / `none` / `trusted-proxy`、または mode 未設定で password が優先され得て、かつ有効になり得るトークン候補がない場合）、トークンドリフトチェックは config トークン解決をスキップします。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理されている場合、`install` はその SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータには永続化しません。
- トークン認証にトークンが必要で、設定済みトークン SecretRef が未解決の場合、インストールは fail closed します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて `gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまで install はブロックされます。
- 1 台のホストで意図的に複数の gateway を実行する場合は、ポート、config/state、workspace を分離してください。[/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host) を参照してください。

## 推奨

現在のドキュメントと例については [`openclaw gateway`](/cli/gateway) を使用してください。
