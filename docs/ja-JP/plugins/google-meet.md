---
read_when:
    - OpenClaw agentをGoogle Meet通話に参加させたい場合
    - OpenClaw agentに新しいGoogle Meet通話を作成させたい場合
    - Google Meet transportとしてChrome、Chrome node、またはTwilioを設定している場合
summary: 'Google Meet plugin: ChromeまたはTwilioを通じて明示的なMeet URLに参加し、realtime voiceのデフォルトを使用するplugin'
title: Google Meet plugin
x-i18n:
    generated_at: "2026-04-25T13:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw向けGoogle Meet参加者サポート — このpluginは設計上、明示的です。

- 明示的な`https://meet.google.com/...` URLにのみ参加します。
- Google Meet APIを通じて新しいMeet spaceを作成し、返されたURLへ参加できます。
- `realtime` voiceがデフォルトモードです。
- realtime voiceは、より深い推論やtoolが必要な場合に、完全なOpenClaw agentへコールバックできます。
- agentは`mode`で参加動作を選択します。ライブのlisten/talk-backには`realtime`を使い、realtime voice bridgeなしでブラウザ参加/制御するには`transcribe`を使います。
- Authは、個人用Google OAuthまたはすでにサインイン済みのChrome profileから開始します。
- 自動的な同意アナウンスはありません。
- デフォルトのChrome audio backendは`BlackHole 2ch`です。
- Chromeはローカルでも、pairing済みnode host上でも実行できます。
- Twilioは、ダイヤルイン番号に加えて、任意のPINまたはDTMFシーケンスを受け付けます。
- CLIコマンドは`googlemeet`です。`meet`はより広いagent teleconference workflow向けに予約されています。

## クイックスタート

ローカルaudio依存関係をインストールし、backend realtime voice providerを設定します。OpenAIがデフォルトです。Google Gemini Liveも`realtime.provider: "google"`で動作します。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch`は`BlackHole 2ch`仮想audio deviceをインストールします。Homebrewのインストーラーでは、macOSがそのdeviceを公開する前に再起動が必要です。

```bash
sudo reboot
```

再起動後、両方を確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

pluginを有効にします。

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

セットアップを確認します。

```bash
openclaw googlemeet setup
```

setup出力はagentが読めることを意図しています。Chrome profile、audio bridge、node pinning、遅延realtime intro、そしてTwilio delegationが設定されている場合は`voice-call` pluginとTwilio認証情報の準備状況を報告します。`ok: false`のチェックはすべて、agentに参加を依頼する前のブロッカーとして扱ってください。スクリプトまたは機械可読出力には`openclaw googlemeet setup --json`を使用します。

会議に参加する:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、agentに`google_meet` tool経由で参加させます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

新しい会議を作成して参加する:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

参加せずにURLだけを作成する:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create`には2つの経路があります。

- API create: Google Meet OAuth認証情報が設定されている場合に使われます。これは最も決定論的な経路で、ブラウザUI状態に依存しません。
- Browser fallback: OAuth認証情報がない場合に使われます。OpenClawはpinされたChrome nodeを使い、`https://meet.google.com/new`を開き、Googleが実際のmeeting-code URLへリダイレクトするのを待ってから、そのURLを返します。この経路では、node上のOpenClaw Chrome profileがすでにGoogleへサインイン済みである必要があります。ブラウザ自動化はMeet自身の初回マイクプロンプトを処理します。このプロンプトはGoogleログイン失敗として扱われません。
  参加フローと作成フローは、どちらも新しいタブを開く前に既存のMeetタブを再利用しようとします。マッチングでは`authuser`のような無害なURLクエリ文字列は無視されるため、agentの再試行では2つ目のChromeタブを作るのではなく、すでに開いている会議へフォーカスするはずです。

コマンド/tool出力には`source`フィールド（`api`または`browser`）が含まれるため、agentはどの経路が使われたか説明できます。`create`はデフォルトで新しい会議に参加し、`joined: true`とjoin sessionを返します。URLだけを生成するには、CLIでは`create --no-join`を使うか、toolへ`"join": false`を渡してください。

またはagentに「Google Meetを作成し、realtime voiceで参加して、そのリンクを私に送って」と指示できます。agentは`action: "create"`で`google_meet`を呼び、その後、返された`meetingUri`を共有すべきです。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

observe-only / browser-controlの参加には、`"mode": "transcribe"`を設定します。これでは双方向realtime model bridgeは開始されないため、会議内で話し返しません。

