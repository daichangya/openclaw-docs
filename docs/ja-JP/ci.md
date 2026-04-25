---
read_when:
    - CIジョブが実行された、または実行されなかった理由を理解する必要があります
    - 失敗しているGitHub Actionsチェックをデバッグしています
summary: CIジョブグラフ、スコープゲート、およびローカルコマンドの対応関係
title: CIパイプライン
x-i18n:
    generated_at: "2026-04-25T13:43:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

CIは `main` へのすべてのpushとすべてのpull requestで実行されます。スマートスコープを使用しており、変更が無関係な領域に限られる場合は高コストなジョブをスキップします。

QA Labには、メインのスマートスコープワークフローとは別に専用のCIレーンがあります。`Parity gate` ワークフローは、条件に一致するPR変更時と手動ディスパッチ時に実行され、非公開QAランタイムをビルドして、モックのGPT-5.4およびOpus 4.6 agentic packを比較します。`QA-Lab - All Lanes` ワークフローは、`main` で毎晩、および手動ディスパッチ時に実行され、モック parity gate、live Matrixレーン、live Telegramレーンを並列ジョブとして展開します。liveジョブは `qa-live-shared` environment を使用し、TelegramレーンはConvex leaseを使用します。`OpenClaw Release Checks` も、リリース承認前に同じQA Labレーンを実行します。

`Duplicate PRs After Merge` ワークフローは、マージ後の重複クリーンアップのための、メンテナー向け手動ワークフローです。デフォルトではdry-runで動作し、`apply=true` のときにのみ、明示的に列挙されたPRをクローズします。GitHubを変更する前に、取り込まれたPRがマージ済みであること、および各重複PRが参照issueを共有しているか、変更hunkが重複していることを検証します。

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動型Codexメンテナンスレーンです。純粋なスケジュール実行はありません。`main` 上で成功した非botのpush CI実行がトリガーになり、手動ディスパッチでも直接実行できます。workflow-run経由の起動では、`main` がすでに先へ進んでいる場合、またはスキップされていない別のDocs Agent実行が直近1時間以内に作成されている場合はスキップされます。実行時には、直前のスキップされていないDocs Agentのsource SHAから現在の `main` までのコミット範囲をレビューするため、1時間ごとの1回の実行で、前回のdocs実行以降に蓄積された `main` のすべての変更をカバーできます。

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動型Codexメンテナンスレーンです。これも純粋なスケジュール実行はありません。`main` 上で成功した非botのpush CI実行がトリガーになりますが、そのUTC日内に別のworkflow-run起動がすでに実行済みまたは実行中であればスキップされます。手動ディスパッチはこの日次アクティビティゲートをバイパスします。このレーンは、Vitestフルスイートのグループ化されたパフォーマンスレポートをビルドし、Codexには広範なリファクタではなく、カバレッジを維持する小さなテスト性能修正だけを行わせ、その後フルスイートレポートを再実行して、通過するベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codexは明らかな失敗のみ修正してよく、その後のフルスイートレポートが通過してからでないと何もコミットされません。botのpushが着地する前に `main` が進んだ場合、このレーンは検証済みパッチをrebaseし、`pnpm check:changed` を再実行してpushを再試行します。競合する古いパッチはスキップされます。Codex actionがdocs agentと同じdrop-sudo安全方針を維持できるよう、GitHub-hosted Ubuntuを使用します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ジョブ概要

