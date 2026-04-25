---
read_when:
    - 新しいコア機能と Plugin 登録サーフェスの追加
    - コードをコア、vendor Plugin、または機能 Plugin のどこに置くべきかを判断する
    - チャネルまたはツール向けの新しいランタイムヘルパーを配線する
sidebarTitle: Adding Capabilities
summary: OpenClaw Plugin システムに新しい共有機能を追加するためのコントリビューターガイド
title: 機能の追加（コントリビューターガイド）
x-i18n:
    generated_at: "2026-04-25T14:00:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  これは OpenClaw コア開発者向けの**コントリビューターガイド**です。外部 Plugin を構築している場合は、代わりに [Building Plugins](/ja-JP/plugins/building-plugins) を参照してください。
</Info>

OpenClaw に、画像生成、動画生成、または将来の vendor バックド機能領域のような新しいドメインが必要なときにこれを使用してください。

ルール:

- plugin = 所有境界
- capability = 共有コア契約

つまり、vendor をチャネルやツールに直接配線するところから始めてはいけません。まず capability を定義してください。

## capability を作成するタイミング

次のすべてが当てはまる場合に、新しい capability を作成してください。

1. 複数の vendor が実装する可能性が十分にある
2. チャネル、ツール、または機能 Plugin が、vendor を意識せずにそれを消費すべきである
3. コアがフォールバック、ポリシー、config、または配信動作を所有する必要がある

作業が vendor 専用で、まだ共有契約が存在しない場合は、いったん止めて先に契約を定義してください。

## 標準的な手順

1. 型付きコア契約を定義する。
2. その契約の Plugin 登録を追加する。
3. 共有ランタイムヘルパーを追加する。
4. 証拠として実際の vendor Plugin を 1 つ配線する。
5. 機能/チャネルのコンシューマーをランタイムヘルパーへ移行する。
6. 契約テストを追加する。
7. オペレーター向け config と所有モデルを文書化する。

## 何をどこに置くか

コア:

- リクエスト/レスポンス型
- provider レジストリ + 解決
- フォールバック動作
- config スキーマと、ネストしたオブジェクト、ワイルドカード、配列項目、合成ノードに伝播される `title` / `description` ドキュメントメタデータ
- ランタイムヘルパーサーフェス

vendor Plugin:

- vendor API 呼び出し
- vendor 認証処理
- vendor 固有のリクエスト正規化
- capability 実装の登録

機能/チャネル Plugin:

- `api.runtime.*` または対応する `plugin-sdk/*-runtime` ヘルパーを呼び出す
- vendor 実装を直接呼び出してはならない

## Provider とハーネスの継ぎ目

その動作が汎用エージェントループではなくモデル provider 契約に属する場合は、provider フックを使用してください。例としては、トランスポート選択後の provider 固有リクエストパラメーター、auth-profile の優先、プロンプトオーバーレイ、model/profile フェイルオーバー後のフォローアップフォールバックルーティングなどがあります。

その動作がターンを実行しているランタイムに属する場合は、agent ハーネスフックを使用してください。ハーネスは、成功しているが使用不可能な試行結果、たとえば空、推論のみ、または計画のみの応答を分類できるため、外側のモデルフォールバックポリシーが再試行を判断できます。

どちらの継ぎ目も狭く保ってください。

- コアは再試行/フォールバックポリシーを所有する
- provider Plugin は provider 固有のリクエスト/認証/ルーティングヒントを所有する
- ハーネス Plugin はランタイム固有の試行分類を所有する
- サードパーティ Plugin は、コア状態の直接変更ではなくヒントを返す

## ファイルチェックリスト

新しい capability では、次の領域に触れることを想定してください。

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
- 1 つ以上のバンドル済み Plugin パッケージ
- config/docs/tests

## 例: 画像生成

画像生成は標準的な形に従います。

1. コアが `ImageGenerationProvider` を定義する
2. コアが `registerImageGenerationProvider(...)` を公開する
3. コアが `runtime.imageGeneration.generate(...)` を公開する
4. `openai`、`google`、`fal`、`minimax` Plugin が vendor バックド実装を登録する
5. 将来の vendor も、チャネル/ツールを変更せずに同じ契約を登録できる

config キーは vision-analysis ルーティングとは別です。

- `agents.defaults.imageModel` = 画像を解析する
- `agents.defaults.imageGenerationModel` = 画像を生成する

フォールバックとポリシーを明示的に保つため、これらは分離してください。

## レビューチェックリスト

新しい capability を出荷する前に、次を確認してください。

- チャネル/ツールが vendor コードを直接インポートしていない
- ランタイムヘルパーが共有パスである
- 少なくとも 1 つの契約テストがバンドル所有権を検証している
- config ドキュメントが新しい model/config キーを名前付きで説明している
- Plugin ドキュメントが所有境界を説明している

PR が capability レイヤーを飛ばして vendor の動作をチャネル/ツールにハードコードしている場合は、差し戻して先に契約を定義してください。

## 関連

- [Plugin](/ja-JP/tools/plugin)
- [Creating skills](/ja-JP/tools/creating-skills)
- [Tools and plugins](/ja-JP/tools)
