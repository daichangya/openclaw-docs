---
read_when:
    - 実際のOpenClaw活用例を探しているとき
    - コミュニティプロジェクトのハイライトを更新しているとき
summary: OpenClawを活用したコミュニティ製プロジェクトと連携
title: ショーケース
x-i18n:
    generated_at: "2026-04-05T12:58:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2917e9a476ef527ddb3e51c610bbafbd145e705c9cc29f191639fb63d238ef70
    source_path: start/showcase.md
    workflow: 15
---

# ショーケース

コミュニティによる実際のプロジェクトです。OpenClawで人々が何を作っているのかをご覧ください。

<Info>
**掲載されたいですか？** [Discordの #self-promotion](https://discord.gg/clawd) であなたのプロジェクトを共有するか、[Xで @openclaw をタグ付け](https://x.com/openclaw)してください。
</Info>

## 🎥 動くOpenClaw

VelvetSharkによる完全セットアップ解説（28分）。

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTubeで視聴](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="OpenClaw showcase video"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTubeで視聴](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="OpenClaw community showcase"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTubeで視聴](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 Discord発の最新事例

<CardGroup cols={2}>

<Card title="PRレビュー → Telegramフィードバック" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCodeが変更を完了 → PRを作成 → OpenClawが差分をレビューし、「軽微な提案」と明確なマージ判断をTelegramで返信（先に適用すべき重要な修正も含む）。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="数分で作るワインセラーSkill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ローカルのワインセラーSkillを「Robby」(@openclaw) に依頼。サンプルCSVエクスポートと保存先を確認した後、Skillをすばやく作成してテストします（例では962本）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco買い物オートパイロット" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

毎週の献立 → 定番商品 → 配達枠の予約 → 注文確定。APIは使わず、ブラウザー操作のみです。

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG スクリーンショットからMarkdownへ" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

画面領域をホットキーで選択 → Gemini vision → クリップボードに即座にMarkdown。

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents、Claude、Codex、OpenClaw 間で Skills / コマンドを管理するためのデスクトップアプリです。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram音声ノート（papla.media）" icon="microphone" href="https://papla.media/docs">
  **コミュニティ** • `voice` `tts` `telegram`

papla.media の TTS をラップし、結果をTelegram音声ノートとして送信します（煩わしい自動再生なし）。

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Homebrewでインストールできるヘルパーで、ローカルのOpenAI Codexセッションを一覧表示・調査・監視できます（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3Dプリンター制御" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLabプリンターを制御し、トラブルシュートします: ステータス、ジョブ、カメラ、AMS、キャリブレーションなど。

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="ウィーン交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ウィーンの公共交通機関向けに、リアルタイム発車情報、運行障害、エレベーター状況、経路案内を提供します。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay学校給食" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

ParentPay経由の英国学校給食予約を自動化。表のセルを確実にクリックするため、マウス座標を使用します。
</Card>

<Card title="R2アップロード（Send Me My Files）" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3 にアップロードし、安全な事前署名付きダウンロードリンクを生成します。リモートOpenClawインスタンスに最適です。
</Card>

<Card title="Telegram経由のiOSアプリ" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

地図と音声録音を備えた完全なiOSアプリを作成し、TelegramチャットだけでTestFlightにデプロイしました。

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS app on TestFlight" />
</Card>

<Card title="Oura Ringヘルスアシスタント" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

Oura ring データをカレンダー、予定、ジムのスケジュールと統合した、個人向けAIヘルスアシスタントです。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>
<Card title="Kevのドリームチーム（14以上のエージェント）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

1つのGateway配下に14以上のエージェントを配置し、Opus 4.5 オーケストレーターがCodexワーカーに委任します。ドリームチームの構成、モデル選択、サンドボックス化、Webhook、ハートビート、委任フローを網羅した包括的な[技術解説](https://github.com/adam91holt/orchestrated-ai-articles)があります。エージェントのサンドボックス化には [Clawdspace](https://github.com/adam91holt/clawdspace) を使用。[ブログ記事](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/) もあります。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

エージェント型ワークフロー（Claude Code、OpenClaw）と統合する Linear 用CLIです。ターミナルから課題、プロジェクト、ワークフローを管理できます。最初の外部PRもマージされました！
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop経由でメッセージの閲覧、送信、アーカイブを行います。Beeper のローカルMCP APIを使うため、エージェントが iMessage、WhatsApp などすべてのチャットを一元管理できます。
</Card>

</CardGroup>

## 🤖 自動化とワークフロー

<CardGroup cols={2}>

<Card title="Winix空気清浄機制御" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Codeが清浄機の制御方法を発見して確認し、その後OpenClawが引き継いで室内空気品質を管理します。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="きれいな空のカメラショット" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

屋上カメラをトリガーに、「空がきれいに見えるときは空の写真を撮って」とOpenClawに依頼――Skillを設計して実際に撮影しました。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="ビジュアル朝ブリーフィングシーン" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

スケジュールされたプロンプトにより、毎朝1枚の「シーン」画像（天気、タスク、日付、お気に入りの投稿/引用）をOpenClawペルソナ経由で生成します。
</Card>

<Card title="パデルコート予約" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic の空き状況チェッカー兼予約CLIです。
  
  空いたコートを見逃しません。
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="会計書類取り込み" icon="file-invoice-dollar">
  **コミュニティ** • `automation` `email` `pdf`
  
  メールからPDFを収集し、税理士向けに書類を準備します。毎月の会計処理を自動化します。
</Card>

<Card title="ソファで開発モード" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Netflixを見ながらTelegram経由で個人サイト全体を再構築――Notion → Astro、18本の記事を移行し、DNSをCloudflareへ。ラップトップは一度も開きませんでした。
</Card>

<Card title="求人検索エージェント" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

求人一覧を検索し、CVキーワードとの一致を評価して、関連する機会をリンク付きで返します。JSearch API を使って30分で構築されました。
</Card>

<Card title="Jira Skillビルダー" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClawを Jira に接続し、その場で新しいSkillを生成しました（ClawHubに存在する前の段階で）。
</Card>

<Card title="Telegram経由のTodoist Skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoistタスクを自動化し、OpenClawにTelegramチャット内で直接Skillを生成させました。
</Card>

<Card title="TradingView分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ブラウザー自動化で TradingView にログインし、チャートをスクリーンショットし、必要に応じてテクニカル分析を行います。APIは不要で、必要なのはブラウザー操作だけです。
</Card>

<Card title="Slack自動サポート" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

社内Slackチャネルを監視し、役立つ応答を返し、通知をTelegramに転送します。依頼されていないのに、本番環境のアプリのバグを自律的に修正しました。
</Card>

</CardGroup>

## 🧠 知識と記憶

<CardGroup cols={2}>

<Card title="xuezh 中国語学習" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  OpenClawを通じた発音フィードバックと学習フローを備えた中国語学習エンジンです。
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp メモリ保管庫" icon="vault">
  **コミュニティ** • `memory` `transcription` `indexing`
  
  WhatsAppの完全エクスポートを取り込み、1,000件以上の音声ノートを文字起こしし、gitログと照合して、リンク付きMarkdownレポートを出力します。
</Card>

<Card title="Karakeep セマンティック検索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Qdrant + OpenAI/Ollama embeddings を使って、Karakeepブックマークにベクトル検索を追加します。
</Card>

<Card title="インサイド・ヘッド2風メモリ" icon="brain">
  **コミュニティ** • `memory` `beliefs` `self-model`
  
  セッションファイルを記憶 → 信念 → 進化する自己モデルへと変換する、独立したメモリマネージャーです。
</Card>

</CardGroup>

## 🎙️ 音声と電話

<CardGroup cols={2}>

<Card title="Clawdia Phone Bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi音声アシスタント ↔ OpenClaw HTTPブリッジです。あなたのエージェントと、ほぼリアルタイムの通話が可能です。
</Card>

<Card title="OpenRouter文字起こし" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter（Gemini など）経由の多言語音声文字起こしです。ClawHubで利用できます。
</Card>

</CardGroup>

## 🏗️ インフラとデプロイ

<CardGroup cols={2}>

<Card title="Home Assistantアドオン" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  SSHトンネル対応と永続状態を備えた、Home Assistant OS 上で動作するOpenClaw Gatewayです。
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  自然言語で Home Assistant デバイスを制御・自動化します。
</Card>

<Card title="Nixパッケージング" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  再現可能なデプロイ向けの、全部入りの nix 化 OpenClaw 設定です。
</Card>

<Card title="CalDAVカレンダー" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  khal/vdirsyncer を使ったカレンダーSkillです。セルフホスト型カレンダー連携です。
</Card>

</CardGroup>

## 🏠 ホームとハードウェア

<CardGroup cols={2}>

<Card title="GoHome 自動化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  OpenClawをインターフェースとして使う、Nixネイティブなホームオートメーションです。美しいGrafanaダッシュボードも備えています。
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock 掃除機" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Roborock ロボット掃除機を自然な会話で操作できます。
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## 🌟 コミュニティプロジェクト

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **コミュニティ** • `marketplace` `astronomy` `webapp`
  
  本格的な天体観測機材マーケットプレイスです。OpenClawエコシステムを使って、またはそれを中心に構築されています。
</Card>

</CardGroup>

---

## プロジェクトを投稿する

共有したいものがありますか？ ぜひ掲載したいです！

<Steps>
  <Step title="共有する">
    [Discordの #self-promotion](https://discord.gg/clawd) に投稿するか、[Xで @openclaw に投稿](https://x.com/openclaw)してください
  </Step>
  <Step title="詳細を含める">
    何をするものか、リポジトリやデモへのリンク、可能ならスクリーンショットを共有してください
  </Step>
  <Step title="掲載される">
    特に目立つプロジェクトをこのページに追加します
  </Step>
</Steps>
