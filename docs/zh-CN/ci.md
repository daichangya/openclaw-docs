---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T08:00:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 997474e178b4a9195e4a421c81bbeb0f625ded48f015bc87c4406ddb28aec912
    source_path: ci.md
    workflow: 15
---

CI 会在每次向 `main` 推送以及每个拉取请求时运行。它使用智能范围控制，在仅有不相关区域发生变更时跳过昂贵作业。手动 `workflow_dispatch` 运行会有意绕过智能范围控制，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是“发布前运行全部内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，并分发 `OpenClaw Release Checks`，用于安装冒烟测试、包验收、Docker 发布路径测试套件、实时 / E2E、OpenWebUI、QA Lab 对等验证、Matrix 和 Telegram 通道测试。提供已发布的软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是一个旁路运行工作流，用于验证软件包构件，而不会阻塞发布工作流。它会从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball 构件中解析出一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，针对该 tarball 运行，而不是重新打包工作流检出的内容。配置文件覆盖 smoke、package、product、full 和自定义 Docker 通道选择。`package` 配置文件使用离线插件覆盖，因此已发布软件包的验证不依赖实时 ClawHub 可用性。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 构件，而已发布 npm 规范路径则保留给独立分发使用。

## 包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，请使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收则通过用户在安装或更新后会实际使用的同一套 Docker E2E harness 来验证单个 tarball。

该工作流包含四个作业：

1. `resolve_package` 会检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中输出来源、工作流引用、软件包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 与 `package_artifact_name=package-under-test`。该可复用工作流会下载该构件、验证 tarball 清单、在需要时准备 package-digest Docker 镜像，并针对该软件包运行所选 Docker 通道，而不是打包工作流检出的内容。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时运行；如果 `Package Acceptance` 已解析出一个候选项，它会安装相同的 `package-under-test` 构件；独立的 Telegram 分发仍可安装已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选的 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或确切的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 的验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享构件应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流 / harness 代码。`package_ref` 是在 `source=ref` 时被打包的源码提交。这样，当前测试 harness 就可以验证较旧但受信任的源码提交，而无需运行旧的工作流逻辑。

配置文件与 Docker 覆盖的映射如下：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分片
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必须提供

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 调用 `Package Acceptance`。该配置文件是大多数 Parallels 软件包 / 更新验证在 GitHub 原生环境中的替代方案，其中 Telegram 会通过 QA 实时传输验证同一软件包构件。跨操作系统发布检查仍然覆盖特定于操作系统的新手引导、安装器和平台行为；而软件包 / 更新的产品级验证应从 `Package Acceptance` 开始。Windows 打包版和安装器全新安装通道还会验证：已安装的软件包是否可以从原始绝对 Windows 路径导入浏览器控制覆盖项。

`Package Acceptance` 对已发布软件包提供一个有界的旧版兼容窗口，截止到 `2026.4.25`，包括 `2026.4.25-beta.*`。这些兼容规则在此处记录，以防它们变成永久性的静默跳过：如果 tarball 省略了这些文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；当软件包未暴露该标志时，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可能会从 tarball 派生的伪 git 固件中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能会允许配置元数据迁移，同时仍要求安装记录以及“不重新安装”行为保持不变。`2026.4.25` 之后的软件包必须满足现代契约；相同条件届时会失败，而不是警告或跳过。

示例：

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的包验收运行时，先查看 `resolve_package` 摘要，以确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时以及重新运行命令。优先重新运行失败的软件包配置文件或精确的 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能范围工作流之外拥有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 与 Opus 4.6 智能体打包。`QA-Lab - All Lanes` 工作流会在 `main` 上按夜间计划运行，也可手动分发；它会将 mock parity gate、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道并行展开为多个作业。实时作业使用 `qa-live-shared` 环境，而 Telegram / Discord 使用 Convex 租约。对于计划任务和发布门禁，Matrix 使用 `--profile fast --fail-fast`，而 CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行关键的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复项清理。它默认执行 dry-run，且仅当 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已合并，并验证每个重复 PR 要么共享同一个被引用 issue，要么存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已合并的变更保持一致。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，手动分发也可以直接运行它。若 `main` 已继续前进，或过去一小时内已创建了另一个未被跳过的 Docs Agent 运行，则基于 workflow-run 的调用会跳过。运行时，它会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行即可覆盖自上次文档处理以来累积到 `main` 的全部变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，但如果当天 UTC 已有另一个基于 workflow-run 的调用已经运行或正在运行，它就会跳过。手动分发会绕过这一按天的活动门禁。该通道会构建一个完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小规模、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整测试套件报告，并拒绝任何导致通过基线测试数下降的变更。如果基线中有失败测试，Codex 只能修复明显失败项，并且代理运行后的完整测试套件报告必须通过，才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁进行变基，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅有文档变更、已变更的范围、已变更的扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 进行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业所需的聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游构件 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled / plugin-contract / protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `check` | 分片后的主要本地门禁等效项：生产类型、lint、防护项、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面防护、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟通道 | 用于发布的手动 CI 分发 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更时 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在受信任活动之后，每日由 Codex 执行慢测试优化 | `main` 上 CI 成功后或手动分发 |

手动 CI 分发会运行与常规 CI 相同的作业图，但会强制开启所有受范围控制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此某个发布候选版本的完整测试套件不会因为同一 ref 上的另一次 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许受信任的调用方在所选分发 ref 的工作流文件基础上，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的排列顺序经过设计，以便让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构件和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者就能在共享构建准备好后立刻开始。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发会跳过 changed-scope 检测，并让 preflight 清单表现得像所有受范围控制的区域都发生了变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然仅在对应平台源码发生变更时才会运行。

