---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対するリグレッションテストを追加する
    - Gateway + agent の挙動をデバッグする
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-04-20T04:46:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88457038e2e2c7940d0348762d0ece187111a8c61fa9bad54b39eade4217ddbc
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、小規模な Docker ランナー群があります。

このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何をカバーするか（そして意図的に _カバーしない_ ものは何か）
- 一般的なワークフロー（ローカル、push 前、デバッグ）でどのコマンドを実行するか
- live テストがどのように認証情報を見つけ、モデル/プロバイダーを選択するか
- 実運用で発生したモデル/プロバイダーの問題に対するリグレッションを追加する方法

## クイックスタート

多くの日では:

- フルゲート（push 前に想定）: `pnpm build && pnpm check && pnpm test`
- 余裕のあるマシンでの高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は extension/channel のパスにも対応するようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復的に修正しているときは、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたときや、より高い確信が欲しいときは:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（models + Gateway の tool/image プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

ヒント: 必要なのが 1 つの失敗ケースだけなら、以下で説明する allowlist 環境変数を使って live テストを絞り込むことを優先してください。

## QA 専用ランナー

これらのコマンドは、QA-lab に近い現実性が必要なときに、メインのテストスイートに並んで使います。

- `pnpm openclaw qa suite`
  - リポジトリベースの QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された Gateway ワーカーを使って複数の選択シナリオを並列実行します。`qa-channel` のデフォルト同時実行数は 4 です（選択したシナリオ数により上限あり）。ワーカー数を調整するには `--concurrency <count>` を使用し、従来の直列レーンにするには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物だけ欲しい場合は `--allow-failures` を使ってください。
  - プロバイダーモードとして `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、シナリオ認識型の `mock-openai` レーンを置き換えることなく、実験的なフィクスチャおよびプロトコルモックのカバレッジのために、ローカルの AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的なサポート対象 QA 認証入力を転送します:
    環境変数ベースのプロバイダーキー、QA live provider config パス、存在する場合の `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるよう、リポジトリルート配下に置く必要があります。
  - 通常の QA レポート + サマリーに加え、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業向けに、Docker ベースの QA サイトを起動します。
- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカルの AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - Matrix live QA レーンを、使い捨ての Docker ベース Tuwunel homeserver に対して実行します。
  - この QA ホストは現時点では repo/dev 専用です。パッケージ化された OpenClaw インストールには `qa-lab` が同梱されないため、`openclaw qa` は公開されません。
  - リポジトリチェックアウトでは、バンドルされたランナーを直接読み込みます。別個の Plugin インストール手順は不要です。
  - 3 つの一時 Matrix ユーザー（`driver`、`sut`、`observer`）と 1 つのプライベートルームをプロビジョニングし、その後、実際の Matrix Plugin を SUT トランスポートとして使う QA Gateway 子プロセスを起動します。
  - デフォルトでは、固定された安定版 Tuwunel イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。別のイメージをテストする必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrix は使い捨てユーザーをローカルでプロビジョニングするため、共有 credential-source フラグは公開しません。
  - Matrix QA レポート、サマリー、observed-events 成果物、および結合された stdout/stderr 出力ログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm openclaw qa telegram`
  - env の driver および SUT bot token を使い、実際のプライベートグループに対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group id は数値の Telegram chat id である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使い、プール済みリースを使いたい場合は `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物だけ欲しい場合は `--allow-failures` を使ってください。
  - 同じプライベートグループ内に 2 つの別々の bot が必要であり、SUT bot は Telegram username を公開している必要があります。
  - 安定した bot 間観測のために、両方の bot について `@BotFather` で Bot-to-Bot Communication Mode を有効にし、driver bot がグループ内 bot トラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、および observed-messages 成果物を `.artifacts/qa-e2e/...` 配下に書き出します。

live トランスポートレーンは 1 つの標準契約を共有しているため、新しいトランスポートで挙動がずれることはありません。

`qa-channel` は引き続き広範な合成 QA スイートであり、live
トランスポートカバレッジ行列の一部ではありません。

| レーン | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| ------ | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex を使った共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、QA lab は Convex ベースのプールから排他的リースを取得し、レーンの実行中はそのリースに Heartbeat を送り、終了時にリースを解放します。

参照用 Convex プロジェクトひな形:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- credential ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数のデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` を設定すると、ローカル専用開発向けに loopback の `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使う必要があります。

管理者用コマンド（プール add/remove/list）では、必ず
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

管理者向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトや CI ユーティリティで機械可読出力が必要な場合は `--json` を使用してください。

デフォルトのエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功: `{ status: "ok" }`（または空の `2xx`）
- `POST /release`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功: `{ status: "ok" }`（または空の `2xx`）
- `POST /admin/add`（maintainer シークレット専用）
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove`（maintainer シークレット専用）
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブリースガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer シークレット専用）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind の payload 形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正な payload を拒否します。

### QA への channel 追加

Markdown QA システムに channel を追加するには、必要なのは正確に 2 つだけです。

1. その channel 用のトランスポートアダプター。
2. channel 契約を検証するシナリオパック。

共有 `qa-lab` ホストがフローを管理できる場合、新しいトップレベル QA コマンドルートは追加しないでください。

`qa-lab` は共有ホストメカニクスを管理します:

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカー並列性
- 成果物の書き出し
- レポート生成
- シナリオ実行
- 旧 `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin はトランスポート契約を管理します:

