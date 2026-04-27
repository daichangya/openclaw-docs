---
read_when:
    - 你需要解释智能体工作区或其文件布局。
    - 你想要备份或迁移智能体工作区。
sidebarTitle: Agent workspace
summary: 智能体工作区：位置、布局和备份策略
title: 智能体工作区
x-i18n:
    generated_at: "2026-04-26T11:10:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

工作区是智能体的“家”。它是文件工具和工作区上下文使用的唯一工作目录。请将其保持私密，并把它视为记忆。

这与 `~/.openclaw/` 不同，后者用于存储配置、凭证和会话。

<Warning>
工作区是**默认 cwd**，而不是严格的沙箱。工具会将相对路径解析为相对于工作区的路径，但绝对路径仍然可以访问主机上的其他位置，除非启用了沙箱隔离。如果你需要隔离，请使用 [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing)（以及/或者每个智能体单独的沙箱配置）。

启用沙箱隔离后，如果 `workspaceAccess` 不是 `"rw"`，工具将在 `~/.openclaw/sandboxes` 下的沙箱工作区内运行，而不是在你的主机工作区中运行。
</Warning>

## 默认位置

- 默认值：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且其值不是 `"default"`，默认值会变为 `~/.openclaw/workspace-<profile>`。
- 可在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会在工作区不存在时创建它，并填充引导文件。

<Note>
沙箱种子复制只接受工作区内的常规文件；解析后指向源工作区外部的符号链接/硬链接别名会被忽略。
</Note>

如果你已经自行管理这些工作区文件，可以禁用引导文件创建：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 额外的工作区文件夹

较早的安装版本可能创建过 `~/openclaw`。同时保留多个工作区目录可能导致令人困惑的认证或状态漂移，因为任一时刻只会有一个工作区处于活动状态。

<Note>
**建议：** 只保留一个活动工作区。如果你已不再使用这些额外文件夹，请将其归档或移至废纸篓（例如 `trash ~/openclaw`）。如果你确实有意保留多个工作区，请确保 `agents.defaults.workspace` 指向当前活动的那个。

`openclaw doctor` 会在检测到额外工作区目录时发出警告。
</Note>

## 工作区文件映射

以下是 OpenClaw 在工作区内预期的标准文件：

