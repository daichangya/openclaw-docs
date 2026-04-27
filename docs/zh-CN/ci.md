---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T03:46:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0684a38379b4ac54cf6bdb906112dffcb7053e34cae78235fa539e543439a58f
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，仅在变更涉及相关区域时才运行昂贵作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围判定，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks` 来执行安装冒烟测试、软件包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 流水线。提供已发布的软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是一个旁路运行工作流，用于验证软件包产物，而不会阻塞发布工作流。它会从以下来源解析出一个候选项：已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball 产物；然后将其上传为 `package-under-test`，再复用 Docker 发布/E2E 调度器，针对该 tarball 运行，而不是重新打包工作流检出的内容。配置档覆盖 smoke、package、product、full 以及自定义 Docker 流水线选择。可选的 Telegram 流水线仅支持已发布的 npm，并复用 `NPM Telegram Beta E2E` 工作流。

QA Lab 在主智能范围工作流之外拥有专门的 CI 流水线。`Parity gate` 工作流会在匹配的 PR 变更以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会并行展开模拟 parity gate、live Matrix 流水线和 live Telegram 流水线。live 作业使用 `qa-live-shared` environment，而 Telegram 流水线使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行同样的 QA Lab 流水线。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认是 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已经合并，并且每个重复 PR 都具有共享的引用 issue，或存在重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护流水线，用于让现有文档与最近已合并的变更保持一致。它没有纯定时计划：当 `main` 上一次成功的非机器人 push CI 运行完成后，可以触发它；也可以通过手动触发直接运行。对于由 workflow-run 触发的调用，如果 `main` 已经继续前进，或者过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行，则会跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累计的所有 `main` 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护流水线，用于处理缓慢测试。它没有纯定时计划：当 `main` 上一次成功的非机器人 push CI 运行完成后，可以触发它；但如果当天 UTC 内已有另一个由 workflow-run 触发的调用已经运行或正在运行，则会跳过。手动触发会绕过这个按日活动门控。该流水线会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围且不降低覆盖率的测试性能修复，而不是进行大范围重构；随后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的更改。如果基线本身存在失败测试，Codex 只能修复明显失败项，并且 agent 处理后的完整测试套件报告必须全部通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该流水线会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅为文档变更、已变更范围、已变更扩展，并构建 CI 清单 | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产 lockfile 审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合项 | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性流水线，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、内置插件、契约和扩展流水线 | 与 Node 相关的变更 |
| `check` | 主本地门控等效项的分片：生产类型、lint、guard、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面 guard、软件包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟流水线 | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式、lint 和坏链检查 | 文档有变更时 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试流水线 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试流水线 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后进行每日 Codex 慢测试优化 | main CI 成功后或手动触发 |

手动 CI 触发会运行与常规 CI 相同的作业图，但会强制开启所有受范围控制的流水线：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此发布候选版本的完整套件不会因为同一 ref 上的另一次 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方针对某个分支、标签或完整提交 SHA 运行该作业图，同时使用所选 dispatch ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便在昂贵作业启动前，先让便宜的检查失败：

1. `preflight` 决定到底存在哪些流水线。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 流水线并行运行，这样下游消费者就能在共享构建准备好后立刻开始。
4. 更重的平台和运行时流水线随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得像所有受范围控制的区域都发生了变化。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台流水线仍然仅在平台源代码发生变化时才运行。

仅涉及 CI 路由的编辑、选定的廉价 core-test fixture 编辑，以及狭窄的 plugin contract helper/test-routing 编辑，会走一个快速的仅 Node 清单路径：preflight、安全检查以及一个 `checks-fast-core` 任务。当前变更文件仅限于快速任务可直接覆盖的路由或 helper 表面时，这一路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及额外的 guard 矩阵。

Windows Node 检查的范围仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI runner helpers、包管理器配置，以及执行该流水线的 CI 工作流表面；无关的源代码、插件、install-smoke 和纯测试变更仍然保留在 Linux Node 流水线上，因此不会为已由常规测试分片覆盖的内容占用 16 vCPU 的 Windows runner。

单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用相同的范围脚本。它将冒烟测试覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/软件包表面、内置插件软件包/manifest 变更，以及 Docker 冒烟作业所覆盖的 core 插件/渠道/Gateway 网关/插件 SDK 表面，会运行快速路径。仅源代码的内置插件变更、纯测试编辑和纯文档编辑不会占用 Docker runner。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在 240 秒的聚合命令超时限制下运行有界的内置插件 Docker profile，其中每个场景的 Docker 运行都有单独上限。完整路径会为夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求保留 QR 软件包安装和 installer Docker/update 覆盖。`main` 推送（包括 merge commit）不会强制走完整路径；当 changed-scope 逻辑在 push 上本应请求完整覆盖时，工作流仍只保留快速 Docker smoke，而将完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试保留各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个裸 Node/Git runner，用于 installer/update/plugin-dependency 流水线；一个功能镜像，将同一个 tarball 安装到 `/app` 中，用于常规功能流水线。Docker 流水线定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而 runner 仅执行选定的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每条流水线选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行这些流水线；默认 main-pool 槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的 tail-pool 槽位数默认也为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型流水线的默认上限分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务流水线不会过度占用 Docker，而较轻的流水线仍能填满可用槽位。流水线启动默认错开 2 秒，以避免本地 Docker daemon 出现创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合器会先对 Docker 做预检，删除过期的 OpenClaw E2E 容器，输出活动流水线状态，持久化流水线耗时以支持“最长优先”排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以检查调度器。默认情况下，它会在首次失败后停止调度新的池化流水线，并且每条流水线都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 流水线使用更严格的单流水线上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 可运行精确的调度器流水线，包括仅发布时使用的流水线，如 `install-e2e`，以及拆分后的内置更新流水线，如 `bundled-channel-update-acpx`，同时会跳过 cleanup smoke，以便智能体复现某个失败流水线。可复用的 live/E2E 工作流会向 `scripts/test-docker-all.mjs --plan-json` 询问需要哪种软件包、镜像类型、live 镜像、流水线和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub outputs 和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载调用方提供的软件包产物，验证 tarball 清单，在计划需要软件包安装型流水线时构建并推送带有软件包摘要标签的 bare/functional GHCR Docker E2E 镜像，并在相同软件包摘要已准备好的情况下复用这些镜像。`Package Acceptance` 工作流是高层级的软件包门控：它会从 npm、可信 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流产物中解析出一个候选项，然后将这一个 `package-under-test` 产物传递给可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，以便当前 harness 逻辑能在不检出旧工作流代码的情况下验证较旧的可信源提交。发布检查会针对目标 ref 运行 `package` 验收 profile；该 profile 覆盖软件包/update/plugin 契约，并且是 GitHub 原生替代方案，用于覆盖大多数 Parallels 软件包/update 验证。发布路径 Docker 套件最多以三个分块作业运行，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，以便每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多条流水线（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含流水线日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON，以及每条流水线的重跑命令。工作流输入 `docker_lanes` 会让选定流水线针对已准备好的镜像运行，而不是运行三个分块作业，这样失败流水线的调试就能限制在一个有针对性的 Docker 作业中，并为该次运行准备或下载软件包产物；如果选定流水线是 live Docker 流水线，则该定向作业会为该次重跑在本地构建 live-test 镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行中下载 Docker 产物，并打印组合后的/按流水线拆分的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以获取慢流水线和阶段关键路径摘要。当发布路径套件请求 Open WebUI 时，它会在 plugins/integrations 分块内运行，而不是额外占用第四个 Docker runner；只有在 openwebui-only 触发时，Open WebUI 才保留独立作业。定时 live/E2E 工作流每天都会运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor repair 过程能够与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint/guards；core 纯测试变更仅运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展纯测试变更仅运行扩展测试 typecheck 和扩展 lint。公共插件 SDK 或 plugin-contract 变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展全量扫描仍然是显式测试工作。仅发布元数据的版本号提升会运行定向的版本/config/root-dependency 检查。未知的根目录/config 变更会以安全优先方式退回到所有检查流水线。

手动 CI 触发会运行 `checks-node-compat-node22`，作为发布候选兼容性覆盖。常规拉取请求和 `main` 推送会跳过该流水线，并让矩阵聚焦于 Node 24 测试/渠道流水线。

最慢的 Node 测试族已被拆分或平衡，因此每个作业都保持较小规模，同时避免过度占用 runner：渠道契约以三个加权分片运行，内置插件测试在六个扩展 worker 之间平衡分配，小型 core 单元流水线两两配对，自动回复以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关/插件配置则分散到现有的仅源代码 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组使用一个 Vitest worker，并分配更大的 Node 堆，以避免导入密集型插件批次产生额外的 CI 作业。广泛的 agents 流水线使用共享的 Vitest 文件级并行调度器，因为它的瓶颈在导入/调度，而不是某个单独的慢测试文件。`runtime-config` 与 infra core-runtime 分片一起运行，以防共享运行时分片成为拖尾。包含模式分片会使用 CI 分片名记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与筛选后的分片。`check-additional` 会将 package-boundary compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型独立 guard。Gateway watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行，从而保留它们原有的检查名称作为轻量验证作业，同时避免额外占用两个 Blacksmith worker 和第二条产物消费队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试流水线仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的推送上都执行重复的 debug APK 打包作业。

当同一 PR 或 `main` ref 上出现更新的推送时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。

自动 CI 并发键采用带版本号的格式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵能更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建也是如此，其中 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界流水线运行变更相关的 typecheck/lint/guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门控，但带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:changed   # 廉价的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 产物/build-smoke 流水线相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 对比最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
