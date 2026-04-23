---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要です
    - セッションのキューイング、トランスクリプトの書き込み、またはセッション書き込みロックの動作を変更しています
summary: エージェントループのライフサイクル、ストリーム、および待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-04-23T04:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# エージェントループ（OpenClaw）

エージェントループは、エージェントの完全な「実際の」実行です。取り込み → コンテキストの組み立て → モデル推論 →
ツール実行 → ストリーミング応答 → 永続化、という流れです。これは、セッション状態の一貫性を保ちながら、
メッセージをアクションと最終応答に変換する、正式な経路です。

OpenClawでは、ループはセッションごとに単一の直列化された実行であり、モデルが考え、ツールを呼び出し、
出力をストリーミングする間に、ライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、
この本物のループがエンドツーエンドでどのように配線されているかを説明します。

## エントリーポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 仕組み（概要）

1. `agent` RPCはパラメータを検証し、セッションを解決し（sessionKey/sessionId）、セッションメタデータを永続化し、すぐに `{ runId, acceptedAt }` を返します。
2. `agentCommand` がエージェントを実行します:
   - モデル + thinking/verbose/trace のデフォルトを解決する
   - Skills のスナップショットを読み込む
   - `runEmbeddedPiAgent` を呼び出す（pi-agent-core ランタイム）
   - 埋め込みループが発行しなかった場合は **lifecycle end/error** を発行する
3. `runEmbeddedPiAgent`:
   - セッションごと + グローバルのキューを通じて実行を直列化する
   - モデル + auth profile を解決し、pi セッションを構築する
   - pi イベントを購読し、assistant/tool の差分をストリーミングする
   - タイムアウトを強制し、超過した場合は実行を中断する
   - ペイロード + 使用量メタデータを返す
