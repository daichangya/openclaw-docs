---
read_when:
    - ローカルまたは CI でのテスト実行
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェント動作のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-04-23T04:46:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f965b3d818730c7c58125a29f7cc2508a45aba6c7534b7f13755380dedcef66
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、少数の Docker ランナーがあります。

このドキュメントは「OpenClaw でどのようにテストするか」のガイドです。

- 各スイートが何をカバーするか（そして意図的に何を _カバーしない_ か）
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド
- live テストがどのように認証情報を見つけ、モデル/プロバイダーを選択するか
- 実際のモデル/プロバイダー問題に対する回帰テストの追加方法

## クイックスタート

ほとんどの日は次のとおりです。

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は extension/channel パスも対象になりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復対応しているときは、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに手を加えたとき、または追加の確信がほしいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルだけを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimi のコストスモーク: `MOONSHOT_API_KEY` を設定したうえで、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、
  アシスタントの transcript に正規化された `usage.cost` が保存されていることを確認してください。

ヒント: 失敗している 1 ケースだけが必要な場合は、以下で説明する allowlist 環境変数を使って live テストを絞り込むことを優先してください。

## QA 専用ランナー

これらのコマンドは、QA-lab による現実的な検証が必要なときに、主要なテストスイートと並んで使います。

- `pnpm openclaw qa suite`
  - リポジトリベースの QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された Gateway ワーカーで複数の選択済みシナリオを並列実行します。`qa-channel` のデフォルト並列数は 4 です（選択したシナリオ数の範囲内で制限）。ワーカー数を調整するには `--concurrency <count>` を使い、旧来の直列レーンにするには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物がほしい場合は `--allow-failures` を使ってください。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、シナリオ対応の `mock-openai` レーンを置き換えることなく、実験的な fixture とプロトコルモックのカバレッジのためにローカルの AIMock ベースプロバイダーサーバーを起動します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的なサポート対象の QA 認証入力を転送します:
    env ベースのプロバイダーキー、QA live プロバイダー設定パス、存在する場合は `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるよう、リポジトリルート配下に置く必要があります。
  - 通常の QA レポート + サマリーに加えて、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業向けに Docker ベースの QA サイトを起動します。
- `pnpm test:docker:bundled-channel-deps`
  - 現在の OpenClaw ビルドを Docker で pack と install し、OpenAI を設定した Gateway を起動したうえで、config 編集によりバンドル済み channel/plugins を有効化します。
  - セットアップ検出で未設定 plugin の実行時依存関係が存在しない状態のままになること、最初の設定済み Gateway または doctor 実行で各バンドル済み plugin の実行時依存関係がオンデマンドでインストールされること、2 回目の再起動ではすでに有効化済みの依存関係が再インストールされないことを検証します。
  - さらに、既知の古い npm ベースラインをインストールし、Telegram を有効化したうえで `openclaw update --tag <candidate>` を実行し、candidate の post-update doctor がハーネス側の postinstall 修復なしでバンドル済み channel の実行時依存関係を修復することを検証します。
- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix live QA レーンを実行します。
  - この QA ホストは現時点では repo/dev 専用です。パッケージ化された OpenClaw インストールには `qa-lab` は同梱されないため、`openclaw qa` は公開されません。
  - リポジトリチェックアウトでは、バンドル済みランナーを直接読み込みます。別途 plugin のインストール手順は不要です。
  - 一時的な Matrix ユーザー 3 名（`driver`、`sut`、`observer`）と 1 つのプライベートルームをプロビジョニングし、その後、実際の Matrix plugin を SUT transport として使用する QA gateway 子プロセスを起動します。
  - デフォルトでは、固定された安定版 Tuwunel イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。別のイメージをテストする必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrix では共有認証情報ソースフラグは公開されません。このレーンは一時ユーザーをローカルでプロビジョニングするためです。
  - Matrix QA レポート、サマリー、observed-events 成果物、および統合 stdout/stderr 出力ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm openclaw qa telegram`
  - env にある driver および SUT bot トークンを使って、実在するプライベートグループに対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group id は数値の Telegram chat id である必要があります。
  - 共有プール認証情報用に `--credential-source convex` をサポートします。通常は env モードを使い、プール済みリースを使う場合は `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物がほしい場合は `--allow-failures` を使ってください。
  - 同一のプライベートグループ内に 2 つの異なる bot が必要で、SUT bot は Telegram username を公開している必要があります。
  - 安定した bot 間観測のため、`@BotFather` で両 bot の Bot-to-Bot Communication Mode を有効にし、driver bot がグループ内の bot トラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、observed-messages 成果物を `.artifacts/qa-e2e/...` 配下に書き込みます。

live transport レーンは、新しい transport が逸脱しないように 1 つの標準契約を共有します。

`qa-channel` は引き続き広範な合成 QA スイートであり、live
transport カバレッジマトリクスの一部ではありません。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex による共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、QA lab は Convex ベースのプールから排他的リースを取得し、レーン実行中はそのリースに Heartbeat を送り、終了時にリースを解放します。

参照用 Convex プロジェクト雛形:

- `qa/convex-credential-broker/`

必須の env 変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロールに対応するシークレット 1 つ:
  - `maintainer` には `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` には `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

任意の env 変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使うべきです。

