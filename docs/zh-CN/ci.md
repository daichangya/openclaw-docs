---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或者为什么没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T19:12:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 200ba554de3a82826b3bd1709455dc4709e03e3f994f821a7590b7337215babd
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每次拉取请求时运行。它使用智能范围控制，在只改动了无关区域时跳过高开销作业。

## 作业概览

| 作业                             | 用途                                                                                         | 运行时机                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| `preflight`                      | 检测是否仅有文档改动、改动范围、已改动的扩展，并构建 CI 清单                                 | 所有非草稿推送和 PR 都会运行     |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                      | 所有非草稿推送和 PR 都会运行     |
| `security-dependency-audit`      | 针对 npm 公告执行无依赖的生产锁文件审计                                                     | 所有非草稿推送和 PR 都会运行     |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                  | 所有非草稿推送和 PR 都会运行     |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的制品                               | 与 Node 相关的改动               |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置 / plugin-contract / 协议检查                                | 与 Node 相关的改动               |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并带有稳定的聚合检查结果                                                | 与 Node 相关的改动               |
| `checks-node-extensions`         | 针对整个扩展套件的完整内置插件测试分片                                                      | 与 Node 相关的改动               |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道                                        | 与 Node 相关的改动               |
| `extension-fast`                 | 仅针对已改动内置插件的聚焦测试                                                              | 检测到扩展改动时                 |
| `check`                          | 分片的主本地门控等价项：生产类型、lint、守卫、测试类型和严格冒烟测试                        | 与 Node 相关的改动               |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片                                     | 与 Node 相关的改动               |
| `build-smoke`                    | 已构建 CLI 的冒烟测试和启动内存冒烟测试                                                     | 与 Node 相关的改动               |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试，以及仅在 push 时运行的 Node 22 兼容性检查                 | 与 Node 相关的改动               |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                                  | 文档发生改动时                   |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                | 与 Python Skills 相关的改动      |
| `checks-windows`                 | Windows 专用测试通道                                                                         | 与 Windows 相关的改动            |
| `macos-node`                     | 使用共享构建制品的 macOS TypeScript 测试通道                                                | 与 macOS 相关的改动              |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的改动              |
| `android`                        | Android 构建和测试矩阵                                                                       | 与 Android 相关的改动            |

## 快速失败顺序

作业的排列顺序经过设计，让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的制品和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者一旦共享构建就绪即可开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但不会仅因这些编辑就强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只在对应平台源码改动时运行。
Windows Node 检查的范围仅限于运行时、包、配置和工作流表面；仅测试改动会继续留在 Linux Node 通道中，这样它们不会为已由常规测试分片覆盖的内容占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一份范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装冒烟测试只会在安装、打包和容器相关改动时运行。它的 QR 包冒烟测试会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍然能覆盖安装流程，而不会在每次运行时都重新下载依赖。它的 gateway-network e2e 会复用该作业前面已构建好的运行时镜像，因此在不增加额外 Docker 构建的前提下，增加了真实的容器到容器 WebSocket 覆盖。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比 CI 的宽泛平台范围更严格：核心生产改动会运行核心生产类型检查加核心测试，核心仅测试改动只运行核心测试类型检查 / 测试，扩展生产改动会运行扩展生产类型检查加扩展测试，而扩展仅测试改动只运行扩展测试类型检查 / 测试。公共插件 SDK 或 plugin-contract 改动会扩大为扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本升级会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置改动会以安全优先的方式落到所有通道。

在 push 上，`checks` 矩阵会加入仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵会继续聚焦于常规测试 / 渠道通道。

最慢的 Node 测试族已被拆分或平衡，以便每个作业都保持较小：渠道契约将 registry 和核心覆盖分别拆成 8 个带权分片，auto-reply 回复测试按前缀组拆分，而 agentic gateway / 插件配置会分散到现有仅源码的 agentic Node 作业中，而不是等待已构建制品。`check-additional` 会把包边界编译 / 金丝雀工作放在一起，并把它与运行时拓扑 gateway / 架构工作分开；边界守卫分片会在一个作业内并发运行其体量较小且彼此独立的守卫，而 gateway watch 回归测试使用最小化的 `gatewayWatch` 构建配置，而不是重新构建整套 CI 制品 sidecar 集合。

当同一个 PR 或 `main` 引用上有新的推送到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则请把这视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被替代后不会继续排队。
CI 并发键已做版本化（`CI-v3-*`），因此 GitHub 端旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片与聚合项、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余使用已构建制品的消费者、`android`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                    |

## 本地等价项

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地 changed-lane 分类结果
pnpm check:changed   # 智能本地门控：按边界通道运行改动范围内的类型检查 / lint / 测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同的门控，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 断链检查
pnpm build          # 当 CI 制品 / build-smoke 通道相关时，构建 dist
```
