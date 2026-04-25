---
read_when:
    - エージェントループまたはライフサイクルイベントの正確なウォークスルーが必要な場合
    - セッションキューイング、トランスクリプト書き込み、またはセッション書き込みロックの動作を変更している場合
summary: エージェントループのライフサイクル、ストリーム、および待機セマンティクス
title: エージェントループ
x-i18n:
    generated_at: "2026-04-25T13:45:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

エージェントループは、エージェントの完全な「本物の」実行です: 取り込み → コンテキスト組み立て → モデル推論 →
ツール実行 → ストリーミング返信 → 永続化。これは、メッセージを
アクションと最終返信に変換しながら、セッション状態の整合性を保つための権威ある経路です。

OpenClaw では、ループはセッションごとに単一の直列化された実行であり、
モデルが思考し、ツールを呼び出し、出力をストリーミングする際に、ライフサイクルイベントとストリームイベントを発行します。このドキュメントでは、その真正なループが
エンドツーエンドでどのように接続されているかを説明します。

## エントリポイント

- Gateway RPC: `agent` と `agent.wait`。
- CLI: `agent` コマンド。

## 仕組み（高レベル）

1. `agent` RPC は params を検証し、セッション（sessionKey/sessionId）を解決し、セッションメタデータを永続化し、即座に `{ runId, acceptedAt }` を返します。
2. `agentCommand` がエージェントを実行します:
   - model + thinking/verbose/trace のデフォルトを解決する
   - Skills スナップショットを読み込む
   - `runEmbeddedPiAgent`（pi-agent-core ランタイム）を呼び出す
   - 埋め込みループが出さなかった場合は **lifecycle end/error** を発行する
3. `runEmbeddedPiAgent`:
   - セッションごと + グローバルキューを通じて実行を直列化する
   - model + auth profile を解決して Pi セッションを構築する
   - pi イベントを購読し、assistant/tool の差分をストリーミングする
   - タイムアウトを強制し、超過時は実行を中止する
   - payload と usage metadata を返す
4. `subscribeEmbeddedPiSession` は pi-agent-core イベントを OpenClaw `agent` ストリームへ橋渡しします:
   - ツールイベント => `stream: "tool"`
   - assistant 差分 => `stream: "assistant"`
   - ライフサイクルイベント => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` は `waitForAgentRun` を使用します:
   - `runId` の **lifecycle end/error** を待つ
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` を返す

## キューイング + 並行性

- 実行はセッションキー単位（session lane）で直列化され、必要に応じてグローバル lane も通ります。
- これによりツール/セッションの競合を防ぎ、セッション履歴の整合性を保ちます。
- メッセージングチャネルは、この lane システムに流し込まれる queue mode（collect/steer/followup）を選択できます。
  [Command Queue](/ja-JP/concepts/queue) を参照してください。
- トランスクリプト書き込みも、セッションファイル上のセッション書き込みロックで保護されます。このロックは
  process-aware かつ file-based なので、インプロセスキューをバイパスするライターや別プロセスからのライターも検出します。
- セッション書き込みロックは、デフォルトでは再入不可です。あるヘルパーが、同じ論理ライターを保ちながら
  同じロック取得を意図的にネストする場合は、
  `allowReentrant: true` で明示的にオプトインする必要があります。

## セッション + ワークスペース準備

- ワークスペースは解決されて作成されます。サンドボックス化された実行では、サンドボックスワークスペースルートへリダイレクトされることがあります。
- Skills は読み込まれ（またはスナップショットから再利用され）、env とプロンプトに注入されます。
- ブートストラップ/コンテキストファイルは解決され、システムプロンプトレポートに注入されます。
- セッション書き込みロックが取得され、`SessionManager` はストリーミング前に開かれて準備されます。後続の
  トランスクリプト書き換え、Compaction、または切り詰め経路では、トランスクリプトファイルを開くまたは変更する前に
  同じロックを取得する必要があります。

## プロンプト組み立て + システムプロンプト

- システムプロンプトは、OpenClaw のベースプロンプト、Skills プロンプト、ブートストラップコンテキスト、および実行ごとの上書きから構築されます。
- モデル固有の制限と Compaction 用の予約トークンが強制されます。
- モデルが何を見るかについては [System prompt](/ja-JP/concepts/system-prompt) を参照してください。

## フックポイント（介入できる場所）

OpenClaw には 2 つのフックシステムがあります。

- **内部フック**（Gateway hooks）: コマンドとライフサイクルイベント向けのイベント駆動スクリプト。
- **Plugin hooks**: エージェント/ツールのライフサイクルおよび gateway パイプライン内の拡張ポイント。

### 内部フック（Gateway hooks）

- **`agent:bootstrap`**: システムプロンプトが確定する前にブートストラップファイルを構築している間に実行されます。
  これを使ってブートストラップコンテキストファイルを追加/削除します。
- **コマンドフック**: `/new`、`/reset`、`/stop`、およびその他のコマンドイベント（Hooks ドキュメント参照）。

セットアップと例については [Hooks](/ja-JP/automation/hooks) を参照してください。

### Plugin hooks（エージェント + gateway ライフサイクル）

これらはエージェントループまたは gateway パイプライン内で実行されます。

