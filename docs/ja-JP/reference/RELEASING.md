---
read_when:
    - 公開リリースチャネルの定義を探しています
    - バージョン命名とリリース頻度を探しています
summary: 公開リリースチャネル、バージョン命名、リリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-24T09:02:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: タグ付きリリースで、デフォルトでは npm の `beta` に公開され、明示的に要求された場合は npm の `latest` に公開されます
- beta: npm の `beta` に公開されるプレリリースタグ
- dev: `main` の移動中の先頭

## バージョン命名

- stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- stable 修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月や日はゼロ埋めしません
- `latest` は現在昇格済みの stable npm リリースを意味します
- `beta` は現在の beta インストール対象を意味します
- stable と stable 修正リリースは、デフォルトで npm の `beta` に公開されます。リリース運用者は明示的に `latest` を指定することも、後から検証済み beta ビルドを昇格することもできます
- すべての stable OpenClaw リリースは npm パッケージと macOS アプリを一緒に出荷します。
  beta リリースでは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリの build/sign/notarize は明示的に要求されない限り stable 向けに留保されます

## リリース頻度

- リリースは beta-first で進みます
- stable は最新の beta が検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチから
  リリースを切ります。これにより、リリース検証や修正が `main` 上の新規開発を
  ブロックしません
- beta タグが push または公開済みで修正が必要な場合、
  メンテナーは古い beta タグを削除または再作成する代わりに、
  次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、資格情報、復旧メモは
  maintainer 専用です

## リリース事前確認

- テスト TypeScript が高速なローカル `pnpm check` ゲートの外でも
  カバーされるように、リリース事前確認の前に `pnpm check:test-types` を実行します
- より広い import cycle とアーキテクチャ境界チェックが高速なローカルゲートの外でも
  緑になるように、リリース事前確認の前に `pnpm check:architecture` を実行します
- pack 検証ステップに必要な
  `dist/*` リリース成果物と Control UI バンドルが存在するように、
  `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行します
- すべてのタグ付きリリース前に `pnpm release:check` を実行します
- リリースチェックは現在、別の手動ワークフローで実行されます:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab モック同等性ゲートに加え、
  live Matrix および Telegram QA レーンも実行します。live レーンは
  `qa-live-shared` 環境を使用し、Telegram は Convex CI 資格情報リースも使用します。
- クロスOSのインストールおよびアップグレードのランタイム検証は、
  非公開の呼び出し元ワークフロー
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  からディスパッチされ、再利用可能な公開ワークフロー
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  を呼び出します
- この分割は意図的です: 実際の npm リリース経路は短く、
  決定論的で成果物重視のままにし、遅い live チェックは専用レーンに置くことで、
  公開を停滞させたりブロックしたりしないようにします
- リリースチェックは `main` のワークフロー ref、または
  `release/YYYY.M.D` のワークフロー ref からディスパッチする必要があります。これによりワークフローロジックとシークレットを
  管理下に保てます
- そのワークフローは、既存のリリースタグまたは現在の完全な
  40 文字のワークフローブランチ commit SHA のいずれかを受け付けます
- commit SHA モードでは、現在のワークフローブランチ HEAD のみ受け付けます。
  古いリリース commit にはリリースタグを使用してください
- `OpenClaw NPM Release` の検証専用事前確認でも、push 済みタグを必要とせず、
  現在の完全な 40 文字のワークフローブランチ commit SHA を受け付けます
- その SHA 経路は検証専用であり、実際の公開へ昇格することはできません
- SHA モードでは、ワークフローはパッケージメタデータチェックのためにのみ
  `v<package.json version>` を合成します。実際の公開には引き続き実際のリリースタグが必要です
- 両方のワークフローは、実際の公開と昇格経路を GitHub-hosted
  runner 上に維持しつつ、非破壊の検証経路ではより大きな
  Blacksmith Linux runner を使用できます
- そのワークフローは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットで実行します
- npm リリース事前確認は、別の release checks レーンを待たなくなりました
- 承認前に、`RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/修正タグ）を実行します
- npm 公開後、公開済みレジストリ
  インストール経路を新しい一時 prefix で検証するために、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/修正バージョン）を実行します
- beta 公開後は、公開済み npm パッケージに対する
  インストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を
  共有のリース済み Telegram 資格情報プールで検証するために、
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行します。ローカルの maintainer 単発実行では、Convex 変数を省略し、
  3 つの `OPENCLAW_QA_TELEGRAM_*` env 資格情報を直接渡しても構いません。
- メンテナーは、同じ公開後チェックを GitHub Actions の
  手動 `NPM Telegram Beta E2E` ワークフローからも実行できます。これは意図的に手動専用であり、
  すべてのマージでは実行されません。
- maintainer リリース自動化は現在、preflight-then-promote を使用します:
  - 実際の npm 公開は、成功した npm の `preflight_run_id` を通過している必要があります
  - 実際の npm 公開は、成功した事前確認実行と同じ `main` または
    `release/YYYY.M.D` ブランチからディスパッチされる必要があります
  - stable npm リリースのデフォルトは `beta` です
  - stable npm 公開では、ワークフロー入力で明示的に `latest` を指定できます
  - トークンベースの npm dist-tag 変更は現在
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    にあります。これはセキュリティ上の理由によります。`npm dist-tag add` は依然として `NPM_TOKEN` を必要とし、
    公開リポジトリでは OIDC 専用公開を維持しているためです
  - 公開の `macOS Release` は検証専用です
  - 実際の非公開 mac 公開は、成功した非公開 mac の
    `preflight_run_id` と `validate_run_id` を通過している必要があります
  - 実際の公開経路は、成果物を再ビルドする代わりに、
    準備済み成果物を昇格します
