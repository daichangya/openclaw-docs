---
read_when:
    - 你想为 zsh/bash/fish/PowerShell 启用 shell 补全
    - 你需要将补全脚本缓存到 OpenClaw 状态目录下
summary: '`openclaw completion` 的 CLI 参考（生成/安装 shell 补全脚本）'
title: 补全
x-i18n:
    generated_at: "2026-04-23T20:43:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 859450b18bee731b36f911c183c338012141ae4c58f61bf75ae905a6b8596ce1
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

生成 shell 补全脚本，并可选择将其安装到你的 shell 配置文件中。

## 用法

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## 选项

- `-s, --shell <shell>`：shell 目标（`zsh`、`bash`、`powershell`、`fish`；默认：`zsh`）
- `-i, --install`：通过向你的 shell 配置文件添加一行 source 语句来安装补全
- `--write-state`：将补全脚本写入 `$OPENCLAW_STATE_DIR/completions`，而不是打印到 stdout
- `-y, --yes`：跳过安装确认提示

## 说明

- `--install` 会将一个小型的 “OpenClaw Completion” 区块写入你的 shell 配置文件，并让它指向缓存的脚本。
- 如果没有使用 `--install` 或 `--write-state`，该命令会将脚本打印到 stdout。
- 补全生成会预先加载命令树，因此会包含嵌套子命令。
