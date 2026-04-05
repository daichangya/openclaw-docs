---
read_when:
    - 同じマシン上で複数の Gateway を実行する
    - Gateway ごとに分離された設定 / state / ポートが必要
summary: 1 台のホストで複数の OpenClaw Gateway を実行する（分離、ポート、プロファイル）
title: 複数の Gateway
x-i18n:
    generated_at: "2026-04-05T12:44:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 複数の Gateway（同一ホスト）

ほとんどのセットアップでは 1 つの Gateway を使うべきです。単一の Gateway で複数のメッセージング接続とエージェントを扱えるためです。より強い分離や冗長性（たとえばレスキューボット）が必要な場合は、分離されたプロファイル / ポートで別々の Gateway を実行してください。

## 分離チェックリスト（必須）

- `OPENCLAW_CONFIG_PATH` — インスタンスごとの設定ファイル
- `OPENCLAW_STATE_DIR` — インスタンスごとのセッション、認証情報、キャッシュ
- `agents.defaults.workspace` — インスタンスごとのワークスペースルート
- `gateway.port`（または `--port`）— インスタンスごとに一意
- 派生ポート（browser / canvas）は重複してはいけない

これらを共有すると、設定競合やポート競合が発生します。

## 推奨: プロファイル（`--profile`）

プロファイルは `OPENCLAW_STATE_DIR` と `OPENCLAW_CONFIG_PATH` を自動的にスコープ分けし、サービス名にサフィックスを付けます。

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

プロファイルごとのサービス:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## レスキューボットガイド

同じホスト上で 2 台目の Gateway を、以下をそれぞれ専用にして実行します。

- プロファイル / 設定
- state dir
- ワークスペース
- ベースポート（および派生ポート）

これにより、メインボットが停止している場合でも、レスキューボットをメインボットから分離したまま、デバッグや設定変更の適用ができます。

ポート間隔: 派生する browser / canvas / CDP ポートが衝突しないよう、ベースポート間には少なくとも 20 ポート空けてください。

### インストール方法（レスキューボット）

```bash
# Main bot（既存または新規、--profile パラメーターなし）
# ポート 18789 + Chrome CDC/Canvas/... ポートで実行
openclaw onboard
openclaw gateway install

# Rescue bot（分離されたプロファイル + ポート）
openclaw --profile rescue onboard
# 注:
# - ワークスペース名はデフォルトで -rescue が後置されます
# - ポートは少なくとも 18789 + 20 ポート以上にしてください。
#   できれば 19789 のように、完全に異なるベースポートを選んでください。
# - それ以外のオンボーディングは通常と同じです

# サービスをインストールするには（セットアップ中に自動実行されなかった場合）
openclaw --profile rescue gateway install
```

## ポートマッピング（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser control service のポート = ベース + 2（loopback のみ）
- canvas host は Gateway HTTP サーバー上で提供される（`gateway.port` と同じポート）
- Browser profile の CDP ポートは `browser.controlPort + 9 .. + 108` から自動割り当てされる

設定または環境変数でこれらのいずれかを上書きする場合は、インスタンスごとに一意である必要があります。

## Browser / CDP に関する注意（よくある落とし穴）

- 複数インスタンスで `browser.cdpUrl` を同じ値に固定してはいけません。
- 各インスタンスには、専用の browser control port と CDP 範囲（gateway port から派生）が必要です。
- 明示的な CDP ポートが必要な場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定してください。
- リモート Chrome には `browser.profiles.<name>.cdpUrl` を使ってください（プロファイルごと、インスタンスごと）。

## 手動 env の例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## クイックチェック

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

解釈:

- `gateway status --deep` は、古いインストールから残っている launchd / systemd / schtasks サービスを見つけるのに役立ちます。
- `multiple reachable gateways detected` のような `gateway probe` の警告文は、意図的に複数の分離された Gateway を実行している場合にのみ想定されるものです。
