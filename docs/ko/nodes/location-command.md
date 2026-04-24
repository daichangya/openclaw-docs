---
read_when:
    - 위치 Node 지원 또는 권한 UI 추가하기
    - Android 위치 권한 또는 포그라운드 동작 설계하기
summary: Node용 위치 명령(`location.get`), 권한 모드, Android 포그라운드 동작
title: 위치 명령
x-i18n:
    generated_at: "2026-04-24T06:22:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## TL;DR

- `location.get`은 Node 명령입니다(`node.invoke`를 통해 호출).
- 기본값은 꺼짐입니다.
- Android 앱 설정은 선택자 사용: Off / While Using.
- 별도 토글: Precise Location.

## 왜 단순 스위치가 아니라 선택자인가

OS 권한은 다단계입니다. 앱 내에서는 선택자를 노출할 수 있지만, 실제 권한 부여 여부는 여전히 OS가 결정합니다.

- iOS/macOS는 시스템 프롬프트/설정에서 **While Using** 또는 **Always**를 노출할 수 있습니다.
- Android 앱은 현재 포그라운드 위치만 지원합니다.
- 정밀 위치는 별도 권한입니다(iOS 14+ “Precise”, Android의 “fine” 대 “coarse”).

UI의 선택자는 우리가 요청하는 모드를 결정하고, 실제 권한 부여는 OS 설정에 있습니다.

## 설정 모델

Node 디바이스별:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 동작:

- `whileUsing`을 선택하면 포그라운드 권한을 요청합니다.
- OS가 요청된 수준을 거부하면, 가장 높은 부여 수준으로 되돌리고 상태를 표시합니다.

## 권한 매핑 (`node.permissions`)

선택 사항입니다. macOS Node는 permissions map을 통해 `location`을 보고합니다. iOS/Android는 이를 생략할 수 있습니다.

## 명령: `location.get`

`node.invoke`를 통해 호출됩니다.

파라미터(권장):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

응답 payload:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

오류(안정적인 코드):

- `LOCATION_DISABLED`: 선택자가 꺼져 있음.
- `LOCATION_PERMISSION_REQUIRED`: 요청된 모드에 필요한 권한이 없음.
- `LOCATION_BACKGROUND_UNAVAILABLE`: 앱이 백그라운드 상태인데 While Using만 허용됨.
- `LOCATION_TIMEOUT`: 정해진 시간 안에 위치를 얻지 못함.
- `LOCATION_UNAVAILABLE`: 시스템 실패 / 사용 가능한 provider 없음.

## 백그라운드 동작

- Android 앱은 백그라운드 상태에서 `location.get`을 거부합니다.
- Android에서 위치를 요청할 때는 OpenClaw를 열어 둔 상태로 유지하세요.
- 다른 Node 플랫폼은 동작이 다를 수 있습니다.

## 모델/도구 통합

- 도구 표면: `nodes` 도구가 `location_get` 작업을 추가합니다(Node 필요).
- CLI: `openclaw nodes location get --node <id>`.
- 에이전트 가이드라인: 사용자가 위치를 활성화했고 범위를 이해할 때만 호출하세요.

## UX 문구(권장)

- Off: “위치 공유가 비활성화되어 있습니다.”
- While Using: “OpenClaw가 열려 있을 때만 사용합니다.”
- Precise: “정확한 GPS 위치를 사용합니다. 대략적인 위치만 공유하려면 꺼 두세요.”

## 관련

- [채널 위치 파싱](/ko/channels/location)
- [카메라 캡처](/ko/nodes/camera)
- [Talk 모드](/ko/nodes/talk)
