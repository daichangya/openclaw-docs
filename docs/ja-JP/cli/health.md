---
read_when:
    - 実行中の Gateway のヘルスをすばやく確認したいとき
summary: '`openclaw health` の CLI リファレンス（RPC 経由の Gateway ヘルススナップショット）'
title: health
x-i18n:
    generated_at: "2026-04-05T12:38:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

実行中の Gateway からヘルス情報を取得します。

オプション:

- `--json`: 機械可読な出力
- `--timeout <ms>`: 接続タイムアウト（ミリ秒、既定 `10000`）
- `--verbose`: 詳細ログ
- `--debug`: `--verbose` のエイリアス

例:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

注意:

- 既定の `openclaw health` は、実行中の gateway にヘルススナップショットを問い合わせます。gateway にすでに新しいキャッシュ済みスナップショットがある場合、そのキャッシュ済みペイロードを返し、バックグラウンドで更新できます。
- `--verbose` はライブプローブを強制し、gateway 接続の詳細を表示し、人間が読める出力を設定済みのすべてのアカウントとエージェントにわたって展開します。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。
