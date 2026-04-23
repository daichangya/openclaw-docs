---
read_when:
    - 在查找公共发布渠道定义
    - 在查找版本命名与发布节奏ುಂಬ to=final code  omitted
summary: 公共发布渠道、版本命名与发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-23T21:03:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f65638c0a1ddd1467bda7e5e2242935796edaca077a25b70d4227cc900471a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公共发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在显式指定时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的移动头部版本

## 版本命名

- 稳定版发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- 稳定版修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升的稳定 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正发布默认发布到 npm `beta`；发布操作员可以显式指定 `latest`，或稍后再提升已验证的 beta 构建
- 每个稳定版 OpenClaw 发布都会同时发布 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，而
  Mac 应用的构建/签名/公证除非显式要求，否则通常保留给稳定版

## 发布节奏

- 发布先走 beta
- 只有在最新 beta 被验证后，stable 才会跟进
- 维护者通常会从当前 `main` 创建的 `release/YYYY.M.D` 分支上切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经被推送或发布后还需要修复，维护者会切出
  下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，以确保测试 TypeScript 在更快的本地 `pnpm check` 门禁之外仍被覆盖
- 在发布预检前运行 `pnpm check:architecture`，以确保更广泛的导入循环和架构边界检查在更快的本地门禁之外保持通过
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，以确保预期的
  `dist/*` 发布工件和 Control UI bundle 存在，从而通过 pack
  验证步骤
- 在每个带标签的发布之前运行 `pnpm release:check`
- 发布检查现在在一个单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock 一致性门禁，以及实时的
  Matrix 和 Telegram QA 通道。实时通道使用
  `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。
- 跨操作系统的安装与升级运行时验证由私有调用方工作流分发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公共工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：保持真实 npm 发布路径简短、
  确定且以工件为中心，而较慢的实时检查则保持在
  独立通道中，这样它们就不会拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用，或从
  `release/YYYY.M.D` 工作流引用分发，这样工作流逻辑和密钥才能保持受控
- 该工作流接受现有发布标签，或当前完整的
  40 位工作流分支提交 SHA
- 在提交 SHA 模式下，它只接受当前工作流分支 HEAD；对于旧的发布提交，请使用
  发布标签
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整的 40 位
  工作流分支提交 SHA，而不要求已经推送标签
- 该 SHA 路径仅用于验证，不能被提升为真实发布
- 在 SHA 模式下，工作流仅为了包元数据检查而合成 `v<package.json version>`；
  真正的发布仍然需要真实的发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管的运行器上，而非变更验证路径则可以使用更大的
  Blacksmith Linux 运行器
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  ，并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta/修正标签）
- 在 npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta/修正版本）以在全新的临时前缀中验证已发布注册表的
  安装路径
- 维护者发布自动化现在采用预检后提升模式：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从成功预检运行所在的相同 `main` 或
    `release/YYYY.M.D` 分支分发
  - 稳定版 npm 发布默认指向 `beta`
  - 稳定版 npm 发布可通过工作流输入显式指定 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提高安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而
    公共仓库保持仅 OIDC 发布
  - 公共 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的工件，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的稳定版修正发布，发布后验证器
  还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同临时前缀升级路径，
  这样发布修正就不会悄悄让旧的全局安装仍停留在
  基础稳定版载荷上
- npm 发布预检会在 tarball 不包含
  `dist/control-ui/index.html` 和非空 `dist/control-ui/assets/` 载荷时以关闭失败方式终止，
  以避免我们再次发布一个空的浏览器仪表板
- 发布后验证还会检查已发布注册表安装中，根 `dist/*`
  布局下是否包含非空的内置插件运行时依赖。若某次发布带有缺失或空的内置插件
  依赖载荷，则会使发布后验证失败，并且不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 强制执行 npm pack `unpackedSize` 预算，
  因此安装器 e2e 能在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展耗时清单或
  扩展测试矩阵，请在审批前重新生成并审查来自 `.github/workflows/ci.yml`
  的规划器拥有的 `checks-node-extensions` 工作流矩阵输出，以免发布说明描述的是过时的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器界面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - `main` 上的 `appcast.xml` 在发布后必须指向新的稳定版 zip
  - 打包应用必须保持非调试 bundle id、非空的 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作员控制的输入：

- `tag`：必需的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前
  完整 40 位工作流分支提交 SHA，用于仅验证预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：在真实发布路径中为必需，这样工作流会复用
  成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Checks` 接受以下由操作员控制的输入：

- `ref`：现有发布标签，或从 `main` 分发时当前完整的 40 位 `main` 提交
  SHA；从发布分支分发时，请使用现有发布标签，或当前完整的 40 位发布分支提交
  SHA

规则：

- 稳定版和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当
  `preflight_only=true` 时才允许完整提交 SHA 输入
- `OpenClaw Release Checks` 始终是仅验证，并且也接受
  当前工作流分支提交 SHA
- 发布检查的提交 SHA 模式还要求当前工作流分支 HEAD
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## 稳定版 npm 发布顺序

当切一个稳定版 npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在之前，你可以使用当前完整工作流分支提交
     SHA 来对预检工作流进行仅验证的 dry run
2. 为正常的 beta-first 流程选择 `npm_dist_tag=beta`，或仅在你明确想直接发布稳定版时选择 `latest`
3. 单独运行 `OpenClaw Release Checks`，使用相同标签，或在需要实时 prompt cache、
   QA Lab 一致性、Matrix 和 Telegram 覆盖时，使用当前完整工作流分支提交 SHA
   - 这样单独拆分是有意的，以便在不重新耦合长时间运行或不稳定检查到发布工作流的情况下，仍可保留实时覆盖
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
6. 如果该发布先落到 `beta`，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版本从 `beta` 提升到 `latest`
7. 如果该发布有意直接发布到 `latest`，并且 `beta`
   也应立即跟随同一稳定构建，请使用相同的私有
   工作流，将两个 dist-tag 都指向该稳定版本，或让其计划任务中的
   自愈同步稍后再移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然
需要 `NPM_TOKEN`，而公共仓库保持仅 OIDC 发布。

这样可以让直接发布路径和 beta-first 提升路径都被文档化并对操作员可见。

## 公共参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用以下私有发布文档中的实际操作手册：
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
