---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムのサポート質問に回答するとき
    - より深いデバッグの前に、ユーザー報告の問題をトリアージするとき
summary: OpenClawのセットアップ、設定、使用方法に関するよくある質問
title: FAQ
x-i18n:
    generated_at: "2026-04-05T12:51:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f71dc12f60aceaa1d095aaa4887d59ecf2a53e349d10a3e2f60e464ae48aff6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

実際の環境（ローカル開発、VPS、マルチエージェント、OAuth/APIキー、モデルフェイルオーバー）向けの簡潔な回答と、より詳しいトラブルシューティングです。ランタイム診断については [Troubleshooting](/gateway/troubleshooting) を参照してください。完全な設定リファレンスについては [Configuration](/gateway/configuration) を参照してください。

## 何か壊れているときの最初の60秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約です: OS + 更新、gateway/serviceの到達性、agents/sessions、provider設定 + ランタイム問題（gatewayに到達できる場合）。

2. **共有可能なレポート（安全に共有可能）**

   ```bash
   openclaw status --all
   ```

   ログtail付きの読み取り専用診断です（トークンは秘匿化されます）。

3. **Daemon + ポート状態**

   ```bash
   openclaw gateway status
   ```

   supervisor runtimeとRPC到達性、probe target URL、およびserviceが使った可能性の高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   ライブのgateway health probeを実行します。サポートされている場合は
   channel probeも含まれます
   （到達可能なgatewayが必要）。[Health](/gateway/health) を参照してください。

5. **最新ログをtailする**

   ```bash
   openclaw logs --follow
   ```

   RPCが落ちている場合は、代わりに次を使用してください。

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはserviceログとは別です。[Logging](/logging) と [Troubleshooting](/gateway/troubleshooting) を参照してください。

6. **doctorを実行する（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復・移行し、health checkを実行します。[Doctor](/gateway/doctor) を参照してください。