realtime session中、`google_meet` statusには、`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後の入力/出力タイムスタンプ、byte counter、bridge closed stateなどのbrowserおよびaudio bridgeの健全性が含まれます。安全なMeetページプロンプトが表示された場合、ブラウザ自動化は可能であればそれを処理します。ログイン、hostによる承認、browser/OS権限プロンプトは、agentが伝えるべき理由とメッセージ付きのmanual actionとして報告されます。

Chromeは、サインイン済みのChrome profileとして参加します。Meetでは、OpenClawが使用するマイク/スピーカーパスに`BlackHole 2ch`を選択してください。きれいな双方向audioのためには、別々の仮想deviceまたはLoopback風グラフを使用してください。最初のsmoke testには1つのBlackHole deviceでも十分ですが、エコーする可能性があります。

### ローカルGateway + Parallels Chrome

VMにChromeを所有させるためだけなら、macOS VM内に完全なOpenClaw Gatewayやmodel APIキーは**不要**です。Gatewayとagentはローカルで実行し、VMではnode hostを実行してください。bundled pluginをVMで一度有効にして、nodeがChromeコマンドを通知するようにします。

どこで何を実行するか:

- Gateway host: OpenClaw Gateway、agent workspace、model/APIキー、realtime provider、Google Meet plugin config。
- Parallels macOS VM: OpenClaw CLI/node host、Google Chrome、SoX、BlackHole 2ch、Googleにサインイン済みのChrome profile。
- VM内で不要なもの: Gateway service、agent config、OpenAI/GPTキー、またはmodel providerセットアップ。

VM依存関係をインストールします。

```bash
brew install blackhole-2ch sox
```

BlackHoleインストール後、macOSが`BlackHole 2ch`を公開するようにVMを再起動します。

```bash
sudo reboot
```

再起動後、VMがaudio deviceとSoXコマンドを認識できることを確認します。

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VMにOpenClawをインストールまたは更新し、その後そこでbundled pluginを有効にします。

```bash
openclaw plugins enable google-meet
```

VMでnode hostを起動します。

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`がLAN IPで、TLSを使用していない場合、信頼されたプライベートネットワーク向けにオプトインしない限り、nodeはその平文WebSocketを拒否します。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

nodeをLaunchAgentとしてインストールする場合も、同じenvironment variableを使います。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`はプロセスenvironmentであり、`openclaw.json`設定ではありません。`openclaw node install`は、インストールコマンドにその変数が存在する場合、LaunchAgent environmentへ保存します。

Gateway hostからnodeを承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gatewayがnodeを認識し、`googlemeet.chrome`とbrowser capability / `browser.proxy`の両方を通知していることを確認します。

```bash
openclaw nodes status
```

Gateway host上で、そのnode経由にMeetをルーティングします。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

これで、Gateway hostから通常どおり参加できます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

またはagentに、`transport: "chrome-node"`で`google_meet` toolを使うよう依頼できます。

セッションを作成または再利用し、既知のフレーズを発話し、セッション健全性を表示するワンコマンドsmoke testには:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

参加中、OpenClawのブラウザ自動化はゲスト名を入力し、Join/Ask to joinをクリックし、表示された場合はMeetの初回「Use microphone」選択を受け入れます。ブラウザのみの会議作成中も、Meetがuse-microphoneボタンを表示しない場合は、同じプロンプトをマイクなしで通過できます。browser profileがサインインされていない、Meetがhost承認待ち、Chromeがマイク/カメラ権限を必要としている、またはMeetが自動化で解決できなかったプロンプトで止まっている場合、join/test-speech結果は`manualActionRequired: true`とともに`manualActionReason`および`manualActionMessage`を報告します。agentは参加の再試行をやめ、その正確なメッセージに現在の`browserUrl`/`browserTitle`を添えて報告し、手動ブラウザ操作が完了した後にのみ再試行すべきです。

`chromeNode.node`が省略されている場合、OpenClawは、接続中のnodeがちょうど1つだけで、そのnodeが`googlemeet.chrome`とbrowser controlの両方を通知しているときにのみ自動選択します。複数の対応nodeが接続されている場合は、`chromeNode.node`にnode id、display name、またはremote IPを設定してください。

一般的な失敗チェック:

- `No connected Google Meet-capable node`: VM内で`openclaw node run`を開始し、pairingを承認し、VM内で`openclaw plugins enable google-meet`と`openclaw plugins enable browser`の両方が実行されたことを確認してください。また、Gateway hostが`gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`で両方のnode commandを許可していることも確認してください。
- `BlackHole 2ch audio device not found on the node`: VMに`blackhole-2ch`をインストールし、VMを再起動してください。
- Chromeは開くが参加できない: VM内のbrowser profileへサインインするか、ゲスト参加のために`chrome.guestName`を設定したままにしてください。ゲスト自動参加は、node browser proxyを通じたOpenClaw browser automationを使います。node browser configが、使用したいprofile、たとえば`browser.defaultProfile: "user"`または名前付きexisting-session profileを指していることを確認してください。
- 重複したMeetタブ: `chrome.reuseExistingTab: true`を有効のままにしてください。OpenClawは新しいタブを開く前に同じMeet URLの既存タブをアクティブ化し、browser会議作成でも新しいものを開く前に進行中の`https://meet.google.com/new`またはGoogle account promptタブを再利用します。
- 音が出ない: Meetで、OpenClawが使用する仮想audio device経路へマイク/スピーカーをルーティングしてください。きれいな双方向audioには、別々の仮想deviceまたはLoopback風ルーティングを使ってください。

