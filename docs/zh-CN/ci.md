---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-24T05:02:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e24efec145ff144b007e248ef0f9c56287619eb9af204d45d49984909a6136b
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在仅更改了无关区域时跳过昂贵的作业。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并且也可手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出执行。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布审批前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复项的手动工作流。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 是否已合并，并检查每个重复 PR 是否具有共享的引用 issue，或存在重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的更改保持一致。它没有纯定时调度：`main` 上一次成功的、非机器人触发的推送 CI 运行可以触发它，手动触发也可以直接运行它。工作流运行触发的调用会在 `main` 已继续前进，或者过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时运行一次即可覆盖自上次文档处理以来累计到 `main` 的所有更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：`main` 上一次成功的、非机器人触发的推送 CI 运行可以触发它，但如果当天 UTC 已经有另一个由工作流运行触发的调用已经运行或正在运行，它就会跳过。手动触发会绕过这个按天限制的活动门控。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只做小范围且不降低覆盖率的测试性能修复，而不是进行大规模重构，然后重新运行完整测试套件报告，并拒绝任何导致通过基线测试数量下降的更改。如果基线中已有失败测试，Codex 只能修复明显的失败项，并且代理运行后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅更改了文档、已更改范围、已更改扩展，并构建 CI 清单 | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit` | 针对 npm 漏洞公告执行无依赖的生产锁文件审计 | 始终在非草稿推送和 PR 上运行 |
| `security-fast` | 快速安全作业所需的聚合作业 | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查以及可复用的下游产物 | Node 相关更改 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | Node 相关更改 |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果 | Node 相关更改 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | Node 相关更改 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道 | Node 相关更改 |
| `extension-fast` | 仅针对已更改内置插件的聚焦测试 | 包含扩展更改的拉取请求 |
| `check` | 分片后的主要本地门控对应项：生产类型、lint、守卫、测试类型和严格 smoke | Node 相关更改 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | Node 相关更改 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | Node 相关更改 |
| `checks` | 已构建产物渠道测试的验证器，以及仅推送时运行的 Node 22 兼容性检查 | Node 相关更改 |
| `check-docs` | 文档格式化、lint 和断链检查 | 文档已更改 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | Python Skill 相关更改 |
| `checks-windows` | Windows 特定测试通道 | Windows 相关更改 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | macOS 相关更改 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | macOS 相关更改 |
| `android` | 两种风味的 Android 单元测试，以及一个 debug APK 构建 | Android 相关更改 |
| `test-performance-agent` | 在受信任活动之后每日运行的 Codex 慢测试优化 | `main` CI 成功后或手动触发 |

## 快速失败顺序

作业的排序方式是：让廉价检查先失败，再决定是否运行昂贵作业：

1. `preflight` 决定哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者就能在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后扇出执行：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 运行的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但不会仅因为工作流本身的更改就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源码更改进行范围控制。
Windows Node 检查的范围仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、安装 smoke 和纯测试更改仍然保留在 Linux Node 通道中，因此不会为了已经由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会对 Docker/包表面、内置插件包/清单更改，以及 Docker smoke 作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码级的内置插件更改、纯测试编辑和纯文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行容器 gateway-network e2e，验证一个内置扩展构建参数，并在 120 秒命令超时限制下运行有界的内置插件 Docker 配置。完整路径会保留 QR 包安装以及安装器 Docker/更新覆盖，用于每晚定时运行、手动触发、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的拉取请求。对 `main` 的推送，包括合并提交，不会强制走完整路径；当 changed-scope 逻辑会在推送时请求完整覆盖时，该工作流仍只保留快速 Docker smoke，并将完整安装 smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在每晚调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 并行运行 live/E2E smoke 通道；默认主池并发数为 8，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整，对提供商敏感的尾池并发数也为 8，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。本地聚合默认会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。可复用的 live/E2E 工作流也采用共享镜像模式：先在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。定时的 live/E2E 工作流会每天运行完整的发布路径 Docker 套件。完整的内置更新/渠道矩阵仍然保留为手动/完整套件，因为它会重复执行真实的 npm 更新和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：核心生产更改会运行核心生产类型检查以及核心测试，核心纯测试更改只运行核心测试类型检查/测试，扩展生产更改会运行扩展生产类型检查以及扩展测试，而扩展纯测试更改只运行扩展测试类型检查/测试。公共插件 SDK 或 plugin-contract 更改会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本提升会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置更改会以安全优先方式退回到所有通道。

在推送时，`checks` 矩阵会添加仅推送时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会继续聚焦于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以便让每个作业都保持较小规模，同时避免过度占用 runner：渠道契约以三个加权分片运行，内置插件测试在六个扩展 worker 之间平衡分配，小型核心单元通道会成对组合，auto-reply 以三个平衡 worker 运行而不是六个很小的 worker，而 agentic Gateway 网关/插件配置会分散到现有仅源码的 agentic Node 作业中，而不是等待已构建产物。大范围的浏览器、QA、媒体以及杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业会以一个 Vitest worker 和更大的 Node 堆内存串行运行插件配置组，这样导入密集型的插件批次就不会让小型 CI runner 过度提交。宽范围的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度支配，而不是被某个单独的慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。`check-additional` 会把 package-boundary 的编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型且彼此独立的守卫。Gateway 网关 watch、渠道测试以及核心 support-boundary 分片会在 `build-artifacts` 中于 `dist/` 和 `dist-runtime/` 已构建完成后并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免额外占用两个 Blacksmith worker，以及避免出现第二个产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有独立的 source set 或 manifest；它的单元测试通道仍然会在启用 SMS/通话记录 BuildConfig 标志的情况下编译该 flavor，同时避免在每次 Android 相关推送时重复执行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为推送运行已经会执行完整的内置插件分片。这样可以在评审时提供已变更插件的反馈，同时避免在 `main` 上为了 `checks-node-extensions` 已经覆盖的内容而额外占用一个 Blacksmith worker。

当同一 PR 或 `main` 引用上有新的推送落地时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败了，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被替代后不会继续排队。
CI 并发键已版本化（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就无法无限期阻塞更新的 main 运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，在这里 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地对应项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道运行变更相关的类型检查/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
