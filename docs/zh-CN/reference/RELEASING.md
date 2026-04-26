---
read_when:
    - 查找公开发布渠道的定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-26T02:36:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升为正式版的 stable npm 发布
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版发布默认发布到 npm `beta`；发布操作人员可以显式将目标设为 `latest`，或稍后再提升一个经过验证的 beta 构建
- 每个 stable OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm / package 路径，而 mac
  应用的构建 / 签名 / 公证通常保留给 stable，除非另有明确要求

## 发布节奏

- 发布采用 beta-first 流程
- 只有在最新 beta 完成验证后，才会跟进 stable
- 维护者通常从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布，且需要修复，维护者会切下一个
  `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅面向维护者

## 发布前检查

- 在发布前检查前运行 `pnpm check:test-types`，这样测试 TypeScript
  仍会在更快的本地 `pnpm check` 门禁之外得到覆盖
- 在发布前检查前运行 `pnpm check:architecture`，这样更广泛的导入环路
  和架构边界检查会在更快的本地门禁之外保持通过
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样
  期望的 `dist/*` 发布产物和 Control UI bundle 会在 pack
  验证步骤中存在
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP / HTTP
  接收器运行 QA-lab，并验证导出的追踪 span 名称、有界属性以及内容 /
  标识符脱敏，而无需 Opik、Langfuse 或其他外部收集器。
- 在每次带标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock parity 门禁，
  以及实时的 Matrix 和 Telegram QA 通道。实时通道使用
  `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。
- 跨 OS 的安装和升级运行时验证由私有调用方工作流分发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公共工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真实的 npm 发布路径保持简短、
  可预测，并聚焦产物，同时将较慢的实时检查放在独立通道中，
  以免拖慢或阻塞发布
- 发布检查必须从 `main` 工作流 ref 或
  `release/YYYY.M.D` 工作流 ref 分发，这样工作流逻辑和密钥才能保持受控
- 该工作流接受现有发布标签，或当前完整的 40 字符工作流分支提交 SHA
- 在 commit-SHA 模式下，它只接受当前工作流分支的 HEAD；较早的发布提交请使用
  发布标签
- `OpenClaw NPM Release` 的仅验证 preflight 也接受当前完整的
  40 字符工作流分支提交 SHA，而不要求先推送标签
- 该 SHA 路径仅用于验证，不能被提升为真实发布
- 在 SHA 模式下，该工作流只会为包元数据检查合成
  `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个工作流都将真实发布和提升路径保留在 GitHub-hosted
  runners 上，而非变更型验证路径可以使用更大的
  Blacksmith Linux runners
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 这两个工作流密钥
- npm 发布 preflight 不再等待单独的发布检查通道
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta / 修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta / 修正版版本），以在新的临时前缀中验证已发布的
  registry 安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置以及真实 Telegram E2E，
  并使用共享的租赁 Telegram 凭证池。本地维护者的单次运行可以省略 Convex 变量，
  直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中的手动
  `NPM Telegram Beta E2E` 工作流运行同样的发布后检查。它刻意只支持手动触发，
  不会在每次合并时运行。
- 维护者发布自动化现在使用 preflight-then-promote：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功 preflight 运行相同的 `main` 或
    `release/YYYY.M.D` 分支分发
  - stable npm 发布默认指向 `beta`
  - stable npm 发布可以通过工作流输入显式指定目标为 `latest`
  - 基于 token 的 npm dist-tag 修改现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提高安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公共
    仓库保持仅使用 OIDC 发布
  - 公共的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器
  还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，
  这样发布修正就不会悄悄让较旧的全局安装仍停留在基础 stable 载荷上
- npm 发布 preflight 默认采用失败即关闭策略，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，
  以避免我们再次发布一个空的浏览器仪表板
- 发布后验证还会检查已发布的 registry 安装在根级 `dist/*`
  布局下包含非空的内置插件运行时依赖。若某个发布携带缺失或空的内置插件
  依赖载荷，则发布后验证器会判定失败，且不能被提升到
  `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize`
  预算进行强制检查，因此安装器 e2e 能在发布路径之前捕获意外的打包膨胀
- 如果发布工作触及了 CI 规划、扩展 timing manifests 或扩展测试矩阵，
  请在审批前重新生成并审查位于 `.github/workflows/ci.yml`
  中由 planner 负责的 `checks-node-extensions` 工作流矩阵输出，
  以免发布说明描述的是过时的 CI 布局
- Stable macOS 发布就绪性还包括更新器相关表面：
  - GitHub release 最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整的 40 字符工作流分支提交 SHA，用于仅验证的 preflight
- `preflight_only`：`true` 表示仅验证 / 构建 / 打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径上必填，这样工作流可以复用成功
  preflight 运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：现有发布标签，或从 `main` 分发时当前完整的 40 字符 `main` 提交
  SHA；若从发布分支分发，请使用现有发布标签或当前完整的 40 字符发布分支提交
  SHA

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 始终仅用于验证，也接受当前工作流分支提交 SHA
- 发布检查的 commit-SHA 模式还要求该 SHA 必须是当前工作流分支 HEAD
- 真实发布路径必须使用 preflight 期间使用的同一个 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整的工作流分支提交
     SHA 来对 preflight 工作流进行仅验证的 dry run
2. 对于正常的 beta-first 流程，选择 `npm_dist_tag=beta`；只有在你明确
   想直接发布 stable 时，才选择 `latest`
3. 单独运行 `OpenClaw Release Checks`，并使用相同标签，或者
   当前完整的工作流分支提交 SHA，以便获得实时 prompt cache、
   QA Lab parity、Matrix 和 Telegram 覆盖
   - 之所以单独拆开，是为了让实时覆盖保持可用，而不把长时间运行或不稳定的检查
     重新耦合回发布工作流
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
6. 如果该发布先落到 `beta`，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流将该 stable 版本从 `beta` 提升到 `latest`
7. 如果该发布是有意直接发布到 `latest`，且 `beta`
   也应立即跟进同一个 stable 构建，请使用同一个私有工作流让两个 dist-tag
   都指向该 stable 版本，或者让其计划中的自愈同步稍后再移动 `beta`

出于安全原因，dist-tag 修改位于私有仓库中，因为它仍然
需要 `NPM_TOKEN`，而公共仓库保持仅使用 OIDC 发布。

这让直接发布路径和 beta-first 提升路径都保持文档化且对操作人员可见。

如果维护者必须回退到本地 npm 身份验证，请仅在专用 tmux 会话内运行任何
1Password CLI（`op`）命令。不要直接从主智能体 shell 调用 `op`；
将其保留在 tmux 内可以让提示、告警和 OTP 处理可观察，并防止重复的主机告警。

## 公开参考资料

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际运行手册。

## 相关内容

- [发布渠道](/zh-CN/install/development-channels)
