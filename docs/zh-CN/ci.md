---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T21:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a496ff4d9d6f4926bf098e12410b5edd987b36ba26de1a245824eca77eb241de
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业                              | 用途                                                                                      | 运行时机                        |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更范围、变更的扩展，并构建 CI 清单                               | 所有非草稿推送和 PR 都会运行    |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                    | 所有非草稿推送和 PR 都会运行    |
| `security-dependency-audit`      | 针对 npm 安全通告执行无需依赖安装的生产锁文件审计                                         | 所有非草稿推送和 PR 都会运行    |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                | 所有非草稿推送和 PR 都会运行    |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的制品                               | 与 Node 相关的变更              |
| `checks-fast-core`               | 快速 Linux 正确性任务，例如内置 / 插件契约 / 协议检查                                     | 与 Node 相关的变更              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                              | 与 Node 相关的变更              |
| `checks-node-extensions`         | 针对整个扩展套件的完整内置插件测试分片                                                    | 与 Node 相关的变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和扩展任务                                      | 与 Node 相关的变更              |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试                                                            | 检测到扩展变更时                |
| `check`                          | 分片后的主要本地门禁等效项：生产类型、lint、守卫、测试类型和严格烟雾测试                  | 与 Node 相关的变更              |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片                                   | 与 Node 相关的变更              |
| `build-smoke`                    | 已构建 CLI 的烟雾测试和启动内存烟雾测试                                                   | 与 Node 相关的变更              |
| `checks`                         | 剩余的 Linux Node 任务：渠道测试以及仅在 push 时运行的 Node 22 兼容性检查                 | 与 Node 相关的变更              |
| `check-docs`                     | 文档格式化、lint 和坏链接检查                                                              | 文档发生变更时                  |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                              | 与 Python Skills 相关的变更     |
| `checks-windows`                 | Windows 专用测试任务                                                                       | 与 Windows 相关的变更           |
| `macos-node`                     | 使用共享构建制品的 macOS TypeScript 测试任务                                              | 与 macOS 相关的变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                        | 与 macOS 相关的变更             |
| `android`                        | Android 构建和测试矩阵                                                                     | 与 Android 相关的变更           |

## 快速失败顺序

作业按顺序排列，以便在高开销作业启动前先让低成本检查失败：

1. `preflight` 决定哪些任务实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的制品和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 任务并行执行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时任务随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台任务仍然仅限于对应平台源代码变更。
Windows Node 检查的范围限定在 Windows 专用的进程 / 路径包装器、npm / pnpm / UI 运行器辅助工具、包管理器配置，以及执行该任务的 CI 工作流表面；不相关的源代码、插件、安装烟雾测试和纯测试变更仍保留在 Linux Node 任务中，这样它们就不会为正常测试分片已覆盖的内容占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装烟雾测试只会在安装、打包和与容器相关的变更时运行。它的 QR 包烟雾测试会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此它仍然能覆盖安装流程，而无需在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面已构建的运行时镜像，因此它在不增加额外 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。

本地变更任务逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产类型检查加核心测试，核心仅测试变更只运行核心测试类型检查 / 测试，扩展生产变更会运行扩展生产类型检查加扩展测试，而扩展仅测试变更只运行扩展测试类型检查 / 测试。公共插件 SDK 或插件契约变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式回退到所有任务。

在 push 时，`checks` 矩阵会增加仅在 push 时运行的 `compat-node22` 任务。在拉取请求中，这个任务会被跳过，矩阵会继续聚焦于常规测试 / 渠道任务。

最慢的 Node 测试族已经被拆分或平衡，以便每个作业都保持较小规模：渠道契约将注册表和核心覆盖拆成八个加权分片，内置插件测试在六个扩展 worker 之间平衡分配，自动回复以三个平衡 worker 运行而不是六个很小的 worker，而智能化 Gateway 网关 / 插件配置则分布到现有仅源码的智能化 Node 作业中，而不是等待构建制品。广泛的 agents 任务使用共享的 Vitest 文件并行调度器，因为它受导入 / 调度主导，而不是由单个慢测试文件主导。`check-additional` 将包边界编译 / 金丝雀工作放在一起，并将其与运行时拓扑 Gateway 网关 / 架构工作分离；边界守卫分片会在一个作业内部并发运行其小型独立守卫，而 gateway watch 回归则使用最小的 `gatewayWatch` 构建配置，而不是重建完整的 CI 制品 sidecar 集合。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被后续运行取代后继续排队。
CI 并发键已做版本化（`CI-v6-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余依赖构建制品的消费者、`android`                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 带来的成本高于节省的成本；`install-smoke` 的 Docker 构建也是如此，其中 32 vCPU 的排队时间成本高于节省的成本                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地变更任务分类器
pnpm check:changed   # 智能本地门禁：按边界任务运行变更相关的类型检查 / lint / 测试
pnpm check          # 快速本地门禁：生产 `tsgo` + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # `vitest` 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 坏链接检查
pnpm build          # 当 CI 制品 / build-smoke 任务相关时构建 `dist`
```
