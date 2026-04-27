---
read_when:
    - 查找公开发布渠道定义
    - 执行发布验证或软件包验收
    - 查找版本命名和发布节奏
summary: 发布 lanes、操作员检查清单、验证项、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T06:06:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca27c0060be4b81b7ace32e14d8b132a7f67fb972530ce149e693a06e625567
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布 lane：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在显式指定时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的滚动最新版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已推广的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版默认发布到 npm `beta`；发布操作员可以显式指定 `latest`，或者稍后再推广已验证的 beta 构建
- 每个 stable OpenClaw 发布都会同时发布 npm 软件包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/软件包路径，mac 应用的构建/签名/公证默认保留给 stable，除非有明确要求

## 发布节奏

- 发布遵循 beta-first
- 只有在最新 beta 验证通过后，才会推进 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来进行发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果 beta 标签已经推送或发布后仍需要修复，维护者会创建下一个
  `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅面向维护者

## 发布操作员检查清单

这份检查清单是发布流程的公开形态。私有凭证、
签名、公证、dist-tag 恢复和紧急回滚细节仍保留在
仅面向维护者的发布 runbook 中。

1. 从当前 `main` 开始：拉取最新代码，确认目标提交已推送，
   并确认当前 `main` 的 CI 足够绿色，可以从其创建分支。
2. 使用 `/changelog` 根据真实提交历史重写最顶部的 `CHANGELOG.md` 部分，
   保持条目面向用户，提交它，推送它，然后在分支创建前再执行一次 rebase/pull。
3. 审查以下文件中的发布兼容性记录：
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts`。只有在升级路径仍然得到覆盖时才移除过期兼容性，
   或记录为何要有意保留它。
4. 从当前 `main` 创建 `release/YYYY.M.D`；不要直接在 `main` 上进行常规发布工作。
5. 对目标标签所需的所有版本位置进行版本提升，然后运行
   本地确定性预检：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 运行 `OpenClaw NPM Release` 并设置 `preflight_only=true`。在标签尚不存在时，
   可以使用完整的 40 字符发布分支 SHA 进行仅验证用的预检。
   保存成功的 `preflight_run_id`。
7. 针对发布分支、标签或完整提交 SHA，使用 `Full Release Validation`
   启动所有发布前测试。这是四个大型发布测试验证项——Vitest、Docker、QA Lab 和 Package——的唯一手动入口。
8. 如果验证失败，请在发布分支上修复，并仅重新运行能够证明修复生效的最小失败文件、lane、workflow job、软件包 profile、provider 或模型 allowlist。
   只有当变更范围使先前证据失效时，才重新运行完整总流程。
