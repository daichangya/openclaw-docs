---
read_when:
    - 查找公开发布渠道的定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-23T05:14:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: edb86d97a37e400a4041f1e087c90d9a4f26087cc5da5c37d11f7ca58dba9404
    source_path: reference/RELEASING.md
    workflow: 15
---

# 发布策略

OpenClaw 有三个公开发布渠道：

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
- 月和日不要补零
- `latest` 表示当前已提升的稳定版 npm 发布
- `beta` 表示当前 beta 安装目标
- 稳定版和稳定版修正版默认发布到 npm `beta`；发布操作人员可以明确指定目标为 `latest`，或者稍后再将已验证的 beta 构建提升过去
- 每个稳定版 OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/package 路径，而 mac 应用的构建 / 签名 / 公证则保留给稳定版，除非有明确要求

## 发布节奏

- 发布先走 beta
- 只有在最新 beta 完成验证后，才会跟进 stable
- 维护者通常会从当前 `main` 创建 `release/YYYY.M.D` 分支来切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经被推送或发布且需要修复，维护者会切下一个
  `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅面向维护者

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 也能获得覆盖，
  不会被更快的本地 `pnpm check` 检查门槛遗漏
- 在发布预检前运行 `pnpm check:architecture`，这样更全面的导入循环和架构边界检查
  就能在更快的本地检查之外保持绿色
- 在运行 `pnpm release:check` 之前先运行 `pnpm build && pnpm ui:build`，
  以确保打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 已存在
- 每次带标签的发布前都要运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab 模拟一致性门槛和实时
  Telegram QA 通道。实时通道使用
  `qa-live-shared` 环境和 Convex CI 凭证租约。
- 跨操作系统的安装和升级运行时验证由私有调用方工作流
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  发起，该工作流会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真实的 npm 发布路径保持简短、
  可预测且聚焦产物，而较慢的实时检查保留在它们自己的通道中，
  这样就不会拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用或
  `release/YYYY.M.D` 工作流引用发起，这样工作流逻辑和密钥才能保持受控
- 该工作流接受已有的发布标签，或当前完整的
  40 字符工作流分支提交 SHA
- 在提交 SHA 模式下，它只接受当前工作流分支的 HEAD；较旧的发布提交请使用
  发布标签
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整的
  40 字符工作流分支提交 SHA，无需先推送标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，工作流只会为包元数据检查临时生成
  `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个工作流都会将真实发布和提升路径保留在 GitHub 托管的
  runner 上，而非变更性的验证路径则可以使用更大的
  Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流密钥
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta / 修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta / 修正版版本），以在新的临时前缀中验证已发布的注册表安装路径
- 维护者发布自动化现在采用先预检后提升的方式：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.D` 分支发起
  - 稳定版 npm 发布默认使用 `beta`
  - 稳定版 npm 发布可以通过工作流输入明确指定目标为 `latest`
  - 基于令牌的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提升安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，
    而公开仓库保留仅 OIDC 的发布方式
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的稳定版修正版发布，发布后验证器
  还会检查从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的同一临时前缀升级路径，
  这样发布修正就不会在无声无息中让旧的全局安装停留在基础稳定版负载上
- npm 发布预检会默认失败关闭，除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，
  以避免我们再次发布空的浏览器仪表盘
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算执行强制检查，
  这样安装器 e2e 就能在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展 timing 清单或
  扩展测试矩阵，请在审批前重新生成并审查
  来自 `.github/workflows/ci.yml` 的、由 planner 负责的
  `checks-node-extensions` 工作流矩阵输出，
  以避免发布说明描述的是过时的 CI 布局
- 稳定版 macOS 发布就绪还包括更新器相关界面：
  - GitHub 发布最终必须包含打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的稳定版 zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填的发布标签，例如 `v2026.4.2`、`v2026.4.2-1`，或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整的 40 字符工作流分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅进行验证 / 构建 / 打包，`false` 表示进入
  真实发布路径
- `preflight_run_id`：在真实发布路径中必填，这样工作流就会复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：已有发布标签，或从 `main` 发起时要验证的当前完整
  40 字符 `main` 提交 SHA；如果从发布分支发起，请使用已有的发布标签
  或当前完整的 40 字符发布分支提交 SHA

规则：

- 稳定版和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 时才允许使用完整提交 SHA 作为输入
- `OpenClaw Release Checks` 始终仅用于验证，也接受
  当前工作流分支提交 SHA
- 发布检查的提交 SHA 模式还要求必须是当前工作流分支 HEAD
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## 稳定版 npm 发布顺序

在切稳定版 npm 发布时：

1. 运行 `OpenClaw NPM Release`，并设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整的工作流分支提交
     SHA，对预检工作流进行仅验证的试运行
2. 按照正常的先 beta 后 stable 流程选择 `npm_dist_tag=beta`，或者仅在你有意直接发布稳定版时选择 `latest`
3. 单独运行 `OpenClaw Release Checks`，使用相同的标签，或者在你想获得实时 prompt cache、
   QA Lab 一致性和实时 Telegram 覆盖时，使用当前完整的工作流分支提交 SHA
   - 之所以刻意分离，是为了在不重新耦合长时间运行或不稳定检查到发布工作流的前提下，
     仍然保留实时覆盖能力
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，并设置 `preflight_only=false`，同时使用相同的
   `tag`、相同的 `npm_dist_tag`，以及已保存的 `preflight_run_id`
6. 如果该发布先落在 `beta`，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该稳定版从 `beta` 提升到 `latest`
7. 如果该发布是有意直接发布到 `latest`，并且 `beta`
   也应立即跟随同一个稳定版构建，请使用同一个私有工作流
   将两个 dist-tag 都指向该稳定版，或者交由其定时
   自愈同步稍后再推动 `beta`

dist-tag 变更之所以放在私有仓库中，是出于安全考虑，因为它仍然
需要 `NPM_TOKEN`，而公开仓库保留仅 OIDC 的发布方式。

这样既记录了直接发布路径，也记录了先 beta 再提升的路径，并且两者
都对操作人员可见。

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
