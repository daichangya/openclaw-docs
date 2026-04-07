---
read_when:
    - SecretRef 자격 증명 범위를 확인할 때
    - 자격 증명이 `secrets configure` 또는 `secrets apply` 대상인지 감사할 때
    - 자격 증명이 지원 표면 밖에 있는 이유를 확인할 때
summary: 정식 지원 및 미지원 SecretRef 자격 증명 표면
title: SecretRef 자격 증명 표면
x-i18n:
    generated_at: "2026-04-07T06:00:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 211f4b504c5808f7790683066fc2c8b700c705c598f220a264daf971b81cc593
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# SecretRef 자격 증명 표면

이 페이지는 정식 SecretRef 자격 증명 표면을 정의합니다.

범위 의도:

- 범위 포함: OpenClaw가 생성하거나 순환하지 않는, 사용자가 엄격하게 제공한 자격 증명
- 범위 제외: 런타임에 생성되거나 순환되는 자격 증명, OAuth 갱신 자료, 세션 유사 아티팩트

## 지원되는 자격 증명

### `openclaw.json` 대상 (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` via sibling `serviceAccountRef` (호환성 예외)
- `channels.googlechat.accounts.*.serviceAccount` via sibling `serviceAccountRef` (호환성 예외)

### `auth-profiles.json` 대상 (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"`일 때는 미지원)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"`일 때는 미지원)

[//]: # "secretref-supported-list-end"

참고:

- auth-profile 계획 대상에는 `agentId`가 필요합니다.
- 계획 항목은 `profiles.*.key` / `profiles.*.token`을 대상으로 하며 형제 ref(`keyRef` / `tokenRef`)를 기록합니다.
- auth-profile ref는 런타임 해석 및 감사 범위에 포함됩니다.
- OAuth 정책 가드: `auth.profiles.<id>.mode = "oauth"`는 해당 프로필의 SecretRef 입력과 함께 사용할 수 없습니다. 이 정책을 위반하면 시작/리로드 및 auth-profile 해석은 빠르게 실패합니다.
- SecretRef로 관리되는 모델 제공자의 경우, 생성된 `agents/*/agent/models.json` 항목은 `apiKey`/헤더 표면에 대해 비시크릿 마커(해석된 시크릿 값이 아님)를 유지합니다.
- 마커 유지 저장은 소스 권위형입니다. OpenClaw는 해석된 런타임 시크릿 값이 아니라 활성 소스 config 스냅샷(해석 전)에서 마커를 기록합니다.
- 웹 검색의 경우:
  - 명시적 제공자 모드(`tools.web.search.provider` 설정)에서는 선택된 제공자 키만 활성입니다.
  - 자동 모드(`tools.web.search.provider` 미설정)에서는 우선순위로 해석되는 첫 번째 제공자 키만 활성입니다.
  - 자동 모드에서는 선택되지 않은 제공자 ref는 선택될 때까지 비활성으로 처리됩니다.
  - 레거시 `tools.web.search.*` 제공자 경로는 호환성 기간 동안 계속 해석되지만, 정식 SecretRef 표면은 `plugins.entries.<plugin>.config.webSearch.*`입니다.

## 지원되지 않는 자격 증명

범위 밖 자격 증명에는 다음이 포함됩니다.

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

근거:

- 이러한 자격 증명은 생성되거나, 순환되거나, 세션을 보유하거나, 또는 읽기 전용 외부 SecretRef 해석에 맞지 않는 OAuth 내구 클래스입니다.
