---
read_when:
    - 查找公开发布渠道定义
    - 查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-23T07:06:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# 发布策略

OpenClaw 有三个公开发布通道：

- stable：带标签的发布，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的滚动最新版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正版发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 不要为月份或日期补零
- `latest` 表示当前已提升的 stable npm 发布
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正版发布默认发布到 npm `beta`；发布操作人员可以显式指定发布到 `latest`，或者稍后再提升已验证的 beta 构建
- 每个 stable OpenClaw 发布都会同时发布 npm 包和 macOS 应用；
  beta 发布通常先验证并发布 npm/package 路径，而 mac 应用的构建/签名/公证默认保留给 stable，除非明确提出要求

## 发布节奏

- 发布流程先走 beta
- 只有在最新 beta 完成验证后，才会进入 stable
- 维护者通常会从当前的 `main` 创建 `release/YYYY.M.D` 分支来进行发布
  ，这样发布验证和修复就不会阻塞 `main` 上的新
  开发
- 如果某个 beta 标签已经推送或发布后还需要修复，维护者会创建
  下一个 `-beta.N` 标签，而不是删除或重新创建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明
  仅对维护者开放

## 发布预检

- 在发布预检之前运行 `pnpm check:test-types`，以确保测试 TypeScript 仍然
  在更快的本地 `pnpm check` 关卡之外得到覆盖
- 在发布预检之前运行 `pnpm check:architecture`，以确保更广泛的导入
  环和架构边界检查在更快的本地关卡之外保持绿色
- 在 `pnpm release:check` 之前运行 `pnpm build && pnpm ui:build`，以确保
  期望的 `dist/*` 发布产物和 Control UI bundle 存在，从而通过
  pack 验证步骤
- 在每次带标签发布之前运行 `pnpm release:check`
- 发布检查现在在单独的手动工作流中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布审批前运行 QA Lab mock 一致性关卡，以及实时的
  Matrix 和 Telegram QA 通道。实时通道使用
  `qa-live-shared` 环境；Telegram 还使用 Convex CI 凭证租约。
- 跨 OS 的安装和升级运行时验证由私有调用方工作流
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  分发，该工作流会调用可复用的公开工作流
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意设计的：让真实 npm 发布路径保持简短、
  可预测，并聚焦于产物，而较慢的实时检查则留在它们
  自己的通道中，这样它们就不会拖慢或阻塞发布
- 发布检查必须从 `main` 工作流引用或
  `release/YYYY.M.D` 工作流引用分发，以便工作流逻辑和 secret 始终
  受控
- 该工作流接受现有发布标签，或当前完整的
  40 字符工作流分支提交 SHA
- 在提交 SHA 模式下，它只接受当前工作流分支 HEAD；如果要验证更早的发布提交，请使用
  发布标签
- `OpenClaw NPM Release` 的仅验证预检也接受当前
  完整的 40 字符工作流分支提交 SHA，而不要求先推送标签
- 该 SHA 路径仅用于验证，不能被提升为真实发布
- 在 SHA 模式下，工作流仅为包元数据检查合成
  `v<package.json version>`；真实发布仍然需要真实的发布标签
- 两个工作流都将真实发布和提升路径保留在 GitHub 托管
  runner 上，而非变更型验证路径则可以使用更大的
  Blacksmith Linux runner
- 该工作流会运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  ，并使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 两个工作流 secret
- npm 发布预检不再等待单独的发布检查通道
- 在审批前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正版标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版版本），以在全新的临时前缀中验证已发布的注册表
  安装路径
- 维护者发布自动化现在采用先预检再提升的流程：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或
    `release/YYYY.M.D` 分支分发
  - stable npm 发布默认指向 `beta`
  - stable npm 发布可以通过工作流输入显式指定为 `latest`
  - 基于 token 的 npm dist-tag 修改现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    中，以提高安全性，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而
    公开仓库保持仅 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建
- 对于像 `YYYY.M.D-N` 这样的 stable 修正版发布，发布后验证器
  还会检查从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的同一临时前缀升级路径，
  以确保发布修正不会悄悄让旧的全局安装仍停留在基础 stable 负载上
- 除非 tarball 同时包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，
  否则 npm 发布预检会以关闭方式失败，以避免再次发布空的浏览器仪表板
- 发布后验证还会检查，已发布的注册表安装中是否在根 `dist/*`
  布局下包含非空的内置插件运行时依赖。若某个发布缺失或带有空的内置插件
  依赖负载，则其会在发布后验证器中失败，且不能被提升
  为 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，
  这样安装器 e2e 就能在发布路径之前捕获意外的打包膨胀
- 如果发布工作涉及 CI 规划、扩展时序清单，或
  扩展测试矩阵，请在审批前重新生成并审查由规划器拥有的
  来自 `.github/workflows/ci.yml` 的 `checks-node-extensions` 工作流矩阵输出，
  以避免发布说明描述过时的 CI 布局
- Stable macOS 发布就绪性还包括更新器表面：
  - GitHub 发布最终必须包含已打包的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 已打包的应用必须保持非调试 bundle id、非空 Sparkle feed
    URL，以及不低于该发布版本规范 Sparkle 构建下限的 `CFBundleVersion`

## NPM 工作流输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，也可以是当前
  完整的 40 字符工作流分支提交 SHA，用于仅验证预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示
  真实发布路径
- `preflight_run_id`：真实发布路径中必填，以便工作流复用成功预检运行
  中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：现有发布标签，或从 `main` 分发时用于验证的当前完整
  40 字符 `main` 提交 SHA；如果从发布分支分发，请使用现有
  发布标签或当前完整的 40 字符发布分支提交
  SHA

规则：

- Stable 和修正版标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，仅当
  `preflight_only=true` 时才允许输入完整提交 SHA
- `OpenClaw Release Checks` 始终仅用于验证，同时也接受
  当前工作流分支提交 SHA
- 发布检查的提交 SHA 模式还要求当前工作流分支 HEAD
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；
  工作流会在继续发布前验证该元数据

## Stable npm 发布顺序

发布 stable npm 版本时：

1. 运行 `OpenClaw NPM Release`，设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整工作流分支提交
     SHA 对预检工作流进行一次仅验证的 dry run
2. 对于正常的 beta-first 流程，选择 `npm_dist_tag=beta`；只有当你有意直接发布 stable 时才选择 `latest`
3. 单独运行 `OpenClaw Release Checks`，使用相同的标签或
   当前完整工作流分支提交 SHA，以便获得实时 prompt cache、
   QA Lab 一致性、Matrix 和 Telegram 覆盖
   - 之所以刻意拆分，是为了让实时覆盖始终可用，同时避免
     将长时间运行或不稳定的检查重新耦合到发布工作流中
4. 保存成功的 `preflight_run_id`
5. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
6. 如果该发布先落在 `beta`，请使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流，将该 stable 版本从 `beta` 提升到 `latest`
7. 如果该发布有意直接发布到了 `latest`，并且 `beta`
   也应立即跟随同一个 stable 构建，请使用同一个私有
   工作流将两个 dist-tag 都指向该 stable 版本，或者让其计划中的
   自愈同步稍后再移动 `beta`

dist-tag 修改位于私有仓库中是出于安全考虑，因为它仍然
需要 `NPM_TOKEN`，而公开仓库保持仅 OIDC 发布。

这样既能让直接发布路径，也能让 beta-first 提升路径都被
文档化，并对操作人员可见。

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
