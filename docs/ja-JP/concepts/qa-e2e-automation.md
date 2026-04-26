---
read_when:
    - qa-lab または qa-channel を拡張する
    - リポジトリ連動の QA シナリオを追加する
    - Gateway ダッシュボードを中心に、より高い現実性の QA 自動化を構築する
summary: qa-lab、qa-channel、シード済みシナリオ、プロトコルレポート向けの非公開 QA 自動化の構成
title: QA E2E 自動化
x-i18n:
    generated_at: "2026-04-26T11:28:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

非公開 QA スタックは、単一のユニットテストよりも現実のチャネルに近い形で OpenClaw を検証することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、channel、thread、
  reaction、edit、delete のサーフェスを持つ合成メッセージチャネル。
- `extensions/qa-lab`: transcript の観測、
  受信メッセージの注入、Markdown レポートのエクスポートを行う debugger UI と QA バス。
- `qa/`: kickoff タスクとベースライン QA
  シナリオ用のリポジトリ連動シードアセット。

現在の QA オペレーターフローは 2 ペインの QA サイトです:

- 左: エージェント付きの Gateway ダッシュボード（Control UI）。
- 右: Slack 風の transcript とシナリオ計画を表示する QA Lab。

実行するには:

```bash
pnpm qa:lab:up
```

これにより QA サイトを build し、Docker ベースの Gateway レーンを起動して、
オペレーターまたは自動化ループがエージェントに QA ミッションを与え、
実際のチャネル動作を観察し、何が動作し、何が失敗し、何がブロックされたままかを記録できる
QA Lab ページを公開します。

Docker イメージを毎回再 build せずに QA Lab UI をより高速に反復するには、
QA Lab バンドルを bind mount する形でスタックを起動します:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前 build 済みイメージで維持し、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナへ bind mount します。`qa:lab:watch`
は変更時にそのバンドルを再 build し、QA Lab のアセットハッシュが変わるとブラウザーが自動再読み込みします。

ローカル OpenTelemetry トレーススモークを実行するには、次を使います:

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、
`diagnostics-otel` Plugin を有効にした `otel-trace-smoke` QA シナリオを実行した後、
エクスポートされた protobuf span をデコードして、リリースクリティカルな構成を検証します:
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在していなければなりません。
成功したターンでは model call が `StreamAbandoned` をエクスポートしてはいけません。生の diagnostic ID と
`openclaw.content.*` 属性はトレースに含まれていてはいけません。結果は
QA スイートアーティファクトの隣に `otel-smoke-summary.json` として書き出されます。

実トランスポートの Matrix スモークレーンを実行するには、次を使います:

```bash
pnpm openclaw qa matrix
```

このレーンは Docker 上で使い捨ての Tuwunel homeserver を用意し、一時的な
driver、SUT、observer ユーザーを登録し、1 つの非公開ルームを作成したうえで、
実際の Matrix Plugin を QA Gateway 子プロセス内で実行します。ライブトランスポートレーンは子設定を
テスト中のトランスポートに限定するため、Matrix は子設定内で `qa-channel` なしで動作します。これは、
構造化レポートアーティファクトと stdout/stderr の結合ログを、選択した Matrix QA 出力ディレクトリに書き出します。外側の
`scripts/run-node.mjs` の build/launcher 出力も取得するには、
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` をリポジトリローカルのログファイルに設定してください。
Matrix の進行状況はデフォルトで出力されます。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` は実行全体の上限、
`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` はクリーンアップの上限を設定し、Docker の teardown がハングした場合に
ハングし続ける代わりに、正確な復旧コマンドを報告します。

実トランスポートの Telegram スモークレーンを実行するには、次を使います:

```bash
pnpm openclaw qa telegram
```

このレーンは使い捨てサーバーを用意する代わりに、実際の非公開 Telegram グループを 1 つ対象にします。これには
`OPENCLAW_QA_TELEGRAM_GROUP_ID`、
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要で、
さらに同じ非公開グループ内に別々の 2 つのボットが必要です。SUT ボットには
Telegram ユーザー名が必要で、ボット同士の観測は両方のボットで
`@BotFather` の Bot-to-Bot Communication Mode を有効にしていると最もうまく動作します。
いずれかのシナリオが失敗するとコマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトだけ欲しい場合は `--allow-failures` を使ってください。
Telegram レポートとサマリーには、canary を起点として、driver のメッセージ送信リクエストから
観測された SUT の返信までの reply ごとの RTT が含まれます。

