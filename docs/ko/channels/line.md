---
read_when:
    - OpenClaw를 LINE에 연결하려고 합니다
    - LINE Webhook 및 자격 증명 설정이 필요합니다
    - LINE 전용 메시지 옵션이 필요합니다
summary: LINE Messaging API Plugin 설정, 구성 및 사용 방법
title: LINE
x-i18n:
    generated_at: "2026-04-24T06:03:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE는 LINE Messaging API를 통해 OpenClaw에 연결됩니다. 이 Plugin은 Gateway에서 Webhook 수신기로 실행되며, 인증에 채널 액세스 토큰과 채널 시크릿을 사용합니다.

상태: 번들 Plugin. 다이렉트 메시지, 그룹 채팅, 미디어, 위치, Flex 메시지, 템플릿 메시지, 빠른 답장이 지원됩니다. 반응과 스레드는 지원되지 않습니다.

## 번들 Plugin

LINE는 현재 OpenClaw 릴리스에서 번들 Plugin으로 제공되므로, 일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

구버전 빌드 또는 LINE가 제외된 사용자 지정 설치를 사용하는 경우에는 수동으로 설치하세요.

```bash
openclaw plugins install @openclaw/line
```

로컬 체크아웃(깃 리포지토리에서 실행 중인 경우):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 설정

1. LINE Developers 계정을 만들고 Console을 엽니다:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider를 만들거나 선택한 뒤 **Messaging API** 채널을 추가합니다.
3. 채널 설정에서 **Channel access token**과 **Channel secret**을 복사합니다.
4. Messaging API 설정에서 **Use webhook**을 활성화합니다.
5. Webhook URL을 Gateway 엔드포인트로 설정합니다(HTTPS 필수).

```
https://gateway-host/line/webhook
```

Gateway는 LINE의 Webhook 검증(GET)과 인바운드 이벤트(POST)에 응답합니다.
사용자 지정 경로가 필요하면 `channels.line.webhookPath` 또는
`channels.line.accounts.<id>.webhookPath`를 설정하고 그에 맞게 URL을 업데이트하세요.

보안 참고:

- LINE 서명 검증은 본문에 종속적입니다(원시 본문에 대한 HMAC). 따라서 OpenClaw는 검증 전에 엄격한 사전 인증 본문 크기 제한과 타임아웃을 적용합니다.
- OpenClaw는 검증된 원시 요청 바이트에서 Webhook 이벤트를 처리합니다. 시그니처 무결성 안전을 위해 업스트림 미들웨어가 변환한 `req.body` 값은 무시됩니다.

## 구성

최소 구성:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

환경 변수(기본 계정만):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

토큰/시크릿 파일:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile`과 `secretFile`은 일반 파일을 가리켜야 합니다. 심볼릭 링크는 거부됩니다.

여러 계정:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 접근 제어

다이렉트 메시지는 기본적으로 페어링을 사용합니다. 알 수 없는 발신자에게는 페어링 코드가 제공되며, 승인될 때까지 해당 메시지는 무시됩니다.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

허용 목록 및 정책:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM용 허용 목록 LINE 사용자 ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: 그룹용 허용 목록 LINE 사용자 ID
- 그룹별 재정의: `channels.line.groups.<groupId>.allowFrom`
- 런타임 참고: `channels.line`이 완전히 누락된 경우, 런타임은 그룹 검사에 대해 `groupPolicy="allowlist"`로 폴백합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 마찬가지).

LINE ID는 대소문자를 구분합니다. 유효한 ID 형식은 다음과 같습니다.

- 사용자: `U` + 32자리 16진수 문자
- 그룹: `C` + 32자리 16진수 문자
- 룸: `R` + 32자리 16진수 문자

## 메시지 동작

- 텍스트는 5000자 단위로 분할됩니다.
- Markdown 서식은 제거되며, 코드 블록과 표는 가능하면 Flex 카드로 변환됩니다.
- 스트리밍 응답은 버퍼링되며, 에이전트가 작업하는 동안 LINE는 로딩 애니메이션과 함께 전체 청크를 받습니다.
- 미디어 다운로드는 `channels.line.mediaMaxMb`(기본값 10)로 제한됩니다.

## 채널 데이터(리치 메시지)

빠른 답장, 위치, Flex 카드 또는 템플릿 메시지를 보내려면 `channelData.line`을 사용하세요.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin에는 Flex 메시지 프리셋용 `/card` 명령도 포함되어 있습니다.

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 지원

LINE는 ACP(Agent Communication Protocol) 대화 바인딩을 지원합니다.

- `/acp spawn <agent> --bind here`는 하위 스레드를 만들지 않고 현재 LINE 채팅을 ACP 세션에 바인딩합니다.
- 구성된 ACP 바인딩과 활성 대화 바인딩 ACP 세션은 LINE에서 다른 대화 채널과 동일하게 동작합니다.

자세한 내용은 [ACP 에이전트](/ko/tools/acp-agents)를 참고하세요.

## 아웃바운드 미디어

LINE Plugin은 에이전트 메시지 도구를 통해 이미지, 비디오, 오디오 파일 전송을 지원합니다. 미디어는 적절한 미리보기 및 추적 처리를 포함한 LINE 전용 전달 경로를 통해 전송됩니다.

- **이미지**: 자동 미리보기 생성과 함께 LINE 이미지 메시지로 전송됩니다.
- **비디오**: 명시적인 미리보기 및 콘텐츠 유형 처리와 함께 전송됩니다.
- **오디오**: LINE 오디오 메시지로 전송됩니다.

아웃바운드 미디어 URL은 공개 HTTPS URL이어야 합니다. OpenClaw는 URL을 LINE에 전달하기 전에 대상 호스트 이름을 검증하며, loopback, link-local, private-network 대상을 거부합니다.

LINE 전용 경로를 사용할 수 없는 경우, 일반 미디어 전송은 기존 이미지 전용 경로로 폴백합니다.

## 문제 해결

- **Webhook 검증 실패:** Webhook URL이 HTTPS인지, 그리고 `channelSecret`이 LINE Console과 일치하는지 확인하세요.
- **인바운드 이벤트 없음:** Webhook 경로가 `channels.line.webhookPath`와 일치하는지, 그리고 Gateway가 LINE에서 접근 가능한지 확인하세요.
- **미디어 다운로드 오류:** 미디어가 기본 제한을 초과하면 `channels.line.mediaMaxMb`를 늘리세요.

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
