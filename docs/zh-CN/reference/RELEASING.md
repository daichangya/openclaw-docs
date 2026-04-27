---
read_when:
    - 寻找公开发布渠道定义
    - 运行发布验证或软件包验收
    - 寻找版本命名和发布节奏
summary: 发布通道、操作人员检查清单、验证框、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T03:54:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf9e521f825f02fc9682f2c96f6b0d96c3a78277324756e94114c40c516e5c1c
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三条公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要为月份或日期补零
- `latest` 表示当前已提升为正式版的稳定 npm 发布版本
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版默认发布到 npm `beta`；发布操作人员可以显式指定发布到 `latest`，或在之后提升一个已验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 软件包和 macOS 应用；
  beta 发布通常会先验证并发布 npm / 软件包路径，而 mac 应用的构建 / 签名 / 公证仅保留给稳定版，除非另有明确要求

## 发布节奏

- 发布流程先走 beta
- 只有在最新 beta 完成验证后，才会继续稳定版发布
- 维护者通常从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布后还需要修复，维护者会切下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布操作人员检查清单

这份检查清单展示的是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节保留在仅供维护者使用的发布运行手册中。

1. 从当前 `main` 开始：拉取最新内容，确认目标提交已推送，
   并确认当前 `main` 的 CI 足够绿色，适合从其分支发布。
2. 使用 `/changelog` 根据真实提交历史重写 `CHANGELOG.md` 的顶部章节，
   保持条目面向用户，提交并推送，然后在分支切出前再 rebase / pull 一次。
3. 查看以下位置中的发布兼容性记录：
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts`。只有在升级路径仍然被覆盖时，
   才移除已过期的兼容性；否则记录为何仍需保留。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上执行常规发布工作。
5. 为目标标签更新所有必需的版本位置，然后运行本地确定性预检：
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`。在标签尚未存在之前，
   可以使用完整的 40 字符发布分支 SHA 进行仅验证用途的预检。
   保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA 运行 `Full Release Validation`。
   这是四个大型发布验证框的总入口运行：Vitest、Docker、QA Lab 和 Package。
8. 如果验证失败，在发布分支上修复，并重新运行能证明修复有效的最小失败范围：
   文件、lane、工作流任务、软件包 profile、提供商或模型 allowlist。
   只有在变更范围使之前的证据失效时，才重新运行完整的总体验证。
9. 对于 beta，打上 `vYYYY.M.D-beta.N` 标签，使用 npm dist-tag `beta` 发布，
   然后针对已发布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 软件包运行发布后软件包验收。
   如果某个已推送或已发布的 beta 需要修复，就切下一个 `-beta.N`；
   不要删除或重写旧的 beta。
10. 对于稳定版，只有在已验证的 beta 或候选发布版本具备所需验证证据后，才继续。
    稳定版 npm 发布会通过 `preflight_run_id` 复用成功的预检产物；
    稳定版 macOS 发布就绪还要求 `main` 上具备已打包的 `.zip`、`.dmg`、`.dSYM.zip`
    以及更新后的 `appcast.xml`。
11. 发布后，运行 npm 发布后验证器、可选的已发布 npm Telegram E2E、
    在需要时执行 dist-tag 提升、根据完整匹配的 `CHANGELOG.md` 章节生成 GitHub 发布 / 预发布说明，
    然后执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，以确保测试 TypeScript 仍然被覆盖，
  不会遗漏在更快的本地 `pnpm check` 检查门之外
- 在发布预检前运行 `pnpm check:architecture`，以确保更广泛的导入循环和架构边界检查保持绿色，
  不会遗漏在更快的本地检查门之外
