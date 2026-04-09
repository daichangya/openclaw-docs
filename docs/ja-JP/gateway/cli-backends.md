---
read_when:
    - APIプロバイダーが失敗したときに信頼できるフォールバックが必要
    - Codex CLIや他のローカルAI CLIを実行していて、それらを再利用したい
    - CLIバックエンドのツールアクセス向けMCP loopback bridgeを理解したい
summary: 'CLIバックエンド: オプションのMCPツールブリッジを備えたローカルAI CLIフォールバック'
title: CLIバックエンド
x-i18n:
    generated_at: "2026-04-09T01:28:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b458f9fe6fa64c47864c8c180f3dedfd35c5647de470a2a4d31c26165663c20
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLIバックエンド（フォールバックランタイム）

OpenClawは、APIプロバイダーが停止している、レート制限されている、または一時的に不安定な場合に、**テキスト専用のフォールバック**として**ローカルAI CLI**を実行できます。これは意図的に保守的な設計です。

- `bundleMcp: true` を持つバックエンドはloopback MCP bridge経由でGatewayツールを受け取れますが、**OpenClawのツールは直接注入されません**。
- 対応するCLIでは**JSONLストリーミング**を利用できます。
- **セッションをサポート**しています（そのため後続のターンでも一貫性が保たれます）。
- CLIが画像パスを受け付ける場合、**画像をそのまま渡せます**。

これは主要経路ではなく、**セーフティネット**として設計されています。外部APIに依存せず、「常に動作する」テキスト応答がほしい場合に使ってください。

ACPセッション制御、バックグラウンドタスク、スレッド/会話バインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに[ACP Agents](/ja-JP/tools/acp-agents)を使ってください。CLIバックエンドはACPではありません。

## 初心者向けクイックスタート

Codex CLIは**設定なし**で使えます（同梱のOpenAIプラグインがデフォルトのバックエンドを登録します）。

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

これで完了です。CLI自体に必要なものを除き、キーや追加の認証設定は不要です。

同梱CLIバックエンドをGatewayホスト上の**主要メッセージプロバイダー**として使う場合、設定でモデル参照または`agents.defaults.cliBackends`の下にそのバックエンドを明示的に参照していれば、OpenClawはその所有元である同梱プラグインを自動で読み込むようになりました。

## フォールバックとして使う

CLIバックエンドをフォールバック一覧に追加すると、主要モデルが失敗したときだけ実行されます。

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

- `agents.defaults.models`（許可リスト）を使う場合は、そこにCLIバックエンドのモデルも含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClawは次にCLIバックエンドを試します。

## 設定の概要

すべてのCLIバックエンドは次の配下にあります。

```
agents.defaults.cliBackends
```

各エントリーは**provider id**（例: `codex-cli`, `my-cli`）をキーにします。
provider idはモデル参照の左側になります。

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
          // CodexスタイルのCLIでは、代わりにプロンプトファイルを指定できます:
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

