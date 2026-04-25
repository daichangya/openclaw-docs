---
read_when:
    - 规划一次广泛的 OpenClaw 应用现代化改造工作
    - 更新应用或 Control UI 工作的前端实现标准
    - 将一次广泛的产品质量评审转化为分阶段的工程工作
summary: 包含前端交付技能更新的全面应用现代化计划
title: 应用现代化计划
x-i18n:
    generated_at: "2026-04-25T10:34:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 15
---

# 应用现代化计划

## 目标

在不破坏当前工作流、也不通过大范围重构掩盖风险的前提下，推动应用朝着更整洁、更快速、更易维护的产品方向发展。相关工作应以小块、可审查的切片方式落地，并为每个被触及的表面提供验证依据。

## 原则

- 保持当前架构不变，除非某个边界已被明确证明会导致频繁改动、性能成本或用户可见的缺陷。
- 优先为每个问题选择最小且正确的补丁，然后重复这一做法。
- 将必需修复与可选优化分开，这样维护者无需等待主观性决策，就能交付高价值工作。
- 保持面向插件的行为有文档说明，并向后兼容。
- 在声称某个回归问题已修复之前，先验证已发布行为、依赖契约和测试。
- 先改善主要用户路径：新手引导、认证、聊天、提供商设置、插件管理和诊断。

## 第 1 阶段：基线审计

在变更应用之前，先盘点当前状态。

- 识别最重要的用户工作流，以及拥有这些工作流的代码表面。
- 列出失效的交互入口、重复设置、不清晰的错误状态以及高开销的渲染路径。
- 记录每个表面的当前验证命令。
- 将问题标记为必需、推荐或可选。
- 记录需要所有者评审的已知阻塞项，尤其是 API、安全、发布和插件契约变更。

完成定义：

- 一份包含仓库根目录文件引用的问题列表。
- 每个问题都包含严重程度、所属表面、预期用户影响以及建议的验证路径。
- 不将推测性的清理项混入必需修复项中。

## 第 2 阶段：产品和 UX 清理

优先处理可见工作流并消除困惑。

- 收紧围绕模型认证、Gateway 网关状态和插件设置的新手引导文案与空状态。
- 在无法执行任何操作的地方移除或禁用失效的交互入口。
- 让重要操作在不同响应式宽度下保持可见，而不是隐藏在脆弱的布局假设之后。
- 整合同类状态文案，让错误信息只有一个事实来源。
- 为高级设置增加渐进式披露，同时保持核心设置流程快速。

推荐验证：

- 首次运行设置和现有用户启动的手动顺畅路径验证。
- 针对任意路由、配置持久化或状态推导逻辑的聚焦测试。
- 对已变更的响应式表面提供浏览器截图。

## 第 3 阶段：前端架构收紧

在不进行大规模重写的情况下提升可维护性。

- 将重复的 UI 状态转换移动到狭窄且有类型约束的辅助函数中。
- 保持数据获取、持久化和展示职责分离。
- 优先使用现有 hooks、stores 和组件模式，而不是引入新的抽象。
- 仅在能减少耦合或让测试更清晰时拆分过大的组件。
- 避免为局部面板交互引入大范围全局状态。

必需护栏：

- 不要把公共行为变化作为拆分文件的副作用。
- 保持菜单、对话框、标签页和键盘导航的无障碍行为不受影响。
- 验证加载、空状态、错误状态和乐观状态仍然会被渲染。

## 第 4 阶段：性能与可靠性

针对已测量的痛点，而不是泛泛的理论优化。

- 测量启动、路由切换、大型列表和聊天记录的成本。
- 在性能分析证明有价值时，将重复且昂贵的派生数据替换为记忆化选择器或缓存辅助函数。
- 减少热点路径上可避免的网络或文件系统扫描。
- 在构建模型负载之前，保持提示词、注册表、文件、插件和网络输入的确定性排序。
- 为热点辅助函数和契约边界增加轻量级回归测试。

完成定义：

- 每项性能变更都记录基线、预期影响、实际影响和剩余差距。
- 在可以低成本测量的情况下，不要仅凭直觉合入性能补丁。

## 第 5 阶段：类型、契约与测试加固

提升用户和插件作者依赖的边界点正确性。

- 将宽松的运行时字符串替换为可辨别联合类型或封闭代码列表。
- 使用现有 schema helpers 或 `zod` 验证外部输入。
- 围绕插件清单、提供商目录、Gateway 网关协议消息和配置迁移行为增加契约测试。
- 将兼容路径保留在 Doctor 或修复流程中，而不是放在启动时的隐藏迁移里。
- 避免测试仅与插件内部机制耦合；应使用 SDK 门面和有文档说明的 barrel 导出。

推荐验证：

- `pnpm check:changed`
- 为每个已变更边界添加定向测试。
- 当惰性边界、打包或已发布表面发生变化时，运行 `pnpm build`。

## 第 6 阶段：文档与发布就绪

保持面向用户的文档与行为一致。

- 针对行为、API、配置、新手引导或插件变更更新文档。
- 仅为用户可见变更添加更新日志条目。
- 面向用户时保持使用插件术语；仅在贡献者确有需要时使用内部包名。
- 确认发布和安装说明仍与当前命令表面一致。

完成定义：

- 相关文档在与行为变更相同的分支中更新。
- 若有触及，生成文档或 API 漂移检查必须通过。
- 交接说明中应列出任何跳过的验证以及跳过原因。

## 推荐的第一刀切片

先从有范围约束的 Control UI 和新手引导改造开始：

- 审计首次运行设置、提供商认证就绪状态、Gateway 网关状态和插件设置表面。
- 移除失效操作并澄清失败状态。
- 为状态推导和配置持久化添加或更新聚焦测试。
- 运行 `pnpm check:changed`。

这样可以在架构风险有限的情况下带来较高的用户价值。

## 前端技能更新

使用本节更新现代化任务附带的、聚焦前端的 `SKILL.md`。如果要将这份指导作为仓库本地 OpenClaw skill 采用，请先创建 `.agents/skills/openclaw-frontend/SKILL.md`，保留属于目标 skill 的 frontmatter，然后添加或替换正文指导内容为以下内容。

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