- `openclaw qa <runner>` が共有 `qa` ルートの配下にどのようにマウントされるか
- そのトランスポート向けに Gateway がどのように設定されるか
- readiness がどのように確認されるか
- inbound event がどのように注入されるか
- outbound message がどのように観測されるか
- transcript と正規化済みトランスポート状態がどのように公開されるか
- トランスポートベースのアクションがどのように実行されるか
- トランスポート固有の reset または cleanup がどのように処理されるか

新しい channel に必要な最低採用基準は次のとおりです。

1. 共有 `qa` ルートの管理者は `qa-lab` のままにする。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装する。
3. トランスポート固有のメカニクスは、そのランナー Plugin または channel harness の中に閉じ込める。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントする。
   ランナー Plugin は `openclaw.plugin.json` に `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列を export する必要があります。
   `runtime-api.ts` は軽量に保ってください。遅延 CLI およびランナー実行は別の entrypoint の背後に置くべきです。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用シナリオヘルパーを使う。
7. リポジトリで意図的な移行を行っている場合を除き、既存の互換エイリアスを動作したままにする。

判断ルールは厳格です。

- 挙動を `qa-lab` に 1 回だけ表現できるなら、`qa-lab` に置いてください。
- 挙動が 1 つの channel トランスポートに依存するなら、そのランナー Plugin または Plugin harness に留めてください。
- シナリオに複数の channel で使える新しい capability が必要な場合は、`suite.ts` に channel 固有の分岐を追加する代わりに、汎用ヘルパーを追加してください。
- 挙動が 1 つのトランスポートにしか意味を持たない場合は、そのシナリオをトランスポート固有のものとして維持し、そのことをシナリオ契約で明示してください。

新しいシナリオに推奨される汎用ヘルパー名は次のとおりです。

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

既存シナリオ向けの互換エイリアスは引き続き利用可能です。これには次が含まれます:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しい channel の作業では、汎用ヘルパー名を使用する必要があります。
互換エイリアスは、一斉移行を避けるために存在しているのであって、
新しいシナリオ作成のモデルではありません。

## テストスイート（どこで何が実行されるか）

スイートは「現実性が増していくもの」（それに伴い flaky さ/コストも増えるもの）として捉えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 既存のスコープ済み Vitest project に対する 10 個の順次 shard 実行（`vitest.full-*.config.ts`）
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit インベントリ、および `vitest.unit.config.ts` でカバーされる許可済みの `ui` node テスト
- 範囲:
  - 純粋な unit テスト
  - プロセス内 integration テスト（Gateway auth、routing、tooling、parsing、config）
  - 既知のバグに対する決定的なリグレッション
- 期待値:
  - CI で実行される
  - 実際のキーは不要
  - 高速かつ安定しているべき
- Project に関する補足:
  - 対象未指定の `pnpm test` は、1 つの巨大なネイティブルート project プロセスではなく、11 個の小さな shard 設定（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピーク RSS を抑え、auto-reply/extension の処理が無関係なスイートを圧迫するのを防ぎます。
  - `pnpm test --watch` は、複数 shard の watch ループが実用的ではないため、引き続きネイティブルートの `vitest.config.ts` project graph を使用します。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリ指定をまずスコープ済みレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` のような実行では、完全なルート project 起動コストを支払わずに済みます。
  - `pnpm test:changed` は、差分がルーティング可能な source/test ファイルのみに触れている場合、変更された git パスを同じスコープ済みレーンに展開します。config/setup の編集は、引き続き広いルート project の再実行にフォールバックします。
  - agents、commands、plugins、auto-reply helper、`plugin-sdk`、および同様の純粋な utility 領域からの import の軽い unit テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンにルーティングされます。stateful/runtime-heavy なファイルは既存のレーンに残ります。
  - 選択された `plugin-sdk` と `commands` の helper source ファイルも、changed モードの実行をこれらの軽量レーン内の明示的な兄弟テストにマップするため、helper の編集でそのディレクトリ全体の重いスイートを再実行せずに済みます。
  - `auto-reply` には、トップレベル core helper、トップレベル `reply.*` integration テスト、そして `src/auto-reply/reply/**` サブツリーという 3 つの専用バケットが追加されました。これにより、最も重い reply harness の処理が、軽量な status/chunk/token テストに乗らないようにしています。
- Embedded runner に関する補足:
  - message-tool の discovery input や compaction の runtime context を変更するときは、
    両方のレベルのカバレッジを維持してください。
  - 純粋な routing/normalization 境界については、焦点を絞った helper リグレッションを追加してください。
  - また、embedded runner の integration スイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、scoped id と compaction の挙動が実際の `run.ts` / `compact.ts` パスを通って引き続き流れることを検証します。helper のみのテストは、これらの integration パスの十分な代替にはなりません。
