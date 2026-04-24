---
read_when:
    - 에이전트가 수정 사항이나 재사용 가능한 절차를 작업공간 Skills로 바꾸게 하고 싶습니다
    - 절차형 Skill 메모리를 구성하고 있습니다
    - '`skill_workshop` 도구 동작을 디버깅하고 있습니다'
    - 자동 Skill 생성 활성화 여부를 결정하고 있습니다
summary: 검토, 승인, 격리, hot skill refresh를 갖춘 작업공간 Skills 형태의 재사용 가능한 절차 실험적 캡처
title: Skill workshop Plugin
x-i18n:
    generated_at: "2026-04-24T06:28:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop는 **실험적**입니다. 기본적으로 비활성화되어 있으며, 캡처
휴리스틱과 리뷰어 프롬프트는 릴리스마다 바뀔 수 있습니다. 자동 쓰기는 신뢰되는 작업공간에서만, 먼저 pending 모드 출력을 검토한 뒤에 사용해야 합니다.

Skill Workshop는 작업공간 Skills를 위한 절차형 메모리입니다. 이 기능은 에이전트가
재사용 가능한 워크플로, 사용자 수정 사항, 힘들게 얻은 해결책, 반복되는 함정을
다음 경로 아래의 `SKILL.md` 파일로 바꾸게 합니다:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

이는 장기 메모리와 다릅니다:

- **메모리**는 사실, 선호도, 엔터티, 과거 컨텍스트를 저장합니다.
- **Skills**는 에이전트가 향후 작업에서 따라야 할 재사용 가능한 절차를 저장합니다.
- **Skill Workshop**은 유용한 턴을 안전 점검과 선택적 승인 과정을 거쳐 영속적인 작업공간
  Skill로 바꾸는 다리입니다.

Skill Workshop는 에이전트가 다음과 같은 절차를 배울 때 유용합니다:

- 외부에서 가져온 애니메이션 GIF 자산을 검증하는 방법
- 스크린샷 자산을 교체하고 크기를 확인하는 방법
- 저장소 전용 QA 시나리오를 실행하는 방법
- 반복되는 provider 실패를 디버깅하는 방법
- 오래된 로컬 워크플로 노트를 복구하는 방법

다음 용도에는 적합하지 않습니다:

- “사용자는 파란색을 좋아한다” 같은 사실
- 광범위한 자서전적 메모리
- 원시 전사 보관
- 비밀, 자격 증명 또는 숨겨진 프롬프트 텍스트
- 반복되지 않을 일회성 지시

## 기본 상태

번들된 Plugin은 **실험적**이며 `plugins.entries.skill-workshop`에서
명시적으로 활성화하지 않으면 **기본적으로 비활성화**됩니다.

Plugin 매니페스트는 `enabledByDefault: true`를 설정하지 않습니다. Plugin config 스키마 내부의 `enabled: true`
기본값은 Plugin entry가 이미 선택되고 로드된 **후에만** 적용됩니다.

실험적이라는 의미:

- Plugin은 opt-in 테스트와 dogfooding에는 충분히 지원됨
- 제안 저장소, 리뷰어 임계값, 캡처 휴리스틱은 발전할 수 있음
- pending approval이 권장 시작 모드
- auto apply는 신뢰된 개인/작업공간 설정용이며, 공유되거나 적대적인
  입력이 많은 환경용이 아님

## 활성화

최소 안전 구성:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

이 구성에서는:

- `skill_workshop` 도구를 사용할 수 있음
- 명시적인 재사용 가능 수정 사항이 pending proposal로 대기열에 들어감
- 임계값 기반 리뷰어 패스가 Skill 업데이트를 제안할 수 있음
- pending proposal이 적용되기 전까지는 Skill 파일이 기록되지 않음

자동 쓰기는 신뢰된 작업공간에서만 사용하세요:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"`도 동일한 스캐너와 격리 경로를 사용합니다. critical 결과가 있는 proposal은 적용하지 않습니다.

## 구성

