---
read_when:
    - CLI をインストールしたままローカル state を消去したいとき
    - 削除対象の dry-run を確認したいとき
summary: '`openclaw reset` の CLI リファレンス（ローカル state/config をリセット）'
title: reset
x-i18n:
    generated_at: "2026-04-05T12:39:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

ローカル config/state をリセットします（CLI はインストールされたままです）。

オプション:

- `--scope <scope>`: `config`、`config+creds+sessions`、または `full`
- `--yes`: 確認プロンプトをスキップ
- `--non-interactive`: プロンプトを無効化。`--scope` と `--yes` が必要です
- `--dry-run`: ファイルを削除せずに実行内容を表示

例:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

注記:

- ローカル state を削除する前に復元可能なスナップショットが必要なら、まず `openclaw backup create` を実行してください。
- `--scope` を省略した場合、`openclaw reset` は対話プロンプトを使って削除内容を選択します。
- `--non-interactive` は `--scope` と `--yes` の両方が設定されている場合にのみ有効です。
