---
read_when:
    - ローカルまたはCIでテストを実行すること
    - モデル/providerのバグに対する回帰テストの追加
    - Gateway + エージェントの動作をデバッグすること
summary: 'テストキット: unit/e2e/liveスイート、Docker runner、および各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-04-22T04:23:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7309f596dc0fd8b6dac936be74af1c8b4aa1dccc98e169a6b6934206547a0ca
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClawには3つのVitestスイート（unit/integration、e2e、live）と、少数のDocker runnerがあります。

このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何をカバーするか（そして意図的に何をカバーしないか）
- 一般的なワークフロー（ローカル、push前、デバッグ）でどのコマンドを実行するか
- live testがどのように認証情報を見つけ、モデル/providerを選択するか
- 実世界のモデル/provider問題に対する回帰テストをどう追加するか

## クイックスタート

ほとんどの日は次で十分です。

- 完全なゲート（push前に想定）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- マシンに余裕がある場合の、より高速なローカル全スイート実行: `pnpm test:max`
- 直接のVitest watchループ: `pnpm test:watch`
- 直接のファイル指定は、extension/channelパスもルーティングするようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の障害を反復中なら、まず対象を絞った実行を優先してください。
- DockerベースのQAサイト: `pnpm qa:lab:up`
- Linux VMベースのQAレーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたとき、または追加の確信が欲しいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2Eスイート: `pnpm test:e2e`

実際のprovider/modelをデバッグするとき（実認証情報が必要）:

- Liveスイート（models + gateway tool/image probe）: `pnpm test:live`
- 単一のliveファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimiコストsmoke: `MOONSHOT_API_KEY`を設定したうえで、`openclaw models list --provider moonshot --json`を実行し、その後`moonshot/kimi-k2.6`に対して分離された`openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`を実行します。JSONがMoonshot/K2.6を報告し、assistant transcriptに正規化済みの`usage.cost`が保存されていることを確認してください。

ヒント: 失敗しているケースが1つだけ必要な場合は、以下で説明するallowlist環境変数を使ってlive testを絞り込むことを優先してください。

## QA固有のrunner

これらのコマンドは、QA-labの現実性が必要なときに、主要テストスイートと並んで使用します。

- `pnpm openclaw qa suite`
  - リポジトリベースのQAシナリオをホスト上で直接実行します。
  - デフォルトでは、複数の選択されたシナリオを、分離されたgateway workerで並列実行します。`qa-channel`のデフォルト並列数は4です（選択されたシナリオ数で制限されます）。worker数を調整するには`--concurrency <count>`を使い、従来の直列レーンにするには`--concurrency 1`を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでartifactが欲しい場合は`--allow-failures`を使います。
  - providerモード`live-frontier`、`mock-openai`、`aimock`をサポートします。`aimock`は、シナリオ対応の`mock-openai`レーンを置き換えることなく、実験的なfixtureおよびprotocol mockカバレッジのためにローカルAIMockベースproviderサーバーを起動します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じQAスイートを使い捨てのMultipass Linux VM内で実行します。
  - ホスト上の`qa suite`と同じシナリオ選択動作を維持します。
  - `qa suite`と同じprovider/model選択フラグを再利用します。
  - live実行では、ゲストで実用的なサポート済みQA認証入力を転送します:
    envベースのprovider key、QA live provider config path、存在する場合は`CODEX_HOME`。
  - ゲストがマウントされたworkspace経由で書き戻せるよう、出力ディレクトリはリポジトリルート配下に置く必要があります。
  - 通常のQA report + summaryに加えて、Multipassログを`.artifacts/qa-e2e/...`配下に書き出します。
- `pnpm qa:lab:up`
  - オペレーター型QA作業向けにDockerベースのQAサイトを起動します。
- `pnpm test:docker:bundled-channel-deps`
  - 現在のOpenClawビルドをDocker内でpackしてinstallし、OpenAI設定済みでGatewayを起動した後、設定編集によりTelegramとDiscordを有効化します。
  - 最初のGateway再起動で各bundled channel pluginのruntime依存関係がオンデマンドでインストールされ、2回目の再起動ではすでに有効化済みの依存関係が再インストールされないことを検証します。
  - さらに、既知の古いnpmベースラインをinstallし、`openclaw update --tag <candidate>`実行前にTelegramを有効化し、candidateのpost-update doctorが、harness側のpostinstall repairなしでbundled channel runtime依存関係を修復することを検証します。
- `pnpm openclaw qa aimock`
  - 直接のprotocol smokeテストのために、ローカルAIMock providerサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨てのDockerベースTuwunel homeserverに対して、Matrix live QAレーンを実行します。
  - このQAホストは現時点ではrepo/dev専用です。パッケージ版OpenClaw installには`qa-lab`が含まれないため、`openclaw qa`は公開されません。
  - リポジトリcheckoutでは、bundled runnerを直接読み込みます。別途plugin installは不要です。
  - 一時的なMatrixユーザー3人（`driver`、`sut`、`observer`）と1つのprivate roomを用意し、その後、実際のMatrix pluginをSUT transportとして使うQA gateway childを起動します。
  - デフォルトでは固定された安定版Tuwunelイメージ`ghcr.io/matrix-construct/tuwunel:v1.5.1`を使用します。別のイメージをテストする必要がある場合は`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`で上書きしてください。
  - Matrixは、レーンがローカルで使い捨てユーザーを用意するため、共有credential-sourceフラグを公開しません。
  - Matrix QA report、summary、observed-events artifact、および結合されたstdout/stderr出力ログを`.artifacts/qa-e2e/...`配下に書き出します。
- `pnpm openclaw qa telegram`
  - env内のdriverおよびSUT bot tokenを使って、実際のprivate groupに対してTelegram live QAレーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`が必要です。group idは数値のTelegram chat idである必要があります。
  - 共有プール認証情報には`--credential-source convex`をサポートします。デフォルトではenvモードを使用し、プールされたleaseを使うには`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`を設定してください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでartifactが欲しい場合は`--allow-failures`を使います。
  - 同じprivate group内に2つの異なるbotが必要で、SUT botはTelegram usernameを公開している必要があります。
  - 安定したbot間観測のために、両方のbotで`@BotFather`のBot-to-Bot Communication Modeを有効にし、driver botがgroup bot trafficを観測できるようにしてください。
  - Telegram QA report、summary、およびobserved-messages artifactを`.artifacts/qa-e2e/...`配下に書き出します。

live transportレーンは、新しいtransportが逸脱しないよう、1つの標準コントラクトを共有します。

`qa-channel`は広範な合成QAスイートのままであり、live transportカバレッジmatrixには含まれません。

| レーン | Canary | メンションゲーティング | 許可リストブロック | トップレベル返信 | 再起動後再開 | スレッドフォローアップ | スレッド分離 | リアクション観測 | ヘルプコマンド |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex経由の共有Telegram認証情報（v1）

`openclaw qa telegram`で`--credential-source convex`（または`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、QA labはConvexベースのプールから排他的leaseを取得し、そのレーンの実行中はそのleaseをheartbeatし、終了時にleaseを解放します。

