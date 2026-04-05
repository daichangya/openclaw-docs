---
read_when:
    - 公開リリースチャンネルの定義を確認したい場合
    - バージョン命名と頻度を確認したい場合
summary: 公開リリースチャンネル、バージョン命名、およびリリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-05T12:55:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# リリースポリシー

OpenClawには3つの公開リリースレーンがあります:

- stable: タグ付きリリース。デフォルトではnpmの`beta`へ公開され、明示的に要求された場合はnpmの`latest`へ公開されます
- beta: npmの`beta`へ公開されるプレリリースタグ
- dev: `main`の移動中の先端

## バージョン命名

- Stableリリースバージョン: `YYYY.M.D`
  - Gitタグ: `vYYYY.M.D`
- Stable修正リリースバージョン: `YYYY.M.D-N`
  - Gitタグ: `vYYYY.M.D-N`
- Betaプレリリースバージョン: `YYYY.M.D-beta.N`
  - Gitタグ: `vYYYY.M.D-beta.N`
- 月と日はゼロ埋めしない
- `latest`は現在昇格済みのstable npmリリースを意味する
- `beta`は現在のbetaインストール対象を意味する
- Stableおよびstable修正リリースはデフォルトでnpmの`beta`へ公開されます。リリース運用者は明示的に`latest`を指定することもでき、また後で検証済みのbetaビルドを昇格させることもできます
- すべてのOpenClawリリースは、npmパッケージとmacOSアプリを同時に出荷します

## リリース頻度

- リリースはbeta-firstで進行します
- Stableは最新betaが検証された後にのみ続きます
- 詳細なリリース手順、承認、認証情報、および復旧メモは
  maintainer専用です

## リリース事前確認

- `pnpm release:check`の前に`pnpm build && pnpm ui:build`を実行して、
  pack
  検証ステップに必要な`dist/*`リリースアーティファクトとControl UIバンドルが存在するようにしてください
- タグ付きリリースの前には毎回`pnpm release:check`を実行してください
- mainブランチのnpm事前確認では
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  もtarballパッケージ化前に実行され、`OPENAI_API_KEY`と
  `ANTHROPIC_API_KEY`の両workflow secretを使用します
- 承認前に`RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応するbeta/修正タグ）を実行してください
- npm公開後は、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応するbeta/修正バージョン）を実行し、新しいtemp prefixで
  公開済みregistryインストールパスを検証してください
- Maintainerリリース自動化では現在、事前確認後に昇格する方式を使用しています:
  - 実際のnpm公開は、成功したnpm `preflight_run_id`を通過していなければならない
  - stable npmリリースのデフォルトは`beta`
  - stable npm公開では、workflow入力によって明示的に`latest`を指定できる
  - stable npmの`beta`から`latest`への昇格は、信頼済みの`OpenClaw NPM Release` workflow上で、依然として明示的な手動モードとして利用可能
  - この昇格モードでも、有効な`NPM_TOKEN`が`npm-release`環境に必要です。npmの`dist-tag`管理は信頼済み公開とは別だからです
  - 公開の`macOS Release`は検証専用
  - 実際の非公開mac公開は、成功した非公開macの
    `preflight_run_id`と`validate_run_id`を通過していなければならない
  - 実際の公開パスでは、再度ビルドするのではなく準備済みアーティファクトを昇格する
- `YYYY.M.D-N`のようなstable修正リリースでは、公開後検証でも
  `YYYY.M.D`から`YYYY.M.D-N`への同じtemp-prefixアップグレードパスを確認し、
  リリース修正によって古いグローバルインストールが
  ベースstable payloadのまま静かに残ることがないようにします
- npmリリース事前確認では、tarballに
  `dist/control-ui/index.html`と空でない`dist/control-ui/assets/`ペイロードの両方が含まれていなければフェイルクローズするため、
  空のブラウザーダッシュボードを再び出荷することはありません
- リリース作業がCI planning、extension timing manifest、または高速
  test matrixに触れた場合は、承認前に`.github/workflows/ci.yml`から
  planner所有の`checks-fast-extensions`
  workflow matrix出力を再生成して確認してください。そうしないとリリースノートが古いCIレイアウトを説明してしまいます
- Stable macOSリリースの準備には、updaterサーフェスも含まれます:
  - GitHubリリースには、パッケージ済みの`.zip`、`.dmg`、`.dSYM.zip`が最終的に含まれていなければならない
  - 公開後の`main`上の`appcast.xml`は、新しいstable zipを指していなければならない
  - パッケージ済みアプリは、非デバッグbundle id、空でないSparkle feed
    URL、およびそのリリースバージョン向けの正規Sparkleビルド下限以上の
    `CFBundleVersion`を維持していなければならない

## NPM workflow入力

`OpenClaw NPM Release`は、運用者が制御する次の入力を受け付けます:

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`
- `preflight_only`: 検証/ビルド/パッケージのみなら`true`、実際の
  公開パスなら`false`
- `preflight_run_id`: 実際の公開パスで必須。workflowが成功した事前確認実行から準備済みtarballを再利用するため
- `npm_dist_tag`: 公開パス向けのnpm対象タグ。デフォルトは`beta`
- `promote_beta_to_latest`: すでに公開済みの
  stable `beta`ビルドを`latest`へ移す場合は`true`。公開はスキップする

ルール:

- Stableおよび修正タグは`beta`または`latest`のいずれかへ公開可能
- Betaプレリリースタグは`beta`にのみ公開可能
- 実際の公開パスでは、事前確認時と同じ`npm_dist_tag`を使わなければならず、
  workflowは公開継続前にそのメタデータを検証する
- 昇格モードでは、stableまたは修正タグ、`preflight_only=false`、
  空の`preflight_run_id`、および`npm_dist_tag=beta`を使用しなければならない
- 昇格モードでも、`npm dist-tag add`には通常のnpm認証が必要なため、
  `npm-release`環境に有効な`NPM_TOKEN`が必要です

## Stable npmリリース手順

stable npmリリースを切るとき:

1. `preflight_only=true`で`OpenClaw NPM Release`を実行する
2. 通常のbeta-firstフローでは`npm_dist_tag=beta`を選び、意図的に直接stable公開したい場合にのみ`latest`を選ぶ
3. 成功した`preflight_run_id`を保存する
4. `preflight_only=false`、同じ
   `tag`、同じ`npm_dist_tag`、保存した`preflight_run_id`で
   再度`OpenClaw NPM Release`を実行する
5. リリースが`beta`へ出た場合、その後
   同じstable `tag`、`promote_beta_to_latest=true`、`preflight_only=false`、
   `preflight_run_id`を空、`npm_dist_tag=beta`で`OpenClaw NPM Release`を実行し、
   その公開済みビルドを`latest`へ移したいタイミングで昇格する

この昇格モードでも、`npm-release`環境の承認と、その
環境内の有効な`NPM_TOKEN`が必要です。

これにより、直接公開パスとbeta-first昇格パスの両方が文書化され、
運用者から見える状態に保たれます。

## 公開参照

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerは、実際のランブックとして
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
内の非公開リリースドキュメントを使用します。
