---
read_when:
    - qa-labまたはqa-channelの拡張
    - リポジトリに裏付けられたQAシナリオの追加
    - Gatewayダッシュボードを中心に、より現実に即したQA自動化を構築する
summary: qa-lab、qa-channel、シード済みシナリオ、およびプロトコルレポート向けの非公開QA自動化の構成
title: QA E2E自動化
x-i18n:
    generated_at: "2026-04-20T04:46:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E自動化

非公開QAスタックは、単一のユニットテストよりも、より現実的で
チャネルに即した形でOpenClawを検証することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、
  リアクション、編集、削除の各サーフェスを備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  受信メッセージの注入、Markdownレポートのエクスポートを行うためのデバッガUIとQAバス。
- `qa/`: キックオフタスクとベースラインQA
  シナリオ向けの、リポジトリに裏付けられたシードアセット。

現在のQAオペレーターフローは、2ペインのQAサイトです:

- 左: エージェントを備えたGatewayダッシュボード（Control UI）。
- 右: Slack風のトランスクリプトとシナリオ計画を表示するQA Lab。

次のコマンドで実行します:

```bash
pnpm qa:lab:up
```

これによりQAサイトがビルドされ、Dockerベースのgatewayレーンが起動し、
オペレーターまたは自動化ループがエージェントにQAミッションを与え、
実際のチャネル動作を観察し、何が機能したか、何が失敗したか、
何がブロックされたままだったかを記録できるQA Labページが公開されます。

Dockerイメージを毎回再ビルドせずに、より高速にQA Lab UIを反復するには、
bind mountしたQA Labバンドルでスタックを起動します:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は、Dockerサービスを事前ビルド済みイメージ上で維持し、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにbind mountします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Labアセットのハッシュが変わると
ブラウザは自動リロードされます。

トランスポート実体のあるMatrixスモークレーンを実行するには、次を実行します:

```bash
pnpm openclaw qa matrix
```

このレーンは、Docker内に使い捨てのTuwunel homeserverをプロビジョニングし、
一時的なdriver、SUT、observerユーザーを登録し、1つのプライベートルームを作成してから、
QA gateway child内で実際のMatrix pluginを実行します。ライブトランスポートレーンは、
テスト対象のトランスポートにchild configのスコープを限定するため、Matrixは
child config内で`qa-channel`なしに実行されます。構造化レポートアーティファクトと、
結合されたstdout/stderrログを、選択されたMatrix QA出力ディレクトリに書き込みます。
外側の `scripts/run-node.mjs` のビルド/ランチャー出力も取得するには、
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` をリポジトリ内のログファイルに設定してください。

トランスポート実体のあるTelegramスモークレーンを実行するには、次を実行します:

```bash
pnpm openclaw qa telegram
```

このレーンは、使い捨てサーバーをプロビジョニングする代わりに、
実在する1つのプライベートTelegramグループを対象にします。
`OPENCLAW_QA_TELEGRAM_GROUP_ID`、
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`
が必要で、さらに同じプライベートグループ内に2つの異なるbotが必要です。
SUT botにはTelegramユーザー名が必要で、bot同士の観察は、
両方のbotで `@BotFather` 内の Bot-to-Bot Communication Mode を
有効にしていると最もうまく機能します。
いずれかのシナリオが失敗すると、このコマンドはゼロ以外の終了コードで終了します。
終了コードを失敗にせずアーティファクトを取得したい場合は、`--allow-failures` を使用してください。

ライブトランスポートレーンは現在、各レーンが独自のシナリオリスト形式を
考案するのではなく、1つのより小さな共通コントラクトを共有しています:

`qa-channel` は依然として幅広い合成プロダクト動作スイートであり、
ライブトランスポートのカバレッジマトリクスには含まれません。

