---
read_when:
    - 添加或修改 Skills
    - 更改 skill 门控或加载规则
summary: Skills：托管版与工作区版、门控规则，以及配置/环境变量接线
title: Skills
x-i18n:
    generated_at: "2026-04-23T23:05:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw 使用兼容 **[AgentSkills](https://agentskills.io)** 的 skill 文件夹来教智能体如何使用工具。每个 skill 都是一个目录，其中包含带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw 会加载**内置 skills**以及可选的本地覆盖项，并根据环境、配置和二进制存在情况在加载时进行过滤。

## 位置与优先级

OpenClaw 会从以下来源加载 skills：

1. **额外 skill 文件夹**：通过 `skills.load.extraDirs` 配置
2. **内置 skills**：随安装包提供（npm 包或 OpenClaw.app）
3. **托管/本地 skills**：`~/.openclaw/skills`
4. **个人智能体 skills**：`~/.agents/skills`
5. **项目智能体 skills**：`<workspace>/.agents/skills`
6. **工作区 skills**：`<workspace>/skills`

如果 skill 名称冲突，优先级为：

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 skills → `skills.load.extraDirs`（最低）

## 按智能体划分的 skills 与共享 skills

在**多智能体**设置中，每个智能体都有自己的工作区。这意味着：

- **按智能体划分的 skills** 位于该智能体专属的 `<workspace>/skills` 中。
- **项目智能体 skills** 位于 `<workspace>/.agents/skills` 中，并在普通工作区 `skills/` 文件夹之前应用于该工作区。
- **个人智能体 skills** 位于 `~/.agents/skills` 中，并应用于该机器上的所有工作区。
- **共享 skills** 位于 `~/.openclaw/skills`（托管/本地）中，对同一台机器上的**所有智能体**可见。
- 如果你想让多个智能体共用一套通用 skills，也可以通过 `skills.load.extraDirs` 添加**共享文件夹**（最低优先级）。

如果相同的 skill 名称出现在多个位置，则适用常规优先级：工作区优先，其次是项目智能体 skills，再其次是个人智能体 skills，然后是托管/本地、内置，最后是 extra dirs。

## 智能体 skill allowlist

Skill **位置**与 skill **可见性**是两个独立控制项。

- 位置/优先级决定同名 skill 的哪个副本胜出。
- 智能体 allowlist 决定某个智能体实际上可以使用哪些可见 skills。

