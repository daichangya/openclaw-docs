---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-26T20:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6a7499389b8bf366cd6a244ec935edf13a557a1bdd61bf346bba46a12db0f82
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围门控，在只有不相关区域发生变更时跳过高开销作业。

QA Lab 在主智能范围工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出执行。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布审批前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于在合并落地后清理重复 PR。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并且每个重复 PR 都具有共享的被引用 issue，或者存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时调度：在 `main` 上成功完成的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。workflow-run 调用会在 `main` 已经继续前进，或者过去一小时内已创建了另一个未被跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：在 `main` 上成功完成的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已有另一个 workflow-run 调用已经运行或正在运行，它就会跳过。手动触发会绕过这个按日活动门控。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅做小范围、保留覆盖率的测试性能修复，而不是进行大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显的失败项，并且智能体处理后的完整测试套件报告必须全部通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 用途                                                                                         | 运行时机                           |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                       | 检测是否仅有文档变更、已变更范围、已变更扩展，并构建 CI 清单                                 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast`               | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit`       | 针对 npm advisories 进行无依赖的生产 lockfile 审计                                           | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast`                   | 快速安全作业的必需聚合项                                                                     | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts`                 | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游构建产物                             | Node 相关变更                      |
| `checks-fast-core`                | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                            | Node 相关变更                      |
| `checks-fast-contracts-channels`  | 分片执行的渠道契约检查，并提供稳定的聚合检查结果                                             | Node 相关变更                      |
| `checks-node-extensions`          | 对整个扩展套件进行完整的内置插件测试分片                                                     | Node 相关变更                      |
| `checks-node-core-test`           | Core Node 测试分片，不包括渠道、内置、契约和扩展通道                                         | Node 相关变更                      |
| `extension-fast`                  | 仅针对已变更内置插件的聚焦测试                                                               | 带有扩展变更的拉取请求             |
| `check`                           | 分片执行的主要本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke                     | Node 相关变更                      |
| `check-additional`                | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片                                        | Node 相关变更                      |
| `build-smoke`                     | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | Node 相关变更                      |
| `checks`                          | 已构建产物渠道测试的验证器，以及仅在 push 上执行的 Node 22 兼容性检查                        | Node 相关变更                      |
| `check-docs`                      | 文档格式、lint 和断链检查                                                                     | 文档已变更                         |
| `skills-python`                   | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | Python Skills 相关变更             |
| `checks-windows`                  | Windows 特定测试通道                                                                          | Windows 相关变更                   |
| `macos-node`                      | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | macOS 相关变更                     |
| `macos-swift`                     | macOS 应用的 Swift lint、构建和测试                                                           | macOS 相关变更                     |
| `android`                         | 两个变体的 Android 单元测试，以及一个 debug APK 构建                                         | Android 相关变更                   |
| `test-performance-agent`          | 在可信活动之后进行的每日 Codex 慢测试优化                                                    | Main CI 成功后或手动触发           |

## 快速失败顺序

