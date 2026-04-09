---
read_when:
    - エージェントループまたはライフサイクルイベントの正確な手順が必要な場合
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: Agent Loop
x-i18n:
    generated_at: "2026-04-09T01:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32d3a73df8dabf449211a6183a70dcfd2a9b6f584dc76d0c4c9147582b2ca6a1
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Agent Loop (OpenClaw)

agentic loop とは、エージェントの完全な「実際の」実行のことです: 受信 → コンテキストの組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、セッション状態の整合性を保ちながら、メッセージを
アクションと最終返信に変換する権威ある経路です。

OpenClaw では、ループはセッションごとに単一の直列化された実行であり、モデルが思考し、ツールを呼び出し、
出力をストリーミングする間にライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、
その実際のループがエンドツーエンドでどのように配線されているかを説明します。

## エントリポイント

- Gateway RPC: `agent` と `agent.wait`
- CLI: `agent` コマンド

## 仕組み（高レベル）

1. `agent` RPC はパラメータを検証し、セッションを解決し（sessionKey/sessionId）、セッションメタデータを永続化し、すぐに `{ runId, acceptedAt }` を返します。
2. `agentCommand` がエージェントを実行します:
   - モデルと thinking/verbose のデフォルトを解決
   - Skills スナップショットを読み込み
   - `runEmbeddedPiAgent` を呼び出し（pi-agent-core ランタイム）
   - 埋め込みループが発行しない場合は **ライフサイクル end/error** を発行
3. `runEmbeddedPiAgent`:
   - セッション単位 + グローバルキューにより実行を直列化
   - モデル + auth プロファイルを解決して pi セッションを構築
   - pi イベントを購読し、assistant/tool の差分をストリーミング
   - タイムアウトを強制し、超過した場合は実行を中断
   - ペイロード + usage メタデータを返す
