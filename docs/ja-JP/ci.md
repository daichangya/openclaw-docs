---
read_when:
    - CIジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗しているGitHub Actionsチェックをデバッグしている
summary: CIジョブグラフ、スコープゲート、およびローカルコマンドの対応関係
title: CIパイプライン
x-i18n:
    generated_at: "2026-04-24T08:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

CIは`main`へのすべてのプッシュとすべてのプルリクエストで実行されます。スマートスコープを使用して、変更が無関係な領域のみに限られる場合は高コストなジョブをスキップします。

QA Labには、メインのスマートスコープワークフローの外側に専用のCIレーンがあります。
`Parity gate`ワークフローは、該当するPR変更と手動ディスパッチで実行されます。これは非公開のQAランタイムをビルドし、モックのGPT-5.4およびOpus 4.6のagentic packを比較します。`QA-Lab - All Lanes`ワークフローは、`main`で毎晩実行され、手動ディスパッチでも実行できます。これはモックのparity gate、ライブのMatrixレーン、ライブのTelegramレーンを並列ジョブとしてファンアウトします。ライブジョブは`qa-live-shared`
environmentを使用し、TelegramレーンはConvex leasesを使用します。`OpenClaw Release
Checks`も、リリース承認前に同じQA Labレーンを実行します。

`Duplicate PRs After Merge`ワークフローは、マージ後の重複クリーンアップのためのメンテナー向け手動ワークフローです。デフォルトではdry-runで動作し、`apply=true`の場合にのみ明示的に指定されたPRを閉じます。GitHubを変更する前に、マージ済みPRが実際にマージされていること、および各重複PRに共有された参照issueまたは重複する変更hunkのいずれかがあることを検証します。

`Docs Agent`ワークフローは、最近マージされた変更に既存ドキュメントを揃え続けるためのイベント駆動のCodexメンテナンスレーンです。純粋なスケジュール実行はありません。`main`上でボット以外によるpush CI runが成功すると、それをトリガーできます。また、手動ディスパッチでも直接実行できます。workflow-runによる呼び出しは、`main`がすでに先へ進んでいる場合、またはスキップされていない別のDocs Agent runが過去1時間以内に作成されている場合にスキップされます。実行されると、前回のスキップされていないDocs Agentのsource SHAから現在の`main`までのコミット範囲をレビューするため、1時間ごとの1回の実行で、前回のdocs pass以降に蓄積された`main`のすべての変更をカバーできます。

`Test Performance Agent`ワークフローは、低速なテストのためのイベント駆動のCodexメンテナンスレーンです。これにも純粋なスケジュール実行はありません。`main`上でボット以外によるpush CI runが成功するとトリガーできますが、そのUTC日内に別のworkflow-run呼び出しがすでに実行済みまたは実行中であればスキップされます。手動ディスパッチは、この日次アクティビティゲートをバイパスします。このレーンは、Vitestフルスイートのグループ化されたパフォーマンスレポートをビルドし、Codexが大規模なリファクタリングではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行えるようにし、その後フルスイートレポートを再実行して、通過ベースラインのテスト数を減らす変更を拒否します。ベースラインに失敗しているテストがある場合、Codexは明らかな失敗のみを修正でき、その後のagent後フルスイートレポートは、何かがコミットされる前に成功していなければなりません。ボットのpushが反映される前に`main`が進んだ場合、このレーンは検証済みパッチをrebaseし、`pnpm check:changed`を再実行してpushを再試行します。競合する古いパッチはスキップされます。GitHubホストのUbuntuを使用するため、Codex
actionはdocs agentと同じdrop-sudo安全性の姿勢を維持できます。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ジョブ概要