| レーン   | Canary | メンションゲーティング | Allowlistブロック | トップレベル返信 | 再起動後の再開 | スレッド追従 | スレッド分離 | リアクション観察 | ヘルプコマンド |
| -------- | ------ | ---------------------- | ----------------- | ---------------- | -------------- | ------------ | ------------ | ---------------- | -------------- |
| Matrix   | x      | x                      | x                 | x                | x              | x            | x            | x                |                |
| Telegram | x      |                        |                   |                  |                |              |              |                  | x              |

これにより、`qa-channel` は幅広いプロダクト動作スイートとして維持される一方で、
Matrix、Telegram、および今後のライブトランスポートは、明示的な
トランスポートコントラクトのチェックリストを共有します。

QAパスにDockerを持ち込まずに使い捨てのLinux VMレーンを実行するには、
次を実行します:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これにより新しいMultipass guestが起動し、依存関係をインストールし、
guest内でOpenClawをビルドし、`qa suite` を実行してから、
通常のQAレポートとサマリーをホスト上の `.artifacts/qa-e2e/...` に
コピーし戻します。
ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ホスト実行とMultipass suite実行はどちらも、選択された複数のシナリオを、
分離されたgateway workerでデフォルトで並列実行します。`qa-channel` のデフォルト同時実行数は4で、
選択されたシナリオ数を上限とします。worker数を調整するには
`--concurrency <count>` を使用し、直列実行には `--concurrency 1` を使用してください。
いずれかのシナリオが失敗すると、このコマンドはゼロ以外の終了コードで終了します。
終了コードを失敗にせずアーティファクトを取得したい場合は、`--allow-failures` を使用してください。
ライブ実行では、guestで実用的なサポート対象のQA認証入力を転送します:
envベースのprovider key、QA live provider config path、そして
存在する場合は `CODEX_HOME` です。guestがマウントされたworkspace経由で
書き戻せるように、`--output-dir` はリポジトリルート配下に維持してください。

## リポジトリに裏付けられたシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的にgitに置かれており、QA計画を人間と
エージェントの両方から可視にしています。

`qa-lab` は汎用的なmarkdownランナーのままであるべきです。各シナリオmarkdownファイルは
1回のテスト実行における唯一の信頼できる情報源であり、次を定義する必要があります:

- シナリオメタデータ
- 任意のcategory、capability、lane、riskメタデータ
- docs参照とcode参照
- 任意のplugin要件
- 任意のgateway config patch
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、
汎用的かつ横断的なままでかまいません。たとえば、markdownシナリオは、
特別扱いのランナーを追加せずに、トランスポート側ヘルパーと、
Gatewayの `browser.request` シームを通じて埋め込みControl UIを操作する
ブラウザ側ヘルパーを組み合わせることができます。

シナリオファイルは、ソースツリーのフォルダではなく、
プロダクト機能ごとにグループ化するべきです。ファイルが移動してもシナリオIDは安定させ、
実装のトレーサビリティには `docsRefs` と `codeRefs` を使用してください。

ベースライン一覧は、次をカバーできる程度に十分広く保つべきです:

- DMとチャネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- Cronコールバック
- メモリー再呼び出し
- モデル切り替え
- subagent handoff
- リポジトリ読み取りとdocs読み取り
- Lobster Invadersのような小さなビルドタスク1つ

## Providerモックレーン

`qa suite` には2つのローカルproviderモックレーンがあります:

- `mock-openai` は、シナリオ認識型のOpenClawモックです。これは引き続き、
  リポジトリに裏付けられたQAとパリティゲート向けのデフォルトの決定的モックレーンです。
- `aimock` は、実験的なプロトコル、
  フィクスチャ、record/replay、chaosカバレッジ向けに、AIMockベースのprovider serverを起動します。
  これは追加的なものであり、`mock-openai` のシナリオディスパッチャを置き換えるものではありません。

