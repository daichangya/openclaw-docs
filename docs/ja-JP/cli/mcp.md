---
read_when:
    - Codex、Claude Code、または他のMCPクライアントをOpenClaw対応チャンネルに接続する
    - '`openclaw mcp serve`'
    - OpenClawに保存されたMCPサーバー定義の管理
summary: OpenClawのチャンネル会話をMCP経由で公開し、保存されたMCPサーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:44:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` には2つの役割があります。

- `openclaw mcp serve` で、OpenClawをMCPサーバーとして実行する
- `list`、`show`、`set`、`unset` で、OpenClawが所有する送信先MCPサーバー定義を管理する

つまり:

- `serve` は、OpenClawがMCPサーバーとして動作する場合です
- `list` / `show` / `set` / `unset` は、OpenClawが、後でそのランタイムが利用する可能性のある他のMCPサーバーのためのクライアント側レジストリとして動作する場合です

OpenClaw自身がコーディングharnessセッションをホストし、そのランタイムをACP経由でルーティングする場合は、[`openclaw acp`](/ja-JP/cli/acp) を使用してください。

## OpenClawをMCPサーバーとして使う

これは `openclaw mcp serve` の経路です。

## `serve` を使うべき場面

次の場合は `openclaw mcp serve` を使ってください。

- Codex、Claude Code、または他のMCPクライアントが、OpenClaw対応のチャンネル会話と直接やり取りする必要がある
- すでに、ルーティング済みセッションを持つローカルまたはリモートのOpenClaw Gatewayがある
- チャンネルごとに個別のブリッジを実行するのではなく、OpenClawのチャンネルバックエンド全体で動作する1つのMCPサーバーが欲しい

OpenClawがコーディングランタイム自体をホストし、エージェントセッションをOpenClaw内に保持する場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使ってください。

## 仕組み

`openclaw mcp serve` はstdio MCPサーバーを起動します。そのプロセスはMCPクライアントが所有します。クライアントがstdioセッションを開いている間、ブリッジはローカルまたはリモートのOpenClaw GatewayにWebSocketで接続し、ルーティング済みチャンネル会話をMCP経由で公開します。

ライフサイクル:

1. MCPクライアントが `openclaw mcp serve` を起動する
2. ブリッジがGatewayに接続する
3. ルーティング済みセッションが、MCP会話およびtranscript/historyツールとして利用可能になる
4. ブリッジ接続中はライブイベントがメモリ内にキューされる
5. Claudeチャンネルモードが有効な場合、同じセッションはClaude専用プッシュ通知も受信できる

重要な動作:

- ライブキューの状態は、ブリッジが接続した時点から開始されます
- それ以前のtranscript履歴は `messages_read` で読み取ります
- Claudeプッシュ通知は、MCPセッションが生きている間のみ存在します
- クライアントが切断すると、ブリッジは終了し、ライブキューも消えます
- `openclaw agent` や `openclaw infer model run` などの単発エージェントエントリーポイントは、返信完了時に、それらが開いたバンドル済みMCPランタイムを終了させるため、スクリプトの繰り返し実行でstdio MCP子プロセスが蓄積しません
- OpenClawが起動したstdio MCPサーバー（バンドル済みまたはユーザー設定）は、シャットダウン時にプロセスツリーとして停止されるため、サーバーが開始した子サブプロセスが、親stdioクライアント終了後も残り続けることはありません
- セッションの削除またはリセットでは、共有ランタイムクリーンアップ経路を通じて、そのセッションのMCPクライアントも破棄されるため、削除済みセッションに紐づいたstdio接続が残ることはありません

## クライアントモードを選ぶ

同じブリッジを2つの異なる方法で使えます。

- 汎用MCPクライアント: 標準MCPツールのみ。`conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send`、承認ツールを使います。
- Claude Code: 標準MCPツールに加えて、Claude専用チャンネルアダプターを使います。`--claude-channel-mode on` を有効にするか、デフォルトの `auto` のままにしてください。

現時点では、`auto` は `on` と同じ動作です。まだクライアント機能検出はありません。

## `serve` が公開するもの

このブリッジは、既存のGatewayセッションルートメタデータを使って、チャンネル対応の会話を公開します。会話は、OpenClawが次のような既知のルートを持つセッション状態をすでに保持している場合に表示されます。

- `channel`
- recipientまたはdestinationメタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより、MCPクライアントは次のことを1か所で行えます。

- 最近のルーティング済み会話を一覧表示する
- 最近のtranscript履歴を読む
- 新しい受信イベントを待つ
- 同じルートを通じて返信を送る
- ブリッジ接続中に到着した承認リクエストを見る

## 使用方法

```bash
# ローカルGateway
openclaw mcp serve

# リモートGateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# パスワード認証付きリモートGateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 詳細なブリッジログを有効化
openclaw mcp serve --verbose

# Claude専用プッシュ通知を無効化
openclaw mcp serve --claude-channel-mode off
```

## ブリッジツール

現在のブリッジは次のMCPツールを公開しています。

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Gatewayセッション状態にすでにルートメタデータがある、最近のセッション対応会話を一覧表示します。

便利なフィルター:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

`session_key` で1つの会話を返します。

### `messages_read`

1つのセッション対応会話について、最近のtranscriptメッセージを読み取ります。

### `attachments_fetch`

1つのtranscriptメッセージから、テキスト以外のメッセージ内容ブロックを抽出します。これはtranscript内容に対するメタデータビューであり、独立した永続的な添付blobストアではありません。

### `events_poll`

数値カーソル以降にキューされたライブイベントを読み取ります。

### `events_wait`

次の一致するキュー済みイベントが到着するか、タイムアウトが切れるまでlong-pollします。

これは、汎用MCPクライアントがClaude専用プッシュプロトコルなしで、ほぼリアルタイムの配信を必要とする場合に使います。

### `messages_send`

セッションにすでに記録されている同じルートを通じて、テキストを送信します。

現在の動作:

- 既存の会話ルートが必要です
- セッションのchannel、recipient、account id、thread idを使用します
- テキストのみ送信します

### `permissions_list_open`

ブリッジがGateway接続以降に観測した、保留中のexec/plugin承認リクエストを一覧表示します。

### `permissions_respond`

1つの保留中のexec/plugin承認リクエストを、次のいずれかで解決します。

- `allow-once`
- `allow-always`
- `deny`

## イベントモデル

ブリッジは、接続中の間、メモリ内イベントキューを保持します。

現在のイベントタイプ:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

重要な制限:

- キューはライブ専用で、MCPブリッジ開始時点から始まります
- `events_poll` と `events_wait` は、それ自体では過去のGateway履歴を再生しません
- 永続的なバックログは `messages_read` で読む必要があります

## Claudeチャンネル通知

このブリッジは、Claude専用のチャンネル通知も公開できます。これは、Claude Codeチャンネルアダプターに相当するOpenClaw版です。標準MCPツールは引き続き利用可能ですが、ライブ受信メッセージはClaude専用MCP通知としても届きます。

フラグ:

- `--claude-channel-mode off`: 標準MCPツールのみ
- `--claude-channel-mode on`: Claudeチャンネル通知を有効化
- `--claude-channel-mode auto`: 現在のデフォルト。`on` と同じブリッジ動作

Claudeチャンネルモードが有効な場合、サーバーはClaude実験的機能を広告し、次を送出できます。

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のブリッジ動作:

- 受信した `user` transcriptメッセージは `notifications/claude/channel` として転送されます
- MCP経由で受信したClaude権限リクエストはメモリ内で追跡されます
- リンクされた会話が後で `yes abcde` または `no abcde` を送信すると、ブリッジはそれを `notifications/claude/channel/permission` に変換します
- これらの通知はライブセッション専用です。MCPクライアントが切断すると、プッシュ先はなくなります

これは意図的にクライアント固有です。汎用MCPクライアントは標準pollingツールに依存してください。

## MCPクライアント設定

stdioクライアント設定の例:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

ほとんどの汎用MCPクライアントでは、まず標準ツール群から始めてClaudeモードは無視してください。Claude専用通知メソッドを実際に理解するクライアントでのみClaudeモードを有効にしてください。

## オプション

`openclaw mcp serve` は次をサポートします。

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gatewayトークン
- `--token-file <path>`: ファイルからトークンを読み込む
- `--password <password>`: Gatewayパスワード
- `--password-file <path>`: ファイルからパスワードを読み込む
- `--claude-channel-mode <auto|on|off>`: Claude通知モード
- `-v`, `--verbose`: stderrへの詳細ログ

可能な限り、インラインシークレットより `--token-file` または `--password-file` を優先してください。

## セキュリティと信頼境界

このブリッジはルーティングを新たに作り出しません。Gatewayがすでにルーティング方法を把握している会話だけを公開します。

つまり:

- 送信者許可リスト、ペアリング、チャンネルレベルの信頼は、引き続き基盤となるOpenClawチャンネル設定に属します
- `messages_send` は既存の保存済みルートを通じてのみ返信できます
- 承認状態は現在のブリッジセッションに対してのみライブ/メモリ内です
- ブリッジ認証には、他のリモートGatewayクライアントに対して信頼するのと同じGatewayトークンまたはパスワード制御を使うべきです

`conversations_list` に会話が表示されない場合、通常の原因はMCP設定ではありません。基盤となるGatewayセッションのルートメタデータが欠けているか、不完全であることです。

## テスト

OpenClawには、このブリッジ用の決定的なDockerスモークテストが含まれています。

```bash
pnpm test:docker:mcp-channels
```

このスモークテストでは:

- シード済みGatewayコンテナを起動します
- `openclaw mcp serve` を起動する2つ目のコンテナを起動します
- 会話検出、transcript読み取り、添付メタデータ読み取り、ライブイベントキュー動作、送信ルーティングを検証します
- 実際のstdio MCPブリッジ上で、Claude形式のチャンネル通知および権限通知を検証します

これは、実際のTelegram、Discord、またはiMessageアカウントをテスト実行に組み込まずに、ブリッジ動作を確認する最速の方法です。

より広いテストの文脈については、[Testing](/ja-JP/help/testing) を参照してください。

## トラブルシューティング

### 会話が返ってこない

通常は、Gatewayセッションがまだルーティング可能ではないことを意味します。基盤セッションにchannel/provider、recipient、および任意のaccount/threadルートメタデータが保存されていることを確認してください。

### `events_poll` または `events_wait` が過去のメッセージを取りこぼす

想定どおりです。ライブキューはブリッジ接続時に開始されます。過去のtranscript履歴は `messages_read` で読んでください。

### Claude通知が表示されない

次のすべてを確認してください。

- クライアントがstdio MCPセッションを開いたままにしている
- `--claude-channel-mode` が `on` または `auto` である
- クライアントが実際にClaude専用通知メソッドを理解している
- 受信メッセージがブリッジ接続後に発生した

### 承認が表示されない

`permissions_list_open` は、ブリッジ接続中に観測した承認リクエストだけを表示します。永続的な承認履歴APIではありません。

## OpenClawをMCPクライアントレジストリとして使う

これは `openclaw mcp list`、`show`、`set`、`unset` の経路です。

これらのコマンドは、OpenClawをMCP経由で公開しません。OpenClaw設定の `mcp.servers` 配下にある、OpenClaw所有のMCPサーバー定義を管理します。

それらの保存済み定義は、埋め込みPiやその他のランタイムアダプターなど、後でOpenClawが起動または設定するランタイム用です。OpenClawは、そうしたランタイムが独自に重複したMCPサーバー一覧を保持しなくてよいよう、定義を一元管理します。

重要な動作:

- これらのコマンドはOpenClaw設定の読み書きのみを行います
- 対象のMCPサーバーには接続しません
- コマンド、URL、またはリモート転送が現在到達可能かどうかは検証しません
- ランタイムアダプターは、実行時に実際にサポートする転送形状を判断します
- 埋め込みPiは、通常の `coding` および `messaging` ツールプロファイルで設定済みMCPツールを公開します。`minimal` では引き続き非表示で、`tools.deny: ["bundle-mcp"]` で明示的に無効化できます
- セッション単位のバンドル済みMCPランタイムは、アイドル状態が `mcp.sessionIdleTtlMs` ミリ秒続くと回収されます（デフォルト10分。無効化するには `0` を設定）。単発の埋め込み実行では、実行終了時にそれらがクリーンアップされます

## 保存済みMCPサーバー定義

OpenClawは、OpenClaw管理のMCP定義を必要とする対象向けに、軽量なMCPサーバーレジストリも設定内に保存します。

コマンド:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

注記:

- `list` はサーバー名をソートします。
- 名前なしの `show` は、設定済みのMCPサーバーオブジェクト全体を表示します。
- `set` は、コマンドライン上で1つのJSONオブジェクト値を受け取ります。
- `unset` は、指定したサーバーが存在しない場合に失敗します。

例:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

設定形状の例:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### stdio転送

ローカル子プロセスを起動し、stdin/stdout経由で通信します。

| フィールド                 | 説明                               |
| -------------------------- | ---------------------------------- |
| `command`                  | 起動する実行可能ファイル（必須）   |
| `args`                     | コマンドライン引数の配列           |
| `env`                      | 追加の環境変数                     |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ         |

#### stdio env安全フィルター

OpenClawは、サーバーの `env` ブロック内にあっても、最初のRPC前にstdio MCPサーバーの起動方法を変更できるインタープリター起動用envキーを拒否します。ブロックされるキーには `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` などのランタイム制御変数が含まれます。起動時にこれらは設定エラーとして拒否されるため、暗黙のプレリュード注入、インタープリターの差し替え、stdioプロセスに対するデバッガ有効化はできません。通常の認証情報、proxy、サーバー固有のenv変数（`GITHUB_TOKEN`, `HTTP_PROXY`, カスタム `*_API_KEY` など）には影響しません。

MCPサーバーで本当にブロック対象の変数が必要な場合は、stdioサーバーの `env` 配下ではなく、Gatewayホストプロセス側で設定してください。

### SSE / HTTP転送

HTTP Server-Sent Events経由でリモートMCPサーバーに接続します。

| フィールド            | 説明                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | リモートサーバーのHTTPまたはHTTPS URL（必須）                    |
| `headers`             | 任意のHTTPヘッダのキー/値マップ（たとえば認証トークン）          |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ミリ秒、任意）                   |

例:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url` 内の機密値（userinfo）および `headers` 内の機密値は、ログとステータス出力でマスクされます。

