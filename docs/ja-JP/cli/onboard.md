---
read_when:
    - Gateway、ワークスペース、認証、チャネル、Skills のガイド付きセットアップを行います
summary: '`openclaw onboard` のCLIリファレンス（対話型オンボーディング）'
title: オンボード
x-i18n:
    generated_at: "2026-04-24T08:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1959ad7014b891230e497a2e0ab494ba316090c81629f25b8147614b694ead5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

ローカルまたはリモートのGatewayセットアップ向けの対話型オンボーディングです。

## 関連ガイド

- CLIオンボーディングハブ: [オンボーディング（CLI）](/ja-JP/start/wizard)
- オンボーディングの概要: [オンボーディングの概要](/ja-JP/start/onboarding-overview)
- CLIオンボーディングリファレンス: [CLIセットアップリファレンス](/ja-JP/start/wizard-cli-reference)
- CLI自動化: [CLI自動化](/ja-JP/start/wizard-cli-automation)
- macOSオンボーディング: [オンボーディング（macOSアプリ）](/ja-JP/start/onboarding)

## 例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

平文のプライベートネットワーク `ws://` ターゲット向けには（信頼できるネットワークのみ）、オンボーディングプロセス環境で
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。
このクライアント側トランスポートの緊急回避策に対する
`openclaw.json` 相当の設定はありません。

非対話型のカスタムプロバイダー:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` は非対話型モードでは任意です。省略した場合、オンボーディングは `CUSTOM_API_KEY` を確認します。

LM Studio も、非対話型モードでプロバイダー固有のキーフラグをサポートしています:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非対話型のOllama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は任意です。省略した場合、オンボーディングは Ollama の推奨デフォルトを使用します。`kimi-k2.5:cloud` のようなクラウドモデルIDもここで利用できます。

プロバイダーキーを平文ではなく参照として保存するには:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使うと、オンボーディングは平文のキー値ではなく env ベースの参照を書き込みます。
auth-profile ベースのプロバイダーでは `keyRef` エントリが書き込まれます。カスタムプロバイダーでは `models.providers.<id>.apiKey` が env 参照として書き込まれます（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非対話型 `ref` モードの契約:

- オンボーディングプロセス環境でプロバイダーの環境変数を設定してください（例: `OPENAI_API_KEY`）。
- その環境変数も設定されていない限り、インラインのキーフラグ（例: `--openai-api-key`）は渡さないでください。
- 必須の環境変数なしでインラインのキーフラグが渡された場合、オンボーディングはガイダンス付きですぐに失敗します。

非対話型モードでのGatewayトークンオプション:

- `--gateway-auth token --gateway-token <token>` は平文トークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を env SecretRef として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は相互排他的です。
- `--gateway-token-ref-env` には、オンボーディングプロセス環境内の空でない env var が必要です。
- `--install-daemon` を使う場合、トークン認証にトークンが必要なとき、SecretRef 管理のGatewayトークンは検証されますが、supervisorサービス環境メタデータには解決済みの平文として永続化されません。
- `--install-daemon` を使う場合、トークンモードにトークンが必要で、設定されたトークンSecretRefが未解決なら、オンボーディングは対処ガイダンス付きでクローズドフェイルします。
- `--install-daemon` を使う場合、`gateway.auth.token` と `gateway.auth.password` の両方が設定されていて `gateway.auth.mode` が未設定なら、モードが明示的に設定されるまでオンボーディングはインストールをブロックします。
- ローカルオンボーディングは設定に `gateway.mode="local"` を書き込みます。後の設定ファイルで `gateway.mode` が欠けている場合、それは有効なローカルモードのショートカットではなく、設定の破損または不完全な手動編集として扱ってください。
- `--allow-unconfigured` は別個のGatewayランタイム用緊急回避策です。これはオンボーディングが `gateway.mode` を省略してよいことを意味しません。

例:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

非対話型のローカルGatewayヘルス:

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカルGatewayを待ってから正常終了します。
- `--install-daemon` は、まず管理対象のGatewayインストールパスを開始します。これを使わない場合は、たとえば `openclaw gateway run` のように、ローカルGatewayがすでに実行中である必要があります。
- 自動化で設定/ワークスペース/ブートストラップの書き込みだけが必要な場合は、`--skip-health` を使ってください。
- ネイティブWindowsでは、`--install-daemon` はまず Scheduled Tasks を試し、タスク作成が拒否された場合はユーザーごとの Startup フォルダーのログイン項目にフォールバックします。

参照モードでの対話型オンボーディングの動作:

- プロンプトが表示されたら **Use secret reference** を選択します。
- 次に、以下のいずれかを選択します:
  - Environment variable
  - 設定済みシークレットプロバイダー（`file` または `exec`）
- オンボーディングは、参照を保存する前に高速な事前検証を実行します。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。

非対話型のZ.AIエンドポイント選択:

注: `--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントを自動検出するようになりました（`zai/glm-5.1` を持つ一般APIを優先）。
GLM Coding Plan エンドポイントを明示的に使いたい場合は、`zai-coding-global` または `zai-coding-cn` を選んでください。

```bash
# プロンプトなしのエンドポイント選択
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# その他の Z.AI エンドポイント選択:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非対話型のMistral例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

フローメモ:

- `quickstart`: 最小限のプロンプトで、Gatewayトークンを自動生成します。
- `manual`: ポート/バインド/認証向けの完全なプロンプトです（`advanced` の別名）。
- 認証の選択が優先プロバイダーを示す場合、オンボーディングは default-model と allowlist のピッカーをそのプロバイダーに事前フィルタリングします。Volcengine と BytePlus では、これは coding-plan バリアント
  （`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。
- 優先プロバイダーフィルターでまだ読み込まれたモデルが1つもない場合、オンボーディングはピッカーを空のままにせず、フィルターなしのカタログにフォールバックします。
- web-search ステップでは、一部のプロバイダーでプロバイダー固有の追加プロンプトが表示される場合があります:
  - **Grok** では、同じ `XAI_API_KEY` と `x_search` モデル選択による任意の `x_search` セットアップを提案する場合があります。
  - **Kimi** では、Moonshot API リージョン（`api.moonshot.ai` と
    `api.moonshot.cn`）およびデフォルトの Kimi web-search モデルを確認する場合があります。
- ローカルオンボーディングのDMスコープ動作: [CLIセットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
- 最速で最初のチャットを始める方法: `openclaw dashboard`（Control UI、チャネルセットアップ不要）。
- Custom Provider: 一覧にないホスト型プロバイダーを含む、任意の OpenAI または Anthropic 互換エンドポイントに接続します。自動検出するには Unknown を使用してください。

## よく使う次のコマンド

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話型モードを意味しません。スクリプトでは `--non-interactive` を使ってください。
</Note>
