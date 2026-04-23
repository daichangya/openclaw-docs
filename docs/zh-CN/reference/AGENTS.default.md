---
read_when:
    - 启动新的 OpenClaw 智能体会话
    - 启用或审计默认 Skills
summary: 个人助理设置的默认 OpenClaw 智能体指令与 Skills 名册
title: 默认 AGENTS.md
x-i18n:
    generated_at: "2026-04-23T21:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebed3d529ec4472268f0d02a431728d3cb6b68c0959ce5cbcaefd1a05aa1eecf
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw 个人助理（默认）

## 首次运行（推荐）

OpenClaw 为智能体使用专用工作区目录。默认值：`~/.openclaw/workspace`（可通过 `agents.defaults.workspace` 配置）。

1. 创建工作区（如果尚不存在）：

```bash
mkdir -p ~/.openclaw/workspace
```

2. 将默认工作区模板复制到工作区中：

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 可选：如果你想使用个人助理 Skills 名册，请用此文件替换 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 可选：通过设置 `agents.defaults.workspace` 选择不同工作区（支持 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全默认值

- 不要将目录内容或秘密转储到聊天中。
- 除非被明确要求，否则不要运行破坏性命令。
- 不要向外部消息表面发送部分/流式回复（只发送最终回复）。

## 会话开始（必需）

- 读取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天和昨天的内容。
- 若存在，读取 `MEMORY.md`。
- 在回复前完成这些操作。

## Soul（必需）

- `SOUL.md` 定义身份、语气和边界。请保持其为最新状态。
- 如果你更改了 `SOUL.md`，请告知用户。
- 你在每个会话中都是一个全新实例；连续性保存在这些文件中。

## 共享空间（推荐）

- 你不是用户本人的声音；在群聊或公共渠道中要谨慎。
- 不要分享私人数据、联系信息或内部备注。

## Memory 系统（推荐）

- 每日日志：`memory/YYYY-MM-DD.md`（如有需要请创建 `memory/`）。
- 长期 memory：`MEMORY.md`，用于保存持久事实、偏好和决策。
- 小写 `memory.md` 仅作为旧版修复输入；不要有意同时保留两个根文件。
- 在会话开始时，读取今天 + 昨天 + `MEMORY.md`（如果存在）。
- 记录内容：决策、偏好、约束、未完成事项。
- 除非被明确要求，否则避免记录秘密。

## 工具与 Skills

- 工具位于 Skills 中；在需要时请遵循各个 skill 的 `SKILL.md`。
- 将环境特定备注保存在 `TOOLS.md` 中（Skills 说明）。

## 备份提示（推荐）

如果你将此工作区视为 Clawd 的“memory”，请将它变成一个 git 仓库（最好是私有），这样 `AGENTS.md` 和你的 memory 文件就能被备份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# 可选：添加一个私有远程仓库并 push
```

## OpenClaw 的作用

- 运行 WhatsApp Gateway 网关 + Pi coding 智能体，使助理能够通过主机 Mac 读取/写入聊天、获取上下文并运行 Skills。
- macOS 应用管理权限（屏幕录制、通知、麦克风），并通过其内置二进制暴露 `openclaw` CLI。
- 默认情况下，私聊会折叠到智能体的 `main` 会话；群组会保持隔离，格式为 `agent:<agentId>:<channel>:group:<id>`（房间/频道：`agent:<agentId>:<channel>:channel:<id>`）；heartbeats 会让后台任务保持活跃。

## 核心 Skills（在 设置 → Skills 中启用）

- **mcporter** —— 用于管理外部 skill 后端的工具服务器运行时/CLI。
- **Peekaboo** —— 快速获取 macOS 截图，并可选使用 AI 视觉分析。
- **camsnap** —— 从 RTSP/ONVIF 安防摄像头捕获帧、片段或运动提醒。
- **oracle** —— 面向 OpenAI 的智能体 CLI，支持会话重放和浏览器控制。
- **eightctl** —— 从终端控制你的睡眠。
- **imsg** —— 发送、读取、流式处理 iMessage 和短信。
- **wacli** —— WhatsApp CLI：同步、搜索、发送。
- **discord** —— Discord 操作：表情回应、贴纸、投票。请使用 `user:<id>` 或 `channel:<id>` 作为目标（裸数字 ID 有歧义）。
- **gog** —— Google Suite CLI：Gmail、日历、Drive、联系人。
- **spotify-player** —— 终端 Spotify 客户端，用于搜索/排队/控制播放。
- **sag** —— 具备 mac 风格 say 体验的 ElevenLabs 语音；默认流式输出到扬声器。
- **Sonos CLI** —— 通过脚本控制 Sonos 音箱（发现/状态/播放/音量/分组）。
- **blucli** —— 通过脚本播放、分组并自动化 BluOS 播放器。
- **OpenHue CLI** —— 用于场景和自动化的 Philips Hue 灯光控制。
- **OpenAI Whisper** —— 本地语音转文本，用于快速听写和语音留言转录。
- **Gemini CLI** —— 在终端中使用 Google Gemini 模型进行快速问答。
- **agent-tools** —— 用于自动化和辅助脚本的工具集。

## 使用说明

- 优先使用 `openclaw` CLI 进行脚本化；mac 应用负责处理权限。
- 从 Skills 标签页运行安装；如果二进制已存在，它会隐藏按钮。
- 保持 heartbeats 启用，这样助理才能安排提醒、监控收件箱并触发摄像头抓拍。
- Canvas UI 会以全屏运行，并带有原生覆盖层。避免将关键控件放在左上/右上/底部边缘；请在布局中加入明确的边距，并且不要依赖安全区域 inset。
- 如需进行浏览器驱动的验证，请使用 `openclaw browser`（tabs/status/screenshot）和 OpenClaw 管理的 Chrome 配置。
- 如需 DOM 检查，请使用 `openclaw browser eval|query|dom|snapshot`（当你需要机器输出时，配合 `--json`/`--out`）。
- 如需交互，请使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要 snapshot refs；如需使用 CSS 选择器，请用 `evaluate`）。