maintainer の管理コマンド（プール add/remove/list）には、特に
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer 向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトや CI ユーティリティで機械可読出力が必要な場合は `--json` を使ってください。

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
  - アクティブリース保護: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer シークレット専用）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正なペイロードを拒否します。

### QA にチャンネルを追加する

Markdown ベースの QA システムにチャンネルを追加するには、必要なものは正確に 2 つだけです。

1. そのチャンネル用の transport adapter。
2. そのチャンネル契約を実行する scenario pack。

共有 `qa-lab` ホストがフローを担える場合、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを担います。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカーの並列実行
- 成果物の書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ用の互換エイリアス

ランナー plugin は transport 契約を担います。

- `openclaw qa <runner>` を共有 `qa` ルート配下にどのようにマウントするか
- その transport 用に Gateway をどのように設定するか
- 準備完了をどう確認するか
- 受信イベントをどう注入するか
- 送信メッセージをどう観測するか
- transcript と正規化済み transport 状態をどう公開するか
- transport ベースのアクションをどう実行するか
- transport 固有のリセットやクリーンアップをどう扱うか

新しいチャンネル採用の最小要件は次のとおりです:

1. 共有 `qa` ルートの所有者は引き続き `qa-lab` にします。
2. transport ランナーは共有 `qa-lab` ホストの seam 上に実装します。
3. transport 固有の仕組みはランナー plugin または channel harness 内に閉じ込めます。
4. 競合するルートコマンドを登録するのではなく、ランナーは `openclaw qa <runner>` としてマウントします。
   ラナー plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列を export する必要があります。
   `runtime-api.ts` は軽量に保ってください。遅延 CLI とランナー実行は別々の entrypoint の背後に置くべきです。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で markdown シナリオを作成または調整します。
6. 新しいシナリオには汎用シナリオヘルパーを使います。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスは動作したままにします。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できるなら、`qa-lab` に置きます。
- 振る舞いが 1 つの channel transport に依存するなら、そのランナー plugin または plugin harness に置きます。
- 複数の channel で使える新しい機能がシナリオに必要なら、`suite.ts` に channel 固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- ある振る舞いが 1 つの transport でしか意味を持たないなら、そのシナリオは transport 固有のままにし、それをシナリオ契約で明示します。

新しいシナリオに推奨される汎用ヘルパー名:

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

既存シナリオ向けの互換エイリアスも引き続き利用できます。例:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しい channel の作業では、汎用ヘルパー名を使うべきです。
互換エイリアスは一斉移行を避けるために存在しているのであり、新しい
シナリオ作成のモデルではありません。

## テストスイート（どこで何が動くか）

スイートは「現実性が増していくもの」（同時に flaky さ/コストも増えるもの）と考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 既存のスコープ付き Vitest project に対する 10 個の逐次 shard 実行（`vitest.full-*.config.ts`）
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit インベントリと、`vitest.unit.config.ts` で対象になっている許可済み `ui` node テスト
- スコープ:
  - 純粋な unit テスト
  - プロセス内 integration テスト（gateway auth、routing、tooling、parsing、config）
  - 既知バグに対する決定的な回帰テスト
- 期待値:
  - CI で実行される
  - 実際のキーは不要
  - 高速で安定しているべき
- Projects に関する補足:
  - 対象指定なしの `pnpm test` は、1 つの巨大なネイティブルート project プロセスではなく、11 個のより小さな shard 設定（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピーク RSS を抑え、auto-reply/extension の作業が無関係なスイートを飢えさせるのを防ぎます。
  - `pnpm test --watch` は引き続きネイティブルート `vitest.config.ts` project graph を使用します。複数 shard の watch ループは現実的ではないためです。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的な file/directory ターゲットをまずスコープ付きレーン経由にルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ではフルルート project 起動コストを支払わずに済みます。
  - `pnpm test:changed` は、差分がルーティング可能な source/test ファイルだけに触れている場合、変更された git パスを同じスコープ付きレーンへ展開します。config/setup の編集は引き続き広いルート project 再実行へフォールバックします。
  - `pnpm check:changed` は、狭い作業に対する通常のスマートなローカルゲートです。差分を core、core tests、extensions、extension tests、apps、docs、release metadata、tooling に分類し、それに対応する typecheck/lint/test レーンを実行します。公開 Plugin SDK と plugin-contract の変更では、extensions がそれらの core 契約に依存するため extension 検証も含まれます。release metadata のみの version bump では、フルスイートの代わりに対象を絞った version/config/root-dependency チェックが走り、トップレベル version フィールド以外の package 変更を拒否するガードもあります。
  - agents、commands、plugins、auto-reply helpers、`plugin-sdk` などの純粋なユーティリティ領域の import 軽量な unit テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンにルーティングされます。状態を持つ/実行時負荷の高いファイルは既存レーンに残ります。
  - 選択された `plugin-sdk` と `commands` helper source ファイルも、変更モード実行時にはそれら軽量レーン内の明示的な sibling テストへマップされるため、helper 編集でそのディレクトリの重いフルスイート全体を再実行せずに済みます。
  - `auto-reply` には現在 3 つの専用バケットがあります: トップレベル core helpers、トップレベル `reply.*` integration テスト、そして `src/auto-reply/reply/**` サブツリーです。これにより、最も重い reply harness 作業が軽量な status/chunk/token テストに乗らないようにしています。
