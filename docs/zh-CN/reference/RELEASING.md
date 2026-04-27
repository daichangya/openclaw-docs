---
read_when:
    - 查找公开发布渠道定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-27T03:46:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f2481413208fd227620980c48a2a3ef195be97926d240b0b350cc2ab649b91f
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布渠道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- 稳定版本号：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定修正版版本号：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本号：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要对月份或日期补零
- `latest` 表示当前已提升为正式版的稳定 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定修正版默认发布到 npm `beta`；发布操作人员可以显式指定发布到 `latest`，或者稍后再提升已验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，而 mac 应用的构建/签名/公证仅保留给稳定版，除非有明确要求

## 发布节奏

- 发布先走 beta
- 只有在最新 beta 验证通过后，才会进入 stable
- 维护者通常从当前 `main` 创建的 `release/YYYY.M.D` 分支切出发布版本，这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布后又需要修复，维护者会切出下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布前检查

- 在发布前检查之前运行 `pnpm check:test-types`，这样测试 TypeScript 也能在更快的本地 `pnpm check` 检查之外得到覆盖
- 在发布前检查之前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查也能在更快的本地检查之外保持绿色
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，以便打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 当你需要通过单一入口运行完整发布验证套件时，在发布审批前运行手动 `Full Release Validation` 工作流。它接受分支、标签或完整提交 SHA，派发手动 `CI`，并派发 `OpenClaw Release Checks`，用于安装冒烟测试、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 渠道。
  只有在包已经发布，且还需要运行发布后的 Telegram E2E 时，才提供 `npm_telegram_package_spec`。
  示例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 当你希望在发布工作继续进行时，为某个候选包获取旁路证明，可运行手动 `Package Acceptance` 工作流。对 `openclaw@beta`、`openclaw@latest` 或精确发布版本使用 `source=npm`；使用 `source=ref` 通过当前 `workflow_ref` harness 打包可信的 `package_ref` 分支/标签/SHA；对带必填 SHA-256 的 HTTPS tarball 使用 `source=url`；对由其他 GitHub Actions 运行上传的 tarball 使用 `source=artifact`。该工作流会将候选包解析为 `package-under-test`，针对该 tarball 复用 Docker E2E 发布调度器，并且可选运行已发布 npm 的 Telegram QA。
  示例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product`
  常见配置：
  - `smoke`：安装/渠道/智能体、Gateway 网关网络和配置重载通道
  - `package`：包/更新/插件通道，不含 OpenWebUI
  - `product`：在 package 配置基础上增加 MCP 渠道、cron/subagent 清理、OpenAI web search 和 OpenWebUI
  - `full`：带 OpenWebUI 的 Docker 发布路径分块
  - `custom`：精确选择 `docker_lanes`，用于有针对性的重跑
- 当你只需要候选发布版本的完整常规 CI 覆盖时，直接运行手动 `CI` 工作流。手动 CI 派发会绕过变更范围裁剪，并强制运行 Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器运行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，而不需要 Opik、Langfuse 或其他外部收集器。
- 每次带标签发布之前都要运行 `pnpm release:check`
- 发布检查现在在一个单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也会在发布审批前运行 QA Lab mock 一致性闸门，以及实时 Matrix 和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。
- 跨 OS 的安装和升级运行时验证由私有调用方工作流派发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持简短、确定性强且聚焦产物，而较慢的实时检查留在各自独立通道中，避免拖慢或阻塞发布
- 含密钥的发布检查应通过 `Full Release Validation` 派发，或从 `main`/发布工作流 ref 派发，以便工作流逻辑和密钥始终受控
- `OpenClaw Release Checks` 接受分支、标签或完整提交 SHA，只要解析后的提交可从 OpenClaw 分支或发布标签到达即可
- `OpenClaw NPM Release` 的仅验证预检查也接受当前工作流分支提交的完整 40 字符 SHA，而不要求已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真正的发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真正发布仍然需要真实的发布标签
- 两个工作流都会把真正的发布和提升路径保留在 GitHub 托管 runner 上，而非变更性的验证路径则可以使用更大的 Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布预检查不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/修正版版本），以便在全新的临时前缀中验证已发布的注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以便使用共享租用的 Telegram 凭证池，针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。维护者在本地一次性运行时可以省略 Convex 变量，并直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中的手动 `NPM Telegram Beta E2E` 工作流运行相同的发布后检查。该工作流刻意只支持手动运行，不会在每次合并时执行。
- 维护者发布自动化现在使用“先预检查再提升”：
  - 真正的 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真正的 npm 发布必须从与成功预检查运行相同的 `main` 或 `release/YYYY.M.D` 分支派发
  - 稳定 npm 发布默认使用 `beta`
  - 稳定 npm 发布可以通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    出于安全原因，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真正的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真正的发布路径会提升已准备好的产物，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的稳定修正版发布，发布后验证器还会检查从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的同一临时前缀升级路径，以确保修正版不会悄悄让旧的全局安装仍停留在基础稳定版负载上
- npm 发布预检查默认失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 内容，这样可以避免再次发布空的浏览器仪表盘
- 发布后验证还会检查已发布的注册表安装是否在根 `dist/*` 布局下包含非空的内置插件运行时依赖。若某个发布缺少这些依赖内容，或内容为空，则发布后验证器会失败，并且该版本不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，因此安装器 e2e 能在发布路径之前捕获意外的打包膨胀
- 如果此次发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的、由规划器负责的 `checks-node-extensions` 工作流矩阵输出，以避免发布说明描述过时的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器相关表面：
  - GitHub 发布最终必须包含打包好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前工作流分支提交的完整 40 字符 SHA，用于仅验证的预检查
- `preflight_only`：`true` 表示只做验证/构建/打包，`false` 表示真正的发布路径
- `preflight_run_id`：在真正发布路径中必填，这样工作流才能复用成功预检查运行所准备的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受这些由操作人员控制的输入：

- `ref`：要验证的分支、标签或完整提交 SHA。含密钥的检查要求解析后的提交必须可从 OpenClaw 分支或发布标签到达。

规则：

- 稳定标签和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在 `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 始终仅用于验证
- 真正的发布路径必须使用与预检查相同的 `npm_dist_tag`；工作流会在继续发布前验证该元数据

## 稳定 npm 发布顺序

切出稳定 npm 发布时：

1. 使用 `preflight_only=true` 运行 `OpenClaw NPM Release`
   - 在标签尚不存在之前，你可以使用当前工作流分支提交的完整
     SHA，对预检查工作流进行一次仅验证的预演
2. 常规的 beta 优先流程请选择 `npm_dist_tag=beta`，只有在你有意直接发布稳定版时才选择 `latest`
3. 当你希望通过一个手动工作流获得常规 CI 加上实时 prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆盖时，在发布分支、发布标签或完整提交 SHA 上运行 `Full Release Validation`
4. 如果你明确只需要确定性的常规测试图，则改为在发布 ref 上运行手动 `CI` 工作流
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
7. 如果该发布先落在 `beta`，使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版本从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta`
   应立即跟随同一稳定构建，则使用同一个私有工作流将两个 dist-tag 都指向该稳定版本，或者让其计划中的自愈同步稍后再移动 `beta`

出于安全原因，dist-tag 变更放在私有仓库中，因为它仍然需要
`NPM_TOKEN`，而公开仓库保持仅 OIDC 发布。

这样既记录了直接发布路径，也记录了 beta 优先提升路径，并且两者对操作人员都是可见的。

如果维护者必须回退到本地 npm 身份验证，请仅在专用的 tmux 会话中运行任何 1Password
CLI（`op`）命令。不要直接从主 agent shell 调用 `op`；将其限制在 tmux 中可以让提示、告警和 OTP 处理保持可观察，并防止主机重复弹出告警。

## 公开参考资料

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档作为实际操作手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
