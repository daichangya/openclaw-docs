---
read_when:
    - 認証情報、デバイス、またはagentデフォルトを対話的に調整したいとき
summary: '`openclaw configure`のCLIリファレンス（対話型設定プロンプト）'
title: configure
x-i18n:
    generated_at: "2026-04-05T12:38:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

認証情報、デバイス、agentデフォルトを設定するための対話型プロンプトです。

注記: **Model**セクションには、`agents.defaults.models` allowlist（`/model`とモデルピッカーに表示されるもの）用の複数選択が含まれるようになりました。

configureがプロバイダー認証の選択から開始された場合、デフォルトモデルとallowlistのピッカーは自動的にそのプロバイダーを優先します。Volcengine/BytePlusのようなペアのプロバイダーでは、同じ優先設定がそのcoding-planバリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。優先プロバイダーフィルターによって空のリストになる場合、configureは空白のピッカーを表示する代わりに、フィルターなしのカタログへフォールバックします。

ヒント: サブコマンドなしで`openclaw config`を実行すると、同じウィザードが開きます。非対話型で編集するには`openclaw config get|set|unset`を使用してください。

Web検索については、`openclaw configure --section web`でプロバイダーを選択し、その認証情報を設定できます。一部のプロバイダーでは、プロバイダー固有の追加プロンプトも表示されます。

- **Grok**では、同じ`XAI_API_KEY`を使った任意の`x_search`セットアップを提案し、`x_search`モデルを選択できます。
- **Kimi**では、Moonshot APIリージョン（`api.moonshot.ai`または`api.moonshot.cn`）とデフォルトのKimi Web検索モデルを尋ねる場合があります。

関連:

- Gateway設定リファレンス: [Configuration](/gateway/configuration)
- Config CLI: [Config](/cli/config)

## オプション

- `--section <section>`: 繰り返し指定可能なセクションフィルター

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

- Gatewayの実行場所を選ぶと、常に`gateway.mode`が更新されます。それだけが必要な場合は、他のセクションを選ばずに「Continue」を選択できます。
- チャンネル指向のサービス（Slack/Discord/Matrix/Microsoft Teams）では、セットアップ時にチャンネル/ルームのallowlist入力を求められます。名前またはIDを入力でき、可能な場合はウィザードが名前をIDに解決します。
- daemonインストール手順を実行する場合、トークン認証にはトークンが必要であり、`gateway.auth.token`はSecretRef管理されるため、configureはSecretRefを検証しますが、解決されたプレーンテキストのトークン値をsupervisorサービス環境メタデータへ永続化しません。
- トークン認証でトークンが必要で、設定されたトークンSecretRefが未解決の場合、configureは実行可能な対処ガイダンスを示してdaemonインストールをブロックします。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されていて、`gateway.auth.mode`が未設定の場合、configureはmodeが明示的に設定されるまでdaemonインストールをブロックします。

## 例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
