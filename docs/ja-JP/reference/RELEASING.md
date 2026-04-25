---
read_when:
    - 公開リリースチャネルの定義を探している場合
    - バージョン命名とリリース頻度を探している場合
summary: 公開リリースチャネル、バージョン命名、リリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-25T13:58:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: デフォルトでは npm の `beta` に公開されるタグ付きリリース。明示的に要求された場合は npm の `latest` に公開
- beta: npm の `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- stable 修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日はゼロ埋めしない
- `latest` は現在昇格済みの stable npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- stable および stable 修正リリースはデフォルトで npm の `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、後で検証済みの beta ビルドを昇格させることもできる
- すべての stable OpenClaw リリースでは npm パッケージと macOS アプリが一緒に出荷される。
  beta リリースでは通常、まず npm/package パスを検証して公開し、
  mac アプリの build/sign/notarize は明示的に要求されない限り stable 用に予約される

## リリース頻度

- リリースは beta-first で進む
- stable は最新の beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチから
  リリースを切る。これにより、リリースの検証や修正で `main` の新しい
  開発がブロックされない
- beta タグが push または公開された後に修正が必要になった場合、
  メンテナーは古い beta タグを削除または再作成する代わりに、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用

## リリース事前確認

- リリース事前確認の前に `pnpm check:test-types` を実行し、高速なローカル
  `pnpm check` ゲートの外でもテスト TypeScript がカバーされるようにする
- リリース事前確認の前に `pnpm check:architecture` を実行し、より高速なローカルゲートの外でも、
  より広い import cycle とアーキテクチャ境界のチェックがグリーンであることを確認する
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、pack
  検証ステップに必要な `dist/*` リリース成果物と Control UI バンドルが
  存在するようにする
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab モック parity gate と
  live Matrix および Telegram QA レーンも実行する。live レーンは
  `qa-live-shared` 環境を使用し、Telegram は Convex CI credential leases も使用する
- Cross-OS インストールおよびアップグレードのランタイム検証は、
  非公開の呼び出し元ワークフロー
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  からディスパッチされ、再利用可能な公開ワークフロー
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  を呼び出す
- この分離は意図的なもの。実際の npm リリースパスを短く、
  決定的で、成果物中心のままにし、時間のかかる live チェックは独自の
  レーンに置いて、公開を停滞またはブロックしないようにする
- リリースチェックは `main` のワークフロー ref または
  `release/YYYY.M.D` のワークフロー ref からディスパッチする必要があり、
  ワークフローロジックと secrets を管理下に置く
- そのワークフローは既存のリリースタグ、または現在の完全な
  40 文字のワークフローブランチ commit SHA のいずれかを受け付ける
- commit-SHA モードでは、現在のワークフローブランチ HEAD のみを受け付ける。
  古いリリースコミットにはリリースタグを使う
- `OpenClaw NPM Release` の検証専用事前確認も、push 済みタグを必要とせず、
  現在の完全な 40 文字のワークフローブランチ commit SHA を受け付ける