### Streamable HTTP転送

`streamable-http` は、`sse` と `stdio` に加わる追加の転送オプションです。HTTPストリーミングを使用して、リモートMCPサーバーと双方向通信します。

| フィールド            | 説明                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `url`                 | リモートサーバーのHTTPまたはHTTPS URL（必須）                                                |
| `transport`           | この転送を選ぶには `"streamable-http"` に設定します。省略時はOpenClawが `sse` を使用します |
| `headers`             | 任意のHTTPヘッダのキー/値マップ（たとえば認証トークン）                                      |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ミリ秒、任意）                                               |

例:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

これらのコマンドが管理するのは保存済み設定のみです。チャンネルブリッジを起動したり、ライブMCPクライアントセッションを開いたり、対象サーバーへの到達性を確認したりはしません。

## 現在の制限

このページは、現在出荷されているブリッジを説明しています。

現在の制限:

- 会話検出は、既存のGatewayセッションルートメタデータに依存します
- Claude専用アダプター以外に汎用プッシュプロトコルはありません
- まだメッセージ編集ツールやリアクションツールはありません
- HTTP/SSE/streamable-http転送は単一のリモートサーバーに接続します。まだ多重化されたupstreamはありません
- `permissions_list_open` には、ブリッジ接続中に観測された承認のみが含まれます

## 関連

- [CLI reference](/ja-JP/cli)
- [Plugins](/ja-JP/cli/plugins)
