---
read_when:
    - OpenClaw で Anthropic モデルを使いたい
summary: OpenClaw で API キーまたは Claude CLI を使って Anthropic Claude を利用する
title: Anthropic
x-i18n:
    generated_at: "2026-04-12T23:29:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e3dda5f98ade9d4c3841888103bfb43d59e075d358a701ed0ae3ffb8d5694a7
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic は **Claude** モデルファミリーを開発しています。OpenClaw は 2 つの認証経路をサポートしています。

- **API キー** — 従量課金制で Anthropic API に直接アクセスします（`anthropic/*` モデル）
- **Claude CLI** — 同じホスト上にある既存の Claude CLI ログインを再利用します

<Warning>
Anthropic のスタッフから、OpenClaw スタイルの Claude CLI 利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` の使用を許可済みとして扱います。

長期間稼働する Gateway ホストでは、Anthropic API キーが依然として最も明確で予測しやすい本番向けの経路です。

Anthropic の現在の公開ドキュメント:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
</Warning>

## はじめに

<Tabs>
  <Tab title="API キー">
    **最適な用途:** 標準的な API アクセスと従量課金。

    <Steps>
      <Step title="API キーを取得する">
        [Anthropic Console](https://console.anthropic.com/) で API キーを作成します。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 設定例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最適な用途:** 別の API キーなしで既存の Claude CLI ログインを再利用すること。

    <Steps>
      <Step title="Claude CLI がインストールされログイン済みであることを確認する">
        次で確認します。

        ```bash
        claude --version
        ```
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw は既存の Claude CLI 認証情報を検出して再利用します。
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI バックエンドのセットアップと実行時の詳細は、[CLI バックエンド](/ja-JP/gateway/cli-backends) にあります。
    </Note>

    <Tip>
    最も明確な課金経路が必要な場合は、代わりに Anthropic API キーを使用してください。OpenClaw は [OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/glm) のサブスクリプション形式のオプションもサポートしています。
</Tip>

  </Tab>
</Tabs>

## thinking のデフォルト（Claude 4.6）

Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、OpenClaw ではデフォルトで `adaptive` thinking になります。

メッセージ単位では `/think:<level>`、または model params で上書きします。

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
関連する Anthropic ドキュメント:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## プロンプトキャッシュ

OpenClaw は、API キー認証に対して Anthropic のプロンプトキャッシュ機能をサポートしています。

| 値                  | キャッシュ期間 | 説明                                       |
| ------------------- | -------------- | ------------------------------------------ |
| `"short"`（デフォルト） | 5 分           | API キー認証に対して自動的に適用される     |
| `"long"`            | 1 時間         | 拡張キャッシュ                             |
| `"none"`            | キャッシュなし | プロンプトキャッシュを無効にする           |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="エージェントごとのキャッシュ上書き">
    model レベルの params をベースラインとして使用し、その後 `agents.list[].params` で特定のエージェントを上書きします。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    設定のマージ順序:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（一致する `id`、キー単位で上書き）

    これにより、同じモデル上で、あるエージェントは長時間保持されるキャッシュを使い、別のエージェントはバースト的で再利用の少ないトラフィック向けにキャッシュを無効化できます。

  </Accordion>

  <Accordion title="Bedrock Claude に関する注意">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されていれば `cacheRetention` のパススルーを受け付けます。
    - Anthropic 以外の Bedrock モデルは、実行時に `cacheRetention: "none"` に強制されます。
    - API キーのスマートデフォルトは、明示的な値が設定されていない場合、Claude-on-Bedrock ref に対しても `cacheRetention: "short"` を初期設定します。
  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="高速モード">
    OpenClaw の共有 `/fast` トグルは、直接の Anthropic トラフィック（`api.anthropic.com` への API キーおよび OAuth）をサポートします。

    | コマンド | 対応先 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 直接の `api.anthropic.com` リクエストに対してのみ注入されます。プロキシ経路では `service_tier` は変更されません。
    - `serviceTier` または `service_tier` の明示的な params が設定されている場合、両方が設定されていると `/fast` よりそちらが優先されます。
    - Priority Tier の容量がないアカウントでは、`service_tier: "auto"` は `standard` に解決されることがあります。
    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    バンドル済み Anthropic Plugin は、画像と PDF の理解を登録します。OpenClaw は設定された Anthropic auth からメディア機能を自動解決するため、追加設定は不要です。

    | プロパティ         | 値                   |
    | ------------------ | -------------------- |
    | デフォルトモデル   | `claude-opus-4-6`    |
    | サポートされる入力 | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw はそれを Anthropic のメディア理解 provider 経由で自動的にルーティングします。

  </Accordion>

  <Accordion title="100 万コンテキストウィンドウ（ベータ）">
    Anthropic の 100 万コンテキストウィンドウはベータ制限付きです。model ごとに有効化します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw はこれをリクエスト時に `anthropic-beta: context-1m-2025-08-07` にマッピングします。

    <Warning>
    Anthropic の認証情報で長文コンテキストアクセスが必要です。レガシーなトークン認証（`sk-ant-oat-*`）は 100 万コンテキストリクエストでは拒否されます。OpenClaw は警告をログに出し、標準のコンテキストウィンドウにフォールバックします。
</Warning>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー / トークンが突然無効になった">
    Anthropic のトークン認証は期限切れまたは取り消しになることがあります。新規セットアップでは、Anthropic API キーへ移行してください。
  </Accordion>

  <Accordion title='provider "anthropic" の API キーが見つかりません'>
    auth は**エージェントごと**です。新しいエージェントはメインエージェントのキーを継承しません。そのエージェントに対してオンボーディングを再実行するか、Gateway ホストで API キーを設定し、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='profile "anthropic:default" の認証情報が見つかりません'>
    `openclaw models status` を実行して、どの auth profile がアクティブか確認してください。オンボーディングを再実行するか、その profile パスに対して API キーを設定してください。
  </Accordion>

  <Accordion title="利用可能な auth profile がありません（すべてクールダウン中）">
    `openclaw models status --json` で `auth.unusableProfiles` を確認してください。Anthropic のレート制限クールダウンは model スコープである可能性があるため、兄弟の Anthropic model はまだ利用可能な場合があります。別の Anthropic profile を追加するか、クールダウンが終わるのを待ってください。
  </Accordion>
</AccordionGroup>

<Note>
詳細: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="CLI バックエンド" href="/ja-JP/gateway/cli-backends" icon="terminal">
    Claude CLI バックエンドのセットアップと実行時の詳細。
  </Card>
  <Card title="プロンプトキャッシュ" href="/ja-JP/reference/prompt-caching" icon="database">
    provider 間でのプロンプトキャッシュの仕組み。
  </Card>
  <Card title="OAuth と auth" href="/ja-JP/gateway/authentication" icon="key">
    auth の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>
