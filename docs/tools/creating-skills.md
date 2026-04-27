---
read_when:
    - 你正在工作区中创建一个新的自定义 Skill
    - 你需要一个基于 `SKILL.md` 的 Skill 快速入门工作流
summary: 使用 `SKILL.md` 构建并测试自定义工作区 Skills
title: 创建 Skills
x-i18n:
    generated_at: "2026-04-23T21:07:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills 用于教会智能体如何以及何时使用工具。每个 Skill 都是一个目录，
其中包含一个带有 YAML frontmatter 和 Markdown 指令的 `SKILL.md` 文件。

有关 Skills 如何加载和排序优先级，请参见 [Skills](/zh-CN/tools/skills)。

## 创建你的第一个 Skill

<Steps>
  <Step title="创建 Skill 目录">
    Skills 位于你的工作区中。创建一个新文件夹：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="编写 SKILL.md">
    在该目录中创建 `SKILL.md`。frontmatter 定义元数据，
    Markdown 正文则包含给智能体的指令。

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="添加工具（可选）">
    你可以在 frontmatter 中定义自定义工具 schema，或指示智能体
    使用现有系统工具（如 `exec` 或 `browser`）。Skills 也可以
    和它们所描述的工具一起打包进插件中。

  </Step>

  <Step title="加载 Skill">
    启动一个新会话，以便 OpenClaw 读取该 Skill：

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    验证 Skill 已加载：

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="测试它">
    发送一条应当触发该 Skill 的消息：

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或者直接与智能体聊天，并请求一个问候。

  </Step>
</Steps>

## Skill 元数据参考

YAML frontmatter 支持以下字段：

| 字段 | 必填 | 描述 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name` | 是 | 唯一标识符（snake_case） |
| `description` | 是 | 展示给智能体的一行描述 |
| `metadata.openclaw.os` | 否 | OS 过滤器（`["darwin"]`、`["linux"]` 等） |
| `metadata.openclaw.requires.bins` | 否 | PATH 上必需的二进制 |
| `metadata.openclaw.requires.config` | 否 | 必需的配置键 |

## 最佳实践

- **保持简洁** —— 告诉模型_做什么_，而不是如何扮演 AI
- **安全优先** —— 如果你的 Skill 使用 `exec`，请确保提示词不会允许来自不受信任输入的任意命令注入
- **本地测试** —— 在分享前使用 `openclaw agent --message "..."` 进行测试
- **使用 ClawHub** —— 在 [ClawHub](https://clawhub.ai) 浏览并贡献 Skills

## Skills 位于哪里

| 位置 | 优先级 | 范围 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/` | 最高 | 按智能体 |
| `\<workspace\>/.agents/skills/` | 高 | 按工作区智能体 |
| `~/.agents/skills/` | 中 | 共享智能体配置文件 |
| `~/.openclaw/skills/` | 中 | 共享（所有智能体） |
| 内置（随 OpenClaw 一起发布） | 低 | 全局 |
| `skills.load.extraDirs` | 最低 | 自定义共享文件夹 |

## 相关内容

- [Skills reference](/zh-CN/tools/skills) —— 加载、优先级和门控规则
- [Skills 配置](/zh-CN/tools/skills-config) —— `skills.*` 配置 schema
- [ClawHub](/zh-CN/tools/clawhub) —— 公共 Skill 注册表
- [Building Plugins](/zh-CN/plugins/building-plugins) —— 插件可以携带 Skills
