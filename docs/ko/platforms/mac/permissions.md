---
read_when:
    - macOS 권한 프롬프트가 없거나 멈추는 문제를 디버깅하는 중입니다.
    - macOS 앱을 패키징하거나 서명하는 중입니다.
    - 번들 ID 또는 앱 설치 경로를 변경하는 중입니다.
summary: macOS 권한 지속성(TCC) 및 서명 요구 사항
title: macOS 권한
x-i18n:
    generated_at: "2026-04-24T06:24:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 15
---

macOS 권한 부여는 취약합니다. TCC는 권한 부여를 앱의 코드 서명, 번들 식별자, 디스크 상 경로와 연결합니다. 이 중 하나라도 바뀌면 macOS는 앱을 새 것으로 간주하고 프롬프트를 제거하거나 숨길 수 있습니다.

## 안정적인 권한을 위한 요구 사항

- 같은 경로: 앱은 고정된 위치에서 실행해야 합니다(OpenClaw의 경우 `dist/OpenClaw.app`).
- 같은 번들 식별자: 번들 ID를 바꾸면 새로운 권한 ID가 생성됩니다.
- 서명된 앱: 서명되지 않았거나 ad-hoc 서명된 빌드는 권한을 유지하지 못합니다.
- 일관된 서명: 실제 Apple Development 또는 Developer ID 인증서를 사용해 빌드 간 서명이 안정적으로 유지되도록 하세요.

Ad-hoc 서명은 빌드할 때마다 새 ID를 만듭니다. macOS는 이전 권한 부여를 잊어버리며, 오래된 항목을 지우기 전까지 프롬프트가 완전히 사라질 수도 있습니다.

## 프롬프트가 사라졌을 때 복구 체크리스트

1. 앱을 종료합니다.
2. 시스템 설정 -> 개인정보 보호 및 보안에서 앱 항목을 제거합니다.
3. 같은 경로에서 앱을 다시 실행하고 권한을 다시 부여합니다.
4. 그래도 프롬프트가 나타나지 않으면 `tccutil`로 TCC 항목을 재설정한 뒤 다시 시도합니다.
5. 일부 권한은 macOS 전체 재시작 후에야 다시 나타납니다.

예시 재설정(필요에 따라 번들 ID 교체):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 파일 및 폴더 권한(Desktop/Documents/Downloads)

macOS는 터미널/백그라운드 프로세스에 대해 Desktop, Documents, Downloads도 제한할 수 있습니다. 파일 읽기나 디렉터리 목록이 멈춘다면, 파일 작업을 실제로 수행하는 동일한 프로세스 컨텍스트(예: Terminal/iTerm, LaunchAgent로 시작된 앱, SSH 프로세스)에 접근 권한을 부여하세요.

해결 방법: 폴더별 권한 부여를 피하고 싶다면 파일을 OpenClaw workspace(`~/.openclaw/workspace`)로 옮기세요.

권한을 테스트 중이라면 항상 실제 인증서로 서명하세요. Ad-hoc 빌드는 권한이 중요하지 않은 빠른 로컬 실행에서만 허용됩니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [macOS 서명](/ko/platforms/mac/signing)