作业的排列顺序经过设计，让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行执行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后扇出执行：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些改动就强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源码变更进行范围门控。
仅涉及 CI 路由的改动、特定低成本 core-test fixture 改动，以及狭义的插件契约 helper/test-routing 改动，会走一条快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。这条路径会避免构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片以及额外的守卫矩阵，前提是变更文件仅限于快速任务能够直接覆盖的路由或 helper 表面。
Windows Node 检查的范围限定在 Windows 特定的进程/路径包装器、npm/pnpm/UI runner helpers、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试改动仍然保留在 Linux Node 通道中，这样就不会为了正常测试分片已经覆盖的内容而占用 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包表面、内置插件包/manifest 变更，以及 Docker smoke 作业会覆盖到的 core 插件/渠道/Gateway 网关/插件 SDK 表面，会运行快速路径。仅源码层面的内置插件改动、仅测试改动以及仅文档改动，不会占用 Docker workers。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行 container gateway-network e2e，验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行有边界的内置插件 Docker profile，同时每个场景的 Docker run 也分别设有上限。完整路径会保留 QR 包安装以及 installer Docker/update 覆盖，用于每晚定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求。推送到 `main`，包括 merge commits，不会强制走完整路径；当 changed-scope 逻辑在 push 上本来会请求完整覆盖时，工作流仍只保留快速 Docker smoke，而将完整 install smoke 留给夜间任务或发布验证。较慢的 Bun global install image-provider smoke 由单独的 `run_bun_global_install_smoke` 门控；它会在夜间调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试继续保留各自专注于安装的 Dockerfiles。本地 `test:docker:all` 会预先构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后使用加权调度器和 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 live/E2E smoke 通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 更敏感的尾池槽位数默认也为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm install 和多服务通道让 Docker 过度提交，同时较轻的通道仍能填满可用槽位。默认每个通道启动会错开 2 秒，以避免本地 Docker daemon 出现 create storm；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合器会先检查 Docker、移除过期的 OpenClaw E2E 容器、输出活跃通道状态、持久化通道耗时以支持最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 来检查调度器。默认情况下，它会在首次失败后停止为池化通道继续调度新任务；每个通道还有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分 live/tail 通道使用更严格的单通道上限。可复用的 live/E2E 工作流会构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后以最多三个分块作业运行发布路径 Docker 套件，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只需拉取一次共享镜像并执行多个通道。当发布路径套件请求 Open WebUI 时，它会在 plugins/integrations 分块内运行，而不是单独占用第四个 Docker worker；只有在 openwebui-only 手动触发时，Open WebUI 才会保留独立作业。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，这样重复的 npm update 和 doctor repair 过程就可以与其他内置检查一起分片。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界上比宽泛的 CI 平台范围更严格：core 生产改动会运行 core 生产 typecheck 加 core 测试，core 仅测试改动只运行 core 测试 typecheck/测试，扩展生产改动会运行扩展生产 typecheck 加扩展测试，而扩展仅测试改动只运行扩展测试 typecheck/测试。公开的插件 SDK 或插件契约改动会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行定向的版本/配置/root-dependency 检查。未知的根目录/配置改动会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加一个仅 push 执行的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵会专注于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或重新均衡，以便每个作业都保持较小规模，同时避免过度预留 runners：渠道契约按权重分成三个分片，内置插件测试在六个扩展 workers 之间均衡，小型 core 单元通道会两两配对，auto-reply 使用四个均衡 workers，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置则分布到现有仅源码的 agentic Node 作业中，而不是等待构建产物。广义的 browser、QA、media 和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组使用一个 Vitest worker，并分配更大的 Node 堆，这样以 import 为主的重型插件批次就不会额外制造更多 CI 作业。广义 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受 import/调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担尾部耗时。基于 include-pattern 的分片会使用 CI 分片名记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和某个过滤后的分片。`check-additional` 会把 package-boundary 的 compile/canary 工作放在一起，并把运行时拓扑架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试和 core support-boundary 分片会在 `build-artifacts` 内部并发运行，此时 `dist/` 和 `dist-runtime/` 已经构建完成，从而保留它们原有的检查名称作为轻量验证器作业，同时避免额外占用两个 Blacksmith workers 和第二条构建产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方变体没有单独的源码集或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该变体，同时避免在每次 Android 相关 push 上重复进行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的内置插件分片。这样既能为代码评审提供已变更插件的反馈，又不会在 `main` 上额外占用 Blacksmith worker 去覆盖 `checks-node-extensions` 中已经存在的内容。

当同一个 PR 或 `main` 引用上有新的 push 到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但在整个工作流已经被替代后不会继续排队。
CI 并发键是带版本号的（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 `main` 运行。

## Runners

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 的成本高于其节省的收益；install-smoke Docker 构建，其中 32 vCPU 的排队时间成本高于其节省的收益                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查本地针对 origin/main...HEAD 的 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道执行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同的门控，但附带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 构建产物/build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
