---
read_when:
    - 你正在进行首次运行设置，但不使用完整的 CLI 新手引导
    - 你想设置默认工作区路径
summary: '`openclaw setup` 的 CLI 参考（初始化配置 + 工作区）'
title: 设置
x-i18n:
    generated_at: "2026-04-27T08:00:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
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
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 选项

- `--workspace <dir>`：智能体工作区目录（存储为 `agents.defaults.workspace`）
- `--wizard`：运行新手引导
- `--non-interactive`：在无提示的情况下运行新手引导
- `--mode <local|remote>`：新手引导模式
- `--import-from <provider>`：在新手引导期间运行的迁移提供商
- `--import-source <path>`：用于 `--import-from` 的源智能体主目录
- `--import-secrets`：在新手引导迁移期间导入受支持的密钥
- `--remote-url <url>`：远程 Gateway 网关 WebSocket URL
- `--remote-token <token>`：远程 Gateway 网关令牌

要通过 setup 运行新手引导：

```bash
openclaw setup --wizard
```

说明：

- 普通的 `openclaw setup` 会初始化配置 + 工作区，而不会运行完整的新手引导流程。
- 当存在任一新手引导标志时，会自动运行新手引导（`--wizard`、`--non-interactive`、`--mode`、`--import-from`、`--import-source`、`--import-secrets`、`--remote-url`、`--remote-token`）。
- 如果检测到 Hermes 状态，交互式新手引导可以自动提供迁移选项。导入新手引导需要全新的设置；如需在新手引导之外使用试运行计划、备份和覆盖模式，请使用 [迁移](/zh-CN/cli/migrate)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [安装概览](/zh-CN/install)
