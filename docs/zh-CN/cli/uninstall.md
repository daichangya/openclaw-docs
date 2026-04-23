---
read_when:
    - 你想移除 Gateway 网关服务和/或本地状态
    - 你想先执行一次 dry-run
summary: '`openclaw uninstall` 的 CLI 参考（移除 Gateway 网关服务和本地数据）'
title: 卸载
x-i18n:
    generated_at: "2026-04-23T20:45:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e7e588986fdfdd2f92ca7d3fc0588b864e80ed1ca609a3181b8d0c3e054ec98
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

卸载 Gateway 网关服务和本地数据（CLI 保留）。

选项：

- `--service`：移除 Gateway 网关服务
- `--state`：移除状态和配置
- `--workspace`：移除工作区目录
- `--app`：移除 macOS 应用
- `--all`：移除服务、状态、工作区和应用
- `--yes`：跳过确认提示
- `--non-interactive`：禁用提示；需要配合 `--yes`
- `--dry-run`：只打印操作，不删除文件

示例：

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

说明：

- 如果你希望在删除状态或工作区前保留可恢复快照，请先运行 `openclaw backup create`。
- `--all` 是同时移除服务、状态、工作区和应用的简写。
- `--non-interactive` 需要配合 `--yes`。
