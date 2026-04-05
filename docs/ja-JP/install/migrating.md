---
read_when:
    - OpenClawを新しいノートPCやサーバーに移行する場合
    - セッション、認証、チャネルログイン（WhatsAppなど）を保持したい場合
summary: OpenClawのインストールをあるマシンから別のマシンへ移動（移行）する
title: 移行ガイド
x-i18n:
    generated_at: "2026-04-05T12:48:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# OpenClawを新しいマシンへ移行する

このガイドでは、オンボーディングをやり直さずにOpenClaw gatewayを新しいマシンへ移行します。

## 何が移行されるか

**state directory**（デフォルトでは `~/.openclaw/`）と**workspace** をコピーすると、次のものが保持されます:

- **設定** -- `openclaw.json` とすべてのgateway設定
- **認証** -- agentごとの `auth-profiles.json`（APIキー + OAuth）、および `credentials/` 配下のチャネル/プロバイダー状態
- **セッション** -- 会話履歴とagent状態
- **チャネル状態** -- WhatsAppログイン、Telegramセッションなど
- **ワークスペースファイル** -- `MEMORY.md`、`USER.md`、Skills、およびプロンプト

<Tip>
古いマシンで `openclaw status` を実行して、state directoryのパスを確認してください。
カスタムprofileでは `~/.openclaw-<profile>/` または `OPENCLAW_STATE_DIR` で設定したパスを使用します。
</Tip>

## 移行手順

<Steps>
  <Step title="gatewayを停止してバックアップする">
    **古い**マシンで、コピー中にファイルが変化しないようgatewayを停止し、その後アーカイブします:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    複数のprofile（例: `~/.openclaw-work`）を使っている場合は、それぞれを個別にアーカイブしてください。

  </Step>

  <Step title="新しいマシンにOpenClawをインストールする">
    新しいマシンでCLI（必要ならNodeも）を[インストール](/install)してください。
    オンボーディングによって新しい `~/.openclaw/` が作成されても問題ありません。次の手順で上書きします。
  </Step>

  <Step title="state directoryとworkspaceをコピーする">
    `scp`、`rsync -a`、または外部ドライブでアーカイブを転送し、その後展開します:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    隠しディレクトリが含まれていること、およびファイル所有権がgatewayを実行するユーザーと一致していることを確認してください。

  </Step>

  <Step title="doctorを実行して確認する">
    新しいマシンで [Doctor](/gateway/doctor) を実行し、設定移行の適用とサービス修復を行います:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## よくある落とし穴

<AccordionGroup>
  <Accordion title="profileまたはstate-dirの不一致">
    古いgatewayが `--profile` または `OPENCLAW_STATE_DIR` を使っていて、新しい環境で使っていない場合、
    チャネルはログアウト状態に見え、セッションは空になります。
    移行した**同じ**profileまたはstate-dirでgatewayを起動し、その後で `openclaw doctor` を再実行してください。
  </Accordion>

  <Accordion title="openclaw.jsonだけをコピーしている">
    設定ファイルだけでは不十分です。モデル認証プロファイルは
    `agents/<agentId>/agent/auth-profiles.json` 配下にあり、チャネル/プロバイダー状態は依然として
    `credentials/` 配下にあります。必ずstate directory **全体**を移行してください。
  </Accordion>

  <Accordion title="権限と所有権">
    rootとしてコピーした、またはユーザーを切り替えた場合、gatewayが認証情報を読めないことがあります。
    state directoryとworkspaceがgatewayを実行するユーザーによって所有されていることを確認してください。
  </Accordion>

  <Accordion title="remote mode">
    UIが**リモート**gatewayを指している場合、セッションとworkspaceを所有しているのはリモートホストです。
    ローカルノートPCではなく、gatewayホスト自体を移行してください。[FAQ](/help/faq#where-things-live-on-disk) を参照してください。
  </Accordion>

  <Accordion title="バックアップ内のシークレット">
    state directoryには認証プロファイル、チャネル認証情報、そのほかの
    プロバイダー状態が含まれます。
    バックアップは暗号化して保存し、安全でない転送経路は避け、漏えいの疑いがある場合はキーをローテーションしてください。
  </Accordion>
</AccordionGroup>

## 確認チェックリスト

新しいマシンで次を確認してください:

- [ ] `openclaw status` でgatewayが動作中と表示される
- [ ] チャネルが引き続き接続されている（再ペアリング不要）
- [ ] ダッシュボードが開き、既存セッションが表示される
- [ ] ワークスペースファイル（メモリ、設定）が存在する
