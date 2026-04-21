---
read_when:
    - 你希望智能体将修正内容或可复用流程转换为工作区 Skills
    - 你正在配置过程型 Skills 记忆
    - 你正在调试 `skill_workshop` 工具行为
    - 你正在决定是否启用自动创建 Skills
summary: 将可复用流程以工作区 Skills 的形式进行实验性捕获，并支持审核、批准、隔离和 Skills 热刷新
title: Skill Workshop 插件
x-i18n:
    generated_at: "2026-04-21T20:35:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Skill Workshop 插件

Skill Workshop **处于实验阶段**。默认禁用，其捕获启发式规则和审阅者提示可能会在不同版本之间发生变化，并且自动写入应仅在受信任的工作区中使用，且应先查看待处理模式的输出。

Skill Workshop 是用于工作区 Skills 的过程型记忆。它让智能体能够将可复用工作流、用户修正、来之不易的修复经验以及反复出现的陷阱，转换为以下位置下的 `SKILL.md` 文件：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

这不同于长期记忆：

- **Memory** 存储事实、偏好、实体和过去的上下文。
- **Skills** 存储智能体在未来任务中应遵循的可复用流程。
- **Skill Workshop** 是从一次有用的交互到持久化工作区 skill 的桥梁，带有安全检查和可选批准。

当智能体学会如下流程时，Skill Workshop 会很有用：

- 如何验证外部来源的动画 GIF 资源
- 如何替换截图资源并验证尺寸
- 如何运行仓库特定的 QA 场景
- 如何调试反复出现的提供商故障
- 如何修复过时的本地工作流说明

它不适用于：

- 像“用户喜欢蓝色”这样的事实
- 宽泛的自传式记忆
- 原始转录归档
- 密钥、凭证或隐藏提示文本
- 不会重复出现的一次性指令

## 默认状态

内置插件**处于实验阶段**，并且**默认禁用**，除非在 `plugins.entries.skill-workshop` 中显式启用。

插件清单未设置 `enabledByDefault: true`。插件配置 schema 中的 `enabled: true` 默认值仅在插件条目已被选中并加载后才会生效。

“实验阶段”意味着：

- 该插件已具备足够支持，可用于选择加入的测试和内部试用
- 提案存储、审阅阈值和捕获启发式规则可能会持续演进
- 建议将待批准作为起始模式
- 自动应用适用于受信任的个人 / 工作区设置，不适用于共享或高频接收不可信输入的环境

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
- 明确的可复用修正会被排入待处理提案队列
- 基于阈值的审阅者流程可以提出 skill 更新建议
- 在待处理提案被应用之前，不会写入任何 skill 文件

仅在受信任的工作区中使用自动写入：

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

`approvalPolicy: "auto"` 仍会使用相同的扫描器和隔离路径。它不会应用存在严重扫描发现的问题提案。

## 配置

| 键名                 | 默认值      | 范围 / 取值                                  | 含义                                           |
| -------------------- | ----------- | -------------------------------------------- | ---------------------------------------------- |
| `enabled`            | `true`      | boolean                                      | 在插件条目加载后启用该插件。                   |
| `autoCapture`        | `true`      | boolean                                      | 在智能体成功完成交互后启用交互后捕获 / 审阅。  |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                        | 将提案加入队列，或自动写入安全提案。           |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`  | 选择显式修正捕获、LLM 审阅者、两者或都不用。   |
| `reviewInterval`     | `15`        | `1..200`                                     | 在这么多次成功交互后运行审阅者。               |
| `reviewMinToolCalls` | `8`         | `1..500`                                     | 在观察到这么多次工具调用后运行审阅者。         |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                               | 内嵌审阅者运行的超时时间。                     |
| `maxPending`         | `50`        | `1..200`                                     | 每个工作区保留的待处理 / 已隔离提案最大数量。  |
| `maxSkillBytes`      | `40000`     | `1024..200000`                               | 生成的 skill / 支持文件的最大大小。            |

推荐配置档案：

```json5
// 保守：仅显式工具使用，不启用自动捕获。
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// 先审阅：自动捕获，但需要批准。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// 受信任自动化：立即写入安全提案。
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// 低成本：不调用审阅者 LLM，仅使用显式修正短语。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 捕获路径

Skill Workshop 有三种捕获路径。

### 工具建议

当模型看到可复用流程，或用户要求它保存 / 更新某个 skill 时，可以直接调用 `skill_workshop`。

这是最显式的路径，即使在 `autoCapture: false` 时也可工作。

