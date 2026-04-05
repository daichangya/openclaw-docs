---
read_when:
    - BOOT.mdチェックリストを追加するとき
summary: BOOT.md用のworkspaceテンプレート
title: BOOT.mdテンプレート
x-i18n:
    generated_at: "2026-04-05T12:55:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 694e836d2c4010bf723d0e64f40e98800d3c135ca4c4124d42f96f5e050936f8
    source_path: reference/templates/BOOT.md
    workflow: 15
---

# BOOT.md

起動時にOpenClawが何をすべきかについて、短く明確な指示を追加してください（`hooks.internal.enabled` を有効にします）。
taskがmessageを送る場合は、message toolを使い、その後、正確な
サイレントtoken `NO_REPLY` / `no_reply` で応答してください。