| ジョブ                             | 目的                                                                                         | 実行されるタイミング                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | docs-only変更、変更されたスコープ、変更されたextensionsを検出し、CI manifestを構築する      | draftではないすべてのpushとPR        |
| `security-scm-fast`              | `zizmor`による秘密鍵検出とworkflow監査                                                       | draftではないすべてのpushとPR        |
| `security-dependency-audit`      | npm advisoriesに対する依存関係不要のproduction lockfile監査                                  | draftではないすべてのpushとPR        |
| `security-fast`                  | 高速なセキュリティジョブ用の必須aggregate                                                    | draftではないすべてのpushとPR        |
| `build-artifacts`                | `dist/`、Control UI、ビルド成果物チェック、および再利用可能な下流artifactsをビルドする      | Node関連の変更                       |
| `checks-fast-core`               | bundled/plugin-contract/protocolチェックなどの高速Linux正当性レーン                          | Node関連の変更                       |
| `checks-fast-contracts-channels` | 安定したaggregate check結果を持つ、shard化されたchannel contractチェック                     | Node関連の変更                       |
| `checks-node-extensions`         | extension suite全体にわたるbundled-pluginのフルテストshard                                  | Node関連の変更                       |
| `checks-node-core-test`          | channel、bundled、contract、extensionレーンを除く、コアNodeテストshard                       | Node関連の変更                       |
| `extension-fast`                 | 変更されたbundled pluginsのみを対象としたfocused tests                                       | extension変更を含むプルリクエスト    |
| `check`                          | shard化されたメインのローカルゲート相当: prod types、lint、guards、test types、strict smoke  | Node関連の変更                       |
| `check-additional`               | architecture、boundary、extension-surface guards、package-boundary、gateway-watch shards     | Node関連の変更                       |
| `build-smoke`                    | ビルド済みCLIのsmoke testsとstartup-memory smoke                                             | Node関連の変更                       |
| `checks`                         | ビルド済みartifactのchannel testsと、push専用のNode 22互換性のverifier                       | Node関連の変更                       |
| `check-docs`                     | docs formatting、lint、broken-linkチェック                                                    | docsが変更された場合                 |
| `skills-python`                  | PythonバックエンドのSkills向けRuff + pytest                                                  | Python-skill関連の変更               |
| `checks-windows`                 | Windows固有のテストレーン                                                                     | Windows関連の変更                    |
| `macos-node`                     | 共有ビルド成果物を使用するmacOS TypeScriptテストレーン                                       | macOS関連の変更                      |
| `macos-swift`                    | macOSアプリ向けSwift lint、build、tests                                                      | macOS関連の変更                      |
| `android`                        | 両flavor向けAndroid unit testsと、1つのdebug APKビルド                                       | Android関連の変更                    |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次Codex低速テスト最適化                                          | Main CI成功時または手動ディスパッチ  |

## Fail-Fast順序

ジョブは、高コストなジョブが実行される前に低コストなチェックが失敗するように並べられています。