### 启发式捕获

当启用 `autoCapture`，且 `reviewMode` 为 `heuristic` 或 `hybrid` 时，插件会扫描成功交互中的显式用户修正短语：

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

启发式规则会根据最近匹配的用户指令创建提案。它会使用主题提示为常见工作流选择 skill 名称：

- 动画 GIF 任务 -> `animated-gif-workflow`
- 截图或资源任务 -> `screenshot-asset-workflow`
- QA 或场景任务 -> `qa-scenario-workflow`
- GitHub PR 任务 -> `github-pr-workflow`
- 回退 -> `learned-workflows`

启发式捕获是有意保持狭窄范围的。它适用于清晰的修正和可重复流程说明，不适用于通用的转录摘要。

### LLM 审阅者

当启用 `autoCapture`，且 `reviewMode` 为 `llm` 或 `hybrid` 时，插件会在达到阈值后运行一个紧凑的内嵌审阅者。

审阅者会接收：

- 最近的转录文本，限制为最后 12,000 个字符
- 最多 12 个现有工作区 Skills
- 每个现有 skill 最多 2,000 个字符
- 仅 JSON 指令

审阅者没有工具：

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

它可以返回：

```json
{ "action": "none" }
```

或者返回一个 skill 提案：

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

它也可以向现有 skill 追加内容：

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

或者替换现有 skill 中的精确文本：

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

当相关 skill 已存在时，优先使用 `append` 或 `replace`。仅当没有任何现有 skill 适合时，才使用 `create`。

## 提案生命周期

每个生成的更新都会成为一个提案，包含：

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

提案状态：

- `pending` - 等待批准
- `applied` - 已写入 `<workspace>/skills`
- `rejected` - 已被操作员 / 模型拒绝
- `quarantined` - 因严重扫描发现而被阻止

状态按工作区存储在 Gateway 网关状态目录下：

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

待处理和已隔离提案会按 skill 名称和变更负载去重。存储会保留最新的待处理 / 已隔离提案，最多不超过 `maxPending`。

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

结果结构：

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

列出其他状态：

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

当自动捕获看起来没有任何效果，而日志中提到 `skill-workshop: quarantined <skill>` 时，请使用此操作。

### `inspect`

按 id 获取提案。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

创建一个提案。当使用 `approvalPolicy: "pending"` 时，默认会将其加入队列。

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

强制安全写入：

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

即使在 `approvalPolicy: "auto"` 下也强制进入待处理状态：

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

向某个章节追加内容：

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

替换精确文本：

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

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

在现有或提议中的 skill 目录内写入一个支持文件。

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

支持文件按工作区作用域管理，会进行路径检查、受 `maxSkillBytes` 的字节大小限制、经过扫描，并以原子方式写入。

## Skill 写入

Skill Workshop 仅会写入以下路径：

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 名称会被规范化：

- 转为小写
- 非 `[a-z0-9_-]` 的连续字符会变为 `-`
- 移除开头 / 结尾的非字母数字字符
- 最大长度为 80 个字符
- 最终名称必须匹配 `[a-z0-9][a-z0-9_-]{1,79}`

对于 `create`：

- 如果 skill 不存在，Skill Workshop 会写入一个新的 `SKILL.md`
- 如果已存在，Skill Workshop 会将内容追加到 `## Workflow`

对于 `append`：

- 如果 skill 已存在，Skill Workshop 会追加到请求的章节
- 如果不存在，Skill Workshop 会先创建一个最小 skill，然后再追加

对于 `replace`：

- skill 必须已经存在
- `oldText` 必须精确存在
- 只会替换第一个精确匹配项

所有写入都是原子的，并会立即刷新内存中的 Skills 快照，因此无需重启 Gateway 网关也能看到新的或更新后的 skill。

## 安全模型

Skill Workshop 会对生成的 `SKILL.md` 内容和支持文件进行安全扫描。

严重发现会将提案隔离：

| 规则 id                               | 阻止这类内容：                                                     |
| ------------------------------------- | ------------------------------------------------------------------ |
| `prompt-injection-ignore-instructions` | 告诉智能体忽略先前 / 更高优先级指令                                |
| `prompt-injection-system`              | 引用系统提示、开发者消息或隐藏指令                                 |
| `prompt-injection-tool`                | 鼓励绕过工具权限 / 批准                                             |
| `shell-pipe-to-shell`                  | 包含将 `curl` / `wget` 通过管道传给 `sh`、`bash` 或 `zsh` 的内容   |
| `secret-exfiltration`                  | 看起来会通过网络发送 env / 进程环境数据                            |

