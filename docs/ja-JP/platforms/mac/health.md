---
read_when:
    - mac app の正常性インジケーターをデバッグしている
summary: macOS app が gateway / Baileys の正常性状態をどのように報告するか
title: 正常性チェック（macOS）
x-i18n:
    generated_at: "2026-04-05T12:50:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# macOS での正常性チェック

メニューバー app から、リンクされたチャンネルが正常かどうかを確認する方法。

## メニューバー

- ステータスドットは現在 Baileys の正常性を反映します:
  - 緑: リンク済み + 最近ソケットが開いている。
  - オレンジ: 接続中 / 再試行中。
  - 赤: ログアウト済み、または probe 失敗。
- 2 行目には「linked · auth 12m」と表示されるか、失敗理由が表示されます。
- 「Run Health Check」メニュー項目はオンデマンドの probe を起動します。

## 設定

- General タブには Health カードが追加され、linked auth age、session-store path / 件数、前回チェック時刻、前回エラー / status code、および Run Health Check / Reveal Logs ボタンが表示されます。
- UI はキャッシュされたスナップショットを使うため即座に読み込まれ、オフライン時も適切にフォールバックします。
- **Channels タブ** には WhatsApp / Telegram の channel status とコントロール（login QR、logout、probe、前回 disconnect / error）が表示されます。

## Probe の仕組み

- app は `ShellExecutor` 経由で約 60 秒ごと、およびオンデマンドで `openclaw health --json` を実行します。この probe は資格情報を読み込み、メッセージを送信せずに status を報告します。
- 点滅を避けるため、最後に良好だったスナップショットと最後のエラーを別々にキャッシュし、それぞれのタイムスタンプを表示します。

## 判断に迷った場合

- [Gateway health](/gateway/health) にある CLI フロー（`openclaw status`、`openclaw status --deep`、`openclaw health --json`）も引き続き使えます。また、`web-heartbeat` / `web-reconnect` については `/tmp/openclaw/openclaw-*.log` を `tail` してください。
