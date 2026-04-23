---
read_when:
    - 你希望智能体将修正内容或可复用流程转化为工作区 Skills
    - 你正在配置流程性 Skills 记忆
    - 你正在调试 `skill_workshop` 工具行为
    - 你正在决定是否启用自动创建 Skills
summary: 将可复用流程以工作区 Skills 的形式进行实验性沉淀，并支持审查、审批、隔离以及热刷新 Skills
title: Skill Workshop 插件
x-i18n:
    generated_at: "2026-04-23T15:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12036df53a7a34450f5b64819dd608d37e74a0e49d9fbeef431b9b2b53950f03
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Skill Workshop 插件

Skill Workshop **处于实验阶段**。它默认禁用，其捕获启发式规则和审查者提示可能会在不同版本之间发生变化，并且自动写入只应在可信工作区中使用，且应先审查 pending 模式的输出。

Skill Workshop 是面向工作区 Skills 的流程性记忆。它让智能体能够将可复用的工作流、用户修正、来之不易的修复方案以及反复出现的陷阱，转化为以下路径下的 `SKILL.md` 文件：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

这不同于长期记忆：

- **Memory** 用于存储事实、偏好、实体以及过去的上下文。
- **Skills** 用于存储智能体在未来任务中应遵循的可复用流程。
- **Skill Workshop** 则是将一次有价值的交互转化为持久化工作区技能的桥梁，并带有安全检查和可选审批。

当智能体学会如下流程时，Skill Workshop 很有用：

- 如何验证外部来源的动态图像 `GIF` 资源
- 如何替换截图资源并验证尺寸
- 如何运行仓库特定的 `QA` 场景
- 如何调试反复出现的 provider 故障
- 如何修复过时的本地工作流说明

它不适用于：

- 像“用户喜欢蓝色”这样的事实
- 宽泛的自传式记忆
- 原始对话记录归档
- 密钥、凭证或隐藏提示文本
- 不会重复出现的一次性指令

## 默认状态

该内置插件**处于实验阶段**，并且**默认禁用**，除非你在 `plugins.entries.skill-workshop` 中显式启用它。

插件清单未设置 `enabledByDefault: true`。插件配置 schema 中的 `enabled: true` 默认值，仅在该插件条目已被选中并加载之后才会生效。

实验阶段意味着：

- 该插件已具备足够支持，可用于选择性测试和 dogfooding
- 提案存储、审查者阈值和捕获启发式规则都可能继续演进
- 建议从待审批模式开始
- 自动应用适用于可信的个人或工作区环境，不适用于共享环境或存在大量不可信输入的环境

## 启用

最小安全配置：

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

使用此配置时：

- `skill_workshop` 工具可用
- 显式的可复用修正会被加入待处理提案队列
- 基于阈值的审查者流程可以提出 Skills 更新提案
- 在待处理提案被应用之前，不会写入任何技能文件

仅在可信工作区中使用自动写入：

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` 仍然使用相同的扫描器和隔离路径。它不会应用带有严重发现项的提案。

## 配置

| 键 | 默认值 | 范围 / 取值 | 含义 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled` | `true` | boolean | 在插件条目加载后启用该插件。 |
| `autoCapture` | `true` | boolean | 在成功的智能体回合后启用回合后捕获 / 审查。 |
| `approvalPolicy` | `"pending"` | `"pending"`, `"auto"` | 将提案加入队列，或自动写入安全提案。 |
| `reviewMode` | `"hybrid"` | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 选择显式修正捕获、LLM 审查者、两者兼用，或两者都不用。 |
| `reviewInterval` | `15` | `1..200` | 每经过这么多个成功回合后运行审查者。 |
| `reviewMinToolCalls` | `8` | `1..500` | 在观察到这么多个工具调用后运行审查者。 |
| `reviewTimeoutMs` | `45000` | `5000..180000` | 内嵌审查者运行的超时时间。 |
| `maxPending` | `50` | `1..200` | 每个工作区保留的待处理 / 隔离提案的最大数量。 |
| `maxSkillBytes` | `40000` | `1024..200000` | 生成的技能 / 支持文件的最大大小。 |

推荐配置档：

