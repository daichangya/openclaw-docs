---
read_when:
    - メモリの仕組みを理解したい
    - どのメモリファイルに書き込めばよいか知りたい
summary: OpenClaw がセッションをまたいで情報をどのように記憶するか
title: メモリの概要
x-i18n:
    generated_at: "2026-04-09T01:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe47910f5bf1c44be379e971c605f1cb3a29befcf2a7ee11fb3833cbe3b9059
    source_path: concepts/memory.md
    workflow: 15
---

# メモリの概要

OpenClaw は、あなたのエージェントのワークスペースに **プレーンな Markdown ファイル** を書き込むことで情報を記憶します。モデルが「記憶」するのはディスクに保存された内容だけであり、隠れた状態は存在しません。

## 仕組み

エージェントには、メモリ関連のファイルが 3 つあります。

- **`MEMORY.md`** -- 長期メモリ。永続的な事実、設定、決定事項です。すべての DM セッションの開始時に読み込まれます。
- **`memory/YYYY-MM-DD.md`** -- 日次ノート。継続中のコンテキストと観察内容です。今日と昨日のノートは自動で読み込まれます。
- **`DREAMS.md`**（実験的、任意） -- 人が確認するための Dream Diary と dreaming sweep の要約で、根拠に基づく履歴バックフィルのエントリも含まれます。

これらのファイルはエージェントのワークスペース内にあります（デフォルトは `~/.openclaw/workspace`）。

<Tip>
エージェントに何かを覚えてほしい場合は、単に「Remember that I prefer TypeScript.」のように頼んでください。適切なファイルに書き込まれます。
</Tip>

## メモリツール

エージェントには、メモリを扱うためのツールが 2 つあります。

- **`memory_search`** -- 元の表現と文言が異なっていても、セマンティック検索を使って関連するノートを見つけます。
- **`memory_get`** -- 特定のメモリファイルまたは行範囲を読み取ります。

どちらのツールも、アクティブなメモリプラグイン（デフォルト: `memory-core`）によって提供されます。

## Memory Wiki コンパニオンプラグイン

永続メモリを単なる生のノートではなく、維持管理されたナレッジベースのように扱いたい場合は、同梱の `memory-wiki` プラグインを使用してください。

`memory-wiki` は、永続知識を次の要素を備えた wiki vault にコンパイルします。

- 決定論的なページ構造
- 構造化された主張と証拠
- 矛盾と鮮度の追跡
- 生成されたダッシュボード
- エージェント／ランタイム利用者向けのコンパイル済みダイジェスト
- `wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint` のような wiki ネイティブのツール

これはアクティブなメモリプラグインを置き換えるものではありません。アクティブなメモリプラグインは引き続き想起、昇格、dreaming を担当します。`memory-wiki` は、その隣に来歴が豊富な知識レイヤーを追加します。

[Memory Wiki](/ja-JP/plugins/memory-wiki) を参照してください。

## メモリ検索

埋め込みプロバイダーが設定されている場合、`memory_search` は **ハイブリッド検索** を使用します。これは、ベクトル類似性（意味的な近さ）とキーワード一致（ID やコードシンボルのような正確な語句）を組み合わせたものです。サポートされているいずれかのプロバイダーの API キーがあれば、そのまま利用できます。

<Info>
OpenClaw は、利用可能な API キーから埋め込みプロバイダーを自動検出します。OpenAI、Gemini、Voyage、または Mistral のキーが設定されていれば、メモリ検索は自動的に有効になります。
</Info>

検索の仕組み、調整オプション、プロバイダー設定の詳細については、[Memory Search](/ja-JP/concepts/memory-search) を参照してください。

## メモリバックエンド

<CardGroup cols={3}>
<Card title="組み込み（デフォルト）" icon="database" href="/ja-JP/concepts/memory-builtin">
SQLite ベース。キーワード検索、ベクトル類似性、ハイブリッド検索をそのまま利用できます。追加の依存関係は不要です。
</Card>
<Card title="QMD" icon="search" href="/ja-JP/concepts/memory-qmd">
ローカルファーストのサイドカーで、再ランキング、クエリ拡張、ワークスペース外のディレクトリをインデックス化する機能を備えます。
</Card>
<Card title="Honcho" icon="brain" href="/ja-JP/concepts/memory-honcho">
ユーザーモデリング、セマンティック検索、マルチエージェント認識を備えた、AI ネイティブなセッション横断メモリです。プラグインのインストールが必要です。
</Card>
</CardGroup>

