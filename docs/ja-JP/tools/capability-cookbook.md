---
read_when:
    - 新しいコア機能とプラグイン登録用の公開面を追加するとき
    - コードを core、vendor plugin、feature plugin のどこに置くべきか判断するとき
    - channels や tools 向けの新しい runtime helper を配線するとき
sidebarTitle: Adding Capabilities
summary: OpenClaw プラグインシステムに新しい共有機能を追加するためのコントリビューターガイド
title: 機能の追加（コントリビューターガイド）
x-i18n:
    generated_at: "2026-04-05T12:58:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# 機能の追加

<Info>
  これは OpenClaw の core 開発者向けの**コントリビューターガイド**です。外部 plugin を構築している場合は、代わりに [Building Plugins](/ja-JP/plugins/building-plugins) を参照してください。
</Info>

OpenClaw に、画像生成、動画生成、または将来の vendor 支援型機能領域のような新しいドメインが必要になったときに、これを使ってください。

ルールは次のとおりです。

- plugin = 所有境界
- capability = 共有された core 契約

つまり、vendor を直接 channel や tool に配線することから始めるべきではありません。まず capability を定義してください。

## 機能を作成するタイミング

次のすべてが当てはまる場合に、新しい機能を作成してください。

1. 複数の vendor がもっともらしく実装できる
2. channels、tools、または feature plugins が vendor を意識せずにそれを利用すべきである
3. core が fallback、policy、config、または配信動作を所有する必要がある

作業が vendor 専用で、まだ共有契約が存在しないなら、そこで止まり、先に契約を定義してください。

## 標準的な手順

1. 型付きの core 契約を定義する。
2. その契約のための plugin 登録を追加する。
3. 共有 runtime helper を追加する。
4. 実例として実在する vendor plugin を 1 つ配線する。
5. feature/channel の利用側を runtime helper に移行する。
6. 契約テストを追加する。
7. operator 向けの config と所有モデルを文書化する。

## 何をどこに置くか

Core:

- request/response の型
- provider registry と解決
- fallback 動作
- config schema と、ネストされた object、wildcard、array-item、composition ノードに伝播される `title` / `description` の docs metadata
- runtime helper の公開面

Vendor plugin:

- vendor API 呼び出し
- vendor 認証処理
- vendor 固有のリクエスト正規化
- capability 実装の登録

Feature/channel plugin:

- `api.runtime.*` または対応する `plugin-sdk/*-runtime` helper を呼び出す
- vendor 実装を直接呼び出してはならない

## ファイルチェックリスト

新しい機能では、次の領域に触れることになるはずです。

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- 1 つ以上の同梱 plugin パッケージ
- config/docs/tests

## 例: 画像生成

画像生成は標準形に従います。

1. core が `ImageGenerationProvider` を定義する
2. core が `registerImageGenerationProvider(...)` を公開する
3. core が `runtime.imageGeneration.generate(...)` を公開する
4. `openai`、`google`、`fal`、`minimax` の plugins が vendor 支援型実装を登録する
5. 将来の vendor も、channels/tools を変更せずに同じ契約を登録できる

config キーは vision-analysis ルーティングとは分離されています。

- `agents.defaults.imageModel` = 画像を解析する
- `agents.defaults.imageGenerationModel` = 画像を生成する

fallback と policy を明示的に保てるよう、これらは分けておいてください。

## レビューチェックリスト

新しい機能を出荷する前に、次を確認してください。

- どの channel/tool も vendor コードを直接 import していない
- runtime helper が共有経路になっている
- 少なくとも 1 つの契約テストが同梱所有を検証している
- config docs に新しい model/config キーが記載されている
- plugin docs が所有境界を説明している

PR が capability レイヤーを飛ばして vendor の挙動を
channel/tool にハードコードしている場合は、差し戻して、先に契約を定義してください。
