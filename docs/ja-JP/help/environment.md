---
read_when:
    - どのenv varが読み込まれ、どの順序になるかを知る必要がある場合
    - Gatewayで不足しているAPIキーをデバッグしている場合
    - プロバイダー認証またはデプロイ環境を文書化している場合
summary: OpenClawが環境変数をどこから読み込み、どの順序で優先するか
title: 環境変数
x-i18n:
    generated_at: "2026-04-05T12:46:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# 環境変数

OpenClawは複数のソースから環境変数を取得します。ルールは**既存の値を決して上書きしない**ことです。

## 優先順位（高 → 低）

1. **プロセス環境**（親シェル/デーモンからGatewayプロセスがすでに持っているもの）。
2. **現在の作業ディレクトリ内の `.env`**（dotenvのデフォルト。上書きしません）。
3. **グローバル `.env`**（`~/.openclaw/.env`。別名 `$OPENCLAW_STATE_DIR/.env`。上書きしません）。
4. **`~/.openclaw/openclaw.json` 内の設定 `env` ブロック**（不足している場合にのみ適用）。
5. **任意のlogin shellインポート**（`env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1`）。想定されるキーが不足している場合にのみ適用されます。

デフォルトのstate dirを使うUbuntuの新規インストールでは、OpenClawはグローバル `.env` の後に `~/.config/openclaw/gateway.env` も互換性のためのフォールバックとして扱います。両方のファイルが存在し、内容が食い違う場合、OpenClawは `~/.openclaw/.env` を維持し、警告を表示します。

設定ファイル自体が存在しない場合、ステップ4はスキップされます。shell importは有効であれば引き続き実行されます。

## 設定 `env` ブロック

インラインenv varを設定する等価な2つの方法があります（どちらも上書きしません）:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Shell envインポート

`env.shellEnv` はlogin shellを実行し、想定されるキーのうち**不足しているものだけ**を取り込みます:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

対応するenv var:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## ランタイムで注入されるenv var

OpenClawは、生成された子プロセスにコンテキストマーカーも注入します:

- `OPENCLAW_SHELL=exec`: `exec` ツール経由で実行されるコマンドに設定されます。
- `OPENCLAW_SHELL=acp`: ACPランタイムバックエンドのプロセス起動時（たとえば `acpx`）に設定されます。
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client` がACP bridgeプロセスを起動するときに設定されます。
- `OPENCLAW_SHELL=tui-local`: ローカルTUIの `!` シェルコマンドに設定されます。

これらはランタイムマーカーであり（必要なユーザー設定ではありません）、コンテキスト固有のルールを適用するためにシェル/プロファイルロジックで利用できます。

## UI env var

- `OPENCLAW_THEME=light`: 端末の背景が明るい場合に、明るいTUIパレットを強制します。
- `OPENCLAW_THEME=dark`: 暗いTUIパレットを強制します。
- `COLORFGBG`: 端末がこれを出力する場合、OpenClawは背景色のヒントを使ってTUIパレットを自動選択します。

## 設定内のenv var置換

設定文字列の値では、`${VAR_NAME}` 構文を使ってenv varを直接参照できます:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

詳細は [Configuration: Env var substitution](/gateway/configuration-reference#env-var-substitution) を参照してください。

## Secret refと `${ENV}` 文字列

OpenClawは2つのenv駆動パターンをサポートします:

- 設定値内の `${VAR}` 文字列置換。
- secrets参照をサポートするフィールド向けの SecretRef オブジェクト（`{ source: "env", provider: "default", id: "VAR" }`）。

どちらも有効化時にプロセスenvから解決されます。SecretRefの詳細は [Secrets Management](/gateway/secrets) に記載されています。

## パス関連のenv var

| Variable               | 用途                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | すべての内部パス解決（`~/.openclaw/`、agentディレクトリ、session、credentials）で使用するホームディレクトリを上書きします。OpenClawを専用サービスユーザーとして実行する場合に便利です。 |
| `OPENCLAW_STATE_DIR`   | state directoryを上書きします（デフォルト: `~/.openclaw`）。                                                                                                                 |
| `OPENCLAW_CONFIG_PATH` | 設定ファイルパスを上書きします（デフォルト: `~/.openclaw/openclaw.json`）。                                                                                                   |

## ログ

| Variable             | 用途                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | ファイルとコンソールの両方のログレベルを上書きします（例: `debug`、`trace`）。設定内の `logging.level` および `logging.consoleLevel` より優先されます。無効な値は警告付きで無視されます。 |

### `OPENCLAW_HOME`

設定されている場合、`OPENCLAW_HOME` はすべての内部パス解決でシステムのホームディレクトリ（`$HOME` / `os.homedir()`）を置き換えます。これにより、ヘッドレスサービスアカウント向けに完全なファイルシステム分離が可能になります。

**優先順位:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**例**（macOS LaunchDaemon）:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` はチルダ付きパス（例: `~/svc`）にも設定でき、その場合は使用前に `$HOME` を使って展開されます。

## nvmユーザー: web_fetchのTLS失敗

Node.jsが**nvm**経由でインストールされている場合（システムパッケージマネージャーではない場合）、組み込みの `fetch()` は
nvmに同梱されたCAストアを使用しますが、そこには最新のルートCA（Let's EncryptのISRG Root X1/X2、
DigiCert Global Root G2など）が含まれていないことがあります。そのため、`web_fetch` はほとんどのHTTPSサイトで `"fetch failed"` として失敗します。

Linuxでは、OpenClawはnvmを自動検出し、実際の起動環境で修正を適用します:

- `openclaw gateway install` はsystemdサービス環境に `NODE_EXTRA_CA_CERTS` を書き込みます
- `openclaw` CLIエントリーポイントは、Node起動前に `NODE_EXTRA_CA_CERTS` を設定して自分自身を再実行します

**手動修正**（古いバージョンや直接の `node ...` 起動向け）:

OpenClawを起動する前に変数をexportしてください:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

この変数については、`~/.openclaw/.env` にだけ書くことに頼らないでください。Nodeは
`NODE_EXTRA_CA_CERTS` をプロセス起動時に読み込みます。

## 関連

- [Gateway configuration](/gateway/configuration)
- [FAQ: env vars and .env loading](/help/faq#env-vars-and-env-loading)
- [Models overview](/concepts/models)