- `YYYY.M.D-N` のような stable 修正リリースでは、公開後検証器は
  `YYYY.M.D` から `YYYY.M.D-N` への同じ temp-prefix アップグレード経路も確認します。これにより
  リリース修正が、古いグローバルインストールをベース stable ペイロードのまま
  静かに残してしまうことを防ぎます
- npm リリース事前確認は、tarball に `dist/control-ui/index.html` と
  空でない `dist/control-ui/assets/` ペイロードの両方が含まれない限り
  fail closed します。これは空のブラウザダッシュボードを再び出荷しないためです
- 公開後検証では、公開済みレジストリインストールに、
  ルート `dist/*` レイアウト配下の空でないバンドル済み Plugin ランタイム依存関係が
  含まれていることも確認します。欠落または空のバンドル済み Plugin
  依存ペイロードを含むリリースは、公開後検証で失敗し、
  `latest` へ昇格できません。
- `pnpm test:install:smoke` でも候補アップデート tarball の npm pack `unpackedSize` 予算を
  強制するため、インストーラー E2E はリリース公開経路の前に
  意図しない pack 膨張を検出します
- リリース作業で CI 計画、拡張 timing manifest、または
  拡張テストマトリクスに触れた場合、承認前に `.github/workflows/ci.yml` の
  planner 所有 `checks-node-extensions` ワークフローマトリクス出力を
  再生成して確認してください。これにより、リリースノートが古い CI レイアウトを説明することを防ぎます
- stable macOS リリースの準備完了には、アップデーターサーフェスも含まれます:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`
    が最終的に含まれている必要があります
  - `main` 上の `appcast.xml` は、公開後に新しい stable zip を指している必要があります
  - パッケージ化アプリは、デバッグでない bundle id、空でない Sparkle feed
    URL、およびそのリリースバージョンの正規 Sparkle build floor 以上の
    `CFBundleVersion` を維持する必要があります

## NPM ワークフロー入力

`OpenClaw NPM Release` は次の運用者制御入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用事前確認用として
  現在の完全な 40 文字のワークフローブランチ commit SHA も指定できます
- `preflight_only`: 検証/build/package のみなら `true`、実際の
  公開経路なら `false`
- `preflight_run_id`: 実際の公開経路で必須です。ワークフローが成功した事前確認実行の
  準備済み tarball を再利用できるようにします
- `npm_dist_tag`: 公開経路の npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Checks` は次の運用者制御入力を受け付けます。

- `ref`: 既存のリリースタグ、または `main` からディスパッチした場合に検証する
  現在の完全な 40 文字の `main` commit SHA。リリースブランチからの場合は、
  既存のリリースタグまたは現在の完全な 40 文字のリリースブランチ commit
  SHA を使用します

ルール:

- stable および修正タグは、`beta` または `latest` のどちらにも公開できます
- beta プレリリースタグは、`beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は
  `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` は常に検証専用であり、現在の
  ワークフローブランチ commit SHA も受け付けます
- リリースチェックの commit SHA モードでも、現在のワークフローブランチ HEAD が必要です
- 実際の公開経路は、事前確認時と同じ `npm_dist_tag` を使用しなければなりません。
  ワークフローは公開継続前にそのメタデータを検証します

## stable npm リリースシーケンス

stable npm リリースを切るとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグがまだ存在しない場合は、事前確認ワークフローの検証専用 dry run として、
     現在の完全なワークフローブランチ commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、
   直接 stable 公開を意図する場合にのみ `latest` を選びます
3. 同じタグ、または現在の完全なワークフローブランチ commit SHA で
   `OpenClaw Release Checks` を別途実行します。これにより live prompt cache、
   QA Lab parity、Matrix、Telegram のカバレッジを得られます
   - これは意図的に分離されています。live カバレッジを利用可能に保ちつつ、
     長時間実行または不安定なチェックを公開ワークフローへ再結合しないためです
4. 成功した `preflight_run_id` を保存します
5. `preflight_only=false`、同じ
   `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` で
   再度 `OpenClaw NPM Release` を実行します
6. リリースが `beta` に入った場合は、非公開の
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使って、その stable バージョンを `beta` から `latest` へ昇格します
7. リリースが意図的に `latest` へ直接公開され、`beta` も
   すぐに同じ stable ビルドを追随すべき場合は、同じ非公開ワークフローを使って
   両方の dist-tag を stable バージョンへ向けるか、またはスケジュールされた
   self-healing sync に後で `beta` を移動させます

dist-tag の変更はセキュリティ上の理由で非公開リポジトリにあります。
これは依然として `NPM_TOKEN` を必要とし、
公開リポジトリでは OIDC 専用公開を維持しているためです。

これにより、直接公開経路と beta-first 昇格経路の両方が、
文書化され、運用者から見える状態に保たれます。

## 公開リファレンス

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

メンテナーは、実際のランブックとして
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
にある非公開リリースドキュメントを使用します。

## 関連

- [Release channels](/ja-JP/install/development-channels)
