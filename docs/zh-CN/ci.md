---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门控，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-26T23:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e327836428668034714c3b2dcc880dd1da37426cefd1ef7956101253193f811c
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域划分，在仅有不相关区域发生变更时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能作用域划分，并展开完整的 CI 作业图，用于候选发布版本或大范围验证。

QA Lab 在主智能作用域工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic pack。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并在手动分发时运行；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并且每个重复 PR 都具有共享的引用 issue 或重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的变更保持一致。它没有纯定时调度：`main` 上一次成功的非机器人 push CI 运行可以触发它，手动分发也可以直接运行它。workflow-run 调用会在 `main` 已继续前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行即可覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个面向慢测试的事件驱动 Codex 维护通道。它没有纯定时调度：`main` 上一次成功的非机器人 push CI 运行可以触发它，但如果同一个 UTC 日已有另一条 workflow-run 调用已运行或正在运行，它就会跳过。手动分发会绕过这一每日活动门控。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围、保持覆盖率不变的测试性能修复，而不是大规模重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显的失败项，并且变更后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更作用域、变更的扩展，并构建 CI 清单 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisory 执行无依赖的生产 lockfile 审计 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置插件、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的内置插件执行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门控对应项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器，以及仅 push 的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后进行的每日 Codex 慢测试优化 | Main CI 成功后或手动分发 |

手动 CI 分发会运行与常规 CI 相同的作业图，但会强制开启所有按作用域划分的通道：Linux Node 分片、内置插件分片、渠道契约、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。它们不会运行仅限 PR 的 `extension-fast` 通道，因为完整的内置插件分片矩阵已经覆盖了内置插件测试。手动运行使用唯一的并发组，因此候选发布版本的完整套件不会被同一 ref 上的其他 push 或 PR 运行取消。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
```

## 快速失败顺序

作业的排序方式是让低成本检查先于高成本作业失败：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游使用方一旦共享构建就绪即可开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过 changed-scope 检测，并使 preflight 清单表现得像每个作用域区域都发生了变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因为这些更改就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然仅根据平台源代码变更来决定是否运行。

仅涉及 CI 路由的编辑、选定的低成本 core-test fixture 编辑，以及范围很窄的插件契约辅助函数 / 测试路由编辑，会走快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前变更文件仅限于该快速任务可直接覆盖的路由或辅助表面时，这一路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及附加守卫矩阵。

Windows Node 检查的作用域仅限于 Windows 专用的进程 / 路径包装器、npm / pnpm / UI runner 辅助函数、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源代码、插件、install-smoke 和纯测试变更会继续留在 Linux Node 通道上，这样它们就不会为正常测试分片已覆盖的内容额外占用一个 16-vCPU 的 Windows worker。

独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个作用域脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / package 表面、内置插件 package / manifest 变更，以及 Docker smoke 作业会覆盖到的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码级的内置插件变更、纯测试编辑和纯文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行 container gateway-network e2e，验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行受限的内置插件 Docker profile，同时每个场景的 Docker 运行也分别受到上限控制。完整路径则为每晚定时运行、手动分发、workflow-call 发布检查，以及确实触及 installer / package / Docker 表面的拉取请求保留 QR package 安装和 installer Docker / update 覆盖。推送到 `main`，包括 merge commit，不会强制完整路径；当 changed-scope 逻辑在 push 上请求完整覆盖时，工作流仍会保留快速 Docker smoke，而将完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在夜间调度和发布检查工作流中运行，手动 `install-smoke` 分发也可以选择启用它，但拉取请求和 `main` push 不会运行它。QR 和 installer Docker 测试保留它们各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个裸 Node / Git runner，用于 installer / update / plugin-dependency 通道；另一个是功能型镜像，它会将同一个 tarball 安装到 `/app` 中，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而 runner 只执行所选计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行各通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对提供商敏感的尾池槽位数也默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以便 npm install 和多服务通道不会过度占用 Docker，而较轻的通道仍能填满可用槽位。默认情况下，各通道启动之间会错开 2 秒，以避免本地 Docker daemon 出现 create storm；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。这个本地聚合预检会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活跃通道状态、持久化通道耗时以支持“最长优先”排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以便检查调度器。默认情况下，它会在首次失败后停止为新的池化通道继续调度，并且每个通道都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live / tail 通道会使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布使用的通道，如 `install-e2e`，以及拆分的内置更新通道，如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体能够复现某个失败通道。可复用的 live / E2E 工作流会通过 `scripts/test-docker-all.mjs --plan-json` 询问需要哪些 package、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub outputs 和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，校验 tarball 清单，并在计划需要 install / update / plugin-dependency 通道时构建并推送一个带 SHA 标签的 bare GHCR Docker E2E 镜像；当计划需要 package-installed 功能通道时，则构建一个带 SHA 标签的 functional GHCR Docker E2E 镜像；如果任一带 SHA 标签的镜像已经存在，工作流会跳过重建该镜像，但仍会创建目标重跑所需的新 tarball artifact。发布路径 Docker 套件最多以三个分块作业运行，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只会拉取它所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`，`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包括通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON，以及每通道重跑命令。工作流输入 `docker_lanes` 会针对已准备好的镜像运行所选通道，而不是运行那三个分块作业，这样就能将失败通道调试限制在一个有针对性的 Docker 作业内，并为所选 ref 准备一个新的 npm tarball；如果所选通道是 live Docker 通道，则该定向作业会为此次重跑在本地构建 live-test 镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 某次运行下载 Docker artifact，并输出合并后的 / 每通道定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。当发布路径套件请求 Open WebUI 时，它会在 plugins / integrations 分块中运行，而不是额外占用第四个 Docker worker；只有 openwebui-only 分发时，Open WebUI 才保留独立作业。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor repair 过程可以与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。与宽泛的 CI 平台作用域相比，这一本地检查门控对架构边界更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint / guards；core 纯测试变更只会运行 core 测试 typecheck 加 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展纯测试变更会运行扩展测试 typecheck 加扩展 lint。公开的插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展全量扫描属于显式测试工作。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式落到所有检查通道。

在 push 上，`checks` 矩阵会添加仅 push 的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会聚焦于常规测试 / 渠道通道。

最慢的 Node 测试族会被拆分或平衡，以便每个作业都保持较小规模而不会过度占用 runner：渠道契约会作为三个加权分片运行，内置插件测试会在六个扩展 worker 之间平衡，小型 core 单元通道会成对组合，auto-reply 会以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 以及 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。宽范围的浏览器、QA、媒体和杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组只用一个 Vitest worker，并配备更大的 Node heap，这样导入密集型插件批次就不会额外制造更多 CI 作业。宽范围的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自拖尾。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 会将 package-boundary compile / canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行，从而在保留它们旧检查名称作为轻量验证作业的同时，避免额外占用两个 Blacksmith worker 和第二条 artifact consumer 队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS / call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。

`extension-fast` 仅限 PR，因为 push 运行已经执行完整的内置插件分片。这样既能为评审提供已变更插件的反馈，又不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` ref 上有更新的 push 到来时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已被更新运行取代后不会再排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵就能更早进入队列 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于它节省的成本；install-smoke Docker 构建，在这里 32-vCPU 的排队时间成本高于它节省的成本 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地对应项

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界通道执行变更 typecheck/lint/guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门控，但带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI artifact / build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