## インストールに関する注記

Chrome realtimeデフォルトでは、2つの外部toolを使用します。

- `sox`: コマンドラインaudio utility。pluginは、デフォルトの8 kHz G.711 mu-law audio bridgeのために`rec`と`play`コマンドを使用します。
- `blackhole-2ch`: macOS仮想audio driver。Chrome/Meetがルーティングできる`BlackHole 2ch` audio deviceを作成します。

OpenClawは、どちらのpackageも同梱または再配布しません。ドキュメントでは、Homebrew経由でhost依存関係としてインストールするよう案内しています。SoXのライセンスは`LGPL-2.0-only AND GPL-2.0-only`、BlackHoleはGPL-3.0です。OpenClawと一緒にBlackHoleを同梱するインストーラーやアプライアンスを作る場合は、BlackHole上流のライセンス条件を確認するか、Existential Audioから別ライセンスを取得してください。

## Transports

### Chrome

Chrome transportはGoogle ChromeでMeet URLを開き、サインイン済みのChrome profileとして参加します。macOSでは、pluginは起動前に`BlackHole 2ch`を確認します。設定されている場合は、Chromeを開く前にaudio bridge healthコマンドと起動コマンドも実行します。Chrome/audioがGateway host上にある場合は`chrome`を使用し、Parallels macOS VMのようなpairing済みnode上にある場合は`chrome-node`を使用してください。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chromeのマイクとスピーカーaudioを、ローカルのOpenClaw audio bridge経由でルーティングします。`BlackHole 2ch`がインストールされていない場合、audio pathなしで黙って参加するのではなく、joinはsetup errorで失敗します。

### Twilio

Twilio transportは、Voice Call pluginへ委譲される厳格なdial planです。Meetページから電話番号を解析しません。

これは、Chrome参加が使えない場合や、電話ダイヤルインのfallbackが欲しい場合に使用します。Google Meetは、その会議の電話ダイヤルイン番号とPINを公開している必要があります。OpenClawはそれらをMeetページから検出しません。

Voice Call pluginは、Chrome node上ではなくGateway host上で有効にしてください。

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Twilio認証情報はenvironmentまたはconfig経由で指定します。environmentを使うとsecretを`openclaw.json`に置かずに済みます。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call`を有効化した後はGatewayを再起動またはreloadしてください。plugin config変更は、すでに動作中のGateway processにはreloadされるまで反映されません。

その後、確認します。

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio delegationが正しく配線されている場合、`googlemeet setup`には成功した
`twilio-voice-call-plugin`と`twilio-voice-call-credentials`チェックが含まれます。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

会議にカスタムシーケンスが必要な場合は`--dtmf-sequence`を使用します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuthとpreflight

Meetリンク作成にOAuthは必須ではありません。`googlemeet create`はbrowser automationへフォールバックできるからです。正式なAPI create、space解決、またはMeet Media API preflightチェックを使いたい場合はOAuthを設定してください。

Google Meet APIアクセスはユーザーOAuthを使用します。Google Cloud OAuth clientを作成し、必要なscopeを要求し、Google accountで認可し、その結果のrefresh tokenをGoogle Meet plugin configへ保存するか、`OPENCLAW_GOOGLE_MEET_*` environment variablesを指定します。

OAuthはChrome join pathを置き換えません。browser参加を使う場合、ChromeおよびChrome-node transportは引き続きサインイン済みChrome profile、BlackHole/SoX、および接続済みnode経由で参加します。OAuthは正式なGoogle Meet API経路専用です。会議spaceの作成、space解決、Meet Media API preflightチェックを行います。

### Google認証情報を作成する

Google Cloud Consoleで:

1. Google Cloud projectを作成または選択します。
2. そのprojectで**Google Meet REST API**を有効にします。
3. OAuth consent screenを設定します。
   - Google Workspace organizationでは**Internal**が最も簡単です。
   - 個人用/テスト構成では**External**が使えます。アプリがTesting状態の間は、アプリを認可する各Google accountをtest userとして追加してください。
4. OpenClawが要求するscopeを追加します。
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth client IDを作成します。
   - アプリケーション種別: **Web application**。
   - 許可されたredirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. client IDとclient secretをコピーします。

`meetings.space.created`はGoogle Meetの`spaces.create`に必要です。`meetings.space.readonly`により、OpenClawはMeet URL/codeをspaceへ解決できます。`meetings.conference.media.readonly`はMeet Media APIのpreflightおよびmedia作業向けです。実際のMedia API利用にはGoogleがDeveloper Preview参加を要求する可能性があります。browserベースのChrome joinだけが必要なら、OAuthは完全に省略できます。

### refresh tokenを発行する

`oauth.clientId`と必要に応じて`oauth.clientSecret`を設定するか、environment variablesとして渡してから、次を実行します。

```bash
openclaw googlemeet auth login --json
```

このコマンドは、refresh token付きの`oauth` config blockを出力します。PKCE、`http://localhost:8085/oauth2callback`でのlocalhost callback、および`--manual`による手動コピー/ペーストフローを使います。

例:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

browserがローカルcallbackへ到達できない場合はmanual modeを使います。

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON出力には次が含まれます。

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

`oauth` objectをGoogle Meet plugin config配下へ保存します。

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

refresh tokenをconfigに置きたくない場合はenvironment variablesを推奨します。configとenvironmentの両方が存在する場合、pluginはまずconfigを解決し、その後environment fallbackを使います。

OAuth consentには、Meet space作成、Meet space読み取りアクセス、Meet conference media読み取りアクセスが含まれます。meeting creationサポートが存在する前に認証した場合は、refresh tokenが`meetings.space.created` scopeを持つように、`openclaw googlemeet auth login --json`を再実行してください。

### doctorでOAuthを確認する

高速でsecretを表示しない健全性チェックが欲しい場合は、OAuth doctorを実行します。

```bash
openclaw googlemeet doctor --oauth --json
```

これはChrome runtimeを読み込まず、接続済みChrome nodeも不要です。OAuth configが存在し、refresh tokenでaccess tokenを発行できるかを確認します。JSONレポートには`ok`、`configured`、`tokenSource`、`expiresAt`、check messageのようなstatus fieldのみが含まれ、access token、refresh token、client secretは表示されません。

一般的な結果:

| Check | 意味 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config` | `oauth.clientId`と`oauth.refreshToken`、またはキャッシュ済みaccess tokenが存在する。 |
| `oauth-token` | キャッシュ済みaccess tokenがまだ有効、またはrefresh tokenが新しいaccess tokenを発行した。 |
| `meet-spaces-get` | 任意の`--meeting`チェックで既存Meet spaceを解決した。 |
| `meet-spaces-create` | 任意の`--create-space`チェックで新しいMeet spaceを作成した。 |

Google Meet API有効化と`spaces.create` scopeも含めて証明するには、副作用のあるcreateチェックを実行します。

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`は使い捨てのMeet URLを作成します。Google Cloud projectでMeet APIが有効であり、認可されたaccountが`meetings.space.created` scopeを持っていることを確認したい場合に使います。

既存meeting spaceに対する読み取りアクセスを証明するには:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting`と`resolve-space`は、認可済みGoogle accountがアクセス可能な既存spaceへの読み取りアクセスを証明します。これらのチェックで`403`が返る場合、通常はGoogle Meet REST APIが無効、同意済みrefresh tokenに必要なscopeが不足、またはGoogle accountがそのMeet spaceへアクセスできないことを意味します。refresh-tokenエラーの場合は、`openclaw googlemeet auth login --json`を再実行し、新しい`oauth` blockを保存してください。

browser fallbackにはOAuth認証情報は不要です。そのモードでは、Google authはOpenClaw configではなく、選択したnode上のサインイン済みChrome profileから取得されます。

次のenvironment variablesがfallbackとして受け付けられます。

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID`または`GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`または`GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN`または`GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`または`GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`または
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING`または`GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK`または`GOOGLE_MEET_PREVIEW_ACK`

Meet URL、code、または`spaces/{id}`を`spaces.get`経由で解決する:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

media作業の前にpreflightを実行する:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meetがconference recordを作成した後、meeting artifactとattendanceを一覧表示する:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting`を使う場合、`artifacts`と`attendance`はデフォルトで最新のconference recordを使用します。そのmeetingに保持されているすべてのrecordが欲しい場合は`--all-conference-records`を渡してください。