- Pool に関する補足:
  - ベースの Vitest 設定は現在デフォルトで `threads` を使用します。
  - 共有 Vitest 設定では、`isolate: false` も固定され、ルート projects、e2e、live 設定全体で非分離ランナーを使用します。
  - ルート UI レーンは `jsdom` の setup と optimizer を維持しつつ、共有の非分離ランナーでも実行されるようになりました。
  - 各 `pnpm test` shard は、共有 Vitest 設定から同じ `threads` + `isolate: false` のデフォルトを継承します。
  - 共有の `scripts/run-vitest.mjs` launcher は、大きなローカル実行中の V8 コンパイル churn を減らすため、Vitest 子 Node プロセスにデフォルトで `--no-maglev` も追加するようになりました。標準の V8 挙動と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- 高速なローカル反復に関する補足:
  - `pnpm test:changed` は、変更パスがより小さなスイートにきれいにマップされる場合、スコープ済みレーンを経由します。
  - `pnpm test:max` と `pnpm test:changed:max` も同じルーティング挙動を維持しつつ、worker 上限だけを高くしています。
  - ローカル worker の自動スケーリングは現在意図的に保守的で、ホストの load average がすでに高い場合にも抑制されるため、複数の同時 Vitest 実行がデフォルトで与える悪影響が小さくなっています。
  - ベース Vitest 設定では、changed モードの再実行がテスト配線変更時にも正しくなるよう、projects/config ファイルを `forceRerunTriggers` としてマークしています。
  - この設定では、サポート対象ホスト上で `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接 profiling のために明示的なキャッシュ場所を 1 つ指定したい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf-debug に関する補足:
  - `pnpm test:perf:imports` は、Vitest の import 所要時間レポートと import 内訳出力を有効にします。
  - `pnpm test:perf:imports:changed` は、同じ profiling 表示を `origin/main` 以降で変更されたファイルに限定します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み差分に対して、ルーティングされた `test:changed` とネイティブルート project パスを比較し、wall time と macOS の最大 RSS を出力します。
- `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を `scripts/test-projects.mjs` とルート Vitest 設定に通すことで、現在の dirty tree をベンチマークします。
  - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドに対するメインスレッド CPU profile を書き出します。
  - `pnpm test:perf:profile:runner` は、unit スイートに対してファイル並列を無効化した runner CPU+heap profile を書き出します。

### E2E（Gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- runtime のデフォルト:
  - リポジトリの他の部分と同様に、Vitest `threads` と `isolate: false` を使用します。
  - 適応型 worker を使用します（CI: 最大 2、ローカル: デフォルト 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトで silent モードで実行されます。
- 便利な上書き:
  - worker 数を強制する `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細なコンソール出力を再有効化する `OPENCLAW_E2E_VERBOSE=1`。
- 範囲:
  - 複数インスタンス Gateway の end-to-end 挙動
  - WebSocket/HTTP surface、node pairing、およびより重いネットワーキング
- 期待値:
  - CI で実行される（パイプラインで有効な場合）
  - 実際のキーは不要
  - unit テストより可動部分が多い（遅くなる場合がある）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- 範囲:
  - Docker 経由でホスト上に分離された OpenShell Gateway を起動する
  - 一時的なローカル Dockerfile から sandbox を作成する
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを実行する
  - sandbox fs bridge を通じて remote-canonical filesystem の挙動を検証する
- 期待値:
  - オプトイン専用であり、デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker daemon が必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway と sandbox を破棄する
- 便利な上書き:
  - 広い e2e スイートを手動実行するときにこのテストを有効化する `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたは wrapper script を指す `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- 範囲:
  - 「このプロバイダー/モデルは _今日_、実際の認証情報で本当に動くか？」
  - プロバイダーの形式変更、tool-calling の癖、auth 問題、rate limit 挙動を検出する
- 期待値:
  - 設計上、CI 安定ではない（実際のネットワーク、実際のプロバイダーポリシー、quota、outage）
  - コストがかかる / rate limit を消費する
  - 「すべて」ではなく絞り込んだサブセットの実行を優先する
- Live 実行では、不足している API キーを取得するために `~/.profile` を読み込みます。
- デフォルトでは、live 実行は引き続き `HOME` を分離し、config/auth の素材を一時的な test home にコピーするため、unit fixture が実際の `~/.openclaw` を変更できません。
- live テストに意図的に実際の home directory を使わせる必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしています。`[live] ...` の進行出力は維持しつつ、追加の `~/.profile` 通知を抑制し、Gateway bootstrap ログ/Bonjour の雑音をミュートします。完全な起動ログを再表示したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション（プロバイダー別）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、live 専用上書きとして `OPENCLAW_LIVE_*_KEY` を使用します。テストは rate limit 応答時に再試行します。
- 進行状況/Heartbeat 出力:
  - Live スイートは現在、長時間のプロバイダー呼び出しが、Vitest のコンソールキャプチャが静かな場合でも可視状態であるよう、進行行を stderr に出力します。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にしているため、プロバイダー/Gateway の進行行は live 実行中に即時ストリームされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

次の判断表を使ってください。

- ロジック/テストを編集している: `pnpm test` を実行（大きく変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーキング / WS protocol / pairing に触れる: `pnpm test:e2e` も追加
- 「bot が落ちている」/ プロバイダー固有の失敗 / tool calling をデバッグしている: 絞り込んだ `pnpm test:live` を実行

## Live: Android node capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済み Android node が現在公開している **すべてのコマンド** を呼び出し、コマンド契約の挙動を検証すること。
- 範囲:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/実行/pairing は行いません）。
  - 選択した Android node に対するコマンドごとの Gateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Android アプリがすでに Gateway に接続済みかつ paired 済みであること。
  - アプリをフォアグラウンドに維持すること。
  - 成功を期待する capability に対して、権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android アプリ](/ja-JP/platforms/android)

## Live: model smoke（profile keys）

Live テストは、失敗を切り分けられるよう 2 層に分かれています。

- 「直接モデル」は、そのキーでプロバイダー/モデルが少なくとも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルに対して Gateway+agent パイプライン全体（session、history、tools、sandbox policy など）が動作するかを示します。

### 第 1 層: 直接モデル completion（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って、認証情報を持っているモデルを選択する
  - モデルごとに小さな completion を実行する（必要に応じて対象を絞ったリグレッションも）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`、`modern` のエイリアス）を設定してください。そうしない場合、`pnpm test:live` を Gateway スモークに集中させるため、このスイートは skip されます。
