---
read_when:
    - ローカルまたはCIでテストを実行すること
    - モデル/プロバイダーのバグに対するリグレッションテストの追加
    - Gateway + agent の動作のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストが対象とする内容'
title: テスト
x-i18n:
    generated_at: "2026-04-24T08:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、少数の
Docker ランナーがあります。このドキュメントは「どのようにテストしているか」のガイドです。

- 各スイートが対象とする内容（および意図的に _対象外_ としている内容）。
- 一般的なワークフロー（ローカル、pre-push、デバッグ）で実行するコマンド。
- live テストが認証情報をどのように検出し、モデル/プロバイダーをどのように選択するか。
- 実際のモデル/プロバイダーの問題に対するリグレッションの追加方法。

## クイックスタート

たいていの日は次を使います。

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでのより高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest ウォッチループ: `pnpm test:watch`
- 直接ファイル指定は、extension/channel のパスも処理するようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復中であれば、まずターゲットを絞った実行を優先してください。
- Docker バックの QA サイト: `pnpm qa:lab:up`
- Linux VM バックの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたとき、または追加の確信が必要なとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + gateway の tool/image probe）: `pnpm test:live`
- 1つの live ファイルを静かに対象化: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live モデルスイープ: `pnpm test:docker:live-models`
  - 選択した各モデルは、テキストターンに加えて小さな file-read 風 probe を実行するようになりました。
    メタデータが `image` 入力を示すモデルでは、小さな画像ターンも実行します。
    プロバイダー障害を切り分けるときは、追加 probe を `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で無効化してください。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と、手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` を指定して
    再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダーごとに
    シャーディングされた個別の Docker live モデル matrix ジョブが含まれます。
  - CI の絞り込み再実行では、`include_live_suites: true` と `live_models_only: true` を指定して
    `OpenClaw Live And E2E Checks (Reusable)` を dispatch してください。
  - 新しい高シグナルなプロバイダー secret を追加する場合は、`scripts/ci-hydrate-live-auth.sh` と
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびその
    scheduled/release 呼び出し元にも追加してください。
- ネイティブ Codex bound-chat スモーク: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、合成的な
    Slack DM を `/codex bind` でバインドし、`/codex fast` と
    `/codex permissions` を実行したうえで、通常の返信と画像添付が
    ACP ではなくネイティブ plugin binding を経由することを検証します。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定した状態で、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離した
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、assistant transcript に正規化された `usage.cost` が保存されることを確認します。

ヒント: 失敗ケースが1つだけ必要な場合は、以下で説明する allowlist 環境変数を使って live テストを絞り込むことを優先してください。

## QA 固有ランナー

これらのコマンドは、QA-lab の現実性が必要なときにメインのテストスイートと並んで使います。

CI は専用ワークフローで QA Lab を実行します。`Parity gate` は一致する PR と、
モックプロバイダーでの手動 dispatch から実行されます。`QA-Lab - All Lanes` は `main` で毎晩と
手動 dispatch から、mock parity gate、live Matrix レーン、そして
Convex 管理の live Telegram レーンを並列ジョブとして実行します。`OpenClaw Release Checks`
は、リリース承認前に同じレーンを実行します。

