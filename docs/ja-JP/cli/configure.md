---
read_when:
    - 認証情報、デバイス、またはエージェントのデフォルト設定を対話的に調整したい場合
summary: '`openclaw configure` の CLI リファレンス（対話型設定プロンプト）'
title: 設定する
x-i18n:
    generated_at: "2026-04-25T13:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

認証情報、デバイス、エージェントのデフォルト設定を行うための対話型プロンプトです。

注: **Model** セクションには、`agents.defaults.models` の Allowlist（`/model` とモデルピッカーに表示される内容）向けのマルチセレクトが追加されました。プロバイダースコープのセットアップ選択では、設定済みの無関係なプロバイダーを置き換えるのではなく、選択したモデルを既存の Allowlist にマージします。configure からプロバイダー認証を再実行しても、既存の `agents.defaults.model.primary` は保持されます。意図的にデフォルトモデルを変更したい場合は、`openclaw models auth login --provider <id> --set-default` または `openclaw models set <model>` を使用してください。

configure がプロバイダー認証の選択から開始された場合、デフォルトモデルと Allowlist のピッカーは自動的にそのプロバイダーを優先します。Volcengine/BytePlus のようなペアのプロバイダーでは、この優先設定はコーディングプランのバリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。優先プロバイダーフィルターによって空のリストになる場合、configure は空白のピッカーを表示する代わりに、フィルターなしのカタログにフォールバックします。

ヒント: サブコマンドなしの `openclaw config` でも同じウィザードが開きます。非対話型の編集には `openclaw config get|set|unset` を使用してください。

Web 検索では、`openclaw configure --section web` を使うとプロバイダーを選び、その認証情報を設定できます。一部のプロバイダーでは、プロバイダー固有の追加プロンプトも表示されます:

- **Grok** では、同じ `XAI_API_KEY` を使ったオプションの `x_search` セットアップを提案し、`x_search` モデルを選択できます。
- **Kimi** では、Moonshot API リージョン（`api.moonshot.ai` または `api.moonshot.cn`）と、デフォルトの Kimi Web 検索モデルを尋ねる場合があります。

関連:

- Gateway 設定リファレンス: [Configuration](/ja-JP/gateway/configuration)
- Config CLI: [Config](/ja-JP/cli/config)

## オプション

- `--section <section>`: 繰り返し可能なセクションフィルター

利用可能なセクション:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

注記:

- Gateway の実行場所を選ぶと、常に `gateway.mode` が更新されます。それだけが必要な場合は、他のセクションを選ばずに「Continue」を選択できます。
- チャネル指向サービス（Slack/Discord/Matrix/Microsoft Teams）では、セットアップ中にチャネル/ルームの Allowlist を求められます。名前または ID を入力でき、可能な場合はウィザードが名前を ID に解決します。
- デーモンのインストール手順を実行する場合、トークン認証にはトークンが必要で、`gateway.auth.token` が SecretRef 管理であれば、configure は SecretRef を検証しますが、解決された平文トークン値を supervisor サービス環境メタデータに永続化しません。
- トークン認証にトークンが必要で、設定されたトークン SecretRef が未解決の場合、configure は実行可能な修復ガイダンスとともにデーモンのインストールをブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されており、`gateway.auth.mode` が未設定の場合、configure は mode が明示的に設定されるまでデーモンのインストールをブロックします。

## 例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 関連

- [CLI reference](/ja-JP/cli)
- [Configuration](/ja-JP/gateway/configuration)
