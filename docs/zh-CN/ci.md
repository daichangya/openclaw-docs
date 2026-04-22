---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T18:24:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 302deb5128fa734b69380f272d648dd3259afa74a2b7754fbb7389779349297e
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围控制，在只改动了无关区域时跳过开销较大的作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅改动文档、变更范围、已变更的内置插件，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 公告执行无依赖的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性分支，例如内置 / 插件契约 / 协议检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片执行的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展分支 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 检测到扩展变更时 |
| `check` | 分片执行的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 其余 Linux Node 分支：渠道测试以及仅在 push 上运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式化、lint 和坏链检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试分支 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试分支 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排列顺序经过设计，以便让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定哪些分支实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 分支并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时分支随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
对 CI 工作流的编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因为这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台分支仍然只对平台源码变更生效。
单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它基于更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装 smoke 只会在与安装、打包和容器相关的变更时运行。它的 QR 包 smoke 会强制 Docker 的 `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此依然能验证安装流程，而不会在每次运行时都重新下载依赖。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产类型检查以及 core 测试，core 仅测试变更只运行 core 测试类型检查 / 测试，扩展生产变更会运行扩展生产类型检查以及扩展测试，而扩展仅测试变更只运行扩展测试类型检查 / 测试。公共 Plugin SDK 或插件契约变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以保守方式落到所有分支。

在 push 上，`checks` 矩阵会增加仅在 push 上运行的 `compat-node22` 分支。在拉取请求上，这个分支会被跳过，矩阵会聚焦于常规测试 / 渠道分支。

最慢的 Node 测试族会被拆分或均衡，以便每个作业都保持较小规模：渠道契约会将 registry 和 core 覆盖各自拆成八个加权分片，自动回复 reply 测试会按前缀组拆分，而 agentic Gateway 网关 / 插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。`check-additional` 会把 package-boundary 编译 / 金丝雀工作放在一起，并将其与运行时拓扑的 gateway / 架构工作分开；边界守卫分片会在一个作业内并发运行其规模较小且彼此独立的守卫，而 gateway watch 回归则使用最小的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有新的 push 到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被更新运行取代之后，不会继续排队。
CI 并发键带有版本号（`CI-v2-*`），因此 GitHub 端旧队列组中的僵尸任务不会无限期阻塞更新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管 Ubuntu，以便 Blacksmith 矩阵能更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余已构建产物消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然高到 8 vCPU 的成本高于收益；install-smoke 的 Docker 构建也是如此，在那里 32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等价项

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local gate: changed typecheck/lint/tests by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
```
