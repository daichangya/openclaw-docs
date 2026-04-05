---
read_when:
    - macOS のオンボーディングアシスタントを設計している
    - 認証または ID のセットアップを実装している
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw の初回実行セットアップフロー（macOS App）
title: オンボーディング（macOS App）
x-i18n:
    generated_at: "2026-04-05T12:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# オンボーディング（macOS App）

このドキュメントでは、**現在の**初回実行セットアップフローについて説明します。目標は、
スムーズな「day 0」の体験です。Gateway をどこで実行するかを選び、認証を接続し、
ウィザードを実行して、エージェント自身にブートストラップさせます。
オンボーディング経路の一般的な概要については、[Onboarding Overview](/start/onboarding-overview) を参照してください。

<Steps>
<Step title="macOS の警告を承認">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワークの検出を承認">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ようこそ画面とセキュリティに関する注意">
<Frame caption="表示されたセキュリティに関する注意を読み、適切に判断してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティの信頼モデル:

- 既定では、OpenClaw は個人用エージェントです: 信頼された単一のオペレーター境界です。
- 共有/マルチユーザー構成ではロックダウンが必要です（信頼境界を分離し、ツールアクセスを最小限に保ち、[Security](/ja-JP/gateway/security) に従ってください）。
- ローカルのオンボーディングでは、新しい設定で `tools.profile: "coding"` が既定になるため、新規のローカル構成では無制限の `full` プロファイルを強制せずに filesystem/runtime tools を維持できます。
- hooks/webhooks やその他の信頼できないコンテンツフィードを有効にする場合は、強力で最新のモデル階層を使用し、厳格なツールポリシー/サンドボックス化を維持してください。

</Step>
<Step title="ローカルかリモートか">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで動作しますか？

- **この Mac（ローカルのみ）:** オンボーディングで認証を設定し、
  資格情報をローカルに書き込めます。
- **リモート（SSH/Tailnet 経由）:** オンボーディングではローカル認証を設定しません。
  資格情報は gateway host 上に存在している必要があります。
- **後で設定:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway 認証のヒント:**

- ウィザードは現在、loopback であっても **token** を生成するため、ローカル WS クライアントも認証が必要です。
- 認証を無効にすると、任意のローカルプロセスが接続できます。これは完全に信頼できるマシンでのみ使用してください。
- マルチマシンアクセスまたは非 loopback バインドには **token** を使用してください。

</Tip>
</Step>
<Step title="権限">
<Frame caption="OpenClaw に付与したい権限を選択してください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングでは、次に必要な TCC 権限を要求します:

- Automation（AppleScript）
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>このステップは任意です</Info>
  アプリは npm、pnpm、または bun を使ってグローバルな `openclaw` CLI をインストールできます。
  優先順は npm、次に pnpm、そして検出されたパッケージマネージャーがそれしかない場合のみ bun です。
  Gateway ランタイムについては、引き続き Node が推奨される経路です。
</Step>
<Step title="オンボーディングチャット（専用セッション）">
  セットアップ後、アプリは専用のオンボーディングチャットセッションを開き、エージェントが
  自己紹介と次のステップの案内を行えるようにします。これにより、初回実行時の案内が通常の会話と
  分離されます。最初のエージェント実行中に gateway host で何が起こるかについては、
  [Bootstrapping](/start/bootstrapping) を参照してください。
</Step>
</Steps>
