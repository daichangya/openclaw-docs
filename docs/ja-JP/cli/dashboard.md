---
read_when:
    - 現在のトークンで Control UI を開きたい場合
    - ブラウザを起動せずに URL を表示したい場合
summary: '`openclaw dashboard` の CLI リファレンス（Control UI を開く）'
title: ダッシュボード
x-i18n:
    generated_at: "2026-04-25T13:44:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
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

- `dashboard` は、可能であれば設定済みの `gateway.auth.token` SecretRef を解決します。
- `dashboard` は `gateway.tls.enabled` に従います: TLS が有効な gateway は `https://` の Control UI URL を表示/起動し、`wss://` で接続します。
- SecretRef 管理のトークン（解決済み・未解決を問わず）では、外部 secret がターミナル出力、クリップボード履歴、またはブラウザ起動引数に露出しないよう、`dashboard` はトークンを含まない URL を表示/コピー/起動します。
- `gateway.auth.token` が SecretRef 管理だがこのコマンド経路で未解決の場合、このコマンドは無効なトークンプレースホルダーを埋め込む代わりに、トークンを含まない URL と明示的な対処ガイダンスを表示します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ダッシュボード](/ja-JP/web/dashboard)
