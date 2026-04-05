---
read_when:
    - Node 専用の開発スクリプトや watch モードの失敗をデバッグしている
    - OpenClaw における tsx/esbuild ローダーのクラッシュを調査している
summary: Node + tsx の「__name is not a function」クラッシュに関するメモと回避策
title: Node + tsx クラッシュ
x-i18n:
    generated_at: "2026-04-05T12:42:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx の「\_\_name is not a function」クラッシュ

## 概要

`tsx` を使って Node 経由で OpenClaw を実行すると、起動時に次のように失敗します。

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

これは、開発スクリプトを Bun から `tsx` に切り替えた後（コミット `2871657e`、2026-01-06）に始まりました。同じランタイムパスは Bun では動作していました。

## 環境

- Node: v25.x（v25.3.0 で確認）
- tsx: 4.21.0
- OS: macOS（Node 25 を実行する他のプラットフォームでも再現する可能性が高い）

## 再現手順（Node のみ）

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## リポジトリ内の最小再現

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node バージョン確認

- Node 25.3.0: 失敗
- Node 22.22.0（Homebrew `node@22`）: 失敗
- Node 24: ここではまだ未インストール。確認が必要

## メモ / 仮説

- `tsx` は TS/ESM の変換に esbuild を使用します。esbuild の `keepNames` は `__name` ヘルパーを出力し、関数定義を `__name(...)` でラップします。
- このクラッシュは、実行時に `__name` は存在するが関数ではないことを示しており、Node 25 のローダーパスにおいて、このモジュールのヘルパーが欠落しているか上書きされていることを示唆します。
- 同様の `__name` ヘルパーの問題は、ヘルパーが欠落しているか書き換えられている場合に、他の esbuild 利用側でも報告されています。

## リグレッション履歴

- `2871657e`（2026-01-06）: Bun を必須にしないため、スクリプトが Bun から tsx に変更された
- それ以前（Bun パス）では、`openclaw status` と `gateway:watch` は動作していた

## 回避策

- 開発スクリプトには Bun を使う（現在の一時的な差し戻し）
- Node + tsc watch を使い、その後コンパイル済み出力を実行する:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- ローカルで確認済み: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` は Node 25 で動作する
- 可能であれば TS ローダーで esbuild の keepNames を無効にする（`__name` ヘルパーの挿入を防ぐ）。現時点で tsx はこれを公開していない
- Node LTS（22/24）で `tsx` をテストし、この問題が Node 25 固有かどうかを確認する

## 参照

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 次のステップ

- Node 22/24 で再現し、Node 25 のリグレッションかどうかを確認する
- `tsx` のナイトリー版を試すか、既知のリグレッションがあるなら以前のバージョンに固定する
- Node LTS でも再現する場合は、`__name` のスタックトレースを含む最小再現を upstream に報告する
