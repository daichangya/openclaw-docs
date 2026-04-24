---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムに関するサポート質問への回答
    - より深いデバッグの前にユーザーから報告された問題をトリアージする
summary: OpenClawのセットアップ、設定、使用方法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-04-24T08:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

現実のセットアップ向けのクイックな回答と、より深いトラブルシューティング（ローカル開発、VPS、マルチエージェント、OAuth/APIキー、モデルフェイルオーバー）。ランタイム診断については、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。完全な設定リファレンスについては、[Configuration](/ja-JP/gateway/configuration)を参照してください。

## 何かが壊れている場合の最初の60秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + 更新、gateway/service到達可能性、agents/sessions、provider設定 + ランタイム問題（gatewayに到達できる場合）。

2. **貼り付け可能なレポート（安全に共有可能）**

   ```bash
   openclaw status --all
   ```

   ログ末尾を含む読み取り専用の診断です（トークンは伏せ字化されます）。

3. **デーモン + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisorランタイムとRPC到達可能性、プローブ対象URL、およびサービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はchannelプローブを含む、ライブgatewayヘルスプローブを実行します
   （到達可能なgatewayが必要です）。[Health](/ja-JP/gateway/health)を参照してください。

5. **最新ログを追跡**

   ```bash
   openclaw logs --follow
   ```

   RPCが停止している場合は、代わりに次を使用します:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[Logging](/ja-JP/logging)および[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。

6. **doctorを実行（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復・移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor)を参照してください。