- その SHA パスは検証専用であり、実際の公開に昇格することはできない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためにのみ
  `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要
- 両ワークフローとも、実際の公開および昇格パスは GitHub-hosted
  runners 上に維持しつつ、非破壊の検証パスではより大きい
  Blacksmith Linux runners を使用できる
- そのワークフローは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフロー secrets を使って実行する
- npm リリース事前確認は、別レーンのリリースチェックを待たなくなった
- 承認前に
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/修正タグ）を実行する
- npm 公開後、公開されたレジストリのインストールパスを新しい temp prefix で
  検証するために、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/修正バージョン）を実行する
- beta 公開後、共有のリース済み Telegram 認証情報プールを使って、
  公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、
  Telegram セットアップ、および実際の Telegram E2E を検証するために、
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行する。ローカルのメンテナーによる単発実行では Convex 変数を省略し、
  3 つの `OPENCLAW_QA_TELEGRAM_*` env 認証情報を直接渡してもよい
- メンテナーは、同じ公開後チェックを GitHub Actions の手動
  `NPM Telegram Beta E2E` ワークフローから実行することもできる。これは意図的に手動専用であり、
  すべてのマージでは実行されない
- メンテナーのリリース自動化は現在、preflight-then-promote を使用する:
  - 実際の npm 公開は、成功した npm `preflight_run_id` を通過している必要がある
  - 実際の npm 公開は、成功した事前確認実行と同じ `main` または
    `release/YYYY.M.D` ブランチからディスパッチする必要がある
  - stable npm リリースのデフォルトは `beta`
  - stable npm 公開はワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    に置かれている。これは `npm dist-tag add` が依然として `NPM_TOKEN` を必要とする一方で、
    公開リポジトリは OIDC 専用公開を維持しているため、セキュリティ上の理由による
  - 公開の `macOS Release` は検証専用
  - 実際の非公開 mac 公開は、成功した非公開 mac の
    `preflight_run_id` と `validate_run_id` を通過している必要がある
  - 実際の公開パスは、成果物を再度ビルドする代わりに、準備済みの成果物を昇格する
- `YYYY.M.D-N` のような stable 修正リリースでは、公開後検証ツールは
  `YYYY.M.D` から `YYYY.M.D-N` への同じ temp-prefix アップグレードパスも検証し、
  リリース修正によって古いグローバルインストールがベース stable payload のまま
  ひそかに残ることがないようにする
- npm リリース事前確認は、tarball に `dist/control-ui/index.html` と
  空でない `dist/control-ui/assets/` payload の両方が含まれていない限り、
  fail closed する。これにより、空のブラウザダッシュボードを再び出荷しないようにする
- 公開後検証では、公開されたレジストリインストールに、ルート `dist/*`
  レイアウト配下の空でない bundled plugin ランタイム依存関係が含まれていることも
  確認する。bundled plugin の依存 payload が欠落または空のまま出荷された
  リリースは、postpublish verifier で失敗し、
  `latest` に昇格できない
- `pnpm test:install:smoke` も候補アップデート tarball の npm pack
  `unpackedSize` 予算を強制するため、インストーラー e2e でリリース公開パス前に
  偶発的な pack 膨張を検出できる
- リリース作業で CI planning、extension timing manifests、または
  extension テストマトリクスに触れた場合は、承認前に `.github/workflows/ci.yml`
  から planner 管理の `checks-node-extensions` ワークフローマトリクス出力を
  再生成して確認する。これにより、リリースノートが古い CI レイアウトを
  説明することを防ぐ
- stable macOS リリース準備には updater サーフェスも含まれる:
  - GitHub リリースにはパッケージ化された `.zip`、`.dmg`、`.dSYM.zip`
    が最終的に含まれている必要がある
  - `main` 上の `appcast.xml` は公開後に新しい stable zip を指している必要がある
  - パッケージ化されたアプリは、デバッグでない bundle id、空でない Sparkle feed
    URL、およびそのリリースバージョンの標準 Sparkle build floor 以上の
    `CFBundleVersion` を維持している必要がある

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用事前確認向けに
  現在の完全な 40 文字のワークフローブランチ commit SHA も使用できる
- `preflight_only`: 検証/build/package のみの場合は `true`、実際の
  公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功した事前確認実行から
  準備済み tarball を再利用できるようにする
- `npm_dist_tag`: 公開パスの npm 対象タグ。デフォルトは `beta`

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 既存のリリースタグ、または `main` からディスパッチした際に検証する
  現在の完全な 40 文字の `main` commit SHA。リリースブランチからの場合は、
  既存のリリースタグまたは現在の完全な 40 文字の release-branch commit
  SHA を使用する

ルール:

- stable および修正タグは `beta` または `latest` のどちらにも公開できる
- beta プレリリースタグは `beta` にのみ公開できる
- `OpenClaw NPM Release` では、完全な commit SHA 入力は
  `preflight_only=true` のときにのみ許可される
- `OpenClaw Release Checks` は常に検証専用であり、
  現在のワークフローブランチ commit SHA も受け付ける
- リリースチェックの commit-SHA モードでは、現在のワークフローブランチ HEAD も必要
- 実際の公開パスでは、事前確認で使用したものと同じ `npm_dist_tag` を使用する必要がある。
  ワークフローは公開続行前にそのメタデータを検証する

## Stable npm リリース手順

stable npm リリースを切るときは、次のようにします。

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - タグがまだ存在しない場合は、事前確認ワークフローの検証専用ドライランとして、
     現在の完全なワークフローブランチ commit SHA を使用してよい
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、
   意図的に stable を直接公開したい場合にのみ `latest` を選ぶ
3. live prompt cache、
   QA Lab parity、Matrix、および Telegram カバレッジが必要な場合は、
   同じタグまたは現在の完全なワークフローブランチ commit SHA で
   `OpenClaw Release Checks` を別途実行する
   - これは意図的に分離されている。公開ワークフローに長時間実行または不安定なチェックを
     再結合することなく、live カバレッジを利用可能なままにするため
4. 成功した `preflight_run_id` を保存する
5. `preflight_only=false`、同じ `tag`、同じ `npm_dist_tag`、
   保存した `preflight_run_id` で `OpenClaw NPM Release` を再度実行する
6. リリースが `beta` に着地した場合は、非公開の
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使って、その stable バージョンを `beta` から `latest` に昇格する
7. リリースを意図的に `latest` に直接公開し、`beta` も
   直ちに同じ stable ビルドに合わせる必要がある場合は、同じ非公開
   ワークフローを使って両方の dist-tag を stable バージョンに向けるか、
   そのスケジュール済み self-healing sync に後で `beta` を移動させる

dist-tag の変更が非公開リポジトリにあるのは、セキュリティ上の理由によるものです。
これは依然として `NPM_TOKEN` を必要とする一方で、公開リポジトリは
OIDC 専用公開を維持しているためです。

これにより、直接公開パスと beta-first 昇格パスの両方が
文書化され、オペレーターから見える状態に保たれます。

メンテナーがローカル npm 認証にフォールバックする必要がある場合、
1Password CLI（`op`）コマンドは必ず専用の tmux セッション内でのみ実行してください。
メインのエージェントシェルから `op` を直接呼び出してはいけません。tmux 内に保持することで、
プロンプト、アラート、および OTP 処理が観測可能になり、
ホストでのアラートの繰り返しを防げます。

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
