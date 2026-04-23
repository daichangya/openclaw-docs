---
read_when:
    - 准备 bug 报告或支持请求时
    - 调试 Gateway 网关崩溃、重启、内存压力或超大载荷时
    - 审查会记录或脱敏哪些诊断数据时
summary: 创建可共享的 Gateway 网关诊断包用于 bug 报告
title: 诊断导出
x-i18n:
    generated_at: "2026-04-23T20:48:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw 可以创建一个本地诊断 zip，能够安全地附加到 bug
报告中。它会组合经过脱敏的 Gateway 网关状态、健康检查、日志、配置形状，以及
最近的不含载荷的稳定性事件。

## 快速开始

```bash
openclaw gateway diagnostics export
```

该命令会打印写出的 zip 路径。若要指定路径：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用于自动化时：

```bash
openclaw gateway diagnostics export --json
```

## 导出内容

该 zip 包含：

- `summary.md`：供支持使用的人类可读概览。
- `diagnostics.json`：配置、日志、状态、健康检查
  和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 脱敏后的配置形状和非机密配置详情。
- 脱敏后的日志摘要和最近的脱敏日志行。
- 尽力而为的 Gateway 网关状态和健康检查快照。
- `stability/latest.json`：最新的持久化稳定性 bundle（如果可用）。

即使 Gateway 网关不健康，该导出仍然有用。如果 Gateway 网关无法
响应状态或健康检查请求，只要可用，仍会收集本地日志、配置形状和最新
稳定性 bundle。

## 隐私模型

诊断导出旨在可安全分享。该导出会保留有助于调试的运维数据，
例如：

- 子系统名称、插件 id、提供商 id、渠道 id 以及已配置模式
- 状态码、持续时间、字节计数、队列状态和内存读数
- 脱敏的日志元数据和脱敏后的运维消息
- 配置形状和非机密功能设置

该导出会省略或脱敏：

- 聊天文本、提示词、指令、webhook 正文和工具输出
- 凭证、API 密钥、token、cookie 和密钥值
- 原始请求或响应正文
- 账户 id、消息 id、原始会话 id、主机名和本地用户名

当某条日志消息看起来像用户、聊天、提示词或工具载荷文本时，
导出只会保留该消息已被省略以及字节数。

## 稳定性记录器

启用诊断后，Gateway 网关默认会记录一个有界的、不含载荷的稳定性流。
它用于记录运维事实，而不是内容。

检查实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命退出、关闭
超时或重启启动失败后，检查最新的持久化稳定性 bundle：

```bash
openclaw gateway stability --bundle latest
```

从最新的持久化 bundle 创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

当存在事件时，持久化 bundle 位于 `~/.openclaw/logs/stability/` 下。

## 常用选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：写入指定 zip 路径。
- `--log-lines <count>`：要包含的最大脱敏日志行数。
- `--log-bytes <bytes>`：要检查的最大日志字节数。
- `--url <url>`：用于状态和健康检查快照的 Gateway 网关 WebSocket URL。
- `--token <token>`：用于状态和健康检查快照的 Gateway 网关 token。
- `--password <password>`：用于状态和健康检查快照的 Gateway 网关 password。
- `--timeout <ms>`：状态和健康检查快照超时。
- `--no-stability-bundle`：跳过持久化稳定性 bundle 查找。
- `--json`：打印机器可读的导出元数据。

## 禁用诊断

诊断默认启用。若要禁用稳定性记录器和
诊断事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

禁用诊断会减少 bug 报告细节。它不会影响正常的
Gateway 网关日志记录。

## 相关文档

- [Health Checks](/zh-CN/gateway/health)
- [Gateway CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway Protocol](/zh-CN/gateway/protocol#system-and-identity)
- [Logging](/zh-CN/logging)
