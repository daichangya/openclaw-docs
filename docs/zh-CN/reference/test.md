---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-23T20:12:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b00be94a548ca75ab0f2531186a2bf7928655454352ac6a38fd8a6ffa47e8451
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务端测试与正在运行的实例发生冲突。当先前的 Gateway 网关运行导致端口 `18789` 仍被占用时，请使用此命令。
- `pnpm test:coverage`：通过 `vitest.unit.config.ts` 使用 V8 覆盖率运行单元测试套件。这是针对已加载文件的单元覆盖率门禁，不是整个仓库所有文件的覆盖率。阈值为：行数 / 函数 / 语句覆盖率 70%，分支覆盖率 55%。由于 `coverage.all` 为 false，此门禁只统计被单元覆盖率测试套件加载的文件，而不会把拆分测试通道中的每个源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅针对自 `origin/main` 以来发生变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 仅涉及可路由的源文件 / 测试文件时，将变更的 Git 路径展开为有范围限制的 Vitest 测试通道。配置 / 设置变更仍会回退到原生根项目运行，以便在需要时更广泛地重新运行布线相关改动。
- `pnpm changed:lanes`：显示针对 `origin/main` 的 diff 所触发的架构测试通道。
- `pnpm check:changed`：对比 `origin/main` 的 diff 运行智能变更门禁。它会将核心代码工作与核心测试通道一起运行，将扩展工作与扩展测试通道一起运行，将仅测试改动限制为仅测试类型检查 / 测试，针对公开的插件 SDK 或插件契约变更扩展到扩展验证，并让仅发布元数据的版本号变更保持在有针对性的版本 / 配置 / 根依赖检查范围内。
- `pnpm test`：将显式指定的文件 / 目录目标路由到有范围限制的 Vitest 测试通道。未指定目标的运行会使用固定的分片组，并展开到叶子配置以便在本地并行执行；扩展组始终会展开为按扩展划分的分片配置，而不是一个巨大的根项目进程。
- 完整测试和扩展分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地时序数据；后续运行会使用这些时序数据来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地时序工件。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会通过专用轻量测试通道路由，这些通道仅保留 `test/setup.ts`，而运行时负载较重的用例仍保留在现有测试通道中。
- 部分 `plugin-sdk` 和 `commands` 辅助源文件也会把 `pnpm test:changed` 映射到这些轻量测试通道中的显式同级测试，因此小型辅助函数改动无需重新运行重量级、依赖运行时的测试套件。
- `auto-reply` 现在也被拆分为三个专用配置（`core`、`top-level`、`reply`），这样回复测试框架就不会主导较轻量的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展 / 插件分片。重量级渠道扩展和 OpenAI 会作为专用分片运行；其他扩展组保持批量运行。对某一个内置插件测试通道，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入明细报告，同时仍对显式文件 / 目录目标使用有范围限制的测试通道路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入性能分析，但仅针对自 `origin/main` 以来发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交的 Git diff，对比变更模式路由路径与原生根项目运行的基准表现。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作区改动集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行完整测试套件中的每个 Vitest 叶子配置，并写入分组耗时数据以及每个配置对应的 JSON / 日志工件。测试性能智能体会将其用作尝试修复慢测试之前的基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：比较性能优化改动前后的分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 以及自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API key，并设置 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：先构建一次共享的 live-test 镜像和 Docker E2E 镜像，然后默认以并发度 4 运行 Docker 冒烟测试通道，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`。可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 调整。除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器会在首次失败后停止调度新的池化测试通道；每个测试通道默认有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或提供商敏感的测试通道会在并行池之后以独占方式运行。每个测试通道的日志都会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像普通 unit/e2e 测试套件那样被期望具有 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器，以及第二个会启动 `openclaw mcp serve` 的客户端容器，然后通过真实的 stdio bridge 验证路由会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及类似 Claude 的渠道与权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试能反映 bridge 实际发出的内容。

## 本地 PR 门禁

在本地执行 PR 合入 / 门禁检查时，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，在视其为回归之前先重跑一次，然后用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地 key）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

上次运行（2025-12-31，20 次）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## CLI 启动基准测试

脚本：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

用法：

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：同时包含两个预设

输出会包含每个命令的 `sampleCount`、平均值、p50、p95、最小值 / 最大值、exit-code / signal 分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，使计时与 profile 捕获使用同一套测试框架。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标冒烟工件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件工件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已纳入版本控制的基线 fixture：`test/fixtures/cli-startup-bench.json`

已纳入版本控制的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在进行容器化新手引导冒烟测试时才需要。

在干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证 config/workspace/session 文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保维护中的 QR 运行时 helper 能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
