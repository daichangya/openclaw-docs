---
read_when:
    - 新しいcore capabilityとPlugin登録面の追加
    - コードをcore、vendor Plugin、またはfeature Pluginのどこに置くべきかを判断すること
    - チャネルまたはツール向けの新しいランタイムhelperの配線
sidebarTitle: Adding Capabilities
summary: OpenClaw Pluginシステムに新しい共有capabilityを追加するためのコントリビューターガイド
title: capabilityの追加（コントリビューターガイド）
x-i18n:
    generated_at: "2026-04-24T09:02:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  これはOpenClaw core開発者向けの**コントリビューターガイド**です。外部Pluginを作成している場合は、代わりに[Building Plugins](/ja-JP/plugins/building-plugins)を参照してください。
</Info>

これは、OpenClawが画像生成、動画生成、または将来のvendor支援機能領域のような新しいドメインを必要とするときに使います。

ルールは次のとおりです。

- plugin = 所有境界
- capability = 共有core契約

つまり、vendorを直接チャネルやツールへ配線することから始めてはいけません。まずcapabilityを定義することから始めてください。

## capabilityを作るべきタイミング

次のすべてに当てはまる場合、新しいcapabilityを作成してください。

1. 複数のvendorが実装する可能性がもっともらしくある
2. チャネル、ツール、またはfeature Pluginが、vendorを意識せずにそれを利用すべきである
3. coreがfallback、ポリシー、設定、または配信挙動を所有する必要がある

その作業がvendor専用で、共有契約がまだ存在しないなら、いったん止めて先に契約を定義してください。

## 標準的な手順

1. 型付きのcore契約を定義する。
2. その契約のPlugin登録を追加する。
3. 共有ランタイムhelperを追加する。
4. 証明として、実際のvendor Pluginを1つ配線する。
5. feature/チャネル利用側をランタイムhelperへ移行する。
6. 契約テストを追加する。
7. オペレーター向け設定と所有モデルをドキュメント化する。

## どこに何を置くか

Core:

- リクエスト/レスポンス型
- プロバイダーregistry + 解決
- fallback挙動
- 設定スキーマと、ネストしたobject、wildcard、配列項目、composition nodeへ伝播される`title` / `description`ドキュメントメタデータ
- ランタイムhelper面

Vendor Plugin:

- vendor API呼び出し
- vendor認証処理
- vendor固有のリクエスト正規化
- capability実装の登録

Feature/チャネルPlugin:

- `api.runtime.*`または対応する`plugin-sdk/*-runtime` helperを呼び出す
- vendor実装を直接呼び出してはならない

## ProviderとHarnessのシーム

その挙動が汎用エージェントループではなくモデルプロバイダー契約に属する場合は、providerフックを使ってください。例としては、トランスポート選択後のプロバイダー固有リクエストパラメータ、auth-profile優先、プロンプトoverlay、モデル/profile failover後のフォローアップfallback routingなどがあります。

その挙動がターンを実行しているランタイムに属する場合は、agent harnessフックを使ってください。ハーネスは、空の応答、reasoningのみ、planningのみの応答など、成功はしているが使えないattempt結果を分類できるため、外側のモデルfallbackポリシーが再試行を判断できます。

どちらのシームも狭く保ってください。

- coreはretry/fallbackポリシーを所有する
- provider Pluginはプロバイダー固有のリクエスト/auth/routing hintを所有する
- harness Pluginはランタイム固有のattempt分類を所有する
- サードパーティPluginは、core stateの直接変更ではなくhintを返す

## ファイルチェックリスト

新しいcapabilityでは、次の領域に触れることを想定してください。

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
- 1つ以上の同梱Pluginパッケージ
- config/docs/tests

## 例: 画像生成

画像生成は標準的な形に従います。

1. coreが`ImageGenerationProvider`を定義する
2. coreが`registerImageGenerationProvider(...)`を公開する
3. coreが`runtime.imageGeneration.generate(...)`を公開する
4. `openai`、`google`、`fal`、`minimax` Pluginがvendor支援実装を登録する
5. 将来のvendorも、チャネル/ツールを変更せずに同じ契約を登録できる

設定キーはvision-analysis routingとは分かれています。

- `agents.defaults.imageModel` = 画像を解析する
- `agents.defaults.imageGenerationModel` = 画像を生成する

fallbackとポリシーを明示的に保つため、これらは分けたままにしてください。

## レビューチェックリスト

新しいcapabilityを出荷する前に、次を確認してください。

- どのチャネル/ツールもvendorコードを直接importしていない
- ランタイムhelperが共有経路になっている
- 少なくとも1つの契約テストが同梱所有を検証している
- 設定ドキュメントに新しいモデル/設定キーが記載されている
- Pluginドキュメントが所有境界を説明している

PRがcapabilityレイヤーを飛ばしてチャネル/ツールにvendor挙動をハードコードしている場合は、差し戻して先に契約を定義してください。

## 関連

- [Plugin](/ja-JP/tools/plugin)
- [Creating skills](/ja-JP/tools/creating-skills)
- [Tools and plugins](/ja-JP/tools)
