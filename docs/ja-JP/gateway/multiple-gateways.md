---
read_when:
    - 同じマシンで複数のGatewayを実行する
    - Gatewayごとに分離された設定、状態、ポートが必要です
summary: 1台のホストで複数のOpenClaw Gatewayを実行する（分離、ポート、プロファイル）
title: 複数のGateway
x-i18n:
    generated_at: "2026-04-21T17:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 複数のGateway（同一ホスト）

ほとんどの構成では1つのGatewayを使用すべきです。1つのGatewayで複数のメッセージング接続とエージェントを処理できるためです。より強い分離や冗長性（例: レスキューボット）が必要な場合は、分離されたプロファイル/ポートで別々のGatewayを実行してください。

## 分離チェックリスト（必須）

- `OPENCLAW_CONFIG_PATH` — インスタンスごとの設定ファイル
- `OPENCLAW_STATE_DIR` — インスタンスごとのセッション、認証情報、キャッシュ
- `agents.defaults.workspace` — インスタンスごとのワークスペースルート
- `gateway.port`（または `--port`）— インスタンスごとに一意
- 派生ポート（browser/canvas）は重複してはいけません

これらを共有すると、設定の競合やポートの衝突が発生します。

## 推奨: メインにはデフォルトプロファイルを使い、レスキューには名前付きプロファイルを使う

プロファイルは `OPENCLAW_STATE_DIR` と `OPENCLAW_CONFIG_PATH` を自動的にスコープし、サービス名に接尾辞を付けます。ほとんどのレスキューボット構成では、メインボットはデフォルトプロファイルのままにし、レスキューボットにだけ `rescue` のような名前付きプロファイルを割り当ててください。

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

サービス:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

両方のGatewayで名前付きプロファイルを使いたい場合でも動作しますが、必須ではありません。

## レスキューボットガイド

推奨構成:

- メインボットはデフォルトプロファイルのままにする
- レスキューボットは `--profile rescue` で実行する
- レスキューアカウントには完全に別のTelegramボットを使う
- レスキューボットは `19001` のような別のベースポートにする

こうすることで、メインボットからレスキューボットを分離でき、プライマリボットが停止していても、デバッグや設定変更の適用ができます。派生する browser/canvas/CDP ポートが衝突しないよう、ベースポートの間は少なくとも20空けてください。

### 推奨されるレスキューチャンネル/アカウント

ほとんどの構成では、レスキュープロファイルには完全に別のTelegramボットを使ってください。

Telegramを使う理由:

- オペレーター専用にしやすい
- ボットトークンとIDが分離される
- メインボットのチャンネル/アプリのインストールから独立している
- メインボットが壊れたときにDMベースの簡単な復旧経路になる

重要なのは完全な独立性です。別のボットアカウント、別の認証情報、別のOpenClawプロファイル、別のワークスペース、別のポートが必要です。

### 推奨インストールフロー

特別な理由がない限り、これをデフォルト構成として使ってください。

```bash
# Main bot (default profile, port 18789)
openclaw onboard
openclaw gateway install

# Rescue bot (separate Telegram bot, separate profile, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

`openclaw --profile rescue onboard` の実行中:

- 別のTelegramボットトークンを使う
- `rescue` プロファイルを維持する
- メインボットより少なくとも20高いベースポートを使う
- すでに自分で管理している場合を除き、デフォルトのレスキューワークスペースを受け入れる

オンボーディングですでにレスキューサービスがインストールされている場合、最後の `gateway install` は不要です。

### オンボーディングで変更される内容

`openclaw --profile rescue onboard` は通常のオンボーディングフローを使いますが、すべてを別のプロファイルに書き込みます。

実際には、レスキューボットは次の専用領域を持つことになります。

- 設定ファイル
- 状態ディレクトリ
- ワークスペース（デフォルトでは `~/.openclaw/workspace-rescue`）
- 管理サービス名

それ以外のプロンプトは通常のオンボーディングと同じです。

## ポートマッピング（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser control service port = ベース + 2（loopback のみ）
- canvas host はGateway HTTPサーバーで提供されます（`gateway.port` と同じポート）
- Browser profile CDP ports は `browser.controlPort + 9 .. + 108` から自動割り当てされます

設定または環境変数でこれらを上書きする場合は、インスタンスごとに一意に保つ必要があります。

## Browser/CDP の注意点（よくある落とし穴）

- 複数のインスタンスで `browser.cdpUrl` を同じ値に固定**しないでください**。
- 各インスタンスには、それぞれ専用の browser control port と CDP 範囲（gateway port から派生）が必要です。
- 明示的なCDPポートが必要な場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定してください。
- リモートChromeでは、`browser.profiles.<name>.cdpUrl` を使ってください（プロファイルごと、インスタンスごと）。

## 手動 env 例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## クイックチェック

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

解釈:

- `gateway status --deep` は、古いインストールから残っている古い launchd/systemd/schtasks サービスの検出に役立ちます。
- `gateway probe` の `multiple reachable gateways detected` のような警告テキストは、意図的に複数の分離されたGatewayを実行している場合にのみ想定されるものです。
