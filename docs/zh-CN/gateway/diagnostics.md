---
read_when:
    - 准备错误报告或支持请求
    - 调试 Gateway 网关崩溃、重启、内存压力或超大负载问题
    - 查看记录或脱敏了哪些诊断数据
summary: 为错误报告创建可分享的 Gateway 网关诊断包
title: 诊断导出
x-i18n:
    generated_at: "2026-04-23T15:24:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b535e9e3f12ee3eb67b46604b00fdb15e883c40d6be359415b51c5e1e1980234
    source_path: gateway/diagnostics.md
    workflow: 15
---

# 诊断导出

OpenClaw 可以创建一个本地诊断 zip，能够安全地附加到错误报告中。它会整合已脱敏的 Gateway 网关状态、健康信息、日志、配置结构，以及最近不含负载的稳定性事件。

## 快速开始

```bash
openclaw gateway diagnostics export
```

该命令会打印已写入的 zip 路径。若要指定路径：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用于自动化时：

```bash
openclaw gateway diagnostics export --json
```

## 导出内容包含什么

该 zip 包含：

- `summary.md`：供支持使用的人类可读概览。
- `diagnostics.json`：关于配置、日志、状态、健康信息和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 已脱敏的配置结构和非机密配置详情。
- 已脱敏的日志摘要和最近的已脱敏日志行。
- 尽力获取的 Gateway 网关状态和健康快照。
- `stability/latest.json`：最新持久化的稳定性包（如可用）。

即使 Gateway 网关不健康，此导出也依然有用。如果 Gateway 网关无法响应状态或健康请求，系统仍会在可用时收集本地日志、配置结构和最新的稳定性包。

## 隐私模型

诊断信息被设计为可分享。导出会保留有助于调试的运行数据，例如：

- 子系统名称、plugin ID、provider ID、channel ID，以及已配置的模式
- 状态码、持续时间、字节数、队列状态和内存读数
- 已脱敏的日志元数据和已脱敏的运行消息
- 配置结构和非机密功能设置

导出会省略或脱敏以下内容：

- 聊天文本、提示词、指令、webhook 正文和工具输出
- 凭证、API 密钥、令牌、cookie 和机密值
- 原始请求或响应正文
- 账户 ID、消息 ID、原始会话 ID、主机名和本地用户名

当日志消息看起来像用户、聊天、提示词或工具负载文本时，导出只会保留“该消息已省略”以及对应的字节数。

## 稳定性记录器

当启用诊断时，Gateway 网关默认会记录一个有界的、不含负载的稳定性流。它用于记录运行事实，而不是内容。

查看实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

查看在致命退出、关闭超时或重启启动失败后最新持久化的稳定性包：

```bash
openclaw gateway stability --bundle latest
```

根据最新持久化的包创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

当存在事件时，持久化包位于 `~/.openclaw/logs/stability/`。

## 实用选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：写入到指定的 zip 路径。
- `--log-lines <count>`：要包含的已脱敏日志行最大数量。
- `--log-bytes <bytes>`：要检查的日志最大字节数。
- `--url <url>`：用于获取状态和健康快照的 Gateway 网关 WebSocket URL。
- `--token <token>`：用于获取状态和健康快照的 Gateway 网关令牌。
- `--password <password>`：用于获取状态和健康快照的 Gateway 网关密码。
- `--timeout <ms>`：状态和健康快照超时时间。
- `--no-stability-bundle`：跳过持久化稳定性包查找。
- `--json`：打印机器可读的导出元数据。

## 禁用诊断

诊断默认启用。若要禁用稳定性记录器和诊断事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

禁用诊断会减少错误报告细节。它不会影响正常的 Gateway 网关日志记录。

## 相关文档

- [Health Checks](/zh-CN/gateway/health)
- [Gateway CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway Protocol](/zh-CN/gateway/protocol#system-and-identity)
- [Logging](/zh-CN/logging)
