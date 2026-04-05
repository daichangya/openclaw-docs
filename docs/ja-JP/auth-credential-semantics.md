---
read_when:
    - 認証プロファイルの解決や認証情報ルーティングに取り組んでいるとき
    - モデル認証の失敗やプロファイル順序をデバッグしているとき
summary: 認証プロファイルにおける認証情報の適格性と解決セマンティクスの正規仕様
title: 認証情報の認証セマンティクス
x-i18n:
    generated_at: "2026-04-05T12:34:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd3e16cd25eb22c5e707311d06a19df1a59747ee3261c2d32c534a245fd7fb
    source_path: auth-credential-semantics.md
    workflow: 15
---

# 認証情報の認証セマンティクス

このドキュメントでは、以下で共通して使用される認証情報の適格性および解決セマンティクスの正規仕様を定義します。

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目的は、選択時の動作と実行時の動作を一致させることです。

## 安定したプローブ理由コード

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## トークン認証情報

トークン認証情報（`type: "token"`）は、インラインの`token`および/または`tokenRef`をサポートします。

### 適格性ルール

1. `token`と`tokenRef`の両方が存在しない場合、トークンプロファイルは不適格です。
2. `expires`は任意です。
3. `expires`が存在する場合、それは`0`より大きい有限数でなければなりません。
4. `expires`が無効な場合（`NaN`、`0`、負数、非有限、または型が不正）、そのプロファイルは`invalid_expires`で不適格になります。
5. `expires`が過去の時刻である場合、そのプロファイルは`expired`で不適格になります。
6. `tokenRef`は`expires`の検証を回避しません。

### 解決ルール

1. リゾルバーのセマンティクスは、`expires`に関して適格性セマンティクスと一致します。
2. 適格なプロファイルでは、トークンの内容はインライン値または`tokenRef`から解決される場合があります。
3. 解決できない参照は、`models status --probe`の出力で`unresolved_ref`になります。

## 明示的な認証順序フィルタリング

- あるプロバイダーに対して`auth.order.<provider>`または認証ストアの順序オーバーライドが設定されている場合、`models status --probe`は、そのプロバイダーに対して解決された認証順序に残っているプロファイルIDのみをプローブします。
- そのプロバイダー用に保存されているプロファイルで、明示的な順序から除外されているものは、後で暗黙的に試行されません。プローブ出力では、それは`reasonCode: excluded_by_auth_order`および詳細`Excluded by auth.order for this provider.`として報告されます。

## プローブ対象の解決

- プローブ対象は、認証プロファイル、環境認証情報、または`models.json`から取得される場合があります。
- あるプロバイダーに認証情報があっても、OpenClawがそのプロバイダーに対してプローブ可能なモデル候補を解決できない場合、`models status --probe`は`reasonCode: no_model`を伴う`status: no_model`を報告します。

## OAuth SecretRef ポリシーガード

- SecretRef入力は静的な認証情報専用です。
- プロファイル認証情報が`type: "oauth"`である場合、そのプロファイル認証情報の内容についてはSecretRefオブジェクトはサポートされません。
- `auth.profiles.<id>.mode`が`"oauth"`である場合、そのプロファイルに対するSecretRefベースの`keyRef`/`tokenRef`入力は拒否されます。
- 違反は、起動時またはリロード時の認証解決パスでハードエラーになります。

## レガシー互換メッセージ

スクリプト互換性のため、プローブエラーではこの1行目を変更せずに維持します。

`Auth profile credentials are missing or expired.`

人間にわかりやすい詳細および安定した理由コードは、後続の行に追加できます。
