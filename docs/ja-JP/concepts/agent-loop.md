---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要な場合
summary: エージェントループのライフサイクル、ストリーム、待機セマンティクス
title: Agent Loop
x-i18n:
    generated_at: "2026-04-05T12:40:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Agent Loop (OpenClaw)

エージェントループとは、エージェントの完全な「実際の」実行全体を指します: 取り込み → コンテキストの組み立て → モデル推論 →
ツール実行 → 返信のストリーミング → 永続化。これは、セッション状態の一貫性を保ちながら、
メッセージをアクションと最終返信に変換する正式な経路です。

OpenClawでは、ループはセッションごとに単一の直列化された実行であり、モデルが思考し、ツールを呼び出し、出力をストリーミングする間、
ライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、その実際のループがエンドツーエンドでどのように接続されているかを説明します。

## エントリポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 動作のしくみ（概要）

1. `agent` RPC はパラメータを検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化して、即座に `{ runId, acceptedAt }` を返します。
2. `agentCommand` がエージェントを実行します:
   - モデル + thinking/verbose のデフォルトを解決
   - Skillsスナップショットを読み込み
   - `runEmbeddedPiAgent` を呼び出す（pi-agent-core ランタイム）
   - 埋め込みループが発行しない場合は **lifecycle end/error** を発行
3. `runEmbeddedPiAgent`:
   - セッションごと + グローバルキューごとに実行を直列化
   - モデル + auth profile を解決し、pi セッションを構築
   - pi イベントを購読し、assistant/tool の差分をストリーミング
   - タイムアウトを強制し、超過した場合は実行を中止
   - ペイロード + 使用量メタデータを返す
4. `subscribeEmbeddedPiSession` は pi-agent-core イベントを OpenClaw の `agent` ストリームへブリッジします:
   - ツールイベント => `stream: "tool"`
   - assistant の差分 => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` に対する **lifecycle end/error** を待機
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行性

- 実行はセッションキーごと（セッションレーン）に直列化され、必要に応じてグローバルレーンも通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の一貫性を保ちます。
- メッセージングチャネルは、このレーンシステムに流し込まれるキューモード（collect/steer/followup）を選択できます。
  詳しくは [Command Queue](/concepts/queue) を参照してください。

## セッション + ワークスペースの準備

- ワークスペースが解決および作成されます。サンドボックス化された実行では、サンドボックスワークスペースルートにリダイレクトされることがあります。
- Skills が読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- Bootstrap/context ファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得され、`SessionManager` が開かれてストリーミング前に準備されます。

## プロンプトの組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、bootstrap context、および実行ごとのオーバーライドから構築されます。
- モデル固有の制限と compaction のための予約トークンが適用されます。
- モデルが何を見るかについては、[System prompt](/concepts/system-prompt) を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 つのフックシステムがあります:

- **内部フック**（Gatewayフック）: コマンドおよびライフサイクルイベント用のイベント駆動スクリプト。
- **プラグインフック**: エージェント/ツールのライフサイクルおよび Gateway パイプライン内の拡張ポイント。

### 内部フック（Gatewayフック）

- **`agent:bootstrap`**: システムプロンプトが確定する前に bootstrap ファイルを構築している間に実行されます。
  これを使って bootstrap context ファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、およびその他のコマンドイベント（Hooks ドキュメントを参照）。

セットアップと例については、[Hooks](/ja-JP/automation/hooks) を参照してください。

### プラグインフック（エージェント + Gateway ライフサイクル）

これらはエージェントループ内または Gateway パイプライン内で実行されます:

- **`before_model_resolve`**: モデル解決前に、provider/model を決定的にオーバーライドするために、セッション前（`messages` なし）で実行されます。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使い、システムプロンプト空間に置くべき安定したガイダンスには system-context フィールドを使ってください。
- **`before_agent_start`**: 旧来の互換性フックで、どちらのフェーズでも実行される可能性があります。上記の明示的なフックを優先してください。
- **`before_agent_reply`**: インラインアクションの後、LLM 呼び出しの前に実行され、プラグインがそのターンを引き受けて合成返信を返したり、そのターンを完全に無音化したりできます。
- **`agent_end`**: 完了後に最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: compaction サイクルを観察または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールのパラメータ/結果をインターセプトします。
- **`before_install`**: 組み込みスキャンの検出結果を検査し、必要に応じて Skill またはプラグインのインストールをブロックします。
- **`tool_result_persist`**: ツール結果がセッショントランスクリプトに書き込まれる前に、同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクルの境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガードのためのフック判断ルール:

- `before_tool_call`: `{ block: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

フック API と登録の詳細については、[Plugin hooks](/plugins/architecture#provider-runtime-hooks) を参照してください。

## ストリーミング + 部分返信

- assistant の差分は pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` で部分返信を発行できます。
- reasoning ストリーミングは、別ストリームとして、またはブロック返信として発行できます。
- チャンク化とブロック返信の動作については、[Streaming](/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツール開始/更新/終了イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行前に、サイズと画像ペイロードについてサニタイズされます。
- 重複する assistant 確認を抑制するために、メッセージングツール送信は追跡されます。

## 返信の整形 + 抑制

- 最終ペイロードは、以下から組み立てられます:
  - assistant テキスト（および任意の reasoning）
  - インラインツール要約（verbose が有効で許可されている場合）
  - モデルエラー時の assistant エラーテキスト
- 完全一致の無音トークン `NO_REPLY` / `no_reply` は、送信ペイロードから
  フィルタリングされます。
- メッセージングツールの重複は、最終ペイロードリストから削除されます。
- 描画可能なペイロードが残っておらず、かつツールがエラーになった場合は、
  フォールバックのツールエラー返信が発行されます
  （ただし、メッセージングツールがすでにユーザーに見える返信を送信している場合を除きます）。

## compaction + リトライ

- 自動 compaction は `compaction` ストリームイベントを発行し、リトライをトリガーすることがあります。
- リトライ時には、出力の重複を避けるために、インメモリバッファとツール要約がリセットされます。
- compaction パイプラインについては、[Compaction](/concepts/compaction) を参照してください。

## イベントストリーム（現時点）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行されます（およびフォールバックとして `agentCommand` からも発行されます）
- `assistant`: pi-agent-core からのストリーミング差分
- `tool`: pi-agent-core からのストリーミングツールイベント

## チャットチャネルの処理

- assistant の差分はチャットの `delta` メッセージにバッファされます。
- チャットの `final` は **lifecycle end/error** で発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30 秒（待機のみ）。`timeoutMs` パラメータで上書きします。
- エージェント実行時間: `agents.defaults.timeoutSeconds` のデフォルトは 172800 秒（48 時間）で、`runEmbeddedPiAgent` の abort timer で強制されます。

## 途中で早期終了する可能性がある場所

- エージェントのタイムアウト（abort）
- AbortSignal（キャンセル）
- Gateway の切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみで、エージェントは停止しません）

## 関連

- [Tools](/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントでトリガーされるイベント駆動スクリプト
- [Compaction](/concepts/compaction) — 長い会話がどのように要約されるか
- [Exec Approvals](/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/tools/thinking) — thinking/reasoning レベルの設定
