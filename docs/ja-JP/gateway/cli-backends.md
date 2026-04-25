---
read_when:
    - APIプロバイダーが失敗したときの信頼できるフォールバックが必要です
    - Codex CLIや他のローカルAI CLIを実行しており、それらを再利用したい場合
    - CLIバックエンドのツールアクセスに使うMCP loopbackブリッジを理解したい場合
summary: 'CLIバックエンド: 任意のMCPツールブリッジを備えたローカルAI CLIフォールバック'
title: CLIバックエンド
x-i18n:
    generated_at: "2026-04-25T13:46:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClawは、APIプロバイダーが停止中、レート制限中、または一時的に不安定なときに、
**ローカルAI CLI** を **テキスト専用フォールバック** として実行できます。これは意図的に保守的です:

- **OpenClawツールは直接注入されません** が、`bundleMcp: true` を持つバックエンドは
  loopback MCPブリッジ経由でGatewayツールを受け取れます。
- それをサポートするCLI向けの **JSONLストリーミング**。
- **セッションをサポート** します（そのため後続ターンの一貫性が保たれます）。
- CLIが画像パスを受け付ける場合は、**画像を渡せます**。

これは主要経路ではなく、**安全網** として設計されています。外部APIに依存せずに
「常に動く」テキスト応答が欲しいときに使ってください。

ACPセッション制御、バックグラウンドタスク、
スレッド/会話バインディング、永続的な外部コーディングセッションを備えた完全なharness runtimeが必要な場合は、
代わりに [ACP Agents](/ja-JP/tools/acp-agents) を使用してください。CLIバックエンドはACPではありません。

## 初心者向けクイックスタート

設定なしでCodex CLIを使えます（バンドル済みOpenAI Pluginが
デフォルトバックエンドを登録します）:

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gatewayがlaunchd/systemd配下で動作していてPATHが最小限の場合は、
コマンドパスだけ追加してください:

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

これで完了です。CLI自体に必要なもの以外、キーも追加の認証設定も不要です。

バンドル済みCLIバックエンドをGatewayホスト上の**主要メッセージプロバイダー**として
使用する場合、設定がモデル参照または
`agents.defaults.cliBackends` 配下でそのバックエンドを明示的に参照していれば、
OpenClawは所有するバンドル済みPluginを自動読み込みするようになりました。

## フォールバックとして使う

CLIバックエンドをフォールバック一覧に追加すると、主要モデルが失敗したときだけ実行されます:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

注記:

- `agents.defaults.models`（許可リスト）を使う場合は、CLIバックエンドのモデルもそこに含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClawは
  次にCLIバックエンドを試します。

## 設定概要

すべてのCLIバックエンドは次の配下にあります:

```
agents.defaults.cliBackends
```

各エントリは **provider id**（例: `codex-cli`, `my-cli`）をキーにします。
provider idは、モデル参照の左側になります:

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
          // 専用のprompt-fileフラグがあるCLI向け:
          // systemPromptFileArg: "--system-file",
          // Codex形式のCLIは代わりにprompt fileを指定できます:
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
2. 同じOpenClawプロンプト + ワークスペースコンテキストを使って**システムプロンプトを構築**します。
3. 履歴の整合性を保つため、対応していればセッションid付きで**CLIを実行**します。
   バンドル済みの `claude-cli` バックエンドは、各OpenClawセッションごとに
   Claude stdioプロセスを生かしたままにし、後続ターンをstream-json stdin経由で送信します。
4. **出力を解析**し（JSONまたはプレーンテキスト）、最終テキストを返します。
5. バックエンドごとに**セッションidを永続化**し、後続ターンで同じCLIセッションを再利用します。

<Note>
バンドル済みAnthropic `claude-cli` バックエンドは再びサポートされています。Anthropicのスタッフから、
OpenClaw形式のClaude CLI利用は再び許可されていると伝えられたため、Anthropicが新しいポリシーを
公開しない限り、OpenClawはこの統合における `claude -p` 利用を認可済みとして扱います。
</Note>

バンドル済みOpenAI `codex-cli` バックエンドは、OpenClawのシステムプロンプトを
Codexの `model_instructions_file` 設定上書き（`-c
model_instructions_file="..."`）経由で渡します。CodexはClaude形式の
`--append-system-prompt` フラグを公開していないため、OpenClawは新しいCodex CLIセッションごとに
組み立て済みプロンプトを一時ファイルへ書き込みます。

バンドル済みAnthropic `claude-cli` バックエンドは、OpenClawのSkillsスナップショットを
2つの方法で受け取ります。1つは追加されるシステムプロンプト内のコンパクトなOpenClaw Skillsカタログ、
もう1つは `--plugin-dir` で渡される一時的なClaude Code Pluginです。
このPluginには、そのagent/sessionで対象となるSkillsだけが含まれるため、Claude Codeのネイティブな
skill resolverは、OpenClawが通常プロンプト内で告知するのと同じフィルタ済みセットを見ます。
Skillのenv/APIキー上書きは、引き続きOpenClawが実行用の子プロセス環境に適用します。