使用 `agents.defaults.skills` 作为共享基线，然后通过 `agents.list[].skills` 按智能体覆盖：

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 skills
    ],
  },
}
```

规则：

- 省略 `agents.defaults.skills`，表示默认不限制 skills。
- 省略 `agents.list[].skills`，表示继承 `agents.defaults.skills`。
- 设置 `agents.list[].skills: []` 表示无 skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

OpenClaw 会在提示构建、skill 斜杠命令发现、沙箱同步和 skill 快照中应用有效的智能体 skill 集合。

## 插件 + Skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录（相对于插件根目录的路径）来提供自己的 skills。插件 skills 会在插件启用时加载。当前，这些目录会被合并到与 `skills.load.extraDirs` 相同的低优先级路径中，因此同名的内置、托管、智能体或工作区 skill 会覆盖它们。
你可以通过插件配置项上的 `metadata.openclaw.requires.config` 来对其进行门控。
有关发现/配置请参见 [插件](/zh-CN/tools/plugin)，有关这些 skills 所教授的工具能力面请参见 [工具](/zh-CN/tools)。

## Skill Workshop

可选的实验性 Skill Workshop 插件可以根据智能体工作过程中观察到的可复用流程，在工作区中创建或更新 skills。它默认禁用，必须通过 `plugins.entries.skill-workshop` 显式启用。

Skill Workshop 只会写入 `<workspace>/skills`，会扫描生成内容，支持待审批或自动安全写入，会隔离不安全的提案，并在成功写入后刷新 skill 快照，以便新 skills 无需重启 Gateway 网关即可生效。

当你希望将诸如“下次验证 GIF 归因”这样的修正，或像媒体 QA 检查清单这样的经验性工作流，沉淀为持久化的流程说明时，可以使用它。建议从待审批模式开始；只有在受信任的工作区并审阅过其提案后，才使用自动写入。完整指南：
[Skill Workshop 插件](/zh-CN/plugins/skill-workshop)。

## ClawHub（安装 + 同步）

ClawHub 是 OpenClaw 的公共 skills 注册表。浏览地址：
[https://clawhub.ai](https://clawhub.ai)。使用原生 `openclaw skills`
命令来发现/安装/更新 skills，或在需要发布/同步工作流时使用单独的 `clawhub` CLI。
完整指南：[ClawHub](/zh-CN/tools/clawhub)。

常见流程：

- 将一个 skill 安装到你的工作区：
  - `openclaw skills install <skill-slug>`
- 更新所有已安装 skills：
  - `openclaw skills update --all`
- 同步（扫描 + 发布更新）：
  - `clawhub sync --all`

原生 `openclaw skills install` 会安装到当前活动工作区的 `skills/`
目录中。单独的 `clawhub` CLI 也会安装到你当前工作目录下的 `./skills` 中（或回退到配置的 OpenClaw 工作区）。
OpenClaw 会在下一个会话中将其作为 `<workspace>/skills` 读取。

## 安全说明

- 将第三方 skills 视为**不受信任的代码**。启用前请先阅读。
- 对于不受信任的输入和高风险工具，优先使用沙箱隔离运行。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。
- 工作区和 extra-dir skill 发现只接受其解析后 realpath 保持在配置根目录内的 skill 根和 `SKILL.md` 文件。
- Gateway 网关支持的 skill 依赖安装（`skills.install`、onboarding 和 Skills 设置 UI）在执行安装器元数据前，会先运行内置危险代码扫描器。默认情况下，`critical` 发现会阻止安装，除非调用方显式设置危险覆盖；可疑发现仍仅发出警告。
- `openclaw skills install <slug>` 与此不同：它会将 ClawHub skill 文件夹下载到工作区中，不使用上述安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会将密钥注入该智能体轮次的**主机**进程中（不是沙箱）。请避免让密钥出现在提示和日志中。
- 更广泛的威胁模型与检查清单请参见 [安全](/zh-CN/gateway/security)。

## 格式（兼容 AgentSkills + Pi）

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

说明：

- 我们遵循 AgentSkills 规范的布局/意图。
- 嵌入式智能体使用的解析器仅支持**单行** frontmatter 键。
- `metadata` 应为**单行 JSON 对象**。
- 在说明中使用 `{baseDir}` 来引用 skill 文件夹路径。
- 可选 frontmatter 键：
  - `homepage` —— 在 macOS Skills UI 中显示为 “Website” 的 URL（也可通过 `metadata.openclaw.homepage` 支持）。
  - `user-invocable` —— `true|false`（默认：`true`）。为 `true` 时，该 skill 会作为用户斜杠命令暴露。
  - `disable-model-invocation` —— `true|false`（默认：`false`）。为 `true` 时，该 skill 会从模型提示中排除（但仍可通过用户调用使用）。
  - `command-dispatch` —— `tool`（可选）。设置为 `tool` 时，斜杠命令会绕过模型，直接分发给工具。
  - `command-tool` —— 当设置了 `command-dispatch: tool` 时要调用的工具名称。
  - `command-arg-mode` —— `raw`（默认）。对于工具分发，会将原始参数字符串转发给工具（不做核心解析）。

    工具会使用以下参数调用：
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## 门控（加载时过滤器）

OpenClaw 使用 `metadata`（单行 JSON）在**加载时过滤 skills**：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
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

- `always: true` —— 始终包含该 skill（跳过其他门控）。
- `emoji` —— macOS Skills UI 使用的可选 emoji。
- `homepage` —— 在 macOS Skills UI 中显示为 “Website” 的可选 URL。
- `os` —— 可选平台列表（`darwin`、`linux`、`win32`）。设置后，该 skill 仅在这些 OS 上符合条件。
- `requires.bins` —— 列表；每个项都必须存在于 `PATH` 中。
- `requires.anyBins` —— 列表；至少有一个项必须存在于 `PATH` 中。
- `requires.env` —— 列表；环境变量必须存在，**或** 在配置中提供。
- `requires.config` —— 必须为 truthy 的 `openclaw.json` 路径列表。
- `primaryEnv` —— 与 `skills.entries.<name>.apiKey` 关联的环境变量名。
- `install` —— macOS Skills UI 使用的可选安装器规范数组（brew/node/go/uv/download）。

关于沙箱隔离的说明：

- `requires.bins` 会在 skill 加载时于**主机**上检查。
- 如果某个智能体处于沙箱隔离中，该二进制也必须**存在于容器内**。
  请通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）安装它。
  `setupCommand` 会在容器创建后运行一次。
  包安装还需要网络出口、可写的根文件系统，以及沙箱中的 root 用户。
  示例：`summarize` skill（`skills/summarize/SKILL.md`）需要在沙箱容器内存在 `summarize` CLI
  才能运行。

安装器示例：

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
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
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

说明：

- 如果列出了多个安装器，Gateway 网关会选择一个**单一**首选选项（有 brew 时优先 brew，否则为 node）。
- 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看可用产物。
- 安装器规范可包含 `os: ["darwin"|"linux"|"win32"]`，以按平台过滤选项。
- Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：npm；可选项：npm/pnpm/yarn/bun）。
  这只影响 **skill 安装**；Gateway 网关运行时本身仍应使用 Node
  （不建议在 WhatsApp/Telegram 中使用 Bun）。
- Gateway 网关支持的安装器选择是基于偏好的，而不只是 node：
  当安装规范混合多种类型时，若启用了 `skills.install.preferBrew` 且存在 `brew`，OpenClaw 会优先 Homebrew，然后是 `uv`，再然后是配置的 node 管理器，最后才是如 `go` 或 `download` 等其他回退选项。
- 如果每个安装规范都是 `download`，OpenClaw 会显示所有下载选项，而不是折叠为一个首选安装器。
- Go 安装：如果缺少 `go` 且存在 `brew`，Gateway 网关会先通过 Homebrew 安装 Go，并在可能时将 `GOBIN` 设置为 Homebrew 的 `bin`。
- Download 安装：`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档文件时自动）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

