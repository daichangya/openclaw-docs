---
read_when:
    - 你需要在本地捕获 OpenClaw 传输流量以进行调试
    - 你想检查调试代理会话、blob 或内置查询预设
summary: '`openclaw proxy` 的 CLI 参考，用于本地调试代理和抓包检查器'
title: 代理
x-i18n:
    generated_at: "2026-04-23T07:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

运行本地显式调试代理并检查已捕获的流量。

这是一个用于传输层调查的调试命令。它可以启动本地代理、在启用捕获的情况下运行子命令、列出捕获会话、查询常见流量模式、读取已捕获的 blob，并清除本地捕获数据。

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
- `run` 会先启动本地调试代理，然后运行 `--` 后面的命令。
- 捕获内容是本地调试数据；完成后请使用 `openclaw proxy purge`。