Calendar lookupでは、Meet artifactを読む前にGoogle Calendarからmeeting URLを解決できます。

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`は、Google Meetリンクを持つCalendar eventを今日の`primary` calendarから検索します。一致するevent textを検索するには`--event <query>`を使い、primary以外のcalendarには`--calendar <id>`を使います。Calendar lookupには、Calendar events readonly scopeを含む新しいOAuth loginが必要です。`calendar-events`は、一致するMeet eventをプレビューし、`latest`、`artifacts`、`attendance`、または`export`が選ぶeventに印を付けます。

すでにconference record idが分かっている場合は、直接それを指定します。

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

読みやすいレポートを書き出す:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts`は、Googleがその会議で公開している場合、conference recordメタデータに加えて、participant、recording、transcript、構造化されたtranscript-entry、smart-note resourceメタデータを返します。大規模な会議でentry lookupを省略するには`--no-transcript-entries`を使用してください。`attendance`は、participantをparticipant-session行へ展開し、初回/最終確認時刻、合計session継続時間、late/early-leaveフラグ、およびサインイン済みユーザーまたは表示名で統合された重複participant resourceを含めます。生のparticipant resourceを分けたままにするには`--no-merge-duplicates`を、late検出を調整するには`--late-after-minutes`を、early-leave検出を調整するには`--early-before-minutes`を渡してください。

`export`は、`summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json`、`manifest.json`を含むフォルダを書き出します。`manifest.json`には、選択された入力、exportオプション、conference record、出力ファイル、件数、token source、使用されたCalendar event、および部分取得警告が記録されます。フォルダの横に持ち運び可能なアーカイブも書き出すには`--zip`を渡してください。リンクされたtranscriptとsmart-note Google DocsテキストをGoogle Drive `files.export`経由でexportするには`--include-doc-bodies`を渡してください。これには、Drive Meet readonly scopeを含む新しいOAuth loginが必要です。`--include-doc-bodies`なしでは、exportにはMeetメタデータと構造化transcript entryのみが含まれます。Googleが、smart-note listing、transcript-entry、Drive document-bodyエラーのような部分artifact failureを返した場合、summaryとmanifestはexport全体を失敗にする代わりに、その警告を保持します。`--dry-run`を使うと、同じartifact/attendanceデータを取得してmanifest JSONを表示するだけで、フォルダやZIPは作成しません。これは、大きなexportを書き出す前や、agentが件数、選択record、警告だけを必要とする場合に便利です。

agentは`google_meet` toolを通じて同じbundleを作成することもできます。

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ファイル書き込みをスキップしてexport manifestだけを返すには`"dryRun": true`を設定してください。

実際の保持済みmeetingに対して、ガード付きlive smokeを実行します。

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

live smoke environment:

- `OPENCLAW_LIVE_TEST=1`でガード付きlive testを有効化します。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`は、保持済みのMeet URL、code、または`spaces/{id}`を指します。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID`または`GOOGLE_MEET_CLIENT_ID`はOAuth client idを提供します。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN`または`GOOGLE_MEET_REFRESH_TOKEN`はrefresh tokenを提供します。
- 任意: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`、および
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`は、`OPENCLAW_`プレフィックスなしの同じfallback名も使用します。

基本的なartifact/attendance live smokeには、
`https://www.googleapis.com/auth/meetings.space.readonly`および
`https://www.googleapis.com/auth/meetings.conference.media.readonly`が必要です。Calendar
lookupには`https://www.googleapis.com/auth/calendar.events.readonly`が必要です。Drive
document-body exportには
`https://www.googleapis.com/auth/drive.meet.readonly`が必要です。

新しいMeet spaceを作成する:

```bash
openclaw googlemeet create
```

このコマンドは、新しい`meeting uri`、source、およびjoin sessionを表示します。OAuth認証情報があれば正式なGoogle Meet APIを使用します。OAuth認証情報がなければ、pinされたChrome nodeのサインイン済みbrowser profileをfallbackとして使います。agentは`action: "create"`で`google_meet` toolを使って、1ステップで作成と参加を行えます。URLだけを作成するには、`"join": false`を渡してください。

browser fallbackからのJSON出力例:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

browser fallbackが、URLを作成する前にGoogleログインまたはMeet権限ブロッカーに当たった場合、Gateway methodは失敗応答を返し、`google_meet` toolは単なる文字列ではなく構造化された詳細を返します。

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

agentが`manualActionRequired: true`を見た場合、`manualActionMessage`とbrowser node/tab contextを報告し、オペレーターがブラウザ手順を完了するまで新しいMeetタブを開くのをやめるべきです。

API createからのJSON出力例:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Meetの作成はデフォルトで参加も行います。ChromeまたはChrome-node transportでは、browser経由で参加するために、依然としてサインイン済みGoogle Chrome profileが必要です。profileがサインアウトされている場合、OpenClawは`manualActionRequired: true`またはbrowser fallback errorを報告し、再試行前にオペレーターへGoogleログイン完了を求めます。

