---
read_when:
    - 你想了解 OpenClaw 提供了哪些工具
    - 你需要配置、允许或拒绝工具
    - 你正在决定使用内置工具、Skills 还是插件
summary: OpenClaw 工具和插件概览：智能体能做什么，以及如何扩展它
title: 工具和插件
x-i18n:
    generated_at: "2026-04-23T06:43:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# 工具和插件

智能体除生成文本之外所做的一切，都通过**工具**完成。
工具是智能体读取文件、运行命令、浏览网页、发送消息以及与设备交互的方式。

## 工具、Skills 和插件

OpenClaw 有三个协同工作的层级：

<Steps>
  <Step title="工具是智能体实际调用的内容">
    工具是智能体可调用的类型化函数（例如 `exec`、`browser`、
    `web_search`、`message`）。OpenClaw 内置了一组**内置工具**，插件也可以注册额外工具。

    对智能体来说，工具表现为发送到模型 API 的结构化函数定义。

  </Step>

  <Step title="Skills 告诉智能体何时以及如何使用">
    Skill 是注入到系统提示词中的 markdown 文件（`SKILL.md`）。
    Skills 为智能体提供上下文、约束以及逐步指导，以便更有效地
    使用工具。Skills 可以存在于你的工作区、共享文件夹中，
    也可以随插件一起提供。

    [Skills 参考](/zh-CN/tools/skills) | [创建 Skills](/zh-CN/tools/creating-skills)

  </Step>

  <Step title="插件将一切打包在一起">
    插件是可以注册任意能力组合的包：
    渠道、模型提供商、工具、Skills、语音、实时转录、
    实时语音、媒体理解、图像生成、视频生成、
    web 获取、web 搜索等。有些插件是**核心**
    （随 OpenClaw 一起提供），另一些则是**外部**
    （由社区发布到 npm）。

    [安装和配置插件](/zh-CN/tools/plugin) | [构建你自己的插件](/zh-CN/plugins/building-plugins)

  </Step>
</Steps>

## 内置工具

这些工具随 OpenClaw 一起提供，无需安装任何插件即可使用：

| Tool                                       | 功能 | 页面 |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | 运行 shell 命令、管理后台进程 | [Exec](/zh-CN/tools/exec), [Exec Approvals](/zh-CN/tools/exec-approvals) |
| `code_execution`                           | 运行沙箱隔离的远程 Python 分析 | [Code Execution](/zh-CN/tools/code-execution) |
| `browser`                                  | 控制 Chromium 浏览器（导航、点击、截图） | [Browser](/zh-CN/tools/browser) |
| `web_search` / `x_search` / `web_fetch`    | 搜索网页、搜索 X 帖子、获取页面内容 | [Web](/zh-CN/tools/web), [Web Fetch](/zh-CN/tools/web-fetch) |
| `read` / `write` / `edit`                  | 在工作区中进行文件 I/O |  |
| `apply_patch`                              | 多段文件补丁 | [Apply Patch](/zh-CN/tools/apply-patch) |
| `message`                                  | 跨所有渠道发送消息 | [Agent Send](/zh-CN/tools/agent-send) |
| `canvas`                                   | 驱动节点 Canvas（present、eval、snapshot） |  |
| `nodes`                                    | 发现并定向到已配对设备 |  |
| `cron` / `gateway`                         | 管理定时任务；检查、修补、重启或更新 Gateway 网关 |  |
| `image` / `image_generate`                 | 分析或生成图像 | [Image Generation](/zh-CN/tools/image-generation) |
| `music_generate`                           | 生成音乐轨道 | [Music Generation](/zh-CN/tools/music-generation) |
| `video_generate`                           | 生成视频 | [Video Generation](/zh-CN/tools/video-generation) |
| `tts`                                      | 一次性文本转语音转换 | [TTS](/zh-CN/tools/tts) |
| `sessions_*` / `subagents` / `agents_list` | 会话管理、状态和子智能体编排 | [Sub-agents](/zh-CN/tools/subagents) |
| `session_status`                           | 轻量级 `/status` 风格回读和会话模型覆盖 | [Session Tools](/zh-CN/concepts/session-tool) |

对于图像任务，使用 `image` 进行分析，使用 `image_generate` 进行生成或编辑。如果你要使用 `openai/*`、`google/*`、`fal/*` 或其他非默认图像提供商，请先配置该提供商的认证 / API key。

