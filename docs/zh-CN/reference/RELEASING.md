---
read_when:
    - 正在查找公开发布渠道的定义
    - 正在查找版本命名和发布节奏
summary: 公开发布渠道、版本命名和发布节奏
title: 发布策略
x-i18n:
    generated_at: "2026-04-26T23:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 123e9410e268f4b2a9c16acb2a4c9ff3b5184cd41f678f1a0d28751108f04bfd
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw 有三个公开发布通道：

- stable：带标签的发布版本，默认发布到 npm `beta`，或在明确请求时发布到 npm `latest`
- beta：预发布标签，发布到 npm `beta`
- dev：`main` 的滚动最新版本

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Stable 修正发布版本：`YYYY.M.D-N`
  - Git 标签：`vYYYY.M.D-N`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月和日不要补零
- `latest` 表示当前已提升的 stable npm 发布版本
- `beta` 表示当前 beta 安装目标
- Stable 和 stable 修正发布默认发布到 npm `beta`；发布操作人员可以显式指定 `latest`，或者稍后将经过验证的 beta 构建提升过去
- 每个 stable OpenClaw 发布都会同时交付 npm 包和 macOS 应用；
  beta 发布通常会先验证并发布 npm/包路径，而 macOS 应用的构建/签名/公证保留给 stable，除非有明确请求

## 发布节奏

- 发布采用 beta 优先流程
- 只有在最新 beta 经过验证后，才会跟进 stable
- 维护者通常会从当前 `main` 创建的 `release/YYYY.M.D` 分支切发布，
  这样发布验证和修复就不会阻塞 `main` 上的新开发
- 如果某个 beta 标签已经推送或发布且需要修复，维护者会切下一个 `-beta.N` 标签，
  而不是删除或重建旧的 beta 标签
- 详细的发布流程、审批、凭证和恢复说明仅对维护者开放

## 发布预检

- 在发布预检前运行 `pnpm check:test-types`，这样测试 TypeScript 仍然会在更快的本地 `pnpm check` 门禁之外得到覆盖
- 在发布预检前运行 `pnpm check:architecture`，这样更广泛的导入循环和架构边界检查会在更快的本地门禁之外保持绿色
- 在运行 `pnpm release:check` 之前先运行 `pnpm build && pnpm ui:build`，这样打包验证步骤所需的 `dist/*` 发布产物和 Control UI bundle 才会存在
- 当你需要对候选发布进行完整的常规 CI 覆盖时，在发布批准前运行手动 `CI` workflow。手动 CI 调度会绕过变更范围限制，并强制运行 Linux Node 分片、内置插件分片、渠道契约、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n 通道。
  示例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 在验证发布遥测时运行 `pnpm qa:otel:smoke`。它会通过本地 OTLP/HTTP 接收器运行 QA-lab，并验证导出的 trace span 名称、有界属性以及内容/标识符脱敏，而无需 Opik、Langfuse 或其他外部收集器。
