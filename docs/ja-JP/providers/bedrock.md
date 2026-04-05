---
read_when:
    - OpenClawでAmazon Bedrockモデルを使いたい場合
    - モデル呼び出しのためにAWS認証情報/リージョン設定が必要な場合
summary: OpenClawでAmazon Bedrock（Converse API）モデルを使用する
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T12:53:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClawは、pi‑aiの**Bedrock Converse**ストリーミングプロバイダー経由で**Amazon Bedrock**モデルを使用できます。Bedrock認証は、APIキーではなく**AWS SDKのデフォルト認証情報チェーン**を使用します。

## pi-aiがサポートする内容

- プロバイダー: `amazon-bedrock`
- API: `bedrock-converse-stream`
- 認証: AWS認証情報（環境変数、共有設定、またはinstance role）
- リージョン: `AWS_REGION`または`AWS_DEFAULT_REGION`（デフォルト: `us-east-1`）

## 自動モデル検出

OpenClawは、**ストリーミング**と**テキスト出力**をサポートするBedrockモデルを自動検出できます。検出には`bedrock:ListFoundationModels`と`bedrock:ListInferenceProfiles`を使用し、結果はキャッシュされます（デフォルト: 1時間）。

暗黙のプロバイダーが有効になる方法:

- `plugins.entries.amazon-bedrock.config.discovery.enabled`が`true`の場合、
  OpenClawはAWS環境マーカーがなくても検出を試みます。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`が未設定の場合、
  OpenClawは、次のAWS認証マーカーのいずれかを検出したときにのみ、
  暗黙のBedrockプロバイダーを自動追加します:
  `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`、または`AWS_PROFILE`。
- 実際のBedrockランタイム認証パスは引き続きAWS SDKのデフォルトチェーンを使用するため、
  検出時にオプトインのため`enabled: true`が必要であっても、
  共有設定、SSO、およびIMDS instance-role認証は機能します。

設定オプションは`plugins.entries.amazon-bedrock.config.discovery`配下にあります:

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          discovery: {
            enabled: true,
            region: "us-east-1",
            providerFilter: ["anthropic", "amazon"],
            refreshInterval: 3600,
            defaultContextWindow: 32000,
            defaultMaxTokens: 4096,
          },
        },
      },
    },
  },
}
```

注記:

- `enabled`のデフォルトはauto modeです。auto modeでは、OpenClawは
  サポートされているAWS環境マーカーを検出したときにのみ、暗黙の
  Bedrockプロバイダーを有効化します。
- `region`のデフォルトは`AWS_REGION`または`AWS_DEFAULT_REGION`、その後`us-east-1`です。
- `providerFilter`はBedrockプロバイダー名（たとえば`anthropic`）に一致します。
- `refreshInterval`は秒です。キャッシュを無効化するには`0`に設定してください。
- `defaultContextWindow`（デフォルト: `32000`）および`defaultMaxTokens`（デフォルト: `4096`）
  は検出されたモデルに使用されます（モデル上限がわかっている場合は上書きしてください）。
- 明示的な`models.providers["amazon-bedrock"]`エントリでは、OpenClawは
  依然として`AWS_BEARER_TOKEN_BEDROCK`のようなAWS環境マーカーから
  Bedrockのenv-marker認証を早期に解決できますが、完全なランタイム認証読み込みを強制しません。
  実際のモデル呼び出し認証パスは引き続きAWS SDKのデフォルトチェーンを使用します。

## オンボーディング

1. **gateway host**上でAWS認証情報が利用可能であることを確認します:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# 任意:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# 任意（Bedrock APIキー/bearer token）:
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. 設定にBedrockプロバイダーとモデルを追加します（`apiKey`は不要）:

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "us.anthropic.claude-opus-4-6-v1:0",
            name: "Claude Opus 4.6 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
    },
  },
}
```

## EC2 Instance Roles

IAM roleがアタッチされたEC2インスタンス上でOpenClawを実行している場合、AWS SDK
は認証にinstance metadata service（IMDS）を使用できます。Bedrock
モデル検出では、OpenClawはAWS環境
マーカーからのみ暗黙のプロバイダーを自動有効化します。明示的に
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`を設定した場合はこの限りではありません。

IMDSベースのホスト向け推奨セットアップ:

