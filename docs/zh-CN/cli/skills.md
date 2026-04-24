---
read_when:
    - 你想查看哪些 Skills 可用并已准备好运行
    - 你想从 ClawHub 搜索、安装或更新 Skills
    - 你想调试 Skills 缺少的二进制文件、环境变量或配置问题
summary: '`openclaw skills` 的 CLI 参考（搜索/安装/更新/列出/信息/检查）'
title: Skills
x-i18n:
    generated_at: "2026-04-24T03:15:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

查看本地 Skills，并从 ClawHub 安装/更新 Skills。

相关内容：

- Skills 系统： [Skills](/zh-CN/tools/skills)
- Skills 配置： [Skills config](/zh-CN/tools/skills-config)
- ClawHub 安装： [ClawHub](/zh-CN/tools/clawhub)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` 会直接使用 ClawHub，并安装到当前活动工作区的
`skills/` 目录中。`list`/`info`/`check` 仍然会检查当前工作区和配置可见的本地
Skills。

这个 CLI `install` 命令会从 ClawHub 下载 skill 文件夹。由新手引导或 Skills 设置触发的、
基于 Gateway 网关的 skill 依赖安装，则会改用单独的 `skills.install` 请求路径。

注意事项：

- `search [query...]` 接受可选查询；省略时会浏览默认的
  ClawHub 搜索源。
- `search --limit <n>` 会限制返回结果数量。
- `install --force` 会覆盖工作区中同一 slug 的现有 skill 文件夹。
- `update --all` 只会更新当前活动工作区中已跟踪的 ClawHub 安装。
- 未提供子命令时，`list` 是默认操作。
- `list`、`info` 和 `check` 会将渲染后的输出写入 stdout。使用
  `--json` 时，这意味着机器可读负载会保留在 stdout 中，以便用于管道
  和脚本。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Skills](/zh-CN/tools/skills)