仅涉及 CI 路由的编辑、部分低成本 core-test 固件编辑，以及狭窄的插件契约辅助工具 / 测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前变更文件仅限于该快速任务可直接覆盖的路由或辅助表面时，这一路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及额外的防护矩阵。

Windows Node 检查的范围仅限于 Windows 特定的进程 / 路径包装器、npm / pnpm / UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和纯测试变更会保留在 Linux Node 通道上，这样就不会为了已被常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。

独立的 `install-smoke` 工作流也通过其自身的 `preflight` 作业复用同一个范围脚本。它将冒烟测试覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / package 表面、内置插件 package / manifest 变更，以及 Docker 冒烟作业所覆盖的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码级的内置插件变更、纯测试编辑和纯文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行 agents delete shared-workspace CLI 冒烟测试、运行 container gateway-network e2e、验证一个内置扩展 build arg，并在 240 秒的总命令超时限制内运行有界的内置插件 Docker 配置文件，同时对每个场景的 Docker 运行分别设置上限。完整路径会为夜间计划运行、手动分发、workflow-call 发布检查，以及真正触及 installer / package / Docker 表面的拉取请求保留 QR package install 和 installer Docker / update 覆盖。推送到 `main`，包括合并提交，不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，该工作流会保留快速 Docker 冒烟测试，并将完整 install smoke 留给夜间任务或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划中运行，也会从发布检查工作流中运行，手动 `install-smoke` 分发也可以选择启用，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试保留各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是裸 Node / Git 运行器，用于 installer / update / plugin-dependency 通道；另一个是功能镜像，会将同一个 tarball 安装到 `/app`，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾部池槽位数默认也是 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm install 和多服务通道过度占用 Docker，同时让较轻的通道继续填满可用槽位。单个比有效上限更重的通道仍可在空池中启动，然后独占运行直到释放容量。默认情况下，通道启动会错开 2 秒，以避免本地 Docker 守护进程在创建阶段发生风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先执行 Docker 预检查、移除陈旧的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以便按最长优先排序，并支持使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 检查调度器。默认情况下，在首次失败后它会停止调度新的池化通道，并且每个通道都有一个 120 分钟的回退超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live / tail 通道使用更紧的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布使用的通道，例如 `install-e2e`，以及拆分后的内置更新通道，例如 `bundled-channel-update-acpx`，同时跳过清理冒烟步骤，以便智能体复现某个失败通道。可复用的 live / E2E 工作流会先通过 `scripts/test-docker-all.mjs --plan-json` 询问所需的软件包、镜像类型、live 镜像、通道以及凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的软件包构件，或从 `package_artifact_run_id` 下载软件包构件；验证 tarball 清单；在计划需要 package-installed 通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带 package-digest 标签的 bare / functional GHCR Docker E2E 镜像；并在提供了 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入或已存在 package-digest 镜像时复用它们，而不是重新构建。`Package Acceptance` 工作流是高级包门禁：它会从 npm、受信任的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流构件中解析一个候选项，然后将这个单一的 `package-under-test` 构件传递给可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，以便当前验收逻辑可以验证较旧但受信任的提交，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行 `package` 验收配置文件；该配置文件覆盖 package / update / 插件契约，是大多数 Parallels package / update 覆盖在 GitHub 原生环境中的默认替代方案。发布路径 Docker 套件最多运行三个分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只会拉取其所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。当完整发布路径覆盖请求包含 OpenWebUI 时，它会被合并进 `plugins-integrations`；只有在仅分发 OpenWebUI 时，才会保留独立的 `openwebui` 分块。`plugins-integrations` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表格，以及每个通道的重新运行命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行所选通道，而不是运行这些分块作业，这样失败通道的调试就能限制在一个有针对性的 Docker 作业内，并为该次运行准备、下载或复用软件包构件；如果所选通道是 live Docker 通道，则该定向作业会为此次重跑在本地构建 live-test 镜像。生成的按通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的完全相同的软件包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行中下载 Docker 构件，并输出组合式 / 按通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢通道和阶段关键路径摘要。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 doctor 修复过程可以与其他内置检查一起分片执行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界方面比广义的 CI 平台范围更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint / guards；core 纯测试变更仅运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展纯测试变更会运行扩展测试 typecheck 和扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展全量测试属于显式测试工作。仅发布元数据的版本升级会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式回退为运行所有检查通道。

手动 CI 分发会运行 `checks-node-compat-node22`，作为发布候选版本的兼容性覆盖。常规拉取请求和 `main` 推送会跳过该通道，并让矩阵专注于 Node 24 测试 / 渠道通道。

最慢的 Node 测试族会被拆分或平衡，以便每个作业都保持较小规模，同时避免过度预留运行器：渠道契约会作为三个加权分片运行，内置插件测试会在六个扩展 worker 之间平衡，小型 core 单元通道会成对组合，auto-reply 会作为四个平衡 worker 运行，其中 reply 子树会拆分为 agent-runner、dispatch 和 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则会分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试会使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配合更大的 Node 堆，这样导入密集的插件批次就不会产生额外的 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片成为尾部瓶颈。include-pattern 分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和经过筛选的分片。`check-additional` 会将 package-boundary compile / canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖拆分开；boundary guard 分片会在同一个作业内并发运行其小型独立防护项。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，于 `build-artifacts` 内部并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免额外占用两个 Blacksmith worker 和第二个构件消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会使用 SMS / call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的推送中重复执行 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被取代后继续排队。

自动 CI 并发键采用版本化形式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵能更早进入队列 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，在那里 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道运行 changed typecheck/lint/guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门禁，但包含各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 构建产物 / build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
