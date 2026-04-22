---
read_when:
    - 에이전트가 수정 사항이나 재사용 가능한 절차를 워크스페이스 Skills로 전환하도록 하려고 합니다
    - 절차형 Skills 메모리를 구성하고 있습니다
    - '`skill_workshop` 도구 동작을 디버깅하고 있습니다'
    - 자동 Skills 생성을 활성화할지 결정하고 있습니다
summary: 검토, 승인, 격리, 핫 Skills 새로고침을 포함한 재사용 가능한 절차의 워크스페이스 Skills로의 실험적 캡처
title: Skill Workshop Plugin
x-i18n:
    generated_at: "2026-04-22T04:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Skill Workshop Plugin

Skill Workshop은 **실험적** 기능입니다. 기본적으로 비활성화되어 있으며, 캡처
휴리스틱과 검토자 프롬프트는 릴리스마다 변경될 수 있고, 자동
쓰기는 먼저 보류 모드 출력을 검토한 뒤 신뢰할 수 있는 워크스페이스에서만 사용해야 합니다.

Skill Workshop은 워크스페이스 Skills를 위한 절차형 메모리입니다. 이를 통해 에이전트는
재사용 가능한 워크플로, 사용자 수정 사항, 어렵게 얻은 수정, 반복되는 문제를 다음 경로 아래의
`SKILL.md` 파일로 전환할 수 있습니다:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

이는 장기 메모리와는 다릅니다:

- **Memory**는 사실, 선호도, 엔터티, 과거 컨텍스트를 저장합니다.
- **Skills**는 에이전트가 향후 작업에서 따라야 하는 재사용 가능한 절차를 저장합니다.
- **Skill Workshop**은 유용한 턴을 안전성 검사와 선택적 승인과 함께
  지속 가능한 워크스페이스 skill로 연결하는 브리지입니다.

Skill Workshop은 에이전트가 다음과 같은 절차를 학습할 때 유용합니다:

- 외부에서 제공된 애니메이션 GIF asset을 검증하는 방법
- 스크린샷 asset을 교체하고 치수를 검증하는 방법
- 리포지토리 전용 QA 시나리오를 실행하는 방법
- 반복되는 provider 실패를 디버깅하는 방법
- 오래된 로컬 워크플로 메모를 복구하는 방법

다음 용도에는 적합하지 않습니다:

- “사용자는 파란색을 좋아한다” 같은 사실
- 광범위한 자전적 메모리
- 원시 transcript 보관
- 시크릿, 자격 증명 또는 숨겨진 프롬프트 텍스트
- 반복되지 않을 일회성 지시

## 기본 상태

번들 Plugin은 **실험적**이며 **기본적으로 비활성화**되어 있습니다. 사용하려면
`plugins.entries.skill-workshop`에서 명시적으로 활성화해야 합니다.

Plugin manifest는 `enabledByDefault: true`를 설정하지 않습니다. Plugin config schema 내부의
`enabled: true` 기본값은 Plugin 엔트리가
이미 선택되고 로드된 이후에만 적용됩니다.

실험적이라는 것은 다음을 의미합니다:

- 이 Plugin은 옵트인 테스트와 dogfooding을 할 수 있을 정도로 지원됩니다
- 제안 저장소, 검토자 임계값, 캡처 휴리스틱은 발전할 수 있습니다
- 보류 승인 모드가 권장 시작 모드입니다
- 자동 적용은 공유되거나 적대적이고 입력이 많은 환경이 아니라, 신뢰할 수 있는 개인/워크스페이스 설정용입니다

## 활성화

최소한의 안전한 config:

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

이 config를 사용하면:

- `skill_workshop` 도구를 사용할 수 있습니다
- 명시적인 재사용 가능한 수정 사항이 보류 중 제안으로 큐에 들어갑니다
- 임계값 기반 검토자 패스가 skill 업데이트를 제안할 수 있습니다
- 보류 중 제안이 적용되기 전까지는 skill 파일이 기록되지 않습니다

자동 쓰기는 신뢰할 수 있는 워크스페이스에서만 사용하세요:

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

`approvalPolicy: "auto"`도 동일한 스캐너와 격리 경로를 사용합니다.
중대한 발견 사항이 있는 제안은 적용하지 않습니다.

## 구성

