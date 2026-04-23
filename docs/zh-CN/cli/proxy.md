---
read_when:
    - 你需要在本地抓取 OpenClaw 传输流量以进行调试
    - 你想检查调试代理会话、blobs 或内置查询预设
summary: '`openclaw proxy` 的 CLI 参考，本地调试代理与抓包检查器'
title: 代理
x-i18n:
    generated_at: "2026-04-23T20:44:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a251232cc35d4e668d1dd052b8ecce8aa21393609dfe77f1173d785045cc90ff
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

运行本地显式调试代理并检查已捕获的流量。

这是一个用于传输层调查的调试命令。它可以启动本地代理、在启用抓取的情况下运行子命令、列出抓取会话、查询常见流量模式、读取已捕获的 blobs，以及清理本地抓取数据。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 查询预设

`openclaw proxy query --preset <name>` 接受：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 说明

- `start` 默认使用 `127.0.0.1`，除非设置了 `--host`。
- `run` 会先启动本地调试代理，然后运行 `--` 之后的命令。
- 抓取内容属于本地调试数据；完成后请使用 `openclaw proxy purge`。
