---
read_when:
    - 非対話的に config を読み取ったり編集したりしたいとき
summary: '`openclaw config` の CLI リファレンス（get/set/unset/file/schema/validate）'
title: config
x-i18n:
    generated_at: "2026-04-05T12:38:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

`openclaw.json` を非対話的に編集するための config ヘルパーです。パスを指定して
値の get/set/unset/file/schema/validate を行い、アクティブな config ファイルを表示します。サブコマンドなしで実行すると、
configure ウィザードを開きます（`openclaw configure` と同じ）。

ルートオプション:

- `--section <section>`: サブコマンドなしで `openclaw config` を実行するときに使う、繰り返し指定可能なガイド付きセットアップのセクションフィルター

サポートされるガイド付きセクション:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## 例

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

生成された `openclaw.json` 用 JSON schema を JSON として stdout に出力します。

含まれる内容:

- 現在のルート config schema と、エディター支援用のルート `$schema` 文字列フィールド
- Control UI で使われるフィールド `title` と `description` のドキュメントメタデータ
- 対応するフィールドドキュメントが存在する場合、ネストされたオブジェクト、ワイルドカード（`*`）、配列要素（`[]`）ノードも同じ `title` / `description` メタデータを継承
- 対応するフィールドドキュメントが存在する場合、`anyOf` / `oneOf` / `allOf` 分岐も同じドキュメントメタデータを継承
- ランタイム manifest を読み込める場合、ベストエフォートの live plugin + channel schema メタデータ
- 現在の config が無効でも利用できるクリーンなフォールバック schema

関連ランタイム RPC:

- `config.schema.lookup` は、正規化済み config パス 1 件について、浅い
  schema ノード（`title`、`description`、`type`、`enum`、`const`、一般的な境界）、
  一致した UI ヒントメタデータ、および直下の子要約を返します。Control UI やカスタムクライアントで
  パス単位のドリルダウンに使用してください。

```bash
openclaw config schema
```

他のツールで調べたり検証したりしたい場合は、ファイルにパイプしてください。

```bash
openclaw config schema > openclaw.schema.json
```

### パス

パスにはドット記法またはブラケット記法を使います。

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

特定の agent を対象にするには、agent list のインデックスを使います。

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値

値は、可能であれば JSON5 として解析され、そうでなければ文字列として扱われます。
JSON5 解析を必須にするには `--strict-json` を使用してください。旧来のエイリアスとして `--json` も引き続きサポートされています。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、ターミナル整形済みテキストではなく生の値を JSON として出力します。

## `config set` のモード

`openclaw config set` は 4 つの代入スタイルをサポートしています。

1. 値モード: `openclaw config set <path> <value>`
2. SecretRef builder モード:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Provider builder モード（`secrets.providers.<alias>` パスのみ）:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. バッチモード（`--batch-json` または `--batch-file`）:

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

ポリシーに関する注記:

- サポートされていないランタイム可変サーフェス（たとえば `hooks.token`、`commands.ownerDisplaySecret`、Discord の thread-binding webhook token、WhatsApp の creds JSON）では、SecretRef の代入は拒否されます。詳細は [SecretRef Credential Surface](/reference/secretref-credential-surface) を参照してください。

バッチ解析では常にバッチペイロード（`--batch-json`/`--batch-file`）を信頼できる情報源として使います。
`--strict-json` / `--json` はバッチ解析の動作を変更しません。

JSON パス/値モードは、SecretRef と provider の両方で引き続きサポートされます。

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider Builder Flags

Provider builder の対象は、パスに `secrets.providers.<alias>` を使う必要があります。

共通フラグ:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`（`file`, `exec`）

Env provider（`--provider-source env`）:

- `--provider-allowlist <ENV_VAR>`（繰り返し指定可能）

File provider（`--provider-source file`）:

- `--provider-path <path>`（必須）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec provider（`--provider-source exec`）:

- `--provider-command <path>`（必須）
- `--provider-arg <arg>`（繰り返し指定可能）
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>`（繰り返し指定可能）
- `--provider-pass-env <ENV_VAR>`（繰り返し指定可能）
- `--provider-trusted-dir <path>`（繰り返し指定可能）
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

ハードニングされた exec provider の例:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## ドライラン

`openclaw.json` に書き込まずに変更を検証するには `--dry-run` を使用します。

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

ドライランの動作:

- Builder モード: 変更された ref/provider に対して SecretRef の解決可能性チェックを実行します。
- JSON モード（`--strict-json`、`--json`、またはバッチモード）: schema 検証と SecretRef の解決可能性チェックを実行します。
- 既知の非対応 SecretRef 対象サーフェスに対するポリシー検証も実行されます。
- ポリシーチェックは変更後の完全な config を評価するため、親オブジェクト書き込み（たとえば `hooks` をオブジェクトとして設定すること）では非対応サーフェス検証を回避できません。
- exec SecretRef チェックは、コマンドの副作用を避けるため、ドライラン時にはデフォルトでスキップされます。
- exec SecretRef チェックを有効にするには、`--dry-run` と一緒に `--allow-exec` を使用してください（これにより provider コマンドが実行される場合があります）。
- `--allow-exec` はドライラン専用であり、`--dry-run` なしで使うとエラーになります。

`--dry-run --json` は機械可読なレポートを出力します。

- `ok`: ドライランが成功したかどうか
- `operations`: 評価した代入数
- `checks`: schema/解決可能性チェックが実行されたかどうか
- `checks.resolvabilityComplete`: 解決可能性チェックが最後まで実行されたかどうか（exec ref がスキップされた場合は false）
- `refsChecked`: ドライラン中に実際に解決された ref 数
- `skippedExecRefs`: `--allow-exec` が設定されていないためスキップされた exec ref 数
- `errors`: `ok=false` の場合の構造化された schema/解決可能性エラー

### JSON 出力形式

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // resolvability エラーのときに存在
    },
  ],
}
```

成功例:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

失敗例:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

ドライランが失敗した場合:

- `config schema validation failed`: 変更後の config 形状が無効です。パス/値、または provider/ref オブジェクト形状を修正してください。
- `Config policy validation failed: unsupported SecretRef usage`: その認証情報を平文/文字列入力に戻し、SecretRef はサポートされるサーフェスでのみ使ってください。
- `SecretRef assignment(s) could not be resolved`: 参照先の provider/ref が現在解決できません（環境変数不足、無効なファイル参照、exec provider の失敗、または provider/source の不一致）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: ドライランで exec ref がスキップされました。exec の解決可能性検証が必要なら `--allow-exec` を付けて再実行してください。
- バッチモードでは、失敗したエントリを修正し、書き込む前に `--dry-run` を再実行してください。

## サブコマンド

- `config file`: アクティブな config ファイルパスを表示します（`OPENCLAW_CONFIG_PATH` またはデフォルト位置から解決）。

編集後は gateway を再起動してください。

## Validate

gateway を起動せずに、現在の config をアクティブな schema に対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```
