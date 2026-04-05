---
read_when:
    - OpenClaw で Grok モデルを使いたい
    - xAI auth や model id を設定している
summary: OpenClaw で xAI Grok モデルを使う
title: xAI
x-i18n:
    generated_at: "2026-04-05T12:54:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw には、Grok モデル用のバンドル済み `xai` provider plugin が含まれています。

## セットアップ

1. xAI console で API key を作成します。
2. `XAI_API_KEY` を設定するか、次を実行します:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. 次のようなモデルを選びます:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw は現在、バンドル済み xAI 転送として xAI Responses API を使用します。同じ
`XAI_API_KEY` は、Grok ベースの `web_search`、ファーストクラスの `x_search`、
およびリモートの `code_execution` にも使えます。
xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存した場合、
バンドル済み xAI model provider は現在それを fallback としても再利用します。
`code_execution` の調整は `plugins.entries.xai.config.codeExecution` 配下にあります。

## 現在のバンドル済みモデルカタログ

OpenClaw には現在、次の xAI モデルファミリーがそのまま含まれています。

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

この plugin は、新しい `grok-4*` と `grok-code-fast*` の id についても、
同じ API 形状に従っている限り forward-resolve します。

高速モデルに関する注記:

- `grok-4-fast`、`grok-4-1-fast`、および `grok-4.20-beta-*` バリアントは、
  バンドル済みカタログ内の現在の image 対応 Grok ref です。
- `/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true`
  は、ネイティブ xAI request を次のように書き換えます:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

レガシー互換 alias も、引き続き正規のバンドル済み id に正規化されます。たとえば:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Web search

バンドル済みの `grok` web-search provider も `XAI_API_KEY` を使います。

```bash
openclaw config set tools.web.search.provider grok
```

## 既知の制限

- Auth は現在 API-key のみです。OpenClaw にはまだ xAI OAuth / device-code フローはありません。
- `grok-4.20-multi-agent-experimental-beta-0304` は、標準の OpenClaw xAI 転送とは異なる上流 API surface を必要とするため、通常の xAI provider path ではサポートされません。

## 注意

- OpenClaw は、共有 runner path 上で xAI 固有の tool-schema および tool-call 互換性修正を自動で適用します。
- ネイティブ xAI request はデフォルトで `tool_stream: true` です。これを無効にするには
  `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定してください。
- バンドル済み xAI wrapper は、ネイティブ xAI request を送信する前に、未対応の strict tool-schema フラグと
  reasoning payload key を除去します。
- `web_search`、`x_search`、`code_execution` は OpenClaw tools として公開されます。OpenClaw は、各 tool request の中で必要な特定の xAI built-in のみを有効化し、すべてのネイティブ tool をすべての chat turn に付与することはありません。
- `x_search` と `code_execution` は、core model runtime にハードコードされているのではなく、バンドル済み xAI plugin が所有しています。
- `code_execution` はリモートの xAI sandbox 実行であり、ローカルの [`exec`](/tools/exec) ではありません。
- より広い provider 概要については、[Model providers](/providers/index) を参照してください。
