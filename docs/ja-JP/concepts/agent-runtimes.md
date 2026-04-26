---
read_when:
    - Pi、Codex、ACP、または別のネイティブエージェントランタイムのどれを選ぶかを検討している場合
    - status や config に表示される provider/model/runtime のラベルに混乱している場合
    - ネイティブハーネスのサポート同等性をドキュメント化している場合
summary: OpenClaw がモデルプロバイダー、モデル、チャンネル、およびエージェントランタイムをどのように分離しているか
title: エージェントランタイム
x-i18n:
    generated_at: "2026-04-26T11:27:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**エージェントランタイム**は、準備済みの 1 つのモデルループを所有するコンポーネントです。プロンプトを受け取り、モデル出力を駆動し、ネイティブツール呼び出しを処理して、完了したターンを OpenClaw に返します。

ランタイムは、どちらもモデル設定の近くに現れるため、プロバイダーと混同しやすいですが、異なるレイヤーです。

| レイヤー             | 例                                    | 意味                                                           |
| -------------------- | ------------------------------------- | -------------------------------------------------------------- |
| プロバイダー         | `openai`, `anthropic`, `openai-codex` | OpenClaw がどのように認証し、モデルを検出し、model ref を命名するか。 |
| モデル               | `gpt-5.5`, `claude-opus-4-6`          | エージェントターンに選択されるモデル。                         |
| エージェントランタイム | `pi`, `codex`, `claude-cli`           | 準備済みターンを実行する低レベルのループまたはバックエンド。   |
| チャンネル           | Telegram, Discord, Slack, WhatsApp    | メッセージが OpenClaw に入出力される場所。                     |

コード内では **harness** という語も見かけます。harness はエージェントランタイムを提供する実装です。たとえば、バンドルされた Codex harness は `codex` ランタイムを実装します。公開 config では `agentRuntime.id` を使用し、`openclaw doctor --fix` は古い runtime-policy キーをその形に書き換えます。

ランタイムには 2 つのファミリーがあります。

- **組み込み harness** は OpenClaw の準備済みエージェントループ内で実行されます。現在は、組み込みの `pi` ランタイムと、`codex` など登録済みの Plugin harness が該当します。
- **CLI バックエンド** は、model ref を正規のまま保ちながらローカル CLI プロセスを実行します。たとえば、`agentRuntime.id: "claude-cli"` を伴う `anthropic/claude-opus-4-7` は、「Anthropic モデルを選び、Claude CLI 経由で実行する」という意味です。`claude-cli` は組み込み harness id ではないため、AgentHarness 選択に渡してはいけません。

## Codex という名前の 3 つのもの

混乱の大半は、Codex という名前を共有する 3 つの異なる面に由来します。

| 対象                                                 | OpenClaw 名 / config                  | 動作内容                                                                                             |
| ---------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Codex OAuth provider ルート                          | `openai-codex/*` model refs           | 通常の OpenClaw PI ランナーを通じて ChatGPT/Codex サブスクリプション OAuth を使用します。           |
| ネイティブ Codex app-server ランタイム               | `agentRuntime.id: "codex"`            | バンドルされた Codex app-server harness を通じて組み込みエージェントターンを実行します。            |
| Codex ACP アダプター                                 | `runtime: "acp"`, `agentId: "codex"`  | 外部 ACP/acpx 制御プレーンを通じて Codex を実行します。ACP/acpx が明示的に要求された場合にのみ使用します。 |
| ネイティブ Codex chat-control コマンドセット         | `/codex ...`                          | チャットから Codex app-server スレッドをバインド、再開、操作、停止、確認します。                    |
| GPT/Codex 系モデル向け OpenAI Platform API ルート    | `openai/*` model refs                 | `runtime: "codex"` のようなランタイム上書きでターンを実行しない限り、OpenAI API キー認証を使用します。 |

これらの面は意図的に独立しています。`codex` Plugin を有効にすると、ネイティブ app-server 機能が利用可能になりますが、`openai-codex/*` を `openai/*` に書き換えたり、既存セッションを変更したり、ACP を Codex のデフォルトにしたりはしません。`openai-codex/*` を選ぶとは、「別途ランタイムを強制しない限り、Codex OAuth provider ルートを使う」という意味です。

一般的な Codex セットアップでは、`codex` ランタイムとともに `openai` provider を使用します。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

これは、OpenClaw が OpenAI model ref を選択し、その後 Codex app-server ランタイムに組み込みエージェントターンの実行を依頼することを意味します。チャンネル、モデル provider カタログ、または OpenClaw セッションストアが Codex になるという意味ではありません。

