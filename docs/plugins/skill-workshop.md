---
read_when:
    - 你希望智能体将纠正内容或可复用流程转化为工作区 Skills
    - 你正在配置流程型 Skills memory
    - 你正在调试 `skill_workshop` 工具行为
    - 你正在决定是否启用自动创建 Skills
summary: 将可复用流程以工作区 Skills 的形式进行实验性捕获，并支持审查、批准、隔离与热刷新 Skills
title: Skill workshop 插件
x-i18n:
    generated_at: "2026-04-23T20:59:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop 是**实验性**功能。它默认关闭，其捕获
启发式和审查者提示词可能会在不同版本之间发生变化，而自动写入功能
应只在受信任工作区中使用，并且要先检查 pending 模式输出。

Skill Workshop 是面向工作区 Skills 的流程型 memory。它允许智能体将
可复用工作流、用户纠正、来之不易的修复，以及反复出现的陷阱，转化为位于以下路径的 `SKILL.md` 文件：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

这与长期 memory 不同：

- **Memory** 存储事实、偏好、实体和过去上下文。
- **Skills** 存储智能体在未来任务中应遵循的可复用流程。
- **Skill Workshop** 是从一次有价值的轮次过渡到持久化工作区
  skill 的桥梁，并带有安全检查和可选审批。

当智能体学会某种流程时，Skill Workshop 会很有用，例如：

- 如何验证外部来源的 animated GIF 资源
- 如何替换截图资源并验证尺寸
- 如何运行某个仓库特定的 QA 场景
- 如何调试一个反复出现的提供商故障
- 如何修复一条陈旧的本地工作流备注

它并不适用于：

- 像“用户喜欢蓝色”这样的事实
- 广义的自传式 memory
- 原始转录归档
- 秘密、凭证或隐藏提示词文本
- 不会再次重复的一次性指令

## 默认状态

内置插件是**实验性**的，并且**默认关闭**，除非在
`plugins.entries.skill-workshop` 中显式启用。

插件 manifest 不会设置 `enabledByDefault: true`。插件配置 schema
内部的 `enabled: true` 默认值只有在插件条目已经被选中并加载之后才生效。

实验性意味着：

- 该插件已经足够支持按需启用测试和内部试用
- proposal 存储、审查阈值和捕获启发式可能会继续演化
- 推荐从待审批模式开始
- 自动应用适用于受信任的个人/工作区设置，不适用于共享环境或敌意输入较多的环境

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
- 显式的可复用纠正会被排入待处理 proposals
- 基于阈值的审查者通道可以提出 skill 更新建议
- 在待处理 proposal 被应用之前，不会写入任何 skill 文件

仅在受信任工作区中使用自动写入：

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

`approvalPolicy: "auto"` 仍然使用相同的扫描器和隔离路径。它
不会应用带有 critical 发现的 proposals。

## 配置

| 键 | 默认值 | 范围 / 可选值 | 含义 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled` | `true` | boolean | 在插件条目加载后启用该插件。 |
| `autoCapture` | `true` | boolean | 在成功的智能体轮次后启用自动捕获/审查。 |
| `approvalPolicy` | `"pending"` | `"pending"`、`"auto"` | 排队 proposals，或自动写入安全 proposals。 |
| `reviewMode` | `"hybrid"` | `"off"`、`"heuristic"`、`"llm"`、`"hybrid"` | 选择显式纠正捕获、LLM 审查者、两者兼用，或都不用。 |
| `reviewInterval` | `15` | `1..200` | 每隔这么多次成功轮次运行一次审查者。 |
| `reviewMinToolCalls` | `8` | `1..500` | 在观察到这么多次工具调用后运行审查者。 |
| `reviewTimeoutMs` | `45000` | `5000..180000` | 嵌入式审查者运行的超时时间。 |
| `maxPending` | `50` | `1..200` | 每个工作区保留的待处理/隔离 proposals 上限。 |
| `maxSkillBytes` | `40000` | `1024..200000` | 生成的 skill/支持文件大小上限。 |

推荐配置模板：

```json5
// 保守：仅显式工具使用，不自动捕获。
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// 审查优先：自动捕获，但要求审批。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// 受信任自动化：立即写入安全 proposals。
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// 低成本：无审查者 LLM 调用，仅显式纠正短语。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 捕获路径

Skill Workshop 有三种捕获路径。

### 工具建议

当模型看到一个可复用流程，或者用户要求它保存/更新某个 skill 时，
模型可以直接调用 `skill_workshop`。

这是最显式的路径，即使在 `autoCapture: false` 时也有效。

### 启发式捕获

当启用 `autoCapture`，且 `reviewMode` 为 `heuristic` 或 `hybrid` 时，
插件会扫描成功轮次中的显式用户纠正短语：

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

该启发式会根据最新匹配的用户指令创建一个 proposal。它会
使用主题提示为常见工作流选择 skill 名称：