1. providerプレフィックス（`codex-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じOpenClawプロンプトとワークスペースコンテキストを使って**システムプロンプトを構築**します。
3. 履歴の整合性が保たれるよう、（対応していれば）セッションid付きで**CLIを実行**します。
4. **出力を解析**し（JSONまたはプレーンテキスト）、最終テキストを返します。
5. バックエンドごとに**セッションidを永続化**するので、後続のやり取りでも同じCLIセッションを再利用します。

<Note>
同梱のAnthropic `claude-cli`バックエンドが再びサポートされました。Anthropicのスタッフから、OpenClawスタイルのClaude CLI利用は再び許可されると案内があったため、Anthropicが新しいポリシーを公開しない限り、OpenClawはこの連携における`claude -p`の利用を公認済みとして扱います。
</Note>

同梱のOpenAI `codex-cli`バックエンドは、OpenClawのシステムプロンプトをCodexの`model_instructions_file`設定オーバーライド（`-c model_instructions_file="..."`）経由で渡します。CodexにはClaudeスタイルの`--append-system-prompt`フラグがないため、OpenClawは新しいCodex CLIセッションごとに組み立て済みプロンプトを一時ファイルに書き込みます。

## セッション

- CLIがセッションをサポートしている場合は、`sessionArg`（例: `--session-id`）または`sessionArgs`（プレースホルダー`{sessionId}`）を設定してください。後者はIDを複数のフラグに挿入する必要がある場合に使います。
- CLIが異なるフラグを持つ**resumeサブコマンド**を使う場合は、`resumeArgs`（再開時に`args`を置き換えます）を設定し、必要に応じて`resumeOutput`（JSON以外の再開用）も設定してください。
- `sessionMode`:
  - `always`: 常にセッションidを送信します（保存済みがなければ新しいUUID）。
  - `existing`: 以前に保存されたセッションidがある場合のみ送信します。
  - `none`: セッションidを送信しません。

シリアライズに関する注意:

- `serialize: true` は同一レーンでの実行順を保ちます。
- 多くのCLIは1つのproviderレーン上で直列化されます。
- OpenClawは、再ログイン、トークンローテーション、認証プロファイル資格情報の変更を含め、バックエンドの認証状態が変わると、保存済みCLIセッションの再利用を破棄します。

## 画像（パススルー）

CLIが画像パスを受け付ける場合は、`imageArg`を設定してください。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClawはbase64画像を一時ファイルに書き込みます。`imageArg`が設定されていれば、それらのパスはCLI引数として渡されます。`imageArg`がない場合、OpenClawはファイルパスをプロンプトに追記します（パス注入）。これは、プレーンなパスからローカルファイルを自動読み込みするCLIでは十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）はJSONを解析し、テキストとセッションidの抽出を試みます。
- Gemini CLIのJSON出力では、`usage`がないか空の場合、OpenClawは応答テキストを`response`から、使用量を`stats`から読み取ります。
- `output: "jsonl"` はJSONLストリーム（例: Codex CLI `--json`）を解析し、最終エージェントメッセージと存在する場合はセッション識別子を抽出します。
- `output: "text"` はstdoutを最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）はプロンプトを最後のCLI引数として渡します。
- `input: "stdin"` はstdin経由でプロンプトを送信します。
- プロンプトが非常に長く、`maxPromptArgChars`が設定されている場合はstdinが使われます。

## デフォルト（プラグイン所有）

同梱のOpenAIプラグインは`codex-cli`のデフォルトも登録します。

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

同梱のGoogleプラグインは`google-gemini-cli`のデフォルトも登録します。

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルのGemini CLIがインストールされ、`PATH`上で`gemini`として利用可能である必要があります（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。

Gemini CLI JSONに関する注意:

- 応答テキストはJSONの`response`フィールドから読み取られます。
- 使用量は`usage`が存在しないか空の場合に`stats`へフォールバックします。
- `stats.cached`はOpenClawの`cacheRead`に正規化されます。
- `stats.input`がない場合、OpenClawは`stats.input_tokens - stats.cached`から入力トークン数を導出します。

必要な場合にのみ上書きしてください（一般的なのは絶対`command`パスです）。

## プラグイン所有のデフォルト

CLIバックエンドのデフォルトは現在、プラグインサーフェスの一部です。

- プラグインは`api.registerCliBackend(...)`でそれらを登録します。
- バックエンドの`id`がモデル参照におけるproviderプレフィックスになります。
- `agents.defaults.cliBackends.<id>`内のユーザー設定は、引き続きプラグインのデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、オプションの`normalizeConfig`フックを通じて引き続きプラグイン所有です。

## Bundle MCPオーバーレイ

CLIバックエンドは**OpenClawのツール呼び出しを直接受け取りません**が、バックエンドは`bundleMcp: true`で生成されたMCP設定オーバーレイにオプトインできます。

現在の同梱動作:

- `claude-cli`: 生成されたstrict MCP設定ファイル
- `codex-cli`: `mcp_servers`向けのインライン設定オーバーライド
- `google-gemini-cli`: 生成されたGemini system settingsファイル

bundle MCPが有効な場合、OpenClawは次を行います。

- GatewayツールをCLIプロセスに公開するloopback HTTP MCPサーバーを起動する
- セッションごとのトークン（`OPENCLAW_MCP_TOKEN`）でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャンネルコンテキストに限定する
- 現在のワークスペースで有効なbundle-MCPサーバーを読み込む
- それらを既存のバックエンドMCP設定/設定形状とマージする
- 所有元拡張機能のバックエンド所有integration modeを使って起動設定を書き換える

MCPサーバーが1つも有効でない場合でも、バックエンドがbundle MCPにオプトインしていれば、バックグラウンド実行を分離した状態に保つためにOpenClawはstrict設定を注入します。

## 制限事項

- **OpenClawのツール呼び出しを直接行えません。** OpenClawはCLIバックエンドプロトコルにツール呼び出しを注入しません。バックエンドが`bundleMcp: true`にオプトインした場合にのみ、Gatewayツールを利用できます。
- **ストリーミングはバックエンド依存です。** JSONLをストリームするバックエンドもあれば、終了までバッファするものもあります。
- **構造化出力**はCLIのJSON形式に依存します。
- **Codex CLIセッション**はテキスト出力で再開されます（JSONLではありません）。そのため、最初の`--json`実行より構造化が弱くなります。それでもOpenClawセッション自体は通常どおり動作します。

## トラブルシューティング

- **CLIが見つからない**: `command`に完全パスを設定してください。
- **モデル名が間違っている**: `modelAliases`を使って`provider/model` → CLIモデルをマッピングしてください。
- **セッションの継続性がない**: `sessionArg`が設定され、`sessionMode`が`none`でないことを確認してください（Codex CLIは現在、JSON出力で再開できません）。
- **画像が無視される**: `imageArg`を設定し（あわせてCLIがファイルパスをサポートしていることも確認してください）。