バンドルされた `codex` Plugin が有効な場合、自然言語の Codex 制御には、ACP ではなくネイティブの `/codex` コマンド画面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`）を使用してください。Codex に ACP を使用するのは、ユーザーが ACP/acpx を明示的に要求した場合、または ACP アダプターパスをテストしている場合のみです。Claude Code、Gemini CLI、OpenCode、Cursor、および同様の外部 harness は引き続き ACP を使用します。

これはエージェント向けの判断フローです。

1. ユーザーが **Codex の bind/control/thread/resume/steer/stop** を求めている場合、バンドルされた `codex` Plugin が有効ならネイティブの `/codex` コマンド画面を使います。
2. ユーザーが **組み込みランタイムとしての Codex** を求めている場合、`agentRuntime.id: "codex"` とともに `openai/<model>` を使います。
3. ユーザーが **通常の OpenClaw ランナー上での Codex OAuth/subscription 認証** を求めている場合、`openai-codex/<model>` を使い、ランタイムは PI のままにします。
4. ユーザーが明示的に **ACP**、**acpx**、または **Codex ACP adapter** と言っている場合、`runtime: "acp"` と `agentId: "codex"` で ACP を使います。
5. リクエストが **Claude Code、Gemini CLI、OpenCode、Cursor、Droid、または別の外部 harness** 向けである場合、ネイティブ sub-agent ランタイムではなく ACP/acpx を使います。

| 意味しているもの                         | 使用するもの                                  |
| ---------------------------------------- | --------------------------------------------- |
| Codex app-server のチャット/スレッド制御 | バンドルされた `codex` Plugin の `/codex ...` |
| Codex app-server の組み込みエージェントランタイム | `agentRuntime.id: "codex"`            |
| PI ランナー上の OpenAI Codex OAuth       | `openai-codex/*` model refs                   |
| Claude Code または別の外部 harness       | ACP/acpx                                      |

OpenAI ファミリーのプレフィックス分割については、[OpenAI](/ja-JP/providers/openai) と
[Model providers](/ja-JP/concepts/model-providers) を参照してください。Codex ランタイムのサポート契約については、[Codex harness](/ja-JP/plugins/codex-harness#v1-support-contract) を参照してください。

## ランタイムの所有権

ランタイムごとに、ループの所有範囲は異なります。

| 対象                        | OpenClaw PI 組み込み                | Codex app-server                                                            |
| --------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| モデルループの所有者        | PI 組み込みランナー経由の OpenClaw  | Codex app-server                                                            |
| 正規スレッド状態            | OpenClaw transcript                 | Codex スレッド + OpenClaw transcript ミラー                                |
| OpenClaw 動的ツール         | ネイティブ OpenClaw ツールループ    | Codex アダプター経由でブリッジ                                              |
| ネイティブ shell/file ツール | PI/OpenClaw パス                    | Codex ネイティブツール。サポートされる場合はネイティブフック経由でブリッジ |
| コンテキストエンジン        | ネイティブ OpenClaw コンテキスト構築 | OpenClaw がプロジェクト化したコンテキストを Codex ターンに組み立て         |
| Compaction                  | OpenClaw または選択されたコンテキストエンジン | Codex ネイティブ Compaction + OpenClaw 通知とミラー保守              |
| チャンネル配信              | OpenClaw                            | OpenClaw                                                                    |

この所有権分割が主な設計ルールです。

- OpenClaw がその面を所有しているなら、通常の Plugin フック動作を提供できます。
- ネイティブランタイムがその面を所有しているなら、OpenClaw にはランタイムイベントまたはネイティブフックが必要です。
- ネイティブランタイムが正規スレッド状態を所有しているなら、OpenClaw は未サポートの内部状態を書き換えるのではなく、ミラーとコンテキスト投影を行うべきです。

## ランタイム選択

OpenClaw は、provider と model の解決後に組み込みランタイムを選択します。

1. セッションに記録されたランタイムが優先されます。config の変更で、既存 transcript が別のネイティブスレッドシステムにホットスイッチされることはありません。
2. `OPENCLAW_AGENT_RUNTIME=<id>` は、新規またはリセットされたセッションに対してそのランタイムを強制します。
3. `agents.defaults.agentRuntime.id` または `agents.list[].agentRuntime.id` では、`auto`、`pi`、`codex` のような登録済み組み込み harness id、または `claude-cli` のようなサポート対象 CLI バックエンドエイリアスを設定できます。
4. `auto` モードでは、登録済み Plugin ランタイムがサポートする provider/model ペアを claim できます。
5. `auto` モードでどのランタイムもターンを claim せず、`fallback: "pi"` が設定されている場合（デフォルト）、OpenClaw は互換性フォールバックとして PI を使用します。`auto` モードで一致しない選択を失敗させたい場合は、`fallback: "none"` を設定してください。

明示的な Plugin ランタイムは、デフォルトで fail closed です。たとえば、`runtime: "codex"` は、同じ上書きスコープに `fallback: "pi"` を設定しない限り、Codex になるか、明確な選択エラーになるかのどちらかです。ランタイム上書きは、より広い fallback 設定を継承しないため、デフォルトで `fallback: "pi"` を使っていたとしても、エージェントレベルの `runtime: "codex"` が黙って PI に戻されることはありません。

CLI バックエンドエイリアスは、組み込み harness id とは異なります。推奨される Claude CLI 形式は次のとおりです。

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

`claude-cli/claude-opus-4-7` のような古い ref も互換性のため引き続きサポートされますが、新しい config では provider/model を正規のまま保ち、実行バックエンドは `agentRuntime.id` に置くべきです。

`auto` モードは意図的に保守的です。Plugin ランタイムは理解できる provider/model ペアを claim できますが、Codex Plugin は `auto` モードで `openai-codex` provider を claim しません。これにより、`openai-codex/*` は明示的な PI Codex OAuth ルートのまま維持され、subscription 認証 config が黙ってネイティブ app-server harness に移行するのを防ぎます。

`openclaw doctor` が、`codex` Plugin は有効なのに `openai-codex/*` がまだ PI 経由でルーティングされていると警告した場合、それは移行ではなく診断として扱ってください。PI Codex OAuth を望んでいるなら config は変更しないでください。ネイティブ Codex app-server 実行を望む場合にのみ、`openai/<model>` と `agentRuntime.id: "codex"` に切り替えてください。

## 互換性契約

ランタイムが PI でない場合、それがサポートする OpenClaw の面を文書化する必要があります。ランタイムドキュメントには次の形を使用してください。

| 問い                                   | 重要である理由                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| モデルループの所有者は誰か             | リトライ、ツール継続、最終回答の判断がどこで行われるかを決定します。                           |
| 正規スレッド履歴の所有者は誰か         | OpenClaw が履歴を編集できるのか、ミラーしかできないのかを決定します。                          |
| OpenClaw 動的ツールは動作するか        | メッセージング、セッション、Cron、および OpenClaw 所有ツールはこれに依存します。              |
| 動的ツールフックは動作するか           | Plugin は、OpenClaw 所有ツールの周囲に `before_tool_call`、`after_tool_call`、middleware を期待します。 |
| ネイティブツールフックは動作するか     | shell、patch、およびランタイム所有ツールには、ポリシーと観測のためにネイティブフック対応が必要です。 |
| コンテキストエンジンのライフサイクルは動くか | memory とコンテキスト Plugin は、assemble、ingest、after-turn、および compaction ライフサイクルに依存します。 |
| どの compaction データが公開されるか   | 通知だけ必要な Plugin もあれば、保持/破棄メタデータが必要な Plugin もあります。                |
| 意図的に未サポートなものは何か         | ネイティブランタイムがより多くの状態を所有する場合、ユーザーは PI 同等性を想定すべきではありません。 |

Codex ランタイムのサポート契約は [Codex harness](/ja-JP/plugins/codex-harness#v1-support-contract) に文書化されています。

## ステータスラベル

status 出力には `Execution` と `Runtime` の両方のラベルが表示されることがあります。これらは provider 名ではなく、診断情報として読んでください。

- `openai/gpt-5.5` のような model ref は、選択された provider/model を示します。
- `codex` のような runtime id は、どのループがそのターンを実行しているかを示します。
- Telegram や Discord のような channel ラベルは、その会話がどこで行われているかを示します。

ランタイム config を変更した後もセッションに PI が表示される場合は、`/new` で新しいセッションを開始するか、`/reset` で現在のセッションをクリアしてください。既存セッションは記録されたランタイムを保持するため、1 つの transcript が互換性のない 2 つのネイティブセッションシステムを通して再生されることはありません。

## 関連

- [Codex harness](/ja-JP/plugins/codex-harness)
- [OpenAI](/ja-JP/providers/openai)
- [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)
- [Agent loop](/ja-JP/concepts/agent-loop)
- [Models](/ja-JP/concepts/models)
- [Status](/ja-JP/cli/status)
