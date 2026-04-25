---
read_when:
    - ローカルまたは CI でテストを実行する դեպքում
    - モデル/プロバイダーのバグに対する回帰テストを追加する場合
    - Gateway + エージェント動作をデバッグする場合
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-04-25T13:50:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、小規模な
Docker ランナー群があります。このドキュメントは「どのようにテストするか」のガイドです:

- 各スイートが何をカバーするか（そして意図的に _何を_ カバーしないか）。
- 一般的なワークフロー（ローカル、push 前、デバッグ）でどのコマンドを実行するか。
- live テストがどのように認証情報を検出し、モデル/プロバイダーを選択するか。
- 実世界のモデル/プロバイダー問題に対する回帰テストをどう追加するか。

## クイックスタート

ほとんどの日は:

- 完全ゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 十分な余裕のあるマシンでの、より高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接ファイル指定は extension/channel パスにも対応しました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復しているときは、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたとき、または追加の確信が欲しいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + Gateway の Tool/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live モデル全走査: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて、小さなファイル読み取り風プローブも実行します。
    メタデータで `image` 入力を示すモデルでは、小さな画像ターンも実行します。
    プロバイダー障害を切り分けるときは、追加プローブを `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で無効にしてください。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` を付けて再利用可能な live/E2E ワークフローを呼び出します。
    これには、プロバイダーごとに分割された Docker live モデルの個別 matrix job が含まれます。
  - 焦点を絞った CI 再実行には、`include_live_suites: true` と `live_models_only: true` を付けて
    `OpenClaw Live And E2E Checks (Reusable)` を dispatch してください。
  - 新しい高シグナルのプロバイダー secret を追加する場合は、`scripts/ci-hydrate-live-auth.sh` と
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびその
    scheduled/release 呼び出し元にも追加してください。
- ネイティブ Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、合成 Slack DM を `/codex bind` でバインドし、
    `/codex fast` と `/codex permissions` を実行し、その後、プレーンな返信と画像添付が
    ACP ではなくネイティブ Plugin バインディング経由で流れることを検証します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command 画面向けのオプトインの二重安全確認です。
    `/crestodian status` を実行し、永続モデル変更をキューし、`/crestodian yes` に応答し、
    監査/config 書き込みパスを検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - 設定のないコンテナ内で Crestodian を `PATH` 上の偽 Claude CLI とともに実行し、
    あいまい planner フォールバックが監査済みの型付き config 書き込みに変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、素の `openclaw` を Crestodian にルーティングし、
    setup/model/agent/Discord Plugin + SecretRef 書き込みを適用し、
    config を検証し、監査エントリを確認します。同じ Ring 0 セットアップパスは QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によりカバーされます。
- Moonshot/Kimi コスト smoke: `MOONSHOT_API_KEY` を設定した状態で、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、assistant transcript に正規化された
  `usage.cost` が保存されることを確認します。

ヒント: 失敗ケースが 1 つだけ必要な場合は、後述する allowlist 環境変数で live テストを絞り込むことを優先してください。

## QA 専用ランナー

これらのコマンドは、QA-lab の現実性が必要なときにメインテストスイートと並んで使います:

CI は専用ワークフローで QA Lab を実行します。`Parity gate` は一致する PR と
手動 dispatch から mock provider で実行されます。`QA-Lab - All Lanes` は `main` に対して毎晩、
および手動 dispatch から、mock parity gate、live Matrix レーン、Convex 管理の live Telegram レーンを
並列 job として実行します。`OpenClaw Release Checks` はリリース承認前に同じレーンを実行します。

