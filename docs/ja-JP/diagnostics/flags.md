---
read_when:
    - グローバルなログレベルを上げずに対象を絞ったデバッグログが必要
    - サポートのためにサブシステム固有のログを取得する必要がある
summary: 対象を絞ったデバッグログのための診断フラグ
title: 診断フラグ
x-i18n:
    generated_at: "2026-04-05T12:42:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# 診断フラグ

診断フラグを使うと、どこでも冗長なログを有効にせずに、対象を絞ったデバッグログを有効にできます。フラグはオプトイン方式で、サブシステム側で確認されない限り効果はありません。

## 仕組み

- フラグは文字列です（大文字小文字は区別しません）。
- フラグはconfigまたはenv overrideで有効にできます。
- ワイルドカードをサポートします:
  - `telegram.*` は `telegram.http` に一致します
  - `*` はすべてのフラグを有効にします

## configで有効化

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

複数のフラグ:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

フラグを変更した後はGatewayを再起動してください。

## env override（一時的）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

すべてのフラグを無効化:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## ログの出力先

フラグは標準のdiagnosticsログファイルにログを出力します。デフォルトでは次の場所です。

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` を設定している場合は、代わりにそのパスを使います。ログはJSONLです（1行に1つのJSONオブジェクト）。redactionは引き続き `logging.redactSensitive` に基づいて適用されます。

## ログを抽出する

最新のログファイルを選択します。

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP diagnosticsで絞り込みます。

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

または、再現しながらtailします。

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

リモートGatewayでは、`openclaw logs --follow` も使えます（[/cli/logs](/cli/logs) を参照）。

## 注意

- `logging.level` が `warn` より高く設定されている場合、これらのログは抑制されることがあります。デフォルトの `info` で問題ありません。
- フラグは有効のままでも安全です。特定のサブシステムに対するログ量にのみ影響します。
- ログの出力先、レベル、redactionを変更するには [/logging](/logging) を使ってください。
