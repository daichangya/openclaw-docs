---
read_when:
    - 添加或修改 Skills
    - 更改 Skills 门控或加载规则
summary: Skills：托管与工作区、门控规则以及配置/环境变量接线
title: Skills
x-i18n:
    generated_at: "2026-04-21T20:35:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills（OpenClaw）

OpenClaw 使用与 **[AgentSkills](https://agentskills.io)** 兼容的技能文件夹来教会智能体如何使用工具。每个 Skill 都是一个目录，包含带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw 会加载**内置 Skills**以及可选的本地覆盖项，并根据环境、配置和二进制文件是否存在，在加载时进行过滤。

## 位置与优先级

OpenClaw 会从以下来源加载 Skills：

1. **额外 Skill 文件夹**：通过 `skills.load.extraDirs` 配置
2. **内置 Skills**：随安装一起提供（npm 包或 OpenClaw.app）
3. **托管/本地 Skills**：`~/.openclaw/skills`
4. **个人智能体 Skills**：`~/.agents/skills`
5. **项目智能体 Skills**：`<workspace>/.agents/skills`
6. **工作区 Skills**：`<workspace>/skills`

如果 Skill 名称冲突，优先级如下：

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 Skills → `skills.load.extraDirs`（最低）

## 按智能体区分的 Skills 与共享 Skills

在**多智能体**设置中，每个智能体都有自己的工作区。这意味着：

- **按智能体区分的 Skills** 仅存在于该智能体的 `<workspace>/skills` 中。
- **项目智能体 Skills** 位于 `<workspace>/.agents/skills`，会先于普通工作区 `skills/` 文件夹应用到该工作区。
- **个人智能体 Skills** 位于 `~/.agents/skills`，适用于该机器上的所有工作区。
- **共享 Skills** 位于 `~/.openclaw/skills`（托管/本地），对同一台机器上的**所有智能体**可见。
- 如果你想为多个智能体使用一个公共 Skill 包，也可以通过 `skills.load.extraDirs` 添加**共享文件夹**（最低优先级）。

如果同一个 Skill 名称出现在多个位置，仍然遵循通常的优先级规则：工作区优先，然后是项目智能体 Skills，再然后是个人智能体 Skills，再然后是托管/本地 Skills，然后是内置 Skills，最后是额外目录。

## 智能体 Skill allowlists

Skill 的**位置**和 Skill 的**可见性**是两种独立控制。

- 位置/优先级决定了同名 Skill 中哪一个副本胜出。
- 智能体 allowlists 决定了某个智能体实际上可以使用哪些可见 Skill。

使用 `agents.defaults.skills` 作为共享基线，然后通过 `agents.list[].skills` 为每个智能体覆盖：

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 Skills
    ],
  },
}
```

规则：

- 省略 `agents.defaults.skills` 表示默认不限制 Skills。
- 省略 `agents.list[].skills` 表示继承 `agents.defaults.skills`。
- 设置 `agents.list[].skills: []` 表示无 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

OpenClaw 会在提示词构建、Skill 斜杠命令发现、沙箱同步和 Skill 快照中应用智能体的有效 Skill 集合。

## 插件 + Skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录（相对于插件根目录的路径）来附带自己的 Skills。启用插件后，插件 Skills 就会加载。当前，这些目录会被合并到与 `skills.load.extraDirs` 相同的低优先级路径中，因此同名的内置、托管、智能体或工作区 Skill 会覆盖它们。
你可以通过插件配置项上的 `metadata.openclaw.requires.config` 对其进行门控。有关发现/配置，请参见 [插件](/zh-CN/tools/plugin)；有关这些 Skills 所教授的工具表面，请参见 [工具](/zh-CN/tools)。

## Skill Workshop

可选的实验性 Skill Workshop 插件可以根据智能体工作过程中观察到的可复用流程，创建或更新工作区 Skills。它默认禁用，必须通过 `plugins.entries.skill-workshop` 显式启用。

Skill Workshop 只会写入 `<workspace>/skills`，会扫描生成内容，支持待审批或自动安全写入，会隔离不安全提案，并在成功写入后刷新 Skill 快照，以便无需重启 Gateway 网关 就能让新 Skill 生效。

当你希望将诸如“下次请核实 GIF 署名”这样的修正，或诸如媒体 QA 检查清单这样的宝贵工作流，变成可持续复用的流程指令时，可以使用它。建议从待审批开始；只有在受信任的工作区中并审查过其提案之后，才使用自动写入。完整指南：
[Skill Workshop 插件](/zh-CN/plugins/skill-workshop)。

## ClawHub（安装 + 同步）

ClawHub 是 OpenClaw 的公开 Skills 注册表。可在 [https://clawhub.ai](https://clawhub.ai) 浏览。使用原生 `openclaw skills` 命令来发现/安装/更新 Skills，或者在你需要发布/同步工作流时使用单独的 `clawhub` CLI。
完整指南：[ClawHub](/zh-CN/tools/clawhub)。

常见流程：

- 将一个 Skill 安装到你的工作区：
  - `openclaw skills install <skill-slug>`
- 更新所有已安装的 Skills：
  - `openclaw skills update --all`
- 同步（扫描 + 发布更新）：
  - `clawhub sync --all`

原生 `openclaw skills install` 会安装到当前活动工作区的 `skills/` 目录中。单独的 `clawhub` CLI 也会安装到你当前工作目录下的 `./skills` 中（或者回退到配置的 OpenClaw 工作区）。
OpenClaw 会在下一个会话中将其作为 `<workspace>/skills` 加载。

## 安全说明

- 将第三方 Skills 视为**不受信任代码**。启用前请先阅读。
- 对于不受信任输入和高风险工具，优先使用沙箱隔离运行。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。
- 工作区和额外目录的 Skill 发现仅接受其解析后 realpath 仍位于已配置根目录内的 Skill 根目录和 `SKILL.md` 文件。
- 由 Gateway 网关 支持的 Skill 依赖安装（`skills.install`、新手引导以及 Skills 设置 UI）会在执行安装器元数据之前运行内置危险代码扫描器。默认情况下，`critical` 级别发现会阻止执行，除非调用方显式设置危险覆盖；可疑发现仍然只会发出警告。
- `openclaw skills install <slug>` 不同：它会将一个 ClawHub Skill 文件夹下载到工作区中，而不会使用上述安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会将密钥注入该智能体轮次的**宿主机**进程中（不是沙箱）。请让密钥远离提示词和日志。
- 更完整的威胁模型和检查清单，请参见 [安全](/zh-CN/gateway/security)。

## 格式（AgentSkills + 与 Pi 兼容）

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: 通过提供商支持的图像工作流生成或编辑图像
---
```