4. `subscribeEmbeddedPiSession` は pi-agent-core のイベントを OpenClaw の `agent` ストリームにブリッジします:
   - tool イベント => `stream: "tool"`
   - assistant の差分 => `stream: "assistant"`
   - lifecycle イベント => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` は `waitForAgentRun` を使います:
   - `runId` に対する **lifecycle end/error** を待つ
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行性

- 実行はセッションキーごと（session lane）に直列化され、必要に応じてグローバル lane も通ります。
- これにより、ツール/セッションの競合を防ぎ、セッション履歴の一貫性を保ちます。
- メッセージングチャネルは、この lane システムに流し込まれるキューモード（collect/steer/followup）を選択できます。
  詳しくは [Command Queue](/ja-JP/concepts/queue) を参照してください。
- トランスクリプトの書き込みも、セッションファイル上のセッション書き込みロックによって保護されます。このロックは
  プロセス認識型かつファイルベースであるため、プロセス内キューをバイパスする書き込みや、別プロセスからの
  書き込みも検出できます。
- セッション書き込みロックは、デフォルトでは再入不可です。あるヘルパーが、1つの論理ライターを維持したまま
  同じロックの取得を意図的にネストする場合は、`allowReentrant: true` を使って明示的にオプトインする必要があります。

## セッション + ワークスペースの準備

- ワークスペースは解決されて作成されます。サンドボックス化された実行では、サンドボックスのワークスペースルートに
  リダイレクトされる場合があります。
- Skills は読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- ブートストラップ/コンテキストファイルが解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得され、`SessionManager` はストリーミング前に開かれて準備されます。その後の
  トランスクリプトの書き換え、Compaction、切り詰めの各経路では、トランスクリプトファイルを開いたり変更したりする前に、
  同じロックを取得する必要があります。

## プロンプトの組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、ブートストラップコンテキスト、
  および実行ごとのオーバーライドから構築されます。
- モデル固有の制限と Compaction 用の予約トークンが適用されます。
- モデルが何を見るかについては、[System prompt](/ja-JP/concepts/system-prompt) を参照してください。

## フックポイント（介入できる場所）

OpenClawには2つのフックシステムがあります。

- **内部フック**（Gateway hooks）: コマンドとライフサイクルイベント向けのイベント駆動スクリプト。
- **Plugin フック**: エージェント/ツールのライフサイクルと Gateway パイプライン内の拡張ポイント。

### 内部フック（Gateway hooks）

- **`agent:bootstrap`**: システムプロンプトが確定する前に、ブートストラップファイルの構築中に実行されます。
  これを使ってブートストラップコンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、およびその他のコマンドイベント（Hooks ドキュメントを参照）。

セットアップと例については、[Hooks](/ja-JP/automation/hooks) を参照してください。

### Plugin フック（agent + gateway lifecycle）

これらはエージェントループまたは Gateway パイプライン内で実行されます。

- **`before_model_resolve`**: モデル解決の前に、provider/model を決定論的にオーバーライドするために、プレセッション（`messages` なし）で実行されます。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を使い、システムプロンプト空間に置くべき安定したガイダンスには system-context フィールドを使ってください。
- **`before_agent_start`**: レガシー互換フックで、どちらのフェーズでも実行される可能性があります。明示的な上記フックを優先してください。
- **`before_agent_reply`**: インラインアクション後、LLM 呼び出し前に実行され、Plugin がそのターンを引き受けて合成応答を返す、またはターンを完全に無音化できるようにします。
- **`agent_end`**: 完了後に最終メッセージリストと実行メタデータを検査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを監視または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツールのパラメータ/結果をインターセプトします。
- **`before_install`**: 組み込みスキャンの検出結果を検査し、skill または plugin のインストールを任意でブロックします。
- **`tool_result_persist`**: ツール結果がセッショントランスクリプトに書き込まれる前に、同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションライフサイクルの境界。
- **`gateway_start` / `gateway_stop`**: Gateway ライフサイクルイベント。

送信/ツールガード向けフックの判定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、それ以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、それ以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、それ以前のキャンセルを解除しません。

フック API と登録の詳細については、[Plugin hooks](/ja-JP/plugins/architecture#provider-runtime-hooks) を参照してください。

## ストリーミング + 部分応答

- assistant の差分は pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` のいずれかで部分応答を発行できます。
- reasoning のストリーミングは、別個のストリームとして、またはブロック応答として発行できます。
- チャンク化とブロック応答の動作については、[Streaming](/ja-JP/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツールの開始/更新/終了イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ記録/発行の前に、サイズと画像ペイロードについてサニタイズされます。
- 重複する assistant 確認を抑止するために、メッセージングツールの送信は追跡されます。

## 応答の整形 + 抑止

- 最終ペイロードは次の要素から組み立てられます:
  - assistant テキスト（および任意の reasoning）
  - インラインツール要約（verbose かつ許可されている場合）
  - モデルがエラーになった場合の assistant エラーテキスト
- 正確な無音トークン `NO_REPLY` / `no_reply` は、送信ペイロードから
  フィルタリングされます。
- メッセージングツールの重複は、最終ペイロードリストから削除されます。
- 描画可能なペイロードが何も残っておらず、かつツールがエラーになった場合は、フォールバックのツールエラー応答が発行されます
  （ただし、メッセージングツールがすでにユーザー可視の応答を送信している場合を除きます）。

## Compaction + リトライ

- 自動 Compaction は `compaction` ストリームイベントを発行し、リトライを引き起こすことがあります。
- リトライ時には、重複出力を避けるために、インメモリバッファとツール要約がリセットされます。
- Compaction パイプラインについては、[Compaction](/ja-JP/concepts/compaction) を参照してください。

## イベントストリーム（現在）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行される（およびフォールバックとして `agentCommand` からも発行される）
- `assistant`: pi-agent-core からストリーミングされる差分
- `tool`: pi-agent-core からストリーミングされるツールイベント

## チャットチャネルの処理

- assistant の差分はチャット `delta` メッセージにバッファされます。
- チャット `final` は **lifecycle end/error** で発行されます。

## タイムアウト

- `agent.wait` のデフォルト: 30秒（待機のみ）。`timeoutMs` パラメータで上書きします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは172800秒（48時間）で、`runEmbeddedPiAgent` の abort タイマーで強制されます。
- LLM アイドルタイムアウト: `agents.defaults.llm.idleTimeoutSeconds` は、アイドルウィンドウ内に応答チャンクが到着しない場合にモデルリクエストを中断します。遅いローカルモデルや reasoning/tool-call provider には明示的に設定してください。無効にするには `0` に設定します。設定されていない場合、OpenClaw は `agents.defaults.timeoutSeconds` が設定されていればそれを使い、そうでなければ120秒を使います。明示的な LLM またはエージェントタイムアウトがない Cron トリガーの実行では、アイドルウォッチドッグは無効化され、Cron の外側のタイムアウトに依存します。

## 早期終了しうる箇所

- エージェントタイムアウト（abort）
- AbortSignal（cancel）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみであり、エージェントは停止しない）

## 関連

- [Tools](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントライフサイクルイベントによってトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話がどのように要約されるか
- [Exec Approvals](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベル設定