- `pnpm openclaw qa suite`
  - リポジトリバックの QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された gateway ワーカーを使って、複数の選択シナリオを並列実行します。
    `qa-channel` のデフォルト同時実行数は 4 です（選択されたシナリオ数で制限）。
    ワーカー数を調整するには `--concurrency <count>`、従来のシリアルレーンにするには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで artifact が欲しい場合は `--allow-failures` を使ってください。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、実験的な fixture およびプロトコルモックのカバレッジ向けに、
    シナリオ認識の `mock-openai` レーンを置き換えることなく、ローカルの AIMock バックプロバイダーサーバーを起動します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを、使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的なサポート対象の QA 認証入力を転送します:
    env ベースのプロバイダーキー、QA live プロバイダー設定パス、存在する場合は `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるよう、リポジトリルート配下に維持する必要があります。
  - 通常の QA レポート + サマリーに加えて、Multipass ログを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター型の QA 作業向けに、Docker バックの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在の checkout から npm tarball をビルドし、Docker 内でグローバルにインストールし、
    非対話型の OpenAI API-key オンボーディングを実行し、デフォルトで Telegram を設定し、
    plugin を有効化すると必要に応じてランタイム依存関係がオンデマンドでインストールされることを検証し、
    doctor を実行し、モックされた OpenAI エンドポイントに対して 1 回のローカル agent ターンを実行します。
  - 同じパッケージ化インストールレーンを Discord で実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使ってください。
- `pnpm test:docker:npm-telegram-live`
  - 公開済み OpenClaw パッケージを Docker にインストールし、インストール済みパッケージの
    オンボーディングを実行し、インストール済み CLI を通じて Telegram を設定し、その後
    そのインストール済みパッケージを SUT Gateway として live Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。
  - `pnpm openclaw qa telegram` と同じ Telegram の env 認証情報または Convex 認証情報ソースを使用します。CI/リリース自動化では、
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` と
    `OPENCLAW_QA_CONVEX_SITE_URL` およびロール secret を設定してください。
    CI で `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロール secret が存在する場合、
    Docker ラッパーは自動的に Convex を選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限って共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions では、このレーンは手動の maintainer ワークフロー
    `NPM Telegram Beta E2E` として公開されます。マージ時には実行されません。このワークフローは
    `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- `pnpm test:docker:bundled-channel-deps`
  - 現在の OpenClaw ビルドを Docker に pack/install し、OpenAI を設定した状態で Gateway を起動し、
    その後 config 編集を通じて bundled channel/plugins を有効化します。
  - setup discovery により未設定 plugin のランタイム依存関係が存在しないままであること、
    最初の設定済み Gateway または doctor 実行時に各 bundled plugin のランタイム依存関係がオンデマンドでインストールされること、
    そして 2 回目の再起動では、すでに有効化済みの依存関係を再インストールしないことを検証します。
  - また、既知の古い npm ベースラインをインストールし、Telegram を有効化してから
    `openclaw update --tag <candidate>` を実行し、候補版の
    post-update doctor が、ハーネス側の postinstall 修復なしで bundled channel のランタイム依存関係を修復することを検証します。
- `pnpm openclaw qa aimock`
  - 直接的なプロトコルスモークテスト向けに、ローカルの AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker バック Tuwunel homeserver に対して Matrix live QA レーンを実行します。
  - この QA ホストは現在 repo/dev 専用です。パッケージ化された OpenClaw インストールには
    `qa-lab` が含まれないため、`openclaw qa` は公開されません。
  - リポジトリ checkout では bundled ランナーを直接ロードします。個別の plugin インストール手順は不要です。
  - 一時的な Matrix ユーザー 3 人（`driver`、`sut`、`observer`）と 1 つのプライベートルームを用意し、その後
    実際の Matrix plugin を SUT トランスポートとして使う QA gateway 子プロセスを起動します。
  - デフォルトでは固定された安定版 Tuwunel イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。別のイメージをテストする必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrix は、レーンがローカルで使い捨てユーザーを用意するため、共有認証情報ソースフラグを公開しません。
  - Matrix QA レポート、サマリー、observed-events artifact、および結合された stdout/stderr 出力ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm openclaw qa telegram`
  - env の driver および SUT bot token を使って、実際のプライベートグループに対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group id は数値の Telegram chat id である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使うか、プールされたリースを選ぶには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで artifact が欲しい場合は `--allow-failures` を使ってください。
  - 同じプライベートグループ内に 2 つの異なる bot が必要で、SUT bot は Telegram username を公開している必要があります。
  - 安定した bot 間観測のため、両 bot で `@BotFather` の Bot-to-Bot Communication Mode を有効化し、driver bot がグループ内の bot トラフィックを観測できることを確認してください。
  - Telegram QA レポート、サマリー、observed-messages artifact を `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、driver の送信リクエストから観測された SUT 返信までの RTT が含まれます。

live transport レーンは、新しい transport が逸脱しないよう、1 つの標準契約を共有します。

`qa-channel` は依然として広範な合成 QA スイートであり、live
transport カバレッジ matrix には含まれません。

| レーン   | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex を使った共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、
QA lab は Convex バックのプールから排他的リースを取得し、そのレーンが実行中は
そのリースに heartbeat を送り、終了時にリースを解放します。

参照用の Convex プロジェクトひな型:

- `qa/convex-credential-broker/`

