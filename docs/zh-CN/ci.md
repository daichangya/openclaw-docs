---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T17:43:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a59adfb2c9b8c0bed3c2b72a7f76387c67dee21190f0294efdce6e3672781ff
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在只改动了不相关区域时跳过昂贵作业。

## 作业概览

| 作业                              | 用途                                                                                      | 运行时机                           |
| --------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测是否仅改动文档、改动范围、改动的扩展，并构建 CI 清单                                  | 所有非草稿推送和 PR 都会运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                   | 所有非草稿推送和 PR 都会运行       |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产 lockfile 审计                                       | 所有非草稿推送和 PR 都会运行       |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                               | 所有非草稿推送和 PR 都会运行       |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的制品                              | 与 Node 相关的改动                 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                        | 与 Node 相关的改动                 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                             | 与 Node 相关的改动                 |
| `checks-node-extensions`         | 针对整个扩展套件运行完整的内置插件测试分片                                               | 与 Node 相关的改动                 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和扩展通道                                     | 与 Node 相关的改动                 |
| `extension-fast`                 | 仅针对改动过的内置插件运行聚焦测试                                                       | 检测到扩展改动时                   |
| `check`                          | 分片后的主本地门禁对应项：生产类型、lint、防护、测试类型，以及严格 smoke                  | 与 Node 相关的改动                 |
| `check-additional`               | 架构、边界、扩展表面防护、package 边界，以及 gateway-watch 分片                           | 与 Node 相关的改动                 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                 | 与 Node 相关的改动                 |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试，以及仅在 push 时运行的 Node 22 兼容性                  | 与 Node 相关的改动                 |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                | 文档有改动                         |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                               | 与 Python Skills 相关的改动        |
| `checks-windows`                 | Windows 专用测试通道                                                                     | 与 Windows 相关的改动              |
| `macos-node`                     | 使用共享已构建制品的 macOS TypeScript 测试通道                                           | 与 macOS 相关的改动                |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                      | 与 macOS 相关的改动                |
| `android`                        | Android 构建和测试矩阵                                                                   | 与 Android 相关的改动              |

## 快速失败顺序

作业的排序方式确保便宜的检查会在昂贵作业运行前先失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的制品和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者一旦共享构建准备好就能开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只会在平台源码改动时运行。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 只会在安装、打包和容器相关改动时运行。它的 QR package smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此它仍然会实际覆盖安装流程，而不会在每次运行时都重新下载依赖。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比广义的 CI 平台范围更严格：core 生产改动会运行 core 生产 typecheck 加 core 测试，core 仅测试改动只运行 core 测试 typecheck/测试，扩展生产改动会运行扩展生产 typecheck 加扩展测试，而扩展仅测试改动只运行扩展测试 typecheck/测试。公共插件 SDK 或 plugin-contract 改动会扩大到扩展验证，因为扩展依赖这些 core 契约。仅包含发布元数据的版本提升会运行定向的版本/配置/root-dependency 检查。未知的 root/config 改动会以保守方式落到所有通道。

在 push 上，`checks` 矩阵会增加仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵会继续聚焦于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小：渠道契约将 registry 和 core 覆盖各自拆成八个加权分片，auto-reply reply 测试按前缀组拆分，而 agentic Gateway 网关/plugin 配置会分散到现有仅源码的 agentic Node 作业中，而不是等待已构建制品。`check-additional` 将 package 边界 compile/canary 工作归为一组，并把它与运行时拓扑的 gateway/architecture 工作分开；边界防护分片会在一个作业中并发运行其小型独立防护，而 gateway watch 回归使用最小化的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 制品 sidecar 集合。

当同一 PR 或 `main` 引用上有较新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键已版本化（`CI-v2-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余已构建制品消费者、`android`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省的时间                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                    |

## 本地对应项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行改动相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速防护
pnpm check:test-types
pnpm check:timed    # 相同门禁，但包含各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 制品/build-smoke 通道相关时构建 dist
```
