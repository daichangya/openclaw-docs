---
read_when:
    - Node 専用の開発スクリプトや watch モードの失敗のデバッグ
    - OpenClaw における tsx/esbuild ローダーのクラッシュ調査
summary: Node + tsx の「`__name is not a function`」クラッシュに関するメモと回避策
title: Node + tsx のクラッシュ
x-i18n:
    generated_at: "2026-04-19T01:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx の「`\_\_name is not a function`」クラッシュ

## 概要

Node で `tsx` を使って OpenClaw を実行すると、起動時に次のエラーで失敗します。

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

これは開発スクリプトを Bun から `tsx` に切り替えた後に発生し始めました（コミット `2871657e`, 2026-01-06）。同じランタイムパスは Bun では動作していました。

## 環境

- Node: v25.x（v25.3.0 で確認）
- tsx: 4.21.0
- OS: macOS（Node 25 が動作する他のプラットフォームでも再現する可能性あり）

## 再現手順（Node のみ）

```bash
# リポジトリルートで実行
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
- Node 24: この環境では未インストール。確認が必要

## メモ / 仮説

- `tsx` は TypeScript/ESM の変換に esbuild を使用します。esbuild の `keepNames` は `__name` ヘルパーを出力し、関数定義を `__name(...)` でラップします。
- このクラッシュは、ランタイムで `__name` は存在するものの関数ではないことを示しています。つまり、Node 25 のローダーパスにおいて、このモジュールのヘルパーが欠落しているか上書きされていることを意味します。
- 同様の `__name` ヘルパー問題は、ヘルパーが欠落または書き換えられた場合に、他の esbuild 利用環境でも報告されています。

## 回帰履歴

- `2871657e` (2026-01-06): Bun を必須にしないため、スクリプトを Bun から tsx に変更。
- それ以前（Bun 経路）では、`openclaw status` と `gateway:watch` は動作していました。

## 回避策

- 開発スクリプトには Bun を使う（現在の一時的な差し戻し）。
- リポジトリの型チェックには `tsgo` を使い、その後ビルド済み出力を実行する。

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 履歴上の補足: この Node/tsx 問題のデバッグ中には `tsc` も使われていましたが、現在のリポジトリの型チェックレーンは `tsgo` を使います。
- 可能であれば、TS ローダーで esbuild の keepNames を無効化する（`__name` ヘルパーの挿入を防げる）。現時点では tsx からはこれを公開していません。
- `tsx` と組み合わせて Node LTS（22/24）を検証し、これが Node 25 固有の問題かどうかを確認する。

## 参考

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 次のステップ

- Node 22/24 で再現し、Node 25 の回帰かどうかを確認する。
- `tsx` の nightly を試すか、既知の回帰があるなら以前のバージョンに固定する。
- Node LTS でも再現する場合は、`__name` のスタックトレースを含む最小再現を upstream に報告する。
