---
read_when:
    - APIプロバイダーが失敗したときに使える、信頼性の高いフォールバックが必要な場合
    - Codex CLIやその他のローカルAI CLIを実行していて、それらを再利用したい場合
    - CLIバックエンドのツールアクセス向けMCPループバックブリッジについて理解したい場合
summary: 'CLIバックエンド: オプションのMCPツールブリッジ付きローカルAI CLIフォールバック'
title: CLIバックエンド
x-i18n:
    generated_at: "2026-04-23T04:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d36aea09a97b980e6938e12ea3bb5c01aa5f6c4275879d51879e48d5a2225fb2
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLIバックエンド（フォールバックランタイム）

OpenClawは、APIプロバイダーが停止している、レート制限されている、または一時的に不安定なときに、**ローカルAI CLI** を **テキスト専用フォールバック** として実行できます。これは意図的に保守的な設計です。

- **OpenClawツールは直接注入されません** が、`bundleMcp: true` を持つバックエンドは、ループバックMCPブリッジ経由でGatewayツールを受け取れます。
- 対応するCLI向けの **JSONLストリーミング**
- **セッションをサポート**（そのため、後続ターンでも一貫性が保たれます）
- CLIが画像パスを受け入れる場合は、**画像をそのまま渡せます**

これは主経路ではなく、**セーフティネット** として設計されています。外部APIに依存せずに「常に動く」テキスト応答がほしい場合に使ってください。

ACPセッション制御、バックグラウンドタスク、スレッド/会話バインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに[ACP Agents](/ja-JP/tools/acp-agents)を使用してください。CLIバックエンドはACPではありません。

## 初心者向けクイックスタート

Codex CLIは**設定なしで**使えます（バンドルされたOpenAI Pluginがデフォルトバックエンドを登録します）。

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gatewayがlaunchd/systemd配下で動作していてPATHが最小限の場合は、コマンドパスだけを追加してください。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

これだけです。CLI自体に必要なもの以外、キーや追加の認証設定は不要です。

バンドルされたCLIバックエンドをGatewayホスト上で**Primaryメッセージプロバイダー**として使う場合、設定でそのバックエンドをモデル参照または `agents.defaults.cliBackends` の下に明示的に指定すると、OpenClawはそのバックエンドを所有するバンドルPluginを自動的に読み込みます。

## フォールバックとして使う

CLIバックエンドをフォールバックリストに追加すると、Primaryモデルが失敗したときだけ実行されます。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

注意:

- `agents.defaults.models`（許可リスト）を使っている場合は、CLIバックエンドのモデルもそこに含める必要があります。
- Primaryプロバイダーが失敗した場合（認証、レート制限、タイムアウトなど）、OpenClawは次にCLIバックエンドを試します。

## 設定概要

すべてのCLIバックエンドは次の場所にあります。

```
agents.defaults.cliBackends
```

各エントリーは**プロバイダーID**（例: `codex-cli`、`my-cli`）をキーにします。
そのプロバイダーIDが、モデル参照の左側になります。

```
<provider>/<model>
```

### 設定例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
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

