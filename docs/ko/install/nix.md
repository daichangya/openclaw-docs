---
read_when:
    - 재현 가능하고 롤백 가능한 설치를 원합니다
    - 이미 Nix/NixOS/Home Manager를 사용하고 있습니다
    - 모든 것을 고정하고 선언적으로 관리하고 싶습니다
summary: Nix로 OpenClaw 선언적 설치하기
title: Nix
x-i18n:
    generated_at: "2026-04-25T12:26:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

**[nix-openclaw](https://github.com/openclaw/nix-openclaw)**로 OpenClaw를 선언적으로 설치하세요 — 모든 것이 포함된 Home Manager 모듈입니다.

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) 저장소는 Nix 설치의 기준 소스입니다. 이 페이지는 빠른 개요입니다.
</Info>

## 제공되는 내용

- Gateway + macOS 앱 + 도구(whisper, spotify, cameras) -- 모두 고정됨
- 재부팅 후에도 유지되는 Launchd 서비스
- 선언적 config를 갖춘 Plugin 시스템
- 즉시 롤백: `home-manager switch --rollback`

## 빠른 시작

<Steps>
  <Step title="Determinate Nix 설치">
    아직 Nix가 설치되어 있지 않다면 [Determinate Nix 설치 프로그램](https://github.com/DeterminateSystems/nix-installer) 안내를 따르세요.
  </Step>
  <Step title="로컬 flake 생성">
    nix-openclaw 저장소의 agent-first 템플릿을 사용하세요:
    ```bash
    mkdir -p ~/code/openclaw-local
    # nix-openclaw 저장소에서 templates/agent-first/flake.nix 복사
    ```
  </Step>
  <Step title="secret 구성">
    메시징 봇 토큰과 모델 provider API 키를 설정하세요. `~/.secrets/`의 일반 파일로도 충분합니다.
  </Step>
  <Step title="템플릿 플레이스홀더를 채우고 switch 실행">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="확인">
    launchd 서비스가 실행 중인지, 그리고 봇이 메시지에 응답하는지 확인하세요.
  </Step>
</Steps>

전체 모듈 옵션과 예시는 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)를 참조하세요.

## Nix 모드 런타임 동작

`OPENCLAW_NIX_MODE=1`이 설정되면(`nix-openclaw`에서는 자동), OpenClaw는 자동 설치 흐름을 비활성화하는 결정적 모드로 진입합니다.

수동으로도 설정할 수 있습니다:

```bash
export OPENCLAW_NIX_MODE=1
```

macOS에서는 GUI 앱이 셸 환경 변수를 자동으로 상속하지 않습니다. 대신 defaults를 통해 Nix 모드를 활성화하세요:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 모드에서 변경되는 사항

- 자동 설치 및 자기 변경 흐름이 비활성화됩니다
- 누락된 의존성에 대해 Nix 전용 해결 안내 메시지가 표시됩니다
- UI에 읽기 전용 Nix 모드 배너가 표시됩니다

### config 및 상태 경로

OpenClaw는 `OPENCLAW_CONFIG_PATH`에서 JSON5 config를 읽고 `OPENCLAW_STATE_DIR`에 변경 가능한 데이터를 저장합니다. Nix에서 실행할 때는 런타임 상태와 config가 변경 불가능한 스토어 밖에 유지되도록 이를 Nix 관리 위치로 명시적으로 설정하세요.

| 변수                   | 기본값                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 서비스 PATH 검색

launchd/systemd Gateway 서비스는 Nix 프로필 바이너리를 자동으로 검색하므로
`nix`로 설치된 실행 파일을 호출하는 Plugins 및 도구가
수동 PATH 설정 없이 작동합니다.

- `NIX_PROFILES`가 설정되어 있으면 모든 항목이
  오른쪽에서 왼쪽 우선순위로 서비스 PATH에 추가됩니다(Nix 셸 우선순위와 동일 — 가장 오른쪽이 우선).
- `NIX_PROFILES`가 설정되어 있지 않으면 `~/.nix-profile/bin`이 fallback으로 추가됩니다.

이는 macOS launchd와 Linux systemd 서비스 환경 모두에 적용됩니다.

## 관련 항목

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- 전체 설정 가이드
- [마법사](/ko/start/wizard) -- 비Nix CLI 설정
- [Docker](/ko/install/docker) -- 컨테이너 기반 설정
