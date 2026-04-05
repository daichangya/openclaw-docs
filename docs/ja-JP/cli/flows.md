---
read_when:
    - 古いドキュメントやリリースノートで openclaw flows を見かけた
summary: 'リダイレクト: フローコマンドは `openclaw tasks flow` 配下にあります'
title: flows（リダイレクト）
x-i18n:
    generated_at: "2026-04-05T12:38:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4b9acefdb4e8dedde08d96986fe9b1ca7f91293281850b68ff9fa28f0516a61
    source_path: cli/flows.md
    workflow: 15
---

# `openclaw tasks flow`

フローコマンドは独立した `flows` コマンドではなく、`openclaw tasks` のサブコマンドです。

```bash
openclaw tasks flow list [--json]
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

完全なドキュメントについては、[Task Flow](/automation/taskflow) と [tasks CLI リファレンス](/cli/index#tasks) を参照してください。
