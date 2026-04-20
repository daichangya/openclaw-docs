---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force / coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-20T22:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止所有仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务端测试与正在运行的实例发生冲突。当先前的 Gateway 网关运行导致端口 `18789` 仍被占用时，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个“已加载文件”的单元覆盖率门禁，而不是整个仓库的“所有文件”覆盖率。阈值为 70% 的行数 / 函数 / 语句覆盖率，以及 55% 的分支覆盖率。由于 `coverage.all` 为 false，该门禁只统计单元覆盖率套件实际加载的文件，而不会将拆分测试 lane 中的所有源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅针对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源文件 / 测试文件时，会将变更的 Git 路径展开为有范围的 Vitest lane。配置 / setup 变更仍会回退到原生根项目运行，以便在需要时对接线变更进行更广泛的重新运行。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构 lane。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更门禁。它会将核心变更映射到核心测试 lane，将扩展变更映射到扩展测试 lane，将仅测试变更映射到仅测试类型检查 / 测试，并会把公共插件 SDK 或插件契约变更扩展为扩展验证。
- `pnpm test`：通过有范围的 Vitest lane 路由显式的文件 / 目录目标。未指定目标的运行会使用固定分片组，并展开为叶子配置以进行本地并行执行；扩展组始终会展开为按扩展划分的分片配置，而不是使用一个巨大的根项目进程。
- 完整测试和扩展分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地耗时数据；后续运行会使用这些耗时来平衡慢分片和快分片。将 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 设为忽略本地耗时制品。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用轻量 lane，这些 lane 只保留 `test/setup.ts`，而运行时较重的用例仍保留在原有 lane 中。
- 部分 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量 lane 中的显式同级测试，因此对小型辅助函数的修改可以避免重新运行运行时依赖较重的测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导较轻量的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离 runner。
- `pnpm test:channels`：运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions`：运行所有扩展 / 插件分片。较重的渠道扩展和 OpenAI 会作为专用分片运行；其他扩展组保持批处理。对单个内置插件 lane，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 的导入耗时 + 导入明细报告，同时仍会对显式文件 / 目录目标使用有范围的 lane 路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交 Git diff，将路由后的 changed 模式路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，直接对当前工作区变更集进行基准对比。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 显式启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax / zai）。需要 API key，并设置 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元 / e2e 测试套件那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器，以及第二个会启动 `openclaw mcp serve` 的客户端容器，然后验证路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio bridge 传递的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该 smoke 测试能够反映 bridge 实际发出的内容。

## 本地 PR 门禁

在本地执行 PR 落地 / 门禁检查时，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，请先重跑一次，再决定是否视为回归；然后使用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地 keys）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“用一个单词回答：ok。不要标点或额外文本。”

最近一次运行（2025-12-31，20 次）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## CLI 启动基准

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
- `all`：两个预设都包含

输出包含每个命令的 `sampleCount`、平均值、p50、p95、最小 / 最大值、exit-code / signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此耗时采集和 profile 捕获使用的是同一套 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 制品写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整套件制品写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已提交的基线 fixture：`test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在需要容器化的新手引导 smoke 测试时才需要。

在干净 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## 二维码导入 smoke 测试（Docker）

确保 `qrcode-terminal` 能在受支持的 Docker Node 运行时下加载（Node 24 默认，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
