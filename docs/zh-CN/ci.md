---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T00:42:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13e07b90028ee0e4ca8067fbbcfd80368ee79dbf69ae8eca595a051660215c21
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域控制，在只有不相关区域发生变更时跳过昂贵作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能作用域，并展开完整的 CI 作业图，用于候选发布或大范围验证。

QA Lab 在主智能作用域工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认以 dry-run 方式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并且每个重复 PR 都具有共享的引用 issue，或者存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时调度：在 `main` 上一次成功的非机器人推送 CI 运行可以触发它，手动触发也可以直接运行它。由 workflow-run 触发的调用会在 `main` 已继续前进，或过去一小时内已经创建了另一个未跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时的一次运行可以覆盖自上次文档处理以来积累的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：在 `main` 上一次成功的非机器人推送 CI 运行可以触发它，但如果当天 UTC 已经有另一个由 workflow-run 触发的调用运行过或正在运行，它就会跳过。手动触发会绕过这个每日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围且不降低覆盖率的测试性能修复，而不是进行大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显的失败，并且智能体处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅文档变更、变更作用域、变更的扩展，并构建 CI 清单 | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit` | 针对 npm advisory 的无依赖生产 lockfile 审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `check` | 主本地门禁等效项的分片版本：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和 smoke 通道 | 手动触发的发布 CI |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动后每日运行的 Codex 慢测试优化 | 主 CI 成功后或手动触发 |

手动触发的 CI 运行与普通 CI 使用相同的作业图，但会强制开启所有受作用域控制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此候选发布的完整测试套件不会因为同一 ref 上的另一次 push 或 PR 运行而被取消。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
```

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，因此下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得像每个受作用域控制的区域都已发生变更。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些改动就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只受平台源码变更控制。
仅涉及 CI 路由的编辑、部分廉价的核心测试 fixture 编辑，以及范围很窄的插件契约辅助函数 / 测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和附加守卫矩阵，前提是变更文件仅限于快速任务可直接覆盖的路由或辅助函数表面。
Windows Node 检查仅作用于 Windows 专用的进程 / 路径封装、npm/pnpm/UI 运行器辅助函数、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试改动仍保留在 Linux Node 通道中，这样它们就不会为已被常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows runner。
单独的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一个作用域脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包表面、内置插件包 / manifest 变更，以及 Docker smoke 作业所覆盖的核心插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在 240 秒的总命令超时内运行有界的内置插件 Docker 配置文件，同时每个场景的 Docker 运行都有单独的上限。完整路径会为夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求保留 QR 包安装和 installer Docker/update 覆盖。推送到 `main`，包括合并提交，不会强制完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，工作流仍会保留快速 Docker smoke，并将完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由单独的 `run_bun_global_install_smoke` 门禁控制；它会在夜间调度和发布检查工作流中运行，手动触发 `install-smoke` 也可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试保留各自专注于安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个裸 Node/Git runner，用于 installer/update/plugin-dependency 通道；另一个功能型镜像，将相同的 tarball 安装到 `/app` 中，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行各通道；可用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池 10 个槽位，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider-sensitive 尾池默认 10 个槽位。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会过度占用 Docker，同时较轻的通道仍能填满可用槽位。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker 守护进程出现 create 风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先对 Docker 做 preflight，移除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以用于最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的回退超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布使用的通道，例如 `install-e2e`，以及拆分后的内置更新通道，例如 `bundled-channel-update-acpx`，同时跳过清理 smoke，以便智能体复现单个失败通道。可复用的实时 / E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、实时镜像、通道和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，验证 tarball 清单，当计划需要 install/update/plugin-dependency 通道时构建并推送一个带 SHA 标签的裸 GHCR Docker E2E 镜像；当计划需要 package-installed 功能通道时，构建一个带 SHA 标签的功能型 GHCR Docker E2E 镜像；如果任一带 SHA 标签的镜像已存在，工作流会跳过该镜像的重建，但仍会创建针对性重跑所需的新 tarball 工件。发布路径 Docker 套件最多会以三个分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON，以及每个通道的重跑命令。工作流输入 `docker_lanes` 会针对准备好的镜像运行选定通道，而不是运行三个分块作业，这样失败通道的调试就能被限制在一个目标 Docker 作业内，并为选定 ref 准备一个新的 npm tarball；如果选定通道是实时 Docker 通道，则该目标作业会为该次重跑在本地构建实时测试镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 某次运行中下载 Docker 工件，并输出合并后的 / 每个通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。当发布路径套件请求 Open WebUI 时，它会在 plugins/integrations 分块中运行，而不是额外占用第四个 Docker worker；只有 openwebui-only 调度时，Open WebUI 才保留独立作业。定时的实时 / E2E 工作流每天都会运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor repair 过程可以与其他内置检查一起分片执行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界方面比广义的 CI 平台作用域更严格：核心生产变更会运行核心生产和核心测试 typecheck，以及核心 lint/guards；核心仅测试变更只运行核心测试 typecheck 加核心 lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展仅测试变更会运行扩展测试 typecheck 加扩展 lint。公共插件 SDK 或 plugin-contract 变更会扩展到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展全量扫描属于显式测试工作。仅发布元数据的版本号更新会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式退回到所有检查通道。

手动触发的 CI 运行会将 `checks-node-compat-node22` 作为候选发布兼容性覆盖来运行。普通拉取请求和 `main` 推送会跳过该通道，并让矩阵聚焦于 Node 24 测试 / 渠道通道。

最慢的 Node 测试家族会被拆分或做负载均衡，以便每个作业都尽量小且不会过度占用 runner：渠道契约分为三个加权分片，内置插件测试在六个扩展 worker 之间均衡，小型核心单元通道会成对组合，自动回复会分为四个均衡 worker，其中回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关 / 插件配置会分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组使用一个 Vitest worker，并配置更大的 Node heap，以便导入密集型插件批次不会产生额外的 CI 作业。宽泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度开销主导，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部长耗时。包含模式分片会使用 CI 分片名记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将包边界 compile/canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；边界守卫分片会在一个作业内并发运行其较小且相互独立的守卫。Gateway watch、渠道测试以及核心 support-boundary 分片会在 `build-artifacts` 中并发运行，此时 `dist/` 和 `dist-runtime/` 已经构建完成，这样既保留了它们原有的检查名称作为轻量验证器作业，又避免了额外两个 Blacksmith worker 和第二个工件消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；其单元测试通道仍会使用 SMS/通话日志 BuildConfig 标志来编译该 flavor，同时避免在每次与 Android 相关的推送上重复执行 debug APK 打包作业。
当同一个 PR 或 `main` ref 上有新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已被替代后不会继续排队。
自动 CI 并发键是带版本的（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，该作业对 CPU 仍足够敏感，以至于 8 vCPU 的成本高于节省的时间；install-smoke Docker 构建也是如此，其中 32 vCPU 的排队时间成本高于其带来的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道运行变更的 typecheck/lint/guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 廉价的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 构建产物 / build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
