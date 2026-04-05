---
read_when:
    - エージェントの初回実行時に何が起こるかを理解するとき
    - ブートストラップファイルの保存場所を説明するとき
    - オンボーディング時のアイデンティティ設定をデバッグするとき
sidebarTitle: Bootstrapping
summary: ワークスペースとアイデンティティファイルを初期化するエージェントのブートストラップ儀式
title: エージェントのブートストラップ
x-i18n:
    generated_at: "2026-04-05T12:56:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# エージェントのブートストラップ

ブートストラップは、エージェントのワークスペースを準備し、
アイデンティティの詳細を収集する**初回実行**の儀式です。これはオンボーディング後、
エージェントが初めて起動するときに行われます。

## ブートストラップが行うこと

エージェントの初回実行時に、OpenClaw はワークスペース（デフォルト
`~/.openclaw/workspace`）をブートストラップします。

- `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md` を初期配置します。
- 短いQ&Aの儀式を実行します（質問は一度に1つ）。
- アイデンティティと設定を `IDENTITY.md`、`USER.md`、`SOUL.md` に書き込みます。
- 完了後は `BOOTSTRAP.md` を削除し、一度しか実行されないようにします。

## 実行場所

ブートストラップは常に**gateway host**上で実行されます。macOSアプリが
リモートGatewayに接続している場合、ワークスペースとブートストラップファイルはそのリモートマシン上にあります。

<Note>
Gatewayが別のマシンで実行されている場合は、ワークスペースファイルをgateway
host上で編集してください（例: `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 関連ドキュメント

- macOSアプリのオンボーディング: [オンボーディング](/start/onboarding)
- ワークスペースレイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
