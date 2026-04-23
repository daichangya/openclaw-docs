---
read_when:
    - 你想在终端中搜索实时 OpenClaw 文档
summary: '`openclaw docs` 的 CLI 参考（搜索实时文档索引）'
title: 文档
x-i18n:
    generated_at: "2026-04-23T20:43:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611ca0db2655734fe92b620b0ff2b822c4db9d44faf269e583ccea298e6400ca
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

搜索实时文档索引。

参数：

- `[query...]`：要发送到实时文档索引的搜索词

示例：

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

说明：

- 不带查询词时，`openclaw docs` 会打开实时文档搜索入口。
- 多个单词的查询会作为一次搜索请求整体传递。