警告发现会被保留，但不会单独造成阻止：

| 规则 id             | 警告内容：                     |
| ------------------- | ------------------------------ |
| `destructive-delete` | 宽泛的 `rm -rf` 风格命令       |
| `unsafe-permissions` | `chmod 777` 风格的权限使用     |

已隔离提案：

- 保留 `scanFindings`
- 保留 `quarantineReason`
- 会显示在 `list_quarantine` 中
- 不能通过 `apply` 应用

要从已隔离提案中恢复，请创建一个移除了不安全内容的新安全提案。不要手动编辑存储 JSON。

## 提示指导

启用后，Skill Workshop 会注入一段简短提示，告诉智能体使用 `skill_workshop` 来保存持久化的过程型记忆。

该指导强调：

- 保存流程，而不是事实 / 偏好
- 用户修正
- 不明显但成功的流程
- 反复出现的陷阱
- 通过 append / replace 修复过时 / 过薄 / 错误的 skill
- 在长工具循环或艰难修复后保存可复用流程
- 使用简短的祈使句风格 skill 文本
- 不要转储转录内容

写入模式文本会随 `approvalPolicy` 改变：

- 待处理模式：将建议加入队列；仅在显式批准后应用
- 自动模式：在明确可复用时应用安全的工作区 skill 更新

## 成本和运行时行为

启发式捕获不会调用模型。

LLM 审阅会在当前 / 默认智能体模型上执行一个内嵌运行。它是基于阈值触发的，因此默认不会在每次交互时都运行。

审阅者：

- 在可用时使用相同的已配置提供商 / 模型上下文
- 否则回退到运行时智能体默认值
- 具有 `reviewTimeoutMs`
- 使用轻量级引导上下文
- 没有工具
- 不会直接写入任何内容
- 只能生成一个提案，然后该提案会经过常规扫描器以及批准 / 隔离路径

如果审阅者失败、超时或返回无效 JSON，插件会记录一条 warning / debug 日志消息，并跳过该次审阅流程。

## 运行模式

当用户这样说时，请使用 Skill Workshop：

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

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

不应保存差版本的原因：

- 呈现为转录内容形态
- 不是祈使句
- 包含嘈杂的一次性细节
- 没有告诉下一个智能体应该做什么

## 调试

检查插件是否已加载：

```bash
openclaw plugins list --enabled
```

在智能体 / 工具上下文中检查提案计数：

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

| 症状                                  | 可能原因                                                                            | 检查项                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 工具不可用                            | 插件条目未启用                                                                      | `plugins.entries.skill-workshop.enabled` 和 `openclaw plugins list` |
| 没有出现自动提案                      | `autoCapture: false`、`reviewMode: "off"`，或未达到阈值                             | 配置、提案状态、Gateway 网关日志                                     |
| 启发式规则未捕获                      | 用户措辞未匹配修正规则模式                                                          | 使用显式 `skill_workshop.suggest` 或启用 LLM 审阅者                  |
| 审阅者未创建提案                      | 审阅者返回了 `none`、无效 JSON，或已超时                                            | Gateway 网关日志、`reviewTimeoutMs`、阈值                            |
| 提案未被应用                          | `approvalPolicy: "pending"`                                                         | `list_pending`，然后执行 `apply`                                     |
| 提案从待处理列表中消失                | 复用了重复提案、达到最大待处理裁剪上限，或已被应用 / 拒绝 / 隔离                    | `status`、带状态过滤的 `list_pending`、`list_quarantine`            |
| skill 文件存在，但模型没有使用它      | skill 快照未刷新，或 skill 门控将其排除                                             | `openclaw skills` 状态和工作区 skill 资格                            |

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

运行审阅者覆盖：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

审阅者场景被有意单独拆分，因为它启用了 `reviewMode: "llm"` 并覆盖了内嵌审阅者流程。

## 何时不应启用自动应用

在以下情况下，避免使用 `approvalPolicy: "auto"`：

- 工作区包含敏感流程
- 智能体正在处理不可信输入
- Skills 由一个较大的团队共享
- 你仍在调整提示或扫描规则
- 模型经常处理带有敌意的网页 / 邮件内容

请先使用待处理模式。仅在你审查过该工作区中智能体提出的 skill 类型之后，再切换到自动模式。

## 相关文档

- [Skills](/zh-CN/tools/skills)
- [插件](/zh-CN/tools/plugin)
- [测试](/zh-CN/reference/test)
