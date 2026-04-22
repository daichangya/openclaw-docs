---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T19:49:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a3fd8d758be86be3b2845b8507d118b6dbe14d1e4886a7adc88d226d2817772
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 何时运行 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅有文档变更、已变更范围、已变更扩展，并构建 CI 清单 | 在非草稿推送和 PR 中始终运行 |
| `security-scm-fast` | 通过 `zizmor` 执行私钥检测和工作流审计 | 在非草稿推送和 PR 中始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无需依赖安装的生产 lockfile 审计 | 在非草稿推送和 PR 中始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在非草稿推送和 PR 中始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性任务，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展任务 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 检测到扩展变更时 |
| `check` | 分片的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格冒烟检查 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 基于已构建 CLI 的冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 其余 Linux Node 任务：渠道测试和仅在推送时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 针对 Python 支持的 Skills 执行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试任务 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试任务 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序方式确保低成本检查会先于高成本作业失败：

1. `preflight` 决定哪些任务实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 任务并行运行，这样下游消费者就能在共享构建准备好后立即开始。
4. 之后会扇出更重的平台和运行时任务：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台任务仍然只在对应平台源码变更时运行。  
Windows Node 检查的范围仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该任务的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 任务中，因此不会为了已由常规测试分片覆盖的内容占用一个 16-vCPU 的 Windows worker。  
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install 冒烟测试只会在与安装、打包和容器相关的变更时运行。它的 QR 包冒烟测试会强制 Docker 的 `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此它仍能覆盖安装过程，而无需在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此它增加了真实的容器到容器 WebSocket 覆盖，而不会再增加一次 Docker 构建。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心仅测试变更只运行核心测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本提升会运行针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式回退到所有任务。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 任务。在拉取请求中，该任务会被跳过，矩阵会聚焦于常规测试/渠道任务。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小：渠道契约将 registry 和核心覆盖各自拆成八个加权分片，auto-reply 以三个平衡 worker 运行，而不是六个过小的 worker，agentic gateway/plugin configs 则分布到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。`check-additional` 会将包边界 compile/canary 工作放在一起，并将其与运行时拓扑 Gateway 网关/架构工作分离；边界守卫分片会在一个作业内并发运行其小型独立守卫，而 gateway watch 回归会使用最小化的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败了，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键采用版本化形式（`CI-v4-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵就能更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余已构建产物消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；`install-smoke` Docker 构建也是如此，因为 32-vCPU 的排队时间成本高于它带来的节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等价项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界任务运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 产物/build-smoke 任务相关时，构建 dist
```
