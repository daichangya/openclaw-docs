---
read_when:
    - 你需要解释智能体工作区或其文件布局
    - 你想备份或迁移智能体工作区
summary: 智能体工作区：位置、布局和备份策略
title: 智能体工作区
x-i18n:
    generated_at: "2026-04-23T20:45:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71db469f7407d366e5d725041c280fcab9bcc4bb68e1c1153ffc52d916c2f19f
    source_path: concepts/agent-workspace.md
    workflow: 15
---

工作区是智能体的家。它是
文件工具和工作区上下文唯一使用的工作目录。请保持其私密，并将其视为 memory。

这与 `~/.openclaw/` 分开，后者用于存储配置、凭证和
会话。

**重要：** 工作区是**默认 cwd**，而不是硬性沙箱。工具
会将相对路径解析到工作区，但绝对路径仍然可以访问主机上的其他位置，除非启用了沙箱隔离。如果你需要隔离，请使用
[`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing)（以及/或按智能体配置的沙箱设置）。
启用沙箱隔离且 `workspaceAccess` 不是 `"rw"` 时，工具会在
`~/.openclaw/sandboxes` 下的沙箱工作区内运行，而不是你的主机工作区。

## 默认位置

- 默认值：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且不为 `"default"`，默认值将变为
  `~/.openclaw/workspace-<profile>`。
- 在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会在
工作区不存在时创建它，并填充引导文件。
沙箱种子复制仅接受工作区内的常规文件；解析到源工作区之外的符号链接/硬链接
别名会被忽略。

如果你已经自行管理工作区文件，可以禁用引导
文件创建：

```json5
{ agent: { skipBootstrap: true } }
```

## 额外的工作区文件夹

较早的安装可能创建过 `~/openclaw`。
同时保留多个工作区目录可能导致令人困惑的身份验证或状态漂移，因为同一时间只有一个工作区处于活动状态。

**建议：** 仅保留一个活动工作区。如果你不再使用这些
额外文件夹，请将其归档或移入废纸篓（例如 `trash ~/openclaw`）。
如果你确实有意保留多个工作区，请确保
`agents.defaults.workspace` 指向当前活动的那个。

当 `openclaw doctor` 检测到额外工作区目录时，会发出警告。

## 工作区文件映射（每个文件的含义）

这些是 OpenClaw 在工作区内预期的标准文件：

- `AGENTS.md`
  - 智能体的操作说明，以及它应如何使用 memory。
  - 在每次会话开始时加载。
  - 很适合放置规则、优先级以及“如何行为”的细节。

- `SOUL.md`
  - 人设、语气和边界。
  - 每个会话都会加载。
  - 指南：[SOUL.md Personality Guide](/zh-CN/concepts/soul)

- `USER.md`
  - 用户是谁，以及应如何称呼用户。
  - 每个会话都会加载。

- `IDENTITY.md`
  - 智能体的名称、氛围和 emoji。
  - 在引导仪式期间创建/更新。

- `TOOLS.md`
  - 关于你的本地工具和约定的说明。
  - 它不控制工具可用性；仅作为指导。

- `HEARTBEAT.md`
  - 可选的 heartbeat 运行简短检查清单。
  - 请保持简短，以避免 token 消耗。

- `BOOT.md`
  - 可选的启动检查清单；启用内部钩子时，会在 Gateway 网关重启时执行。
  - 请保持简短；对外发送请使用 message 工具。

- `BOOTSTRAP.md`
  - 一次性的首次运行仪式。
  - 仅在全新工作区中创建。
  - 仪式完成后请删除它。

- `memory/YYYY-MM-DD.md`
  - 每日 memory 日志（每天一个文件）。
  - 建议在会话开始时读取今天和昨天的内容。

- `MEMORY.md`（可选）
  - 经过整理的长期 memory。
  - 仅在主私有会话中加载（不在共享/群组上下文中加载）。

有关工作流和自动 memory flush，请参见 [Memory](/zh-CN/concepts/memory)。

- `skills/`（可选）
  - 工作区专用 Skills。
  - 该工作区中优先级最高的 Skills 位置。
  - 当名称冲突时，会覆盖项目智能体 Skills、个人智能体 Skills、托管 Skills、内置 Skills 以及 `skills.load.extraDirs`。

- `canvas/`（可选）
  - 用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。

如果缺少任何引导文件，OpenClaw 会向
会话中注入一个“缺失文件”标记并继续。大型引导文件在注入时会被截断；
可通过 `agents.defaults.bootstrapMaxChars`（默认：12000）和
`agents.defaults.bootstrapTotalMaxChars`（默认：60000）调整限制。
`openclaw setup` 可以重新创建缺失的默认文件，而不会覆盖现有
文件。

## 不属于工作区的内容

以下内容位于 `~/.openclaw/` 下，**不应**提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型身份验证配置：OAuth + API 密钥）
- `~/.openclaw/credentials/`（渠道/提供商状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（会话转录文本 + 元数据）
- `~/.openclaw/skills/`（托管 Skills）

如果你需要迁移会话或配置，请单独复制它们，并将其
排除在版本控制之外。

## Git 备份（推荐，私有）

请将工作区视为私有 memory。把它放入一个**私有**
git 仓库中，以便备份和恢复。

请在运行 Gateway 网关的机器上执行这些步骤（工作区就位于那台机器上）。

### 1）初始化仓库

如果已安装 git，全新工作区会自动初始化。如果该
工作区尚不是仓库，请运行：

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2）添加私有远程仓库（适合新手的选项）

选项 A：GitHub 网页 UI

1. 在 GitHub 上创建一个新的**私有**仓库。
2. 不要使用 README 初始化（可避免合并冲突）。
3. 复制 HTTPS 远程 URL。
4. 添加远程仓库并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

选项 B：GitHub CLI（`gh`）

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

选项 C：GitLab 网页 UI

1. 在 GitLab 上创建一个新的**私有**仓库。
2. 不要使用 README 初始化（可避免合并冲突）。
3. 复制 HTTPS 远程 URL。
4. 添加远程仓库并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3）持续更新

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## 不要提交密钥

即使是在私有仓库中，也应避免在工作区中存储密钥：

- API 密钥、OAuth 令牌、密码或私密凭证。
- `~/.openclaw/` 下的任何内容。
- 原始聊天转储或敏感附件。

如果你必须存储敏感引用，请使用占位符，并将真实
密钥保存在其他位置（密码管理器、环境变量或 `~/.openclaw/`）。

建议的 `.gitignore` 起始内容：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将工作区迁移到新机器

1. 将仓库克隆到目标路径（默认 `~/.openclaw/workspace`）。
2. 在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
3. 运行 `openclaw setup --workspace <path>` 以填充任何缺失文件。
4. 如果你还需要会话，请将旧机器上的 `~/.openclaw/agents/<agentId>/sessions/`
   另行复制过来。

## 高级说明

- 多智能体路由可以为不同智能体使用不同的工作区。参见
  [渠道路由](/zh-CN/channels/channel-routing) 了解路由配置。
- 如果启用了 `agents.defaults.sandbox`，则非主会话可以在
  `agents.defaults.sandbox.workspaceRoot` 下使用按会话划分的沙箱工作区。

## 相关

- [Standing Orders](/zh-CN/automation/standing-orders) — 工作区文件中的持久指令
- [Heartbeat](/zh-CN/gateway/heartbeat) — HEARTBEAT.md 工作区文件
- [会话](/zh-CN/concepts/session) — 会话存储路径
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱环境中的工作区访问
