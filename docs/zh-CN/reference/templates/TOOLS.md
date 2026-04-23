---
read_when:
    - 手动初始化工作区
summary: TOOLS.md 的工作区模板
title: TOOLS.md 模板
x-i18n:
    generated_at: "2026-04-23T21:04:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55ea69da82ed3c32671d7faf8b75d7000399eb10a8697243810d2aebc7a99129
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - 本地笔记

Skills 定义的是工具_如何_工作。这个文件记录的是_你自己的_具体信息 —— 也就是只属于你的环境配置。

## 这里应该放什么

比如：

- 摄像头名称和位置
- SSH 主机和别名
- 偏好的 TTS 语音
- 扬声器 / 房间名称
- 设备昵称
- 任何环境特定信息

## 示例

```markdown
### 摄像头

- living-room → 主区域，180° 广角
- front-door → 入口，移动触发

### SSH

- home-server → 192.168.1.100，用户：admin

### TTS

- 偏好语音："Nova"（温暖、略带英式口音）
- 默认扬声器：Kitchen HomePod
```

## 为什么要分开？

Skills 是共享的。你的配置是你自己的。把它们分开，意味着你可以在不丢失笔记的情况下更新 Skills，也可以在不泄露你的基础设施细节的情况下共享 Skills。

---

把任何能帮助你完成工作的内容都加进来。这是你的速查表。