必須の環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用の secret が 1 つ:
  - `maintainer` には `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` には `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトで `ci`、それ以外では `maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル開発専用として loopback の `http://` Convex URL を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使う必要があります。

maintainer の管理コマンド（プールの追加/削除/一覧）は、
具体的に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` を必要とします。

maintainer 向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトや CI ユーティリティで機械可読な出力が必要な場合は `--json` を使ってください。

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
- `POST /admin/add`（maintainer secret のみ）
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove`（maintainer secret のみ）
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブリースのガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer secret のみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind の payload 形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正な payload を拒否します。

### QA にチャネルを追加する

markdown QA システムにチャネルを追加するには、必要なものは正確に 2 つだけです。

1. そのチャネル用の transport adapter。
2. チャネル契約を実行する scenario pack。

共有の `qa-lab` ホストがフローを管理できる場合は、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを管理します:

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカーの同時実行制御
- artifact の書き込み
- レポート生成
- シナリオ実行
- 旧 `qa-channel` シナリオ向け互換エイリアス

runner plugin は transport 契約を管理します:

- 共有 `qa` ルート配下で `openclaw qa <runner>` をどうマウントするか
- その transport 用に gateway をどう設定するか
- readiness をどう確認するか
- inbound event をどう注入するか
- outbound message をどう観測するか
- transcript と正規化された transport 状態をどう公開するか
- transport バックのアクションをどう実行するか
- transport 固有のリセットやクリーンアップをどう扱うか

新しいチャネルに対する最低限の導入基準は次のとおりです。