4. `subscribeEmbeddedPiSession` が pi-agent-core のイベントを OpenClaw の `agent` ストリームに橋渡しします:
   - ツールイベント => `stream: "tool"`
   - assistant 差分 => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` の **ライフサイクル end/error** を待機
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行性

- 実行はセッションキー単位（セッションレーン）で直列化され、必要に応じてグローバルレーンも通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の整合性を保ちます。
- メッセージングチャネルは、このレーンシステムに流し込まれるキューモード（collect/steer/followup）を選択できます。
  詳しくは [Command Queue](/ja-JP/concepts/queue) を参照してください。

## セッション + ワークスペースの準備

- ワークスペースは解決および作成され、サンドボックス化された実行ではサンドボックスのワークスペースルートにリダイレクトされる場合があります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- Bootstrap/context ファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得され、`SessionManager` がストリーミング前にオープンおよび準備されます。

## プロンプトの組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、bootstrap コンテキスト、および実行ごとのオーバーライドから構築されます。
- モデル固有の制限と compaction の予約トークンが適用されます。
- モデルが何を見るかについては [System prompt](/ja-JP/concepts/system-prompt) を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 つのフックシステムがあります。

- **内部フック**（Gateway hooks）: コマンドとライフサイクルイベントのためのイベント駆動スクリプト
- **プラグインフック**: エージェント/ツールのライフサイクルおよび Gateway パイプライン内の拡張ポイント

### 内部フック（Gateway hooks）

- **`agent:bootstrap`**: システムプロンプトが最終化される前に bootstrap ファイルを構築している間に実行されます。
  これを使用して bootstrap コンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、およびその他のコマンドイベント（Hooks ドキュメントを参照）

セットアップと例については [Hooks](/ja-JP/automation/hooks) を参照してください。

### プラグインフック（エージェント + Gateway ライフサイクル）

これらはエージェントループまたは Gateway パイプライン内で実行されます。

- **`before_model_resolve`**: モデル解決前に、provider/model を決定的にオーバーライドするためにセッション前（`messages` なし）に実行されます。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使用し、システムプロンプト空間に配置されるべき安定したガイダンスには system-context フィールドを使用します。
- **`before_agent_start`**: どちらのフェーズでも実行される可能性があるレガシー互換フックです。明示的な上記フックを優先してください。
- **`before_agent_reply`**: インラインアクションの後、LLM 呼び出しの前に実行され、プラグインがそのターンを引き受けて合成返信を返したり、そのターンを完全に無言にしたりできます。
- **`agent_end`**: 完了後に最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: compaction サイクルを観測または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールのパラメータ/結果に介入します。
- **`before_install`**: 組み込みのスキャン結果を検査し、必要に応じて skill または plugin のインストールをブロックします。
- **`tool_result_persist`**: ツール結果がセッショントランスクリプトに書き込まれる前に、同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック
- **`session_start` / `session_end`**: セッションライフサイクルの境界
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント

送信/ツールガードのフック判定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しません。

フック API と登録の詳細については [Plugin hooks](/ja-JP/plugins/architecture#provider-runtime-hooks) を参照してください。

## ストリーミング + 部分返信

- assistant 差分は pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングでは、`text_end` または `message_end` で部分返信を発行できます。
- reasoning ストリーミングは、別個のストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の挙動については [Streaming](/ja-JP/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツールの start/update/end イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行の前に、サイズと画像ペイロードについてサニタイズされます。
- メッセージングツールの送信は、assistant の重複確認を抑制するために追跡されます。

## 返信の整形 + 抑制

- 最終ペイロードは次から組み立てられます:
  - assistant テキスト（および任意の reasoning）
  - インラインツール要約（verbose かつ許可されている場合）
  - モデルエラー時の assistant エラーテキスト
- 正確な silent token `NO_REPLY` / `no_reply` は送信ペイロードから
  フィルタリングされます。
- メッセージングツールの重複は最終ペイロードリストから削除されます。
- 描画可能なペイロードが何も残っておらず、かつツールでエラーが発生した場合は、フォールバックのツールエラー返信が発行されます
  （ただし、メッセージングツールがすでにユーザーに見える返信を送信している場合を除きます）。

## compaction + リトライ

- 自動 compaction は `compaction` ストリームイベントを発行し、リトライを引き起こすことがあります。
- リトライ時には、重複出力を避けるためにインメモリバッファとツール要約がリセットされます。
- compaction パイプラインについては [Compaction](/ja-JP/concepts/compaction) を参照してください。

## イベントストリーム（現時点）

- `lifecycle`: `subscribeEmbeddedPiSession` により発行されます（およびフォールバックとして `agentCommand` からも発行されます）
- `assistant`: pi-agent-core からストリーミングされる差分
- `tool`: pi-agent-core からストリーミングされるツールイベント

## チャットチャネルの処理

- assistant 差分はチャット `delta` メッセージにバッファリングされます。
- チャット `final` は **lifecycle end/error** で発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30 秒（待機のみ）。`timeoutMs` パラメータで上書きします。
- エージェント実行時: `agents.defaults.timeoutSeconds` のデフォルトは 172800 秒（48 時間）で、`runEmbeddedPiAgent` の中断タイマーで強制されます。
- LLM アイドルタイムアウト: `agents.defaults.llm.idleTimeoutSeconds` は、アイドルウィンドウ内に応答チャンクが到着しない場合にモデルリクエストを中断します。低速なローカルモデルや reasoning/tool-call provider では明示的に設定してください。無効にするには 0 に設定します。これが設定されていない場合、OpenClaw は `agents.defaults.timeoutSeconds` が設定されていればそれを使用し、そうでなければ 60 秒を使用します。明示的な LLM またはエージェントタイムアウトがない cron トリガー実行では、アイドルウォッチドッグは無効化され、cron の外側のタイムアウトに依存します。

## 早期終了する可能性がある場所

- エージェントタイムアウト（中断）
- AbortSignal（キャンセル）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみで、エージェントは停止しない）

## 関連

- [Tools](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントによってトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話がどのように要約されるか
- [Exec Approvals](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベルの設定
