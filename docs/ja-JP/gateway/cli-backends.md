---
read_when:
    - APIプロバイダーが失敗したときの信頼できるフォールバックが欲しい場合
    - Claude CLIやその他のローカルAI CLIを実行していて、それらを再利用したい場合
    - CLIバックエンドのツールアクセス向けMCP local loopbackブリッジを理解したい場合
summary: 'CLIバックエンド: オプションのMCPツールブリッジを備えたローカルAI CLIフォールバック'
title: CLI Backends
x-i18n:
    generated_at: "2026-04-05T12:43:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI Backends（フォールバックランタイム）

OpenClawは、APIプロバイダーが停止している、レート制限されている、または一時的に不安定なときに、
**ローカルAI CLI** を**テキスト専用フォールバック**として実行できます。これは意図的に保守的な設計です。

- **OpenClawのツールは直接注入されません**。ただし `bundleMcp: true`
  のバックエンド（Claude CLIのデフォルト）は、local loopback MCPブリッジ経由でGatewayツールを受け取れます。
- **JSONLストリーミング**（Claude CLIは `--output-format stream-json` と
  `--include-partial-messages` を使用し、プロンプトはstdin経由で送信されます）。
- **セッションに対応**しています（そのため、後続ターンでも一貫性が保たれます）。
- CLIが画像パスを受け付ける場合、**画像をそのまま渡せます**。

これは主要経路ではなく、**セーフティネット**として設計されています。外部APIに依存せず、
「常に動く」テキスト応答が欲しいときに使ってください。

ACPのセッション制御、バックグラウンドタスク、
スレッド/会話バインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、
代わりに [ACP Agents](/tools/acp-agents) を使用してください。CLIバックエンドはACPではありません。

## 初心者向けクイックスタート

Claude CLIは**設定なしで**使えます（同梱のAnthropic pluginが
デフォルトバックエンドを登録します）。

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Codex CLIもそのまま使えます（同梱のOpenAI plugin経由）。

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gatewayがlaunchd/systemd配下で動作していてPATHが最小限の場合は、
コマンドパスだけ追加してください。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

これで完了です。CLI自体に必要なもの以外に、キーや追加の認証設定は不要です。

同梱のCLIバックエンドをgateway host上の**主要メッセージプロバイダー**として使用する場合、
モデルrefまたは `agents.defaults.cliBackends` でそのバックエンドを明示的に参照していれば、
OpenClawは所有する同梱pluginを自動的に読み込むようになりました。

## フォールバックとして使う

CLIバックエンドをフォールバックリストに追加すると、主要モデルが失敗したときだけ実行されます。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

注意:

- `agents.defaults.models`（allowlist）を使う場合は、`claude-cli/...` も含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClawは次に
  CLIバックエンドを試します。
- 同梱のClaude CLIバックエンドは引き続き
  `claude-cli/opus`、`claude-cli/opus-4.6`、`claude-cli/sonnet` のような短いエイリアスも受け付けますが、
  ドキュメントと設定例では正規の `claude-cli/claude-*` refを使用します。

## 設定概要

すべてのCLIバックエンドは次の配下にあります。

```
agents.defaults.cliBackends
```

各エントリは**provider id**（例: `claude-cli`, `my-cli`）でキー付けされます。
このprovider idが、モデルrefの左側になります。

```
<provider>/<model>
```

### 設定例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## 仕組み

1. **バックエンドを選択**します。選択基準はprovider接頭辞（`claude-cli/...`）です。
2. 同じOpenClawプロンプト + ワークスペースコンテキストを使って**システムプロンプトを構築**します。
3. 対応している場合はセッションid付きで**CLIを実行**し、履歴の一貫性を保ちます。
4. **出力を解析**し（JSONまたはプレーンテキスト）、最終テキストを返します。
5. バックエンドごとに**セッションidを永続化**し、後続ターンで同じCLIセッションを再利用します。

## セッション

- CLIがセッションに対応している場合は、`sessionArg`（例: `--session-id`）または
  `sessionArgs`（IDを複数のフラグに挿入する必要がある場合のプレースホルダー `{sessionId}`）を設定します。
- CLIが異なるフラグを持つ**resumeサブコマンド**を使う場合は、
  `resumeArgs`（再開時に `args` を置き換えます）と、必要に応じて
  `resumeOutput`（非JSONのresume用）を設定します。
- `sessionMode`:
  - `always`: 常にセッションidを送信します（保存済みのものがなければ新しいUUID）。
  - `existing`: 以前に保存されたセッションidがある場合のみ送信します。
  - `none`: セッションidを送信しません。

シリアライズに関する注意:

- `serialize: true` は、同一レーンでの実行順序を保ちます。
- ほとんどのCLIは、1つのproviderレーン上でシリアライズされます。
- `claude-cli` はより狭く、再開実行はClaudeセッションidごとにシリアライズされ、
  新規実行はワークスペースパスごとにシリアライズされます。独立したワークスペースは並列実行できます。
- OpenClawは、バックエンドの認証状態が変化した場合、
  relogin、トークンローテーション、またはauth profile credentialの変更を含めて、
  保存済みCLIセッションの再利用を破棄します。