7. **Gatewayスナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時にtarget URL + config pathを表示
   ```

   実行中のgatewayに完全スナップショットを要求します（WS専用）。[Health](/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

<AccordionGroup>
  <Accordion title="行き詰まりました。最速で抜け出す方法は？">
    **自分のマシンを見られる**ローカルAI agentを使ってください。これはDiscordで質問するよりはるかに効果的です。ほとんどの「行き詰まった」ケースは、リモートのヘルパーでは確認できない**ローカル設定や環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、repoを読み、コマンドを実行し、ログを調べ、マシンレベルの
    セットアップ（PATH、services、権限、auth files）の修正を支援できます。
    ハッカブルな（git）インストールを使って、**完全なソースチェックアウト**を渡してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより、OpenClawが**git checkoutから**インストールされるため、agentはコードとドキュメントを読み、
    実行中の正確なバージョンを推論できます。後でいつでも `--install-method git` を付けずに
    installerを再実行すればstableに戻せます。

    ヒント: 修正はagentに**計画と監督**（段階的）をさせ、必要な
    コマンドだけを実行させてください。そうすると変更が小さくなり、監査しやすくなります。

    実際のバグや修正を見つけた場合は、ぜひGitHub issueを作成するかPRを送ってください。
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ヘルプを求めるときは、まず次のコマンドから始めてください（出力を共有してください）。

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    それぞれの役割:

    - `openclaw status`: gateway/agent health + 基本設定のクイックスナップショット。
    - `openclaw models status`: provider auth + model availabilityを確認します。
    - `openclaw doctor`: よくある設定/状態の問題を検証して修復します。

    その他の便利なCLIチェック: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`。

    クイックデバッグループ: [何か壊れているときの最初の60秒](#何か壊れているときの最初の60秒)。
    インストールドキュメント: [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating)。

  </Accordion>

  <Accordion title="heartbeatがスキップされ続けます。スキップ理由は何を意味しますか？">
    よくあるheartbeatスキップ理由:

    - `quiet-hours`: 設定されたactive-hoursウィンドウ外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空行または見出しだけのスキャフォールディングしか含まない
    - `no-tasks-due`: `HEARTBEAT.md` のtask modeが有効だが、まだどのtask intervalも期限に達していない
    - `alerts-disabled`: heartbeatの可視性がすべて無効（`showOk`, `showAlerts`, `useIndicator` がすべてoff）

    task modeでは、due timestampは実際のheartbeat実行が
    完了した後にのみ進みます。スキップされた実行はtaskを完了済みとして扱いません。

    ドキュメント: [Heartbeat](/gateway/heartbeat), [Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClawの推奨インストール方法とセットアップ方法は？">
    repoでは、ソースから実行し、オンボーディングを使うことを推奨しています。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードはUI assetsも自動的にビルドできます。オンボーディング後は、通常Gatewayをポート **18789** で実行します。

    ソースから（コントリビューター/開発者向け）:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # 初回実行時にUI依存関係を自動インストール
    openclaw onboard
    ```

    まだグローバルインストールしていない場合は、`pnpm openclaw onboard` で実行してください。

  </Accordion>

  <Accordion title="オンボーディング後にdashboardを開くには？">
    ウィザードはオンボーディング直後にクリーンな（トークンなしの）dashboard URLでブラウザを開き、要約にもリンクを表示します。そのタブを開いたままにしてください。起動しなかった場合は、同じマシン上で表示されたURLをコピー&ペーストしてください。
  </Accordion>

  <Accordion title="localhostとremoteでdashboard認証はどう違いますか？">
    **localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - shared-secret authを求められたら、設定済みのtokenまたはpasswordをControl UI settingsに貼り付けます。
    - Tokenのソース: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - Passwordのソース: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - まだshared secretが設定されていない場合は、`openclaw doctor --generate-gateway-token` でtokenを生成します。

    **localhostではない場合:**

    - **Tailscale Serve**（推奨）: bindをloopbackのままにして、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` なら、identity headersがControl UI/WebSocket authを満たします（shared secretの貼り付け不要。信頼できるgateway hostを前提）。HTTP APIは、private-ingress `none` または trusted-proxy HTTP authを意図的に使わない限り、引き続きshared-secret authが必要です。
      同一clientからの不正な同時Serve auth試行は、failed-auth limiterに記録される前に直列化されるため、2回目の不正再試行ですでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行し（またはpassword authを設定し）、`http://<tailscale-ip>:18789/` を開いてから、一致するshared secretをdashboard settingsに貼り付けます。
    - **Identity-aware reverse proxy**: Gatewayを非loopback trusted proxyの背後に置き、`gateway.auth.mode: "trusted-proxy"` を設定してから、proxy URLを開きます。
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` の後に `http://127.0.0.1:18789/` を開きます。トンネル越しでもshared-secret authは適用されるので、求められたら設定済みのtokenまたはpasswordを貼り付けてください。

    bind modeとauthの詳細は [Dashboard](/web/dashboard) と [Web surfaces](/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認用のexec approval configが2つあるのはなぜですか？">
    それぞれ制御するレイヤーが異なります。

    - `approvals.exec`: approval promptをチャット宛先へ転送します
    - `channels.<channel>.execApprovals`: そのchannelをexec approval用のネイティブapproval clientとして動作させます

    host側のexec policyが、依然として実際のapproval gateです。チャット設定は、approval
    promptをどこに表示するか、そして人がどう応答できるかだけを制御します。

    ほとんどの構成では、**両方は不要**です。

    - チャットがすでにcommandsとrepliesをサポートしているなら、同一チャットの `/approve` は共有パス経由で動作します。
    - サポートされるnative channelがapproverを安全に推論できる場合、OpenClawは現在、`channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のときに、DM優先のnative approvalsを自動有効化します。
    - native approval cards/buttonsが利用可能な場合、そのnative UIが主要経路です。tool resultがchat approvals unavailableを示すか、manual approvalだけが唯一の経路である場合にのみ、agentは手動 `/approve` コマンドを含めるべきです。
    - promptを他のチャットや明示的なops roomにも転送する必要がある場合にのみ `approvals.exec` を使用してください。
    - approval promptを発生元のroom/topicにも投稿したいと明示的に望む場合にのみ `channels.<channel>.execApprovals.target: "channel"` または `"both"` を使ってください。
    - plugin approvalsはさらに別です。デフォルトでは同一チャット `/approve` を使い、任意の `approvals.plugin` 転送があり、native channelの一部だけがその上にplugin-approval-native処理を維持します。

    要するに、転送はルーティング用、native client configはよりリッチなchannel固有UX用です。
    [Exec Approvals](/tools/exec-approvals) を参照してください。

  </Accordion>

  <Accordion title="必要なruntimeは何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gatewayにbunは**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Piで動きますか？">
    はい。Gatewayは軽量です。ドキュメントでは、個人利用には **512MB-1GB RAM**、**1 core**、約 **500MB**
    のディスクで十分とされており、**Raspberry Pi 4で実行可能**だと記載されています。

    余裕（ログ、メディア、その他のservice）が欲しい場合は **2GB推奨** ですが、
    厳密な最低要件ではありません。

    ヒント: 小型のPi/VPSでGatewayをホストし、ラップトップ/スマホ上の**nodes**をペアリングして、
    ローカルscreen/camera/canvasやコマンド実行を利用できます。[Nodes](/nodes) を参照してください。

  </Accordion>

  <Accordion title="Raspberry Piインストールのコツはありますか？">
    短く言うと、動きますが、多少の荒さはあります。

    - **64-bit** OSを使い、Node >= 22を維持してください。
    - ログ確認や高速更新のために、**ハッカブルな（git）インストール**を推奨します。
    - まずchannels/skillsなしで始めて、その後1つずつ追加してください。
    - 奇妙なバイナリ問題に当たった場合、多くは **ARM互換性** の問題です。

    ドキュメント: [Linux](/platforms/linux), [Install](/install)。

  </Accordion>

  <Accordion title="wake up my friendで止まります / onboardingが進みません。どうすれば？">
    その画面は、Gatewayに到達できて認証されていることに依存します。TUIも
    初回hatch時に自動で
    「Wake up, my friend!」を送信します。その行が表示されても**応答がなく**
    tokenが0のままなら、agentは実行されていません。

    1. Gatewayを再起動します:

    ```bash
    openclaw gateway restart
    ```

    2. status + authを確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. それでも固まる場合は、次を実行します:

    ```bash
    openclaw doctor
    ```

    Gatewayがremoteの場合は、tunnel/Tailscale接続が有効で、UIが
    正しいGatewayを指していることを確認してください。[Remote access](/gateway/remote) を参照してください。

  </Accordion>

  <Accordion title="セットアップを新しいマシン（Mac mini）へ、onboardingをやり直さずに移行できますか？">
    はい。**state directory** と **workspace** をコピーしてから、一度Doctorを実行してください。これにより
    **両方**の場所をコピーする限り、
    botを「まったく同じ状態」（memory、session history、auth、channel
    state）で維持できます。

    1. 新しいマシンにOpenClawをインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. workspace（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行してGateway serviceを再起動します。

    これでconfig、auth profiles、WhatsApp creds、sessions、memoryが保持されます。remote
    modeの場合、session storeとworkspaceはgateway hostが保持している点に注意してください。

    **重要:** workspaceだけをGitHubへcommit/pushしている場合、バックアップしているのは
    **memory + bootstrap files** だけであり、**session historyやauthは含まれません**。それらは
    `~/.openclaw/` 配下にあります（例: `~/.openclaw/agents/<agentId>/sessions/`）。

    関連: [Migrating](/install/migrating), [ディスク上の保存場所](#ディスク上の保存場所),
    [Agent workspace](/concepts/agent-workspace), [Doctor](/gateway/doctor),
    [Remote mode](/gateway/remote)。

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHubのchangelogを確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新の項目は先頭にあります。先頭セクションに **Unreleased** とある場合は、その次の日付付き
    セクションが最新のリリース版です。項目は **Highlights**、**Changes**、**Fixes**
    （必要に応じてdocs/other sectionsも）に分類されています。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSLエラー）">
    一部のComcast/Xfinity接続では、Xfinity
    Advanced Securityによって `docs.openclaw.ai` が誤ってブロックされます。これを無効にするか、`docs.openclaw.ai` をallowlistに追加してから再試行してください。
    こちらで解除報告にご協力ください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    それでもサイトに到達できない場合、docsはGitHubにもミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stableとbetaの違いは？">
    **Stable** と **beta** は別々のコードラインではなく、**npm dist-tag** です。

    - `latest` = stable
    - `beta` = テスト用の先行ビルド

    通常、stableリリースはまず **beta** に入り、その後
    明示的な
    promotion stepによって同じバージョンが `latest` に移されます。maintainerは必要に応じて
    直接 `latest` にpublishすることもできます。そのため、promotion後はbetaとstableが
    **同じバージョン** を指すことがあります。

    変更点はこちら:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーとbetaとdevの違いについては、下のアコーディオンを参照してください。

  </Accordion>

  <Accordion title="beta版はどうインストールしますか？ betaとdevの違いは何ですか？">
    **Beta** はnpm dist-tag `beta` です（promotion後は `latest` と一致する場合があります）。
    **Dev** は `main` の移動中の先端（git）で、publishされた場合はnpm dist-tag `dev` を使います。

    ワンライナー（macOS/Linux）:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows installer（PowerShell）:
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    詳細: [Development channels](/install/development-channels) と [Installer flags](/install/installer)。

  </Accordion>

  <Accordion title="最新のものを試すには？">
    2つの方法があります。

    1. **Dev channel（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これで `main` ブランチに切り替わり、ソースから更新されます。

    2. **ハッカブルインストール（installer siteから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより、編集できるローカルrepoが得られ、その後git経由で更新できます。

    手動でクリーンにcloneしたい場合は、次を使ってください。

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/cli/update), [Development channels](/install/development-channels),
    [Install](/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングは通常どれくらいかかりますか？">
    おおよその目安:

    - **インストール:** 2〜5分
    - **オンボーディング:** 設定するchannels/modelsの数に応じて5〜15分

    固まった場合は、[Installer stuck](#クイックスタートと初回セットアップ)
    と [I am stuck](#クイックスタートと初回セットアップ) の高速デバッグループを使ってください。

  </Accordion>

  <Accordion title="Installerが止まります。もっと詳細なフィードバックを得るには？">
    installerを**詳細出力**付きで再実行してください。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    詳細付きのbetaインストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    ハッカブルな（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）相当:

    ```powershell
    # install.ps1 にはまだ専用の -Verbose フラグはありません。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [Installer flags](/install/installer)。

  </Accordion>

  <Accordion title="Windows installで git not found や openclaw not recognized と出ます">
    Windowsでよくある2つの問題:

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` がPATH上にあることを確認してください。
    - PowerShellを閉じて開き直し、その後installerを再実行してください。

    **2) インストール後に openclaw is not recognized と出る**

    - npm global bin folderがPATHに入っていません。
    - パスを確認します:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザーPATHに追加してください（Windowsでは `\bin` 接尾辞は不要です。多くの環境では `%AppData%\npm` です）。
    - PATH更新後、PowerShellを閉じて再度開いてください。

    もっともスムーズなWindowsセットアップを望むなら、native Windowsではなく **WSL2** を使ってください。
    ドキュメント: [Windows](/platforms/windows)。

  </Accordion>

  <Accordion title="Windowsのexec outputで中国語が文字化けします。どうすれば？">
    これは通常、native Windows shellでのconsole code page不一致です。

    症状:

    - `system.run`/`exec` outputで中国語が文字化けする
    - 同じコマンドが別のterminal profileでは正常に見える

    PowerShellでの簡単な回避策:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    その後、Gatewayを再起動してコマンドを再試行してください。

    ```powershell
    openclaw gateway restart
    ```

    最新のOpenClawでも再現する場合は、次で追跡/報告してください。

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="docsでは答えが見つかりませんでした。よりよい答えを得るには？">
    **ハッカブルな（git）インストール**を使って完全なソースとdocsをローカルに置き、その
    フォルダーから bot（または Claude/Codex）に質問してください。そうすればrepoを読み、
    正確に答えられます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/install) と [Installer flags](/install/installer)。

  </Accordion>

  <Accordion title="LinuxにOpenClawをインストールするには？">
    短く言うと、Linuxガイドに従って、その後オンボーディングを実行してください。

    - Linuxの簡易手順 + service install: [Linux](/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - installer + updates: [Install & updates](/install/updating)。

  </Accordion>

  <Accordion title="VPSにOpenClawをインストールするには？">
    どのLinux VPSでも動作します。server上にインストールし、その後SSH/TailscaleでGatewayに到達します。

    ガイド: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly)。
    リモートアクセス: [Gateway remote](/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPSのインストールガイドはどこにありますか？">
    一般的なproviderをまとめた**hosting hub**があります。1つ選んでガイドに従ってください。

    - [VPS hosting](/vps)（すべてのproviderを1か所に集約）
    - [Fly.io](/install/fly)
    - [Hetzner](/install/hetzner)
    - [exe.dev](/install/exe-dev)

    cloudでの動作: **Gatewayはserver上で実行**され、Control UI（またはTailscale/SSH）を通じて
    laptop/phoneからアクセスします。state + workspaceは
    server上にあるため、hostをsource of truthとして扱い、バックアップしてください。

    **nodes**（Mac/iOS/Android/headless）をそのcloud Gatewayにペアリングして、
    Gatewayをcloudに置いたまま、ローカルscreen/camera/canvasへアクセスしたり、
    laptop上でコマンドを実行したりできます。

    Hub: [Platforms](/platforms)。リモートアクセス: [Gateway remote](/gateway/remote)。
    Nodes: [Nodes](/nodes), [Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClaw自身に更新をさせられますか？">
    短く言うと、**可能ですが推奨しません**。更新フローは
    Gatewayを再起動することがあり（アクティブsessionが切断されます）、
    クリーンなgit checkoutが必要な場合があり、
    確認プロンプトが出ることがあります。より安全なのは、operatorとしてshellから更新することです。

    CLIを使ってください:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    どうしてもagentから自動化する必要がある場合:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    ドキュメント: [Update](/cli/update), [Updating](/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際には何をしますか？">
    `openclaw onboard` は推奨されるセットアップ経路です。**local mode** では次を案内します。

    - **Model/auth setup**（provider OAuth、Claude CLI再利用、API keysをサポート。LM Studioのようなlocal modelオプションも）
    - **Workspace** の場所 + bootstrap files
    - **Gateway settings**（bind/port/auth/tailscale）
    - **Channels**（WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage、およびQQ Botのようなbundled channel plugins）
    - **Daemon install**（macOSではLaunchAgent、Linux/WSL2ではsystemd user unit）
    - **Health checks** と **Skills** の選択

    設定されたmodelが未知、またはauthが不足している場合には警告も出します。

  </Accordion>

  <Accordion title="これを動かすのにClaudeやOpenAIのsubscriptionは必要ですか？">
    いいえ。OpenClawは **API keys**（Anthropic/OpenAI/その他）でも、
    **local-only models** でも実行できるため、データを自分のデバイス上に留められます。subscription（Claude
    Pro/MaxやOpenAI Codex）は、それらproviderへ認証するための任意の方法です。

    Anthropicの公開CLI docsに基づき、Claude Code CLI fallbackは
    ローカルでユーザー管理のautomationについては許可されている可能性が高いと考えています。ただし、
    外部製品におけるsubscription利用については、Anthropicのthird-party harness policyに
    十分な曖昧さがあるため、
    本番利用は推奨しません。Anthropicはさらに、**2026年4月4日
    午後12:00 PT / 午後8:00 BST** にOpenClawユーザーへ、
    **OpenClaw** のClaude-login pathはthird-party harness usageに該当し、現在は
    subscriptionとは別に請求される **Extra Usage**
    が必要だと通知しました。OpenAI Codex OAuthは、
    OpenClawのような外部tool向けに明示的にサポートされています。

    OpenClawは、その他にもホスト型subscriptionスタイルの選択肢として
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、
    **Z.AI / GLM Coding Plan** をサポートしています。

    ドキュメント: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
    [Qwen Cloud](/providers/qwen),
    [MiniMax](/providers/minimax), [GLM Models](/providers/glm),
    [Local models](/gateway/local-models), [Models](/concepts/models)。

  </Accordion>

  <Accordion title="API keyなしでClaude Max subscriptionを使えますか？">
    はい。gateway host上でのローカル **Claude CLI** ログイン経由で使えます。

    Claude Pro/Max subscriptionには **API keyは含まれない** ため、Claude CLI
    再利用がOpenClawにおけるローカルfallback経路です。Claude Code CLI
    fallbackは、Anthropicの公開CLI docsに基づき、ローカルでユーザー管理のautomationについては
    許可されている可能性が高いと考えています。ただし、Anthropicのthird-party harness
    policyには、外部製品におけるsubscription利用に関して十分な曖昧さがあり、
    本番利用は推奨しません。推奨は
    Anthropic API keysです。

  </Accordion>

  <Accordion title="Claude subscription auth（Claude ProまたはMax）はサポートしていますか？">
    はい。gateway host上でローカル **Claude CLI** ログインを再利用してください。`openclaw models auth login --provider anthropic --method cli --set-default` を使います。

    Anthropic setup-tokenも、レガシー/手動のOpenClaw経路として再び利用可能です。AnthropicのOpenClaw固有の課金通知はここにも適用されるため、Anthropicが **Extra Usage** を要求すると想定して使用してください。[Anthropic](/providers/anthropic) と [OAuth](/concepts/oauth) を参照してください。

    重要: Claude Code CLI fallbackは、
    Anthropicの公開CLI docsに基づき、ローカルでユーザー管理のautomationについては
    許可されている可能性が高いと考えています。ただし、
    外部製品におけるsubscription利用については、Anthropicのthird-party harness policyに
    十分な曖昧さがあるため、
    本番利用は推奨しません。Anthropicはさらに、**2026年4月4日
    午後12:00 PT / 午後8:00 BST** にOpenClawユーザーへ、
    **OpenClaw** のClaude-login pathには
    subscriptionとは別に請求される **Extra Usage** が必要だと通知しました。

    本番環境やマルチユーザーワークロードでは、Anthropic API key authが
    より安全で推奨される選択です。OpenClawでその他のsubscriptionスタイルのホスト型
    オプションを使いたい場合は、[OpenAI](/providers/openai), [Qwen / Model
    Cloud](/providers/qwen), [MiniMax](/providers/minimax), および
    [GLM Models](/providers/glm) を参照してください。

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropicから HTTP 429 rate_limit_error が出るのはなぜですか？">
これは、現在のウィンドウにおける **Anthropicのquota/rate limit** を使い切ったことを意味します。もし
**Claude CLI** を使っているなら、ウィンドウがリセットされるまで待つか、プランを
アップグレードしてください。**Anthropic API key** を使っている場合は、Anthropic Console
でusage/billingを確認し、必要に応じてlimitを引き上げてください。

    メッセージが具体的に
    `Extra usage is required for long context requests` の場合、そのリクエストは
    Anthropicの1M context beta（`context1m: true`）を使おうとしています。これは
    credentialがlong-context billingに対応している場合にのみ動作します（API key billing、または
    Extra Usageが有効なOpenClaw Claude-login path）。

    ヒント: providerがrate-limitedでもOpenClawが応答し続けられるよう、**fallback model**
    を設定してください。
    [Models](/cli/models), [OAuth](/concepts/oauth), および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrockはサポートされていますか？">
    はい。OpenClawにはbundledの **Amazon Bedrock (Converse)** providerがあります。AWS env markerがあると、OpenClawはstreaming/text Bedrock catalogを自動検出し、暗黙の `amazon-bedrock` providerとしてマージできます。そうでない場合でも、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効にするか、手動provider entryを追加できます。[Amazon Bedrock](/providers/bedrock) と [Model providers](/providers/models) を参照してください。managed key flowを好む場合は、Bedrockの前段にOpenAI互換proxyを置く方法も有効です。
  </Accordion>

  <Accordion title="Codex authはどう動作しますか？">
    OpenClawは、OAuth（ChatGPTサインイン）経由で **OpenAI Code (Codex)** をサポートします。オンボーディングでOAuth flowを実行でき、適切な場合はデフォルトmodelを `openai-codex/gpt-5.4` に設定します。[Model providers](/concepts/model-providers) と [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="OpenAI subscription auth（Codex OAuth）はサポートしていますか？">
    はい。OpenClawは **OpenAI Code (Codex) subscription OAuth** を完全にサポートしています。
    OpenAIは、OpenClawのような外部tool/workflowでのsubscription OAuth利用を
    明示的に許可しています。オンボーディングでOAuth flowを実行できます。

    [OAuth](/concepts/oauth), [Model providers](/concepts/model-providers), [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuthはどうセットアップしますか？">
    Gemini CLIは、`openclaw.json` にclient idやsecretを書く方式ではなく、**plugin auth flow** を使います。

    手順:

    1. `gemini` が `PATH` 上に来るようにローカルへGemini CLIをインストールする
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. pluginを有効化する: `openclaw plugins enable google`
    3. ログインする: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトmodel: `google-gemini-cli/gemini-3.1-pro-preview`
    5. リクエストが失敗する場合は、gateway host上で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定する

    これはOAuth tokenをgateway host上のauth profilesへ保存します。詳細: [Model providers](/concepts/model-providers)。

  </Accordion>

  <Accordion title="軽い雑談にはlocal modelでも大丈夫ですか？">
    通常はいいえ。OpenClawには大きなcontextと強い安全性が必要で、小さいカードでは切り詰めや漏えいが起こります。どうしても使うなら、ローカルで実行可能な**最大の**model buildを使ってください（LM Studio）。[/gateway/local-models](/gateway/local-models) を参照してください。小さい/量子化されたmodelほどprompt-injectionリスクが高まります。[Security](/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型modelトラフィックを特定のリージョンに留めるには？">
    リージョン固定のendpointを選んでください。OpenRouterはMiniMax、Kimi、GLM向けにUSホスト型オプションを公開しているため、US-hosted variantを選べばデータをそのリージョン内に留められます。`models.mode: "merge"` を使えば、選択したリージョン固定providerを尊重しつつ、Anthropic/OpenAIも併記してfallbackを維持できます。
  </Accordion>

  <Accordion title="これをインストールするにはMac Miniを買う必要がありますか？">
    いいえ。OpenClawはmacOSまたはLinux上で動作します（WindowsはWSL2経由）。Mac miniは任意です。常時稼働hostとして買う人もいますが、小さなVPS、home server、またはRaspberry Pi級のマシンでも十分です。

    Macが必要なのは **macOS専用tool** の場合だけです。iMessageについては [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使ってください。BlueBubbles serverは任意のMac上で動作し、GatewayはLinuxや他の場所でも動作できます。その他のmacOS専用toolが必要なら、GatewayをMac上で動かすか、macOS nodeをペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage対応にはMac miniが必要ですか？">
    **Messagesにサインインした何らかのmacOSデバイス** が必要です。Mac miniである必要はなく、
    どのMacでも構いません。iMessageには **[BlueBubbles](/ja-JP/channels/bluebubbles)**（推奨）を使ってください。BlueBubbles serverはmacOS上で動作し、GatewayはLinuxや他の場所で動作できます。

    よくある構成:

    - GatewayをLinux/VPS上で動かし、Messagesにサインインした任意のMac上でBlueBubbles serverを動かす。
    - 最も単純な単一マシン構成にしたいなら、すべてをMac上で動かす。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/nodes),
    [Mac remote mode](/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClawを動かすためにMac miniを買った場合、MacBook Proから接続できますか？">
    はい。**Mac miniでGatewayを実行**し、MacBook Proは
    **node**（companion device）として接続できます。nodeはGatewayを実行せず、
    そのデバイス上のscreen/camera/canvasや `system.run` のような追加機能を提供します。

    よくあるパターン:

    - GatewayはMac mini上（常時稼働）。
    - MacBook ProはmacOS appまたはnode hostを実行し、Gatewayへペアリングする。
    - `openclaw nodes status` / `openclaw nodes list` で確認する。

    ドキュメント: [Nodes](/nodes), [Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="Bunは使えますか？">
    Bunは**推奨されません**。特にWhatsAppとTelegramでruntime bugが見られます。
    安定したgatewayには **Node** を使ってください。

    それでもBunを試したい場合は、WhatsApp/Telegramなしの
    非本番gatewayで試してください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れますか？">
    `channels.telegram.allowFrom` は **人間の送信者のTelegram user ID**（数値）です。bot usernameではありません。

    オンボーディングは `@username` 入力を受け付けて数値IDへ解決しますが、OpenClawのauthorizationは数値IDのみを使用します。

    より安全な方法（サードパーティbot不要）:

    - botへDMを送り、その後 `openclaw logs --follow` を実行して `from.id` を読みます。

    Official Bot API:

    - botへDMを送り、その後 `https://api.telegram.org/bot<bot_token>/getUpdates` を呼んで `message.from.id` を読みます。

    サードパーティ（プライバシー性は低い）:

    - `@userinfobot` または `@getidsbot` にDMを送る。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が1つのWhatsApp番号を、別々のOpenClawインスタンスで使えますか？">
    はい。**multi-agent routing** で可能です。各送信者のWhatsApp **DM**（peer `kind: "direct"`、送信者E.164、例 `+15551234567`）を異なる `agentId` にバインドすれば、それぞれに独自のworkspaceとsession storeを持たせられます。返信は引き続き**同じWhatsApp account** から送られ、DM access control（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）はWhatsApp accountごとにグローバルです。[Multi-Agent Routing](/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「雑談用のfast chat」agentと「コーディング用のOpus」agentを実行できますか？'>
    はい。multi-agent routingを使ってください。各agentに独自のdefault modelを与え、その後inbound route（provider accountまたは特定peer）を各agentへバインドします。設定例は [Multi-Agent Routing](/concepts/multi-agent) にあります。[Models](/concepts/models) と [Configuration](/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="HomebrewはLinuxでも動きますか？">
    はい。HomebrewはLinux（Linuxbrew）をサポートしています。簡単なセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClawをsystemd経由で実行する場合、serviceのPATHに `/home/linuxbrew/.linuxbrew/bin`（またはbrew prefix）を含めて、非login shellでも `brew` でインストールしたtoolが解決されるようにしてください。
    最近のbuildでは、Linux systemd servicesに一般的なuser bin dirs（例: `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`）も前置され、`PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR` が設定されていれば尊重します。

  </Accordion>

  <Accordion title="ハッカブルなgit installとnpm installの違いは？">
    - **ハッカブルな（git）インストール:** 完全なソースcheckoutで編集可能。コントリビューターに最適です。
      buildをローカルで実行し、コード/docsを修正できます。
    - **npm install:** グローバルCLIインストールでrepoなし。「とにかく動かしたい」用途に最適です。
      更新はnpm dist-tagsから取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started), [Updating](/install/updating)。

  </Accordion>

  <Accordion title="後からnpm installとgit installを切り替えられますか？">
    はい。別の方式をインストールし、その後Doctorを実行してgateway serviceが新しいentrypointを指すようにしてください。
    これは**データを削除しません**。変わるのはOpenClawのコードインストールだけです。state
    （`~/.openclaw`）とworkspace（`~/.openclaw/workspace`）はそのままです。

    npmからgitへ:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    gitからnpmへ:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctorはgateway service entrypoint mismatchを検出し、現在のインストールに合わせてservice configを書き換える提案をします（自動化では `--repair` を使用）。

    バックアップのヒント: [バックアップ戦略](#ディスク上の保存場所) を参照してください。

  </Accordion>

  <Accordion title="Gatewayはlaptop上とVPS上のどちらで動かすべきですか？">
    短く言うと、**24/7の信頼性が欲しいならVPS** を使ってください。摩擦の少なさを優先し、
    sleep/restartを許容できるならローカルで動かしてください。

    **Laptop（local Gateway）**

    - **長所:** serverコスト不要、ローカルファイルへ直接アクセスできる、browser windowが見える。
    - **短所:** sleep/network drop = 切断、OS update/rebootで中断、起動し続ける必要がある。

    **VPS / cloud**

    - **長所:** 常時稼働、安定したネットワーク、laptopのsleep問題なし、稼働維持がしやすい。
    - **短所:** 多くはheadlessで動く（screenshotを使う）、ファイルアクセスはremoteのみ、更新にはSSHが必要。

    **OpenClaw固有の注:** WhatsApp/Telegram/Slack/Mattermost/DiscordはすべてVPS上でも問題なく動作します。実質的なトレードオフは
    **headless browser** と可視browser windowの違いだけです。[Browser](/tools/browser) を参照してください。

    **推奨デフォルト:** 以前gateway disconnectを経験したならVPS。ローカルは、Macを積極的に使っていて、
    ローカルファイルアクセスや可視browserでのUI automationが欲しいときに最適です。

  </Accordion>

  <Accordion title="OpenClawを専用マシンで動かす重要性はどれくらいですか？">
    必須ではありませんが、**信頼性と分離性の観点から推奨**です。

    - **専用host（VPS/Mac mini/Pi）:** 常時稼働、sleep/reboot中断が少ない、権限が整理しやすい、動作を維持しやすい。
    - **共用laptop/desktop:** テストや積極利用にはまったく問題ありませんが、マシンのsleepやupdateで停止が起きます。

    両取りしたい場合は、Gatewayを専用hostに置き、laptopを**node** としてペアリングしてローカルscreen/camera/exec toolsを使ってください。[Nodes](/nodes) を参照してください。
    セキュリティ指針については [Security](/gateway/security) を読んでください。

  </Accordion>

  <Accordion title="最低限のVPS要件と推奨OSは？">
    OpenClawは軽量です。基本的なGateway + 1つのchat channelなら:

    - **絶対最低限:** 1 vCPU, 1GB RAM, 約500MB disk。
    - **推奨:** 1〜2 vCPU, 2GB RAM以上の余裕（ログ、メディア、複数channels）。Node toolsやbrowser automationはリソースを消費することがあります。

    OSは **Ubuntu LTS**（または現代的なDebian/Ubuntu）を使ってください。Linux install pathとして最もよくテストされています。

    ドキュメント: [Linux](/platforms/linux), [VPS hosting](/vps)。

  </Accordion>

  <Accordion title="VMでOpenClawを動かせますか？ 要件は？">
    はい。VMはVPSと同じように扱ってください。常時稼働し、到達可能で、
    Gatewayと有効にしたchannelsを動かすのに十分な
    RAMが必要です。

    基本指針:

    - **絶対最低限:** 1 vCPU, 1GB RAM。
    - **推奨:** 複数channels、browser automation、media toolsを動かすなら2GB RAM以上。
    - **OS:** Ubuntu LTSまたはその他の現代的なDebian/Ubuntu。

    Windowsの場合、**WSL2が最も簡単なVM風セットアップ**であり、tool互換性も最良です。[Windows](/platforms/windows), [VPS hosting](/vps) を参照してください。
    macOSをVM内で動かしている場合は、[macOS VM](/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## OpenClawとは？

<AccordionGroup>
  <Accordion title="OpenClawを1段落で説明すると？">
    OpenClawは、自分のデバイス上で動かす個人用AI assistantです。すでに使っているメッセージングサーフェス（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、およびQQ Botのようなbundled channel plugins）で応答し、対応プラットフォームでは音声やライブCanvasも利用できます。**Gateway** は常時稼働のcontrol planeであり、assistantが製品です。
  </Accordion>

  <Accordion title="価値提案">
    OpenClawは「単なるClaude wrapper」ではありません。**local-firstのcontrol plane** であり、
    **自分のハードウェア** 上で、
    すでに使っているchat appsから到達できる、高機能なassistantを動かし、
    stateful sessions、memory、toolsを使いつつ、
    workflowの制御をホスト型
    SaaSへ渡さずに済みます。

    ハイライト:

    - **自分のデバイス、自分のデータ:** Gatewayを好きな場所（Mac、Linux、VPS）で動かし、
      workspace + session historyをローカルに保てます。
    - **web sandboxではなく実際のchannels:** WhatsApp/Telegram/Slack/Discord/Signal/iMessageなど、
      さらに対応プラットフォームではmobile voiceとCanvasも。
    - **Model-agnostic:** Anthropic、OpenAI、MiniMax、OpenRouterなどを、agent単位のルーティング
      とfailover付きで使えます。
    - **local-onlyオプション:** local modelsを使えば、望むなら **すべてのデータを自分のデバイス上に留められます**。
    - **Multi-agent routing:** channel、account、taskごとにagentを分けられ、それぞれに独自の
      workspaceとdefaultを持たせられます。
    - **オープンソースでハッカブル:** vendor lock-inなしで検査、拡張、self-hostできます。

    ドキュメント: [Gateway](/gateway), [Channels](/ja-JP/channels), [Multi-agent](/concepts/multi-agent),
    [Memory](/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    良い最初のプロジェクト例:

    - Webサイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリを試作する（概要、画面、API計画）。
    - ファイルとフォルダーを整理する（整理、命名、タグ付け）。
    - Gmailを接続し、要約やfollow upを自動化する。

    大きなtaskも扱えますが、段階に分け、
    並列作業にはsub agentsを使うと最もうまくいきます。

  </Accordion>

  <Accordion title="OpenClawの日常的な上位5つのユースケースは？">
    日常の効果が出やすい例は、だいたい次のようなものです。

    - **個人向けブリーフィング:** inbox、calendar、気になるニュースの要約。
    - **リサーチと下書き:** メールやdocsのための素早い調査、要約、初稿作成。
    - **リマインダーとfollow up:** cronまたはheartbeat駆動の通知やチェックリスト。
    - **Browser automation:** フォーム入力、データ収集、繰り返しのweb作業。
    - **クロスデバイス連携:** phoneからtaskを送り、Gatewayがserver上で実行し、結果をchatで受け取る。

  </Accordion>

  <Accordion title="OpenClawでSaaS向けのlead gen、outreach、ads、blogsを手伝えますか？">
    **調査、絞り込み、下書き** には有効です。サイトをスキャンし、shortlistを作成し、
    prospectを要約し、outreachやad copyの下書きを書けます。

    **outreachや広告配信** については、人間をループに残してください。spamを避け、各地域の法律や
    プラットフォームポリシーを守り、送信前に必ず確認してください。もっとも安全なパターンは、
    OpenClawに下書きさせて自分で承認することです。

    ドキュメント: [Security](/gateway/security)。

  </Accordion>

  <Accordion title="web開発でClaude Codeと比べた利点は？">
    OpenClawは **個人用assistant** と調整レイヤーであり、IDE置き換えではありません。repo内で最速の直接コーディングループには
    Claude CodeやCodexを使ってください。OpenClawは、永続的memory、クロスデバイスアクセス、
    tool orchestrationが欲しいときに使ってください。

    利点:

    - セッションをまたぐ**永続的memory + workspace**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **Tool orchestration**（browser、files、scheduling、hooks）
    - **常時稼働Gateway**（VPSで動かし、どこからでも対話）
    - ローカルbrowser/screen/camera/exec用の **Nodes**

    紹介: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skillsと自動化

<AccordionGroup>
  <Accordion title="repoを汚さずにskillsをカスタマイズするには？">
    repo内コピーを編集するのではなく、managed overrideを使ってください。変更は `~/.openclaw/skills/<name>/SKILL.md` に置くか（または `~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加してください）。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` なので、managed overrideはgitに触れずにbundled skillsより優先されます。skillをグローバルにインストールしつつ一部agentだけに見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、可視性は `agents.defaults.skills` と `agents.list[].skills` で制御してください。upstreamに値する編集だけをrepoに置いてPRとして出すべきです。
  </Accordion>

  <Accordion title="custom folderからskillsを読み込めますか？">
    はい。追加ディレクトリは `~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加できます（最低優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClawは次のsessionでそれを `<workspace>/skills` として扱います。skillを一部のagentにしか見せたくない場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="taskごとに異なるmodelを使うには？">
    現在サポートされるパターンは次のとおりです。

    - **Cron jobs**: isolated jobsではjobごとに `model` overrideを設定できます。
    - **Sub-agents**: 異なるdefault modelを持つ別agentへtaskをルーティングします。
    - **オンデマンド切り替え**: `/model` を使って現在のsession modelをいつでも切り替えます。

    [Cron jobs](/ja-JP/automation/cron-jobs), [Multi-Agent Routing](/concepts/multi-agent), [Slash commands](/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い作業をしているとbotが固まります。どうオフロードすればいいですか？">
    長時間または並列のtaskには **sub-agents** を使ってください。sub-agentは独自のsessionで実行され、
    要約を返し、main chatの応答性を保ちます。

    botに「このtaskのためにsub-agentをspawnして」と頼むか、`/subagents` を使ってください。
    chat内で `/status` を使うと、今Gatewayが何をしているか（そして忙しいかどうか）を確認できます。

    Tokenのヒント: 長時間taskもsub-agentもtokenを消費します。コストが気になるなら、
    `agents.defaults.subagents.model` でsub-agent用に
    安いmodelを設定してください。

    ドキュメント: [Sub-agents](/tools/subagents), [Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discordでthread-bound subagent sessionはどう動作しますか？">
    thread bindingを使ってください。Discord threadをsubagentまたはsession targetへバインドすると、そのthread内のfollow-up messageがそのbound sessionに留まります。

    基本フロー:

    - `sessions_spawn` を `thread: true` 付きでspawnします（持続的follow-upには任意で `mode: "session"` も）。
    - または `/focus <target>` で手動バインドします。
    - `/agents` を使ってbinding stateを確認します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` を使ってauto-unfocusを制御します。
    - `/unfocus` でthreadを切り離します。

    必要な設定:

    - グローバルデフォルト: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`。
    - Discord override: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`。
    - spawn時の自動バインド: `channels.discord.threadBindings.spawnSubagentSessions: true` を設定。

    ドキュメント: [Sub-agents](/tools/subagents), [Discord](/ja-JP/channels/discord), [Configuration Reference](/gateway/configuration-reference), [Slash commands](/tools/slash-commands)。

  </Accordion>

  <Accordion title="subagentは完了したのに、completion updateが間違った場所へ行ったか、投稿されませんでした。何を確認すれば？">
    まず解決されたrequester routeを確認してください。

    - completion-modeのsubagent配信は、bound threadまたはconversation routeが存在すれば、それを優先します。
    - completion originにchannelしか含まれない場合、OpenClawはrequester sessionの保存済みroute（`lastChannel` / `lastTo` / `lastAccountId`）へフォールバックし、direct deliveryが成功する可能性を残します。
    - bound routeも有効な保存済みrouteもない場合、direct deliveryは失敗し、結果はchatへ即時投稿されずにqueueされたsession deliveryへフォールバックします。
    - 無効または古いtargetでは、queue fallbackや最終配信失敗に至ることがあります。
    - 子の最後に見えるassistant replyが完全にサイレントtoken `NO_REPLY` / `no_reply`、またはちょうど `ANNOUNCE_SKIP` の場合、OpenClawは古い進捗を投稿せず、announceを意図的に抑制します。
    - 子がtool callだけでtimeoutした場合、announceは生のtool outputを再生せず、短いpartial-progress summaryへまとめることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Sub-agents](/tools/subagents), [Background Tasks](/ja-JP/automation/tasks), [Session Tools](/concepts/session-tool)。

  </Accordion>

  <Accordion title="cronやreminderが発火しません。何を確認すれば？">
    cronはGateway process内で動作します。Gatewayが継続的に動いていないと、
    scheduled jobsは実行されません。

    チェックリスト:

    - cronが有効か確認する（`cron.enabled`）かつ `OPENCLAW_SKIP_CRON` が設定されていないことを確認する。
    - Gatewayが24/7で動作していることを確認する（sleep/restartなし）。
    - jobのtimezone設定（`--tz` と host timezone）を検証する。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="cronは発火したのに、channelへ何も送られませんでした。なぜですか？">
    まずdelivery modeを確認してください。

    - `--no-deliver` / `delivery.mode: "none"` は、外部messageが送られないことを意味します。
    - announce target（`channel` / `to`）が欠落または無効だと、runnerはoutbound deliveryをスキップします。
    - channel auth failure（`unauthorized`, `Forbidden`）は、runnerが配信を試みたがcredentialにブロックされたことを意味します。
    - silent isolated result（`NO_REPLY` / `no_reply` のみ）は意図的に配信不能として扱われるため、runnerはqueue fallback deliveryも抑制します。

    isolated cron jobでは、最終deliveryはrunnerが担当します。agentは
    runnerが送れるplain-text summaryを返すことが期待されます。`--no-deliver` は
    その結果を内部に留めるだけであり、agentに
    message toolで直接送信させるものではありません。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="isolated cron runがmodelを切り替えたり1回再試行したのはなぜですか？">
    それは通常、重複スケジューリングではなくlive model-switch pathです。

    isolated cronは、実行中に `LiveSessionModelSwitchError` が発生すると、
    runtime model handoffを永続化して再試行できます。その再試行では切り替え後の
    provider/modelが維持され、切り替えに新しいauth profile overrideが含まれていた場合は、
    cronは再試行前にそれも永続化します。

    関連する選択ルール:

    - 該当する場合、まずGmail hook model overrideが優先。
    - 次にjobごとの `model`。
    - 次に保存済みcron-session model override。
    - 最後に通常のagent/default model selection。

    retry loopには上限があります。初回試行と2回のswitch retryの後は、
    cronは無限ループせず中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [cron CLI](/cli/cron)。

  </Accordion>

  <Accordion title="Linuxでskillsをインストールするには？">
    nativeの `openclaw skills` コマンドを使うか、skillsをworkspaceへ配置してください。macOSのSkills UIはLinuxでは使えません。
    skillsは [https://clawhub.ai](https://clawhub.ai) で閲覧できます。

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

    nativeの `openclaw skills install` は、アクティブなworkspaceの `skills/`
    ディレクトリへ書き込みます。自分のskillsをpublishしたり
    syncしたりしたい場合にのみ、別の `clawhub` CLIをインストールしてください。複数agentで共有するinstallには、skillを
    `~/.openclaw/skills` 配下に置き、必要に応じて
    `agents.defaults.skills` または `agents.list[].skills` を使って、
    どのagentに見せるかを絞ってください。

  </Accordion>

  <Accordion title="OpenClawはscheduled taskや継続的なbackground taskを実行できますか？">
    はい。Gateway schedulerを使ってください。

    - scheduledまたは反復taskには **Cron jobs**（再起動後も永続化）。
    - 「main session」の定期確認には **Heartbeat**。
    - 要約を投稿したりchatへ配信したりする自律agentには **Isolated jobs**。

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation),
    [Heartbeat](/gateway/heartbeat)。

  </Accordion>

  <Accordion title="LinuxからAppleのmacOS専用skillsを実行できますか？">
    直接はできません。macOS skillsは `metadata.openclaw.os` と必要なバイナリによって制御され、skillsは **Gateway host** 上で条件を満たすときだけsystem promptに現れます。Linuxでは、`darwin` 専用skills（`apple-notes`, `apple-reminders`, `things-mac` など）は、gatingをoverrideしない限り読み込まれません。

    サポートされるパターンは3つあります。

    **Option A - GatewayをMac上で実行する（最も簡単）。**
    macOSバイナリが存在する場所でGatewayを実行し、その後Linuxから [remote mode](#gateway-ポート-すでに実行中-とremote-mode) またはTailscale経由で接続します。Gateway hostがmacOSなのでskillsは通常どおり読み込まれます。

    **Option B - macOS nodeを使う（SSHなし）。**
    GatewayをLinux上で実行し、macOS node（menubar app）をペアリングし、Mac上で **Node Run Commands** を「Always Ask」または「Always Allow」に設定します。必要なバイナリがnode上に存在する場合、OpenClawはmacOS専用skillsを対象可能とみなせます。agentは `nodes` tool経由でそれらのskillsを実行します。「Always Ask」を選んだ場合、プロンプトで「Always Allow」を承認するとそのコマンドがallowlistへ追加されます。

    **Option C - macOSバイナリをSSH越しにproxyする（上級者向け）。**
    GatewayはLinuxに置いたまま、必要なCLIバイナリがMac上で実行されるSSH wrapperへ解決されるようにします。その後、Linuxでも対象可能なようにskillをoverrideします。

    1. バイナリ用のSSH wrapperを作成します（例: Apple Notes用の `memo`）:

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. そのwrapperをLinux hostの `PATH` に置きます（例: `~/bin/memo`）。
    3. skill metadataをoverrideしてLinuxを許可します（workspace または `~/.openclaw/skills`）:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 新しいsessionを開始してskills snapshotを更新します。

  </Accordion>

  <Accordion title="NotionやHeyGen integrationはありますか？">
    現在は組み込みではありません。

    選択肢:

    - **Custom skill / plugin:** 信頼性の高いAPIアクセスには最適です（Notion/HeyGenはいずれもAPIがあります）。
    - **Browser automation:** コード不要で動きますが、遅く壊れやすいです。

    クライアントごとにcontextを保持したい（agency workflow）場合、簡単なパターンは次のとおりです。

    - クライアントごとに1つのNotion page（context + preferences + active work）。
    - session開始時に、そのpageを取得するようagentへ依頼する。

    native integrationが欲しい場合は、feature requestを出すか、
    それらのAPIを対象としたskillを作ってください。

    Skillsのインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    native installはアクティブworkspaceの `skills/` ディレクトリへ入ります。複数agentで共有するskillsは `~/.openclaw/skills/<name>/SKILL.md` に置いてください。共有installを一部のagentだけに見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` を設定してください。一部のskillsはHomebrew経由でインストールされたバイナリを前提とします。LinuxではLinuxbrewを意味します（上のHomebrew Linux FAQ項目を参照）。[Skills](/tools/skills), [Skills config](/tools/skills-config), [ClawHub](/tools/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既にサインイン済みのChromeをOpenClawで使うには？">
    組み込みの `user` browser profileを使ってください。Chrome DevTools MCP経由で接続します。

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    custom名を使いたい場合は、明示的なMCP profileを作成します。

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路はhost-localです。Gatewayが別の場所で動いている場合は、browserマシン上でnode hostを実行するか、代わりにremote CDPを使ってください。

    `existing-session` / `user` の現在の制限:

    - actionsはCSS-selector駆動ではなくref駆動
    - uploadには `ref` / `inputRef` が必要で、現在は1回に1ファイルのみ対応
    - `responsebody`, PDF export, download interception, batch actionsは、引き続きmanaged browserまたはraw CDP profileが必要

  </Accordion>
</AccordionGroup>

## Sandboxingとmemory

<AccordionGroup>
  <Accordion title="sandboxing専用のdocはありますか？">
    はい。[Sandboxing](/gateway/sandboxing) を参照してください。Docker固有のセットアップ（Docker内でGateway全体を動かす場合やsandbox imageについて）は [Docker](/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Dockerは制限が多く感じます。完全な機能を有効にするには？">
    デフォルトimageはsecurity-firstで、`node` userとして実行されるため、
    system package、Homebrew、bundled browserは含まれていません。より完全なセットアップには:

    - `/home/node` を `OPENCLAW_HOME_VOLUME` で永続化してcacheを保持する。
    - `OPENCLAW_DOCKER_APT_PACKAGES` でsystem depsをimageに組み込む。
    - bundled CLI経由でPlaywright browserをインストールする:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されていることを確認する。

    ドキュメント: [Docker](/install/docker), [Browser](/tools/browser)。

  </Accordion>

  <Accordion title="1つのagentでDMは個人的に保ちつつ、groupsは公開/sandbox化できますか？">
    はい。ただし、プライベートトラフィックが **DM**、公開トラフィックが **groups** の場合に有効です。

    `agents.defaults.sandbox.mode: "non-main"` を使うと、group/channel session（non-main key）はDocker内で実行され、main DM sessionはhost上に残ります。その後、sandbox化されたsessionで使えるtoolを `tools.sandbox.tools` で制限してください。

    セットアップ手順 + 設定例: [Groups: personal DMs + public groups](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway configuration](/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="host folderをsandboxへbindするには？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバル + agentごとのbindはマージされます。agentごとのbindは `scope: "shared"` のとき無視されます。機密性のあるものには `:ro` を使い、bindがsandbox filesystemの壁を迂回することを覚えておいてください。

    OpenClawは、bind sourceを正規化パスと、最も深い既存ancestor経由で解決されたcanonical pathの両方に対して検証します。つまり、最後のpath segmentがまだ存在しない場合でもsymlink親経由のescapeはfail closedし、symlink解決後もallowed-rootチェックが適用されます。

    例と安全上の注意については [Sandboxing](/gateway/sandboxing#custom-bind-mounts) と [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="memoryはどう動作しますか？">
    OpenClaw memoryは、agent workspace内のMarkdown filesにすぎません。

    - `memory/YYYY-MM-DD.md` にdaily notes
    - `MEMORY.md` にキュレーションされた長期ノート（main/private sessionsのみ）

    OpenClawはさらに、modelに
    自動compaction前に耐久的なノートを書かせるための **silent pre-compaction memory flush** を実行します。これはworkspaceが
    書き込み可能なときだけ動作します（read-only sandboxではスキップ）。[Memory](/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="memoryが物事を忘れ続けます。定着させるには？">
    botに **その事実をmemoryへ書く** よう頼んでください。長期ノートは `MEMORY.md` に、
    短期contextは `memory/YYYY-MM-DD.md` に入ります。

    これは今も改善中の領域です。modelにmemoryを保存するよう促すのが役立ちます。
    modelは何をすべきか理解しています。それでも忘れ続ける場合は、Gatewayが
    毎回同じworkspaceを使っていることを確認してください。

    ドキュメント: [Memory](/concepts/memory), [Agent workspace](/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="memoryは永続しますか？ 制限はありますか？">
    Memory filesはdisk上にあり、削除するまで永続します。制限は
    modelではなくstorageです。ただし **session context** は依然としてmodelの
    context windowに制限されるため、長い会話ではcompactやtruncateが起こりえます。そのため
    memory searchが存在します。関連部分だけをcontextへ引き戻すためです。

    ドキュメント: [Memory](/concepts/memory), [Context](/concepts/context)。

  </Accordion>

  <Accordion title="semantic memory searchにはOpenAI API keyが必要ですか？">
    **OpenAI embeddings** を使う場合のみ必要です。Codex OAuthはchat/completionsのみを対象とし、
    embeddings accessは付与しないため、**Codexでサインインしても（OAuthでも
    Codex CLI loginでも）** semantic memory searchには役立ちません。OpenAI embeddingsには
    実際のAPI key（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が引き続き必要です。

    providerを明示しない場合、OpenClawは
    API keyを解決できるとproviderを自動選択します（auth profiles, `models.providers.*.apiKey`, または env vars）。
    OpenAI keyが解決できればOpenAIを優先し、そうでなければGemini、次にVoyage、その後Mistralを優先します。
    remote keyが利用できない場合、設定するまでmemory
    searchは無効のままです。local model path
    が設定され存在する場合、OpenClawは
    `local` を優先します。Ollamaは `memorySearch.provider = "ollama"` を明示した場合にサポートされます。

    ローカルのまま使いたい場合は、`memorySearch.provider = "local"`（任意で
    `memorySearch.fallback = "none"` も）を設定してください。Gemini embeddingsを使いたい場合は、
    `memorySearch.provider = "gemini"` に設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定してください。埋め込みmodelとしては **OpenAI, Gemini, Voyage, Mistral, Ollama, または local** をサポートしています。セットアップ詳細は [Memory](/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClawで使うデータはすべてローカルに保存されますか？">
    いいえ。**OpenClawのstateはローカル** ですが、**外部serviceは送信した内容を見る** 必要があります。

    - **デフォルトでローカル:** sessions, memory files, config, workspaceはGateway host上にあります
      （`~/.openclaw` + workspaceディレクトリ）。
    - **必然的にリモート:** model providers（Anthropic/OpenAIなど）へ送るmessageは
      そのAPIへ送信され、chat platform（WhatsApp/Telegram/Slackなど）は
      message dataを自社serverに保存します。
    - **フットプリントは自分で制御:** local modelsを使えばpromptを自分のマシンに留められますが、channel
      trafficは依然としてそのchannelのserverを通ります。

    関連: [Agent workspace](/concepts/agent-workspace), [Memory](/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClawはデータをどこに保存しますか？">
    すべては `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）配下にあります。

    | Path                                                            | 用途                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | レガシーOAuth import（初回使用時にauth profilesへコピーされる）     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API keys、および任意の `keyRef`/`tokenRef`） |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef providers用の任意のfile-backed secret payload     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | レガシー互換ファイル（静的 `api_key` entriesはスクラブされる）     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agentごとのstate（agentDir + sessions）                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴とstate（agentごと）                                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session metadata（agentごと）                                      |

    レガシーのsingle-agent path: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

    **Workspace**（AGENTS.md, memory files, skillsなど）は別で、`agents.defaults.workspace` 経由で設定します（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのfilesは `~/.openclaw` ではなく、**agent workspace** に置きます。

    - **Workspace（agentごと）**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`（`MEMORY.md` がない場合はレガシーfallbackの `memory.md`）,
      `memory/YYYY-MM-DD.md`, 任意の `HEARTBEAT.md`。
    - **State dir（`~/.openclaw`）**: config, channel/provider state, auth profiles, sessions, logs,
      および共有skills（`~/.openclaw/skills`）。

    デフォルトworkspaceは `~/.openclaw/workspace` で、次で設定できます。

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後にbotが「忘れる」場合は、Gatewayが
    起動ごとに同じworkspaceを使っていることを確認してください（そして、remote modeでは
    local laptopではなく **gateway hostの**
    workspaceを使う点に注意してください）。

    ヒント: durableな振る舞いや設定を残したいなら、
    chat historyに頼るのではなく、botに **AGENTS.md または MEMORY.md に書く** よう頼んでください。

    [Agent workspace](/concepts/agent-workspace) と [Memory](/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **Agent workspace** を **private** git repoに入れ、どこか
    privateな場所（たとえばGitHub private）にバックアップしてください。これでmemory + AGENTS/SOUL/USER
    filesが保存され、後でassistantの「心」を復元できます。

    `~/.openclaw` 配下（credentials, sessions, tokens, encrypted secrets payloads）をcommitしてはいけません。
    完全復元が必要なら、workspaceとstate directoryの両方を
    別々にバックアップしてください（上のmigrationの質問を参照）。

    ドキュメント: [Agent workspace](/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="OpenClawを完全にアンインストールするには？">
    専用ガイドを参照してください: [Uninstall](/install/uninstall)。
  </Accordion>

  <Accordion title="agentsはworkspace外でも作業できますか？">
    はい。workspaceは**デフォルトcwd** とmemory anchorであり、厳格なsandboxではありません。
    相対パスはworkspace内で解決されますが、absolute pathは
    sandboxingが有効でない限り、他のhost上の場所にもアクセスできます。分離が必要なら、
    [`agents.defaults.sandbox`](/gateway/sandboxing) またはagentごとのsandbox設定を使ってください。repoをデフォルトworking directoryにしたいなら、そのagentの
    `workspace` をrepo rootに向けてください。OpenClaw repoは単なるソースコードです。agentに意図的にその中で作業させたい場合を除き、
    workspaceは分けておいてください。

    例（repoをデフォルトcwdにする）:

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

  <Accordion title="Remote modeではsession storeはどこにありますか？">
    Session stateは **gateway host** が保持します。remote modeなら、重要なsession storeはlocal laptopではなくremote machine上にあります。[Session management](/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## Configの基本

<AccordionGroup>
  <Accordion title="configの形式は何ですか？ どこにありますか？">
    OpenClawは `$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の **JSON5** configを読み取ります。

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルがない場合は、安全寄りのデフォルトを使用します（`~/.openclaw/workspace` をデフォルトworkspaceに含む）。

  </Accordion>

  <Accordion title='gateway.bind: "lan"（または "tailnet"）を設定したら何もlistenしなくなった / UIが unauthorized と出る'>
    非loopback bindには **有効なgateway auth path** が必要です。実際には次のいずれかを意味します。

    - shared-secret auth: tokenまたはpassword
    - 正しく構成された非loopback identity-aware reverse proxyの背後での `gateway.auth.mode: "trusted-proxy"`

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

    注:

    - `gateway.remote.token` / `.password` だけではlocal gateway authは有効になりません。
    - local call pathは、`gateway.auth.*` が未設定のときにのみfallbackとして `gateway.remote.*` を使えます。
    - password authの場合は、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示的に設定され、かつ未解決の場合、解決はfail closedします（remote fallbackで隠されません）。
    - Shared-secretのControl UI構成では、`connect.params.auth.token` または `connect.params.auth.password`（app/UI settingsに保存）で認証します。Tailscale Serveや `trusted-proxy` のようなidentity-bearing modeでは代わりにrequest headerを使います。shared secretをURLへ入れるのは避けてください。
    - `gateway.auth.mode: "trusted-proxy"` では、同一hostのloopback reverse proxyは依然としてtrusted-proxy authを満たしません。trusted proxyは設定済みの非loopback sourceである必要があります。

  </Accordion>

  <Accordion title="localhostでも今はtokenが必要なのはなぜですか？">
    OpenClawはgateway authをデフォルトで強制しており、loopbackも含まれます。通常のデフォルト経路では、これはtoken authを意味します。明示的なauth pathが設定されていない場合、gateway startupはtoken modeに解決され、自動生成して `gateway.auth.token` に保存するため、**local WS clientも認証が必要** です。これにより、他のlocal processがGatewayを呼び出すのを防ぎます。

    別のauth pathを好む場合は、password mode（または非loopback identity-aware reverse proxy用の `trusted-proxy`）を明示的に選べます。どうしてもloopbackを開放したい場合は、configで明示的に `gateway.auth.mode: "none"` を設定してください。Doctorはいつでもtokenを生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="configを変更した後に再起動は必要ですか？">
    Gatewayはconfigを監視し、hot-reloadをサポートします。

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更はhot-applyし、重要な変更はrestart
    - `hot`, `restart`, `off` もサポートされます

  </Accordion>

  <Accordion title="CLIの面白いtaglineを無効にするには？">
    configで `cli.banner.taglineMode` を設定してください。

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: tagline textを隠しますが、bannerのtitle/version lineは残します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使います。
    - `random`: 面白い/季節もののtaglineをローテーションします（デフォルト動作）。
    - banner自体を出したくない場合は、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

  </Accordion>

  <Accordion title="web search（とweb fetch）を有効にするには？">
    `web_fetch` はAPI keyなしで動作します。`web_search` は選択した
    providerに依存します。

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, TavilyのようなAPIベースproviderは通常のAPI keyセットアップが必要です。
    - Ollama Web Searchはkey不要ですが、設定済みのOllama hostを使い、`ollama signin` が必要です。
    - DuckDuckGoはkey不要ですが、非公式のHTMLベースintegrationです。
    - SearXNGはkey不要/セルフホスト型です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行してproviderを選んでください。
    環境変数による代替:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` または `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, または `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY`
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
              provider: "firecrawl", // 任意。auto-detectにするなら省略
            },
          },
        },
    }
    ```

    provider固有のweb-search configは現在 `plugins.entries.<plugin>.config.webSearch.*` 配下にあります。
    レガシーの `tools.web.search.*` provider pathは互換性のため一時的に読み込まれますが、新しいconfigでは使わないでください。
    Firecrawl web-fetch fallback configは `plugins.entries.firecrawl.config.webFetch.*` 配下にあります。

    注:

    - allowlistを使う場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加してください。
    - `web_fetch` はデフォルトで有効です（明示的に無効化しない限り）。
    - `tools.web.fetch.provider` を省略すると、OpenClawは利用可能なcredentialから最初に準備済みのfetch fallback providerを自動検出します。現在のbundled providerはFirecrawlです。
    - Daemonは `~/.openclaw/.env`（またはservice environment）からenv varsを読みます。

    ドキュメント: [Web tools](/tools/web)。

  </Accordion>

  <Accordion title="config.applyでconfigが消えました。どう復旧し、どう防げますか？">
    `config.apply` は **設定全体** を置き換えます。部分オブジェクトを送ると、それ以外の
    すべてが削除されます。

    復旧方法:

    - バックアップ（gitまたはコピーした `~/.openclaw/openclaw.json`）から復元する。
    - バックアップがない場合は、`openclaw doctor` を再実行し、channels/modelsを再設定する。
    - 予期しない動作だった場合は、bugを報告し、最後に分かっているconfigまたはバックアップを添付する。
    - local coding agentなら、ログやhistoryから動作するconfigを再構築できることがよくあります。

    防止方法:

    - 小さな変更には `openclaw config set` を使う。
    - 対話的編集には `openclaw configure` を使う。
    - 正確なpathやfield shapeに自信がない場合は、まず `config.schema.lookup` を使う。浅いschema nodeと直下のchild summariesが返るので、掘り下げやすくなります。
    - 部分的なRPC編集には `config.patch` を使い、`config.apply` は完全なconfig置換専用に留める。
    - agent実行中にowner専用の `gateway` toolを使っている場合でも、`tools.exec.ask` / `tools.exec.security` への書き込みは引き続き拒否されます（同じ保護されたexec pathsに正規化されるレガシーの `tools.bash.*` aliasも含む）。

    ドキュメント: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/gateway/doctor)。

  </Accordion>

  <Accordion title="中央Gatewayと、デバイスごとのspecialized workerを使うには？">
    よくあるパターンは **1つのGateway**（例: Raspberry Pi） + **nodes** + **agents** です。

    - **Gateway（中央）:** channels（Signal/WhatsApp）、routing、sessionsを保持。
    - **Nodes（デバイス）:** Mac/iOS/Androidが周辺機器として接続し、ローカルtool（`system.run`, `canvas`, `camera`）を公開。
    - **Agents（worker）:** 特定役割（例: 「Hetzner ops」「Personal data」）のための独立したbrain/workspace。
    - **Sub-agents:** 並列化したいとき、main agentからbackground workをspawn。
    - **TUI:** Gatewayへ接続し、agents/sessionsを切り替える。

    ドキュメント: [Nodes](/nodes), [Remote access](/gateway/remote), [Multi-Agent Routing](/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw browserはheadlessで実行できますか？">
    はい。configオプションです。

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

    デフォルトは `false`（headful）です。headlessのほうが一部サイトではanti-bot checkを引き起こしやすくなります。[Browser](/tools/browser) を参照してください。

    Headlessは**同じChromium engine** を使い、ほとんどのautomation（forms, clicks, scraping, logins）で動作します。主な違い:

    - 可視browser windowがない（視覚確認が必要ならscreenshotを使う）。
    - 一部サイトはheadless modeでのautomationにより厳しい（CAPTCHA, anti-bot）。
      たとえばX/Twitterはheadless sessionをブロックすることがよくあります。

  </Accordion>

  <Accordion title="browser controlでBraveを使うには？">
    `browser.executablePath` をBraveバイナリ（または他のChromium系browser）へ設定し、Gatewayを再起動してください。
    完全な設定例は [Browser](/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## Remote gatewaysとnodes

<AccordionGroup>
  <Accordion title="Telegram、gateway、nodesの間でcommandはどう伝播しますか？">
    Telegram messageは **gateway** で処理されます。gatewayがagentを実行し、
    node toolが必要なときだけ **Gateway WebSocket** 越しにnodesを呼び出します。

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodeはinbound provider trafficを見ません。受け取るのはnode RPC callだけです。

  </Accordion>

  <Accordion title="Gatewayがremoteでホストされている場合、agentはどうやって自分のコンピューターへアクセスしますか？">
    短く言うと、**自分のコンピューターをnodeとしてペアリング**してください。Gatewayは別の場所で動きますが、
    Gateway WebSocket越しにローカルマシン上の `node.*` tools（screen, camera, system）を
    呼び出せます。

    典型的なセットアップ:

    1. 常時稼働host（VPS/home server）でGatewayを動かす。
    2. Gateway hostと自分のコンピューターを同じtailnetに入れる。
    3. Gateway WSに到達できることを確認する（tailnet bindまたはSSH tunnel）。
    4. macOS appをローカルで開き、**Remote over SSH** mode（またはdirect tailnet）
       で接続してnodeとして登録させる。
    5. Gatewayでnodeを承認する:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別のTCP bridgeは不要です。nodesはGateway WebSocket経由で接続します。

    セキュリティ上の注意: macOS nodeをペアリングすると、そのマシンで `system.run` が可能になります。
    信頼できるデバイスだけをペアリングし、[Security](/gateway/security) を確認してください。

    ドキュメント: [Nodes](/nodes), [Gateway protocol](/gateway/protocol), [macOS remote mode](/platforms/mac/remote), [Security](/gateway/security)。

  </Accordion>

  <Accordion title="Tailscaleは接続済みなのに応答がありません。どうすれば？">
    基本を確認してください。

    - Gatewayが動いている: `openclaw gateway status`
    - Gateway health: `openclaw status`
    - Channel health: `openclaw channels status`

    次にauthとroutingを確認してください。

    - Tailscale Serveを使うなら、`gateway.auth.allowTailscale` が正しく設定されていることを確認する。
    - SSH tunnel経由で接続するなら、local tunnelが有効で正しいportを指していることを確認する。
    - allowlist（DMまたはgroup）に自分のaccountが含まれていることを確認する。

    ドキュメント: [Tailscale](/gateway/tailscale), [Remote access](/gateway/remote), [Channels](/ja-JP/channels)。

  </Accordion>

  <Accordion title="2つのOpenClawインスタンス（local + VPS）を相互に会話させられますか？">
    はい。組み込みの「bot-to-bot」bridgeはありませんが、いくつかの
    信頼できる方法で接続できます。

    **最も簡単:** 両botがアクセスできる通常のchat channel（Telegram/Slack/WhatsApp）を使う。
    Bot AからBot Bへmessageを送り、その後Bot Bに通常どおり返信させます。

    **CLI bridge（汎用）:** scriptを実行して、もう一方のGatewayを
    `openclaw agent --message ... --deliver` で呼び出し、もう一方のbotが
    listeningしているchatをtargetにします。片方のbotがremote VPS上にあるなら、そのremote Gatewayへ
    SSH/Tailscale経由でCLIを向けてください（[Remote access](/gateway/remote) を参照）。

    例のパターン（target Gatewayへ到達できるマシンで実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2つのbotが無限ループしないよう、ガードレールを追加してください（mention-only, channel
    allowlists, または「bot messageには返信しない」ルール）。

    ドキュメント: [Remote access](/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send)。

  </Accordion>

  <Accordion title="複数agentのためにVPSを分ける必要がありますか？">
    いいえ。1つのGatewayで複数agentをホストでき、それぞれに独自のworkspace、model defaults、
    routingを持たせられます。これは通常の構成であり、agentごとに
    VPSを1つずつ動かすより、はるかに安価で簡単です。

    別VPSが必要なのは、厳格な分離（security boundary）や、共有したくないほど
    大きく異なるconfigが必要な場合だけです。それ以外は、1つのGatewayを維持し、
    複数agentまたはsub-agentsを使ってください。

  </Accordion>

  <Accordion title="VPSからSSHする代わりに、個人のlaptopをnodeとして使う利点はありますか？">
    はい。remote Gatewayからlaptopへ到達する第一級の方法はnodeであり、
    shell access以上のことができます。GatewayはmacOS/Linux上で動作し（WindowsはWSL2経由）、
    軽量なので（小さなVPSやRaspberry Pi級のマシンで十分。4 GB RAMあれば余裕です）、一般的な
    構成は、常時稼働host + laptopをnodeにする形です。

    - **inbound SSH不要。** NodesはGateway WebSocketへ外向きに接続し、device pairingを使います。
    - **より安全な実行制御。** `system.run` はそのlaptop上のnode allowlist/approvalsで制御されます。
    - **より多くのdevice tools。** Nodesは `system.run` に加え `canvas`, `camera`, `screen` を公開します。
    - **ローカルbrowser automation。** GatewayはVPS上、Chromeはlaptop上のnode host経由でローカル実行、またはhost上のChrome MCPへ接続できます。

    SSHはad-hocなshell accessには問題ありませんが、継続的なagent workflowや
    device automationにはnodeのほうが簡単です。

    ドキュメント: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Browser](/tools/browser)。

  </Accordion>

  <Accordion title="nodesはgateway serviceを実行しますか？">
    いいえ。意図的に分離profileを動かす場合を除き、**hostごとにgatewayは1つ** にしてください（[Multiple gateways](/gateway/multiple-gateways) を参照）。Nodesはgatewayへ接続する周辺機器です
    （iOS/Android nodes、またはmenubar appのmacOS「node mode」）。headless node
    hostとCLI制御については [Node host CLI](/cli/node) を参照してください。

    `gateway`, `discovery`, `canvasHost` の変更には完全なrestartが必要です。

  </Accordion>

  <Accordion title="configを適用するAPI / RPC方法はありますか？">
    はい。

    - `config.schema.lookup`: 1つのconfig subtreeを、浅いschema node、一致したUI hint、直下のchild summaries付きで調べてから書き込む
    - `config.get`: 現在のsnapshot + hashを取得する
    - `config.patch`: 安全な部分更新（多くのRPC編集で推奨）
    - `config.apply`: config全体を検証して置換し、その後restartする
    - owner専用の `gateway` runtime toolは、依然として `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。レガシーの `tools.bash.*` aliasは同じ保護されたexec pathsへ正規化されます

  </Accordion>

  <Accordion title="最初のインストール向けの最小限まともなconfig">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これでworkspaceが設定され、botを起動できる相手を制限できます。

  </Accordion>

  <Accordion title="VPSにTailscaleをセットアップしてMacから接続するには？">
    最小手順:

    1. **VPS上でinstall + login**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac上でinstall + login**
       - Tailscale appを使い、同じtailnetへサインインする。
    3. **MagicDNSを有効化する（推奨）**
       - Tailscale admin consoleでMagicDNSを有効にし、VPSが安定した名前を持つようにする。
    4. **tailnet hostnameを使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSHなしでControl UIが欲しい場合は、VPS上でTailscale Serveを使ってください。

    ```bash
    openclaw gateway --tailscale serve
    ```

    これによりgatewayはloopbackにbindされたまま、Tailscale経由でHTTPSが公開されます。[Tailscale](/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac nodeをremote Gatewayへ接続するには？（Tailscale Serve）">
    Serveは **Gateway Control UI + WS** を公開します。nodesは同じGateway WS endpoint上で接続します。

    推奨セットアップ:

    1. **VPSとMacが同じtailnet上にあることを確認する**。
    2. **macOS appをRemote modeで使う**（SSH targetにはtailnet hostnameも使える）。
       appはGateway portをトンネルし、nodeとして接続します。
    3. Gateway上で**nodeを承認する**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway protocol](/gateway/protocol), [Discovery](/gateway/discovery), [macOS remote mode](/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目のlaptopにはインストールすべきですか？ それともnodeを追加するだけでよいですか？">
    2台目のlaptopで必要なのが **local tools**（screen/camera/exec）だけなら、
    **node** として追加してください。そうすればGatewayを1つに保て、
    重複configを避けられます。local node toolsは
    現在macOS専用ですが、今後他OSにも拡張する予定です。

    2台目のGatewayをインストールするのは、**厳格な分離** または完全に別のbotが必要な場合だけです。

    ドキュメント: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## Env varsと.env読み込み

<AccordionGroup>
  <Accordion title="OpenClawは環境変数をどう読み込みますか？">
    OpenClawは親process（shell, launchd/systemd, CIなど）からenv varsを読み取り、さらに次も読み込みます。

    - current working directoryの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルfallback `.env`

    どちらの `.env` も既存のenv varsを上書きしません。

    config内にinline env varsを定義することもできます（process envにない場合のみ適用）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完全な優先順位とソースは [/environment](/help/environment) を参照してください。

  </Accordion>

  <Accordion title="Gatewayをservice経由で起動したらenv varsが消えました。どうすれば？">
    よくある修正は2つあります。

    1. `~/.openclaw/.env` に不足しているkeyを入れる。そうすればserviceがshell envを継承しなくても拾われます。
    2. shell importを有効にする（オプトインの利便機能）:

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

    これはlogin shellを実行し、期待される不足keyだけを取り込みます（上書きはしません）。env var相当:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN を設定したのに、models status で "Shell env: off." と表示されるのはなぜですか？'>
    `openclaw models status` は **shell env import** が有効かどうかを報告します。「Shell env: off」
    はenv varsが欠けていることを意味するのではなく、OpenClawが
    login shellを自動で読み込まないという意味です。

    Gatewayをservice（launchd/systemd）として動かしている場合、shell
    environmentを継承しません。次のいずれかで修正してください。

    1. tokenを `~/.openclaw/.env` に入れる:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. またはshell importを有効にする（`env.shellEnv.enabled: true`）。
    3. またはconfigの `env` ブロックに追加する（不足している場合のみ適用）。

    その後gatewayを再起動し、再確認してください。

    ```bash
    openclaw models status
    ```

    Copilot tokenは `COPILOT_GITHUB_TOKEN`（`GH_TOKEN` / `GITHUB_TOKEN` も）から読み取られます。
    [/concepts/model-providers](/concepts/model-providers) と [/environment](/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## Sessionsと複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を始めるには？">
    `/new` または `/reset` を単独messageとして送信してください。[Session management](/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="/new を送らなければsessionは自動でリセットされますか？">
    Sessionは `session.idleMinutes` 後に失効できますが、これは**デフォルトで無効** です（デフォルト **0**）。
    idle expiryを有効にするには正の値を設定してください。有効時は、idle期間後の
    次のmessageがそのchat keyに対する新しいsession idを開始します。
    transcriptを削除するのではなく、新しいsessionを始めるだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClawインスタンスのチーム（1人のCEOと多数のagent）を作れますか？">
    はい。**multi-agent routing** と **sub-agents** を使います。1つのcoordinator
    agentと、独自のworkspaceとmodelを持つ複数worker agentを作れます。

    ただし、これは**楽しい実験** と考えるのがよいです。token消費が大きく、
    1つのbotを複数sessionで使うより非効率なことが多いです。私たちが通常想定しているのは、
    1つのbotに話しかけ、並列作業には別sessionを使うモデルです。その
    botは必要に応じてsub-agentもspawnできます。

    ドキュメント: [Multi-agent routing](/concepts/multi-agent), [Sub-agents](/tools/subagents), [Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="taskの途中でcontextが切り詰められました。どう防げますか？">
    Session contextはmodel windowに制限されます。長いchat、大きなtool output、多数の
    filesがcompactionやtruncateを引き起こすことがあります。

    効果的な対策:

    - 現在の状態を要約してfileに書くようbotに頼む。
    - 長いtaskの前に `/compact` を使い、話題切り替え時に `/new` を使う。
    - 重要なcontextはworkspaceに保持し、botに読み返させる。
    - 長い作業や並列作業にはsub-agentを使って、main chatを小さく保つ。
    - これが頻繁に起こるなら、より大きなcontext windowを持つmodelを選ぶ。

  </Accordion>

  <Accordion title="OpenClawを完全にリセットするが、インストールは残したいです">
    resetコマンドを使ってください:

    ```bash
    openclaw reset
    ```

    非対話のfull reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、setupを再実行します:

    ```bash
    openclaw onboard --install-daemon
    ```

    注:

    - 既存configがある場合、オンボーディングでも **Reset** を提案します。[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
    - profile（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各state dirをリセットしてください（デフォルトは `~/.openclaw-<profile>`）。
    - Dev reset: `openclaw gateway --dev --reset`（dev専用。dev config + credentials + sessions + workspaceを消去）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ます。どうリセットまたはcompactすれば？'>
    次のいずれかを使ってください。

    - **Compact**（会話は維持しつつ、古いturnを要約する）:

      ```
      /compact
      ```

      または要約の方針を与えるには `/compact <instructions>`。

    - **Reset**（同じchat keyで新しいsession ID）:

      ```
      /new
      /reset
      ```

    繰り返し発生する場合:

    - **session pruning**（`agents.defaults.contextPruning`）を有効または調整し、古いtool outputを削る。
    - より大きなcontext windowを持つmodelを使う。

    ドキュメント: [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning), [Session management](/concepts/session)。

  </Accordion>

  <Accordion title='「LLM request rejected: messages.content.tool_use.input field required」と表示されるのはなぜですか？'>
    これはprovider validation errorです。modelが必要な
    `input` のない `tool_use` blockを出力しています。通常はsession historyが古いか壊れていることを意味します（長いthreadやtool/schema変更の後によくあります）。

    修正: `/new` を単独messageとして送って新しいsessionを始めてください。

  </Accordion>

  <Accordion title="なぜ30分ごとにheartbeat messageが来るのですか？">
    Heartbeatはデフォルトで **30m** ごと（OAuth auth使用時は **1h** ごと）に実行されます。調整または無効化するには:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 無効化するなら "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` が存在していても、実質的に空（空行とmarkdown
    headers、例えば `# Heading` のみ）の場合、OpenClawはAPI call節約のためheartbeat実行をスキップします。
    fileが存在しない場合、heartbeatは依然として実行され、何をするかはmodelが決めます。

    agentごとのoverrideには `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp groupに「bot account」を追加する必要がありますか？'>
    いいえ。OpenClawは**自分のaccount** 上で動作するため、自分がgroupにいれば、
    OpenClawもそのgroupを見られます。
    デフォルトでは、送信者を許可するまでgroup replyはブロックされます（`groupPolicy: "allowlist"`）。

    group replyを起動できるのを **自分だけ** にしたい場合:

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

  <Accordion title="WhatsApp groupのJIDはどう取得しますか？">
    Option 1（最速）: ログをtailし、そのgroupでtest messageを送ります:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探してください。例:
    `1234567890-1234567890@g.us`。

    Option 2（すでに設定/allowlist済みの場合）: configからgroupsを一覧します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs)。

  </Accordion>

  <Accordion title="groupでOpenClawが返信しないのはなぜですか？">
    よくある原因は2つです。

    - mention gatingが有効（デフォルト）。botへ @mention するか、`mentionPatterns` に一致する必要があります。
    - `channels.whatsapp.groups` を `"*"` なしで設定し、そのgroupがallowlistに入っていない。

    [Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="groups/threadsはDMとcontextを共有しますか？">
    direct chatはデフォルトでmain sessionへ畳み込まれます。groups/channelsは独自のsession keyを持ち、Telegram topics / Discord threadsは別sessionです。[Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="workspaceやagentはいくつまで作れますか？">
    厳密な上限はありません。数十、場合によっては数百でも問題ありませんが、次に注意してください。

    - **Disk増加:** sessions + transcriptsは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。
    - **Tokenコスト:** agentが増えるほど同時model usageが増えます。
    - **運用負荷:** agentごとのauth profiles, workspaces, channel routing。

    ヒント:

    - agentごとに1つの**アクティブ**workspace（`agents.defaults.workspace`）を維持する。
    - diskが増えたら古いsessionをpruneする（JSONLまたはstore entriesを削除）。
    - `openclaw doctor` を使って、迷子workspaceやprofile mismatchを見つける。

  </Accordion>

  <Accordion title="複数のbotやchatを同時に（Slackで）動かせますか？ どうセットアップすべきですか？">
    はい。**Multi-Agent Routing** を使うと、複数の分離agentを動かし、
    inbound messageを
    channel/account/peerごとにルーティングできます。Slackはchannelとしてサポートされており、特定agentへバインドできます。

    Browser accessは強力ですが、「人間ができることを何でもできる」わけではありません。anti-bot、CAPTCHA、MFAが
    automationを妨げることはあります。最も信頼性の高いbrowser controlには、host上のlocal Chrome MCPを使うか、
    実際にbrowserを動かしているマシン上でCDPを使ってください。

    ベストプラクティス構成:

    - 常時稼働のGateway host（VPS/Mac mini）。
    - 役割ごとに1つのagent（bindings）。
    - それらagentへバインドされたSlack channel。
    - 必要に応じてChrome MCPまたはnode経由のlocal browser。

    ドキュメント: [Multi-Agent Routing](/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [Browser](/tools/browser), [Nodes](/nodes)。

  </Accordion>
</AccordionGroup>

## Models: defaults, selection, aliases, switching

<AccordionGroup>
  <Accordion title='「default model」とは何ですか？'>
    OpenClawのdefault modelは、次に設定したものです:

    ```
    agents.defaults.model.primary
    ```

    Modelsは `provider/model` 形式で参照されます（例: `openai/gpt-5.4`）。providerを省略した場合、OpenClawはまずaliasを試し、次にその正確なmodel idに対する一意のconfigured-provider一致を試し、それでもだめなら非推奨の互換経路としてconfigured default providerへフォールバックします。そのproviderがもはやconfigured default modelを公開していない場合、削除済みproviderの古いdefaultを表面化する代わりに、最初のconfigured provider/modelへフォールバックします。それでも **明示的に** `provider/model` を設定するべきです。

  </Accordion>

  <Accordion title="おすすめのmodelは？">
    **推奨デフォルト:** provider stack内で利用可能な最新世代の最も強いmodelを使ってください。
    **tool有効または信頼できない入力を扱うagent向け:** コストよりmodel強度を優先してください。
    **日常的/低リスクのchat向け:** 安いfallback modelを使い、agent roleごとにルーティングしてください。

    MiniMaxには専用docsがあります: [MiniMax](/providers/minimax) と
    [Local models](/gateway/local-models)。

    目安として、高リスク作業には **負担できる範囲で最良のmodel** を使い、
    日常会話や要約には安い
    modelを使ってください。agentごとにmodelをルーティングでき、長いtaskはsub-agentsで
    並列化できます（各sub-agentはtokenを消費します）。[Models](/concepts/models) と
    [Sub-agents](/tools/subagents) を参照してください。

    強い警告: 弱い/過度に量子化されたmodelは、prompt
    injectionや危険な振る舞いに対して脆弱です。[Security](/gateway/security) を参照してください。

    詳細: [Models](/concepts/models)。

  </Accordion>

  <Accordion title="configを消さずにmodelを切り替えるには？">
    **model command** を使うか、**model** フィールドだけを編集してください。config全置換は避けてください。

    安全な方法:

    - chat内で `/model`（素早い、session単位）
    - `openclaw models set ...`（model設定だけ更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    config全体を置き換える意図がない限り、部分オブジェクトでの `config.apply` は避けてください。
    RPC編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup payloadは正規化されたpath、浅いschema docs/constraints、直下のchild summariesを返します。
    部分更新用です。
    もしconfigを上書きしてしまったら、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [Models](/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/gateway/doctor)。

  </Accordion>

  <Accordion title="self-hosted models（llama.cpp, vLLM, Ollama）は使えますか？">
    はい。local modelsにはOllamaが最も簡単です。

    最も手早いセットアップ:

    1. `https://ollama.com/download` からOllamaをインストールする
    2. `ollama pull glm-4.7-flash` のようなlocal modelをpullする
    3. cloud modelsも使いたい場合は `ollama signin` を実行する
    4. `openclaw onboard` を実行して `Ollama` を選ぶ
    5. `Local` または `Cloud + Local` を選ぶ

    注:

    - `Cloud + Local` ではcloud modelsとlocal Ollama modelsの両方を使えます
    - `kimi-k2.5:cloud` のようなcloud modelsにはlocal pullは不要です
    - 手動切り替えには `openclaw models list` と `openclaw models set ollama/<model>` を使ってください

    セキュリティ注: 小さいまたは大きく量子化されたmodelはprompt
    injectionに対して脆弱です。toolを使えるbotには
    **大きなmodel** を強く推奨します。
    それでも小さいmodelを使いたい場合は、sandboxingと厳格なtool allowlistを有効にしてください。

    ドキュメント: [Ollama](/providers/ollama), [Local models](/gateway/local-models),
    [Model providers](/concepts/model-providers), [Security](/gateway/security),
    [Sandboxing](/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krillでは何のmodelを使っていますか？">
    - これらのdeploymentは異なる場合があり、時間とともに変わることがあります。固定のprovider推奨はありません。
    - 各gatewayの現在のruntime設定は `openclaw models status` で確認してください。
    - security-sensitive/tool有効agentには、利用可能な最新世代で最も強いmodelを使ってください。
  </Accordion>

  <Accordion title="再起動せずにその場でmodelを切り替えるには？">
    `/model` コマンドを単独messageとして使ってください:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    これらは組み込みaliasです。custom aliasは `agents.defaults.models` 経由で追加できます。

    利用可能なmodelsは `/model`, `/model list`, `/model status` で一覧できます。

    `/model`（および `/model list`）は、コンパクトな番号付きpickerを表示します。番号で選択できます:

    ```
    /model 3
    ```

    provider用に特定のauth profileを強制することもできます（session単位）:

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` では、どのagentがアクティブか、どの `auth-profiles.json` fileが使われているか、次にどのauth profileが試されるかを表示します。
    利用可能な場合は、configured provider endpoint（`baseUrl`）とAPI mode（`api`）も表示します。

    **@profile で設定したprofile pinを外すには？**

    `@