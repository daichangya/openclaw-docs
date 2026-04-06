---
read_when:
    - 在本地或 CI 中运行测试时
    - 为模型 / 提供商缺陷添加回归测试时
    - 调试 Gateway 网关 + 智能体行为时
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-06T15:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e287bb1ebdebfb27120271c03c9e4b10cea29bf7c881b89ce872b32c64cd64ed
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、实时）以及一小组 Docker 运行器。

本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意 _不_ 覆盖什么）
- 常见工作流应运行哪些命令（本地、推送前、调试）
- 实时测试如何发现凭证并选择模型 / 提供商
- 如何为真实世界中的模型 / 提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门禁（预期在推送前运行）：`pnpm build && pnpm check && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 直接按文件定位现在也会路由扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

当你修改了测试，或者想要更高信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- 实时套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只运行一个实时文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`

提示：如果你只需要定位一个失败用例，优先使用下文介绍的 allowlist 环境变量来缩小实时测试范围。

## 测试套件（各自在哪里运行）

可以把这些测试套件看作“真实性逐步增加”（同时波动性 / 成本也逐步增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：通过 `vitest.config.ts` 使用原生 Vitest `projects`
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的核心 / 单元测试清单，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关鉴权、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- Projects 说明：
  - 未指定目标的 `pnpm test` 仍然使用原生 Vitest 根级 `projects` 配置。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会先将显式文件 / 目录目标路由到更小范围的 lane，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整根项目启动开销。
  - `pnpm test:changed` 会在差异仅触及可路由的源码 / 测试文件时，将变更的 git 路径扩展到同样的 scoped lane；而配置 / setup 修改仍会回退到更宽泛的根项目重跑。
  - 选定的 `plugin-sdk` 和 `commands` 测试也会通过专用的轻量 lane 路由，跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时负担较重的文件仍保留在原有 lane 上。
  - 选定的 `plugin-sdk` 和 `commands` 辅助源码文件也会在 changed 模式运行时，将变更映射到这些轻量 lane 中显式的同级测试，因此辅助文件修改不会导致该目录下整个重型套件重跑。
- 嵌入式运行器说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，
    要同时保持两个层级的覆盖。
  - 为纯路由 / 规范化边界添加聚焦的辅助回归测试。
  - 同时也要确保嵌入式运行器集成测试套件保持健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些套件会验证 scoped id 和压缩行为仍然贯穿真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试不足以替代这些集成路径。
- Pool 说明：
  - 基础 Vitest 配置现在默认使用 `threads`。
  - 共享 Vitest 配置还固定了 `isolate: false`，并在根项目、e2e 和实时配置中使用非隔离运行器。
  - 根级 UI lane 保留其 `jsdom` setup 和优化器，但现在也运行在共享的非隔离运行器上。
  - `pnpm test` 会从根 `vitest.config.ts` 的 projects 配置继承相同的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在默认也会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要与原生 V8 行为对比，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 快速本地迭代说明：
  - `pnpm test:changed` 会在变更路径能清晰映射到更小测试套件时，通过 scoped lane 路由。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同路由行为，只是使用更高的 worker 上限。
  - 本地 worker 自动缩放现在刻意更加保守，并且在主机平均负载已经较高时也会回退，因此默认情况下多个并发 Vitest 运行造成的影响更小。
  - 基础 Vitest 配置将项目 / 配置文件标记为 `forceRerunTriggers`，以便在测试接线发生变化时，changed 模式的重跑仍然正确。
  - 配置在受支持主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个明确缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入明细输出。
  - `pnpm test:perf:imports:changed` 会将同样的分析视图限定到自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交差异，将路由后的 `test:changed` 与原生根项目路径进行对比，并输出总耗时以及 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将变更文件列表路由后，对当前未提交工作树进行基准测试。
  - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动与转换开销写入主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件级并行时，为单元测试套件写入运行器 CPU + heap profile。

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `threads` 且 `isolate: false`，与仓库其他部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>`：强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1`：重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 接口、节点配对以及更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线中启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec，运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范化文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认的 CLI 二进制或包装脚本

### 实时（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型今天在真实凭证下是否真的可用？”
  - 捕获提供商格式变更、工具调用怪癖、鉴权问题和限流行为
- 预期：
  - 本质上不适合做稳定 CI（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗限流额度
  - 优先运行缩小范围的子集，而不是“一切都跑”
