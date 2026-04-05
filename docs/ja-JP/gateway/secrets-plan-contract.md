---
read_when:
    - '`openclaw secrets apply`プランを生成またはレビューする場合'
    - '`Invalid plan target path`エラーをデバッグする場合'
    - ターゲット種別とパス検証の動作を理解する場合
summary: '`secrets apply`プランの契約: ターゲット検証、パスマッチング、および`auth-profiles.json`ターゲットスコープ'
title: Secrets Apply Plan Contract
x-i18n:
    generated_at: "2026-04-05T12:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Secrets apply plan contract

このページでは、`openclaw secrets apply`によって強制される厳格な契約を定義します。

ターゲットがこれらのルールに一致しない場合、設定を変更する前にapplyは失敗します。

## プランファイルの形状

`openclaw secrets apply --from <plan.json>`は、プランターゲットの`targets`配列を想定します:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## サポートされるターゲットスコープ

プランターゲットは、次に含まれるサポート対象の認証情報パスに対して受け付けられます:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

## ターゲット種別の動作

一般ルール:

- `target.type`は認識される必要があり、正規化された`target.path`の形状と一致している必要があります。

既存プランとの互換性エイリアスは引き続き受け付けられます:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## パス検証ルール

各ターゲットは、次のすべてに対して検証されます:

- `type`は認識されるターゲット種別である必要があります。
- `path`は空でないドットパスである必要があります。
- `pathSegments`は省略できます。指定する場合、`path`と完全に同じパスに正規化される必要があります。
- 禁止セグメントは拒否されます: `__proto__`、`prototype`、`constructor`。
- 正規化されたパスは、そのターゲット種別に登録されたパス形状と一致する必要があります。
- `providerId`または`accountId`が設定されている場合、パスにエンコードされたidと一致する必要があります。
- `auth-profiles.json`ターゲットには`agentId`が必要です。
- 新しい`auth-profiles.json`マッピングを作成する場合は、`authProfileProvider`を含めてください。

## 失敗時の動作

ターゲットが検証に失敗した場合、applyは次のようなエラーで終了します:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無効なプランに対して書き込みは一切確定されません。

## Execプロバイダー同意の動作

- `--dry-run`は、デフォルトでexec SecretRefチェックをスキップします。
- exec SecretRefs/providersを含むプランは、`--allow-exec`が設定されていない限り、書き込みモードでは拒否されます。
- execを含むプランを検証/適用する場合は、dry-runと書き込みコマンドの両方で`--allow-exec`を渡してください。

## ランタイムおよび監査スコープに関する注記

- refのみの`auth-profiles.json`エントリ（`keyRef`/`tokenRef`）は、ランタイム解決と監査対象に含まれます。
- `secrets apply`は、サポートされる`openclaw.json`ターゲット、サポートされる`auth-profiles.json`ターゲット、および任意のスクラブターゲットを書き込みます。

## オペレーターチェック

```bash
# 書き込みなしでプランを検証
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# その後、実際に適用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# execを含むプランでは、両モードで明示的にオプトイン
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

無効なターゲットパスメッセージでapplyが失敗した場合は、`openclaw secrets configure`でプランを再生成するか、上記のサポートされる形状にターゲットパスを修正してください。

## 関連ドキュメント

- [Secrets Management](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/reference/secretref-credential-surface)
- [設定リファレンス](/gateway/configuration-reference)
