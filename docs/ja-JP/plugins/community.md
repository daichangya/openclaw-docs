---
read_when:
    - サードパーティの OpenClaw Plugin を探したい場合
    - 自分の Plugin を公開または一覧に載せたい場合
summary: 'コミュニティ管理の OpenClaw Plugin: 閲覧、インストール、自作 Plugin の投稿'
title: コミュニティ Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

コミュニティ Plugin は、OpenClaw に新しい
channel、tool、provider、その他の capability を追加するサードパーティパッケージです。これらはコミュニティによって構築・保守され、[ClawHub](/ja-JP/tools/clawhub) または npm で公開され、
単一コマンドでインストールできます。

ClawHub はコミュニティ Plugin の正規の発見面です。見つけやすくする目的だけで、このページに自分の Plugin を追加するための docs-only PR は開かないでください。代わりに ClawHub に公開してください。

```bash
openclaw plugins install <package-name>
```

OpenClaw はまず ClawHub を確認し、自動的に npm にフォールバックします。

## 一覧掲載された Plugin

### Apify

20,000 以上の既製 scraper を使って、任意の Web サイトからデータをスクレイプします。agent に依頼するだけで、Instagram、Facebook、TikTok、YouTube、Google Maps、Google Search、EC サイトなどからデータを抽出できます。

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Codex App Server conversation 用の独立した OpenClaw bridge。チャットを
Codex スレッドに bind し、プレーンテキストで会話し、resume、planning、review、model 選択、Compaction などをチャットネイティブコマンドで制御できます。

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Stream mode を使うエンタープライズロボット統合。任意の DingTalk クライアント経由でテキスト、画像、ファイルメッセージをサポートします。

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

OpenClaw 用の Lossless Context Management Plugin。DAG ベースの会話
要約と増分 Compaction により、トークン使用量を削減しつつ完全なコンテキスト忠実性を維持します。

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

agent trace を Opik にエクスポートする公式 Plugin。agent の動作、
コスト、トークン、エラーなどを監視できます。

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

OpenClaw agent に、リアルタイム lip-sync、感情表現、
text-to-speech を備えた Live2D アバターを与えます。AI アセット生成用の creator tool
と、Prometheus Marketplace へのワンクリックデプロイを含みます。現在 alpha です。

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

QQ Bot API を通じて OpenClaw を QQ に接続します。プライベートチャット、グループ
メンション、チャネルメッセージ、さらに音声、画像、動画、
ファイルを含むリッチメディアをサポートします。

現在の OpenClaw リリースには QQ Bot がバンドルされています。通常のインストールでは
[QQ Bot](/ja-JP/channels/qqbot) にあるバンドル済みセットアップを使ってください。この外部 Plugin は、
Tencent 管理のスタンドアロンパッケージを意図的に使いたい場合にのみインストールしてください。

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Tencent WeCom チームによる OpenClaw 向け WeCom channel Plugin。WeCom Bot WebSocket 永続接続で動作し、
ダイレクトメッセージとグループチャット、ストリーミング返信、能動的メッセージ送信、画像/ファイル処理、Markdown
書式設定、組み込みアクセス制御、文書/会議/メッセージング Skills をサポートします。

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## 自分の Plugin を投稿する

有用で、文書化されており、安全に運用できるコミュニティ Plugin を歓迎します。

<Steps>
  <Step title="ClawHub または npm に公開する">
    Plugin は `openclaw plugins install \<package-name\>` でインストール可能でなければなりません。
    [ClawHub](/ja-JP/tools/clawhub)（推奨）または npm に公開してください。
    完全なガイドについては [Building Plugins](/ja-JP/plugins/building-plugins) を参照してください。

  </Step>

  <Step title="GitHub でホストする">
    ソースコードは、セットアップドキュメントと issue
    tracker を備えた公開リポジトリに置かれている必要があります。

  </Step>

  <Step title="docs PR は source-doc 変更時にのみ使う">
    Plugin を見つけやすくするためだけの docs PR は不要です。代わりに
    ClawHub に公開してください。

    docs PR を開くのは、インストールガイダンスの修正や、メイン docs セットに属するクロスリポジトリ
    ドキュメントの追加など、OpenClaw の source docs に実際の内容変更が必要な場合だけにしてください。

  </Step>
</Steps>

## 品質基準

| 要件                        | 理由                                           |
| --------------------------- | ---------------------------------------------- |
| ClawHub または npm で公開済み | ユーザーが `openclaw plugins install` を使える必要がある |
| 公開 GitHub repo            | ソースレビュー、issue 追跡、透明性             |
| セットアップと使用方法の docs | ユーザーが設定方法を知る必要がある             |
| 継続的な保守                | 最近の更新、または responsive な issue 対応    |

低労力なラッパー、所有者が不明確なもの、または保守されていないパッケージは却下される場合があります。

## 関連

- [Plugin のインストールと設定](/ja-JP/tools/plugin) — 任意の Plugin のインストール方法
- [Building Plugins](/ja-JP/plugins/building-plugins) — 自分で作成する
- [Plugin Manifest](/ja-JP/plugins/manifest) — マニフェストスキーマ
