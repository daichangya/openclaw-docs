---
read_when:
    - qa-labまたはqa-channelを拡張する場合
    - リポジトリ管理のQAシナリオを追加する場合
    - Gatewayダッシュボードを中心に、より高い現実性を持つQA自動化を構築する場合
summary: qa-lab、qa-channel、シード済みシナリオ、プロトコルレポートのためのプライベートQA自動化の構成
title: QA E2E自動化
x-i18n:
    generated_at: "2026-04-25T13:45:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

プライベートQAスタックは、単一のユニットテストよりも、
より現実的でチャネル形状に近い方法でOpenClawを検証することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、channel、thread、
  reaction、edit、deleteの各サーフェスを持つ合成メッセージチャネル。
- `extensions/qa-lab`: transcriptを観察し、
  受信メッセージを注入し、MarkdownレポートをエクスポートするためのデバッガーUIとQAバス。
- `qa/`: キックオフタスクとベースラインQA
  シナリオ用のリポジトリ管理シードアセット。

現在のQAオペレーターフローは2ペインのQAサイトです:

- 左: エージェント付きのGatewayダッシュボード（Control UI）。
- 右: Slack風のtranscriptとシナリオ計画を表示するQA Lab。

次のコマンドで実行します:

```bash
pnpm qa:lab:up
```

これによりQAサイトがビルドされ、Dockerベースのgatewayレーンが起動し、
オペレーターまたは自動化ループがエージェントにQAミッションを与え、
実際のチャネル挙動を観察し、何が成功し、何が失敗し、何が未解決のままかを記録できる
QA Labページが公開されます。

QA Lab UIを変更するたびにDockerイメージを再ビルドせず、より高速に反復するには、
バインドマウントしたQA Labバンドルでスタックを起動します:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`は、Dockerサービスを事前ビルド済みイメージで維持し、
`extensions/qa-lab/web/dist`を`qa-lab`コンテナにバインドマウントします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Labのアセットハッシュが変わると
ブラウザは自動リロードします。

実際のtransportを使うMatrixスモークレーンを実行するには、次を実行します:

```bash
pnpm openclaw qa matrix
```

このレーンは、Docker内に使い捨てのTuwunel homeserverを用意し、一時的な
driver、SUT、observerユーザーを登録し、1つのプライベートルームを作成してから、
実際のMatrix pluginをQA gateway子プロセス内で実行します。ライブtransportレーンは、
子設定をテスト対象transportに限定したままにするため、Matrixは子設定内で
`qa-channel`なしで実行されます。構造化レポートアーティファクトと、
stdout/stderrをまとめたログを、選択したMatrix QA出力ディレクトリへ書き込みます。
外側の`scripts/run-node.mjs`のビルド/ランチャー出力も取得するには、
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>`をリポジトリ内のログファイルに設定してください。
Matrixの進行状況はデフォルトで表示されます。`OPENCLAW_QA_MATRIX_TIMEOUT_MS`は
全実行時間を制限し、`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`はクリーンアップ時間を制限するため、
Dockerの終了処理が固まった場合でもハングせずに正確な復旧コマンドを報告します。

実際のtransportを使うTelegramスモークレーンを実行するには、次を実行します:

```bash
pnpm openclaw qa telegram
```