```json5
// 保守模式：仅显式工具使用，不进行自动捕获。
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// 先审查后应用：自动捕获，但需要审批。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// 可信自动化：立即写入安全提案。
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// 低成本：不调用审查者 LLM，仅使用显式修正短语。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 捕获路径

Skill Workshop 有三种捕获路径。

### 工具建议

当模型看到可复用流程，或用户要求其保存 / 更新某个技能时，它可以直接调用 `skill_workshop`。

这是最显式的路径，即使在 `autoCapture: false` 时也能工作。

### 启发式捕获

当启用 `autoCapture` 且 `reviewMode` 为 `heuristic` 或 `hybrid` 时，插件会扫描成功回合中的显式用户修正短语：

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

该启发式方法会根据最新匹配的用户指令创建提案。它使用主题提示为常见工作流选择技能名称：

- 动图 `GIF` 任务 -> `animated-gif-workflow`
- 截图或资源任务 -> `screenshot-asset-workflow`
- `QA` 或场景任务 -> `qa-scenario-workflow`
- GitHub `PR` 任务 -> `github-pr-workflow`
- 回退 -> `learned-workflows`

启发式捕获有意保持狭窄范围。它适用于明确的修正和可重复的流程说明，不适用于通用的对话摘要。

### LLM 审查者

当启用 `autoCapture` 且 `reviewMode` 为 `llm` 或 `hybrid` 时，插件会在达到阈值后运行一个紧凑的内嵌审查者。

审查者会收到：

- 最近的对话文本，限制为最后 12,000 个字符
- 最多 12 个现有工作区技能
- 每个现有技能最多 2,000 个字符
- 仅 JSON 指令

审查者没有工具可用：

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

审查者会返回 `{ "action": "none" }`，或返回一个提案。`action` 字段可以是 `create`、`append` 或 `replace`——当已存在相关技能时，优先使用 `append` / `replace`；仅在没有合适现有技能时才使用 `create`。

`create` 示例：

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` 会添加 `section` + `body`。`replace` 会在指定技能中将 `oldText` 替换为 `newText`。

## 提案生命周期

每个生成的更新都会成为一个提案，并包含以下字段：

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 可选的 `agentId`
- 可选的 `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`、`agent_end` 或 `reviewer`
- `status`
- `change`
- 可选的 `scanFindings`
- 可选的 `quarantineReason`

提案状态：

- `pending` - 等待审批
- `applied` - 已写入 `<workspace>/skills`
- `rejected` - 已被操作员 / 模型拒绝
- `quarantined` - 因扫描器发现严重问题而被阻止

状态按工作区存储在 Gateway 网关状态目录下：

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

待处理和已隔离提案会按技能名称和变更载荷去重。存储会保留最新的待处理 / 已隔离提案，最多不超过 `maxPending`。

## 工具参考

该插件注册了一个智能体工具：

```text
skill_workshop
```

### `status`

按状态统计当前工作区中的提案数量。

```json
{ "action": "status" }
```

结果格式：

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

列出待处理提案。

```json
{ "action": "list_pending" }
```

如需列出其他状态：

```json
{ "action": "list_pending", "status": "applied" }
```

有效的 `status` 取值：

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

列出已隔离提案。

```json
{ "action": "list_quarantine" }
```

当自动捕获看起来没有任何效果，并且日志中提到 `skill-workshop: quarantined <skill>` 时，请使用这个命令。

### `inspect`

按 id 获取提案。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

创建一个提案。当使用 `approvalPolicy: "pending"`（默认值）时，这会加入队列，而不是直接写入。

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="强制安全写入（apply: true）">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="在自动策略下强制设为待处理（apply: false）">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="追加到指定 section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="替换精确文本">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

应用一个待处理提案。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` 会拒绝已隔离提案：

```text
quarantined proposal cannot be applied
```

### `reject`

将提案标记为已拒绝。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

在现有或拟议中的技能目录内写入一个支持文件。

允许的顶级支持目录：

- `references/`
- `templates/`
- `scripts/`
- `assets/`

示例：

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

支持文件按工作区范围管理，会进行路径检查，受 `maxSkillBytes` 字节限制，经过扫描，并以原子方式写入。

## Skills 写入

Skill Workshop 只会写入以下路径：

```text
<workspace>/skills/<normalized-skill-name>/
```

技能名称会进行规范化处理：

- 转为小写
- 非 `[a-z0-9_-]` 的连续字符会变为 `-`
- 去除开头 / 结尾的非字母数字字符
- 最大长度为 80 个字符
- 最终名称必须匹配 `[a-z0-9][a-z0-9_-]{1,79}`

对于 `create`：

- 如果技能不存在，Skill Workshop 会写入一个新的 `SKILL.md`
- 如果技能已存在，Skill Workshop 会将正文追加到 `## Workflow`

对于 `append`：

- 如果技能存在，Skill Workshop 会追加到请求的 section
- 如果技能不存在，Skill Workshop 会先创建一个最小技能，再执行追加

对于 `replace`：

- 该技能必须已经存在
- `oldText` 必须精确存在
- 只会替换第一个精确匹配项

所有写入都是原子的，并会立即刷新内存中的 Skills 快照，因此新建或更新后的技能无需重启 Gateway 网关即可变得可见。

## 安全模型

Skill Workshop 会对生成的 `SKILL.md` 内容和支持文件执行安全扫描。

严重发现项会将提案隔离：

