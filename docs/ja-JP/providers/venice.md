---
read_when:
    - OpenClawでプライバシー重視の推論を使いたい場合
    - Venice AIのセットアップガイダンスが必要です
summary: OpenClawでVenice AIのプライバシー重視モデルを使う
title: Venice AI
x-i18n:
    generated_at: "2026-04-26T11:39:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AIは**プライバシー重視のAI推論**を提供しており、無検閲モデルのサポートと、匿名化プロキシ経由で主要なプロプライエタリモデルへのアクセスを備えています。すべての推論はデフォルトでプライベートです。データは学習に使われず、ログも保存されません。

## OpenClawでVeniceを使う理由

- オープンソースモデル向けの**プライベート推論**（ログ保存なし）。
- 必要なときに使える**無検閲モデル**。
- 品質が重要な場合の、プロプライエタリモデル（Opus/GPT/Gemini）への**匿名化アクセス**。
- OpenAI互換の`/v1`エンドポイント。

## プライバシーモード

Veniceは2つのプライバシーレベルを提供しています。これを理解することが、モデル選択の鍵になります。

| モード | 説明 | モデル |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private** | 完全にプライベート。プロンプト/レスポンスは**保存もログ記録もされません**。一時的です。 | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensoredなど |
| **Anonymized** | メタデータを削除したうえでVenice経由でプロキシされます。基盤プロバイダー（OpenAI、Anthropic、Google、xAI）には匿名化されたリクエストが送られます。 | Claude、GPT、Gemini、Grok |

<Warning>
Anonymizedモデルは**完全にはプライベートではありません**。Veniceは転送前にメタデータを削除しますが、基盤プロバイダー（OpenAI、Anthropic、Google、xAI）は依然としてリクエストを処理します。完全なプライバシーが必要な場合は、**Private**モデルを選んでください。
</Warning>

## 機能

- **プライバシー重視**: 「private」（完全にプライベート）と「anonymized」（プロキシ経由）モードから選択可能
- **無検閲モデル**: コンテンツ制限のないモデルにアクセス可能
- **主要モデルへのアクセス**: Veniceの匿名化プロキシ経由でClaude、GPT、Gemini、Grokを利用可能
- **OpenAI互換API**: 簡単に統合できる標準の`/v1`エンドポイント
- **ストリーミング**: すべてのモデルでサポート
- **関数呼び出し**: 一部モデルでサポート（モデルのcapabilityを確認してください）
- **Vision**: Vision capabilityを持つモデルでサポート
- **厳格なレート制限なし**: 極端な利用ではフェアユースのスロットリングが適用される場合があります

## はじめに