- animated GIF 任务 -> `animated-gif-workflow`
- screenshot 或 asset 任务 -> `screenshot-asset-workflow`
- QA 或 scenario 任务 -> `qa-scenario-workflow`
- GitHub PR 任务 -> `github-pr-workflow`
- 回退 -> `learned-workflows`

启发式捕获是刻意收窄的。它适用于明确的纠正和可重复的流程备注，
而不适用于通用转录总结。

### LLM 审查者

当启用 `autoCapture`，且 `reviewMode` 为 `llm` 或 `hybrid` 时，插件
会在达到阈值后运行一个紧凑的嵌入式审查者。

审查者会接收：

- 最近的转录文本，上限为最近 12,000 个字符
- 最多 12 个现有工作区 Skills
- 每个现有 skill 最多 2,000 个字符
- 仅 JSON 指令

审查者没有工具：

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

审查者返回的结果要么是 `{ "action": "none" }`，要么是一条 proposal。`action` 字段可以是 `create`、`append` 或 `replace` —— 当相关 skill 已存在时，应优先使用 `append`/`replace`；仅在没有现有 skill 适配时才使用 `create`。

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

`append` 会添加 `section` + `body`。`replace` 会在指定 skill 中用 `newText` 替换 `oldText`。

## Proposal 生命周期

每个生成的更新都会变成一个 proposal，包含：

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 可选的 `agentId`
- 可选的 `sessionId`
- `skillName`
- `title`
- `reason`
- `source`：`tool`、`agent_end` 或 `reviewer`
- `status`
- `change`
- 可选的 `scanFindings`
- 可选的 `quarantineReason`

Proposal 状态：

- `pending` - 等待批准
- `applied` - 已写入 `<workspace>/skills`
- `rejected` - 被 operator/模型拒绝
- `quarantined` - 因 critical 扫描器发现而被阻止

状态会按工作区存储在 Gateway 网关状态目录下：

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

待处理和已隔离的 proposals 会按 skill 名称和变更
载荷去重。该存储会保留最新的待处理/隔离 proposals，数量上限为
`maxPending`。

## 工具参考

该插件注册了一个智能体工具：

```text
skill_workshop
```

### `status`

按状态统计当前工作区的 proposals 数量。

```json
{ "action": "status" }
```

结果形状：

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

列出待处理 proposals。

```json
{ "action": "list_pending" }
```

若要列出其他状态：

```json
{ "action": "list_pending", "status": "applied" }
```

有效的 `status` 值：

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

列出已隔离 proposals。

```json
{ "action": "list_quarantine" }
```

当自动捕获看起来没有任何效果，而日志中提到
`skill-workshop: quarantined <skill>` 时，请使用它。

### `inspect`

按 id 获取一个 proposal。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

创建一个 proposal。使用 `approvalPolicy: "pending"`（默认）时，这会进入排队，而不是直接写入。

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

  <Accordion title="在自动策略下强制进入待处理（apply: false）">

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

应用一个待处理 proposal。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` 会拒绝已隔离 proposal：

```text
quarantined proposal cannot be applied
```

### `reject`

将一个 proposal 标记为已拒绝。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

在现有或拟议 skill 目录中写入一个支持文件。

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

支持文件按工作区划分作用域，会进行路径检查，受
`maxSkillBytes` 的字节限制，经过扫描，并以原子方式写入。

## Skill 写入

Skill Workshop 只会写入以下路径下的内容：

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 名称会被规范化：

- 转为小写
- 所有非 `[a-z0-9_-]` 的连续字符都会变为 `-`
- 去掉开头/结尾的非字母数字字符
- 最大长度为 80 个字符
- 最终名称必须匹配 `[a-z0-9][a-z0-9_-]{1,79}`

对于 `create`：

- 如果 skill 不存在，Skill Workshop 会写入一个新的 `SKILL.md`
- 如果已存在，Skill Workshop 会将正文追加到 `## Workflow`

对于 `append`：

- 如果 skill 已存在，Skill Workshop 会追加到请求的 section
- 如果不存在，Skill Workshop 会先创建一个最小 skill，然后再追加

对于 `replace`：

- skill 必须已存在
- `oldText` 必须精确存在
- 只会替换第一个精确匹配项

所有写入都是原子的，并且会立即刷新内存中的 Skills 快照，因此
新的或更新后的 skill 无需重启 Gateway 网关即可变得可见。

## 安全模型

Skill Workshop 会对生成的 `SKILL.md` 内容和支持
文件运行安全扫描器。

Critical 发现会将 proposals 隔离：

| 规则 ID | 会阻止的内容 |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 指示智能体忽略先前/更高优先级指令 |
| `prompt-injection-system` | 引用系统提示词、开发者消息或隐藏指令 |
| `prompt-injection-tool` | 鼓励绕过工具权限/审批 |
| `shell-pipe-to-shell` | 包含将 `curl`/`wget` 通过管道传给 `sh`、`bash` 或 `zsh` |
| `secret-exfiltration` | 看起来像是在通过网络发送 env/进程环境数据 |

