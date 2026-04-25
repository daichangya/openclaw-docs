---
read_when:
    - 准备错误报告或支持请求
    - 调试 Gateway 网关崩溃、重启、内存压力或负载过大问题
    - 查看记录了哪些诊断数据或哪些内容已被脱敏
summary: 为错误报告创建可共享的 Gateway 网关诊断包
title: 诊断信息导出
x-i18n:
    generated_at: "2026-04-25T23:50:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw 可以创建一个本地诊断 zip，能够安全地附加到错误报告中。它会整合经过脱敏处理的 Gateway 网关 Status、健康状态、日志、配置结构，以及最近不含负载内容的稳定性事件。

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

## 导出内容

该 zip 包含：

- `summary.md`：供支持排查使用的可读概览。
- `diagnostics.json`：配置、日志、Status、健康状态和稳定性数据的机器可读摘要。
- `manifest.json`：导出元数据和文件列表。
- 经过脱敏的配置结构和非机密配置详情。
- 经过脱敏的日志摘要和最近的已脱敏日志行。
- 尽力获取的 Gateway 网关 Status 和健康状态快照。
- `stability/latest.json`：最新持久化的稳定性包（如可用）。

即使 Gateway 网关处于不健康状态，该导出仍然有用。如果 Gateway 网关无法响应 Status 或健康检查请求，仍会在可用时收集本地日志、配置结构和最新的稳定性包。

## 隐私模型

诊断信息被设计为可共享。导出内容会保留有助于调试的运行数据，例如：

- 子系统名称、插件 id、提供商 id、渠道 id 和已配置模式
- 状态码、持续时间、字节计数、队列状态和内存读数
- 经过脱敏的日志元数据和已脱敏的运行消息
- 配置结构和非机密功能设置

导出内容会省略或脱敏以下内容：

- 聊天文本、提示词、指令、webhook 正文和工具输出
- 凭证、API 密钥、令牌、cookie 和机密值
- 原始请求或响应正文
- 账户 id、消息 id、原始会话 id、主机名和本地用户名

当日志消息看起来像用户、聊天、提示词或工具负载文本时，导出内容只会保留“有一条消息被省略”以及其字节数。

## 稳定性记录器

启用诊断信息时，Gateway 网关默认会记录一个有界、不含负载内容的稳定性流。它用于记录运行事实，而不是内容本身。

查看实时记录器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在发生致命退出、关闭超时或重启启动失败后，查看最新持久化的稳定性包：

```bash
openclaw gateway stability --bundle latest
```

根据最新持久化的稳定性包创建诊断 zip：

```bash
openclaw gateway stability --bundle latest --export
```

当存在事件时，持久化包位于 `~/.openclaw/logs/stability/` 下。

## 实用选项

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：写入到指定的 zip 路径。
- `--log-lines <count>`：要包含的已脱敏日志行的最大数量。
- `--log-bytes <bytes>`：要检查的最大日志字节数。
- `--url <url>`：用于获取 Status 和健康状态快照的 Gateway 网关 WebSocket URL。
- `--token <token>`：用于获取 Status 和健康状态快照的 Gateway 网关令牌。
- `--password <password>`：用于获取 Status 和健康状态快照的 Gateway 网关密码。
- `--timeout <ms>`：Status 和健康状态快照超时时间。
- `--no-stability-bundle`：跳过持久化稳定性包查找。
- `--json`：打印机器可读的导出元数据。

## 禁用诊断信息

诊断信息默认启用。若要禁用稳定性记录器和诊断事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

禁用诊断信息会减少错误报告可提供的细节，但不会影响正常的 Gateway 网关日志记录。

## 相关内容

- [健康检查](/zh-CN/gateway/health)
- [Gateway CLI](/zh-CN/cli/gateway#gateway-diagnostics-export)
- [Gateway 协议](/zh-CN/gateway/protocol#system-and-identity)
- [日志记录](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) —— 这是将诊断信息流式传输到采集器的独立流程