- Embedded runner に関する補足:
  - メッセージツール検出入力や compaction 実行時コンテキストを変更する場合、
    両方のレベルのカバレッジを維持してください。
  - 純粋な routing/normalization 境界には、焦点を絞った helper 回帰テストを追加してください。
  - さらに、embedded runner integration スイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、スコープ付き id と compaction 動作が実際の
    `run.ts` / `compact.ts` 経路を通って流れ続けることを検証します。helper のみのテストは、
    それら integration 経路の十分な代替にはなりません。
- Pool に関する補足:
  - ベースの Vitest config は現在デフォルトで `threads` です。
  - 共有 Vitest config は `isolate: false` も固定し、ルート projects、e2e、live configs 全体で非分離ランナーを使用します。
  - ルート UI レーンは `jsdom` setup と optimizer を維持しますが、現在は共有の非分離ランナーでも動作します。
  - 各 `pnpm test` shard は共有 Vitest config から同じ `threads` + `isolate: false` デフォルトを継承します。
  - 共有の `scripts/run-vitest.mjs` ランチャーは、Vitest 子 Node プロセスに対してデフォルトで `--no-maglev` も追加するようになりました。大規模なローカル実行時の V8 コンパイル負荷を減らすためです。標準の V8 動作と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- 高速ローカル反復に関する補足:
  - `pnpm changed:lanes` は、差分がどのアーキテクチャレーンを起動するかを表示します。
  - pre-commit フックは、ステージ済み format/lint の後に `pnpm check:changed --staged` を実行するため、core のみのコミットでは、公開 extension 向け契約に触れていない限り extension テストのコストを支払いません。release metadata のみのコミットは、対象を絞った version/config/root-dependency レーンに留まります。
  - `pnpm test:changed` は、変更パスがきれいに小さなスイートへマップされる場合、スコープ付きレーン経由でルーティングされます。
  - `pnpm test:max` と `pnpm test:changed:max` も同じルーティング動作ですが、worker 上限が高くなります。
  - ローカル worker の自動スケーリングは現在意図的に保守的で、ホストの load average がすでに高い場合にはさらに抑制するため、複数の Vitest 実行が同時に走ってもデフォルトでは影響が小さくなります。
  - ベースの Vitest config は projects/config ファイルを `forceRerunTriggers` としてマークしているため、テスト配線が変わったときの changed-mode 再実行も正しく保たれます。
  - config は、サポートされるホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効のままにします。直接プロファイリング用に明示的なキャッシュ場所を 1 つ使いたい場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf-debug に関する補足:
  - `pnpm test:perf:imports` は、Vitest の import 所要時間レポートと import breakdown 出力を有効にします。
  - `pnpm test:perf:imports:changed` は、同じプロファイリング表示を `origin/main` 以降で変更されたファイルに絞ります。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み差分に対するルーティング済み `test:changed` とネイティブルート project 経路を比較し、wall time と macOS max RSS を表示します。
- `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を `scripts/test-projects.mjs` とルート Vitest config に通すことで、現在の dirty tree をベンチマークします。
  - `pnpm test:perf:profile:main` は、Vitest/Vite 起動と transform オーバーヘッドの main-thread CPU profile を書き出します。
  - `pnpm test:perf:profile:runner` は、file parallelism を無効化した unit スイートの runner CPU+heap profile を書き出します。

### Stability（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - デフォルトで diagnostics 有効の実際の loopback Gateway を起動する
  - synthetic な gateway message、memory、大きな payload の churn を diagnostic event path に流し込む
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせる
  - diagnostic stability bundle の永続化 helper をカバーする
  - recorder が境界内に留まり、synthetic RSS サンプルが pressure budget を下回り、セッションごとの queue depth が 0 に戻ることを検証する
- 期待値:
  - CI で安全かつキー不要
  - stability 回帰追跡用の狭いレーンであり、フル Gateway スイートの代替ではない

### E2E（Gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 実行時デフォルト:
  - リポジトリの他と同様に、Vitest `threads` と `isolate: false` を使用します。
  - 適応型 worker を使用します（CI: 最大 2、ローカル: デフォルト 1）。
  - console I/O オーバーヘッドを減らすため、デフォルトで silent mode で実行します。
- 便利な上書き:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細な console 出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - 複数インスタンスの gateway end-to-end 動作
  - WebSocket/HTTP surface、node pairing、より重い networking
- 期待値:
  - CI で実行される（pipeline で有効な場合）
  - 実際のキーは不要
  - unit テストより可動部が多い（遅くなることがある）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell gateway を起動する
  - 一時的なローカル Dockerfile から sandbox を作成する
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを実行する
  - sandbox fs bridge を通じて remote-canonical filesystem 動作を検証する
- 期待値:
  - オプトイン専用であり、デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker daemon が必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト gateway と sandbox を破棄する
- 便利な上書き:
  - より広い e2e スイートを手動実行するときにこのテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリや wrapper script を指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live` によって **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは _今日_ 実際の認証情報で本当に動くか？」
  - プロバイダーのフォーマット変更、tool-calling の癖、認証問題、レート制限の挙動を検出する
- 期待値:
  - 設計上、CI では安定しない（実ネットワーク、実プロバイダーポリシー、クォータ、障害があるため）
  - コストがかかり / レート制限を消費する
  - 「全部」ではなく、絞り込んだサブセットの実行を優先する