- `plugins.entries.amazon-bedrock.config.discovery.enabled`を`true`に設定する。
- `plugins.entries.amazon-bedrock.config.discovery.region`を設定する（または`AWS_REGION`をexportする）。
- ダミーのAPIキーは不要です。
- auto modeまたはstatus surface用に環境マーカーが必要な場合にのみ、
  `AWS_PROFILE=default`が必要です。

```bash
# 推奨: 検出を明示的に有効化し、リージョンを設定
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 任意: 明示的な有効化なしでauto modeを使いたい場合は環境マーカーを追加
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

EC2 instance roleに必要な**IAM権限**:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels`（自動検出用）
- `bedrock:ListInferenceProfiles`（inference profile検出用）

または、管理ポリシー`AmazonBedrockFullAccess`をアタッチしてください。

## クイックセットアップ（AWSパス）

```bash
# 1. IAM roleとinstance profileを作成
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. EC2インスタンスにアタッチ
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. EC2インスタンス上で、検出を明示的に有効化
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. 任意: 明示的な有効化なしでauto modeを使いたい場合は環境マーカーを追加
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. モデルが検出されることを確認
openclaw models list
```

## Inference profiles

OpenClawは、foundation modelと並んで**regionalおよびglobal inference profile**を検出します。profileが既知のfoundation modelに対応付けられている場合、その
profileはそのモデルの機能（context window、max tokens、
reasoning、vision）を継承し、正しいBedrockリクエストリージョンが自動的に注入されます。これにより、クロスリージョンのClaude profileは手動の
プロバイダー上書きなしで動作します。

Inference profile IDは、`us.anthropic.claude-opus-4-6-v1:0`（regional）
または`anthropic.claude-opus-4-6-v1:0`（global）のような形です。基盤モデルがすでに
検出結果内にある場合、そのprofileはその完全な機能セットを継承します。
それ以外の場合は安全なデフォルトが適用されます。

追加設定は不要です。検出が有効で、IAM
プリンシパルに`bedrock:ListInferenceProfiles`がある限り、profileは
`openclaw models list`でfoundation modelと並んで表示されます。

## 注記

- Bedrockでは、AWSアカウント/リージョンで**モデルアクセス**を有効にする必要があります。
- 自動検出には`bedrock:ListFoundationModels`および
  `bedrock:ListInferenceProfiles`権限が必要です。
- auto modeに依存する場合は、サポートされているAWS認証環境マーカーのいずれかを
  gateway host上に設定してください。環境マーカーなしでIMDS/共有設定認証を使いたい場合は、
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`を設定してください。
- OpenClawは認証情報ソースを次の順序で表示します: `AWS_BEARER_TOKEN_BEDROCK`、
  次に`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、次に`AWS_PROFILE`、その後に
  デフォルトのAWS SDKチェーン。
- reasoningサポートはモデルに依存します。現在の機能については
  Bedrockモデルカードを確認してください。
- 管理されたキー方式を使いたい場合は、Bedrockの前段にOpenAI互換の
  proxyを置き、代わりにそれをOpenAIプロバイダーとして設定することもできます。

## Guardrails

`amazon-bedrock` plugin設定に
`guardrail`オブジェクトを追加することで、すべてのBedrockモデル呼び出しに[Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
を適用できます。Guardrailsにより、コンテンツフィルタリング、
トピック拒否、単語フィルター、機微情報フィルター、および文脈的
グラウンディングチェックを強制できます。

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // guardrail IDまたは完全なARN
            guardrailVersion: "1", // バージョン番号または"DRAFT"
            streamProcessingMode: "sync", // 任意: "sync"または"async"
            trace: "enabled", // 任意: "enabled"、"disabled"、または"enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier`（必須）は、guardrail ID（例: `abc123`）または
  完全なARN（例: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）を受け付けます。
- `guardrailVersion`（必須）は、使用する公開バージョン、または
  作業ドラフトに対して`"DRAFT"`を指定します。
- `streamProcessingMode`（任意）は、guardrail評価を
  ストリーミング中に同期的（`"sync"`）または非同期的（`"async"`）に実行するかを制御します。省略した場合、
  Bedrockはデフォルト動作を使用します。
- `trace`（任意）は、APIレスポンスでguardrailトレース出力を有効にします。
  デバッグには`"enabled"`または`"enabled_full"`を設定し、本番では
  省略するか`"disabled"`を設定してください。

gatewayが使用するIAMプリンシパルには、標準のinvoke権限に加えて
`bedrock:ApplyGuardrail`権限が必要です。
