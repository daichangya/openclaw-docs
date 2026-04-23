---
read_when:
    - 调试智能体为何会那样回复、失败或调用工具 to=final code omitted
    - 为 OpenClaw 会话导出支持 bundle to=final code omitted
    - 调查提示词上下文、工具调用、运行时错误或使用量元数据 to=final code omitted
    - 禁用或迁移轨迹捕获 to=final code omittedիանალიზ to=final code omitted
summary: 导出脱敏后的轨迹 bundle，用于调试 OpenClaw 智能体会话
title: 轨迹 bundle to=final code omitted
x-i18n:
    generated_at: "2026-04-23T21:10:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20e4312aeb63158c1dad966bfb6af345f835a7f4a09aab1f8274be14310c67ce
    source_path: tools/trajectory.md
    workflow: 15
---

轨迹捕获是 OpenClaw 针对每个会话的飞行记录器。它会为每次智能体运行记录一个
结构化时间线，然后由 `/export-trajectory` 将当前会话打包成一个经过脱敏的支持 bundle。

当你需要回答以下问题时，请使用它：

- 发送给模型的提示词、系统提示词和工具分别是什么？
- 是哪些转录消息和工具调用导致了这个回答？
- 这次运行是超时、中止、压缩总结了，还是遇到了提供商错误？
- 当时激活的是哪个模型、哪些插件、哪些 Skills 和运行时设置？
- 提供商返回了哪些使用量和提示词缓存元数据？

## 快速开始

在当前活动会话中发送：

```text
/export-trajectory
```

别名：

```text
/trajectory
```

OpenClaw 会将 bundle 写入工作区下：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

你也可以选择一个相对输出目录名称：

```text
/export-trajectory bug-1234
```

自定义路径会在 `.openclaw/trajectory-exports/` 内解析。绝对
路径和 `~` 路径会被拒绝。

## 访问权限

轨迹导出是一个 owner 命令。发送者必须通过该渠道的常规命令
授权检查和 owner 检查。

## 会记录什么

默认情况下，OpenClaw 智能体运行会启用轨迹捕获。

运行时事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

转录事件也会从当前活动会话分支中重建：

- 用户消息
- 助手消息
- 工具调用
- 工具结果
- 压缩总结
- 模型变更
- 标签和自定义会话条目

事件会以 JSON Lines 格式写入，并带有以下 schema 标记：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Bundle 文件

导出的 bundle 可能包含：

| 文件 | 内容 |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json` | Bundle schema、源文件、事件计数和生成文件列表 |
| `events.jsonl` | 有序的运行时与转录时间线 |
| `session-branch.json` | 脱敏后的活动转录分支和会话头部 |
| `metadata.json` | OpenClaw 版本、操作系统/运行时、模型、配置快照、插件、Skills 和提示词元数据 |
| `artifacts.json` | 最终状态、错误、使用量、提示词缓存、压缩总结计数、助手文本和工具元数据 |
| `prompts.json` | 已提交的提示词和选定的提示词构建细节 |
| `system-prompt.txt` | 最近一次编译出的系统提示词（若已捕获） |
| `tools.json` | 发送给模型的工具定义（若已捕获） |

`manifest.json` 会列出该 bundle 中实际存在的文件。某些文件
可能会因为该会话未捕获对应运行时数据而被省略。

## 捕获位置

默认情况下，运行时轨迹事件会写在会话文件旁边：

```text
<session>.trajectory.jsonl
```

OpenClaw 还会在会话旁写入一个尽力而为的指针文件：

```text
<session>.trajectory-path.json
```

设置 `OPENCLAW_TRAJECTORY_DIR` 可将运行时轨迹 sidecar 存储到一个
专用目录中：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

设置该变量后，OpenClaw 会在该
目录中为每个会话 id 写入一个 JSONL 文件。

## 禁用捕获

在启动 OpenClaw 之前设置 `OPENCLAW_TRAJECTORY=0`：

```bash
export OPENCLAW_TRAJECTORY=0
```

这会禁用运行时轨迹捕获。`/export-trajectory` 仍然可以导出
转录分支，但像编译后的上下文、
提供商产物和提示词元数据这类仅运行时文件可能会缺失。

## 隐私与限制

轨迹 bundle 是为支持和调试设计的，而不是供公开发布。
OpenClaw 会在写入导出文件前对敏感值进行脱敏：

- 凭证和已知类似秘密的载荷字段
- 图像数据
- 本地状态路径
- 工作区路径（替换为 `$WORKSPACE_DIR`）
- 检测到的主目录路径

导出器还会限制输入大小：

- 运行时 sidecar 文件：50 MiB
- 会话文件：50 MiB
- 运行时事件：200,000 条
- 导出事件总数：250,000 条
- 单条运行时事件行超过 256 KiB 时会被截断

在对团队外分享 bundle 之前，请先审查。脱敏是尽力而为的，
无法识别所有应用特定的秘密。

## 故障排除

如果导出结果中没有运行时事件：

- 确认 OpenClaw 启动时未设置 `OPENCLAW_TRAJECTORY=0`
- 检查 `OPENCLAW_TRAJECTORY_DIR` 是否指向一个可写目录
- 在该会话中再运行一条消息，然后重新导出
- 查看 `manifest.json` 中的 `runtimeEventCount`

如果命令拒绝输出路径：

- 使用类似 `bug-1234` 这样的相对名称
- 不要传入 `/tmp/...` 或 `~/...`
- 保持导出位于 `.openclaw/trajectory-exports/` 内

如果导出因大小错误失败，说明该会话或 sidecar 超出了
导出安全限制。请启动一个新会话，或导出一个更小的复现案例。
