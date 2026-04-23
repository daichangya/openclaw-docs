---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T00:31:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 730317200f1c4da71f16e358eed55fe58ab8866e91fe95bc1803f1d35bd165d0
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围控制，在只有不相关区域发生变更时跳过昂贵作业。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | 检测仅文档变更、变更范围、已变更扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit`      | 针对 npm 安全通告执行无依赖的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的构建产物 | Node 相关变更 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | Node 相关变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | Node 相关变更 |
| `checks-node-extensions`         | 针对整个扩展套件执行完整的内置插件测试分片 | Node 相关变更 |
| `checks-node-core-test`          | 核心 Node 测试分片，不包含渠道、内置、契约和扩展通道 | Node 相关变更 |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试 | 带有扩展变更的拉取请求 |
| `check`                          | 分片后的主要本地门控等效项：生产类型、lint、守卫、测试类型，以及严格冒烟测试 | Node 相关变更 |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | Node 相关变更 |
| `build-smoke`                    | 已构建 CLI 的冒烟测试和启动内存冒烟测试 | Node 相关变更 |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试以及仅在 push 上运行的 Node 22 兼容性 | Node 相关变更 |
| `check-docs`                     | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest | Python Skills 相关变更 |
| `checks-windows`                 | Windows 特定测试通道 | Windows 相关变更 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道 | macOS 相关变更 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试 | macOS 相关变更 |
| `android`                        | Android 构建和测试矩阵 | Android 相关变更 |

## 快速失败顺序

作业的排列顺序确保便宜的检查会先失败，再运行昂贵作业：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不需要等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 随后更重的平台和运行时通道再展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会校验 Node CI 作业图以及工作流 lint，但不会仅因为这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只在平台源码发生变更时运行。
Windows Node 检查的范围限定在 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和纯测试变更仍保留在 Linux Node 通道上，这样它们就不会为了已由常规测试分片覆盖的内容去占用一台 16 vCPU 的 Windows 运行器。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用相同的范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install 冒烟测试只会在安装、打包和容器相关变更时运行。它的 QR 包冒烟测试会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此它仍然会覆盖安装流程，而不需要在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此能够增加真实的容器到容器 WebSocket 覆盖，而无需再增加一次 Docker 构建。一个单独的 `docker-e2e-fast` 作业会在 120 秒命令超时内运行有界的内置插件 Docker 配置：setup-entry 依赖修复加上合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍然保持为手动/全套运行，因为它会反复执行真实的 npm update 和 doctor 修复过程。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控比宽泛的 CI 平台范围在架构边界上更严格：核心生产变更会运行核心生产类型检查加核心测试，核心仅测试变更只运行核心测试类型检查/测试，扩展生产变更会运行扩展生产类型检查加扩展测试，而扩展仅测试变更只运行扩展测试类型检查/测试。公共插件 SDK 或 plugin-contract 变更会扩大到扩展校验，因为扩展依赖这些核心契约。仅发布元数据的版本号变更会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式退回到所有通道。

在 push 上，`checks` 矩阵会增加仅 push 的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵保持聚焦于常规测试/渠道通道。

最慢的 Node 测试族已被拆分或平衡，以便每个作业都保持较小规模：渠道契约将 registry 和核心覆盖拆分为总共六个加权分片，内置插件测试在六个扩展工作器之间做负载均衡，每个扩展工作器运行三个配置组，以用满它的 8 vCPU 运行器而不增加机器数量，auto-reply 以三个平衡工作器运行，而不是六个很小的工作器，而 agentic gateway/plugin 配置则分布在现有的仅源码 agentic Node 作业中，而不是等待已构建构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它的瓶颈在于导入/调度，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片拖尾。`check-additional` 将 package-boundary 的编译/canary 工作放在一起，并将其与运行时拓扑 gateway/架构工作分开；边界守卫分片会在一个作业内部并发运行其较小且彼此独立的守卫，而 gateway watch 回归使用最小的 `gatewayWatch` 构建配置，而不是重建完整的 CI 构建产物 sidecar 集合。
`extension-fast` 仅在 PR 上运行，因为 push 已经会执行完整的内置插件分片。这样可以在评审时为已变更插件提供反馈，同时避免在 `main` 上额外占用一台 Blacksmith 运行器去覆盖 `checks-node-extensions` 已经包含的内容。

当同一 PR 或 `main` 引用上有新的推送到来时，GitHub 可能会把已被替代的作业标记为 `cancelled`。除非同一引用上的最新一次运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键带有版本号（`CI-v6-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余构建产物消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 带来的成本高于节省；install-smoke 的 Docker 构建，在这里 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed   # 智能本地门控：按边界通道运行变更范围内的类型检查/lint/测试
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
pnpm build          # 当 CI 构建产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢作业
```