| ジョブ                             | 目的                                                                                         | 実行タイミング                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | docs-only変更、変更スコープ、変更されたextensionを検出し、CIマニフェストをビルドする         | draftではないすべてのpushとPRで常時実行 |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                  | draftではないすべてのpushとPRで常時実行 |
| `security-dependency-audit`      | npm advisoryに対する、本番lockfileの依存関係不要監査                                         | draftではないすべてのpushとPRで常時実行 |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                             | draftではないすべてのpushとPRで常時実行 |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みartifactチェック、および再利用可能な下流artifactをビルドする  | Node関連の変更時                      |
| `checks-fast-core`               | bundled/plugin-contract/protocolチェックなどの高速Linux正当性レーン                          | Node関連の変更時                      |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化されたチャネル契約チェック                          | Node関連の変更時                      |
| `checks-node-extensions`         | extensionスイート全体にわたるbundled-plugin完全テストシャード                                | Node関連の変更時                      |
| `checks-node-core-test`          | チャネル、bundled、contract、extensionレーンを除く、コアNodeテストシャード                   | Node関連の変更時                      |
| `extension-fast`                 | 変更されたbundled pluginのみを対象にしたフォーカステスト                                     | extension変更を含むpull request       |
| `check`                          | シャード化されたメインのローカルゲート相当: 本番type、lint、guard、test type、strict smoke    | Node関連の変更時                      |
| `check-additional`               | architecture、boundary、extension-surface guard、package-boundary、gateway-watchシャード      | Node関連の変更時                      |
| `build-smoke`                    | ビルド済みCLI smokeテストと起動メモリsmoke                                                   | Node関連の変更時                      |
| `checks`                         | ビルド済みartifactチャネルテストと、push時のみのNode 22互換性の検証                          | Node関連の変更時                      |
| `check-docs`                     | docsのフォーマット、lint、リンク切れチェック                                                  | Docs変更時                            |
| `skills-python`                  | PythonバックエンドのSkills向けRuff + pytest                                                  | Python Skills関連の変更時             |
| `checks-windows`                 | Windows固有のテストレーン                                                                     | Windows関連の変更時                   |
| `macos-node`                     | 共有ビルドartifactを使うmacOS TypeScriptテストレーン                                         | macOS関連の変更時                     |
| `macos-swift`                    | macOSアプリ向けSwift lint、ビルド、テスト                                                     | macOS関連の変更時                     |
| `android`                        | 両flavor向けAndroid unit testと、1つのdebug APKビルド                                         | Android関連の変更時                   |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次Codex遅延テスト最適化                                          | Main CI成功時または手動ディスパッチ   |

## fail-fastの順序

ジョブは、安価なチェックが高コストなジョブより先に失敗するよう順序付けされています。

