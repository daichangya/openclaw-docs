---
read_when:
    - 送信チャンネル向けのMarkdown整形またはチャンク分割を変更している場合
    - 新しいチャンネルフォーマッターまたはスタイルマッピングを追加している場合
    - チャンネル間の整形回帰をデバッグしている場合
summary: 送信チャンネル向けのMarkdown整形パイプライン
title: Markdown Formatting
x-i18n:
    generated_at: "2026-04-05T12:41:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Markdown Formatting

OpenClawは、送信するMarkdownをチャンネル固有の出力へレンダリングする前に、共有の中間表現
（IR）へ変換して整形します。IRは、スタイル/リンクスパンを保持しつつソーステキストをそのまま維持するため、
チャンク分割とレンダリングをチャンネル間で一貫させることができます。

## 目標

- **一貫性:** 1回の解析ステップで、複数のレンダラーに対応します。
- **安全なチャンク分割:** レンダリング前にテキストを分割することで、インライン整形が
  チャンクをまたいで壊れないようにします。
- **チャンネル適合:** 同じIRをSlack mrkdwn、Telegram HTML、Signal
  スタイル範囲へマッピングし、Markdownを再解析しません。

## パイプライン

1. **Markdown -> IR を解析**
   - IRはプレーンテキストに加えて、スタイルスパン（bold/italic/strike/code/spoiler）とリンクスパンを持ちます。
   - オフセットはUTF-16コードユニットで、Signalのスタイル範囲がそのAPIと一致するようになっています。
   - テーブルは、チャンネルがテーブル変換を有効にしている場合にのみ解析されます。
2. **IRをチャンク分割（整形優先）**
   - チャンク分割は、レンダリング前のIRテキストに対して行われます。
   - インライン整形はチャンクをまたいで分割されず、スパンはチャンクごとに切り出されます。
3. **チャンネルごとにレンダリング**
   - **Slack:** mrkdwnトークン（bold/italic/strike/code）、リンクは `<url|label>`。
   - **Telegram:** HTMLタグ（`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`）。
   - **Signal:** プレーンテキスト + `text-style` 範囲。ラベルがURLと異なる場合、リンクは `label (url)` になります。

## IRの例

入力Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR（概略）:

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用箇所

- Slack、Telegram、Signalの送信アダプターはIRからレンダリングします。
- その他のチャンネル（WhatsApp、iMessage、Microsoft Teams、Discord）は引き続きプレーンテキストまたは
  独自の整形ルールを使用し、Markdownテーブル変換は有効な場合に
  チャンク分割前に適用されます。

## テーブル処理

Markdownテーブルは、チャットクライアント間で一貫してサポートされていません。
チャンネルごと（およびアカウントごと）の変換を制御するには `markdown.tables` を使用します。

- `code`: テーブルをコードブロックとしてレンダリングします（ほとんどのチャンネルのデフォルト）。
- `bullets`: 各行を箇条書きへ変換します（Signal + WhatsAppのデフォルト）。
- `off`: テーブルの解析と変換を無効にします。元のテーブルテキストがそのまま通過します。

設定キー:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## チャンク分割ルール

- チャンク上限はチャンネルアダプター/設定から取得され、IRテキストに適用されます。
- コードフェンスは末尾の改行を含む単一ブロックとして保持され、チャンネルで
  正しくレンダリングされるようにします。
- リスト接頭辞とblockquote接頭辞はIRテキストの一部なので、チャンク分割で
  接頭辞の途中が分割されることはありません。
- インラインスタイル（bold/italic/strike/inline-code/spoiler）はチャンクをまたいで
  分割されません。レンダラーは各チャンク内でスタイルを再オープンします。

チャンネル間のチャンク分割動作についてさらに知りたい場合は、
[Streaming + chunking](/concepts/streaming) を参照してください。

## リンクポリシー

- **Slack:** `[label](url)` -> `<url|label>`。裸のURLはそのまま維持されます。autolink
  は重複リンク化を避けるため、解析時に無効化されます。
- **Telegram:** `[label](url)` -> `<a href="url">label</a>`（HTML parse mode）。
- **Signal:** `[label](url)` -> `label (url)`。ただしラベルがURLと一致する場合は除きます。

## スポイラー

スポイラーマーカー（`||spoiler||`）はSignalでのみ解析され、そこで
SPOILERスタイル範囲にマッピングされます。その他のチャンネルではプレーンテキストとして扱われます。

## チャンネルフォーマッターを追加または更新する方法

1. **1回だけ解析:** チャンネルに適した
   オプション（autolink、heading style、blockquote prefix）で共有の `markdownToIR(...)` ヘルパーを使用します。
2. **レンダリング:** `renderMarkdownWithMarkers(...)` と
   スタイルマーカーマップ（またはSignalのスタイル範囲）を使ってレンダラーを実装します。
3. **チャンク分割:** レンダリング前に `chunkMarkdownIR(...)` を呼び出し、各チャンクをレンダリングします。
4. **アダプターに配線:** チャンネル送信アダプターを更新して、新しいチャンク分割機能と
   レンダラーを使用するようにします。
5. **テスト:** 整形テストを追加または更新し、その
   チャンネルがチャンク分割を使う場合は送信テストも追加または更新します。

## よくある落とし穴

- Slackの山括弧トークン（`<@U123>`, `<#C123>`, `<https://...>`）は
  保持する必要があります。生のHTMLは安全にエスケープしてください。
- Telegram HTMLでは、マークアップが壊れないようにタグ外のテキストをエスケープする必要があります。
- Signalのスタイル範囲はUTF-16オフセットに依存します。コードポイントオフセットは使用しないでください。
- フェンス付きコードブロックでは末尾の改行を保持し、閉じマーカーが
  専用の行に配置されるようにしてください。
