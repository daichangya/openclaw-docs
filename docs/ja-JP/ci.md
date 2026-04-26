---
read_when:
    - CIジョブが実行された理由、または実行されなかった理由を把握する必要があります
    - 失敗しているGitHub Actionsチェックをデバッグしています
summary: CIジョブグラフ、スコープゲート、ローカルコマンドの対応関係
title: CIパイプライン
x-i18n:
    generated_at: "2026-04-26T11:24:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

CIは `main` へのすべてのpushとすべてのpull requestで実行されます。スマートスコープを使って、変更が無関係な領域だけの場合は高コストなジョブをスキップします。

QA Labには、メインのスマートスコープWorkflowとは別に専用のCIレーンがあります。`Parity gate` Workflowは、該当するPR変更と手動ディスパッチで実行され、非公開のQAランタイムをビルドして、モックのGPT-5.5およびOpus 4.6 agentic packを比較します。`QA-Lab - All Lanes` Workflowは、`main` 上で毎晩および手動ディスパッチで実行され、モックparity gate、ライブMatrixレーン、ライブTelegramレーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` environment を使用し、TelegramレーンはConvexリースを使用します。`OpenClaw Release Checks` も、リリース承認前に同じQA Labレーンを実行します。

`Duplicate PRs After Merge` Workflowは、マージ後の重複クリーンアップ用のメンテナー向け手動Workflowです。デフォルトではdry-runになっており、`apply=true` のときだけ明示的に列挙されたPRを閉じます。GitHubを変更する前に、landed PRがマージ済みであること、および各重複PRに共有の参照issueまたは変更hunkの重なりがあることを確認します。

`Docs Agent` Workflowは、最近マージされた変更に既存のdocsを合わせ続けるためのイベント駆動型Codexメンテナンスレーンです。純粋なschedule実行はありません。`main` 上でbot以外によるpush CIが成功するとトリガーされることがあり、手動ディスパッチでも直接実行できます。workflow-run起動は、`main` がすでに先に進んでいる場合、またはスキップされていない別のDocs Agent実行が直近1時間以内に作成されている場合はスキップされます。実行されると、前回のスキップされていないDocs AgentソースSHAから現在の `main` までのcommit範囲をレビューするため、1時間ごとの1回の実行で前回のdocsパス以降に蓄積したすべてのmain変更をカバーできます。

`Test Performance Agent` Workflowは、遅いテスト向けのイベント駆動型Codexメンテナンスレーンです。これも純粋なschedule実行はありません。`main` 上でbot以外によるpush CIが成功するとトリガーされますが、そのUTC日ですでに別のworkflow-run起動が実行済みまたは実行中ならスキップされます。手動ディスパッチはこの日次アクティビティゲートをバイパスします。このレーンは、フルスイートのグループ化されたVitest性能レポートを生成し、Codexには広範なリファクタではなく、カバレッジを維持する小さなテスト性能修正だけを行わせ、その後フルスイートレポートを再実行して、通過するベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codexは明らかな失敗のみ修正でき、エージェント後のフルスイートレポートは何かをcommitする前に成功していなければなりません。bot pushが着地する前に `main` が進んだ場合、このレーンは検証済みパッチをrebaseし、`pnpm check:changed` を再実行してpushを再試行します。競合する古いパッチはスキップされます。これはGitHub-hosted Ubuntuを使うため、Codex actionはdocs agentと同じdrop-sudo安全方針を維持できます。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ジョブ概要

| Job                              | 目的                                                                                         | 実行されるタイミング                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | docs-only変更、変更スコープ、変更extensionsを検出し、CI manifestを構築                      | draftでないpushとPRで常に実行        |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とWorkflow監査                                                     | draftでないpushとPRで常に実行        |
| `security-dependency-audit`      | npm advisoryに対する、依存関係をインストールしない本番lockfile監査                           | draftでないpushとPRで常に実行        |
| `security-fast`                  | 高速セキュリティジョブ用の必須aggregate                                                      | draftでないpushとPRで常に実行        |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みartifactチェック、および再利用可能な下流artifactをビルド      | Node関連変更時                       |
| `checks-fast-core`               | bundled/plugin-contract/protocolチェックなどの高速Linux正当性レーン                          | Node関連変更時                       |
| `checks-fast-contracts-channels` | 安定したaggregateチェック結果を持つ、分割されたchannel contractチェック                      | Node関連変更時                       |
| `checks-node-extensions`         | extensionスイート全体にわたる、bundled-pluginテストの完全分割実行                           | Node関連変更時                       |
| `checks-node-core-test`          | channel、bundled、contract、extensionレーンを除く、Nodeコアテストの分割実行                 | Node関連変更時                       |
| `extension-fast`                 | 変更されたbundled pluginのみを対象にした集中的テスト                                        | extension変更を含むpull request      |
| `check`                          | 分割されたメインのローカルゲート相当: 本番型、lint、guard、テスト型、strict smoke           | Node関連変更時                       |
| `check-additional`               | architecture、boundary、extension-surface guard、package-boundary、gateway-watchの分割実行   | Node関連変更時                       |
| `build-smoke`                    | ビルド済みCLIのsmokeテストと起動時メモリsmoke                                               | Node関連変更時                       |
| `checks`                         | ビルド済みartifactのchannelテストに加え、push時のみのNode 22互換性を検証                    | Node関連変更時                       |
| `check-docs`                     | docsのフォーマット、lint、リンク切れチェック                                                  | docs変更時                           |
| `skills-python`                  | PythonバックのSkills向けRuff + pytest                                                        | Python Skills関連変更時              |
| `checks-windows`                 | Windows固有のテストレーン                                                                     | Windows関連変更時                    |
| `macos-node`                     | 共有ビルドartifactを使うmacOS TypeScriptテストレーン                                        | macOS関連変更時                      |
| `macos-swift`                    | macOSアプリ向けSwift lint、build、tests                                                      | macOS関連変更時                      |
| `android`                        | 両flavorのAndroid unit testsと1つのdebug APK build                                           | Android関連変更時                    |
| `test-performance-agent`         | 信頼できるアクティビティ後の日次Codex遅延テスト最適化                                       | main CI成功時または手動ディスパッチ  |

## Fail-fastの順序

ジョブは、安価なチェックが高コストなジョブより先に失敗するように順序付けされています。

1. `preflight` が、そもそもどのレーンを存在させるかを決定します。`docs-scope` と `changed-scope` のロジックは独立したジョブではなく、このジョブ内のstepです。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いartifactやplatform matrixジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速Linuxレーンと並行して実行されるため、共有buildの準備ができ次第、下流consumerが開始できます。
4. その後、より重いplatformおよびruntimeレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、PR専用の `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のunit testでカバーされています。
CI workflowの編集では、Node CIグラフとworkflow lintingは検証されますが、それだけでWindows、Android、macOSのネイティブbuildを強制することはありません。これらのplatformレーンは引き続きplatformソース変更にだけスコープされます。
CIのルーティング専用編集、一部の安価なcore-test fixture編集、および限定的なplugin contract helper/test-routing編集では、高速なNode専用manifestパスが使われます: preflight、security、および単一の `checks-fast-core` タスクです。このパスでは、変更ファイルがその高速タスクが直接検証するルーティングまたはhelperサーフェスに限定される場合、build artifacts、Node 22互換性、channel contracts、完全なcore shard、bundled-plugin shard、追加guard matrixを回避します。
Windows Nodeチェックは、Windows固有のprocess/path wrapper、npm/pnpm/UI runner helper、package manager設定、およびそのレーンを実行するCI workflowサーフェスにスコープされます。無関係なソース、plugin、install-smoke、テスト専用変更はLinux Nodeレーンに残るため、通常のtest shardですでにカバーされている範囲のために16-vCPUのWindows workerを確保しません。
別個の `install-smoke` workflowは、独自の `preflight` jobを通じて同じscope scriptを再利用します。これはsmokeカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。pull requestでは、Docker/packageサーフェス、bundled pluginのpackage/manifest変更、およびDocker smoke jobが検証するcore plugin/channel/gateway/Plugin SDKサーフェスに対して高速パスを実行します。ソース専用のbundled plugin変更、テスト専用編集、docs専用編集ではDocker workerを確保しません。高速パスでは、ルートDockerfileイメージを1回ビルドし、CLIを確認し、agents delete shared-workspace CLI smokeを実行し、container gateway-network e2eを実行し、bundled extension build argを検証し、集約240秒のコマンドタイムアウトの下で、各シナリオのDocker runを個別に上限設定したbounded bundled-plugin Docker profileを実行します。完全パスでは、夜間schedule実行、手動ディスパッチ、workflow-callによるrelease checks、および本当にinstaller/package/Dockerサーフェスに触れるpull requestに対して、QR package installとinstaller Docker/updateカバレッジを維持します。merge commitを含む `main` pushでは完全パスを強制しません。changed-scopeロジックがpushで完全カバレッジを要求する場合でも、workflowは高速Docker smokeを維持し、完全install smokeは夜間実行またはrelease検証に任せます。低速なBun global install image-provider smokeは `run_bun_global_install_smoke` によって別途ゲートされます。これは夜間scheduleとrelease checks workflowから実行され、手動の `install-smoke` ディスパッチではオプトインできますが、pull requestと `main` pushでは実行されません。QRとinstaller Docker testは、それぞれ独自のinstall重視Dockerfileを維持します。ローカルの `test:docker:all` は、共有live-testイメージ1つと共有 `scripts/e2e/Dockerfile` built-appイメージ1つを事前ビルドし、その後、重み付きschedulerと `OPENCLAW_SKIP_DOCKER_BUILD=1` を使ってlive/E2E smokeレーンを実行します。デフォルトのmain-pool slot数10は `OPENCLAW_DOCKER_ALL_PARALLELISM` で、provider依存のtail-pool slot数10は `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` で調整します。重いレーン上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` となっており、npm installやマルチサービスレーンがDockerを過剰消費しないようにしつつ、軽いレーンは利用可能なslotを埋められます。レーン開始はローカルDockerデーモンのcreate stormを避けるため、デフォルトで2秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` または別のミリ秒値で上書きできます。ローカル集約実行は、Dockerを事前確認し、古いOpenClaw E2Eコンテナーを削除し、アクティブレーン状態を出力し、最長優先順序付けのためにレーン時間を保存し、scheduler確認用に `OPENCLAW_DOCKER_ALL_DRY_RUN=1` をサポートします。デフォルトでは最初の失敗後に新しいpooledレーンのスケジュールを停止し、各レーンには `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書き可能な120分のフォールバックタイムアウトがあります。選択されたlive/tailレーンではより厳しいレーン別上限を使います。再利用可能なlive/E2E workflowは、Docker matrixの前に1つのSHAタグ付きGHCR Docker E2Eイメージをbuildおよびpushし、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でmatrixを実行することで、この共有イメージパターンを反映しています。scheduleされたlive/E2E workflowは、完全なrelease-path Dockerスイートを毎日実行します。bundled update matrixはupdate targetごとに分割されるため、繰り返しのnpm updateとdoctor repairパスを他のbundledチェックと並列分割できます。

ローカルのchanged-laneロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルゲートは、広いCI platform scopeよりもarchitecture boundaryに対して厳格です。core production変更ではcore prod typecheckとcore testを実行し、core test専用変更ではcore test typecheck/testsのみを実行し、extension production変更ではextension prod typecheckとextension testを実行し、extension test専用変更ではextension test typecheck/testsのみを実行します。公開Plugin SDKまたはplugin-contract変更は、それらのcore contractにextensionsが依存するため、extension検証まで拡張されます。release metadata専用のversion bumpでは、対象を絞ったversion/config/root-dependencyチェックを実行します。不明なroot/config変更は安全側に倒して全レーンになります。

pushでは、`checks` matrixにpush専用の `compat-node22` レーンが追加されます。pull requestではこのレーンはスキップされ、matrixは通常のtest/channelレーンに集中します。

最も遅いNode testファミリーは、runnerを過剰確保せずに各jobを小さく保つために分割またはバランス調整されています。channel contractsは重み付き3 shardとして実行され、bundled plugin testsは6つのextension workerに分散され、小さなcore unitレーンはペア化され、auto-replyは4つのバランス済みworkerとして実行され、replyサブツリーはagent-runner、dispatch、commands/state-routing shardに分割され、agentic gateway/plugin configはbuilt artifactsを待つのではなく既存のソース専用agentic Node job全体に分散されます。広範なbrowser、QA、media、および雑多なplugin testは、共有plugin catch-allではなく専用のVitest configを使います。extension shard jobは、一度に最大2つのplugin config groupを実行し、各groupに1つのVitest workerとより大きいNode heapを割り当てることで、import負荷の高いplugin batchが追加のCI jobを生まないようにします。広いagentsレーンは、単一の遅いtest fileに支配されるのではなくimport/scheduling支配型であるため、共有Vitest file-parallel schedulerを使います。`runtime-config` はinfra core-runtime shardと一緒に実行され、共有runtime shardがtailを抱え込まないようにします。include-pattern shardはCI shard名を使って時間エントリーを記録するため、`.artifacts/vitest-shard-timings.json` はconfig全体とfilter済みshardを区別できます。`check-additional` はpackage-boundary compile/canary作業をまとめて維持し、runtime topology architectureをgateway watchカバレッジから分離します。boundary guard shardは小さな独立guardを1つのjob内で並行実行します。gateway watch、channel test、およびcore support-boundary shardは、`dist/` と `dist-runtime/` がすでにbuildされた後、`build-artifacts` 内で並行実行されます。これにより、古いcheck名を軽量なverifier jobとして維持しつつ、追加のBlacksmith worker2台と2つ目のartifact-consumer queueを避けます。
Android CIは `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後Play debug APKをbuildします。third-party flavorには別個のsource setやmanifestはありませんが、そのunit-testレーンではSMS/call-log BuildConfigフラグ付きでそのflavorをコンパイルしつつ、Android関連pushごとにdebug APK packaging jobを重複実行することは避けます。
`extension-fast` はPR専用です。push実行ではすでに完全なbundled plugin shardが実行されるためです。これにより、レビュー時のchanged-pluginフィードバックを維持しつつ、`checks-node-extensions` にすでに存在するカバレッジのために `main` で追加のBlacksmith workerを確保しません。

