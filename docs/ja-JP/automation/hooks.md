---
read_when:
    - /new、/reset、/stop、およびエージェントのライフサイクルイベントに対するイベント駆動型自動化を必要としている場合
    - フックを構築、インストール、またはデバッグしたい場合
summary: 'フック: コマンドとライフサイクルイベントのイベント駆動型自動化'
title: フック
x-i18n:
    generated_at: "2026-04-26T11:22:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf40a64449347ef750b4b0e0a83b80e2e8fdef87d92daa71f028d2bf6a3d3d22
    source_path: automation/hooks.md
    workflow: 15
---

フックは、Gateway 内部で何かが起きたときに実行される小さなスクリプトです。これらはディレクトリから検出でき、`openclaw hooks` で確認できます。Gateway は、フックを有効にするか、少なくとも 1 つのフックエントリ、hook pack、レガシーハンドラー、または追加のフックディレクトリを設定した後にのみ、内部フックを読み込みます。

OpenClaw には 2 種類のフックがあります。

- **内部フック**（このページ）: `/new`、`/reset`、`/stop`、またはライフサイクルイベントなどのエージェントイベントが発生したときに Gateway 内部で実行されます。
- **Webhooks**: 外部 HTTP エンドポイントで、他のシステムが OpenClaw 内で処理をトリガーできるようにします。[Webhooks](/ja-JP/automation/cron-jobs#webhooks) を参照してください。

フックは Plugin 内にバンドルすることもできます。`openclaw hooks list` には、スタンドアロンフックと Plugin 管理フックの両方が表示されます。

## クイックスタート

```bash
# 利用可能なフックを一覧表示
openclaw hooks list

# フックを有効化
openclaw hooks enable session-memory

# フックの状態を確認
openclaw hooks check

# 詳細情報を取得
openclaw hooks info session-memory
```

## イベントタイプ

| イベント                   | 発火するタイミング                               |
| -------------------------- | ------------------------------------------------ |
| `command:new`              | `/new` コマンドが発行されたとき                  |
| `command:reset`            | `/reset` コマンドが発行されたとき                |
| `command:stop`             | `/stop` コマンドが発行されたとき                 |
| `command`                  | 任意のコマンドイベント（汎用リスナー）           |
| `session:compact:before`   | Compaction が履歴を要約する前                    |
| `session:compact:after`    | Compaction の完了後                              |
| `session:patch`            | セッションプロパティが変更されたとき             |
| `agent:bootstrap`          | ワークスペースの bootstrap ファイルが注入される前 |
| `gateway:startup`          | チャンネルの起動とフックの読み込み後             |
| `message:received`         | 任意のチャンネルから受信メッセージが届いたとき   |
| `message:transcribed`      | 音声文字起こしの完了後                           |
| `message:preprocessed`     | すべてのメディアおよびリンク理解の完了後         |
| `message:sent`             | 送信メッセージが配信されたとき                   |

## フックの作成

### フックの構成

各フックは、2 つのファイルを含むディレクトリです。

```
my-hook/
├── HOOK.md          # メタデータ + ドキュメント
└── handler.ts       # ハンドラー実装
```

### HOOK.md 形式

```markdown
---
name: my-hook
description: "このフックの動作を短く説明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

詳細なドキュメントをここに記述します。
```

**メタデータフィールド**（`metadata.openclaw`）:

| フィールド | 説明                                                   |
| ---------- | ------------------------------------------------------ |
| `emoji`    | CLI に表示する絵文字                                   |
| `events`   | 監視するイベントの配列                                 |
| `export`   | 使用する名前付きエクスポート（デフォルトは `"default"`） |
| `os`       | 必要なプラットフォーム（例: `["darwin", "linux"]`）    |
| `requires` | 必要な `bins`、`anyBins`、`env`、または `config` パス  |
| `always`   | 適格性チェックをバイパスする（boolean）                |
| `install`  | インストール方法                                       |

### ハンドラー実装

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

各イベントには、`type`、`action`、`sessionKey`、`timestamp`、`messages`（ユーザーへ送るには push）、および `context`（イベント固有のデータ）が含まれます。エージェントおよびツール Plugin のフックコンテキストには `trace` が含まれる場合もあり、これは読み取り専用の W3C 互換診断トレースコンテキストで、Plugin が構造化ログに渡して OTEL 相関に使用できます。

### イベントコンテキストの要点

**コマンドイベント**（`command:new`、`command:reset`）: `context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**メッセージイベント**（`message:received`）: `context.from`、`context.content`、`context.channelId`、`context.metadata`（`senderId`、`senderName`、`guildId` を含むプロバイダー固有データ）。

**メッセージイベント**（`message:sent`）: `context.to`、`context.content`、`context.success`、`context.channelId`。

**メッセージイベント**（`message:transcribed`）: `context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**メッセージイベント**（`message:preprocessed`）: `context.bodyForAgent`（最終的に強化された本文）、`context.from`、`context.channelId`。

**Bootstrap イベント**（`agent:bootstrap`）: `context.bootstrapFiles`（変更可能な配列）、`context.agentId`。

**セッション patch イベント**（`session:patch`）: `context.sessionEntry`、`context.patch`（変更されたフィールドのみ）、`context.cfg`。patch イベントをトリガーできるのは特権クライアントのみです。

**Compaction イベント**: `session:compact:before` には `messageCount`、`tokenCount` が含まれます。`session:compact:after` にはさらに `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter` が追加されます。

`command:stop` は、ユーザーが `/stop` を発行したことを監視します。これはキャンセル/コマンドライフサイクルであり、エージェント最終化のゲートではありません。自然な最終回答を確認し、エージェントにもう 1 回処理を依頼する必要がある Plugin は、代わりに型付き Plugin フック `before_agent_finalize` を使用してください。[Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

## フックの検出

フックは、以下のディレクトリから、優先度の上書き順が低いものから高いものへ順に検出されます。

1. **バンドル済みフック**: OpenClaw に同梱
2. **Plugin フック**: インストール済み Plugin 内にバンドルされたフック
3. **管理フック**: `~/.openclaw/hooks/`（ユーザーがインストールし、ワークスペース間で共有）。`hooks.internal.load.extraDirs` の追加ディレクトリもこの優先度を共有します。
4. **ワークスペースフック**: `<workspace>/hooks/`（エージェントごと。明示的に有効化されるまでデフォルトでは無効）

ワークスペースフックは新しいフック名を追加できますが、同じ名前のバンドル済み、管理済み、または Plugin 提供フックを上書きすることはできません。

Gateway は、内部フックが設定されるまで、起動時の内部フック検出をスキップします。`openclaw hooks enable <name>` でバンドル済みまたは管理済みフックを有効にするか、hook pack をインストールするか、`hooks.internal.enabled=true` を設定して有効化してください。1 つの名前付きフックを有効にした場合、Gateway はそのフックのハンドラーのみを読み込みます。`hooks.internal.enabled=true`、追加フックディレクトリ、レガシーハンドラーは広範な検出にオプトインします。

### Hook pack

Hook pack は、`package.json` の `openclaw.hooks` を通じてフックをエクスポートする npm パッケージです。インストール方法:

```bash
openclaw plugins install <path-or-spec>
```

npm spec はレジストリ専用です（パッケージ名 + 任意の正確なバージョンまたは dist-tag）。Git/URL/file spec および semver range は拒否されます。

## バンドル済みフック

| フック                | イベント                       | 動作内容                                                |
| --------------------- | ------------------------------ | ------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | セッションコンテキストを `<workspace>/memory/` に保存   |
| bootstrap-extra-files | `agent:bootstrap`              | glob パターンから追加の bootstrap ファイルを注入        |
| command-logger        | `command`                      | すべてのコマンドを `~/.openclaw/logs/commands.log` に記録 |
| boot-md               | `gateway:startup`              | Gateway 起動時に `BOOT.md` を実行                       |

任意のバンドル済みフックを有効化:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory の詳細

直近 15 件のユーザー/アシスタントメッセージを抽出し、LLM によって説明的なファイル名 slug を生成して、`<workspace>/memory/YYYY-MM-DD-slug.md` に保存します。`workspace.dir` の設定が必要です。

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files の設定

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

パスはワークスペース相対で解決されます。認識される bootstrap ベース名のみが読み込まれます（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger の詳細

すべてのスラッシュコマンドを `~/.openclaw/logs/commands.log` に記録します。

<a id="boot-md"></a>

### boot-md の詳細

Gateway の起動時に、アクティブなワークスペースの `BOOT.md` を実行します。

## Plugin フック

Plugin は、Plugin SDK を通じて型付きフックを登録し、より深い統合を実現できます。
これにより、ツール呼び出しのインターセプト、プロンプトの変更、メッセージフローの制御などが可能です。
`before_tool_call`、`before_agent_reply`、`before_install`、またはその他のインプロセスなライフサイクルフックが必要な場合は、Plugin フックを使用してください。

完全な Plugin フックのリファレンスについては、[Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

## 設定

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

フックごとの環境変数:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

追加のフックディレクトリ:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
レガシーの `hooks.internal.handlers` 配列設定形式も後方互換性のために引き続きサポートされていますが、新しいフックでは検出ベースのシステムを使用してください。
</Note>

## CLI リファレンス

```bash
# すべてのフックを一覧表示（--eligible、--verbose、または --json を追加可能）
openclaw hooks list

# フックの詳細情報を表示
openclaw hooks info <hook-name>

# 適格性の概要を表示
openclaw hooks check

# 有効化/無効化
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## ベストプラクティス

- **ハンドラーは高速に保ってください。** フックはコマンド処理中に実行されます。重い処理は `void processInBackground(event)` で fire-and-forget にしてください。
- **エラーは適切に処理してください。** 危険な処理は try/catch で囲み、他のハンドラーが実行できるように throw しないでください。
- **イベントは早期に絞り込んでください。** イベントの type/action が関係ない場合はすぐに return してください。
- **具体的なイベントキーを使ってください。** オーバーヘッドを減らすため、`"events": ["command"]` より `"events": ["command:new"]` を推奨します。

## トラブルシューティング

### フックが検出されない

```bash
# ディレクトリ構成を確認
ls -la ~/.openclaw/hooks/my-hook/
# 表示されるべき内容: HOOK.md, handler.ts

# 検出されたすべてのフックを一覧表示
openclaw hooks list
```

### フックが適格ではない

```bash
openclaw hooks info my-hook
```

不足しているバイナリ（PATH）、環境変数、設定値、または OS 互換性を確認してください。

### フックが実行されない

1. フックが有効になっていることを確認します: `openclaw hooks list`
2. フックを再読み込みするために Gateway プロセスを再起動します。
3. Gateway ログを確認します: `./scripts/clawlog.sh | grep hook`

## 関連

- [CLI Reference: hooks](/ja-JP/cli/hooks)
- [Webhooks](/ja-JP/automation/cron-jobs#webhooks)
- [Plugin hooks](/ja-JP/plugins/hooks) — インプロセスの Plugin ライフサイクルフック
- [Configuration](/ja-JP/gateway/configuration-reference#hooks)
