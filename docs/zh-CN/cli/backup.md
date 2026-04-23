---
read_when:
    - 你想为本地 OpenClaw 状态创建一份一等公民的备份归档
    - 你想在重置或卸载前预览将会包含哪些路径
summary: '`openclaw backup` 的 CLI 参考（创建本地备份归档）'
title: 备份
x-i18n:
    generated_at: "2026-04-23T20:43:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a46b137bfe4124eb59570ccc879119f9d45643a807183d7e5568a0c91285ae7
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

为 OpenClaw 的状态、配置、认证配置文件、渠道/提供商凭证、会话，以及可选的工作区创建本地备份归档。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 说明

- 归档中包含一个 `manifest.json` 文件，其中记录了解析后的源路径和归档布局。
- 默认输出是在当前工作目录中生成一个带时间戳的 `.tar.gz` 归档文件。
- 如果当前工作目录位于某个待备份的源树内部，OpenClaw 会回退到你的主目录作为默认归档位置。
- 绝不会覆盖现有归档文件。
- 位于源状态/工作区树内部的输出路径会被拒绝，以避免将归档文件自身包含进去。
- `openclaw backup verify <archive>` 会验证归档是否恰好包含一个根 `manifest`，拒绝带有路径穿越风格的归档路径，并检查 `manifest` 中声明的每个载荷是否都存在于 tarball 中。
- `openclaw backup create --verify` 会在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 只备份当前活动的 JSON 配置文件。

## 会备份哪些内容

`openclaw backup create` 会根据你本地的 OpenClaw 安装规划备份源：

- 由 OpenClaw 本地状态解析器返回的状态目录，通常是 `~/.openclaw`
- 当前活动的配置文件路径
- 当其存在于状态目录之外时，解析后的 `credentials/` 目录
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

模型认证配置文件本来就位于状态目录下的
`agents/<agentId>/agent/auth-profiles.json`，因此通常已包含在状态备份项中。

如果你使用 `--only-config`，OpenClaw 会跳过状态、凭证目录和工作区发现，只归档当前活动的配置文件路径。

OpenClaw 会在构建归档前规范化路径。如果配置、凭证目录或工作区已经位于状态目录内部，它们不会作为单独的顶级备份源重复收录。缺失的路径会被跳过。

归档载荷会存储这些源树中的文件内容，而内嵌的 `manifest.json` 会记录解析后的绝对源路径，以及每项资产所使用的归档布局。

## 无效配置时的行为

`openclaw backup` 会有意绕过常规配置预检查，因此即使在恢复场景中也仍然能提供帮助。由于工作区发现依赖有效配置，所以当配置文件存在但无效，且工作区备份仍处于启用状态时，`openclaw backup create` 现在会快速失败。

如果在这种情况下你仍想创建部分备份，请重新运行：

```bash
openclaw backup create --no-include-workspace
```

这样仍会包含状态、配置和外部凭证目录，同时完全跳过工作区发现。

如果你只需要复制配置文件本身，`--only-config` 在配置格式错误时也可用，因为它不依赖解析配置来发现工作区。

## 大小与性能

OpenClaw 不会施加内置的最大备份大小或单文件大小限制。

实际限制来自本地机器和目标文件系统：

- 临时归档写入和最终归档所需的可用空间
- 遍历大型工作区树并将其压缩为 `.tar.gz` 所需的时间
- 如果你使用 `openclaw backup create --verify` 或运行 `openclaw backup verify`，重新扫描归档所需的时间
- 目标路径上的文件系统行为。OpenClaw 会优先使用“不覆盖”的硬链接发布步骤；如果不支持硬链接，则回退到排他复制

大型工作区通常是归档体积增长的主要来源。如果你想要更小或更快的备份，请使用 `--no-include-workspace`。

如果想获得最小的归档，请使用 `--only-config`。