说明：

- 我们遵循 AgentSkills 规范的布局/意图。
- 嵌入式智能体使用的解析器仅支持**单行** frontmatter 键。
- `metadata` 应为**单行 JSON 对象**。
- 在说明中使用 `{baseDir}` 来引用 Skill 文件夹路径。
- 可选 frontmatter 键：
  - `homepage` — 在 macOS Skills UI 中显示为“Website”的 URL（也支持通过 `metadata.openclaw.homepage` 设置）。
  - `user-invocable` — `true|false`（默认：`true`）。为 `true` 时，该 Skill 会作为用户斜杠命令暴露。
  - `disable-model-invocation` — `true|false`（默认：`false`）。为 `true` 时，该 Skill 会从模型提示词中排除（但仍可通过用户调用使用）。
  - `command-dispatch` — `tool`（可选）。设置为 `tool` 时，斜杠命令会绕过模型并直接分发到工具。
  - `command-tool` — 当设置 `command-dispatch: tool` 时，要调用的工具名称。
  - `command-arg-mode` — `raw`（默认）。对于工具分发，会将原始参数字符串转发给工具（核心不做解析）。

    工具会使用以下参数调用：
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## 门控（加载时过滤）

OpenClaw 会使用 `metadata`（单行 JSON）在**加载时过滤 Skills**：

