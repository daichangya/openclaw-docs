---
read_when:
    - 実行時に secret ref を再解決する場合
    - 平文の残留物と未解決の ref を監査する場合
    - SecretRef を設定し、一方向のスクラブ変更を適用する場合
summary: '`openclaw secrets` のCLIリファレンス（reload、audit、configure、apply）'
title: secrets
x-i18n:
    generated_at: "2026-04-05T12:40:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

`openclaw secrets` を使用して SecretRef を管理し、アクティブな実行時スナップショットを健全な状態に保ちます。

コマンドの役割:

- `reload`: ref を再解決し、完全に成功した場合にのみ実行時スナップショットを切り替える Gateway RPC（`secrets.reload`）（config の書き込みは行いません）。
- `audit`: 平文、未解決の ref、優先順位のずれについて、設定 / auth / 生成済みモデルストアとレガシーの残留物を読み取り専用でスキャンします（`--allow-exec` が設定されていない限り、exec ref はスキップされます）。
- `configure`: プロバイダー設定、ターゲットマッピング、事前チェックのための対話型プランナーです（TTY が必要です）。
- `apply`: 保存済みプランを実行します（`--dry-run` は検証専用です。dry-run はデフォルトで exec チェックをスキップし、書き込みモードでは `--allow-exec` が設定されていない限り exec を含むプランを拒否します）。その後、対象の平文の残留物をスクラブします。

推奨される運用ループ:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

プランに `exec` SecretRef / プロバイダーが含まれている場合は、dry-run と書き込み apply の両方のコマンドで `--allow-exec` を渡してください。

CI / ゲート向けの終了コードに関する注意:

- `audit --check` は検出事項があると `1` を返します。
- 未解決の ref は `2` を返します。

関連:

- Secrets ガイド: [Secrets Management](/gateway/secrets)
- 認証情報サーフェス: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- セキュリティガイド: [Security](/gateway/security)

## 実行時スナップショットを再読み込みする

secret ref を再解決し、実行時スナップショットをアトミックに切り替えます。

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

注意:

- Gateway RPC メソッド `secrets.reload` を使用します。
- 解決に失敗した場合、Gateway は最後に正常だったスナップショットを維持し、エラーを返します（部分的な有効化は行われません）。
- JSON レスポンスには `warningCount` が含まれます。

オプション:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## 監査

OpenClaw の状態をスキャンして以下を検出します:

- 平文のシークレット保存
- 未解決の ref
- 優先順位のずれ（`auth-profiles.json` の認証情報が `openclaw.json` の ref を覆い隠している状態）
- 生成された `agents/*/agent/models.json` の残留物（プロバイダーの `apiKey` 値と機密性のあるプロバイダーヘッダー）
- レガシーの残留物（レガシー auth ストアのエントリー、OAuth リマインダー）

ヘッダー残留物に関する注意:

- 機密性のあるプロバイダーヘッダーの検出は名前ヒューリスティックに基づいています（一般的な auth / credential ヘッダー名および `authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` などの断片）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

終了時の動作:

- `--check` は検出事項があると非ゼロで終了します。
- 未解決の ref は、より優先度の高い非ゼロコードで終了します。

レポート形式の主な項目:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- 検出コード:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure（対話型ヘルパー）

プロバイダーと SecretRef の変更を対話的に構築し、事前チェックを実行し、必要に応じて適用します:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

フロー:

- 最初にプロバイダー設定（`secrets.providers` エイリアスの `add/edit/remove`）。
- 次に認証情報マッピング（フィールドを選択し、`{source, provider, id}` ref を割り当てます）。
- 最後に事前チェックと任意の apply。

フラグ:

- `--providers-only`: `secrets.providers` のみを設定し、認証情報マッピングをスキップします。
- `--skip-provider-setup`: プロバイダー設定をスキップし、認証情報を既存のプロバイダーにマッピングします。
- `--agent <id>`: `auth-profiles.json` のターゲット検出と書き込みのスコープを 1 つのエージェントストアに限定します。
- `--allow-exec`: 事前チェック / apply 中に exec SecretRef チェックを許可します（プロバイダーコマンドを実行する場合があります）。

注意:

- 対話型 TTY が必要です。
- `--providers-only` と `--skip-provider-setup` は組み合わせられません。
- `configure` は、`openclaw.json` 内のシークレットを保持するフィールドと、選択したエージェントスコープの `auth-profiles.json` を対象にします。
- `configure` は、picker フロー内で新しい `auth-profiles.json` マッピングを直接作成することをサポートしています。
- 正式にサポートされる対象サーフェス: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- apply の前に事前解決を実行します。
- 事前チェック / apply に exec ref が含まれる場合は、両方のステップで `--allow-exec` を設定したままにしてください。
- 生成されるプランでは、スクラブオプション（`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` がすべて有効）がデフォルトです。
- スクラブされた平文の値に対して、apply パスは一方向です。
- `--apply` を付けない場合でも、事前チェック後に CLI は `Apply this plan now?` と確認します。
- `--apply` を付けた場合（かつ `--yes` なし）、CLI は取り消し不能な追加確認を表示します。
- `--json` はプランと事前チェックレポートを出力しますが、このコマンドには依然として対話型 TTY が必要です。

exec プロバイダーの安全性に関する注意:

- Homebrew のインストールでは、`/opt/homebrew/bin/*` 配下にシンボリックリンクされたバイナリが公開されることがよくあります。
- `allowSymlinkCommand: true` は、信頼できるパッケージマネージャーのパスで必要な場合にのみ設定し、`trustedDirs`（例: `["/opt/homebrew"]`）と組み合わせてください。
- Windows では、プロバイダーパスの ACL 検証が利用できない場合、OpenClaw は安全側に倒して失敗します。信頼できるパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定すると、パスのセキュリティチェックをバイパスできます。

## 保存済みプランを適用する

以前に生成されたプランを適用または事前チェックします:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

exec の動作:

- `--dry-run` はファイルを書き込まずに事前チェックを検証します。
- dry-run では、exec SecretRef チェックはデフォルトでスキップされます。
- 書き込みモードでは、`--allow-exec` が設定されていない限り、exec SecretRef / プロバイダーを含むプランを拒否します。
- どちらのモードでも、exec プロバイダーチェック / 実行を有効にするには `--allow-exec` を使用します。

プラン契約の詳細（許可されるターゲットパス、検証ルール、失敗時のセマンティクス）:

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

`apply` が更新する可能性のあるもの:

- `openclaw.json`（SecretRef ターゲット + プロバイダーの upsert / delete）
- `auth-profiles.json`（プロバイダーターゲットのスクラブ）
- レガシー `auth.json` の残留物
- 値が移行された `~/.openclaw/.env` の既知のシークレットキー

## ロールバック用バックアップがない理由

`secrets apply` は、古い平文の値を含むロールバック用バックアップを意図的に書き込みません。

安全性は、厳密な事前チェックと、失敗時のベストエフォートなインメモリ復元を伴う、ほぼアトミックな apply によって確保されます。

## 例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check` がまだ平文の検出事項を報告する場合は、残っている報告済みターゲットパスを更新し、再度 audit を実行してください。
