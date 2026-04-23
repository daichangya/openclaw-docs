---
read_when:
    - LiteLLM プロキシ経由で OpenClaw をルーティングしたい
    - LiteLLM 経由でコスト追跡、ロギング、またはモデルルーティングが必要です
summary: 統一されたモデルアクセスとコスト追跡のために LiteLLM Proxy 経由で OpenClaw を実行する
title: LiteLLM
x-i18n:
    generated_at: "2026-04-12T23:32:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 766692eb83a1be83811d8e09a970697530ffdd4f3392247cfb2927fd590364a0
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) は、100 を超える model provider に対する統一 API を提供するオープンソースの LLM Gateway です。OpenClaw を LiteLLM 経由でルーティングすると、コスト追跡、ロギングの一元化、および OpenClaw の設定を変えずにバックエンドを切り替える柔軟性が得られます。

<Tip>
**OpenClaw と一緒に LiteLLM を使う理由**

- **コスト追跡** — すべてのモデルにまたがる OpenClaw の支出を正確に確認できます
- **モデルルーティング** — 設定変更なしで Claude、GPT-4、Gemini、Bedrock を切り替えられます
- **仮想キー** — OpenClaw 用に支出上限付きキーを作成できます
- **ロギング** — デバッグ用の完全なリクエスト/レスポンスログ
- **フォールバック** — プライマリー provider が停止していても自動フェイルオーバー
</Tip>

## クイックスタート

<Tabs>
  <Tab title="オンボーディング（推奨）">
    **最適な用途:** 動作する LiteLLM セットアップに最速で到達したい場合。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="手動セットアップ">
    **最適な用途:** インストールと設定を完全に制御したい場合。

    <Steps>
      <Step title="LiteLLM Proxy を起動する">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw を LiteLLM に向ける">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        これで完了です。OpenClaw は LiteLLM 経由でルーティングされます。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定

### 環境変数

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 設定ファイル

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 高度なトピック

<AccordionGroup>
  <Accordion title="仮想キー">
    支出上限付きの OpenClaw 専用キーを作成します。

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    生成されたキーを `LITELLM_API_KEY` として使用します。

  </Accordion>

  <Accordion title="モデルルーティング">
    LiteLLM は model リクエストを異なるバックエンドへルーティングできます。LiteLLM の `config.yaml` で設定します。

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw は引き続き `claude-opus-4-6` をリクエストし、ルーティングは LiteLLM が処理します。

  </Accordion>

  <Accordion title="使用量の確認">
    LiteLLM のダッシュボードまたは API を確認します。

    ```bash
    # キー情報
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 支出ログ
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="プロキシ動作に関する注意">
    - LiteLLM はデフォルトで `http://localhost:4000` で動作します
    - OpenClaw は LiteLLM のプロキシ型 OpenAI 互換 `/v1`
      エンドポイント経由で接続します
    - LiteLLM 経由ではネイティブ OpenAI 専用のリクエスト整形は適用されません:
      `service_tier`、Responses の `store`、プロンプトキャッシュヒント、
      OpenAI reasoning 互換ペイロード整形はありません
    - カスタム LiteLLM base URL には、隠し OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）
      は注入されません
  </Accordion>
</AccordionGroup>

<Note>
一般的な provider 設定とフェイルオーバー動作については、[モデル provider](/ja-JP/concepts/model-providers) を参照してください。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    公式 LiteLLM ドキュメントと API リファレンス。
  </Card>
  <Card title="モデル provider" href="/ja-JP/concepts/model-providers" icon="layers">
    すべての provider、model ref、フェイルオーバー動作の概要。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルの選び方と設定方法。
  </Card>
</CardGroup>