- `pnpm openclaw qa suite`
  - リポジトリをベースにした QA シナリオをホスト上で直接実行します。
  - 選択した複数シナリオを、分離された Gateway worker によりデフォルトで並列実行します。
    `qa-channel` のデフォルト並行数は 4 です（選択シナリオ数で上限あり）。
    worker 数を調整するには `--concurrency <count>` を、従来の直列レーンにするには `--concurrency 1` を使ってください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物が欲しい場合は `--allow-failures` を使用してください。
  - `live-frontier`、`mock-openai`、`aimock` のプロバイダーモードをサポートします。
    `aimock` は、シナリオ認識付きの `mock-openai` レーンを置き換えることなく、
    実験的な fixture および protocol-mock カバレッジのためにローカル AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲスト向けに実用的なサポート対象 QA 認証入力を転送します:
    env ベースのプロバイダーキー、QA live provider config パス、存在する場合の `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるよう、リポジトリルート配下に維持する必要があります。
  - 通常の QA レポート + サマリーに加えて、Multipass ログを `.artifacts/qa-e2e/...` の下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業向けに Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在の checkout から npm tarball をビルドし、Docker 内にグローバルインストールし、
    非対話型の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、
    Plugin の有効化で必要時にランタイム依存関係がインストールされることを検証し、
    doctor を実行し、mocked OpenAI エンドポイントに対して 1 回のローカル agent turn を実行します。
  - 同じ packaged-install レーンを Discord で実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用してください。
- `pnpm test:docker:npm-telegram-live`
  - 公開済み OpenClaw パッケージを Docker にインストールし、installed-package オンボーディングを実行し、
    installed CLI 経由で Telegram を設定し、その後、その installed package を SUT Gateway として
    live Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。
  - `pnpm openclaw qa telegram` と同じ Telegram 環境認証情報または Convex 認証情報ソースを使用します。
    CI/release 自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` と
    `OPENCLAW_QA_CONVEX_SITE_URL`、および role secret を設定してください。
    CI 内で `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が存在する場合、
    Docker ラッパーは自動的に Convex を選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに対してのみ共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions では、このレーンを手動メンテナー用ワークフロー
    `NPM Telegram Beta E2E` として公開しています。merge では実行されません。このワークフローは
    `qa-live-shared` environment と Convex CI credential lease を使用します。
- `pnpm test:docker:bundled-channel-deps`
  - 現在の OpenClaw ビルドを Docker 内で pack/install し、OpenAI を設定した状態で Gateway を起動し、
    その後 config 編集を通じて bundled channel/plugins を有効にします。
  - setup discovery により未設定 Plugin のランタイム依存関係が存在しないままになること、
    最初に設定された Gateway または doctor 実行が各 bundled Plugin のランタイム依存関係を
    必要時にインストールすること、そして 2 回目の再起動では、すでに有効化された依存関係を再インストールしないことを検証します。
  - また、既知の古い npm ベースラインをインストールし、`openclaw update --tag <candidate>` 実行前に Telegram を有効化し、
    candidate の post-update doctor が、ハーネス側の postinstall 修復なしに bundled channel ランタイム依存関係を修復することも検証します。
- `pnpm test:parallels:npm-update`
  - ネイティブ packaged-install update smoke を Parallels ゲスト全体で実行します。選択された各プラットフォームでは、
    まず要求されたベースラインパッケージをインストールし、その後同じゲスト内でインストール済みの `openclaw update`
    コマンドを実行して、インストール済みバージョン、更新ステータス、Gateway 準備状態、および 1 回のローカル agent turn を検証します。
  - 1 つのゲスト上で反復するときは `--platform macos`、`--platform windows`、`--platform linux` を使用してください。
    サマリー成果物パスとレーンごとのステータスには `--json` を使用してください。
  - Parallels 転送の停滞が残りのテスト時間を消費しないよう、長いローカル実行はホスト側 timeout で包んでください:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトはネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` の下に書き込みます。
    外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log`
    を確認してください。
  - Windows の更新は、コールドゲストでは post-update doctor/ランタイム依存関係修復に 10〜15 分かかることがあります。
    ネストされた npm debug log が進行しているなら、これは依然として正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux smoke レーンと並列実行しないでください。
    これらは VM 状態を共有しており、snapshot restore、package serving、または guest Gateway state で衝突する可能性があります。
  - post-update 証明では通常の bundled Plugin サーフェスを実行します。speech、画像生成、media
    understanding のような capability facade は、agent turn 自体が単純なテキスト応答しか確認しない場合でも、
    bundled runtime API を通じて読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接のプロトコル smoke
    テスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix live QA レーンを実行します。
  - この QA ホストは現在 repo/dev 専用です。パッケージ化された OpenClaw インストールには
    `qa-lab` が含まれないため、`openclaw qa` は公開されません。
  - repo checkout では bundled runner を直接読み込みます。別個の Plugin インストール
    手順は不要です。
  - 3 つの一時 Matrix ユーザー（`driver`、`sut`、`observer`）と 1 つのプライベートルームを用意し、
    その後、実際の Matrix Plugin を SUT transport とする QA Gateway child を起動します。
  - デフォルトでは固定された安定版 Tuwunel イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。
    別のイメージをテストする必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrix では、レーンがローカルで使い捨てユーザーを用意するため、共有 credential-source フラグは公開しません。
  - Matrix QA レポート、サマリー、observed-events 成果物、および結合された stdout/stderr 出力ログを
    `.artifacts/qa-e2e/...` の下に書き込みます。
  - デフォルトで進捗を出力し、`OPENCLAW_QA_MATRIX_TIMEOUT_MS`（デフォルト 30 分）で
    ハード実行タイムアウトを強制します。cleanup は `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` で制限され、
    失敗時には回復コマンド `docker compose ... down --remove-orphans` が含まれます。
- `pnpm openclaw qa telegram`
  - env から取得した driver と SUT の Bot トークンを使い、実際の private group に対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。
    group id は数値の Telegram chat id である必要があります。
  - 共有プール済み認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使い、
    プール済み lease を使いたい場合は `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物が欲しい場合は `--allow-failures` を使用してください。
  - 同じ private group 内の異なる 2 つの Bot が必要で、SUT Bot は Telegram username を公開している必要があります。
  - 安定した Bot-to-Bot 観測のために、両方の Bot で `@BotFather` の Bot-to-Bot Communication Mode を有効にし、
    driver Bot がグループ内の Bot トラフィックを観測できることを確認してください。
  - Telegram QA レポート、サマリー、observed-messages 成果物を `.artifacts/qa-e2e/...` の下に書き込みます。
    返信シナリオには、driver 送信リクエストから観測された SUT 返信までの RTT が含まれます。