共有ライブ認証情報を使う前に、次を実行してください:

```bash
pnpm openclaw qa credentials doctor
```

この doctor は Convex broker 環境を確認し、エンドポイント設定を検証し、
maintainer secret がある場合は admin/list 到達性を確認します。secret については
設定済み/未設定の状態のみを報告します。

実トランスポートの Discord スモークレーンを実行するには、次を使います:

```bash
pnpm openclaw qa discord
```

このレーンは、2 つのボットがいる実際の非公開 Discord guild channel を対象にします:
harness によって制御される driver ボットと、バンドル済み Discord Plugin を通じて子 OpenClaw Gateway が起動する
SUT ボットです。環境変数による認証情報を使う場合は、
`OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`、
`OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` が必要です。
このレーンは channel mention の処理を検証し、
SUT ボットが Discord にネイティブ `/help` コマンドを登録していることを確認します。
いずれかのシナリオが失敗するとコマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトだけ欲しい場合は `--allow-failures` を使ってください。

ライブトランスポートレーンは現在、それぞれが独自のシナリオ一覧構成を作るのではなく、
より小さな 1 つの共有契約を使います:

`qa-channel` は広範な合成プロダクト動作スイートのままであり、
ライブトランスポートのカバレッジマトリクスには含まれません。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持される一方で、Matrix、
Telegram、そして将来のライブトランスポートが、明示的な 1 つのトランスポート契約チェックリストを共有できます。