| 키                   | 기본값      | 범위 / 값                                   | 의미                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin entry가 로드된 후 Plugin을 활성화합니다.                     |
| `autoCapture`        | `true`      | boolean                                     | 성공적인 에이전트 턴 후 캡처/리뷰를 활성화합니다.                    |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 제안을 대기열에 넣거나 안전한 제안을 자동으로 기록합니다.            |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 명시적 수정 캡처, LLM 리뷰어, 둘 다, 또는 둘 다 아님을 선택합니다.  |
| `reviewInterval`     | `15`        | `1..200`                                    | 이만큼의 성공적인 턴 후 리뷰어를 실행합니다.                         |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 관찰된 도구 호출이 이 수에 도달하면 리뷰어를 실행합니다.             |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 내장 리뷰어 실행 시간 제한입니다.                                    |
| `maxPending`         | `50`        | `1..200`                                    | 작업공간당 유지할 최대 pending/격리 proposal 수입니다.              |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 생성된 skill/보조 파일의 최대 크기입니다.                            |

권장 프로필:

```json5
// 보수적: 명시적 도구 사용만, 자동 캡처 없음.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// 리뷰 우선: 자동 캡처하지만 승인 필요.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// 신뢰된 자동화: 안전한 제안을 즉시 기록.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// 저비용: 리뷰어 LLM 호출 없음, 명시적 수정 문구만 사용.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 캡처 경로

Skill Workshop에는 세 가지 캡처 경로가 있습니다.

### 도구 제안

모델은 재사용 가능한 절차를 보거나, 사용자가 skill 저장/업데이트를 요청할 때
직접 `skill_workshop`을 호출할 수 있습니다.

이것이 가장 명시적인 경로이며 `autoCapture: false`에서도 동작합니다.

### 휴리스틱 캡처

`autoCapture`가 활성화되어 있고 `reviewMode`가 `heuristic` 또는 `hybrid`일 때,
Plugin은 성공적인 턴에서 명시적인 사용자 수정 문구를 스캔합니다:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

휴리스틱은 최신 일치 사용자 지시에서 proposal을 만듭니다. 일반 워크플로에는
토픽 힌트를 사용해 skill 이름을 고릅니다:

- 애니메이션 GIF 작업 -> `animated-gif-workflow`
- 스크린샷 또는 자산 작업 -> `screenshot-asset-workflow`
- QA 또는 시나리오 작업 -> `qa-scenario-workflow`
- GitHub PR 작업 -> `github-pr-workflow`
- 폴백 -> `learned-workflows`

휴리스틱 캡처는 의도적으로 좁게 설계되었습니다. 이는 일반적인 전사 요약이 아니라
명확한 수정과 반복 가능한 프로세스 노트를 위한 것입니다.

### LLM 리뷰어

`autoCapture`가 활성화되어 있고 `reviewMode`가 `llm` 또는 `hybrid`일 때, Plugin은
임계값에 도달하면 간결한 내장 리뷰어를 실행합니다.

리뷰어는 다음을 받습니다:

- 최근 전사 텍스트(최근 12,000자까지 제한)
- 기존 작업공간 Skills 최대 12개
- 각 기존 Skill에서 최대 2,000자
- JSON 전용 지시

리뷰어에는 도구가 없습니다:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

리뷰어는 `{ "action": "none" }` 또는 하나의 proposal을 반환합니다. `action` 필드는 `create`, `append`, `replace`이며, 관련 Skill이 이미 있으면 `append`/`replace`를 우선하고, 맞는 기존 Skill이 없을 때만 `create`를 사용합니다.

예시 `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append`는 `section` + `body`를 추가합니다. `replace`는 지정된 Skill에서 `oldText`를 `newText`로 바꿉니다.

## proposal 수명 주기

생성된 모든 업데이트는 다음을 가진 proposal이 됩니다:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 선택적 `agentId`
- 선택적 `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end`, 또는 `reviewer`
- `status`
- `change`
- 선택적 `scanFindings`
- 선택적 `quarantineReason`

proposal 상태:

- `pending` - 승인 대기 중
- `applied` - `<workspace>/skills`에 기록됨
- `rejected` - 운영자/모델에 의해 거부됨
- `quarantined` - critical scanner 결과로 차단됨

상태는 Gateway 상태 디렉터리 아래 작업공간별로 저장됩니다:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

pending 및 quarantined proposal은 skill 이름과 변경
payload를 기준으로 중복 제거됩니다. 저장소는 `maxPending`까지 가장 최신의 pending/quarantined proposal을 유지합니다.

## 도구 참조

Plugin은 하나의 에이전트 도구를 등록합니다:

```text
skill_workshop
```

### `status`

활성 작업공간의 상태별 proposal 수를 셉니다.

```json
{ "action": "status" }
```

결과 형태:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

pending proposal을 나열합니다.

```json
{ "action": "list_pending" }
```

다른 상태를 나열하려면:

```json
{ "action": "list_pending", "status": "applied" }
```

유효한 `status` 값:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

quarantined proposal을 나열합니다.

```json
{ "action": "list_quarantine" }
```

자동 캡처가 아무 동작도 하지 않는 것처럼 보이고 로그에
`skill-workshop: quarantined <skill>`이 언급될 때 사용하세요.

### `inspect`

ID로 proposal을 가져옵니다.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

proposal을 생성합니다. `approvalPolicy: "pending"`(기본값)일 때는 기록하지 않고 대기열에 넣습니다.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "사용자가 재사용 가능한 GIF 검증 규칙을 정했습니다.",
  "description": "사용 전에 애니메이션 GIF 자산을 검증합니다.",
  "body": "## Workflow\n\n- URL이 image/gif로 확인되는지 검증합니다.\n- 여러 프레임이 있는지 확인합니다.\n- 출처와 라이선스를 기록합니다.\n- 로컬 자산이 필요할 때는 핫링크를 피합니다."
}
```

