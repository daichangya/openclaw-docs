---
read_when:
    - モデル provider として GitHub Copilot を使いたい場合
    - '`openclaw models auth login-github-copilot` フローが必要な場合'
summary: デバイスフローを使って OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T13:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot は、GitHub の AI コーディングアシスタントです。GitHub アカウントとプランに応じて、Copilot モデルへアクセスできます。OpenClaw は、2 つの異なる方法で Copilot をモデル provider として使用できます。

## OpenClaw で Copilot を使う 2 つの方法

<Tabs>
  <Tab title="組み込み provider（github-copilot）">
    ネイティブなデバイスログインフローを使って GitHub token を取得し、その後 OpenClaw 実行時に
    Copilot API token へ交換します。これが**デフォルト**かつ最も簡単な方法です。
    VS Code を必要としないためです。

    <Steps>
      <Step title="ログインコマンドを実行する">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL にアクセスし、一度限りのコードを入力するよう求められます。
        完了するまで terminal を開いたままにしてください。
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        または config で:

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

  <Tab title="Copilot Proxy Plugin（copilot-proxy）">
    **Copilot Proxy** VS Code extension をローカルブリッジとして使います。OpenClaw は
    proxy の `/v1` endpoint と通信し、そこで設定されたモデル一覧を使用します。

    <Note>
    すでに VS Code で Copilot Proxy を動かしている場合や、そこ経由でルーティングする必要がある場合はこれを選んでください。Plugin を有効にし、VS Code extension を実行したままにする必要があります。
    </Note>

  </Tab>
</Tabs>

## 任意のフラグ

| Flag            | Description                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | 確認プロンプトをスキップする                        |
| `--set-default` | provider 推奨のデフォルトモデルも適用する           |

```bash
# 確認をスキップ
openclaw models auth login-github-copilot --yes

# ログインしてデフォルトモデルも一度に設定
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="対話型 TTY が必要">
    デバイスログインフローには対話型 TTY が必要です。非対話スクリプトや CI pipeline ではなく、
    terminal で直接実行してください。
  </Accordion>

  <Accordion title="利用可能なモデルはプランに依存">
    Copilot で利用できるモデルは GitHub プランに依存します。あるモデルが
    拒否された場合は、別の ID（たとえば `github-copilot/gpt-4.1`）を試してください。
  </Accordion>

  <Accordion title="Transport の選択">
    Claude の model ID は自動的に Anthropic Messages transport を使います。GPT、
    o-series、および Gemini モデルは OpenAI Responses transport のままです。OpenClaw は
    model ref に基づいて正しい transport を選択します。
  </Accordion>

  <Accordion title="リクエスト互換性">
    OpenClaw は Copilot transport に対して、IDE スタイルの Copilot request header を送信します。
    これには、組み込みの Compaction、tool-result、image follow-up turn が含まれます。
    Copilot の API に対してその動作が検証されていない限り、
    provider レベルの Responses continuation は有効にしません。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は、次の優先順位で環境変数から Copilot auth を解決します。

    | Priority | Variable              | Notes                              |
    | -------- | --------------------- | ---------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最優先、Copilot 専用                |
    | 2        | `GH_TOKEN`            | GitHub CLI token（フォールバック） |
    | 3        | `GITHUB_TOKEN`        | 標準 GitHub token（最下位）        |

    複数の変数が設定されている場合、OpenClaw は最優先のものを使用します。
    デバイスログインフロー（`openclaw models auth login-github-copilot`）は
    token を auth profile store に保存し、すべての環境変数より優先されます。

  </Accordion>

  <Accordion title="Token の保存">
    ログインにより GitHub token が auth profile store に保存され、OpenClaw 実行時に
    Copilot API token へ交換されます。手動で token を管理する必要はありません。
  </Accordion>
</AccordionGroup>

<Warning>
対話型 TTY が必要です。ログインコマンドは、headless script や CI job の中ではなく、
terminal で直接実行してください。
</Warning>

## memory search embeddings

GitHub Copilot は、
[memory search](/ja-JP/concepts/memory-search) 向けの embedding provider としても機能します。Copilot subscription があり、
ログイン済みであれば、OpenClaw は別の API key なしで embedding に利用できます。

### 自動検出

`memorySearch.provider` が `"auto"`（デフォルト）の場合、GitHub Copilot は
優先度 15 で試されます。これは local embedding の後、
OpenAI や他の有料 provider より前です。GitHub token が利用可能であれば、OpenClaw は
Copilot API から利用可能な embedding model を検出し、最適なものを自動選択します。

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

1. OpenClaw が GitHub token を解決する（env var または auth profile から）。
2. それを短命な Copilot API token に交換する。
3. Copilot の `/models` endpoint を問い合わせて、利用可能な embedding model を検出する。
4. 最適なモデルを選ぶ（`text-embedding-3-small` を優先）。
5. Copilot の `/embeddings` endpoint に embedding request を送る。

利用可能なモデルは GitHub プランに依存します。embedding model が
利用できない場合、OpenClaw は Copilot をスキップして次の provider を試します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、および failover 動作の選択。
  </Card>
  <Card title="OAuth と auth" href="/ja-JP/gateway/authentication" icon="key">
    auth の詳細と credential 再利用ルール。
  </Card>
</CardGroup>
