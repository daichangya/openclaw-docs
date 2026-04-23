---
read_when:
    - 更改语音唤醒词行为或默认设置
    - 添加需要唤醒词同步的新节点平台
summary: 全局语音唤醒词（由 Gateway 网关拥有）及其如何在节点之间同步
title: |-
    语音唤醒 pc蛋蛋 to=functions.read  天天中彩票双色球json
    {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/","offset":1,"limit":50}
x-i18n:
    generated_at: "2026-04-23T20:54:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ec2cf1cd4f57a7f40908830c2288fcaa77104a39528b409cdc30655a6d65636
    source_path: nodes/voicewake.md
    workflow: 15
---

# 语音唤醒（全局唤醒词）

OpenClaw 将**唤醒词视为由 Gateway 网关拥有的单一全局列表**。

- **不存在按节点自定义的唤醒词**。
- **任意节点/应用 UI 都可以编辑**该列表；更改由 Gateway 网关持久化，并广播给所有端。
- macOS 和 iOS 保留本地的**语音唤醒启用/禁用**开关（本地 UX 和权限不同）。
- Android 当前保持语音唤醒关闭，并在语音标签页中使用手动麦克风流程。

## 存储（Gateway 网关宿主机）

唤醒词存储在 gateway 机器上的：

- `~/.openclaw/settings/voicewake.json`

结构：

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 协议

### 方法

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set`，参数为 `{ triggers: string[] }` → `{ triggers: string[] }`

说明：

- triggers 会被标准化（去除首尾空白，丢弃空项）。空列表会回退到默认值。
- 出于安全考虑，会强制执行限制（数量/长度上限）。

### 事件

- `voicewake.changed`，负载为 `{ triggers: string[] }`

接收方：

- 所有 WebSocket 客户端（macOS 应用、WebChat 等）
- 所有已连接节点（iOS/Android），并且在节点连接时也会作为初始“当前状态”推送

## 客户端行为

### macOS 应用

- 使用全局列表来控制 `VoiceWakeRuntime` 触发器。
- 在语音唤醒设置中编辑“触发词”时，会调用 `voicewake.set`，然后依赖广播让其他客户端保持同步。

### iOS 节点

- 使用全局列表进行 `VoiceWakeManager` 触发词检测。
- 在设置中编辑唤醒词时，会调用 `voicewake.set`（通过 Gateway 网关 WS），同时保持本地唤醒词检测的响应性。

### Android 节点

- Android 运行时/设置中当前禁用了语音唤醒。
- Android 语音使用语音标签页中的手动麦克风采集，而不是唤醒词触发。
