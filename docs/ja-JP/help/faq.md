---
read_when:
    - 一般的なセットアップ、インストール、オンボーディング、またはランタイムのサポートに関する質問への回答
    - より詳細なデバッグの前に、ユーザーから報告された問題をトリアージすること
summary: OpenClawのセットアップ、設定、使用法に関するよくある質問
title: よくある質問
x-i18n:
    generated_at: "2026-04-20T04:46:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bdb17fc4d8c61a36f3a9fc3ca4a20f723cfa6c9bbbc92f963d6e313181f3451
    source_path: help/faq.md
    workflow: 15
---

# よくある質問

実際のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/APIキー、モデルフェイルオーバー）向けの簡潔な回答と、より詳しいトラブルシューティングです。ランタイム診断については、[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。完全な設定リファレンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 何かが壊れているときの最初の60秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   高速なローカル要約: OS + アップデート、Gateway/サービス到達可能性、エージェント/セッション、プロバイダー設定 + ランタイム問題（Gatewayに到達可能な場合）。

2. **共有しやすいレポート（安全に共有可能）**

   ```bash
   openclaw status --all
   ```

   ログ末尾付きの読み取り専用診断（トークンは秘匿化）。

3. **デーモン + ポートの状態**

   ```bash
   openclaw gateway status
   ```

   スーパーバイザーのランタイムとRPC到達可能性、プローブ対象URL、このサービスがおそらく使用した設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   サポートされている場合はチャネルプローブを含む、ライブGatewayヘルスプローブを実行します
   （到達可能なGatewayが必要です）。[Health](/ja-JP/gateway/health)を参照してください。

5. **最新ログを追跡**

   ```bash
   openclaw logs --follow
   ```

   RPCが停止している場合は、代わりに次を使用します:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[Logging](/ja-JP/logging)と[トラブルシューティング](/ja-JP/gateway/troubleshooting)を参照してください。

6. **doctorを実行（修復）**

   ```bash
   openclaw doctor
   ```

   設定/状態を修復・移行し、ヘルスチェックを実行します。[Doctor](/ja-JP/gateway/doctor)を参照してください。

7. **Gatewayスナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象URL + 設定パスを表示
   ```

   実行中のGatewayに完全なスナップショットを要求します（WSのみ）。[Health](/ja-JP/gateway/health)を参照してください。

## クイックスタートと初回セットアップ

<AccordionGroup>
  <Accordion title="行き詰まりました。最速で抜け出す方法は？">
    **あなたのマシンを見られる**ローカルAIエージェントを使ってください。これはDiscordで尋ねるよりはるかに効果的です。というのも、「行き詰まった」というケースの大半は、リモートの支援者には確認できない**ローカル設定や環境の問題**だからです。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    これらのツールは、リポジトリの読み取り、コマンド実行、ログ確認、そしてマシンレベルの
    セットアップ（PATH、サービス、権限、認証ファイル）の修正支援ができます。ハッカブルな（git）
    インストールを使って、**完全なソースチェックアウト**を渡してください:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これはgitチェックアウト**から**OpenClawをインストールするため、エージェントがコード + ドキュメントを読み、
    実行中の正確なバージョンについて推論できます。後でいつでも `--install-method git` なしで
    インストーラーを再実行すれば、stableに戻せます。

    ヒント: エージェントには、まず修正を**計画して監督**させ（段階的に）、その後で必要なコマンドだけを実行させてください。そうすることで変更が小さくなり、監査もしやすくなります。

    実際のバグや修正を見つけた場合は、GitHub issueを作成するかPRを送ってください:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    まずは次のコマンドから始めてください（助けを求めるときは出力を共有してください）:

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    これらが行うこと:

    - `openclaw status`: Gateway/エージェントの健全性 + 基本設定のクイックスナップショット。
    - `openclaw models status`: プロバイダー認証 + モデル可用性を確認します。
    - `openclaw doctor`: 一般的な設定/状態の問題を検証して修復します。

    そのほかに有用なCLIチェック: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`。

    クイックデバッグループ: [何かが壊れているときの最初の60秒](#何かが壊れているときの最初の60秒)。
    インストールドキュメント: [Install](/ja-JP/install), [Installer flags](/ja-JP/install/installer), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="Heartbeatがスキップされ続けます。スキップ理由は何を意味しますか？">
    一般的なHeartbeatのスキップ理由:

    - `quiet-hours`: 設定された active-hours の時間帯外
    - `empty-heartbeat-file`: `HEARTBEAT.md` は存在するが、空白またはヘッダーだけの足場しか含まれていない
    - `no-tasks-due`: `HEARTBEAT.md` のタスクモードが有効だが、どのタスク間隔もまだ期限に達していない
    - `alerts-disabled`: Heartbeatの表示がすべて無効（`showOk`、`showAlerts`、`useIndicator` がすべてオフ）

    タスクモードでは、期限タイムスタンプは実際のHeartbeat実行が
    完了した後にのみ進められます。スキップされた実行では、タスクは完了として記録されません。

    ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat), [Automation & Tasks](/ja-JP/automation)。

  </Accordion>

  <Accordion title="OpenClawをインストールしてセットアップする推奨方法は？">
    このリポジトリでは、ソースから実行してオンボーディングを使うことを推奨しています:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ウィザードはUIアセットも自動でビルドできます。オンボーディング後は、通常 **18789** 番ポートでGatewayを実行します。

    ソースから（コントリビューター/開発者向け）:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    まだグローバルインストールがない場合は、`pnpm openclaw onboard` で実行してください。

  </Accordion>

  <Accordion title="オンボーディング後にダッシュボードを開くにはどうすればよいですか？">
    ウィザードはオンボーディング直後にクリーンな（トークン化されていない）ダッシュボードURLでブラウザーを開き、概要にもそのリンクを表示します。そのタブは開いたままにしてください。起動しなかった場合は、同じマシンで表示されたURLをコピー&ペーストしてください。
  </Accordion>

  <Accordion title="localhostとリモートで、ダッシュボードの認証はどう違いますか？">
    **Localhost（同じマシン）:**

    - `http://127.0.0.1:18789/` を開きます。
    - 共有シークレット認証を求められた場合は、設定されたトークンまたはパスワードをControl UI設定に貼り付けます。
    - トークンの取得元: `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）。
    - パスワードの取得元: `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）。
    - 共有シークレットがまだ設定されていない場合は、`openclaw doctor --generate-gateway-token` でトークンを生成します。

    **localhostではない場合:**

    - **Tailscale Serve**（推奨）: bind loopback のままにして、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` の場合、IDヘッダーがControl UI/WebSocket認証を満たします（共有シークレットを貼り付ける必要はなく、信頼されたGatewayホストを前提とします）。HTTP APIでは、private-ingress の `none` または trusted-proxy HTTP auth を意図的に使わない限り、引き続き共有シークレット認証が必要です。
      同一クライアントからの不正な同時Serve認証試行は、失敗認証リミッターが記録する前に直列化されるため、2回目の不正リトライではすでに `retry later` が表示されることがあります。
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行する（またはパスワード認証を設定する）と、`http://<tailscale-ip>:18789/` を開けるようになり、その後ダッシュボード設定に一致する共有シークレットを貼り付けます。
    - **ID認識型リバースプロキシ**: Gatewayを非loopbackのtrusted proxyの背後に置いたままにし、`gateway.auth.mode: "trusted-proxy"` を設定してから、プロキシURLを開きます。
    - **SSHトンネル**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行し、その後 `http://127.0.0.1:18789/` を開きます。トンネル経由でも共有シークレット認証は適用されます。求められたら、設定済みのトークンまたはパスワードを貼り付けてください。

    bindモードと認証の詳細については、[Dashboard](/web/dashboard) と [Web surfaces](/web) を参照してください。

  </Accordion>

  <Accordion title="チャット承認用にexec approval設定が2つあるのはなぜですか？">
    それぞれ異なるレイヤーを制御しています:

    - `approvals.exec`: 承認プロンプトをチャット送信先に転送する
    - `channels.<channel>.execApprovals`: そのチャネルをexec approvals用のネイティブ承認クライアントとして動作させる

    ホストのexecポリシーが、実際の承認ゲートであることに変わりはありません。チャット設定は、承認
    プロンプトをどこに表示するか、そしてユーザーがどう応答できるかを制御するだけです。

    ほとんどのセットアップでは、**両方は必要ありません**:

    - そのチャットがすでにコマンドと返信をサポートしていれば、同じチャット内の `/approve` は共有パス経由で動作します。
    - サポートされたネイティブチャネルが承認者を安全に推定できる場合、OpenClawは `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` のとき、DM優先のネイティブ承認を自動有効化します。
    - ネイティブ承認カード/ボタンが使えるときは、そのネイティブUIが主要な経路です。ツール結果がチャット承認を利用できない、または手動承認のみが唯一の経路であると示した場合にのみ、エージェントは手動の `/approve` コマンドを含めるべきです。
    - `approvals.exec` は、プロンプトを他のチャットや明示的なopsルームにも転送する必要がある場合にのみ使用してください。
    - `channels.<channel>.execApprovals.target: "channel"` または `"both"` は、承認プロンプトを発生元のルーム/トピックに明示的に投稿し返したい場合にのみ使用してください。
    - Plugin approvals はさらに別です。デフォルトでは同じチャット内の `/approve` を使い、任意で `approvals.plugin` 転送を行い、一部のネイティブチャネルだけがその上にplugin approvalのネイティブ処理を維持します。

    要するに、転送はルーティング用、ネイティブクライアント設定はよりリッチなチャネル固有UX用です。
    [Exec Approvals](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>

  <Accordion title="必要なランタイムは何ですか？">
    Node **>= 22** が必要です。`pnpm` を推奨します。Gatewayに Bun は**推奨されません**。
  </Accordion>

  <Accordion title="Raspberry Piで動作しますか？">
    はい。Gatewayは軽量です。ドキュメントでは個人利用に **512MB-1GB RAM**、**1コア**、約 **500MB**
    のディスクで十分とされており、**Raspberry Pi 4でも動作する**と明記されています。

    余裕（ログ、メディア、他のサービス）が欲しい場合は、**2GBを推奨**しますが、
    必須の最小値ではありません。

    ヒント: 小型のPi/VPSでGatewayをホストし、ノートPC/スマートフォン上の
    ローカル画面/カメラ/canvasやコマンド実行のために **nodes** をペアリングできます。[Nodes](/ja-JP/nodes)を参照してください。

  </Accordion>

  <Accordion title="Raspberry Piへのインストールのコツはありますか？">
    短く言うと、動作はしますが、多少の粗さは想定してください。

    - **64-bit** OSを使い、Node >= 22 を維持してください。
    - **ハッカブルな（git）インストール**を推奨します。ログ確認や高速な更新がしやすくなります。
    - channels/Skills なしで始めて、その後1つずつ追加してください。
    - 奇妙なバイナリ問題に遭遇した場合、たいていは **ARM互換性** の問題です。

    ドキュメント: [Linux](/ja-JP/platforms/linux), [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="「wake up my friend」で止まる / オンボーディングが hatch しません。どうすればいいですか？">
    この画面は、Gatewayに到達できて認証が通ることに依存しています。TUIは最初のhatch時に
    「Wake up, my friend!」も自動送信します。この行が表示されても**応答がなく**、
    トークンが0のままなら、エージェントは実行されていません。

    1. Gatewayを再起動します:

    ```bash
    openclaw gateway restart
    ```

    2. ステータス + 認証を確認します:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. まだ止まる場合は、次を実行します:

    ```bash
    openclaw doctor
    ```

    Gatewayがリモートにある場合は、トンネル/Tailscale接続が有効であり、UIが
    正しいGatewayを指していることを確認してください。[Remote access](/ja-JP/gateway/remote)を参照してください。

  </Accordion>

  <Accordion title="オンボーディングをやり直さずにセットアップを新しいマシン（Mac mini）へ移行できますか？">
    はい。**state directory** と **workspace** をコピーしてから、Doctorを一度実行してください。これにより
    **両方の**場所をコピーしている限り、botを「まったく同じ状態」（メモリ、セッション履歴、認証、チャネル
    状態）で維持できます:

    1. 新しいマシンにOpenClawをインストールします。
    2. 古いマシンから `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）をコピーします。
    3. workspace（デフォルト: `~/.openclaw/workspace`）をコピーします。
    4. `openclaw doctor` を実行し、Gatewayサービスを再起動します。

    これにより、設定、auth profiles、WhatsApp認証情報、セッション、メモリが保持されます。
    remote mode を使用している場合は、gateway host が session store と workspace を所有していることを
    忘れないでください。

    **重要:** workspace だけをGitHubにcommit/pushしている場合、バックアップしているのは
    **メモリ + bootstrapファイル** ですが、**セッション履歴や認証** は含まれません。これらは
    `~/.openclaw/` 配下にあります（たとえば `~/.openclaw/agents/<agentId>/sessions/`）。

    関連: [移行](/ja-JP/install/migrating), [ディスク上の保存場所](#where-things-live-on-disk),
    [Agent workspace](/ja-JP/concepts/agent-workspace), [Doctor](/ja-JP/gateway/doctor),
    [Remote mode](/ja-JP/gateway/remote).

  </Accordion>

  <Accordion title="最新バージョンの新機能はどこで確認できますか？">
    GitHub changelogを確認してください:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新の項目は先頭にあります。先頭セクションが **Unreleased** と表示されている場合、
    次の日付付きセクションが最新のリリース済みバージョンです。項目は **Highlights**、**Changes**、および
    **Fixes** ごとにグループ化されています（必要に応じて docs/その他のセクションもあります）。

  </Accordion>

  <Accordion title="docs.openclaw.ai にアクセスできません（SSLエラー）">
    一部のComcast/Xfinity接続では、Xfinity
    Advanced Security によって `docs.openclaw.ai` が誤ってブロックされます。これを無効化するか、`docs.openclaw.ai` を許可リストに追加してから再試行してください。
    次の場所から報告して、ブロック解除にご協力ください: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    それでもサイトにアクセスできない場合、ドキュメントはGitHubにもミラーされています:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable と beta の違いは何ですか？">
    **Stable** と **beta** は別々のコードラインではなく、**npm dist-tags** です:

    - `latest` = stable
    - `beta` = テスト用の先行ビルド

    通常、stableリリースはまず **beta** に入り、その後、明示的な
    昇格ステップによって同じバージョンが `latest` に移されます。メンテナーは必要に応じて
    直接 `latest` に公開することもできます。そのため、昇格後にはbetaとstableが
    **同じバージョン** を指すことがあります。

    変更内容はこちらで確認できます:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    インストール用ワンライナーと、betaとdevの違いについては、下のaccordionを参照してください。

  </Accordion>

  <Accordion title="beta版をインストールするには？ また、beta と dev の違いは何ですか？">
    **Beta** は npm dist-tag の `beta` です（昇格後は `latest` と同じ場合があります）。
    **Dev** は `main` の移動する先端（git）で、公開される場合は npm dist-tag の `dev` を使用します。

    ワンライナー（macOS/Linux）:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windowsインストーラー（PowerShell）:
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    詳細: [Development channels](/ja-JP/install/development-channels) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="最新のものを試すにはどうすればよいですか？">
    方法は2つあります:

    1. **Dev channel（git checkout）:**

    ```bash
    openclaw update --channel dev
    ```

    これにより `main` ブランチに切り替わり、ソースから更新されます。

    2. **ハッカブルなインストール（インストーラーサイトから）:**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    これにより、編集可能なローカルリポジトリが得られ、その後はgit経由で更新できます。

    手動でクリーンなcloneを行いたい場合は、次を使用してください:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    ドキュメント: [Update](/cli/update), [Development channels](/ja-JP/install/development-channels),
    [Install](/ja-JP/install)。

  </Accordion>

  <Accordion title="インストールとオンボーディングには通常どれくらいかかりますか？">
    おおよその目安:

    - **Install:** 2〜5分
    - **オンボーディング:** 設定するchannels/modelsの数に応じて5〜15分

    途中で止まる場合は、[Installer stuck](#quick-start-and-first-run-setup)
    と [I am stuck](#quick-start-and-first-run-setup) の高速デバッグループを使ってください。

  </Accordion>

  <Accordion title="インストーラーが止まりました。もっと詳しい情報を得るには？">
    **詳細出力** を付けてインストーラーを再実行してください:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose付きのbetaインストール:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    ハッカブルな（git）インストールの場合:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）での同等手順:

    ```powershell
    # install.ps1 にはまだ専用の -Verbose フラグはありません。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    その他のオプション: [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="Windowsでのインストールで git not found または openclaw not recognized と表示されます">
    Windowsでよくある問題は2つあります:

    **1) npm error spawn git / git not found**

    - **Git for Windows** をインストールし、`git` がPATHにあることを確認してください。
    - PowerShellを閉じて再度開いてから、インストーラーを再実行してください。

    **2) インストール後に openclaw is not recognized と表示される**

    - npmのグローバルbinフォルダーがPATHにありません。
    - パスを確認してください:

      ```powershell
      npm config get prefix
      ```

    - そのディレクトリをユーザーPATHに追加してください（Windowsでは `\bin` 接尾辞は不要です。多くのシステムでは `%AppData%\npm` です）。
    - PATH更新後はPowerShellを閉じて再度開いてください。

    Windowsで最もスムーズにセットアップしたい場合は、ネイティブWindowsではなく **WSL2** を使用してください。
    ドキュメント: [Windows](/ja-JP/platforms/windows)。

  </Accordion>

  <Accordion title="Windowsのexec出力で中国語テキストが文字化けします。どうすればよいですか？">
    これは通常、ネイティブWindowsシェルでのコンソールコードページ不一致が原因です。

    症状:

    - `system.run`/`exec` の出力で中国語が文字化けする
    - 同じコマンドが別のターミナルプロファイルでは正常に見える

    PowerShellでの一時的な回避策:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    その後、Gatewayを再起動してコマンドを再試行してください:

    ```powershell
    openclaw gateway restart
    ```

    最新のOpenClawでも引き続き再現する場合は、次で追跡・報告してください:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="ドキュメントでは疑問が解決しませんでした。より良い回答を得るにはどうすればよいですか？">
    **ハッカブルな（git）インストール** を使ってソースとドキュメント一式をローカルに置き、そのフォルダーから
    bot（または Claude/Codex）に質問してください。そうすればリポジトリを読んで正確に答えられます。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    詳細: [Install](/ja-JP/install) と [Installer flags](/ja-JP/install/installer)。

  </Accordion>

  <Accordion title="LinuxにOpenClawをインストールするには？">
    短い答え: Linuxガイドに従ってから、オンボーディングを実行してください。

    - Linuxのクイックパス + サービスインストール: [Linux](/ja-JP/platforms/linux)。
    - 完全な手順: [はじめに](/ja-JP/start/getting-started)。
    - インストーラー + アップデート: [Install & updates](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="VPSにOpenClawをインストールするには？">
    どのLinux VPSでも動作します。サーバーにインストールし、その後SSH/TailscaleでGatewayにアクセスしてください。

    ガイド: [exe.dev](/ja-JP/install/exe-dev), [Hetzner](/ja-JP/install/hetzner), [Fly.io](/ja-JP/install/fly)。
    リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title="クラウド/VPSのインストールガイドはどこにありますか？">
    一般的なプロバイダーをまとめた **hosting hub** があります。1つ選んでガイドに従ってください:

    - [VPS hosting](/ja-JP/vps)（すべてのプロバイダーを1か所に集約）
    - [Fly.io](/ja-JP/install/fly)
    - [Hetzner](/ja-JP/install/hetzner)
    - [exe.dev](/ja-JP/install/exe-dev)

    クラウドでの動作方法: **Gatewayはサーバー上で実行** され、Control UI（またはTailscale/SSH）経由で
    ノートPC/スマートフォンからアクセスします。state + workspace はサーバー上に
    あるため、ホストを信頼できる唯一の情報源として扱い、バックアップしてください。

    そのクラウドGatewayに **nodes**（Mac/iOS/Android/headless）をペアリングして、
    Gatewayをクラウドに置いたまま、ローカル画面/カメラ/canvasへのアクセスや
    ノートPC上でのコマンド実行を行えます。

    ハブ: [Platforms](/ja-JP/platforms)。リモートアクセス: [Gateway remote](/ja-JP/gateway/remote)。
    Nodes: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="OpenClawに自分自身を更新させることはできますか？">
    短い答え: **可能ですが、推奨はしません**。更新フローによって
    Gatewayが再起動し（アクティブセッションが切断される）、クリーンなgit checkoutが必要になることがあり、
    確認プロンプトが出る場合もあります。より安全なのは、オペレーターとしてシェルから更新を実行することです。

    CLIを使用してください:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    どうしてもエージェントから自動化する必要がある場合:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    ドキュメント: [Update](/cli/update), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="オンボーディングは実際には何を行いますか？">
    `openclaw onboard` は推奨されるセットアップ手順です。**local mode** では、次の設定を案内します:

    - **モデル/認証設定**（プロバイダーOAuth、APIキー、Anthropic setup-token、および LM Studio などのローカルモデルオプション）
    - **Workspace** の場所 + bootstrapファイル
    - **Gateway設定**（bind/port/auth/tailscale）
    - **Channels**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage、および QQ Bot のようなバンドル済みchannel plugins）
    - **デーモンのインストール**（macOSではLaunchAgent、Linux/WSL2ではsystemd user unit）
    - **ヘルスチェック** と **Skills** の選択

    また、設定されたモデルが不明または認証不足の場合には警告します。

  </Accordion>

  <Accordion title="これを動かすにはClaudeまたはOpenAIのサブスクリプションが必要ですか？">
    いいえ。OpenClawは **APIキー**（Anthropic/OpenAI/その他）または
    **ローカル専用モデル** で実行できるため、データをデバイス上に保持できます。サブスクリプション（Claude
    Pro/Max または OpenAI Codex）は、それらのプロバイダーを認証する任意の方法です。

    OpenClawでのAnthropicについて、実用上の区分は次のとおりです:

    - **Anthropic APIキー**: 通常のAnthropic API課金
    - **OpenClawでのClaude CLI / Claudeサブスクリプション認証**: Anthropicのスタッフから、
      この利用法は再び許可されていると伝えられており、Anthropicが新しい
      ポリシーを公開しない限り、OpenClawではこの統合に対する `claude -p`
      の使用を公認されたものとして扱っています

    長期間稼働するgateway hostでは、Anthropic APIキーの方が依然として
    より予測しやすいセットアップです。OpenAI Codex OAuthは、OpenClawのような外部
    ツール向けに明示的にサポートされています。

    OpenClawはそのほかにも、次のようなホスト型サブスクリプション形式の選択肢をサポートしています:
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan**、および
    **Z.AI / GLM Coding Plan**。

    ドキュメント: [Anthropic](/ja-JP/providers/anthropic), [OpenAI](/ja-JP/providers/openai),
    [Qwen Cloud](/ja-JP/providers/qwen),
    [MiniMax](/ja-JP/providers/minimax), [GLM Models](/ja-JP/providers/glm),
    [ローカルモデル](/ja-JP/gateway/local-models), [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="APIキーなしでClaude Maxサブスクリプションを使えますか？">
    はい。

    Anthropicのスタッフから、OpenClawスタイルのClaude CLI利用は再び許可されていると伝えられているため、
    Anthropicが新しいポリシーを公開しない限り、OpenClawではClaudeサブスクリプション認証と
    `claude -p` の使用をこの統合において公認されたものとして扱っています。最も予測しやすい
    サーバー側セットアップを求める場合は、代わりにAnthropic APIキーを使用してください。

  </Accordion>

  <Accordion title="Claudeサブスクリプション認証（Claude Pro または Max）をサポートしていますか？">
    はい。

    Anthropicのスタッフから、この利用法は再び許可されていると伝えられているため、OpenClawでは
    Anthropicが新しいポリシーを公開しない限り、この統合におけるClaude CLIの再利用と
    `claude -p` の使用を公認されたものとして扱っています。

    Anthropic setup-token は引き続きサポートされるOpenClawのトークン経路として利用可能ですが、OpenClawは現在、利用可能な場合はClaude CLIの再利用と `claude -p` を優先します。
    本番環境またはマルチユーザーのワークロードでは、Anthropic APIキー認証の方が依然として
    より安全で予測しやすい選択です。OpenClawでそのほかのサブスクリプション形式のホスト型
    オプションを使いたい場合は、[OpenAI](/ja-JP/providers/openai)、[Qwen / Model
    Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、および [GLM
    Models](/ja-JP/providers/glm) を参照してください。

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropicから HTTP 429 rate_limit_error が表示されるのはなぜですか？">
これは、現在のウィンドウにおける **Anthropicのクォータ/レート制限** を使い切ったことを意味します。**Claude CLI** を
使用している場合は、ウィンドウがリセットされるまで待つか、プランをアップグレードしてください。**Anthropic APIキー** を
使用している場合は、Anthropic Console で
使用状況/課金を確認し、必要に応じて制限を引き上げてください。

    メッセージが具体的に次の場合:
    `Extra usage is required for long context requests`、そのリクエストは
    Anthropicの1Mコンテキストベータ（`context1m: true`）を使おうとしています。これは、
    使用中の認証情報が長いコンテキスト課金に対応している場合にのみ機能します（APIキー課金、または
    Extra Usage が有効なOpenClawのClaudeログイン経路）。

    ヒント: **フォールバックモデル** を設定しておくと、プロバイダーがレート制限中でもOpenClawが
    応答を続けられます。[Models](/cli/models)、[OAuth](/ja-JP/concepts/oauth)、および
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ja-JP/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

  </Accordion>

  <Accordion title="AWS Bedrockはサポートされていますか？">
    はい。OpenClawにはバンドル済みの **Amazon Bedrock (Converse)** プロバイダーがあります。AWS env markers が存在する場合、OpenClawはストリーミング/テキストのBedrockカタログを自動検出し、暗黙的な `amazon-bedrock` プロバイダーとしてマージできます。それ以外の場合は、`plugins.entries.amazon-bedrock.config.discovery.enabled` を明示的に有効化するか、手動のプロバイダーエントリーを追加できます。[Amazon Bedrock](/ja-JP/providers/bedrock) と [Model providers](/ja-JP/providers/models) を参照してください。マネージドキーのフローを望む場合は、Bedrockの前段にOpenAI互換プロキシを置く方法も引き続き有効です。
  </Accordion>

  <Accordion title="Codex認証はどのように動作しますか？">
    OpenClawは、OAuth（ChatGPTサインイン）経由で **OpenAI Code (Codex)** をサポートしています。オンボーディングではOAuthフローを実行でき、適切な場合はデフォルトモデルを `openai-codex/gpt-5.4` に設定します。[Model providers](/ja-JP/concepts/model-providers) と [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
  </Accordion>

  <Accordion title="ChatGPT GPT-5.4 で openclaw/gpt-5.4 ではなく openai/gpt-5.4 が使えるようにならないのはなぜですか？">
    OpenClawでは、この2つの経路を別々に扱います:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = 直接のOpenAI Platform API

    OpenClawでは、ChatGPT/Codexサインインは `openai-codex/*` 経路に接続されており、
    直接の `openai/*` 経路には接続されていません。OpenClawで直接API経路を使いたい場合は、
    `OPENAI_API_KEY`（または同等のOpenAIプロバイダー設定）を設定してください。
    OpenClawでChatGPT/Codexサインインを使いたい場合は、`openai-codex/*` を使ってください。

  </Accordion>

  <Accordion title="Codex OAuthの制限がChatGPT Webと異なることがあるのはなぜですか？">
    `openai-codex/*` はCodex OAuth経路を使用しており、利用可能なクォータウィンドウは
    OpenAI側で管理され、プランにも依存します。実際には、両方が同じアカウントに紐づいていても、
    それらの制限はChatGPTのWebサイト/アプリでの体験と異なることがあります。

    OpenClawは `openclaw models status` で、現在見えているプロバイダーの使用状況/クォータウィンドウを表示できますが、
    ChatGPT Webの権限を直接APIアクセスへと捏造または正規化することはありません。直接のOpenAI Platform
    の課金/制限経路を使いたい場合は、APIキー付きの `openai/*` を使用してください。

  </Accordion>

  <Accordion title="OpenAIサブスクリプション認証（Codex OAuth）をサポートしていますか？">
    はい。OpenClawは **OpenAI Code (Codex) subscription OAuth** を完全にサポートしています。
    OpenAIは、OpenClawのような外部ツール/ワークフローでのサブスクリプションOAuth利用を
    明示的に許可しています。オンボーディングでOAuthフローを実行できます。

    [OAuth](/ja-JP/concepts/oauth)、[Model providers](/ja-JP/concepts/model-providers)、および [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

  </Accordion>

  <Accordion title="Gemini CLI OAuthはどう設定すればよいですか？">
    Gemini CLIは、`openclaw.json` 内のclient idやsecretではなく、**plugin auth flow** を使用します。

    手順:

    1. `gemini` が `PATH` に入るようにGemini CLIをローカルにインストールする
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Pluginを有効化する: `openclaw plugins enable google`
    3. ログインする: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. ログイン後のデフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
    5. リクエストが失敗する場合は、gateway host で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定する

    これにより、OAuthトークンはgateway host 上のauth profilesに保存されます。詳細: [Model providers](/ja-JP/concepts/model-providers)。

  </Accordion>

  <Accordion title="気軽なチャット用途ならローカルモデルでも大丈夫ですか？">
    通常はいいえ。OpenClawには大きなコンテキストと強い安全性が必要であり、小さなカードでは切り詰めや漏洩が起こります。どうしても使う必要がある場合は、ローカルで実行できる**最大の**モデルビルド（LM Studio）を使い、[/gateway/local-models](/ja-JP/gateway/local-models) を参照してください。より小さい/量子化されたモデルはプロンプトインジェクションのリスクを高めます。詳しくは [Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="ホスト型モデルのトラフィックを特定のリージョンに維持するにはどうすればよいですか？">
    リージョン固定のエンドポイントを選んでください。OpenRouterはMiniMax、Kimi、GLM向けにUSホストのオプションを提供しているため、データをそのリージョン内に保つにはUSホスト版を選択してください。それでも `models.mode: "merge"` を使えばAnthropic/OpenAIを併記できるため、選択したリージョン固定プロバイダーを尊重しながらフォールバックも利用できます。
  </Accordion>

  <Accordion title="これをインストールするにはMac Miniを買う必要がありますか？">
    いいえ。OpenClawはmacOSまたはLinuxで動作します（WindowsはWSL2経由）。Mac miniは任意です。一部の人は常時稼働ホストとして
    購入しますが、小型VPS、ホームサーバー、またはRaspberry Piクラスのマシンでも動作します。

    Macが必要なのは **macOS専用ツール** の場合だけです。iMessageには [BlueBubbles](/ja-JP/channels/bluebubbles)（推奨）を使用してください。BlueBubblesサーバーは任意のMac上で動作し、GatewayはLinuxやその他の場所で動かせます。ほかのmacOS専用ツールを使いたい場合は、GatewayをMac上で動かすか、macOS node をペアリングしてください。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/ja-JP/nodes), [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessageサポートにはMac miniが必要ですか？">
    Messagesにサインインした **何らかのmacOSデバイス** が必要です。**Mac miniである必要はありません**。
    iMessageには **[BlueBubbles](/ja-JP/channels/bluebubbles)**（推奨）を使用してください。BlueBubblesサーバーはmacOS上で動作し、GatewayはLinuxやその他の場所で動かせます。

    一般的なセットアップ:

    - GatewayはLinux/VPS上で実行し、BlueBubblesサーバーはMessagesにサインインした任意のMac上で実行する。
    - 最もシンプルな単一マシン構成にしたい場合は、すべてをMac上で実行する。

    ドキュメント: [BlueBubbles](/ja-JP/channels/bluebubbles), [Nodes](/ja-JP/nodes),
    [Mac remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="OpenClawを動かすためにMac miniを買った場合、MacBook Proに接続できますか？">
    はい。**Mac miniでGatewayを実行** し、MacBook Proを
    **node**（コンパニオンデバイス）として接続できます。NodesはGatewayを実行しません。代わりに、そのデバイス上の
    画面/カメラ/canvas や `system.run` のような追加機能を提供します。

    一般的なパターン:

    - GatewayはMac mini上（常時稼働）。
    - MacBook ProはmacOSアプリまたはnode hostを実行し、Gatewayとペアリングする。
    - 確認には `openclaw nodes status` / `openclaw nodes list` を使う。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes)。

  </Accordion>

  <Accordion title="Bunは使えますか？">
    Bunは**推奨されません**。特にWhatsAppとTelegramでランタイムバグが見られます。
    安定したGatewayには **Node** を使用してください。

    それでもBunを試したい場合は、WhatsApp/Telegramなしの非本番Gatewayで
    試してください。

  </Accordion>

  <Accordion title="Telegram: allowFrom には何を入れればよいですか？">
    `channels.telegram.allowFrom` は、**人間の送信者のTelegramユーザーID**（数値）です。botのユーザー名ではありません。

    セットアップでは数値のユーザーIDのみを受け付けます。設定に古い `@username` エントリーがすでにある場合は、`openclaw doctor --fix` で解決を試みることができます。

    より安全な方法（サードパーティbot不要）:

    - botにDMを送ってから、`openclaw logs --follow` を実行し、`from.id` を確認する。

    公式Bot API:

    - botにDMを送ってから、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び出し、`message.from.id` を確認する。

    サードパーティ（プライバシーはやや低い）:

    - `@userinfobot` または `@getidsbot` にDMする。

    [/channels/telegram](/ja-JP/channels/telegram#access-control-and-activation) を参照してください。

  </Accordion>

  <Accordion title="複数の人が1つのWhatsApp番号を、それぞれ別のOpenClawインスタンスで使えますか？">
    はい。**multi-agent routing** で可能です。各送信者のWhatsApp **DM**（peer `kind: "direct"`、送信者E.164 形式の `+15551234567` など）を別々の `agentId` にバインドすれば、各人が自分専用のworkspaceとsession storeを持てます。返信は引き続き**同じWhatsAppアカウント**から送られ、DMアクセス制御（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）はWhatsAppアカウントごとにグローバルです。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) と [WhatsApp](/ja-JP/channels/whatsapp) を参照してください。
  </Accordion>

  <Accordion title='「高速チャット」エージェントと「コーディング用Opus」エージェントを動かせますか？'>
    はい。multi-agent routing を使ってください。各エージェントに独自のデフォルトモデルを割り当て、その後、各エージェントに受信ルート（プロバイダーアカウントまたは特定のpeer）をバインドします。設定例は [Multi-Agent Routing](/ja-JP/concepts/multi-agent) にあります。あわせて [Models](/ja-JP/concepts/models) と [Configuration](/ja-JP/gateway/configuration) も参照してください。
  </Accordion>

  <Accordion title="HomebrewはLinuxでも動きますか？">
    はい。HomebrewはLinux（Linuxbrew）をサポートしています。クイックセットアップ:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClawをsystemd経由で実行する場合は、サービスのPATHに `/home/linuxbrew/.linuxbrew/bin`（またはあなたのbrew prefix）を含めて、非ログインシェルでも `brew` でインストールしたツールが解決されるようにしてください。
    最近のビルドでは、Linuxのsystemdサービスで一般的なユーザーbinディレクトリ（たとえば `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`）も先頭に追加され、`PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`、`FNM_DIR` が設定されている場合はそれらも尊重されます。

  </Accordion>

  <Accordion title="ハッカブルなgitインストールと npm install の違いは何ですか？">
    - **ハッカブルな（git）インストール:** フルソースチェックアウトで、編集可能、コントリビューターに最適です。
      ローカルでビルドを実行でき、コード/ドキュメントにパッチを当てられます。
    - **npm install:** グローバルCLIインストールで、リポジトリは含まれず、「とにかく動かしたい」場合に最適です。
      更新はnpm dist-tagsから取得されます。

    ドキュメント: [はじめに](/ja-JP/start/getting-started), [Updating](/ja-JP/install/updating)。

  </Accordion>

  <Accordion title="後から npm インストールと git インストールを切り替えられますか？">
    はい。もう一方の方式をインストールしてから、gateway service が新しいentrypointを指すようにDoctorを実行してください。
    これは**データを削除しません**。変更されるのはOpenClawコードのインストールだけです。state
    （`~/.openclaw`）とworkspace（`~/.openclaw/workspace`）はそのまま残ります。

    npm から git へ:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git から npm へ:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor は gateway service のentrypoint不一致を検出し、現在のインストールに一致するようにservice設定を書き換えることを提案します（自動化では `--repair` を使用してください）。

    バックアップのヒント: [バックアップ戦略](#where-things-live-on-disk) を参照してください。

  </Accordion>

  <Accordion title="Gateway はノートPCで動かすべきですか、それとも VPS ですか？">
    短い答え: **24時間365日の信頼性が欲しいなら、VPS を使ってください**。最小の手間を優先し、スリープや再起動を許容できるなら、ローカルで実行してください。

    **ノートPC（local Gateway）**

    - **利点:** サーバー費用なし、ローカルファイルへ直接アクセスできる、ブラウザーウィンドウを表示したまま使える。
    - **欠点:** スリープ/ネットワーク切断 = 接続断、OS更新/再起動で中断、起動したままにしておく必要がある。

    **VPS / クラウド**

    - **利点:** 常時稼働、安定したネットワーク、ノートPCのスリープ問題がない、動かし続けやすい。
    - **欠点:** 多くの場合 headless で動作する（スクリーンショットを使う）、ファイルアクセスはリモートのみ、更新には SSH が必要。

    **OpenClaw固有の注意:** WhatsApp/Telegram/Slack/Mattermost/Discord はどれも VPS から問題なく動作します。実際のトレードオフは **headless browser** か表示付きウィンドウか、という点だけです。[Browser](/ja-JP/tools/browser) を参照してください。

    **推奨されるデフォルト:** 以前に gateway の切断があったなら VPS。Mac をアクティブに使っていて、ローカルファイルアクセスや表示付きブラウザーでのUI自動化が欲しい場合はローカルが最適です。

  </Accordion>

  <Accordion title="OpenClaw を専用マシンで実行することはどれくらい重要ですか？">
    必須ではありませんが、**信頼性と分離性のために推奨** します。

    - **専用ホスト（VPS/Mac mini/Pi）:** 常時稼働、スリープ/再起動による中断が少ない、権限が整理しやすい、動かし続けやすい。
    - **共用ノートPC/デスクトップ:** テストやアクティブ利用にはまったく問題ありませんが、マシンのスリープや更新で一時停止が起こることは想定してください。

    両方の利点を得たい場合は、Gateway は専用ホストに置き、ローカル画面/カメラ/exec ツール用にノートPCを **node** としてペアリングしてください。[Nodes](/ja-JP/nodes) を参照してください。
    セキュリティガイダンスについては、[Security](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="最小限の VPS 要件と推奨 OS は何ですか？">
    OpenClaw は軽量です。基本的な Gateway + 1つのチャットチャネルなら:

    - **絶対最小:** 1 vCPU、1GB RAM、約500MBのディスク。
    - **推奨:** 1〜2 vCPU、2GB RAM 以上の余裕（ログ、メディア、複数チャネル用）。Node ツールやブラウザー自動化はリソースを多く消費することがあります。

    OS: **Ubuntu LTS**（または最新の Debian/Ubuntu 系）を使用してください。Linux のインストール経路ではこれが最もよく検証されています。

    ドキュメント: [Linux](/ja-JP/platforms/linux), [VPS hosting](/ja-JP/vps)。

  </Accordion>

  <Accordion title="VM で OpenClaw を実行できますか？また要件は何ですか？">
    はい。VM は VPS と同じように扱ってください。常時稼働し、到達可能で、Gateway と有効化するチャネルに十分な
    RAM が必要です。

    基本的な目安:

    - **絶対最小:** 1 vCPU、1GB RAM。
    - **推奨:** 複数チャネル、ブラウザー自動化、またはメディアツールを実行するなら 2GB RAM 以上。
    - **OS:** Ubuntu LTS または他の最新の Debian/Ubuntu。

    Windows の場合、**WSL2 が最も簡単なVM風セットアップ** で、ツール互換性も最も高いです。[Windows](/ja-JP/platforms/windows), [VPS hosting](/ja-JP/vps) を参照してください。
    macOS を VM 上で実行している場合は、[macOS VM](/ja-JP/install/macos-vm) を参照してください。

  </Accordion>
</AccordionGroup>

## OpenClaw とは？

<AccordionGroup>
  <Accordion title="OpenClaw を1段落で説明すると？">
    OpenClaw は、あなた自身のデバイス上で実行する個人用AIアシスタントです。すでに使っているメッセージング画面（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat、および QQ Bot のようなバンドル済みchannel plugins）で応答し、サポート対象プラットフォームでは音声 + ライブ Canvas も利用できます。**Gateway** は常時稼働のコントロールプレーンであり、アシスタントこそが製品です。
  </Accordion>

  <Accordion title="価値提案">
    OpenClaw は「ただのClaudeラッパー」ではありません。**ローカルファーストのコントロールプレーン** であり、
    すでに使っているチャットアプリからアクセスできる高機能なアシスタントを、**自分のハードウェア上で** 実行でき、
    状態を持つセッション、メモリ、ツールを備えながら、ワークフローの主導権をホスト型
    SaaS に渡さずに済みます。

    特長:

    - **あなたのデバイス、あなたのデータ:** Gateway を好きな場所（Mac、Linux、VPS）で実行でき、
      workspace + セッション履歴をローカルに保持できます。
    - **Webサンドボックスではなく実際のチャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage など、
      加えてサポート対象プラットフォームではモバイル音声と Canvas。
    - **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを、エージェントごとのルーティング
      とフェイルオーバー付きで使用できます。
    - **ローカル専用オプション:** **すべてのデータをデバイス上に保持したまま** ローカルモデルを実行できます。
    - **multi-agent routing:** チャネル、アカウント、またはタスクごとにエージェントを分けられ、それぞれが独自の
      workspace とデフォルトを持ちます。
    - **オープンソースでハック可能:** ベンダーロックインなしで確認、拡張、セルフホストできます。

    ドキュメント: [Gateway](/ja-JP/gateway), [Channels](/ja-JP/channels), [Multi-agent](/ja-JP/concepts/multi-agent),
    [Memory](/ja-JP/concepts/memory)。

  </Accordion>

  <Accordion title="セットアップしたばかりです。最初に何をすべきですか？">
    最初のプロジェクトとしておすすめなのは次のようなものです:

    - Webサイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
    - モバイルアプリを試作する（概要、画面、API計画）。
    - ファイルとフォルダーを整理する（クリーンアップ、命名、タグ付け）。
    - Gmail を接続して、要約やフォローアップを自動化する。

    大きなタスクも扱えますが、フェーズに分割して
    sub agents を使って並列に進めると最も効果的です。

  </Accordion>

  <Accordion title="OpenClaw の日常的な上位5つのユースケースは何ですか？">
    日常的に効果が出やすい使い方は、たとえば次のようなものです:

    - **パーソナルブリーフィング:** 受信箱、カレンダー、気になるニュースの要約。
    - **調査と下書き:** 素早い調査、要約、メールやドキュメントの初稿作成。
    - **リマインダーとフォローアップ:** Cron や Heartbeat による通知やチェックリスト。
    - **ブラウザー自動化:** フォーム入力、データ収集、Webタスクの繰り返し実行。
    - **デバイス間連携:** スマートフォンからタスクを送り、Gateway にサーバー上で実行させ、結果をチャットで受け取る。

  </Accordion>

  <Accordion title="OpenClaw は SaaS 向けのリード獲得、営業活動、広告、ブログに役立ちますか？">
    **調査、選別、下書き** には有効です。サイトを巡回し、候補リストを作成し、
    見込み客を要約し、営業文面や広告コピーの下書きを作成できます。

    **営業活動や広告配信** については、人間を必ず関与させてください。スパムを避け、各地の法律や
    プラットフォームポリシーに従い、送信前に必ず確認してください。最も安全なパターンは、
    OpenClaw に下書きさせて、あなたが承認することです。

    ドキュメント: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="Web 開発において Claude Code と比べた利点は何ですか？">
    OpenClaw は **個人アシスタント** 兼オーケストレーション層であり、IDE の代替ではありません。リポジトリ内で最速の直接コーディングループが欲しいなら
    Claude Code または Codex を使ってください。耐久性のあるメモリ、デバイス横断アクセス、ツールオーケストレーションが
    欲しいときは OpenClaw を使ってください。

    利点:

    - セッションをまたいだ **永続メモリ + workspace**
    - **マルチプラットフォームアクセス**（WhatsApp、Telegram、TUI、WebChat）
    - **ツールオーケストレーション**（browser、files、scheduling、hooks）
    - **常時稼働の Gateway**（VPS 上で動かし、どこからでも操作可能）
    - ローカル browser/screen/camera/exec 用の **Nodes**

    紹介: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills と自動化

<AccordionGroup>
  <Accordion title="リポジトリを汚さずに Skills をカスタマイズするにはどうすればよいですか？">
    リポジトリ内のコピーを編集する代わりに、管理されたオーバーライドを使ってください。変更は `~/.openclaw/skills/<name>/SKILL.md` に置くか、`~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダーを追加します。優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → バンドル済み → `skills.load.extraDirs` なので、管理されたオーバーライドは git に触れずにバンドル済み Skills より優先されます。Skill をグローバルにインストールしつつ、一部のエージェントにだけ見せたい場合は、共有コピーを `~/.openclaw/skills` に置き、`agents.defaults.skills` と `agents.list[].skills` で可視性を制御してください。上流に送る価値のある変更だけをリポジトリに置き、PR として送ってください。
  </Accordion>

  <Accordion title="カスタムフォルダーから Skills を読み込めますか？">
    はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定できます（最も低い優先順位）。デフォルトの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → バンドル済み → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールされ、OpenClaw は次のセッションでこれを `<workspace>/skills` として扱います。Skill を特定のエージェントにだけ表示したい場合は、`agents.defaults.skills` または `agents.list[].skills` と組み合わせてください。
  </Accordion>

  <Accordion title="タスクごとに異なるモデルを使うにはどうすればよいですか？">
    現在サポートされているパターンは次のとおりです:

    - **Cron jobs**: 分離されたジョブごとに `model` オーバーライドを設定できます。
    - **Sub-agents**: 異なるデフォルトモデルを持つ別エージェントにタスクを振り分けます。
    - **オンデマンド切り替え**: `/model` を使って現在のセッションモデルをいつでも切り替えます。

    [Cron jobs](/ja-JP/automation/cron-jobs)、[Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="重い作業中にボットが固まります。どうやって負荷を逃がせますか？">
    長時間または並列のタスクには **sub-agents** を使ってください。sub-agents は独自のセッションで実行され、
    要約を返し、メインチャットの応答性を保ちます。

    bot に「このタスク用にsub-agentを起動して」と依頼するか、`/subagents` を使ってください。
    チャット内で `/status` を使うと、Gateway が今何をしているか（そして忙しいかどうか）を確認できます。

    トークンのヒント: 長いタスクも sub-agents もどちらもトークンを消費します。コストが気になる場合は、
    `agents.defaults.subagents.model` で sub-agents 用により安価なモデルを設定してください。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Background Tasks](/ja-JP/automation/tasks)。

  </Accordion>

  <Accordion title="Discord で thread に束縛された subagent session はどのように動作しますか？">
    thread bindings を使います。Discord thread を subagent または session target にバインドできるため、そのthread内の後続メッセージはそのバインドされたsession上に留まります。

    基本フロー:

    - `sessions_spawn` を `thread: true`（必要に応じて永続的なフォローアップ用に `mode: "session"` も）付きで実行して起動する。
    - または `/focus <target>` で手動バインドする。
    - `/agents` を使って binding の状態を確認する。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` を使って自動unfocusを制御する。
    - `/unfocus` を使って thread を切り離す。

    必要な設定:

    - グローバルデフォルト: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`。
    - Discord オーバーライド: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`。
    - spawn 時の自動バインド: `channels.discord.threadBindings.spawnSubagentSessions: true` を設定する。

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Discord](/ja-JP/channels/discord), [Configuration Reference](/ja-JP/gateway/configuration-reference), [Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="subagent が完了したのに、完了通知が間違った場所に送られた、または投稿されなかった場合は何を確認すべきですか？">
    まず解決済みの requester route を確認してください:

    - 完了モードのsubagent配信では、バインドされたthreadまたはconversation routeが存在する場合、それが優先されます。
    - 完了元がchannelしか持っていない場合、OpenClawは requester session に保存された route（`lastChannel` / `lastTo` / `lastAccountId`）にフォールバックするため、直接配信が引き続き成功する可能性があります。
    - バインドされたrouteも使用可能な保存済みrouteも存在しない場合、直接配信は失敗し得て、結果はチャットへ即時投稿される代わりに queued session delivery にフォールバックします。
    - 無効または古いtargetは、依然として queue fallback や最終配信失敗の原因になることがあります。
    - 子の最後に可視だったassistant replyが、正確にサイレントトークン `NO_REPLY` / `no_reply`、または正確に `ANNOUNCE_SKIP` だった場合、OpenClawは古い進捗を投稿しないように意図的に通知を抑制します。
    - 子がツール呼び出しだけでタイムアウトした場合、通知では生のツール出力をそのまま再生せず、短い部分進捗サマリーにまとめられることがあります。

    デバッグ:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Sub-agents](/ja-JP/tools/subagents), [Background Tasks](/ja-JP/automation/tasks), [Session Tools](/ja-JP/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron やリマインダーが発火しません。何を確認すべきですか？">
    Cron は Gateway process の内部で実行されます。Gateway が継続的に動作していない場合、
    スケジュールされたジョブは実行されません。

    チェックリスト:

    - cron が有効であること（`cron.enabled`）と、`OPENCLAW_SKIP_CRON` が設定されていないことを確認する。
    - Gateway が24時間365日動作していることを確認する（スリープ/再起動なし）。
    - ジョブのタイムゾーン設定（`--tz` とホストのタイムゾーン）を確認する。

    デバッグ:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation).

  </Accordion>

  <Accordion title="Cron は発火したのに、チャネルに何も送信されませんでした。なぜですか？">
    まず配信モードを確認してください:

    - `--no-deliver` / `delivery.mode: "none"` は、外部メッセージが送信されないことを意味します。
    - announce target（`channel` / `to`）が欠落しているか無効な場合、runner は送信配信をスキップします。
    - チャネル認証失敗（`unauthorized`, `Forbidden`）は、runner が配信を試みたものの認証情報によってブロックされたことを意味します。
    - サイレントな isolated result（`NO_REPLY` / `no_reply` のみ）は意図的に配信不可として扱われるため、runner は queued fallback delivery も抑制します。

    isolated cron jobs では、最終配信は runner が担います。agent は
    runner が送信できるプレーンテキストの要約を返すことが期待されます。`--no-deliver` は
    その結果を内部のまま保持します。message tool を使ってagentが直接送る
    ことを許可するものではありません。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Background Tasks](/ja-JP/automation/tasks).

  </Accordion>

  <Accordion title="isolated cron 実行がモデルを切り替えたり、一度リトライしたのはなぜですか？">
    それは通常、重複スケジューリングではなく live model-switch path です。

    isolated cron では、アクティブな実行が `LiveSessionModelSwitchError` を投げたときに、
    ランタイムのモデル引き継ぎを永続化してリトライできます。リトライでは切り替え後の
    provider/model が維持され、その切り替えに新しい auth profile override が含まれていた場合は、
    cron はそれも永続化してからリトライします。

    関連する選択ルール:

    - 該当する場合は、Gmail hook のモデルoverrideが最優先。
    - 次にジョブごとの `model`。
    - 次に保存済みの cron-session モデルoverride。
    - その後に通常の agent/default モデル選択。

    リトライループには上限があります。初回試行に加えて2回のswitch retryの後、
    cron は無限ループせずに中止します。

    デバッグ:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Linux で Skills をインストールするにはどうすればよいですか？">
    ネイティブの `openclaw skills` コマンドを使うか、skills をworkspaceに配置してください。macOS の Skills UI は Linux では利用できません。
    Skills は [https://clawhub.ai](https://clawhub.ai) で参照できます。

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

    ネイティブの `openclaw skills install` は、アクティブなworkspaceの `skills/`
    ディレクトリに書き込みます。別個の `clawhub` CLI のインストールが必要なのは、
    自分のskillsを公開または同期したい場合だけです。エージェント間で共有するインストールには、skill を
    `~/.openclaw/skills` 配下に置き、表示できるエージェントを限定したい場合は `agents.defaults.skills` または
    `agents.list[].skills` を使用してください。

  </Accordion>

  <Accordion title="OpenClaw はスケジュール実行や継続的なバックグラウンド実行ができますか？">
    はい。Gateway scheduler を使用してください:

    - スケジュールまたは繰り返しタスクには **Cron jobs**（再起動後も維持される）。
    - 「main session」の定期チェックには **Heartbeat**。
    - 要約を投稿したりチャットに配信したりする自律エージェントには **Isolated jobs**。

    ドキュメント: [Cron jobs](/ja-JP/automation/cron-jobs), [Automation & Tasks](/ja-JP/automation),
    [Heartbeat](/ja-JP/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux から Apple の macOS 専用 Skills を実行できますか？">
    直接はできません。macOS skills は `metadata.openclaw.os` と必要なバイナリによって制御され、skills は **Gateway host** 上で利用可能な場合にのみ system prompt に表示されます。Linux では、`darwin` 専用のskills（`apple-notes`、`apple-reminders`、`things-mac` など）は、その制御を上書きしない限り読み込まれません。

    サポートされているパターンは3つあります:

    **Option A - Gateway を Mac で実行する（最も簡単）。**
    macOS バイナリが存在する場所で Gateway を実行し、その後 Linux から [remote mode](#gateway-ports-already-running-and-remote-mode) または Tailscale 経由で接続します。Gateway host が macOS のため、skills は通常どおり読み込まれます。

    **Option B - macOS node を使う（SSH なし）。**
    Gateway は Linux で実行し、macOS node（メニューバーアプリ）をペアリングして、Mac 側で **Node Run Commands** を 「Always Ask」 または 「Always Allow」 に設定します。必要なバイナリが node 上に存在する場合、OpenClaw は macOS 専用 skills を利用可能として扱えます。agent は `nodes` tool を通じてそれらのskillsを実行します。「Always Ask」を選んだ場合、プロンプトで 「Always Allow」 を承認すると、そのコマンドが allowlist に追加されます。

    **Option C - macOS バイナリを SSH 経由でプロキシする（上級者向け）。**
    Gateway は Linux 上に置いたまま、必要な CLI バイナリを Mac 上で実行する SSH ラッパーで解決されるようにします。その後、skill を上書きして Linux を許可すれば、利用可能なままにできます。

    1. バイナリ用の SSH ラッパーを作成します（例: Apple Notes 用の `memo`）:

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. そのラッパーを Linux host の `PATH` 上に配置します（例: `~/bin/memo`）。
    3. skill metadata を上書きして Linux を許可します（workspace または `~/.openclaw/skills`）:

       ```markdown
       ---
       name: apple-notes
       description: macOS 上の memo CLI を通じて Apple Notes を管理します。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 新しいsessionを開始して、skills snapshot を更新します。

  </Accordion>

  <Accordion title="Notion や HeyGen との連携はありますか？">
    現時点では組み込みではありません。

    選択肢:

    - **カスタムskill / Plugin:** 信頼性の高いAPIアクセスに最適です（Notion/HeyGen はどちらもAPIがあります）。
    - **ブラウザー自動化:** コードなしで使えますが、より遅く壊れやすいです。

    クライアントごとにコンテキストを維持したい場合（代理店ワークフローなど）は、シンプルなパターンとして次があります:

    - クライアントごとに1つのNotionページ（コンテキスト + 設定 + 進行中の作業）。
    - セッション開始時にそのページを取得するようagentに指示する。

    ネイティブ統合が欲しい場合は、機能要望を作成するか、それらのAPIを対象にしたskillを
    作成してください。

    Skills のインストール:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブインストールはアクティブなworkspaceの `skills/` ディレクトリに配置されます。エージェント間で共有するSkillsは、`~/.openclaw/skills/<name>/SKILL.md` に配置してください。共有インストールを一部のエージェントにだけ見せたい場合は、`agents.defaults.skills` または `agents.list[].skills` を設定してください。一部のskillsは Homebrew でインストールされたバイナリを前提としています。Linux ではこれは Linuxbrew を意味します（上記の Homebrew Linux FAQ 項目を参照）。[Skills](/ja-JP/tools/skills), [Skills config](/ja-JP/tools/skills-config), [ClawHub](/ja-JP/tools/clawhub) を参照してください。

  </Accordion>

  <Accordion title="既存のサインイン済み Chrome を OpenClaw で使うにはどうすればよいですか？">
    組み込みの `user` browser profile を使ってください。これは Chrome DevTools MCP 経由で接続します:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    カスタム名を使いたい場合は、明示的な MCP profile を作成してください:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    この経路では、ローカルホストのbrowserまたは接続されたbrowser node を使用できます。Gateway が別の場所で動作している場合は、browser マシン上で node host を実行するか、代わりに remote CDP を使用してください。

    `existing-session` / `user` の現在の制限:

    - actions は CSS selector ベースではなく ref ベース
    - アップロードには `ref` / `inputRef` が必要で、現在は一度に1ファイルのみ対応
    - `responsebody`、PDF export、download interception、batch actions には、引き続き managed browser または raw CDP profile が必要

  </Accordion>
</AccordionGroup>

## サンドボックス化とメモリ

<AccordionGroup>
  <Accordion title="専用のサンドボックス化ドキュメントはありますか？">
    はい。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。Docker 固有のセットアップ（Docker での完全な gateway または sandbox image）については、[Docker](/ja-JP/install/docker) を参照してください。
  </Accordion>

  <Accordion title="Docker だと制限が多く感じます。フル機能を有効にするにはどうすればよいですか？">
    デフォルトイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、
    system packages、Homebrew、バンドル済みbrowser は含まれていません。より完全なセットアップにするには:

    - `/home/node` を `OPENCLAW_HOME_VOLUME` で永続化し、キャッシュを保持する。
    - `OPENCLAW_DOCKER_APT_PACKAGES` で system deps をイメージに焼き込む。
    - バンドル済みCLI経由で Playwright browsers をインストールする:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにする。

    ドキュメント: [Docker](/ja-JP/install/docker), [Browser](/ja-JP/tools/browser).

  </Accordion>

  <Accordion title="1つのエージェントで、DM は個人的なままにしつつ、グループは公開/サンドボックス化できますか？">
    はい。プライベートトラフィックが **DM** で、公開トラフィックが **groups** である場合に可能です。

    `agents.defaults.sandbox.mode: "non-main"` を使うと、group/channel sessions（non-main keys）は Docker 内で実行され、main DM session はホスト上のままになります。その後、`tools.sandbox.tools` を使ってサンドボックス化されたsessionsで利用可能なツールを制限してください。

    セットアップ手順 + 設定例: [Groups: personal DMs + public groups](/ja-JP/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要な設定リファレンス: [Gateway configuration](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ホストフォルダーをサンドボックスに bind するにはどうすればよいですか？">
    `agents.defaults.sandbox.docker.binds` を `["host:path:mode"]` に設定してください（例: `"/home/user/src:/src:ro"`）。グローバルとエージェントごとの binds はマージされます。`scope: "shared"` の場合、エージェントごとの binds は無視されます。機密性の高いものには `:ro` を使い、bind はサンドボックスのファイルシステム境界を迂回することを忘れないでください。

    OpenClaw は bind source を、正規化されたパスと、最も深い既存の祖先を通じて解決された canonical path の両方に対して検証します。つまり、最後のパスセグメントがまだ存在しない場合でも、symlink 親を使ったエスケープは fail closed になり、許可されたルートのチェックも symlink 解決後に引き続き適用されます。

    例と安全上の注意については、[Sandboxing](/ja-JP/gateway/sandboxing#custom-bind-mounts) と [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

  </Accordion>

  <Accordion title="メモリはどのように動作しますか？">
    OpenClaw のメモリは、agent workspace 内の単なる Markdown ファイルです:

    - `memory/YYYY-MM-DD.md` に日次ノート
    - `MEMORY.md` に厳選された長期ノート（main/private sessions のみ）

    OpenClaw はまた、モデルに対して自動 Compaction 前に永続的なノートを書き込むよう促す
    **サイレントな pre-compaction memory flush** も実行します。これは workspace が
    書き込み可能な場合にのみ動作します（読み取り専用サンドボックスではスキップされます）。[Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="メモリがすぐに忘れてしまいます。定着させるにはどうすればよいですか？">
    bot に **その事実をメモリに書き込む** よう依頼してください。長期ノートは `MEMORY.md` に、
    短期コンテキストは `memory/YYYY-MM-DD.md` に入ります。

    これはまだ改善中の領域です。モデルにメモリを保存するよう促すと効果があります。
    そうすれば何をすべきか理解できます。それでも忘れ続ける場合は、Gateway が毎回同じ
    workspace を使っていることを確認してください。

    ドキュメント: [Memory](/ja-JP/concepts/memory), [Agent workspace](/ja-JP/concepts/agent-workspace).

  </Accordion>

  <Accordion title="メモリは永久に保持されますか？制限はありますか？">
    メモリファイルはディスク上に保存され、削除するまで残ります。制限はモデルではなく
    ストレージです。ただし **session context** は依然としてモデルの
    context window に制限されるため、長い会話では Compaction や切り詰めが発生することがあります。そのため
    memory search が存在します。関連部分だけをコンテキストに戻します。

    ドキュメント: [Memory](/ja-JP/concepts/memory), [Context](/ja-JP/concepts/context).

  </Accordion>

  <Accordion title="セマンティックな memory search には OpenAI APIキーが必要ですか？">
    **OpenAI embeddings** を使う場合に限ります。Codex OAuth は chat/completions を対象としており、
    embeddings へのアクセスは付与しません。そのため **Codex でサインインしても（OAuth でも
    Codex CLI login でも）** セマンティックな memory search には役立ちません。OpenAI embeddings には
    引き続き実際の APIキー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

    provider を明示的に設定しない場合、OpenClaw は APIキーを解決できたときに
    自動で provider を選択します（auth profiles、`models.providers.*.apiKey`、または env vars）。
    OpenAI キーが解決できれば OpenAI を優先し、それ以外では Gemini キーが
    解決できれば Gemini、次に Voyage、次に Mistral を選びます。リモートキーが利用できない場合、
    設定するまで memory search は無効のままです。ローカルモデル経路が
    設定済みで存在する場合、OpenClaw は
    `local` を優先します。Ollama は
    `memorySearch.provider = "ollama"` を明示設定した場合にサポートされます。

    ローカルのままにしたい場合は、`memorySearch.provider = "local"`（必要に応じて
    `memorySearch.fallback = "none"` も）を設定してください。Gemini embeddings を使いたい場合は、
    `memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
    `memorySearch.remote.apiKey`）を指定してください。**OpenAI、Gemini、Voyage、Mistral、Ollama、または local** の embedding
    モデルをサポートしています。セットアップの詳細は [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>
</AccordionGroup>

## ディスク上の保存場所

<AccordionGroup>
  <Accordion title="OpenClaw で使うすべてのデータはローカルに保存されますか？">
    いいえ。**OpenClaw の状態はローカル** ですが、**外部サービスには送信した内容が引き続き見えます**。

    - **デフォルトではローカル:** sessions、memory files、config、workspace は Gateway host 上にあります
      （`~/.openclaw` + あなたの workspace ディレクトリ）。
    - **必要上リモート:** モデルプロバイダー（Anthropic/OpenAI など）に送るメッセージは
      それらの API に送信され、チャットプラットフォーム（WhatsApp/Telegram/Slack など）はメッセージデータを
      自社サーバーに保存します。
    - **フットプリントは自分で制御可能:** ローカルモデルを使えばプロンプトは自分のマシン上に留まりますが、channel
      トラフィックは引き続きその channel のサーバーを通過します。

    関連: [Agent workspace](/ja-JP/concepts/agent-workspace), [Memory](/ja-JP/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw はどこにデータを保存しますか？">
    すべては `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）配下にあります:

    | Path                                                            | 用途                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 従来のOAuthインポート（初回使用時にauth profilesへコピーされる）     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、APIキー、および任意の `keyRef`/`tokenRef`）   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider 用の任意のファイルベースsecret payload    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 従来互換ファイル（静的な `api_key` エントリーは除去される）          |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state（例: `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | エージェントごとの状態（agentDir + sessions）                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と状態（エージェントごと）                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session metadata（エージェントごと）                                |

    従来の単一エージェントパス: `~/.openclaw/agent/*`（`openclaw doctor` により移行されます）。

    **workspace**（AGENTS.md、memory files、Skills など）は別で、`agents.defaults.workspace` によって設定されます（デフォルト: `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md はどこに置くべきですか？">
    これらのファイルは `~/.openclaw` ではなく、**agent workspace** に置きます。

    - **Workspace（エージェントごと）**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`（`MEMORY.md` がない場合は従来のフォールバック `memory.md`）、
      `memory/YYYY-MM-DD.md`, 任意の `HEARTBEAT.md`。
    - **State dir（`~/.openclaw`）**: config、channel/provider state、auth profiles、sessions、logs、
      および共有 Skills（`~/.openclaw/skills`）。

    デフォルトの workspace は `~/.openclaw/workspace` で、次のように設定できます:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    再起動後に bot が「忘れる」場合は、Gateway が毎回同じ
    workspace を使用して起動していることを確認してください（また、remote mode では **gateway host 側の**
    workspace が使われるので、ローカルのノートPC側ではないことにも注意してください）。

    ヒント: 永続的な振る舞いや設定を持たせたい場合は、チャット履歴に頼るのではなく、
    bot に **AGENTS.md または MEMORY.md に書き込む** よう依頼してください。

    [Agent workspace](/ja-JP/concepts/agent-workspace) と [Memory](/ja-JP/concepts/memory) を参照してください。

  </Accordion>

  <Accordion title="推奨バックアップ戦略">
    **agent workspace** は **private** な git リポジトリに置き、どこか
    非公開の場所（たとえば GitHub private）にバックアップしてください。これによりメモリ + AGENTS/SOUL/USER
    ファイルが保存され、後からアシスタントの「心」を復元できます。

    `~/.openclaw` 配下のもの（認証情報、sessions、tokens、または暗号化された secrets payload）を commit しては**いけません**。
    完全な復元が必要な場合は、workspace と state directory の両方を
    別々にバックアップしてください（上の移行に関する質問を参照）。

    ドキュメント: [Agent workspace](/ja-JP/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw を完全にアンインストールするにはどうすればよいですか？">
    専用ガイドを参照してください: [Uninstall](/ja-JP/install/uninstall)。
  </Accordion>

  <Accordion title="agents は workspace の外でも動作できますか？">
    はい。workspace は **デフォルトの cwd** とメモリアンカーであり、厳密なサンドボックスではありません。
    相対パスは workspace 内で解決されますが、絶対パスでは他の
    ホスト上の場所にもアクセスできます。分離が必要な場合は、
    [`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing) またはエージェントごとの sandbox 設定を使用してください。リポジトリをデフォルト作業ディレクトリにしたい場合は、その agent の
    `workspace` をリポジトリルートに向けてください。OpenClaw リポジトリは単なるソースコードであり、
    意図的にそこで agent を作業させたい場合を除いて、workspace は別に保ってください。

    例（リポジトリをデフォルト cwd にする場合）:

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

  <Accordion title="Remote mode: session store はどこにありますか？">
    Session state は **gateway host** が保持します。remote mode の場合、重要なのはローカルのノートPCではなく、リモートマシン上の session store です。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>
</AccordionGroup>

## 設定の基本

<AccordionGroup>
  <Accordion title="設定ファイルの形式は何ですか？どこにありますか？">
    OpenClaw は `$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から
    任意の **JSON5** 設定を読み込みます:

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    ファイルが存在しない場合は、安全寄りのデフォルト値（`~/.openclaw/workspace` をデフォルト workspace に含む）を使用します。

  </Accordion>

  <Accordion title='`gateway.bind: "lan"`（または `"tailnet"`）を設定したら、何も listen しなくなった / UI に unauthorized と表示される'>
    non-loopback bind では **有効な gateway auth path が必須** です。実際には次のいずれかを意味します:

    - shared-secret auth: token または password
    - 正しく設定された non-loopback の ID認識型 reverse proxy の背後にある `gateway.auth.mode: "trusted-proxy"`

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

    注意点:

    - `gateway.remote.token` / `.password` だけではローカル gateway auth は有効になりません。
    - ローカルの call path では、`gateway.auth.*` が未設定のときに限って `gateway.remote.*` をフォールバックとして使用できます。
    - password auth を使う場合は、代わりに `gateway.auth.mode: "password"` と `gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を設定してください。
    - `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示設定されていて未解決の場合、解決は fail closed になります（remote fallback によるマスクはされません）。
    - shared-secret を使う Control UI セットアップでは、`connect.params.auth.token` または `connect.params.auth.password`（アプリ/UI設定に保存される）で認証します。Tailscale Serve や `trusted-proxy` のような ID を持つモードでは、代わりに request headers を使用します。shared secrets を URL に入れないでください。
    - `gateway.auth.mode: "trusted-proxy"` の場合、同一ホスト上の loopback reverse proxy では依然として trusted-proxy auth を満たしません。trusted proxy は設定済みの non-loopback source である必要があります。

  </Accordion>

  <Accordion title="なぜ今は localhost でも token が必要なのですか？">
    OpenClaw は loopback を含め、デフォルトで gateway auth を強制します。通常のデフォルト経路では、これは token auth を意味します。明示的な auth path が設定されていない場合、gateway 起動時に token mode に解決されて自動生成され、`gateway.auth.token` に保存されるため、**ローカルの WS clients は認証が必要** になります。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

    別の auth path を望む場合は、password mode（または、non-loopback の ID認識型 reverse proxy では `trusted-proxy`）を明示的に選択できます。**本当に** open loopback にしたい場合は、設定で明示的に `gateway.auth.mode: "none"` を指定してください。Doctor はいつでも token を生成できます: `openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="設定を変更したら再起動は必要ですか？">
    Gateway は設定ファイルを監視しており、hot-reload をサポートしています:

    - `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更は hot-apply、重要な変更は再起動
    - `hot`, `restart`, `off` もサポートされています

  </Accordion>

  <Accordion title="おもしろいCLIタグラインを無効にするにはどうすればよいですか？">
    設定で `cli.banner.taglineMode` を指定してください:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: タグラインのテキストを非表示にしますが、バナーのタイトル/バージョン行は残します。
    - `default`: 毎回 `All your chats, one OpenClaw.` を使用します。
    - `random`: おもしろい/季節ごとのタグラインをローテーションします（デフォルト動作）。
    - バナー自体を表示したくない場合は、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

  </Accordion>

  <Accordion title="web search（および web fetch）を有効にするにはどうすればよいですか？">
    `web_fetch` は APIキーなしで動作します。`web_search` は選択した
    provider に依存します:

    - Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity、Tavily などの API ベース provider は、通常どおり APIキーの設定が必要です。
    - Ollama Web Search はキー不要ですが、設定済みの Ollama host を使用し、`ollama signin` が必要です。
    - DuckDuckGo はキー不要ですが、非公式の HTML ベース統合です。
    - SearXNG はキー不要/セルフホスト型です。`SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` を設定してください。

    **推奨:** `openclaw configure --section web` を実行して provider を選択してください。
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
              provider: "firecrawl", // 任意; 自動検出にする場合は省略
            },
          },
        },
    }
    ```

    provider 固有の web-search 設定は現在 `plugins.entries.<plugin>.config.webSearch.*` 配下にあります。
    従来の `tools.web.search.*` provider path も一時的に互換性のため読み込まれますが、新しい設定では使用すべきではありません。
    Firecrawl の web-fetch fallback 設定は `plugins.entries.firecrawl.config.webFetch.*` 配下にあります。

    注意点:

    - allowlist を使っている場合は、`web_search`/`web_fetch`/`x_search` または `group:web` を追加してください。
    - `web_fetch` はデフォルトで有効です（明示的に無効化していない限り）。
    - `tools.web.fetch.provider` を省略した場合、OpenClaw は利用可能な認証情報から最初に準備完了した fetch fallback provider を自動検出します。現時点でのバンドル済み provider は Firecrawl です。
    - デーモンは `~/.openclaw/.env`（または service environment）から env vars を読み込みます。

    ドキュメント: [Web tools](/ja-JP/tools/web).

  </Accordion>

  <Accordion title="config.apply で設定が消えました。どう復旧し、どう防げばよいですか？">
    `config.apply` は **設定全体** を置き換えます。部分オブジェクトを送ると、それ以外の
    すべてが削除されます。

    復旧方法:

    - バックアップ（git またはコピーしておいた `~/.openclaw/openclaw.json`）から復元する。
    - バックアップがない場合は、`openclaw doctor` を再実行して channels/models を再設定する。
    - 予期しない動作だった場合は、バグを報告し、直前の設定またはバックアップを含める。
    - ローカルのコーディングエージェントであれば、ログや履歴から動作する設定を再構築できることが多いです。

    防ぐ方法:

    - 小さな変更には `openclaw config set` を使う。
    - 対話的な編集には `openclaw configure` を使う。
    - 正確な path や field shape に自信がない場合は、まず `config.schema.lookup` を使う。浅い schema node と、掘り下げ用の直下の子要約が返されます。
    - 部分的な RPC 編集には `config.patch` を使い、`config.apply` は完全な設定置換にのみ使う。
    - エージェント実行から owner-only の `gateway` tool を使っている場合でも、`tools.exec.ask` / `tools.exec.security` への書き込みは引き続き拒否されます（同じ保護された exec path に正規化される従来の `tools.bash.*` エイリアスを含む）。

    ドキュメント: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/ja-JP/gateway/doctor).

  </Accordion>

  <Accordion title="複数デバイスにまたがる専門ワーカーと中央 Gateway をどう構成すればよいですか？">
    一般的なパターンは、**1つの Gateway**（例: Raspberry Pi）に **nodes** と **agents** を組み合わせる構成です:

    - **Gateway（中央）:** channels（Signal/WhatsApp）、routing、sessions を保持する。
    - **Nodes（デバイス）:** Mac/iOS/Android が周辺機器として接続し、ローカルツール（`system.run`, `canvas`, `camera`）を公開する。
    - **Agents（ワーカー）:** 特定の役割（例: 「Hetzner ops」、「個人データ」）向けの別々の頭脳/workspaces。
    - **Sub-agents:** 並列化したいときに、main agent からバックグラウンド作業を起動する。
    - **TUI:** Gateway に接続し、agents/sessions を切り替える。

    ドキュメント: [Nodes](/ja-JP/nodes), [Remote access](/ja-JP/gateway/remote), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="OpenClaw browser は headless で実行できますか？">
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

    デフォルトは `false`（headful）です。headless は一部のサイトで anti-bot チェックを誘発しやすくなります。[Browser](/ja-JP/tools/browser) を参照してください。

    headless は **同じ Chromium engine** を使用し、ほとんどの自動化（フォーム、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです:

    - 表示されるブラウザーウィンドウがない（視覚情報が必要ならスクリーンショットを使う）。
    - 一部のサイトは headless mode の自動化に対してより厳格です（CAPTCHA、anti-bot）。
      たとえば、X/Twitter はしばしば headless session をブロックします。

  </Accordion>

  <Accordion title="browser 制御で Brave を使うにはどうすればよいですか？">
    `browser.executablePath` を Brave のバイナリ（または任意の Chromium ベース browser）に設定し、Gateway を再起動してください。
    完全な設定例は [Browser](/ja-JP/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。
  </Accordion>
</AccordionGroup>

## リモート Gateway と nodes

<AccordionGroup>
  <Accordion title="Telegram、gateway、nodes の間でコマンドはどのように伝播しますか？">
    Telegram メッセージは **gateway** が処理します。gateway は agent を実行し、
    node tool が必要な場合に限り **Gateway WebSocket** 経由で nodes を呼び出します:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes は受信する provider traffic を見ることはありません。受け取るのは node RPC 呼び出しだけです。

  </Accordion>

  <Accordion title="Gateway がリモートでホストされている場合、agent はどうやって自分のコンピューターにアクセスできますか？">
    短い答え: **コンピューターを node としてペアリング** してください。Gateway は別の場所で動作していても、
    Gateway WebSocket 経由でローカルマシン上の `node.*` tools（screen、camera、system）を
    呼び出せます。

    一般的なセットアップ:

    1. Gateway を常時稼働ホスト（VPS/ホームサーバー）で実行する。
    2. Gateway host と自分のコンピューターを同じ tailnet に置く。
    3. Gateway WS に到達できることを確認する（tailnet bind または SSH tunnel）。
    4. macOS app をローカルで開き、**Remote over SSH** mode（または直接 tailnet）
       で接続し、node として登録できるようにする。
    5. Gateway 上で node を承認する:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    別個の TCP bridge は不要です。nodes は Gateway WebSocket 経由で接続します。

    セキュリティ上の注意: macOS node をペアリングすると、そのマシン上で `system.run` が可能になります。信頼できるデバイスだけを
    ペアリングし、[Security](/ja-JP/gateway/security) を確認してください。

    ドキュメント: [Nodes](/ja-JP/nodes), [Gateway protocol](/ja-JP/gateway/protocol), [macOS remote mode](/ja-JP/platforms/mac/remote), [Security](/ja-JP/gateway/security).

  </Accordion>

  <Accordion title="Tailscale は接続されているのに返信がありません。どうすればよいですか？">
    まず基本を確認してください:

    - Gateway が動作中か: `openclaw gateway status`
    - Gateway health: `openclaw status`
    - Channel health: `openclaw channels status`

    次に認証とルーティングを確認します:

    - Tailscale Serve を使っている場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認してください。
    - SSH tunnel 経由で接続している場合は、ローカル tunnel が起動していて正しいポートを向いていることを確認してください。
    - allowlist（DM または group）に自分のアカウントが含まれていることを確認してください。

    ドキュメント: [Tailscale](/ja-JP/gateway/tailscale), [Remote access](/ja-JP/gateway/remote), [Channels](/ja-JP/channels).

  </Accordion>

  <Accordion title="2つの OpenClaw インスタンス同士を会話させることはできますか（ローカル + VPS）？">
    はい。組み込みの「bot-to-bot」bridge はありませんが、いくつかの
    信頼できる方法で構成できます:

    **最も簡単:** 両方の bot がアクセスできる通常のチャットチャネル（Telegram/Slack/WhatsApp）を使います。
    Bot A に Bot B へメッセージを送らせ、その後 Bot B が通常どおり返信します。

    **CLI bridge（汎用）:** スクリプトで相手の Gateway に
    `openclaw agent --message ... --deliver` を実行し、相手の bot が
    監視しているチャットを対象にします。片方の bot がリモート VPS 上にある場合は、そのリモート Gateway を
    SSH/Tailscale 経由で CLI から指すようにします（[Remote access](/ja-JP/gateway/remote) を参照）。

    例のパターン（対象 Gateway に到達できるマシン上で実行）:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    ヒント: 2つの bot が無限にループしないようにガードレールを追加してください（mention のみ、
    channel allowlists、または「bot メッセージには返信しない」ルール）。

    ドキュメント: [Remote access](/ja-JP/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/ja-JP/tools/agent-send).

  </Accordion>

  <Accordion title="複数の agents に別々の VPS は必要ですか？">
    いいえ。1つの Gateway で複数の agents をホストでき、それぞれが独自の workspace、モデルデフォルト、
    および routing を持てます。これが通常のセットアップであり、
    agent ごとに1つの VPS を動かすよりもずっと安価で簡単です。

    別々の VPS が必要になるのは、強い分離（セキュリティ境界）が必要な場合、または
    共有したくない大きく異なる設定が必要な場合だけです。それ以外は、1つの Gateway を維持し、
    複数の agents または sub-agents を使ってください。

  </Accordion>

  <Accordion title="リモート Gateway から SSH する代わりに、個人のノートPCで node を使う利点はありますか？">
    はい。リモート Gateway からノートPCに到達する第一級の方法が nodes であり、
    シェルアクセス以上のことができます。Gateway は macOS/Linux（Windows は WSL2 経由）で動作し、
    軽量です（小型 VPS や Raspberry Pi クラスのマシンで十分で、4 GB RAM あれば余裕があります）。そのため、常時稼働ホスト + ノートPC を node とする構成が一般的です。

    - **受信 SSH 不要。** Nodes は Gateway WebSocket へ外向き接続し、デバイスペアリングを使います。
    - **より安全な実行制御。** `system.run` はそのノートPC上の node allowlists/approvals によって制御されます。
    - **より多くのデバイスツール。** Nodes は `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
    - **ローカル browser 自動化。** Gateway は VPS 上に置いたまま、ノートPC上の node host を通じてローカル Chrome を動かしたり、Chrome MCP 経由でホスト上のローカル Chrome に接続したりできます。

    SSH はその場限りのシェルアクセスには問題ありませんが、継続的な agent ワークフローや
    デバイス自動化には nodes の方が簡単です。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes), [Browser](/ja-JP/tools/browser).

  </Accordion>

  <Accordion title="nodes は gateway service を実行しますか？">
    いいえ。意図的に分離されたprofileを動かす場合（[Multiple gateways](/ja-JP/gateway/multiple-gateways) を参照）を除き、ホストごとに実行する gateway は **1つだけ** にすべきです。Nodes は gateway に接続する周辺機器です
    （iOS/Android nodes、またはメニューバーアプリの macOS 「node mode」）。headless な node
    hosts と CLI 制御については、[Node host CLI](/cli/node) を参照してください。

    `gateway`、`discovery`、`canvasHost` の変更には完全な再起動が必要です。

  </Accordion>

  <Accordion title="設定を適用する API / RPC の方法はありますか？">
    はい。

    - `config.schema.lookup`: 書き込む前に、1つの設定サブツリーについて浅い schema node、対応する UI ヒント、直下の子要約を確認する
    - `config.get`: 現在のスナップショット + hash を取得する
    - `config.patch`: 安全な部分更新（ほとんどの RPC 編集では推奨）。可能なら hot-reload し、必要なら再起動する
    - `config.apply`: 設定全体を検証して置き換える。可能なら hot-reload し、必要なら再起動する
    - owner-only の `gateway` runtime tool は、引き続き `tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスは同じ保護された exec path に正規化されます

  </Accordion>

  <Accordion title="初回インストール向けの最小限で妥当な設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    これにより workspace を設定し、誰が bot をトリガーできるかを制限します。

  </Accordion>

  <Accordion title="VPS に Tailscale を設定して Mac から接続するにはどうすればよいですか？">
    最小手順:

    1. **VPS にインストールしてログイン**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac にインストールしてログイン**
       - Tailscale アプリを使い、同じ tailnet にサインインします。
    3. **MagicDNS を有効にする（推奨）**
       - Tailscale 管理コンソールで MagicDNS を有効にし、VPS に安定した名前を付けます。
    4. **tailnet ホスト名を使う**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH なしで Control UI を使いたい場合は、VPS 上で Tailscale Serve を使用してください:

    ```bash
    openclaw gateway --tailscale serve
    ```

    これにより gateway は loopback に bind されたままとなり、Tailscale 経由で HTTPS が公開されます。[Tailscale](/ja-JP/gateway/tailscale) を参照してください。

  </Accordion>

  <Accordion title="Mac node をリモート Gateway（Tailscale Serve）に接続するにはどうすればよいですか？">
    Serve は **Gateway Control UI + WS** を公開します。Nodes は同じ Gateway WS endpoint 経由で接続します。

    推奨セットアップ:

    1. **VPS と Mac が同じ tailnet 上にあることを確認する**。
    2. **macOS アプリを Remote mode で使う**（SSH target には tailnet hostname を指定できます）。
       アプリが Gateway port をトンネルし、node として接続します。
    3. gateway 上で node を承認する:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ドキュメント: [Gateway protocol](/ja-JP/gateway/protocol), [Discovery](/ja-JP/gateway/discovery), [macOS remote mode](/ja-JP/platforms/mac/remote)。

  </Accordion>

  <Accordion title="2台目のノートPCにはインストールすべきですか？それとも node を追加するだけでよいですか？">
    2台目のノートPCで必要なのが **ローカルツール**（screen/camera/exec）だけなら、
    **node** として追加してください。そうすれば Gateway は1つのままで、設定の重複を避けられます。ローカル node tools は
    現時点では macOS のみ対応ですが、今後ほかの OS にも拡張する予定です。

    2つ目の Gateway をインストールするのは、**強い分離** が必要な場合、または完全に別々の bot が2つ必要な場合だけです。

    ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境変数と .env の読み込み

<AccordionGroup>
  <Accordion title="OpenClaw は環境変数をどのように読み込みますか？">
    OpenClaw は親プロセス（shell、launchd/systemd、CI など）から env vars を読み取り、さらに次も読み込みます:

    - 現在の作業ディレクトリの `.env`
    - `~/.openclaw/.env`（別名 `$OPENCLAW_STATE_DIR/.env`）のグローバルフォールバック `.env`

    どちらの `.env` ファイルも、既存の env vars を上書きしません。

    設定内でインライン env vars を定義することもできます（プロセス env に存在しない場合にのみ適用）:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完全な優先順位と読み込み元については、[/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>

  <Accordion title="service 経由で Gateway を起動したら env vars が消えました。どうすればよいですか？">
    よくある修正方法は2つあります:

    1. 不足しているキーを `~/.openclaw/.env` に入れる。そうすれば service が shell env を継承しない場合でも読み込まれます。
    2. shell import を有効にする（オプトインの利便機能）:

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

    これにより login shell が実行され、想定される不足キーだけが取り込まれます（上書きはしません）。対応する env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='`COPILOT_GITHUB_TOKEN` を設定したのに、models status に "Shell env: off." と表示されます。なぜですか？'>
    `openclaw models status` は、**shell env import** が有効かどうかを報告します。"Shell env: off"
    は、env vars が不足していることを意味するのではなく、OpenClaw が
    login shell を自動では読み込まないことを意味します。

    Gateway が service（launchd/systemd）として動作している場合、shell
    environment は継承されません。次のいずれかで修正してください:

    1. トークンを `~/.openclaw/.env` に入れる:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. または shell import（`env.shellEnv.enabled: true`）を有効にする。
    3. または config の `env` ブロックに追加する（不足時のみ適用）。

    その後 gateway を再起動して再確認します:

    ```bash
    openclaw models status
    ```

    Copilot tokens は `COPILOT_GITHUB_TOKEN`（および `GH_TOKEN` / `GITHUB_TOKEN`）から読み取られます。
    [/concepts/model-providers](/ja-JP/concepts/model-providers) と [/environment](/ja-JP/help/environment) を参照してください。

  </Accordion>
</AccordionGroup>

## Sessions と複数チャット

<AccordionGroup>
  <Accordion title="新しい会話を始めるにはどうすればよいですか？">
    単独メッセージとして `/new` または `/reset` を送信してください。[Session management](/ja-JP/concepts/session) を参照してください。
  </Accordion>

  <Accordion title="`/new` を一度も送らなければ、sessions は自動でリセットされますか？">
    Sessions は `session.idleMinutes` の後に期限切れにできますが、これは **デフォルトでは無効**（デフォルト **0**）です。
    有効にするには正の値を設定してください。有効時は、アイドル期間の**次の**
    メッセージで、そのチャットキーに対する新しい session id が開始されます。
    これは transcript を削除するのではなく、新しい session を開始するだけです。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw インスタンスのチーム（1人のCEOと多数の agents）を作る方法はありますか？">
    はい。**multi-agent routing** と **sub-agents** を使います。1つの coordinator
    agent と、独自の workspaces と models を持つ複数の worker agents を作成できます。

    ただし、これは **楽しい実験** として捉えるのが最適です。トークン消費が多く、
    1つの bot を別々の sessions で使うより効率が落ちることもあります。私たちが
    想定している典型的なモデルは、あなたが会話する bot は1つで、並列作業用に
    別セッションを使う形です。その bot は必要に応じて sub-agents も起動できます。

    ドキュメント: [Multi-agent routing](/ja-JP/concepts/multi-agent), [Sub-agents](/ja-JP/tools/subagents), [Agents CLI](/cli/agents)。

  </Accordion>

  <Accordion title="タスクの途中で context が切り詰められたのはなぜですか？どう防げますか？">
    Session context はモデルのウィンドウによって制限されます。長いチャット、大きなツール出力、多数の
    ファイルは Compaction や切り詰めを引き起こすことがあります。

    効果的な対策:

    - bot に現在の状態を要約してファイルに書くよう依頼する。
    - 長いタスクの前に `/compact` を使い、話題を変えるときは `/new` を使う。
    - 重要なコンテキストは workspace に置き、bot に再読込させる。
    - 長時間または並列の作業には sub-agents を使い、メインチャットを小さく保つ。
    - これが頻繁に起きるなら、より大きな context window を持つモデルを選ぶ。

  </Accordion>

  <Accordion title="OpenClaw を完全にリセットしつつ、インストールは残すにはどうすればよいですか？">
    reset コマンドを使用してください:

    ```bash
    openclaw reset
    ```

    非対話型の完全リセット:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    その後、セットアップを再実行してください:

    ```bash
    openclaw onboard --install-daemon
    ```

    注意点:

    - 既存の設定を検出した場合、オンボーディングでも **Reset** が提示されます。[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。
    - profiles（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各 state dir をリセットしてください（デフォルトは `~/.openclaw-<profile>`）。
    - 開発用リセット: `openclaw gateway --dev --reset`（dev 専用。dev config + credentials + sessions + workspace を消去します）。

  </Accordion>

  <Accordion title='「context too large」エラーが出ます。どうやってリセットまたは compact すればよいですか？'>
    次のいずれかを使ってください:

    - **Compact**（会話は維持しつつ古いターンを要約）:

      ```
      /compact
      ```

      または `/compact <instructions>` で要約の方針を指定します。

    - **Reset**（同じチャットキーに対して新しい session ID を開始）:

      ```
      /new
      /reset
      ```

    それでも繰り返し起きる場合:

    - **session pruning**（`agents.defaults.contextPruning`）を有効化または調整して、古いツール出力を削減する。
    - より大きな context window を持つモデルを使う。

    ドキュメント: [Compaction](/ja-JP/concepts/compaction), [Session pruning](/ja-JP/concepts/session-pruning), [Session management](/ja-JP/concepts/session)。

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" と表示されるのはなぜですか？'>
    これは provider の検証エラーです。モデルが、必須の
    `input` を持たない `tool_use` ブロックを出力しました。通常は、session history が古いか破損していることを意味します
    （長い thread や tool/schema の変更後によく起こります）。

    対処法: 単独メッセージで `/new` を送って、新しい session を開始してください。

  </Accordion>

  <Accordion title="30分ごとに heartbeat メッセージが届くのはなぜですか？">
    Heartbeat はデフォルトで **30分** ごと（OAuth auth 使用時は **1時間** ごと）に実行されます。調整または無効化するには:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // または無効化するなら "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` が存在しても実質的に空（空行と
    `# Heading` のような markdown header だけ）なら、OpenClaw は API 呼び出しを節約するため heartbeat 実行をスキップします。
    ファイルが存在しない場合でも heartbeat は実行され、何をするかはモデルが判断します。

    エージェントごとの override には `agents.list[].heartbeat` を使います。ドキュメント: [Heartbeat](/ja-JP/gateway/heartbeat)。

  </Accordion>

  <Accordion title='WhatsApp グループには「bot account」を追加する必要がありますか？'>
    いいえ。OpenClaw は **あなた自身のアカウント** で動作するため、あなたがグループにいれば OpenClaw もそれを見られます。
    デフォルトでは、送信者を許可するまで group replies はブロックされます（`groupPolicy: "allowlist"`）。

    グループ返信をトリガーできるのを **自分だけ** にしたい場合:

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

  <Accordion title="WhatsApp グループの JID を取得するにはどうすればよいですか？">
    方法1（最速）: ログを追跡し、グループでテストメッセージを送信します:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` で終わる `chatId`（または `from`）を探してください。たとえば:
    `1234567890-1234567890@g.us`。

    方法2（すでに設定済み/allowlist 済みの場合）: 設定からグループを一覧表示します:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="グループで OpenClaw が返信しないのはなぜですか？">
    よくある原因は2つあります:

    - mention gating が有効です（デフォルト）。bot を @mention する必要があります（または `mentionPatterns` に一致させる必要があります）。
    - `channels.whatsapp.groups` を `"*"` なしで設定していて、そのグループが allowlist に含まれていません。

    [Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。

  </Accordion>

  <Accordion title="groups/threads は DM と context を共有しますか？">
    直接チャットはデフォルトで main session に集約されます。groups/channels は独自の session key を持ち、Telegram topics / Discord threads も別々の sessions です。[Groups](/ja-JP/channels/groups) と [Group messages](/ja-JP/channels/group-messages) を参照してください。
  </Accordion>

  <Accordion title="いくつの workspaces と agents を作成できますか？">
    厳密な上限はありません。数十個（あるいは数百個）でも問題ありませんが、次には注意してください:

    - **ディスク増加:** sessions + transcripts は `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。
    - **トークンコスト:** agents が増えるほど、同時モデル使用も増えます。
    - **運用負荷:** エージェントごとの auth profiles、workspaces、channel routing。

    ヒント:

    - agent ごとに **アクティブな** workspace を1つ維持する（`agents.defaults.workspace`）。
    - ディスクが増えてきたら古い sessions を pruning する（JSONL または store entries を削除する）。
    - `openclaw doctor` を使って、取り残された workspaces や profile の不一致を見つける。

  </Accordion>

  <Accordion title="複数の bot や chats を同時に実行できますか（Slack）？また、どう設定すべきですか？">
    はい。**Multi-Agent Routing** を使って複数の分離された agents を実行し、
    受信メッセージを channel/account/peer ごとにルーティングできます。Slack は channel としてサポートされており、特定の agents にバインドできます。

    browser アクセスは強力ですが、「人間にできることなら何でもできる」わけではありません。anti-bot、CAPTCHA、MFA は
    依然として自動化をブロックすることがあります。最も信頼性の高い browser 制御を行うには、ホスト上のローカル Chrome MCP を使うか、
    browser を実際に動かしているマシン上で CDP を使ってください。

    ベストプラクティスのセットアップ:

    - 常時稼働の Gateway host（VPS/Mac mini）。
    - 役割ごとに1 agent（bindings）。
    - それらの agents にバインドされた Slack channel(s)。
    - 必要に応じて、Chrome MCP または node 経由のローカル browser。

    ドキュメント: [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [Slack](/ja-JP/channels/slack),
    [Browser](/ja-JP/tools/browser), [Nodes](/ja-JP/nodes).

  </Accordion>
</AccordionGroup>

## Models: デフォルト、選択、aliases、切り替え

<AccordionGroup>
  <Accordion title='「default model」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次に設定したものです:

    ```
    agents.defaults.model.primary
    ```

    Models は `provider/model`（例: `openai/gpt-5.4`）として参照されます。provider を省略した場合、OpenClaw はまず alias を試し、次にその正確な model id に対する一意の configured-provider match を試し、それでもなければ非推奨の互換経路として configured default provider にフォールバックします。その provider が設定済みの default model をもう公開していない場合、古い削除済み provider のデフォルトを出す代わりに、最初に設定された provider/model にフォールバックします。それでも **明示的に** `provider/model` を設定するべきです。

  </Accordion>

  <Accordion title="おすすめのモデルは何ですか？">
    **推奨デフォルト:** あなたの provider stack で利用可能な、最新世代の最も強力なモデルを使ってください。
    **tools 対応または信頼できない入力を扱う agents 向け:** コストよりモデル性能を優先してください。
    **日常的/低リスクなチャット向け:** より安価なフォールバックモデルを使い、agent の役割ごとにルーティングしてください。

    MiniMax には専用ドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    経験則として、高リスクな作業には **支払える範囲で最高のモデル** を使い、
    日常的なチャットや要約にはより安価な
    モデルを使ってください。モデルは agent ごとにルーティングでき、sub-agents を使って
    長いタスクを並列化できます（各 sub-agent はトークンを消費します）。[Models](/ja-JP/concepts/models) と
    [Sub-agents](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱い/過度に量子化されたモデルは、prompt
    injection や危険な挙動に対してより脆弱です。[Security](/ja-JP/gateway/security) を参照してください。

    より詳しい情報: [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるにはどうすればよいですか？">
    **モデルコマンド** を使うか、**model** フィールドだけを編集してください。設定全体の置換は避けてください。

    安全な方法:

    - チャット内の `/model`（手軽、セッション単位）
    - `openclaw models set ...`（model 設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使わないでください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup payload には、正規化された path、浅い schema docs/constraints、直下の子要約が含まれます。
    部分更新に使ってください。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [Models](/ja-JP/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/ja-JP/gateway/doctor).

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。ローカルモデルでは Ollama が最も簡単な経路です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストール
    2. `ollama pull gemma4` のようにローカルモデルを取得
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行
    4. `openclaw onboard` を実行して `Ollama` を選択
    5. `Local` または `Cloud + Local` を選ぶ

    注意点:

    - `Cloud + Local` ではクラウドモデルに加えてローカルの Ollama モデルも使えます
    - `kimi-k2.5:cloud` のようなクラウドモデルにはローカル pull は不要です
    - 手動で切り替える場合は、`openclaw models list` と `openclaw models set ollama/<model>` を使ってください

    セキュリティ上の注意: より小さいモデルや強く量子化されたモデルは、prompt
    injection に対してより脆弱です。tools を使用できる bot には **大規模モデル** を強く推奨します。
    それでも小さいモデルを使いたい場合は、sandboxing と厳格な tool allowlists を有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama), [ローカルモデル](/ja-JP/gateway/local-models),
    [Model providers](/ja-JP/concepts/model-providers), [Security](/ja-JP/gateway/security),
    [Sandboxing](/ja-JP/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はモデルとして何を使っていますか？">
    - これらのデプロイはそれぞれ異なることがあり、時間とともに変わる可能性もあります。固定の provider 推奨はありません。
    - 各 gateway の現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティ重視/ツール対応の agents には、利用可能な最新世代で最も強力なモデルを使ってください。
  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるにはどうすればよいですか？">
    単独メッセージとして `/model` コマンドを使ってください:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    これらは組み込み aliases です。カスタム aliases は `agents.defaults.models` で追加できます。

    利用可能なモデルは `/model`、`/model list`、または `/model status` で一覧表示できます。

    `/model`（および `/model list`）は、コンパクトな番号付き picker を表示します。番号で選択できます:

    ```
    /model 3
    ```

    provider に対して特定の auth profile を強制することもできます（セッション単位）:

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` では、どの agent がアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの auth profile が試されるかが表示されます。
    利用可能な場合は、設定済みの provider endpoint（`baseUrl`）と API mode（`api`）も表示されます。

    **`@profile` で設定した profile の固定を解除するには？**

    `@profile` 接尾辞なしで `/model` を再実行してください:

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選択するか（または `/model <default provider/model>` を送信してください）。
    どの auth profile がアクティブかは `/model status` で確認してください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.2、コーディングには Codex 5.3 を使えますか？">
    はい。1つをデフォルトに設定し、必要に応じて切り替えてください:

    - **クイック切り替え（セッション単位）:** 日常タスクには `/model gpt-5.4`、Codex OAuth でのコーディングには `/model openai-codex/gpt-5.4`。
    - **デフォルト + 切り替え:** `agents.defaults.model.primary` を `openai/gpt-5.4` に設定し、コーディング時に `openai-codex/gpt-5.4` に切り替える（または逆でも可）。
    - **Sub-agents:** コーディングタスクを、異なるデフォルトモデルを持つ sub-agents にルーティングする。

    [Models](/ja-JP/concepts/models) と [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.4 で fast mode を設定するにはどうすればよいですか？">
    セッショントグルまたは設定デフォルトのいずれかを使ってください:

    - **セッション単位:** セッションが `openai/gpt-5.4` または `openai-codex/gpt-5.4` を使っている間に `/fast on` を送信する。
    - **モデルごとのデフォルト:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` を `true` に設定する。
    - **Codex OAuth も:** `openai-codex/gpt-5.4` も使うなら、同じフラグをそこにも設定する。

    例:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI では、fast mode はサポートされているネイティブ Responses request で `service_tier = "priority"` に対応します。セッションの `/fast` override は設定デフォルトより優先されます。

    [Thinking and fast mode](/ja-JP/tools/thinking) と [OpenAI fast mode](/ja-JP/providers/openai#openai-fast-mode) を参照してください。

  </Accordion>

  <Accordion title='"Model ... is not allowed" と表示され、その後返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とすべての
    session override に対する **allowlist** になります。
    その一覧にないモデルを選ぶと、次が返されます:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    このエラーは、通常の返信の**代わりに**返されます。対処法: モデルを
    `agents.defaults.models` に追加する、allowlist を削除する、または `/model list` からモデルを選んでください。

  </Accordion>

  <Accordion title='"Unknown model: minimax/MiniMax-M2.7" と表示されるのはなぜですか？'>
    これは **provider が設定されていない** ことを意味します（MiniMax provider の設定または auth
    profile が見つからなかったため）、モデルを解決できません。

    確認項目:

    1. 現在の OpenClaw リリースへアップグレードする（またはソースの `main` から実行する）してから、gateway を再起動する。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または MiniMax の auth が
       env/auth profiles に存在し、対応する provider を注入できることを確認する
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済みの MiniMax
       OAuth）。
    3. auth path に対して大文字小文字を区別する正確な model id を使う:
       APIキー設定なら `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、
       OAuth 設定なら `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行する:

       ```bash
       openclaw models list
       ```

       そして一覧から選ぶ（またはチャットで `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [Models](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにして、複雑なタスクには OpenAI を使えますか？">
    はい。**MiniMax をデフォルト** にし、必要に応じて **セッション単位** でモデルを切り替えてください。
    Fallbacks は **エラー用** であり、「難しいタスク」用ではないため、`/model` または別の agent を使ってください。

    **Option A: セッション単位で切り替える**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    その後:

    ```
    /model gpt
    ```

    **Option B: agents を分ける**

    - Agent A のデフォルト: MiniMax
    - Agent B のデフォルト: OpenAI
    - agent ごとにルーティングするか、`/agent` で切り替える

    ドキュメント: [Models](/ja-JP/concepts/models), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [MiniMax](/ja-JP/providers/minimax), [OpenAI](/ja-JP/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト shorthand があります（`agents.defaults.models` にそのモデルが存在する場合にのみ適用されます）:

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自の alias を設定した場合は、あなたの値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（aliases）を定義/上書きするにはどうすればよいですか？">
    Aliases は `agents.defaults.models.<modelId>.alias` から取得されます。例:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    これで `/model sonnet`（またはサポートされている場合は `/<alias>`）がその model ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など、他の provider の models を追加するにはどうすればよいですか？">
    OpenRouter（従量課金、多数のモデル）:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM models）:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    provider/model を参照していても必要な provider key が欠けている場合、ランタイム auth エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しい agent を追加した後に「No API key found for provider」と表示される場合**

    通常、これは **新しい agent** の auth store が空であることを意味します。auth はエージェントごとであり、
    次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    対処方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に auth を設定する。
    - または、main agent の `agentDir` にある `auth-profiles.json` を新しい agent の `agentDir` にコピーする。

    agents 間で `agentDir` を共有しては**いけません**。auth/session の競合が起こります。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは2段階で発生します:

    1. 同一 provider 内での **auth profile rotation**。
    2. `agents.defaults.model.fallbacks` にある次のモデルへの **model fallback**。

    失敗した profiles にはクールダウン（指数バックオフ）が適用されるため、provider がレート制限中や一時的に失敗している場合でも、OpenClaw は応答を続けられます。

    レート制限バケットには、単純な `429` 応答以上のものが含まれます。OpenClaw は
    `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および周期的な
    使用量ウィンドウ制限（`weekly/monthly limit reached`）のようなメッセージも
    フェイルオーバー対象のレート制限として扱います。

    一部の課金っぽい応答は `402` ではなく、一部の HTTP `402`
    応答もその一時的バケットに残ります。provider が
    `401` または `403` で明示的な課金テキストを返す場合、OpenClaw はそれを引き続き
    billing lane に置くことがありますが、provider 固有のテキストマッチャーは
    その provider の範囲内に限定されます（たとえば OpenRouter の `Key limit exceeded`）。`402`
    メッセージが代わりに再試行可能な usage-window や
    organization/workspace の支出制限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）に見える場合、OpenClaw はそれを
    長期的な billing disable ではなく `rate_limit` として扱います。

    context overflow エラーは別です。たとえば
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` といったシグネチャは、model
    fallback を進める代わりに compaction/retry path に留まります。

    一般的なサーバーエラーテキストは、「unknown/error を含むものなら何でも」というほど広くはありません。OpenClaw は
    Anthropic の素の `An unknown error occurred`、OpenRouter の素の
    `Provider returned error`、`Unhandled stop reason:
    error` のような stop-reason エラー、JSON の `api_error` payload に含まれる一時的サーバーテキスト
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`）、および `ModelNotReadyException` のような provider-busy エラーを、
    provider context が一致する場合にフェイルオーバー対象の timeout/overloaded シグナルとして扱います。
    `LLM request failed with an unknown
    error.` のような一般的な内部 fallback テキストは保守的に扱われ、それ単体では model fallback を引き起こしません。

  </Accordion>

  <Accordion title='"No credentials found for profile anthropic:default" とはどういう意味ですか？'>
    これは、システムが auth profile ID `anthropic:default` を使おうとしたものの、想定される auth store にその認証情報を見つけられなかったことを意味します。

    **確認項目:**

    - **auth profiles がどこにあるか確認する**（新旧パス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 従来: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
    - **env var が Gateway に読み込まれていることを確認する**
      - `ANTHROPIC_API_KEY` を shell に設定していても、Gateway を systemd/launchd 経由で実行している場合、それを継承しないことがあります。`~/.openclaw/.env` に入れるか `env.shellEnv` を有効にしてください。
    - **正しい agent を編集していることを確認する**
      - multi-agent 構成では、複数の `auth-profiles.json` ファイルがあり得ます。
    - **model/auth status を簡易確認する**
      - `openclaw models status` を使って、設定済みモデルと provider が認証済みかどうかを確認してください。

    **「No credentials found for profile anthropic」の確認項目**

    これは、その実行が Anthropic の auth profile に固定されているのに、Gateway
    が auth store にそれを見つけられないことを意味します。

    - **Claude CLI を使う**
      - gateway host 上で `openclaw models auth login --provider anthropic --method cli --set-default` を実行する。
    - **代わりに APIキーを使いたい場合**
      - **gateway host** 上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れる。
      - 存在しない profile を強制する固定順序を解除する:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **commands を gateway host 上で実行していることを確認する**
      - remote mode では、auth profiles はローカルのノートPCではなく gateway マシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか？">
    model 設定に Google Gemini が fallback として含まれている場合（または Gemini shorthand に切り替えた場合）、OpenClaw は model fallback 中にそれを試します。Google の認証情報を設定していないと、`No API key found for provider "google"` が表示されます。

    対処法: Google auth を用意するか、`agents.defaults.model.fallbacks` / aliases から Google models を削除/回避して、fallback がそちらへルーティングしないようにしてください。

    **LLM request rejected: thinking signature required (Google Antigravity)**

    原因: session history に **署名のない thinking blocks** が含まれています（多くは
    中断/部分ストリーム由来）。Google Antigravity では thinking blocks に署名が必要です。

    対処法: OpenClaw は現在、Google Antigravity Claude 向けに署名なし thinking blocks を除去します。それでも表示される場合は、**新しい session** を開始するか、その agent で `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## Auth profiles: それが何かと管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントのパターン）

<AccordionGroup>
  <Accordion title="auth profile とは何ですか？">
    auth profile は、provider に紐づく名前付き認証情報レコード（OAuth または APIキー）です。Profiles は次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的な profile ID にはどんなものがありますか？">
    OpenClaw は provider 接頭辞付きの ID を使います。たとえば:

    - `anthropic:default`（メール ID が存在しない場合によく使われる）
    - OAuth ID 用の `anthropic:<email>`
    - 自分で選んだカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="どの auth profile を最初に試すか制御できますか？">
    はい。設定では、profiles の任意メタデータと provider ごとの順序（`auth.order.<provider>`）をサポートしています。これに secrets は保存されません。ID を provider/mode に対応付け、rotation order を設定するだけです。

    OpenClaw は、その profile が短い **cooldown**（レート制限/タイムアウト/auth failure）または長めの **disabled** 状態（課金/残高不足）にある場合、一時的にスキップすることがあります。確認するには `openclaw models status --json` を実行し、`auth.unusableProfiles` を見てください。調整項目: `auth.cooldowns.billingBackoffHours*`。

    レート制限の cooldown は model 単位になることがあります。ある model で
    cooldown 中の profile でも、同じ provider 上の兄弟 model では使用可能なことがあり、
    billing/disabled ウィンドウは引き続き profile 全体をブロックします。

    CLI では、**エージェント単位** の順序 override（その agent の `auth-state.json` に保存）も設定できます:

    ```bash
    # 設定されたデフォルト agent が対象（--agent を省略）
    openclaw models auth order get --provider anthropic

    # rotation を1つの profile に固定（これだけを試す）
    openclaw models auth order set --provider anthropic anthropic:default

    # または明示的な順序を設定（provider 内 fallback）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # override をクリア（config auth.order / round-robin に戻す）
    openclaw models auth order clear --provider anthropic
    ```

    特定の agent を対象にするには:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試されるか確認するには、次を使ってください:

    ```bash
    openclaw models status --probe
    ```

    保存済み profile が明示的順序から外れている場合、probe は
    その profile を黙って試すのではなく `excluded_by_auth_order` として報告します。

  </Accordion>

  <Accordion title="OAuth と APIキーの違いは何ですか？">
    OpenClaw は両方をサポートしています:

    - **OAuth** は多くの場合、サブスクリプションアクセスを活用します（該当する場合）。
    - **API keys** は従量課金です。

    ウィザードでは Anthropic Claude CLI、OpenAI Codex OAuth、API keys を明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## Gateway: ポート、「already running」、remote mode

<AccordionGroup>
  <Accordion title="Gateway はどのポートを使いますか？">
    `gateway.port` が、WebSocket + HTTP（Control UI、hooks など）の単一多重化ポートを制御します。

    優先順位:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='なぜ openclaw gateway status では "Runtime: running" なのに "RPC probe: failed" なのですか？'>
    「running」は **supervisor** の見方（launchd/systemd/schtasks）だからです。RPC probe は、CLI が実際に gateway WebSocket へ接続して `status` を呼び出した結果です。

    `openclaw gateway status` を使い、次の行を信頼してください:

    - `Probe target:`（probe が実際に使った URL）
    - `Listening:`（実際にそのポートで bind しているもの）
    - `Last gateway error:`（プロセスは生きているがポートが listen していないときの一般的な根本原因）

  </Accordion>

  <Accordion title='なぜ openclaw gateway status で "Config (cli)" と "Config (service)" が異なって表示されるのですか？'>
    編集している設定ファイルと、service が実行している設定ファイルが異なっています（多くは `--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

    対処法:

    ```bash
    openclaw gateway install --force
    ```

    service に使わせたいのと同じ `--profile` / environment でこれを実行してください。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" とはどういう意味ですか？'>
    OpenClaw は、起動時にただちに WebSocket listener を bind することでランタイムロックを強制します（デフォルトは `ws://127.0.0.1:18789`）。この bind が `EADDRINUSE` で失敗すると、別のインスタンスがすでに listen していることを示す `GatewayLockError` を投げます。

    対処法: 他方のインスタンスを停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行してください。

  </Accordion>

  <Accordion title="OpenClaw を remote mode（別の場所の Gateway にクライアントが接続するモード）で実行するにはどうすればよいですか？">
    `gateway.mode: "remote"` を設定し、必要に応じて shared-secret remote credentials とともに remote WebSocket URL を指定してください:

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

    注意点:

    - `openclaw gateway` が起動するのは `gateway.mode` が `local` のときだけです（または override flag を渡した場合）。
    - macOS アプリは設定ファイルを監視しており、これらの値が変わると live でモードを切り替えます。
    - `gateway.remote.token` / `.password` はクライアント側の remote credentials のみであり、それ自体では local gateway auth を有効にしません。

  </Accordion>

  <Accordion title='Control UI に "unauthorized" と表示される（または再接続を繰り返す）のはなぜですか？'>
    gateway の auth path と UI の auth method が一致していません。

    事実（コードベース）:

    - Control UI は、現在のブラウザータブの session と選択された gateway URL に対して token を `sessionStorage` に保持するため、同じタブ内でのリフレッシュは、長期的な localStorage token 永続化を復元しなくても機能し続けます。
    - `AUTH_TOKEN_MISMATCH` の場合、trusted clients は、gateway が retry hint（`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`）を返したとき、キャッシュされた device token で1回だけ制限付きリトライを試みることができます。
    - その cached-token retry は、現在では device token とともに保存されたキャッシュ済みの approved scopes を再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し側は、キャッシュされた scopes を継承せず、自身が要求した scope set を維持します。
    - その retry path の外では、connect auth の優先順位は、明示的な shared token/password、次に明示的な `deviceToken`、次に保存済み device token、最後に bootstrap token です。
    - Bootstrap token の scope チェックは role 接頭辞付きです。組み込みの bootstrap operator allowlist は operator request にしか適用されず、node や他の non-operator roles には、自身の role prefix 配下の scopes が引き続き必要です。

    対処法:

    - 最速: `openclaw dashboard`（dashboard URL を表示 + コピーし、開こうとします。headless なら SSH ヒントを表示）。
    - まだ token がない場合: `openclaw doctor --generate-gateway-token`。
    - remote の場合は、まずトンネルします: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開く。
    - shared-secret mode: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を設定し、その matching secret を Control UI settings に貼り付ける。
    - Tailscale Serve mode: `gateway.auth.allowTailscale` が有効であり、Tailscale identity headers を迂回する raw loopback/tailnet URL ではなく Serve URL を開いていることを確認する。
    - trusted-proxy mode: same-host loopback proxy や raw gateway URL ではなく、設定された non-loopback の identity-aware proxy を通っていることを確認する。
    - 1回の retry 後も不一致が続く場合は、paired device token を rotate/re-approve する:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - その rotate call が denied だった場合は、次の2点を確認する:
      - paired-device sessions が rotate できるのは、自分自身の device のみです。ただし `operator.admin` を持つ場合は別です
      - 明示的な `--scope` 値は、呼び出し元の現在の operator scopes を超えることはできません
    - まだ解決しない場合は、`openclaw status --all` を実行し、[トラブルシューティング](/ja-JP/gateway/troubleshooting) に従ってください。auth の詳細は [Dashboard](/web/dashboard) を参照してください。

  </Accordion>

  <Accordion title="gateway.bind を tailnet に設定したのに bind できず、何も listen しません">
    `tailnet` bind は、ネットワークインターフェイスから Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale に参加していない（またはインターフェイスが down している）場合、bind 先がありません。

    対処法:

    - そのホストで Tailscale を起動する（100.x アドレスを持つようにする）、または
    - `gateway.bind: "loopback"` / `"lan"` に切り替える。

    注意: `tailnet` は明示的です。`auto` は loopback を優先します。tailnet 専用 bind にしたい場合は `gateway.bind: "tailnet"` を使ってください。

  </Accordion>

  <Accordion title="同じホストで複数の Gateways を実行できますか？">
    通常はできません。1つの Gateway で複数のメッセージングチャネルと agents を実行できます。複数の Gateways を使うのは、冗長性（例: rescue bot）または強い分離が必要な場合だけです。

    ただし、次を分離すれば可能です:

    - `OPENCLAW_CONFIG_PATH`（インスタンスごとの設定）
    - `OPENCLAW_STATE_DIR`（インスタンスごとの状態）
    - `agents.defaults.workspace`（workspace の分離）
    - `gateway.port`（一意なポート）

    クイックセットアップ（推奨）:

    - インスタンスごとに `openclaw --profile <name> ...` を使う（`~/.openclaw-<name>` を自動作成）。
    - 各 profile 設定で一意の `gateway.port` を設定する（または手動実行時に `--port` を渡す）。
    - profile ごとの service をインストールする: `openclaw --profile <name> gateway install`。

    Profiles は service 名にも接尾辞を付けます（`ai.openclaw.<profile>`、従来の `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`）。
    完全なガイド: [Multiple gateways](/ja-JP/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 とはどういう意味ですか？'>
    Gateway は **WebSocket server** であり、最初のメッセージとして
    `connect` frame が来ることを期待しています。それ以外を受信すると、
    **code 1008**（policy violation）で接続を閉じます。

    よくある原因:

    - ブラウザーで **HTTP** URL（`http://...`）を開いたが、WS client ではなかった。
    - 間違ったポートまたは path を使った。
    - proxy や tunnel が auth headers を取り除いた、または非Gateway request を送った。

    すぐできる対処法:

    1. WS URL を使う: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
    2. 通常のブラウザータブで WS ポートを開かない。
    3. auth が有効なら、`connect` frame に token/password を含める。

    CLI または TUI を使っている場合、URL は次のようになります:

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

    安定したパスは `logging.file` で設定できます。ファイルログレベルは `logging.level` で制御されます。コンソールの詳細度は `--verbose` と `logging.consoleLevel` で制御されます。

    最速のログ追跡:

    ```bash
    openclaw logs --follow
    ```

    service/supervisor ログ（gateway が launchd/systemd 経由で動作している場合）:

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（デフォルト: `~/.openclaw/logs/...`、profiles では `~/.openclaw-<profile>/logs/...`）
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    詳しくは [トラブルシューティング](/ja-JP/gateway/troubleshooting) を参照してください。

  </Accordion>

  <Accordion title="Gateway service を start/stop/restart するにはどうすればよいですか？">
    gateway helper を使用してください:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway を手動で実行している場合、`openclaw gateway --force` でポートを再取得できます。[Gateway](/ja-JP/gateway) を参照してください。

  </Accordion>

  <Accordion title="Windows でターミナルを閉じてしまいました。OpenClaw を再起動するにはどうすればよいですか？">
    Windows には **2つのインストールモード** があります:

    **1) WSL2（推奨）:** Gateway は Linux 内で動作します。

    PowerShell を開き、WSL に入ってから再起動します:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    service を一度もインストールしていない場合は、foreground で起動します:

    ```bash
    openclaw gateway run
    ```

    **2) ネイティブ Windows（非推奨）:** Gateway は Windows 上で直接動作します。

    PowerShell を開いて次を実行します:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    手動実行（service なし）の場合は、次を使います:

    ```powershell
    openclaw gateway run
    ```

    ドキュメント: [Windows (WSL2)](/ja-JP/platforms/windows), [Gateway service runbook](/ja-JP/gateway)。

  </Accordion>

  <Accordion title="Gateway は動いているのに返信が届きません。何を確認すべきですか？">
    まず簡単なヘルス確認から始めてください:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    よくある原因:

    - **gateway host** で model auth が読み込まれていない（`models status` を確認）。
    - channel pairing/allowlist が返信をブロックしている（channel 設定 + ログを確認）。
    - WebChat/Dashboard が正しい token なしで開かれている。

    remote の場合は、tunnel/Tailscale 接続が有効であり、
    Gateway WebSocket に到達できることを確認してください。

    ドキュメント: [Channels](/ja-JP/channels), [トラブルシューティング](/ja-JP/gateway/troubleshooting), [Remote access](/ja-JP/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" と表示されます。どうすればよいですか？'>
    これは通常、UI が WebSocket 接続を失ったことを意味します。次を確認してください:

    1. Gateway は動作していますか？ `openclaw gateway status`
    2. Gateway は正常ですか？ `openclaw status`
    3. UI は正しい token を持っていますか？ `openclaw dashboard`
    4. remote の場合、tunnel/Tailscale 接続は有効ですか？

    その後、ログを追跡してください:

    ```bash
    openclaw logs --follow
    ```

    ドキュメント: [Dashboard](/web/dashboard), [Remote access](/ja-JP/gateway/remote), [トラブルシューティング](/ja-JP/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram の setMyCommands が失敗します。何を確認すべきですか？">
    まずログと channel status を確認してください:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    その後、エラーに対応してください:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram メニューの項目数が多すぎます。OpenClaw はすでに Telegram の上限に合わせて削減し、より少ないコマンドで再試行しますが、それでもいくつかのメニュー項目は削除が必要です。plugin/skill/custom commands を減らすか、メニューが不要なら `channels.telegram.commands.native` を無効にしてください。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`、または類似のネットワークエラー: VPS 上または proxy の背後にいる場合は、`api.telegram.org` への外向き HTTPS が許可されていて DNS が機能していることを確認してください。

    Gateway が remote の場合は、Gateway host 上のログを見ていることを確認してください。

    ドキュメント: [Telegram](/ja-JP/channels/telegram), [Channel troubleshooting](/ja-JP/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI に出力が表示されません。何を確認すべきですか？">
    まず Gateway に到達でき、agent が実行できることを確認してください:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI では、`/status` を使って現在の状態を確認します。チャット
    channel に返信が届くことを期待している場合は、配信が有効（`/deliver on`）であることを確認してください。

    ドキュメント: [TUI](/web/tui), [Slash commands](/ja-JP/tools/slash-commands)。

  </Accordion>

  <Accordion title="Gateway を完全に停止してから起動するにはどうすればよいですか？">
    service をインストールしている場合:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    これにより **supervised service**（macOS では launchd、Linux では systemd）を停止/起動します。
    Gateway をバックグラウンドのデーモンとして動かしている場合に使ってください。

    foreground で実行している場合は、Ctrl-C で停止してから次を実行してください:

    ```bash
    openclaw gateway run
    ```

    ドキュメント: [Gateway service runbook](/ja-JP/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart と openclaw gateway の違い">
    - `openclaw gateway restart`: **バックグラウンド service**（launchd/systemd）を再起動します。
    - `openclaw gateway`: このターミナル session 用に gateway を **foreground** で実行します。

    service をインストールしている場合は gateway commands を使ってください。一時的に foreground で実行したいときは
    `openclaw gateway` を使ってください。

  </Accordion>

  <Accordion title="何かが失敗したときに、最速でもっと詳しい情報を得る方法">
    Gateway を `--verbose` 付きで起動すると、コンソールにより詳しい情報が出ます。その後、ログファイルを確認して channel auth、model routing、RPC errors を調べてください。
  </Accordion>
</AccordionGroup>

## メディアと添付ファイル

<AccordionGroup>
  <Accordion title="skill が画像/PDF を生成したのに、何も送信されませんでした">
    agent からの送信添付ファイルには、`MEDIA:<path-or-url>` 行を含める必要があります（単独の行として）。[OpenClaw assistant setup](/ja-JP/start/openclaw) と [Agent send](/ja-JP/tools/agent-send) を参照してください。

    CLI で送信する場合:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    次も確認してください:

    - 対象 channel が送信メディアをサポートしており、allowlists によってブロックされていないこと。
    - ファイルが provider のサイズ制限内であること（画像は最大 2048px にリサイズされます）。
    - `tools.fs.workspaceOnly=true` では、ローカルパス送信は workspace、temp/media-store、および sandbox で検証済みのファイルに制限されます。
    - `tools.fs.workspaceOnly=false` では、agent がすでに読めるホストローカルファイルを `MEDIA:` で送信できますが、対象はメディアと安全なドキュメント型（画像、音声、動画、PDF、Office ドキュメント）に限られます。プレーンテキストや secret らしいファイルは引き続きブロックされます。

    [Images](/ja-JP/nodes/images) を参照してください。

  </Accordion>
</AccordionGroup>

## セキュリティとアクセス制御

<AccordionGroup>
  <Accordion title="OpenClaw を受信 DM に公開しても安全ですか？">
    受信 DM は信頼できない入力として扱ってください。デフォルトはリスク低減を意図しています:

    - DM 対応 channels のデフォルト動作は **pairing** です:
      - 未知の送信者には pairing code が返され、bot はそのメッセージを処理しません。
      - 承認方法: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 保留中リクエストは **1チャネルあたり3件** までです。コードが届かなかった場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
    - DM を公に開放するには、明示的なオプトインが必要です（`dmPolicy: "open"` と allowlist `"*"`）。

    リスクの高い DM policies を確認するには `openclaw doctor` を実行してください。

  </Accordion>

  <Accordion title="prompt injection は public bots だけの懸念ですか？">
    いいえ。prompt injection は **信頼できないコンテンツ** に関する問題であり、bot に DM できる相手だけの問題ではありません。
    assistant が外部コンテンツ（web search/fetch、browser pages、emails、
    docs、attachments、貼り付けられた logs）を読むなら、そのコンテンツには
    モデルを乗っ取ろうとする命令が含まれている可能性があります。これは **送信者が自分だけの場合でも**
    起こり得ます。

    最大のリスクは tools が有効なときです。モデルがだまされて
    コンテキストを持ち出したり、あなたの代わりに tools を呼び出したりする可能性があります。影響範囲を減らすには:

    - 信頼できないコンテンツを要約するために、読み取り専用または tools 無効の「reader」agent を使う
    - tools 対応 agents では `web_search` / `web_fetch` / `browser` を無効にする
    - デコード済みファイル/ドキュメントテキストも信頼できないものとして扱う: OpenResponses
      `input_file` と media-attachment extraction はどちらも、抽出テキストを生のファイルテキストとして渡す代わりに、
      明示的な external-content boundary markers で包みます
    - sandboxing と厳格な tool allowlists を使う

    詳細: [Security](/ja-JP/gateway/security)。

  </Accordion>

  <Accordion title="bot には専用のメール、GitHub アカウント、または電話番号を持たせるべきですか？">
    はい。多くのセットアップではその方がよいです。bot を別アカウントや別番号で分離すると、
    何か問題が起きたときの影響範囲を減らせます。これにより、
    個人アカウントに影響を与えずに認証情報をローテーションしたり、アクセスを取り消したりしやすくなります。

    小さく始めてください。本当に必要な tools と accounts にだけアクセスを与え、
    必要に応じて後から拡張してください。

    ドキュメント: [Security](/ja-JP/gateway/security), [Pairing](/ja-JP/channels/pairing)。

  </Accordion>

  <Accordion title="自分のテキストメッセージを自律的に処理させることはできますか？また安全ですか？">
    個人メッセージに対する完全な自律性は**推奨しません**。最も安全なパターンは次のとおりです:

    - DM は **pairing mode** または厳格な allowlist に保つ。
    - 代理送信させたいなら **別の番号またはアカウント** を使う。
    - 下書きはさせても、**送信前に承認する**。

    試したい場合は、専用アカウントで行い、分離を維持してください。[Security](/ja-JP/gateway/security) を参照してください。

  </Accordion>

  <Accordion title="個人用アシスタントのタスクには安価なモデルを使えますか？">
    はい。agent がチャット専用で、入力が信頼できるなら **可能** です。より小さい tier は
    命令乗っ取りを受けやすいため、tools 対応 agents や
    信頼できないコンテンツを読む場合には避けてください。どうしても小さいモデルを使うなら、
    tools を厳格に制限し、sandbox 内で実行してください。[Security](/ja-JP/gateway/security) を参照してください。
  </Accordion>

  <Accordion title="Telegram で /start を実行したのに pairing code が届きません">
    pairing code は、未知の送信者が bot にメッセージを送り、
    `dmPolicy: "pairing"` が有効な場合に**のみ**送信されます。`/start` だけではコードは生成されません。

    保留中リクエストを確認してください:

    ```bash
    openclaw pairing list telegram
    ```

    すぐにアクセスしたい場合は、自分の sender id を allowlist に追加するか、その account の `dmPolicy: "open"` を設定してください。

  </Accordion>

  <Accordion title="WhatsApp: 連絡先に勝手にメッセージを送りますか？pairing はどう動作しますか？">
    いいえ。デフォルトの WhatsApp DM policy は **pairing** です。未知の送信者には pairing code だけが返され、そのメッセージは **処理されません**。OpenClaw が返信するのは、受信したチャットまたはあなたが明示的にトリガーした送信だけです。

    pairing を承認するには:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    保留中リクエストを一覧表示するには:

    ```bash
    openclaw pairing list whatsapp
    ```

    ウィザードの電話番号プロンプトは、あなた自身の **allowlist/owner** を設定して自分の DM を許可するために使われます。自動送信用ではありません。個人の WhatsApp 番号で運用する場合は、その番号を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

  </Accordion>
</AccordionGroup>

## チャットコマンド、タスク中断、「止まらない」

<AccordionGroup>
  <Accordion title="内部システムメッセージがチャットに表示されないようにするにはどうすればよいですか？">
    ほとんどの内部メッセージや tool メッセージは、その session で **verbose**、**trace**、または **reasoning** が有効な場合にのみ
    表示されます。

    表示されているチャットで次を実行してください:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    それでもうるさい場合は、Control UI の session settings を確認し、verbose を
    **inherit** にしてください。また、config の bot profile で `verboseDefault` が
    `on` に設定されていないことも確認してください。

    ドキュメント: [Thinking and verbose](/ja-JP/tools/thinking), [Security](/ja-JP/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="実行中のタスクを stop/cancel するにはどうすればよいですか？">
    次のいずれかを **単独メッセージ** として送信してください（スラッシュなし）:

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

    これらは abort trigger です（slash command ではありません）。

    バックグラウンドプロセス（exec tool 由来）の場合は、agent に次を実行するよう依頼できます:

    ```
    process action:kill sessionId:XXX
    ```

    Slash commands の概要: [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

    ほとんどのコマンドは `/` で始まる **単独メッセージ** として送る必要がありますが、一部のショートカット（`/status` など）は allowlisted senders に対してはインラインでも動作します。

  </Accordion>

  <Accordion title='Telegram から Discord メッセージを送るにはどうすればよいですか？（"Cross-context messaging denied"）'>
    OpenClaw はデフォルトで **cross-provider** messaging をブロックします。tool call が
    Telegram にバインドされている場合、明示的に許可しない限り Discord には送信されません。

    agent に対して cross-provider messaging を有効にしてください:

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

    config を編集したら gateway を再起動してください。

  </Accordion>

  <Accordion title='なぜ bot が連投メッセージを「無視」しているように感じるのですか？'>
    queue mode が、新しいメッセージと進行中の run の相互作用を制御します。mode の変更には `/queue` を使ってください:

    - `steer` - 新しいメッセージが現在のタスクを方向転換する
    - `followup` - メッセージを1つずつ実行する
    - `collect` - メッセージをまとめて1回返信する（デフォルト）
    - `steer-backlog` - 今すぐ方向転換し、その後 backlog を処理する
    - `interrupt` - 現在の run を中断して新しく開始する

    followup modes では `debounce:2s cap:25 drop:summarize` のようなオプションも追加できます。

  </Accordion>
</AccordionGroup>

## その他

<AccordionGroup>
  <Accordion title='Anthropic で APIキーを使う場合のデフォルトモデルは何ですか？'>
    OpenClaw では、認証情報とモデル選択は別です。`ANTHROPIC_API_KEY` を設定する（または auth profiles に Anthropic APIキーを保存する）と認証は有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（たとえば `anthropic/claude-sonnet-4-6` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` と表示される場合は、その agent に対する想定 `auth-profiles.json` 内で Anthropic 認証情報を Gateway が見つけられなかったことを意味します。
  </Accordion>
</AccordionGroup>

---

まだ解決しませんか？ [Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。