| 키 | 기본값 | 범위 / 값 | 의미 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin 엔트리가 로드된 후 Plugin을 활성화합니다.                 |
| `autoCapture`        | `true`      | boolean                                     | 성공한 에이전트 턴 이후의 캡처/검토를 활성화합니다.          |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 제안을 큐에 넣거나 안전한 제안을 자동으로 기록합니다.               |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 명시적 수정 캡처, LLM 검토자, 둘 다, 또는 둘 다 아님을 선택합니다. |
| `reviewInterval`     | `15`        | `1..200`                                    | 이 수만큼의 성공한 턴 후 검토자를 실행합니다.                       |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 이 수만큼의 관찰된 도구 호출 후 검토자를 실행합니다.                    |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 내장 검토자 실행의 타임아웃입니다.                               |
| `maxPending`         | `50`        | `1..200`                                    | 워크스페이스당 유지되는 최대 보류/격리 제안 수입니다.                |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 생성되는 skill/지원 파일의 최대 크기입니다.                               |

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
// 검토 우선: 자동으로 캡처하지만 승인이 필요함.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// 신뢰할 수 있는 자동화: 안전한 제안을 즉시 기록.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// 저비용: 검토자 LLM 호출 없음, 명시적인 수정 문구만 사용.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 캡처 경로

Skill Workshop에는 세 가지 캡처 경로가 있습니다.

### 도구 제안

모델은 재사용 가능한 절차를 발견했을 때 또는 사용자가 skill 저장/업데이트를 요청할 때
직접 `skill_workshop`을 호출할 수 있습니다.

이것이 가장 명시적인 경로이며 `autoCapture: false`여도 작동합니다.

### 휴리스틱 캡처

`autoCapture`가 활성화되어 있고 `reviewMode`가 `heuristic` 또는 `hybrid`이면,
Plugin은 성공한 턴에서 명시적인 사용자 수정 문구를 스캔합니다:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

휴리스틱은 가장 최근에 일치한 사용자 지시에서 제안을 만듭니다. 또한
토픽 힌트를 사용해 일반적인 워크플로의 skill 이름을 선택합니다:

- 애니메이션 GIF 작업 -> `animated-gif-workflow`
- 스크린샷 또는 asset 작업 -> `screenshot-asset-workflow`
- QA 또는 시나리오 작업 -> `qa-scenario-workflow`
- GitHub PR 작업 -> `github-pr-workflow`
- 대체값 -> `learned-workflows`

휴리스틱 캡처는 의도적으로 범위를 좁게 유지합니다. 이는 명확한 수정 사항과
반복 가능한 프로세스 메모용이며, 일반적인 transcript 요약용이 아닙니다.

### LLM 검토자

`autoCapture`가 활성화되어 있고 `reviewMode`가 `llm` 또는 `hybrid`이면,
Plugin은 임계값에 도달한 후 간결한 내장 검토자를 실행합니다.

검토자는 다음을 받습니다:

- 최근 transcript 텍스트, 마지막 12,000자까지 제한
- 기존 워크스페이스 Skills 최대 12개
- 기존 skill마다 최대 2,000자
- JSON 전용 지시

검토자는 도구가 없습니다:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

다음과 같이 반환할 수 있습니다:

```json
{ "action": "none" }
```

또는 하나의 skill 제안:

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

기존 skill에 내용을 추가할 수도 있습니다:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

또는 기존 skill의 정확한 텍스트를 교체할 수도 있습니다:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

관련 skill이 이미 있다면 `append` 또는 `replace`를 우선 사용하세요. 적합한 기존 skill이 없을 때만 `create`를 사용하세요.

## 제안 수명주기

생성된 모든 업데이트는 다음 필드를 가진 제안이 됩니다:

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

제안 상태:

- `pending` - 승인 대기 중
- `applied` - `<workspace>/skills`에 기록됨
- `rejected` - 운영자/모델에 의해 거부됨
- `quarantined` - 치명적 스캐너 발견 사항으로 차단됨

상태는 Gateway 상태 디렉터리 아래에서 워크스페이스별로 저장됩니다:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

보류 및 격리된 제안은 skill 이름과 변경
payload로 중복 제거됩니다. 저장소는 최신 보류/격리 제안을
`maxPending` 한도까지 유지합니다.

## 도구 참조

Plugin은 하나의 에이전트 도구를 등록합니다:

```text
skill_workshop
```

### `status`

활성 워크스페이스의 제안 수를 상태별로 셉니다.

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

보류 중인 제안을 나열합니다.

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

격리된 제안을 나열합니다.

```json
{ "action": "list_quarantine" }
```

자동 캡처가 아무 동작도 하지 않는 것처럼 보이고 로그에
`skill-workshop: quarantined <skill>`이 언급될 때 사용하세요.

### `inspect`

ID로 제안을 가져옵니다.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

