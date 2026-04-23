---
read_when:
    - 调试重复的节点 exec 完成事件
    - 处理 heartbeat/system-event 去重
summary: 重复 async exec 完成注入的调查说明
title: Async Exec Duplicate Completion Investigation
x-i18n:
    generated_at: "2026-04-23T06:42:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Async Exec Duplicate Completion Investigation

## 范围

- 会话：`agent:main:telegram:group:-1003774691294:topic:1`
- 症状：同一个会话/运行 `keen-nexus` 的 async exec 完成事件在 LCM 中被记录为两次用户轮次。
- 目标：识别这更可能是重复的会话注入，还是单纯的出站投递重试。

## 结论

这更可能是**重复的会话注入**，而不是单纯的出站投递重试。

Gateway 网关侧最明显的缺口出现在**节点 exec 完成路径**：

1. 节点侧 exec 完成时会发出带完整 `runId` 的 `exec.finished`。
2. Gateway 网关的 `server-node-events` 会将其转换为系统事件并请求一次 heartbeat。
3. heartbeat 运行会将已排空的系统事件块注入到智能体提示词中。
4. 嵌入式 runner 会将该提示词持久化为会话转录中的一个新用户轮次。

如果由于任何原因（重放、重连重复、上游重发、生产者重复）相同的 `exec.finished` 针对同一个 `runId` 两次到达 Gateway 网关，OpenClaw 当前在这条路径上**没有基于 `runId`/`contextKey` 的幂等检查**。第二份副本会变成第二条内容相同的用户消息。

## 精确代码路径

### 1. 生产者：节点 exec 完成事件

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` 发出事件为 `exec.finished` 的 `node.event`。
  - 负载包含 `sessionKey` 和完整 `runId`。

### 2. Gateway 网关事件摄取

- `src/gateway/server-node-events.ts:574-640`
  - 处理 `exec.finished`。
  - 构建文本：
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 通过以下方式将其入队：
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 并立即请求唤醒：
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. 系统事件去重薄弱点

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` 只会抑制**连续的重复文本**：
    - `if (entry.lastText === cleaned) return false`
  - 它会存储 `contextKey`，但**不会**使用 `contextKey` 做幂等检查。
  - 在 drain 之后，重复抑制会重置。

这意味着，即使代码已经有一个稳定的幂等候选键（`exec:<runId>`），被重放的相同 `runId` 的 `exec.finished` 之后仍可能再次被接受。

### 4. 唤醒处理不是主要的重复来源

- `src/infra/heartbeat-wake.ts:79-117`
  - 唤醒会按 `(agentId, sessionKey)` 合并。
  - 针对同一目标的重复唤醒请求会折叠为一个待处理唤醒条目。

因此，相比重复事件摄取，**单靠重复唤醒处理**来解释问题的可能性更低。

### 5. Heartbeat 消费该事件并将其转为提示词输入

- `src/infra/heartbeat-runner.ts:535-574`
  - 预检会窥视待处理系统事件，并对 exec-event 运行进行分类。
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` 会排空该会话的队列。
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - 排空后的系统事件块会被前置注入到智能体提示词主体中。

### 6. 转录注入点

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` 会将完整提示词提交给嵌入式 PI 会话。
  - 这就是基于完成事件生成的提示词变成持久化用户轮次的那个点。

因此，一旦同一个系统事件被两次重建进提示词中，出现重复的 LCM 用户消息就是预期结果。

## 为什么单纯的出站投递重试可能性更低

heartbeat runner 中确实存在真实的出站失败路径：

- `src/infra/heartbeat-runner.ts:1194-1242`
  - 先生成回复。
  - 然后通过 `deliverOutboundPayloads(...)` 进行出站投递。
  - 此处失败会返回 `{ status: "failed" }`。

但是，对于同一个系统事件队列条目，仅凭这一点**不足以**解释重复的用户轮次：

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - 系统事件队列在出站投递之前就已经被排空。

因此，仅仅是渠道发送重试本身不会重新创建完全相同的排队事件。它可以解释外部投递缺失/失败，但单靠这一点无法解释第二条完全相同的会话用户消息。

## 次要的、置信度较低的可能性

智能体 runner 中存在一个完整运行重试循环：

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 某些瞬时失败会重试整个运行，并重新提交相同的 `commandBody`。

如果在触发重试条件之前提示词已经被追加，那么这可能会在**同一次回复执行内部**复制一个已持久化的用户提示词。

我将这种可能性排在低于重复 `exec.finished` 摄取之后，因为：

- 观察到的时间间隔约为 51 秒，更像是第二次唤醒/轮次，而不是进程内重试；
- 报告中已经提到重复的消息发送失败，这更指向一次后续独立轮次，而不是即时的模型/运行时重试。

## 根因假设

最高置信度假设：

- `keen-nexus` 完成事件走的是**节点 exec 事件路径**。
- 同一个 `exec.finished` 被两次投递到 `server-node-events`。
- Gateway 网关接受了这两次事件，因为 `enqueueSystemEvent(...)` 不会按 `contextKey` / `runId` 去重。
- 每个被接受的事件都会触发一次 heartbeat，并作为一个用户轮次注入到 PI 转录中。

## 建议的微小外科式修复

如果要修复，最小但高价值的改动是：

- 让 exec/系统事件幂等性在短时间窗口内尊重 `contextKey`，至少对完全相同的 `(sessionKey, contextKey, text)` 重复项生效；
- 或者在 `server-node-events` 中为 `exec.finished` 添加专用去重，键为 `(sessionKey, runId, event kind)`。

这将直接阻止被重放的 `exec.finished` 重复项在变成会话轮次之前通过。