- モデルの選択方法:
  - モダン allowlist を実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` はモダン allowlist のエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
  - modern/all スイープはデフォルトで、厳選された高シグナルの上限を使用します。網羅的な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0` を設定し、より小さい上限にしたい場合は正の数を設定してください。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - デフォルト: profile store と env fallback
  - **profile store** のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「provider API が壊れている / キーが無効」と「Gateway agent パイプラインが壊れている」を分離する
  - 小さく独立したリグレッションを収容する（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### 第 2 層: Gateway + dev agent スモーク（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内 Gateway を起動する
  - `agent:dev:*` session を作成/patch する（実行ごとに model override）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」応答（tools なし）
    - 実際の tool 呼び出しが動作する（read probe）
    - 任意の追加 tool probe（exec+read probe）
    - OpenAI のリグレッション経路（tool-call-only → follow-up）が引き続き動作する
- Probe の詳細（失敗をすばやく説明できるように）:
  - `read` probe: テストはワークスペースに nonce ファイルを書き込み、agent にそれを `read` して nonce をそのまま返すよう要求します。
  - `exec+read` probe: テストは agent に、一時ファイルへ `exec` で nonce を書き込み、その後それを `read` で読み戻すよう要求します。
  - image probe: テストは生成した PNG（cat + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: モダン allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はモダン allowlist のエイリアスです
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定して絞り込む
  - modern/all の Gateway スイープはデフォルトで、厳選された高シグナルの上限を使用します。網羅的な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定し、より小さい上限にしたい場合は正の数を設定してください。
- プロバイダーの選択方法（「OpenRouter ですべて」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- tool + image probe はこの live テストで常に有効です:
  - `read` probe + `exec+read` probe（tool ストレス）
  - image probe は、モデルが image input support を公開している場合に実行されます
  - フロー（高レベル）:
    - テストは「CAT」+ ランダムコードを含む小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - それを `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gateway は添付を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agent は multimodal なユーザーメッセージをモデルへ転送します
    - 検証: 返信に `cat` + そのコードが含まれること（OCR 許容: 軽微な誤りは許可）

ヒント: 手元のマシンで何がテストできるか（および正確な `provider/model` id）を確認するには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI バックエンドスモーク（Claude、Codex、Gemini、または他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト config に触れずに、ローカル CLI バックエンドを使って Gateway + agent パイプラインを検証する。
- バックエンド固有のスモークデフォルトは、所有 extension の `cli-backend.ts` 定義内にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトの provider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image の挙動は、所有 CLI バックエンド Plugin メタデータに由来します。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の image 添付を送信するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。
  - プロンプト注入の代わりに image ファイルパスを CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されているときに image 引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 回目のターンを送って resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - デフォルトの Claude Sonnet -> Opus 同一 session 継続性 probe を無効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択したモデルが switch target をサポートしている場合に強制的に有効にするには `1` を設定）。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダー Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注意:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これは、live CLI-backend スモークをリポジトリ Docker イメージ内で非 root の `node` ユーザーとして実行します。
- 所有 extension から CLI スモークメタデータを解決し、一致する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にあるキャッシュ可能で書き込み可能な prefix にインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` は、`~/.claude/.credentials.json` と `claudeAiOauth.subscriptionType` の組み合わせ、または `claude setup-token` の `CLAUDE_CODE_OAUTH_TOKEN` のいずれかによる、ポータブルな Claude Code subscription OAuth を必要とします。まず Docker 内で直接 `claude -p` を検証し、その後 Anthropic API-key env vars を保持せずに 2 回の Gateway CLI-backend ターンを実行します。この subscription レーンでは、Claude が現在、通常の subscription plan 制限ではなく追加使用量課金を通じてサードパーティアプリ利用をルーティングするため、Claude MCP/tool および image probe はデフォルトで無効化されます。
- live CLI-backend スモークは現在、Claude、Codex、Gemini に対して同じ end-to-end フローを実行します: テキストターン、画像分類ターン、その後 Gateway CLI 経由で検証される MCP `cron` tool call。
- Claude のデフォルトスモークでは、session を Sonnet から Opus に patch し、再開した session が以前のメモを引き続き記憶していることも検証します。

