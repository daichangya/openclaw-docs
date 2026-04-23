---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T22:14:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2aa581f173b7171373a9292cef3da20621b845d81a8550bd8b4c8e743d27a4b
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 和每个拉取请求时运行。它使用智能范围界定，在只改动了无关区域时跳过昂贵的作业。

QA Lab 在主智能范围工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道并行展开为多个作业。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认是 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已经合并，并确认每个重复 PR 要么共享一个被引用的问题，要么具有重叠的修改 hunk。

`Test Performance Agent` 工作流是一个面向慢测试的事件驱动 Codex 维护通道。它没有单纯的定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一个由 workflow-run 触发的实例运行过或正在运行，它就会跳过。手动触发会绕过这个按天活动门禁。该通道会构建一个全量测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率不变的测试性能修复，而不是做大范围重构，然后重新运行全量测试套件报告，并拒绝任何会降低通过基线测试数量的改动。如果基线中存在失败测试，Codex 只能修复明显的失败项，而且在提交任何内容之前，智能体处理后的全量测试套件报告必须通过。当 `main` 在机器人 push 落地之前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试 push；有冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与文档智能体保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| Job                              | 目的                                                                                      | 运行时机                         |
| -------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| `preflight`                      | 检测是否仅为文档改动、改动范围、改动的扩展，并构建 CI 清单                               | 始终在非 draft 的 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                   | 始终在非 draft 的 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 安全公告执行无依赖的生产 lockfile 审计                                          | 始终在非 draft 的 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                               | 始终在非 draft 的 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物                           | 与 Node 相关的变更               |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                        | 与 Node 相关的变更               |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                             | 与 Node 相关的变更               |
| `checks-node-extensions`         | 覆盖整个扩展套件的完整内置插件测试分片                                                   | 与 Node 相关的变更               |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道                                     | 与 Node 相关的变更               |
| `extension-fast`                 | 仅针对已改动的内置插件运行聚焦测试                                                       | 具有扩展改动的拉取请求           |
| `check`                          | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke                     | 与 Node 相关的变更               |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片                                    | 与 Node 相关的变更               |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                 | 与 Node 相关的变更               |
| `checks`                         | 针对已构建产物的渠道测试验证器，以及仅 push 触发的 Node 22 兼容性检查                    | 与 Node 相关的变更               |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                 | 文档发生改动                     |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                             | 与 Python Skills 相关的变更      |
| `checks-windows`                 | Windows 专用测试通道                                                                      | 与 Windows 相关的变更            |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                             | 与 macOS 相关的变更              |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                       | 与 macOS 相关的变更              |
| `android`                        | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建                                 | 与 Android 相关的变更            |
| `test-performance-agent`         | 在可信活动之后执行的每日 Codex 慢测试优化                                                | `main` CI 成功后或手动触发       |

## 快速失败顺序

作业的排序方式是让便宜的检查先失败，再决定是否运行昂贵作业：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物与平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者一旦共享构建就绪即可开始。
4. 更重的平台和运行时通道会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但不会仅凭这些改动就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源码变更生效。
Windows Node 检查的范围只覆盖 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、安装 smoke 和纯测试改动会保留在 Linux Node 通道中，这样就不会为了已经由常规测试分片覆盖的内容去占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过其自己的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 会在安装、打包、容器相关变更、内置扩展生产代码变更，以及 Docker smoke 作业实际覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面发生改动时运行。纯测试和纯文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制 Docker 的 `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍然可以验证安装流程，而无需每次运行都重新下载依赖。它的 gateway-network e2e 会复用该作业中先前构建的运行时镜像，因此在不新增一次 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。默认情况下，本地聚合器会在首次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后独占运行。可复用的 live/E2E 工作流也遵循同样的共享镜像模式：在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在矩阵中通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。计划执行的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。QR 和安装器 Docker 测试保留各自专注于安装的 Dockerfile。另有一个单独的 `docker-e2e-fast` 作业，会在 120 秒命令超时限制下运行有界的内置插件 Docker 配置：setup-entry 依赖修复加上合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍然是手动/全量套件，因为它会反复执行真实的 npm update 和 doctor repair 流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产 typecheck 加核心测试，核心纯测试变更只运行核心测试 typecheck/测试，扩展生产代码变更会运行扩展生产 typecheck 加扩展测试，而扩展纯测试变更只运行扩展测试 typecheck/测试。公共插件 SDK 或插件契约变更会扩展为扩展验证，因为扩展依赖这些核心契约。仅有发布元数据的版本号提升会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会采用安全失败策略，运行所有通道。

在 push 上，`checks` 矩阵会加入仅在 push 上运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会专注于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小规模，同时不过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个扩展 worker 之间平衡分配，小型核心单元通道会成对组合，auto-reply 使用三个平衡 worker 而不是六个很小的 worker，而智能体式 Gateway 网关/插件配置会分散到现有的仅源码智能体式 Node 作业中，而不是等待已构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业会以串行方式运行插件配置组，使用一个 Vitest worker 和更大的 Node 堆，以避免导入密集型插件批次让小型 CI runner 过度提交。宽泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它受导入/调度主导，而不是由某个单一慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担尾部耗时。`check-additional` 会将包边界 compile/canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内部并发运行其小型独立守卫。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内部并发运行；这样既保留了它们原有的检查名称作为轻量验证器作业，又避免了额外两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的源码集或 manifest；它的单元测试通道仍会使用 SMS/call-log `BuildConfig` 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。

`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的内置插件分片。这样既能为评审保留已改动插件的反馈，又不会在 `main` 上额外占用一个 Blacksmith worker 去重复 `checks-node-extensions` 中已经存在的覆盖。

当同一个 PR 或 `main` 引用上有更新的 push 到来时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败了，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。

CI 并发键采用带版本号的形式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片的渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，在那里 32 vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同样的门禁，但带有每阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近 10 次成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
