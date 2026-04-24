---
read_when:
    - mac 디버그 빌드 생성 또는 서명 중
summary: 패키징 스크립트로 생성된 macOS 디버그 빌드용 서명 단계
title: macOS 서명
x-i18n:
    generated_at: "2026-04-24T06:24:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac 서명(디버그 빌드)

이 앱은 보통 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 빌드되며, 현재 다음을 수행합니다:

- 안정적인 디버그 번들 식별자 설정: `ai.openclaw.mac.debug`
- 해당 번들 id로 Info.plist 작성(필요하면 `BUNDLE_ID=...`로 재정의)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh)를 호출해 메인 바이너리와 앱 번들을 서명합니다. 이렇게 하면 macOS가 각 재빌드를 동일한 서명된 번들로 취급하고 TCC 권한(알림, 손쉬운 사용, 화면 녹화, 마이크, 음성)을 유지합니다. 권한을 안정적으로 유지하려면 실제 서명 식별자를 사용하세요. ad-hoc은 옵트인이며 취약합니다([macOS 권한](/ko/platforms/mac/permissions) 참고).
- 기본적으로 `CODESIGN_TIMESTAMP=auto`를 사용합니다. 이는 Developer ID 서명에 대해 신뢰된 타임스탬프를 활성화합니다. 타임스탬프를 건너뛰려면(오프라인 디버그 빌드) `CODESIGN_TIMESTAMP=off`를 설정하세요.
- 빌드 메타데이터를 Info.plist에 주입합니다: `OpenClawBuildTimestamp`(UTC) 및 `OpenClawGitCommit`(짧은 해시). 이를 통해 About 창에서 빌드, git, 디버그/릴리스 채널을 표시할 수 있습니다.
- **패키징은 기본적으로 Node 24 사용**: 스크립트는 TS 빌드와 Control UI 빌드를 실행합니다. Node 22 LTS(현재 `22.14+`)도 호환성을 위해 계속 지원됩니다.
- 환경 변수에서 `SIGN_IDENTITY`를 읽습니다. 셸 rc에 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`(또는 Developer ID Application 인증서)를 추가하면 항상 해당 인증서로 서명합니다. ad-hoc 서명은 `ALLOW_ADHOC_SIGNING=1` 또는 `SIGN_IDENTITY="-"`로 명시적으로 옵트인해야 합니다(권한 테스트에는 권장되지 않음).
- 서명 후 Team ID 감사를 실행하고 앱 번들 내부 Mach-O가 다른 Team ID로 서명되어 있으면 실패합니다. 이를 우회하려면 `SKIP_TEAM_ID_CHECK=1`을 설정하세요.

## 사용 방법

```bash
# 리포지토리 루트에서
scripts/package-mac-app.sh               # 식별자 자동 선택, 없으면 오류
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 실제 인증서
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (권한이 유지되지 않음)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 명시적 ad-hoc (동일한 주의사항)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 개발 전용 Sparkle Team ID 불일치 우회
```

### Ad-hoc 서명 참고

`SIGN_IDENTITY="-"`(ad-hoc)로 서명할 때 스크립트는 자동으로 **Hardened Runtime** (`--options runtime`)을 비활성화합니다. 이는 앱이 동일한 Team ID를 공유하지 않는 내장 프레임워크(예: Sparkle)를 로드하려 할 때 충돌을 방지하기 위해 필요합니다. ad-hoc 서명은 TCC 권한 영속성도 깨뜨립니다. 복구 단계는 [macOS 권한](/ko/platforms/mac/permissions)을 참고하세요.

## About용 빌드 메타데이터

`package-mac-app.sh`는 번들에 다음을 기록합니다:

- `OpenClawBuildTimestamp`: 패키징 시점의 ISO8601 UTC
- `OpenClawGitCommit`: 짧은 git 해시(사용할 수 없으면 `unknown`)

About 탭은 이 키를 읽어 버전, 빌드 날짜, git 커밋, 디버그 빌드 여부(`#if DEBUG` 사용)를 표시합니다. 코드 변경 후 이 값을 갱신하려면 packager를 실행하세요.

## 이유

TCC 권한은 번들 식별자와 코드 서명에 모두 연결됩니다. UUID가 계속 바뀌는 서명되지 않은 디버그 빌드는 macOS가 각 재빌드 후 권한 부여를 잊게 만들고 있었습니다. 바이너리를 서명하고(기본값은 ad-hoc) 고정된 번들 id/경로(`dist/OpenClaw.app`)를 유지하면 VibeTunnel 방식과 같이 빌드 간 권한 부여를 보존할 수 있습니다.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [macOS 권한](/ko/platforms/mac/permissions)