7. **Gatewayスナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象URL + configパスを表示
   ```

   実行中のgatewayに完全なスナップショットを要求します（WS専用）。[Health](/ja-JP/gateway/health)を参照してください。

## クイックスタートと初回実行セットアップ

初回実行のQ&A — インストール、オンボーディング、認証経路、サブスクリプション、初期障害 —
は[初回実行FAQ](/ja-JP/help/faq-first-run)にあります。

## OpenClawとは何ですか？

<AccordionGroup>
  <Accordion title="OpenClawとは何ですか？ 1段落で教えてください。">
    OpenClawは、自分のデバイス上で実行するパーソナルAIアシスタントです。すでに使っているメッセージング面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、およびQQ Botなどのバンドルされたchannel Plugin）で応答し、対応プラットフォームでは音声 + ライブCanvasも利用できます。**Gateway**は常時稼働するコントロールプレーンであり、アシスタントが製品そのものです。
  </Accordion>

  <Accordion title="価値提案">
    OpenClawは「単なるClaudeラッパー」ではありません。これは、**自分のハードウェア**上で高機能なアシスタントを実行し、すでに使っているチャットアプリからアクセスでき、状態を持つセッション、メモリ、ツールを備えつつ、ワークフローの制御をホスト型SaaSに渡さずに済む**ローカルファーストのコントロールプレーン**です。

    主な特長:

    - **あなたのデバイス、あなたのデータ:** Gatewayを好きな場所（Mac、Linux、VPS）で実行し、workspace + セッション履歴をローカルに保持できます。
    - **Webサンドボックスではなく実際のchannel:** WhatsApp/Telegram/Slack/Discord/Signal/iMessageなどに加え、対応プラットフォームではモバイル音声とCanvasも利用できます。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouterなどを、エージェントごとのルーティングやフェイルオーバーとともに使えます。
    - **ローカル専用オプション:** ローカルモデルを実行すれば、必要に応じて**すべてのデータを自分のデバイス上に保持**できます。
    - **マルチエージェントルーティング:** channel、アカウント、またはタスクごとに別々のエージェントを用意でき、それぞれが独自のworkspaceとデフォルト設定を持てます。
    - **オープンソースで拡張可能:** ベンダーロックインなしで、調査、拡張、セルフホストが可能です。

    ドキュメント: [Gateway](/ja-JP/gateway)、[Channels](/ja-JP/channels)、[Multi-agent](/ja-JP/concepts/multi-agent)、
    [Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすればよいですか？">
    最初のプロジェクトとしておすすめなのは次のようなものです:

    - Webサイトを構築する（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリを試作する（アウトライン、画面、API計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmailを接続し、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、段階に分けて
    sub agentsを使って並列作業すると、よりうまく機能します。

  </Accordion>

  <Accordion title="OpenClawの日常的な上位5つのユースケースは何ですか？">
    日常的な効果が出やすい使い方は、通常次のようなものです:

    - **個人向けブリーフィング:** 受信箱、カレンダー、関心のあるニュースの要約。
    - **調査とドラフト作成:** メールやドキュメント用の迅速な調査、要約、初稿作成。
    - **リマインダーとフォローアップ:** CronまたはHeartbeat駆動の通知やチェックリスト。
    - **ブラウザ自動化:** フォーム入力、データ収集、Web作業の繰り返し。
    - **デバイス間の連携:** スマートフォンからタスクを送り、Gatewayにサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClawはSaaS向けのリード獲得、アウトリーチ、広告、ブログ作成に役立ちますか？">
    **調査、選別、ドラフト作成**には役立ちます。サイトをスキャンし、候補一覧を作成し、
    見込み客を要約し、アウトリーチ文面や広告コピーの下書きを書けます。

    **アウトリーチや広告運用**については、人間をループに残してください。スパムを避け、現地の法律や
    プラットフォームポリシーに従い、送信前に必ず確認してください。最も安全なパターンは、
    OpenClawに下書きを作らせて、あなたが承認することです。

    ドキュメント: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web開発におけるClaude Codeと比べた利点は何ですか？">
    OpenClawは、IDEの置き換えではなく、**パーソナルアシスタント**および連携レイヤーです。リポジトリ内で最速の直接的なコーディングループが必要なら
    Claude CodeやCodexを使ってください。永続的なメモリ、デバイス横断アクセス、ツールのオーケストレーションが必要ならOpenClawを使ってください。

    利点:

    - **永続的なメモリ + workspace**をセッション間で利用可能
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールのオーケストレーション**（ブラウザ、ファイル、スケジューリング、フック）
    - **常時稼働のGateway**（VPS上で実行し、どこからでも操作可能）
    - ローカルのブラウザ/画面/カメラ/exec用の**Nodes**

    紹介: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skillsと自動化

<AccordionGroup>
  <Accordion title="リポジトリをdirtyのままにせずにskillsをカスタマイズするにはどうすればよいですか？">
    リポジトリ内のコピーを編集する代わりに、管理されたオーバーライドを使用してください。変更は`~/.openclaw/skills/<name>/SKILL.md`に置くか、`~/.openclaw/openclaw.json`の`skills.load.extraDirs`でフォルダーを追加してください。優先順位は`<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`なので、管理されたオーバーライドはgitに触れずにbundled skillsより優先されます。skillをグローバルにインストールしつつ一部のagentsにだけ見せたい場合は、共有コピーを`~/.openclaw/skills`に置き、`agents.defaults.skills`と`agents.list[].skills`で可視性を制御してください。上流に送る価値のある編集だけをリポジトリ内に置き、PRとして送ってください。
  </Accordion>

  <Accordion title="カスタムフォルダーからskillsを読み込めますか？">
    はい。`~/.openclaw/openclaw.json`の`skills.load.extraDirs`で追加ディレクトリを指定できます（最も低い優先順位）。デフォルトの優先順位は`<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`です。`clawhub`はデフォルトで`./skills`にインストールし、OpenClawは次のセッションでこれを`<workspace>/skills`として扱います。そのskillを特定のagentsにだけ見せたい場合は、`agents.defaults.skills`または`agents.list[].skills`と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか？">
    現在サポートされているパターンは次のとおりです:

    - **Cron jobs**: 分離されたジョブごとに`model`オーバーライドを設定できます。
    - **Sub-agents**: 異なるデフォルトモデルを持つ別々のエージェントにタスクをルーティングします。
    - **オンデマンド切り替え**: `/model`を使って現在のセッションモデルをいつでも切り替えます。

    [Cron jobs](/ja-JP/automation/cron-jobs)、[Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[Slash commands](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="重い処理をしている間にボットが固まります。どうやってオフロードすればよいですか？">
    長時間または並列のタスクには**sub-agents**を使ってください。sub-agentsは独自のセッションで実行され、
    要約を返し、メインのチャットの応答性を保ちます。

    ボットに「このタスク用にsub-agentを起動して」と頼むか、`/subagents`を使ってください。
    チャット内の`/status`を使うと、現在Gatewayが何をしているか（およびビジーかどうか）を確認できます。

    トークンのヒント: 長いタスクとsub-agentsはいずれもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model`でsub-agents用により安価なモデルを設定してください。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents)、[Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discordでthreadに紐づくsubagentセッションはどのように動作しますか？">
    threadバインディングを使います。Discord threadをsubagentまたはセッションターゲットにバインドできるため、そのthread内の後続メッセージはそのバインド済みセッションに留まります。

    基本フロー:

    - `sessions_spawn`を`thread: true`で使って起動します（持続的なフォローアップが必要なら、必要に応じて`mode: "session"`も指定）。
    - または`/focus <target>`で手動バインドします。
    - `/agents`を使ってバインディング状態を確認します。
    - `/session idle <duration|off>`と`/session max-age <duration|off>`を使って自動アンフォーカスを制御します。
    - `/unfocus`を使ってthreadを切り離します。

    必要な設定:

    - グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discordオーバーライド: `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 起動時の自動バインド: `channels.discord.threadBindings.spawnSubagentSessions: true`を設定します。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents)、[Discord](/ja-JP/channels/discord)、[Configuration Reference](/ja-JP/gateway/configuration-reference)、[Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="subagentは完了したのに、完了通知が間違った場所に届くか、まったく投稿されませんでした。何を確認すべきですか？">
    まず解決済みのリクエスター経路を確認してください:

    - 完了モードのsubagent配信は、存在する場合はバインド済みのthreadまたは会話経路を優先します。
    - 完了元がchannelしか持っていない場合、OpenClawはリクエスターセッションの保存済み経路（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信が引き続き成功する可能性があります。
    - バインド済み経路も利用可能な保存済み経路も存在しない場合、直接配信は失敗し、結果はチャットに即時投稿される代わりにキュー済みセッション配信へフォールバックします。
    - 無効または古いターゲットでは、依然としてキューフォールバックまたは最終配信失敗が発生することがあります。
    - 子の最後に見えるassistant返信が、完全にサイレントトークン`NO_REPLY` / `no_reply`、または完全に`ANNOUNCE_SKIP`である場合、OpenClawは古い以前の進捗を投稿する代わりに意図的に通知を抑制します。
    - 子がツール呼び出しのみの後にタイムアウトした場合、通知では生のツール出力を再掲する代わりに、短い部分進捗サマリーへまとめられることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents)、[Background Tasks](/ja-JP/automation/tasks)、[Session Tools](/ja-JP/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cronやリマインダーが実行されません。何を確認すべきですか？">
    CronはGatewayプロセス内で実行されます。Gatewayが継続的に動作していない場合、
    スケジュールされたジョブは実行されません。

    チェックリスト:

    - cronが有効（`cron.enabled`）であり、`OPENCLAW_SKIP_CRON`が設定されていないことを確認する。
    - Gatewayが24時間365日動作していることを確認する（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定（`--tz`とホストのタイムゾーン）を検証する。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs)、[Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="Cronは実行されたのに、何もchannelに送信されませんでした。なぜですか？">
    まず配信モードを確認してください:

    - `--no-deliver` / `delivery.mode: "none"` は、runnerフォールバック送信が想定されないことを意味します。
    - announceターゲット（`channel` / `to`）が欠落または無効な場合、runnerは外向き配信をスキップします。
    - channel認証の失敗（`unauthorized`、`Forbidden`）は、runnerが配信を試みたものの、認証情報によってブロックされたことを意味します。
    - サイレントな分離結果（`NO_REPLY` / `no_reply`のみ）は意図的に配信不可として扱われるため、runnerはキュー済みフォールバック配信も抑制します。

    分離されたCron jobsでは、チャット経路が利用可能であれば、agentは`message`
    ツールを使って直接送信することもできます。`--announce`が制御するのは、agentがまだ送信していない最終テキストに対する
    runnerフォールバック経路だけです。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs)、[Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="なぜ分離されたCron実行でモデルが切り替わったり、1回再試行されたりしたのですか？">
    それは通常、重複スケジューリングではなく、ライブモデル切り替え経路です。

    分離されたCronは、アクティブな実行が`LiveSessionModelSwitchError`を投げたときに、
    ランタイムのモデルハンドオフを永続化して再試行できます。この再試行では、切り替え後の
    provider/modelが維持され、切り替えに新しい認証プロファイルのオーバーライドが含まれていた場合、
    Cronは再試行前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、まずGmail hookのモデルオーバーライドが優先されます。
    - 次にジョブごとの`model`。
    - 次に保存済みのcron-sessionモデルオーバーライド。
    - その後、通常のagent/defaultモデル選択。

    再試行ループには上限があります。初回試行に加えて2回の切り替え再試行の後、
    Cronは無限ループせず中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs)、[cron CLI](/ja-JP/cli/cron)。

  </Accordion>

  <Accordion title="Linuxでskillsをインストールするにはどうすればよいですか？">
    ネイティブの`openclaw skills`コマンドを使うか、skillsをworkspaceに配置してください。macOSのSkills UIはLinuxでは利用できません。
    skillsは[https://clawhub.ai](https://clawhub.ai)で参照できます。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    ネイティブの`openclaw skills install`は、アクティブなworkspaceの`skills/`
    ディレクトリに書き込みます。自分のskillsを公開または
    同期したい場合にのみ、別個の`clawhub` CLIをインストールしてください。agents間で共有インストールするには、skillを
    `~/.openclaw/skills`配下に置き、表示できるagentを絞りたい場合は`agents.defaults.skills`または
    `agents.list[].skills`を使ってください。

  </Accordion>

  <Accordion title="OpenClawはスケジュールに従って、または継続的にバックグラウンドでタスクを実行できますか？">
    はい。Gatewayスケジューラーを使います:

    - スケジュール済みまたは繰り返しタスクには**Cron jobs**（再起動後も保持）。
    - 「メインセッション」の定期チェックには**Heartbeat**。
    - 要約を投稿したりチャットに配信したりする自律エージェントには**分離ジョブ**。

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs)、[Automation & Tasks](/ja-JP/automation)、
    [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title="AppleのmacOS専用skillsをLinuxから実行できますか？">
    直接にはできません。macOS skillsは`metadata.openclaw.os`と必要なバイナリによって制御され、skillsは**Gatewayホスト**上で条件を満たす場合にのみsystem promptに表示されます。Linuxでは、`darwin`専用skills（`apple-notes`、`apple-reminders`、`things-mac`など）は、その制御を上書きしない限り読み込まれません。

    サポートされているパターンは3つあります:

    **オプションA - GatewayをMacで実行する（最も簡単）。**
    GatewayをmacOSバイナリが存在する場所で実行し、その後Linuxから[リモートモード](#gateway-ports-already-running-and-remote-mode)またはTailscale経由で接続します。GatewayホストがmacOSなので、skillsは通常どおり読み込まれます。

    **オプションB - macOS Nodeを使う（SSHなし）。**
    GatewayをLinuxで実行し、macOS Node（メニューバーアプリ）をペアリングして、Mac上の**Node Run Commands**を「Always Ask」または「Always Allow」に設定します。必要なバイナリがNode上に存在する場合、OpenClawはmacOS専用skillsを条件適合として扱えます。agentは`nodes`ツール経由でそれらのskillsを実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認すると、そのコマンドが許可リストに追加されます。

    **オプションC - macOSバイナリをSSH経由でプロキシする（上級者向け）。**
    GatewayはLinux上に置いたまま、必要なCLIバイナリがMac上で実行されるSSHラッパーに解決されるようにします。その後、skillを上書きしてLinuxを許可すれば、条件適合のままにできます。

    1. バイナリ用のSSHラッパーを作成します（例: Apple Notes用の`memo`）:

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linuxホストの`PATH`にラッパーを配置します（例: `~/bin/memo`）。
    3. skillメタデータ（workspaceまたは`~/.openclaw/skills`）を上書きしてLinuxを許可します:

       ```markdown
       ---
       name: apple-notes
       description: macOS上のmemo CLI経由でApple Notesを管理します。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. skillsスナップショットが更新されるように、新しいセッションを開始します。

  </Accordion>

  <Accordion title="NotionやHeyGenとの連携はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタムskill / Plugin:** 信頼性の高いAPIアクセスに最適です（Notion/HeyGenはいずれもAPIを提供しています）。
    - **ブラウザ自動化:** コード不要で動きますが、遅く壊れやすくなります。

    クライアントごとにコンテキストを維持したい場合（代理店ワークフローなど）、簡単なパターンは次のとおりです:

    - クライアントごとに1つのNotionページ（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時に、そのページを取得するようagentに依頼する。

    ネイティブ連携が必要な場合は、機能要望を出すか、それらのAPIを対象としたskillを作成してください。

    skillsのインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールは、アクティブなworkspaceの`skills/`ディレクトリに配置されます。agents間で共有するskillsは、`~/.openclaw/skills/<name>/SKILL.md`に配置してください。共有インストールを一部のagentsだけに見せたい場合は、`agents.defaults.skills`または`agents.list[].skills`を設定してください。一部のskillsはHomebrew経由でインストールされたバイナリを前提としています。LinuxではこれはLinuxbrewを意味します（上記のHomebrew Linux FAQ項目を参照）。[Skills](/ja-JP/tools/skills)、[Skills config](/ja-JP/tools/skills-config)、[ClawHub](/ja-JP/tools/clawhub)を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済みChromeをOpenClawで使うにはどうすればよいですか？">
    Chrome DevTools MCP経由で接続する組み込みの`user`ブラウザプロファイルを使います:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を付けたい場合は、明示的なMCPプロファイルを作成します:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路では、ローカルホストのブラウザまたは接続済みのブラウザNodeを使用できます。Gatewayが別の場所で実行されている場合は、ブラウザマシン上でNodeホストを実行するか、代わりにリモートCDPを使用してください。

    `existing-session` / `user`の現在の制限:

    - アクションはCSSセレクター駆動ではなくref駆動です
    - アップロードには`ref` / `inputRef`が必要で、現在は1回に1ファイルのみ対応しています
    - `responsebody`、PDFエクスポート、ダウンロードインターセプト、バッチアクションには、依然として管理対象ブラウザまたはraw CDPプロファイルが必要です

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="サンドボックス化専用のドキュメントはありますか？">
    はい。[Sandboxing](/ja-JP/gateway/sandboxing)を参照してください。Docker固有のセットアップ（Docker内の完全なgatewayまたはサンドボックスイメージ）については、[Docker](/ja-JP/install/docker)を参照してください。
  </Accordion>

  <Accordion title="Dockerの機能が制限されているように感じます。完全な機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node`ユーザーとして実行されるため、
    システムパッケージ、Homebrew、バンドルされたブラウザは含まれていません。より完全なセットアップにするには:

    - キャッシュが保持されるように、`OPENCLAW_HOME_VOLUME`で`/home/node`を永続化する。
    - `OPENCLAW_DOCKER_APT_PACKAGES`を使ってシステム依存関係をイメージに組み込む。
    - バンドルされたCLI経由でPlaywrightブラウザをインストールする:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH`を設定し、そのパスが永続化されるようにする。

    ドキュメント: [Docker](/ja-JP/install/docker)、[Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="1つのagentで、DMは個人的なままにしつつ、グループは公開/サンドボックス化できますか？">
    はい。プライベートな通信が**DM**で、公開の通信が**グループ**である場合は可能です。

    `agents.defaults.sandbox.mode: "non-main"`を使うと、グループ/channelセッション（non-mainキー）は設定されたサンドボックスバックエンドで実行され、一方でメインのDMセッションはホスト上のままになります。バックエンドを選ばない場合、Dockerがデフォルトです。そのうえで、サンドボックス化されたセッションで利用可能なツールを`tools.sandbox.tools`で制限してください。

    セットアップ手順と設定例: [Groups: personal DMs + public groups](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway configuration](/ja-JP/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスにbindするにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds`を`["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定してください。グローバル + agentごとのbindはマージされます。`scope: "shared"`の場合、agentごとのbindは無視されます。機密性の高いものには`:ro`を使い、bindはサンドボックスのファイルシステム境界を迂回することを覚えておいてください。

    OpenClawは、bind元を正規化パスと、最も深い既存祖先を通じて解決された正準パスの両方に対して検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、symlink親によるエスケープはクローズドフェイルし、許可ルートのチェックもsymlink解決後に引き続き適用されます。

    例と安全上の注意については、[Sandboxing](/ja-JP/gateway/sandboxing#custom-bind-mounts)および[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように機能しますか？">
    OpenClawのメモリは、agent workspace内のMarkdownファイルです:

    - `memory/YYYY-MM-DD.md`の日次ノート
    - `MEMORY.md`の厳選された長期ノート（main/privateセッションのみ）

    OpenClawはまた、モデルに対して自動Compaction前に永続ノートを書き込むよう促す
    **サイレントなpre-compactionメモリフラッシュ**を実行します。これはworkspaceが
    書き込み可能な場合にのみ実行されます（読み取り専用サンドボックスではスキップされます）。[Memory](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="メモリが物事を忘れ続けます。定着させるにはどうすればよいですか？">
    ボットに**その事実をメモリに書き込む**よう依頼してください。長期ノートは`MEMORY.md`に、
    短期コンテキストは`memory/YYYY-MM-DD.md`に入ります。

    これはまだ改善中の領域です。モデルにメモリを保存するよう促すと役立ちます。
    モデルは何をすべきか理解しています。それでも忘れ続ける場合は、Gatewayが毎回同じ
    workspaceを使っていることを確認してください。

    ドキュメント: [Memory](/ja-JP/concepts/memory)、[Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="メモリは永続的に保持されますか？ 制限はありますか？">
    メモリファイルはディスク上に存在し、削除するまで保持されます。制限は
    モデルではなくストレージです。一方で、**セッションコンテキスト**は依然としてモデルの
    コンテキストウィンドウによって制限されるため、長い会話はCompactionや切り詰めが発生することがあります。そのため
    メモリ検索が存在します。関連する部分だけをコンテキストに引き戻します。

    ドキュメント: [Memory](/ja-JP/concepts/memory)、[Context](/ja-JP/concepts/context)。

  </Accordion>

  <Accordion title="セマンティックメモリ検索にはOpenAI APIキーが必要ですか？">
    **OpenAI embeddings**を使う場合のみ必要です。Codex OAuthはチャット/completionsを対象としており、
    embeddingsへのアクセスは**付与しません**。そのため、**Codexでサインインしても（OAuthまたは
    Codex CLIログイン）**、セマンティックメモリ検索には役立ちません。OpenAI embeddingsには
    引き続き実際のAPIキー（`OPENAI_API_KEY`または`models.providers.openai.apiKey`）が必要です。

    providerを明示的に設定しない場合、OpenClawはAPIキーを解決できると
    providerを自動選択します（認証プロファイル、`models.providers.*.apiKey`、または環境変数）。
    OpenAIキーを解決できる場合はOpenAIを優先し、そうでない場合はGeminiキーを
    解決できればGemini、次にVoyage、次にMistralを選びます。リモートキーが利用できない場合、
    設定するまでメモリ検索は無効のままです。ローカルモデルのパスが
    設定され存在する場合、OpenClawは
    `local`を優先します。Ollamaは
    `memorySearch.provider = "ollama"`を明示的に設定した場合にサポートされます。

    ローカルのまま使いたい場合は、`memorySearch.provider = "local"`（必要に応じて
    `memorySearch.fallback = "none"`も）を設定してください。Gemini embeddingsを使いたい場合は、
    `memorySearch.provider = "gemini"`を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定してください。**OpenAI、Gemini、Voyage、Mistral、Ollama、またはlocal**のembedding
    モデルをサポートしています。セットアップの詳細は[Memory](/ja-JP/concepts/memory)を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClawで使うすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClawの状態はローカル**ですが、**外部サービスは送信した内容を引き続き見ます**。

    - **デフォルトではローカル:** セッション、メモリファイル、設定、workspaceはGatewayホスト上にあります
      （`~/.openclaw` + workspaceディレクトリ）。
    - **必要に応じてリモート:** モデルprovider（Anthropic/OpenAIなど）に送るメッセージは
      それらのAPIに送信され、チャットプラットフォーム（WhatsApp/Telegram/Slackなど）はメッセージデータを
      それぞれのサーバーに保存します。
    - **影響範囲は自分で制御可能:** ローカルモデルを使えばプロンプトは自分のマシン上に残せますが、channel
      トラフィックは引き続きそのchannelのサーバーを経由します。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace)、[Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClawはどこにデータを保存しますか？">
    すべては`$OPENCLAW_STATE_DIR`配下にあります（デフォルト: `~/.openclaw`）:

    | Path                                                            | 用途                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 旧OAuthインポート（初回使用時に認証プロファイルへコピー）          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル（OAuth、APIキー、および任意の`keyRef`/`tokenRef`） |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider用の任意のファイルバック秘密ペイロード    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 旧互換ファイル（静的な`api_key`エントリは除去済み）                |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | provider状態（例: `whatsapp/<accountId>/creds.json`）              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | agentごとの状態（agentDir + sessions）                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（agentごと）                                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッションメタデータ（agentごと）                                  |

    旧single-agentパス: `~/.openclaw/agent/*`（`openclaw doctor`で移行されます）。

    **workspace**（AGENTS.md、メモリファイル、skillsなど）は別で、`agents.defaults.workspace`経由で設定します（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは`~/.openclaw`ではなく、**agent workspace**内に置きます。

    - **Workspace（agentごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、任意で`HEARTBEAT.md`。
      小文字のルート`memory.md`は旧修復入力専用です。両方のファイルが存在する場合、
      `openclaw doctor --fix`で`MEMORY.md`に統合できます。
    - **State dir（`~/.openclaw`）**: 設定、channel/provider状態、認証プロファイル、セッション、ログ、
      および共有skills（`~/.openclaw/skills`）。

    デフォルトworkspaceは`~/.openclaw/workspace`で、次のように設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にボットが「忘れる」場合は、Gatewayが起動ごとに同じ
    workspaceを使っていることを確認してください（また、リモートモードでは**gatewayホストの**
    workspaceが使われ、ローカルのラップトップのものではないことに注意してください）。

    ヒント: 永続的な振る舞いや設定を持たせたい場合は、チャット履歴に頼るのではなく、
    ボットに**AGENTS.mdまたはMEMORY.mdに書き込む**よう依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace)と[Memory](/ja-JP/concepts/memory)を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **agent workspace**を**プライベートな**gitリポジトリに置き、
    プライベートな場所（例: GitHub private）にバックアップしてください。これによりメモリ + AGENTS/SOUL/USER
    ファイルを保存でき、後でアシスタントの「心」を復元できます。

    `~/.openclaw`配下のもの（認証情報、セッション、トークン、または暗号化された秘密ペイロード）は**コミットしないでください**。
    完全復元が必要な場合は、workspaceとstateディレクトリの両方を
    別々にバックアップしてください（上記の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClawを完全にアンインストールするにはどうすればよいですか？">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="agentsはworkspaceの外でも作業できますか？">
    はい。workspaceは**デフォルトのcwd**とメモリアンカーであり、厳格なサンドボックスではありません。
    相対パスはworkspace内で解決されますが、絶対パスは別の
    ホスト上の場所にもアクセスできます。隔離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)またはagentごとのサンドボックス設定を使ってください。リポジトリを
    デフォルト作業ディレクトリにしたい場合は、そのagentの
    `workspace`をリポジトリルートに向けてください。OpenClawリポジトリは単なるソースコードなので、
    意図的にagentにその中で作業させたい場合を除き、workspaceは分けてください。

    例（リポジトリをデフォルトcwdにする）:

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="リモートモード: セッションストアはどこにありますか？">
    セッション状態は**gatewayホスト**が管理します。リモートモードでは、重要なセッションストアはローカルのラップトップではなくリモートマシン上にあります。[Session management](/ja-JP/concepts/session)を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定はどの形式ですか？ どこにありますか？">
    OpenClawは`$OPENCLAW_CONFIG_PATH`から任意の**JSON5**設定を読み込みます（デフォルト: `~/.openclaw/openclaw.json`）:

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルが存在しない場合は、安全寄りのデフォルト（`~/.openclaw/workspace`のデフォルトworkspaceを含む）を使用します。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または"tailnet"）を設定したら、何もlistenしなくなった / UIにunauthorizedと表示される'>
    非loopback bindには**有効なgateway認証経路**が必要です。実際には次のいずれかを意味します:

    - 共有シークレット認証: tokenまたはpassword
    - 正しく設定された非loopbackのID認識型リバースプロキシ配下での`gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    注意:

    - `gateway.remote.token` / `.password`だけではローカルgateway認証は有効になりません。
    - ローカル呼び出し経路で`gateway.remote.*`をフォールバックとして使えるのは、`gateway.auth.*`が未設定の場合のみです。
    - password認証の場合は、代わりに`gateway.auth.mode: "password"`と`gateway.auth.password`（または`OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示的に設定されていて未解決の場合、解決はクローズドフェイルします（リモートフォールバックによるマスキングはありません）。
    - 共有シークレットのControl UIセットアップでは、`connect.params.auth.token`または`connect.params.auth.password`（app/UI設定に保存）で認証します。Tailscale Serveや`trusted-proxy`のようなID保持モードでは、代わりにリクエストヘッダーを使用します。共有シークレットをURLに入れるのは避けてください。
    - `gateway.auth.mode: "trusted-proxy"`では、同一ホストのloopbackリバースプロキシであってもtrusted-proxy認証の条件を満たしません。trusted proxyは設定済みの非loopbackソースである必要があります。

  </Accordion>

  <Accordion title="なぜ今はlocalhostでもtokenが必要なのですか？">
    OpenClawは、loopbackを含めてデフォルトでgateway認証を強制します。通常のデフォルト経路では、これはtoken認証を意味します。明示的な認証経路が設定されていない場合、gateway起動時にtokenモードへ解決され、自動生成されたtokenが`gateway.auth.token`に保存されるため、**ローカルWSクライアントも認証が必要**です。これにより、他のローカルプロセスからGatewayが呼び出されるのを防ぎます。

    別の認証経路を使いたい場合は、明示的にpasswordモード（または、非loopbackのID認識型リバースプロキシ向けの`trusted-proxy`）を選べます。本当にopen loopbackにしたい場合は、設定で`gateway.auth.mode: "none"`を明示的に指定してください。doctorはいつでもtokenを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定を変更したら再起動が必要ですか？">
    Gatewayは設定を監視しており、ホットリロードをサポートします:

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はホット適用し、重要な変更では再起動
    - `hot`、`restart`、`off`もサポートされています

  </Accordion>

  <Accordion title="CLIの気の利いたタグラインを無効にするにはどうすればよいですか？">
    設定で`cli.banner.taglineMode`を設定してください:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: タグラインのテキストは非表示にしますが、バナーのタイトル/バージョン行は残します。
    - `default`: 毎回`All your chats, one OpenClaw.`を使用します。
    - `random`: 面白い/季節のタグラインをローテーション表示します（デフォルト動作）。
    - バナー自体を表示したくない場合は、環境変数`OPENCLAW_HIDE_BANNER=1`を設定してください。

  </Accordion>

  <Accordion title="Web検索（およびWeb fetch）を有効にするにはどうすればよいですか？">
    `web_fetch`はAPIキーなしで動作します。`web_search`は選択した
    providerに依存します:

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、TavilyのようなAPIベースのproviderでは、通常どおりのAPIキー設定が必要です。
    - Ollama Web Searchはキー不要ですが、設定済みのOllamaホストを使用し、`ollama signin`が必要です。
    - DuckDuckGoはキー不要ですが、非公式のHTMLベース統合です。
    - SearXNGはキー不要/セルフホスト型です。`SEARXNG_BASE_URL`または`plugins.entries.searxng.config.webSearch.baseUrl`を設定してください。

    **推奨:** `openclaw configure --section web`を実行してproviderを選んでください。
    環境変数の代替:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY`または`MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または`MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY`または`OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // 任意。自動検出する場合は省略
            },
          },
        },
    }
    ```

    provider固有のweb-search設定は、現在`plugins.entries.<plugin>.config.webSearch.*`配下にあります。
    旧`tools.web.search.*`のproviderパスは互換性のため一時的に引き続き読み込まれますが、新しい設定では使用しないでください。
    Firecrawlのweb-fetchフォールバック設定は`plugins.entries.firecrawl.config.webFetch.*`配下にあります。

    注意:

    - 許可リストを使っている場合は、`web_search`/`web_fetch`/`x_search`または`group:web`を追加してください。
    - `web_fetch`はデフォルトで有効です（明示的に無効化しない限り）。
    - `tools.web.fetch.provider`を省略すると、OpenClawは利用可能な認証情報から、準備済みの最初のfetchフォールバックproviderを自動検出します。現在のバンドルproviderはFirecrawlです。
    - デーモンは`~/.openclaw/.env`（またはサービス環境）から環境変数を読み込みます。

    ドキュメント: [Web tools](/ja-JP/tools/web)。

  </Accordion>

  <Accordion title="config.applyで設定が消えました。どう復旧し、どう防げばよいですか？">
    `config.apply`は**設定全体**を置き換えます。部分オブジェクトを送ると、それ以外は
    すべて削除されます。

    現在のOpenClawは、多くの偶発的な破壊的上書きから保護します:

    - OpenClaw管理の設定書き込みでは、書き込み前に変更後の完全な設定を検証します。
    - 無効または破壊的なOpenClaw管理の書き込みは拒否され、`openclaw.json.rejected.*`として保存されます。
    - 直接編集によって起動やホットリロードが壊れた場合、Gatewayは最後に正常だった設定を復元し、拒否されたファイルを`openclaw.json.clobbered.*`として保存します。
    - 復旧後、メインagentは起動時警告を受け取るため、同じ不正な設定を盲目的に再度書き込みません。

    復旧方法:

    - `openclaw logs --follow`で`Config auto-restored from last-known-good`、`Config write rejected:`、または`config reload restored last-known-good config`を確認してください。
    - アクティブな設定の隣にある最新の`openclaw.json.clobbered.*`または`openclaw.json.rejected.*`を確認してください。
    - 復元されたアクティブ設定が動作するならそれを維持し、意図したキーだけを`openclaw config set`または`config.patch`で戻してください。
    - `openclaw config validate`と`openclaw doctor`を実行してください。
    - 最後に正常だった設定や拒否されたペイロードがない場合は、バックアップから復元するか、`openclaw doctor`を再実行してchannels/modelsを再設定してください。
    - 想定外だった場合は、バグ報告を行い、最後に分かっている設定またはバックアップを含めてください。
    - ローカルのコーディングagentなら、ログや履歴から動作する設定を再構築できることがよくあります。

    防止方法:

    - 小さな変更には`openclaw config set`を使ってください。
    - 対話的な編集には`openclaw configure`を使ってください。
    - 正確なパスやフィールド形状が不確かな場合は、まず`config.schema.lookup`を使ってください。浅いスキーマノードと、掘り下げ用の直下の子サマリーを返します。
    - 部分的なRPC編集には`config.patch`を使い、`config.apply`は完全な設定置換専用にしてください。
    - agent実行からowner専用の`gateway`ツールを使っている場合でも、`tools.exec.ask` / `tools.exec.security`への書き込みは引き続き拒否されます（同じ保護されたexecパスに正規化される旧`tools.bash.*`エイリアスを含む）。

    ドキュメント: [Config](/ja-JP/cli/config)、[Configure](/ja-JP/cli/configure)、[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="複数デバイスにまたがる専用ワーカー付きの中央Gatewayを実行するにはどうすればよいですか？">
    一般的なパターンは、**1つのGateway**（例: Raspberry Pi）に**nodes**と**agents**を組み合わせる方法です:

    - **Gateway（中央）:** channels（Signal/WhatsApp）、ルーティング、セッションを管理します。
    - **Nodes（デバイス）:** Macs/iOS/Androidが周辺機器として接続し、ローカルツール（`system.run`、`canvas`、`camera`）を公開します。
    - **Agents（ワーカー）:** 特殊な役割（例: 「Hetzner ops」「Personal data」）向けの別々の頭脳/workspaceです。
    - **Sub-agents:** 並列化したいときに、メインagentからバックグラウンド作業を起動します。
    - **TUI:** Gatewayに接続し、agents/sessionsを切り替えます。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Remote access](/ja-JP/gateway/remote)、[Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[Sub-agents](/ja-JP/tools/subagents)、[TUI](/ja-JP/web/tui)。

  </Accordion>

  <Accordion title="OpenClawのブラウザはヘッドレスで実行できますか？">
    はい。設定オプションです:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    デフォルトは`false`（ヘッドフル）です。ヘッドレスでは、一部のサイトでbot検出が作動しやすくなります。[Browser](/ja-JP/tools/browser)を参照してください。

    ヘッドレスは**同じChromiumエンジン**を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです:

    - ブラウザウィンドウが表示されません（視覚的な確認が必要ならスクリーンショットを使ってください）。
    - 一部のサイトはヘッドレスモードでの自動化に対してより厳格です（CAPTCHA、bot対策）。
      たとえば、X/Twitterはヘッドレスセッションをブロックすることがよくあります。

  </Accordion>

  <Accordion title="ブラウザ制御にBraveを使うにはどうすればよいですか？">
    `browser.executablePath`をBraveのバイナリ（または任意のChromium系ブラウザ）に設定し、Gatewayを再起動してください。
    完全な設定例は[Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser)を参照してください。
  </Accordion>
</AccordionGroup>

## リモートgatewayとnodes

<AccordionGroup>
  <Accordion title="Telegram、gateway、nodesの間でコマンドはどのように伝播しますか？">
    Telegramメッセージは**gateway**によって処理されます。gatewayがagentを実行し、
    その後、Nodeツールが必要なときだけ**Gateway WebSocket**経由でnodesを呼び出します:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    nodesは受信providerトラフィックを見ません。受け取るのはNode RPC呼び出しだけです。

  </Accordion>

  <Accordion title="Gatewayがリモートでホストされている場合、agentはどうやって自分のコンピューターにアクセスできますか？">
    短く言うと、**自分のコンピューターをNodeとしてペアリング**します。Gatewayは別の場所で動作しますが、
    Gateway WebSocket経由でローカルマシン上の`node.*`ツール（画面、カメラ、system）を
    呼び出せます。

    一般的なセットアップ:

    1. 常時稼働ホスト（VPS/ホームサーバー）でGatewayを実行する。
    2. Gatewayホストと自分のコンピューターを同じtailnetに置く。
    3. Gateway WSに到達できることを確認する（tailnet bindまたはSSHトンネル）。
    4. macOSアプリをローカルで開き、**Remote over SSH**モード（または直接tailnet）
       で接続して、Nodeとして登録できるようにする。
    5. Gateway上でNodeを承認する:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個のTCPブリッジは不要です。nodesはGateway WebSocket経由で接続します。

    セキュリティ上の注意: macOS Nodeをペアリングすると、そのマシンで`system.run`が可能になります。信頼できるデバイスだけを
    ペアリングし、[Security](/ja-JP/gateway/security)を確認してください。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Gateway protocol](/ja-JP/gateway/protocol)、[macOS remote mode](/ja-JP/platforms/mac/remote)、[Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Tailscaleは接続されているのに、返信がありません。どうすればよいですか？">
    基本を確認してください:

    - Gatewayが動作している: `openclaw gateway status`
    - Gatewayヘルス: `openclaw status`
    - Channelヘルス: `openclaw channels status`

    その後、認証とルーティングを確認します:

    - Tailscale Serveを使っている場合は、`gateway.auth.allowTailscale`が正しく設定されていることを確認してください。
    - SSHトンネル経由で接続している場合は、ローカルトンネルが起動していて正しいポートを指していることを確認してください。
    - 許可リスト（DMまたはグループ）に自分のアカウントが含まれていることを確認してください。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale)、[Remote access](/ja-JP/gateway/remote)、[Channels](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2つのOpenClawインスタンス（ローカル + VPS）は互いにやり取りできますか？">
    はい。組み込みの「bot-to-bot」ブリッジはありませんが、いくつかの
    信頼できる方法で接続できます:

    **最も簡単:** 両方のbotがアクセスできる通常のチャットchannel（Telegram/Slack/WhatsApp）を使います。
    Bot AがBot Bにメッセージを送り、その後Bot Bが通常どおり返信するようにします。

    **CLIブリッジ（汎用）:** スクリプトを実行して、相手側Gatewayを
    `openclaw agent --message ... --deliver`で呼び出し、相手のbotが
    待ち受けているチャットをターゲットにします。片方のbotがリモートVPS上にある場合は、
    SSH/Tailscale経由でそのリモートGatewayにCLIを向けてください（[Remote access](/ja-JP/gateway/remote)を参照）。

    例のパターン（対象Gatewayに到達できるマシンから実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2つのbotが無限ループしないようにガードレールを追加してください（メンション時のみ、channel
    許可リスト、または「botメッセージには返信しない」ルール）。

    ドキュメント: [Remote access](/ja-JP/gateway/remote)、[Agent CLI](/ja-JP/cli/agent)、[Agent send](/ja-JP/tools/agent-send)。

  </Accordion>

  <Accordion title="複数agentsのために別々のVPSが必要ですか？">
    いいえ。1つのGatewayで複数agentsをホストでき、それぞれが独自のworkspace、デフォルトモデル、
    ルーティングを持てます。これが通常のセットアップであり、
    agentごとに1台のVPSを実行するよりも、はるかに安価で簡単です。

    厳格な分離（セキュリティ境界）や、共有したくない大きく異なる設定が必要な場合にのみ、
    別々のVPSを使ってください。そうでなければ、1つのGatewayを維持し、
    複数agentsまたはsub-agentsを使ってください。

  </Accordion>

  <Accordion title="VPSからSSHする代わりに、個人用ノートPC上のNodeを使う利点はありますか？">
    はい。リモートGatewayからノートPCに到達するための第一級の方法がNodeであり、
    シェルアクセス以上の機能を提供します。GatewayはmacOS/Linux（WindowsはWSL2経由）で動作し、
    軽量です（小さなVPSやRaspberry Pi級のマシンで十分で、4 GB RAMあれば足ります）。そのため、
    常時稼働ホスト + ノートPCをNodeにする構成が一般的です。

    - **受信SSHが不要。** NodesはGateway WebSocketへ外向き接続し、デバイスペアリングを使います。
    - **より安全な実行制御。** `system.run`は、そのノートPC上のNode許可リスト/承認によって制御されます。
    - **より多くのデバイスツール。** Nodesは`system.run`に加えて`canvas`、`camera`、`screen`を公開します。
    - **ローカルブラウザ自動化。** GatewayはVPS上に置いたまま、ノートPC上のNodeホスト経由でChromeをローカル実行するか、Chrome MCP経由でホスト上のローカルChromeに接続できます。

    SSHはその場限りのシェルアクセスには適していますが、継続的なagentワークフローや
    デバイス自動化にはNodeの方が簡単です。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)、[Browser](/ja-JP/tools/browser)。

  </Accordion>

  <Accordion title="nodesはgatewayサービスを実行しますか？">
    いいえ。意図的に分離プロファイルを実行する場合（[Multiple gateways](/ja-JP/gateway/multiple-gateways)を参照）を除き、ホストごとに実行すべきgatewayは**1つだけ**です。nodesはgatewayに接続する周辺機器です
    （iOS/Android nodes、またはメニューバーアプリのmacOS「node mode」）。ヘッドレスNode
    ホストとCLI制御については、[Node host CLI](/ja-JP/cli/node)を参照してください。

    `gateway`、`discovery`、`canvasHost`の変更には完全再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用するAPI / RPC手段はありますか？">
    はい。

    - `config.schema.lookup`: 書き込む前に、1つの設定サブツリーを、その浅いスキーマノード、一致したUIヒント、直下の子サマリーとともに調べる
    - `config.get`: 現在のスナップショット + ハッシュを取得する
    - `config.patch`: 安全な部分更新（ほとんどのRPC編集で推奨）。可能ならホットリロードし、必要なら再起動します
    - `config.apply`: 設定全体を検証して置換する。可能ならホットリロードし、必要なら再起動します
    - owner専用の`gateway`ランタイムツールは、依然として`tools.exec.ask` / `tools.exec.security`の書き換えを拒否します。旧`tools.bash.*`エイリアスは同じ保護されたexecパスに正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限で無難な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これによりworkspaceが設定され、誰がボットをトリガーできるかが制限されます。

  </Accordion>

  <Accordion title="VPSにTailscaleを設定してMacから接続するにはどうすればよいですか？">
    最小手順:

    1. **VPSでインストール + ログイン**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Macでインストール + ログイン**
       - Tailscaleアプリを使い、同じtailnetにサインインします。
    3. **MagicDNSを有効化（推奨）**
       - Tailscale管理コンソールでMagicDNSを有効にして、VPSに安定した名前を付けます。
    4. **tailnetホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSHなしでControl UIを使いたい場合は、VPSでTailscale Serveを使ってください:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これによりgatewayはloopbackにbindされたままとなり、Tailscale経由でHTTPSが公開されます。[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

  </Accordion>

  <Accordion title="Mac NodeをリモートGateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serveは**Gateway Control UI + WS**を公開します。nodesは同じGateway WSエンドポイント経由で接続します。

    推奨セットアップ:

    1. **VPSとMacが同じtailnet上にあることを確認する**。
    2. **macOSアプリをRemoteモードで使う**（SSHターゲットにはtailnetホスト名を使えます）。
       アプリはGatewayポートをトンネルし、Nodeとして接続します。
    3. gateway上で**Nodeを承認する**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway protocol](/ja-JP/gateway/protocol)、[Discovery](/ja-JP/gateway/discovery)、[macOS remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目のノートPCにはインストールすべきですか？ それともNodeを追加するだけでよいですか？">
    2台目のノートPCで必要なのが**ローカルツール**（screen/camera/exec）だけなら、
    **Node**として追加してください。これによりGatewayを1つに保てて、設定の重複を避けられます。ローカルNodeツールは
    現時点ではmacOS専用ですが、今後ほかのOSにも拡張する予定です。

    **厳格な分離**または完全に別々の2つのボットが必要な場合にのみ、2つ目のGatewayをインストールしてください。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)、[Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と.envの読み込み

<AccordionGroup>
  <Accordion title="OpenClawはどのように環境変数を読み込みますか？">
    OpenClawは親プロセス（シェル、launchd/systemd、CIなど）から環境変数を読み込み、さらに次も読み込みます:

    - 現在の作業ディレクトリの`.env`
    - `~/.openclaw/.env`（別名`$OPENCLAW_STATE_DIR/.env`）のグローバルフォールバック`.env`

    どちらの`.env`ファイルも、既存の環境変数を上書きしません。

    設定内でインライン環境変数を定義することもできます（プロセス環境に存在しない場合のみ適用）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完全な優先順位とソースについては[/environment](/ja-JP/help/environment)を参照してください。

  </Accordion>

  <Accordion title="サービス経由でGatewayを起動したら、環境変数が消えました。どうすればよいですか？">
    よくある修正は2つあります:

    1. サービスがシェル環境を継承しない場合でも読み込まれるように、不足しているキーを`~/.openclaw/.env`に入れる。
    2. シェルインポートを有効にする（オプトインの利便機能）:

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    これによりログインシェルが実行され、不足している想定キーだけがインポートされます（上書きはしません）。
    対応する環境変数:
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKENを設定したのに、models statusに「Shell env: off」と表示されるのはなぜですか？'>
    `openclaw models status`は、**シェル環境インポート**が有効かどうかを表示します。「Shell env: off」は
    環境変数が存在しないことを意味するのではなく、OpenClawが
    ログインシェルを自動では読み込まないという意味です。

    Gatewayがサービス（launchd/systemd）として動作している場合、シェルの
    環境は継承されません。次のいずれかで修正してください:

    1. トークンを`~/.openclaw/.env`に入れる:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. またはシェルインポートを有効にする（`env.shellEnv.enabled: true`）。
    3. または設定の`env`ブロックに追加する（不足している場合のみ適用）。

    その後gatewayを再起動し、再確認してください:

    ```bash
    openclaw models status
    ```

    Copilotトークンは`COPILOT_GITHUB_TOKEN`（`GH_TOKEN` / `GITHUB_TOKEN`も可）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers)および[/environment](/ja-JP/help/environment)を参照してください。

  </Accordion>
</AccordionGroup>

## セッションと複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を始めるにはどうすればよいですか？">
    単独のメッセージとして`/new`または`/reset`を送信してください。[Session management](/ja-JP/concepts/session)を参照してください。
  </Accordion>

  <Accordion title="/newを一度も送らない場合、セッションは自動でリセットされますか？">
    セッションは`session.idleMinutes`後に期限切れにできますが、これは**デフォルトで無効**です（デフォルトは**0**）。
    有効にするには正の値を設定してください。有効時は、アイドル期間の**次の**
    メッセージで、そのチャットキーに対して新しいセッションIDが開始されます。
    これはトランスクリプトを削除するのではなく、新しいセッションを開始するだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClawインスタンスのチーム（CEO 1人と多数のagents）を作る方法はありますか？">
    はい。**マルチエージェントルーティング**と**sub-agents**で実現できます。1つの調整役
    agentと、それぞれ独自のworkspaceとモデルを持つ複数のワーカーagentを作成できます。

    とはいえ、これは**楽しい実験**として捉えるのが最適です。トークン消費が大きく、
    1つのボットを別々のセッションで使うより効率が悪いことが多いです。私たちが
    想定する典型的なモデルは、1つのボットと対話し、並列作業には異なるセッションを使う形です。その
    ボットは必要に応じてsub-agentsも起動できます。

    ドキュメント: [Multi-agent routing](/ja-JP/concepts/multi-agent)、[Sub-agents](/ja-JP/tools/subagents)、[Agents CLI](/ja-JP/cli/agents)。

  </Accordion>

  <Accordion title="タスク途中でコンテキストが切り詰められたのはなぜですか？ 防ぐにはどうすればよいですか？">
    セッションコンテキストはモデルのウィンドウによって制限されます。長いチャット、大きなツール出力、多数の
    ファイルにより、Compactionや切り詰めが発生することがあります。

    有効な対策:

    - ボットに現在の状態を要約してファイルに書き出すよう依頼する。
    - 長いタスクの前に`/compact`を使い、話題を変えるときは`/new`を使う。
    - 重要なコンテキストはworkspaceに保持し、ボットにそれを読み戻させる。
    - 長い作業や並列作業にはsub-agentsを使い、メインチャットを小さく保つ。
    - 頻繁に発生する場合は、より大きなコンテキストウィンドウを持つモデルを選ぶ。

  </Accordion>

  <Accordion title="OpenClawを完全にリセットしつつ、インストールは維持するにはどうすればよいですか？">
    resetコマンドを使ってください:

    ```bash
    openclaw reset
    ```

    非対話の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注意:

    - Onboardingは既存設定を検出すると**Reset**も提示します。[Onboarding (CLI)](/ja-JP/start/wizard)を参照してください。
    - プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各state dirをリセットしてください（デフォルトは`~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（開発専用。開発用設定 + 認証情報 + セッション + workspaceを消去）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ます。どうやってリセットまたはコンパクトすればよいですか？'>
    次のいずれかを使ってください:

    - **Compact**（会話は維持しつつ、古いターンを要約します）:

      ```
      /compact
      ```

      または`/compact <instructions>`で要約の方針を指定します。

    - **Reset**（同じチャットキーに対して新しいセッションIDを作成します）:

      ```
      /new
      /reset
      ```

    それでも繰り返し発生する場合:

    - 古いツール出力を削減するために、**session pruning**（`agents.defaults.contextPruning`）を有効化または調整する。
    - より大きなコンテキストウィンドウを持つモデルを使う。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction)、[Session pruning](/ja-JP/concepts/session-pruning)、[Session management](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」と表示されるのはなぜですか？'>
    これはproviderの検証エラーです。モデルが必須の
    `input`なしで`tool_use`ブロックを出力したことを意味します。通常はセッション履歴が古いか破損していることが原因です（長いスレッドや
    ツール/スキーマ変更の後によく起こります）。

    対処法: `/new`（単独メッセージ）で新しいセッションを開始してください。

  </Accordion>

  <Accordion title="なぜ30分ごとにHeartbeatメッセージが来るのですか？">
    Heartbeatはデフォルトで**30分ごと**（OAuth認証使用時は**1時間ごと**）に実行されます。調整または無効化するには:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // または "0m" で無効化
          },
        },
      },
    }
    ```

    `HEARTBEAT.md`が存在しても、実質的に空（空行と`# Heading`のようなmarkdown
    見出しだけ）の場合、OpenClawはAPI呼び出しを節約するためHeartbeat実行をスキップします。
    ファイルが存在しない場合でも、Heartbeatは実行され、モデルが何をするか判断します。

    agentごとのオーバーライドには`agents.list[].heartbeat`を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsAppグループに「ボットアカウント」を追加する必要がありますか？'>
    いいえ。OpenClawは**自分自身のアカウント**で動作するため、自分がそのグループにいれば、OpenClawはそれを見ることができます。
    デフォルトでは、送信者を許可するまでグループ返信はブロックされます（`groupPolicy: "allowlist"`）。

    グループ返信をトリガーできるのを**自分だけ**にしたい場合:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="WhatsAppグループのJIDを取得するにはどうすればよいですか？">
    方法1（最速）: ログを追跡し、グループでテストメッセージを送信します:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us`で終わる`chatId`（または`from`）を探してください。例:
    `1234567890-1234567890@g.us`。

    方法2（すでに設定済み/許可リスト済みの場合）: 設定からグループを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[Directory](/ja-JP/cli/directory)、[Logs](/ja-JP/cli/logs)。

  </Accordion>

  <Accordion title="なぜOpenClawはグループで返信しないのですか？">
    よくある原因は2つあります:

    - メンション制御が有効です（デフォルト）。ボットを@メンションする必要があります（または`mentionPatterns`に一致させる必要があります）。
    - `channels.whatsapp.groups`を`"*"`なしで設定しており、そのグループが許可リストに入っていません。

    [Groups](/ja-JP/channels/groups)および[Group messages](/ja-JP/channels/group-messages)を参照してください。

  </Accordion>

  <Accordion title="グループ/スレッドはDMとコンテキストを共有しますか？">
    直接チャットはデフォルトでメインセッションに集約されます。グループ/channelsは独自のセッションキーを持ち、Telegramトピック / Discordスレッドは別セッションです。[Groups](/ja-JP/channels/groups)および[Group messages](/ja-JP/channels/group-messages)を参照してください。
  </Accordion>

  <Accordion title="作成できるworkspaceとagentの数に制限はありますか？">
    厳密な上限はありません。数十個（場合によっては数百個）でも問題ありませんが、次に注意してください:

    - **ディスク使用量の増加:** sessions + transcriptsは`~/.openclaw/agents/<agentId>/sessions/`配下に保存されます。
    - **トークンコスト:** agentが増えるほど同時モデル利用も増えます。
    - **運用負荷:** agentごとの認証プロファイル、workspace、channelルーティング。

    ヒント:

    - agentごとに1つの**アクティブな**workspace（`agents.defaults.workspace`）を維持する。
    - ディスクが増えてきたら古いセッションを整理する（JSONLまたは保存エントリを削除）。
    - `openclaw doctor`で不要なworkspaceやプロファイル不一致を見つける。

  </Accordion>

  <Accordion title="複数のボットやチャットを同時に実行できますか（Slack）？ また、その設定方法は？">
    はい。**Multi-Agent Routing**を使って複数の分離されたagentを実行し、受信メッセージを
    channel/account/peerごとにルーティングできます。Slackはchannelとしてサポートされており、特定のagentにバインドできます。

    ブラウザアクセスは強力ですが、「人間ができることなら何でもできる」わけではありません。bot対策、CAPTCHA、MFAは
    依然として自動化を妨げることがあります。最も信頼性の高いブラウザ制御を行うには、ホスト上でローカルChrome MCPを使うか、
    実際にブラウザを実行しているマシン上でCDPを使用してください。

    ベストプラクティスのセットアップ:

    - 常時稼働のGatewayホスト（VPS/Mac mini）。
    - 役割ごとに1つのagent（バインディング）。
    - それらのagentにバインドされたSlack channel。
    - 必要に応じてChrome MCPまたはNode経由のローカルブラウザ。

    ドキュメント: [Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[Slack](/ja-JP/channels/slack)、
    [Browser](/ja-JP/tools/browser)、[Nodes](/ja-JP/nodes)。

  </Accordion>
</AccordionGroup>

## モデル、フェイルオーバー、認証プロファイル

モデルに関するQ&A — デフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル —
は[Models FAQ](/ja-JP/help/faq-models)にあります。

## Gateway: ポート、「already running」、リモートモード

<AccordionGroup>
  <Accordion title="Gatewayはどのポートを使いますか？">
    `gateway.port`は、WebSocket + HTTP（Control UI、hooksなど）用の単一の多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > デフォルト 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway statusで「Runtime: running」なのに「Connectivity probe: failed」と表示されるのはなぜですか？'>
    これは、「running」が**supervisor**の視点（launchd/systemd/schtasks）だからです。一方、connectivity probeはCLIが実際にgateway WebSocketへ接続している結果です。

    `openclaw gateway status`を使い、次の行を信頼してください:

    - `Probe target:`（プローブが実際に使ったURL）
    - `Listening:`（ポートに実際にbindされているもの）
    - `Last gateway error:`（プロセスは生きているのにポートがlistenしていない場合によくある根本原因）

  </Accordion>

  <Accordion title='openclaw gateway statusで「Config (cli)」と「Config (service)」が異なって表示されるのはなぜですか？'>
    編集している設定ファイルと、サービスが実行中の設定ファイルが異なっています（多くは`--profile` / `OPENCLAW_STATE_DIR`の不一致）。

    修正:

    ```bash
    openclaw gateway install --force
    ```

    サービスに使わせたいものと同じ`--profile` / 環境でこれを実行してください。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」とはどういう意味ですか？'>
    OpenClawは、起動直後にWebSocketリスナーへbindすることでランタイムロックを強制します（デフォルトは`ws://127.0.0.1:18789`）。`EADDRINUSE`でbindに失敗すると、別のインスタンスがすでにlistenしていることを示す`GatewayLockError`を投げます。

    対処法: もう一方のインスタンスを停止する、ポートを解放する、または`openclaw gateway --port <port>`で実行してください。

  </Accordion>

  <Accordion title="OpenClawをリモートモード（別の場所にあるGatewayへクライアントが接続）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"`を設定し、必要に応じて共有シークレットのリモート認証情報とともに、リモートのWebSocket URLを指定します:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    注意:

    - `openclaw gateway`が起動するのは、`gateway.mode`が`local`のときだけです（またはオーバーライドフラグを渡した場合）。
    - macOSアプリは設定ファイルを監視し、これらの値が変わるとライブでモードを切り替えます。
    - `gateway.remote.token` / `.password`はクライアント側のリモート認証情報専用であり、それ自体でローカルgateway認証を有効にはしません。

  </Accordion>

  <Accordion title='Control UIに「unauthorized」と表示される（または再接続を繰り返す）のですが、どうすればよいですか？'>
    gatewayの認証経路と、UIの認証方法が一致していません。

    事実（コードベース）:

    - Control UIは、現在のブラウザタブのセッションと選択中のgateway URLに対して、tokenを`sessionStorage`に保持します。そのため、同じタブでの再読み込みは、長期的なlocalStorage token永続化を復元しなくても動作を維持できます。
    - `AUTH_TOKEN_MISMATCH`時、gatewayが再試行ヒント（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）を返した場合、信頼済みクライアントはキャッシュ済みデバイストークンで1回だけ制限付き再試行を行えます。
    - このキャッシュトークン再試行では、デバイストークンとともに保存されている、承認済みスコープのキャッシュも再利用されます。明示的な`deviceToken` / 明示的な`scopes`の呼び出し側は、キャッシュスコープを継承せず、引き続き要求したスコープセットを保持します。
    - この再試行経路以外では、connect認証の優先順位は、明示的な共有token/password、次に明示的な`deviceToken`、次に保存済みデバイストークン、最後にbootstrap tokenです。
    - bootstrap tokenのスコープチェックはrole接頭辞付きです。組み込みのbootstrap operator許可リストはoperator要求にしか適合せず、Nodeやその他の非operator roleには、それぞれのrole接頭辞配下のスコープが引き続き必要です。

    修正:

    - 最速: `openclaw dashboard`（dashboard URLを表示 + コピーし、開こうとします。ヘッドレスならSSHヒントを表示）。
    - まだtokenがない場合: `openclaw doctor --generate-gateway-token`。
    - リモートの場合、まずトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行し、その後 `http://127.0.0.1:18789/` を開きます。
    - 共有シークレットモード: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`または`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`を設定し、その対応するシークレットをControl UI設定に貼り付けてください。
    - Tailscale Serveモード: `gateway.auth.allowTailscale`が有効であり、Tailscale IDヘッダーを迂回する生のloopback/tailnet URLではなく、Serve URLを開いていることを確認してください。
    - trusted-proxyモード: 同一ホストのloopback proxyや生のgateway URLではなく、設定済みの非loopback ID認識型proxyを経由していることを確認してください。
    - 1回の再試行後も不一致が続く場合は、ペアリング済みデバイストークンをローテーション/再承認してください:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - そのrotate呼び出しが拒否された場合は、次の2点を確認してください:
      - ペアリング済みデバイスセッションがローテーションできるのは、自分自身のデバイスのみです（`operator.admin`も持っている場合を除く）
      - 明示的な`--scope`値は、呼び出し元の現在のoperatorスコープを超えられません
    - まだ解決しない場合は、`openclaw status --all`を実行し、[Troubleshooting](/ja-JP/gateway/troubleshooting)に従ってください。認証の詳細は[Dashboard](/ja-JP/web/dashboard)を参照してください。

  </Accordion>

  <Accordion title="gateway.bindをtailnetに設定したのにbindできず、何もlistenしません">
    `tailnet` bindは、ネットワークインターフェースからTailscale IP（100.64.0.0/10）を選択します。マシンがTailscale上にない場合（またはインターフェースが停止している場合）、bindする対象がありません。

    修正:

    - そのホストでTailscaleを起動する（100.xアドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"`に切り替える。

    注意: `tailnet`は明示指定です。`auto`はloopbackを優先します。tailnet専用bindが必要な場合は`gateway.bind: "tailnet"`を使ってください。

  </Accordion>

  <Accordion title="同じホストで複数のGatewayを実行できますか？">
    通常はできません。1つのGatewayで複数のメッセージングchannelとagentを実行できます。複数のGatewayは、冗長性（例: 救援bot）や厳格な分離が必要な場合にのみ使ってください。

    実行は可能ですが、次を分離する必要があります:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（workspaceの分離）
    - `gateway.port`（一意のポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに`openclaw --profile <name> ...`を使う（`~/.openclaw-<name>`が自動作成されます）。
    - 各プロファイル設定で一意の`gateway.port`を設定する（または手動実行では`--port`を渡す）。
    - プロファイルごとのサービスをインストールする: `openclaw --profile <name> gateway install`。

    プロファイルはサービス名にも接尾辞を付けます（`ai.openclaw.<profile>`、旧`com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完全なガイド: [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ code 1008 とはどういう意味ですか？'>
    Gatewayは**WebSocketサーバー**であり、最初のメッセージとして
    `connect`フレームを期待します。それ以外を受信すると、
    **code 1008**（ポリシー違反）で接続を閉じます。

    よくある原因:

    - **HTTP** URL（`http://...`）をWSクライアントではなくブラウザで開いた。
    - 間違ったポートまたはパスを使った。
    - proxyまたはトンネルが認証ヘッダーを削除した、またはGateway以外のリクエストを送った。

    すぐできる対処:

    1. WS URLを使う: `ws://<host>:18789`（またはHTTPSなら`wss://...`）。
    2. WSポートを通常のブラウザタブで開かない。
    3. 認証が有効なら、`connect`フレームにtoken/passwordを含める。

    CLIまたはTUIを使う場合、URLは次のようになります:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    プロトコルの詳細: [Gateway protocol](/ja-JP/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## ログとデバッグ

<AccordionGroup>
  <Accordion title="ログはどこにありますか？">
    ファイルログ（構造化）:

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file`で固定パスを設定できます。ファイルログレベルは`logging.level`で制御されます。コンソールの詳細度は`--verbose`と`logging.consoleLevel`で制御されます。

    最速のログ追跡:

    ```bash
    openclaw logs --follow
    ```

    サービス/supervisorログ（gatewayがlaunchd/systemd経由で動作している場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log`および`gateway.err.log`（デフォルト: `~/.openclaw/logs/...`。プロファイルでは`~/.openclaw-<profile>/logs/...`）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳細は[Troubleshooting](/ja-JP/gateway/troubleshooting)を参照してください。

  </Accordion>

  <Accordion title="Gatewayサービスを開始/停止/再起動するにはどうすればよいですか？">
    gatewayヘルパーを使ってください:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gatewayを手動で実行している場合、`openclaw gateway --force`でポートを取り戻せます。[Gateway](/ja-JP/gateway)を参照してください。

  </Accordion>

  <Accordion title="Windowsでターミナルを閉じてしまいました。OpenClawを再起動するにはどうすればよいですか？">
    Windowsには**2つのインストールモード**があります:

    **1) WSL2（推奨）:** GatewayはLinux内で動作します。

    PowerShellを開き、WSLに入り、再起動します:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    まだサービスをインストールしていない場合は、フォアグラウンドで起動します:

    ```bash
    openclaw gateway run
    ```

    **2) ネイティブWindows（非推奨）:** GatewayはWindows上で直接動作します。

    PowerShellを開いて実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動で実行している場合（サービスなし）は、次を使います:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows)、[Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gatewayは起動しているのに、返信が届きません。何を確認すべきですか？">
    まずクイックヘルス確認から始めてください:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    よくある原因:

    - モデル認証が**gatewayホスト**上で読み込まれていない（`models status`を確認）。
    - channelのペアリング/許可リストが返信をブロックしている（channel設定 + ログを確認）。
    - 正しいtokenなしでWebChat/Dashboardを開いている。

    リモートの場合は、トンネル/Tailscale接続が有効であり、
    Gateway WebSocketに到達できることを確認してください。

    ドキュメント: [Channels](/ja-JP/channels)、[Troubleshooting](/ja-JP/gateway/troubleshooting)、[Remote access](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='「Disconnected from gateway: no reason」— どうすればよいですか？'>
    これは通常、UIがWebSocket接続を失ったことを意味します。確認してください:

    1. Gatewayは動作していますか？ `openclaw gateway status`
    2. Gatewayは正常ですか？ `openclaw status`
    3. UIは正しいtokenを持っていますか？ `openclaw dashboard`
    4. リモートの場合、トンネル/Tailscaleリンクは有効ですか？

    その後、ログを追跡します:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/ja-JP/web/dashboard)、[Remote access](/ja-JP/gateway/remote)、[Troubleshooting](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="TelegramのsetMyCommandsが失敗します。何を確認すべきですか？">
    まずログとchannel状態から始めてください:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    その後、エラーに対応させます:

    - `BOT_COMMANDS_TOO_MUCH`: Telegramメニューの項目が多すぎます。OpenClawはすでにTelegramの上限に合わせて削減し、少ないコマンドで再試行しますが、それでも一部のメニュー項目を削る必要があります。Plugin/skill/カスタムコマンドを減らすか、メニューが不要なら`channels.telegram.commands.native`を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または同様のネットワークエラー: VPS上またはproxy配下にいる場合は、外向きHTTPSが許可されており、`api.telegram.org`のDNSが正しく機能していることを確認してください。

    Gatewayがリモートの場合は、Gatewayホスト上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram)、[Channel troubleshooting](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUIに何も出力されません。何を確認すべきですか？">
    まずGatewayに到達できていて、agentが実行できることを確認してください:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUIでは、`/status`を使って現在の状態を確認してください。チャット
    channelへの返信を期待している場合は、配信が有効（`/deliver on`）であることを確認してください。

    ドキュメント: [TUI](/ja-JP/web/tui)、[Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gatewayを完全に停止してから起動するにはどうすればよいですか？">
    サービスをインストール済みの場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これは**監視対象サービス**（macOSではlaunchd、Linuxではsystemd）を停止/起動します。
    Gatewayがバックグラウンドでデーモンとして動作している場合に使ってください。

    フォアグラウンドで実行している場合は、Ctrl-Cで停止してから、次を実行します:

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway の違い">
    - `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナルセッションでgatewayを**フォアグラウンド**実行します。

    サービスをインストール済みならgatewayコマンドを使ってください。`openclaw gateway`は、
    一時的なフォアグラウンド実行をしたいときに使います。

  </Accordion>

  <Accordion title="何かが失敗したときに、最速で詳細を得る方法">
    `--verbose`付きでGatewayを起動すると、コンソールの詳細が増えます。その後、ログファイルを調べてchannel認証、モデルルーティング、RPCエラーを確認してください。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="skillが画像/PDFを生成したのに、何も送信されませんでした">
    agentからの送信添付ファイルには、`MEDIA:<path-or-url>`行を含める必要があります（単独行）。[OpenClaw assistant setup](/ja-JP/start/openclaw)および[Agent send](/ja-JP/tools/agent-send)を参照してください。

    CLIでの送信:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    あわせて確認してください:

    - 対象channelが送信メディアをサポートしており、許可リストでブロックされていないこと。
    - ファイルがproviderのサイズ上限内であること（画像は最大2048pxにリサイズされます）。
    - `tools.fs.workspaceOnly=true`では、ローカルパス送信はworkspace、temp/media-store、およびサンドボックス検証済みファイルに限定されます。
    - `tools.fs.workspaceOnly=false`では、agentがすでに読めるホストローカルファイルを`MEDIA:`で送信できますが、対象はメディアと安全な文書型（画像、音声、動画、PDF、Office文書）のみです。プレーンテキストや秘密情報らしいファイルは引き続きブロックされます。

    [Images](/ja-JP/nodes/images)を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClawを受信DMに公開しても安全ですか？">
    受信DMは信頼できない入力として扱ってください。デフォルト設定はリスクを減らすよう設計されています:

    - DM対応channelのデフォルト動作は**ペアリング**です:
      - 未知の送信者にはペアリングコードが送られ、ボットはそのメッセージを処理しません。
      - 承認方法: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中の要求は**channelごとに3件**までです。コードが届かない場合は`openclaw pairing list --channel <channel> [--account <id>]`を確認してください。
    - DMを公開で開放するには、明示的なオプトイン（`dmPolicy: "open"`と許可リスト`"*"`）が必要です。

    リスクのあるDMポリシーを見つけるには`openclaw doctor`を実行してください。

  </Accordion>

  <Accordion title="プロンプトインジェクションは公開ボットだけの懸念ですか？">
    いいえ。プロンプトインジェクションは、ボットにDMできる相手ではなく、**信頼できないコンテンツ**の問題です。
    アシスタントが外部コンテンツ（Web検索/fetch、ブラウザページ、メール、
    文書、添付ファイル、貼り付けたログ）を読む場合、そのコンテンツには
    モデルを乗っ取ろうとする指示が含まれている可能性があります。これは**自分だけが送信者**
    であっても起こり得ます。

    最大のリスクは、ツールが有効なときです。モデルが誘導されて
    コンテキストを外部送信したり、自分の代わりにツールを呼び出したりする可能性があります。影響範囲を減らすには、次を行ってください:

    - 信頼できないコンテンツの要約には、読み取り専用またはツール無効の「reader」agentを使う
    - ツール有効agentでは`web_search` / `web_fetch` / `browser`を無効にしておく
    - デコード済みファイル/文書テキストも信頼しないこと: OpenResponsesの
      `input_file`とメディア添付抽出は、抽出テキストを生のまま渡すのではなく、
      明示的な外部コンテンツ境界マーカーで包みます
    - サンドボックス化と厳格なツール許可リストを使う

    詳細: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="ボット専用のメール、GitHubアカウント、または電話番号を持たせるべきですか？">
    はい。多くのセットアップではその方がよいです。ボットを別のアカウントや電話番号で分離すると、
    何か問題が起きたときの影響範囲を減らせます。また、
    個人アカウントに影響を与えずに認証情報のローテーションやアクセス取り消しがしやすくなります。

    小さく始めてください。本当に必要なツールとアカウントだけにアクセスを与え、
    必要であれば後から拡張してください。

    ドキュメント: [Security](/ja-JP/gateway/security)、[Pairing](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="自分のテキストメッセージに対して自律性を持たせることはできますか？ それは安全ですか？">
    個人メッセージに対する完全な自律性は**推奨しません**。最も安全なパターンは次のとおりです:

    - DMは**ペアリングモード**または厳格な許可リストのままにする。
    - 自分の代わりに送信させたいなら、**別の番号またはアカウント**を使う。
    - 下書きを作らせてから、**送信前に承認する**。

    試したい場合は、専用アカウントで行い、分離してください。
    [Security](/ja-JP/gateway/security)を参照してください。

  </Accordion>

  <Accordion title="パーソナルアシスタント用途でより安価なモデルを使えますか？">
    はい。ただし、agentがチャット専用で、入力が信頼できる場合に限ります。小さい価格帯のモデルは
    指示乗っ取りに弱いため、ツール有効agentや
    信頼できないコンテンツを読む場合には避けてください。どうしても小さいモデルを使う必要があるなら、
    ツールを厳しく制限し、サンドボックス内で実行してください。[Security](/ja-JP/gateway/security)を参照してください。
  </Accordion>

  <Accordion title="Telegramで/startを実行したのに、ペアリングコードが届きません">
    ペアリングコードが送られるのは、未知の送信者がボットにメッセージを送り、
    `dmPolicy: "pairing"`が有効な場合**のみ**です。`/start`だけではコードは生成されません。

    保留中の要求を確認してください:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、自分の送信者IDを許可リストに入れるか、そのアカウントの`dmPolicy: "open"`を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先に勝手にメッセージを送りますか？ ペアリングはどう動作しますか？">
    いいえ。WhatsApp DMポリシーのデフォルトは**ペアリング**です。未知の送信者にはペアリングコードだけが送られ、そのメッセージは**処理されません**。OpenClawが返信するのは、受信したチャット、または自分が明示的にトリガーした送信だけです。

    ペアリングの承認:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中の要求を一覧表示:

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプト: これは自分の**許可リスト/オーナー**を設定し、自分自身のDMを許可するために使われます。自動送信には使われません。個人のWhatsApp番号で実行する場合は、その番号を使い、`channels.whatsapp.selfChatMode`を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスク中断、「止まらない」

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されるのを止めるにはどうすればよいですか？">
    内部メッセージやツールメッセージの大半は、そのセッションで**verbose**、**trace**、または**reasoning**が有効なときにだけ表示されます。

    表示されているチャットで次を実行してください:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでも騒がしい場合は、Control UIのセッション設定を確認し、verbose
    を**inherit**にしてください。また、設定で`verboseDefault`が
    `on`になっているボットプロファイルを使っていないことも確認してください。

    ドキュメント: [Thinking and verbose](/ja-JP/tools/thinking)、[Security](/ja-JP/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを停止/キャンセルするにはどうすればよいですか？">
    次のいずれかを**単独のメッセージとして**送信してください（スラッシュ不要）:

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    これらは中断トリガーです（スラッシュコマンドではありません）。

    バックグラウンドプロセス（execツール由来）の場合、agentに次を実行するよう依頼できます:

    ```
    process action:kill sessionId:XXX
    ```

    スラッシュコマンドの概要: [Slash commands](/ja-JP/tools/slash-commands)を参照してください。

    ほとんどのコマンドは、`/`で始まる**単独の**メッセージとして送る必要がありますが、いくつかのショートカット（`/status`など）は許可リスト済み送信者ならインラインでも動作します。

  </Accordion>

  <Accordion title='TelegramからDiscordへメッセージを送るにはどうすればよいですか？（「Cross-context messaging denied」）'>
    OpenClawはデフォルトで**cross-provider**メッセージングをブロックします。ツール呼び出しが
    Telegramにバインドされている場合、明示的に許可しない限りDiscordには送信されません。

    そのagentでcross-providerメッセージングを有効にします:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    設定編集後にgatewayを再起動してください。

  </Accordion>

  <Accordion title='ボットが高速連投メッセージを「無視」しているように感じるのはなぜですか？'>
    キューモードは、新しいメッセージが進行中の実行にどう影響するかを制御します。`/queue`でモードを変更してください:

    - `steer` - 新しいメッセージが現在のタスクを方向転換する
    - `followup` - メッセージを1件ずつ実行する
    - `collect` - メッセージをまとめて1回返信する（デフォルト）
    - `steer-backlog` - 今すぐ方向転換し、その後バックログを処理する
    - `interrupt` - 現在の実行を中断して新しく開始する

    followupモードには`debounce:2s cap:25 drop:summarize`のようなオプションも追加できます。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='APIキー使用時のAnthropicのデフォルトモデルは何ですか？'>
    OpenClawでは、認証情報とモデル選択は別です。`ANTHROPIC_API_KEY`を設定する（または認証プロファイルにAnthropic APIキーを保存する）と認証は有効になりますが、実際のデフォルトモデルは`agents.defaults.model.primary`で設定したものになります（たとえば`anthropic/claude-sonnet-4-6`または`anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"`と表示される場合は、実行中のagent用の想定される`auth-profiles.json`内でGatewayがAnthropic認証情報を見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか？ [Discord](https://discord.com/invite/clawd)で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions)を開いてください。

## 関連

- [初回実行FAQ](/ja-JP/help/faq-first-run) — インストール、オンボーディング、認証、サブスクリプション、初期障害
- [Models FAQ](/ja-JP/help/faq-models) — モデル選択、フェイルオーバー、認証プロファイル
- [トラブルシューティング](/ja-JP/help/troubleshooting) — 症状から始めるトリアージ