Cloud project、OAuth principal、および会議参加者がMeet media API向けGoogle Workspace Developer Preview Programに登録されていることを確認した後にのみ、`preview.enrollmentAcknowledged: true`を設定してください。

## Config

一般的なChrome realtime経路では、pluginの有効化、BlackHole、SoX、およびbackend realtime voice provider keyだけが必要です。OpenAIがデフォルトです。Google Gemini Liveを使うには`realtime.provider: "google"`を設定してください。

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

plugin configは`plugins.entries.google-meet.config`配下へ設定します。

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

デフォルト:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: `chrome-node`用の任意のnode id/name/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: サインアウト状態のMeetゲスト画面で使う名前
- `chrome.autoJoin: true`: `chrome-node`でのOpenClaw browser automationによるベストエフォートのguest-name入力とJoin Nowクリック
- `chrome.reuseExistingTab: true`: 重複を開く代わりに既存Meetタブをアクティブ化
- `chrome.waitForInCallMs: 20000`: realtime introを発動する前にMeetタブがin-callを報告するまで待つ
- `chrome.audioInputCommand`: stdoutへ8 kHz G.711 mu-law
  audioを書き出すSoX `rec`コマンド
- `chrome.audioOutputCommand`: stdinから8 kHz G.711 mu-law
  audioを読むSoX `play`コマンド
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: より深い回答には
  `openclaw_agent_consult`を使う、短い発話返信
- `realtime.introMessage`: realtime bridge
  接続時の短い発話準備確認。無言で参加するには`""`に設定

任意の上書き:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Twilio専用config:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled`のデフォルトは`true`です。Twilio transportでは、実際のPSTN通話とDTMFをVoice Call pluginへ委譲します。`voice-call`が有効でない場合でも、Google Meetはdial planの検証と記録はできますが、Twilio通話は発信できません。

## Tool

agentは`google_meet` toolを使用できます。

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ChromeがGateway host上で動作している場合は`transport: "chrome"`を使用します。Parallels
VMのようなpairing済みnode上でChromeが動作している場合は`transport: "chrome-node"`を使用します。どちらの場合でも、realtime modelと`openclaw_agent_consult`はGateway host上で動作するため、model認証情報はそこに留まります。

アクティブsession一覧やsession ID確認には`action: "status"`を使用します。realtime agentに即座に発話させるには、`sessionId`と`message`付きで`action: "speak"`を使用します。sessionを作成または再利用し、既知のフレーズをトリガーし、Chrome hostが報告できる場合は`inCall`健全性を返すには`action: "test_speech"`を使用します。sessionを終了済みとマークするには`action: "leave"`を使用します。

`status`には、利用可能な場合、Chrome健全性が含まれます。

- `inCall`: ChromeがMeet通話内にいるように見える
- `micMuted`: ベストエフォートのMeetマイク状態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 発話が動作する前にbrowser profileで手動ログイン、Meet host承認、権限、またはbrowser-control修復が必要
- `providerConnected` / `realtimeReady`: realtime voice bridge状態
- `lastInputAt` / `lastOutputAt`: bridgeから受信またはbridgeへ送信した最後のaudio時刻

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime agent consult

Chrome realtime modeは、ライブ音声ループ向けに最適化されています。realtime voice
providerはmeeting audioを聞き取り、設定されたaudio bridge経由で発話します。realtime modelがより深い推論、最新情報、または通常のOpenClaw toolを必要とするときは、`openclaw_agent_consult`を呼び出せます。

consult toolは、最近のmeeting transcript contextとともに、裏側で通常のOpenClaw agentを実行し、簡潔な発話用回答をrealtime voice sessionへ返します。その後、voice modelはその回答を会議へ話し返せます。これはVoice Callと同じ共有realtime consult toolを使用します。

`realtime.toolPolicy`はconsult実行を制御します。

- `safe-read-only`: consult toolを公開し、通常agentを
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、および
  `memory_get`に制限する
- `owner`: consult toolを公開し、通常agentに通常の
  agent tool policyを使わせる
- `none`: consult toolをrealtime voice modelへ公開しない

consult session keyはMeet sessionごとにスコープされるため、同じ会議中の後続consult呼び出しでは以前のconsult contextを再利用できます。

Chromeが通話へ完全参加した後に、発話準備確認を強制するには:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完全なjoin-and-speak smokeには:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## ライブテストチェックリスト

会議を無人agentへ引き渡す前に、この手順を使ってください。

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

期待されるChrome-node状態:

- `googlemeet setup`はすべてgreenである。
- `chrome-node`がデフォルトtransportであるか、nodeがpinされている場合、`googlemeet setup`に`chrome-node-connected`が含まれる。
- `nodes status`に選択されたnodeが接続済みで表示される。
- 選択されたnodeが`googlemeet.chrome`と`browser.proxy`の両方を通知している。
- Meetタブが通話に参加し、`test-speech`が`inCall: true`付きのChrome健全性を返す。

Parallels macOS VMのようなリモートChrome hostでは、GatewayまたはVMを更新した後の最短で安全な確認は次のとおりです。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

これにより、agentが実際のmeetingタブを開く前に、Gateway pluginが読み込まれていること、VM nodeが現在のtokenで接続されていること、およびMeet audio bridgeが利用可能であることが証明されます。

Twilio smokeには、電話ダイヤルイン詳細を公開しているmeetingを使用します。

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

期待されるTwilio状態:

- `googlemeet setup`にgreenの`twilio-voice-call-plugin`と
  `twilio-voice-call-credentials`チェックが含まれる。
- Gateway reload後、CLIで`voicecall`が利用可能である。
- 返されるsessionに`transport: "twilio"`と`twilio.voiceCallId`が含まれる。
- `googlemeet leave <sessionId>`で委譲されたvoice callが切断される。

## トラブルシューティング

### agentからGoogle Meet toolが見えない

Gateway configでpluginが有効になっていることを確認し、Gatewayをreloadしてください。

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet`を編集した直後なら、Gatewayを再起動またはreloadしてください。実行中のagentから見えるのは、現在のGateway processで登録されたplugin toolだけです。

