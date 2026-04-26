---
read_when:
    - システムプロンプト本文、tools一覧、または時刻/Heartbeatセクションの編集
    - workspace bootstrapまたはSkills注入動作の変更
summary: OpenClawのシステムプロンプトに何が含まれ、どのように組み立てられるか
title: システムプロンプト
x-i18n:
    generated_at: "2026-04-26T11:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClawは、agent実行ごとにカスタムのシステムプロンプトを構築します。このプロンプトは**OpenClawが管理**しており、pi-coding-agentのデフォルトプロンプトは使用しません。

プロンプトはOpenClawによって組み立てられ、各agent実行に注入されます。

provider Pluginは、OpenClaw管理の完全なプロンプトを置き換えずに、キャッシュを意識したプロンプトガイダンスを提供できます。provider runtimeは次のことができます:

- 少数の名前付きcore section（`interaction_style`、`tool_call_style`、`execution_bias`）を置き換える
- プロンプトキャッシュ境界の上に**stable prefix** を注入する
- プロンプトキャッシュ境界の下に**dynamic suffix** を注入する

model family固有の調整にはprovider管理の寄与を使ってください。従来の `before_prompt_build` によるプロンプト変更は、互換性のため、または本当にグローバルなプロンプト変更に限って使い、通常のprovider動作には使わないでください。

OpenAI GPT-5ファミリーのoverlayは、coreの実行ルールを小さく保ちつつ、persona固定、簡潔な出力、tool discipline、並列lookup、deliverableの網羅、検証、不足コンテキスト、terminal toolの衛生に関するmodel固有ガイダンスを追加します。

## 構成

プロンプトは意図的にコンパクトで、固定sectionを使います:

- **Tooling**: structured-toolのsource-of-truthリマインダーとruntimeのtool使用ガイダンス。
- **Execution Bias**: 実行可能な依頼をそのターン内で処理する、完了またはブロックされるまで継続する、弱いtool結果から回復する、可変状態をライブで確認する、最終化前に検証する、といった簡潔な遂行ガイダンス。
- **Safety**: 権限追求行動や監督回避を避けるための短いガードレールリマインダー。
- **Skills**（利用可能な場合）: 必要時にskill instructionを読み込む方法をmodelに伝えます。
- **OpenClaw Self-Update**: `config.schema.lookup` で安全にconfigを確認する方法、`config.patch` でconfigをpatchする方法、`config.apply` で完全なconfigを置き換える方法、そして `update.run` は明示的なユーザー要求がある場合のみ実行すること。owner専用の `gateway` toolは、legacyの `tools.bash.*` エイリアスがこれら保護されたexec pathに正規化される場合も含め、`tools.exec.ask` / `tools.exec.security` の書き換えも拒否します。
- **Workspace**: 作業ディレクトリー（`agents.defaults.workspace`）。
- **Documentation**: OpenClaw docsへのローカルパス（repoまたはnpm package）と、それを読むべきタイミング。
- **Workspace Files (injected)**: bootstrap fileが下に含まれていることを示します。
- **Sandbox**（有効時）: sandbox化されたruntime、sandbox path、およびelevated execが利用可能かどうかを示します。
- **Current Date & Time**: ユーザーのローカル時刻、timezone、時刻形式。
- **Reply Tags**: サポートされているprovider向けの任意のreply tag構文。
- **Heartbeats**: デフォルトagentでHeartbeatが有効な場合のHeartbeatプロンプトとack動作。
- **Runtime**: host、OS、node、model、repo root（検出時）、thinking level（1行）。
- **Reasoning**: 現在の可視性レベル + `/reasoning` 切り替えヒント。

Tooling sectionには、長時間実行作業向けのruntimeガイダンスも含まれます:

- 将来のfollow-up（`check back later`、reminder、定期作業）には `exec` のsleep loop、`yieldMs` のdelay trick、繰り返しの `process` pollingではなく、cronを使う
- `exec` / `process` は、今すぐ開始してバックグラウンドで継続実行されるコマンドにだけ使う
- 自動完了wakeが有効な場合は、コマンドを1回だけ開始し、出力または失敗時のpushベースwake pathに依存する
- 実行中コマンドのログ、状態、入力、または介入を確認する必要がある場合は `process` を使う
- タスクが大きい場合は `sessions_spawn` を優先する。sub-agent完了はpushベースで、自動的に依頼者へ通知される
- 完了待ちのためだけに `subagents list` / `sessions_list` をループでpollしない

実験的な `update_plan` toolが有効な場合、Toolingはさらに、それを自明でない複数ステップ作業にのみ使い、`in_progress` のstepは必ず1つだけに保ち、更新のたびに計画全体を繰り返さないようmodelに伝えます。

システムプロンプト内のSafetyガードレールは助言的なものです。これはmodelの挙動を導きますが、ポリシーを強制するものではありません。厳格な強制にはtool policy、exec approval、sandboxing、channel allowlistを使ってください。operatorは設計上これらを無効化できます。

ネイティブの承認カード/ボタンを持つチャンネルでは、runtime promptは、agentにまずそのネイティブ承認UIへ依存するよう伝えます。手動の `/approve` コマンドは、tool結果がチャット承認を利用できない、または手動承認だけが唯一の経路だと示した場合にのみ含めるべきです。

## プロンプトモード

OpenClawは、sub-agent向けにより小さいシステムプロンプトをレンダリングできます。runtimeは実行ごとに `promptMode` を設定します（ユーザー向けconfigではありません）:

- `full`（デフォルト）: 上記すべてのsectionを含みます。
- `minimal`: sub-agentで使用されます。**Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies**、**Heartbeats** を省略します。Tooling、**Safety**、Workspace、Sandbox、Current Date & Time（既知の場合）、Runtime、注入コンテキストは利用可能なままです。
- `none`: ベースのidentity lineだけを返します。

`promptMode=minimal` の場合、追加の注入プロンプトには **Group Chat Context** ではなく **Subagent Context** というラベルが付きます。

## workspace bootstrap注入

bootstrap fileはトリムされ、**Project Context** の下に追記されるため、modelは明示的な読み取りなしにidentityやprofileコンテキストを把握できます:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（新規workspaceでのみ）
- 存在する場合の `MEMORY.md`

これらのfileはすべて、file固有のgateが適用されない限り、各ターンで**コンテキストウィンドウに注入**されます。`HEARTBEAT.md` は、通常実行でデフォルトagentのHeartbeatが無効な場合、または `agents.defaults.heartbeat.includeSystemPromptSection` がfalseの場合は省略されます。注入fileは簡潔に保ってください。特に `MEMORY.md` は時間とともに肥大化しやすく、予想外に高いコンテキスト使用量や、より頻繁なCompactionにつながります。

> **注:** `memory/*.md` の日次fileは、通常のbootstrap Project Contextの一部**ではありません**。通常ターンでは、`memory_search` と `memory_get` toolを介してオンデマンドでアクセスされるため、modelが明示的に読まない限りコンテキストウィンドウを消費しません。素の `/new` と `/reset` ターンは例外で、この最初のターン向けの一回限りのstartup-context blockとして、runtimeが最近の日次memoryを先頭に追加することがあります。