- 实时运行会 source `~/.profile` 来获取缺失的 API 密钥。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置 / 鉴权材料复制到临时测试 home，这样单元测试夹具不会修改你真实的 `~/.openclaw`。
- 只有在你明确需要实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认更安静：会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志 / Bonjour 噪声。如果你想恢复完整启动日志，可设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商）：可设置 `*_API_KEYS`，使用逗号 / 分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可通过 `OPENCLAW_LIVE_*_KEY` 做每次实时运行覆盖；遇到限流响应时测试会重试。
- 进度 / 心跳输出：
  - 实时套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也能显示为仍在活动中。
  - `vitest.live.config.ts` 禁用了 Vitest 控制台拦截，因此提供商 / Gateway 网关进度行会在实时运行期间立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 修改逻辑 / 测试：运行 `pnpm test`（如果你改动较多，也运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：再加上 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## 实时：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点当前**宣告的每一条命令**，并断言命令契约行为。
- 范围：
  - 预设条件 / 手动 setup（该套件不会安装 / 运行 / 配对应用）。
  - 对所选 Android 节点逐条执行 Gateway 网关 `node.invoke` 验证。
- 必需的预先 setup：
  - Android 应用已连接并与 Gateway 网关配对。
  - 应用保持前台运行。
  - 为你期望通过的能力授予权限 / 捕获同意。
- 可选目标覆盖项：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android setup 详情： [Android App](/zh-CN/platforms/android)

## 实时：模型冒烟（profile keys）

实时测试分成两层，以便隔离故障：

