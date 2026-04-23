---
read_when:
    - CIジョブが実行された、または実行されなかった理由を理解する必要があります
    - 失敗しているGitHub Actionsチェックをデバッグしています
summary: CIジョブグラフ、スコープゲート、およびローカルコマンドの対応表
title: CIパイプライン
x-i18n:
    generated_at: "2026-04-23T04:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57d0979f7b6667b023b1ee4887003a8408cd0028a856abc02eb3ad684e9a8235
    source_path: ci.md
    workflow: 15
---

# CIパイプライン

CIは、`main` へのすべてのプッシュと、すべてのプルリクエストで実行されます。無関係な領域だけが変更された場合に高コストなジョブをスキップするため、スマートなスコープ判定を使用しています。

## ジョブ概要

| ジョブ                             | 目的                                                                                         | 実行されるタイミング                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------- |
| `preflight`                        | docs-only の変更、変更されたスコープ、変更された拡張機能を検出し、CIマニフェストを構築する   | draftではないプッシュとPRで常に実行     |
| `security-scm-fast`                | `zizmor` による秘密鍵検出とワークフロー監査                                                  | draftではないプッシュとPRで常に実行     |
| `security-dependency-audit`        | npmアドバイザリに対する、依存関係なしの本番用ロックファイル監査                              | draftではないプッシュとPRで常に実行     |
| `security-fast`                    | 高速セキュリティジョブ用の必須集約ジョブ                                                     | draftではないプッシュとPRで常に実行     |
| `build-artifacts`                  | `dist/`、Control UI、ビルド成果物チェック、再利用可能な下流成果物をビルドする                | Node関連の変更                          |
| `checks-fast-core`                 | バンドル済み/plugin-contract/protocolチェックなどの高速なLinux正当性レーン                   | Node関連の変更                          |
| `checks-fast-contracts-channels`   | 安定した集約チェック結果を持つ、シャード化されたチャネルコントラクトチェック                  | Node関連の変更                          |
| `checks-node-extensions`           | 拡張機能スイート全体にわたる、バンドル済みpluginの完全なテストシャード                        | Node関連の変更                          |
| `checks-node-core-test`            | チャネル、バンドル済み、コントラクト、拡張機能レーンを除く、コアNodeテストシャード           | Node関連の変更                          |
| `extension-fast`                   | 変更されたバンドル済みpluginのみに対する重点テスト                                           | 拡張機能に変更があるプルリクエスト      |
| `check`                            | シャード化されたメインのローカルゲート相当: 本番型、lint、ガード、テスト型、厳格なスモーク   | Node関連の変更                          |
| `check-additional`                 | アーキテクチャ、境界、拡張機能サーフェスガード、package-boundary、gateway-watchシャード       | Node関連の変更                          |
| `build-smoke`                      | ビルド済みCLIスモークテストと起動時メモリスモーク                                            | Node関連の変更                          |
| `checks`                           | ビルド済み成果物のチャネルテストと、push限定のNode 22互換性の検証                            | Node関連の変更                          |
| `check-docs`                       | ドキュメントのフォーマット、lint、リンク切れチェック                                         | docsが変更されたとき                    |
| `skills-python`                    | PythonベースのSkills向け Ruff + pytest                                                       | Python Skills関連の変更                 |
| `checks-windows`                   | Windows固有のテストレーン                                                                     | Windows関連の変更                       |
| `macos-node`                       | 共有ビルド成果物を使用するmacOS TypeScriptテストレーン                                       | macOS関連の変更                         |
| `macos-swift`                      | macOSアプリ向けSwiftのlint、ビルド、テスト                                                    | macOS関連の変更                         |
| `android`                          | 両フレーバー向けAndroidユニットテストと、1つのdebug APKビルド                                | Android関連の変更                       |

## Fail-Fast の順序

ジョブは、安価なチェックが高価なジョブより先に失敗するように並べられています。

1. `preflight` が、そもそもどのレーンを存在させるかを決定します。`docs-scope` と `changed-scope` のロジックは独立したジョブではなく、このジョブ内のステップです。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォームマトリクスジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速なLinuxレーンと並行して動作し、共有ビルドの準備ができ次第、下流コンシューマが開始できるようにします。
4. その後、より重いプラットフォームおよびランタイムレーンがファンアウトします: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、PR限定の `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。
CIワークフローの編集では、Node CIグラフとワークフローlintは検証されますが、それだけではWindows、Android、macOSのネイティブビルドは強制されません。これらのプラットフォームレーンは、引き続きプラットフォームのソース変更に対してのみスコープされます。
Windows Nodeチェックは、Windows固有のprocess/pathラッパー、npm/pnpm/UIランナーヘルパー、パッケージマネージャ設定、およびそのレーンを実行するCIワークフローサーフェスにスコープされます。無関係なソース、plugin、install-smoke、テストのみの変更はLinux Nodeレーンに留まるため、通常のテストシャードですでにカバーされている範囲のために16-vCPUのWindowsワーカーを確保することはありません。
別個の `install-smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。より狭い changed-smoke シグナルから `run_install_smoke` を算出するため、Docker/install smoke は、インストール、パッケージング、コンテナ関連の変更、バンドル済み拡張機能の本番変更、およびDocker smokeジョブが実行するコアのplugin/channel/gateway/Plugin SDKサーフェスに対して実行されます。テストのみとdocsのみの編集ではDockerワーカーを確保しません。そのQR package smokeは、BuildKitのpnpmストアキャッシュを維持しながらDockerの `pnpm install` レイヤーを強制的に再実行するため、毎回依存関係を再ダウンロードせずにインストールを引き続き検証できます。その gateway-network e2e は、そのジョブ内で先にビルドされたランタイムイメージを再利用するため、別のDockerビルドを追加せずに実際のコンテナ間WebSocketカバレッジを追加します。別個の `docker-e2e-fast` ジョブは、120秒のコマンドタイムアウトのもとで、制限付きのバンドル済みplugin Dockerプロファイルを実行します: setup-entry の依存関係修復と、合成された bundled-loader 障害の分離です。完全なバンドル済み更新/チャネルマトリクスは、実際のnpm updateとdoctor repairの反復実行を行うため、手動/フルスイートのままです。

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルゲートは、広いCIプラットフォームスコープよりもアーキテクチャ境界に対して厳格です。コア本番変更ではコア本番typecheckとコアテストを実行し、コアのテストのみの変更ではコアのテストtypecheck/テストのみを実行し、拡張機能の本番変更では拡張機能の本番typecheckと拡張機能テストを実行し、拡張機能のテストのみの変更では拡張機能のテストtypecheck/テストのみを実行します。公開Plugin SDKまたは plugin-contract の変更は、拡張機能がそれらのコアコントラクトに依存しているため、拡張機能の検証まで拡大されます。リリースメタデータのみのバージョン更新では、対象を絞った version/config/root-dependency チェックが実行されます。不明な root/config の変更は、安全側に倒してすべてのレーンになります。