このレーンは、使い捨てサーバーを用意する代わりに、1つの実際のプライベートTelegramグループを対象にします。`OPENCLAW_QA_TELEGRAM_GROUP_ID`、
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`に加えて、
同じプライベートグループ内にいる2つの別々のbotが必要です。SUT botには
Telegramユーザー名が必要で、両方のbotで`@BotFather`の
Bot-to-Bot Communication Modeを有効にすると、bot同士の観測が最もうまく機能します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトだけ欲しい場合は`--allow-failures`を使用してください。
Telegramのレポートと要約には、canaryから始まる、driverメッセージ送信リクエストから
観測されたSUT返信までの返信ごとのRTTが含まれます。

プールされたライブ認証情報を使う前に、次を実行します:

```bash
pnpm openclaw qa credentials doctor
```

このdoctorは、Convex broker環境変数を確認し、エンドポイント設定を検証し、
maintainer secretが存在する場合はadmin/list到達性を検証します。secretについては
設定済み/未設定の状態のみを報告します。

実際のtransportを使うDiscordスモークレーンを実行するには、次を実行します:

```bash
pnpm openclaw qa discord
```

このレーンは、1つの実際のプライベートDiscord guild channelを、2つのbotで対象にします:
ハーネスが制御するdriver botと、バンドル済みDiscord plugin経由で
子OpenClaw gatewayが起動するSUT botです。環境変数の認証情報を使う場合は、
`OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`、
`OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`が必要です。
このレーンは、channel mentionの処理を検証し、
SUT botがネイティブ`/help`コマンドをDiscordに登録済みかも確認します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトだけ欲しい場合は`--allow-failures`を使用してください。

現在、ライブtransportレーンは、それぞれが独自のシナリオ一覧形式を作るのではなく、
より小さな1つの共通契約を共有しています。

`qa-channel`は、広範な合成プロダクト挙動スイートのままであり、
ライブtransportカバレッジマトリクスには含まれません。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

これにより、`qa-channel`は広範なプロダクト挙動スイートのまま維持され、
Matrix、Telegram、および将来のライブtransportは、1つの明示的な
transport契約チェックリストを共有します。

QAパスにDockerを持ち込まず、使い捨てLinux VMレーンを実行するには、
次を実行します:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これにより、新しいMultipassゲストが起動し、依存関係をインストールし、
ゲスト内でOpenClawをビルドし、`qa suite`を実行してから、通常のQAレポートと
要約をホスト上の`.artifacts/qa-e2e/...`へコピーし戻します。
シナリオ選択の挙動は、ホスト上の`qa suite`と同じものを再利用します。
ホストとMultipassのsuite実行はどちらも、デフォルトで分離されたgateway workerを使って
複数の選択シナリオを並列実行します。`qa-channel`のデフォルト同時実行数は4で、
選択されたシナリオ数が上限になります。worker数を調整するには`--concurrency <count>`を、
直列実行にするには`--concurrency 1`を使用してください。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトだけ欲しい場合は`--allow-failures`を使用してください。
ライブ実行では、ゲストにとって実用的な対応QA認証入力が転送されます:
環境変数ベースのプロバイダーキー、QAライブプロバイダー設定パス、
および存在する場合の`CODEX_HOME`です。ゲストがマウントされたワークスペース経由で
書き戻せるよう、`--output-dir`はリポジトリルート配下に置いてください。

## リポジトリ管理シード

シードアセットは`qa/`にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的にgit内に置かれており、QA計画が人間にも
エージェントにも見えるようになっています。

`qa-lab`は汎用のMarkdownランナーとして維持すべきです。各シナリオMarkdownファイルは
1回のテスト実行に対する信頼できる情報源であり、次を定義する必要があります:

- シナリオメタデータ
- 任意のcategory、capability、lane、riskメタデータ
- docsとcodeの参照
- 任意のplugin要件
- 任意のgateway設定パッチ
- 実行可能な`qa-flow`

`qa-flow`を支える再利用可能なランタイムサーフェスは、汎用かつ横断的であって構いません。
たとえば、Markdownシナリオは、embeddedなControl UIを
Gateway `browser.request`シーム経由で駆動するbrowser側ヘルパーと、
transport側ヘルパーを組み合わせることができます。専用の特別ケースランナーを追加する必要はありません。

シナリオファイルは、ソースツリーフォルダーではなく、プロダクト機能ごとにグループ化すべきです。
ファイルを移動してもシナリオIDは安定して保ち、実装のトレーサビリティには
`docsRefs`と`codeRefs`を使ってください。

ベースライン一覧は、次をカバーできる程度に広く保つべきです:

- DMとchannel chat
- threadの挙動
- メッセージアクションのライフサイクル
- Cronコールバック
- memoryの呼び出し
- モデル切り替え
- subagent handoff
- リポジトリ読み取りとdocs読み取り
- Lobster Invadersのような小さなビルドタスク1つ

## プロバイダーモックレーン

`qa suite`には、2つのローカルプロバイダーモックレーンがあります:

- `mock-openai`は、シナリオ認識型のOpenClawモックです。これは引き続き
  リポジトリ管理QAおよびパリティゲート向けの、デフォルトの決定論的モックレーンです。
- `aimock`は、実験的なプロトコル、
  フィクスチャ、record/replay、カオスカバレッジ用にAIMockベースのプロバイダーサーバーを起動します。これは追加機能であり、`mock-openai`のシナリオディスパッチャを置き換えるものではありません。

プロバイダーレーン実装は`extensions/qa-lab/src/providers/`配下にあります。
各プロバイダーは、自身のデフォルト、ローカルサーバー起動、gatewayモデル設定、
auth-profileステージング要件、およびライブ/モック機能フラグを所有します。
共有suiteおよびgatewayコードは、プロバイダー名で分岐するのではなく、
プロバイダーレジストリ経由でルーティングすべきです。

## transportアダプター

`qa-lab`は、Markdown QAシナリオ向けの汎用transportシームを所有しています。
`qa-channel`はこのシーム上の最初のアダプターですが、設計上の目標はより広く、
将来の実在または合成チャネルも、transport専用QAランナーを追加するのではなく、
同じsuiteランナーに接続できるようにすることです。

アーキテクチャレベルでは、分担は次のとおりです:

- `qa-lab`は、汎用シナリオ実行、worker並列性、アーティファクト書き込み、レポートを担当します。
- transportアダプターは、gateway設定、準備状態、受信および送信の観測、transportアクション、正規化されたtransport状態を担当します。
- `qa/scenarios/`配下のMarkdownシナリオファイルがテスト実行を定義し、それを実行する再利用可能なランタイムサーフェスを`qa-lab`が提供します。

新しいチャネルアダプター向けのmaintainer向け導入ガイダンスは
[Testing](/ja-JP/help/testing#adding-a-channel-to-qa)にあります。

## レポート

`qa-lab`は、観測されたバスタイムラインからMarkdownプロトコルレポートをエクスポートします。
このレポートは次に答えるべきです:

- 何が機能したか
- 何が失敗したか
- 何が未解決のままか
- どのフォローアップシナリオを追加する価値があるか

キャラクターとスタイルのチェックについては、同じシナリオを複数のライブモデルrefで実行し、
判定付きMarkdownレポートを書き出します:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

このコマンドはDockerではなく、ローカルのQA gateway子プロセスを実行します。character eval
シナリオでは、`SOUL.md`を通じてペルソナを設定し、その後、チャット、ワークスペース支援、
小さなファイル作業など、通常のユーザーターンを実行する必要があります。候補モデルには、
評価中であることを伝えてはいけません。このコマンドは各フルtranscriptを保持し、
基本的な実行統計を記録したうえで、judgeモデルに対してfastモード、
対応している場合は`xhigh`推論付きで、自然さ、雰囲気、ユーモアの観点から実行結果を順位付けするよう求めます。
プロバイダーを比較する場合は`--blind-judge-models`を使ってください。judgeプロンプトには
すべてのtranscriptと実行ステータスが引き続き渡されますが、candidate refは
`candidate-01`のような中立ラベルに置き換えられます。レポートはパース後に順位を実際のrefへマッピングし直します。
候補実行のデフォルトthinkingは`high`で、GPT-5.4は`medium`、対応している古いOpenAI eval refは
`xhigh`になります。特定の候補をインラインで上書きするには
`--model provider/model,thinking=<level>`を使用します。`--thinking <level>`は引き続き
グローバルなフォールバックを設定し、古い`--model-thinking <provider/model=level>`形式も
互換性のため維持されています。
OpenAI candidate refは、プロバイダーが対応している場合に優先処理が使われるよう、
デフォルトでfastモードになります。単一のcandidateまたはjudgeに上書きが必要な場合は、
インラインで`,fast`、`,no-fast`、または`,fast=false`を追加してください。すべてのcandidate modelで
fastモードを強制的に有効にしたい場合にのみ`--fast`を渡してください。candidateとjudgeの実行時間は
ベンチマーク分析のためレポートに記録されますが、judgeプロンプトでは
速度で順位付けしないよう明示されます。
candidate実行とjudge model実行は、どちらもデフォルトで同時実行数16です。プロバイダー制限や
ローカルgateway負荷によって実行が不安定になる場合は、`--concurrency`または`--judge-concurrency`を
下げてください。
candidate `--model`が渡されない場合、character evalのデフォルトは
`openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、
`google/gemini-3.1-pro-preview`です。
`--judge-model`が渡されない場合、judgeのデフォルトは
`openai/gpt-5.4,thinking=xhigh,fast`と
`anthropic/claude-opus-4-6,thinking=high`です。

## 関連ドキュメント

- [Testing](/ja-JP/help/testing)
- [QA Channel](/ja-JP/channels/qa-channel)
- [Dashboard](/ja-JP/web/dashboard)
