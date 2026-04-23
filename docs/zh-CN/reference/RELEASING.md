---
read_when:
    - 正在查找公开发布渠道的定义
    - 正在查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-23T05:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 979fd30ec717e107858ff812ef4b46060b9a00a0b5a3c23085d95b8fb81723b8
    source_path: reference/RELEASING.md
    workflow: 15
---

# 发布策略

OpenClaw 有三个公开发布渠道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的持续更新头部版本

## 版本命名

- stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要为月份或日期补零
- `latest` 表示当前已提升为正式版的 stable npm 发布
- `beta` 表示当前 beta 安装目标
- stable 和 stable 修正版默认发布到 npm `beta`；发布操作人员可以显式指定 `latest`，或者在之后将经过验证的 beta 构建提升上去
- 每个 stable OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/package 路径，而 mac 应用的构建 / 签名 / 公证默认保留给 stable，除非明确要求

## 发布节奏

- 发布采用 beta 优先
- 只有在最新 beta 验证完成后，才会跟进 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布后需要修复，维护者会切下一个 `-beta.N` 标签，而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅面向维护者

## 发布前检查

- 在发布前检查前运行 `pnpm check:test-types`，这样测试 TypeScript 仍然会被覆盖，而不只依赖更快的本地 `pnpm check` 门禁
- 在发布前检查前运行 `pnpm check:architecture`，这样更广泛的导入环和架构边界检查会在更快的本地门禁之外保持通过
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，这样打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 都会存在
- 每次带标签发布前都运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock 一致性门禁，以及实时的 Matrix 和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。
- 跨操作系统的安装与升级运行时验证由私有调用方工作流分发：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是刻意设计的：让真实的 npm 发布路径保持简短、确定性强，并聚焦于产物；而较慢的实时检查放在各自独立的通道中，这样它们不会拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用，或从
  `release/YYYY.M.D` 工作流引用发起，这样工作流逻辑和密钥才能保持受控
- 该工作流接受现有发布标签，或当前完整的 40 位工作流分支提交 SHA
- 在提交 SHA 模式下，它只接受当前工作流分支的 HEAD；较旧的发布提交请使用发布标签
- `OpenClaw NPM Release` 的仅验证前检查也接受当前完整的 40 位工作流分支提交 SHA，而不要求已有推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都会将真实发布和提升路径保留在 GitHub 托管的 runner 上，而不修改状态的验证路径则可以使用更大的 Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流密钥
- npm 发布前检查不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或匹配的 beta / 修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或匹配的 beta / 修正版本），以在全新的临时前缀中验证已发布的注册表安装路径
- 维护者发布自动化现在采用“先前检查，再提升”：
  - 真实的 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实的 npm 发布必须从与成功前检查运行相同的 `main` 或 `release/YYYY.M.D` 分支发起
  - stable npm 发布默认使用 `beta`
  - stable npm 发布可以通过工作流输入显式指定 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提高安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器还会检查从 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一临时前缀升级路径，这样发布修正就不会悄悄让旧的全局安装仍停留在基础 stable 负载上
- npm 发布前检查采用默认失败关闭策略，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 载荷，这样我们就不会再次发布空的浏览器仪表板
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，因此安装器端到端流程会在发布路径之前捕获意外的打包膨胀
- 如果本次发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在批准前重新生成并审查来自 `.github/workflows/ci.yml` 的、由 planner 负责的 `checks-node-extensions` 工作流矩阵输出，这样发布说明就不会描述过时的 CI 布局
- stable macOS 发布准备情况还包括更新器相关表面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle build 下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前完整的
  40 位工作流分支提交 SHA，用于仅验证的前检查
- `preflight_only`：仅验证 / 构建 / 打包时为 `true`，真实发布路径时为 `false`
- `preflight_run_id`：真实发布路径必填，以便工作流复用成功前检查运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：现有发布标签，或从 `main` 发起时用于验证的当前完整 40 位 `main` 提交
  SHA；如果从发布分支发起，则使用现有发布标签，或当前完整的 40 位发布分支提交
  SHA

规则：

- stable 和修正标签可以发布到 `beta` 或 `latest`
- beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许使用完整提交 SHA 作为输入
- `OpenClaw Release Checks` 始终仅用于验证，也接受当前工作流分支提交 SHA
- 发布检查的提交 SHA 模式也要求当前工作流分支 HEAD
- 真实发布路径必须使用与前检查相同的 `npm_dist_tag`；工作流会在继续发布前验证该元数据

## Stable npm 发布顺序

切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整工作流分支提交
     SHA，对前检查工作流进行仅验证的试运行
2. 选择 `npm_dist_tag=beta` 用于正常的 beta 优先流程；只有在你明确想直接发布 stable 时，才选择 `latest`
3. 单独运行 `OpenClaw Release Checks`，使用相同标签，或在你希望获得实时 prompt cache、
   QA Lab 一致性、Matrix 和 Telegram 覆盖时，使用当前完整工作流分支提交 SHA
   - 这样刻意拆开，是为了让实时覆盖保持可用，而不会将长时间运行或不稳定的检查重新耦合到发布工作流中
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`、相同的
   `tag`、相同的 `npm_dist_tag`，以及保存的 `preflight_run_id`
6. 如果该发布先落在 `beta`，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该 stable 版本从 `beta` 提升到 `latest`
7. 如果该发布有意直接发布到 `latest`，并且 `beta`
   也应立即跟随同一个 stable 构建，请使用同一个私有工作流让两个 dist-tag 都指向该 stable 版本，或者让其计划中的自愈同步稍后移动 `beta`

出于安全原因，dist-tag 变更位于私有仓库中，因为它仍然
需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样可以让直接发布路径和 beta 优先提升路径都保持文档化，并且对操作人员可见。

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

维护者会使用私有发布文档
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
作为实际操作手册。
