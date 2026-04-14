---
read_when:
    - 查找公开发布渠道定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-14T16:20:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 021ae4b3e6a258c8396eccb99f00ca6cc268c2496258786521a053ebd776ba60
    source_path: reference/RELEASING.md
    workflow: 15
---

# 发布策略

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确指定时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前已提升的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版发布默认发布到 npm `beta`；发布操作人员可以显式指定 `latest`，或稍后再提升经过验证的 beta 构建
- 每个 OpenClaw 发布都会同时交付 npm 包和 macOS 应用

## 发布节奏

- 发布采用 beta 优先流程
- 只有在最新 beta 验证通过后，才会跟进 stable
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布前检查

- 在运行 `pnpm release:check` 之前先运行 `pnpm build && pnpm ui:build`，以便在打包校验步骤中确保预期的 `dist/*` 发布产物和 Control UI bundle 已存在
- 每次带标签的发布之前都要运行 `pnpm release:check`
- 发布检查现在在一个单独的手动工作流中运行：
  `OpenClaw Release Checks`
- 这样拆分是有意为之：让真实的 npm 发布路径保持简短、可预测，并聚焦于产物，而较慢的实时检查则保留在独立通道中，避免拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用发起，这样工作流逻辑和 secrets 才保持为规范来源
- 该工作流接受现有发布标签，或当前完整的 40 字符 `main` commit SHA
- 在 commit-SHA 模式下，它只接受当前的 `origin/main` HEAD；如果是较旧的发布 commit，请使用发布标签
- `OpenClaw NPM Release` 的仅验证预检查也接受当前完整的 40 字符 `main` commit SHA，而不要求已有已推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都会将真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更型的验证路径则可以使用更大的 Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流 secrets
- npm 发布预检查不再等待独立的发布检查通道完成
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版版本），以在全新的临时前缀中验证已发布的 registry 安装路径
- 维护者发布自动化现在使用“预检查后再提升”流程：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可以通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以提升安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后校验器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，从而避免修正版发布在无提示的情况下让旧的全局安装仍停留在基础 stable 负载上
- npm 发布预检查默认采用失败即关闭的策略：除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，否则检查失败，这样我们就不会再次发布一个空的浏览器仪表板
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制校验，因此安装器 e2e 会在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的、由 planner 管理的 `checks-node-extensions` 工作流矩阵输出，以免发布说明描述过时的 CI 布局
- Stable macOS 发布就绪还包括更新器相关界面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作人员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整的
  40 字符 `main` commit SHA，用于仅验证的预检查
- `preflight_only`：`true` 表示仅做验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径中必填，以便工作流复用成功预检查运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认是 `beta`

`OpenClaw Release Checks` 接受这些由操作人员控制的输入：

- `ref`：用于验证的现有发布标签，或当前完整的 40 字符 `main` commit
  SHA

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 只有在 `preflight_only=true` 时才允许使用完整 commit SHA 输入
- 发布检查的 commit-SHA 模式也要求当前 `origin/main` HEAD
- 真实发布路径必须使用与预检查期间相同的 `npm_dist_tag`；工作流会在继续发布前校验该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整的 `main` commit SHA，对预检查工作流进行仅验证的演练
2. 在正常的 beta 优先流程中选择 `npm_dist_tag=beta`，只有在你明确希望直接发布 stable 时才选择 `latest`
3. 单独运行 `OpenClaw Release Checks`，使用相同的标签，或者在需要实时 prompt cache 覆盖时使用当前完整的 `main` commit SHA
   - 之所以单独拆开，是为了让实时覆盖在保持可用的同时，不会将长时间运行或不稳定的检查重新耦合到发布工作流中
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，同时使用相同的 `tag`、相同的 `npm_dist_tag`，以及已保存的 `preflight_run_id`
6. 如果该发布落在 `beta`，使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该 stable 版本从 `beta` 提升到 `latest`
7. 如果该发布是有意直接发布到 `latest`，并且 `beta` 也应立即跟进相同的 stable 构建，则使用同一个私有工作流将这两个 dist-tag 都指向该 stable 版本，或者让其定时自愈同步稍后再移动 `beta`

dist-tag 变更位于私有仓库中是出于安全考虑，因为它仍然需要
`NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样一来，直接发布路径和 beta 优先提升路径都得到了文档化，并且对操作人员可见。

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际操作手册。