### 接続済みのGoogle Meet対応nodeがない

node host上で次を実行します。

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway host上でnodeを承認し、コマンドを確認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

nodeは接続済みで、`googlemeet.chrome`と`browser.proxy`を一覧表示している必要があります。Gateway configでは、それらのnode commandを許可している必要があります。

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`が`chrome-node-connected`で失敗する場合、またはGateway logに
`gateway token mismatch`が報告される場合は、現在のGateway tokenでnodeを再インストールまたは再起動してください。LAN Gatewayでは通常、次のようになります。

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

その後、node serviceをreloadし、再実行します。

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### browserは開くがagentが参加できない

`googlemeet test-speech`を実行し、返されたChrome健全性を確認してください。
`manualActionRequired: true`を報告している場合は、`manualActionMessage`をオペレーターへ表示し、ブラウザ操作が完了するまで再試行をやめてください。

一般的な手動操作:

- Chrome profileへサインインする。
- Meet host accountからゲストを承認する。
- Chromeのネイティブ権限プロンプトが表示されたら、マイク/カメラ権限を付与する。
- 固まったMeet権限ダイアログを閉じるか修復する。

Meetに「Do you want people to hear you in the meeting?」と表示されているだけで「サインインしていない」と報告しないでください。これはMeetのaudio-choiceインタースティシャルです。OpenClawは、利用可能な場合、browser automationを通じて**Use microphone**をクリックし、実際のmeeting状態を待ち続けます。create-only browser fallbackでは、URL作成にはrealtime audio pathが不要なため、OpenClawは**Continue without microphone**をクリックすることがあります。

### meeting作成に失敗する

`googlemeet create`は、OAuth認証情報が設定されている場合、まずGoogle Meet APIの`spaces.create`エンドポイントを使用します。OAuth認証情報がない場合は、pinされたChrome node browserへフォールバックします。次を確認してください。

- API作成の場合: `oauth.clientId`と`oauth.refreshToken`が設定されている、または一致する`OPENCLAW_GOOGLE_MEET_*` environment variablesが存在する。
- API作成の場合: refresh tokenがcreateサポート追加後に発行されている。古いtokenには`meetings.space.created` scopeがない可能性があります。`openclaw googlemeet auth login --json`を再実行し、plugin configを更新してください。
- browser fallbackの場合: `defaultTransport: "chrome-node"`および
  `chromeNode.node`が、`browser.proxy`と
  `googlemeet.chrome`を持つ接続済みnodeを指している。
- browser fallbackの場合: そのnode上のOpenClaw Chrome profileがGoogleへサインイン済みで、`https://meet.google.com/new`を開ける。
- browser fallbackの場合: 再試行では、新しいタブを開く前に既存の`https://meet.google.com/new`またはGoogle account promptタブを再利用する。agentがタイムアウトした場合は、別のMeetタブを手動で開くのではなく、tool呼び出しを再試行してください。
- browser fallbackの場合: toolが`manualActionRequired: true`を返したら、返された`browser.nodeId`、`browser.targetId`、`browserUrl`、および
  `manualActionMessage`を使ってオペレーターを案内する。その操作が完了するまでループ再試行しないでください。