大きなfileはマーカー付きで切り詰められます。fileごとの最大サイズは `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で制御されます。file全体で注入されるbootstrap content総量は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で上限設定されます。存在しないfileは短いmissing-file markerを注入します。切り詰めが発生すると、OpenClawはProject Contextに警告blockを注入できます。これは `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`、デフォルト: `once`）で制御します。

sub-agent sessionでは `AGENTS.md` と `TOOLS.md` のみが注入されます（他のbootstrap fileはsub-agentコンテキストを小さく保つため除外されます）。

内部hookは `agent:bootstrap` を通じてこの段階を横取りし、注入されるbootstrap fileを変更または置換できます（たとえば `SOUL.md` を別personaに差し替えるなど）。

agentの話し方をよりgenericでなくしたい場合は、まず [SOUL.md Personality Guide](/ja-JP/concepts/soul) から始めてください。

各注入fileの寄与量（生データと注入後、切り詰め、さらにtool schema overheadまで）を確認するには、`/context list` または `/context detail` を使ってください。[Context](/ja-JP/concepts/context) を参照してください。

## 時刻処理

ユーザーtimezoneが既知の場合、システムプロンプトには専用の **Current Date & Time** sectionが含まれます。プロンプトキャッシュを安定に保つため、現在は**timezone** のみを含みます（動的な時計や時刻形式は含みません）。

agentが現在時刻を必要とする場合は `session_status` を使ってください。status cardにはtimestamp行が含まれます。同じtoolは任意でsession単位のmodel overrideも設定できます（`model=default` でクリア）。

設定:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完全な動作詳細は [Date & Time](/ja-JP/date-time) を参照してください。

## Skills

対象となるSkillsが存在する場合、OpenClawは、各skillの**file path** を含むコンパクトな**available skills list**（`formatSkillsForPrompt`）を注入します。プロンプトは、列挙された場所（workspace、managed、またはbundled）にあるSKILL.mdを `read` で読み込むようmodelに指示します。対象skillがなければ、Skills sectionは省略されます。

対象判定には、skill metadata gate、runtime environment/config check、さらに `agents.defaults.skills` または `agents.list[].skills` が設定されている場合は有効なagent skill allowlistが含まれます。

Plugin同梱Skillsは、その所有Pluginが有効な場合にのみ対象になります。これにより、tool Pluginは、そのガイダンス全体を各tool descriptionに直接埋め込まずに、より深い運用ガイドを公開できます。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

これにより、ベースプロンプトを小さく保ちながら、必要なskill使用を可能にします。

skills listの予算はskills subsystemが管理します:

- グローバルデフォルト: `skills.limits.maxSkillsPromptChars`
- agentごとの上書き: `agents.list[].skillsLimits.maxSkillsPromptChars`

一般的な上限制御付きruntime excerptには別のsurfaceがあります:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

この分離により、skillのサイズ調整を、`memory_get`、ライブtool結果、Compaction後のAGENTS.md再読み込みのようなruntimeの読み取り/注入サイズ調整と切り離せます。

## Documentation

システムプロンプトには **Documentation** sectionが含まれます。ローカルdocsが利用できる場合、ローカルのOpenClaw docsディレクトリー（Git checkoutでは `docs/`、またはnpm package同梱docs）を指します。ローカルdocsが利用できない場合は、[https://docs.openclaw.ai](https://docs.openclaw.ai) にフォールバックします。

同じsectionには、OpenClaw sourceの場所も含まれます。Git checkoutではローカルsource rootを公開するため、agentはコードを直接調べられます。package installではGitHub source URLが含まれ、docsが不完全または古い場合はそこでsourceを確認するようagentに指示します。また、このプロンプトは、public docs mirror、community Discord、そしてSkills発見用のClawHub（[https://clawhub.ai](https://clawhub.ai)）にも言及します。OpenClawの挙動、コマンド、設定、architectureについてはまずdocsを参照するようmodelに指示し、可能な場合は `openclaw status` を自ら実行し、アクセス権がない場合のみユーザーに尋ねるよう伝えます。設定については特に、正確なfield単位のdocsと制約を得るため `gateway` tool actionの `config.schema.lookup` を参照し、その後より広いガイダンスとして `docs/gateway/configuration.md` と `docs/gateway/configuration-reference.md` を参照するようagentに示します。

## 関連

- [Agent runtime](/ja-JP/concepts/agent)
- [Agent workspace](/ja-JP/concepts/agent-workspace)
- [Context engine](/ja-JP/concepts/context-engine)