1. 共有 `qa` ルートの管理者は `qa-lab` のままにする。
2. 共有 `qa-lab` ホストの seam 上に transport runner を実装する。
3. transport 固有の仕組みは runner plugin または channel harness の中にとどめる。
4. 競合するルートコマンドを登録する代わりに、runner を `openclaw qa <runner>` としてマウントする。
   Runner plugin は `openclaw.plugin.json` に `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートしてください。
   `runtime-api.ts` は軽量に保ってください。遅延 CLI および runner 実行は別個の entrypoint の背後に置くべきです。
5. テーマ別の `qa/scenarios/` ディレクトリ配下に markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用 scenario helper を使う。
7. リポジトリが意図的な移行を行っているのでない限り、既存の互換エイリアスは動作し続けるようにする。

判断ルールは厳格です。

- 振る舞いを `qa-lab` に 1 回だけ表現できるなら、`qa-lab` に置いてください。
- 振る舞いが 1 つのチャネル transport に依存するなら、その runner plugin または plugin harness にとどめてください。
- シナリオに複数のチャネルが使える新しい capability が必要な場合は、`suite.ts` にチャネル固有の分岐を追加するのではなく、汎用 helper を追加してください。
- 振る舞いが 1 つの transport にしか意味を持たない場合は、そのシナリオを transport 固有のものにし、そのことを scenario 契約で明示してください。

新しいシナリオ向けの推奨される汎用 helper 名は次のとおりです。

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

既存シナリオ向けには、以下を含む互換エイリアスが引き続き利用できます。

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいチャネル作業では、汎用 helper 名を使ってください。
互換エイリアスはフラグデー移行を避けるために存在するのであり、
新しいシナリオ作成のモデルではありません。

## テストスイート（どこで何が実行されるか）

スイートは「現実性が増していくもの」（および不安定さ/コストも増すもの）として考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲットを絞らない実行では `vitest.full-*.config.ts` shard セットを使い、並列スケジューリングのために multi-project shard をプロジェクトごとの config に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit インベントリと、`vitest.unit.config.ts` でカバーされる許可済みの `ui` node テスト
- 範囲:
  - 純粋な unit テスト
  - プロセス内 integration テスト（gateway auth、routing、tooling、parsing、config）
  - 既知のバグに対する決定的なリグレッション
- 想定:
  - CI で実行される
  - 実際のキーは不要
  - 高速で安定しているべき
    <AccordionGroup>
    <Accordion title="プロジェクト、shard、scoped lane"> - ターゲットを絞らない `pnpm test` は、巨大なネイティブルートプロジェクトプロセス 1 つではなく、12 個のより小さい shard config（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS を削減し、auto-reply/extension の作業が無関係なスイートを圧迫するのを防ぎます。 - `pnpm test --watch` は、multi-shard の watch ループが現実的でないため、引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使います。 - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまず scoped lane 経由で処理するため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ではルートプロジェクト全体の起動コストを支払わずに済みます。 - `pnpm test:changed` は、差分がルーティング可能な source/test ファイルだけに触れている場合、変更された git パスを同じ scoped lane に展開します。config/setup の編集は引き続き広範なルートプロジェクト再実行にフォールバックします。 - `pnpm check:changed` は、狭い作業向けの通常のスマートローカルゲートです。差分を core、core tests、extensions、extension tests、apps、docs、release metadata、tooling に分類し、一致する typecheck/lint/test lane を実行します。公開 Plugin SDK と plugin-contract の変更には、extensions がそれらの core 契約に依存しているため、1 回の extension 検証パスが含まれます。リリースメタデータだけのバージョンバンプでは、トップレベルの version フィールド以外の package 変更を拒否するガード付きで、フルスイートではなく対象を絞った version/config/root-dependency チェックを実行します。 - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および同様の純粋なユーティリティ領域からの import-light な unit テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` lane を通ります。stateful/runtime-heavy なファイルは既存 lane のままです。 - 一部の `plugin-sdk` および `commands` helper source ファイルも、変更モードの実行をそれらの軽量 lane の明示的な兄弟テストにマッピングするため、helper の編集時にそのディレクトリ全体の重いスイートを再実行せずに済みます。 - `auto-reply` には 3 つの専用バケットがあります: トップレベルの core helper、トップレベルの `reply.*` integration テスト、そして `src/auto-reply/reply/**` サブツリーです。これにより、最も重い reply harness の作業を、安価な status/chunk/token テストから切り離します。
    </Accordion>

      <Accordion title="埋め込み runner のカバレッジ">
        - message-tool discovery 入力または Compaction ランタイム
          コンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
        - 純粋な routing および normalization
          境界に対して、焦点を絞った helper リグレッションを追加してください。
        - 埋め込み runner の integration スイートを健全に保ってください:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - これらのスイートは、スコープ付き id と Compaction の振る舞いが、実際の `run.ts` / `compact.ts` パスを通って引き続き流れることを検証します。helper のみのテストは、これらの integration パスの十分な代替にはなりません。
      </Accordion>

      <Accordion title="Vitest プールと isolation のデフォルト">
        - ベースの Vitest config のデフォルトは `threads` です。
        - 共有 Vitest config では `isolate: false` を固定し、
          ルートプロジェクト、e2e、live config 全体で
          非分離 runner を使用します。
        - ルート UI lane はその `jsdom` セットアップと optimizer を維持しますが、
          それも共有の非分離 runner で実行されます。
        - 各 `pnpm test` shard は、共有 Vitest config から同じ
          `threads` + `isolate: false` のデフォルトを継承します。
        - `scripts/run-vitest.mjs` は、Vitest の子 Node
          プロセスに対してデフォルトで `--no-maglev` を追加し、大きなローカル実行中の V8 コンパイルの揺れを減らします。
          標準の V8 挙動と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
      </Accordion>

      <Accordion title="高速なローカル反復">
        - `pnpm changed:lanes` は、差分がどのアーキテクチャ lane を発火させるかを表示します。
        - pre-commit hook はフォーマット専用です。フォーマット済みファイルを
          再ステージするだけで、lint、typecheck、tests は実行しません。
        - スマートローカルゲートが必要な場合は、handoff または push 前に
          `pnpm check:changed` を明示的に実行してください。公開 Plugin SDK と plugin-contract
          の変更には 1 回の extension 検証パスが含まれます。
        - `pnpm test:changed` は、変更パスがより小さいスイートにきれいに
          マッピングできるとき、scoped lane を通ります。
        - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング
          挙動を維持しつつ、worker 上限が高くなります。
        - ローカル worker の自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は
          抑制されるため、複数の Vitest 実行を同時に行っても、デフォルトでは影響が小さくなります。
        - ベースの Vitest config は、テスト配線が変更されたときに変更モード再実行の正しさを保つため、
          プロジェクト/config ファイルを
          `forceRerunTriggers` としてマークします。
        - config は、サポートされるホスト上で `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。
          直接プロファイリングのために明示的なキャッシュ場所 1 つを使いたい場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
      </Accordion>

      <Accordion title="パフォーマンスデバッグ">
        - `pnpm test:perf:imports` は、Vitest の import 所要時間レポートと
          import-breakdown 出力を有効にします。
        - `pnpm test:perf:imports:changed` は、同じプロファイリング表示を
          `origin/main` 以降で変更されたファイルに限定します。
        - 1 つのホットテストが依然として起動時 import に大半の時間を費やしている場合は、
          重い依存関係を狭いローカル `*.runtime.ts` seam の背後に置き、
          それを `vi.mock(...)` に渡すためだけにランタイム helper を deep-import するのではなく、
          その seam を直接モックしてください。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、ルーティングされた
          `test:changed` を、そのコミット済み差分に対するネイティブルートプロジェクト経路と比較し、
          経過時間と macOS の最大 RSS を表示します。
        - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を
          `scripts/test-projects.mjs` とルート Vitest config に通すことで、
          現在の未コミットツリーをベンチマークします。
        - `pnpm test:perf:profile:main` は、Vitest/Vite の起動および transform オーバーヘッド向けの
          メインスレッド CPU プロファイルを書き出します。
        - `pnpm test:perf:profile:runner` は、ファイル並列を無効化した
          unit スイート向けの runner CPU+heap プロファイルを書き出します。
      </Accordion>
    </AccordionGroup>

### Stability（gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 ワーカーに強制
- 範囲:
  - デフォルトで diagnostics を有効にした実際の loopback Gateway を起動する
  - 合成的な gateway メッセージ、メモリ、大きな payload の churn を diagnostic event path に流す
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせる
  - diagnostic stability bundle 永続化 helper をカバーする
  - recorder が有界のままであること、合成 RSS サンプルが pressure budget を下回ること、
    およびセッションごとの queue 深さがゼロに戻ることを検証する
- 想定:
  - CI で安全かつキー不要
  - stability リグレッション追跡向けの狭い lane であり、完全な Gateway スイートの代替ではない

### E2E（gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E テスト
- ランタイムデフォルト:
  - リポジトリの他と同様に、Vitest `threads` と `isolate: false` を使用します。
  - 適応型ワーカーを使用します（CI: 最大 2、ローカル: デフォルトで 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトで silent mode で実行します。
- 便利なオーバーライド:
  - ワーカー数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細なコンソール出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- 範囲:
  - 複数インスタンス gateway の end-to-end 振る舞い
  - WebSocket/HTTP サーフェス、ノードペアリング、より重いネットワーキング
- 想定:
  - CI で実行される（パイプラインで有効化されている場合）
  - 実際のキーは不要
  - unit テストより可動部分が多い（遅くなることがある）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- 範囲:
  - Docker 経由でホスト上に分離された OpenShell gateway を起動する
  - 一時的なローカル Dockerfile から sandbox を作成する
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを実行する
  - sandbox fs bridge を通じて remote-canonical な filesystem 振る舞いを検証する
- 想定:
  - オプトイン専用。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker daemon が必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト gateway と sandbox を破棄する
- 便利なオーバーライド:
  - より広い e2e スイートを手動実行するときにこのテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の bundled-plugin live テスト
- デフォルト: `pnpm test:live` で **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- 範囲:
  - 「このプロバイダー/モデルは _今日_ 実際の認証情報で本当に動くか？」
  - プロバイダーのフォーマット変更、tool-calling の癖、認証問題、rate limit の振る舞いを捕捉する
- 想定:
  - 設計上、CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - コストがかかる / rate limit を消費する
  - 「すべて」よりも、絞り込んだサブセットの実行を優先する
- live 実行では、不足している API キーを取得するために `~/.profile` を読み込みます。
- デフォルトでは、live 実行は依然として `HOME` を分離し、config/auth 資料を一時テスト home にコピーするため、unit fixture が実際の `~/.openclaw` を変更できません。
- live テストに実際の home ディレクトリを意図的に使わせたい場合にのみ `OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は、より静かなモードがデフォルトになりました。`[live] ...` の進行状況出力は維持されますが、追加の `~/.profile` 通知は抑制され、gateway bootstrap ログ/Bonjour chatter はミュートされます。完全な起動ログを再表示したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS` または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）、または live ごとの上書き用 `OPENCLAW_LIVE_*_KEY` を設定してください。テストは rate limit 応答時に再試行します。
- 進行状況/heartbeat 出力:
  - live スイートは進行状況行を stderr に出力するようになったため、Vitest のコンソールキャプチャが静かな場合でも、長いプロバイダー呼び出しが動作中であることを視覚的に確認できます。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効化するため、live 実行中はプロバイダー/gateway の進行状況行が即座にストリームされます。
  - 直接モデルの heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe の heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

次の判断表を使ってください。

- ロジック/テストを編集した: `pnpm test` を実行する（大きく変更したなら `pnpm test:coverage` も）
- gateway networking / WS protocol / pairing に触れた: `pnpm test:e2e` を追加する
- 「bot が落ちている」/ プロバイダー固有の失敗 / tool calling をデバッグしたい: 絞り込んだ `pnpm test:live` を実行する

## Live（ネットワークに接触する）テスト

live モデル matrix、CLI バックエンドスモーク、ACP スモーク、Codex app-server
harness、およびすべての media-provider live テスト（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）に加え、live 実行の認証情報処理については、
[Testing — live suites](/ja-JP/help/testing-live) を参照してください。

## Docker ランナー（任意の「Linux で動く」チェック）

これらの Docker ランナーは 2 つのバケットに分かれます。

- live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、対応する profile-key live ファイルのみをリポジトリ Docker イメージ内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカルの config ディレクトリと workspace をマウントし（マウントされていれば `~/.profile` も読み込みます）。対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、完全な Docker スイープを現実的に保つため、デフォルトでより小さいスモーク上限を使います:
  `test:docker:live-models` のデフォルトは `OPENCLAW_LIVE_MAX_MODELS=12`、および
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大きい網羅的スキャンを明示的に望む場合は、これらの env var を上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` で live Docker イメージを 1 回ビルドし、その後 2 つの live Docker レーンでそれを再利用します。また、`test:docker:e2e-build` 経由で共有の `scripts/e2e/Dockerfile` イメージを 1 つビルドし、ビルド済みアプリを実行する E2E コンテナスモークランナーでそれを再利用します。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、および `test:docker:config-reload` は、1 つ以上の実際のコンテナを起動し、より高レベルの integration パスを検証します。