live transport レーンは 1 つの標準契約を共有するため、新しい transport が逸脱しません:

`qa-channel` は依然として広範な合成 QA スイートであり、live
transport カバレッジ matrix には含まれません。

| Lane | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix | x | x | x | x | x | x | x | x | |
| Telegram | x | | | | | | | | x |

### Convex 経由の共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、
QA lab は Convex ベースのプールから排他的 lease を取得し、その lease をレーン実行中に heartbeat し、
シャットダウン時に lease を解放します。

参照用 Convex project scaffold:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例 `https://your-deployment.convex.site`）
- 選択した role 用の secret 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報 role 選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

オプション環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（オプションの trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用してください。

maintainer 用管理コマンド（pool add/remove/list）には、
特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer 向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live 実行前に `doctor` を使用して、Convex site URL、broker secrets、
endpoint prefix、HTTP timeout、admin/list 到達性を secret 値を表示せずに確認してください。
スクリプトや CI utilities で機械可読な出力が必要な場合は `--json` を使用してください。

デフォルト endpoint 契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

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
  - アクティブ lease ガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer secret のみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind のペイロード形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正な payload を拒否します。

### QA にチャネルを追加する

Markdown QA システムにチャネルを追加するには、必要なものは正確に 2 つです:

1. そのチャネル用の transport adapter。
2. そのチャネル契約を検証する scenario pack。

共有 `qa-lab` ホストがフローを担える場合は、新しいトップレベル QA コマンド root を追加しないでください。

`qa-lab` は共有ホストの仕組みを担当します:

- `openclaw qa` コマンド root
- スイートの起動と終了処理
- worker 並行数
- 成果物の書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

runner Plugin は transport 契約を担当します:

- `openclaw qa <runner>` を共有 `qa` root の下にどうマウントするか
- その transport 向けに Gateway をどう設定するか
- 準備完了をどう確認するか
- 受信イベントをどう注入するか
- 送信メッセージをどう観測するか
- transcript と正規化された transport state をどう公開するか
- transport バックのアクションをどう実行するか
- transport 固有の reset または cleanup をどう扱うか

新しいチャネルの最小採用基準は次のとおりです:

1. 共有 `qa` root の所有者は `qa-lab` のままにする。
2. transport runner を共有 `qa-lab` ホスト境界で実装する。
3. transport 固有の仕組みは runner Plugin またはチャネルハーネス内に保つ。
4. 競合する root コマンドを登録するのではなく、runner を `openclaw qa <runner>` としてマウントする。
   runner Plugin は `openclaw.plugin.json` に `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列を export する必要があります。
   `runtime-api.ts` は軽量に保ち、lazy CLI と runner 実行は別々の entrypoint の背後に置いてください。
5. テーマ別の `qa/scenarios/` ディレクトリ配下に markdown シナリオを作成または適応する。
6. 新しいシナリオでは汎用シナリオヘルパーを使用する。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを維持する。

判断ルールは厳格です:

- 動作を `qa-lab` で一度だけ表現できるなら、`qa-lab` に置く。
- 動作が 1 つのチャネル transport に依存するなら、その runner Plugin または Plugin ハーネス内に保つ。
- シナリオが複数チャネルで使える新しい capability を必要とするなら、`suite.ts` にチャネル固有の分岐を入れる代わりに汎用ヘルパーを追加する。
- 動作が 1 つの transport にしか意味を持たないなら、そのシナリオは transport 固有のままにし、scenario 契約内でそれを明示する。

新しいシナリオ向けの推奨汎用ヘルパー名は次のとおりです:

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

既存シナリオ向けには、互換エイリアスも引き続き利用可能です。たとえば:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいチャネル作業では、汎用ヘルパー名を使用してください。
互換エイリアスは、一斉移行を避けるために存在しているのであって、
新しいシナリオ作成のモデルではありません。

## テストスイート（どこで何が走るか）

スイートは「現実性が増していくもの」（そして不安定さ/コストも増していくもの）として考えてください:

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- Config: 対象未指定の実行では `vitest.full-*.config.ts` shard セットを使用し、並列スケジューリングのために multi-project shard を per-project config に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` の core/unit 在庫と、`vitest.unit.config.ts` が対象にする許可済み `ui` node テスト
- スコープ:
  - 純粋な unit テスト
  - インプロセス integration テスト（Gateway auth、ルーティング、Tooling、パース、config）
  - 既知バグに対する決定的な回帰テスト