<Steps>
  <Step title="APIキーを取得する">
    1. [venice.ai](https://venice.ai)でサインアップします
    2. **Settings > API Keys > Create new key**に移動します
    3. APIキー（形式: `vapi_xxxxxxxxxxxx`）をコピーします
  </Step>
  <Step title="OpenClawを設定する">
    好みのセットアップ方法を選んでください。

    <Tabs>
      <Tab title="対話式（推奨）">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        これにより次のことが行われます。
        1. APIキーの入力を求める（または既存の`VENICE_API_KEY`を使用する）
        2. 利用可能なVeniceモデルをすべて表示する
        3. デフォルトモデルを選択できるようにする
        4. プロバイダーを自動で設定する
      </Tab>
      <Tab title="環境変数">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="非対話式">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="セットアップを確認する">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## モデル選択

セットアップ後、OpenClawは利用可能なVeniceモデルをすべて表示します。用途に応じて選んでください。

- **デフォルトモデル**: 強力なプライベート推論とvisionを備えた`venice/kimi-k2-5`
- **高機能オプション**: 最も強力な匿名化Venice経路である`venice/claude-opus-4-6`
- **プライバシー**: 完全にプライベートな推論には「private」モデルを選択
- **機能**: Veniceのプロキシ経由でClaude、GPT、Geminiにアクセスするには「anonymized」モデルを選択

デフォルトモデルはいつでも変更できます。

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

利用可能なモデルをすべて一覧表示します。

```bash
openclaw models list | grep venice
```

`openclaw configure`を実行し、**Model/auth**を選択して、**Venice AI**を選ぶこともできます。

<Tip>
下の表を使って、用途に合ったモデルを選んでください。

| 用途 | 推奨モデル | 理由 |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **一般チャット（デフォルト）** | `kimi-k2-5` | 強力なプライベート推論とvision |
| **総合的に最高の品質** | `claude-opus-4-6` | 最も強力な匿名化Veniceオプション |
| **プライバシー + コーディング** | `qwen3-coder-480b-a35b-instruct` | 大きなコンテキストを持つプライベートなコーディングモデル |
| **プライベートvision** | `kimi-k2-5` | privateモードのままvisionをサポート |
| **高速 + 低コスト** | `qwen3-4b` | 軽量なreasoningモデル |
| **複雑なプライベートタスク** | `deepseek-v3.2` | 強力なreasoning。ただしVeniceのツールサポートなし |
| **無検閲** | `venice-uncensored` | コンテンツ制限なし |

</Tip>

## DeepSeek V4リプレイ動作

Veniceが`venice/deepseek-v4-pro`や`venice/deepseek-v4-flash`のようなDeepSeek V4モデルを公開している場合、OpenClawは、プロキシが省略したときに、アシスタントのtool-callターンに必要なDeepSeek V4の`reasoning_content`リプレイプレースホルダーを補完します。VeniceはDeepSeekネイティブのトップレベル`thinking`制御を拒否するため、OpenClawはそのプロバイダー固有のリプレイ修正を、ネイティブDeepSeekプロバイダーのthinking制御とは分離して保持します。

## 組み込みcatalog（全41件）

<AccordionGroup>
  <Accordion title="Privateモデル（26）— 完全にプライベート、ログ保存なし">
    | Model ID                               | 名前                                | コンテキスト | 機能 |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | デフォルト、reasoning、vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | 一般用途                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | 一般用途                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | 一般用途、tools無効    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | 一般用途                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | コーディング                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | コーディング                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Reasoning、vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | 一般用途                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | 高速、reasoning            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Reasoning、tools無効  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | 無検閲、tools無効 |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | 一般用途                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | 一般用途                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | 一般用途                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Reasoning                  |
  </Accordion>

  <Accordion title="Anonymizedモデル（15）— Veniceプロキシ経由">
    | Model ID                        | 名前                           | コンテキスト | 機能 |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Reasoning、vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Reasoning、vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Reasoning、vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Reasoning、vision         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Reasoning、vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Reasoning、vision、コーディング |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Reasoning                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Reasoning、vision、コーディング |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Reasoning、vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Reasoning、vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Reasoning、vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Reasoning、vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Reasoning、コーディング         |
  </Accordion>
</AccordionGroup>

## モデル検出

`VENICE_API_KEY`が設定されている場合、OpenClawはVenice APIから自動的にモデルを検出します。APIに到達できない場合は、静的catalogにフォールバックします。

`/models`エンドポイントは公開されています（一覧表示に認証は不要）が、推論には有効なAPIキーが必要です。

## ストリーミングとツールサポート

| 機能 | サポート |
| -------------------- | ---------------------------------------------------- |
| **ストリーミング** | すべてのモデル |
| **関数呼び出し** | ほとんどのモデル（API内の`supportsFunctionCalling`を確認） |
| **Vision/画像** | 「Vision」機能が付いたモデル |
| **JSONモード** | `response_format`経由でサポート |

## 料金

Veniceはクレジットベースのシステムを使用しています。現在の料金は[venice.ai/pricing](https://venice.ai/pricing)を確認してください。

- **Privateモデル**: 一般的に低コスト
- **Anonymizedモデル**: 直接API料金に近く、少額のVenice手数料が追加

### Venice（Anonymized）と直接APIの比較

| 項目 | Venice（Anonymized） | 直接API |
| ------------ | ----------------------------- | ------------------- |
| **プライバシー** | メタデータ削除、匿名化 | アカウントに紐付く |
| **レイテンシ** | +10〜50ms（プロキシ） | 直接 |
| **機能** | ほとんどの機能をサポート | 完全な機能 |
| **課金** | Veniceクレジット | プロバイダー課金 |

## 使用例

```bash
# デフォルトのprivateモデルを使う
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Venice経由でClaude Opusを使う（anonymized）
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# 無検閲モデルを使う
openclaw agent --model venice/venice-uncensored --message "Draft options"

# 画像付きでvisionモデルを使う
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# コーディングモデルを使う
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="APIキーが認識されない">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    キーが`vapi_`で始まっていることを確認してください。

  </Accordion>

  <Accordion title="モデルが利用できない">
    Veniceのモデルcatalogは動的に更新されます。現在利用可能なモデルを確認するには`openclaw models list`を実行してください。一部のモデルは一時的にオフラインになっている場合があります。
  </Accordion>

  <Accordion title="接続の問題">
    Venice APIは`https://api.venice.ai/api/v1`にあります。ネットワークでHTTPS接続が許可されていることを確認してください。
  </Accordion>
</AccordionGroup>

<Note>
さらにサポートが必要な場合: [トラブルシューティング](/ja-JP/help/troubleshooting)および[FAQ](/ja-JP/help/faq)。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="configファイルの例">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AIのホームページとアカウント登録。
  </Card>
  <Card title="APIドキュメント" href="https://docs.venice.ai" icon="book">
    Venice APIリファレンスと開発者向けドキュメント。
  </Card>
  <Card title="料金" href="https://venice.ai/pricing" icon="credit-card">
    現在のVeniceクレジット料金とプラン。
  </Card>
</CardGroup>
