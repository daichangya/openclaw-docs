---
read_when:
    - OpenClaw를 WeChat 또는 Weixin에 연결하려는 것입니다.
    - openclaw-weixin 채널 Plugin을 설치하거나 문제를 해결하는 중입니다.
    - 외부 채널 Plugin이 Gateway 옆에서 어떻게 실행되는지 이해해야 합니다.
summary: 외부 openclaw-weixin Plugin을 통한 WeChat 채널 설정
title: WeChat
x-i18n:
    generated_at: "2026-04-24T06:05:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw는 Tencent의 외부 `@tencent-weixin/openclaw-weixin` 채널 Plugin을 통해 WeChat에 연결됩니다.

상태: 외부 Plugin. 다이렉트 채팅과 미디어를 지원합니다. 현재 Plugin capability 메타데이터에서는 그룹 채팅이 지원 대상으로 표시되지 않습니다.

## 명명

- **WeChat**은 이 문서에서 사용하는 사용자 대상 이름입니다.
- **Weixin**은 Tencent 패키지와 Plugin ID에서 사용하는 이름입니다.
- `openclaw-weixin`은 OpenClaw 채널 ID입니다.
- `@tencent-weixin/openclaw-weixin`은 npm 패키지입니다.

CLI 명령과 config 경로에서는 `openclaw-weixin`을 사용하세요.

## 동작 방식

WeChat 코드는 OpenClaw 코어 저장소에 있지 않습니다. OpenClaw는 일반적인 채널 Plugin 계약을 제공하고, 외부 Plugin은 WeChat 전용 런타임을 제공합니다.

1. `openclaw plugins install`이 `@tencent-weixin/openclaw-weixin`을 설치합니다.
2. Gateway가 Plugin manifest를 검색하고 Plugin 엔트리포인트를 로드합니다.
3. Plugin이 채널 ID `openclaw-weixin`을 등록합니다.
4. `openclaw channels login --channel openclaw-weixin`이 QR 로그인을 시작합니다.
5. Plugin이 OpenClaw 상태 디렉터리에 계정 자격 증명을 저장합니다.
6. Gateway가 시작되면 Plugin이 구성된 각 계정에 대해 Weixin 모니터를 시작합니다.
7. 수신 WeChat 메시지는 채널 계약을 통해 정규화되고, 선택된 OpenClaw 에이전트로 라우팅된 뒤, Plugin의 아웃바운드 경로를 통해 다시 전송됩니다.

이 분리는 중요합니다. OpenClaw 코어는 채널 비종속적으로 유지되어야 합니다. WeChat 로그인, Tencent iLink API 호출, 미디어 업로드/다운로드, 컨텍스트 토큰, 계정 모니터링은 외부 Plugin이 담당합니다.

## 설치

빠른 설치:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

수동 설치:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

설치 후 Gateway를 재시작하세요.

```bash
openclaw gateway restart
```

## 로그인

Gateway가 실행되는 동일한 머신에서 QR 로그인을 실행하세요.

```bash
openclaw channels login --channel openclaw-weixin
```

휴대전화의 WeChat으로 QR 코드를 스캔하고 로그인을 확인하세요. 스캔이 성공하면 Plugin이 계정 토큰을 로컬에 저장합니다.

다른 WeChat 계정을 추가하려면 동일한 로그인 명령을 다시 실행하세요. 여러 계정을 사용할 경우 다이렉트 메시지 세션을 계정, 채널, 발신자 기준으로 격리하세요.

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## 액세스 제어

다이렉트 메시지는 채널 Plugin에 대한 일반 OpenClaw 페어링 및 allowlist 모델을 사용합니다.

새 발신자 승인:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

전체 액세스 제어 모델은 [Pairing](/ko/channels/pairing)을 참고하세요.

## 호환성

Plugin은 시작 시 호스트 OpenClaw 버전을 확인합니다.

| Plugin line | OpenClaw 버전          | npm tag  |
| ----------- | ---------------------- | -------- |
| `2.x`       | `>=2026.3.22`          | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

Plugin이 OpenClaw 버전이 너무 오래되었다고 보고하면 OpenClaw를 업데이트하거나 레거시 Plugin 라인을 설치하세요.

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## 사이드카 프로세스

WeChat Plugin은 Tencent iLink API를 모니터링하는 동안 Gateway 옆에서 보조 작업을 실행할 수 있습니다. 이슈 #68451에서는 이 보조 경로가 OpenClaw의 일반적인 오래된 Gateway 정리 로직의 버그를 드러냈습니다. 자식 프로세스가 부모 Gateway 프로세스를 정리하려고 시도해 systemd 같은 프로세스 관리자 아래에서 재시작 루프가 발생할 수 있었습니다.

현재 OpenClaw 시작 정리는 현재 프로세스와 그 상위 프로세스를 제외하므로, 채널 보조 프로세스가 자신을 시작한 Gateway를 종료해서는 안 됩니다. 이 수정은 일반적인 수정이며, 코어의 WeChat 전용 경로가 아닙니다.

## 문제 해결

설치 및 상태 확인:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

채널이 설치된 것으로 표시되지만 연결되지 않는다면 Plugin이 활성화되어 있는지 확인하고 재시작하세요.

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

WeChat 활성화 후 Gateway가 반복적으로 재시작된다면 OpenClaw와 Plugin을 모두 업데이트하세요.

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

임시 비활성화:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 관련 문서

- 채널 개요: [Chat Channels](/ko/channels)
- 페어링: [Pairing](/ko/channels/pairing)
- 채널 라우팅: [Channel Routing](/ko/channels/channel-routing)
- Plugin 아키텍처: [Plugin Architecture](/ko/plugins/architecture)
- 채널 Plugin SDK: [Channel Plugin SDK](/ko/plugins/sdk-channel-plugins)
- 외부 패키지: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