- 在运行 `pnpm release:check` 之前执行 `pnpm build && pnpm ui:build`，以确保 pack
  验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 当你需要通过单一入口点运行完整发布验证套件时，在发布批准前手动运行
  `Full Release Validation` 工作流。它接受分支、标签或完整提交 SHA，会分发手动 `CI`，
  并分发 `OpenClaw Release Checks`，用于安装冒烟测试、软件包验收、
  Docker 发布路径测试套件、live / E2E、OpenWebUI、QA Lab parity、Matrix 和
  Telegram 通道。
  只有在软件包已经发布且还需要运行发布后的 Telegram E2E 时，
  才提供 `npm_telegram_package_spec`。
  示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为软件包候选版本获取侧向验证证据，请运行手动
  `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest`
  或精确发布版本使用 `source=npm`；使用 `source=ref` 可在当前
  `workflow_ref` harness 下打包可信的 `package_ref` 分支 / 标签 / SHA；
  对带有必需 SHA-256 的 HTTPS tarball 使用 `source=url`；或对由其他 GitHub
  Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选版本解析为
  `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，
  并且可以选择运行已发布 npm 的 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product`
  常见 profile：
  - `smoke`：安装 / 渠道 / 智能体、Gateway 网关网络和配置重载通道
  - `package`：软件包 / 更新 / 插件通道，不含 OpenWebUI
  - `product`：在 package profile 基础上增加 MCP 渠道、cron / subagent 清理、
    OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes` 以进行聚焦重跑
- 当你只需要为发布候选版本获取完整的常规 CI 覆盖时，直接运行手动 `CI` 工作流。
  手动 CI 分发会绕过 changed scope，并强制运行 Linux Node 分片、内置插件分片、
  渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、
  文档检查、Python Skills、Windows、macOS、Android 以及 Control UI i18n
  通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP / HTTP 接收器执行
  QA-lab，并验证导出的 trace span 名称、有界属性，以及内容 / 标识符脱敏，
  无需依赖 Opik、Langfuse 或其他外部收集器。
- 在每次带标签发布前运行 `pnpm release:check`
- 发布检查现在运行在独立的手动工作流中：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock parity gate，以及 live
  Matrix 和 Telegram QA 通道。live 通道使用 `qa-live-shared` 环境；
  Telegram 还使用 Convex CI 凭证租约。
- 跨操作系统的安装和升级运行时验证由私有调用方工作流分发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意设计的：让真正的 npm 发布路径保持简短、确定性强且聚焦产物，
  同时让较慢的 live 检查留在各自独立的通道中，以免拖慢或阻塞发布
- 涉及密钥的发布检查应通过 `Full Release Validation` 分发，
  或从 `main` / 发布工作流 ref 分发，以确保工作流逻辑和密钥始终受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，
  只要解析出的提交可从某个 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 的仅验证预检也接受当前工作流分支的完整 40 字符提交 SHA，
  无需已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为软件包元数据检查合成 `v<package.json version>`；
  真正发布仍然需要真实的发布标签
- 这两个工作流都将真正的发布和提升路径保留在 GitHub-hosted runners 上，
  而不修改状态的验证路径则可以使用更大的 Blacksmith Linux runners
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  ，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流 secrets
- npm 发布预检不再等待独立的发布检查通道
- 在批准前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta / 修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta / 修正版版本），以在全新的临时 prefix 中验证已发布的 registry
  安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  ，以验证已安装软件包的新手引导、Telegram 设置，以及针对已发布 npm 软件包的真实
  Telegram E2E，并使用共享的租赁 Telegram 凭证池。
  维护者在本地一次性运行时，可以省略 Convex 变量，直接传入三个
  `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中手动运行的 `NPM Telegram Beta E2E` 工作流，
  执行相同的发布后检查。它被有意设置为仅手动运行，不会在每次合并时执行。
- 维护者发布自动化现在采用 preflight-then-promote：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认指向 `beta`
  - 稳定版 npm 发布可以通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提升安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库仅保留
    基于 OIDC 的发布
  - 公开的 `macOS Release` 仅用于验证
  - 真正的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真正的发布路径会提升已准备好的产物，而不是再次重新构建
- 对于 `YYYY.M.D-N` 这类稳定版修正版发布，发布后验证器还会检查
  从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的同一临时 prefix 升级路径，
  以防发布修正版在无声无息中让旧的全局安装仍停留在基础稳定版载荷上
- npm 发布预检采用默认拒绝策略，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，
  以避免再次发布空的浏览器仪表板
- 发布后验证还会检查已发布的 registry 安装在根 `dist/*`
  布局下是否包含非空的内置插件运行时依赖。若某次发布携带缺失或为空的内置插件
  依赖载荷，则会导致 postpublish verifier 失败，且不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize`
  预算进行强制校验，以便安装器 e2e 能在发布路径之前捕获意外的软件包膨胀
- 如果本次发布工作修改了 CI 规划、扩展 timing manifests 或扩展测试矩阵，
  请在批准前重新生成并审查
  `.github/workflows/ci.yml` 中由 planner 负责的 `checks-node-extensions`
  工作流矩阵输出，以避免发布说明描述的是过期的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器相关表面：
  - GitHub release 最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，
    且 `CFBundleVersion` 必须不低于该发布版本的规范 Sparkle 构建下限

## 发布验证框

`Full Release Validation` 是操作人员在希望通过单一入口点获取全部发布验证时使用的手动总入口：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both
```

该工作流会解析目标 ref，使用
`target_ref=<release-ref>` 分发手动 `CI`，分发 `OpenClaw Release Checks`，
并且在设置 `npm_telegram_package_spec` 时可选择分发发布后的 Telegram E2E。
只有当两个子工作流都成功，或者摘要中记录了某个被有意跳过的可选子流程时，
一次完整运行才可被接受。

### Vitest

Vitest 验证框是手动 `CI` 子工作流。手动 CI 会有意绕过 changed scope，并强制对发布候选版本执行常规测试图谱：Linux Node 分片、内置插件分片、渠道契约、Node 22
兼容性、`check`、`check-additional`、build smoke、文档检查、Python
Skills、Windows、macOS、Android 以及 Control UI i18n。

使用这个验证框来回答“源代码树是否通过了完整的常规测试套件？”
它不同于发布路径的产品验证。应保留的证据包括：