- live 実行では、不足している API キーを拾うために `~/.profile` を読み込みます。
- デフォルトでは、live 実行でも `HOME` を分離し、config/auth の内容を一時的なテスト用 home にコピーするため、unit fixture が実際の `~/.openclaw` を変更することはありません。
- live テストで意図的に実際の home ディレクトリを使う必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードがデフォルトです: `[live] ...` の進行出力は維持しますが、追加の `~/.profile` 通知を抑制し、gateway 起動ログ/Bonjour の雑音をミュートします。完全な起動ログを再び表示したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション（プロバイダー固有）: `*_API_KEYS` をカンマ/セミコロン形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2` を設定します（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）。または live 専用の上書きとして `OPENCLAW_LIVE_*_KEY` を使います。テストはレート制限応答時に再試行します。
- 進行/Heartbeat 出力:
  - live スイートは現在、長時間のプロバイダー呼び出しが Vitest の console capture が静かな場合でも活動中であることが分かるよう、進行行を stderr に出力します。
  - `vitest.live.config.ts` は Vitest の console interception を無効にしているため、プロバイダー/gateway の進行行は live 実行中すぐにストリームされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe の Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この判断表を使ってください。

- ロジック/テストを編集している: `pnpm test` を実行（大きく変更したなら `pnpm test:coverage` も）
- gateway networking / WS protocol / pairing に触れた: `pnpm test:e2e` を追加
- 「bot が落ちている」問題 / プロバイダー固有の失敗 / tool calling をデバッグしている: 絞り込んだ `pnpm test:live` を実行

## Live: Android Node capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済み Android Node が**現在公開しているすべてのコマンド**を呼び出し、コマンド契約の挙動を検証する。
- スコープ:
  - 前提条件あり/手動セットアップ前提（このスイートはアプリのインストール/起動/ペアリングを行いません）。
  - 選択した Android Node に対するコマンド単位の gateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - Android アプリがすでに gateway に接続済みかつペアリング済みであること。
  - アプリをフォアグラウンドに維持すること。
  - 成功させたい capability に必要な権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## Live: model smoke（profile キー）

live テストは、失敗を切り分けられるように 2 層に分かれています。

- 「Direct model」は、そのキーでプロバイダー/モデルが少なくとも応答できるかを示します。
- 「Gateway smoke」は、そのモデルで完全な gateway+agent パイプライン（sessions、history、tools、sandbox policy など）が動作するかを示します。

### レイヤー 1: 直接モデル completion（gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 発見されたモデルを列挙する
  - `getApiKeyForModel` を使って認証情報を持つモデルを選ぶ
  - 各モデルに小さな completion を実行する（必要に応じて対象回帰も）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に動かすには `OPENCLAW_LIVE_MODELS=modern`（または `all`、`modern` の別名）を設定します。そうしないと、`pnpm test:live` を gateway smoke に集中させるためスキップされます。
- モデルの選び方:
  - モダン allowlist を実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` はモダン allowlist の別名
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切りの allowlist）
  - modern/all sweep では、デフォルトで厳選された高シグナル上限が適用されます。modern の完全 sweep にするには `OPENCLAW_LIVE_MAX_MODELS=0`、小さめの上限を指定するには正の数を設定します。
- プロバイダーの選び方:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りの allowlist）
- キーの取得元:
  - デフォルト: profile store と env フォールバック
  - **profile store** のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- この仕組みの理由:
  - 「プロバイダー API が壊れている / キーが無効」と「gateway agent パイプラインが壊れている」を分離する
  - 小さく分離された回帰を収容する（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent smoke（`"@openclaw"` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内 gateway を起動する
  - `agent:dev:*` セッションを作成/patch する（実行ごとの model override）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」応答（tools なし）
    - 実際の tool invocation が動作する（read probe）
    - 任意の追加 tool probe（exec+read probe）
    - OpenAI の回帰経路（tool-call-only → follow-up）が動作し続ける
