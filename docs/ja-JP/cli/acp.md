---
read_when:
    - ACP ベースの IDE 統合をセットアップしているとき
    - Gateway への ACP セッションルーティングをデバッグしているとき
summary: IDE 統合向けに ACP ブリッジを実行する
title: acp
x-i18n:
    generated_at: "2026-04-05T12:38:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2461b181e4a97dd84580581e9436ca1947a224decce8044132dbcf7fb2b7502c
    source_path: cli/acp.md
    workflow: 15
---

# acp

OpenClaw Gateway と通信する [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ブリッジを実行します。

このコマンドは IDE 向けに stdio 経由で ACP を話し、プロンプトを WebSocket 経由で Gateway に転送します。
ACP セッションは Gateway のセッションキーに対応付けられたまま維持されます。

`openclaw acp` は Gateway をバックエンドとする ACP ブリッジであり、完全な ACP ネイティブのエディター
ランタイムではありません。主眼は、セッションルーティング、プロンプト配信、基本的なストリーミング
更新にあります。

ACP ハーネスセッションをホストする代わりに、外部 MCP クライアントから OpenClaw のチャネル
会話へ直接接続したい場合は、
[`openclaw mcp serve`](/cli/mcp) を使ってください。

## これは何ではないか

このページは ACP ハーネスセッションと混同されることがよくあります。

`openclaw acp` の意味は次のとおりです。

- OpenClaw が ACP サーバーとして動作する
- IDE または ACP クライアントが OpenClaw に接続する
- OpenClaw がその作業を Gateway セッションに転送する

これは [ACP Agents](/tools/acp-agents) とは異なります。そちらでは OpenClaw が
`acpx` を通じて Codex や Claude Code のような外部ハーネスを実行します。

簡単なルール:

- エディター/クライアントが ACP で OpenClaw とやり取りしたい: `openclaw acp` を使う
- OpenClaw が Codex/Claude/Gemini を ACP ハーネスとして起動すべき: `/acp spawn` と [ACP Agents](/tools/acp-agents) を使う

## 互換性マトリクス

| ACP 領域 | ステータス | 注記 |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel` | 実装済み | stdio から Gateway の chat/send + abort へのコアブリッジフロー。 |
| `listSessions`, slash commands | 実装済み | セッション一覧は Gateway セッション状態に対して動作します。コマンドは `available_commands_update` を通じて通知されます。 |
| `loadSession` | 一部対応 | ACP セッションを Gateway セッションキーに再バインドし、保存済みの user/assistant テキスト履歴を再生します。tool/system 履歴はまだ再構築されません。 |
| プロンプト内容（`text`、埋め込み `resource`、画像） | 一部対応 | テキスト/リソースは chat 入力にフラット化され、画像は Gateway 添付ファイルになります。 |
| セッションモード | 一部対応 | `session/set_mode` はサポートされています。ブリッジは初期の Gateway バックドなセッション制御として、thought level、tool verbosity、reasoning、usage detail、elevated actions を公開します。より広い ACP ネイティブの mode/config サーフェスはまだ対象外です。 |
| セッション情報と使用量の更新 | 一部対応 | ブリッジは、キャッシュされた Gateway セッションスナップショットから `session_info_update` とベストエフォートの `usage_update` 通知を出します。使用量は概算であり、Gateway のトークン合計が fresh とマークされている場合にのみ送信されます。 |
| ツールストリーミング | 一部対応 | `tool_call` / `tool_call_update` イベントには、Gateway のツール引数/結果がそれらを公開している場合に、生の I/O、テキスト内容、ベストエフォートのファイル位置が含まれます。埋め込み端末や、より豊かな diff ネイティブ出力はまだ公開されません。 |
| セッションごとの MCP サーバー（`mcpServers`） | 未対応 | ブリッジモードではセッションごとの MCP サーバー要求を拒否します。代わりに OpenClaw gateway または agent 側で MCP を設定してください。 |
| クライアントのファイルシステムメソッド（`fs/read_text_file`, `fs/write_text_file`） | 未対応 | ブリッジは ACP クライアントのファイルシステムメソッドを呼び出しません。 |
| クライアントの端末メソッド（`terminal/*`） | 未対応 | ブリッジは ACP クライアント端末を作成せず、tool call を通じて terminal id もストリームしません。 |
| セッション計画 / thought ストリーミング | 未対応 | 現在のブリッジは出力テキストとツール状態を出力しますが、ACP の plan や thought 更新は出力しません。 |

## 既知の制限

- `loadSession` は保存済みの user と assistant のテキスト履歴を再生しますが、
  過去の tool call、system 通知、より豊かな ACP ネイティブイベント
  種別は再構築しません。
- 複数の ACP クライアントが同じ Gateway セッションキーを共有する場合、イベントと cancel の
  ルーティングはクライアントごとに厳密に分離されるのではなくベストエフォートになります。エディター
  ローカルでクリーンなターンが必要な場合は、既定の分離された `acp:<uuid>` セッションを
  推奨します。
- Gateway の stop 状態は ACP の stop reason に変換されますが、その対応付けは
  完全な ACP ネイティブランタイムほど表現力がありません。
- 初期セッション制御で現在公開されているのは、Gateway ノブのうち絞られた一部です:
  thought level、tool verbosity、reasoning、usage detail、elevated
  actions。model 選択や exec-host 制御はまだ ACP の
  config オプションとしては公開されていません。
- `session_info_update` と `usage_update` は Gateway セッション
  スナップショットから導出されるものであり、ライブの ACP ネイティブなランタイム会計ではありません。使用量は概算で、
  コストデータは含まず、Gateway が合計トークン
  データを fresh とマークした場合にのみ送信されます。
- ツール追従データはベストエフォートです。ブリッジは、既知のツール引数/結果に
  現れるファイルパスを公開できますが、ACP の端末や構造化されたファイル diff はまだ出力しません。

## 使い方

```bash
openclaw acp

# リモート Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# リモート Gateway（ファイルから token を取得）
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 既存のセッションキーに接続
openclaw acp --session agent:main:main

# ラベルで接続（すでに存在している必要があります）
openclaw acp --session-label "support inbox"

# 最初のプロンプトの前にセッションキーをリセット
openclaw acp --session agent:main:main --reset-session
```

## ACP クライアント（デバッグ）

IDE なしでブリッジを簡易確認するには、組み込みの ACP クライアントを使います。
ACP ブリッジを起動し、対話的にプロンプトを入力できます。

```bash
openclaw acp client

# 起動したブリッジをリモート Gateway に向ける
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# サーバーコマンドを上書き（既定: openclaw）
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル（クライアントデバッグモード）:

- 自動承認は許可リストベースで、信頼できるコア tool ID にのみ適用されます。
- `read` の自動承認は現在の作業ディレクトリ（設定時は `--cwd`）に限定されます。
- ACP が自動承認するのは、アクティブな cwd 配下の限定的な読み取り専用 `read` 呼び出しと、読み取り専用の検索ツール（`search`, `web_search`, `memory_search`）だけです。未知の/コアでないツール、範囲外の読み取り、実行可能なツール、コントロールプレーンツール、変更を伴うツール、対話フローは常に明示的なプロンプト承認が必要です。
- サーバー提供の `toolCall.kind` は信頼できないメタデータとして扱われます（認可の根拠にはなりません）。
- この ACP ブリッジポリシーは ACPX ハーネス権限とは別です。`acpx` バックエンド経由で OpenClaw を実行する場合、`plugins.entries.acpx.config.permissionMode=approve-all` がそのハーネスセッション用の非常用「yolo」スイッチです。

## これを使う場面

IDE（または他のクライアント）が Agent Client Protocol を話し、
それに OpenClaw Gateway セッションを操作させたい場合に ACP を使います。

1. Gateway が実行中であることを確認します（ローカルまたはリモート）。
2. Gateway の接続先を設定します（設定またはフラグ）。
3. IDE が stdio 経由で `openclaw acp` を実行するように設定します。

設定例（永続化）:

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接実行の例（設定は書き込まない）:

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# ローカルプロセスの安全性のため推奨
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## エージェントの選択

ACP はエージェントを直接選びません。Gateway のセッションキーによってルーティングします。

特定のエージェントを対象にするには、エージェントスコープのセッションキーを使います。

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは 1 つの Gateway セッションキーに対応します。1 つのエージェントは複数の
セッションを持てます。ACP は、キーまたはラベルを上書きしない限り、既定で分離された
`acp:<uuid>` セッションを使います。

ブリッジモードではセッションごとの `mcpServers` はサポートされません。ACP クライアントが
`newSession` または `loadSession` 中にそれらを送信した場合、ブリッジは黙って無視するのではなく
明確なエラーを返します。

ACPX バックドなセッションから OpenClaw plugin tools を見せたい場合は、
セッションごとの `mcpServers` を渡そうとするのではなく、gateway 側の ACPX plugin bridge を有効にしてください。
詳細は [ACP Agents](/tools/acp-agents#plugin-tools-mcp-bridge) を参照してください。

## `acpx` から使う（Codex、Claude、その他の ACP クライアント）

Codex や Claude Code のようなコーディングエージェントを ACP 経由で
OpenClaw ボットと接続したい場合は、組み込みの `openclaw` target を持つ `acpx` を使います。

一般的な流れ:

1. Gateway を実行し、ACP ブリッジがそこへ到達できることを確認します。
2. `acpx openclaw` が `openclaw acp` を指すようにします。
3. コーディングエージェントに使わせたい OpenClaw セッションキーを指定します。

例:

```bash
# 既定の OpenClaw ACP セッションへの単発リクエスト
acpx openclaw exec "アクティブな OpenClaw セッション状態を要約して。"

# 後続ターンのための永続的な名前付きセッション
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "このリポジトリに関連する最近のコンテキストを、私の OpenClaw 作業エージェントに尋ねて。"
```

`acpx openclaw` が毎回特定の Gateway とセッションキーを対象にするようにしたい場合は、
`~/.acpx/config.json` で `openclaw` agent command を上書きします。

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカルの OpenClaw チェックアウトでは、ACP ストリームをクリーンに保つため、
dev runner ではなく直接 CLI エントリポイントを使ってください。たとえば:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または他の ACP 対応クライアントに、
端末をスクレイピングさせることなく OpenClaw エージェントからコンテキスト情報を
取得させる最も簡単な方法です。

## Zed エディターのセットアップ

`~/.config/zed/settings.json` にカスタム ACP agent を追加します（または Zed の Settings UI を使います）:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

特定の Gateway またはエージェントを対象にするには:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed では、Agent パネルを開いて「OpenClaw ACP」を選択するとスレッドを開始できます。

## セッション対応付け

既定では、ACP セッションには `acp:` 接頭辞付きの分離された Gateway セッションキーが割り当てられます。
既知のセッションを再利用するには、セッションキーまたはラベルを渡します。

- `--session <key>`: 特定の Gateway セッションキーを使います。
- `--session-label <label>`: 既存のセッションをラベルで解決します。
- `--reset-session`: そのキーに対して新しいセッション id を発行します（同じキー、新しい transcript）。

ACP クライアントがメタデータをサポートしている場合は、セッションごとに上書きできます。

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

セッションキーの詳細は [/concepts/session](/concepts/session) を参照してください。

## オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合は gateway.remote.url が既定）。
- `--token <token>`: Gateway 認証 token。
- `--token-file <path>`: Gateway 認証 token をファイルから読み取ります。
- `--password <password>`: Gateway 認証 password。
- `--password-file <path>`: Gateway 認証 password をファイルから読み取ります。
- `--session <key>`: 既定のセッションキー。
- `--session-label <label>`: 解決する既定のセッションラベル。
- `--require-existing`: セッションキー/ラベルが存在しない場合は失敗します。
- `--reset-session`: 最初の使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトの先頭に作業ディレクトリを付けません。
- `--provenance <off|meta|meta+receipt>`: ACP provenance メタデータまたは receipt を含めます。
- `--verbose, -v`: stderr へ詳細ログを出力します。

セキュリティに関する注意:

- `--token` と `--password` は、一部のシステムではローカルプロセス一覧に見えることがあります。
- `--token-file` / `--password-file` または環境変数（`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`）を推奨します。
- Gateway 認証の解決は、他の Gateway クライアントと共有される契約に従います:
  - local mode: env（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> `gateway.remote.*` へのフォールバックは `gateway.auth.*` が未設定の場合のみ（設定済みだが未解決の local SecretRef は fail closed）
  - remote mode: `gateway.remote.*`。env/config のフォールバックは remote の優先順位ルールに従います
  - `--url` は override-safe で、暗黙の config/env 認証情報を再利用しません。明示的な `--token` / `--password`（またはファイル版）を渡してください
- ACP ランタイムバックエンドの子プロセスには `OPENCLAW_SHELL=acp` が渡され、コンテキスト固有の shell/profile ルールに利用できます。
- `openclaw acp client` は、起動したブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` のオプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバーコマンド（既定: `openclaw`）。
- `--server-args <args...>`: ACP サーバーへ渡す追加引数。
- `--server-verbose`: ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`: 詳細なクライアントログ。