제안을 만듭니다. `approvalPolicy: "pending"`에서는 기본적으로 큐에 들어갑니다.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

안전한 쓰기를 강제하려면:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

`approvalPolicy: "auto"`에서도 보류를 강제하려면:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

섹션에 추가하려면:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

정확한 텍스트를 교체하려면:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

보류 중인 제안을 적용합니다.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply`는 격리된 제안을 거부합니다:

```text
quarantined proposal cannot be applied
```

### `reject`

제안을 거부 상태로 표시합니다.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

기존 또는 제안된 skill 디렉터리 내부에 지원 파일을 기록합니다.

허용되는 최상위 지원 디렉터리:

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
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

지원 파일은 워크스페이스 범위로 제한되며, 경로 검사를 거치고,
`maxSkillBytes`에 의해 바이트 수가 제한되며, 스캔 후 원자적으로 기록됩니다.

## Skill 쓰기

Skill Workshop은 다음 경로 아래에만 기록합니다:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 이름은 다음과 같이 정규화됩니다:

- 소문자화
- `[a-z0-9_-]`가 아닌 연속 문자열은 `-`로 변경
- 앞뒤의 영숫자가 아닌 문자는 제거
- 최대 길이는 80자
- 최종 이름은 `[a-z0-9][a-z0-9_-]{1,79}`와 일치해야 함

`create`의 경우:

- skill이 존재하지 않으면 Skill Workshop이 새 `SKILL.md`를 기록합니다
- 이미 존재하면 Skill Workshop이 본문을 `## Workflow`에 추가합니다

`append`의 경우:

- skill이 존재하면 Skill Workshop이 요청된 섹션에 추가합니다
- 존재하지 않으면 Skill Workshop이 최소 skill을 만든 뒤 추가합니다

`replace`의 경우:

- skill이 이미 존재해야 합니다
- `oldText`가 정확히 존재해야 합니다
- 첫 번째 정확한 일치만 교체됩니다

모든 쓰기는 원자적으로 이루어지며 메모리 내 Skills 스냅샷을 즉시 새로고침하므로,
새로 만들거나 업데이트한 skill이 Gateway 재시작 없이도 보이게 될 수 있습니다.

## 안전 모델

Skill Workshop에는 생성된 `SKILL.md` 내용과 지원
파일에 대한 안전 스캐너가 있습니다.

중대한 발견 사항은 제안을 격리합니다:

| 규칙 ID | 차단하는 콘텐츠 |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 에이전트에게 이전/상위 지시를 무시하라고 말하는 내용 |
| `prompt-injection-system`              | 시스템 프롬프트, developer 메시지 또는 숨겨진 지시를 언급하는 내용 |
| `prompt-injection-tool`                | 도구 권한/승인을 우회하도록 유도하는 내용 |
| `shell-pipe-to-shell`                  | `curl`/`wget`를 `sh`, `bash`, `zsh`에 파이프하는 내용 |
| `secret-exfiltration`                  | env/process env 데이터를 네트워크로 보내는 것으로 보이는 내용 |

경고 발견 사항은 유지되지만 그 자체로 차단되지는 않습니다:

| 규칙 ID | 경고 대상 |
| -------------------- | -------------------------------- |
| `destructive-delete` | 광범위한 `rm -rf` 스타일 명령    |
| `unsafe-permissions` | `chmod 777` 스타일 권한 사용 |

격리된 제안은 다음과 같습니다:

- `scanFindings`를 유지함
- `quarantineReason`을 유지함
- `list_quarantine`에 표시됨
- `apply`를 통해 적용할 수 없음

격리된 제안을 복구하려면 안전하지 않은 내용을 제거한 새 안전 제안을 만드세요.
저장소 JSON을 수동으로 편집하지 마세요.

## 프롬프트 가이드

활성화되면 Skill Workshop은 에이전트에게
지속 가능한 절차형 메모리를 위해 `skill_workshop`을 사용하라고 알려주는 짧은 프롬프트 섹션을 주입합니다.

이 가이드는 다음을 강조합니다:

- 사실/선호가 아니라 절차
- 사용자 수정 사항
- 명확하지 않은 성공 절차
- 반복되는 문제
- append/replace를 통한 오래되거나 얇거나 잘못된 skill 복구
- 긴 도구 루프나 어려운 수정 후 재사용 가능한 절차 저장
- 짧고 명령형인 skill 텍스트
- transcript 덤프 금지

쓰기 모드 텍스트는 `approvalPolicy`에 따라 달라집니다:

