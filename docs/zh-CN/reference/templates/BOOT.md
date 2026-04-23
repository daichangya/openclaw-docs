---
read_when:
    - 添加 BOOT.md 清单
summary: 用于 BOOT.md 的工作区模板
title: BOOT.md 模板
x-i18n:
    generated_at: "2026-04-23T21:04:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 259bbe6a13f083671648db92ed42a886121056279a33f53d09560fef2b36ac00
    source_path: reference/templates/BOOT.md
    workflow: 15
---

# BOOT.md

为 OpenClaw 在启动时应执行的操作添加简短、明确的说明（启用 `hooks.internal.enabled`）。
如果该任务会发送消息，请使用 message 工具，然后回复精确的静默令牌 `NO_REPLY` / `no_reply`。
