---
read_when:
    - 公開リリースチャネルの定義を探している場合
    - バージョン命名とリリース頻度を探している場合
summary: 公開リリースチャネル、バージョン命名、およびリリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-26T11:39:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: タグ付きリリース。デフォルトでは npm の `beta` に公開され、明示的に指定した場合は npm の `latest` に公開されます
- beta: npm の `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先端

## バージョン命名

- Stable リリースのバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- Stable 修正リリースのバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- Beta プレリリースのバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月や日はゼロ埋めしない
- `latest` は現在昇格済みの stable npm リリースを意味します
- `beta` は現在の beta インストール対象を意味します
- Stable および stable 修正リリースはデフォルトで npm の `beta` に公開されます。リリース担当者は明示的に `latest` を対象にすることも、後で検証済みの beta ビルドを昇格することもできます
- すべての stable OpenClaw リリースは npm パッケージと macOS アプリを同時に出荷します。
  beta リリースは通常、最初に npm/package パスを検証して公開し、
  mac アプリのビルド/署名/notarize は明示的に要求されない限り stable 用に留めます

## リリース頻度

- リリースは beta-first で進みます
- Stable は最新の beta が検証された後にのみ続きます
- maintainer は通常、現在の `main` から作成した `release/YYYY.M.D` ブランチから
  リリースを切り出します。これにより、リリース検証と修正が `main` 上の新しい
  開発を妨げません
- beta タグが push または publish された後で修正が必要になった場合、maintainer は
  古い beta タグを削除または再作成するのではなく、次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、リカバリに関する注記は
  maintainer 専用です

## リリース事前確認

- リリース事前確認の前に `pnpm check:test-types` を実行し、より高速なローカル `pnpm check` ゲートの外でも
  テスト TypeScript がカバーされるようにします
- リリース事前確認の前に `pnpm check:architecture` を実行し、より高速なローカルゲートの外でも
  広範な import cycle とアーキテクチャ境界チェックが green になるようにします
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、
  pack 検証ステップで期待される `dist/*` リリース成果物と Control UI バンドルが存在するようにします
- リリース telemetry を検証する際は `pnpm qa:otel:smoke` を実行します。これは
  ローカル OTLP/HTTP receiver 経由で QA-lab を実行し、Opik、Langfuse、その他の外部 collector を必要とせずに、
  エクスポートされる trace span 名、制限付き属性、および content/identifier の秘匿化を検証します。
- タグ付きリリースの前には毎回 `pnpm release:check` を実行します
- リリースチェックは現在、別の手動 workflow で実行されます:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab mock parity gate と
  live Matrix および Telegram QA レーンも実行します。live レーンは
  `qa-live-shared` environment を使用し、Telegram はさらに Convex CI credential lease を使用します。
- Cross-OS のインストールおよびアップグレードのランタイム検証は、private caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  からディスパッチされ、再利用可能な公開 workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  を呼び出します
- この分割は意図的なものです。実際の npm リリースパスは短く、
  決定的で成果物重視に保ちつつ、より遅い live チェックは独自レーンに置くことで、
  publish を遅延またはブロックしないようにしています
- リリースチェックは、workflow ロジックと secrets を管理下に保つため、
  `main` の workflow ref または `release/YYYY.M.D` の workflow ref から
  ディスパッチされなければなりません
- その workflow は、既存のリリースタグまたは現在の完全な
  40 文字の workflow-branch commit SHA のどちらかを受け付けます
- commit-SHA モードでは、現在の workflow-branch HEAD のみを受け付けます。
  古いリリースコミットにはリリースタグを使用してください
- `OpenClaw NPM Release` の validation-only 事前確認も、push 済みタグを必要とせず、
  現在の完全な 40 文字の workflow-branch commit SHA を受け付けます
- その SHA パスは validation-only であり、実際の publish に昇格することはできません
- SHA モードでは、workflow はパッケージメタデータチェック専用に
  `v<package.json version>` を合成します。実際の publish には依然として実際のリリースタグが必要です
- 両 workflow は、実際の publish と昇格のパスを GitHub-hosted
  runner 上に維持しつつ、変更を伴わない検証パスにはより大きな
  Blacksmith Linux runner を使用できます
- その workflow は
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secrets を使って実行します
- npm リリース事前確認は、もはや別レーンのリリースチェックを待ちません
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/修正タグ）を実行してください
- npm publish 後に、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/修正バージョン）を実行して、新しい temp prefix 内で
  公開済みレジストリインストールパスを検証してください
- beta publish 後には、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行し、共有 leased Telegram credential
  pool を使って、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証してください。
  maintainer のローカル単発実行では Convex 変数を省略し、代わりに 3 つの
  `OPENCLAW_QA_TELEGRAM_*` env 認証情報を直接渡すこともできます。
- maintainer は同じ publish 後チェックを GitHub Actions の手動
  `NPM Telegram Beta E2E` workflow からも実行できます。これは意図的に手動専用であり、すべての merge では実行されません。
- maintainer のリリース自動化は現在、事前確認してから昇格する方式を使用します:
  - 実際の npm publish は成功した npm `preflight_run_id` を通過していなければなりません
  - 実際の npm publish は、その成功した事前確認実行と同じ `main` または
    `release/YYYY.M.D` ブランチからディスパッチされなければなりません
  - stable npm リリースのデフォルトは `beta` です
  - stable npm publish は workflow 入力により明示的に `latest` を指定できます
  - トークンベースの npm dist-tag 変更は現在
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    にあります。これはセキュリティ上の理由によるもので、`npm dist-tag add` には依然として `NPM_TOKEN` が必要である一方、
    公開リポジトリでは OIDC-only publish を維持しているためです
  - 公開の `macOS Release` は validation-only です
  - 実際の private mac publish は、成功した private mac の
    `preflight_run_id` と `validate_run_id` を通過していなければなりません
  - 実際の publish パスは、成果物を再度ビルドするのではなく、準備済みの成果物を昇格します
- `YYYY.M.D-N` のような stable 修正リリースでは、publish 後 verifier は
  `YYYY.M.D` から `YYYY.M.D-N` への同じ temp-prefix アップグレードパスも確認します。これにより、リリース修正によって
  古いグローバルインストールがベース stable payload のまま静かに残ることを防ぎます
- npm リリース事前確認は、tarball に `dist/control-ui/index.html` と
  空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed します。これにより、空のブラウザダッシュボードを再び出荷しないようにします
- publish 後検証では、公開済みレジストリインストールに、ルート `dist/*`
  レイアウト配下の空でない同梱 Plugin ランタイム依存関係が含まれていることも確認します。
  同梱 Plugin 依存 payload が欠落している、または空のまま出荷されたリリースは publish 後 verifier に失敗し、
  `latest` に昇格できません。
- `pnpm test:install:smoke` は、候補アップデート tarball の npm pack `unpackedSize` 予算も強制するため、
  installer e2e はリリース publish パス前に偶発的な pack 肥大化を検出します
- リリース作業で CI planning、extension timing manifest、または
  extension test matrix に触れた場合は、承認前に `.github/workflows/ci.yml` の planner 所有
  `checks-node-extensions` workflow matrix 出力を再生成してレビューしてください。これにより、リリースノートが古い CI レイアウトを説明することを防ぎます
- stable macOS リリース準備には updater サーフェスも含まれます:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`
    が最終的に含まれていなければなりません
  - `main` 上の `appcast.xml` は、publish 後に新しい stable zip を指していなければなりません
  - パッケージ化アプリは、そのリリースバージョンに対応する canonical Sparkle build floor 以上の
    非 debug bundle id、空でない Sparkle feed URL、`CFBundleVersion` を維持していなければなりません

## NPM workflow 入力

`OpenClaw NPM Release` は、次の operator 制御入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、
  `v2026.4.2-beta.1`。`preflight_only=true` の場合のみ、validation-only 事前確認用として
  現在の完全な 40 文字の workflow-branch commit SHA も使用できます
- `preflight_only`: 検証/ビルド/パッケージのみなら `true`、実際の
  publish パスなら `false`
- `preflight_run_id`: 実際の publish パスでは必須。この入力により workflow は
  成功した事前確認実行から準備済み tarball を再利用します
- `npm_dist_tag`: publish パス向けの npm 対象タグ。デフォルトは `beta`

`OpenClaw Release Checks` は、次の operator 制御入力を受け付けます。

- `ref`: 既存のリリースタグ、または `main` からディスパッチされた場合に検証する
  現在の完全な 40 文字の `main` commit SHA。リリースブランチからの場合は、
  既存のリリースタグまたは現在の完全な 40 文字の release-branch commit
  SHA を使用します

ルール:

- Stable および修正タグは `beta` または `latest` のいずれにも公開できます
- Beta プレリリースタグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力が許可されるのは
  `preflight_only=true` の場合のみです
- `OpenClaw Release Checks` は常に validation-only であり、現在の
  workflow-branch commit SHA も受け付けます
- リリースチェックの commit-SHA モードでも、現在の workflow-branch HEAD が必要です
- 実際の publish パスでは、事前確認時に使用したものと同じ `npm_dist_tag` を使用しなければなりません。
  workflow は publish 継続前にそのメタデータを検証します

## Stable npm リリースシーケンス

stable npm リリースを切るとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - タグがまだ存在しない場合は、事前確認 workflow の validation-only dry run 用に、
     現在の完全な workflow-branch commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、意図的に直接 stable publish したい場合にのみ `latest` を選択する
3. live prompt cache、
   QA Lab parity、Matrix、Telegram のカバレッジが必要な場合は、同じタグまたは
   現在の workflow-branch commit SHA 全体を使って、別途 `OpenClaw Release Checks` を実行する
   - これは意図的に分離されています。これにより、長時間実行または flaky なチェックを publish workflow に再結合することなく、
     live カバレッジを利用可能なまま保てます
4. 成功した `preflight_run_id` を保存する
5. `preflight_only=false`、同じ `tag`、同じ `npm_dist_tag`、
   保存した `preflight_run_id` で、再度 `OpenClaw NPM Release` を実行する
6. リリースが `beta` に着地した場合は、private の
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow を使用して、その stable バージョンを `beta` から `latest` に昇格する
7. リリースを意図的に直接 `latest` に publish し、`beta` も直ちに同じ stable ビルドに追従させるべき場合は、同じ private
   workflow を使用して両方の dist-tag をその stable バージョンに向けるか、
   スケジュールされた自己修復同期によって後で `beta` を移動させる

dist-tag 変更はセキュリティ上の理由から private リポジトリにあります。これは依然として
`NPM_TOKEN` を必要とする一方、公開リポジトリでは OIDC-only publish を維持しているためです。

これにより、直接 publish パスと beta-first 昇格パスの両方が、文書化され、
operator から見える形で保たれます。

maintainer がローカル npm 認証にフォールバックしなければならない場合は、1Password
CLI（`op`）コマンドは専用の tmux セッション内でのみ実行してください。メインの agent shell から `op`
を直接呼び出してはいけません。tmux 内に留めることで、プロンプト、
アラート、OTP 処理を観測可能にし、ホスト側での繰り返しアラートを防げます。

## 公開リファレンス

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

maintainer は、実際の runbook については
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
にある private なリリースドキュメントを使用します。

## 関連

- [Release channels](/ja-JP/install/development-channels)
