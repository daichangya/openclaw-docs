---
read_when:
    - OpenClawで、より短い `exec` または `bash` tool resultを使いたいです
    - 同梱のtokenjuice pluginを有効にしたいです
    - tokenjuiceが何を変更し、何をそのままにするのかを理解する必要があります
summary: 任意の同梱pluginで、execおよびbash toolのノイズの多い結果をcompactにする
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T04:52:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` は、コマンド実行後にノイズの多い `exec` および `bash`
tool resultをcompact化する、任意の同梱pluginです。

変更するのは返される `tool_result` であり、コマンド自体ではありません。Tokenjuiceは
shell入力を書き換えず、コマンドを再実行せず、exit codeも変更しません。

現在これはPiのembedded実行に適用され、tokenjuiceはembeddedの
`tool_result` 経路にhookして、sessionへ戻る出力を切り詰めます。

## pluginを有効にする

最短手順:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

同等の方法:

```bash
openclaw plugins enable tokenjuice
```

OpenClawにはすでにこのpluginが同梱されています。別途 `plugins install`
や `tokenjuice install openclaw` の手順は不要です。

configを直接編集したい場合:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuiceが変更すること

- `exec` および `bash` のノイズの多い結果を、sessionへ戻す前にcompact化します。
- 元のコマンド実行自体には手を加えません。
- 正確なfile contentの読み取りや、tokenjuiceが生のまま残すべき他のコマンドは保持します。
- opt-inのままです。どこでも逐語的な出力が必要ならpluginを無効にしてください。

## 動作確認

1. pluginを有効にする。
2. `exec` を呼び出せるsessionを開始する。
3. `git status` のようなノイズの多いコマンドを実行する。
4. 返されたtool resultが、生のshell出力より短く、より構造化されていることを確認する。

## pluginを無効にする

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

または:

```bash
openclaw plugins disable tokenjuice
```
