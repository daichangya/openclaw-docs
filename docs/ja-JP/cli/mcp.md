---
read_when:
    - Codex、Claude Code、または別の MCP クライアントを OpenClaw ベースのチャネルに接続するとき
    - '`openclaw mcp serve` を実行するとき'
    - OpenClaw に保存された MCP サーバー定義を管理するとき
summary: OpenClaw のチャネル会話を MCP 経由で公開し、保存済みの MCP サーバー定義を管理する
title: mcp
x-i18n:
    generated_at: "2026-04-05T12:39:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` には 2 つの役割があります。

- `openclaw mcp serve` で OpenClaw を MCP サーバーとして実行する
- `list`、`show`、
  `set`、`unset` で、OpenClaw が所有する送信先 MCP サーバー定義を管理する

つまり:

- `serve` は、OpenClaw が MCP サーバーとして動作する経路です
- `list` / `show` / `set` / `unset` は、OpenClaw が MCP クライアント側の
  レジストリとして動作し、後でそのランタイムが利用する可能性のある他の MCP サーバーを管理する経路です

OpenClaw がコーディングハーネス
セッション自体をホストし、そのランタイムを ACP 経由でルーティングする必要がある場合は、[`openclaw acp`](/cli/acp) を使ってください。

## OpenClaw を MCP サーバーとして使う

これは `openclaw mcp serve` の経路です。

## `serve` を使うべきとき

以下の場合は `openclaw mcp serve` を使ってください。

- Codex、Claude Code、または別の MCP クライアントが、
  OpenClaw ベースのチャネル会話と直接やり取りする必要がある
- すでにローカルまたはリモートの OpenClaw Gateway があり、セッションがルーティングされている
- チャネルごとに別々のブリッジを実行するのではなく、
  OpenClaw の各チャネルバックエンドを横断して動作する 1 つの MCP サーバーが欲しい

OpenClaw がコーディング
ランタイム自体をホストし、エージェントセッションを OpenClaw 内に保持する必要がある場合は、代わりに [`openclaw acp`](/cli/acp) を使ってください。

## 仕組み

`openclaw mcp serve` は stdio MCP サーバーを起動します。この
プロセスは MCP クライアントが所有します。クライアントが stdio セッションを開いている間、
ブリッジはローカルまたはリモートの OpenClaw Gateway に WebSocket で接続し、ルーティングされたチャネル
会話を MCP 経由で公開します。

ライフサイクル:

1. MCP クライアントが `openclaw mcp serve` を起動する
2. ブリッジが Gateway に接続する
3. ルーティングされたセッションが MCP の会話および transcript/history ツールとして利用可能になる
4. ブリッジ接続中はライブイベントがメモリ内にキューされる
5. Claude チャネルモードが有効な場合、同じセッションで
   Claude 固有のプッシュ通知も受け取れる

重要な挙動:

- ライブキューの状態はブリッジ接続時点から始まる
- それ以前の transcript 履歴は `messages_read` で読み出す
- Claude のプッシュ通知は MCP セッションが生きている間だけ存在する
- クライアントが切断すると、ブリッジは終了し、ライブキューも消える

## クライアントモードを選ぶ

同じブリッジを 2 通りの方法で使えます。

- 汎用 MCP クライアント: 標準 MCP ツールのみ。`conversations_list`、
  `messages_read`、`events_poll`、`events_wait`、`messages_send`、および
  承認ツールを使います。
- Claude Code: 標準 MCP ツールに加えて Claude 固有のチャネルアダプターも使います。
  `--claude-channel-mode on` を有効にするか、デフォルトの `auto` のままにします。

現時点では、`auto` は `on` と同じ動作です。まだクライアント機能検出は
ありません。

## `serve` が公開するもの

このブリッジは、既存の Gateway セッションルートメタデータを使って、チャネルに裏打ちされた
会話を公開します。OpenClaw がすでに次のような既知のルートを持つセッション状態を
保持している場合に、会話が表示されます。

- `channel`
- recipient または destination メタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより、MCP クライアントは次のことを 1 か所で行えます。

- 最近のルーティング済み会話を一覧表示する
- 最近の transcript 履歴を読む
- 新しい受信イベントを待機する
- 同じルートを通じて返信を送る
- ブリッジ接続中に到着した承認要求を確認する

## 使用方法

```bash
# ローカル Gateway
openclaw mcp serve

# リモート Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# パスワード認証付きリモート Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 詳細なブリッジログを有効化
openclaw mcp serve --verbose

# Claude 固有のプッシュ通知を無効化
openclaw mcp serve --claude-channel-mode off
```

## ブリッジツール

現在のブリッジは以下の MCP ツールを公開します。

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

Gateway セッション状態にすでにルートメタデータを持つ、最近のセッション裏打ち会話を一覧表示します。

便利なフィルター:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