Docker を QA パスに持ち込まずに使い捨て Linux VM レーンを実行するには、
次を使います:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass guest を起動し、依存関係をインストールし、guest 内で OpenClaw を build し、
`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の
`.artifacts/qa-e2e/...` にコピーします。
これはホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ホストと Multipass の suite 実行は、デフォルトで分離された Gateway worker を用いて
複数の選択シナリオを並列実行します。`qa-channel` のデフォルト同時実行数は 4 で、
選択シナリオ数によって上限が決まります。worker 数を調整するには `--concurrency <count>`、
直列実行には `--concurrency 1` を使います。
いずれかのシナリオが失敗するとコマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトだけ欲しい場合は `--allow-failures` を使ってください。
ライブ実行では、guest にとって実用的なサポート済み QA 認証入力が転送されます:
環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、
そして存在する場合は `CODEX_HOME` です。guest がマウントされた workspace 経由で
書き戻せるよう、`--output-dir` はリポジトリルート配下に保ってください。

## リポジトリ連動シード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に置かれており、QA 計画が人間にもエージェントにも見えるようになっています。

`qa-lab` は汎用的な markdown ランナーのままであるべきです。各シナリオ markdown ファイルは
1 回のテスト実行の source of truth であり、次を定義するべきです:

- scenario metadata
- 任意の category、capability、lane、risk metadata
- docs と code の参照
- 任意の Plugin 要件
- 任意の Gateway 設定パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用的かつ横断的であってかまいません。たとえば、markdown シナリオは、
transport 側ヘルパーと browser 側ヘルパーを組み合わせて、専用ランナーを追加せずに
Gateway の `browser.request` 境界を通して埋め込み Control UI を操作できます。

シナリオファイルは source tree フォルダーではなく、プロダクト機能ごとにグループ化するべきです。
ファイルを移動しても scenario ID は安定させてください。実装のトレーサビリティには
`docsRefs` と `codeRefs` を使います。

ベースライン一覧は、少なくとも次をカバーできる程度に広く維持するべきです:

- DM と channel chat
- thread の挙動
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリの再呼び出し
- モデル切り替え
- サブエージェント handoff
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders のような小さな build タスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります:

- `mock-openai` はシナリオ対応の OpenClaw モックです。これは引き続き
  リポジトリ連動 QA と parity gate 用のデフォルトの決定論的モックレーンです。
- `aimock` は、実験的なプロトコル、
  フィクスチャ、record/replay、chaos カバレッジ用に AIMock ベースのプロバイダーサーバーを起動します。これは追加機能であり、
  `mock-openai` のシナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーン実装は `extensions/qa-lab/src/providers/` 配下にあります。
各プロバイダーは自らのデフォルト、ローカルサーバー起動、Gateway モデル設定、
auth-profile ステージング要件、および live/mock 機能フラグを所有します。共有 suite と
Gateway コードは、プロバイダー名で分岐するのではなく、provider registry を経由してルーティングするべきです。

## トランスポートアダプター

`qa-lab` は markdown QA シナリオ向けの汎用トランスポート境界を所有します。
`qa-channel` はその境界上の最初のアダプターですが、設計目標はより広いものです:
将来の実トランスポートまたは合成チャネルは、トランスポート専用 QA ランナーを追加するのではなく、
同じ suite runner に接続するべきです。

アーキテクチャレベルでは、分担は次のとおりです:

- `qa-lab` は汎用シナリオ実行、worker 同時実行、アーティファクト書き出し、レポート作成を所有します。
- トランスポートアダプターは Gateway 設定、準備完了、受信/送信観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の markdown シナリオファイルがテスト実行を定義し、それを実行する再利用可能なランタイムサーフェスを `qa-lab` が提供します。

新しいチャネルアダプター向けの maintainer 向け導入ガイダンスは
[Testing](/ja-JP/help/testing#adding-a-channel-to-qa) にあります。

## レポート

`qa-lab` は観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
このレポートは次に答えるべきです:

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- どの follow-up シナリオを追加する価値があるか

キャラクターとスタイルのチェックには、同じシナリオを複数のライブモデル参照で実行し、
評価済み Markdown レポートを書き出します:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

このコマンドは Docker ではなく、ローカルの QA Gateway 子プロセスを実行します。character eval
シナリオでは `SOUL.md` を通じて persona を設定し、その後に chat、workspace ヘルプ、
小さなファイルタスクのような通常のユーザーターンを実行するべきです。候補モデルには、
評価中であることを伝えてはいけません。このコマンドは各完全 transcript を保持し、
基本的な実行統計を記録したうえで、対応している場合は fast mode と `xhigh`
reasoning を使って judge モデルに、自然さ、雰囲気、ユーモアで実行結果を順位付けさせます。
プロバイダーを比較する場合は `--blind-judge-models` を使ってください:
judge プロンプトには引き続きすべての transcript と実行ステータスが渡されますが、
候補参照は `candidate-01` のような中立ラベルに置き換えられます。パース後に、
レポートが順位を実際の参照に再マッピングします。
候補実行はデフォルトで `high` thinking を使用し、GPT-5.5 では `medium`、
それをサポートする旧 OpenAI eval 参照では `xhigh` を使用します。特定の候補を個別に上書きするには
`--model provider/model,thinking=<level>` を使います。`--thinking <level>` は引き続き
グローバルなフォールバックを設定し、旧来の `--model-thinking <provider/model=level>` 形式も
互換性のために維持されています。
OpenAI の候補参照はデフォルトで fast mode を使用するため、プロバイダーが対応していれば
優先処理が使われます。単一の候補または judge で上書きが必要な場合は、インラインで
`,fast`、`,no-fast`、または `,fast=false` を追加してください。すべての候補モデルで
fast mode を強制的に有効にしたい場合のみ `--fast` を渡してください。候補と judge の
所要時間はベンチマーク分析のためにレポートへ記録されますが、judge プロンプトでは明示的に
速度で順位付けしないよう指示されます。
候補モデル実行と judge モデル実行は、どちらもデフォルトで同時実行数 16 です。
プロバイダー制限やローカル Gateway の負荷で実行結果が不安定になる場合は、
`--concurrency` または `--judge-concurrency` を下げてください。
候補の `--model` が渡されない場合、character eval のデフォルトは
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、
`google/gemini-3.1-pro-preview` になります。
`--judge-model` が渡されない場合、judge のデフォルトは
`openai/gpt-5.5,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [Testing](/ja-JP/help/testing)
- [QA Channel](/ja-JP/channels/qa-channel)
- [ダッシュボード](/ja-JP/web/dashboard)