live-model Docker ランナーは、必要な CLI auth home のみを bind mount し（実行が絞り込まれていない場合はサポートされるものをすべて）、実行前にそれらをコンテナ home にコピーします。これにより、外部 CLI OAuth がホストの auth store を変更せずにトークンを更新できます:

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness スモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live スモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全な scaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- npm tarball のオンボーディング/チャネル/agent スモーク: `pnpm test:docker:npm-onboard-channel-agent` は、pack した OpenClaw tarball を Docker 内にグローバルインストールし、env-ref オンボーディング経由で OpenAI を設定し、デフォルトで Telegram を設定し、doctor が有効化された plugin ランタイム依存関係を修復することを検証し、モックされた OpenAI agent ターンを 1 回実行します。事前ビルド済み tarball を再利用するには `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホストでの再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、チャネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使ってください。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーを pack し、分離された home で `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングする代わりに bundled image provider を返すことを検証します。事前ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`、またはビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使ってください。
- Installer Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、その root、update、direct-npm コンテナ間で 1 つの npm キャッシュを共有します。update スモークは、候補 tarball へアップグレードする前の安定ベースラインとして、デフォルトで npm `latest` を使います。非 root の installer チェックでは、root 所有のキャッシュエントリがユーザーローカル install の挙動を隠さないよう、分離された npm キャッシュを維持します。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定してください。
- Install Smoke CI は、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでローカル実行してください。
- Gateway ネットワーキング（2 コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses web_search 最小 reasoning リグレッション: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後プロバイダースキーマ拒否を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP channel bridge（シード済み Gateway + stdio bridge + 生の Claude notification-frame スモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（実際の stdio MCP サーバー + 埋め込み Pi profile の allow/deny スモーク）: `pnpm test:docker:pi-bundle-mcp-tools`（スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（実際の Gateway + isolated cron と one-shot subagent 実行後の stdio MCP 子プロセス teardown）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（インストールスモーク + `/plugin` エイリアス + Claude-bundle の再起動セマンティクス）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
- Plugin update unchanged スモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Config reload メタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- Bundled plugin ランタイム依存関係: `pnpm test:docker:bundled-channel-deps` は、デフォルトで小さな Docker ランナーイメージをビルドし、ホスト上で OpenClaw を一度だけビルドして pack し、その tarball を各 Linux install シナリオにマウントします。イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`、新しいローカルビルド後のホスト再ビルドをスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`、または既存の tarball を指定するには `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使ってください。
- 反復作業中に bundled plugin ランタイム依存関係を絞り込むには、無関係なシナリオを無効化してください。たとえば:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

