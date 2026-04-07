---
read_when:
    - qa-lab 또는 qa-channel을 확장하고 있습니다
    - 저장소 기반 QA 시나리오를 추가하고 있습니다
    - Gateway dashboard를 중심으로 더 높은 현실성의 QA 자동화를 구축하고 있습니다
summary: qa-lab, qa-channel, 시드된 시나리오, 프로토콜 보고서를 위한 비공개 QA 자동화 구조
title: QA E2E 자동화
x-i18n:
    generated_at: "2026-04-07T05:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 113e89d8d3ee8ef3058d95b9aea9a1c2335b07794446be2d231c0faeb044b23b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 자동화

비공개 QA 스택은 단일 단위 테스트보다 더 현실적이고,
채널 형태에 가까운 방식으로 OpenClaw를 테스트하기 위한 것입니다.

현재 구성 요소:

- `extensions/qa-channel`: DM, 채널, 스레드,
  반응, 수정, 삭제 표면을 갖춘 합성 메시지 채널
- `extensions/qa-lab`: 전사를 관찰하고,
  인바운드 메시지를 주입하고, Markdown 보고서를 내보내기 위한 디버거 UI 및 QA 버스
- `qa/`: 시작 작업과 기준 QA
  시나리오를 위한 저장소 기반 시드 자산

현재 QA 운영자 흐름은 2개 패널로 구성된 QA 사이트입니다:

- 왼쪽: 에이전트가 있는 Gateway dashboard (Control UI)
- 오른쪽: Slack과 유사한 전사와 시나리오 계획을 표시하는 QA Lab

다음 명령으로 실행하세요:

```bash
pnpm qa:lab:up
```

이 명령은 QA 사이트를 빌드하고, Docker 기반 gateway 레인을 시작하며,
운영자 또는 자동화 루프가 에이전트에 QA
미션을 부여하고, 실제 채널 동작을 관찰하고, 무엇이 작동했고 실패했으며
무엇이 계속 막혀 있었는지 기록할 수 있는 QA Lab 페이지를 노출합니다.

## 저장소 기반 시드

시드 자산은 `qa/`에 있습니다:

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

이 파일들은 QA 계획이 사람과
에이전트 모두에게 보이도록 의도적으로 git에 포함되어 있습니다. 기준 목록은 다음을 포괄할 수 있을 만큼 충분히 넓게 유지되어야 합니다:

- DM 및 채널 채팅
- 스레드 동작
- 메시지 작업 수명 주기
- cron 콜백
- 메모리 회상
- 모델 전환
- 하위 에이전트 핸드오프
- 저장소 읽기 및 문서 읽기
- Lobster Invaders 같은 작은 빌드 작업 하나

## 보고

`qa-lab`은 관찰된 버스 타임라인에서 Markdown 프로토콜 보고서를 내보냅니다.
보고서는 다음에 답해야 합니다:

- 무엇이 작동했는가
- 무엇이 실패했는가
- 무엇이 계속 막혀 있었는가
- 어떤 후속 시나리오를 추가할 가치가 있는가

## 관련 문서

- [Testing](/ko/help/testing)
- [QA 채널](/ko/channels/qa-channel)
- [Dashboard](/web/dashboard)
