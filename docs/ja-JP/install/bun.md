---
read_when:
    - もっとも高速なローカル開発ループ（bun + watch）を使いたい場合
    - Bun の install/patch/lifecycle script の問題に遭遇した場合
summary: 'Bun ワークフロー（実験的）: インストール方法と `pnpm` との違いによる注意点'
title: Bun（実験的）
x-i18n:
    generated_at: "2026-04-05T12:46:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun（実験的）

<Warning>
Bun は **Gateway ランタイムには推奨されません**（WhatsApp と Telegram で既知の問題があります）。本番環境では Node を使ってください。
</Warning>

Bun は、TypeScript を直接実行するための任意のローカルランタイムです（`bun run ...`、`bun --watch ...`）。デフォルトのパッケージマネージャーは引き続き `pnpm` であり、完全にサポートされていて、ドキュメントツールでも使われています。Bun は `pnpm-lock.yaml` を使用できず、それを無視します。

## インストール

<Steps>
  <Step title="依存関係をインストール">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore されているため、リポジトリに変更ノイズは発生しません。lockfile の書き込み自体を完全にスキップするには、次を使います:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="ビルドしてテスト">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lifecycle Scripts

Bun は、依存関係の lifecycle script を明示的に信頼しない限りブロックします。このリポジトリでは、よくブロックされる script は必須ではありません:

- `@whiskeysockets/baileys` `preinstall` -- Node major >= 20 をチェックします（OpenClaw のデフォルトは Node 24 で、現在は Node 22 LTS（`22.14+`）も引き続きサポートしています）
- `protobufjs` `postinstall` -- 互換性のないバージョンスキームに関する警告を出します（ビルド成果物はありません）

これらの script が必要なランタイム問題に遭遇した場合は、明示的に信頼してください:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意点

一部の script は依然として `pnpm` をハードコードしています（たとえば `docs:build`、`ui:*`、`protocol:check`）。現時点では、それらは `pnpm` 経由で実行してください。
