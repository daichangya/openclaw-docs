---
read_when:
    - qa-labまたはqa-channelを拡張するとき
    - リポジトリに裏付けられたQAシナリオを追加するとき
    - Gatewayダッシュボード周辺で、より現実性の高いQA自動化を構築するとき
summary: qa-lab、qa-channel、シードされたシナリオ、プロトコルレポート向けの非公開QA自動化の構成
title: QA E2E自動化
x-i18n:
    generated_at: "2026-04-09T01:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c922607d67e0f3a2489ac82bc9f510f7294ced039c1014c15b676d826441d833
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E自動化

非公開のQAスタックは、単一のユニットテストよりも現実的で、
チャネルの形に沿った方法でOpenClawを検証することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、channel、thread、
  reaction、edit、deleteの操作面を備えた合成メッセージチャネル。
- `extensions/qa-lab`: transcriptを観察し、
  受信メッセージを注入し、MarkdownレポートをエクスポートするためのデバッガUIとQAバス。
- `qa/`: キックオフタスクとベースラインQA
  シナリオ向けの、リポジトリに裏付けられたシードアセット。

現在のQAオペレーターのフローは、2ペイン構成のQAサイトです:

- 左: エージェントを備えたGatewayダッシュボード（Control UI）。
- 右: Slack風のtranscriptとシナリオ計画を表示するQA Lab。

次で実行します:

```bash
pnpm qa:lab:up
```

これによりQAサイトがビルドされ、Dockerベースのgatewayレーンが起動し、
オペレーターまたは自動化ループがエージェントにQA
ミッションを与え、実際のチャネル動作を観察し、何が機能し、何が失敗し、または
何が未解決のままかを記録できるQA Labページが公開されます。

Dockerイメージを毎回再ビルドせずにQA Lab UIをより高速に反復するには、
QA Labバンドルをbind mountした状態でスタックを起動します:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は、Dockerサービスを事前ビルド済みイメージ上で維持しつつ、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにbind mountします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Labのアセットハッシュが変化すると
ブラウザは自動で再読み込みされます。

## リポジトリに裏付けられたシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

これらは、QA計画が人間にも
エージェントにも見えるように、意図的にgitに含められています。
ベースラインの一覧は、次をカバーできるだけの広さを保つ必要があります:

- DMとchannelチャット
- threadの動作
- メッセージアクションのライフサイクル
- cronコールバック
- メモリーの想起
- モデル切り替え
- subagentの引き継ぎ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invadersのような小規模なビルドタスク1件

## レポート

`qa-lab` は、観察されたバスタイムラインからMarkdown形式のプロトコルレポートをエクスポートします。
このレポートは次に答える必要があります:

- 何が機能したか
- 何が失敗したか
- 何が未解決のままだったか
- どのフォローアップシナリオを追加する価値があるか

キャラクターと文体のチェックには、同じシナリオを複数のライブmodel
refで実行し、評価付きMarkdownレポートを書き出します:

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

このコマンドは、DockerではなくローカルのQA gateway子プロセスを実行します。character eval
シナリオでは `SOUL.md` を通じてpersonaを設定し、その後、
チャット、ワークスペースのヘルプ、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。
候補モデルには、それが評価中であることを伝えてはいけません。このコマンドは各完全な
transcriptを保持し、基本的な実行統計を記録したうえで、judgeモデルにfast modeで
`xhigh` reasoningを使って、自然さ、雰囲気、ユーモアの観点から実行結果を順位付けさせます。
プロバイダーを比較するときは `--blind-judge-models` を使用してください: judgeプロンプトには引き続き
すべてのtranscriptと実行状態が渡されますが、候補refは `candidate-01` のような
中立的なラベルに置き換えられます。レポートは、解析後に順位を実際のrefへ対応付け直します。
候補実行のデフォルトは `high` thinkingで、対応するOpenAIモデルでは `xhigh` を使います。
特定の候補を上書きするには、
`--model provider/model,thinking=<level>` をインラインで指定します。`--thinking <level>` は引き続き
グローバルなフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式も
互換性のために維持されています。
OpenAIの候補refは、プロバイダーが対応している場合に優先処理を使うため、
デフォルトでfast modeです。単一の候補またはjudgeで上書きが必要な場合は、インラインで
`,fast`、`,no-fast`、または `,fast=false` を追加してください。すべての候補モデルで
fast modeを強制的に有効にしたい場合にのみ `--fast` を渡します。候補とjudgeの所要時間は
ベンチマーク分析用にレポートへ記録されますが、judgeプロンプトには明示的に
速度で順位付けしないよう指示されます。
候補とjudgeのモデル実行は、どちらもデフォルトで並列数16です。プロバイダー制限やローカルgatewayへの
負荷によって実行のノイズが大きすぎる場合は、
`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、character evalのデフォルトは
`openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、および
`google/gemini-3.1-pro-preview` になります。
`--judge-model` が渡されない場合、judgeのデフォルトは
`openai/gpt-5.4,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [テスト](/ja-JP/help/testing)
- [QA Channel](/ja-JP/channels/qa-channel)
- [ダッシュボード](/web/dashboard)