- browser fallbackの場合: Meetに「Do you want people to hear you in the
  meeting?」と表示されたら、タブを開いたままにしてください。OpenClawは、browser
  automationを通じて**Use microphone**、またはcreate-only fallbackでは**Continue without microphone**をクリックし、生成されたMeet URLを待ち続けるはずです。それができない場合、エラーには`google-login-required`ではなく`meet-audio-choice-required`と記載されるべきです。

### agentは参加するが話さない

realtime経路を確認してください。

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

listen/talk-backには`mode: "realtime"`を使用してください。`mode: "transcribe"`では意図的に双方向realtime voice bridgeを開始しません。

次も確認してください。

- `OPENAI_API_KEY`や`GEMINI_API_KEY`のようなrealtime provider keyがGateway host上で利用可能である。
- `BlackHole 2ch`がChrome host上で見えている。
- `rec`と`play`がChrome host上に存在する。
- Meetのマイクとスピーカーが、OpenClawが使う仮想audio path経由にルーティングされている。

`googlemeet doctor [session-id]`は、session、node、in-call状態、
manual action reason、realtime provider接続、`realtimeReady`、audio
input/output activity、最後のaudioタイムスタンプ、byte counter、およびbrowser URLを表示します。生のJSONが必要な場合は`googlemeet status [session-id]`を使用してください。tokenを表示せずにGoogle Meet OAuth refreshを確認するには`googlemeet doctor --oauth`を使用し、Google Meet API証明も必要な場合は`--meeting`または`--create-space`を追加してください。

agentがタイムアウトし、すでに開いているMeetタブが見えている場合は、別のタブを開かずにそのタブを調査します。

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

対応するtool actionは`recover_current_tab`です。これは設定済みChrome node上の既存Meetタブへフォーカスして調査します。新しいタブを開いたり新しいsessionを作成したりせず、ログイン、承認、権限、またはaudio-choice状態のような現在のblockerを報告します。CLIコマンドは設定済みGatewayと通信するため、Gatewayは起動中であり、Chrome nodeは接続済みである必要があります。

### Twilio setupチェックが失敗する

`voice-call`が許可または有効化されていない場合、`twilio-voice-call-plugin`は失敗します。`plugins.allow`へ追加し、`plugins.entries.voice-call`を有効にして、Gatewayをreloadしてください。

Twilio backendにaccount SID、auth token、またはcaller numberが不足している場合、`twilio-voice-call-credentials`は失敗します。Gateway host上で次を設定してください。

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

その後、Gatewayを再起動またはreloadし、次を実行します。

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`はデフォルトで準備確認のみです。特定番号へのdry-runには:

```bash
openclaw voicecall smoke --to "+15555550123"
```

実際に外向きnotify callを発信したい場合にのみ`--yes`を追加してください。

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio通話は始まるがmeetingに入らない

Meet eventが電話ダイヤルイン詳細を公開していることを確認してください。正確なdial-in
numberとPIN、またはカスタムDTMFシーケンスを渡します。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

PIN入力前に待機が必要なproviderでは、`--dtmf-sequence`内で先頭の`w`またはカンマを使用してください。

## 注意

Google Meetの公式media APIは受信寄りのため、Meet通話へ発話するには依然としてparticipant pathが必要です。このpluginはその境界を明確に保ちます。Chromeはbrowser参加とローカルaudio routingを担当し、Twilioは電話ダイヤルイン参加を担当します。

Chrome realtime modeには次のいずれかが必要です。

- `chrome.audioInputCommand`と`chrome.audioOutputCommand`: OpenClawが
  realtime model bridgeを所有し、それらのコマンドと選択されたrealtime voice providerの間で8 kHz G.711 mu-law audioを中継する。
- `chrome.audioBridgeCommand`: 外部bridge commandがローカルaudio path全体を所有し、そのdaemonの起動または検証後に終了しなければならない。

きれいな双方向audioのためには、Meet出力とMeetマイクを別々の仮想device、またはLoopback風の仮想device graphを通してルーティングしてください。1つの共有BlackHole deviceでは、他の参加者の音声が通話へエコーする可能性があります。

`googlemeet speak`は、Chrome session用のアクティブなrealtime audio bridgeをトリガーします。`googlemeet leave`はそのbridgeを停止します。Voice Call plugin経由で委譲されたTwilio sessionでは、`leave`は基盤のvoice callも切断します。

## 関連

- [Voice call plugin](/ja-JP/plugins/voice-call)
- [Talk mode](/ja-JP/nodes/talk)
- [Building plugins](/ja-JP/plugins/building-plugins)
