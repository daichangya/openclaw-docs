---
read_when:
    - Node 전용 개발 스크립트 또는 watch 모드 실패를 디버깅하는 중입니다.
    - OpenClaw에서 tsx/esbuild 로더 충돌을 조사하는 중입니다.
summary: Node + tsx `"__name is not a function"` 충돌 참고 및 해결 방법
title: Node + tsx 충돌
x-i18n:
    generated_at: "2026-04-24T06:12:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx `__name is not a function` 충돌

## 요약

`tsx`와 함께 Node로 OpenClaw를 실행하면 시작 시 다음 오류와 함께 실패합니다.

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

이 문제는 개발 스크립트를 Bun에서 `tsx`로 전환한 뒤(커밋 `2871657e`, 2026-01-06) 시작되었습니다. 동일한 런타임 경로는 Bun에서는 정상 동작했습니다.

## 환경

- Node: v25.x (v25.3.0에서 관찰됨)
- tsx: 4.21.0
- OS: macOS (Node 25를 실행하는 다른 플랫폼에서도 재현될 가능성 높음)

## 재현(Node 전용)

```bash
# repo 루트에서
node --version
pnpm install
node --import tsx src/entry.ts status
```

## repo 내 최소 재현

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 버전 확인

- Node 25.3.0: 실패
- Node 22.22.0 (Homebrew `node@22`): 실패
- Node 24: 아직 여기에 설치되지 않음, 확인 필요

## 참고 / 가설

- `tsx`는 TS/ESM을 변환하기 위해 esbuild를 사용합니다. esbuild의 `keepNames`는 `__name` 헬퍼를 생성하고 함수 정의를 `__name(...)`으로 감쌉니다.
- 이 충돌은 런타임에 `__name`이 존재하지만 함수가 아님을 뜻하므로, Node 25 로더 경로에서 이 모듈에 대해 해당 헬퍼가 누락되었거나 덮어써졌음을 시사합니다.
- 비슷한 `__name` 헬퍼 문제는 헬퍼가 누락되거나 다시 작성되는 경우 다른 esbuild 사용 사례에서도 보고된 바 있습니다.

## 회귀 이력

- `2871657e` (2026-01-06): Bun을 선택 사항으로 만들기 위해 스크립트를 Bun에서 tsx로 변경
- 그 이전(Bun 경로): `openclaw status`와 `gateway:watch`가 동작했음

## 해결 방법

- 개발 스크립트에는 Bun 사용(현재 임시 되돌림)
- repo 타입 검사는 `tsgo`를 사용한 뒤 빌드된 출력을 실행

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 기록 참고: 이 Node/tsx 문제를 디버깅하는 동안 여기서는 `tsc`를 사용했지만, 현재 repo 타입 검사 레인은 `tsgo`를 사용합니다.
- 가능하다면 TS 로더에서 esbuild `keepNames`를 비활성화(`__name` 헬퍼 삽입 방지). 현재 tsx는 이를 노출하지 않습니다.
- Node LTS(22/24)에서 `tsx`를 테스트해 이 문제가 Node 25 전용인지 확인

## 참고 자료

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 다음 단계

- Node 22/24에서 재현해 Node 25 회귀인지 확인
- 알려진 회귀가 있다면 `tsx` nightly를 테스트하거나 이전 버전으로 고정
- Node LTS에서도 재현되면 `__name` 스택 트레이스와 함께 최소 재현 사례를 업스트림에 제출

## 관련 항목

- [Node.js 설치](/ko/install/node)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