push時には、`checks` マトリクスに push限定の `compat-node22` レーンが追加されます。プルリクエストでは、そのレーンはスキップされ、マトリクスは通常のテスト/チャネルレーンに集中したままになります。

最も遅いNodeテスト群は、各ジョブが小さく保たれるように分割または均衡化されています。チャネルコントラクトは registry と core のカバレッジを合計6つの重み付きシャードに分割し、バンドル済みpluginテストは6つの拡張機能ワーカー全体で均衡化され、auto-reply は6つの小さなワーカーではなく3つの均衡化されたワーカーとして実行され、agentic gateway/plugin configs はビルド済み成果物を待つのではなく既存のソース専用agentic Nodeジョブ全体に分散されます。広範なbrowser、QA、media、miscellaneous pluginテストは、共有pluginキャッチオールではなく専用のVitest設定を使用します。広範な agents レーンは、単一の遅いテストファイルに支配されるのではなく import/スケジューリング支配であるため、共有のVitest file-parallel schedulerを使用します。`runtime-config` は infra core-runtime シャードで実行され、共有runtimeシャードが末尾を抱え込まないようにしています。`check-additional` は package-boundary の compile/canary 作業をまとめて維持し、ランタイムトポロジーアーキテクチャを gateway watch カバレッジから分離します。boundary guard シャードは、その小さく独立したガードを1つのジョブ内で並行実行します。Gateway watch、チャネルテスト、およびコア support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされたあとに `build-artifacts` 内で並行実行され、2つの追加Blacksmithワーカーと2つ目のartifact-consumerキューを避けつつ、従来のチェック名を軽量な検証ジョブとして維持します。
Android CIは `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party フレーバーには別個のソースセットやマニフェストはありませんが、そのユニットテストレーンではSMS/call-log BuildConfig フラグを使ってそのフレーバーをコンパイルしつつ、Android関連のすべてのpushでdebug APKのパッケージングジョブを重複実行することは避けています。
`extension-fast` はPR限定です。push実行では、すでに完全なバンドル済みpluginシャードを実行しているためです。これにより、レビュー向けの changed-plugin フィードバックを維持しつつ、`main` で既に `checks-node-extensions` に存在するカバレッジのために追加のBlacksmithワーカーを確保せずに済みます。

GitHubは、同じPRまたは `main` ref に新しいpushが届いたとき、置き換えられたジョブを `cancelled` とマークする場合があります。同じrefに対する最新の実行も失敗していない限り、これをCIノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使用しているため、通常のシャード失敗は引き続き報告されますが、ワークフロー全体がすでに置き換えられている場合にはキューに入りません。
CIのconcurrency keyはバージョン付き（`CI-v7-*`）であるため、古いキューグループ内のGitHub側ゾンビが新しいmain実行を無期限にブロックすることはありません。

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブとその集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速な protocol/contract/bundled チェック、シャード化されたチャネルコントラクトチェック、lint を除く `check` シャード、`check-additional` のシャードと集約、Nodeテストの集約検証ジョブ、docs チェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke の preflight も GitHubホステッド Ubuntu を使用し、Blacksmith マトリクスがより早くキューに入れるようにしています |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Nodeテストシャード、バンドル済みpluginテストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`。これは依然として十分にCPU感度が高く、8 vCPUでは節約できた以上のコストがかかりました。また、install-smoke の Dockerビルドでも、32 vCPUは節約できた以上にキュー時間のコストがかかりました                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` での `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` での `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                         |

## ローカルでの対応コマンド

```bash
pnpm changed:lanes   # origin/main...HEAD に対するローカル changed-lane 分類器を確認
pnpm check:changed   # スマートなローカルゲート: 境界レーンごとの変更差分に応じた typecheck/lint/tests
pnpm check          # 高速なローカルゲート: 本番 tsgo + シャード化された lint + 並列高速ガード
pnpm check:test-types
pnpm check:timed    # 同じゲートを各ステージの所要時間付きで実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest テスト
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs のフォーマット + lint + リンク切れ
pnpm build          # CI の artifact/build-smoke レーンが関係する場合に dist をビルド
node scripts/ci-run-timings.mjs <run-id>  # 総所要時間、キュー時間、最も遅いジョブを要約
```
