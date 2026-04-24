---
read_when:
    - OpenClaw를 새 노트북/서버로 옮기고 있습니다
    - 세션, 인증, 채널 로그인(WhatsApp 등)을 보존하고 싶습니다
summary: 한 머신에서 다른 머신으로 OpenClaw 설치를 이동(마이그레이션)하기
title: 마이그레이션 가이드
x-i18n:
    generated_at: "2026-04-24T06:21:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# OpenClaw를 새 머신으로 마이그레이션하기

이 가이드는 온보딩을 다시 하지 않고 OpenClaw Gateway를 새 머신으로 옮기는 방법을 설명합니다.

## 마이그레이션되는 항목

**상태 디렉터리**(기본값 `~/.openclaw/`)와 **워크스페이스**를 복사하면 다음이 보존됩니다:

- **구성** -- `openclaw.json` 및 모든 Gateway 설정
- **인증** -- 에이전트별 `auth-profiles.json`(API 키 + OAuth), 그리고 `credentials/` 아래의 채널/Provider 상태
- **세션** -- 대화 기록 및 에이전트 상태
- **채널 상태** -- WhatsApp 로그인, Telegram 세션 등
- **워크스페이스 파일** -- `MEMORY.md`, `USER.md`, Skills, 프롬프트

<Tip>
기존 머신에서 `openclaw status`를 실행해 상태 디렉터리 경로를 확인하세요.
사용자 지정 프로필은 `~/.openclaw-<profile>/` 또는 `OPENCLAW_STATE_DIR`로 설정한 경로를 사용합니다.
</Tip>

## 마이그레이션 단계

<Steps>
  <Step title="Gateway 중지 및 백업">
    **기존** 머신에서 복사 도중 파일이 바뀌지 않도록 Gateway를 중지한 뒤 아카이브합니다:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    여러 프로필(예: `~/.openclaw-work`)을 사용한다면 각각 따로 아카이브하세요.

  </Step>

  <Step title="새 머신에 OpenClaw 설치">
    새 머신에 [설치](/ko/install)를 통해 CLI(그리고 필요하면 Node)를 설치하세요.
    온보딩이 새 `~/.openclaw/`를 만들어도 괜찮습니다. 다음 단계에서 덮어쓸 예정입니다.
  </Step>

  <Step title="상태 디렉터리 및 워크스페이스 복사">
    `scp`, `rsync -a`, 또는 외장 드라이브로 아카이브를 전송한 뒤 압축을 풉니다:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    숨김 디렉터리가 포함되었는지, 파일 소유권이 Gateway를 실행할 사용자와 일치하는지 확인하세요.

  </Step>

  <Step title="Doctor 실행 및 검증">
    새 머신에서 [Doctor](/ko/gateway/doctor)를 실행해 구성 마이그레이션을 적용하고 서비스를 복구하세요:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## 흔한 함정

<AccordionGroup>
  <Accordion title="프로필 또는 상태 디렉터리 불일치">
    기존 Gateway가 `--profile` 또는 `OPENCLAW_STATE_DIR`를 사용했는데 새 머신은 그렇지 않다면,
    채널이 로그아웃된 것처럼 보이고 세션은 비어 있게 됩니다.
    마이그레이션한 것과 **같은** 프로필 또는 상태 디렉터리로 Gateway를 실행한 뒤 `openclaw doctor`를 다시 실행하세요.
  </Accordion>

  <Accordion title="openclaw.json만 복사함">
    구성 파일만으로는 충분하지 않습니다. 모델 auth profile은
    `agents/<agentId>/agent/auth-profiles.json` 아래에 있고, 채널/Provider 상태는 여전히
    `credentials/` 아래에 있습니다. 항상 **전체** 상태 디렉터리를 마이그레이션하세요.
  </Accordion>

  <Accordion title="권한 및 소유권">
    root로 복사했거나 사용자를 바꿨다면 Gateway가 자격 증명을 읽지 못할 수 있습니다.
    상태 디렉터리와 워크스페이스가 Gateway를 실행하는 사용자의 소유인지 확인하세요.
  </Accordion>

  <Accordion title="원격 모드">
    UI가 **원격** Gateway를 가리키고 있다면 세션과 워크스페이스는 원격 호스트가 소유합니다.
    로컬 노트북이 아니라 Gateway 호스트 자체를 마이그레이션하세요. [FAQ](/ko/help/faq#where-things-live-on-disk)를 참고하세요.
  </Accordion>

  <Accordion title="백업의 시크릿">
    상태 디렉터리에는 auth profile, 채널 자격 증명, 기타
    Provider 상태가 포함됩니다.
    백업은 암호화해 저장하고, 안전하지 않은 전송 채널은 피하며, 노출이 의심되면 키를 교체하세요.
  </Accordion>
</AccordionGroup>

## 검증 체크리스트

새 머신에서 다음을 확인하세요:

- [ ] `openclaw status`에 Gateway 실행 중으로 표시됨
- [ ] 채널이 여전히 연결되어 있음(재페어링 불필요)
- [ ] 대시보드가 열리고 기존 세션이 표시됨
- [ ] 워크스페이스 파일(메모리, 구성)이 존재함

## 관련 문서

- [설치 개요](/ko/install)
- [Matrix 마이그레이션](/ko/install/migrating-matrix)
- [제거](/ko/install/uninstall)
