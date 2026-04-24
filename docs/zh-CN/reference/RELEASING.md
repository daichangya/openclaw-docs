---
read_when:
    - 查找公开发布渠道定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-24T05:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c6d904e21f6d4150cf061ae27594bc2364f0927c48388362b16d8bf97491dc
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布渠道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确要求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续最新版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升为正式版的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版发布默认发布到 npm `beta`；发布操作人员可以显式指定目标为 `latest`，或者稍后再将经过验证的 beta 构建提升过去
- 每个 stable OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/package 路径，而 mac 应用的构建/签名/公证默认保留给 stable，除非另有明确要求

## 发布节奏

- 发布采用 beta 优先
- 只有在最新 beta 验证通过后，才会跟进 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布后还需要修复，维护者会切下一个
  `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 也能继续
  被覆盖，而不只是依赖更快的本地 `pnpm check` 检查
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入环和架构
  边界检查也会通过，而不是只依赖更快的本地检查
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样打包
  验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 才会存在
- 每次带标签发布前都要运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock 对齐检查，以及实时
  Matrix 和 Telegram QA 通道。实时通道使用
  `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。
- 跨操作系统的安装和升级运行时验证由私有调用方工作流
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  发起，它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持简短、
  可预测且聚焦于产物，而把较慢的实时检查放在单独通道中，
  以免拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用或
  `release/YYYY.M.D` 工作流引用发起，这样工作流逻辑和密钥才能保持受控
- 该工作流接受现有发布标签，或当前完整的
  40 字符工作流分支提交 SHA
- 在提交 SHA 模式下，它只接受当前工作流分支 HEAD；如果要验证更早的发布提交，
  请使用发布标签
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整的
  40 字符工作流分支提交 SHA，而不要求已有推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查临时构造 `v<package.json version>`；
  真正发布仍然需要真实的发布标签
- 这两个工作流都将真实发布和提升路径保留在 GitHub 托管运行器上，
  而非变更性的验证路径则可以使用更大的
  Blacksmith Linux 运行器
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  ，并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 审批前运行
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版本），在全新的临时前缀中验证已发布注册表的安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N pnpm test:docker:npm-telegram-live`
  ，以针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置，以及真实 Telegram E2E。
- 维护者发布自动化现在采用“先预检、后提升”：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.D` 分支发起
  - stable npm 发布默认指向 `beta`
  - stable npm 发布可以通过工作流输入显式指定目标为 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提高安全性，因为 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公开仓库
    仅保留基于 OIDC 的发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真正发布路径会提升已准备好的产物，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器
  还会检查从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的同一临时前缀升级路径，
  这样发布修正就不会悄悄让旧的全局安装继续停留在基础 stable 载荷上
- npm 发布预检默认采用失败即阻止的策略，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 内容，
  这样我们就不会再次发布一个空的浏览器仪表盘
- 发布后验证还会检查已发布的注册表安装是否在根 `dist/*`
  布局下包含非空的内置插件运行时依赖。若某个发布带着缺失或空的内置插件
  依赖内容发出，发布后验证器会判定失败，并且不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，
  这样安装器 e2e 就能在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展计时清单或扩展测试矩阵，
  请在审批前重新生成并审查由规划器负责的
  `checks-node-extensions` 工作流矩阵输出，来源于 `.github/workflows/ci.yml`，
  这样发布说明就不会描述过时的 CI 布局
- Stable macOS 发布就绪还包括更新器相关界面：
  - GitHub 发布最终必须包含打包好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包应用必须继续使用非调试 bundle id、非空的 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受这些由操作人员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示
  真实发布路径
- `preflight_run_id`：真实发布路径下必填，这样工作流就能复用成功预检运行中
  准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Checks` 接受这些由操作人员控制的输入：

- `ref`：现有发布标签，或从 `main` 发起时要验证的当前完整
  40 字符 `main` 提交 SHA；如果从发布分支发起，则使用现有发布标签或
  当前完整的 40 字符发布分支提交 SHA

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当
  `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 始终仅用于验证，并且也接受
  当前工作流分支提交 SHA
- 发布检查的提交 SHA 模式还要求必须是当前工作流分支 HEAD
- 真实发布路径必须使用预检时使用的同一个 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整工作流分支提交
     SHA，对预检工作流做一次仅验证的干运行
2. 对于正常的 beta 优先流程，选择 `npm_dist_tag=beta`；只有在你
   明确希望直接发布 stable 时才使用 `latest`
3. 单独运行 `OpenClaw Release Checks`，使用相同标签，或者
   当前完整工作流分支提交 SHA，以便获得实时 prompt cache、
   QA Lab 对齐、Matrix 和 Telegram 覆盖
   - 这样刻意分开，是为了让实时覆盖保持可用，而不会再次把长时间运行或不稳定的检查
     耦合回发布工作流
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，使用相同的
   `tag`、相同的 `npm_dist_tag`，以及保存下来的 `preflight_run_id`
6. 如果该发布先落在 `beta`，使用私有工作流
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   将该 stable 版本从 `beta` 提升到 `latest`
7. 如果该发布是有意直接发布到 `latest`，并且希望 `beta`
   立即跟随同一个 stable 构建，使用同一个私有工作流将这两个 dist-tag
   都指向该 stable 版本，或者让其计划任务式的自愈同步稍后再移动 `beta`

dist-tag 变更位于私有仓库中以提高安全性，因为它仍然
需要 `NPM_TOKEN`，而公开仓库仅保留基于 OIDC 的发布。

这样可以让直接发布路径和 beta 优先提升路径都保持文档化，
并且对操作人员可见。

## 公开参考

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