Claude CLIには独自の非対話型permission modeもあります。OpenClawは、Claude固有の設定を追加する代わりに、
それを既存のexec policyへマッピングします。実効的に要求されたexec policyがYOLO
（`tools.exec.security: "full"` かつ `tools.exec.ask: "off"`）の場合、
OpenClawは `--permission-mode bypassPermissions` を追加します。
エージェントごとの `agents.list[].tools.exec` 設定は、そのエージェントに対してグローバルの `tools.exec` を上書きします。
別のClaude modeを強制したい場合は、
`agents.defaults.cliBackends.claude-cli.args` 配下と対応する `resumeArgs` に
`--permission-mode default` や `--permission-mode acceptEdits` のような明示的な生のバックエンド引数を設定してください。

OpenClawがバンドル済み `claude-cli` バックエンドを使う前に、Claude Code自体が同じホスト上で
すでにログイン済みである必要があります:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` バイナリがすでに `PATH` 上にある場合を除き、`agents.defaults.cliBackends.claude-cli.command` を使ってください。

## セッション

- CLIがセッションに対応している場合は、`sessionArg`（例: `--session-id`）または
  `sessionArgs`（プレースホルダー `{sessionId}`）を設定します。idを複数のフラグに
  挿入する必要がある場合はこちらを使います。
- CLIが異なるフラグを持つ**resumeサブコマンド**を使う場合は、
  `resumeArgs`（resume時に `args` を置き換えます）と、必要に応じて
  `resumeOutput`（非JSON resume向け）を設定します。
- `sessionMode`:
  - `always`: 常にセッションidを送信します（保存済みがなければ新しいUUID）。
  - `existing`: 以前に保存されたセッションidがある場合のみ送信します。
  - `none`: セッションidを送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、
  `input: "stdin"` を使用し、有効な間は後続ターンが生きたClaudeプロセスを再利用します。
  ウォームなstdioが現在のデフォルトで、transportフィールドを省略したカスタム設定でも同様です。
  Gatewayが再起動するか、アイドル状態のプロセスが終了した場合、OpenClawは保存済みClaudeセッションidから再開します。
  保存済みセッションidは、resume前に既存の読み取り可能なproject transcriptに対して検証されるため、
  実体のないバインディングは、`--resume` の下で黙って新しいClaude CLIセッションを始める代わりに
  `reason=transcript-missing` でクリアされます。
- 保存済みCLIセッションは、プロバイダー所有の継続性です。暗黙の日次セッション
  リセットでは切断されません。`/reset` と明示的な `session.reset` ポリシーでは切断されます。

シリアライズに関する注記:

- `serialize: true` は、同じレーンの実行順を保ちます。
- ほとんどのCLIは1つのprovider lane上でシリアライズされます。
- OpenClawは、選択された認証アイデンティティが変わると、保存済みCLIセッションの再利用を破棄します。
  これには、auth profile idの変更、静的APIキー、静的トークン、またはCLIが公開している場合はOAuth
  アカウントアイデンティティの変更が含まれます。OAuth access tokenおよびrefresh tokenの
  ローテーションでは保存済みCLIセッションは切断されません。CLIが安定したOAuth account idを公開しない場合、
  OpenClawはそのCLI自身にresume権限の強制を任せます。

## 画像（パススルー）

CLIが画像パスを受け付ける場合は、`imageArg` を設定します:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClawはbase64画像を一時ファイルへ書き出します。`imageArg` が設定されていれば、
それらのパスはCLI引数として渡されます。`imageArg` がなければ、OpenClawは
ファイルパスをプロンプトに追加します（パス注入）。これは、プレーンなパスからローカルファイルを自動読み込みするCLIには十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は、JSONを解析してテキスト + セッションidを抽出しようとします。
- Gemini CLIのJSON出力では、`usage` が欠落または空の場合、OpenClawは
  返信テキストを `response` から、usageを `stats` から読み取ります。
- `output: "jsonl"` はJSONLストリーム（たとえばCodex CLI `--json`）を解析し、最終agent messageと
  存在する場合はセッション識別子を抽出します。
- `output: "text"` はstdoutを最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後のCLI引数として渡します。
- `input: "stdin"` は、プロンプトをstdin経由で送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdinが使われます。

## デフォルト（Plugin所有）

バンドル済みOpenAI Pluginは、`codex-cli` 向けにもデフォルトを登録します:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

バンドル済みGoogle Pluginは、`google-gemini-cli` 向けにもデフォルトを登録します:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルGemini CLIがインストールされ、`PATH` 上で
`gemini` として利用可能である必要があります（`brew install gemini-cli` または
`npm install -g @google/gemini-cli`）。

Gemini CLI JSONに関する注記:

- 返信テキストはJSONの `response` フィールドから読み取られます。
- `usage` が存在しないか空の場合、usageは `stats` にフォールバックします。
- `stats.cached` はOpenClawの `cacheRead` に正規化されます。
- `stats.input` が欠落している場合、OpenClawは
  `stats.input_tokens - stats.cached` から入力トークンを導出します。

必要な場合のみ上書きしてください（よくあるのは絶対 `command` パスです）。

## Plugin所有のデフォルト

CLIバックエンドのデフォルトは、現在ではPluginサーフェスの一部です:

- Pluginは `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` は、モデル参照におけるproviderプレフィックスになります。
- ユーザー設定の `agents.defaults.cliBackends.<id>` は、引き続きPluginデフォルトを上書きします。
- バックエンド固有設定のクリーンアップは、任意の
  `normalizeConfig` フックを通じて引き続きPlugin所有です。

小さなprompt/message互換性shimが必要なPluginは、providerやCLIバックエンドを置き換えずに、
双方向のテキスト変換を宣言できます:

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

`input` は、CLIへ渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output`
は、OpenClawが独自の制御マーカー処理とチャネル配信を行う前に、
ストリーミングされるassistant deltaと解析済み最終テキストを書き換えます。

