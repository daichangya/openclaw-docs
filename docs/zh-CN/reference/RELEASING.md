---
read_when:
    - 查找公开发布渠道定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-13T13:04:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdc32839447205d74ba7a20a45fbac8e13b199174b442a1e260e3fce056c63da
    source_path: reference/RELEASING.md
    workflow: 15
---

# 发布策略

OpenClaw 有三个公开发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确指定时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份和日期不要补零
- `latest` 表示当前已提升为正式版的稳定 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版默认发布到 npm `beta`；发布操作人员可以明确指定目标为 `latest`，或者在稍后将经过验证的 beta 构建提升为正式版
- 每个 OpenClaw 发布都会同时交付 npm 包和 macOS 应用

## 发布节奏

- 发布采用 beta-first 流程
- 只有在最新 beta 通过验证后，才会发布 stable
- 详细的发布流程、审批、凭证和恢复说明仅供维护者使用

## 发布前检查

- 在运行 `pnpm release:check` 之前，先运行 `pnpm build && pnpm ui:build`，以便 pack 校验步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 每次带标签发布前都要运行 `pnpm release:check`
- 现在发布检查在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- 这种拆分是有意设计的：让真正的 npm 发布路径保持简短、确定且聚焦于产物，而较慢的实时检查则保留在它自己的通道中，避免拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用派发，以确保工作流逻辑和 secrets 保持规范一致
- 该工作流接受现有发布标签，或者当前完整的 40 字符 `main` 提交 SHA
- 在 commit-SHA 模式下，它只接受当前的 `origin/main` HEAD；对于更早的发布提交，请使用发布标签
- `OpenClaw NPM Release` 的仅验证 preflight 也接受当前完整的 40 字符 `main` 提交 SHA，而不要求已推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，该工作流仅为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub-hosted runners 上，而不产生变更的验证路径则可以使用更大的 Blacksmith Linux runners
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 这两个工作流 secrets
- npm 发布 preflight 不再等待单独的发布检查通道完成
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版本），以便在全新的临时前缀中验证已发布的 registry 安装路径
- 维护者发布自动化现在采用先 preflight 再 promote 的流程：
  - 真正的 npm 发布必须通过成功的 npm `preflight_run_id`
  - 稳定版 npm 发布默认目标为 `beta`
  - 稳定版 npm 发布可以通过工作流输入明确指定目标为 `latest`
  - 仍然支持在可信的 `OpenClaw NPM Release` 工作流中，以显式手动模式将稳定版从 `beta` 提升到 `latest`
  - 直接稳定版发布也可以运行显式的 dist-tag sync 模式，将 `latest` 和 `beta` 都指向已发布的稳定版本
  - 这些 dist-tag 模式仍然需要 `npm-release` 环境中的有效 `NPM_TOKEN`，因为 npm `dist-tag` 管理与 trusted publishing 是分开的
  - 公开的 `macOS Release` 仅用于验证
  - 真正的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真正的发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的稳定版修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，以确保修正版发布不会悄悄让旧的全局安装仍停留在基础稳定版载荷上
- npm 发布 preflight 默认采用失败即关闭的方式，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，以避免再次发布一个空的浏览器仪表板
- 如果发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml` 的 planner-owned `checks-node-extensions` 工作流矩阵输出，以确保发布说明不会描述过时的 CI 布局
- 稳定版 macOS 发布就绪性还包括更新器相关表面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整的 40 字符 `main` 提交 SHA，用于仅验证的 preflight
- `preflight_only`：`true` 表示仅做验证/构建/打包，`false` 表示
  真实发布路径
- `preflight_run_id`：在真实发布路径中必填，以便工作流复用成功 preflight 运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`
- `promote_beta_to_latest`：`true` 表示跳过发布，并将已发布的稳定版 `beta` 构建移动到 `latest`
- `sync_stable_dist_tags`：`true` 表示跳过发布，并将 `latest` 和
  `beta` 都指向已发布的稳定版本

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：要验证的现有发布标签，或当前完整的 40 字符 `main` 提交
  SHA

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 完整提交 SHA 输入仅在 `preflight_only=true` 时允许
- 发布检查的 commit-SHA 模式还要求是当前 `origin/main` HEAD
- 真实发布路径必须使用与 preflight 相同的 `npm_dist_tag`；工作流会在继续发布前验证该元数据
- 提升模式必须使用稳定版或修正版标签、`preflight_only=false`、空的 `preflight_run_id`，以及 `npm_dist_tag=beta`
- Dist-tag sync 模式必须使用稳定版或修正版标签、
  `preflight_only=false`、空的 `preflight_run_id`、`npm_dist_tag=latest`，
  且 `promote_beta_to_latest=false`
- 提升模式和 dist-tag sync 模式也都需要有效的 `NPM_TOKEN`，因为
  `npm dist-tag add` 仍然需要常规 npm 认证；trusted publishing 只覆盖包发布路径

## 稳定版 npm 发布顺序

在进行稳定版 npm 发布时：

1. 运行 `OpenClaw NPM Release`，设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整的 `main` 提交 SHA，对 preflight 工作流进行仅验证的 dry run
2. 在正常的 beta-first 流程中选择 `npm_dist_tag=beta`，只有在你有意直接发布稳定版时才选择 `latest`
3. 单独使用相同标签运行 `OpenClaw Release Checks`，或者在你需要实时 prompt cache 覆盖时，使用当前完整的 `main` 提交 SHA
   - 这一步是刻意分离的，这样在不重新耦合长时间运行或不稳定检查到发布工作流的前提下，仍然可以保留实时覆盖能力
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的 `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
6. 如果该发布先落在 `beta`，则在你希望将该已发布构建移动到 `latest` 时，稍后以相同的稳定版 `tag` 运行 `OpenClaw NPM Release`，并设置 `promote_beta_to_latest=true`、`preflight_only=false`、`preflight_run_id` 为空，以及 `npm_dist_tag=beta`
7. 如果该发布有意直接发布到 `latest`，并且 `beta` 也应跟随同一稳定构建，则使用相同的稳定版 `tag` 运行 `OpenClaw NPM Release`，并设置 `sync_stable_dist_tags=true`、`promote_beta_to_latest=false`、`preflight_only=false`、`preflight_run_id` 为空，以及 `npm_dist_tag=latest`

提升模式和 dist-tag sync 模式仍然需要 `npm-release`
环境审批，以及该工作流运行时可访问的有效 `NPM_TOKEN`。

这样可以让直接发布路径和 beta-first 提升路径都保持有文档记录，并且对操作人员可见。

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际运行手册。
