---
read_when:
    - Gateway 用のターミナル UI が必要なとき（リモート向け）
    - スクリプトから url/token/session を渡したいとき
summary: '`openclaw tui` の CLI リファレンス（Gateway に接続するターミナル UI）'
title: tui
x-i18n:
    generated_at: "2026-04-05T12:39:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Gateway に接続するターミナル UI を開きます。

関連:

- TUI ガイド: [TUI](/web/tui)

注記:

- `tui` は、可能な場合に token/password 認証向けの設定済み Gateway auth SecretRef を解決します（`env`/`file`/`exec` provider）。
- 設定済みエージェント workspace directory 内から起動した場合、TUI はそのエージェントを session key のデフォルトとして自動選択します（`--session` が明示的に `agent:<id>:...` の場合を除く）。

## 例

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```