<AccordionGroup>
  <Accordion title="AGENTS.md — 操作说明">
    关于智能体及其如何使用记忆的操作说明。会在每次会话开始时加载。适合放置规则、优先级以及“应如何表现”的细节。
  </Accordion>
  <Accordion title="SOUL.md — 人设与语气">
    人设、语气和边界。每次会话都会加载。指南： [SOUL.md 人格指南](/zh-CN/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md — 用户是谁">
    说明用户是谁，以及应如何称呼他们。每次会话都会加载。
  </Accordion>
  <Accordion title="IDENTITY.md — 名称、气质、emoji">
    智能体的名称、气质和 emoji。在引导仪式期间创建/更新。
  </Accordion>
  <Accordion title="TOOLS.md — 本地工具约定">
    关于你的本地工具和约定的说明。它不控制工具可用性；仅用作指导。
  </Accordion>
  <Accordion title="HEARTBEAT.md — 心跳检查清单">
    可选的简短检查清单，用于心跳运行。请保持简短，以避免消耗过多 token。
  </Accordion>
  <Accordion title="BOOT.md — 启动检查清单">
    可选的启动检查清单，在 Gateway 网关 重启时自动运行（当启用 [内部钩子](/zh-CN/automation/hooks) 时）。请保持简短；对外发送请使用 message 工具。
  </Accordion>
  <Accordion title="BOOTSTRAP.md — 首次运行仪式">
    一次性的首次运行仪式。仅会为全新的工作区创建。仪式完成后请将其删除。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — 每日记忆日志">
    每日记忆日志（每天一个文件）。建议在会话开始时读取今天和昨天的日志。
  </Accordion>
  <Accordion title="MEMORY.md — 整理后的长期记忆（可选）">
    整理后的长期记忆。仅在主私密会话中加载（不用于共享/群组上下文）。有关工作流和自动记忆刷新，请参见 [Memory](/zh-CN/concepts/memory)。
  </Accordion>
  <Accordion title="skills/ — 工作区 Skills（可选）">
    工作区专用 Skills。它是该工作区中优先级最高的 Skills 位置。当名称冲突时，它会覆盖项目智能体 Skills、个人智能体 Skills、托管 Skills、内置 Skills，以及 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ — Canvas UI 文件（可选）">
    用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果任一引导文件缺失，OpenClaw 会在会话中注入“缺失文件”标记并继续运行。较大的引导文件在注入时会被截断；可通过 `agents.defaults.bootstrapMaxChars`（默认：12000）和 `agents.defaults.bootstrapTotalMaxChars`（默认：60000）调整限制。`openclaw setup` 可以重新创建缺失的默认文件，而不会覆盖已有文件。
</Note>

## 哪些内容不在工作区中

以下内容位于 `~/.openclaw/` 下，**不应** 提交到工作区仓库中：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型认证配置：OAuth + API 密钥）
- `~/.openclaw/credentials/`（渠道/提供商状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（会话记录 + 元数据）
- `~/.openclaw/skills/`（托管 Skills）

如果你需要迁移会话或配置，请单独复制它们，并确保不要将其纳入版本控制。

## Git 备份（推荐，私密）

请将工作区视为私密记忆。把它放入一个**私有** git 仓库中，以便备份和恢复。

请在 Gateway 网关 运行所在的机器上执行以下步骤（工作区就位于那里）。

<Steps>
  <Step title="初始化仓库">
    如果已安装 git，全新的工作区会自动初始化。如果这个工作区还不是一个仓库，请运行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="添加私有远程仓库">
    <Tabs>
      <Tab title="GitHub web UI">
        1. 在 GitHub 上创建一个新的**私有**仓库。
        2. 不要使用 README 初始化（可避免合并冲突）。
        3. 复制 HTTPS 远程仓库 URL。
        4. 添加远程仓库并推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. 在 GitLab 上创建一个新的**私有**仓库。
        2. 不要使用 README 初始化（可避免合并冲突）。
        3. 复制 HTTPS 远程仓库 URL。
        4. 添加远程仓库并推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="后续更新">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## 不要提交密钥

<Warning>
即使是在私有仓库中，也应避免在工作区中存储密钥：

- API 密钥、OAuth 令牌、密码或私密凭证。
- `~/.openclaw/` 下的任何内容。
- 聊天原始导出或敏感附件。

如果你必须存储敏感引用，请使用占位符，并将真实密钥保存在其他位置（密码管理器、环境变量或 `~/.openclaw/`）。
</Warning>

建议的 `.gitignore` 起始内容：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将工作区迁移到新机器

<Steps>
  <Step title="克隆仓库">
    将仓库克隆到目标路径（默认是 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新配置">
    在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
  </Step>
  <Step title="填充缺失文件">
    运行 `openclaw setup --workspace <path>` 以填充任何缺失文件。
  </Step>
  <Step title="复制会话（可选）">
    如果你需要会话，请另外从旧机器复制 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 高级说明

- 多智能体路由可以为不同智能体使用不同工作区。有关路由配置，请参见 [渠道路由](/zh-CN/channels/channel-routing)。
- 如果启用了 `agents.defaults.sandbox`，非主会话可以使用位于 `agents.defaults.sandbox.workspaceRoot` 下、按会话划分的沙箱工作区。

## 相关内容

- [Heartbeat](/zh-CN/gateway/heartbeat) — HEARTBEAT.md 工作区文件
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的工作区访问
- [会话](/zh-CN/concepts/session) — 会话存储路径
- [Standing orders](/zh-CN/automation/standing-orders) — 工作区文件中的持久指令