- 期待事項:
  - CI で実行される
  - 実キー不要
  - 高速かつ安定しているべき

<AccordionGroup>
  <Accordion title="プロジェクト、shard、スコープ付きレーン">

    - 対象未指定の `pnpm test` は、巨大な単一ネイティブルートプロセスの代わりに 12 個の小さな shard config（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS を削減し、auto-reply/extension 作業が無関係なスイートを飢えさせるのを防ぎます。
    - `pnpm test --watch` は、multi-shard watch ループが現実的ではないため、引き続きネイティブルート `vitest.config.ts` project graph を使用します。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリ対象を最初に scoped lane 経由でルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` では、完全なルートプロジェクト起動コストを払わずに済みます。
    - `pnpm test:changed` は、差分がルーティング可能な source/test ファイルのみに触れている場合、変更された git パスを同じ scoped lane に展開します。config/setup 編集は引き続き広範なルートプロジェクト再実行にフォールバックします。
    - `pnpm check:changed` は、狭い作業に対する通常のスマートローカルゲートです。差分を core、core tests、extensions、extension tests、apps、docs、release metadata、tooling に分類し、一致する typecheck/lint/test lane を実行します。公開 Plugin SDK と plugin-contract の変更には、extensions がこれらの core 契約に依存しているため、1 回の extension 検証パスが含まれます。release metadata のみの version bump では、トップレベル version フィールド以外のパッケージ変更を拒否するガード付きで、完全スイートではなく対象を絞った version/config/root-dependency チェックを実行します。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk` などの純粋な utility 領域にある import-light な unit テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` lane 経由でルーティングされます。stateful/runtime-heavy なファイルは既存 lane のままです。
    - 選択された `plugin-sdk` と `commands` helper source ファイルも、changed-mode 実行をこれらの軽量 lane 内の明示的な sibling test にマップするため、helper 編集時にそのディレクトリ全体の重いスイートを再実行せずに済みます。
    - `auto-reply` には 3 つの専用バケットがあります: トップレベル core helper、トップレベル `reply.*` integration test、そして `src/auto-reply/reply/**` サブツリー。これにより、最も重い reply harness 作業を、軽量な status/chunk/token テストから分離します。

  </Accordion>

  <Accordion title="埋め込み runner カバレッジ">

    - message-Tool の discovery 入力や Compaction ランタイム
      コンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化の境界に対して、焦点を絞った helper 回帰テストを追加してください。
    - 埋め込み runner integration スイートを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き ID と Compaction 動作が依然として
      実際の `run.ts` / `compact.ts` パスを通って流れることを検証します。helper のみのテストは、
      これらの integration パスの十分な代替ではありません。

  </Accordion>

  <Accordion title="Vitest pool と分離のデフォルト">

    - ベース Vitest config のデフォルトは `threads` です。
    - 共有 Vitest config では `isolate: false` を固定し、
      非分離 runner をルートプロジェクト、e2e、live config 全体で使用します。
    - ルート UI lane は `jsdom` setup と optimizer を維持しますが、
      これも共有の非分離 runner 上で動作します。
    - 各 `pnpm test` shard は、共有 Vitest config から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、巨大なローカル実行時の V8 compile churn を減らすため、
      デフォルトで Vitest child Node process に `--no-maglev` を追加します。
      stock V8 動作と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、差分がどのアーキテクチャ lane をトリガーするかを表示します。
    - pre-commit hook は formatting のみです。整形済みファイルを再ステージし、
      lint、typecheck、テストは実行しません。
    - handoff や push の前にスマートローカルゲートが必要な場合は、
      `pnpm check:changed` を明示的に実行してください。公開 Plugin SDK と plugin-contract
      の変更には 1 回の extension 検証パスが含まれます。
    - `pnpm test:changed` は、変更パスがより小さなスイートにきれいにマップできる場合、
      scoped lane を経由してルーティングします。
    - `pnpm test:max` と `pnpm test:changed:max` も同じルーティング
      動作を維持しつつ、worker 上限が高くなります。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストの load average が
      すでに高い場合は抑制されるため、複数の同時 Vitest 実行でもデフォルトで被害を抑えます。
    - ベース Vitest config は、テスト配線が変わったときに changed-mode 再実行が正しく保たれるよう、
      project/config ファイルを `forceRerunTriggers` としてマークします。
    - config は、対応ホスト上では `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効のまま維持します。
      直接プロファイリング用に明示的な 1 つのキャッシュ場所を使いたい場合は
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスデバッグ">

    - `pnpm test:perf:imports` は、Vitest の import-duration レポートに加えて
      import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリング表示を
      `origin/main` 以降に変更されたファイルへと絞ります。
    - ある hot test が依然として起動 import に大半の時間を費やしている場合は、
      重い依存関係を狭いローカル `*.runtime.ts` 境界の背後に置き、
      `vi.mock(...)` に渡すだけのために runtime helper を深く import するのではなく、
      その境界を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、ルーティングされた
      `test:changed` を、そのコミット差分に対するネイティブルートプロジェクト経路と比較し、
      wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を
      `scripts/test-projects.mjs` とルート Vitest config 経由でルーティングすることで、
      現在の dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッド向けの
      main-thread CPU profile を書き出します。
    - `pnpm test:perf:profile:runner` は、unit スイートに対して file parallelism を無効にした
      runner CPU+heap profile を書き出します。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - デフォルトで diagnostics を有効にした実際の loopback Gateway を起動
  - 診断イベントパスを通じて、合成 Gateway メッセージ、メモリ、大きなペイロードの churn を駆動
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせ
  - 診断安定性バンドル永続化 helper をカバー
  - recorder が境界内に収まり、合成 RSS サンプルが pressure budget を下回り、セッションごとの queue depth が 0 に戻ることを検証
- 期待事項:
  - CI セーフかつキー不要
  - 安定性回帰のフォローアップ向けの狭い lane であり、完全な Gateway スイートの代替ではない

### E2E（Gateway smoke）

- コマンド: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-Plugin E2E テスト
- ランタイムデフォルト:
  - リポジトリの他部分と同じく、Vitest の `threads` と `isolate: false` を使用。
  - 適応的 worker を使用（CI: 最大 2、ローカル: デフォルト 1）。
  - コンソール I/O オーバーヘッド削減のため、デフォルトで silent mode で実行。
- 便利な上書き:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細なコンソール出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - 複数インスタンス Gateway の end-to-end 動作
  - WebSocket/HTTP サーフェス、Node ペアリング、より重いネットワーキング
- 期待事項:
  - CI で実行される（パイプラインで有効な場合）
  - 実キー不要
  - unit テストより可動部が多い（遅くなることがある）

### E2E: OpenShell バックエンド smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - ホスト上で Docker 経由の分離された OpenShell Gateway を起動
  - 一時的なローカル Dockerfile から sandbox を作成
  - 実際の `sandbox ssh-config` + SSH exec 経由で OpenClaw の OpenShell バックエンドを実行
  - sandbox fs bridge を通じて remote-canonical な filesystem 動作を検証
- 期待事項:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカル `openshell` CLI と動作する Docker daemon が必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト用 Gateway と sandbox を破棄
- 便利な上書き:
  - より広い e2e スイートを手動実行するときにこのテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実プロバイダー + 実モデル）

- コマンド: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の bundled-Plugin live テスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実認証情報で _今日_ 実際に動くか？」
  - プロバイダー形式変更、Tool 呼び出しの癖、認証問題、レート制限動作を検出
- 期待事項:
  - 設計上 CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - コストがかかる / レート制限を消費する
  - 「全部」より、対象を絞ったサブセット実行を推奨
- live 実行では、足りない API キーを拾うために `~/.profile` を読み込みます。
- デフォルトでは、live 実行でも `HOME` を分離し、config/auth material を一時テスト home にコピーするため、unit fixture が実際の `~/.openclaw` を変更できません。
- live テストに実際の home directory を意図的に使わせる必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードがデフォルトです。`[live] ...` 進捗出力は維持されますが、余分な `~/.profile` 通知と Gateway bootstrap ログ/Bonjour chatter は抑制されます。完全な起動ログに戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション（プロバイダーごと）: カンマ/セミコロン形式の `*_API_KEYS` または `*_API_KEY_1`、`*_API_KEY_2`（例 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、live ごとの上書きとして `OPENCLAW_LIVE_*_KEY` を使用してください。テストはレート制限応答時に再試行します。
- 進捗/heartbeat 出力:
  - live スイートは、Vitest のコンソールキャプチャが静かでも長いプロバイダー呼び出しが動作中であることが見えるよう、stderr に進捗行を出力します。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にするため、プロバイダー/Gateway の進捗行は live 実行中に即座にストリームされます。
  - direct-model heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/probe heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この判断表を使ってください:

- ロジック/テストを編集する: `pnpm test` を実行（大きく変更したなら `pnpm test:coverage` も）
- Gateway networking / WS protocol / pairing に触れる: `pnpm test:e2e` も追加
- 「bot が落ちている」/ プロバイダー固有障害 / Tool 呼び出しをデバッグする: 絞り込んだ `pnpm test:live` を実行

## Live（ネットワークに触れる）テスト

live model matrix、CLI backend smoke、ACP smoke、Codex app-server
harness、そしてすべての media-provider live テスト（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）— plus live 実行の credential handling — については、
[Testing — live suites](/ja-JP/help/testing-live) を参照してください。

## Docker ランナー（オプションの「Linux で動くか」チェック）

これらの Docker ランナーは 2 つのバケットに分かれます:

- live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、それぞれ対応する profile-key live ファイルのみを repo Docker イメージ内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカル config dir と workspace をマウントし（マウントされていれば `~/.profile` も読み込みます）。対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、完全な Docker sweep を実用的に保つため、デフォルトで小さめの smoke cap を使います:
  `test:docker:live-models` のデフォルトは `OPENCLAW_LIVE_MAX_MODELS=12`、そして
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大きな完全走査を明示的に望む場合は、これらの env var を上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` で live Docker イメージを 1 回ビルドし、その後 live Docker レーンで再利用します。また、`test:docker:e2e-build` で 1 つの共有 `scripts/e2e/Dockerfile` イメージもビルドし、それを built app を実行する E2E container smoke ランナーで再利用します。集約実行では重み付きローカルスケジューラーを使用します。`OPENCLAW_DOCKER_ALL_PARALLELISM` がプロセススロット数を制御し、リソース上限により重い live、npm-install、multi-service レーンが同時にすべて起動しないようにします。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。Docker ホストに十分な余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整してください。ランナーはデフォルトで Docker preflight を実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを表示し、成功したレーンの所要時間を `.artifacts/docker-tests/lane-timings.json` に保存し、その時間を使って後続実行では長いレーンから先に開始します。ビルドや Docker 実行をせずに重み付きレーン manifest だけを表示するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用してください。
- container smoke ランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:config-reload` は、1 個以上の実コンテナを起動し、より高レベルの integration path を検証します。

live-model Docker ランナーは、必要な CLI auth home のみ（実行が絞られていない場合はサポート対象すべて）を bind-mount し、その後、実行前にそれらをコンテナ home にコピーします。これにより、external-CLI OAuth がホスト auth store を変更せずにトークン更新できるようにしています:

- Direct models: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`。デフォルトで Claude、Codex、Gemini をカバーし、厳格な OpenCode カバレッジには `pnpm test:docker:live-acp-bind:opencode` を使用）
- CLI backend smoke: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全 scaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` は、pack した OpenClaw tarball を Docker 内でグローバルインストールし、env-ref オンボーディングで OpenAI を設定し、デフォルトで Telegram も設定し、doctor が有効化された Plugin ランタイム依存関係を修復することを検証し、その後 mocked OpenAI agent turn を 1 回実行します。事前ビルド済み tarball を再利用するには `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、チャネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用してください。
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` は現在ツリーを pack し、分離された home 内で `bun install -g` でインストールし、`openclaw infer image providers --json` がハングせず bundled image provider を返すことを検証します。事前ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使用してください。
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm コンテナ全体で 1 つの npm cache を共有します。update smoke は、candidate tarball へアップグレードする前の stable baseline として npm `latest` をデフォルトで使用します。非 root installer チェックでは、root 所有 cache エントリが user-local install 動作を隠さないよう、分離された npm cache を維持します。ローカル再実行間で root/update/direct-npm cache を再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定してください。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により重複する direct-npm global update をスキップします。直接 `npm install -g` カバレッジが必要な場合は、この env を付けずにローカルでスクリプトを実行してください。
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace`（スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）は、デフォルトで root Dockerfile イメージをビルドし、分離されたコンテナ home に 1 つの workspace を共有する 2 つの agent を投入し、`agents delete --json` を実行し、有効な JSON と workspace 保持動作を検証します。install-smoke イメージを再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使用してください。
- Gateway networking（2 コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses web_search minimal reasoning 回帰テスト: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、mocked OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後、プロバイダースキーマ拒否を強制して raw detail が Gateway ログに出ることを確認します。
- MCP channel bridge（投入済み Gateway + stdio bridge + raw Claude notification-frame smoke）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（実際の stdio MCP サーバー + 埋め込み Pi profile allow/deny smoke）: `pnpm test:docker:pi-bundle-mcp-tools`（スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（実 Gateway + stdio MCP child teardown。分離 cron と one-shot subagent 実行後）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（install smoke + `/plugin` エイリアス + Claude-bundle restart semantics）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Config reload metadata smoke: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- Bundled Plugin ランタイム依存関係: `pnpm test:docker:bundled-channel-deps` は、デフォルトで小さな Docker ランナーイメージをビルドし、ホスト上で OpenClaw を 1 回ビルド・pack し、その tarball を各 Linux install シナリオにマウントします。イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`、新しいローカルビルド後のホスト再ビルドをスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`、既存 tarball を指定するには `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使ってください。完全 Docker 集約では、この tarball を 1 回だけ事前 pack し、その後 bundled channel チェックを独立レーンに shard します。これには Telegram、Discord、Slack、Feishu、memory-lancedb、ACPX 用の個別 update レーンも含まれます。bundled レーンを直接実行する際にチャネル matrix を絞るには `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`、update シナリオを絞るには `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` を使用してください。このレーンはさらに、`channels.<id>.enabled=false` と `plugins.entries.<id>.enabled=false` が doctor/ランタイム依存関係修復を抑止することも検証します。
- 反復中に bundled Plugin ランタイム依存関係を絞るには、無関係なシナリオを無効化してください。例:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

共有 built-app イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合に引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルになければ pull します。QR と installer の Docker テストは、共有 built-app ランタイムではなく package/install 動作を検証するため、独自の Dockerfile を維持します。

live-model Docker ランナーは、現在の checkout も読み取り専用で bind-mount し、
コンテナ内の一時 workdir に staging します。これにより、ランタイム
イメージはスリムなまま、Vitest は正確なローカル source/config に対して実行されます。
staging 手順では、大きなローカル専用 cache や app build 出力、
たとえば `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、app ローカルの `.build` や
Gradle 出力ディレクトリをスキップするため、Docker live 実行が
マシン固有の成果物をコピーするのに何分も費やすことがありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、gateway live probe は
コンテナ内で実際の Telegram/Discord などの channel worker を起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
その Docker レーンで gateway
live カバレッジを絞る、または除外する必要がある場合は、`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性 smoke です。OpenAI 互換 HTTP エンドポイントを有効化した
OpenClaw Gateway コンテナを起動し、その Gateway に対して固定版 Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開することを確認し、
その後 Open WebUI の `/api/chat/completions` プロキシを通して実際のチャットリクエストを送信します。
初回実行は目立って遅くなることがあります。Docker が
Open WebUI イメージを pull する必要があるかもしれず、Open WebUI 自身も
コールドスタート設定を完了する必要があるためです。
このレーンは使用可能な live model key を前提とし、`OPENCLAW_PROFILE_FILE`
（デフォルトでは `~/.profile`）が、Docker 化された実行でそれを提供する主な方法です。
成功した実行では `{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON payload が出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、または iMessage アカウントは不要です。投入済み Gateway
コンテナを起動し、`openclaw mcp serve` を起動する 2 つ目のコンテナを立ち上げ、
その後、ルーティングされた会話 discovery、transcript 読み取り、attachment metadata、
live event queue 動作、outbound send ルーティング、そして Claude 風の channel +
permission 通知を、実際の stdio MCP bridge 上で検証します。通知チェックでは
raw stdio MCP フレームを直接検査するため、この smoke は
特定の client SDK がたまたま表面化するものではなく、bridge が実際に出力するものを検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、live
model key は不要です。repo Docker イメージをビルドし、コンテナ内で実際の stdio MCP probe server を起動し、
その server を埋め込み Pi bundle
MCP ランタイム経由で実体化し、Tool を実行し、その後 `coding` と `messaging` が
`bundle-mcp` Tool を保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルタすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、live model
key は不要です。実際の stdio MCP probe server を持つ投入済み Gateway を起動し、
分離 cron turn と `/subagents spawn` の one-shot child turn を実行し、
各実行後に MCP child process が終了することを検証します。

手動 ACP plain-language thread smoke（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に保持してください。ACP thread ルーティング検証で再び必要になる可能性があるため、削除しないでください。

便利な env var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、`OPENCLAW_PROFILE_FILE` から source された env var のみを検証します。この場合、一時 config/workspace dir を使い、外部 CLI auth マウントは行いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内で cache された CLI install 用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI auth dir/file は `/host-auth...` の下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` へコピーされます
  - デフォルト dir: `.minimax`
  - デフォルト file: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推測された必要な dir/file のみをマウントします
  - 手動で上書きするには `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストを使用してください
- 実行を絞るには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内でプロバイダーをフィルタするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルドが不要な再実行で既存 `openclaw:local-live` イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報が profile store 由来であること（env ではないこと）を保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke 向けに Gateway が公開するモデルを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke で使う nonce-check プロンプトを上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定版 Open WebUI イメージタグを上書きするには `OPENWEBUI_IMAGE=...`

## Docs サニティ

ドキュメント編集後は docs チェックを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は完全な Mintlify アンカー検証を実行してください: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI セーフ）

これらは、実際のプロバイダーなしでの「実パイプライン」回帰です:

- Gateway Tool 呼び出し（mock OpenAI、実 Gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: 「runs a mock OpenAI tool call end-to-end via gateway agent loop」）
- Gateway wizard（WS `wizard.start`/`wizard.next`、config 書き込み + auth 強制）: `src/gateway/gateway.test.ts`（ケース: 「runs wizard over ws and writes auth token config」）

## エージェント信頼性 evals（Skills）

すでにいくつかの CI セーフなテストがあり、これは「エージェント信頼性 evals」のように振る舞います:

- 実 Gateway + agent loop を通じた mock Tool 呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と config 効果を検証する end-to-end wizard フロー（`src/gateway/gateway.test.ts`）。

Skills 向けにまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **Decisioning:** プロンプトに Skills が一覧表示されているとき、エージェントは正しい Skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に `SKILL.md` を読み、要求された手順/引数に従うか？
- **Workflow contracts:** Tool 順序、セッション履歴の引き継ぎ、sandbox 境界を検証するマルチターンシナリオ。

将来の evals も、まずは決定的であるべきです:

- mock provider を使用して Tool 呼び出し + 順序、Skill ファイル読み取り、セッション配線を検証するシナリオランナー。
- Skill に焦点を当てた小さなシナリオスイート（使う vs 避ける、ゲーティング、プロンプトインジェクション）。
- CI セーフなスイートが整ってからのみ、オプションの live evals（opt-in、env-gated）。

## 契約テスト（Plugin とチャネル形状）

契約テストは、登録されたすべての Plugin とチャネルがその
インターフェース契約に準拠していることを検証します。検出されたすべての Plugin を反復し、
形状と動作に関する検証スイートを実行します。デフォルトの `pnpm test` unit レーンは、
これらの共有 seam と smoke ファイルを意図的にスキップします。共有チャネルまたは provider サーフェスに触れた場合は、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- provider 契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本 Plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング動作
- **outbound-payload** - メッセージ payload 構造
- **inbound** - 受信メッセージ処理
- **actions** - チャネル action handler
- **threading** - thread ID 処理
- **directory** - Directory/roster API
- **group-policy** - グループポリシー強制

### Provider ステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータス probe
- **registry** - Plugin registry 形状

### Provider 契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証選択/選択肢
- **catalog** - モデルカタログ API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - provider ランタイム
- **shape** - Plugin 形状/インターフェース
- **wizard** - セットアップウィザード

### 実行すべきタイミング

- plugin-sdk export または subpath を変更した後
- チャネルまたは provider Plugin を追加または変更した後
- Plugin 登録または discovery をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## 回帰の追加（ガイダンス）

live で発見された provider/model 問題を修正したとき:

- 可能なら CI セーフな回帰を追加してください（mock/stub provider、または正確なリクエスト形状変換をキャプチャ）
- 本質的に live 専用（レート制限、認証ポリシー）なら、live テストは狭く保ち、env var で opt-in にしてください
- バグを捉える最小レイヤーを対象にすることを優先してください:
  - provider のリクエスト変換/リプレイのバグ → direct models テスト
  - Gateway の session/history/Tool pipeline バグ → Gateway live smoke または CI セーフな Gateway mock テスト
- SecretRef traversal ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとに 1 つのサンプル対象を導出し、その後 traversal-segment exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef 対象ファミリーを追加した場合は、そのテストの `classifyTargetClass` を更新してください。このテストは未分類の対象 id で意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。

## 関連

- [Testing live](/ja-JP/help/testing-live)
- [CI](/ja-JP/ci)