Warn 发现会被保留，但本身不会阻止：

| 规则 ID | 警告内容 |
| -------------------- | -------------------------------- |
| `destructive-delete` | 范围宽泛的 `rm -rf` 风格命令 |
| `unsafe-permissions` | `chmod 777` 风格的权限使用 |

被隔离的 proposals：

- 会保留 `scanFindings`
- 会保留 `quarantineReason`
- 会出现在 `list_quarantine` 中
- 不能通过 `apply` 来应用

如果要从一个被隔离的 proposal 中恢复，请重新创建一个删除了
不安全内容的新安全 proposal。不要手动编辑存储 JSON。

## 提示词引导

启用后，Skill Workshop 会注入一个简短的提示词区块，告诉智能体
使用 `skill_workshop` 来保存持久化流程型 memory。

该引导强调：

- 保存流程，而不是事实/偏好
- 用户纠正
- 不明显但成功的流程
- 反复出现的陷阱
- 通过 append/replace 修复陈旧/稀薄/错误的 skill
- 在经历长工具循环或艰难修复后保存可复用流程
- 简短、命令式的 skill 文本
- 不要转储转录

写入模式文本会随 `approvalPolicy` 改变：

- pending 模式：将建议排队；仅在显式批准后才应用
- auto 模式：当 workspace-skill 更新明显可复用时，自动应用安全更新

## 成本与运行时行为

启发式捕获不会调用模型。

LLM 审查会在活动/默认智能体模型上运行一个嵌入式轮次。
它基于阈值，因此默认不会在每一轮都运行。

审查者：

- 在可用时使用相同的已配置提供商/模型上下文
- 否则回退到运行时智能体默认值
- 具有 `reviewTimeoutMs`
- 使用轻量级 bootstrap 上下文
- 没有工具
- 不会直接写入任何内容
- 只能输出一个会经过正常扫描器和
  审批/隔离路径的 proposal

如果审查者失败、超时或返回无效 JSON，插件会记录一条
warning/debug 消息，并跳过该次审查通道。

## 运维模式

当用户说以下内容时，请使用 Skill Workshop：

- “下次，做 X”
- “从现在开始，优先 Y”
- “一定要验证 Z”
- “把这个保存成一个工作流”
- “这个花了不少时间；记住这个流程”
- “更新本地 skill，使其适配这个”

好的 skill 文本：

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

差的 skill 文本：

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

差版本不应被保存的原因：

- 形状像转录
- 不是命令式
- 包含嘈杂的一次性细节
- 没有告诉下一个智能体应该做什么

## 调试

检查插件是否已加载：

```bash
openclaw plugins list --enabled
```

从智能体/工具上下文检查 proposal 计数：

```json
{ "action": "status" }
```

检查待处理 proposals：

```json
{ "action": "list_pending" }
```

检查已隔离 proposals：

```json
{ "action": "list_quarantine" }
```

常见症状：

| 症状 | 可能原因 | 检查项 |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 工具不可用 | 插件条目未启用 | `plugins.entries.skill-workshop.enabled` 和 `openclaw plugins list` |
| 没有出现自动 proposal | `autoCapture: false`、`reviewMode: "off"`，或未达到阈值 | 配置、proposal 状态、Gateway 网关日志 |
| 启发式未捕获 | 用户措辞未匹配纠正模式 | 使用显式 `skill_workshop.suggest` 或启用 LLM 审查者 |
| 审查者未创建 proposal | 审查者返回了 `none`、无效 JSON，或超时 | Gateway 网关日志、`reviewTimeoutMs`、阈值 |
| Proposal 未被应用 | `approvalPolicy: "pending"` | `list_pending`，然后执行 `apply` |
| Proposal 从 pending 中消失 | 复用了重复 proposal、max pending 剪枝，或已被 applied/rejected/quarantined | `status`、带状态过滤的 `list_pending`、`list_quarantine` |
| Skill 文件存在，但模型未命中它 | Skill 快照未刷新，或 skill 门控将其排除 | `openclaw skills` 状态和工作区 skill 可用性 |

相关日志：

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 场景

基于仓库的 QA 场景：

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

审查者场景被有意单独拆分，因为它启用了
`reviewMode: "llm"`，并运行嵌入式审查者通道。

## 何时不应启用自动应用

在以下情况下应避免使用 `approvalPolicy: "auto"`：

- 工作区包含敏感流程
- 智能体正在处理不可信输入
- Skills 会在大范围团队中共享
- 你仍在调整提示词或扫描器规则
- 模型经常处理敌意网页/邮件内容

请先使用 pending 模式。只有在审查过该工作区中智能体提出的
Skills 类型之后，再切换到 auto 模式。

## 相关文档

- [Skills](/zh-CN/tools/skills)
- [Plugins](/zh-CN/tools/plugin)
- [测试](/zh-CN/reference/test)