```markdown
---
name: image-lab
description: 通过提供商支持的图像工作流生成或编辑图像
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 下的字段：

- `always: true` — 始终包含该 Skill（跳过其他门控）。
- `emoji` — 可选 emoji，供 macOS Skills UI 使用。
- `homepage` — 可选 URL，在 macOS Skills UI 中显示为“Website”。
- `os` — 可选平台列表（`darwin`、`linux`、`win32`）。如设置，该 Skill 仅在这些操作系统上可用。
- `requires.bins` — 列表；每一项都必须存在于 `PATH` 中。
- `requires.anyBins` — 列表；至少一项必须存在于 `PATH` 中。
- `requires.env` — 列表；环境变量必须存在，**或者**在配置中提供。
- `requires.config` — 必须为真值的 `openclaw.json` 路径列表。
- `primaryEnv` — 与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
- `install` — 可选安装器规范数组，供 macOS Skills UI 使用（brew/node/go/uv/download）。

关于沙箱隔离的说明：

- `requires.bins` 会在 Skill 加载时于**宿主机**上检查。
- 如果某个智能体处于沙箱隔离中，该二进制文件也必须**存在于容器内部**。
  请通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）安装它。
  `setupCommand` 会在容器创建后运行一次。
  包安装还要求沙箱内具备网络出口、可写根文件系统以及 root 用户。
  例如，`summarize` Skill（`skills/summarize/SKILL.md`）需要沙箱容器内存在 `summarize` CLI，才能在那里运行。

安装器示例：

```markdown
---
name: gemini
description: 使用 Gemini CLI 进行编码辅助和 Google 搜索查询。
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "安装 Gemini CLI（brew）",
            },
          ],
      },
  }
---
```

说明：

- 如果列出了多个安装器，Gateway 网关 会选择一个**首选**选项（如果可用则优先 brew，否则 node）。
- 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看可用工件。
- 安装器规范可以包含 `os: ["darwin"|"linux"|"win32"]`，用于按平台过滤选项。
- Node 安装遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：npm；可选项：npm/pnpm/yarn/bun）。
  这只影响 **Skill 安装**；Gateway 网关 运行时本身仍应使用 Node
  （对于 WhatsApp/Telegram，不建议使用 Bun）。
- 由 Gateway 网关 支持的安装器选择是基于偏好驱动的，而不只是 node：
  当安装规范混合多种类型时，如果启用了 `skills.install.preferBrew` 且存在 `brew`，OpenClaw 会优先选择 Homebrew，然后是 `uv`，再然后是配置的 node 管理器，最后才是 `go` 或 `download` 等其他回退选项。
- 如果每个安装规范都是 `download`，OpenClaw 会展示所有下载选项，而不是收敛为一个首选安装器。
- Go 安装：如果缺少 `go` 但存在 `brew`，Gateway 网关 会先通过 Homebrew 安装 Go，并尽可能将 `GOBIN` 设置为 Homebrew 的 `bin`。
- Download 安装：`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档时自动开启）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

如果不存在 `metadata.openclaw`，该 Skill 将始终符合条件（除非在配置中被禁用，或对于内置 Skills 被 `skills.allowBundled` 阻止）。

## 配置覆盖（`~/.openclaw/openclaw.json`）

可以为内置/托管 Skills 切换开关并提供环境变量值：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

注意：如果 Skill 名称包含连字符，请给键名加引号（JSON5 允许带引号的键）。

如果你想直接在 OpenClaw 内部使用现成的图像生成/编辑功能，请使用核心
`image_generate` 工具并配合 `agents.defaults.imageGenerationModel`，而不是使用内置 Skill。这里的 Skill 示例适用于自定义或第三方工作流。

对于原生图像分析，请使用 `image` 工具并配合 `agents.defaults.imageModel`。
对于原生图像生成/编辑，请使用 `image_generate` 并配合
`agents.defaults.imageGenerationModel`。如果你选择 `openai/*`、`google/*`、
`fal/*` 或其他提供商特定的图像模型，也请添加对应提供商的认证/API
密钥。

默认情况下，配置键与 **Skill 名称** 一致。如果某个 Skill 定义了
`metadata.openclaw.skillKey`，请在 `skills.entries` 下使用该键。

规则：

- `enabled: false` 会禁用该 Skill，即使它是内置/已安装的。
- `env`：**仅当**该变量尚未在进程中设置时才会注入。
- `apiKey`：为声明了 `metadata.openclaw.primaryEnv` 的 Skills 提供的便捷方式。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。
- `config`：用于自定义每个 Skill 字段的可选配置包；自定义键必须放在这里。
- `allowBundled`：仅针对**内置** Skills 的可选 allowlist。如果设置了，只有列表中的
  内置 Skills 才符合条件（不影响托管/工作区 Skills）。

