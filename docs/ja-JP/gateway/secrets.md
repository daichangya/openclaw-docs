---
read_when:
    - プロバイダー認証情報および `auth-profiles.json` 参照向けにSecretRefを設定するとき
    - 本番環境でsecrets reload、audit、configure、applyを安全に運用するとき
    - 起動時のフェイルファスト、非アクティブサーフェスのフィルタリング、last-known-good動作を理解するとき
summary: 'Secrets管理: SecretRef契約、ランタイムスナップショット動作、安全な一方向スクラビング'
title: Secrets管理
x-i18n:
    generated_at: "2026-04-05T12:46:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# Secrets管理

OpenClawは加算的なSecretRefをサポートしており、サポート対象の認証情報を設定内にプレーンテキストとして保存せずに済みます。

プレーンテキストも引き続き使用できます。SecretRefは認証情報ごとのオプトインです。

## 目標とランタイムモデル

Secretsはインメモリのランタイムスナップショットへ解決されます。

- 解決はリクエストパス上で遅延実行されるのではなく、アクティベーション中に即時実行されます。
- 実質的にアクティブなSecretRefが解決できない場合、起動は即座に失敗します。
- reloadはアトミックスワップを使用します。つまり、完全成功するか、last-known-goodスナップショットを保持します。
- SecretRefポリシー違反（たとえばOAuthモードのauth profileとSecretRef入力の組み合わせ）は、ランタイムスワップ前にアクティベーションを失敗させます。
- ランタイムリクエストは、アクティブなインメモリスナップショットのみを読み取ります。
- 最初に設定のアクティベーション/読み込みが成功した後、ランタイムコードパスは、正常なreloadでスワップされるまでそのアクティブなインメモリスナップショットを読み続けます。
- 送信配信パスもそのアクティブスナップショットから読み取ります（たとえばDiscordのreply/thread配信やTelegramのaction send）。送信ごとにSecretRefを再解決することはありません。

これにより、シークレットプロバイダーの障害がホットなリクエストパスに乗らないようにします。

## アクティブサーフェスのフィルタリング

SecretRefは、実質的にアクティブなサーフェス上でのみ検証されます。

- 有効なサーフェス: 未解決の参照は起動/reloadをブロックします。
- 非アクティブなサーフェス: 未解決の参照は起動/reloadをブロックしません。
- 非アクティブな参照は、コード `SECRETS_REF_IGNORED_INACTIVE_SURFACE` を持つ非致命的診断を出します。

非アクティブサーフェスの例:

- 無効化されたチャネル/アカウント項目。
- 有効なアカウントが継承しないトップレベルのチャネル認証情報。
- 無効化されたtool/featureサーフェス。
- `tools.web.search.provider` で選択されていないWeb searchプロバイダー固有キー。
  autoモード（provider未設定）では、1つ解決されるまで、プロバイダー自動検出の優先順位に従ってキーが参照されます。
  選択後、選択されなかったプロバイダーキーは選択されるまで非アクティブとして扱われます。
- Sandbox SSH認証素材（`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`、およびagentごとの上書き）は、
  デフォルトagentまたは有効なagentに対して有効なsandbox backendが `ssh` のときのみアクティブです。
- `gateway.remote.token` / `gateway.remote.password` SecretRefは、次のいずれかが真であればアクティブです:
  - `gateway.mode=remote`
  - `gateway.remote.url` が設定されている
  - `gateway.tailscale.mode` が `serve` または `funnel`
  - それらのリモートサーフェスがないローカルモードでは:
    - `gateway.remote.token` は、token認証が勝ち得て、かつenv/auth tokenが設定されていない場合にアクティブです。
    - `gateway.remote.password` は、password認証が勝ち得て、かつenv/auth passwordが設定されていない場合にのみアクティブです。
- `gateway.auth.token` SecretRefは、`OPENCLAW_GATEWAY_TOKEN` が設定されている場合、起動時の認証解決に対しては非アクティブです。これは、そのランタイムではenv token入力が優先されるためです。

## Gateway認証サーフェス診断

`gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token`, または `gateway.remote.password` にSecretRefが設定されている場合、
gatewayの起動/reloadはそのサーフェス状態を明示的にログ出力します。

