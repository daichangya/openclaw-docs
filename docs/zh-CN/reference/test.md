---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（`vitest`），以及何时使用 `force` / `coverage` 模式
title: 测试
x-i18n:
    generated_at: "2026-04-24T05:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4ad5808ddbc06c704c9bcf9f780b06f9be94ac213ed22e79d880dedcaa6d3b
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，这样服务端测试就不会与正在运行的实例发生冲突。当之前的 Gateway 网关运行导致端口 `18789` 仍被占用时，请使用它。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个针对已加载文件的单元覆盖率门禁，而不是整个仓库的全文件覆盖率。阈值为 70% 的行数 / 函数 / 语句，以及 55% 的分支。由于 `coverage.all` 为 false，该门禁衡量的是单元覆盖率套件加载到的文件，而不是把每个拆分测试 lane 中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源码 / 测试文件时，会将变更的 Git 路径展开为作用域明确的 Vitest lane。配置 / 设置变更仍会回退到原生根项目运行，这样在需要时，接线层编辑会更广泛地重新运行测试。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构 lane。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更门禁。它会让核心工作对应核心测试 lane，扩展工作对应扩展测试 lane，仅测试相关工作只运行测试 typecheck / 测试，把公开 Plugin SDK 或 plugin-contract 变更扩展为一次扩展验证，并让仅发布元数据的版本变更保持在有针对性的版本 / 配置 / 根依赖检查范围内。
- `pnpm test`：通过作用域明确的 Vitest lane 路由显式的文件 / 目录目标。未指定目标的运行会使用固定分片组，并展开为叶子配置以便在本地并行执行；扩展组始终会展开为每个扩展 / 插件的分片配置，而不是一个巨大的根项目进程。
- 完整测试和扩展分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续运行会使用这些计时来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时产物。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量 lane，这些 lane 仅保留 `test/setup.ts`，而运行时较重的用例仍保留在原有 lane 中。
- 部分 `plugin-sdk` 和 `commands` 辅助源码文件也会把 `pnpm test:changed` 映射到这些轻量 lane 中明确的同级测试，因此对小型辅助函数的修改可以避免重新运行依赖重运行时的测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导较轻的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展 / 插件分片。重型渠道插件、browser 插件以及 OpenAI 会作为专用分片运行；其他插件组保持批量处理。对单个内置插件 lane，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入明细报告，同时仍对显式文件 / 目录目标使用作用域明确的 lane 路由。
- `pnpm test:perf:imports:changed`：同样的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交的 Git diff，对比已路由的 changed 模式路径和原生根项目运行的基准表现。
- `pnpm test:perf:changed:bench -- --worktree`：对当前工作树变更集进行基准测试，无需先提交。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写出分组时长数据以及每个配置的 JSON / 日志产物。测试性能代理会在尝试修复慢测试之前，将其用作基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在面向性能的改动之后比较分组报告。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可使用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax / zai）。需要 API key，并且需要 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：先构建共享的 live-test 镜像和 Docker E2E 镜像各一次，然后在默认并发数 8 下，以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker smoke lane。可使用 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 调整主池，使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 调整对提供商更敏感的尾部池；两者默认都为 8。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 会在首次失败后停止调度新的池化 lane；每个 lane 默认超时 120 分钟，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。每个 lane 的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元 / e2e 测试套件那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个已预置的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证经路由的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio bridge 传递的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP frame，因此这个 smoke 测试反映的是 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 合并 / 门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，先重跑一次，再将其视为回归问题，然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地 key）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“用一个单词回复：ok。不要使用标点或额外文本。”

最近一次运行（2025-12-31，20 次）：

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
- `all`：以上两个预设

输出会包含每个命令的 `sampleCount`、平均值、p50、p95、最小 / 最大值、exit-code / signal 分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，这样计时和 profile 捕获会使用同一个 harness。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已提交的基线 fixture，路径为 `test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在运行容器化的新手引导 smoke 测试时才需要。

在干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke 测试（Docker）

确保受维护的 QR 运行时 helper 能在受支持的 Docker Node 运行时下正常加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [live 测试](/zh-CN/help/testing-live)
