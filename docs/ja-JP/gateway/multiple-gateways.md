---
read_when:
    - 同じマシンで複数の Gateway を実行する
    - Gateway ごとに、分離された設定、状態、ポートが必要です
summary: 1台のホストで複数の OpenClaw Gateway を実行する（分離、ポート、プロファイル）
title: 複数の Gateway
x-i18n:
    generated_at: "2026-04-21T19:20:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 複数の Gateway（同一ホスト）

ほとんどの構成では、1つの Gateway で複数のメッセージング接続とエージェントを処理できるため、1つの Gateway を使うべきです。より強い分離や冗長性（たとえばレスキューボット）が必要な場合は、プロファイルとポートを分離した別々の Gateway を実行してください。

## 最も推奨されるセットアップ

ほとんどのユーザーにとって、最もシンプルなレスキューボット構成は次のとおりです。

- メインボットはデフォルトプロファイルのままにする
- レスキューボットは `--profile rescue` で実行する
- レスキュー用アカウントには完全に別の Telegram ボットを使う
- レスキューボットは `19789` のような別のベースポートで実行する

これにより、レスキューボットはメインボットから分離されるため、プライマリボットが停止していても設定変更の適用やデバッグができます。派生する browser/canvas/CDP ポートが決して衝突しないように、ベースポート同士は少なくとも20以上離してください。

## レスキューボットのクイックスタート

強い理由がない限り、これをデフォルトの手順として使ってください。

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

メインボットがすでに実行中であれば、通常はこれだけで十分です。

`openclaw --profile rescue onboard` の実行中は、次のようにしてください。

- 別の Telegram ボットトークンを使う
- `rescue` プロファイルのままにする
- メインボットより少なくとも20高いベースポートを使う
- すでに独自に管理しているのでなければ、デフォルトの rescue ワークスペースを受け入れる

オンボーディングがすでにレスキューサービスをインストールしている場合、最後の `gateway install` は不要です。

## これが機能する理由

レスキューボットは、次の専用リソースを持つため独立性を保てます。

- プロファイル/設定
- 状態ディレクトリ
- ワークスペース
- ベースポート（および派生ポート）
- Telegram ボットトークン

ほとんどの構成では、rescue プロファイル用に完全に別の Telegram ボットを使ってください。

- オペレーター専用に保ちやすい
- ボットトークンと識別情報が分離される
- メインボットのチャネル/アプリのインストールから独立している
- メインボットが壊れているときに、DM ベースで簡単に復旧できる経路になる

## `--profile rescue onboard` が変更するもの

`openclaw --profile rescue onboard` は通常のオンボーディングフローを使いますが、すべてを別のプロファイルに書き込みます。

実際には、レスキューボットは次の専用リソースを持つことになります。

- 設定ファイル
- 状態ディレクトリ
- ワークスペース（デフォルトでは `~/.openclaw/workspace-rescue`）
- 管理サービス名

それ以外のプロンプトは通常のオンボーディングと同じです。

## 一般的なマルチ Gateway 構成

上記のレスキューボット構成が最も簡単なデフォルトですが、同じ分離パターンは、1台のホスト上の任意の2つ以上の Gateway の組み合わせにも使えます。

より一般的な構成では、追加する各 Gateway に固有の名前付きプロファイルと固有のベースポートを割り当ててください。

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

両方の Gateway で名前付きプロファイルを使いたい場合も問題ありません。

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

サービスも同じパターンに従います。

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

フォールバック用のオペレーター経路が必要な場合は、レスキューボットのクイックスタートを使ってください。異なるチャネル、テナント、ワークスペース、または運用上の役割のために、複数の長期間稼働する Gateway が必要な場合は、一般的なプロファイルパターンを使ってください。

## 分離チェックリスト

各 Gateway インスタンスごとに、次を固有にしてください。

- `OPENCLAW_CONFIG_PATH` — インスタンスごとの設定ファイル
- `OPENCLAW_STATE_DIR` — インスタンスごとのセッション、認証情報、キャッシュ
- `agents.defaults.workspace` — インスタンスごとのワークスペースルート
- `gateway.port`（または `--port`）— インスタンスごとに固有
- 派生する browser/canvas/CDP ポート

これらが共有されていると、設定の競合とポート競合が発生します。

## ポート対応表（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser 制御サービスのポート = ベース + 2（local loopback のみ）
- canvas host は Gateway HTTP サーバー上で提供される（`gateway.port` と同じポート）
- Browser プロファイルの CDP ポートは `browser.controlPort + 9 .. + 108` から自動割り当てされる

設定または環境変数でこれらのいずれかを上書きする場合は、インスタンスごとに固有である必要があります。

## Browser/CDP に関する注意（よくある落とし穴）

- 複数のインスタンスで `browser.cdpUrl` を同じ値に固定しては **いけません**。
- 各インスタンスには、専用の browser 制御ポートと CDP 範囲（gateway port から派生）が必要です。
- 明示的な CDP ポートが必要な場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定してください。
- リモート Chrome では、`browser.profiles.<name>.cdpUrl` を使ってください（プロファイルごと、インスタンスごと）。

## 手動 env の例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
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

- `gateway status --deep` は、古いインストールによる古い launchd/systemd/schtasks サービスを見つけるのに役立ちます。
- `gateway probe` の `multiple reachable gateways detected` のような警告文は、複数の分離された gateway を意図的に実行している場合にのみ想定されるものです。