## Live: ACP bind スモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACP agent に対する実際の ACP conversation-bind フローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成された message-channel conversation をその場で bind する
  - 同じ conversation 上で通常の follow-up を送信する
  - follow-up が bind された ACP session transcript に届くことを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP agent: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP agent: `claude`
  - 合成 channel: Slack DM 形式の conversation context
  - ACP バックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 注意:
  - このレーンは、テストが外部配信を装わずに message-channel context を添付できるよう、admin 専用の synthetic originating-route field を使って Gateway `chat.send` surface を使用します。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP harness agent に対して、組み込み `acpx` Plugin の内蔵 agent registry を使用します。

例:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-acp-bind
```

単一 agent Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker に関する注意:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされるすべての live CLI agent に対して順番に ACP bind スモークを実行します: `claude`、`codex`、その後 `gemini`。
- 行列を絞り込むには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使用してください。
- これは `~/.profile` を読み込み、一致する CLI auth 素材をコンテナにステージし、`acpx` を書き込み可能な npm prefix にインストールし、その後必要であれば要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）をインストールします。
- Docker 内では、`acpx` が読み込まれた profile の provider env vars を子 harness CLI で引き続き利用できるよう、ランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定します。

## Live: Codex app-server harness スモーク

- 目的: Plugin 所有の Codex harness を通常の Gateway
  `agent` メソッド経由で検証する:
  - バンドルされた `codex` Plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - `codex/gpt-5.4` に最初の Gateway agent ターンを送信する
  - 同じ OpenClaw session に 2 回目のターンを送信し、app-server
    thread が resume できることを検証する
  - 同じ Gateway command
    path を通して `/codex status` と `/codex models` を実行する
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `codex/gpt-5.4`
- 任意の image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- このスモークは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  harness が PI へ暗黙にフォールバックして通過することはできません。
- Auth: シェル/profile の `OPENAI_API_KEY`、および任意でコピーされた
  `~/.codex/auth.json` と `~/.codex/config.toml`

ローカルレシピ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker レシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker に関する注意:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- これはマウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在する場合は Codex CLI
  認証ファイルをコピーし、`@openai/codex` を書き込み可能なマウント済み npm
  prefix にインストールし、ソースツリーをステージしてから、Codex-harness live テストのみを実行します。
- Docker では image probe と MCP/tool probe がデフォルトで有効です。より狭いデバッグ実行が必要な場合は
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` を設定してください。
- Docker は `OPENCLAW_AGENT_HARNESS_FALLBACK=none` も export します。これは live
  テスト設定と一致しており、`openai-codex/*` や PI へのフォールバックが Codex harness
  のリグレッションを隠すことができないようにします。

### 推奨される live レシピ

狭く明示的な allowlist が、最も高速で flaky さも最小です。

- 単一モデル、直接実行（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがる tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google に集中する場合（Gemini API key + Antigravity）:
  - Gemini（API key）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意:

- `google/...` は Gemini API（API key）を使います。
- `google-antigravity/...` は Antigravity OAuth bridge（Cloud Code Assist 形式の agent endpoint）を使います。
- `google-gemini-cli/...` は手元のマシン上のローカル Gemini CLI を使います（認証も tooling の癖も別です）。
- Gemini API と Gemini CLI の違い:
  - API: OpenClaw が Google のホストされた Gemini API を HTTP 経由で呼び出します（API key / profile auth）。これは多くのユーザーが「Gemini」と言うときに意味しているものです。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル実行します。独自の認証を持ち、挙動も異なる場合があります（streaming/tool support/version skew）。

## Live: model matrix（何をカバーするか）

固定の「CI model list」はありません（live はオプトインです）が、開発マシン上でキーがある場合に、定期的にカバーすることを **推奨** するモデルは次のとおりです。

### Modern スモークセット（tool calling + image）

これは、動作し続けることを期待する「一般的なモデル」実行です。

- OpenAI（非 Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避けてください）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image を使った Gateway スモークの実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意の Exec）

少なくとも各プロバイダーファミリーごとに 1 つは選んでください。

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あるとよいもの）:

