---
read_when:
    - 调整 mac 菜单 UI 或状态逻辑
summary: 菜单栏状态逻辑以及向用户展示的内容
title: 菜单栏
x-i18n:
    generated_at: "2026-04-23T20:55:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8155aed327094887b72725fde25b2e4dcb233c8fbd5eed9823ef1e3be7a4e56d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# 菜单栏状态逻辑

## 展示内容

- 我们会在菜单栏图标和菜单第一行状态中展示当前智能体的工作状态。
- 当有工作正在进行时，健康状态会被隐藏；当所有会话都空闲时，它会重新显示。
- 菜单中的“Nodes”区块只列出**设备**（通过 `node.list` 获取的已配对节点），而不是 client/presence 条目。
- 当 provider 使用量快照可用时，“Context”下方会出现一个“Usage”部分。

## 状态模型

- 会话：事件会携带 `runId`（每次运行唯一）以及负载中的 `sessionKey`。`main` 会话的键名是 `main`；如果不存在，则回退到最近更新的会话。
- 优先级：主会话始终优先。如果主会话处于活动状态，会立即显示它的状态。如果主会话空闲，则显示最近处于活动状态的非主会话。我们不会在活动过程中来回切换；只有当当前会话进入空闲状态，或主会话变为活动状态时，才会切换。
- 活动类型：
  - `job`：高级命令执行（`state: started|streaming|done|error`）。
  - `tool`：`phase: start|result`，并带有 `toolName` 和 `meta/args`。

## `IconState` 枚举（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（调试覆盖）

### `ActivityKind` → 图标符号

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- 默认 → 🛠️

### 视觉映射

- `idle`：普通小动物图标。
- `workingMain`：带符号徽章、完整着色、腿部“工作中”动画。
- `workingOther`：带符号徽章、弱化着色、不奔跑。
- `overridden`：无论实际活动如何，都使用所选的符号/着色。

## 状态行文本（菜单）

- 当有工作进行时：`<Session role> · <activity label>`
  - 示例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 空闲时：回退为健康状态摘要。

## 事件摄取

- 来源：control-channel `agent` 事件（`ControlChannel.handleAgentEvent`）。
- 解析字段：
  - `stream: "job"`，配合 `data.state` 判断开始/停止。
  - `stream: "tool"`，配合 `data.phase`、`name` 以及可选的 `meta`/`args`。
- 标签：
  - `exec`：取 `args.command` 的第一行。
  - `read`/`write`：使用缩短后的路径。
  - `edit`：使用路径，并从 `meta`/diff 计数推断变更类型。
  - 回退：使用工具名。

## 调试覆盖

- 设置 ▸ 调试 ▸ “Icon override” 选择器：
  - `System (auto)`（默认）
  - `Working: main`（按工具类型）
  - `Working: other`（按工具类型）
  - `Idle`
- 通过 `@AppStorage("iconOverride")` 存储；映射为 `IconState.overridden`。

## 测试检查清单

- 触发主会话 job：验证图标立即切换，状态行显示主会话标签。
- 在主会话空闲时触发非主会话 job：图标/状态显示非主会话；在其结束前保持稳定。
- 当其他会话活动时启动主会话：图标应立即切换为主会话。
- 快速工具突发：确保徽章不闪烁（工具结果上应用 TTL 宽限）。
- 一旦所有会话都空闲，健康状态行应重新出现。
