---
read_when:
    - OpenClaw.app をパッケージングしている
    - macOS の gateway launchd service をデバッグしている
    - macOS 向けの gateway CLI をインストールしている
summary: macOS 上の Gateway ランタイム（外部 launchd service）
title: macOS 上の Gateway
x-i18n:
    generated_at: "2026-04-05T12:50:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# macOS 上の Gateway（外部 launchd）

OpenClaw.app は、Node / Bun や Gateway ランタイムをもう同梱しません。macOS app
は**外部の** `openclaw` CLI インストールを前提とし、Gateway を子プロセスとして
起動せず、Gateway を動かし続けるためのユーザーごとの launchd service を管理します
（または、すでにローカル Gateway が実行中ならそれに接続します）。

## CLI をインストールする（local mode では必須）

Mac 上のデフォルトランタイムは Node 24 です。互換性のために、Node 22 LTS（現在 `22.14+`）も引き続き動作します。その後、`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

macOS app の **Install CLI** ボタンは、app が内部で使うのと同じグローバルインストールフローを実行します。まず npm を優先し、次に pnpm、それが唯一検出されたパッケージマネージャーである場合にのみ bun を使います。Node は引き続き推奨される Gateway ランタイムです。

## Launchd（LaunchAgent としての Gateway）

ラベル:

- `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。レガシーな `com.openclaw.*` が残っている場合があります）

Plist の場所（ユーザーごと）:

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理者:

- macOS app は Local mode で LaunchAgent のインストール / 更新を管理します。
- CLI からインストールすることもできます: `openclaw gateway install`。

動作:

- 「OpenClaw Active」で LaunchAgent を有効 / 無効にします。
- app を終了しても gateway は停止しません（launchd が稼働を維持します）。
- 設定されたポートですでに Gateway が動作している場合、app は
  新しいものを起動せずにそれに接続します。

ログ:

- launchd の stdout / stderr: `/tmp/openclaw/openclaw-gateway.log`

## バージョン互換性

macOS app は gateway のバージョンを自身のバージョンと照合します。互換性がない場合は、app のバージョンに合わせてグローバル CLI を更新してください。

## スモークチェック

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

その後:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