## 环境变量注入（每次智能体运行）

当一次智能体运行开始时，OpenClaw 会：

1. 读取 Skill 元数据。
2. 将任何 `skills.entries.<key>.env` 或 `skills.entries.<key>.apiKey` 应用到
   `process.env`。
3. 使用**符合条件**的 Skills 构建系统提示词。
4. 在运行结束后恢复原始环境变量。

这是**限定在智能体运行范围内**的，不是全局 shell 环境。

对于内置的 `claude-cli` 后端，OpenClaw 还会将同样符合条件的快照实体化为一个临时 Claude Code 插件，并通过
`--plugin-dir` 传入。这样 Claude Code 就可以使用其原生 Skill 解析器，而 OpenClaw 仍然负责优先级、按智能体划分的 allowlists、门控，以及
`skills.entries.*` 环境变量/API 密钥注入。其他 CLI 后端仅使用提示词目录。

## 会话快照（性能）

OpenClaw 会在会话开始时对符合条件的 Skills 进行快照，并在同一会话的后续轮次中复用该列表。对 Skills 或配置的更改会在下一次新会话时生效。

当启用 Skills 监视器时，或当出现新的符合条件的远程节点时，Skills 也可以在会话中途刷新（见下文）。你可以将其视为一种**热重载**：刷新后的列表会在下一次智能体轮次中生效。

如果该会话的有效智能体 Skill allowlist 发生变化，OpenClaw 会刷新快照，以便可见 Skills 始终与当前智能体保持一致。

## 远程 macOS 节点（Linux Gateway 网关）

如果 Gateway 网关 运行在 Linux 上，但连接了一个**允许 `system.run`** 的
**macOS 节点**（Exec approvals 安全设置不为 `deny`），当该节点上存在所需二进制文件时，OpenClaw 可以将仅限 macOS 的 Skills 视为符合条件。智能体应通过 `exec` 工具并设置 `host=node` 来执行这些 Skills。

这依赖于节点报告其命令支持能力，以及通过 `system.run` 进行二进制探测。如果 macOS 节点随后离线，这些 Skills 仍会保持可见；在节点重新连接之前，调用可能会失败。

## Skills 监视器（自动刷新）

默认情况下，OpenClaw 会监视 Skill 文件夹，并在 `SKILL.md` 文件发生变化时更新 Skills 快照。请在 `skills.load` 下进行配置：

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Token 影响（Skills 列表）

当存在符合条件的 Skills 时，OpenClaw 会将一个紧凑的可用 Skills XML 列表注入系统提示词中（通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。其开销是确定性的：

- **基础开销（仅当 ≥1 个 Skill 时）：** 195 个字符。
- **每个 Skill：** 97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（字符数）：

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

说明：

- XML 转义会将 `& < > " '` 扩展为实体（`&amp;`、`&lt;` 等），从而增加长度。
- Token 数量会因模型分词器而异。按 OpenAI 风格粗略估算，约为 4 个字符/Token，因此**97 个字符 ≈ 24 个 Token** 每个 Skill，再加上你的实际字段长度。

## 托管 Skills 生命周期

OpenClaw 会将一组基线 Skills 作为安装的一部分以**内置 Skills**形式提供
（npm 包或 OpenClaw.app）。`~/.openclaw/skills` 用于本地覆盖
（例如，在不更改内置副本的情况下固定/修补某个 Skill）。工作区 Skills 由用户拥有，并且在名称冲突时会覆盖两者。

## 配置参考

完整配置模式请参见 [Skills 配置](/zh-CN/tools/skills-config)。

## 想寻找更多 Skills？

浏览 [https://clawhub.ai](https://clawhub.ai)。

---

## 相关内容

- [创建 Skills](/zh-CN/tools/creating-skills) — 构建自定义 Skills
- [Skills 配置](/zh-CN/tools/skills-config) — Skill 配置参考
- [斜杠命令](/zh-CN/tools/slash-commands) — 所有可用斜杠命令
- [插件](/zh-CN/tools/plugin) — 插件系统概览