1. `preflight`が、どのレーンをそもそも存在させるかを決定します。`docs-scope`と`changed-scope`のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python`は、より重いartifactおよびplatform matrixジョブを待たずにすばやく失敗します。
3. `build-artifacts`は高速Linuxレーンと並行して実行されるため、共有ビルドの準備ができ次第、下流consumerが開始できます。
4. その後、より重いplatformおよびruntimeレーンがファンアウトします: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、PR専用の`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは`scripts/ci-changed-scope.mjs`にあり、`src/scripts/ci-changed-scope.test.ts`のunit testsでカバーされています。
CIワークフローの編集では、Node CI graphとworkflow lintingを検証しますが、それだけでWindows、Android、またはmacOSのネイティブビルドを強制することはありません。これらのplatformレーンは、引き続きplatformソース変更にスコープされます。
Windows Nodeチェックは、Windows固有のprocess/path wrappers、npm/pnpm/UI runner helpers、package manager config、およびそのレーンを実行するCI workflow surfaceにスコープされます。無関係なソース、plugin、install-smoke、およびtest-only変更はLinux Nodeレーンに留まり、通常のテストshardですでにカバーされている内容のために16-vCPUのWindows workerを確保しません。
別個の`install-smoke`ワークフローは、独自の`preflight`ジョブを通じて同じscope scriptを再利用します。これはsmoke coverageを`run_fast_install_smoke`と`run_full_install_smoke`に分割します。プルリクエストでは、Docker/package surface、bundled pluginのpackage/manifest変更、およびDocker smokeジョブが対象とするcore plugin/channel/gateway/Plugin SDK surfaceに対してfast pathを実行します。ソースのみのbundled plugin変更、test-only編集、docs-only編集ではDocker workerを確保しません。fast pathでは、ルートDockerfileイメージを1回ビルドし、CLIをチェックし、container gateway-network e2eを実行し、bundled extension build argを検証し、120秒のコマンドタイムアウトのもとで制限付きbundled-plugin Docker profileを実行します。full pathでは、夜間スケジュール実行、手動ディスパッチ、workflow-call release checks、およびinstaller/package/Docker surfaceに本当に触れているプルリクエスト向けに、QR package installおよびinstaller Docker/update coverageを維持します。merge commitを含む`main`へのpushではfull pathは強制されません。changed-scopeロジックがpushでfull coverageを要求する場合でも、このワークフローはfast Docker smokeを維持し、full install smokeは夜間またはリリース検証に委ねます。低速なBun global install image-provider smokeは、`run_bun_global_install_smoke`によって別途ゲートされます。これは夜間スケジュール時およびrelease checksワークフローから実行され、手動の`install-smoke`ディスパッチでは有効化できますが、プルリクエストと`main`へのpushでは実行されません。QRおよびinstaller Docker testsは、独自のinstall-focused Dockerfileを維持します。ローカルの`test:docker:all`は、共有のlive-testイメージ1つと共有の`scripts/e2e/Dockerfile` built-appイメージ1つを事前ビルドし、その後`OPENCLAW_SKIP_DOCKER_BUILD=1`を指定してlive/E2E smokeレーンを並列実行します。デフォルトのmain-pool並列数8は`OPENCLAW_DOCKER_ALL_PARALLELISM`で、provider-sensitive tail-pool並列数8は`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`で調整できます。レーン開始は、ローカルDocker daemonでのcreate stormを避けるため、デフォルトで2秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0`または別のミリ秒値で上書きできます。ローカルaggregateはデフォルトで最初の失敗後に新しいpooledレーンのスケジューリングを停止し、各レーンには`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`で上書き可能な120分のタイムアウトがあります。再利用可能なlive/E2Eワークフローは、Docker matrixの前に1つのSHAタグ付きGHCR Docker E2Eイメージをビルドしてpushし、その後`OPENCLAW_SKIP_DOCKER_BUILD=1`を指定してmatrixを実行することで、このshared-imageパターンを反映しています。スケジュールされたlive/E2Eワークフローは、完全なrelease-path Docker suiteを毎日実行します。完全なbundled update/channel matrixは、実際のnpm updateとdoctor repairを繰り返し実行するため、引き続き手動/full-suiteのままです。

ローカルのchanged-laneロジックは`scripts/changed-lanes.mjs`にあり、`scripts/check-changed.mjs`によって実行されます。このローカルゲートは、広範なCI platform scopeよりもarchitecture boundaryに対して厳格です。core production変更ではcore prod typecheckとcore testsを実行し、core test-only変更ではcore test typecheck/testsのみを実行し、extension production変更ではextension prod typecheckとextension testsを実行し、extension test-only変更ではextension test typecheck/testsのみを実行します。公開Plugin SDKまたはplugin-contract変更は、extensionsがそれらのcore contractsに依存するため、extension validationまで拡張されます。リリースメタデータのみのバージョン更新では、対象を絞ったversion/config/root-dependencyチェックを実行します。不明なroot/config変更は、安全側に倒してすべてのレーンにフォールバックします。

pushでは、`checks` matrixにpush専用の`compat-node22`レーンが追加されます。プルリクエストでは、このレーンはスキップされ、matrixは通常のtest/channelレーンに集中したままになります。

最も遅いNodeテスト群は、各ジョブを小さく保ちつつrunnerを過剰に確保しないように分割またはバランス調整されています。channel contractは重み付きの3 shardとして実行され、bundled pluginテストは6つのextension workerに分散され、小規模なcore unitレーンはペア化され、auto-replyは6つの小さなworkerではなく3つのバランスされたworkerとして実行され、agentic gateway/plugin configはbuilt artifactsを待つのではなく、既存のsource-only agentic Nodeジョブ全体に分散されます。広範なbrowser、QA、media、および雑多なpluginテストは、共有plugin catch-allではなく専用のVitest configを使用します。extension shardジョブは、plugin config groupを1つのVitest workerとより大きなNode heapで直列実行するため、import負荷の高いplugin batchが小規模なCI runnerを過剰投入しません。広範なagentsレーンは、単一の遅いテストファイルに支配されるのではなくimport/スケジューリングが支配的であるため、共有のVitest file-parallel schedulerを使用します。`runtime-config`は、共有runtime shardが末尾を抱え込まないように、infra core-runtime shardとともに実行されます。`check-additional`は、package-boundary compile/canary作業をまとめて維持し、runtime topology architectureをgateway watch coverageから分離します。boundary guard shardは、その小さく独立したguardを1つのジョブ内で並行実行します。Gateway watch、channel tests、およびcore support-boundary shardは、`dist/`と`dist-runtime/`がすでにビルドされた後に`build-artifacts`内で並行実行され、2つの追加のBlacksmith workerと2つ目のartifact-consumer queueを避けつつ、従来のcheck名を軽量なverifierジョブとして維持します。
Android CIは`testPlayDebugUnitTest`と`testThirdPartyDebugUnitTest`の両方を実行し、その後Play debug APKをビルドします。third-party flavorには別個のsource setやmanifestはありませんが、そのunit-testレーンでは引き続きSMS/call-log BuildConfigフラグ付きでそのflavorをコンパイルしつつ、Android関連のすべてのpushでdebug APK packagingジョブが重複して走ることを避けます。
`extension-fast`がPR専用なのは、push runではすでに完全なbundled plugin shardが実行されるためです。これにより、レビュー向けのchanged-pluginフィードバックは維持しつつ、`checks-node-extensions`ですでに存在するカバレッジのために`main`上で追加のBlacksmith workerを確保せずに済みます。

GitHubは、同じPRまたは`main` refに新しいpushが届いたとき、置き換えられたジョブを`cancelled`としてマークすることがあります。同じrefに対する最新runも失敗している場合を除き、これはCIノイズとして扱ってください。aggregate shard checkは`!cancelled() && always()`を使用するため、通常のshard failureは引き続き報告されますが、ワークフロー全体がすでに置き換えられた後にキュー投入されることはありません。
CI concurrency keyはバージョン付き（`CI-v7-*`）であるため、古いqueue groupにあるGitHub側のzombieが新しいmain runを無期限にブロックすることはありません。

## Runner

| Runner                           | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブとaggregate（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速protocol/contract/bundled checks、shard化されたchannel contract checks、lintを除く`check` shard、`check-additional` shardとaggregate、Node test aggregate verifier、docs checks、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflightもGitHubホストのUbuntuを使用するため、Blacksmith matrixをより早くキュー投入できます |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node test shard、bundled plugin test shard、`android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`。これは依然としてCPU感度が高く、8 vCPUでは節約できた以上にコストがかかりました。install-smoke Docker buildsも同様で、32-vCPUのqueue時間は節約できた以上にコストがかかりました                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw`上の`macos-node`。forkでは`macos-latest`にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw`上の`macos-swift`。forkでは`macos-latest`にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                      |

## ローカルでの対応コマンド

```bash
pnpm changed:lanes   # origin/main...HEADに対するローカルchanged-lane classifierを確認
pnpm check:changed   # スマートなローカルゲート: boundary laneごとの変更typecheck/lint/tests
pnpm check          # 高速なローカルゲート: production tsgo + shard化されたlint + 並列高速guard
pnpm check:test-types
pnpm check:timed    # 各ステージの所要時間付きで同じゲートを実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # CIのartifact/build-smokeレーンが重要な場合にdistをビルド
node scripts/ci-run-timings.mjs <run-id>      # wall time、queue time、最も遅いジョブを要約
node scripts/ci-run-timings.mjs --recent 10   # 最近成功したmain CI runを比較
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 関連

- [インストール概要](/ja-JP/install)
- [リリースチャネル](/ja-JP/install/development-channels)