1. `preflight` が、どのレーンをそもそも存在させるかを決定します。`docs-scope` と `changed-scope` のロジックは独立したジョブではなく、このジョブ内のstepです。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いartifactおよびプラットフォームmatrixジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速Linuxレーンと並行して実行され、共有ビルドの準備ができしだい下流のconsumerが開始できるようにします。
4. その後、より重いプラットフォームおよびランタイムレーンがfan-outします: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、PR限定の `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のunit testでカバーされています。
CIワークフローの編集では、Node CIグラフとワークフローlintは検証されますが、それだけでWindows、Android、またはmacOSネイティブビルドを強制することはありません。これらのプラットフォームレーンは、引き続き各プラットフォームのソース変更にのみスコープされます。
CIルーティング専用の編集、一部の安価なcore-test fixture編集、および限定的なplugin contract helper/test-routing編集では、高速なNode専用マニフェストパスが使われます: preflight、security、そして単一の `checks-fast-core` タスクです。このパスでは、変更ファイルが、その高速タスクが直接テストするルーティングまたはhelperサーフェスに限定されている場合、build artifact、Node 22互換性、channel contract、完全なcore shard、bundled-plugin shard、および追加guard matrixを回避します。
Windows Nodeチェックは、Windows固有のprocess/path wrapper、npm/pnpm/UI runner helper、package manager設定、およびそのレーンを実行するCIワークフローサーフェスにスコープされます。無関係なソース、plugin、install-smoke、テスト専用変更はLinux Nodeレーンに留まり、通常のテストshardですでにカバーされている範囲のために16-vCPUのWindows workerを確保しません。
別個の `install-smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smokeカバレッジは `run_fast_install_smoke` と `run_full_install_smoke` に分割されます。pull requestでは、Docker/packageサーフェス、bundled plugin package/manifest変更、およびDocker smokeジョブがテストするcore plugin/channel/gateway/Plugin SDKサーフェスに対して高速パスが実行されます。ソースのみのbundled plugin変更、テスト専用編集、docs専用編集ではDocker workerを確保しません。高速パスはルートDockerfileイメージを1回ビルドし、CLIを確認し、agents delete shared-workspace CLI smokeを実行し、container gateway-network e2eを実行し、bundled extension build argを検証し、集約コマンドタイムアウト240秒のもとでbounded bundled-plugin Docker profileを実行します。各シナリオのDocker実行には個別の上限があります。完全パスは、夜間スケジュール実行、手動ディスパッチ、workflow-callによるrelease check、および実際にinstaller/package/Dockerサーフェスに触れるpull requestに対して、QR package installおよびinstaller Docker/updateカバレッジを維持します。merge commitを含む `main` へのpushでは完全パスは強制されません。changed-scopeロジックがpushで完全カバレッジを要求する場合でも、このワークフローは高速Docker smokeを維持し、完全なinstall smokeは夜間またはrelease検証に委ねます。低速なBun global install image-provider smokeは `run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとrelease checks workflowから実行され、手動の `install-smoke` ディスパッチでもオプトインできますが、pull requestと `main` pushでは実行されません。QRおよびinstaller Dockerテストは、独自のinstall専用Dockerfileを維持します。ローカルの `test:docker:all` は、共有live-testイメージ1つと共有 `scripts/e2e/Dockerfile` built-appイメージ1つを事前ビルドし、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` を指定して、重み付きスケジューラでlive/E2E smokeレーンを実行します。デフォルトのmain-poolスロット数10は `OPENCLAW_DOCKER_ALL_PARALLELISM` で、provider-sensitiveなtail-poolスロット数10は `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` で調整できます。重いレーンの上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` になっており、npm installやマルチサービスレーンがDockerを過剰使用しないようにしつつ、軽いレーンは利用可能スロットを埋められます。レーン開始は、ローカルDocker daemonでのcreate stormを避けるため、デフォルトで2秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` または他のミリ秒値で上書きできます。ローカル集約処理は、Dockerのpreflightを行い、古いOpenClaw E2Eコンテナを削除し、アクティブレーンのステータスを出力し、最長優先順序付けのためにレーン時間を保存し、スケジューラ確認用の `OPENCLAW_DOCKER_ALL_DRY_RUN=1` をサポートします。デフォルトでは最初の失敗後に新しいpooled laneのスケジューリングを停止し、各レーンには120分のフォールバックタイムアウトがあります。これは `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書き可能で、一部のlive/tailレーンではより厳しい個別上限を使用します。再利用可能なlive/E2E workflowも、Docker matrixの前にSHAタグ付きGHCR Docker E2Eイメージを1つビルドしてpushし、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` を指定してmatrixを実行することで、この共有イメージパターンを反映しています。スケジュールされたlive/E2E workflowは、完全なrelease-path Dockerスイートを毎日実行します。bundled update matrixは更新ターゲットごとに分割されており、繰り返しのnpm updateやdoctor repairパスを他のbundledチェックと一緒にshard化できます。

ローカルchanged-laneロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルゲートは、広いCIプラットフォームスコープよりもarchitecture boundaryに対して厳格です。core本番変更ではcore prod typecheckとcore testを実行し、core test専用変更ではcore test typecheck/testsのみを実行し、extension本番変更ではextension prod typecheckとextension testを実行し、extension test専用変更ではextension test typecheck/testsのみを実行します。公開Plugin SDKまたはplugin-contractの変更は、extensionがそれらのcore contractに依存するため、extension検証まで拡張されます。release metadata専用のversion bumpでは、対象を絞ったversion/config/root-dependencyチェックが実行されます。不明なroot/config変更は、安全側に倒してすべてのレーンを実行します。

pushでは、`checks` matrixにpush専用の `compat-node22` レーンが追加されます。pull requestでは、このレーンはスキップされ、matrixは通常のtest/channelレーンに集中します。

