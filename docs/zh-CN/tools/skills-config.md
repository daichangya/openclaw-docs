---
read_when:
    - 添加或修改 Skills 配置
    - 调整内置 allowlist 或安装行为♀♀♀♀analysis to=functions.read 】【。】【”】【commentary to=functions.bash 】【。】【”】【commentary ӡамីនា? no need, translation only.
summary: Skills 配置 schema 与示例
title: Skills 配置
x-i18n:
    generated_at: "2026-04-23T21:09:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03c3bef00ca365bfa1dd3159dfa783909ae72a6d2e819d495e2f41a1839c6938
    source_path: tools/skills-config.md
    workflow: 15
---

大多数 Skills 加载器/安装配置位于
`~/.openclaw/openclaw.json` 中的 `skills` 下。按智能体划分的 Skills 可见性位于
`agents.defaults.skills` 和 `agents.list[].skills` 下。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun（Gateway 运行时仍应为 Node；不推荐 bun）
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

对于内置图片生成/编辑，请优先使用 `agents.defaults.imageGenerationModel`
以及核心 `image_generate` 工具。`skills.entries.*` 仅适用于自定义或
第三方 Skill 工作流。

如果你选择了特定图片提供商/模型，也需要配置该提供商的
身份验证/API 密钥。典型示例：`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，
`openai/*` 使用 `OPENAI_API_KEY`，`fal/*` 使用 `FAL_KEY`。

示例：

- 原生 Nano Banana Pro 风格设置：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 设置：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 智能体 Skills allowlist

当你希望使用相同的机器/工作区 Skill 根目录，但让不同智能体拥有
不同可见 Skills 集时，请使用智能体配置。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承默认值 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 没有 Skills
    ],
  },
}
```

规则：

- `agents.defaults.skills`：供未设置
  `agents.list[].skills` 的智能体继承的共享基线 allowlist。
- 省略 `agents.defaults.skills` 表示默认情况下 Skills 不受限制。
- `agents.list[].skills`：该智能体的显式最终 Skill 集；不会
  与默认值合并。
- `agents.list[].skills: []`：该智能体不暴露任何 Skills。

## 字段

- 内置 Skill 根目录始终包括 `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：仅对**内置** Skills 生效的可选 allowlist。设置后，只有
  列表中的内置 Skills 才会被视为可用（不影响托管、智能体和工作区 Skills）。
- `load.extraDirs`：额外扫描的 Skill 目录（最低优先级）。
- `load.watch`：监视 Skill 文件夹并刷新 Skills 快照（默认：true）。
- `load.watchDebounceMs`：Skill 监视器事件的防抖毫秒数（默认：250）。
- `install.preferBrew`：在可用时优先使用 brew 安装器（默认：true）。
- `install.nodeManager`：Node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`，默认：npm）。
  这只影响**Skill 安装**；Gateway 运行时仍应使用 Node
  （对于 WhatsApp/Telegram 不推荐 Bun）。
  - `openclaw setup --node-manager` 更窄，目前仅接受 `npm`、
    `pnpm` 或 `bun`。如果你想使用 Yarn 支持的 Skill 安装，请手动设置 `skills.install.nodeManager: "yarn"`。
- `entries.<skillKey>`：按 Skill 的覆盖。
- `agents.defaults.skills`：可选的默认 Skill allowlist，由未设置
  `agents.list[].skills` 的智能体继承。
- `agents.list[].skills`：可选的按智能体最终 Skill allowlist；显式
  列表会替换继承的默认值，而不是合并。

按 Skill 字段：

- `enabled`：设为 `false` 可禁用某个 Skill，即使它已内置/已安装。
- `env`：为智能体运行注入的环境变量（仅当尚未设置时）。
- `apiKey`：为声明了主环境变量的 Skills 提供的可选便利字段。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。

## 说明

- `entries` 下的键默认映射到 Skill 名称。如果某个 Skill 定义了
  `metadata.openclaw.skillKey`，则应使用该键。
- 加载优先级是 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 内置 Skills →
  `skills.load.extraDirs`。
- 启用监视器时，对 Skills 的更改会在下一次智能体轮次中被拾取。

### 沙箱隔离 Skills + 环境变量

当一个会话处于**沙箱隔离**中时，Skill 进程会在配置的
沙箱后端内运行。沙箱**不会**继承宿主的 `process.env`。

请使用以下方式之一：

- 对于 Docker 后端，使用 `agents.defaults.sandbox.docker.env`（或按智能体设置的 `agents.list[].sandbox.docker.env`）
- 将环境变量烘焙进自定义沙箱镜像或远程沙箱环境

全局 `env` 和 `skills.entries.<skill>.env/apiKey` 仅适用于**宿主**运行。
