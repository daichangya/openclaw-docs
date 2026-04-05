---
read_when:
    - プロバイダーのリトライ動作またはデフォルトを更新している場合
    - プロバイダーの送信エラーやレート制限をデバッグしている場合
summary: 送信プロバイダー呼び出しのリトライポリシー
title: Retry Policy
x-i18n:
    generated_at: "2026-04-05T12:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55bb261ff567f46ce447be9c0ee0c5b5e6d2776287d7662762656c14108dd607
    source_path: concepts/retry.md
    workflow: 15
---

# Retry Policy

## 目標

- 複数ステップのフロー単位ではなく、HTTPリクエスト単位でリトライします。
- 現在のステップだけをリトライして順序を維持します。
- 非冪等な操作の重複を避けます。

## デフォルト

- 試行回数: 3
- 最大遅延上限: 30000 ms
- ジッター: 0.1（10パーセント）
- プロバイダーのデフォルト:
  - Telegram の最小遅延: 400 ms
  - Discord の最小遅延: 500 ms

## 動作

### Discord

- レート制限エラー（HTTP 429）の場合のみリトライします。
- 利用可能な場合はDiscordの `retry_after` を使用し、それ以外は指数バックオフを使用します。

### Telegram

- 一時的なエラー（429、timeout、connect/reset/closed、一時的に利用不可）でリトライします。
- 利用可能な場合は `retry_after` を使用し、それ以外は指数バックオフを使用します。
- Markdownのパースエラーはリトライされず、プレーンテキストにフォールバックします。

## 設定

`~/.openclaw/openclaw.json` でプロバイダーごとにリトライポリシーを設定します:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 注意

- リトライはリクエスト単位で適用されます（メッセージ送信、メディアアップロード、リアクション、poll、sticker）。
- 複合フローでは、完了済みのステップはリトライしません。
