---
read_when:
    - セッションやチャネルをまたいで機能する永続メモリが必要な場合
    - AIを活用した想起機能とユーザーモデリングが必要な場合
summary: HonchoプラグインによるAIネイティブなセッション間メモリ
title: Honchoメモリ
x-i18n:
    generated_at: "2026-04-05T12:41:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ae3561152519a23589f754e0625f1e49c43e38f85de07686b963170a6cf229
    source_path: concepts/memory-honcho.md
    workflow: 15
---

# Honchoメモリ

[Honcho](https://honcho.dev) は、OpenClawにAIネイティブなメモリを追加します。会話を専用サービスに永続化し、時間の経過とともにユーザーとエージェントのモデルを構築することで、ワークスペースのMarkdownファイルを超えたセッション間コンテキストをエージェントに提供します。

## 提供されるもの

- **セッション間メモリ** -- 会話は各ターン後に永続化されるため、コンテキストはセッションのリセット、圧縮、チャネル切り替えをまたいで維持されます。
- **ユーザーモデリング** -- Honchoは各ユーザーについてのプロファイル（好み、事実、コミュニケーションスタイル）と、エージェントについてのプロファイル（性格、学習した振る舞い）を維持します。
- **セマンティック検索** -- 現在のセッションだけでなく、過去の会話からの観察内容を検索できます。
- **マルチエージェント認識** -- 親エージェントは生成されたサブエージェントを自動的に追跡し、子セッションでは親がオブザーバーとして追加されます。

## 利用可能なツール

Honchoは、会話中にエージェントが使用できるツールを登録します。

**データ取得（高速、LLM呼び出しなし）:**

| Tool                        | 役割                                           |
| --------------------------- | ---------------------------------------------- |
| `honcho_context`            | セッションをまたいだ完全なユーザー表現         |
| `honcho_search_conclusions` | 保存された結論に対するセマンティック検索       |
| `honcho_search_messages`    | セッションをまたいでメッセージを検索（送信者、日付で絞り込み） |
| `honcho_session`            | 現在のセッション履歴と要約                     |

**Q&A（LLM利用）:**

| Tool         | 役割                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| `honcho_ask` | ユーザーについて質問します。事実には`depth='quick'`、統合には`'thorough'`を使います |

## はじめに

プラグインをインストールしてセットアップを実行します。

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

セットアップコマンドはAPI認証情報の入力を求め、設定を書き込み、必要に応じて既存のワークスペースメモリファイルを移行します。

<Info>
Honchoは完全にローカル（セルフホスト）で実行することも、`api.honcho.dev` のマネージドAPI経由で実行することもできます。セルフホストオプションには外部依存関係は不要です。
</Info>

## 設定

設定は `plugins.entries["openclaw-honcho"].config` 配下にあります。

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // セルフホストでは省略
          workspaceId: "openclaw", // メモリの分離
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

セルフホスト環境では、`baseUrl` をローカルサーバー（たとえば `http://localhost:8000`）に向け、APIキーは省略してください。

## 既存メモリの移行

既存のワークスペースメモリファイル（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`）がある場合、`openclaw honcho setup` がそれらを検出し、移行を提案します。

<Info>
移行は非破壊です -- ファイルはHonchoにアップロードされます。元のファイルが削除または移動されることはありません。
</Info>

## 仕組み

各AIターンの後、会話はHonchoに永続化されます。ユーザーとエージェントの両方のメッセージが観察されるため、Honchoは時間の経過とともにモデルを構築し、洗練させていきます。

会話中、Honchoツールは `before_prompt_build` フェーズでサービスに問い合わせ、モデルがプロンプトを見る前に関連コンテキストを注入します。これにより、正確なターン境界と関連性の高い想起が確保されます。

## Honchoと組み込みメモリの比較

|                   | 組み込み / QMD                | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **保存先**        | ワークスペースMarkdownファイル | 専用サービス（ローカルまたはホスト型） |
| **セッション間**  | メモリファイル経由             | 自動、組み込み                       |
| **ユーザーモデリング** | 手動（`MEMORY.md`に記述）   | 自動プロファイル                     |
| **検索**          | ベクター + キーワード（ハイブリッド） | 観察内容に対するセマンティック検索   |
| **マルチエージェント** | 追跡されない               | 親子認識あり                         |
| **依存関係**      | なし（組み込み）またはQMDバイナリ | プラグインのインストール             |

Honchoと組み込みメモリシステムは併用できます。QMDが設定されている場合、Honchoのセッション間メモリと並行してローカルMarkdownファイルを検索するための追加ツールが利用可能になります。

## CLIコマンド

```bash
openclaw honcho setup                        # APIキーを設定してファイルを移行
openclaw honcho status                       # 接続状態を確認
openclaw honcho ask <question>               # ユーザーについてHonchoに問い合わせる
openclaw honcho search <query> [-k N] [-d D] # メモリに対するセマンティック検索
```

## さらに読む

- [Plugin source code](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho documentation](https://docs.honcho.dev)
- [Honcho OpenClaw integration guide](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/concepts/memory) -- OpenClawのメモリ概要
- [Context Engines](/concepts/context-engine) -- プラグインのコンテキストエンジンの仕組み