- pending 모드: 제안을 큐에 넣고, 명시적 승인 후에만 적용
- auto 모드: 명확히 재사용 가능할 때 안전한 워크스페이스 skill 업데이트를 적용

## 비용 및 런타임 동작

휴리스틱 캡처는 모델을 호출하지 않습니다.

LLM 검토는 활성/기본 에이전트 모델에서 내장 실행을 사용합니다. 임계값 기반이므로
기본적으로 매 턴마다 실행되지는 않습니다.

검토자는 다음과 같습니다:

- 가능할 때 동일한 구성된 provider/model 컨텍스트를 사용
- 런타임 에이전트 기본값으로 대체
- `reviewTimeoutMs` 사용
- 경량 bootstrap 컨텍스트 사용
- 도구 없음
- 직접 아무것도 기록하지 않음
- 일반 스캐너와
  승인/격리 경로를 통과하는 제안만 생성 가능

검토자가 실패하거나, 시간 초과되거나, 잘못된 JSON을 반환하면 Plugin은
경고/debug 메시지를 기록하고 해당 검토 패스를 건너뜁니다.

## 운영 패턴

사용자가 다음과 같이 말할 때 Skill Workshop을 사용하세요:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

좋은 skill 텍스트:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

좋지 않은 skill 텍스트:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

좋지 않은 버전을 저장하면 안 되는 이유:

- transcript 형태임
- 명령형이 아님
- 잡음이 많은 일회성 세부 정보가 포함됨
- 다음 에이전트가 무엇을 해야 하는지 알려주지 않음

## 디버깅

Plugin이 로드되었는지 확인:

```bash
openclaw plugins list --enabled
```

에이전트/도구 컨텍스트에서 제안 수 확인:

```json
{ "action": "status" }
```

보류 중인 제안 확인:

```json
{ "action": "list_pending" }
```

격리된 제안 확인:

```json
{ "action": "list_quarantine" }
```

일반적인 증상:

| 증상 | 가능한 원인 | 확인 방법 |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 도구를 사용할 수 없음                   | Plugin 엔트리가 활성화되지 않음                                                         | `plugins.entries.skill-workshop.enabled` 및 `openclaw plugins list` |
| 자동 제안이 나타나지 않음         | `autoCapture: false`, `reviewMode: "off"`, 또는 임계값 미충족                    | Config, 제안 상태, Gateway 로그                                |
| 휴리스틱이 캡처하지 못함             | 사용자 표현이 수정 패턴과 일치하지 않음                                      | 명시적인 `skill_workshop.suggest` 사용 또는 LLM 검토자 활성화         |
| 검토자가 제안을 만들지 않음    | 검토자가 `none`을 반환했거나, 잘못된 JSON이거나, 시간 초과                                | Gateway 로그, `reviewTimeoutMs`, 임계값                          |
| 제안이 적용되지 않음               | `approvalPolicy: "pending"`                                                         | `list_pending`, 그 다음 `apply`                                         |
| 제안이 pending에서 사라짐     | 중복 제안 재사용, 최대 pending 가지치기, 또는 적용/거부/격리됨 | `status`, 상태 필터를 사용한 `list_pending`, `list_quarantine`      |
| skill 파일은 있지만 모델이 놓침 | skill 스냅샷이 새로고침되지 않았거나 skill 게이팅이 이를 제외함                            | `openclaw skills` 상태 및 워크스페이스 skill 적격성             |

관련 로그:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 시나리오

리포지토리 기반 QA 시나리오:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

결정적인 커버리지 실행:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

검토자 커버리지 실행:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

검토자 시나리오는 의도적으로 분리되어 있는데, 이는
`reviewMode: "llm"`을 활성화하고 내장 검토자 패스를 실행하기 때문입니다.

## 자동 적용을 활성화하면 안 되는 경우

다음 경우에는 `approvalPolicy: "auto"`를 피하세요:

- 워크스페이스에 민감한 절차가 포함된 경우
- 에이전트가 신뢰할 수 없는 입력을 다루는 경우
- skill이 넓은 팀 전체에서 공유되는 경우
- 아직 프롬프트나 스캐너 규칙을 조정 중인 경우
- 모델이 적대적인 웹/이메일 콘텐츠를 자주 다루는 경우

먼저 pending 모드를 사용하세요. 해당 워크스페이스에서 에이전트가 제안하는
skill 종류를 검토한 뒤에만 auto 모드로 전환하세요.

## 관련 문서

- [Skills](/ko/tools/skills)
- [Plugins](/ko/tools/plugin)
- [테스트](/ko/reference/test)
