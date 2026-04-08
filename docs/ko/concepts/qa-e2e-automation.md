---
read_when:
    - qa-lab 또는 qa-channel을 확장할 때
    - 리포지토리 기반 QA 시나리오를 추가할 때
    - Gateway 대시보드를 중심으로 더 높은 현실성의 QA 자동화를 구축할 때
summary: qa-lab, qa-channel, 시드된 시나리오, 프로토콜 보고서를 위한 비공개 QA 자동화 형태
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-08T02:14:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4aa5acc8e77303f4045d4f04372494cae21b89d2fdaba856dbb4855ced9d27
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 자동화

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고
채널 형태에 가까운 방식으로 OpenClaw를 검증하도록 설계되었습니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 수정, 삭제 표면을 갖춘 합성 메시지 채널
- `extensions/qa-lab`: 트랜스크립트를 관찰하고,
  인바운드 메시지를 주입하며, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스
- `qa/`: 시작 작업과 기준 QA
  시나리오를 위한 리포지토리 기반 시드 자산

현재 QA 운영자 흐름은 2개 패널로 구성된 QA 사이트입니다:

- 왼쪽: 에이전트가 있는 Gateway 대시보드(Control UI)
- 오른쪽: Slack와 비슷한 트랜스크립트와 시나리오 계획을 보여주는 QA Lab

다음으로 실행합니다:

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 gateway 레인을 시작하며, 운영자 또는 자동화 루프가 에이전트에 QA
미션을 부여하고, 실제 채널 동작을 관찰하며, 무엇이 작동했고 무엇이 실패했으며 무엇이
여전히 막혀 있는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

매번 Docker 이미지를 다시 빌드하지 않고 더 빠르게 QA Lab UI를 반복 개발하려면,
바인드 마운트된 QA Lab 번들과 함께 스택을 시작하세요:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`는 Docker 서비스를 사전 빌드된 이미지로 유지하고
`extensions/qa-lab/web/dist`를 `qa-lab` 컨테이너에 바인드 마운트합니다. `qa:lab:watch`는
변경 시 해당 번들을 다시 빌드하며, QA Lab 자산 해시가 변경되면 브라우저가 자동으로 다시 로드됩니다.

## 리포지토리 기반 시드

시드 자산은 `qa/`에 있습니다:

- `qa/scenarios.md`

이 항목들은 QA 계획이 사람과
에이전트 모두에게 보이도록 의도적으로 git에 포함되어 있습니다. 기준 목록은 다음을 포괄할 만큼 충분히 넓어야 합니다:

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 수명 주기
- cron 콜백
- 메모리 회상
- 모델 전환
- 서브에이전트 핸드오프
- 리포지토리 읽기 및 문서 읽기
- Lobster Invaders와 같은 작은 빌드 작업 하나

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음 질문에 답해야 합니다:

- 무엇이 작동했는가
- 무엇이 실패했는가
- 무엇이 계속 막혀 있었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

## 관련 문서

- [테스팅](/ko/help/testing)
- [QA 채널](/ko/channels/qa-channel)
- [대시보드](/web/dashboard)
