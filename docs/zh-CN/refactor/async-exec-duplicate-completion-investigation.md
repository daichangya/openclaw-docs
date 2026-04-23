---
read_when:
    - 调试重复的 node exec 完成事件
    - 处理 heartbeat/系统事件去重
summary: Async exec 重复完成注入的调查说明
title: Async Exec Duplicate Completion Investigation
x-i18n:
    generated_at: "2026-04-23T21:02:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09fd2d851f3102be7b0182b5ba4d8ed0bf9a7ce380d71b1ecaa302a59ec2a2c2
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## 范围

- 会话：`agent:main:telegram:group:-1003774691294:topic:1`
- 症状：同一个会话/运行 `keen-nexus` 的异步 exec 完成事件在 LCM 中被记录了两次，且都作为用户轮次出现。
- 目标：判断这更可能是重复会话注入，还是普通的出站交付重试。

## 结论

这最有可能是**重复会话注入**，而不是单纯的出站交付重试。

Gateway 网关侧最明显的缺口出现在**node exec 完成路径**中：

1. node 侧 exec 完成后会发出带完整 `runId` 的 `exec.finished`。
2. Gateway 网关中的 `server-node-events` 会将其转换为系统事件，并请求一次 heartbeat。
3. heartbeat 运行会把已排空的系统事件块注入到智能体提示中。
4. 内嵌运行器会将该提示作为新的用户轮次持久化到会话 transcript 中。

如果同一个 `runId` 的 `exec.finished` 因任何原因（重放、重连重复、上游重发、生产者重复）到达 gateway 两次，OpenClaw 当前在这条路径上**没有基于 `runId`/`contextKey` 的幂等性检查**。第二份副本就会变成第二条内容相同的用户消息。

## 精确代码路径

### 1. 生产者：node exec 完成事件

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` 会发出 `node.event`，事件类型为 `exec.finished`。
  - 负载中包含 `sessionKey` 和完整的 `runId`。

### 2. Gateway 网关事件接收

- `src/gateway/server-node-events.ts:574-640`
  - 处理 `exec.finished`。
  - 构造文本：
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 通过以下方式将其加入队列：
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 随即请求一次唤醒：
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. 系统事件去重薄弱点

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` 只会抑制**连续的重复文本**：
    - `if (entry.lastText === cleaned) return false`
  - 它会存储 `contextKey`，但**不会**使用 `contextKey` 来实现幂等性。
  - 一旦 drain 完成，重复抑制就会重置。

这意味着，即使代码已经拥有稳定的幂等候选键（`exec:<runId>`），同一个 `runId` 的 `exec.finished` 在稍后被重放时，仍然可能再次被接受。

### 4. 唤醒处理不是主要的重复来源

- `src/infra/heartbeat-wake.ts:79-117`
  - 唤醒会按 `(agentId, sessionKey)` 合并。
  - 针对同一目标的重复唤醒请求会折叠为一个待处理唤醒条目。

因此，相比重复事件接收，**仅由重复唤醒处理导致**的解释力更弱。

### 5. Heartbeat 消费事件并将其变为提示输入

- `src/infra/heartbeat-runner.ts:535-574`
  - 预检阶段会预览待处理系统事件，并将其分类为 exec-event 运行。
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` 会清空该会话的队列。
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - 已排空的系统事件块会被预置到智能体提示正文前面。

### 6. Transcript 注入点

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` 会将完整提示提交给内嵌 PI 会话。
  - 这正是完成事件派生出来的提示变成持久化用户轮次的地方。

因此，一旦相同系统事件被两次重建到提示中，就理应会看到重复的 LCM 用户消息。

## 为什么单纯的出站交付重试可能性更低

Heartbeat 运行器中确实存在真实的出站失败路径：

- `src/infra/heartbeat-runner.ts:1194-1242`
  - 首先生成回复。
  - 然后通过 `deliverOutboundPayloads(...)` 执行出站交付。
  - 如果在那里失败，会返回 `{ status: "failed" }`。

然而，对于同一个系统事件队列条目，仅靠这一点**不足以**解释重复的用户轮次：

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - 系统事件队列在出站交付之前就已经被排空了。

因此，仅靠渠道发送重试本身，并不会重新创建完全相同的队列事件。它可以解释外部交付缺失/失败，但不能单独解释第二条完全相同的会话用户消息。

## 次要、低置信度的可能性

智能体运行器中还存在完整运行重试循环：

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 某些瞬时失败会重试整个运行，并重新提交相同的 `commandBody`。

如果提示在触发重试条件之前已经被追加，那么这可能会在**同一次回复执行内部**复制一条已持久化的用户提示。

我将其排序在重复 `exec.finished` 接收之后，原因是：

- 观察到的间隔约为 51 秒，这更像是第二次唤醒/轮次，而不是进程内重试；
- 报告中已经提到重复的消息发送失败，这更指向一次独立的后续轮次，而不是即时的模型/运行时重试。

## 根因假设

最高置信度假设：

- `keen-nexus` 的完成事件经过了**node exec 事件路径**。
- 同一个 `exec.finished` 被两次投递到了 `server-node-events`。
- Gateway 网关接受了这两次投递，因为 `enqueueSystemEvent(...)` 不会按 `contextKey` / `runId` 去重。
- 每个被接受的事件都触发了一次 heartbeat，并作为用户轮次注入到了 PI transcript 中。

## 建议的微小外科式修复

如果需要修复，最小且高价值的改动是：

- 让 exec/系统事件幂等性在短时间窗口内尊重 `contextKey`，至少对完全相同的 `(sessionKey, contextKey, text)` 重复进行去重；
- 或者在 `server-node-events` 中，为 `exec.finished` 增加一个专门的去重逻辑，键为 `(sessionKey, runId, event kind)`。

这样就能在重放的 `exec.finished` 变成会话轮次之前，直接阻止重复。
