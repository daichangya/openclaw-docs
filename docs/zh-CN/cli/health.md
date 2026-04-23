---
read_when:
    - 你希望快速检查正在运行的 Gateway 网关的健康状态
summary: '`openclaw health` 的 CLI 参考（通过 RPC 获取 Gateway 网关健康状态快照）'
title: 健康状态
x-i18n:
    generated_at: "2026-04-23T20:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76059848f92161308256952e617001c5be97fa1fc591b5f4f0c51959815049f1
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

从正在运行的 Gateway 网关获取健康状态。

选项：

- `--json`：机器可读输出
- `--timeout <ms>`：连接超时时间（毫秒，默认 `10000`）
- `--verbose`：详细日志
- `--debug`：`--verbose` 的别名

示例：

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

说明：

- 默认的 `openclaw health` 会向正在运行的 gateway 请求其健康状态快照。当 gateway 已经有新的缓存快照时，它可以返回该缓存负载，并在后台刷新。
- `--verbose` 会强制执行实时探测，打印 gateway 连接详情，并将人类可读输出扩展为覆盖所有已配置账户和智能体。
- 当配置了多个智能体时，输出会包含每个智能体的会话存储。