<AccordionGroup>
  <Accordion title="안전한 강제 기록 (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "사용 전에 애니메이션 GIF 자산을 검증합니다.",
  "body": "## Workflow\n\n- 실제 애니메이션인지 확인합니다.\n- 출처를 기록합니다."
}
```

  </Accordion>

  <Accordion title="auto 정책에서도 pending 강제 (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "스크린샷 교체 워크플로.",
  "body": "## Workflow\n\n- 크기를 확인합니다.\n- PNG를 최적화합니다.\n- 관련 게이트를 실행합니다."
}
```

  </Accordion>

  <Accordion title="이름이 지정된 섹션에 추가">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA 시나리오 워크플로.",
  "body": "- 미디어 QA의 경우 생성된 자산이 렌더링되고 최종 검증을 통과하는지 확인합니다."
}
```

  </Accordion>

  <Accordion title="정확한 텍스트 교체">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- 결정하기 전에 해결되지 않은 리뷰 스레드, CI 상태, 연결된 이슈, 변경된 파일을 확인합니다."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

pending proposal을 적용합니다.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply`는 quarantined proposal을 거부합니다:

```text
quarantined proposal cannot be applied
```

### `reject`

proposal을 거부 상태로 표시합니다.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

기존 또는 제안된 skill 디렉터리 안에 보조 파일을 기록합니다.

허용되는 최상위 support 디렉터리:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

예시:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# 릴리스 체크리스트\n\n- 릴리스 문서를 실행합니다.\n- changelog를 확인합니다.\n"
}
```

보조 파일은 작업공간 범위로 제한되고, 경로가 검사되며, `maxSkillBytes`에 의해 바이트 크기가 제한되고,
스캔된 뒤 원자적으로 기록됩니다.

## Skill 기록

Skill Workshop는 다음 경로 아래에만 기록합니다:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 이름은 다음과 같이 정규화됩니다:

- 소문자로 변환
- `[a-z0-9_-]`가 아닌 연속 구간은 `-`로 변환
- 앞뒤의 영숫자가 아닌 문자는 제거
- 최대 길이는 80자
- 최종 이름은 `[a-z0-9][a-z0-9_-]{1,79}`와 일치해야 함

`create`의 경우:

- Skill이 존재하지 않으면 Skill Workshop가 새 `SKILL.md`를 기록함
- 이미 존재하면 `## Workflow`에 본문을 추가함

