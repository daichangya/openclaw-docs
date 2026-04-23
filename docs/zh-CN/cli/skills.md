---
read_when:
    - 你想查看哪些 Skills 可用并且已准备好运行
    - 你想从 ClawHub 搜索、安装或更新 Skills
    - 你想调试 Skills 缺失的二进制文件/环境变量/配置问题
summary: '`openclaw skills` 的 CLI 参考（搜索/安装/更新/列出/信息/检查）'
title: Skills
x-i18n:
    generated_at: "2026-04-23T20:45:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8490cd16bfb2120162af9503acb873d434ae4010b4c0270a4aa76991a4316ae
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

检查本地 Skills，并从 ClawHub 安装/更新 Skills。

相关内容：

- Skills 系统：[Skills](/zh-CN/tools/skills)
- Skills 配置：[Skills 配置](/zh-CN/tools/skills-config)
- ClawHub 安装：[ClawHub](/zh-CN/tools/clawhub)

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

`search`/`install`/`update` 会直接使用 ClawHub，并安装到当前活动工作区的 `skills/` 目录中。`list`/`info`/`check` 仍然只检查当前工作区和配置可见的本地 Skills。

此 CLI `install` 命令会从 ClawHub 下载技能文件夹。由新手引导或 Skills 设置触发的、由 Gateway 网关支持的技能依赖安装，则使用单独的 `skills.install` 请求路径。

说明：

- `search [query...]` 接受可选查询；省略时会浏览默认的 ClawHub 搜索源。
- `search --limit <n>` 用于限制返回结果数量。
- `install --force` 会覆盖工作区中同一 slug 的现有技能文件夹。
- `update --all` 只会更新当前活动工作区中被跟踪的 ClawHub 安装项。
- 未提供子命令时，`list` 是默认操作。
- `list`、`info` 和 `check` 会将渲染后的输出写到 stdout。使用
  `--json` 时，这意味着机器可读 payload 会保留在 stdout 中，便于管道和脚本使用。