如果没有 `metadata.openclaw`，则该 skill 始终符合条件（除非在配置中被禁用，或内置 skill 受 `skills.allowBundled` 阻止）。

## 配置覆盖（`~/.openclaw/openclaw.json`）

内置/托管 skills 可以进行开关控制，并提供环境变量值：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
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

注意：如果 skill 名称包含连字符，请给该键加引号（JSON5 允许带引号的键）。

如果你想在 OpenClaw 本身中使用现成的图像生成/编辑，请使用核心
`image_generate` 工具，并配合 `agents.defaults.imageGenerationModel`，而不是使用内置
skill。这里的 skill 示例适用于自定义或第三方工作流。

对于原生图像分析，请使用 `image` 工具并配合 `agents.defaults.imageModel`。
对于原生图像生成/编辑，请使用 `image_generate` 并配合
`agents.defaults.imageGenerationModel`。如果你选择 `openai/*`、`google/*`、
`fal/*` 或其他提供商特定图像模型，还需要添加该提供商的凭证/API
key。

默认情况下，配置键与**skill 名称**匹配。如果某个 skill 定义了
`metadata.openclaw.skillKey`，请在 `skills.entries` 下使用该键。

规则：

- `enabled: false` 会禁用该 skill，即使它是内置/已安装的。
- `env`：**仅当**该变量尚未在进程中设置时才会注入。
- `apiKey`：为声明了 `metadata.openclaw.primaryEnv` 的 skills 提供的便捷写法。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。
- `config`：可选，用于存放自定义的按 skill 划分字段；自定义键必须放在这里。
- `allowBundled`：仅针对**内置** skills 的可选 allowlist。如果设置了它，则只有列表中的内置 skills 符合条件（托管/工作区 skills 不受影响）。

