---
read_when:
    - macOS Skills 설정 UI 업데이트하기
    - Skills 게이팅 또는 설치 동작 변경하기
summary: macOS Skills 설정 UI 및 Gateway 기반 상태
title: Skills(macOS)
x-i18n:
    generated_at: "2026-04-24T06:24:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

macOS app은 OpenClaw Skills를 gateway를 통해 표시하며, Skills를 로컬에서 직접 파싱하지 않습니다.

## 데이터 소스

- `skills.status`(gateway)는 모든 Skills와 함께 적격성 및 누락된 요구 사항을 반환합니다.
  (번들된 Skills에 대한 allowlist 차단 포함)
- 요구 사항은 각 `SKILL.md`의 `metadata.openclaw.requires`에서 파생됩니다.

## 설치 작업

- `metadata.openclaw.install`은 설치 옵션(brew/node/go/uv)을 정의합니다.
- app은 `skills.install`을 호출해 gateway 호스트에서 설치 프로그램을 실행합니다.
- 기본 제공 dangerous-code `critical` 탐지 결과가 있으면 기본적으로 `skills.install`이 차단되며, suspicious 탐지 결과는 여전히 경고만 표시합니다. 위험 재정의는 gateway 요청에 존재하지만, 기본 app 흐름은 계속 fail-closed를 유지합니다.
- 모든 설치 옵션이 `download`이면 gateway가 모든 다운로드
  선택지를 표시합니다.
- 그렇지 않으면 gateway는 현재 설치 환경 설정과 호스트 바이너리를 사용해
  선호 설치 프로그램 하나를 선택합니다. `skills.install.preferBrew`가 활성화되어 있고 `brew`가 있으면 Homebrew를 우선하고, 그다음 `uv`, 그다음 `skills.install.nodeManager`에 구성된 node 관리자, 이후 `go` 또는 `download` 같은 대체 수단을 사용합니다.
- Node 설치 레이블은 `yarn`을 포함해 구성된 node 관리자를 반영합니다.

## 환경 변수/API 키

- app은 키를 `~/.openclaw/openclaw.json`의 `skills.entries.<skillKey>` 아래에 저장합니다.
- `skills.update`는 `enabled`, `apiKey`, `env`를 패치합니다.

## 원격 모드

- 설치 + config 업데이트는 로컬 Mac이 아니라 gateway 호스트에서 수행됩니다.

## 관련 항목

- [Skills](/ko/tools/skills)
- [macOS app](/ko/platforms/macos)
