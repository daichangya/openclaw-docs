---
read_when:
    - 設定を非対話的に読み取る、または編集したい場合
summary: '`openclaw config` の CLI リファレンス（get/set/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-04-25T13:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

`openclaw.json` 内の非対話編集用の設定ヘルパーです。パス単位で
get/set/unset/file/schema/validate を行い、アクティブな設定ファイルを表示します。サブコマンドなしで実行すると、
configure ウィザードを開きます（`openclaw configure` と同じ）。

ルートオプション:

- `--section <section>`: サブコマンドなしで `openclaw config` を実行する際の、繰り返し指定可能なガイド付きセットアップセクションフィルター

対応するガイド付きセクション:

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
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json` 用に生成された JSON スキーマを JSON として stdout に出力します。

含まれる内容:

- 現在のルート設定スキーマに加え、エディター用ツール向けのルート `$schema` 文字列フィールド
- Control UI で使用されるフィールド `title` と `description` のドキュメントメタデータ
- フィールドドキュメントが存在する場合、ネストされたオブジェクト、ワイルドカード（`*`）、配列要素（`[]`）ノードも同じ `title` / `description` メタデータを継承
- 一致するフィールドドキュメントが存在する場合、`anyOf` / `oneOf` / `allOf` 分岐も同じドキュメントメタデータを継承
- ランタイムマニフェストを読み込める場合の、ベストエフォートなライブ Plugin + チャネルスキーマメタデータ
- 現在の設定が無効な場合でも使えるクリーンなフォールバックスキーマ

関連ランタイム RPC:

- `config.schema.lookup` は、1つの正規化済み設定パスと浅い
  スキーマノード（`title`、`description`、`type`、`enum`、`const`、共通の境界）、
  一致した UI ヒントメタデータ、および直下の子要約を返します。Control UI やカスタムクライアントでの
  パススコープのドリルダウンに使用してください。

```bash
openclaw config schema
```

他のツールで確認または検証したい場合は、ファイルにパイプできます:

```bash
openclaw config schema > openclaw.schema.json
```

### パス

パスにはドット記法またはブラケット記法を使用します:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

特定のエージェントを対象にするには、agent list のインデックスを使用します:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値

値は、可能であれば JSON5 として解析され、それ以外は文字列として扱われます。
JSON5 解析を必須にするには `--strict-json` を使用します。`--json` も従来の別名として引き続きサポートされます。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` は、ターミナル向けに整形されたテキストではなく、生の値を JSON として出力します。

オブジェクト代入は、デフォルトでは対象パスを置き換えます。  
`agents.defaults.models`、
`models.providers`、`models.providers.<id>.models`、`plugins.entries`、`auth.profiles`
のような、ユーザー追加エントリを保持することが多い保護対象の map/list パスでは、
既存エントリを削除する置換は、`--replace` を渡さない限り拒否されます。

これらの map にエントリを追加する場合は `--merge` を使用します:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

指定した値を完全な対象値にしたい場合にのみ `--replace` を使用してください。

## `config set` モード

`openclaw config set` は 4 つの代入スタイルをサポートします:

1. 値モード: `openclaw config set <path> <value>`
2. SecretRef ビルダーモード:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. プロバイダービルダーモード（`secrets.providers.<alias>` パスのみ）:

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

ポリシーに関する注意:

- SecretRef の代入は、サポートされていないランタイム可変サーフェス（たとえば `hooks.token`、`commands.ownerDisplaySecret`、Discord の thread-binding webhook token、WhatsApp creds JSON）では拒否されます。[SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface) を参照してください。

バッチ解析では、常にバッチペイロード（`--batch-json`/`--batch-file`）を唯一の正とします。  
`--strict-json` / `--json` はバッチ解析の動作を変更しません。

JSON パス/値モードは、SecretRef とプロバイダーの両方で引き続きサポートされます:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## プロバイダービルダーフラグ

プロバイダービルダーの対象パスには `secrets.providers.<alias>` を使用する必要があります。

共通フラグ:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`（`file`、`exec`）

Env プロバイダー（`--provider-source env`）:

- `--provider-allowlist <ENV_VAR>`（繰り返し指定可）

File プロバイダー（`--provider-source file`）:

- `--provider-path <path>`（必須）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec プロバイダー（`--provider-source exec`）:

- `--provider-command <path>`（必須）
- `--provider-arg <arg>`（繰り返し指定可）
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>`（繰り返し指定可）
- `--provider-pass-env <ENV_VAR>`（繰り返し指定可）
- `--provider-trusted-dir <path>`（繰り返し指定可）
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

ハードニングされた exec プロバイダーの例:

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