- xAI: `xai/grok-4`（または利用可能な最新）
- Mistral: `mistral/`…（有効化している「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル。tool calling は API mode に依存）

### Vision: 画像送信（attachment → multimodal message）

image probe を実行するには、少なくとも 1 つ、画像対応モデルを `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください（Claude/Gemini/OpenAI の vision 対応バリアントなど）。

### Aggregator / 代替 Gateway

キーが有効であれば、次経由でのテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル。tools+image 対応候補を見つけるには `openclaw models scan` を使用）
- OpenCode: Zen 用の `opencode/...` と Go 用の `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

live matrix に含められる追加プロバイダー（認証情報/config がある場合）:

- 組み込み: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由（カスタム endpoint）: `minimax`（cloud/API）、および OpenAI/Anthropic 互換の任意の proxy（LM Studio、vLLM、LiteLLM など）

ヒント: ドキュメントに「全モデル」をハードコードしようとしないでください。信頼できる一覧は、そのマシン上で `discoverModels(...)` が返すものと、利用可能なキーの組み合わせです。

## 認証情報（絶対に commit しないこと）

live テストは、CLI と同じ方法で認証情報を見つけます。実際上の意味は次のとおりです。

- CLI が動作するなら、live テストも同じキーを見つけられるはずです。
- live テストで「認証情報なし」と出るなら、`openclaw models list` / モデル選択をデバッグするときと同じ方法でデバッグしてください。

- エージェントごとの auth profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（これが live テストでいう「profile keys」です）
- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 旧 state ディレクトリ: `~/.openclaw/credentials/`（存在する場合、ステージ済み live home にコピーされますが、メインの profile-key store ではありません）
- ローカル live 実行では、デフォルトで現在の config、エージェントごとの `auth-profiles.json` ファイル、旧 `credentials/`、およびサポート対象の外部 CLI auth ディレクトリを一時 test home にコピーします。ステージ済み live home では `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` のパス上書きも削除されるため、probe が実際のホスト workspace に触れません。

env キー（たとえば `~/.profile` で export したもの）に依存したい場合は、`source ~/.profile` の後にローカルテストを実行するか、以下の Docker ランナーを使ってください（これらは `~/.profile` をコンテナにマウントできます）。

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
- 範囲:
  - バンドルされた comfy の image、video、`music_generate` パスを実行する
  - `models.providers.comfy.<capability>` が設定されていない場合、各 capability を skip する
  - comfy の workflow 提出、polling、download、または Plugin 登録を変更した後に有用

## 画像生成 live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- 範囲:
  - 登録済みのすべての画像生成 provider Plugin を列挙する
  - probe 前に login shell（`~/.profile`）から不足している provider env vars を読み込む
  - デフォルトでは保存済み auth profile より live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な auth/profile/model がない provider は skip する
  - 共有 runtime capability を通じて標準の画像生成バリアントを実行する:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされるバンドル済み provider:
  - `openai`
  - `google`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 任意の auth 動作:
  - profile-store auth を強制し、env-only 上書きを無視する `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 音楽生成 live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- 範囲:
  - 共有のバンドル済み音楽生成 provider パスを実行する
  - 現在は Google と MiniMax をカバー
  - probe 前に login shell（`~/.profile`）から provider env vars を読み込む
  - デフォルトでは保存済み auth profile より live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な auth/profile/model がない provider は skip する
  - 利用可能な場合は、宣言された両方の runtime mode を実行する:
    - プロンプトのみの入力による `generate`
    - provider が `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 別の Comfy live ファイルであり、この共有スイープではない
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の auth 動作:
  - profile-store auth を強制し、env-only 上書きを無視する `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 動画生成 live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- 範囲:
  - 共有のバンドル済み動画生成 provider パスを実行する
  - デフォルトでは、リリースで安全なスモークパスを使用します: 非 FAL provider、provider ごとに 1 回の text-to-video リクエスト、1 秒の lobster プロンプト、そして `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルト `180000`）に基づく provider ごとの操作上限
  - FAL は、provider 側のキュー遅延がリリース時間を大きく左右しうるため、デフォルトで skip されます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - probe 前に login shell（`~/.profile`）から provider env vars を読み込む
  - デフォルトでは保存済み auth profile より live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な auth/profile/model がない provider は skip する
  - デフォルトでは `generate` のみを実行する
  - 利用可能な場合に宣言済み transform mode も実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定:
    - provider が `capabilities.imageToVideo.enabled` を宣言し、選択された provider/model が共有スイープ内で buffer ベースのローカル画像入力を受け付ける場合の `imageToVideo`
    - provider が `capabilities.videoToVideo.enabled` を宣言し、選択された provider/model が共有スイープ内で buffer ベースのローカル動画入力を受け付ける場合の `videoToVideo`
  - 共有スイープで現在「宣言済みだが skip される」`imageToVideo` provider:
    - `vydra`。バンドル済み `veo3` は text 専用で、バンドル済み `kling` はリモート画像 URL を必要とするため
  - provider 固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` の text-to-video と、デフォルトでリモート画像 URL fixture を使う `kling` レーンを実行します
  - 現在の `videoToVideo` live カバレッジ:
    - 選択されたモデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在「宣言済みだが skip される」`videoToVideo` provider:
    - `alibaba`、`qwen`、`xai`。これらのパスは現在、リモートの `http(s)` / MP4 参照 URL を必要とするため
    - `google`。現在の共有 Gemini/Veo レーンはローカルの buffer ベース入力を使っており、そのパスは共有スイープでは受け付けられないため
    - `openai`。現在の共有レーンには org 固有の video inpaint/remix アクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトスイープ内のすべての provider（FAL を含む）を含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - より攻めたスモーク実行のために、各 provider の操作上限を縮めるには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の auth 動作:
  - profile-store auth を強制し、env-only 上書きを無視する `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Media live ハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画 live スイートを、リポジトリ標準の 1 つの entrypoint から実行する
  - `~/.profile` から不足している provider env vars を自動読み込みする
  - デフォルトで、現在利用可能な auth を持つ provider に各スイートを自動的に絞り込む
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の挙動が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker ランナー（任意の「Linux でも動く」チェック）