`append`의 경우:

- Skill이 존재하면 요청된 섹션에 추가함
- 존재하지 않으면 최소 Skill을 만든 뒤 추가함

`replace`의 경우:

- Skill이 이미 존재해야 함
- `oldText`가 정확히 존재해야 함
- 첫 번째 정확한 일치 항목만 교체됨

모든 기록은 원자적이며 메모리 내 Skills 스냅샷을 즉시 새로 고치므로,
새롭거나 업데이트된 Skill이 Gateway 재시작 없이도 보이게 될 수 있습니다.

## 안전 모델

Skill Workshop는 생성된 `SKILL.md` 내용과 보조 파일에 대해 안전 스캐너를 가집니다.

Critical 결과는 proposal을 격리합니다:

| 규칙 ID                                | 차단하는 내용                                                         |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 에이전트에게 이전/상위 지시를 무시하라고 지시함                       |
| `prompt-injection-system`              | 시스템 프롬프트, 개발자 메시지, 숨겨진 지시를 참조함                  |
| `prompt-injection-tool`                | 도구 권한/승인 우회를 장려함                                          |
| `shell-pipe-to-shell`                  | `curl`/`wget`를 `sh`, `bash`, `zsh`로 파이프하는 내용을 포함함         |
| `secret-exfiltration`                  | env/프로세스 env 데이터를 네트워크로 보내는 것처럼 보임               |

Warn 결과는 유지되지만, 단독으로는 차단하지 않습니다:

| 규칙 ID              | 경고 대상                         |
| -------------------- | --------------------------------- |
| `destructive-delete` | 광범위한 `rm -rf` 스타일 명령     |
| `unsafe-permissions` | `chmod 777` 스타일 권한 사용      |

격리된 proposal은 다음 특성을 가집니다:

- `scanFindings` 유지
- `quarantineReason` 유지
- `list_quarantine`에 나타남
- `apply`를 통해 적용할 수 없음

격리된 proposal에서 복구하려면, 위험한 내용을 제거한 새 안전 proposal을 만드세요.
저장소 JSON을 수동으로 편집하지 마세요.

## 프롬프트 가이드

활성화되면 Skill Workshop는 에이전트에게 영속적인 절차형 메모리를 위해
`skill_workshop`을 사용하라고 알려주는 짧은 프롬프트 섹션을 주입합니다.

가이드는 다음을 강조합니다:

- 사실/선호가 아닌 절차
- 사용자 수정 사항
- 자명하지 않은 성공 절차
- 반복되는 함정
- append/replace를 통한 오래되거나 빈약하거나 잘못된 Skill 복구
- 긴 도구 루프 또는 힘든 수정 후 재사용 가능한 절차 저장
- 짧고 명령형인 Skill 텍스트
- 전사 덤프 금지

쓰기 모드 텍스트는 `approvalPolicy`에 따라 바뀝니다:

- pending 모드: 제안을 대기열에 넣고, 명시적 승인 후에만 적용
- auto 모드: 명확히 재사용 가능할 때 안전한 작업공간 Skill 업데이트 적용

## 비용과 런타임 동작

휴리스틱 캡처는 모델을 호출하지 않습니다.

LLM 리뷰는 활성/기본 에이전트 모델에서 내장 run을 사용합니다. 기본적으로
모든 턴에서 실행되지 않도록 임계값 기반입니다.

리뷰어는 다음 특성을 가집니다:

- 가능하면 동일한 구성 provider/모델 컨텍스트 사용
- 없으면 런타임 에이전트 기본값으로 폴백
- `reviewTimeoutMs` 사용
- 경량 bootstrap 컨텍스트 사용
- 도구 없음
- 직접 기록하지 않음
- 일반 스캐너 및 승인/격리 경로를 통과하는 proposal만 내보낼 수 있음