- Probe の詳細（失敗をすぐ説明できるように）:
  - `read` probe: テストは workspace に nonce ファイルを書き込み、agent にそれを `read` して nonce をそのまま返すよう依頼します。
  - `exec+read` probe: テストは agent に、temp ファイルへ nonce を `exec` で書き込み、その後それを `read` で読み返すよう依頼します。
  - image probe: テストは生成した PNG（cat + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選び方:
  - デフォルト: モダン allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はモダン allowlist の別名
  - または、絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定
  - modern/all gateway sweep では、デフォルトで厳選された高シグナル上限が適用されます。modern の完全 sweep にするには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`、小さめの上限を指定するには正の数を設定します。
- プロバイダーの選び方（「OpenRouter の全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りの allowlist）
- この live テストでは、tool + image probe は常時有効です:
  - `read` probe + `exec+read` probe`（tool ストレス）
  - モデルが image input 対応を公開している場合は image probe を実行
  - フロー（高レベル）:
    - テストは「CAT」+ ランダムコードの小さな PNG を生成する（`src/gateway/live-image-probe.ts`）
    - これを `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` で送る
    - Gateway は添付を `images[]` に解析する（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agent は multimodal な user message をモデルへ転送する
    - 検証: 返信に `cat` + そのコードが含まれること（OCR の許容: 小さな誤りは許す）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` id）を確認するには、次を実行してください。
__OC_I18N_900001__
## Live: CLI backend smoke（Claude、Codex、Gemini、または他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカル CLI backend を使って Gateway + agent パイプラインを検証する。
- backend 固有の smoke デフォルトは、所有する extension の `cli-backend.ts` 定義内にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトの provider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image の挙動は、所有する CLI backend plugin の metadata から取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトへ注入されます）。
  - 画像ファイルパスをプロンプト注入ではなく CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されているときの画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 回目のターンを送って resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - デフォルトの Claude Sonnet -> Opus 同一セッション継続 probe を無効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択したモデルが switch target をサポートしているときに強制有効化するには `1`）。

例:
__OC_I18N_900002__
Docker レシピ:
__OC_I18N_900003__
単一プロバイダーの Docker レシピ:
__OC_I18N_900004__
注意:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これは、リポジトリ Docker イメージ内で live CLI-backend smoke を非 root の `node` ユーザーとして実行します。
- 所有する extension から CLI smoke metadata を解決し、その後、対応する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）のキャッシュ可能で書き込み可能な prefix にインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`~/.claude/.credentials.json` の `claudeAiOauth.subscriptionType`、または `claude setup-token` による `CLAUDE_CODE_OAUTH_TOKEN` を通じたポータブルな Claude Code subscription OAuth が必要です。これはまず Docker 内で直接 `claude -p` を実証し、その後、Anthropic API-key env vars を保持せずに 2 回の Gateway CLI-backend ターンを実行します。この subscription レーンでは、Claude が現在サードパーティアプリ利用を通常の subscription プラン上限ではなく追加利用課金へルーティングするため、Claude MCP/tool と image probe はデフォルトで無効化されます。
- live CLI-backend smoke は現在、Claude、Codex、Gemini で同じ end-to-end フローを実行します: テキストターン、画像分類ターン、その後 gateway CLI 経由で検証される MCP `cron` tool call。
- Claude のデフォルト smoke では、セッションを Sonnet から Opus に patch し、resume されたセッションが以前のメモをまだ覚えていることも検証します。

## Live: ACP bind smoke（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACP agent を使った実際の ACP 会話 bind フローを検証する:
  - `/acp spawn <agent> --bind here` を送る
  - 合成された message-channel conversation をその場で bind する
  - その同じ conversation 上で通常の follow-up を送る
  - follow-up が bind 済み ACP session transcript に到達することを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP agent: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP agent: `claude`
  - 合成 channel: Slack DM 形式の conversation context
  - ACP backend: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- 注意:
  - このレーンは gateway の `chat.send` surface を使い、管理者専用の合成 originating-route フィールドを通して、外部配信を装わずに message-channel context をテストへ付与します。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定のとき、テストは選択された ACP harness agent に対して、組み込み `acpx` plugin の内蔵 agent registry を使用します。

例:
__OC_I18N_900005__
Docker レシピ:
__OC_I18N_900006__
単一 agent の Docker レシピ:
__OC_I18N_900007__
Docker に関する注意:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされるすべての live CLI agent に対して ACP bind smoke を順番に実行します: `claude`、`codex`、`gemini`。
- マトリクスを絞るには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使います。
- これは `~/.profile` を読み込み、一致する CLI auth 情報をコンテナへステージし、書き込み可能な npm prefix に `acpx` をインストールし、その後、必要であれば要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）をインストールします。
- Docker 内では、ランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定するため、acpx は読み込まれた profile 由来の provider env vars を子 harness CLI でも利用できます。

## Live: Codex app-server harness smoke

- 目的: plugin 所有の Codex harness を通常の gateway
  `agent` メソッド経由で検証する:
  - バンドル済み `codex` plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - `codex/gpt-5.4` へ最初の gateway agent turn を送る
  - 同じ OpenClaw session に 2 回目の turn を送り、app-server
    thread が resume できることを検証する
  - 同じ gateway command
    経路で `/codex status` と `/codex models` を実行する
  - 任意で、Guardian レビュー付きの昇格 shell probe を 2 つ実行する: 承認されるべき無害な
    コマンド 1 つと、拒否されて agent が確認を返すべき
    偽のシークレットアップロード 1 つ
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `codex/gpt-5.4`
- 任意の image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- この smoke は `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  harness が黙って PI にフォールバックして通過することはありません。
- 認証: shell/profile の `OPENAI_API_KEY` に加え、必要に応じてコピーされた
  `~/.codex/auth.json` と `~/.codex/config.toml`

ローカルレシピ:
__OC_I18N_900008__
Docker レシピ:
__OC_I18N_900009__
Docker に関する注意:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- これは、マウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在すれば Codex CLI
  の auth ファイルをコピーし、書き込み可能でマウントされた npm
  prefix に `@openai/codex` をインストールし、ソースツリーをステージしたうえで、Codex-harness live テストだけを実行します。
- Docker では image、MCP/tool、Guardian probe がデフォルトで有効です。より絞ったデバッグ
  実行が必要な場合は `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`、または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定してください。
