---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T14:10:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a057845990dc78c2c883b0458d736b10a421a462f645e8b1213e0221d647a8
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在仅修改无关区域时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅有文档改动、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如内置 / plugin-contract / 协议检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的内置插件执行聚焦测试 | 检测到扩展变更时 |
| `check` | 分片后的主要本地门控等效项：生产类型、lint、守卫、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 其余 Linux Node 通道：渠道测试以及仅在推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业顺序经过安排，使廉价检查能在高开销作业运行前先失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物构建和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
单独的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用相同的范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装冒烟测试只会在与安装、打包和容器相关的变更下运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心仅测试变更只运行核心测试 typecheck / 测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck / 测试。公共 Plugin SDK 或 plugin-contract 变更会扩展为扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式回退到所有通道。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵将继续聚焦于常规测试 / 渠道通道。

最慢的 Node 测试族被拆分为 include-file 分片，以便每个作业都保持较小：渠道契约将 registry 和核心覆盖各自拆成八个加权分片，auto-reply reply command 测试拆成四个 include-pattern 分片，其他大型 auto-reply reply prefix 分组则各拆成两个分片。`check-additional` 还将 package-boundary compile / canary 工作与运行时拓扑 Gateway 网关 / 架构工作分离。

当同一 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将已被替代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查会明确指出这种取消情况，以便更容易与测试失败区分。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04` | `preflight`、简短的聚合验证作业（`security-fast`、`check`、`check-additional`、`checks-fast-contracts-channels`）；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `security-scm-fast`、`security-dependency-audit`、`build-artifacts`、除 `check-lint` 外的 Linux 检查、长矩阵聚合验证器、文档检查、Python Skills、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 的成本高于节省效果 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
```
