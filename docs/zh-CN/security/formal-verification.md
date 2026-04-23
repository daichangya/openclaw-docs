---
permalink: /security/formal-verification/
read_when:
    - 审查形式化安全模型的保证或边界
    - 复现或更新 TLA+/TLC 安全模型检查
summary: 针对 OpenClaw 高风险路径的机器校验安全模型。
title: 形式化验证（安全模型）
x-i18n:
    generated_at: "2026-04-23T21:05:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b7ae72867b782eb77b999f79e6122bceba9e5ace3b4d65438176ec66519007c
    source_path: security/formal-verification.md
    workflow: 15
---

本页跟踪 OpenClaw 的**形式化安全模型**（目前是 TLA+/TLC；未来按需扩展）。

> 注意：一些较旧的链接可能仍引用之前的项目名称。

**目标（北极星）：** 在明确假设下，提供一个经过机器校验的论证，证明 OpenClaw 会执行其预期的
安全策略（授权、会话隔离、工具门控，以及
错误配置安全）。

**它当前是什么：** 一个可执行、攻击者驱动的**安全回归测试套件**：

- 每一项声明都对应一个可运行的、在有限状态空间上的模型检查。
- 许多声明都配有一个成对的**负模型**，可针对现实 bug 类别生成反例轨迹。

**它目前还不是什么：** 还不是一个“OpenClaw 在所有方面都是安全的”的证明，也不是对完整 TypeScript 实现正确性的证明。

## 模型位置

这些模型维护在一个单独的仓库中：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要注意事项

- 这些是**模型**，不是完整的 TypeScript 实现。模型与代码之间可能出现漂移。
- 结果受 TLC 所探索状态空间的边界限制；“绿色通过”并不意味着超出已建模假设和边界之外也安全。
- 某些声明依赖显式环境假设（例如正确部署、正确配置输入）。

## 复现结果

当前，复现方式是将模型仓库克隆到本地并运行 TLC（见下文）。未来版本可能会提供：

- 由 CI 运行的模型及公开工件（反例轨迹、运行日志）
- 面向小型、有界检查的托管式“运行此模型”工作流

快速开始：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11+（TLC 运行在 JVM 上）。
# 仓库内置了固定版本的 `tla2tools.jar`（TLA+ 工具），并提供了 `bin/tlc` 和 Make target。

make <target>
```

### Gateway 暴露与开放式 gateway 错误配置

**声明：** 在没有身份验证的情况下绑定到 loopback 之外，可能使远程攻陷成为可能 / 增加暴露面；在模型假设下，令牌/密码会阻止未经授权的攻击者。

- 绿色运行：
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 红色（预期）：
  - `make gateway-exposure-v2-negative`

另见：模型仓库中的 `docs/gateway-exposure-matrix.md`。

### 节点 exec 流水线（最高风险能力）

**声明：** `exec host=node` 需要同时满足：(a) 节点命令 allowlist + 已声明命令，以及 (b) 在配置要求时必须有实时审批；审批会被令牌化以防止重放（在模型中）。

- 绿色运行：
  - `make nodes-pipeline`
  - `make approvals-token`
- 红色（预期）：
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 配对存储（私信门控）

**声明：** 配对请求遵守 TTL 和待处理请求上限。

- 绿色运行：
  - `make pairing`
  - `make pairing-cap`
- 红色（预期）：
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 入口门控（提及 + 控制命令绕过）

**声明：** 在要求提及的群组上下文中，未授权的“控制命令”不能绕过提及门控。

- 绿色：
  - `make ingress-gating`
- 红色（预期）：
  - `make ingress-gating-negative`

### 路由/会话键隔离

**声明：** 来自不同对等端的私信不会折叠到同一个会话中，除非显式链接/配置。

- 绿色：
  - `make routing-isolation`
- 红色（预期）：
  - `make routing-isolation-negative`

## v1++：附加的有界模型（并发、重试、轨迹正确性）

这些是后续模型，用于围绕真实世界故障模式（非原子更新、重试和消息扇出）提升保真度。

### 配对存储并发 / 幂等性

**声明：** 配对存储即使在交错执行下，也应强制执行 `MaxPending` 和幂等性（即 “check-then-write” 必须是原子/加锁的；refresh 不应创建重复项）。

其含义：

- 在并发请求下，某个渠道不能超过 `MaxPending`。
- 对相同 `(channel, sender)` 的重复请求/刷新不应创建重复的活动待处理行。

- 绿色运行：
  - `make pairing-race`（原子/加锁的上限检查）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 红色（预期）：
  - `make pairing-race-negative`（非原子 begin/commit 上限竞争）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 入口轨迹关联 / 幂等性

**声明：** 摄取过程应在扇出过程中保留轨迹关联，并且在提供商重试下保持幂等。

其含义：

- 当一个外部事件变为多个内部消息时，每个部分都保留相同的轨迹/事件标识。
- 重试不会导致重复处理。
- 如果提供商事件 ID 缺失，去重会回退到安全键（例如 trace ID），以避免丢弃不同事件。

- 绿色：
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 红色（预期）：
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 路由 dmScope 优先级 + identityLinks

**声明：** 路由必须默认保持私信会话隔离，并且只有在显式配置时才折叠会话（渠道优先级 + 身份链接）。

其含义：

- 渠道专属的 dmScope 覆盖必须优先于全局默认值。
- identityLinks 只能在显式链接组内部折叠，而不能跨越无关对等端。

- 绿色：
  - `make routing-precedence`
  - `make routing-identitylinks`
- 红色（预期）：
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