Providerレーン実装は `extensions/qa-lab/src/providers/` 配下にあります。
各providerは、それぞれのデフォルト、ローカルserver起動、gateway model config、
auth-profileステージング要件、およびlive/mock capability flagsを所有します。
共有suiteコードとgatewayコードは、provider名で分岐するのではなく、
provider registryを経由してルーティングするべきです。

## トランスポートアダプター

`qa-lab` は、markdown QAシナリオ向けの汎用トランスポートシームを所有します。
`qa-channel` はそのシーム上の最初のアダプターですが、設計対象はより広く、
将来の実チャネルまたは合成チャネルも、トランスポート固有のQAランナーを追加するのではなく、
同じsuite runnerに接続できるようにすることです。

アーキテクチャレベルでは、分担は次のとおりです:

- `qa-lab` は、汎用シナリオ実行、worker並列実行、アーティファクト書き込み、レポート作成を所有します。
- トランスポートアダプターは、gateway config、readiness、受信と送信の観察、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下のmarkdownシナリオファイルがテスト実行を定義し、`qa-lab` はそれを実行するための再利用可能なランタイムサーフェスを提供します。

新しいチャネルアダプター向けの、メンテナー向け採用ガイダンスは
[Testing](/ja-JP/help/testing#adding-a-channel-to-qa) にあります。

## レポート

`qa-lab` は、観察されたバスタイムラインからMarkdownのプロトコルレポートを
エクスポートします。
レポートは次の問いに答えるべきです:

- 何が機能したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値のあるフォローアップシナリオは何か

キャラクターとスタイルのチェックでは、同じシナリオを複数のlive model参照に対して実行し、
評価済みMarkdownレポートを書き出します:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

このコマンドはDockerではなく、ローカルのQA gateway child processを実行します。
character evalシナリオでは、`SOUL.md` を通じてペルソナを設定し、その後にチャット、
workspaceヘルプ、小さなファイルタスクなどの通常のユーザーターンを実行するべきです。
候補modelには、評価されていることを伝えてはいけません。このコマンドは、
各完全トランスクリプトを保持し、基本的な実行統計を記録し、その後judge modelに対して、
`xhigh` 推論を伴うfast modeで、自然さ、雰囲気、ユーモアに基づいて
実行結果を順位付けするよう求めます。
providerを比較する際は、`--blind-judge-models` を使用してください:
judgeプロンプトには引き続きすべてのトランスクリプトと実行ステータスが渡されますが、
候補参照は `candidate-01` のような中立ラベルに置き換えられ、
レポートは解析後にランキングを実際の参照へマッピングし戻します。
候補実行のthinkingはデフォルトで `high` であり、対応するOpenAI modelでは `xhigh` になります。
特定の候補をインラインで上書きするには、
`--model provider/model,thinking=<level>` を使用してください。`--thinking <level>` は
引き続きグローバルなフォールバックを設定し、従来の
`--model-thinking <provider/model=level>` 形式も互換性のため維持されています。
OpenAI候補参照はデフォルトでfast modeとなり、providerが対応している場合は
優先処理が使われます。単一の候補またはjudgeに対して上書きが必要な場合は、
`,fast`、`,no-fast`、または `,fast=false` をインラインで追加してください。
すべての候補modelでfast modeを強制的にオンにしたい場合にのみ、`--fast` を渡してください。
候補とjudgeの所要時間はベンチマーク分析のためレポートに記録されますが、
judgeプロンプトでは、速度で順位付けしないよう明示しています。
候補実行とjudge model実行は、どちらもデフォルトで同時実行数16です。
provider制限やローカルgatewayの負荷によって実行が不安定になる場合は、
`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、character evalはデフォルトで
`openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、
`google/gemini-3.1-pro-preview` を使用します。
候補 `--model` が渡されない場合に使用されます。
`--judge-model` が渡されない場合、judgeのデフォルトは
`openai/gpt-5.4,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [Testing](/ja-JP/help/testing)
- [QA Channel](/ja-JP/channels/qa-channel)
- [Dashboard](/web/dashboard)
