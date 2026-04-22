---
read_when:
    - 你需要了解为什么某个 CI 作业会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T05:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在仅有不相关区域发生变更时跳过开销较大的作业。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更范围、已变更扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 中始终运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 中始终运行 |
| `security-dependency-audit`      | 针对 npm 安全公告执行无依赖的生产锁文件审计 | 在所有非草稿推送和 PR 中始终运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 中始终运行 |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core`               | 快速 Linux 正确性任务，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions`         | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和扩展任务 | 与 Node 相关的变更 |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试 | 检测到扩展变更时 |
| `check`                          | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks`                         | 其余 Linux Node 任务：渠道测试和仅在 push 时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs`                     | 文档格式化、lint 和坏链检查 | 文档发生变更时 |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows`                 | Windows 专用测试任务 | 与 Windows 相关的变更 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试任务 | 与 macOS 相关的变更 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android`                        | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便在高开销作业启动前，先让低成本检查失败：

1. `preflight` 决定哪些任务实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 任务并行执行，这样下游消费者可以在共享构建准备好后立即启动。
4. 然后更重的平台和运行时任务再展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用相同的范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 仅会在安装、打包和容器相关变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界上比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试；仅 core 测试变更只运行 core 测试 typecheck/测试；扩展生产变更会运行扩展生产 typecheck 加扩展测试；仅扩展测试变更只运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展校验，因为扩展依赖这些 core 契约。仅包含发布元数据的版本提升会运行定向的版本/配置/root 依赖检查。未知的 root/config 变更会以安全优先方式落到所有任务。

在 push 上，`checks` 矩阵会添加仅在 push 时运行的 `compat-node22` 任务。在拉取请求中，该任务会被跳过，矩阵将专注于常规测试/渠道任务。

最慢的 Node 测试族会拆分为 include-file 分片，以便每个作业保持较小：渠道契约将 registry 和 core 覆盖各自拆成八个加权分片；auto-reply reply command 测试拆成四个 include-pattern 分片；其他大型 auto-reply reply prefix 组则各自拆成两个分片。`check-additional` 还会将 package-boundary compile/canary 工作与运行时拓扑 gateway/architecture 工作分开。

当同一个 PR 或 `main` 引用上有新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用上的最新一次运行也失败，否则应将其视为 CI 噪音。聚合分片检查会明确指出这种取消情况，以便更容易将它与测试失败区分开。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`、`security-dependency-audit`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows` |
| `blacksmith-12vcpu-macos-latest` | `macos-node`、`macos-swift`，用于 `openclaw/openclaw`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界任务运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同一套门禁，并附带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI artifact/build-smoke 任务相关时，构建 dist
```