- “直接模型”告诉我们：给定密钥下，提供商 / 模型是否至少能响应。
- “Gateway 网关冒烟”告诉我们：针对该模型，完整的 Gateway 网关 + 智能体管线是否工作正常（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现到的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 为每个模型运行一次小型补全（必要时带定向回归）
- 如何启用：
  - `pnpm test:live`（如果直接调用 Vitest，则设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 modern 的别名）后，该套件才会实际运行；否则它会跳过，以使 `pnpm test:live` 聚焦于 Gateway 网关冒烟
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern`：运行现代 allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代 allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔 allowlist）
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔 allowlist）
- 密钥来源：
  - 默认：profile 存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅**使用 profile store
- 存在原因：
  - 将“提供商 API 坏了 / 密钥无效”与“Gateway 网关智能体管线坏了”分离
  - 容纳小型、隔离的回归测试（例如：OpenAI Responses / Codex Responses 推理重放 + 工具调用流程）

### 第 2 层：Gateway 网关 + 开发智能体冒烟（也就是 “@openclaw” 实际做的事）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行覆盖模型）
  - 迭代所有带密钥的模型并断言：
    - “有意义的”响应（不使用工具）
    - 一次真实的工具调用可正常工作（read probe）
    - 可选的额外工具探测可工作（exec+read probe）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）持续可用
- 探测细节（便于你快速解释故障）：
  - `read` probe：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 它，然后原样返回 nonce。
  - `exec+read` probe：测试会要求智能体通过 `exec` 将 nonce 写入一个临时文件，然后再 `read` 回来。
  - 图像探测：测试会附加一个生成的 PNG（猫 + 随机代码），并期待模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 如何启用：
  - `pnpm test:live`（如果直接调用 Vitest，则设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：现代 allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代 allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来缩小范围
- 如何选择提供商（避免“OpenRouter 全家桶”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔 allowlist）
- 该实时测试始终启用工具 + 图像探测：
  - `read` probe + `exec+read` probe（工具压力测试）
  - 当模型声明支持图像输入时，会运行图像探测
  - 流程（高层）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析到 `images[]` 中（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体向模型转发一条多模态用户消息
    - 断言：回复包含 `cat` + 代码（OCR 容差：允许轻微错误）

提示：如果你想查看自己机器上能测什么（以及精确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时：CLI 后端冒烟（Codex CLI 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体管线，而不触碰你的默认配置。
- 启用：
  - `pnpm test:live`（如果直接调用 Vitest，则设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 模型：`codex-cli/gpt-5.4`
  - 命令：`codex`
  - 参数：`["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`：发送一个真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`：将图像文件路径作为 CLI 参数传入，而不是通过提示词注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）：当设置了 `IMAGE_ARG` 时，控制图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`：发送第二轮消息并验证 resume 流程。
  
示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像中以非 root 的 `node` 用户运行实时 CLI 后端冒烟。
- 对于 `codex-cli`，它会将 Linux 版 `@openai/codex` 包安装到一个可缓存、可写的前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 中（默认：`~/.cache/openclaw/docker-cli-tools`）。

## 实时：ACP 绑定冒烟（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP 智能体验证真实的 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在同一会话上发送一条普通后续消息
  - 验证该后续消息落入已绑定的 ACP 会话转录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 说明：
  - 该 lane 使用 Gateway 网关 `chat.send` 接口，并带有仅管理员可用的合成 originating-route 字段，这样测试就能附加消息渠道上下文，而无需假装对外投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内置 `acpx` 插件中针对所选 ACP harness 智能体的内建智能体注册表。

示例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-acp-bind
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 它会 source `~/.profile`，将匹配的 CLI 鉴权材料暂存到容器中，把 `acpx` 安装到一个可写 npm 前缀，然后在缺失时安装所请求的实时 CLI（`@anthropic-ai/claude-code` 或 `@openai/codex`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，以便 acpx 在启动子 harness CLI 时保留从已 source 的 profile 中获得的提供商环境变量。

### 推荐的实时配方

范围明确、显式的 allowlist 最快，也最不容易波动：

- 单个模型，直接调用（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单个模型，Gateway 网关冒烟：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 聚焦（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立鉴权 + 工具行为怪癖）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile auth）；大多数用户说的 “Gemini” 指的就是这个。
  - CLI：OpenClaw 会调用本地 `gemini` 二进制；它有自己的鉴权，并且行为可能不同（流式传输 / 工具支持 / 版本偏差）。

## 实时：模型矩阵（我们覆盖什么）

没有固定的“CI 模型列表”（实时测试是按需启用的），但以下是在有密钥的开发机器上**建议**定期覆盖的模型。

### 现代冒烟集（工具调用 + 图像）

这是我们期望持续保持可用的“常见模型”运行集合：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免更旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

通过工具 + 图像运行 Gateway 网关冒烟：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有则更好）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、支持工具的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude / Gemini / OpenAI 的视觉变体等），以运行图像探测。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应密钥，我们也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选项）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 鉴权）

如果你有凭证 / 配置，还可以将更多提供商纳入实时矩阵：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云 / API），以及任何兼容 OpenAI / Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表是你机器上的 `discoverModels(...)` 返回结果，以及可用的密钥集合。

## 凭证（绝不要提交）

实时测试发现凭证的方式与 CLI 相同。实际含义如下：

- 如果 CLI 可用，实时测试通常也应能找到同样的密钥。
- 如果实时测试提示“没有凭证”，请用与你调试 `openclaw models list` / 模型选择相同的方式去排查。

- 每个智能体的 auth profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是实时测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（若存在，会复制到暂存的实时 home 中，但它不是主要的 profile-key 存储）
- 默认情况下，本地实时运行会将当前配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 鉴权目录复制到临时测试 home 中；在该暂存配置中会剥离 `agents.*.workspace` / `agentDir` 路径覆盖项，这样探测不会落到你真实主机工作区。

如果你想依赖环境变量密钥（例如在你的 `~/.profile` 中导出），请在本地测试前先执行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载进容器）。

## Deepgram 实时（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus 编码计划实时测试

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体实时测试

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 运行内置 comfy 图像、视频和 `music_generate` 路径
  - 除非配置了 `models.providers.comfy.<capability>`，否则会跳过对应能力
  - 在修改 comfy 工作流提交、轮询、下载或插件注册后很有用

## 图像生成实时测试

- 测试：`src/image-generation/runtime.live.test.ts`
- 命令：`pnpm test:live src/image-generation/runtime.live.test.ts`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 在探测前从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用实时 / 环境 API 密钥，而不是已存储的 auth profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖你 shell 中真实可用的凭证
  - 跳过没有可用鉴权 / profile / 模型的提供商
  - 通过共享运行时能力运行默认图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置提供商：
  - `openai`
  - `google`
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 可选鉴权行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：强制使用 profile store 鉴权，并忽略仅来自环境变量的覆盖

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 范围：
  - 运行共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境 API 密钥，而不是已存储的 auth profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖你 shell 中真实可用的凭证
  - 跳过没有可用鉴权 / profile / 模型的提供商
  - 在可用时运行两种已声明的运行时模式：
    - `generate`：仅提示词输入
    - `edit`：当提供商声明 `capabilities.edit.enabled` 时
  - 当前共享 lane 覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：使用单独的 Comfy 实时文件，而不是这个共享扫描
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选鉴权行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：强制使用 profile store 鉴权，并忽略仅来自环境变量的覆盖

## 视频生成实时测试

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 范围：
  - 运行共享的内置视频生成提供商路径
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境 API 密钥，而不是已存储的 auth profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖你 shell 中真实可用的凭证
  - 跳过没有可用鉴权 / profile / 模型的提供商
  - 在可用时运行两种已声明的运行时模式：
    - `generate`：仅提示词输入
    - `imageToVideo`：当提供商声明 `capabilities.imageToVideo.enabled` 时
    - `videoToVideo`：当提供商声明 `capabilities.videoToVideo.enabled` 且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地视频输入时
  - 当前 `videoToVideo` 实时覆盖：
    - `google`
    - `openai`
    - `runway`，仅当所选模型为 `runway/gen4_aleph` 时
  - 当前在共享扫描中已声明但被跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远端 `http(s)` / MP4 引用 URL
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- 可选鉴权行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：强制使用 profile store 鉴权，并忽略仅来自环境变量的覆盖

## Docker 运行器（可选的“在 Linux 上可用”检查）

这些 Docker 运行器分成两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配的 profile-key 实时文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录与工作区（如果已挂载，还会 source `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认带较小的冒烟上限，以便完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想进行更大的穷举扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，然后在两个实时 Docker lane 中复用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels` 和 `test:docker:plugins` 会启动一个或多个真实容器，并验证更高层级的集成路径。

实时模型 Docker 运行器还会仅 bind-mount 所需的 CLI 鉴权 home（如果运行未缩小范围，则挂载所有受支持项），然后在运行前将其复制到容器 home 中，以便外部 CLI OAuth 可以刷新 token，而不会修改主机鉴权存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网关网络（两个容器，WS 鉴权 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP 渠道桥接（带种子的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- 插件（安装冒烟 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

实时模型 Docker 运行器还会以只读方式 bind-mount 当前 checkout，
并将其暂存到容器内的临时工作目录中。这样可以让运行时镜像保持精简，
同时仍然对你当前本地的精确源码 / 配置运行 Vitest。
暂存步骤会跳过大型本地专用缓存和应用构建产物，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，因此 Docker 实时运行不会花几分钟去复制
机器特定的工件。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在容器内启动
真实的 Telegram / Discord / 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小范围或排除该 Docker lane 中的 Gateway 网关
实时覆盖时，也请一并传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟：它会启动一个
启用了 OpenAI 兼容 HTTP 接口的 OpenClaw Gateway 网关容器，
再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过
Open WebUI 的 `/api/chat/completions` 代理发送一条真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，而且 Open WebUI 可能需要完成自己的冷启动 setup。
该 lane 需要一个可用的实时模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON 载荷，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意设计为确定性，不需要
真实的 Telegram、Discord 或 iMessage 账号。它会启动一个带种子的 Gateway 网关
容器，启动第二个容器来运行 `openclaw mcp serve`，然后
验证路由后的会话发现、转录读取、附件元数据、
实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知是否通过真实的 stdio MCP bridge 正常工作。通知检查
会直接检查原始 stdio MCP frame，因此该冒烟验证的是桥接
实际发出的内容，而不是某个特定客户端 SDK 恰好暴露出来的内容。

手动 ACP 自然语言线程冒烟（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留这个脚本用于回归 / 调试工作流。它未来可能仍然会用于 ACP 线程路由验证，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 鉴权目录 / 文件会以只读方式挂载到 `/host-auth...`，然后在测试启动前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载由 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可手动覆盖：`OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 这样的逗号列表
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`：缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`：在容器中过滤提供商
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：确保凭证来自 profile store（而非环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...`：选择供 Open WebUI 冒烟使用的 Gateway 网关暴露模型
- `OPENCLAW_OPENWEBUI_PROMPT=...`：覆盖 Open WebUI 冒烟中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...`：覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

在修改文档后运行文档检查：`pnpm check:docs`。
如果你还需要检查页内标题锚点，请运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是在没有真实提供商的情况下，对“真实管线”做的回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，写入配置 + 强制 auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有少量 CI 安全测试，其行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + 智能体循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 端到端向导流程，用于验证会话接线与配置效果（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍缺少的内容：

- **决策能力：** 当提示词中列出 Skills 时，智能体是否会选择正确的 Skills（或避开无关 Skills）？
- **遵从性：** 智能体是否会在使用前读取 `SKILL.md` 并遵循要求的步骤 / 参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小组聚焦 skill 的场景（使用 vs 避免、门控、提示注入）。
- 只有在 CI 安全套件到位之后，再添加可选的实时评估（按需启用、受环境变量门控）。

## 契约测试（plugin 和 channel 形状）

契约测试用于验证每个已注册的插件和渠道是否符合其
接口契约。它们会遍历所有已发现的插件，并运行一组
形状和行为断言。默认的 `pnpm test` 单元 lane 会刻意
跳过这些共享 seam 和冒烟文件；当你修改共享渠道或提供商接口时，
请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基础插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略强制执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 鉴权流程契约
- **auth-choice** - 鉴权选择 / 选取
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改 `plugin-sdk` 导出或子路径后
- 新增或修改渠道插件或提供商插件后
- 重构插件注册或发现逻辑后

契约测试会在 CI 中运行，不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复一个在实时测试中发现的提供商 / 模型问题时：

- 如果可能，添加一个 CI 安全回归测试（mock / stub 提供商，或捕获精确的请求形状转换）
- 如果它天然只能通过实时测试验证（限流、鉴权策略），就让实时测试保持范围狭窄，并通过环境变量按需启用
- 优先瞄准能捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具管线缺陷 → Gateway 网关实时冒烟或 CI 安全的 Gateway 网关 mock 测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增一个 `includeInPlan` SecretRef 目标家族，请更新该测试中的 `classifyTargetClass`。该测试会在未分类目标 id 上刻意失败，以防新增类别被悄悄跳过。