- 在每次带标签发布前运行 `pnpm release:check`
- 发布检查现在在单独的手动 workflow 中运行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 还会在发布批准前运行 QA Lab mock parity gate，以及实时 Matrix 和 Telegram QA 通道。实时通道使用 `qa-live-shared` 环境；Telegram 还会使用 Convex CI 凭证租约。
- 跨操作系统的安装和升级运行时验证由私有调用方 workflow 调度：
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`，
  它会调用可复用的公开 workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 这种拆分是有意为之：让真正的 npm 发布路径保持简短、确定性强并聚焦于产物，而较慢的实时检查留在独立通道中，这样它们就不会拖慢或阻塞发布
- 发布检查必须从 `main` workflow ref 或 `release/YYYY.M.D` workflow ref 发起，这样 workflow 逻辑和密钥才能保持受控
- 该 workflow 接受现有发布标签，或当前完整的 40 字符 workflow 分支提交 SHA
- 在提交 SHA 模式下，它只接受当前 workflow 分支的 HEAD；对于较旧的发布提交，请使用发布标签
- `OpenClaw NPM Release` 的仅验证预检也接受当前完整的 40 字符 workflow 分支提交 SHA，而不要求已有推送的标签
- 该 SHA 路径仅用于验证，不能提升为真实发布
- 在 SHA 模式下，该 workflow 仅为包元数据检查合成 `v<package.json version>`；真实发布仍然需要真实的发布标签
- 这两个 workflow 都将真实发布和提升路径保留在 GitHub 托管 runner 上，而非变更型验证路径则可以使用更大的 Blacksmith Linux runner
- 该 workflow 运行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  并同时使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secrets
- npm 发布预检不再等待单独的发布检查通道
- 在批准前运行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （或对应的 beta/修正标签）
- npm 发布后，运行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （或对应的 beta/修正版本），以在新的临时前缀中验证已发布的注册表安装路径
- beta 发布后，运行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以使用共享租赁的 Telegram 凭证池，针对已发布的 npm 包验证已安装包的新手引导、Telegram 设置和真实 Telegram E2E。维护者在本地进行一次性检查时可以省略 Convex 变量，直接传入三个 `OPENCLAW_QA_TELEGRAM_*` 环境变量凭证。
- 维护者也可以通过 GitHub Actions 中手动触发的 `NPM Telegram Beta E2E` workflow 运行同样的发布后检查。它有意仅限手动运行，不会在每次合并时执行。
- 维护者发布自动化现在使用“先预检，再提升”的流程：
  - 真实 npm 发布必须通过成功的 npm `preflight_run_id`
  - 真实 npm 发布必须从与成功预检运行相同的 `main` 或 `release/YYYY.M.D` 分支发起
  - stable npm 发布默认目标为 `beta`
  - stable npm 发布可以通过 workflow 输入显式指定目标为 `latest`
  - 基于 token 的 npm dist-tag 变更现在位于
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    以保证安全，因为 `npm dist-tag add` 仍然需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布
  - 公开的 `macOS Release` 仅用于验证
  - 真实的私有 mac 发布必须通过成功的私有 mac
    `preflight_run_id` 和 `validate_run_id`
  - 真实发布路径会提升已准备好的产物，而不是再次重新构建它们
- 对于像 `YYYY.M.D-N` 这样的 stable 修正发布，发布后验证器还会检查从 `YYYY.M.D` 升级到 `YYYY.M.D-N` 的同一临时前缀升级路径，这样发布修正就不会悄悄让旧的全局安装仍停留在基础 stable 负载上
- npm 发布预检默认失败关闭，除非 tarball 同时包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 负载，这样我们就不会再次发布一个空的浏览器仪表盘
- 发布后验证还会检查已发布的注册表安装是否在根级 `dist/*` 布局下包含非空的内置插件运行时依赖。若发布缺少这些依赖负载或其内容为空，则发布后验证器会失败，并且该版本不能被提升到 `latest`。
- `pnpm test:install:smoke` 还会对候选更新 tarball 的 npm pack `unpackedSize` 预算进行强制检查，因此安装器 e2e 能在发布路径之前捕获意外的打包膨胀
- 如果此次发布工作涉及 CI 规划、扩展时序清单或扩展测试矩阵，请在批准前重新生成并审查来自 `.github/workflows/ci.yml` 的、由规划器负责的 `checks-node-extensions` workflow 矩阵输出，这样发布说明就不会描述一个过时的 CI 布局
- stable macOS 发布就绪还包括更新器相关界面：
  - GitHub release 最终必须带有打包后的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 发布后，`main` 上的 `appcast.xml` 必须指向新的 stable zip
  - 打包后的应用必须保持非调试 bundle id、非空的 Sparkle feed URL，以及不低于该发布版本规范 Sparkle 构建底线的 `CFBundleVersion`

## NPM workflow 输入

`OpenClaw NPM Release` 接受以下由操作人员控制的输入：

- `tag`：必填发布标签，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；当 `preflight_only=true` 时，它也可以是当前完整的
  40 字符 workflow 分支提交 SHA，用于仅验证的预检
- `preflight_only`：`true` 表示仅验证/构建/打包，`false` 表示真实发布路径
- `preflight_run_id`：真实发布路径中必填，以便 workflow 复用成功预检运行中准备好的 tarball
- `npm_dist_tag`：发布路径的 npm 目标标签；默认值为 `beta`

`OpenClaw Release Checks` 接受以下由操作人员控制的输入：

- `ref`：现有发布标签，或从 `main` 发起时当前完整的 40 字符 `main` 提交
  SHA；若从发布分支发起，请使用现有发布标签，或当前完整的 40 字符发布分支提交
  SHA

规则：

- Stable 和修正标签可以发布到 `beta` 或 `latest`
- Beta 预发布标签只能发布到 `beta`
- 对于 `OpenClaw NPM Release`，完整提交 SHA 输入只在
  `preflight_only=true` 时允许
- `OpenClaw Release Checks` 始终仅用于验证，同时也接受当前 workflow 分支提交 SHA
- 发布检查的提交 SHA 模式还要求该 SHA 必须是当前 workflow 分支 HEAD
- 真实发布路径必须使用与预检期间相同的 `npm_dist_tag`；workflow 会在继续发布前验证该元数据

## Stable npm 发布顺序

在切 stable npm 发布时：

1. 运行 `OpenClaw NPM Release`，设置 `preflight_only=true`
   - 在标签尚不存在时，你可以使用当前完整的 workflow 分支提交
     SHA，对预检 workflow 进行仅验证的 dry run
2. 对于正常的 beta 优先流程，选择 `npm_dist_tag=beta`；只有在你有意直接发布 stable 时，才选择 `latest`
3. 当你希望得到完整的常规 CI 覆盖，而不是智能范围限制的合并覆盖时，在发布 ref 上运行手动 `CI` workflow
4. 当你希望得到实时 prompt cache、QA Lab parity、Matrix 和 Telegram 覆盖时，单独使用相同的标签或完整的当前 workflow 分支提交 SHA 运行 `OpenClaw Release Checks`
   - 之所以故意分开，是为了让实时覆盖保持可用，而不把长时间运行或不稳定的检查重新耦合回发布 workflow
5. 保存成功的 `preflight_run_id`
6. 再次运行 `OpenClaw NPM Release`，设置 `preflight_only=false`，并使用相同的
   `tag`、相同的 `npm_dist_tag` 以及保存的 `preflight_run_id`
7. 如果该发布先落在 `beta`，请使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow，将该 stable 版本从 `beta` 提升到 `latest`
8. 如果该发布有意直接发布到 `latest`，并且 `beta`
   也应立即跟进同一个 stable 构建，请使用同一个私有 workflow 将两个 dist-tag 都指向该 stable 版本，或者让其计划中的自愈同步稍后推动 `beta`

dist-tag 变更之所以放在私有仓库中，是出于安全考虑，因为它仍然
需要 `NPM_TOKEN`，而公开仓库保持仅使用 OIDC 发布。

这样既让直接发布路径有文档可查、操作可见，也让 beta 优先的提升路径同样如此。

如果维护者必须回退到本地 npm 身份验证，任何 1Password
CLI（`op`）命令都只能在专用 tmux 会话中运行。不要直接从主 agent shell 调用 `op`；把它限制在 tmux 内，可以让提示、告警和 OTP 处理保持可观察，并防止重复的主机告警。

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
