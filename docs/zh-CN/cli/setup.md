---
read_when:
    - 你正在进行首次运行设置，而不使用完整 CLI 新手引导
    - 你想设置默认工作区路径
summary: '`openclaw setup` 的 CLI 参考（初始化配置 + 工作区）'
title: 设置
x-i18n:
    generated_at: "2026-04-23T20:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6a000d3902f2ced83ccdff268c188fd84f54ae84162a416271ebb9289491b3
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

初始化 `~/.openclaw/openclaw.json` 和智能体工作区。

相关内容：

- 入门指南：[入门指南](/zh-CN/start/getting-started)
- CLI 新手引导：[新手引导（CLI）](/zh-CN/start/wizard)

## 示例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 选项

- `--workspace <dir>`：智能体工作区目录（存储为 `agents.defaults.workspace`）
- `--wizard`：运行新手引导
- `--non-interactive`：以非交互方式运行新手引导
- `--mode <local|remote>`：新手引导模式
- `--remote-url <url>`：远程 Gateway 网关 WebSocket URL
- `--remote-token <token>`：远程 Gateway 网关令牌

通过 setup 运行新手引导：

```bash
openclaw setup --wizard
```

说明：

- 普通的 `openclaw setup` 会初始化配置 + 工作区，而不会运行完整的新手引导流程。
- 当存在任一新手引导标志时，会自动运行新手引导（`--wizard`、`--non-interactive`、`--mode`、`--remote-url`、`--remote-token`）。