参照用Convexプロジェクトscaffold:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したrole用のsecretを1つ:
  - `maintainer`には`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci`には`OPENCLAW_QA_CONVEX_SECRET_CI`
- credential roleの選択:
  - CLI: `--credential-role maintainer|ci`
  - envデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CIではデフォルト`ci`、それ以外では`maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト`1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト`30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト`90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト`15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト`/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のtrace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`は、ローカル開発専用としてloopbackの`http://` Convex URLを許可します。

通常運用では`OPENCLAW_QA_CONVEX_SITE_URL`は`https://`を使用してください。

メンテナー管理コマンド（pool add/remove/list）には、特に`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`が必要です。

メンテナー向けCLIヘルパー:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトやCIユーティリティで機械可読な出力が必要な場合は`--json`を使用してください。

デフォルトendpointコントラクト（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功: `{ status: "ok" }`（または空の`2xx`）
- `POST /release`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功: `{ status: "ok" }`（または空の`2xx`）
- `POST /admin/add`（maintainer secretのみ）
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove`（maintainer secretのみ）
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブleaseガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer secretのみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram種別のpayload形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`は数値のTelegram chat id文字列である必要があります。
- `admin/add`は`kind: "telegram"`に対してこの形状を検証し、不正なpayloadを拒否します。

### QAにチャンネルを追加する

markdown QAシステムにチャンネルを追加するには、ちょうど2つだけ必要です。

1. そのチャンネル用のtransport adapter
2. そのチャンネルコントラクトを実行するscenario pack

共有`qa-lab`ホストでフローを所有できる場合は、新しいトップレベルQAコマンドrootを追加しないでください。

`qa-lab`は共有ホスト機構を所有します。

- `openclaw qa`コマンドroot
- スイートの起動と終了処理
- worker並列実行
- artifact書き込み
- report生成
- scenario実行
- 古い`qa-channel`シナリオ向けの互換エイリアス

runner pluginはtransportコントラクトを所有します。

- 共有`qa` root配下に`openclaw qa <runner>`をどうマウントするか
- そのtransport向けにgatewayをどう設定するか
- readinessをどう確認するか
- inbound eventをどう注入するか
- outbound messageをどう観測するか
- transcriptと正規化済みtransport stateをどう公開するか
- transportベースのactionをどう実行するか
- transport固有のresetまたはcleanupをどう扱うか

新しいチャンネルの最低採用基準は:

1. 共有の`qa`ルートは引き続き`qa-lab`を所有者にすること。
2. 共有`qa-lab`ホストのシーム上でtransport runnerを実装すること。
3. transport固有の仕組みはrunner pluginまたはchannel harness内に閉じ込めること。
4. 競合するルートコマンドを登録するのではなく、runnerを`openclaw qa <runner>`としてマウントすること。  
   Runner pluginは`openclaw.plugin.json`で`qaRunners`を宣言し、`runtime-api.ts`から対応する`qaRunnerCliRegistrations`配列をexportする必要があります。  
   `runtime-api.ts`は軽量に保ってください。遅延CLIおよびrunner実行は別々のentrypointの背後に置く必要があります。
5. テーマ別の`qa/scenarios/`ディレクトリ配下でmarkdownシナリオを作成または調整すること。
6. 新しいシナリオには汎用scenario helperを使用すること。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続けること。

判断ルールは厳格です。

- 振る舞いを`qa-lab`で一度だけ表現できるなら、`qa-lab`に置いてください。
- 振る舞いが1つのchannel transportに依存するなら、そのrunner pluginまたはplugin harness内に置いてください。
- シナリオが複数のchannelで使える新しい機能を必要とするなら、`suite.ts`にchannel固有の分岐を追加するのではなく、汎用helperを追加してください。
- 振る舞いが1つのtransportにしか意味を持たないなら、そのシナリオはtransport固有のままにし、それをscenario contract内で明示してください。

新しいシナリオ向けの推奨される汎用helper名は次のとおりです。

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

既存シナリオ向けの互換エイリアスも引き続き利用可能です。これには次が含まれます。

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいchannel作業では、汎用helper名を使うべきです。
互換エイリアスは一斉移行を避けるために存在しているのであって、新しいシナリオ作成のモデルではありません。

## テストスイート（どこで何が動くか）

