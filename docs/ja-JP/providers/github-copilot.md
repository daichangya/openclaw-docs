---
read_when:
    - モデルプロバイダーとして GitHub Copilot を使用したい場合
    - '`openclaw models auth login-github-copilot` フローが必要です'
summary: デバイスフローを使用して OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T19:20:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5169839322f64b24b194302b61c5bad67c6cb6595989f9a1ef65867d8b68659
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot は GitHub の AI コーディングアシスタントです。GitHub アカウントとプランで Copilot モデルにアクセスできます。OpenClaw は、2 つの異なる方法で Copilot をモデルプロバイダーとして使用できます。

## OpenClaw で Copilot を使う 2 つの方法

<Tabs>
  <Tab title="内蔵プロバイダー (github-copilot)">
    ネイティブのデバイスログインフローを使用して GitHub トークンを取得し、その後 OpenClaw の実行時にそれを Copilot API トークンと交換します。これは **デフォルト** であり、VS Code を必要としないため最も簡単な方法です。

    <Steps>
      <Step title="ログインコマンドを実行する">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL にアクセスして 1 回限りのコードを入力するよう求められます。完了するまでターミナルを開いたままにしてください。
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        または、config では次のようにします。

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 拡張機能をローカルブリッジとして使用します。OpenClaw はプロキシの `/v1` エンドポイントと通信し、そこで設定したモデル一覧を使用します。

    <Note>
    すでに VS Code で Copilot Proxy を実行している場合、またはそれを経由する必要がある場合は、こちらを選択してください。Plugin を有効にし、VS Code 拡張機能を実行したままにする必要があります。
    </Note>

  </Tab>
</Tabs>

## オプションフラグ

| Flag            | 説明                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | 確認プロンプトをスキップする                        |
| `--set-default` | プロバイダー推奨のデフォルトモデルも適用する |

```bash
# 確認をスキップ
openclaw models auth login-github-copilot --yes

# ログインし、デフォルトモデルも 1 ステップで設定
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="対話型 TTY が必要">
    デバイスログインフローには対話型 TTY が必要です。非対話型スクリプトや CI パイプラインではなく、ターミナルで直接実行してください。
  </Accordion>

  <Accordion title="モデルの利用可否はプランによって異なる">
    Copilot モデルの利用可否は GitHub プランによって異なります。モデルが拒否された場合は、別の ID を試してください（例: `github-copilot/gpt-4.1`）。
  </Accordion>

  <Accordion title="トランスポートの選択">
    Claude モデル ID は自動的に Anthropic Messages トランスポートを使用します。GPT、o-series、Gemini モデルは OpenAI Responses トランスポートのままです。OpenClaw はモデル ref に基づいて正しいトランスポートを選択します。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は、以下の優先順位で環境変数から Copilot 認証情報を解決します。

    | Priority | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最優先、Copilot 専用 |
    | 2        | `GH_TOKEN`            | GitHub CLI トークン（フォールバック）      |
    | 3        | `GITHUB_TOKEN`        | 標準の GitHub トークン（最下位）   |

    複数の変数が設定されている場合、OpenClaw は最優先のものを使用します。デバイスログインフロー (`openclaw models auth login-github-copilot`) はトークンを auth profile store に保存し、すべての環境変数よりも優先されます。

  </Accordion>

  <Accordion title="トークンの保存">
    ログインにより GitHub トークンが auth profile store に保存され、OpenClaw の実行時にそれが Copilot API トークンと交換されます。トークンを手動で管理する必要はありません。
  </Accordion>
</AccordionGroup>

<Warning>
対話型 TTY が必要です。ログインコマンドは、ヘッドレススクリプトや CI ジョブの中ではなく、ターミナルで直接実行してください。
</Warning>

## メモリ検索の埋め込み

GitHub Copilot は、[メモリ検索](/ja-JP/concepts/memory-search) の埋め込みプロバイダーとしても使用できます。Copilot サブスクリプションがあり、ログイン済みであれば、OpenClaw は別個の API キーなしで埋め込みにこれを使用できます。

### 自動検出

`memorySearch.provider` が `"auto"`（デフォルト）の場合、GitHub Copilot は優先度 15 で試されます。これはローカル埋め込みの後、OpenAI やその他の有料プロバイダーの前です。GitHub トークンが利用可能であれば、OpenClaw は Copilot API から利用可能な埋め込みモデルを検出し、最適なものを自動的に選択します。

### 明示的な設定

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // 任意: 自動検出されたモデルを上書き
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 仕組み

1. OpenClaw が GitHub トークンを解決します（環境変数または auth profile から）。
2. それを短期間有効な Copilot API トークンと交換します。
3. Copilot の `/models` エンドポイントを問い合わせて、利用可能な埋め込みモデルを検出します。
4. 最適なモデルを選択します（`text-embedding-3-small` を優先）。
5. Copilot の `/embeddings` エンドポイントに埋め込みリクエストを送信します。

モデルの利用可否は GitHub プランによって異なります。埋め込みモデルが利用できない場合、OpenClaw は Copilot をスキップして次のプロバイダーを試します。

## 関連

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用のルール。
  </Card>
</CardGroup>