## ナレッジ wiki レイヤー

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/ja-JP/plugins/memory-wiki">
永続メモリを、主張、ダッシュボード、ブリッジモード、Obsidian に適したワークフローを備えた、来歴が豊富な wiki vault にコンパイルします。
</Card>
</CardGroup>

## 自動メモリフラッシュ

[compaction](/ja-JP/concepts/compaction) が会話を要約する前に、OpenClaw は重要なコンテキストをメモリファイルに保存するようエージェントに促すサイレントターンを実行します。これはデフォルトで有効になっており、何かを設定する必要はありません。

<Tip>
メモリフラッシュは、compaction 中のコンテキスト損失を防ぎます。会話内に重要な事実があり、まだファイルに書き込まれていない場合は、要約が行われる前に自動的に保存されます。
</Tip>

## Dreaming（実験的）

Dreaming は、メモリのための任意のバックグラウンド統合パスです。短期的なシグナルを収集し、候補にスコアを付け、条件を満たした項目だけを長期メモリ（`MEMORY.md`）に昇格させます。

これは、長期メモリのシグナル密度を高く保つよう設計されています。

- **オプトイン**: デフォルトでは無効です。
- **スケジュール実行**: 有効にすると、`memory-core` が完全な dreaming sweep 用の定期 cron ジョブを 1 つ自動管理します。
- **しきい値あり**: 昇格は、スコア、想起頻度、クエリ多様性の各ゲートを通過する必要があります。
- **レビュー可能**: フェーズ要約と日誌エントリは、人が確認できるよう `DREAMS.md` に書き込まれます。

フェーズの挙動、スコアリングシグナル、Dream Diary の詳細については、[Dreaming（実験的）](/ja-JP/concepts/dreaming) を参照してください。

## 根拠に基づくバックフィルとライブ昇格

dreaming システムには、現在、密接に関連するレビュー経路が 2 つあります。

- **ライブ dreaming** は `memory/.dreams/` 配下の短期 dreaming ストアを使って動作し、通常の deep フェーズが何を `MEMORY.md` に昇格させられるか判断するときに使用されます。
- **根拠に基づくバックフィル** は履歴の `memory/YYYY-MM-DD.md` ノートを独立した日次ファイルとして読み取り、構造化されたレビュー出力を `DREAMS.md` に書き込みます。

根拠に基づくバックフィルは、古いノートを再生して、手動で `MEMORY.md` を編集せずに、システムが何を永続的と見なすかを確認したいときに便利です。

次のように使用した場合:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

根拠のある永続候補は直接昇格されません。代わりに、通常の deep フェーズがすでに使用している同じ短期 dreaming ストアにステージされます。つまり、次のようになります。

- `DREAMS.md` は引き続き人向けのレビュー画面です。
- 短期ストアは引き続きマシン向けのランキング画面です。
- `MEMORY.md` への書き込みは引き続き deep promotion によってのみ行われます。

再生が有用でなかったと判断した場合は、通常の日誌エントリや通常の想起状態に触れずに、ステージされた成果物を削除できます。

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # インデックスの状態とプロバイダーを確認
openclaw memory search "query"  # コマンドラインから検索
openclaw memory index --force   # インデックスを再構築
```

## さらに読む

- [Builtin Memory Engine](/ja-JP/concepts/memory-builtin) -- デフォルトの SQLite バックエンド
- [QMD Memory Engine](/ja-JP/concepts/memory-qmd) -- 高度なローカルファーストのサイドカー
- [Honcho Memory](/ja-JP/concepts/memory-honcho) -- AI ネイティブなセッション横断メモリ
- [Memory Wiki](/ja-JP/plugins/memory-wiki) -- コンパイル済みナレッジボールトと wiki ネイティブのツール
- [Memory Search](/ja-JP/concepts/memory-search) -- 検索パイプライン、プロバイダー、調整
- [Dreaming (experimental)](/ja-JP/concepts/dreaming) -- 短期想起から長期メモリへのバックグラウンド昇格
- [Memory configuration reference](/ja-JP/reference/memory-config) -- すべての設定項目
- [Compaction](/ja-JP/concepts/compaction) -- compaction がメモリとどう相互作用するか
