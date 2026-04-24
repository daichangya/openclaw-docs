---
read_when:
    - 에이전트가 왜 특정 방식으로 응답했는지, 실패했는지, 또는 도구를 호출했는지 디버깅하는 중입니다.
    - OpenClaw 세션용 지원 번들을 내보내는 중입니다.
    - 프롬프트 컨텍스트, 도구 호출, 런타임 오류 또는 사용량 메타데이터를 조사하는 중입니다.
    - trajectory 캡처를 비활성화하거나 위치를 변경하는 중입니다.
summary: 디버깅을 위해 OpenClaw 에이전트 세션의 민감 정보가 제거된 trajectory 번들을 내보내기
title: Trajectory 번들
x-i18n:
    generated_at: "2026-04-24T06:42:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
    source_path: tools/trajectory.md
    workflow: 15
---

Trajectory 캡처는 OpenClaw의 세션별 플라이트 레코더입니다. 각 에이전트 실행에 대해
구조화된 타임라인을 기록하고, `/export-trajectory`는 현재 세션을 민감 정보가 제거된 지원 번들로 패키징합니다.

다음과 같은 질문에 답해야 할 때 사용하세요.

- 어떤 prompt, system prompt, 도구가 모델에 전송되었나요?
- 어떤 transcript 메시지와 도구 호출이 이 응답으로 이어졌나요?
- 실행이 시간 초과, 중단, Compaction, 또는 provider 오류에 걸렸나요?
- 어떤 모델, Plugins, Skills, 런타임 설정이 활성화되어 있었나요?
- provider가 어떤 usage 및 prompt-cache 메타데이터를 반환했나요?

## 빠른 시작

활성 세션에서 다음을 보내세요.

```text
/export-trajectory
```

별칭:

```text
/trajectory
```

OpenClaw는 workspace 아래에 번들을 기록합니다.

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

상대 출력 디렉터리 이름을 선택할 수도 있습니다.

```text
/export-trajectory bug-1234
```

커스텀 경로는 `.openclaw/trajectory-exports/` 내부에서 확인됩니다. 절대
경로와 `~` 경로는 거부됩니다.

## 접근 권한

trajectory export는 owner 명령입니다. 발신자는 해당 채널의 일반 명령
권한 검사와 owner 검사를 통과해야 합니다.

## 기록되는 내용

Trajectory 캡처는 기본적으로 OpenClaw 에이전트 실행에 대해 활성화되어 있습니다.

런타임 이벤트에는 다음이 포함됩니다.

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript 이벤트도 활성 세션 브랜치에서 재구성됩니다.

- 사용자 메시지
- assistant 메시지
- 도구 호출
- 도구 결과
- compactions
- 모델 변경
- 레이블 및 커스텀 세션 항목

이벤트는 다음 스키마 마커와 함께 JSON Lines로 기록됩니다.

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 번들 파일

내보낸 번들에는 다음이 포함될 수 있습니다.

| File                  | 내용                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `manifest.json`       | 번들 스키마, 소스 파일, 이벤트 수, 생성된 파일 목록                                       |
| `events.jsonl`        | 순서가 있는 런타임 및 transcript 타임라인                                                  |
| `session-branch.json` | 민감 정보가 제거된 활성 transcript 브랜치와 세션 헤더                                      |
| `metadata.json`       | OpenClaw 버전, OS/런타임, 모델, config 스냅샷, Plugins, Skills, prompt 메타데이터         |
| `artifacts.json`      | 최종 상태, 오류, usage, prompt cache, compaction 수, assistant 텍스트, 도구 메타데이터    |
| `prompts.json`        | 제출된 prompt와 선택된 prompt 빌드 세부 정보                                               |
| `system-prompt.txt`   | 캡처된 경우, 최신 컴파일된 system prompt                                                   |
| `tools.json`          | 캡처된 경우, 모델에 전송된 도구 정의                                                      |

`manifest.json`은 해당 번들에 존재하는 파일을 나열합니다. 세션이 해당 런타임 데이터를 캡처하지 못한 경우 일부 파일은 생략됩니다.

## 캡처 위치

기본적으로 런타임 trajectory 이벤트는 세션 파일 옆에 기록됩니다.

```text
<session>.trajectory.jsonl
```

OpenClaw는 세션 파일 옆에 best-effort 포인터 파일도 기록합니다.

```text
<session>.trajectory-path.json
```

런타임 trajectory 사이드카를 전용 디렉터리에 저장하려면
`OPENCLAW_TRAJECTORY_DIR`를 설정하세요.

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

이 변수가 설정되면 OpenClaw는 해당 디렉터리에 세션 ID별 JSONL 파일 하나를 기록합니다.

## 캡처 비활성화

OpenClaw를 시작하기 전에 `OPENCLAW_TRAJECTORY=0`을 설정하세요.

```bash
export OPENCLAW_TRAJECTORY=0
```

이렇게 하면 런타임 trajectory 캡처가 비활성화됩니다. `/export-trajectory`는 여전히
transcript 브랜치를 내보낼 수 있지만, 컴파일된 컨텍스트,
provider artifacts, prompt 메타데이터 같은 런타임 전용 파일은 없을 수 있습니다.

## 개인정보 보호 및 제한

Trajectory 번들은 공개 게시용이 아니라 지원 및 디버깅용으로 설계되었습니다.
OpenClaw는 export 파일을 기록하기 전에 민감한 값을 제거합니다.

- 자격 증명 및 알려진 secret 유사 payload 필드
- 이미지 데이터
- 로컬 상태 경로
- workspace 경로(`$WORKSPACE_DIR`로 대체)
- 감지된 경우 홈 디렉터리 경로

exporter는 입력 크기도 제한합니다.

- 런타임 사이드카 파일: 50 MiB
- 세션 파일: 50 MiB
- 런타임 이벤트: 200,000개
- 전체 export 이벤트: 250,000개
- 개별 런타임 이벤트 줄은 256 KiB를 초과하면 잘립니다

팀 외부와 번들을 공유하기 전에 검토하세요. 민감 정보 제거는 best-effort이며,
모든 애플리케이션별 secret을 알 수는 없습니다.

## 문제 해결

export에 런타임 이벤트가 없는 경우:

- OpenClaw가 `OPENCLAW_TRAJECTORY=0` 없이 시작되었는지 확인하세요
- `OPENCLAW_TRAJECTORY_DIR`가 쓰기 가능한 디렉터리를 가리키는지 확인하세요
- 세션에서 다른 메시지를 하나 더 실행한 다음 다시 export하세요
- `manifest.json`의 `runtimeEventCount`를 확인하세요

명령이 출력 경로를 거부하는 경우:

- `bug-1234` 같은 상대 이름을 사용하세요
- `/tmp/...` 또는 `~/...`는 전달하지 마세요
- export는 `.openclaw/trajectory-exports/` 내부에 유지하세요

export가 크기 오류로 실패하면 세션 또는 사이드카가
export 안전 제한을 초과한 것입니다. 새 세션을 시작하거나 더 작은 재현 사례를 export하세요.

## 관련 항목

- [Diffs](/ko/tools/diffs)
- [세션 관리](/ko/concepts/session)
- [Exec 도구](/ko/tools/exec)