## 画像（そのまま渡す）

CLIが画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClawはbase64画像を一時ファイルに書き出します。`imageArg` が設定されていれば、
それらのパスはCLI引数として渡されます。`imageArg` がない場合、OpenClawは
ファイルパスをプロンプトに追記します（パス注入）。これは、平文パスからローカルファイルを
自動読み込みするCLI（Claude CLIの挙動）には十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は、JSONを解析し、テキスト + セッションidの抽出を試みます。
- Gemini CLIのJSON出力では、`usage` が欠けているか空の場合、
  OpenClawは返信テキストを `response` から、usageを `stats` から読み取ります。
- `output: "jsonl"` はJSONLストリーム（たとえばClaude CLIの `stream-json`
  やCodex CLIの `--json`）を解析し、最終エージェントメッセージと、
  存在する場合はセッション識別子を抽出します。
- `output: "text"` はstdoutを最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後のCLI引数として渡します。
- `input: "stdin"` は、プロンプトをstdin経由で送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdinが使われます。

## デフォルト（plugin所有）

同梱のAnthropic pluginは、`claude-cli` のデフォルトを登録します。

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

同梱のOpenAI pluginも、`codex-cli` のデフォルトを登録します。

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

同梱のGoogle pluginも、`google-gemini-cli` のデフォルトを登録します。

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルのGemini CLIがインストールされていて、
`PATH` 上で `gemini` として利用可能である必要があります（`brew install gemini-cli` または
`npm install -g @google/gemini-cli`）。

Gemini CLIのJSONに関する注意:

- 返信テキストはJSONの `response` フィールドから読み取られます。
- `usage` が存在しないか空の場合、usageは `stats` にフォールバックします。
- `stats.cached` はOpenClawの `cacheRead` に正規化されます。
- `stats.input` が欠けている場合、OpenClawは入力トークンを
  `stats.input_tokens - stats.cached` から導出します。

上書きは必要な場合だけにしてください（よくあるのは絶対 `command` パスです）。

## plugin所有のデフォルト

CLIバックエンドのデフォルトは、現在ではpluginサーフェスの一部です。

- pluginは `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` が、モデルrefのprovider接頭辞になります。
- `agents.defaults.cliBackends.<id>` にあるユーザー設定は、引き続きpluginデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、オプションの
  `normalizeConfig` フックを通じてplugin所有のままです。

## Bundle MCPオーバーレイ

CLIバックエンドは**OpenClawツール呼び出しを直接受け取りません**が、バックエンドは
`bundleMcp: true` で生成されるMCP設定オーバーレイにオプトインできます。

現在の同梱挙動:

- `claude-cli`: `bundleMcp: true`（デフォルト）
- `codex-cli`: bundle MCPオーバーレイなし
- `google-gemini-cli`: bundle MCPオーバーレイなし

bundle MCPが有効な場合、OpenClawは次を行います。

- GatewayツールをCLIプロセスに公開するlocal loopback HTTP MCPサーバーを起動する
- セッションごとのトークン（`OPENCLAW_MCP_TOKEN`）でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャンネルコンテキストに限定する
- 現在のワークスペースで有効なbundle-MCPサーバーを読み込む
- それらを既存のバックエンド `--mcp-config` とマージする
- CLI引数を書き換えて `--strict-mcp-config --mcp-config <generated-file>` を渡す

`--strict-mcp-config` フラグは、Claude CLIが周囲の
ユーザーレベルまたはグローバルなMCPサーバーを継承するのを防ぎます。MCPサーバーが1つも有効でない場合でも、
バックグラウンド実行を分離したままにするため、OpenClawは厳格な空設定を注入します。

## 制限事項

- **OpenClawツール呼び出しの直接注入はありません。** OpenClawは
  CLIバックエンドプロトコルにツール呼び出しを注入しません。ただし、`bundleMcp: true`
  のバックエンド（Claude CLIのデフォルト）は、
  local loopback MCPブリッジ経由でGatewayツールを受け取るため、
  Claude CLIはネイティブMCPサポートを通じてOpenClawツールを呼び出せます。
- **ストリーミングはバックエンド依存です。** Claude CLIはJSONLストリーミング
  （`--include-partial-messages` 付きの `stream-json`）を使いますが、ほかのCLIバックエンドは
  終了までバッファリングされる場合があります。
- **構造化出力**は、そのCLIのJSON形式に依存します。
- **Codex CLIセッション**はテキスト出力経由で再開されます（JSONLではありません）。これは
  初回の `--json` 実行より構造化が弱いですが、OpenClawセッション自体は通常どおり動作します。

## トラブルシューティング

- **CLIが見つからない**: `command` をフルパスに設定してください。
- **モデル名が違う**: `modelAliases` を使って `provider/model` → CLIモデルへマッピングしてください。
- **セッション継続性がない**: `sessionArg` が設定され、`sessionMode` が
  `none` でないことを確認してください（Codex CLIは現在JSON出力で再開できません）。
- **画像が無視される**: `imageArg` を設定してください（あわせてCLIがファイルパスをサポートしていることも確認してください）。
