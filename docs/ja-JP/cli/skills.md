---
read_when:
    - 利用可能で実行準備が整っている Skills を確認したいとき
    - ClawHub から Skills を検索、インストール、または更新したいとき
    - Skills に必要な不足バイナリ / env / config をデバッグしたいとき
summary: '`openclaw skills` の CLI リファレンス（search/install/update/list/info/check）'
title: skills
x-i18n:
    generated_at: "2026-04-05T12:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

ローカルの Skills を確認し、ClawHub から Skills をインストール/更新します。

関連:

- Skills システム: [Skills](/tools/skills)
- Skills 設定: [Skills config](/tools/skills-config)
- ClawHub インストール: [ClawHub](/tools/clawhub)

## コマンド

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search` / `install` / `update` は ClawHub を直接使用し、アクティブな
ワークスペースの `skills/` ディレクトリにインストールします。`list` / `info` / `check` は引き続き、現在のワークスペースと config から見えるローカルの
Skills を確認します。

この CLI の `install` コマンドは、ClawHub から skill フォルダーをダウンロードします。オンボーディングや Skills 設定から Gateway 経由でトリガーされる
skill 依存関係のインストールでは、代わりに別の
`skills.install` リクエスト経路が使われます。

注記:

- `search [query...]` は任意のクエリを受け取ります。省略すると、デフォルトの
  ClawHub 検索フィードを閲覧します。
- `search --limit <n>` は返される結果数の上限を設定します。
- `install --force` は、同じ
  slug の既存ワークスペース skill フォルダーを上書きします。
- `update --all` は、アクティブなワークスペース内の追跡対象 ClawHub インストールのみを更新します。
- サブコマンドを指定しない場合、デフォルト動作は `list` です。
- `list`、`info`、`check` はレンダリング済み出力を stdout に書き出します。
  `--json` を使うと、機械可読なペイロードはパイプやスクリプト向けに stdout に維持されます。
