---
read_when:
    - DockerでOpenClawを頻繁に実行していて、日常的なコマンドを短くしたい場合
    - ダッシュボード、ログ、トークン設定、ペアリングフロー向けのヘルパーレイヤーが欲しい場合
summary: DockerベースのOpenClawインストール向けClawDockシェルヘルパー
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T12:47:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDockは、DockerベースのOpenClawインストール向けの小さなシェルヘルパーレイヤーです。

長い `docker compose ...` 呼び出しの代わりに、`clawdock-start`、`clawdock-dashboard`、`clawdock-fix-token` のような短いコマンドを使えるようになります。

まだDockerをセットアップしていない場合は、まず [Docker](/install/docker) から始めてください。

## インストール

正規のヘルパーパスを使用します:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

以前に `scripts/shell-helpers/clawdock-helpers.sh` からClawDockをインストールしていた場合は、新しい `scripts/clawdock/clawdock-helpers.sh` パスから再インストールしてください。古いraw GitHubパスは削除されました。

## できること

### 基本操作

| Command            | Description            |
| ------------------ | ---------------------- |
| `clawdock-start`   | gatewayを起動          |
| `clawdock-stop`    | gatewayを停止          |
| `clawdock-restart` | gatewayを再起動        |
| `clawdock-status`  | コンテナ状態を確認     |
| `clawdock-logs`    | gatewayログを追跡      |

### コンテナアクセス

| Command                   | Description                            |
| ------------------------- | -------------------------------------- |
| `clawdock-shell`          | gatewayコンテナ内でシェルを開く        |
| `clawdock-cli <command>`  | Docker内でOpenClaw CLIコマンドを実行   |
| `clawdock-exec <command>` | コンテナ内で任意のコマンドを実行       |

### Web UIとペアリング

| Command                 | Description                  |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | コントロールUIのURLを開く    |
| `clawdock-devices`      | 保留中のデバイスペアリングを一覧表示 |
| `clawdock-approve <id>` | ペアリングリクエストを承認   |

### セットアップとメンテナンス

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `clawdock-fix-token` | コンテナ内でgatewayトークンを設定            |
| `clawdock-update`    | pull、rebuild、restartを実行                 |
| `clawdock-rebuild`   | Dockerイメージのみをrebuild                  |
| `clawdock-clean`     | コンテナとボリュームを削除                   |

### ユーティリティ

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `clawdock-health`      | gatewayヘルスチェックを実行                |
| `clawdock-token`       | gatewayトークンを表示                      |
| `clawdock-cd`          | OpenClawプロジェクトディレクトリへ移動     |
| `clawdock-config`      | `~/.openclaw` を開く                       |
| `clawdock-show-config` | 値をマスクして設定ファイルを表示           |
| `clawdock-workspace`   | ワークスペースディレクトリを開く           |

## 初回フロー

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

ブラウザーにペアリングが必要と表示された場合:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 設定とシークレット

ClawDockは、[Docker](/install/docker) で説明されているのと同じDocker設定分割で動作します:

- イメージ名、ポート、gatewayトークンのようなDocker固有の値には `<project>/.env`
- envベースのプロバイダーキーとボットトークンには `~/.openclaw/.env`
- 保存されたプロバイダーOAuth/APIキー認証には `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 動作設定には `~/.openclaw/openclaw.json`

`.env` ファイルと `openclaw.json` をすばやく確認したい場合は `clawdock-show-config` を使ってください。表示出力では `.env` の値がマスクされます。

## 関連ページ

- [Docker](/install/docker)
- [Docker VM Runtime](/install/docker-vm-runtime)
- [Updating](/install/updating)