`session_key` によって 1 件の会話を返します。

### `messages_read`

1 件のセッション裏打ち会話に対する最近の transcript メッセージを読みます。

### `attachments_fetch`

1 件の transcript メッセージから非テキストのメッセージコンテンツブロックを抽出します。これは
transcript コンテンツ上のメタデータビューであり、独立した永続的な添付 blob ストアでは
ありません。

### `events_poll`

数値カーソル以降のキュー済みライブイベントを読み取ります。

### `events_wait`

次に一致するキュー済みイベントが到着するか、タイムアウトするまでロングポーリングします。

これは、Claude 固有のプッシュプロトコルなしで、汎用 MCP クライアントが
ほぼリアルタイムの配信を必要とする場合に使います。

### `messages_send`

セッションにすでに記録されている同じルートを通じてテキストを送信します。

現在の挙動:

- 既存の会話ルートが必要
- セッションの channel、recipient、account id、thread id を使う
- テキストのみ送信する

### `permissions_list_open`

ブリッジが Gateway に接続して以降に観測した、保留中の exec/plugin 承認要求を一覧表示します。

### `permissions_respond`

保留中の exec/plugin 承認要求 1 件を次のいずれかで処理します。

- `allow-once`
- `allow-always`
- `deny`

## イベントモデル

このブリッジは、接続中の間、メモリ内イベントキューを保持します。

現在のイベント型:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

重要な制限:

- キューはライブ専用であり、MCP ブリッジ開始時点から始まる
- `events_poll` と `events_wait` は、それ自体では古い Gateway 履歴を
  再生しない
- 永続的なバックログは `messages_read` で読む必要がある

## Claude チャネル通知

このブリッジは Claude 固有のチャネル通知も公開できます。これは
Claude Code チャネルアダプターに相当する OpenClaw 側の機能です。標準 MCP ツールは引き続き利用可能ですが、
ライブ受信メッセージは Claude 固有の MCP 通知としても到着できます。

フラグ:

- `--claude-channel-mode off`: 標準 MCP ツールのみ
- `--claude-channel-mode on`: Claude チャネル通知を有効化
- `--claude-channel-mode auto`: 現在のデフォルト。`on` と同じブリッジ動作

Claude チャネルモードが有効な場合、サーバーは Claude の experimental
capabilities を広告し、次を発行できます。

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のブリッジ挙動:

- 受信 `user` transcript メッセージは
  `notifications/claude/channel` として転送される
- MCP 経由で受け取った Claude の権限要求はメモリ内で追跡される
- 後で関連会話が `yes abcde` または `no abcde` を送ると、ブリッジは
  それを `notifications/claude/channel/permission` に変換する
- これらの通知はライブセッション専用であり、MCP クライアントが切断すると、
  プッシュ先はなくなる

これは意図的にクライアント固有です。汎用 MCP クライアントは標準の
ポーリングツールに依存してください。

## MCP クライアント設定

stdio クライアント設定例:

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

ほとんどの汎用 MCP クライアントでは、まず標準ツール画面から始め、
Claude モードは無視してください。Claude 固有の通知メソッドを実際に理解できる
クライアントに対してのみ Claude モードを有効にしてください。

## オプション

`openclaw mcp serve` がサポートするもの:

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway トークン
- `--token-file <path>`: ファイルからトークンを読み取る
- `--password <password>`: Gateway パスワード
- `--password-file <path>`: ファイルからパスワードを読み取る
- `--claude-channel-mode <auto|on|off>`: Claude 通知モード
- `-v`, `--verbose`: stderr に詳細ログを出す

可能であれば、インラインシークレットより `--token-file` または `--password-file` を推奨します。

## セキュリティと信頼境界

このブリッジはルーティングを新規作成しません。Gateway が
すでにルーティング方法を知っている会話だけを公開します。

つまり:

- 送信者 allowlist、ペアリング、チャネルレベルの信頼は、引き続き
  基盤となる OpenClaw チャネル設定に属する
- `messages_send` は既存の保存済みルートを通じてのみ返信できる
- 承認状態は現在のブリッジセッションに対してのみライブ / メモリ内
- ブリッジ認証には、他のリモート Gateway クライアントと同様に
  信頼できる Gateway トークンまたはパスワード制御を使うべき

`conversations_list` に会話が表示されない場合、通常の原因は
MCP 設定ではありません。基盤となる
Gateway セッションにルートメタデータがない、または不完全であることです。

## テスト

OpenClaw には、このブリッジ用の決定論的 Docker スモークが用意されています。

```bash
pnpm test:docker:mcp-channels
```

このスモークでは次を行います。

- シード済み Gateway コンテナーを起動する
- `openclaw mcp serve` を起動する 2 つ目のコンテナーを起動する
- 会話検出、transcript 読み取り、添付メタデータ読み取り、
  ライブイベントキューの挙動、送信ルーティングを検証する
