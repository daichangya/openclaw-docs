---
read_when:
    - 你希望你的智能体听起来不那么泛泛而谈
    - 你正在编辑 SOUL.md
    - 你想要更鲜明的个性，同时不破坏安全性或简洁性
summary: 使用 SOUL.md 为你的 OpenClaw 智能体赋予真正的声音，而不是泛泛的助手腔调
title: SOUL.md 个性指南
x-i18n:
    generated_at: "2026-04-23T20:47:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` 是你的智能体声音所在的地方。

OpenClaw 会在普通会话中注入它，所以它确实有分量。如果你的智能体
听起来平淡、过度保守，或者带着一种奇怪的企业腔，通常该修的就是这个文件。

## 什么内容应该放进 SOUL.md

把那些会改变智能体“聊起来感觉如何”的内容放进去：

- 语气
- 观点
- 简洁程度
- 幽默感
- 边界
- 默认的直接程度

**不要**把它写成：

- 人生故事
- 更新日志
- 安全策略大杂烩
- 一大堵没有行为效果的氛围废话

短胜于长。锋利胜于模糊。

## 为什么这招有效

这和 OpenAI 的提示词指导是一致的：

- 提示工程指南指出，高层行为、语气、目标和
  示例应放在高优先级指令层，而不是埋在
  用户轮次里。
- 同一份指南还建议，把提示词当作需要迭代、
  固定版本并评估的东西，而不是写一次就丢的魔法文案。

对于 OpenClaw，`SOUL.md` 就是这一层。

如果你想要更好的个性，就写更有力的指令。如果你想要稳定的
个性，就让它们保持简洁并做好版本管理。

OpenAI 参考：

- [提示工程](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [消息角色与指令遵循](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示词

把这段贴给你的智能体，让它重写 `SOUL.md`。

路径已针对 OpenClaw 工作区固定：请使用 `SOUL.md`，而不是 `http://SOUL.md`。

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## 好的样子是什么

好的 `SOUL.md` 规则听起来会像这样：

- 要有立场
- 跳过废话
- 合适时可以幽默
- 尽早指出坏主意
- 除非深入确实有用，否则保持简洁

糟糕的 `SOUL.md` 规则听起来会像这样：

- 始终保持专业
- 提供全面且周到的帮助
- 确保积极且支持性的体验

第二组规则会把你的智能体变成一团糊状物。

## 一个警告

有个性，不等于可以敷衍。

把 `AGENTS.md` 留给操作规则。把 `SOUL.md` 留给声音、立场和
风格。如果你的智能体工作在共享渠道、公开回复或面向客户的
场景中，请确保语气仍然适合那个环境。

锋利是好事。烦人不是。

## 相关文档

- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [系统提示词](/zh-CN/concepts/system-prompt)
- [SOUL.md 模板](/zh-CN/reference/templates/SOUL)
