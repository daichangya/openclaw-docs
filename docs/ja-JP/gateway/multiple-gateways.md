---
read_when:
    - 同じマシンで複数の Gateway を実行する
    - Gateway ごとに分離された config/state/ポートが必要な場合
summary: 1 台のホストで複数の OpenClaw Gateway を実行する（分離、ポート、プロファイル）
title: 複数の Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

ほとんどの構成では 1 つの Gateway を使うべきです。1 つの Gateway で複数のメッセージング接続と agent を扱えるからです。より強い分離や冗長性（たとえば rescue bot）が必要な場合は、分離された profile/port を使って別々の Gateway を実行してください。

## 最も推奨されるセットアップ

ほとんどのユーザーにとって、最も簡単な rescue-bot セットアップは次のとおりです。

- メイン bot は default profile のままにする
- rescue bot は `--profile rescue` で実行する
- rescue アカウントには完全に別の Telegram bot を使う
- rescue bot は `19789` のような別のベースポートで動かす

これにより rescue bot はメイン bot から分離され、プライマリ bot が停止していてもデバッグや
config 変更を適用できます。派生する browser/canvas/CDP ポートが衝突しないよう、
ベースポート間は少なくとも 20 ポート空けてください。

## Rescue-Bot クイックスタート

強い理由がない限り、これをデフォルト経路として使ってください。

```bash
# Rescue bot（別の Telegram bot、別の profile、ポート 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

メイン bot がすでに動作している場合、通常これだけで十分です。

`openclaw --profile rescue onboard` 中には:

- 別の Telegram bot token を使う
- `rescue` profile のままにする
- メイン bot より少なくとも 20 高いベースポートを使う
- すでに自分で管理しているのでなければ、デフォルトの rescue ワークスペースを受け入れる

オンボーディングがすでに rescue サービスをインストールしている場合は、最後の
`gateway install` は不要です。

## これが機能する理由

rescue bot は次を独自に持つため、独立性を保てます。

- profile/config
- state ディレクトリ
- ワークスペース
- ベースポート（および派生ポート）
- Telegram bot token

ほとんどの構成では、rescue profile には完全に別の Telegram bot を使ってください。

- operator 専用に保ちやすい
- bot token と identity が別になる
- メイン bot の channel/app install から独立する
- メイン bot が壊れているときの DM ベースの復旧経路としてシンプル

## `--profile rescue onboard` が変更するもの

`openclaw --profile rescue onboard` は通常のオンボーディングフローを使いますが、
すべてを別 profile に書き込みます。

実際には、rescue bot は次を独自に持つことになります。

- config ファイル
- state ディレクトリ
- ワークスペース（デフォルトでは `~/.openclaw/workspace-rescue`）
- 管理サービス名

それ以外のプロンプトは通常のオンボーディングと同じです。

## 一般的なマルチ Gateway セットアップ

上記の rescue-bot レイアウトが最も簡単なデフォルトですが、同じ分離
パターンは 1 台のホスト上の任意の Gateway の組み合わせやグループにも使えます。

より一般的なセットアップでは、各追加 Gateway に独自の名前付き profile と
独自のベースポートを与えてください。

```bash
# main（default profile）
openclaw setup
openclaw gateway --port 18789

# 追加 Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

両方の Gateway を名前付き profile にしたい場合も可能です。

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

フォールバック用の operator レーンが欲しい場合は rescue-bot クイックスタートを使ってください。
異なるチャネル、テナント、ワークスペース、または運用上の役割のために複数の長期稼働 Gateway が必要な場合は、
一般的な profile パターンを使ってください。

## 分離チェックリスト

各 Gateway インスタンスごとに、次を一意に保ってください。

- `OPENCLAW_CONFIG_PATH` — インスタンスごとの config ファイル
- `OPENCLAW_STATE_DIR` — インスタンスごとのセッション、資格情報、キャッシュ
- `agents.defaults.workspace` — インスタンスごとのワークスペースルート
- `gateway.port`（または `--port`）— インスタンスごとに一意
- 派生する browser/canvas/CDP ポート

これらを共有すると、config の競合とポート衝突が発生します。

## ポートマッピング（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser control service ポート = ベース + 2（loopback のみ）
- canvas host は Gateway HTTP サーバー上で配信されます（`gateway.port` と同じポート）
- Browser profile CDP ポートは `browser.controlPort + 9 .. + 108` から自動割り当てされます

config または env でこれらのいずれかを上書きする場合は、インスタンスごとに一意に保つ必要があります。

## Browser/CDP に関する注意（よくある落とし穴）

- 複数インスタンスで `browser.cdpUrl` を同じ値に固定**しないでください**。
- 各インスタンスには独自の browser control ポートと CDP 範囲が必要です（gateway port から派生）。
- 明示的な CDP ポートが必要な場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定してください。
- Remote Chrome では `browser.profiles.<name>.cdpUrl` を使ってください（profile ごと、インスタンスごと）。

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

見方:

- `gateway status --deep` は、古いインストールに由来する古い launchd/systemd/schtasks サービスの検出に役立ちます。
- `gateway probe` の警告テキスト（`multiple reachable gateways detected` など）は、意図的に複数の分離 Gateway を実行している場合にのみ想定されるものです。

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Gateway lock](/ja-JP/gateway/gateway-lock)
- [Configuration](/ja-JP/gateway/configuration)