리뷰어가 실패하거나, 시간 초과되거나, 잘못된 JSON을 반환하면 Plugin은
경고/디버그 메시지를 로그에 남기고 해당 리뷰 패스를 건너뜁니다.

## 운영 패턴

사용자가 다음과 같이 말할 때 Skill Workshop를 사용하세요:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

좋은 Skill 텍스트:

```markdown
## Workflow

- GIF URL이 `image/gif`로 확인되는지 검증합니다.
- 파일에 여러 프레임이 있는지 확인합니다.
- 소스 URL, 라이선스, 출처를 기록합니다.
- 자산이 제품과 함께 배포될 경우 로컬 사본을 저장합니다.
- 최종 응답 전에 로컬 자산이 대상 UI에서 렌더링되는지 확인합니다.
```

나쁜 Skill 텍스트:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

나쁜 버전을 저장하면 안 되는 이유:

- 전사 형태임
- 명령형이 아님
- 시끄러운 일회성 세부 사항을 포함함
- 다음 에이전트에게 무엇을 해야 하는지 알려주지 않음

## 디버깅

Plugin이 로드되었는지 확인:

```bash
openclaw plugins list --enabled
```

에이전트/도구 컨텍스트에서 proposal 수 확인:

```json
{ "action": "status" }
```

pending proposal 확인:

```json
{ "action": "list_pending" }
```

quarantined proposal 확인:

```json
{ "action": "list_quarantine" }
```

일반적인 증상:

| 증상                                  | 가능한 원인                                                                         | 확인 항목                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 도구를 사용할 수 없음                 | Plugin entry가 활성화되지 않음                                                      | `plugins.entries.skill-workshop.enabled` 및 `openclaw plugins list`   |
| 자동 proposal이 나타나지 않음         | `autoCapture: false`, `reviewMode: "off"`, 또는 임계값 미충족                       | 구성, proposal 상태, Gateway 로그                                     |
| 휴리스틱이 캡처하지 않음              | 사용자 문구가 수정 패턴과 일치하지 않음                                             | 명시적 `skill_workshop.suggest` 사용 또는 LLM 리뷰어 활성화           |
| 리뷰어가 proposal을 만들지 않음       | 리뷰어가 `none`, 잘못된 JSON, 또는 시간 초과를 반환함                               | Gateway 로그, `reviewTimeoutMs`, 임계값                               |
| proposal이 적용되지 않음              | `approvalPolicy: "pending"`                                                         | `list_pending`, 그다음 `apply`                                        |
| proposal이 pending에서 사라짐         | 중복 proposal 재사용, 최대 pending 정리, 또는 applied/rejected/quarantined 됨       | `status`, 상태 필터를 사용한 `list_pending`, `list_quarantine`        |
| Skill 파일은 있는데 모델이 못 봄      | Skill 스냅샷이 새로고침되지 않았거나 Skill 게이팅에서 제외됨                         | `openclaw skills` 상태와 작업공간 Skill 적격성                        |

관련 로그:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 시나리오

저장소 기반 QA 시나리오:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

결정적 커버리지 실행:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

리뷰어 커버리지 실행:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

리뷰어 시나리오는 의도적으로 분리되어 있습니다. 이는
`reviewMode: "llm"`을 활성화하고 내장 리뷰어 패스를 실행하기 때문입니다.

## auto apply를 활성화하지 말아야 하는 경우

다음과 같은 경우 `approvalPolicy: "auto"`를 피하세요:

- 작업공간에 민감한 절차가 포함됨
- 에이전트가 신뢰할 수 없는 입력을 다룸
- Skills가 넓은 팀 전체에 공유됨
- 아직 프롬프트 또는 스캐너 규칙을 조정 중임
- 모델이 적대적인 웹/이메일 콘텐츠를 자주 처리함

먼저 pending 모드를 사용하세요. 해당 작업공간에서 에이전트가 어떤 종류의
Skills를 제안하는지 검토한 뒤에만 auto 모드로 전환하세요.

## 관련 문서

- [Skills](/ko/tools/skills)
- [Plugins](/ko/tools/plugin)
- [테스트](/ko/reference/test)
