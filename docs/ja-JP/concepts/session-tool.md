---
read_when:
    - エージェントがどのようなセッションツールを持っているかを理解したい
    - セッション横断アクセスやサブエージェント生成を設定したい
    - 生成されたサブエージェントのステータス確認や制御をしたい
summary: セッション横断のステータス、想起、メッセージング、サブエージェントのオーケストレーションのためのエージェントツール
title: Session Tools
x-i18n:
    generated_at: "2026-04-05T12:42:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# Session Tools

OpenClaw は、セッションをまたいで作業し、ステータスを確認し、
サブエージェントをオーケストレーションするためのツールをエージェントに提供します。

## 利用可能なツール

| Tool               | 機能 |
| ------------------ | ---- |
| `sessions_list`    | オプションのフィルター（種類、最近性）付きでセッションを一覧表示する |
| `sessions_history` | 特定のセッションのトランスクリプトを読む |
| `sessions_send`    | 別のセッションにメッセージを送信し、必要に応じて待機する |
| `sessions_spawn`   | バックグラウンド作業用に分離されたサブエージェントセッションを生成する |
| `sessions_yield`   | 現在のターンを終了し、後続のサブエージェント結果を待機する |
| `subagents`        | このセッション用に生成されたサブエージェントの一覧表示、ステア、停止を行う |
| `session_status`   | `/status` 風のカードを表示し、必要に応じてセッションごとのモデル上書きを設定する |

## セッションの一覧表示と読み取り

`sessions_list` は、キー、種類、チャンネル、モデル、トークン数、
タイムスタンプ付きでセッションを返します。種類（`main`、`group`、`cron`、`hook`、
`node`）または最近性（`activeMinutes`）でフィルターできます。

`sessions_history` は、特定のセッションの会話トランスクリプトを取得します。
デフォルトではツール結果は除外されます。表示したい場合は `includeTools: true` を渡してください。
返されるビューは、意図的に制限され、安全性フィルターが適用されています。

- assistant テキストは想起前に正規化されます:
  - thinking タグは除去される
  - `<relevant-memories>` / `<relevant_memories>` のスキャフォールディングブロックは除去される
  - `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
    `<function_calls>...</function_calls>` のようなプレーンテキストの
    ツールコール XML ペイロードブロックは除去され、
    正常に閉じられていない途中切れのペイロードも含まれる
  - `[Tool Call: ...]`、
    `[Tool Result ...]`、`[Historical context ...]` のような
    ダウングレードされたツールコール / 結果スキャフォールディングは除去される
  - `<|assistant|>`、その他の ASCII の
    `<|...|>` トークン、および全角の `<｜...｜>` 変種のような
    漏えいしたモデル制御トークンは除去される
  - `<invoke ...>` /
    `</minimax:tool_call>` のような不正な MiniMax ツールコール XML は除去される
- 認証情報 / トークンのようなテキストは返却前にマスクされる
- 長いテキストブロックは切り詰められる
- 非常に大きな履歴では、古い行が落とされるか、大きすぎる行が
  `[sessions_history omitted: message too large]` に置き換えられることがある
- ツールは `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted`、`bytes` などのサマリーフラグを報告する

両方のツールは、**session key**（`"main"` など）または以前の一覧呼び出しで得た
**session ID** のどちらも受け付けます。

完全にバイト単位で一致するトランスクリプトが必要な場合は、
`sessions_history` を生ダンプとして扱うのではなく、ディスク上のトランスクリプトファイルを確認してください。

## セッション間メッセージの送信

`sessions_send` は別のセッションにメッセージを配信し、必要に応じて
応答を待機します。

- **送って終わり:** `timeoutSeconds: 0` を設定すると、キューに入れてすぐ返る
- **返信を待つ:** タイムアウトを設定すると、その場で応答を受け取れる

対象が応答した後、OpenClaw は**reply-back loop** を実行でき、エージェント同士が
最大 5 ターンまで交互にメッセージを送ります。対象エージェントは
`REPLY_SKIP` を返して早期に停止できます。

## ステータスとオーケストレーションの補助

`session_status` は、現在または別の可視セッションに対する軽量な
`/status` 相当ツールです。使用状況、時刻、モデル / ランタイム状態、および存在する場合は
リンクされたバックグラウンドタスクのコンテキストを報告します。`/status` と同様に、
最新のトランスクリプト使用状況エントリーから不足しているトークン / キャッシュカウンターを補完でき、
`model=default` はセッションごとの上書きを解除します。

`sessions_yield` は、待機している後続イベントが次のメッセージになるように、
意図的に現在のターンを終了します。サブエージェント生成後に、
ポーリングループを組むのではなく、完了結果を次のメッセージとして受け取りたい場合に使用します。

`subagents` は、すでに生成された OpenClaw
サブエージェントのためのコントロールプレーン補助です。次をサポートします。

- `action: "list"` でアクティブ / 最近の実行を確認する
- `action: "steer"` で実行中の子に追加入力を送る
- `action: "kill"` で 1 つの子または `all` を停止する

## サブエージェントの生成

`sessions_spawn` は、バックグラウンドタスク用の分離されたセッションを生成します。これは常に
非ブロッキングです。`runId` と `childSessionKey` を返してすぐに戻ります。

主なオプション:

- `runtime: "subagent"`（デフォルト）または外部ハーネスエージェント用の `"acp"`
- 子セッション用の `model` と `thinking` の上書き
- `thread: true` で生成をチャットスレッド（Discord、Slack など）にバインドする
- `sandbox: "require"` で子に sandbox を強制する

デフォルトの末端サブエージェントはセッションツールを受け取りません。
`maxSpawnDepth >= 2` の場合、深さ 1 のオーケストレーターサブエージェントはさらに
`sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を受け取り、
自身の子を管理できます。末端の実行には引き続き再帰的な
オーケストレーションツールは渡されません。

完了後、通知ステップが結果を依頼元のチャンネルに投稿します。
完了配信は、利用可能な場合はバインドされたスレッド / トピックのルーティングを維持し、
完了元がチャンネルしか特定していない場合でも、OpenClaw は直接配信のために依頼元セッションに保存されたルート
（`lastChannel` / `lastTo`）を再利用できます。

ACP 固有の動作については、[ACP Agents](/tools/acp-agents) を参照してください。

## 可視性

セッションツールは、エージェントが見られる範囲を制限するようスコープ設定されています。

| Level   | スコープ |
| ------- | -------- |
| `self`  | 現在のセッションのみ |
| `tree`  | 現在のセッション + 生成されたサブエージェント |
| `agent` | このエージェントの全セッション |
| `all`   | 全セッション（設定されていればエージェント間も含む） |

デフォルトは `tree` です。sandbox 化されたセッションは、設定に関係なく
`tree` に固定されます。

## さらに読む

- [Session Management](/concepts/session) -- ルーティング、ライフサイクル、保守
- [ACP Agents](/tools/acp-agents) -- 外部ハーネスの生成
- [Multi-agent](/concepts/multi-agent) -- マルチエージェントアーキテクチャ
- [Gateway Configuration](/gateway/configuration) -- セッションツール設定ノブ
