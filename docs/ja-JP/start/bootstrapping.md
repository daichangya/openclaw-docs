---
read_when:
    - 初回のエージェント実行で何が起こるかを理解する
    - ブートストラップファイルがどこに置かれるかを説明する
    - オンボーディング時の識別設定をデバッグする
sidebarTitle: Bootstrapping
summary: ワークスペースと識別ファイルを初期投入するエージェントのブートストラップ手順
title: エージェントのブートストラップ
x-i18n:
    generated_at: "2026-04-25T13:59:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

ブートストラップは、エージェントのワークスペースを準備し、識別情報を収集する **初回実行** の手順です。これはオンボーディング後、エージェントが最初に起動したときに実行されます。

## ブートストラップで行うこと

初回のエージェント実行時に、OpenClaw はワークスペース（デフォルトは
`~/.openclaw/workspace`）をブートストラップします。

- `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md` を初期投入します。
- 短い Q&A 手順を実行します（1 回に 1 問）。
- 識別情報 + 設定を `IDENTITY.md`、`USER.md`、`SOUL.md` に書き込みます。
- 完了後は `BOOTSTRAP.md` を削除し、1 回だけ実行されるようにします。

## ブートストラップをスキップする

事前投入済みワークスペースでこれをスキップするには、`openclaw onboard --skip-bootstrap` を実行します。

## 実行場所

ブートストラップは常に **Gateway ホスト** 上で実行されます。macOS app が
リモート Gateway に接続している場合、ワークスペースとブートストラップファイルはそのリモートマシン上にあります。

<Note>
Gateway が別のマシンで動作している場合は、ワークスペースファイルを Gateway ホスト上で編集してください（例: `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 関連 docs

- macOS app のオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- ワークスペースレイアウト: [Agent workspace](/ja-JP/concepts/agent-workspace)
