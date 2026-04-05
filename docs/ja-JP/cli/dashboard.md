---
read_when:
    - 現在の token を使って Control UI を開きたいとき
    - ブラウザを起動せずに URL を表示したいとき
summary: '`openclaw dashboard` の CLI リファレンス（Control UI を開く）'
title: dashboard
x-i18n:
    generated_at: "2026-04-05T12:38:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

現在の認証を使って Control UI を開きます。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注意:

- `dashboard` は、可能な場合は設定済みの `gateway.auth.token` SecretRefs を解決します。
- SecretRef 管理の token（解決済みまたは未解決）の場合、`dashboard` は、外部シークレットが端末出力、クリップボード履歴、またはブラウザ起動引数で露出しないように、token なしの URL を表示/コピー/オープンします。
- `gateway.auth.token` が SecretRef 管理だがこのコマンド経路では未解決の場合、このコマンドは無効な token プレースホルダーを埋め込む代わりに、token なしの URL と明示的な対処ガイダンスを表示します。