1. プロバイダープレフィックス（`codex-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じOpenClawプロンプト + ワークスペースコンテキストを使って**システムプロンプトを構築**します。
3. 履歴の一貫性を保つため、CLIをセッションID付きで**実行**します（対応している場合）。
   バンドルされた `claude-cli` バックエンドは、OpenClawセッションごとにClaude stdioプロセスを生かしたままにし、後続ターンをstream-json stdin経由で送信します。
4. **出力を解析**し（JSONまたはプレーンテキスト）、最終テキストを返します。
5. バックエンドごとに**セッションIDを永続化**し、後続ターンで同じCLIセッションを再利用します。

<Note>
バンドルされたAnthropic `claude-cli` バックエンドは再びサポートされています。Anthropicの担当者から、OpenClawスタイルのClaude CLI利用は再び許可されていると案内があったため、Anthropicが新しいポリシーを公開しない限り、OpenClawはこの統合における `claude -p` の利用を認可済みとして扱います。
</Note>

バンドルされたOpenAI `codex-cli` バックエンドは、OpenClawのシステムプロンプトをCodexの `model_instructions_file` 設定上書き（`-c
model_instructions_file="..."`）経由で渡します。CodexはClaudeスタイルの `--append-system-prompt` フラグを公開していないため、OpenClawは新しいCodex CLIセッションごとに、組み立てたプロンプトを一時ファイルへ書き込みます。

バンドルされたAnthropic `claude-cli` バックエンドは、OpenClawのSkillsスナップショットを2つの方法で受け取ります。追加されたシステムプロンプト内のコンパクトなOpenClaw Skillsカタログと、`--plugin-dir` で渡される一時的なClaude Code Pluginです。そのPluginには、そのエージェント/セッションに適格なSkillsのみが含まれるため、Claude Codeのネイティブなスキルリゾルバーは、OpenClawが通常プロンプト内で告知するのと同じフィルター済みセットを参照します。Skillのenv/APIキー上書きは、実行時にOpenClawから子プロセス環境へ引き続き適用されます。

## セッション

- CLIがセッションをサポートする場合、`sessionArg`（例: `--session-id`）または `sessionArgs`（プレースホルダー `{sessionId}`）を設定してください。IDを複数のフラグに挿入する必要がある場合に使います。
- CLIが異なるフラグを持つ**resumeサブコマンド**を使う場合は、`resumeArgs`（再開時に `args` を置き換える）を設定し、必要なら `resumeOutput` も設定してください（非JSONのresume用）。
- `sessionMode`:
  - `always`: 常にセッションIDを送信します（保存済みがなければ新しいUUID）。
  - `existing`: 以前に保存されている場合のみセッションIDを送信します。
  - `none`: セッションIDを送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、`input: "stdin"` を使うため、アクティブな間は後続ターンでライブClaudeプロセスを再利用します。Gatewayが再起動するか、アイドル中のプロセスが終了した場合、OpenClawは保存済みClaudeセッションIDから再開します。
- 保存されたCLIセッションは、プロバイダー所有の継続性です。暗黙の日次セッションリセットでは切断されませんが、`/reset` と明示的な `session.reset` ポリシーでは切断されます。

シリアライズに関する注意:

- `serialize: true` は、同一レーン内の実行順序を維持します。
- ほとんどのCLIは1つのプロバイダーレーン上で直列化されます。
- OpenClawは、選択された認証IDが変わると、保存済みCLIセッションの再利用を破棄します。これには、認証プロファイルID、静的APIキー、静的トークン、またはCLIが公開する場合のOAuthアカウントIDの変更が含まれます。OAuthアクセストークンとリフレッシュトークンのローテーションでは、保存済みCLIセッションは切断されません。CLIが安定したOAuthアカウントIDを公開しない場合、OpenClawはそのCLI自身にresume権限の制御を任せます。

## 画像（パススルー）

CLIが画像パスを受け入れる場合は、`imageArg` を設定してください。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClawはbase64画像を一時ファイルへ書き込みます。`imageArg` が設定されている場合、それらのパスがCLI引数として渡されます。`imageArg` がない場合、OpenClawはファイルパスをプロンプトに追記します（パス注入）。これは、プレーンなパスからローカルファイルを自動読み込みするCLIには十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は、JSONを解析してテキスト + セッションIDを抽出しようとします。
- Gemini CLIのJSON出力では、`usage` がないか空の場合、OpenClawは返信テキストを `response` から、使用量を `stats` から読み取ります。
- `output: "jsonl"` はJSONLストリーム（例: Codex CLI `--json`）を解析し、存在する場合は最終エージェントメッセージとセッション識別子を抽出します。
- `output: "text"` は、stdoutを最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後のCLI引数として渡します。
- `input: "stdin"` は、プロンプトをstdin経由で送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdinが使われます。

## デフォルト（Plugin所有）

バンドルされたOpenAI Pluginは、`codex-cli` 用のデフォルトも登録します。

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

バンドルされたGoogle Pluginは、`google-gemini-cli` 用のデフォルトも登録します。

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルのGemini CLIがインストールされ、`PATH` 上で `gemini` として利用可能である必要があります（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。

Gemini CLI JSONに関する注意:

- 返信テキストはJSONの `response` フィールドから読み取られます。
- 使用量は `usage` が存在しないか空の場合に `stats` へフォールバックします。
- `stats.cached` はOpenClawの `cacheRead` に正規化されます。
- `stats.input` がない場合、OpenClawは `stats.input_tokens - stats.cached` から入力トークン数を導出します。

必要な場合のみ上書きしてください（一般的なのは絶対 `command` パスです）。

## Plugin所有のデフォルト

CLIバックエンドのデフォルトは、現在ではPluginサーフェスの一部です。

- Pluginは `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` が、モデル参照内のプロバイダープレフィックスになります。
- `agents.defaults.cliBackends.<id>` のユーザー設定は、引き続きPluginデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、オプションの `normalizeConfig` フックを通じて引き続きPlugin所有です。

小さなプロンプト/メッセージ互換性シムが必要なPluginは、プロバイダーやCLIバックエンドを置き換えることなく、双方向テキスト変換を宣言できます。

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` は、CLIへ渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output` は、OpenClawが自身の制御マーカーとチャネル配信を処理する前に、ストリーミングされるアシスタントデルタと解析済み最終テキストを書き換えます。

Claude Codeのstream-json互換JSONLを出力するCLIでは、そのバックエンド設定に `jsonlDialect: "claude-stream-json"` を設定してください。

## Bundle MCPオーバーレイ

CLIバックエンドは**OpenClawツール呼び出しを直接受け取りません** が、バックエンドは `bundleMcp: true` によって生成されるMCP設定オーバーレイにオプトインできます。

現在のバンドル動作:

- `claude-cli`: 生成されたstrict MCP設定ファイル
- `codex-cli`: `mcp_servers` 用のインライン設定上書き
- `google-gemini-cli`: 生成されたGemini system settingsファイル

bundle MCPが有効な場合、OpenClawは次を行います。

- GatewayツールをCLIプロセスへ公開するループバックHTTP MCPサーバーを起動する
- セッションごとのトークン（`OPENCLAW_MCP_TOKEN`）でブリッジを認証する
- 現在のセッション、アカウント、チャネルコンテキストにツールアクセスをスコープする
- 現在のワークスペースで有効なbundle-MCPサーバーを読み込む
- 既存のバックエンドMCP設定/設定形状があればそれらとマージする
- 所有拡張のバックエンド所有統合モードを使って起動設定を書き換える

有効なMCPサーバーがない場合でも、バックエンドがbundle MCPにオプトインしていれば、バックグラウンド実行を分離したままにするため、OpenClawはstrict設定を注入します。

## 制限事項

- **OpenClawツールの直接呼び出しはありません。** OpenClawはCLIバックエンドプロトコルにツール呼び出しを注入しません。バックエンドが `bundleMcp: true` にオプトインした場合にのみ、Gatewayツールを参照できます。
- **ストリーミングはバックエンド依存です。** JSONLをストリームするバックエンドもあれば、終了までバッファするものもあります。
- **構造化出力** はCLIのJSON形式に依存します。
- **Codex CLIセッション** はテキスト出力経由でresumeされます（JSONLではありません）。これは最初の `--json` 実行より構造化されていません。それでもOpenClawセッション自体は通常どおり機能します。

## トラブルシューティング

- **CLIが見つからない**: `command` にフルパスを設定してください。
- **モデル名が間違っている**: `modelAliases` を使って `provider/model` → CLIモデル にマッピングしてください。
- **セッション継続性がない**: `sessionArg` が設定されていて、`sessionMode` が `none` ではないことを確認してください（Codex CLIは現在、JSON出力でresumeできません）。
- **画像が無視される**: `imageArg` を設定してください（あわせてCLIがファイルパスをサポートしていることも確認してください）。