これらの Docker ランナーは 2 つのバケットに分かれます。

- Live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリ Docker イメージ内で対応する profile-key live ファイルだけを実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカル config dir と workspace をマウントし（マウントされている場合は `~/.profile` も読み込みます）。対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、完全な Docker スイープを実用的に保つため、デフォルトでより小さなスモーク上限を使用します:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、そして
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を設定します。より大きな網羅スキャンを明示的に行いたい場合は、これらの env var を上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` で live Docker イメージを 1 回だけビルドし、その後 2 つの live Docker レーンでそれを再利用します。
- Container スモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:plugins` は、1 つ以上の実際のコンテナを起動し、より高レベルな integration パスを検証します。

Live-model Docker ランナーは、必要な CLI auth home のみ（実行が絞り込まれていない場合はサポート対象すべて）も bind-mount し、実行前にそれらをコンテナ home にコピーするため、外部 CLI OAuth がホスト auth store を変更せずに token を更新できます。

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind スモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness スモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live スモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディング ウィザード（TTY、完全な scaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gateway networking（2 コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（seed 済み Gateway + stdio bridge + 生の Claude notification-frame スモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Plugins（インストールスモーク + `/plugin` エイリアス + Claude バンドルの再起動セマンティクス）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）

Live-model Docker ランナーは、現在の checkout を read-only で bind-mount し、
コンテナ内の一時 workdir にステージもします。これにより、runtime
イメージをスリムに保ちながら、正確にその手元の source/config に対して Vitest を実行できます。
このステージング手順では、大きなローカル専用キャッシュやアプリ build 出力、たとえば
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、およびアプリローカルの `.build` や
Gradle 出力ディレクトリをスキップするため、Docker live 実行が
マシン固有の成果物をコピーするのに何分も費やすことがありません。
また、Gateway live probe がコンテナ内で実際の Telegram/Discord などの channel worker を起動しないよう、
`OPENCLAW_SKIP_CHANNELS=1` も設定します。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
その Docker レーンで Gateway live カバレッジを絞り込む、または除外したい場合は
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルな互換性スモークです。これは
OpenAI 互換 HTTP endpoint を有効にした OpenClaw Gateway コンテナを起動し、
その Gateway に対して固定版の Open WebUI コンテナを起動し、Open WebUI 経由でサインインし、
`/api/models` が `openclaw/default` を公開していることを確認した後、
Open WebUI の `/api/chat/completions` proxy を通じて実際の chat リクエストを送信します。
初回実行は目立って遅くなることがあります。Docker が
Open WebUI イメージを pull する必要がある場合があり、さらに Open WebUI 自身のコールドスタートセットアップ完了を待つ必要があるためです。
このレーンは利用可能な live model key を前提としており、
Docker 化実行でそれを提供する主要な方法は `OPENCLAW_PROFILE_FILE`
（デフォルト `~/.profile`）です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON payload が出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、または iMessage アカウントを必要としません。これは seed 済み Gateway
コンテナを起動し、続いて `openclaw mcp serve` を起動する 2 つ目のコンテナを開始し、
ルーティングされた conversation discovery、transcript 読み取り、attachment metadata、
live event queue の挙動、outbound send ルーティング、さらに Claude 形式の channel +
permission notification を、実際の stdio MCP bridge 上で検証します。notification チェックは
生の stdio MCP frame を直接検査するため、このスモークは特定の client SDK がたまたま表面化するものだけでなく、
bridge が実際に出力するものを検証します。

手動の ACP プレーンランゲージ thread スモーク（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用として保持してください。ACP thread ルーティング検証のために再び必要になる可能性があるので、削除しないでください。

便利な env vars:

