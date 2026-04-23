---
read_when:
    - 更改菜单栏图标行为时
summary: macOS 上 OpenClaw 的菜单栏图标状态与动画
title: 菜单栏图标
x-i18n:
    generated_at: "2026-04-23T20:55:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48a105e1b1450aa511e0319752cec1ffe883228d1e3ac7b1dc400d02983c618a
    source_path: platforms/mac/icon.md
    workflow: 15
---

# 菜单栏图标状态

作者：steipete · 更新于：2025-12-06 · 范围：macOS 应用（`apps/macos`）

- **空闲：** 正常图标动画（眨眼、偶尔摆动）。
- **暂停：** 状态项使用 `appearsDisabled`；无动作。
- **语音触发（大耳朵）：** 当听到唤醒词时，语音唤醒检测器会调用 `AppState.triggerVoiceEars(ttl: nil)`，在捕获话语期间保持 `earBoostActive=true`。耳朵会放大（1.9x），并添加圆形耳孔以提高可读性，然后在静音 1 秒后通过 `stopVoiceEars()` 恢复。仅由应用内语音流水线触发。
- **工作中（智能体运行）：** `AppState.isWorking=true` 会驱动一种“尾巴/腿快跑”的微动作：工作进行中时，腿摆动更快，并带有轻微偏移。当前是在 WebChat 智能体运行前后切换；当你接入其他长任务时，也请在其前后添加相同切换。

接线点

- 语音唤醒：运行时/测试器在触发时调用 `AppState.triggerVoiceEars(ttl: nil)`，并在静音 1 秒后调用 `stopVoiceEars()`，以匹配捕获窗口。
- 智能体活动：在工作区间前后设置 `AppStateStore.shared.setWorking(true/false)`（WebChat 智能体调用中已这样处理）。保持区间简短，并在 `defer` 块中重置，以避免动画卡住。

形状与尺寸

- 基础图标在 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` 中绘制。
- 默认耳朵缩放为 `1.0`；语音增强会将 `earScale=1.9` 并切换 `earHoles=true`，同时不改变整体 frame（18×18 pt 模板图像渲染到 36×36 px Retina backing store 中）。
- 快跑效果会将腿摆动提升到约 `1.0`，并加入轻微的水平抖动；它会叠加到任何现有的空闲摆动之上。

行为说明

- 没有用于耳朵/工作状态的外部 CLI/broker 开关；请将其保持为仅由应用自身信号控制的内部机制，以避免意外抖动。
- 保持 TTL 简短（&lt;10s），这样如果某个任务挂住，图标也能快速恢复到基线状态。
