---
read_when:
    - 你想清除本地状态，同时保留 CLI 已安装状态
    - 你想先进行一次试运行，查看将删除哪些内容
summary: '`openclaw reset` 的 CLI 参考（重置本地状态/配置）'
title: 重置
x-i18n:
    generated_at: "2026-04-23T20:44:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ec7b6b99bd1b16f804c4abd1e112074b6d99553ebed1ef583b7fb3b3a11b851
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

重置本地配置/状态（保留 CLI 已安装）。

选项：

- `--scope <scope>`：`config`、`config+creds+sessions` 或 `full`
- `--yes`：跳过确认提示
- `--non-interactive`：禁用提示；需要同时设置 `--scope` 和 `--yes`
- `--dry-run`：打印将执行的操作，但不删除文件

示例：

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

说明：

- 如果你希望在移除本地状态之前保留一个可恢复的快照，请先运行 `openclaw backup create`。
- 如果省略 `--scope`，`openclaw reset` 会使用交互式提示让你选择要移除的内容。
- `--non-interactive` 仅在同时设置了 `--scope` 和 `--yes` 时才有效。