- **`before_model_resolve`**: モデル解決前に provider/model を決定的に上書きするため、セッション前（`messages` なし）に実行されます。
- **`before_prompt_build`**: セッション読み込み後（`messages` あり）に実行され、プロンプト送信前に `prependContext`、`systemPrompt`、`prependSystemContext`、または `appendSystemContext` を注入します。ターンごとの動的テキストには `prependContext` を、システムプロンプト空間に置くべき安定したガイダンスには system-context フィールドを使用してください。
- **`before_agent_start`**: レガシー互換性フックで、どちらのフェーズでも実行される可能性があります。上記の明示的なフックを優先してください。
- **`before_agent_reply`**: インラインアクション後、LLM 呼び出し前に実行され、Plugin がそのターンを引き受けて合成返信を返すか、ターン全体を完全に無音化できます。
- **`agent_end`**: 完了後の最終メッセージリストと実行 metadata を検査します。
- **`before_compaction` / `after_compaction`**: Compaction サイクルを観察または注釈付けします。
- **`before_tool_call` / `after_tool_call`**: ツール params/result を横取りします。
- **`before_install`**: 内蔵スキャンの検出結果を検査し、必要に応じて Skill または Plugin のインストールをブロックします。
- **`tool_result_persist`**: ツール結果が OpenClaw 管理のセッショントランスクリプトに書き込まれる前に、同期的に変換します。
- **`message_received` / `message_sending` / `message_sent`**: 受信 + 送信メッセージフック。
- **`session_start` / `session_end`**: セッションのライフサイクル境界。
- **`gateway_start` / `gateway_stop`**: gateway のライフサイクルイベント。

送信/ツールガードのフック決定ルール:

- `before_tool_call`: `{ block: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `before_install`: `{ block: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端であり、より低い優先度のハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しません。

フック API と登録の詳細は [Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

ハーネスによって、これらのフックの適応方法は異なる場合があります。Codex app-server ハーネスは、
文書化されたミラー対象サーフェスの互換契約として OpenClaw Plugin hooks を維持しつつ、
Codex ネイティブフックは別個のより低レベルな Codex メカニズムとして扱います。

## ストリーミング + 部分返信

- assistant 差分は pi-agent-core からストリーミングされ、`assistant` イベントとして発行されます。
- ブロックストリーミングは、`text_end` または `message_end` で部分返信を発行できます。
- reasoning ストリーミングは、別ストリームとして、またはブロック返信として発行できます。
- チャンク分割とブロック返信の動作については [Streaming](/ja-JP/concepts/streaming) を参照してください。

## ツール実行 + メッセージングツール

- ツールの start/update/end イベントは `tool` ストリームで発行されます。
- ツール結果は、ログ/発行前にサイズと画像 payload に対してサニタイズされます。
- メッセージングツールの送信は、assistant の重複確認を抑制するために追跡されます。

## 返信整形 + 抑制

- 最終 payload は次から組み立てられます:
  - assistant テキスト（および任意の reasoning）
  - インラインツール要約（verbose + 許可時）
  - モデルエラー時の assistant エラーテキスト
- 正確なサイレントトークン `NO_REPLY` / `no_reply` は、送信 payload から
  フィルタリングされます。
- メッセージングツールの重複は最終 payload リストから削除されます。
- 表示可能な payload が何も残らず、かつツールがエラーになった場合は、
  フォールバックのツールエラー返信が発行されます
  （ただし、メッセージングツールがすでにユーザー可視の返信を送っている場合は除きます）。

## Compaction + リトライ

- 自動 Compaction は `compaction` ストリームイベントを発行し、リトライをトリガーすることがあります。
- リトライ時には、重複出力を避けるため、インメモリバッファとツール要約がリセットされます。
- Compaction パイプラインについては [Compaction](/ja-JP/concepts/compaction) を参照してください。

## イベントストリーム（現在）

- `lifecycle`: `subscribeEmbeddedPiSession` によって発行される（およびフォールバックとして `agentCommand` でも発行される）
- `assistant`: pi-agent-core からのストリーミング差分
- `tool`: pi-agent-core からのストリーミングツールイベント

## チャットチャネル処理

- assistant 差分は chat `delta` メッセージにバッファされます。
- chat `final` は **lifecycle end/error** 時に発行されます。

## タイムアウト

- `agent.wait` デフォルト: 30 秒（待機のみ）。`timeoutMs` param で上書きします。
- エージェントランタイム: `agents.defaults.timeoutSeconds` のデフォルトは 172800 秒（48 時間）。`runEmbeddedPiAgent` の abort timer で強制されます。
- LLM アイドルタイムアウト: `agents.defaults.llm.idleTimeoutSeconds` は、アイドルウィンドウ内に応答チャンクが到着しない場合にモデルリクエストを中止します。低速なローカルモデルや reasoning/ツール呼び出し provider では明示的に設定してください。無効にするには 0 を設定します。未設定の場合、OpenClaw は `agents.defaults.timeoutSeconds` が設定されていればそれを使用し、そうでなければ 120 秒を使用します。Cron トリガー実行で明示的な LLM またはエージェントタイムアウトがない場合、アイドルウォッチドッグは無効化され、Cron 外側のタイムアウトに依存します。

## 途中で終了しうる場所

- エージェントタイムアウト（abort）
- AbortSignal（cancel）
- Gateway 切断または RPC タイムアウト
- `agent.wait` タイムアウト（待機のみで、エージェント自体は停止しない）

## 関連

- [Tools](/ja-JP/tools) — 利用可能なエージェントツール
- [Hooks](/ja-JP/automation/hooks) — エージェントのライフサイクルイベントでトリガーされるイベント駆動スクリプト
- [Compaction](/ja-JP/concepts/compaction) — 長い会話がどのように要約されるか
- [Exec Approvals](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Thinking](/ja-JP/tools/thinking) — thinking/reasoning レベル設定