スイートは「現実性が増す順」（そしてflakiness/コストも増す順）として考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 既存のスコープ付きVitest projectに対する10回の逐次shard実行（`vitest.full-*.config.ts`）
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`配下のcore/unitインベントリと、`vitest.unit.config.ts`でカバーされる許可済み`ui` node test
- スコープ:
  - 純粋なunit test
  - プロセス内integration test（gateway auth、routing、tooling、parsing、config）
  - 既知バグに対する決定的な回帰テスト
- 期待値:
  - CIで実行される
  - 実キーは不要
  - 高速かつ安定しているべき
- Projectsに関する注意:
  - 対象指定なしの`pnpm test`は、1つの巨大なネイティブルートprojectプロセスの代わりに、11個のより小さいshard設定（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピークRSSが下がり、auto-reply/extension作業が無関係なスイートを圧迫するのを防ぎます。
  - `pnpm test --watch`は、multi-shardのwatchループが現実的でないため、引き続きネイティブルートの`vitest.config.ts` project graphを使用します。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports`は、明示的なファイル/ディレクトリtargetをまずscoped lane経由でルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`ではルートproject全体の起動コストを払わずに済みます。
  - `pnpm test:changed`は、diffがルーティング可能なsource/testファイルだけに触れている場合、変更されたgitパスを同じscoped laneに展開します。config/setupの編集は引き続き広いroot-project再実行にフォールバックします。
  - `pnpm check:changed`は、狭い作業向けの通常のスマートなローカルゲートです。diffをcore、core tests、extensions、extension tests、apps、docs、release metadata、toolingに分類し、それに対応するtypecheck/lint/test laneを実行します。公開Plugin SDKおよびplugin-contractの変更には、extensionsがそれらのcore contractに依存しているため、extension validationが含まれます。release metadataのみのversion bumpでは、トップレベルversion field以外のpackage変更を拒否するguard付きで、全スイートではなく対象を絞ったversion/config/root-dependencyチェックが実行されます。
  - agents、commands、plugins、auto-reply helper、`plugin-sdk`などの純粋ユーティリティ領域からのimport-lightなunit testは、`test/setup-openclaw-runtime.ts`をスキップする`unit-fast` lane経由でルーティングされます。stateful/runtime-heavyなファイルは引き続き既存laneに残ります。
  - 一部の`plugin-sdk`および`commands` helper sourceファイルも、changed-mode実行をこれらの軽量lane内の明示的な兄弟testへマッピングするため、helper編集でそのディレクトリの重い全スイートを再実行せずに済みます。
  - `auto-reply`には現在3つの専用バケットがあります: トップレベルcore helper、トップレベル`reply.*` integration test、そして`src/auto-reply/reply/**`サブツリーです。これにより、最も重いreply harness作業を、軽いstatus/chunk/token testから切り離しています。
- Embedded runnerに関する注意:
  - メッセージツールの検出入力またはCompactionのruntime contextを変更する場合は、両レベルのカバレッジを維持してください。
  - 純粋なrouting/normalization境界に対して、対象を絞ったhelper回帰テストを追加してください。
  - さらに、embedded runner integrationスイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、scoped idとCompaction動作が実際の`run.ts` / `compact.ts`経路を通って流れ続けることを検証します。helper-only testは、これらのintegration経路の十分な代替にはなりません。
- Poolに関する注意:
  - ベースVitest設定は現在デフォルトで`threads`です。
  - 共有Vitest設定は`isolate: false`も固定し、ルートprojects、e2e、live設定全体で非分離runnerを使用します。
  - ルートUI laneはその`jsdom`セットアップとoptimizerを維持しますが、現在は共有の非分離runner上でも実行されます。
  - 各`pnpm test` shardは、共有Vitest設定から同じ`threads` + `isolate: false`デフォルトを継承します。
  - 共有の`scripts/run-vitest.mjs` launcherは現在、Vitest子Nodeプロセスに対してデフォルトで`--no-maglev`も追加し、大規模なローカル実行時のV8コンパイル負荷を減らします。標準のV8動作と比較する必要がある場合は`OPENCLAW_VITEST_ENABLE_MAGLEV=1`を設定してください。
- 高速ローカル反復に関する注意:
  - `pnpm changed:lanes`は、diffがどのarchitecture laneをトリガーするかを表示します。
  - pre-commit hookは、staged formatting/lintingの後に`pnpm check:changed --staged`を実行するため、public extension-facing contractに触れない限り、core-onlyコミットではextension testコストを払いません。release metadataのみのコミットは、対象を絞ったversion/config/root-dependency laneにとどまります。
  - `pnpm test:changed`は、変更パスがより小さいスイートにきれいに対応する場合、scoped lane経由でルーティングします。
  - `pnpm test:max`と`pnpm test:changed:max`は同じルーティング動作を維持しつつ、worker上限だけを高くします。
  - ローカルworkerの自動スケーリングは現在意図的に保守的で、ホストのload averageがすでに高いときにも抑制するため、複数の同時Vitest実行がデフォルトで与えるダメージを減らします。
  - ベースVitest設定は、test wiring変更時にもchanged-mode再実行が正しく保たれるよう、projects/configファイルを`forceRerunTriggers`としてマークしています。
  - 設定は、サポートされるホストで`OPENCLAW_VITEST_FS_MODULE_CACHE`を有効のままにします。直接のプロファイリング用に明示的なキャッシュ場所を1つ使いたい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`を設定してください。
- Perf-debugに関する注意:
  - `pnpm test:perf:imports`は、Vitestのimport-durationレポートとimport-breakdown出力を有効にします。
  - `pnpm test:perf:imports:changed`は、同じプロファイリングビューを`origin/main`以降に変更されたファイルに限定します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`は、そのコミット済みdiffに対して、ルーティングされた`test:changed`とネイティブルートproject経路を比較し、wall timeとmacOS max RSSを出力します。
- `pnpm test:perf:changed:bench -- --worktree`は、変更されたファイル一覧を`scripts/test-projects.mjs`とルートVitest設定経由でルーティングすることで、現在のdirty treeをベンチマークします。
  - `pnpm test:perf:profile:main`は、Vitest/Vite起動およびtransformオーバーヘッドのためのmain-thread CPUプロファイルを書き出します。
  - `pnpm test:perf:profile:runner`は、unitスイートに対してファイル並列を無効にしたrunner CPU+heapプロファイルを書き出します。

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- Runtimeデフォルト:
  - リポジトリの他の部分と同様に、Vitestの`threads`と`isolate: false`を使用します。
  - 適応的workerを使用します（CI: 最大2、ローカル: デフォルト1）。
  - コンソールI/Oオーバーヘッドを減らすため、デフォルトでsilent modeで実行されます。
- 便利な上書き:
  - worker数を強制するには`OPENCLAW_E2E_WORKERS=<n>`（上限16）
  - 詳細なコンソール出力を再度有効にするには`OPENCLAW_E2E_VERBOSE=1`
- スコープ:
  - マルチインスタンスgatewayのend-to-end動作
  - WebSocket/HTTPサーフェス、node pairing、およびより重いネットワーク処理
- 期待値:
  - CIで実行される（pipelineで有効な場合）
  - 実キーは不要
  - unit testより可動部分が多い（遅くなる場合がある）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- スコープ:
  - Docker経由でホスト上に分離されたOpenShell gatewayを起動する
  - 一時的なローカルDockerfileからsandboxを作成する
  - 実際の`sandbox ssh-config` + SSH exec経由でOpenClawのOpenShell backendを実行する
  - sandbox fs bridgeを通じてremote-canonical filesystem動作を検証する
- 期待値:
  - 明示的に有効にした場合のみ。デフォルトの`pnpm test:e2e`実行には含まれない
  - ローカルの`openshell` CLIと動作するDocker daemonが必要
  - 分離された`HOME` / `XDG_CONFIG_HOME`を使用し、その後test gatewayとsandboxを破棄する
- 便利な上書き:
  - より広いe2eスイートを手動で実行する際にこのtestを有効にするには`OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外のCLIバイナリまたはwrapper scriptを指すには`OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実provider + 実モデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live`により**有効**（`OPENCLAW_LIVE_TEST=1`を設定）
- スコープ:
  - 「このprovider/modelは、実認証情報で_今日_実際に動くか？」
  - provider形式の変更、tool-callingの癖、auth問題、rate limit動作を検出する
- 期待値:
  - 設計上CIで安定しない（実ネットワーク、実providerポリシー、quota、障害）
  - コストがかかる / rate limitを消費する
  - 「すべて」を実行するより、絞り込んだsubsetを実行することを推奨
- Live実行は、足りないAPI keyを取得するために`~/.profile`をsourceします。
- デフォルトでは、live実行は引き続き`HOME`を分離し、config/authマテリアルを一時的なtest homeへコピーするため、unit fixtureが実際の`~/.openclaw`を変更できません。
- live testに意図的に実際のhome directoryを使わせたい場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1`を設定してください。
- `pnpm test:live`は現在、より静かなモードがデフォルトです。`[live] ...`の進捗出力は維持しつつ、追加の`~/.profile`通知を抑制し、gateway bootstrapログ/Bonjour chatterをミュートします。完全な起動ログを再び表示したい場合は`OPENCLAW_LIVE_TEST_QUIET=0`を設定してください。
- API keyローテーション（provider固有）: `*_API_KEYS`をカンマ/セミコロン形式で、または`*_API_KEY_1`、`*_API_KEY_2`で設定してください（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）。またはliveごとの上書きとして`OPENCLAW_LIVE_*_KEY`を使用します。testはrate limit応答時に再試行します。
- 進捗/heartbeat出力:
  - Liveスイートは現在、Vitestのコンソールキャプチャが静かな場合でも長いprovider呼び出しが動作中だと見えるように、進捗行をstderrへ出力します。
  - `vitest.live.config.ts`はVitestのコンソール傍受を無効化するため、provider/gateway進捗行はlive実行中に即座にストリームされます。
  - direct-model heartbeatを調整するには`OPENCLAW_LIVE_HEARTBEAT_MS`
  - gateway/probe heartbeatを調整するには`OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`

## どのスイートを実行すべきか？

この判断表を使ってください:

- ロジック/テストを編集した場合: `pnpm test`を実行してください（大きく変更した場合は`pnpm test:coverage`も）
- gateway networking / WS protocol / pairingに触れた場合: `pnpm test:e2e`も追加してください
- 「botが落ちている」/ provider固有の障害 / tool callingのデバッグ時: 対象を絞った`pnpm test:live`を実行してください

## Live: Androidノード機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済みAndroidノードが現在公開している**すべてのコマンド**を呼び出し、コマンドコントラクトの動作を検証すること。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/起動/ペアリングは行いません）。
  - 選択したAndroidノードに対する、コマンドごとのgateway `node.invoke`検証。
- 必要な事前セットアップ:
  - Androidアプリがすでにgatewayに接続済みかつペアリング済みであること。
  - アプリをフォアグラウンドに維持すること。
  - 成功を期待する機能に対して、権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID`または`OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Androidの完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## Live: モデルsmoke（プロファイルキー）

live testは、障害を切り分けられるように2つのレイヤーに分かれています。

- 「Direct model」は、そのprovider/modelが指定キーでそもそも応答できるかを示します。
- 「Gateway smoke」は、そのモデルに対してgateway+agentパイプライン全体が動作するか（sessions、history、tools、sandbox policyなど）を示します。

### レイヤー1: Direct model completion（gatewayなし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel`を使って、認証情報を持つモデルを選択する
  - モデルごとに小さなcompletionを実行する（必要に応じて対象を絞った回帰テストも）
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
- 実際にこのスイートを実行するには`OPENCLAW_LIVE_MODELS=modern`（または`all`、modernのエイリアス）を設定してください。そうしないと、`pnpm test:live`をgateway smokeに集中させるためにスキップされます
- モデルの選択方法:
  - modern許可リストを実行するには`OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all`はmodern許可リストのエイリアスです
  - または`OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切りの許可リスト）
  - modern/allスイープはデフォルトで厳選された高シグナル上限を使います。modernの完全スイープには`OPENCLAW_LIVE_MAX_MODELS=0`、より小さい上限には正の数を設定してください。
- providerの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りの許可リスト）
- キーの取得元:
  - デフォルト: プロファイルストアとenvフォールバック
  - **プロファイルストアのみ**を強制するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`を設定
- このレイヤーの存在理由:
  - 「provider APIが壊れている / キーが無効」と「gateway agentパイプラインが壊れている」を分離するため
  - 小さく独立した回帰テストを含めるため（例: OpenAI Responses/Codex Responsesのreasoning replay + tool-callフロー）

### レイヤー2: Gateway + dev agent smoke（`@openclaw`が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内gatewayを起動する
  - `agent:dev:*`セッションを作成/patchする（実行ごとにモデル上書き）
  - キーを持つモデルを反復し、次を検証する:
    - 「意味のある」応答（toolsなし）
    - 実際のtool呼び出しが動作する（read probe）
    - 任意の追加tool probe（exec+read probe）
    - OpenAI回帰パス（tool-call-only → follow-up）が引き続き動作する
- probe詳細（障害をすばやく説明できるように）:
  - `read` probe: テストはworkspaceにnonceファイルを書き込み、agentにそれを`read`してnonceをそのまま返すよう求めます。
  - `exec+read` probe: テストはagentに、一時ファイルへnonceを書き込む`exec`を行い、その後それを`read`で読み戻すよう求めます。
  - image probe: テストは生成したPNG（cat + ランダムなコード）を添付し、モデルが`cat <CODE>`を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts`および`src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: modern許可リスト（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`はmodern許可リストのエイリアスです
  - または`OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りの一覧）を設定して絞り込みます
  - modern/allのgatewayスイープはデフォルトで厳選された高シグナル上限を使います。modernの完全スイープには`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`、より小さい上限には正の数を設定してください。
- providerの選択方法（「OpenRouter全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りの許可リスト）
- tool + image probeはこのlive testで常に有効です:
  - `read` probe + `exec+read` probe（toolストレス）
  - モデルが画像入力対応を公開している場合はimage probeを実行
  - フロー（概要）:
    - テストは「CAT」+ ランダムコードを含む小さなPNGを生成します（`src/gateway/live-image-probe.ts`）
    - それを`agent`に`attachments: [{ mimeType: "image/png", content: "<base64>" }]`として送信します
    - Gatewayは添付を`images[]`へ解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agentがマルチモーダルなユーザーメッセージをモデルへ転送します
    - 検証: 応答に`cat` + そのコードが含まれること（OCRの許容: 軽微な誤りは許可）

ヒント: 手元のマシンで何をテストできるか（および正確な`provider/model` id）を確認するには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke（Claude、Codex、Gemini、またはその他のローカルCLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカルCLI backendを使用してGateway + agentパイプラインを検証すること。
- backend固有のsmokeデフォルトは、所有するextensionの`cli-backend.ts`定義内にあります。
- 有効化:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトprovider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image動作は、所有するCLI backend pluginのmetadataから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）
  - プロンプト注入ではなくCLI引数として画像ファイルパスを渡すには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG`設定時に画像引数の渡し方を制御するには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または`"list"`）
  - 2ターン目を送り、resumeフローを検証するには`OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - デフォルトのClaude Sonnet -> Opus同一セッション継続probeを無効にするには`OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択モデルが切り替え先をサポートしているときに強制有効化するには`1`）

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Dockerレシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一providerのDockerレシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注意:

- Docker runnerは`scripts/test-live-cli-backend-docker.sh`にあります。
- これは、リポジトリのDockerイメージ内で、rootではない`node`ユーザーとしてlive CLI-backend smokeを実行します。
- 所有するextensionからCLI smoke metadataを解決し、その後、対応するLinux CLIパッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または`@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にあるキャッシュ済みの書き込み可能prefixへinstallします。
- `pnpm test:docker:live-cli-backend:claude-subscription`では、`~/.claude/.credentials.json`内の`claudeAiOauth.subscriptionType`、または`claude setup-token`による`CLAUDE_CODE_OAUTH_TOKEN`のいずれかを通じた、ポータブルなClaude Code subscription OAuthが必要です。まずDocker内で直接`claude -p`を検証し、その後Anthropic API keyのenv varを保持せずに2回のGateway CLI-backendターンを実行します。このsubscriptionレーンでは、Claudeが現在サードパーティアプリ使用を通常のsubscriptionプラン制限ではなく追加利用課金へルーティングするため、Claude MCP/toolおよびimage probeはデフォルトで無効です。
- live CLI-backend smokeは現在、Claude、Codex、Geminiに対して同じend-to-endフローを実行します: テキストターン、画像分類ターン、その後gateway CLI経由で検証されるMCP `cron` tool call。
- Claudeのデフォルトsmokeは、セッションをSonnetからOpusへpatchし、再開されたセッションが以前のメモを引き続き記憶していることも検証します。

## Live: ACP bind smoke（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACP agentで実際のACP会話バインドフローを検証すること:
  - `/acp spawn <agent> --bind here`を送信する
  - 合成メッセージチャンネル会話をその場でバインドする
  - 同じ会話で通常のフォローアップを送信する
  - そのフォローアップが、バインドされたACPセッショントランスクリプトに到達することを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker内のACP agent: `claude,codex,gemini`
  - 直接`pnpm test:live ...`用のACP agent: `claude`
  - 合成チャンネル: Slack DM風の会話コンテキスト
  - ACP backend: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 注意:
  - このレーンは、外部配信を装うことなく、メッセージチャンネルコンテキストをテストが添付できるよう、admin専用の合成originating-routeフィールド付きでgateway `chat.send`サーフェスを使用します。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`が未設定の場合、テストは選択されたACP harness agentに対して、埋め込み`acpx` pluginの組み込みagent registryを使用します。

例:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Dockerレシピ:

```bash
pnpm test:docker:live-acp-bind
```

単一agentのDockerレシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Dockerに関する注意:

- Docker runnerは`scripts/test-live-acp-bind-docker.sh`にあります。
- デフォルトでは、サポートされるすべてのlive CLI agentに対してACP bind smokeを順番に実行します: `claude`、`codex`、`gemini`。
- matrixを絞るには`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`を使ってください。
- これは`~/.profile`をsourceし、一致するCLI authマテリアルをコンテナ内へステージし、`acpx`を書き込み可能なnpm prefixへinstallし、その後、必要に応じて要求されたlive CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または`@google/gemini-cli`）をinstallします。
- Docker内では、runnerは`OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`を設定し、sourceされたprofileからのprovider env varをacpxが子harness CLIでも利用できるようにします。

## Live: Codex app-server harness smoke

- 目的: 通常のgateway `agent`メソッドを通じて、pluginが所有するCodex harnessを検証すること:
  - バンドル済み`codex` pluginを読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex`を選択する
  - 最初のgateway agentターンを`codex/gpt-5.4`へ送る
  - 2回目のターンを同じOpenClawセッションへ送り、app-server threadが再開できることを検証する
  - 同じgateway commandパス経由で`/codex status`と`/codex models`を実行する
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `codex/gpt-5.4`
- 任意のimage probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意のMCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- このsmokeは`OPENCLAW_AGENT_HARNESS_FALLBACK=none`を設定するため、壊れたCodex harnessがPIへ静かにフォールバックして通過することはできません。
- Auth: シェル/プロフィールからの`OPENAI_API_KEY`、および任意でコピーされる`~/.codex/auth.json`と`~/.codex/config.toml`

ローカルレシピ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Dockerレシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Dockerに関する注意:

- Docker runnerは`scripts/test-live-codex-harness-docker.sh`にあります。
- これは、マウントされた`~/.profile`をsourceし、`OPENAI_API_KEY`を渡し、存在する場合はCodex CLI authファイルをコピーし、`@openai/codex`を書き込み可能なマウント済みnpm prefixへinstallし、source treeをステージしてから、Codex-harness live testのみを実行します。
- DockerはデフォルトでimageおよびMCP/tool probeを有効にします。より狭いデバッグ実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`または`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`を設定してください。
- Dockerも`OPENCLAW_AGENT_HARNESS_FALLBACK=none`をexportし、live test設定に一致させるため、`openai-codex/*`またはPIフォールバックでCodex harness回帰が隠れることはありません。

### 推奨されるliveレシピ

狭く明示的な許可リストが、最も速く、最もflakyになりにくいです。

- 単一モデル、direct（gatewayなし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数providerにわたるtool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google重視（Gemini API key + Antigravity）:
  - Gemini（API key）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意:

- `google/...`はGemini API（API key）を使用します。
- `google-antigravity/...`はAntigravity OAuthブリッジ（Cloud Code Assist風agent endpoint）を使用します。
- `google-gemini-cli/...`はマシン上のローカルGemini CLIを使用します（別個のauth + toolingの癖があります）。
- Gemini APIとGemini CLI:
  - API: OpenClawはGoogleがホストするGemini APIをHTTP経由で呼び出します（API key / profile auth）。ほとんどのユーザーが「Gemini」と言うとき、これを指します。
  - CLI: OpenClawはローカルの`gemini`バイナリをshell実行します。独自のauthを持ち、挙動が異なる場合があります（streaming/tool support/version差異）。

## Live: モデルmatrix（何をカバーするか）

固定の「CI model list」はありません（liveはオプトイン）が、キーを持つ開発マシンで定期的にカバーすることが推奨されるモデルは次のとおりです。

### Modern smokeセット（tool calling + image）

これは、動作し続けることを期待する「一般的なモデル」実行です。

- OpenAI（非Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または`anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview`および`google/gemini-3-flash-preview`（古いGemini 2.xモデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking`および`google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + imageありでgateway smokeを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意のExec）

providerファミリーごとに少なくとも1つ選んでください。

- OpenAI: `openai/gpt-5.4`（または`openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または`anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または`google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あると望ましい）:

- xAI: `xai/grok-4`（または利用可能な最新）
- Mistral: `mistral/`…（有効化している「tools」対応モデルを1つ選択）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。tool callingはAPI modeに依存）

### Vision: image send（attachment → multimodal message）

image probeを実行するために、少なくとも1つの画像対応モデルを`OPENCLAW_LIVE_GATEWAY_MODELS`に含めてください（Claude/Gemini/OpenAIの画像対応バリアントなど）。

### Aggregator / 代替Gateway

キーが有効なら、次を経由したテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル。tool+image対応候補を見つけるには`openclaw models scan`を使用）
- OpenCode: Zen向け`opencode/...`およびGo向け`opencode-go/...`（authは`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

live matrixに含められるその他のprovider（認証情報/設定がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers`経由（カスタムendpoint）: `minimax`（cloud/API）、および任意のOpenAI/Anthropic互換プロキシ（LM Studio、vLLM、LiteLLMなど）

ヒント: ドキュメントに「すべてのモデル」をハードコードしようとしないでください。正規の一覧は、手元のマシンで`discoverModels(...)`が返すものと、利用可能なキー次第です。

## 認証情報（絶対にコミットしない）

live testは、CLIと同じ方法で認証情報を見つけます。実際上の意味:

- CLIが動くなら、live testも同じキーを見つけられるはずです。
- live testが「認証情報なし」と言う場合は、`openclaw models list` / モデル選択をデバッグするときと同じ方法でデバッグしてください。

- エージェントごとのauth profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（live testで「profile keys」と言うときはこれを意味します）
- Config: `~/.openclaw/openclaw.json`（または`OPENCLAW_CONFIG_PATH`）
- legacy stateディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージされたlive homeへコピーされますが、メインのprofile-key storeではありません）
- ローカルlive実行は、アクティブなconfig、エージェントごとの`auth-profiles.json`ファイル、legacy `credentials/`、およびサポートされる外部CLI authディレクトリをデフォルトで一時的なtest homeへコピーします。ステージされたlive homeでは`workspace/`と`sandboxes/`はスキップされ、`agents.*.workspace` / `agentDir`のパス上書きも削除されるため、probeが実際のホストworkspaceに触れません。

envキー（たとえば`~/.profile`でexportされているもの）に依存したい場合は、`source ~/.profile`の後にローカルテストを実行するか、以下のDocker runnerを使ってください（コンテナ内に`~/.profile`をマウントできます）。

## Deepgram live（音声文字起こし）

- テスト: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `src/agents/byteplus.live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - バンドル済みcomfyの画像、動画、`music_generate`経路を実行します
  - `models.providers.comfy.<capability>`が設定されていない場合、各機能をスキップします
  - comfy workflowの送信、ポーリング、ダウンロード、またはplugin登録を変更した後に有用です

## Image generation live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- スコープ:
  - 登録済みのすべての画像生成provider pluginを列挙します
  - probe前にログインシェル（`~/.profile`）から不足しているprovider env varを読み込みます
  - デフォルトでは保存済みauth profileよりlive/env API keyを優先するため、`auth-profiles.json`内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能なauth/profile/modelがないproviderはスキップします
  - 共有runtime capabilityを通じて標準の画像生成バリアントを実行します:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされるバンドル済みprovider:
  - `openai`
  - `google`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 任意のauth動作:
  - profile-store authを強制し、env-only上書きを無視するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- スコープ:
  - 共有のバンドル済み音楽生成provider経路を実行します
  - 現在はGoogleとMiniMaxをカバーしています
  - probe前にログインシェル（`~/.profile`）からprovider env varを読み込みます
  - デフォルトでは保存済みauth profileよりlive/env API keyを優先するため、`auth-profiles.json`内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能なauth/profile/modelがないproviderはスキップします
  - 利用可能な場合、宣言された両方のruntime modeを実行します:
    - プロンプトのみ入力の`generate`
    - providerが`capabilities.edit.enabled`を宣言している場合の`edit`
  - 現在の共有レーンカバレッジ:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: 別のComfy liveファイルであり、この共有スイープではありません
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意のauth動作:
  - profile-store authを強制し、env-only上書きを無視するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- スコープ:
  - 共有のバンドル済み動画生成provider経路を実行します
  - デフォルトではリリース安全なsmoke経路を使用します: FAL以外のprovider、providerごとに1回のtext-to-videoリクエスト、1秒のlobster prompt、そして`OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルト`180000`）によるproviderごとの操作上限
  - provider側キューのレイテンシがリリース時間を支配することがあるため、FALはデフォルトでスキップされます。明示的に実行するには`--video-providers fal`または`OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`を渡してください
  - probe前にログインシェル（`~/.profile`）からprovider env varを読み込みます
  - デフォルトでは保存済みauth profileよりlive/env API keyを優先するため、`auth-profiles.json`内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能なauth/profile/modelがないproviderはスキップします
  - デフォルトでは`generate`のみを実行します
  - 利用可能な場合に宣言済みtransform modeも実行するには`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`を設定してください:
    - providerが`capabilities.imageToVideo.enabled`を宣言し、選択したprovider/modelが共有スイープでbufferベースのローカル画像入力を受け付ける場合の`imageToVideo`
    - providerが`capabilities.videoToVideo.enabled`を宣言し、選択したprovider/modelが共有スイープでbufferベースのローカル動画入力を受け付ける場合の`videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる`imageToVideo` provider:
    - `vydra`。バンドル済み`veo3`はtext-onlyで、バンドル済み`kling`はリモート画像URLを必要とするため
  - provider固有のVydraカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - そのファイルは、`veo3`のtext-to-videoに加えて、デフォルトでリモート画像URL fixtureを使用する`kling`レーンを実行します
  - 現在の`videoToVideo` liveカバレッジ:
    - 選択モデルが`runway/gen4_aleph`の場合のみ`runway`
  - 共有スイープで現在宣言済みだがスキップされる`videoToVideo` provider:
    - `alibaba`、`qwen`、`xai`。これらの経路は現在リモート`http(s)` / MP4参照URLを必要とするため
    - `google`。現在の共有Gemini/Veoレーンはローカルのbufferベース入力を使用しており、その経路は共有スイープでは受け付けられないため
    - `openai`。現在の共有レーンには、org固有のvideo inpaint/remixアクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトスイープでFALを含むすべてのproviderを含めるには`OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なsmoke実行のために各provider操作上限を短くするには`OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意のauth動作:
  - profile-store authを強制し、env-only上書きを無視するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Media live harness

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画liveスイートを、リポジトリネイティブな1つのentrypoint経由で実行します
  - `~/.profile`から不足しているprovider env varを自動で読み込みます
  - デフォルトで、現在使用可能なauthを持つproviderに各スイートを自動で絞り込みます
  - `scripts/test-live.mjs`を再利用するため、heartbeatおよびquiet modeの挙動が一貫します
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker runner（任意の「Linuxで動く」チェック）

これらのDocker runnerは2つのカテゴリに分かれます。

- Live-model runner: `test:docker:live-models`と`test:docker:live-gateway`は、対応するprofile-key liveファイルのみをリポジトリDockerイメージ内で実行します（`src/agents/models.profiles.live.test.ts`と`src/gateway/gateway-models.profiles.live.test.ts`）。ローカルconfigディレクトリとworkspaceをマウントし（マウントされていれば`~/.profile`もsourceします）、対応するローカルentrypointは`test:live:models-profiles`と`test:live:gateway-profiles`です。
- Docker live runnerは、完全なDockerスイープを現実的に保つために、より小さいsmoke上限がデフォルトです:
  `test:docker:live-models`はデフォルトで`OPENCLAW_LIVE_MAX_MODELS=12`、`test:docker:live-gateway`はデフォルトで`OPENCLAW_LIVE_GATEWAY_SMOKE=1`、`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、`OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`です。より大きな完全スキャンを明示的に望む場合は、これらのenv varを上書きしてください。
- `test:docker:all`は、まず`test:docker:live-build`でlive Dockerイメージを一度buildし、その後そのイメージを2つのlive Dockerレーンで再利用します。
- Container smoke runner: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:plugins`は、1つ以上の実コンテナを起動し、より高レベルのintegration経路を検証します。

live-model Docker runnerはまた、必要なCLI auth homeだけをbind mountし（実行が絞り込まれていない場合はサポートされるすべて）、実行前にそれらをコンテナhomeへコピーします。これにより、外部CLI OAuthがホストauth storeを変更せずにトークン更新できます。

- Direct models: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI backend smoke: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なscaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gateway networking（2つのコンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（seed済みGateway + stdio bridge + 生のClaude notification-frame smoke）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Plugins（install smoke + `/plugin` alias + Claude-bundle restart semantics）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）

live-model Docker runnerはまた、現在のcheckoutを読み取り専用でbind mountし、コンテナ内の一時workdirへステージします。これにより、runtimeイメージをスリムに保ちつつ、正確なローカルsource/configに対してVitestを実行できます。
ステージ処理では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、およびアプリローカルの`.build`やGradle出力ディレクトリなど、大きなローカル専用cacheやapp build出力をスキップするため、Docker live実行がマシン固有artifactのコピーに何分も費やすことがありません。
また、コンテナ内で実際のTelegram/Discordなどのchannel workerをgateway live probeが起動しないよう、`OPENCLAW_SKIP_CHANNELS=1`も設定します。
`test:docker:live-models`は依然として`pnpm test:live`を実行するため、そのDockerレーンからgateway liveカバレッジを絞り込む、または除外する必要がある場合は、`OPENCLAW_LIVE_GATEWAY_*`も渡してください。
`test:docker:openwebui`はより高レベルの互換性smokeです。OpenAI互換HTTP endpointを有効にしたOpenClaw gatewayコンテナを起動し、そのgatewayに対して固定版Open WebUIコンテナを起動し、Open WebUI経由でサインインし、`/api/models`が`openclaw/default`を公開していることを確認した後、Open WebUIの`/api/chat/completions`プロキシ経由で実際のchatリクエストを送信します。
初回実行は、DockerがOpen WebUIイメージをpullする必要があることや、Open WebUI自身のコールドスタートセットアップ完了が必要なことから、かなり遅くなる場合があります。
このレーンは使用可能なlive model keyを前提とし、Docker実行では`OPENCLAW_PROFILE_FILE`（デフォルトは`~/.profile`）がそれを提供する主要手段です。
成功時の実行では、`{ "ok": true, "model": "openclaw/default", ... }`のような小さなJSON payloadが出力されます。
`test:docker:mcp-channels`は意図的に決定的で、実際のTelegram、Discord、iMessageアカウントを必要としません。seed済みGatewayコンテナを起動し、`openclaw mcp serve`を起動する2つ目のコンテナを起動した後、ルーティングされた会話検出、transcript読み取り、attachment metadata、live event queue動作、outbound send routing、および実際のstdio MCP bridge上でのClaude形式のchannel + permission通知を検証します。通知チェックは生のstdio MCPフレームを直接検査するため、そのsmokeは特定クライアントSDKがたまたま表面化するものだけでなく、bridgeが実際に出力するものを検証します。

手動のACP平文thread smoke（CIではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に保持してください。ACP thread routing検証で再び必要になる可能性があるため、削除しないでください。

便利なenv var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）を`/home/node/.openclaw`へマウント
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）を`/home/node/.openclaw/workspace`へマウント
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）を`/home/node/.profile`へマウントし、テスト実行前にsource
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`で、`OPENCLAW_PROFILE_FILE`からsourceされたenv varのみを検証し、一時的なconfig/workspaceディレクトリを使い、外部CLI auth mountを使わない
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）を、Docker内のCLI installキャッシュ用に`/home/node/.npm-global`へマウント
- `$HOME`配下の外部CLI authディレクトリ/ファイルは`/host-auth...`配下へ読み取り専用でマウントされ、その後テスト開始前に`/home/node/...`へコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - providerを絞った実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`から推測された必要なディレクトリ/ファイルのみをマウント
  - 手動上書きは`OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または`OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`のようなカンマ区切り一覧で可能
- 実行を絞り込むには`OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内providerフィルターには`OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- rebuild不要の再実行では既存の`openclaw:local-live`イメージを再利用するには`OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報がprofile store由来であることを保証するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smokeでgatewayが公開するモデルを選ぶには`OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smokeで使うnonceチェックプロンプトを上書きするには`OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定版Open WebUIイメージタグを上書きするには`OPENWEBUI_IMAGE=...`

## Docs sanity

ドキュメント編集後はdocsチェックを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全なMintlifyアンカー検証を実行してください: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI安全）

これらは、実providerなしでの「実パイプライン」回帰です。

- Gateway tool calling（mock OpenAI、実gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: 「runs a mock OpenAI tool call end-to-end via gateway agent loop」）
- Gatewayウィザード（WS `wizard.start`/`wizard.next`、config + auth enforcedの書き込み）: `src/gateway/gateway.test.ts`（ケース: 「runs wizard over ws and writes auth token config」）

## エージェント信頼性evals（Skills）

CI安全で、「エージェント信頼性eval」のように振る舞うテストがすでにいくつかあります。

- 実gateway + agent loopを通るmock tool-calling（`src/gateway/gateway.test.ts`）。
- セッション配線とconfig効果を検証するend-to-endウィザードフロー（`src/gateway/gateway.test.ts`）。

Skillsについてまだ不足しているもの（[Skills](/ja-JP/tools/skills)を参照）:

- **Decisioning:** prompt内にSkillsが列挙されているとき、エージェントは適切なSkillを選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に`SKILL.md`を読み、必要な手順/引数に従うか？
- **Workflow contracts:** ツール順序、セッション履歴の引き継ぎ、sandbox境界を検証するマルチターンシナリオ。

将来のevalは、まず決定的であることを維持してください。

- mock providerを使い、ツール呼び出し + 順序、skillファイル読み取り、セッション配線を検証するscenario runner。
- Skillに焦点を当てた小さなシナリオスイート（使う/避ける、ゲーティング、prompt injection）。
- CI安全なスイートが整ってからの、任意のlive eval（オプトイン、envゲート付き）のみ。

## コントラクトテスト（pluginとchannelの形状）

コントラクトテストは、登録されたすべてのpluginとchannelが、それぞれのインターフェースコントラクトに準拠していることを検証します。検出されたすべてのpluginを走査し、形状および動作に関する一連の検証を実行します。デフォルトの`pnpm test` unitレーンでは、これらの共有シームおよびsmokeファイルは意図的にスキップされるため、共有channelまたはproviderサーフェスに触れた場合は、コントラクトコマンドを明示的に実行してください。

### コマンド

- すべてのコントラクト: `pnpm test:contracts`
- channelコントラクトのみ: `pnpm test:contracts:channels`
- providerコントラクトのみ: `pnpm test:contracts:plugins`

### Channelコントラクト

`src/channels/plugins/contracts/*.contract.test.ts`にあります:

- **plugin** - 基本的なplugin形状（id、name、capabilities）
- **setup** - セットアップウィザードのコントラクト
- **session-binding** - セッションバインディングの動作
- **outbound-payload** - メッセージpayload構造
- **inbound** - 受信メッセージ処理
- **actions** - channel action handler
- **threading** - thread ID処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシーの強制

### Provider statusコントラクト

`src/plugins/contracts/*.contract.test.ts`にあります。

- **status** - channel status probe
- **registry** - plugin registry形状

### Providerコントラクト

`src/plugins/contracts/*.contract.test.ts`にあります:

- **auth** - authフローコントラクト
- **auth-choice** - auth choice/selection
- **catalog** - モデルカタログAPI
- **discovery** - plugin discovery
- **loader** - plugin loading
- **runtime** - provider runtime
- **shape** - plugin形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdkのexportまたはsubpathを変更した後
- channelまたはprovider pluginを追加または変更した後
- plugin登録またはdiscoveryをリファクタリングした後

コントラクトテストはCIで実行され、実際のAPI keyは不要です。

## 回帰テスト追加の指針

liveで見つかったprovider/modelの問題を修正した場合:

- 可能であればCI安全な回帰テストを追加してください（mock/stub provider、または正確なrequest-shape変換をキャプチャ）
- 本質的にlive専用の場合（rate limit、authポリシー）は、live testを狭く保ち、env varでのオプトインにしてください
- バグを検出できる最小レイヤーを狙うことを優先してください:
  - providerのrequest変換/replayバグ → direct models test
  - gatewayのsession/history/toolパイプラインバグ → gateway live smokeまたはCI安全なgateway mock test
- SecretRefトラバーサルのガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`は、registry metadata（`listSecretTargetRegistryEntries()`）からSecretRefクラスごとに1つのサンプル対象を導出し、トラバーサルセグメント付きexec idが拒否されることを検証します。
  - `src/secrets/target-registry-data.ts`に新しい`includeInPlan` SecretRef target familyを追加する場合は、そのテスト内の`classifyTargetClass`を更新してください。このテストは、未分類のtarget idに対して意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。