- 実際の stdio MCP ブリッジ上で Claude スタイルのチャネル通知と権限通知を検証する

これは、実際の
Telegram、Discord、または iMessage アカウントをテスト実行に接続せずに、ブリッジが動作することを証明するもっとも高速な方法です。

より広いテスト文脈については、[Testing](/help/testing) を参照してください。

## トラブルシューティング

### 会話が返ってこない

通常は、Gateway セッションがまだルーティング可能でないことを意味します。基盤となる
セッションに channel/provider、recipient、および任意の
account/thread ルートメタデータが保存されていることを確認してください。

### `events_poll` または `events_wait` が古いメッセージを取りこぼす

想定どおりです。ライブキューはブリッジ接続時点から始まります。古い transcript
履歴は `messages_read` で読んでください。

### Claude 通知が表示されない

以下をすべて確認してください。

- クライアントが stdio MCP セッションを開いたままにしていた
- `--claude-channel-mode` が `on` または `auto`
- クライアントが実際に Claude 固有の通知メソッドを理解できる
- 受信メッセージがブリッジ接続後に発生した

### 承認が表示されない

`permissions_list_open` が表示するのは、ブリッジ接続中に観測された承認要求のみです。これは
永続的な承認履歴 API ではありません。

## OpenClaw を MCP クライアントレジストリとして使う

これは `openclaw mcp list`、`show`、`set`、`unset` の経路です。

これらのコマンドは OpenClaw を MCP 経由で公開しません。OpenClaw config の
`mcp.servers` 配下にある、OpenClaw 所有の MCP
サーバー定義を管理します。

これらの保存済み定義は、後で OpenClaw が起動または設定するランタイム向けです。
たとえば組み込み Pi やその他のランタイムアダプターです。OpenClaw は定義を
中央に保存することで、それらのランタイムが独自に重複した
MCP サーバー一覧を保持しなくて済むようにします。

重要な挙動:

- これらのコマンドは OpenClaw config の読み書きだけを行う
- 対象の MCP サーバーには接続しない
- コマンド、URL、またはリモートトランスポートが
  現時点で到達可能かどうかは検証しない
- ランタイムアダプターは、実行時に実際にサポートするトランスポート形状を決定する

## 保存済み MCP サーバー定義

OpenClaw は、OpenClaw 管理の MCP 定義を必要とする画面向けに、
config 内に軽量な MCP サーバーレジストリも保存します。

コマンド:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

注意:

- `list` はサーバー名をソートします。
- `show` は名前なしの場合、設定済みの MCP サーバーオブジェクト全体を出力します。
- `set` はコマンドライン上で 1 つの JSON オブジェクト値を受け取ります。
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

### Stdio トランスポート

ローカルの子プロセスを起動し、stdin/stdout 経由で通信します。

| Field                      | Description                   |
| -------------------------- | ----------------------------- |
| `command`                  | 起動する実行ファイル（必須）  |
| `args`                     | コマンドライン引数の配列      |
| `env`                      | 追加の環境変数                |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ    |

### SSE / HTTP トランスポート

HTTP Server-Sent Events 経由でリモート MCP サーバーに接続します。

| Field                 | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `url`                 | リモートサーバーの HTTP または HTTPS URL（必須）      |
| `headers`             | 任意の HTTP ヘッダのキー・値マップ（例: 認証トークン） |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ミリ秒、任意）        |

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

`url` 内の機微値（userinfo）と `headers` は、ログと
ステータス出力でマスクされます。

### Streamable HTTP トランスポート

`streamable-http` は、`sse` および `stdio` に加わる追加のトランスポートオプションです。リモート MCP サーバーとの双方向通信に HTTP ストリーミングを使用します。

| Field                 | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `url`                 | リモートサーバーの HTTP または HTTPS URL（必須）                                           |
| `transport`           | このトランスポートを選ぶには `"streamable-http"` を設定します。省略時は OpenClaw は `sse` を使います |
| `headers`             | 任意の HTTP ヘッダのキー・値マップ（例: 認証トークン）                                     |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ミリ秒、任意）                                             |

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

これらのコマンドが管理するのは保存済み config のみです。チャネルブリッジを起動したり、
ライブ MCP クライアントセッションを開いたり、対象サーバーが到達可能であることを証明したりはしません。

## 現在の制限

このページは、現時点で出荷されているブリッジを説明しています。

現在の制限:

- 会話検出は既存の Gateway セッションルートメタデータに依存する
- Claude 固有アダプター以外に汎用プッシュプロトコルはない
- まだメッセージ編集ツールやリアクションツールはない
- HTTP/SSE/streamable-http トランスポートは単一のリモートサーバーに接続する。まだ upstream の多重化はない
- `permissions_list_open` には、ブリッジ接続中に
  観測された承認のみが含まれる