最も遅いNodeテスト群は、各ジョブを小さく保ちながらrunnerの過剰確保を避けるよう分割またはバランス調整されています。channel contractは重み付き3 shardとして実行され、bundled plugin testは6つのextension workerに分散され、小さなcore unit laneはペア化され、auto-replyは6つの小さなworkerではなく3つのバランス済みworkerとして実行され、agentic gateway/plugin configは、built artifactを待つのではなく、既存のsource-only agentic Nodeジョブ全体に分散されます。広範なbrowser、QA、media、およびmiscellaneous plugin testは、共有plugin catch-allではなく専用のVitest設定を使用します。extension shardジョブは、一度に最大2つのplugin config groupを、それぞれ1つのVitest workerで実行し、より大きいNode heapを使うことで、import負荷の高いplugin batchが追加CIジョブを生まないようにします。広範なagents laneは、単一の遅いテストファイルに支配されるのではなくimport/スケジューリング支配であるため、共有Vitestのfile-parallel schedulerを使用します。`runtime-config` はinfra core-runtime shardと一緒に実行され、共有runtime shardがtailを持つのを防ぎます。`check-additional` はpackage-boundaryのcompile/canary作業をまとめて維持し、runtime topology architectureとgateway watch coverageを分離します。boundary guard shardは、小さく独立したguardを1つのジョブ内で並行実行します。Gateway watch、channel test、およびcore support-boundary shardは、`dist/` と `dist-runtime/` がすでにビルドされた後に `build-artifacts` 内で並行実行され、従来のcheck名を軽量なverifierジョブとして維持しつつ、追加のBlacksmith worker 2台と2回目のartifact-consumer queueを避けます。
Android CIは、`testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後Play debug APKをビルドします。third-party flavorには別個のsource setやmanifestはありませんが、そのunit-test laneはSMS/call-log BuildConfigフラグ付きでそのflavorを引き続きコンパイルしつつ、Android関連のpushごとにdebug APKパッケージングジョブを重複実行することは避けます。
`extension-fast` はPR専用です。push実行ではすでに完全なbundled plugin shardが実行されるためです。これにより、レビュー向けには変更pluginのフィードバックを維持しつつ、`main` では `checks-node-extensions` にすでに含まれているカバレッジのために追加のBlacksmith workerを確保しません。

GitHubは、同じPRまたは `main` refに新しいpushが届いたとき、置き換えられたジョブを `cancelled` とマークすることがあります。同じrefの最新実行も失敗しているのでなければ、これはCIノイズとして扱ってください。集約shardチェックは `!cancelled() && always()` を使用しているため、ワークフロー全体がすでに置き換えられている場合にはキューされませんが、通常のshard失敗は引き続き報告されます。
CI concurrency keyはバージョン付き（`CI-v7-*`）であり、GitHub側の古いキューグループにあるzombieが、新しいmain実行を無期限にブロックしないようにしています。

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブとその集約（`security-scm-fast`, `security-dependency-audit`, `security-fast`）、高速protocol/contract/bundledチェック、シャード化されたchannel contractチェック、lint以外の `check` shard、`check-additional` のshardと集約、Nodeテスト集約verifier、docsチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smokeのpreflightもGitHub-hosted Ubuntuを使用し、Blacksmith matrixを早めにキューできるようにしています |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Nodeテストshard、bundled pluginテストshard、`android`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`。これは依然としてCPU感度が高く、8 vCPUでは節約以上にコストがかかりました。install-smoke Dockerビルドでは、32-vCPUのキュー時間コストが節約効果を上回りました                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。forkでは `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。forkでは `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                              |

## ローカルでの対応コマンド

```bash
pnpm changed:lanes   # origin/main...HEAD に対するローカルchanged-lane classifierを確認
pnpm check:changed   # スマートなローカルゲート: 変更内容に応じてboundary lane単位でtypecheck/lint/testsを実行
pnpm check          # 高速ローカルゲート: 本番tsgo + シャード化lint + 並列高速guard
pnpm check:test-types
pnpm check:timed    # 同じゲートをステージごとの所要時間付きで実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitestテスト
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docsのフォーマット + lint + リンク切れチェック
pnpm build          # CIのartifact/build-smokeレーンが関係する場合にdistをビルド
node scripts/ci-run-timings.mjs <run-id>      # 実行時間、キュー時間、最も遅いジョブを要約
node scripts/ci-run-timings.mjs --recent 10   # 最近成功したmain CI実行を比較
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 関連

- [Install overview](/ja-JP/install)
- [Release channels](/ja-JP/install/development-channels)