- `active`: SecretRefは有効な認証サーフェスの一部であり、解決される必要があります。
- `inactive`: このランタイムでは、別の認証サーフェスが優先されるか、
  またはリモート認証が無効/非アクティブのため、SecretRefは無視されます。

これらの項目は `SECRETS_GATEWAY_AUTH_SURFACE` として記録され、アクティブサーフェスポリシーで使われた理由を含むため、その認証情報がなぜアクティブまたは非アクティブとして扱われたのかを確認できます。

## オンボーディング参照の事前確認

オンボーディングが対話モードで実行され、SecretRef保存を選択した場合、OpenClawは保存前に事前確認の検証を実行します。

- Env参照: env var名を検証し、セットアップ中に空でない値が見えていることを確認します。
- Provider参照（`file` または `exec`）: provider選択を検証し、`id` を解決し、解決された値の型を確認します。
- クイックスタート再利用パス: `gateway.auth.token` がすでにSecretRefである場合、オンボーディングはprobe/dashboard bootstrap前にそれを解決します（`env`, `file`, `exec` 参照に対して）。同じフェイルファストゲートを使用します。

検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。

## SecretRef契約

どこでも同じオブジェクト形状を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は `^[A-Z][A-Z0-9_]{0,127}$` に一致する必要があります

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は絶対JSONポインタ（`/...`）である必要があります
- セグメント内のRFC6901エスケープ: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` に一致する必要があります
- `id` はスラッシュ区切りのパスセグメントとして `.` または `..` を含んではいけません（たとえば `a/../b` は拒否されます）

## Provider設定

providerは `secrets.providers` 配下に定義します。

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // または "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env provider

- 任意で `allowlist` による許可リストを設定できます。
- 欠落している/空のenv値は解決失敗になります。

### File provider

- `path` からローカルファイルを読み取ります。
- `mode: "json"` はJSONオブジェクトのペイロードを想定し、ポインタとして `id` を解決します。
- `mode: "singleValue"` は参照idとして `"value"` を想定し、ファイル内容を返します。
- パスは所有権/権限チェックを通過する必要があります。
- Windows fail-closed注: パスのACL検証が利用できない場合、解決は失敗します。信頼できるパスに対してのみ、そのproviderで `allowInsecurePath: true` を設定してパスセキュリティチェックをバイパスしてください。

### Exec provider

- 設定された絶対バイナリパスを、シェルなしで実行します。
- デフォルトでは、`command` は通常ファイルを指している必要があります（シンボリックリンク不可）。
- シンボリックリンクのcommandパス（たとえばHomebrewのshim）を許可するには `allowSymlinkCommand: true` を設定します。OpenClawは解決後のターゲットパスを検証します。
- package managerのパスに対しては、`allowSymlinkCommand` を `trustedDirs` と組み合わせて使用してください（たとえば `["/opt/homebrew"]`）。
- timeout、no-output timeout、出力バイト数制限、env許可リスト、trusted dirsをサポートします。
- Windows fail-closed注: commandパスのACL検証が利用できない場合、解決は失敗します。信頼できるパスに対してのみ、そのproviderで `allowInsecurePath: true` を設定してパスセキュリティチェックをバイパスしてください。

リクエストペイロード（stdin）:

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

レスポンスペイロード（stdout）:

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

任意のIDごとのエラー:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec統合の例

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrewのシンボリックリンクされたバイナリには必須
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // Homebrewのシンボリックリンクされたバイナリには必須
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // Homebrewのシンボリックリンクされたバイナリには必須
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## MCP server環境変数

`plugins.entries.acpx.config.mcpServers` 経由で設定されるMCP server env varsはSecretInputをサポートします。これにより、APIキーやトークンをプレーンテキスト設定から排除できます。

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

プレーンテキスト文字列値も引き続き使えます。`${MCP_SERVER_API_KEY}` のようなenv-template参照とSecretRefオブジェクトは、MCP serverプロセスが起動される前のgatewayアクティベーション中に解決されます。他のSecretRefサーフェスと同様に、未解決の参照がアクティベーションをブロックするのは、`acpx` pluginが実質的にアクティブな場合のみです。

## Sandbox SSH認証素材

コアの `ssh` sandbox backendも、SSH認証素材に対するSecretRefをサポートします。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

ランタイム動作:

- OpenClawは、各SSH呼び出し中に遅延実行するのではなく、sandboxアクティベーション中にこれらの参照を解決します。
- 解決された値は、制限的な権限で一時ファイルに書き込まれ、生成されたSSH設定で使用されます。
- 有効なsandbox backendが `ssh` でない場合、これらの参照は非アクティブのままであり、起動をブロックしません。

## サポートされる認証情報サーフェス

正規のサポート対象/非対象の認証情報は次に一覧があります。

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

ランタイムで生成される認証情報、ローテーションする認証情報、OAuth refresh素材は、読み取り専用のSecretRef解決から意図的に除外されています。

## 必須動作と優先順位

- 参照なしのフィールド: 変更なし。
- 参照ありのフィールド: アクティブサーフェス上では、アクティベーション中に必須です。
- プレーンテキストと参照の両方が存在する場合、サポートされた優先パスでは参照が優先されます。
- 秘匿化用のセンチネル `__OPENCLAW_REDACTED__` は内部の設定秘匿化/復元用に予約されており、リテラルな送信済み設定データとしては拒否されます。

警告および監査シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（ランタイム警告）
- `REF_SHADOWED`（`auth-profiles.json` の認証情報が `openclaw.json` の参照より優先される場合の監査検出）

Google Chat互換動作:

- `serviceAccountRef` はプレーンテキストの `serviceAccount` より優先されます。
- 兄弟参照が設定されている場合、プレーンテキスト値は無視されます。

## アクティベーショントリガー

Secretアクティベーションは次で実行されます。

- 起動時（事前確認および最終アクティベーション）
- Config reloadのhot-applyパス
- Config reloadのrestart-checkパス
- `secrets.reload` による手動reload
- Gateway config write RPCの事前確認（`config.set` / `config.apply` / `config.patch`）。編集を永続化する前に、送信されたconfigペイロード内のアクティブサーフェスSecretRefの解決可能性を確認します

アクティベーション契約:

- 成功するとスナップショットがアトミックにスワップされます。
- 起動時失敗はgateway起動を中止します。
- ランタイムreload失敗時はlast-known-goodスナップショットを保持します。
- Write-RPC事前確認失敗時は送信されたconfigを拒否し、ディスク上のconfigとアクティブなランタイムスナップショットの両方を変更しません。
- 送信ヘルパー/tool呼び出しに明示的な呼び出し単位チャネルトークンを渡しても、SecretRefアクティベーションはトリガーされません。アクティベーションポイントは、起動、reload、明示的な `secrets.reload` のままです。

## 劣化および復旧シグナル

健全な状態の後でreload時アクティベーションが失敗すると、OpenClawはdegraded secrets状態に入ります。

ワンショットのsystem eventとログコード:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- 劣化時: ランタイムはlast-known-goodスナップショットを保持します。
- 復旧時: 次回のアクティベーション成功後に1回だけ出力されます。
- すでに劣化状態の間の繰り返し失敗は警告として記録されますが、eventはスパムしません。
- 起動時フェイルファストでは、ランタイムが一度もアクティブになっていないため、degraded eventは出力されません。

## コマンドパス解決

コマンドパスは、gateway snapshot RPCを介してサポート対象のSecretRef解決にオプトインできます。

大きく分けて2つの動作があります。

- 厳格なコマンドパス（たとえば `openclaw memory` のremote-memoryパスや、リモート共有シークレット参照が必要なときの `openclaw qr --remote`）は、アクティブスナップショットから読み取り、必要なSecretRefが利用できない場合は即座に失敗します。
- 読み取り専用コマンドパス（たとえば `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`、および読み取り専用のdoctor/config repairフロー）もアクティブスナップショットを優先しますが、そのコマンドパスで対象のSecretRefが利用できない場合は中止せず劣化動作します。

読み取り専用動作:

- Gatewayが動作中の場合、これらのコマンドはまずアクティブスナップショットから読み取ります。
- Gateway解決が不完全であるか、Gatewayが利用できない場合、それらはその特定コマンドサーフェス向けに対象限定のローカルフォールバックを試みます。
- それでも対象のSecretRefが利用できない場合、コマンドは「設定されているがこのコマンドパスでは利用できない」のような明示的診断を伴う劣化した読み取り専用出力で継続します。
- この劣化動作はコマンドローカルに限られます。ランタイム起動、reload、send/authパスを弱めるものではありません。

その他の注:

- バックエンドsecretローテーション後のスナップショット更新は `openclaw secrets reload` で処理されます。
- これらのコマンドパスで使用されるGateway RPCメソッド: `secrets.resolve`。

## 監査と設定ワークフロー

デフォルトのoperatorフロー:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

検出項目には次が含まれます。

- 保存時のプレーンテキスト値（`openclaw.json`, `auth-profiles.json`, `.env`, および生成された `agents/*/agent/models.json`）
- 生成された `models.json` 項目内の、プレーンテキストの機密provider header残留物
- 未解決の参照
- 優先順位によるシャドーイング（`auth-profiles.json` が `openclaw.json` 参照より優先される）
- レガシー残留物（`auth.json`, OAuth reminders）

Exec注:

- デフォルトでは、auditはコマンド副作用を避けるためにexec SecretRefの解決可能性チェックをスキップします。
- audit中にexec providerを実行するには `openclaw secrets audit --allow-exec` を使用してください。

Header残留物に関する注:

- 機密provider headerの検出は名前ヒューリスティックに基づきます（一般的な認証/認証情報header名および `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` などの断片）。

### `secrets configure`

対話型ヘルパーで、次を行います。

- まず `secrets.providers` を設定する（`env`/`file`/`exec`, 追加/編集/削除）
- `openclaw.json` 内のサポート対象のsecret保持フィールドと、1つのagentスコープ向けの `auth-profiles.json` を選択できるようにする
- 対象ピッカー内で新しい `auth-profiles.json` マッピングを直接作成できる
- SecretRefの詳細（`source`, `provider`, `id`）を取得する
- 事前確認の解決を実行する
- 即時適用できる

Exec注:

- 事前確認では、`--allow-exec` が設定されていない限りexec SecretRefチェックをスキップします。
- `configure --apply` から直接適用し、planにexec refs/providersが含まれる場合は、applyステップでも `--allow-exec` を設定したままにしてください。

便利なモード:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` のapplyデフォルト:

- 対象providerに対して、一致する静的認証情報を `auth-profiles.json` からスクラブする
- レガシーの静的 `api_key` 項目を `auth.json` からスクラブする
- 一致する既知のsecret行を `<config-dir>/.env` からスクラブする

### `secrets apply`

保存済みplanを適用します。

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Exec注:

- dry-runは、`--allow-exec` が設定されていない限りexecチェックをスキップします。
- writeモードは、`--allow-exec` が設定されていない限り、exec SecretRef/providerを含むplanを拒否します。

厳格なターゲット/パス契約の詳細と正確な拒否ルールについては、次を参照してください。

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

## 一方向の安全ポリシー

OpenClawは、履歴上のプレーンテキストsecret値を含むロールバックバックアップを意図的に書き込みません。

安全モデル:

- writeモード前に事前確認が成功している必要があります
- コミット前にランタイムアクティベーションが検証されます
- applyはアトミックなファイル置換と、失敗時のベストエフォート復元を使ってファイルを更新します

## レガシー認証互換性に関する注

静的認証情報について、ランタイムはもはやプレーンテキストのレガシー認証保存に依存しません。

- ランタイム認証情報ソースは、解決済みインメモリスナップショットです。
- レガシーの静的 `api_key` 項目は、発見時にスクラブされます。
- OAuth関連の互換動作は引き続き別扱いです。

## Web UIに関する注

一部のSecretInput unionは、フォームモードよりraw editorモードの方が設定しやすい場合があります。

## 関連ドキュメント

- CLIコマンド: [secrets](/cli/secrets)
- Plan契約の詳細: [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)
- 認証情報サーフェス: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- 認証設定: [Authentication](/gateway/authentication)
- セキュリティ姿勢: [Security](/gateway/security)
- 環境変数の優先順位: [Environment Variables](/help/environment)