Claude Codeのstream-json互換JSONLを出力するCLIでは、
そのバックエンド設定で `jsonlDialect: "claude-stream-json"` を設定してください。

## bundle MCPオーバーレイ

CLIバックエンドは **OpenClawのツール呼び出しを直接受け取りません** が、バックエンドは
`bundleMcp: true` で生成されるMCP設定オーバーレイにオプトインできます。

現在のバンドル済み動作:

- `claude-cli`: 生成されたstrict MCP設定ファイル
- `codex-cli`: `mcp_servers` に対するインライン設定上書き。生成された
  OpenClaw loopbackサーバーには、Codexのサーバー単位ツール承認モードが付与されるため、
  MCP呼び出しがローカル承認プロンプトで停止しません
- `google-gemini-cli`: 生成されたGemini system settingsファイル

bundle MCPが有効な場合、OpenClawは次を行います:

- GatewayツールをCLIプロセスへ公開するloopback HTTP MCPサーバーを起動する
- セッションごとのトークン（`OPENCLAW_MCP_TOKEN`）でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャネルコンテキストにスコープする
- 現在のワークスペースで有効なbundle-MCPサーバーを読み込む
- それらを既存のバックエンドMCP設定/設定形状とマージする
- 所有extensionのバックエンド所有統合モードを使って起動設定を書き換える

有効なMCPサーバーがない場合でも、バックエンドがbundle MCPにオプトインしていれば、
バックグラウンド実行を分離状態に保つため、OpenClawはstrict設定を注入します。

セッションスコープのバンドル済みMCP runtimeは、セッション内再利用のためにキャッシュされ、
アイドル時間が `mcp.sessionIdleTtlMs` ミリ秒（デフォルト10分。無効化するには `0` を設定）を超えると回収されます。
認証プローブ、slug生成、Active Memoryリコールのようなワンショット埋め込み実行は、
stdio子プロセスやStreamable HTTP/SSEストリームが実行後に残らないよう、実行終了時にクリーンアップを要求します。

## 制限事項

- **OpenClawツールの直接呼び出しはありません。** OpenClawはCLIバックエンドプロトコルへ
  ツール呼び出しを注入しません。バックエンドがGatewayツールを見るのは、
  `bundleMcp: true` にオプトインした場合だけです。
- **ストリーミングはバックエンド固有です。** JSONLをストリーミングするバックエンドもあれば、
  終了までバッファするものもあります。
- **構造化出力** はCLIのJSON形式に依存します。
- **Codex CLIセッション** はテキスト出力経由でresumeします（JSONLではありません）。そのため、
  初回の `--json` 実行より構造性は低くなります。OpenClawセッション自体は通常どおり機能します。

## トラブルシューティング

- **CLIが見つからない**: `command` にフルパスを設定してください。
- **モデル名が違う**: `modelAliases` を使って `provider/model` → CLI model にマッピングしてください。
- **セッション継続性がない**: `sessionArg` が設定され、`sessionMode` が
  `none` でないことを確認してください（Codex CLIは現在、JSON出力でresumeできません）。
- **画像が無視される**: `imageArg` を設定してください（あわせてCLIがファイルパスをサポートしていることを確認してください）。

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Local models](/ja-JP/gateway/local-models)
