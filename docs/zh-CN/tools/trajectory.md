---
read_when:
    - 调试智能体为何会以特定方式回答、失败或调用工具
    - 为 OpenClaw 会话导出支持套装
    - 调查提示词上下文、工具调用、运行时错误或使用情况元数据
    - 禁用或重新定位轨迹捕获
summary: 导出已脱敏的轨迹套装以调试 OpenClaw 智能体会话
title: 轨迹套装
x-i18n:
    generated_at: "2026-04-23T07:07:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# 轨迹套装

轨迹捕获是 OpenClaw 的按会话飞行记录器。它会为每次智能体运行记录一条
结构化时间线，然后 `/export-trajectory` 会将当前会话打包为一个已脱敏的
支持套装。

当你需要回答以下问题时，请使用它：

- 发送给模型的提示词、系统提示词和工具是什么？
- 哪些转录消息和工具调用导致了这个回答？
- 此次运行是超时、中止、压缩，还是遇到了提供商错误？
- 当时启用了哪些模型、plugin、Skills 和运行时设置？
- 提供商返回了哪些使用情况和 prompt-cache 元数据？

## 快速开始

在当前活动会话中发送：

```text
/export-trajectory
```

别名：

```text
/trajectory
```

OpenClaw 会将套装写入工作区下：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

你可以选择一个相对输出目录名：

```text
/export-trajectory bug-1234
```

自定义路径会在 `.openclaw/trajectory-exports/` 内解析。绝对路径和 `~`
路径会被拒绝。

## 访问

轨迹导出是所有者命令。发送者必须通过该渠道的常规命令
授权检查和所有者检查。

## 会记录什么

对于 OpenClaw 智能体运行，轨迹捕获默认开启。

运行时事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

转录事件也会从当前活跃会话分支中重建：

- 用户消息
- 助手消息
- 工具调用
- 工具结果
- 压缩
- 模型变更
- 标签和自定义会话条目

事件会以 JSON Lines 格式写入，并带有如下 schema 标记：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 套装文件

导出的套装可能包含：

| 文件 | 内容 |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 套装 schema、源文件、事件计数和生成文件列表 |
| `events.jsonl`        | 按顺序排列的运行时和转录时间线 |
| `session-branch.json` | 已脱敏的活动转录分支和会话头 |
| `metadata.json`       | OpenClaw 版本、OS/运行时、模型、配置快照、plugin、Skills 和提示词元数据 |
| `artifacts.json`      | 最终状态、错误、使用情况、prompt cache、压缩计数、助手文本和工具元数据 |
| `prompts.json`        | 已提交的提示词和选定的提示词构建细节 |
| `system-prompt.txt`   | 最新编译后的系统提示词（若已捕获） |
| `tools.json`          | 发送给模型的工具定义（若已捕获） |

`manifest.json` 会列出该套装中实际存在的文件。当会话未捕获相应的运行时数据时，
某些文件会被省略。

## 捕获位置

默认情况下，运行时轨迹事件会写在会话文件旁边：

```text
<session>.trajectory.jsonl
```

OpenClaw 还会尽力在会话旁边写入一个指针文件：

```text
<session>.trajectory-path.json
```

设置 `OPENCLAW_TRAJECTORY_DIR` 可将运行时轨迹 sidecar 存储到
专用目录中：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

设置该变量后，OpenClaw 会在该目录中按每个会话 ID 写入一个 JSONL 文件。

## 禁用捕获

在启动 OpenClaw 之前设置 `OPENCLAW_TRAJECTORY=0`：

```bash
export OPENCLAW_TRAJECTORY=0
```

这会禁用运行时轨迹捕获。`/export-trajectory` 仍然可以导出
转录分支，但仅运行时文件（例如编译后的上下文、
提供商产物和提示词元数据）可能会缺失。

## 隐私和限制

轨迹套装是为支持和调试设计的，不适合公开发布。
OpenClaw 会在写入导出文件前对敏感值进行脱敏：

- 凭证和已知类似密钥的负载字段
- 图像数据
- 本地状态路径
- 工作区路径，会替换为 `$WORKSPACE_DIR`
- 已检测到的主目录路径

导出器还会限制输入大小：

- 运行时 sidecar 文件：50 MiB
- 会话文件：50 MiB
- 运行时事件：200,000
- 导出的总事件数：250,000
- 单条运行时事件行超过 256 KiB 时会被截断

在将套装分享给团队外部之前，请先审查。脱敏是尽力而为，
无法识别所有特定于应用的密钥。

## 故障排除

如果导出内容没有运行时事件：

- 确认 OpenClaw 启动时未设置 `OPENCLAW_TRAJECTORY=0`
- 检查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可写目录
- 在该会话中再运行一条消息，然后重新导出
- 检查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒绝输出路径：

- 使用类似 `bug-1234` 的相对名称
- 不要传入 `/tmp/...` 或 `~/...`
- 保持导出路径位于 `.openclaw/trajectory-exports/` 内

如果导出因大小错误失败，说明会话或 sidecar 超过了
导出的安全限制。请开始一个新会话，或导出更小的复现。