- `/home/node/.openclaw` にマウントされる `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）
- `/home/node/.openclaw/workspace` にマウントされる `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）
- `/home/node/.profile` にマウントされ、テスト実行前に読み込まれる `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）
- `OPENCLAW_PROFILE_FILE` から読み込んだ env vars のみを検証し、一時 config/workspace dir を使い、外部 CLI auth mount を使わない `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`
- Docker 内でキャッシュされた CLI インストール用に `/home/node/.npm-global` にマウントされる `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）
- `$HOME` 配下の外部 CLI auth ディレクトリ/ファイルは `/host-auth...` 配下に read-only でマウントされ、その後テスト開始前に `/home/node/...` にコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれた provider 実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論された必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- 実行を絞り込む `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内で provider を絞り込む `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルド不要の再実行で既存の `openclaw:local-live` イメージを再利用する `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報が profile store から来ることを保証する `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env ではない）
- Open WebUI スモークで Gateway が公開するモデルを選ぶ `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI スモークで使う nonce チェックプロンプトを上書きする `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定された Open WebUI イメージタグを上書きする `OPENWEBUI_IMAGE=...`

## ドキュメント健全性チェック

ドキュメント編集後は `pnpm check:docs` を実行してください。
インページ見出しチェックも必要な場合は、完全な Mintlify アンカー検証として `pnpm docs:check-links:anchors` を実行してください。

## オフラインリグレッション（CI 安全）

これらは、実際のプロバイダーなしでの「実パイプライン」リグレッションです。

- Gateway tool calling（mock OpenAI、実際の Gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: 「runs a mock OpenAI tool call end-to-end via gateway agent loop」）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config + auth 書き込みを強制）: `src/gateway/gateway.test.ts`（ケース: 「runs wizard over ws and writes auth token config」）

## agent 信頼性 evals（Skills）

すでに、いくつかの CI 安全なテストが「agent 信頼性 evals」のように振る舞います。

- 実際の Gateway + agent loop を通じた mock tool-calling（`src/gateway/gateway.test.ts`）。
- session 配線と config の効果を検証する end-to-end のウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills に関してまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **Decisioning:** prompt に Skills が列挙されているとき、agent は正しい skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** agent は使用前に `SKILL.md` を読み、必要な手順/args に従うか？
- **Workflow contracts:** tool の順序、session history の引き継ぎ、sandbox 境界を検証する複数ターンのシナリオ。

今後の eval は、まず決定的であることを優先すべきです。

- mock provider を使って tool call + 順序、skill file の読み取り、session 配線を検証するシナリオランナー。
- skill に焦点を当てた小規模シナリオスイート（使う vs 避ける、gating、prompt injection）。
- CI 安全なスイートを整備した後にのみ、任意の live eval（オプトイン、env-gated）。

## Contract テスト（Plugin と channel の形状）

Contract テストは、登録されたすべての Plugin と channel がその
interface 契約に適合していることを検証します。これらは検出されたすべての Plugin を走査し、形状と挙動に関する一連の検証を実行します。デフォルトの `pnpm test` unit レーンでは、これらの共有シームおよびスモークファイルは意図的にスキップされます。共有 channel または provider surface に触れる場合は、contract コマンドを明示的に実行してください。

### コマンド

- すべての contract: `pnpm test:contracts`
- channel contract のみ: `pnpm test:contracts:channels`
- provider contract のみ: `pnpm test:contracts:plugins`

### Channel contract

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin 形状（id、name、capabilities）
- **setup** - セットアップ ウィザード契約
- **session-binding** - session binding の挙動
- **outbound-payload** - message payload 構造
- **inbound** - inbound message の処理
- **actions** - channel action handler
- **threading** - thread ID の処理
- **directory** - directory/roster API
- **group-policy** - group policy の強制

### Provider status contract

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - channel status probe
- **registry** - Plugin registry の形状

### Provider contract

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - auth フロー契約
- **auth-choice** - auth の選択/selection
- **catalog** - model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - provider runtime
- **shape** - Plugin の形状/interface
- **wizard** - セットアップ ウィザード

### 実行するタイミング

- plugin-sdk の export または subpath を変更した後
- channel または provider Plugin を追加または変更した後
- Plugin 登録または discovery をリファクタリングした後

Contract テストは CI で実行され、実際の API キーは必要ありません。

## リグレッションを追加する（ガイダンス）

live で見つかった provider/model の問題を修正するとき:

- 可能であれば、CI 安全なリグレッションを追加してください（mock/stub provider、または正確な request-shape 変換をキャプチャ）
- 本質的に live 専用の問題（rate limit、auth policy）なら、live テストは狭く保ち、env vars 経由のオプトインにしてください
- バグを検出できる最小レイヤーを狙うことを優先してください:
  - provider request conversion/replay のバグ → 直接モデルテスト
  - Gateway session/history/tool パイプラインのバグ → Gateway live スモークまたは CI 安全な Gateway mock テスト
- SecretRef 走査ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef class ごとに 1 つのサンプル target を導出し、その後 traversal-segment exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは、分類されていない target id に対して意図的に失敗するため、新しい class が黙ってスキップされることはありません。