- ビルダーモード: 変更された ref/provider に対して SecretRef の解決可能性チェックを実行します。
- JSON モード（`--strict-json`、`--json`、またはバッチモード）: スキーマ検証に加えて SecretRef の解決可能性チェックを実行します。
- ポリシー検証も、既知の未対応 SecretRef 対象サーフェスに対して実行されます。
- ポリシーチェックは変更後の完全な設定を評価するため、親オブジェクト書き込み（たとえば `hooks` をオブジェクトとして設定するなど）で未対応サーフェス検証を回避することはできません。
- ドライラン中、exec SecretRef チェックはコマンド副作用を避けるためデフォルトでスキップされます。
- exec SecretRef チェックを有効にするには、`--dry-run` とともに `--allow-exec` を使用します（これによりプロバイダーコマンドが実行される場合があります）。
- `--allow-exec` はドライラン専用であり、`--dry-run` なしで使用するとエラーになります。

`--dry-run --json` は機械可読なレポートを出力します:

- `ok`: ドライランが成功したか
- `operations`: 評価された代入の数
- `checks`: スキーマ/解決可能性チェックが実行されたか
- `checks.resolvabilityComplete`: 解決可能性チェックが最後まで実行されたか（exec ref がスキップされた場合は false）
- `refsChecked`: ドライラン中に実際に解決された ref の数
- `skippedExecRefs`: `--allow-exec` が設定されていないためにスキップされた exec ref の数
- `errors`: `ok=false` の場合の構造化されたスキーマ/解決可能性エラー

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
      ref?: string, // 解決可能性エラーの場合に存在
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

- `config schema validation failed`: 変更後の設定形状が無効です。パス/値、または provider/ref オブジェクト形状を修正してください。
- `Config policy validation failed: unsupported SecretRef usage`: その認証情報は平文/文字列入力に戻し、SecretRef はサポートされているサーフェスでのみ使用してください。
- `SecretRef assignment(s) could not be resolved`: 参照された provider/ref を現在解決できません（不足している env var、無効な file pointer、exec provider の失敗、または provider/source の不一致）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: ドライランで exec ref がスキップされました。exec の解決可能性検証が必要な場合は `--allow-exec` を付けて再実行してください。
- バッチモードでは、失敗したエントリを修正してから書き込む前に再度 `--dry-run` を実行してください。

## 書き込みの安全性

`openclaw config set` およびその他の OpenClaw 管理下の設定ライターは、変更後の完全な設定を
ディスクへコミットする前に検証します。新しいペイロードがスキーマ検証に失敗するか、
破壊的な上書きに見える場合、アクティブな設定はそのまま保持され、
拒否されたペイロードはその横に `openclaw.json.rejected.*` として保存されます。
アクティブな設定パスは通常ファイルである必要があります。シンボリックリンクされた `openclaw.json`
構成では書き込みはサポートされません。代わりに `OPENCLAW_CONFIG_PATH` を使って
実ファイルを直接指してください。

小さな編集には CLI 書き込みを推奨します:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

書き込みが拒否された場合は、保存されたペイロードを確認し、完全な設定形状を修正してください:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

直接エディターでの書き込みも引き続き可能ですが、実行中の Gateway は、
それらが検証に通るまで未信頼として扱います。無効な直接編集は、起動時またはホットリロード時に
last-known-good バックアップから復元されることがあります。詳しくは
[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config) を参照してください。

ファイル全体の復旧は、設定全体が壊れている場合に限定されます。たとえば、解析
エラー、ルートレベルのスキーマ失敗、レガシー移行失敗、または Plugin とルートの
混在した失敗などです。`plugins.entries.<id>...` 配下でのみ検証に失敗した場合、
OpenClaw はアクティブな `openclaw.json` をそのまま維持し、`.last-good` を復元する代わりに
Plugin ローカルの問題を報告します。これにより、Plugin スキーマ変更や
`minHostVersion` の不整合によって、models、
providers、auth profiles、channels、gateway exposure、tools、memory、browser、または
cron config などの無関係なユーザー設定がロールバックされるのを防ぎます。

## サブコマンド

- `config file`: アクティブな設定ファイルパスを表示します（`OPENCLAW_CONFIG_PATH` またはデフォルト場所から解決）。このパスはシンボリックリンクではなく、通常ファイルを指している必要があります。

編集後は gateway を再起動してください。

## 検証

gateway を起動せずに、現在の設定をアクティブなスキーマに対して検証します。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` が成功するようになったら、ローカル TUI を使って
埋め込みエージェントに、現在の設定をドキュメントと比較させながら、同じターミナルで
各変更を検証できます。

すでに検証が失敗している場合は、`openclaw configure` または
`openclaw doctor --fix` から始めてください。`openclaw chat` は無効な設定ガードを
バイパスしません。

```bash
openclaw chat
```

その後、TUI 内で:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型的な修復ループ:

- エージェントに、現在の設定を関連するドキュメントページと比較し、最小限の修正を提案するよう依頼する。
- `openclaw config set` または `openclaw configure` で対象を絞った編集を適用する。
- 変更ごとに `openclaw config validate` を再実行する。
- 検証は成功してもランタイムがまだ健全でない場合は、移行と修復の支援のために `openclaw doctor` または `openclaw doctor --fix` を実行する。

## 関連

- [CLI reference](/ja-JP/cli)
- [Configuration](/ja-JP/gateway/configuration)
