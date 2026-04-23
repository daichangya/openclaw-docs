---
read_when:
    - 开始新的 OpenClaw 智能体会话
    - 启用或审查默认 Skills
summary: 个人助理设置的默认 OpenClaw 智能体说明和 Skills 名录
title: 默认 AGENTS.md
x-i18n:
    generated_at: "2026-04-23T15:14:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f34b2e332028029af015e4c6a25cb1399b4d70c5520529f415477a592a97c79c
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw 个人助理（默认）

## 首次运行（推荐）

OpenClaw 会为智能体使用一个专用工作区目录。默认值：`~/.openclaw/workspace`（可通过 `agents.defaults.workspace` 配置）。

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

3. 可选：如果你想使用个人助理 Skills 名录，请用此文件替换 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 可选：通过设置 `agents.defaults.workspace` 选择不同的工作区（支持 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 默认安全设置

- 不要将目录内容或密钥转储到聊天中。
- 除非得到明确要求，否则不要运行破坏性命令。
- 不要向外部消息传递界面发送部分回复或流式回复（只发送最终回复）。

## 会话启动（必需）

- 读取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天和昨天的内容。
- 如果存在，也读取 `MEMORY.md`。
- 在回复之前完成这些操作。

## Soul（必需）

- `SOUL.md` 定义身份、语气和边界。请保持其最新。
- 如果你修改了 `SOUL.md`，告诉用户。
- 每个会话中你都是一个全新的实例；连续性保存在这些文件中。

## 共享空间（推荐）

- 你不是用户的代言人；在群聊或公共渠道中要谨慎。
- 不要分享私人数据、联系信息或内部备注。

## Memory 系统（推荐）

- 每日日志：`memory/YYYY-MM-DD.md`（如果需要，请创建 `memory/`）。
- 长期记忆：`MEMORY.md`，用于保存持久事实、偏好和决定。
- 小写的 `memory.md` 仅作为旧版修复输入；不要有意同时保留这两个根文件。
- 在会话开始时，读取今天、昨天和 `MEMORY.md`（如果存在）。
- 记录：决定、偏好、约束条件、未完成事项。
- 除非明确要求，否则避免记录密钥。

## 工具和 Skills

- 工具存在于 Skills 中；当你需要使用某个 skill 时，请遵循其 `SKILL.md`。
- 将特定环境的说明保存在 `TOOLS.md` 中（Skills 说明）。

## 备份提示（推荐）

如果你将此工作区视为 Clawd 的“记忆”，请把它设为一个 git 仓库（最好是私有仓库），这样 `AGENTS.md` 和你的记忆文件就能得到备份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# 可选：添加一个私有远程仓库并推送
```

## OpenClaw 的作用

- 运行 WhatsApp Gateway 网关和 Pi 编码智能体，使助理能够读写聊天、获取上下文，并通过主机 Mac 运行 Skills。
- macOS 应用负责管理权限（屏幕录制、通知、麦克风），并通过其捆绑的二进制文件提供 `openclaw` CLI。
- 默认情况下，私聊会合并到智能体的 `main` 会话中；群组则保持隔离，格式为 `agent:<agentId>:<channel>:group:<id>`（房间/渠道：`agent:<agentId>:<channel>:channel:<id>`）；心跳机制会让后台任务保持活跃。

## 核心 Skills（在“设置”→“Skills”中启用）

- **mcporter** — 用于管理外部 skill 后端的工具服务器运行时 / CLI。
- **Peekaboo** — 快速进行 macOS 截图，并可选择使用 AI 进行视觉分析。
- **camsnap** — 从 RTSP/ONVIF 安防摄像头捕获帧、片段或运动警报。
- **oracle** — 面向 OpenAI 的智能体 CLI，支持会话回放和浏览器控制。
- **eightctl** — 通过终端控制你的睡眠。
- **imsg** — 发送、读取和流式处理 iMessage 与 SMS。
- **wacli** — WhatsApp CLI：同步、搜索、发送。
- **discord** — Discord 操作：反应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 目标（裸数字 id 有歧义）。
- **gog** — Google Suite CLI：Gmail、日历、Drive、联系人。
- **spotify-player** — 终端版 Spotify 客户端，用于搜索、加入队列和控制播放。
- **sag** — 采用 mac 风格 `say` 交互体验的 ElevenLabs 语音；默认流式输出到扬声器。
- **Sonos CLI** — 通过脚本控制 Sonos 扬声器（发现 / 状态 / 播放 / 音量 / 分组）。
- **blucli** — 通过脚本播放、分组和自动化 BluOS 播放器。
- **OpenHue CLI** — 用于场景和自动化的 Philips Hue 灯光控制。
- **OpenAI Whisper** — 本地语音转文本，用于快速听写和语音信箱转录。
- **Gemini CLI** — 在终端中使用 Google Gemini 模型进行快速问答。
- **agent-tools** — 用于自动化和辅助脚本的实用工具包。

## 使用说明

- 脚本编写优先使用 `openclaw` CLI；mac 应用负责处理权限。
- 从 Skills 标签页运行安装；如果某个二进制文件已存在，按钮会被隐藏。
- 保持启用心跳，这样助理才能安排提醒、监控收件箱并触发摄像头捕获。
- Canvas UI 以全屏模式运行，并带有原生覆盖层。避免将关键控件放在左上角 / 右上角 / 底部边缘；请在布局中添加明确的边距，不要依赖安全区域边距。
- 进行浏览器驱动的验证时，使用 `openclaw browser`（tabs/status/screenshot）以及 OpenClaw 管理的 Chrome 配置文件。
- 进行 DOM 检查时，使用 `openclaw browser eval|query|dom|snapshot`（当你需要机器可读输出时，可使用 `--json` / `--out`）。
- 进行交互时，使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要 snapshot 引用；CSS 选择器请使用 `evaluate`）。