- 显示已分发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 针对精确目标 SHA 的绿色 `CI` 运行
- 在调查回归时，来自 CI 作业中的失败或较慢的分片名称
- 当某次运行需要性能分析时，像 `.artifacts/vitest-shard-timings.json`
  这样的 Vitest 时序产物

仅当发布需要确定性的常规 CI，而不需要 Docker、QA Lab、live、跨操作系统或软件包验证框时，
才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 验证框位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml`，以及发布模式的
`install-smoke` 工作流。它通过已打包的 Docker 环境来验证发布候选版本，
而不仅仅是源代码级测试。

发布 Docker 覆盖范围包括：

- 启用了较慢 Bun 全局安装冒烟测试的完整安装冒烟测试
- 仓库 E2E 通道
- 发布路径 Docker 分块：`core`、`package-update` 和
  `plugins-integrations`
- `plugins/integrations` 分块中的 OpenWebUI 覆盖
- 当发布检查包含 live 套件时，live / E2E provider 套件和 Docker live 模型覆盖

在重跑前先使用 Docker 产物。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含通道日志、`summary.json`、`failures.json`、
阶段耗时、调度器计划 JSON 和重跑命令。对于聚焦恢复，
请在可复用的 live / E2E 工作流上使用 `docker_lanes=<lane[,lane]>`，
而不是重跑全部发布分块。

### QA Lab

QA Lab 验证框也是 `OpenClaw Release Checks` 的一部分。它是智能体行为和渠道级发布门，
与 Vitest 和 Docker 软件包机制分开。

发布 QA Lab 覆盖包括：

- mock parity gate：使用 agentic parity pack，将 OpenAI 候选通道与 Opus 4.6
  基线进行对比
- 使用 `qa-live-shared` 环境的 live Matrix QA 通道
- 使用 Convex CI 凭证租约的 live Telegram QA 通道
- 当发布遥测需要显式本地证据时，运行 `pnpm qa:otel:smoke`

使用这个验证框来回答“该发布在 QA 场景和 live 渠道流程中是否表现正确？”
在批准发布时，请保留 parity、Matrix 和 Telegram 通道的产物 URL。

### Package

Package 验证框是可安装产品的检查门。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 提供支持。该解析器会将候选版本标准化为供 Docker E2E 使用的
`package-under-test` tarball，验证软件包清单，记录软件包版本和 SHA-256，并将工作流 harness ref 与软件包来源 ref 分开保存。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本
- `source=ref`：使用所选 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有必需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由其他 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会使用 `source=ref`、
`package_ref=<release-ref>` 和 `suite_profile=package` 运行 Package Acceptance。
该 profile 覆盖安装、更新和插件软件包契约，是此前大多数依赖
Parallels 的软件包 / 更新覆盖的 GitHub 原生替代方案。跨操作系统发布检查对于操作系统特定的新手引导、
安装器和平台行为仍然重要，但软件包 / 更新产品验证应优先使用 Package Acceptance。

当发布问题涉及实际可安装的软件包时，请使用更广范围的 Package Acceptance profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见软件包 profile：

- `smoke`：快速软件包安装 / 渠道 / 智能体、Gateway 网关网络和配置重载通道
- `package`：安装 / 更新 / 插件软件包契约；这是发布检查默认值
- `product`：`package` 加上 MCP 渠道、cron / subagent 清理、OpenAI web
  search 和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：用于聚焦重跑的精确 `docker_lanes` 列表

对于发布后的 beta 证明，请对精确 beta 软件包或
`openclaw@beta` 使用 `source=npm`。仅对已发布的 npm 软件包启用
`telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`，因为该路径会复用已发布 npm 的 Telegram E2E 工作流。

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前工作流分支的完整 40 字符提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证 / 构建 / 打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径中必需，以便工作流复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。涉及密钥的检查要求解析后的提交可从某个 OpenClaw 分支或发布标签到达。

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真实发布路径必须使用预检期间相同的 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## 稳定版 npm 发布顺序

在切稳定版 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签尚不存在时，你可以使用当前工作流分支的完整提交
     SHA，对预检工作流执行一次仅验证的 dry run
2. 对正常的 beta-first 流程选择 `npm_dist_tag=beta`，或仅在你有意直接发布稳定版时选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加 live prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行
   `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图谱，则改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，
   使用相同的 `tag`、相同的 `npm_dist_tag` 和保存的 `preflight_run_id`
7. 如果该发布先落在 `beta`，则使用私有工作流
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   将该稳定版本从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta`
   也应立即跟随相同的稳定构建，请使用同一个私有工作流让两个 dist-tag 都指向该稳定版本，或让其定时自愈同步稍后再移动 `beta`

出于安全原因，dist-tag 变更放在私有仓库中，因为它仍然需要
`NPM_TOKEN`，而公开仓库只保留基于 OIDC 的发布。

这样既保留了直接发布路径，也保留了 beta-first 提升路径，并且两者都已文档化且对操作人员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；将其保留在 tmux 中可以让提示、警报和 OTP 处理保持可观察，并避免重复的主机警报。

## 公开参考

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档作为实际运行手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
