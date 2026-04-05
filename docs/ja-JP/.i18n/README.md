---
x-i18n:
    generated_at: "2026-04-05T12:34:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: adff26fa8858af2759b231ea48bfc01f89c110cd9b3774a8f783e282c16f77fb
    source_path: .i18n/README.md
    workflow: 15
---

# OpenClaw ドキュメント i18n アセット

このフォルダーには、ソースドキュメントリポジトリ用の翻訳設定が保存されています。

生成されたロケールツリーとライブ翻訳メモリは現在、公開リポジトリにあります。

- リポジトリ: `openclaw/docs`
- ローカルチェックアウト: `~/Projects/openclaw-docs`

## 信頼できる唯一の情報源

- 英語ドキュメントは `openclaw/openclaw` で作成されます。
- ソースドキュメントツリーは `docs/` 配下にあります。
- ソースリポジトリには、`docs/zh-CN/**`、`docs/ja-JP/**`、`docs/es/**`、`docs/pt-BR/**`、`docs/ko/**`、`docs/de/**`、`docs/fr/**`、`docs/ar/**` などの生成済みロケールツリーは、もはやコミットされた状態では保持されていません。

## エンドツーエンドのフロー

1. `openclaw/openclaw` で英語ドキュメントを編集します。
2. `main` にプッシュします。
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` がドキュメントツリーを `openclaw/docs` にミラーリングします。
4. sync スクリプトは公開側の `docs/docs.json` を書き換え、ソースリポジトリにはもはやコミットされていなくても、そこで生成されたロケールピッカーブロックが存在するようにします。
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` は、`docs/zh-CN/**` を 1 日 1 回、オンデマンド、およびソースリポジトリのリリース dispatch 後に更新します。
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml` も `docs/ja-JP/**` に対して同じことを行います。
7. `openclaw/docs/.github/workflows/translate-es.yml`、`translate-pt-br.yml`、`translate-ko.yml`、`translate-de.yml`、`translate-fr.yml`、`translate-ar.yml` も、`docs/es/**`、`docs/pt-BR/**`、`docs/ko/**`、`docs/de/**`、`docs/fr/**`、`docs/ar/**` に対して同じことを行います。

## この分割が存在する理由

- 生成されたロケール出力をメインの製品リポジトリの外に出しておくため。
- Mintlify を単一の公開ドキュメントツリー上で維持するため。
- 公開リポジトリに生成済みロケールツリーを管理させることで、組み込みの言語スイッチャーを維持するため。

## このフォルダー内のファイル

- `glossary.<lang>.json` — プロンプトガイダンスとして使われる推奨用語マッピング。
- `ar-navigation.json`、`de-navigation.json`、`es-navigation.json`、`fr-navigation.json`、`ja-navigation.json`、`ko-navigation.json`、`pt-BR-navigation.json`、`zh-Hans-navigation.json` — sync 中に公開リポジトリへ再挿入される Mintlify のロケールピッカーブロック。
- `<lang>.tm.jsonl` — ワークフロー + モデル + テキストハッシュをキーにした翻訳メモリ。

このリポジトリでは、`docs/.i18n/zh-CN.tm.jsonl`、`docs/.i18n/ja-JP.tm.jsonl`、`docs/.i18n/es.tm.jsonl`、`docs/.i18n/pt-BR.tm.jsonl`、`docs/.i18n/ko.tm.jsonl`、`docs/.i18n/de.tm.jsonl`、`docs/.i18n/fr.tm.jsonl`、`docs/.i18n/ar.tm.jsonl` などの生成済みロケール TM ファイルは、意図的にもはやコミットされていません。

## 用語集の形式

`glossary.<lang>.json` は、エントリーの配列です。

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

フィールド:

- `source`: 優先したい英語（またはソース）フレーズ。
- `target`: 優先する翻訳出力。

## 翻訳の仕組み

- `scripts/docs-i18n` は引き続き翻訳生成を管理します。
- ドキュメントモードでは、各翻訳ページに `x-i18n.source_hash` が書き込まれます。
- 各公開ワークフローは、現在の英語ソースハッシュと保存されているロケールの `x-i18n.source_hash` を比較して、保留ファイルリストを事前計算します。
- 保留件数が `0` の場合、高コストな翻訳ステップは完全にスキップされます。
- 保留ファイルがある場合、ワークフローはそのファイルだけを翻訳します。
- 公開ワークフローは一時的なモデル形式の失敗を再試行しますが、同じハッシュチェックが再試行ごとに実行されるため、変更のないファイルは引き続きスキップされます。
- ソースリポジトリは、公開済み GitHub リリースの後に zh-CN、ja-JP、es、pt-BR、ko、de、fr、ar の更新も dispatch するため、リリースドキュメントは毎日の cron を待たずに追従できます。

## 運用メモ

- sync メタデータは、公開リポジトリの `.openclaw-sync/source.json` に書き込まれます。
- ソースリポジトリのシークレット: `OPENCLAW_DOCS_SYNC_TOKEN`
- 公開リポジトリのシークレット: `OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- ロケール出力が古く見える場合は、まず `openclaw/docs` の対応する `Translate <locale>` ワークフローを確認してください。