- Docker でも `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を export し、live
  テスト設定に合わせているため、`openai-codex/*` や PI フォールバックが Codex harness
  の回帰を隠すことはできません。

### 推奨 live レシピ

狭く明示的な allowlist が最も高速で、flaky さも最小です。

- 単一モデル、direct（gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにわたる tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 集中（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意:

- `google/...` は Gemini API（API キー）を使用します。
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist 形式の agent endpoint）を使用します。
- `google-gemini-cli/...` はローカルマシン上の Gemini CLI を使用します（認証と tooling の癖は別です）。
- Gemini API と Gemini CLI の違い:
  - API: OpenClaw は Google がホストする Gemini API を HTTP 経由で呼び出します（API キー / profile 認証）。多くのユーザーが「Gemini」と言うときはこれを指します。
  - CLI: OpenClaw はローカルの `gemini` バイナリを shell 実行します。これは独自の認証を持ち、挙動も異なることがあります（streaming/tool 対応/version のずれ）。

## Live: model matrix（何をカバーするか）

固定の「CI model list」はありません（live はオプトイン）が、これらはキーのある開発マシンで定期的にカバーする**推奨**モデルです。

### Modern smoke set（tool calling + image）

これは、動作し続けることを期待する「一般的なモデル」実行です。

- OpenAI（non-Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image 付きで gateway smoke を実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling（Read + 任意の Exec）

各プロバイダーファミリーにつき最低 1 つは選んでください。

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あるとよいもの）:

- xAI: `xai/grok-4`（または最新の利用可能版）
- Mistral: `mistral/`…（有効化済みの「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。tool calling は API mode に依存）

### Vision: image send（attachment → multimodal message）

image probe を実行するため、少なくとも 1 つの画像対応モデルを `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください（Claude/Gemini/OpenAI の画像対応 variant など）。

### Aggregator / 代替 gateway

キーが有効であれば、次経由のテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル。tool+image 対応候補を見つけるには `openclaw models scan` を使用）
- OpenCode: Zen には `opencode/...`、Go には `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

live matrix に含められるその他のプロバイダー（認証情報/config がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタム endpoint）: `minimax`（cloud/API）、および任意の OpenAI/Anthropic 互換 proxy（LM Studio、vLLM、LiteLLM など）

ヒント: ドキュメントに「全モデル」をハードコードしようとしないでください。権威ある一覧は、そのマシンで `discoverModels(...)` が返すものと、利用可能なキー次第です。

## 認証情報（絶対にコミットしない）

live テストは CLI と同じ方法で認証情報を見つけます。実際上の意味は次のとおりです。

- CLI が動くなら、live テストも同じキーを見つけられるはずです。
- live テストが「認証情報なし」と言う場合は、`openclaw models list` / モデル選択をデバッグするときと同じように調べてください。

- エージェントごとの auth profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（live テストでいう「profile keys」とはこれです）
- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー state dir: `~/.openclaw/credentials/`（存在する場合はステージされた live home にコピーされますが、メインの profile-key store ではありません）
- ローカル live 実行では、アクティブな config、エージェントごとの `auth-profiles.json` ファイル、レガシーの `credentials/`、およびサポート対象の外部 CLI auth ディレクトリを、デフォルトで一時的なテスト用 home にコピーします。ステージ済み live home では `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` のパス上書きも削除されるため、probe が実ホストの workspace に触れないようになっています。

env キー（たとえば `~/.profile` で export 済み）に頼りたい場合は、ローカルテストの前に `source ~/.profile` を実行するか、以下の Docker ランナーを使ってください（コンテナに `~/.profile` をマウントできます）。

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
  - バンドル済み comfy の image、video、`music_generate` 経路を実行する
  - `models.providers.comfy.<capability>` が設定されていない capability はそれぞれスキップする
  - comfy workflow の送信、polling、ダウンロード、plugin 登録を変更した後に有用

## 画像生成 live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録されているすべての画像生成プロバイダー plugin を列挙する
  - probe 前に、ログインシェル（`~/.profile`）から不足しているプロバイダー env vars を読み込む
  - デフォルトでは保存済み auth profile より live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際の shell 認証情報を隠すことがない
  - 利用可能な auth/profile/model がないプロバイダーはスキップする
  - 共有 runtime capability を通して標準の画像生成 variant を実行する:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされているバンドル済みプロバイダー:
  - `openai`
  - `google`
  - `xai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 任意の認証動作:
  - env のみの上書きを無視して profile-store 認証を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 音楽生成 live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有のバンドル済み音楽生成プロバイダー経路を実行する
  - 現在は Google と MiniMax をカバーする
  - probe 前に、ログインシェル（`~/.profile`）からプロバイダー env vars を読み込む
  - デフォルトでは保存済み auth profile より live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際の shell 認証情報を隠すことがない
  - 利用可能な auth/profile/model がないプロバイダーはスキップする
  - 利用可能な場合は、宣言された両方の runtime mode を実行する:
    - prompt のみ入力の `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 別の Comfy live ファイルであり、この共有 sweep ではない
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の認証動作:
  - env のみの上書きを無視して profile-store 認証を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 動画生成 live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有のバンドル済み動画生成プロバイダー経路を実行する
  - デフォルトでは、リリース安全なスモーク経路を使います: FAL 以外のプロバイダー、プロバイダーごとに 1 件の text-to-video リクエスト、1 秒の lobster prompt、そして `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` によるプロバイダーごとの操作上限（デフォルト `180000`）
  - FAL はデフォルトでスキップされます。プロバイダー側のキュー待ち遅延がリリース時間を支配しうるためです。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - probe 前に、ログインシェル（`~/.profile`）からプロバイダー env vars を読み込む
  - デフォルトでは保存済み auth profile より live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際の shell 認証情報を隠すことがない
  - 利用可能な auth/profile/model がないプロバイダーはスキップする
  - デフォルトでは `generate` のみ実行する
  - 利用可能な場合は、宣言された transform mode も実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択したプロバイダー/モデルが共有 sweep で buffer ベースのローカル画像入力を受け付ける場合の `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択したプロバイダー/モデルが共有 sweep で buffer ベースのローカル動画入力を受け付ける場合の `videoToVideo`
  - 共有 sweep で現在宣言されているがスキップされる `imageToVideo` プロバイダー:
    - `vydra`。バンドル済み `veo3` は text-only で、バンドル済み `kling` はリモート画像 URL を必要とするため
  - Vydra 固有のカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` の text-to-video と、デフォルトでリモート画像 URL fixture を使う `kling` レーンを実行します
  - 現在の `videoToVideo` live カバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合の `runway` のみ
  - 共有 sweep で現在宣言されているがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`、`qwen`、`xai`。これらの経路は現在リモート `http(s)` / MP4 参照 URL を必要とするため
    - `google`。現在の共有 Gemini/Veo レーンはローカルの buffer ベース入力を使用しており、その経路は共有 sweep では受け付けられないため
    - `openai`。現在の共有レーンには org 固有の video inpaint/remix アクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルト sweep の全プロバイダー（FAL を含む）を対象にするには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - より積極的なスモーク実行で各プロバイダーの操作上限を減らすには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - env のみの上書きを無視して profile-store 認証を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## メディア live ハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の image、music、video live スイートを、リポジトリネイティブな 1 つの entrypoint から実行する
  - `~/.profile` から不足しているプロバイダー env vars を自動読み込みする
  - デフォルトでは、現在利用可能な auth を持つプロバイダーに各スイートを自動で絞り込む
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の挙動が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker ランナー（任意の「Linux で動く」チェック）

これらの Docker ランナーは 2 つのカテゴリに分かれます。

- Live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、対応する profile-key live ファイルだけをリポジトリ Docker イメージ内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、完全な Docker sweep を現実的に保つため、デフォルトでより小さなスモーク上限を使います:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大きな完全スキャンを明示的に望む場合は、それらの env vars を上書きしてください。
- `test:docker:all` は、`test:docker:live-build` で live Docker イメージを一度だけビルドし、その後 2 つの live Docker レーンで再利用します。
- Container smoke ランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:plugins` は、1 つ以上の実コンテナを起動し、より高レベルな integration 経路を検証します。

live-model Docker ランナーは、必要な CLI auth home だけを bind-mount し（実行が絞られていない場合はサポート対象のすべて）、実行前にそれらをコンテナ home にコピーします。これにより、外部 CLI OAuth がホストの auth store を変更せずにトークンを更新できます。

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI backend smoke: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全な scaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gateway networking（2 コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（シード済み Gateway + stdio bridge + 生の Claude notification-frame smoke）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（実際の stdio MCP server + 組み込み Pi profile allow/deny smoke）: `pnpm test:docker:pi-bundle-mcp-tools`（スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（実際の Gateway + stdio MCP child teardown。分離された cron と one-shot subagent 実行後）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（install smoke + `/plugin` エイリアス + Claude-bundle restart セマンティクス）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
- バンドル済み plugin の runtime deps: `pnpm test:docker:bundled-channel-deps` は、デフォルトで小さな Docker ランナーイメージをビルドし、ホスト上で OpenClaw を一度だけ build と pack したあと、その tarball を各 Linux install シナリオへマウントします。`OPENCLAW_SKIP_DOCKER_BUILD=1` でイメージを再利用し、ローカルで新鮮な build を済ませた後のホスト再 build をスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`、既存 tarball を使うには `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を指定してください。
- バンドル済み plugin の runtime deps を反復中に絞るには、無関係なシナリオを無効にします。例:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

live-model Docker ランナーは、現在の checkout も読み取り専用で bind-mount し、
コンテナ内の一時 workdir にステージします。これにより、runtime
イメージをスリムに保ちながら、正確に手元の source/config に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、および app ローカルの `.build` や
Gradle 出力ディレクトリのような、大きなローカル専用キャッシュや app build 出力をスキップするため、
Docker live 実行でマシン固有の成果物のコピーに何分も費やすことがありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定されるため、gateway live probe が
コンテナ内で実際の Telegram/Discord などの channel worker を起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
その Docker レーンで gateway live カバレッジを絞り込みまたは除外したい場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。これにより
OpenAI 互換 HTTP endpoint を有効にした OpenClaw gateway コンテナを起動し、
その gateway に対して固定版の Open WebUI コンテナを起動し、Open WebUI 経由でサインインし、
`/api/models` が `openclaw/default` を公開していることを確認したうえで、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は明らかに遅くなることがあります。Docker が
Open WebUI イメージを pull する必要があったり、Open WebUI 自身のコールドスタート設定が完了する必要があるためです。
このレーンは利用可能な live model key を前提とし、Docker 化された実行では
`OPENCLAW_PROFILE_FILE`
（デフォルトは `~/.profile`）がそれを提供する主な方法です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが表示されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、または iMessage アカウントを必要としません。これはシード済み Gateway
コンテナを起動し、次に `openclaw mcp serve` を起動する 2 つ目のコンテナを立ち上げ、
実際の stdio MCP bridge 上で、ルーティングされた conversation discovery、transcript 読み取り、attachment metadata、
live event queue の挙動、outbound send ルーティング、そして Claude 形式の channel +
permission 通知を検証します。通知チェックは
生の stdio MCP frame を直接検査するため、このスモークは特定のクライアント SDK がたまたま表面化するものだけでなく、
bridge が実際に出力するものを検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、live
model key を必要としません。これはリポジトリ Docker イメージをビルドし、実際の stdio MCP probe server
をコンテナ内で起動し、そのサーバーを組み込み Pi bundle
MCP runtime 経由で実体化し、tool を実行し、その後 `coding` と `messaging` が
`bundle-mcp` tools を維持しつつ、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらを除外することを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、live model
key を必要としません。これは実際の stdio MCP probe server を備えたシード済み Gateway を起動し、
分離された cron turn と `/subagents spawn` の one-shot child turn を実行し、その後
各実行後に MCP child process が終了することを検証します。

手動 ACP 平文スレッドスモーク（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に維持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

便利な env 変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）を `/home/node/.openclaw` にマウント
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）を `/home/node/.openclaw/workspace` にマウント
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）を `/home/node/.profile` にマウントし、テスト実行前に読み込む
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` で、`OPENCLAW_PROFILE_FILE` から読み込まれた env vars のみを検証します。一時的な config/workspace ディレクトリを使い、外部 CLI auth マウントは行いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）を `/home/node/.npm-global` にマウントし、Docker 内の CLI インストールをキャッシュ
- `$HOME` 配下の外部 CLI auth ディレクトリ/ファイルは、`/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` へコピーされます
  - デフォルトのディレクトリ: `.minimax`
  - デフォルトのファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推測された必要なディレクトリ/ファイルだけをマウントします
  - 手動上書きは `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで行います
- 実行を絞るには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内のプロバイダーをフィルタするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルドが不要な再実行では、既存の `openclaw:local-live` イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報が profile store 由来であることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env ではなく）
- Open WebUI スモークで gateway が公開するモデルを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI スモークで使う nonce-check prompt を上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定された Open WebUI イメージタグを上書きするには `OPENWEBUI_IMAGE=...`

## ドキュメントの健全性確認

ドキュメント編集後は docs チェックを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要なときは、完全な Mintlify anchor 検証を実行してください: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI 安全）

これらは、実際のプロバイダーなしでの「実パイプライン」回帰です。

- Gateway tool calling（mock OpenAI、実際の gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config + auth 書き込みを強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 evals（Skills）

すでに、次のような CI 安全なテストがあり、「エージェント信頼性 evals」のように振る舞います。

- 実際の gateway + agent loop を通した mock tool-calling（`src/gateway/gateway.test.ts`）。
- セッション配線と config 効果を検証する end-to-end ウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/tools/skills) 参照）:

- **Decisioning:** prompt に skills が列挙されているとき、エージェントは正しい skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **Workflow contracts:** tool の順序、session history の引き継ぎ、sandbox 境界を検証する multi-turn シナリオ。

今後の evals も、まずは決定的であるべきです。

- mock provider を使い、tool call + 順序、skill ファイル読み取り、session 配線を検証するシナリオランナー。
- skill に焦点を当てた小規模シナリオスイート（使う/使わない、ゲーティング、prompt injection）。
- CI 安全スイートが整ってからのみ、任意の live evals（オプトイン、env ゲート付き）。

## 契約テスト（plugin と channel の形状）

契約テストは、登録されているすべての plugin と channel がその
インターフェース契約に準拠していることを検証します。発見されたすべての plugin を反復し、
形状と挙動に関する一連のアサーションを実行します。デフォルトの `pnpm test` unit レーンは、
これらの共有 seam と smoke ファイルを意図的にスキップします。共有 channel または provider surface に触れた場合は、
契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- channel 契約のみ: `pnpm test:contracts:channels`
- provider 契約のみ: `pnpm test:contracts:plugins`

### Channel 契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な plugin の形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディングの挙動
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - channel アクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシー強制

### Provider status 契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - channel ステータス probe
- **registry** - plugin registry の形状

### Provider 契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - auth フロー契約
- **auth-choice** - auth の選択/選定
- **catalog** - モデルカタログ API
- **discovery** - plugin discovery
- **loader** - plugin loading
- **runtime** - provider runtime
- **shape** - plugin の形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk export または subpath を変更した後
- channel または provider plugin を追加または変更した後
- plugin 登録または discovery をリファクタした後

契約テストは CI で実行され、実際の API キーは不要です。

## 回帰の追加（ガイダンス）

live で発見された provider/model 問題を修正したとき:

- 可能であれば CI 安全な回帰を追加してください（mock/stub provider、または正確な request-shape 変換の捕捉）
- 本質的に live 専用なら（レート制限、auth ポリシーなど）、live テストは狭く保ち、env vars でオプトインにしてください
- バグを捕まえる最小の層を狙うことを優先してください:
  - provider の request 変換/replay バグ → direct models テスト
  - gateway の session/history/tool パイプラインバグ → gateway live smoke または CI 安全な gateway mock テスト
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとに 1 つのサンプル target を導出し、その後 traversal-segment exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは、未分類の target id で意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。