| 规则 id | 会拦截这样的内容…… |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 指示智能体忽略先前 / 更高优先级指令 |
| `prompt-injection-system` | 引用 system prompt、开发者消息或隐藏指令 |
| `prompt-injection-tool` | 鼓励绕过工具权限 / 审批 |
| `shell-pipe-to-shell` | 包含将 `curl` / `wget` 通过管道传给 `sh`、`bash` 或 `zsh` 的内容 |
| `secret-exfiltration` | 看起来会通过网络发送 env / process env 数据 |

警告发现项会保留，但不会单独构成拦截：

| 规则 id | 警告内容…… |
| -------------------- | -------------------------------- |
| `destructive-delete` | 宽泛的 `rm -rf` 风格命令 |
| `unsafe-permissions` | `chmod 777` 风格的权限使用 |

已隔离提案：

- 会保留 `scanFindings`
- 会保留 `quarantineReason`
- 会出现在 `list_quarantine` 中
- 不能通过 `apply` 应用

若要从已隔离提案中恢复，请创建一个移除了不安全内容的新安全提案。不要手动编辑存储 JSON。

## 提示词指引

启用后，Skill Workshop 会注入一段简短提示，告知智能体使用 `skill_workshop` 来保存持久化的流程性记忆。

该指引强调：

- 保存流程，而不是事实 / 偏好
- 用户修正
- 不明显但成功的流程
- 反复出现的陷阱
- 通过 append / replace 修复过时 / 过薄 / 错误的技能
- 在长工具循环或艰难修复之后保存可复用流程
- 简短的祈使式技能文本
- 不要转储对话记录

写入模式文本会随 `approvalPolicy` 改变：

- pending 模式：将建议加入队列；仅在显式批准后应用
- auto 模式：在明确可复用时应用安全的工作区 Skills 更新

## 成本与运行时行为

启发式捕获不会调用模型。

LLM 审查会在当前 / 默认智能体模型上执行一次内嵌运行。它基于阈值触发，因此默认不会在每个回合都运行。

审查者：

- 在可用时使用相同的已配置 provider / model 上下文
- 否则回退到运行时智能体默认值
- 受 `reviewTimeoutMs` 限制
- 使用轻量级引导上下文
- 没有工具
- 不会直接写入任何内容
- 只能产出一个提案，之后仍需经过常规扫描器以及审批 / 隔离路径

如果审查者失败、超时或返回无效 JSON，插件会记录 warning / debug 日志消息，并跳过该次审查。

## 使用模式

当用户这样说时，请使用 Skill Workshop：

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

好的技能文本：

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

较差的技能文本：

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

较差版本不应保存的原因：

- 呈现为对话记录形态
- 不是祈使式
- 包含嘈杂的一次性细节
- 没有告诉下一个智能体该做什么

## 调试

检查插件是否已加载：

```bash
openclaw plugins list --enabled
```

在智能体 / 工具上下文中检查提案数量：

```json
{ "action": "status" }
```

检查待处理提案：

```json
{ "action": "list_pending" }
```

检查已隔离提案：

```json
{ "action": "list_quarantine" }
```

常见症状：

| 症状 | 可能原因 | 检查项 |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 工具不可用 | 插件条目未启用 | `plugins.entries.skill-workshop.enabled` 和 `openclaw plugins list` |
| 没有出现自动提案 | `autoCapture: false`、`reviewMode: "off"`，或未达到阈值 | 配置、提案状态、Gateway 网关日志 |
| 启发式未捕获 | 用户措辞未匹配修正模式 | 使用显式 `skill_workshop.suggest` 或启用 LLM 审查者 |
| 审查者未创建提案 | 审查者返回 `none`、无效 JSON 或超时 | Gateway 网关日志、`reviewTimeoutMs`、阈值 |
| 提案未被应用 | `approvalPolicy: "pending"` | `list_pending`，然后执行 `apply` |
| 提案从 pending 中消失 | 复用了重复提案、max pending 修剪，或已被应用 / 拒绝 / 隔离 | `status`、带状态筛选的 `list_pending`、`list_quarantine` |
| 技能文件存在，但模型未命中 | Skills 快照未刷新，或技能门控将其排除 | `openclaw skills` 状态以及工作区技能资格 |

相关日志：

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 场景

由仓库支持的 QA 场景：

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

运行确定性覆盖：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

运行审查者覆盖：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

审查者场景被有意单独拆分，因为它启用了 `reviewMode: "llm"` 并覆盖了内嵌审查者流程。

## 何时不应启用自动应用

在以下情况下，避免使用 `approvalPolicy: "auto"`：

- 工作区包含敏感流程
- 智能体正在处理不可信输入
- Skills 会在较大的团队范围内共享
- 你仍在调整提示词或扫描器规则
- 模型经常处理带有敌意的网页 / 邮件内容

先使用 pending 模式。只有在你审查过该工作区中智能体提出的技能类型之后，再切换到 auto 模式。

## 相关文档

- [Skills](/zh-CN/tools/skills)
- [插件](/zh-CN/tools/plugin)
- [测试](/zh-CN/reference/test)