同じPRまたは `main` refに対して新しいpushが届くと、GitHubは置き換えられたjobを `cancelled` とマークすることがあります。同じrefの最新実行も失敗していない限り、これはCIノイズとして扱ってください。集約shardチェックは `!cancelled() && always()` を使うため、通常のshard失敗は引き続き報告しますが、workflow全体がすでに置き換えられた後にqueueされることはありません。
CI concurrency keyはバージョン付き（`CI-v7-*`）なので、古いqueue groupにいるGitHub側のzombieが新しいmain実行を無期限にブロックすることはありません。

## ランナー

| ランナー                         | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティjobとaggregate（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速protocol/contract/bundledチェック、分割されたchannel contractチェック、lintを除く `check` shard、`check-additional` のshardとaggregate、Node test aggregate verifier、docsチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflightもGitHub-hosted Ubuntuを使うため、Blacksmith matrixをより早くqueueできます |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node test shard、bundled plugin test shard、`android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`。これは依然としてCPU感度が高く、8 vCPUでは節約できる以上にコストがかかりました。install-smoke Docker buildでは、32-vCPUのqueue時間のほうが節約効果より大きくなりました                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。forkでは `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。forkでは `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                 |

## ローカルでの対応コマンド

```bash
pnpm changed:lanes   # origin/main...HEAD に対するローカルchanged-lane classifierを確認
pnpm check:changed   # スマートなローカルゲート: boundaryレーンごとの変更typecheck/lint/tests
pnpm check          # 高速ローカルゲート: production tsgo + 分割lint + 並列高速guard
pnpm check:test-types
pnpm check:timed    # 各ステージの計測付きで同じゲートを実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitestテスト
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docsのformat + lint + broken links
pnpm build          # CIのartifact/build-smokeレーンが関係する場合にdistをbuild
pnpm ci:timings                               # 直近の origin/main push CI実行を要約
pnpm ci:timings:recent                        # 最近成功したmain CI実行を比較
node scripts/ci-run-timings.mjs <run-id>      # wall time、queue time、最も遅いjobを要約
node scripts/ci-run-timings.mjs --latest-main # issue/commentノイズを無視して origin/main push CIを選択
node scripts/ci-run-timings.mjs --recent 10   # 最近成功したmain CI実行を比較
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 関連

- [Install overview](/ja-JP/install)
- [Release channels](/ja-JP/install/development-channels)
