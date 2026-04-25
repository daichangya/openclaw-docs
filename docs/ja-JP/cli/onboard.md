---
read_when:
    - Gateway、workspace、認証、チャンネル、Skills のガイド付きセットアップを行いたい場合
summary: '`openclaw onboard` の CLI リファレンス（インタラクティブオンボーディング）'
title: オンボーディング
x-i18n:
    generated_at: "2026-04-25T13:44:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

ローカルまたはリモート Gateway セットアップ向けのインタラクティブオンボーディング。

## 関連ガイド

- CLI オンボーディングハブ: [オンボーディング (CLI)](/ja-JP/start/wizard)
- オンボーディング概要: [オンボーディング概要](/ja-JP/start/onboarding-overview)
- CLI オンボーディングリファレンス: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)
- CLI 自動化: [CLI 自動化](/ja-JP/start/wizard-cli-automation)
- macOS オンボーディング: [オンボーディング (macOS App)](/ja-JP/start/onboarding)

## 例

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` は Crestodian の会話型オンボーディングプレビューを起動します。
`--modern` なしでは、`openclaw onboard` は従来のオンボーディングフローを維持します。

平文のプライベートネットワーク `ws://` ターゲット用（信頼できるネットワークのみ）には、
オンボーディングプロセス環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。
このクライアント側トランスポートの緊急回避設定に対応する `openclaw.json` 相当はありません。

非インタラクティブなカスタムプロバイダー:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` は非インタラクティブモードでは任意です。省略した場合、オンボーディングは `CUSTOM_API_KEY` を確認します。

LM Studio も非インタラクティブモードでプロバイダー固有のキーフラグをサポートします。

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非インタラクティブ Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は任意で、省略した場合はオンボーディングが Ollama の推奨デフォルトを使用します。`kimi-k2.5:cloud` のようなクラウドモデル ID もここで使用できます。

プロバイダーキーを平文ではなく参照として保存するには:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使うと、オンボーディングは平文のキー値ではなく env ベースの参照を書き込みます。
auth-profile ベースのプロバイダーでは `keyRef` エントリを書き込みます。カスタムプロバイダーでは `models.providers.<id>.apiKey` を env ref として書き込みます（たとえば `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非インタラクティブ `ref` モードの契約:

- オンボーディングプロセス環境でプロバイダーの env var を設定してください（例: `OPENAI_API_KEY`）。
- 必須の env var も設定されていない限り、インラインのキーフラグ（例: `--openai-api-key`）を渡さないでください。
- 必須の env var なしでインラインのキーフラグが渡された場合、オンボーディングはガイダンス付きですぐに失敗します。

非インタラクティブモードでの Gateway トークンオプション:

- `--gateway-auth token --gateway-token <token>` は平文トークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を env SecretRef として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は同時に使えません。
- `--gateway-token-ref-env` には、オンボーディングプロセス環境内の空でない env var が必要です。
- `--install-daemon` 使用時に、token 認証でトークンが必要な場合、SecretRef 管理の Gateway トークンは検証されますが、解決済み平文として supervisor サービス環境メタデータへ永続化はされません。
- `--install-daemon` 使用時に、token モードでトークンが必要なのに、設定されたトークン SecretRef が未解決の場合、オンボーディングは修復ガイダンス付きで fail closed します。
- `--install-daemon` 使用時に、`gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、かつ `gateway.auth.mode` が未設定の場合、オンボーディングは mode が明示設定されるまでインストールをブロックします。
- ローカルオンボーディングは `gateway.mode="local"` を config に書き込みます。後で config ファイルに `gateway.mode` が存在しない場合、それは有効な local-mode ショートカットではなく、config の破損または不完全な手動編集として扱ってください。
- `--allow-unconfigured` は別個の Gateway ランタイム用緊急回避です。オンボーディングが `gateway.mode` を省略してよいことを意味しません。

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

非インタラクティブなローカル Gateway ヘルス:

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカル Gateway を確認してから正常終了します。
- `--install-daemon` は、まず管理対象 Gateway のインストールパスを開始します。これを使わない場合、`openclaw gateway run` などですでにローカル Gateway が動作している必要があります。
- 自動化で config/workspace/bootstrap の書き込みだけが欲しい場合は、`--skip-health` を使ってください。
- workspace ファイルを自分で管理する場合は、`--skip-bootstrap` を渡して `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成をスキップしてください。
- ネイティブ Windows では、`--install-daemon` はまず Scheduled Tasks を試し、タスク作成が拒否された場合はユーザーごとの Startup フォルダーのログイン項目にフォールバックします。

参照モードでのインタラクティブオンボーディング動作:

- プロンプトが表示されたら **Use secret reference** を選択します。
- 次に以下のいずれかを選択します:
  - Environment variable
  - Configured secret provider（`file` または `exec`）
- オンボーディングは参照を保存する前に高速な事前検証を実行します。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。

非インタラクティブな Z.AI エンドポイント選択:

注: `--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントを自動検出するようになりました（一般 API を優先し、`zai/glm-5.1` を使います）。
GLM Coding Plan エンドポイントを明示的に使いたい場合は、`zai-coding-global` または `zai-coding-cn` を選択してください。

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

非インタラクティブな Mistral の例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

フローに関する注記:

- `quickstart`: 最小限のプロンプトで、Gateway トークンを自動生成します。
- `manual`: port/bind/auth の完全なプロンプトを表示します（`advanced` の別名）。
- auth choice が優先プロバイダーを示す場合、オンボーディングは
  デフォルトモデルおよび許可リストのピッカーをそのプロバイダーに事前フィルタリングします。Volcengine と
  BytePlus では、coding-plan バリアント
  （`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。
- 優先プロバイダーフィルターでまだ読み込まれたモデルが見つからない場合、
  オンボーディングはピッカーを空のままにせず、フィルターなしカタログにフォールバックします。
- web-search ステップでは、一部のプロバイダーでプロバイダー固有の
  追加プロンプトが表示されることがあります:
  - **Grok** では、同じ `XAI_API_KEY` と
    `x_search` モデル選択を使う任意の `x_search` セットアップを提示できます。
  - **Kimi** では、Moonshot API リージョン（`api.moonshot.ai` または
    `api.moonshot.cn`）と、デフォルトの Kimi web-search モデルを確認することがあります。
- ローカルオンボーディングの DM scope 動作: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
- 最速の最初のチャット: `openclaw dashboard`（Control UI。チャンネルセットアップ不要）。
- Custom Provider: 一覧にないホスト型プロバイダーを含む、任意の OpenAI または Anthropic 互換エンドポイントに接続できます。自動検出には Unknown を使ってください。

## よく使う後続コマンド

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非インタラクティブモードを意味しません。スクリプトでは `--non-interactive` を使ってください。
</Note>
