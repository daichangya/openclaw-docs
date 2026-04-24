---
read_when:
    - 온보딩 경로 선택하기
    - 새 환경 설정하기
sidebarTitle: Onboarding Overview
summary: OpenClaw 온보딩 옵션 및 흐름 개요
title: 온보딩 개요
x-i18n:
    generated_at: "2026-04-24T06:36:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw에는 두 가지 온보딩 경로가 있습니다. 둘 다 인증, Gateway, 선택적 채팅 채널을 구성하지만, 설정과 상호작용하는 방식만 다릅니다.

## 어떤 경로를 사용해야 하나요?

|                | CLI 온보딩                              | macOS app 온보딩          |
| -------------- | --------------------------------------- | ------------------------- |
| **플랫폼**     | macOS, Linux, Windows(네이티브 또는 WSL2) | macOS 전용                |
| **인터페이스** | 터미널 마법사                            | app 내 가이드 UI          |
| **가장 적합한 용도** | 서버, 헤드리스, 완전한 제어           | 데스크톱 Mac, 시각적 설정 |
| **자동화**     | 스크립트용 `--non-interactive` 지원     | 수동만 가능               |
| **명령**       | `openclaw onboard`                      | app 실행                  |

대부분의 사용자는 **CLI 온보딩**부터 시작하는 것이 좋습니다. 어디서나 동작하고 가장 많은 제어권을 제공합니다.

## 온보딩이 구성하는 항목

어떤 경로를 선택하든 온보딩은 다음을 설정합니다.

1. **모델 provider 및 인증** — 선택한 provider용 API 키, OAuth, 또는 setup 토큰
2. **workspace** — 에이전트 파일, bootstrap 템플릿, memory를 위한 디렉터리
3. **Gateway** — 포트, bind 주소, 인증 모드
4. **채널**(선택 사항) — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, Telegram, WhatsApp 등 내장 및 번들 채팅 채널
5. **데몬**(선택 사항) — Gateway가 자동으로 시작되도록 하는 백그라운드 서비스

## CLI 온보딩

아무 터미널에서나 실행하세요.

```bash
openclaw onboard
```

백그라운드 서비스를 한 번에 설치하려면 `--install-daemon`도 추가하세요.

전체 참조: [온보딩(CLI)](/ko/start/wizard)
CLI 명령 문서: [`openclaw onboard`](/ko/cli/onboard)

## macOS app 온보딩

OpenClaw app을 여세요. 첫 실행 마법사가
시각적 인터페이스로 동일한 단계를 안내합니다.

전체 참조: [온보딩(macOS App)](/ko/start/onboarding)

## 사용자 지정 또는 목록에 없는 provider

사용하려는 provider가 온보딩 목록에 없다면 **Custom Provider**를 선택하고 다음을 입력하세요.

- API 호환 모드(OpenAI 호환, Anthropic 호환, 또는 자동 감지)
- Base URL 및 API 키
- 모델 ID 및 선택적 별칭

여러 사용자 지정 엔드포인트를 함께 사용할 수 있으며, 각각은 고유한 엔드포인트 ID를 갖습니다.

## 관련 항목

- [시작하기](/ko/start/getting-started)
- [CLI 설정 참조](/ko/start/wizard-cli-reference)
