---
read_when:
    - mac app을 Gateway 수명 주기와 통합하기
summary: macOS에서의 Gateway 수명 주기(launchd)
title: Gateway 수명 주기
x-i18n:
    generated_at: "2026-04-24T06:24:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# macOS에서의 Gateway 수명 주기

macOS app은 기본적으로 **launchd를 통해 Gateway를 관리**하며, Gateway를
자식 프로세스로 실행하지 않습니다. 먼저 구성된 포트에서 이미 실행 중인
Gateway에 연결을 시도하고, 도달 가능한 Gateway가 없으면 외부 `openclaw` CLI를 통해
launchd 서비스를 활성화합니다(내장 런타임 없음). 이를 통해
로그인 시 안정적인 자동 시작과 충돌 시 재시작이 가능합니다.

자식 프로세스 모드(app이 Gateway를 직접 실행하는 방식)는 현재 **사용되지 않습니다**.
UI와 더 긴밀하게 결합해야 한다면 터미널에서 Gateway를 수동으로 실행하세요.

## 기본 동작(launchd)

- app은 `ai.openclaw.gateway`라는 레이블의 사용자별 LaunchAgent를 설치합니다.
  (`--profile`/`OPENCLAW_PROFILE` 사용 시 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`도 지원됨)
- Local 모드가 활성화되면 app은 LaunchAgent가 로드되어 있는지 확인하고
  필요하면 Gateway를 시작합니다.
- 로그는 launchd gateway 로그 경로에 기록됩니다(Debug Settings에서 확인 가능).

일반적인 명령:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

이름 있는 profile을 실행 중이라면 레이블을 `ai.openclaw.<profile>`로 바꾸세요.

## 서명되지 않은 개발 빌드

`scripts/restart-mac.sh --no-sign`은 서명 키가 없을 때
빠른 로컬 빌드를 위한 것입니다. launchd가 서명되지 않은 relay 바이너리를 가리키지 않도록 다음을 수행합니다.

- `~/.openclaw/disable-launchagent`를 기록합니다.

서명된 `scripts/restart-mac.sh` 실행은 이 마커가
존재하면 이 재정의를 해제합니다. 수동으로 재설정하려면 다음을 실행하세요.

```bash
rm ~/.openclaw/disable-launchagent
```

## attach-only 모드

macOS app이 **절대로 launchd를 설치하거나 관리하지 않도록** 강제하려면
`--attach-only`(또는 `--no-launchd`)로 실행하세요. 그러면 `~/.openclaw/disable-launchagent`가 설정되어
app은 이미 실행 중인 Gateway에만 연결합니다. 같은
동작은 Debug Settings에서도 전환할 수 있습니다.

## 원격 모드

원격 모드는 로컬 Gateway를 시작하지 않습니다. app은 원격 호스트로
SSH 터널을 사용하고 그 터널을 통해 연결합니다.

## launchd를 선호하는 이유

- 로그인 시 자동 시작
- 내장된 재시작/KeepAlive 시맨틱
- 예측 가능한 로그와 감독

진정한 자식 프로세스 모드가 다시 필요해진다면,
별도의 명시적인 개발 전용 모드로 문서화해야 합니다.

## 관련 항목

- [macOS app](/ko/platforms/macos)
- [Gateway runbook](/ko/gateway)
