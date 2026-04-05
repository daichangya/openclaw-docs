---
read_when:
    - 新しいOpenClaw agent sessionを開始するとき
    - デフォルトSkillsを有効化または監査するとき
summary: 個人アシスタント構成向けのデフォルトOpenClaw agent指示とSkills一覧
title: デフォルト AGENTS.md
x-i18n:
    generated_at: "2026-04-05T12:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw Personal Assistant（デフォルト）

## 初回実行（推奨）

OpenClawはagent用に専用のworkspace directoryを使用します。デフォルトは `~/.openclaw/workspace` です（`agents.defaults.workspace` で設定可能）。

1. workspaceを作成します（まだ存在しない場合）:

```bash
mkdir -p ~/.openclaw/workspace
```

2. デフォルトworkspaceテンプレートをworkspaceへコピーします:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 任意: personal assistant向けのSkills一覧を使いたい場合は、このファイルでAGENTS.mdを置き換えます:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 任意: `agents.defaults.workspace` を設定して別のworkspaceを選びます（`~` をサポート）:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全性のデフォルト

- directoryやsecretをchatへそのまま出力しない。
- 明示的に依頼されない限り、破壊的なcommandを実行しない。
- 外部メッセージングsurfaceへ部分的/streamingな返信を送らない（最終返信のみ）。

## Session開始時（必須）

- `SOUL.md`、`USER.md`、および `memory/` 内の今日と昨日の内容を読む。
- `MEMORY.md` が存在する場合はそれを読み、`MEMORY.md` がない場合のみ小文字の `memory.md` にフォールバックする。
- 返信前にこれを行う。

## Soul（必須）

- `SOUL.md` はidentity、tone、boundaryを定義する。常に最新に保つ。
- `SOUL.md` を変更した場合は、ユーザーへ伝える。
- あなたは各sessionで新しいinstanceであり、継続性はこれらのファイルに存在する。

## 共有スペース（推奨）

- あなたはユーザー本人の声ではない。group chatやpublic channelでは注意する。
- private data、連絡先情報、内部メモを共有しない。

## Memoryシステム（推奨）

- 日次ログ: `memory/YYYY-MM-DD.md`（必要なら `memory/` を作成）。
- 長期memory: `MEMORY.md` に、永続的な事実、好み、決定を書く。
- 小文字の `memory.md` はlegacyフォールバック専用。意図的に両方のルートファイルを保持しない。
- session開始時に、今日 + 昨日 + `MEMORY.md` を読む。存在しない場合は `memory.md` を読む。
- 記録する内容: 決定、好み、制約、未完了事項。
- 明示的に依頼されない限りsecretは避ける。

## ToolsとSkills

- toolはskill内にある。必要になったら各skillの `SKILL.md` に従う。
- 環境固有のメモは `TOOLS.md`（Notes for Skills）に記録する。

## バックアップのヒント（推奨）

このworkspaceをClawdの「memory」として扱うなら、`AGENTS.md` とmemoryファイルをバックアップするために、git repo（できればprivate）にしてください。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClawが行うこと

- WhatsApp Gateway + Pi coding agentを実行し、アシスタントがchatを読み書きし、contextを取得し、host Mac経由でskillを実行できるようにする。
- macOS appは権限（screen recording、notification、microphone）を管理し、バンドルされたbinary経由で `openclaw` CLIを公開する。
- direct chatはデフォルトでagentの `main` sessionに集約され、groupは `agent:<agentId>:<channel>:group:<id>` として分離されたまま保たれる（room/channel: `agent:<agentId>:<channel>:channel:<id>`）。heartbeatはバックグラウンドtaskを維持する。

## コアSkills（Settings → Skillsで有効化）

- **mcporter** — 外部skill backendを管理するためのtool server runtime/CLI。
- **Peekaboo** — 任意のAI vision analysis付きの高速なmacOS screenshot。
- **camsnap** — RTSP/ONVIF security camからframe、clip、motion alertを取得。
- **oracle** — session replayとbrowser controlを備えたOpenAI対応agent CLI。
- **eightctl** — terminalから睡眠をコントロール。
- **imsg** — iMessageとSMSを送信、読み取り、stream。
- **wacli** — WhatsApp CLI: sync、search、send。
- **discord** — Discord action: reaction、sticker、poll。targetには `user:<id>` または `channel:<id>` を使うこと（数値id単体は曖昧）。
- **gog** — Google Suite CLI: Gmail、Calendar、Drive、Contacts。
- **spotify-player** — 再生の検索、キュー追加、制御を行うterminal Spotify client。
- **sag** — mac風のsay UXを備えたElevenLabs speech。デフォルトでspeakerへstream。
- **Sonos CLI** — scriptからSonos speakerを制御（discover/status/playback/volume/grouping）。
- **blucli** — scriptからBluOS playerを再生、グループ化、自動化。
- **OpenHue CLI** — sceneとautomation向けのPhilips Hue lighting control。
- **OpenAI Whisper** — すばやいdictationとvoicemail transcript向けのローカルspeech-to-text。
- **Gemini CLI** — 高速Q&A向けにterminalからGoogle Gemini modelを使う。
- **agent-tools** — automationとhelper script向けのutility toolkit。

## 使用上の注意

- scriptingには `openclaw` CLIを優先して使う。権限はmac appが処理する。
- installはSkillsタブから実行する。binaryがすでに存在する場合、buttonは非表示になる。
- アシスタントがreminderのスケジュール、inboxの監視、camera captureのトリガーを行えるよう、heartbeatを有効のままにしておく。
- Canvas UIはネイティブoverlay付きで全画面表示される。重要なcontrolを左上/右上/下端に配置しないこと。layoutに明示的なgutterを追加し、safe-area insetに依存しない。
- browser駆動の確認には、OpenClaw管理のChrome profileとともに `openclaw browser`（tabs/status/screenshot）を使う。
- DOM検査には `openclaw browser eval|query|dom|snapshot` を使う（機械出力が必要なら `--json`/`--out` も使う）。
- 操作には `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` を使う（click/typeにはsnapshot refが必要。CSS selectorには `evaluate` を使う）。