共有の built-app イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージオーバーライドは、設定されている場合に引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルになければ pull します。QR と installer の Docker テストは、共有 built-app ランタイムではなく package/install の挙動を検証するため、独自の Dockerfile を維持しています。

live-model Docker ランナーは、現在の checkout も読み取り専用で bind mount し、
それをコンテナ内の一時 workdir に stage します。
これにより、ローカルの正確な source/config に対して Vitest を実行しながら、
ランタイムイメージをスリムに保てます。
stage ステップでは、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、および app ローカルの `.build` や
Gradle 出力ディレクトリのような大きなローカル専用キャッシュや app ビルド出力をスキップするため、
Docker live 実行でマシン固有の artifact のコピーに数分を費やすことがありません。
また、gateway live probe がコンテナ内で
実際の Telegram/Discord などの channel worker を起動しないよう、`OPENCLAW_SKIP_CHANNELS=1` も設定します。
`test:docker:live-models` は依然として `pnpm test:live` を実行するため、
その Docker レーンで gateway live カバレッジを絞り込んだり除外したりしたい場合は
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw gateway コンテナを起動し、その gateway に対して固定された Open WebUI コンテナを起動し、
Open WebUI を通じてサインインし、`/api/models` が `openclaw/default` を公開することを検証し、
その後 Open WebUI の `/api/chat/completions` プロキシ経由で
実際のチャットリクエストを送信します。
初回実行は、Docker が
Open WebUI イメージを pull する必要がある場合や、Open WebUI 自身がコールドスタートセットアップを完了する必要があるため、目に見えて遅くなることがあります。
このレーンは使用可能な live モデルキーを想定しており、Docker 化された実行でそれを提供する主な方法は
`OPENCLAW_PROFILE_FILE`（デフォルトは `~/.profile`）です。
成功した実行では `{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON payload が出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、または iMessage アカウントを必要としません。シード済み Gateway
コンテナを起動し、`openclaw mcp serve` を起動する 2 つ目のコンテナを開始し、
その後、ルーティングされた会話 discovery、transcript 読み取り、添付メタデータ、
live event queue の挙動、outbound send routing、そして Claude 形式の channel +
permission notification を、実際の stdio MCP bridge 上で検証します。notification チェックでは
生の stdio MCP frame を直接検査するため、このスモークは特定のクライアント SDK が
たまたま表面化する内容だけでなく、bridge が実際に発行するものを検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、live
モデルキーを必要としません。リポジトリ Docker イメージをビルドし、コンテナ内で実際の stdio MCP probe サーバーを起動し、
そのサーバーを埋め込み Pi bundle
MCP ランタイム経由で実体化し、ツールを実行し、その後 `coding` と `messaging` が
`bundle-mcp` ツールを保持し、`minimal` および `tools.deny: ["bundle-mcp"]` がそれらをフィルタすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、live モデル
キーを必要としません。実際の stdio MCP probe サーバーを備えたシード済み Gateway を起動し、
isolated cron ターンと `/subagents spawn` による one-shot 子ターンを実行し、
その後、各実行後に MCP 子プロセスが終了することを検証します。

手動の ACP 平文 thread スモーク（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグ用ワークフローとして残してください。ACP の thread routing 検証で再び必要になる可能性があるため、削除しないでください。

便利な env var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、`OPENCLAW_PROFILE_FILE` から source された env var のみを検証し、一時的な config/workspace ディレクトリを使い、外部 CLI auth mount は行いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内でキャッシュされた CLI install 用として `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI auth ディレクトリ/ファイルは、`/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` へコピーされます
  - デフォルトのディレクトリ: `.minimax`
  - デフォルトのファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要なディレクトリ/ファイルのみをマウントします
  - 手動で上書きするには `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストを使ってください
- 実行を絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内でプロバイダーをフィルタするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルド不要の再実行で既存の `openclaw:local-live` イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報が profile store 由来であることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env 由来ではない）
- Open WebUI スモークで gateway が公開するモデルを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI スモークで使われる nonce-check プロンプトを上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定された Open WebUI イメージタグを上書きするには `OPENWEBUI_IMAGE=...`

## ドキュメントの健全性確認

ドキュメントを編集した後は docs チェックを実行してください: `pnpm check:docs`。
ページ内見出しのチェックも必要な場合は、完全な Mintlify アンカー検証を実行してください: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI 安全）

これらは実際のプロバイダーなしで行う「実パイプライン」リグレッションです。

- Gateway tool calling（モック OpenAI、実際の gateway + agent ループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config 書き込み + auth 強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## Agent 信頼性 eval（Skills）

CI 安全で「agent 信頼性 eval」のように振る舞うテストはいくつかすでにあります。

- 実際の gateway + agent ループを通したモック tool-calling（`src/gateway/gateway.test.ts`）。
- セッション配線と config への影響を検証する end-to-end ウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **Decisioning:** Skills がプロンプトに列挙されているとき、agent は正しい skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** agent は使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **Workflow contracts:** ツール順序、セッション履歴の引き継ぎ、sandbox 境界を検証する multi-turn シナリオ。

今後の eval は、まず決定的であることを優先してください:

- モックプロバイダーを使って、ツール呼び出し + 順序、skill ファイル読み取り、セッション配線を検証する scenario runner。
- skill に焦点を当てた小さなシナリオスイート（使う vs 避ける、gating、prompt injection）。
- オプションの live eval（オプトイン、env でゲート）は、CI 安全なスイートを整備した後にのみ追加する。

## Contract テスト（plugin と channel の形状）

Contract テストは、登録されたすべての plugin と channel がその
インターフェース契約に準拠していることを検証します。検出されたすべての plugin を走査し、
形状と振る舞いに関する一連の検証を実行します。デフォルトの `pnpm test` unit レーンは、
これらの共有 seam および smoke ファイルを意図的にスキップします。共有の channel または provider サーフェスに触れた場合は、
contract コマンドを明示的に実行してください。

### コマンド

- すべての contract: `pnpm test:contracts`
- channel contract のみ: `pnpm test:contracts:channels`
- provider contract のみ: `pnpm test:contracts:plugins`

### Channel contract

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な plugin の形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディングの振る舞い
- **outbound-payload** - メッセージ payload 構造
- **inbound** - inbound メッセージ処理
- **actions** - channel action ハンドラー
- **threading** - thread ID 処理
- **directory** - directory/roster API
- **group-policy** - グループポリシーの適用

### Provider status contract

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - channel status probe
- **registry** - plugin registry の形状

### Provider contract

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証選択
- **catalog** - モデルカタログ API
- **discovery** - plugin 検出
- **loader** - plugin 読み込み
- **runtime** - provider ランタイム
- **shape** - plugin の形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk の export または subpath を変更した後
- channel または provider plugin を追加または変更した後
- plugin 登録または検出をリファクタリングした後

Contract テストは CI で実行され、実際の API キーは不要です。

## リグレッションの追加（ガイダンス）

live で見つかった provider/model の問題を修正する場合:

- 可能なら CI 安全なリグレッションを追加してください（モック/スタブ provider、または正確な request-shape 変換のキャプチャ）
- 本質的に live 専用である場合（rate limit、認証ポリシー）は、live テストを狭く保ち、env var でオプトインにしてください
- バグを捕捉する最小のレイヤーを対象にすることを優先してください:
  - provider の request 変換/再生バグ → 直接 models テスト
  - gateway の session/history/tool パイプラインバグ → gateway live スモークまたは CI 安全な gateway モックテスト
- SecretRef 走査ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry メタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとに 1 つのサンプル対象を導出し、その後、走査セグメント exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef 対象ファミリーを追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは、未分類の target id に対して意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。

## 関連

- [Testing live](/ja-JP/help/testing-live)
- [CI](/ja-JP/ci)