对于音乐任务，使用 `music_generate`。如果你要使用 `google/*`、`minimax/*` 或其他非默认音乐提供商，请先配置该提供商的认证 / API key。

对于视频任务，使用 `video_generate`。如果你要使用 `qwen/*` 或其他非默认视频提供商，请先配置该提供商的认证 / API key。

对于基于工作流的音频生成，当某个插件（例如
ComfyUI）注册了 `music_generate` 时，请使用它。这与 `tts`
不同，后者是文本转语音。

`session_status` 是 sessions 分组中的轻量级状态 / 回读工具。
它用于回答有关当前会话的 `/status` 风格问题，并且可以
选择设置按会话生效的模型覆盖；`model=default` 会清除此
覆盖。与 `/status` 一样，它可以从最新转录使用记录中回填稀疏的 token / 缓存计数，以及当前运行时模型标签。

`gateway` 是仅限所有者使用的 Gateway 网关运行时工具，用于执行 Gateway 网关操作：

- `config.schema.lookup`：在编辑前查看某个按路径限定的配置子树
- `config.get`：获取当前配置快照 + 哈希
- `config.patch`：执行带重启的局部配置更新
- `config.apply`：仅用于完整替换整个配置
- `update.run`：显式执行自更新 + 重启

对于部分变更，优先使用 `config.schema.lookup`，然后使用 `config.patch`。仅当你明确要替换整个配置时，才使用 `config.apply`。
该工具还拒绝修改 `tools.exec.ask` 或 `tools.exec.security`；
旧版 `tools.bash.*` 别名会被标准化为同样受保护的 exec 路径。

### 插件提供的工具

插件可以注册额外工具。示例包括：

- [Diffs](/zh-CN/tools/diffs) — diff 查看器和渲染器
- [LLM Task](/zh-CN/tools/llm-task) — 仅输出 JSON 的 LLM 步骤，用于结构化输出
- [Lobster](/zh-CN/tools/lobster) — 带可恢复审批的类型化工作流运行时
- [Music Generation](/zh-CN/tools/music-generation) — 由工作流支持的提供商共享的 `music_generate` 工具
- [OpenProse](/zh-CN/prose) — markdown 优先的工作流编排
- [Tokenjuice](/zh-CN/tools/tokenjuice) — 紧凑显示嘈杂 `exec` 和 `bash` 工具结果

## 工具配置

### 允许和拒绝列表

通过配置中的 `tools.allow` / `tools.deny` 控制智能体可调用哪些工具。拒绝始终优先于允许。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### 工具配置档案

`tools.profile` 会在应用 `allow` / `deny` 之前设置基础 allowlist。
按智能体覆盖：`agents.list[].tools.profile`。

| Profile     | 包含内容 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 不限制（与未设置相同） |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `minimal`   | 仅 `session_status` |

`coding` 和 `messaging` 配置档案还会允许在插件键 `bundle-mcp` 下已配置的 bundle MCP 工具。
当你希望某个配置档案保留其常规内置工具，但隐藏所有已配置 MCP 工具时，请添加 `tools.deny: ["bundle-mcp"]`。
`minimal` 配置档案不包含 bundle MCP 工具。

### 工具分组

在 allow / deny 列表中使用 `group:*` 简写：

| Group              | 工具 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec、process、code_execution（`bash` 可作为 `exec` 的别名） |
| `group:fs`         | read、write、edit、apply_patch |
| `group:sessions`   | sessions_list、sessions_history、sessions_send、sessions_spawn、sessions_yield、subagents、session_status |
| `group:memory`     | memory_search、memory_get |
| `group:web`        | web_search、x_search、web_fetch |
| `group:ui`         | browser、canvas |
| `group:automation` | cron、gateway |
| `group:messaging`  | message |
| `group:nodes`      | nodes |
| `group:agents`     | agents_list |
| `group:media`      | image、image_generate、music_generate、video_generate、tts |
| `group:openclaw`   | 所有内置 OpenClaw 工具（不包括插件工具） |

`sessions_history` 返回一个有边界、经过安全过滤的回溯视图。它会去除
thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML
载荷（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>` 以及被截断的工具调用块）、
降级后的工具调用脚手架、泄露的 ASCII / 全角模型控制
token，以及助手文本中格式错误的 MiniMax 工具调用 XML，然后再应用
脱敏 / 截断，并在必要时使用超大行占位符，而不是充当
原始转录转储。

### 提供商特定限制

使用 `tools.byProvider` 可为特定提供商限制工具，而无需
更改全局默认值：

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
