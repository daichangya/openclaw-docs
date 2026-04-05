---
read_when:
    - ワークスペースで新しいカスタム Skill を作成しているとき
    - SKILL.md ベースの Skills 向けの手早いスターターワークフローが必要なとき
summary: SKILL.md を使ってカスタムワークスペース Skills を作成・テストする
title: Skills の作成
x-i18n:
    generated_at: "2026-04-05T12:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Skills の作成

Skills は、ツールをどのように、いつ使うかをエージェントに教えます。各 Skill は、
YAML frontmatter と Markdown の手順を含む `SKILL.md` ファイルを持つディレクトリです。

Skills がどのように読み込まれ、優先順位付けされるかについては、[Skills](/tools/skills) を参照してください。

## 最初の Skill を作成する

<Steps>
  <Step title="Skill ディレクトリを作成する">
    Skills はワークスペース内に置かれます。新しいフォルダーを作成してください。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md を書く">
    そのディレクトリ内に `SKILL.md` を作成します。frontmatter でメタデータを定義し、
    Markdown 本文にはエージェント向けの手順を書きます。

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="ツールを追加する（任意）">
    frontmatter 内でカスタムツールスキーマを定義することも、既存のシステムツール
    （`exec` や `browser` など）を使うようエージェントに指示することもできます。Skills は、
    それらが説明するツールと一緒にプラグイン内で配布することもできます。

  </Step>

  <Step title="Skill を読み込む">
    OpenClaw が Skill を認識できるように、新しいセッションを開始します。

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Skill が読み込まれたことを確認してください。

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="テストする">
    Skill を発動させるはずのメッセージを送信します。

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    または、エージェントと普通にチャットして、あいさつを求めてもかまいません。

  </Step>
</Steps>

## Skill メタデータのリファレンス

YAML frontmatter では、次のフィールドをサポートしています。

| Field                               | Required | Description                                 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Yes      | 一意の識別子（snake_case）                  |
| `description`                       | Yes      | エージェントに表示される1行説明             |
| `metadata.openclaw.os`              | No       | OS フィルター（`["darwin"]`, `["linux"]` など） |
| `metadata.openclaw.requires.bins`   | No       | PATH 上で必要なバイナリ                     |
| `metadata.openclaw.requires.config` | No       | 必要な設定キー                              |

## ベストプラクティス

- **簡潔にする** — モデルに AI としてどう振る舞うかではなく、何をするかを指示してください
- **安全第一** — Skill が `exec` を使う場合は、信頼できない入力から任意のコマンド注入が起きないよう、プロンプトに注意してください
- **ローカルでテストする** — 共有する前に `openclaw agent --message "..."` でテストしてください
- **ClawHub を使う** — [ClawHub](https://clawhub.ai) で Skills を閲覧・投稿できます

## Skills の保存場所

| Location                        | Precedence | Scope                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | Highest    | エージェントごと      |
| `\<workspace\>/.agents/skills/` | High       | ワークスペースごとのエージェント |
| `~/.agents/skills/`             | Medium     | 共有エージェントプロファイル |
| `~/.openclaw/skills/`           | Medium     | 共有（すべてのエージェント） |
| Bundled (shipped with OpenClaw) | Low        | グローバル            |
| `skills.load.extraDirs`         | Lowest     | カスタム共有フォルダー |

## 関連

- [Skills リファレンス](/tools/skills) — 読み込み、優先順位、ゲーティングルール
- [Skills 設定](/tools/skills-config) — `skills.*` 設定スキーマ
- [ClawHub](/tools/clawhub) — 公開 Skill レジストリ
- [プラグインの作成](/ja-JP/plugins/building-plugins) — プラグインは Skills を同梱できます