9. 对于 beta，打上 `vYYYY.M.D-beta.N` 标签，使用 npm dist-tag `beta` 发布，然后对已发布的
   `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 软件包运行发布后软件包验收。如果已推送或已发布的 beta 需要修复，
   请创建下一个 `-beta.N`；不要删除或重写旧的 beta。
10. 对于 stable，只有在经过审查的 beta 或候选发布已具备所需验证证据后才继续。
    Stable 的 npm 发布会通过 `preflight_run_id` 复用成功的
    预检工件；stable 的 macOS 发布就绪还要求 `main` 上存在已打包的
    `.zip`、`.dmg`、`.dSYM.zip` 和更新后的
    `appcast.xml`。
11. 发布后，运行 npm 发布后验证器；如果你需要发布后的渠道证明，可选择运行独立的、基于已发布 npm 的 Telegram E2E；
    在需要时执行 dist-tag 推广；使用完整匹配的 `CHANGELOG.md` 部分生成 GitHub release/prerelease 说明；
    然后执行发布公告步骤。

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，以确保测试 TypeScript 仍然受到覆盖，
  不会被更快的本地 `pnpm check` gate 漏掉
- 在发布预检前运行 `pnpm check:architecture`，以确保更广泛的导入环和架构边界检查保持绿色，
  不会被更快的本地 gate 漏掉
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，以确保
  打包验证步骤所需的 `dist/*` 发布工件和 Control UI bundle 已存在
- 在发布批准前运行手动 `Full Release Validation` workflow，以便从单一入口点
  启动所有发布前测试验证项。它接受分支、标签或完整提交 SHA，
  会派发手动 `CI`，并派发
  `OpenClaw Release Checks` 来执行安装冒烟、软件包验收、Docker
  发布路径套件、实时/E2E、OpenWebUI、QA Lab 一致性、
  Matrix 和 Telegram lanes。仅当软件包已经发布且发布后的 Telegram E2E 也需要运行时，
  才提供 `npm_telegram_package_spec`。示例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行的同时，为某个软件包候选获取旁路证明时，运行手动 `Package Acceptance` workflow。
  对于 `openclaw@beta`、`openclaw@latest` 或精确发布版本，使用 `source=npm`；
  若要使用当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA，
  使用 `source=ref`；若要使用带有必需 SHA-256 的 HTTPS tarball，使用 `source=url`；
  若要使用由其他 GitHub Actions 运行上传的 tarball，使用 `source=artifact`。
  该 workflow 会将候选解析为
  `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并且
  可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`
  针对同一个 tarball 运行 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常见配置项：
  - `smoke`：安装/渠道/智能体、gateway 网络和配置热重载 lanes
  - `package`：原生工件软件包/更新/插件 lanes，不含 OpenWebUI 或实时 ClawHub
  - `product`：在 package 配置项基础上增加 MCP 渠道、cron/subagent 清理、
    OpenAI Web 搜索和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确指定 `docker_lanes`，用于聚焦重跑
- 当你只需要对发布候选进行完整的常规 CI 覆盖时，直接运行手动 `CI` workflow。
  手动 CI 派发会绕过 changed 范围限制，并强制运行 Linux Node 分片、内置插件分片、渠道契约、
  Node 22 兼容性、`check`、`check-additional`、构建冒烟、
  文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n
  lanes。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会
  通过本地 OTLP/HTTP 接收器驱动 QA-lab，并验证导出的 trace
  span 名称、有界属性以及内容/标识符脱敏，而无需
  Opik、Langfuse 或其他外部收集器。
- 在每个带标签的发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock 一致性 gate，以及快速
  实时 Matrix profile 和 Telegram QA lane。实时
  lanes 使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI
  凭证租约。若你想并行获取完整的 Matrix
  传输、媒体和 E2EE 清单，请运行手动 `QA-Lab - All Lanes` workflow，并设置
  `matrix_profile=all` 和 `matrix_shards=true`。
- 跨 OS 的安装与升级运行时验证属于公开
  `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它们会直接调用
  可复用 workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意设计的：让真正的 npm 发布路径保持简短、
  确定性和以工件为中心，而较慢的实时检查则放在
  独立 lane 中，以免拖慢或阻塞发布
- 含密钥的发布检查应通过 `Full Release
Validation` 或从 `main`/release workflow ref 派发，以便 workflow 逻辑和
  密钥保持受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要
  解析后的提交可从某个 OpenClaw 分支或发布标签到达
- `OpenClaw NPM Release` 仅验证预检也接受当前
  完整 40 字符 workflow 分支提交 SHA，而不要求存在已推送标签
- 该 SHA 路径仅用于验证，不能推广为真实发布
- 在 SHA 模式下，该 workflow 仅为软件包元数据检查合成 `v<package.json version>`；
  真实发布仍然要求真实的发布标签
- 两个 workflow 都将真实发布和推广路径保留在 GitHub 托管 runner 上，
  而非变更性的验证路径则可使用更大的
  Blacksmith Linux runners
- 该 workflow 会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  ，并同时使用 `OPENAI_API_KEY` 与 `ANTHROPIC_API_KEY` workflow 密钥
- npm 发布预检不再等待单独的发布检查 lane
- 在批准前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/修正版版本），以在全新的临时 prefix 中验证已发布的注册表
  安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  ，以便针对已发布的 npm 软件包，使用共享租赁的 Telegram 凭证池，验证已安装软件包的新手引导、Telegram 设置以及真实 Telegram E2E。
  本地维护者的一次性检查可省略 Convex 变量，直接传入三个
  `OPENCLAW_QA_TELEGRAM_*` 环境凭证。
- 维护者也可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` workflow 运行相同的发布后检查。
  它有意仅限手动运行，不会在每次合并时执行。
- 维护者发布自动化现在采用 preflight-then-promote：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.D` 分支派发
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可通过 workflow 输入显式指定 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以提升安全性，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开
    仓库保持仅使用 OIDC 发布
  - 公开 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会推广已准备好的工件，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器
  还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一路径临时 prefix 升级流程，
  以确保发布修正不会悄悄让旧的全局安装停留在基础 stable 负载上
- npm 发布预检默认失败关闭，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，
  以防我们再次发布一个空的浏览器仪表盘
- 发布后验证还会检查已发布的注册表安装是否在根级 `dist/*`
  布局下包含非空的内置插件运行时依赖。若发布包缺少或包含空的内置插件
  依赖负载，则发布后验证器会失败，并且不能被推广到
  `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，
  这样安装器 e2e 就能在发布路径之前捕获意外的软件包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或
  扩展测试矩阵，请在批准前重新生成并审查
  `.github/workflows/ci.yml` 中由 planner 拥有的
  `checks-node-extensions` workflow 矩阵输出，以免发布说明描述的是过时的 CI 布局
- Stable macOS 发布就绪还包括更新器相关表面：
  - GitHub release 最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 已打包应用必须保持非调试 bundle id、非空的 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## 发布测试验证项

`Full Release Validation` 是操作员从
单一入口点启动所有发布前测试的方式。请从可信的 `main` workflow ref 运行它，并将发布
分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both
```

该 workflow 会解析目标 ref，派发带有
`target_ref=<release-ref>` 的手动 `CI`，派发 `OpenClaw Release Checks`，并在设置了
`npm_telegram_package_spec` 时可选地派发独立的发布后 Telegram E2E。
随后 `OpenClaw Release Checks` 会扇出执行
安装冒烟、跨 OS 发布检查、实时/E2E Docker 发布路径覆盖、
带 Telegram 软件包 QA 的 Package Acceptance、QA Lab 一致性、实时 Matrix 和
实时 Telegram。只有当 `Full Release Validation`
摘要显示 `normal_ci` 和 `release_checks` 均成功，并且任何可选的
`npm_telegram` 子项要么成功要么被有意跳过时，完整运行才算可接受。

根据发布阶段使用以下变体：

```bash
# 验证尚未发布的候选发布分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# 验证一个精确的已推送提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# 在 beta 发布后，增加基于已发布软件包的 Telegram E2E。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在聚焦修复之后的第一次重跑时就使用完整总流程。如果某个验证项
失败了，请使用失败的子 workflow、job、Docker lane、软件包 profile、模型
provider 或 QA lane 作为下一轮证明。只有当修复更改了共享的发布编排，
或者使先前的全验证项证据失效时，才再次运行完整总流程。

### Vitest

Vitest 验证项是手动 `CI` 子 workflow。手动 CI 会有意
绕过 changed 范围限制，并对发布候选强制运行常规测试图：
Linux Node 分片、内置插件分片、渠道契约、Node 22
兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python
Skills、Windows、macOS、Android 和 Control UI i18n。

使用这个验证项来回答“源代码树是否通过了完整的常规测试套件？”
它不同于发布路径的产品验证。应保留的证据包括：

- 显示已派发 `CI` 运行 URL 的 `Full Release Validation` 摘要
- 针对精确目标 SHA 的绿色 `CI` 运行
- 在排查回归时，来自 CI jobs 的失败或缓慢分片名称
- 当运行需要性能分析时，诸如 `.artifacts/vitest-shard-timings.json` 之类的 Vitest 计时工件

仅当发布需要确定性的常规 CI，但不需要 Docker、QA Lab、实时、跨 OS 或软件包验证项时，才直接运行手动 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 验证项位于 `OpenClaw Release Checks` 中，通过
`openclaw-live-and-e2e-checks-reusable.yml` 以及发布模式的
`install-smoke` workflow 提供。它会通过已打包的
Docker 环境来验证发布候选，而不仅仅是源代码级测试。

发布 Docker 覆盖包括：

- 启用慢速 Bun 全局安装冒烟的完整安装冒烟
- 仓库 E2E lanes
- 发布路径 Docker 分块：`core`、`package-update` 和
  `plugins-integrations`
- 在请求时，于 `plugins-integrations` 分块中包含 OpenWebUI 覆盖
- 当发布检查包含实时套件时，提供实时/E2E provider 套件和 Docker 实时模型覆盖

重跑之前先使用 Docker 工件。发布路径调度器会上传
`.artifacts/docker-tests/`，其中包含 lane 日志、`summary.json`、`failures.json`、
阶段耗时、调度器计划 JSON 和重跑命令。若要聚焦恢复，
请在可复用的实时/E2E workflow 上使用 `docker_lanes=<lane[,lane]>`，
而不要重跑所有发布分块。生成的重跑命令会在可用时包含先前的
`package_artifact_run_id` 和已准备好的 Docker 镜像输入，因此失败的 lane 可以复用同一个 tarball 和 GHCR 镜像。

### QA Lab

QA Lab 验证项也是 `OpenClaw Release Checks` 的一部分。它是面向智能体行为与渠道级别的发布 gate，独立于 Vitest 和 Docker 软件包机制。

发布 QA Lab 覆盖包括：

- mock 一致性 gate：使用 agentic parity pack，将 OpenAI 候选 lane 与 Opus 4.6
  基线进行比较
- 使用 `qa-live-shared` 环境的快速实时 Matrix QA profile
- 使用 Convex CI 凭证租约的实时 Telegram QA lane
- 当发布遥测需要显式本地证明时，运行 `pnpm qa:otel:smoke`

使用这个验证项来回答“该发布在 QA 场景和
实时渠道流程中是否表现正确？”在批准发布时，请保留 parity、Matrix 和 Telegram
lanes 的工件 URL。完整 Matrix 覆盖仍可通过手动分片的 QA-Lab 运行获得，而不是作为默认的发布关键 lane。

### Package

Package 验证项是可安装产品的 gate。它由
`Package Acceptance` 和解析器
`scripts/resolve-openclaw-package-candidate.mjs` 提供支持。该解析器会将
候选标准化为供 Docker E2E 使用的 `package-under-test` tarball，验证
软件包清单，记录软件包版本和 SHA-256，并将
workflow harness ref 与软件包源 ref 分离。

支持的候选来源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布
  版本
- `source=ref`：使用所选 `workflow_ref` harness 打包可信的 `package_ref` 分支、标签或完整提交 SHA
- `source=url`：下载带有必需 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：复用由其他 GitHub Actions 运行上传的 `.tgz`

`OpenClaw Release Checks` 会以 `source=ref`、
`package_ref=<release-ref>`、`suite_profile=package` 和
`telegram_mode=mock-openai` 运行 Package Acceptance。
该配置项覆盖安装、更新、通过离线插件夹具进行的插件软件包契约，以及针对同一解析 tarball 的 Telegram 软件包 QA。
它是大多数过去需要 Parallels 才能完成的软件包/更新覆盖的 GitHub 原生替代方案。
跨 OS 发布检查对于 OS 特定的新手引导、安装器和平台行为仍然重要，但软件包/更新产品验证应优先使用 Package Acceptance。

当发布问题涉及实际可安装的软件包时，请使用更广的 Package Acceptance 配置项：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常见的软件包配置项：

- `smoke`：快速软件包安装/渠道/智能体、gateway 网络和配置
  热重载 lanes
- `package`：不含实时 ClawHub 的安装/更新/插件软件包契约；这是 release-check 的默认值
- `product`：`package` 加上 MCP 渠道、cron/subagent 清理、OpenAI web
  搜索和 OpenWebUI
- `full`：带 OpenWebUI 的 Docker 发布路径分块
- `custom`：精确的 `docker_lanes` 列表，用于聚焦重跑

若要获取软件包候选的 Telegram 证明，请在 Package Acceptance 上启用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。该 workflow 会将已解析的
`package-under-test` tarball 传入 Telegram lane；而独立的
Telegram workflow 仍然接受已发布的 npm 规格，用于发布后检查。

## NPM workflow 输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整 40 字符 workflow 分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅进行验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：在真实发布路径中必填，以便 workflow 复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认是 `beta`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。含密钥的检查要求解析后的提交必须可从某个 OpenClaw 分支或发布标签到达。

规则：

- Stable 和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当
  `preflight_only=true` 时才允许使用完整提交 SHA 输入
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终
  仅用于验证
- 真实发布路径必须使用与预检时相同的 `npm_dist_tag`；
  workflow 会在继续发布前验证该元数据

## Stable npm 发布顺序

在发布 stable npm 版本时：

1. 运行 `OpenClaw NPM Release`，设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整 workflow 分支提交
     SHA，对预检 workflow 进行仅验证的试运行
2. 对于正常的 beta-first 流程，选择 `npm_dist_tag=beta`；只有在你明确想直接发布 stable 时才选择 `latest`
3. 当你希望通过一个手动 workflow 一次性获取常规 CI 加上实时 prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，请在发布分支、发布标签或完整
   提交 SHA 上运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，请改为在发布 ref 上运行手动
   `CI` workflow
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，
   使用相同的 `tag`、相同的 `npm_dist_tag` 和已保存的 `preflight_run_id`
7. 如果该发布落在 `beta` 上，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow，将该 stable 版本从 `beta` 推广到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta`
   也应立即跟随同一个 stable 构建，请使用同一个私有
   workflow 将两个 dist-tag 都指向该 stable 版本，或者让其计划内的
   自愈同步稍后再移动 `beta`

dist-tag 变更位于私有仓库中是出于安全原因，因为它仍然
需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样既记录了直接发布路径，也记录了 beta-first 推广路径，并且两者都对操作员可见。

如果维护者必须退回到本地 npm 认证，仅可在专用的 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要在主智能体 shell 中直接调用 `op`；
将其限制在 tmux 中，可以让提示、警报和 OTP 处理可观察，并防止重复主机警报。

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

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际运行手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
