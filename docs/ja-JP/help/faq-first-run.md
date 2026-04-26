---
read_when:
    - 新規インストール、オンボーディングの停止、または初回実行時のエラー
    - auth と provider サブスクリプションを選ぶ
    - docs.openclaw.ai にアクセスできない、ダッシュボードを開けない、インストールが止まる
sidebarTitle: First-run FAQ
summary: 'FAQ: クイックスタートと初回実行セットアップ — インストール、オンボーディング、認証、サブスクリプション、初期障害'
title: 'FAQ: 初回セットアップ'
x-i18n:
    generated_at: "2026-04-26T11:32:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  日常的な運用、models、auth、sessions、トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## クイックスタートと初回セットアップ

  <AccordionGroup>
  <Accordion title="詰まったとき、最速で抜け出す方法">
    **あなたのマシンを見られる**ローカル AI エージェントを使ってください。  
    Discord で質問するよりはるかに効果的です。なぜなら、「詰まった」というケースのほとんどは、リモートの支援者が確認できない**ローカルの config や環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、repo を読み、コマンドを実行し、ログを確認し、マシンレベルのセットアップ（PATH、services、permissions、auth files）を修正する手助けができます。  
    hackable（git）インストールを使って、**完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより OpenClaw は **git checkout から**インストールされるため、エージェントはコードと docs を読み、あなたが実行している正確なバージョンについて推論できます。後で `--install-method git` なしでインストーラーを再実行すれば、いつでも stable に戻せます。

    ヒント: エージェントにはまず修正の**計画と監督**（段階的な手順）をさせ、その後で必要なコマンドだけを実行させてください。そうすると変更が小さくなり、監査しやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issue を作成するか PR を送ってください:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まず次のコマンドから始めてください（助けを求めるときは出力を共有してください）:

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: gateway/agent の健全性と基本 config の簡易スナップショット。
    - `openclaw models status`: provider auth と model の利用可否を確認。
    - `openclaw doctor`: 一般的な config/state 問題を検証して修復。

    他に役立つ CLI チェック: `openclaw status --all`、`openclaw logs --follow`、`openclaw gateway status`、`openclaw health --verbose`。

    クイックデバッグループ: [何か壊れているときの最初の 60 秒](#first-60-seconds-if-something-is-broken)。  
    インストールドキュメント: [Install](/ja-JP/install)、[Installer flags](/ja-JP/install/installer)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat がスキップされ続けます。スキップ理由は何を意味しますか？">
    よくある Heartbeat スキップ理由:

    - `quiet-hours`: 設定された active-hours の時間帯外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空またはヘッダーだけの雛形しかない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードが有効だが、まだどのタスク間隔も期限に達していない
    - `alerts-disabled`: Heartbeat の可視化がすべて無効（`showOk`、`showAlerts`、`useIndicator` がすべて off）

    タスクモードでは、期限時刻は実際の Heartbeat 実行が完了した後にのみ進められます。スキップされた実行は、タスク完了としてマークされません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)、[Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClaw の推奨インストールとセットアップ方法">
    repo では、ソースから実行し、オンボーディングを使うことを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードは UI アセットも自動でビルドできます。オンボーディング後、通常は **18789** 番ポートで Gateway を実行します。

    ソースから（コントリビューター/開発者向け）:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    まだグローバルインストールしていない場合は、`pnpm openclaw onboard` で実行してください。

  </Accordion>

  <Accordion title="オンボーディング後にダッシュボードを開くには？">
    ウィザードはオンボーディング直後に、クリーンな（token 付きでない）ダッシュボード URL でブラウザーを開き、サマリーにもそのリンクを出力します。そのタブは開いたままにしてください。起動しなかった場合は、同じマシン上で出力された URL をコピーして貼り付けてください。
  </Accordion>

  <Accordion title="localhost とリモートでダッシュボード認証はどう違いますか？">
    **localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められたら、設定済みの token または password を Control UI 設定に貼り付けます。
    - Token の取得元: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - Password の取得元: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだ共有シークレットが設定されていない場合は、`openclaw doctor --generate-gateway-token` で token を生成してください。

    **localhost 以外:**

    - **Tailscale Serve**（推奨）: bind を loopback のままにして、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` なら、ID ヘッダーが Control UI/WebSocket auth を満たします（共有シークレットの貼り付け不要。ただし gateway host が信頼されている前提です）。HTTP API は、private-ingress の `none` や trusted-proxy HTTP auth を意図的に使わない限り、引き続き共有シークレット auth が必要です。  
      同じクライアントからの不正な並行 Serve auth 試行は、failed-auth limiter に記録される前に直列化されるため、2 回目の不正再試行ではすでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行するか（または password auth を設定し）、`http://<tailscale-ip>:18789/` を開いて、ダッシュボード設定に対応する共有シークレットを貼り付けます。
    - **ID 対応 reverse proxy**: Gateway を非 loopback trusted proxy の背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、proxy URL を開きます。
    - **SSH トンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行し、その後 `http://127.0.0.1:18789/` を開きます。共有シークレット auth はトンネル越しでも引き続き有効なので、求められたら設定済みの token または password を貼り付けてください。

    bind mode と auth の詳細は [Dashboard](/ja-JP/web/dashboard) と [Web surfaces](/ja-JP/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認の exec approval config が 2 つあるのはなぜですか？">
    それぞれ別の層を制御します。

    - `approvals.exec`: 承認プロンプトをチャット宛先に転送します
    - `channels.<channel>.execApprovals`: そのチャネルを exec approval 用のネイティブ承認クライアントとして動作させます

    ホストの exec ポリシーが、実際の承認ゲートであることに変わりはありません。チャット config が制御するのは、承認プロンプトがどこに表示されるか、そして人がどう応答できるかだけです。

    ほとんどのセットアップでは、**両方は不要**です。

    - そのチャットがすでにコマンドと返信に対応しているなら、同一チャットの `/approve` は共有パス経由で動作します。
    - 対応するネイティブチャネルが approver を安全に推定できる場合、OpenClaw は `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、DM 優先のネイティブ承認を自動有効化します。
    - ネイティブの承認カード/ボタンが利用可能な場合、そのネイティブ UI が主経路です。tool result がチャット承認不可または手動承認のみを示している場合にだけ、エージェントは手動 `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを別のチャットや明示的な ops room にも転送する必要がある場合にだけ使ってください。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを元の room/topic に明示的に投稿したい場合にだけ使ってください。
    - Plugin 承認はさらに別です。デフォルトでは同一チャットの `/approve` を使い、任意で `approvals.plugin` 転送があり、一部のネイティブチャネルだけがその上に plugin-approval-native 処理を維持します。

    要するに、転送はルーティングのため、ネイティブクライアント config はチャネル固有のより豊かな UX のためです。  
    [Exec Approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gateway に Bun は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Pi で動きますか？">
    はい。Gateway は軽量です。docs では、個人利用には **512MB〜1GB RAM**、**1 core**、約 **500MB** のディスクで十分とされており、**Raspberry Pi 4 で動作可能**と記載されています。

    追加の余裕（ログ、メディア、他のサービス）を求めるなら、**2GB 推奨**ですが、必須ではありません。

    ヒント: 小さな Pi/VPS で Gateway をホストし、ノート PC や電話上の **Nodes** をペアリングして、ローカルの画面/カメラ/canvas やコマンド実行を行えます。[Nodes](/ja-JP/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Pi インストールのコツはありますか？">
    短く言うと、動きますが多少の荒さはあります。

    - **64-bit** OS を使い、Node は 22 以上に保ってください。
    - ログ確認と素早い更新のため、**hackable（git）インストール**を推奨します。
    - channels/Skills なしで始めて、1 つずつ追加してください。
    - 不思議なバイナリ問題に当たった場合、たいていは **ARM 互換性**の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="wake up my friend で止まる / オンボーディングが進みません。どうすればいいですか？">
    その画面は Gateway に到達できて認証できることが前提です。TUI は初回 hatch 時に自動で「Wake up, my friend!」も送信します。その行が出ていて**返信がなく**、token が 0 のままなら、agent は実行されていません。

    1. Gateway を再起動します:

    ```bash
    openclaw gateway restart
    ```

    2. ステータスと auth を確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. それでも止まる場合は、次を実行します:

    ```bash
    openclaw doctor
    ```

    Gateway がリモートなら、トンネル/Tailscale 接続が有効で、UI が正しい Gateway を向いていることを確認してください。[Remote access](/ja-JP/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="セットアップを新しいマシン（Mac mini）へ移行できますか？オンボーディングをやり直さずに済みますか？">
    はい。**state directory** と **workspace** をコピーしてから、一度 Doctor を実行してください。これにより **両方の場所** をコピーする限り、ボットを「まったく同じ状態」（memory、セッション履歴、auth、チャネル状態）で維持できます。

    1. 新しいマシンに OpenClaw をインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. workspace（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gateway service を再起動します。

    これで config、auth profiles、WhatsApp creds、sessions、memory が保持されます。remote mode の場合は、gateway host が session store と workspace を保持していることを忘れないでください。

    **重要:** workspace だけを GitHub に commit/push している場合、バックアップしているのは**memory + bootstrap files** だけで、**セッション履歴や auth ではありません**。それらは `~/.openclaw/` 配下（例: `~/.openclaw/agents/<agentId>/sessions/`）にあります。

    関連: [Migrating](/ja-JP/install/migrating)、[ディスク上の保存場所](#where-things-live-on-disk)、[Agent workspace](/ja-JP/concepts/agent-workspace)、[Doctor](/ja-JP/gateway/doctor)、[Remote mode](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで見られますか？">
    GitHub changelog を確認してください:  
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新のエントリが先頭にあります。先頭セクションが **Unreleased** の場合、その次の日時付きセクションが最新の出荷済みバージョンです。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs/other セクションも）でグループ化されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSL エラー）">
    一部の Comcast/Xfinity 接続では、Xfinity Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。これを無効化するか `docs.openclaw.ai` を allowlist に追加してから、再試行してください。解除に協力していただける場合は、こちらで報告してください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    それでもサイトに到達できない場合、docs は GitHub にミラーされています:  
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違い">
    **Stable** と **beta** は、別々のコードラインではなく **npm dist-tag** です。

    - `latest` = stable
    - `beta` = テスト用の先行ビルド

    通常、stable リリースはまず **beta** に入り、その後、明示的な昇格手順によって同じバージョンが `latest` に移されます。必要に応じて、メンテナーが直接 `latest` に公開することもあります。そのため、昇格後は beta と stable が**同じバージョン**を指すことがあります。

    変更内容はこちらで確認できます:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと beta と dev の違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta 版はどうやってインストールしますか？ beta と dev の違いは何ですか？">
    **Beta** は npm dist-tag の `beta` です（昇格後は `latest` と同じになる場合があります）。  
    **Dev** は `main` の移動中の先端（git）で、公開される場合は npm dist-tag `dev` を使います。

    ワンライナー（macOS/Linux）:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows インストーラー（PowerShell）:
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    詳細: [Development channels](/ja-JP/install/development-channels) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のビットを試すには？">
    方法は 2 つあります。

    1. **Dev channel（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これで `main` ブランチに切り替わり、ソースから更新されます。

    2. **Hackable install（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより、編集可能なローカル repo が得られ、その後は git 経由で更新できます。

    手動でクリーンに clone したい場合は、次を使ってください。

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/ja-JP/cli/update)、[Development channels](/ja-JP/install/development-channels)、[Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらいかかりますか？">
    おおよその目安:

    - **インストール:** 2〜5 分
    - **オンボーディング:** 5〜15 分（設定する channels/models の数による）

    止まる場合は、[Installer stuck](#quick-start-and-first-run-setup) と
    [I am stuck](#quick-start-and-first-run-setup) の高速デバッグループを使ってください。

  </Accordion>

  <Accordion title="インストーラーが止まります。もっと詳しい情報を見るには？">
    **詳細出力**付きでインストーラーを再実行してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose 付き beta インストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    hackable（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での同等手順:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    他のオプション: [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windows インストールで git not found や openclaw not recognized と出ます">
    Windows ではよくある問題が 2 つあります。

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` が PATH に入っていることを確認してください。
    - PowerShell を閉じて開き直してから、インストーラーを再実行してください。

    **2) インストール後に openclaw is not recognized と出る**

    - npm のグローバル bin フォルダーが PATH に入っていません。
    - パスを確認してください:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザー PATH に追加してください（Windows では `\bin` 接尾辞は不要です。多くのシステムでは `%AppData%\npm` です）。
    - PATH 更新後は PowerShell を閉じて開き直してください。

    Windows で最もスムーズに使いたい場合は、ネイティブ Windows より **WSL2** を使ってください。  
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windows の exec 出力で中国語が文字化けします。どうすればいいですか？">
    これは通常、ネイティブ Windows shell のコンソールコードページ不一致です。

    症状:

    - `system.run`/`exec` の出力で中国語が文字化けする
    - 同じコマンドが別のターミナルプロファイルでは正常に見える

    PowerShell での一時的な回避策:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    その後、Gateway を再起動してコマンドを再試行してください。

    ```powershell
    openclaw gateway restart
    ```

    最新の OpenClaw でも再現する場合は、次で追跡/報告してください。

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="docs で質問の答えが見つかりません。もっと良い答えを得るには？">
    **hackable（git）インストール**を使って、完全なソースと docs をローカルに持ち、そのフォルダーから bot（または Claude/Codex）に質問してください。そうすれば repo を読んで、より正確に答えられます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/ja-JP/install) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Linux に OpenClaw をインストールするには？">
    短い答え: Linux ガイドに従って、その後オンボーディングを実行してください。

    - Linux の最短手順 + service インストール: [Linux](/ja-JP/platforms/linux)
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)
    - インストーラー + 更新: [Install & updates](/ja-JP/install/updating)

  </Accordion>

  <Accordion title="VPS に OpenClaw をインストールするには？">
    どの Linux VPS でも動きます。サーバーにインストールし、その後 SSH/Tailscale で Gateway にアクセスしてください。

    ガイド: [exe.dev](/ja-JP/install/exe-dev)、[Hetzner](/ja-JP/install/hetzner)、[Fly.io](/ja-JP/install/fly)。  
    リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPS インストールガイドはどこにありますか？">
    一般的な provider をまとめた**ホスティングハブ**があります。1 つ選んでガイドに従ってください。

    - [VPS hosting](/ja-JP/vps)（すべての provider を 1 か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    cloud での動作は次のとおりです。**Gateway はサーバー上で動作し**、あなたはノート PC/電話から Control UI（または Tailscale/SSH）経由でアクセスします。state と workspace はサーバー上にあるため、ホストを信頼できる情報源として扱い、バックアップしてください。

    その cloud Gateway に **Nodes**（Mac/iOS/Android/headless）をペアリングして、Gateway は cloud に置いたまま、ローカルの画面/カメラ/canvas へのアクセスやノート PC 上でのコマンド実行を行えます。

    ハブ: [Platforms](/ja-JP/platforms)。リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。  
    Nodes: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw 自身に更新させることはできますか？">
    短い答え: **可能ですが、推奨しません**。更新フローでは Gateway が再起動されることがあり（アクティブセッションが切断されます）、クリーンな git checkout が必要になることがあり、確認を求められる場合もあります。より安全なのは、運用者として shell から更新することです。

    CLI を使ってください:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    どうしても agent から自動化する必要がある場合:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    ドキュメント: [Update](/ja-JP/cli/update)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際に何をしますか？">
    `openclaw onboard` は推奨セットアップ経路です。**local mode** では次を案内します。

    - **Model/auth セットアップ**（provider OAuth、API key、Anthropic setup-token、さらに LM Studio のようなローカル model オプション）
    - **Workspace** の場所 + bootstrap files
    - **Gateway 設定**（bind/port/auth/Tailscale）
    - **Channels**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、さらに QQ Bot のようなバンドル済みチャネル Plugin）
    - **Daemon インストール**（macOS では LaunchAgent、Linux/WSL2 では systemd user unit）
    - **ヘルスチェック** と **Skills** の選択

    また、設定した model が不明または auth が不足している場合は警告します。

  </Accordion>

  <Accordion title="これを動かすのに Claude や OpenAI のサブスクリプションは必要ですか？">
    いいえ。OpenClaw は **API keys**（Anthropic/OpenAI/その他）でも、データを端末内に留める **ローカル専用 models** でも動作します。サブスクリプション（Claude Pro/Max や OpenAI Codex）は、それら provider の認証手段の 1 つに過ぎません。

    OpenClaw における Anthropic では、実用上の区分は次のとおりです。

    - **Anthropic API key**: 通常の Anthropic API 課金
    - **OpenClaw での Claude CLI / Claude サブスクリプション認証**: Anthropic スタッフから、この使い方は再び許可されていると伝えられており、Anthropic が新しい方針を公開しない限り、OpenClaw は `claude -p` 利用をこの連携向けの公認手段として扱っています

    長時間稼働する gateway host では、Anthropic API key の方が依然として予測しやすいセットアップです。OpenAI Codex OAuth は、OpenClaw のような外部ツール向けに明示的にサポートされています。

    OpenClaw は他にも、ホスト型サブスクリプション形式の選択肢として **Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan** をサポートしています。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic)、[OpenAI](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm)、[Local models](/ja-JP/gateway/local-models)、[Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="API key なしで Claude Max サブスクリプションを使えますか？">
    はい。

    Anthropic スタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられているため、Anthropic が新しい方針を公開しない限り、OpenClaw は Claude サブスクリプション認証と `claude -p` 利用をこの連携向けの公認手段として扱っています。最も予測しやすいサーバー側セットアップを望むなら、代わりに Anthropic API key を使ってください。

  </Accordion>

  <Accordion title="Claude サブスクリプション認証（Claude Pro または Max）に対応していますか？">
    はい。

    Anthropic スタッフから、この使い方は再び許可されていると伝えられているため、Anthropic が新しい方針を公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` 利用をこの連携向けの公認手段として扱っています。

    Anthropic setup-token も引き続き対応する OpenClaw token 経路として利用可能ですが、OpenClaw は利用可能であれば Claude CLI の再利用と `claude -p` を優先するようになりました。  
    本番またはマルチユーザーのワークロードでは、Anthropic API key auth の方が依然としてより安全で予測しやすい選択です。OpenClaw で他のサブスクリプション形式のホスト型選択肢を使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[GLM Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic から HTTP 429 rate_limit_error が出るのはなぜですか？">
    これは、現在の時間枠における **Anthropic の quota/rate limit** を使い切ったことを意味します。**Claude CLI** を使っている場合は、時間枠がリセットされるまで待つか、プランをアップグレードしてください。**Anthropic API key** を使っている場合は、Anthropic Console で usage/billing を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に  
    `Extra usage is required for long context requests`  
    の場合、そのリクエストは Anthropic の 1M context beta（`context1m: true`）を使おうとしています。これは、あなたの認証情報が long-context 課金に対応している場合にのみ動作します（API key 課金、または Extra Usage が有効な OpenClaw Claude-login 経路）。

    ヒント: provider がレート制限されている間も OpenClaw が応答を続けられるよう、**フォールバック model** を設定してください。  
  [Models](/ja-JP/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および  
  [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrock はサポートされていますか？">
    はい。OpenClaw にはバンドル済みの **Amazon Bedrock (Converse)** provider があります。AWS の env マーカーが存在する場合、OpenClaw はストリーミング/テキスト Bedrock カタログを自動検出し、暗黙の `amazon-bedrock` provider としてマージできます。そうでない場合でも、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効化するか、手動で provider エントリを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [Model providers](/ja-JP/providers/models) を参照してください。管理された key フローを使いたい場合は、Bedrock の前段に OpenAI 互換 proxy を置く方法も引き続き有効です。
  </Accordion>

  <Accordion title="Codex auth はどう動作しますか？">
    OpenClaw は OAuth（ChatGPT サインイン）経由で **OpenAI Code (Codex)** をサポートしています。  
    デフォルトの Pi runner で Codex OAuth を使うには `openai-codex/gpt-5.5` を使用してください。直接 OpenAI API key アクセスには `openai/gpt-5.5` を使用します。GPT-5.5 は、`openai-codex/gpt-5.5` によるサブスクリプション/OAuth、または `openai/gpt-5.5` と `agentRuntime.id: "codex"` によるネイティブ Codex app-server 実行も使用できます。  
    [Model providers](/ja-JP/concepts/model-providers) と [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="なぜ OpenClaw はまだ openai-codex に言及するのですか？">
    `openai-codex` は ChatGPT/Codex OAuth 用の provider および auth-profile id です。  
    これは Codex OAuth 用の明示的な Pi model 接頭辞でもあります。

    - `openai/gpt-5.5` = Pi における現在の直接 OpenAI API-key ルート
    - `openai-codex/gpt-5.5` = Pi における Codex OAuth ルート
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = ネイティブ Codex app-server ルート
    - `openai-codex:...` = auth profile id であり、model ref ではありません

    直接の OpenAI Platform 課金/制限経路を使いたい場合は、`OPENAI_API_KEY` を設定してください。ChatGPT/Codex サブスクリプション auth を使いたい場合は、`openclaw models auth login --provider openai-codex` でサインインし、Pi 実行には `openai-codex/*` の model ref を使用してください。

  </Accordion>

  <Accordion title="なぜ Codex OAuth の制限は ChatGPT web と異なるのですか？">
    Codex OAuth は、プラン依存の OpenAI 管理 quota window を使用します。実際には、両方が同じアカウントに紐づいていても、それらの制限は ChatGPT website/app での体験と異なることがあります。

    OpenClaw は `openclaw models status` で現在見えている provider の usage/quota window を表示できますが、ChatGPT web の権限を直接 API アクセス向けに捏造または正規化することはありません。直接の OpenAI Platform 課金/制限経路を使いたい場合は、API key とともに `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAI サブスクリプション auth（Codex OAuth）をサポートしていますか？">
    はい。OpenClaw は **OpenAI Code (Codex) subscription OAuth** を完全にサポートしています。  
    OpenAI は、OpenClaw のような外部ツール/ワークフローでの subscription OAuth 利用を明示的に許可しています。オンボーディングで OAuth フローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[Model providers](/ja-JP/concepts/model-providers)、および [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuth はどう設定しますか？">
    Gemini CLI は、`openclaw.json` の client id や secret ではなく、**Plugin auth フロー**を使います。

    手順:

    1. `gemini` が `PATH` 上に来るように、Gemini CLI をローカルにインストールする
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin を有効化する: `openclaw plugins enable google`
    3. ログインする: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルト model: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、gateway host 上で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定する

    これにより、OAuth token は gateway host 上の auth profile に保存されます。詳細: [Model providers](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="ローカル model は気軽なチャットに向いていますか？">
    通常は向いていません。OpenClaw には大きなコンテキストと強い安全性が必要であり、小さなカードでは切り詰めやリークが起こります。どうしても使うなら、ローカルで実行可能な**最大**の model ビルド（LM Studio）を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。より小さい/量子化された models は prompt injection リスクを高めます。詳細は [Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型 model トラフィックを特定リージョン内に維持するには？">
    リージョン固定の endpoint を選んでください。OpenRouter は、MiniMax、Kimi、GLM に対して米国内ホストのオプションを提供しています。データをリージョン内に留めるには US-hosted 版を選択してください。それでも、選択したリージョン限定 provider を尊重しつつフォールバックを利用できるように、`models.mode: "merge"` を使って Anthropic/OpenAI を並べて列挙できます。
  </Accordion>

  <Accordion title="これをインストールするのに Mac mini を買う必要がありますか？">
    いいえ。OpenClaw は macOS または Linux で動作します（Windows は WSL2 経由）。Mac mini は任意です。常時稼働ホストとして購入する人もいますが、小さな VPS、ホームサーバー、Raspberry Pi クラスのマシンでも動作します。

    Mac が必要なのは **macOS 専用 tools** の場合だけです。iMessage には [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使ってください。BlueBubbles server は任意の Mac 上で動作し、Gateway は Linux など別の場所で動作できます。他の macOS 専用 tools が必要な場合は、Gateway を Mac 上で実行するか、macOS Node をペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[Nodes](/ja-JP/nodes)、[Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage 対応に Mac mini は必要ですか？">
    Messages にサインインした **何らかの macOS デバイス** が必要です。Mac mini である必要はなく、任意の Mac で構いません。iMessage には **[BlueBubbles](/ja-JP/channels/bluebubbles)**（推奨）を使ってください。BlueBubbles server は macOS 上で動作し、Gateway は Linux など別の場所で動作できます。

    一般的なセットアップ:

    - Gateway は Linux/VPS で実行し、BlueBubbles server は Messages にサインインした任意の Mac で実行する。
    - 最も単純な単一マシン構成にしたい場合は、すべてをその Mac 上で実行する。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles)、[Nodes](/ja-JP/nodes)、[Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClaw を動かすために Mac mini を買った場合、それを MacBook Pro につなげられますか？">
    はい。**Mac mini が Gateway を実行**し、MacBook Pro は **Node**（コンパニオンデバイス）として接続できます。Node は Gateway 自体を実行するのではなく、そのデバイス上での画面/カメラ/canvas や `system.run` のような追加機能を提供します。

    一般的な構成:

    - Gateway は Mac mini 上（常時稼働）。
    - MacBook Pro は macOS app または node host を実行し、Gateway にペアリングする。
    - `openclaw nodes status` / `openclaw nodes list` で確認する。

    ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/ja-JP/cli/nodes)。

  </Accordion>

  <Accordion title="Bun は使えますか？">
    Bun は**推奨されません**。特に WhatsApp や Telegram でランタイムバグが確認されています。安定した gateway には **Node** を使ってください。

    それでも Bun を試したい場合は、WhatsApp/Telegram を使わない非本番 gateway で実験してください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は **人間の送信者の Telegram user ID**（数値）です。ボットの username ではありません。

    セットアップでは数値 user ID のみを求めます。すでに config に旧式の `@username` エントリがある場合、`openclaw doctor --fix` がその解決を試みます。

    より安全な方法（サードパーティボット不要）:

    - ボットに DM し、その後 `openclaw logs --follow` を実行して `from.id` を読み取る。

    公式 Bot API:

    - ボットに DM し、その後 `https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出して `message.from.id` を読む。

    サードパーティ（プライバシーはやや劣る）:

    - `@userinfobot` または `@getidsbot` に DM する。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が 1 つの WhatsApp 番号を使って、それぞれ別の OpenClaw インスタンスを使えますか？">
    はい、**multi-agent ルーティング**で可能です。各送信者の WhatsApp **DM**（peer `kind: "direct"`、送信者 E.164 形式 `+15551234567` など）を別々の `agentId` にバインドすれば、各人が独自の workspace と session store を持てます。返信は引き続き**同じ WhatsApp アカウント**から送られ、DM アクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp アカウント単位でグローバルです。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」agent と「コーディング用 Opus」agent を分けて動かせますか？'>
    はい。multi-agent ルーティングを使ってください。各 agent に独自のデフォルト model を与え、受信ルート（provider account または特定 peer）をそれぞれの agent にバインドします。設定例は [Multi-Agent Routing](/ja-JP/concepts/multi-agent) にあります。[Models](/ja-JP/concepts/models) と [Configuration](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="Homebrew は Linux でも動きますか？">
    はい。Homebrew は Linux（Linuxbrew）をサポートしています。簡単なセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw を systemd 経由で実行する場合は、service の PATH に `/home/linuxbrew/.linuxbrew/bin`（またはあなたの brew prefix）を含めてください。そうしないと、`brew` でインストールしたツールが非ログインシェルで解決されません。最近のビルドでは、Linux systemd service 上で一般的な user bin ディレクトリ（例: `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`）も前置し、`PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` が設定されていればそれらも尊重します。

  </Accordion>

  <Accordion title="hackable git install と npm install の違い">
    - **Hackable（git）install:** 完全なソース checkout、編集可能、コントリビューター向けに最適です。ローカルで build を実行し、コードや docs を修正できます。
    - **npm install:** グローバル CLI インストール、repo なし、「とにかく動かしたい」場合に最適です。更新は npm dist-tag から取得します。

    ドキュメント: [はじめに](/ja-JP/start/getting-started)、[Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後から npm install と git install を切り替えられますか？">
    はい。OpenClaw がすでにインストールされている場合は、`openclaw update --channel ...` を使ってください。これは **あなたのデータを削除しません**。変更されるのは OpenClaw のコードインストールだけです。state（`~/.openclaw`）と workspace（`~/.openclaw/workspace`）はそのままです。

    npm から git へ:

    ```bash
    openclaw update --channel dev
    ```

    git から npm へ:

    ```bash
    openclaw update --channel stable
    ```

    まず切り替え計画を確認するには `--dry-run` を追加してください。updater は Doctor の後続処理を実行し、対象 channel 用に Plugin ソースを更新し、`--no-restart` を指定しない限り gateway を再起動します。

    インストーラーでもどちらの mode も強制できます:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    バックアップのヒント: [Backup strategy](#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はノート PC と VPS のどちらで動かすべきですか？">
    短い答え: **24/7 の信頼性がほしいなら VPS** です。最も手軽に始めたく、スリープや再起動を許容できるならローカル実行でも構いません。

    **ノート PC（ローカル Gateway）**

    - **長所:** サーバー費用なし、ローカルファイルへ直接アクセス可能、ブラウザーウィンドウをそのまま使える。
    - **短所:** スリープ/ネットワーク断で切断される、OS 更新/再起動で中断される、起動したままにしておく必要がある。

    **VPS / cloud**

    - **長所:** 常時稼働、安定したネットワーク、ノート PC のスリープ問題がない、継続稼働しやすい。
    - **短所:** 多くの場合 headless で動かす必要がある（スクリーンショット利用）、ファイルアクセスはリモートのみ、更新には SSH が必要。

    **OpenClaw 固有の注意:** WhatsApp/Telegram/Slack/Mattermost/Discord はすべて VPS 上で問題なく動作します。実質的なトレードオフは **headless browser** と可視ウィンドウの違いだけです。[Browser](/ja-JP/tools/browser) を参照してください。

    **推奨デフォルト:** 以前に gateway 切断があったなら VPS。ローカルは、Mac を積極的に使っていて、ローカルファイルアクセスや可視ブラウザーを使った UI 自動化がほしい場合に最適です。

  </Accordion>

  <Accordion title="OpenClaw を専用マシンで動かす重要性はどれくらいですか？">
    必須ではありませんが、**信頼性と分離のために推奨**されます。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープ/再起動の中断が少ない、権限が整理しやすい、継続稼働させやすい。
    - **共用のノート PC/デスクトップ:** テストや積極利用にはまったく問題ありませんが、マシンのスリープや更新時には停止が発生します。

    両方の利点を取りたい場合は、Gateway を専用ホストに置き、ノート PC を **Node** としてペアリングしてローカルの screen/camera/exec tools を使ってください。[Nodes](/ja-JP/nodes) を参照してください。  
    セキュリティ指針については [Security](/ja-JP/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="最小 VPS 要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1 つのチャットチャネルであれば:

    - **絶対最小:** 1 vCPU、1GB RAM、約 500MB ディスク。
    - **推奨:** 1〜2 vCPU、2GB RAM 以上の余裕（ログ、メディア、複数チャネル向け）。Node tools と browser 自動化はリソースを多く使うことがあります。

    OS は **Ubuntu LTS**（または最新の Debian/Ubuntu 系）を使ってください。Linux のインストール経路はそこで最もよくテストされています。

    ドキュメント: [Linux](/ja-JP/platforms/linux)、[VPS hosting](/ja-JP/vps)。

  </Accordion>

  <Accordion title="VM で OpenClaw を実行できますか？ 要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、Gateway と有効にしたチャネルを動かせるだけの RAM が必要です。

    基本的な目安:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、browser 自動化、またはメディア tools を使う場合は 2GB RAM 以上。
    - **OS:** Ubuntu LTS または他の最新 Debian/Ubuntu。

    Windows の場合、**WSL2 が最も簡単な VM 形式のセットアップ**で、ツール互換性も最良です。[Windows](/ja-JP/platforms/windows)、[VPS hosting](/ja-JP/vps) を参照してください。  
    macOS を VM 上で動かす場合は [macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ（models、sessions、gateway、security など）
- [Install overview](/ja-JP/install)
- [はじめに](/ja-JP/start/getting-started)
- [Troubleshooting](/ja-JP/help/troubleshooting)
