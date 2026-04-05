---
read_when:
    - Gateway、workspace、認証、チャネル、Skills のガイド付きセットアップを使いたい
summary: '`openclaw onboard` の CLI リファレンス（対話型オンボーディング）'
title: onboard
x-i18n:
    generated_at: "2026-04-05T12:39:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6db61c8002c9e82e48ff44f72e176b58ad85fad5cb8434687455ed40add8cc2a
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

ローカルまたはリモートの Gateway セットアップ向けの対話型オンボーディングです。

## 関連ガイド

- CLI オンボーディングハブ: [Onboarding (CLI)](/ja-JP/start/wizard)
- オンボーディング概要: [Onboarding Overview](/start/onboarding-overview)
- CLI オンボーディングリファレンス: [CLI Setup Reference](/start/wizard-cli-reference)
- CLI 自動化: [CLI Automation](/start/wizard-cli-automation)
- macOS オンボーディング: [Onboarding (macOS App)](/start/onboarding)

## 例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

平文のプライベートネットワーク `ws://` ターゲット（信頼できるネットワークのみ）については、
オンボーディングプロセス環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

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

`--custom-api-key` は非対話モードでは省略可能です。省略した場合、オンボーディングは `CUSTOM_API_KEY` を確認します。

非対話型 Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は省略可能で、省略した場合はオンボーディングが Ollama の推奨デフォルトを使用します。`kimi-k2.5:cloud` のようなクラウドモデル ID もここで使用できます。

プロバイダーキーを平文ではなく ref として保存するには:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使うと、オンボーディングは平文のキー値ではなく env ベースの ref を書き込みます。
auth-profile ベースのプロバイダーでは `keyRef` エントリを書き込みます。カスタムプロバイダーでは `models.providers.<id>.apiKey` を env ref として書き込みます（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非対話型 `ref` モードの契約:

- オンボーディングプロセス環境でプロバイダーの env var を設定してください（例: `OPENAI_API_KEY`）。
- その env var も設定されていない限り、インラインキー用フラグ（例: `--openai-api-key`）を渡さないでください。
- 必要な env var がない状態でインラインキー用フラグが渡された場合、オンボーディングはガイダンス付きですぐに失敗します。

非対話モードでの Gateway トークンオプション:

- `--gateway-auth token --gateway-token <token>` は平文トークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を env SecretRef として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は同時に使用できません。
- `--gateway-token-ref-env` には、オンボーディングプロセス環境内の空でない env var が必要です。
- `--install-daemon` 使用時に、トークン認証でトークンが必要な場合、SecretRef 管理の Gateway トークンは検証されますが、supervisor サービス環境メタデータには解決済み平文として保存されません。
- `--install-daemon` 使用時に、トークンモードでトークンが必要で、設定されたトークン SecretRef が未解決の場合、オンボーディングは対処方法の案内とともにフェイルクローズします。
- `--install-daemon` 使用時に、`gateway.auth.token` と `gateway.auth.password` の両方が設定されていて `gateway.auth.mode` が未設定の場合、オンボーディングは mode が明示的に設定されるまでインストールをブロックします。
- ローカルオンボーディングは設定に `gateway.mode="local"` を書き込みます。後で設定ファイルから `gateway.mode` が欠けている場合、それは設定破損または不完全な手動編集として扱ってください。有効な local モードのショートカットではありません。
- `--allow-unconfigured` は別個の Gateway ランタイム用エスケープハッチです。これはオンボーディングが `gateway.mode` を省略してよいことを意味しません。

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

非対話型ローカル Gateway ヘルス:

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカル Gateway を確認してから正常終了します。
- `--install-daemon` はまず管理対象 Gateway のインストール経路を開始します。これを使わない場合、たとえば `openclaw gateway run` のように、すでにローカル Gateway が起動している必要があります。
- 自動化で config/workspace/bootstrap の書き込みだけを行いたい場合は、`--skip-health` を使ってください。
- ネイティブ Windows では、`--install-daemon` はまず Scheduled Tasks を試し、タスク作成が拒否された場合はユーザーごとの Startup フォルダーのログイン項目にフォールバックします。

参照モードでの対話型オンボーディングの挙動:

- プロンプトが出たら **Use secret reference** を選択します。
- 次に以下のいずれかを選択します:
  - Environment variable
  - Configured secret provider（`file` または `exec`）
- オンボーディングは保存前に高速な事前検証を実行します。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。

非対話型 Z.AI エンドポイント選択:

注: `--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントを自動検出するようになりました（`zai/glm-5` を使う一般 API を優先します）。
GLM Coding Plan エンドポイントを明示的に使いたい場合は、`zai-coding-global` または `zai-coding-cn` を選択してください。

```bash
# プロンプトなしのエンドポイント選択
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 他の Z.AI エンドポイント選択:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非対話型 Mistral の例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

フローメモ:

- `quickstart`: 最小限のプロンプトで、Gateway トークンを自動生成します。
- `manual`: port/bind/auth の完全なプロンプトを表示します（`advanced` のエイリアス）。
- 認証選択が優先プロバイダーを示唆する場合、オンボーディングは
  デフォルトモデルと allowlist の picker をそのプロバイダーに事前フィルターします。Volcengine と
  BytePlus では、coding-plan バリアント
  （`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。
- 優先プロバイダーフィルターで、まだ読み込まれているモデルが 1 つもない場合、オンボーディングは
  picker を空のままにせず、フィルターなしカタログにフォールバックします。
- web-search ステップでは、一部のプロバイダーがプロバイダー固有の
  フォローアッププロンプトをトリガーすることがあります:
  - **Grok** では、同じ `XAI_API_KEY` を使った任意の `x_search` セットアップと、
    `x_search` モデル選択を提示できます。
  - **Kimi** では、Moonshot API リージョン（`api.moonshot.ai` と
    `api.moonshot.cn`）およびデフォルトの Kimi web-search モデルを質問することがあります。
- ローカルオンボーディングの DM スコープ動作: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals)。
- 最速で最初のチャットを始める方法: `openclaw dashboard`（Control UI、チャネル設定不要）。
- Custom Provider: 一覧にないホスト型プロバイダーを含む、任意の OpenAI または Anthropic 互換エンドポイントに接続できます。自動検出するには Unknown を使ってください。

## よく使う後続コマンド

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使用してください。
</Note>
