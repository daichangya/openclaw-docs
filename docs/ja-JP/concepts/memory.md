---
read_when:
    - メモリの仕組みを理解したい場合
    - どのメモリファイルに書き込むべきか知りたい場合
summary: OpenClawがセッションをまたいで物事を記憶する方法
title: Memory Overview
x-i18n:
    generated_at: "2026-04-05T12:41:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Memory Overview

OpenClawは、エージェントのワークスペースに**プレーンなMarkdownファイル**を書き込むことで物事を記憶します。
モデルが「記憶」するのはディスクに保存されたものだけであり、隠れた状態はありません。

## 仕組み

エージェントには、メモリを保存する場所が2つあります。

- **`MEMORY.md`** -- 長期メモリ。永続的な事実、設定、決定です。すべてのDMセッションの開始時に読み込まれます。
- **`memory/YYYY-MM-DD.md`** -- 日次ノート。進行中のコンテキストと観察内容です。
  今日と昨日のノートが自動的に読み込まれます。

これらのファイルはエージェントワークスペース内にあります（デフォルトは `~/.openclaw/workspace`）。

<Tip>
エージェントに何かを記憶させたい場合は、単にこう頼んでください: 「TypeScriptを好むことを覚えておいて。」
エージェントはそれを適切なファイルに書き込みます。
</Tip>

## メモリツール

エージェントには、メモリを扱うためのツールが2つあります。

- **`memory_search`** -- 元の表現と文言が異なっていても、セマンティック検索を使って関連するノートを見つけます。
- **`memory_get`** -- 特定のメモリファイルまたは行範囲を読み取ります。

どちらのツールも、アクティブなメモリpluginによって提供されます（デフォルト: `memory-core`）。

## メモリ検索

埋め込みプロバイダーが設定されている場合、`memory_search` は**ハイブリッド検索**を使用します。これは、ベクトル類似度
（意味的な近さ）とキーワード一致（IDやコードシンボルのような正確な用語）を組み合わせるものです。
サポートされている任意のプロバイダーのAPIキーを用意すれば、すぐに使えます。

<Info>
OpenClawは、利用可能なAPIキーから埋め込みプロバイダーを自動検出します。
OpenAI、Gemini、Voyage、またはMistralのキーが設定されていれば、
メモリ検索は自動的に有効になります。
</Info>

検索の仕組み、チューニングオプション、プロバイダー設定の詳細については、
[Memory Search](/concepts/memory-search) を参照してください。

## メモリバックエンド

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/concepts/memory-builtin">
SQLiteベースです。キーワード検索、ベクトル類似度、
ハイブリッド検索を追加の依存関係なしでそのまま利用できます。
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
ローカルファーストのsidecarで、再ランキング、クエリ拡張、
ワークスペース外のディレクトリをインデックスできる機能を備えています。
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
ユーザーモデリング、セマンティック検索、
マルチエージェント認識を備えたAIネイティブなクロスセッションメモリです。
pluginのインストールが必要です。
</Card>
</CardGroup>

## 自動メモリフラッシュ

[compaction](/concepts/compaction) が会話を要約する前に、OpenClawは
重要なコンテキストをメモリファイルに保存するようエージェントに促すサイレントターンを実行します。
これはデフォルトで有効であり、設定は不要です。

<Tip>
メモリフラッシュにより、compaction中のコンテキスト消失を防げます。
会話内に重要な事実があり、まだファイルに書き込まれていない場合は、
要約が行われる前に自動的に保存されます。
</Tip>

## Dreaming（実験的）

Dreamingは、メモリのための任意のバックグラウンド統合パスです。
日次ファイル（`memory/YYYY-MM-DD.md`）から短期リコールを再訪し、スコアを付け、
条件を満たした項目だけを長期メモリ（`MEMORY.md`）へ昇格させます。

これは、長期メモリのシグナル密度を高く保つよう設計されています。

- **オプトイン**: デフォルトでは無効です。
- **スケジュール実行**: 有効にすると、`memory-core` が定期タスクを自動的に管理します。
- **しきい値あり**: 昇格は、スコア、リコール頻度、クエリ多様性のゲートを通過する必要があります。

モードの挙動（`off`、`core`、`rem`、`deep`）、スコアリングシグナル、チューニング項目については、
[Dreaming (experimental)](/concepts/memory-dreaming) を参照してください。

## CLI

```bash
openclaw memory status          # インデックス状態とプロバイダーを確認
openclaw memory search "query"  # コマンドラインから検索
openclaw memory index --force   # インデックスを再構築
```

## さらに読む

- [Builtin Memory Engine](/concepts/memory-builtin) -- デフォルトのSQLiteバックエンド
- [QMD Memory Engine](/concepts/memory-qmd) -- 高機能なローカルファーストsidecar
- [Honcho Memory](/concepts/memory-honcho) -- AIネイティブなクロスセッションメモリ
- [Memory Search](/concepts/memory-search) -- 検索パイプライン、プロバイダー、
  チューニング
- [Dreaming (experimental)](/concepts/memory-dreaming) -- 短期リコールから長期メモリへの
  バックグラウンド昇格
- [Memory configuration reference](/reference/memory-config) -- すべての設定項目
- [Compaction](/concepts/compaction) -- compactionがメモリにどう関わるか