## 环境变量注入（按智能体运行）

当某次智能体运行开始时，OpenClaw 会：

1. 读取 skill 元数据。
2. 将任意 `skills.entries.<key>.env` 或 `skills.entries.<key>.apiKey` 应用到
   `process.env`。
3. 使用**符合条件的** skills 构建系统提示。
4. 在运行结束后恢复原始环境变量。

这**作用于智能体运行范围内**，而不是全局 shell 环境。

对于内置的 `claude-cli` 后端，OpenClaw 还会将同样的符合条件快照实体化为一个临时 Claude Code 插件，并通过 `--plugin-dir` 传入。这样 Claude Code 就可以使用其原生 skill 解析器，而 OpenClaw 仍然持有优先级、按智能体 allowlist、门控，以及 `skills.entries.*` 环境变量/API key 注入。其他 CLI 后端只使用提示目录。

## 会话快照（性能）

OpenClaw 会在会话开始时对符合条件的 skills 进行快照，并在同一会话的后续轮次中复用该列表。对 skills 或配置的更改会在下一个新会话中生效。

当启用 skills watcher，或出现新的符合条件的远程节点时（见下文），skills 也可以在会话中途刷新。可以将其视为一种**热重载**：刷新后的列表会在下一轮智能体运行时被采用。

如果该会话的有效智能体 skill allowlist 发生变化，OpenClaw 会刷新快照，以使可见 skills 与当前智能体保持一致。

## 远程 macOS 节点（Linux Gateway 网关）

如果 Gateway 网关运行在 Linux 上，但连接了一个**macOS 节点**，并且**允许 `system.run`**（Exec 审批安全级别未设置为 `deny`），那么当该节点上存在所需二进制时，OpenClaw 可以将仅限 macOS 的 skills 视为符合条件。智能体应通过 `exec` 工具并设置 `host=node` 来执行这些 skills。

这依赖于节点上报其命令支持情况，以及通过 `system.run` 进行二进制探测。如果 macOS 节点之后离线，skills 仍会保持可见；在该节点重新连接之前，调用可能会失败。

## Skills watcher（自动刷新）

默认情况下，OpenClaw 会监视 skill 文件夹，并在 `SKILL.md` 文件变化时更新 skills 快照。可在 `skills.load` 下进行配置：

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

## Token 影响（skills 列表）

当存在符合条件的 skills 时，OpenClaw 会将一份紧凑的可用 skills XML 列表注入到系统提示中（通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。其开销是确定性的：

- **基础开销（仅当 ≥1 个 skill 时）：** 195 个字符。
- **每个 skill：** 97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（字符数）：

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

说明：

- XML 转义会将 `& < > " '` 扩展为实体（`&amp;`、`&lt;` 等），从而增加长度。
- Token 数会因模型 tokenizer 而异。按 OpenAI 风格的粗略估算，约为 ~4 字符/token，因此**97 个字符 ≈ 24 个 token** 每个 skill，再加上你的实际字段长度。

## 托管 skills 生命周期

OpenClaw 会将一组基础 skills 作为安装的一部分提供，称为**内置 skills**（npm 包或 OpenClaw.app）。`~/.openclaw/skills` 用于本地覆盖（例如，在不更改内置副本的情况下固定/修补某个 skill）。工作区 skills 由用户持有，并在名称冲突时覆盖前两者。

## 配置参考

完整配置 schema 请参见 [Skills 配置](/zh-CN/tools/skills-config)。

## 想找更多 skills？

浏览 [https://clawhub.ai](https://clawhub.ai)。

---

## 相关

- [创建 Skills](/zh-CN/tools/creating-skills) — 构建自定义 skills
- [Skills 配置](/zh-CN/tools/skills-config) — skill 配置参考
- [斜杠命令](/zh-CN/tools/slash-commands) — 所有可用的斜杠命令
- [插件](/zh-CN/tools/plugin) — 插件系统概览
