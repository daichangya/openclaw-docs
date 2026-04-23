---
read_when:
    - プロバイダーの再試行動作またはデフォルトの更新
    - プロバイダー送信エラーやレート制限のデバッグ
summary: 送信プロバイダー呼び出しの再試行ポリシー
title: 再試行ポリシー
x-i18n:
    generated_at: "2026-04-23T04:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# 再試行ポリシー

## 目標

- 複数ステップのフロー単位ではなく、HTTP リクエストごとに再試行する。
- 現在のステップのみを再試行して順序を維持する。
- 非冪等な操作の重複を避ける。

## デフォルト

- 試行回数: 3
- 最大遅延上限: 30000 ms
- ジッター: 0.1（10 パーセント）
- プロバイダーのデフォルト:
  - Telegram の最小遅延: 400 ms
  - Discord の最小遅延: 500 ms

## 動作

### モデルプロバイダー

- OpenClaw は、通常の短い再試行はプロバイダー SDK に処理させます。
- Anthropic や OpenAI などの Stainless ベースの SDK では、再試行可能なレスポンス（`408`、`409`、`429`、および `5xx`）に `retry-after-ms` または `retry-after` を含められます。その待機時間が 60 秒を超える場合、OpenClaw は `x-should-retry: false` を注入し、SDK がエラーを即座に返すようにします。これにより、モデルフェイルオーバーで別の認証プロファイルまたはフォールバックモデルへ切り替えられます。
- 上限は `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` で上書きします。
  `0`、`false`、`off`、`none`、`disabled` に設定すると、SDK が長い `Retry-After` の待機を内部で尊重するようになります。

### Discord

- レート制限エラー（HTTP 429）の場合のみ再試行します。
- 利用可能な場合は Discord の `retry_after` を使い、そうでない場合は指数バックオフを使います。

### Telegram

- 一時的なエラー（429、タイムアウト、connect/reset/closed、一時的に利用不可）で再試行します。
- 利用可能な場合は `retry_after` を使い、そうでない場合は指数バックオフを使います。
- Markdown の解析エラーは再試行されず、プレーンテキストにフォールバックします。

## 設定

`~/.openclaw/openclaw.json` で、プロバイダーごとに再試行ポリシーを設定します。

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

## メモ

- 再試行はリクエストごとに適用されます（メッセージ送信、メディアアップロード、リアクション、投票、ステッカー）。
- 複合フローでは、完了済みのステップは再試行しません。
