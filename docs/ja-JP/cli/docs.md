---
read_when:
    - ターミナルから OpenClaw のライブドキュメントを検索したい
summary: '`openclaw docs` の CLI リファレンス（ライブドキュメントインデックスを検索）'
title: docs
x-i18n:
    generated_at: "2026-04-05T12:38:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

ライブドキュメントインデックスを検索します。

引数:

- `[query...]`: ライブドキュメントインデックスに送信する検索語

例:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

注意:

- クエリなしの場合、`openclaw docs` はライブドキュメント検索のエントリーポイントを開きます。
- 複数語のクエリは 1 つの検索リクエストとしてそのまま渡されます。
