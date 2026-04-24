---
description: Real-world OpenClaw projects from the community
read_when:
    - 실제 OpenClaw 사용 예시를 찾는 경우
    - 커뮤니티 프로젝트 하이라이트 업데이트하기
summary: OpenClaw로 구동되는 커뮤니티 제작 프로젝트 및 통합
title: 쇼케이스
x-i18n:
    generated_at: "2026-04-24T06:37:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

OpenClaw 프로젝트는 장난감 데모가 아닙니다. 사람들은 이미 사용하는 채널에서 PR 검토 루프, 모바일 앱, 홈 자동화, 음성 시스템, devtools, 메모리 중심 워크플로를 실제로 배포하고 있습니다 — Telegram, WhatsApp, Discord, 터미널 위에 구축된 채팅 네이티브 빌드, API를 기다리지 않고 예약, 쇼핑, 지원을 처리하는 실제 자동화, 그리고 프린터, 로봇청소기, 카메라, 홈 시스템과 연결되는 물리 세계 통합까지 포함됩니다.

<Info>
**소개되고 싶나요?** [Discord의 #self-promotion](https://discord.gg/clawd)에서 프로젝트를 공유하거나 [X에서 @openclaw를 태그](https://x.com/openclaw)하세요.
</Info>

## 동영상

"이게 뭐지?"에서 "좋아, 이해했다"까지 가장 짧은 경로를 원한다면 여기부터 시작하세요.

<CardGroup cols={3}>

<Card title="전체 설정 워크스루" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28분. 설치, 온보딩, 첫 동작하는 비서까지 전 과정을 다룹니다.
</Card>

<Card title="커뮤니티 쇼케이스 릴" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  OpenClaw를 중심으로 구축된 실제 프로젝트, 표면, 워크플로를 더 빠르게 훑어봅니다.
</Card>

<Card title="현실 속 프로젝트" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  채팅 네이티브 코딩 루프부터 하드웨어와 개인 자동화까지, 커뮤니티 사례를 보여줍니다.
</Card>

</CardGroup>

## Discord 최신 사례

코딩, devtools, 모바일, 채팅 네이티브 제품 빌드 전반에서 최근 눈에 띄는 사례들입니다.

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode가 변경을 완료하고 PR을 열면, OpenClaw가 diff를 검토하고 Telegram에서 제안과 명확한 병합 판정을 함께 보냅니다.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram으로 전달된 OpenClaw PR 리뷰 피드백" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby"(@openclaw)에게 로컬 와인 저장고 Skill을 요청했습니다. 샘플 CSV 내보내기와 저장 경로를 요청한 뒤 Skill을 만들고 테스트합니다(예시에서는 962병).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSV에서 로컬 와인 저장고 Skill을 만드는 OpenClaw" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

주간 식단 계획, 자주 사는 품목, 배송 슬롯 예약, 주문 확인. API 없이 브라우저 제어만으로 처리합니다.

  <img src="/assets/showcase/tesco-shop.jpg" alt="채팅을 통한 Tesco 쇼핑 자동화" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

화면 영역에 핫키를 누르면 Gemini 비전이 동작하고, 즉시 Markdown이 클립보드에 들어갑니다.

  <img src="/assets/showcase/snag.png" alt="SNAG 스크린샷-투-Markdown 도구" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex, OpenClaw 전반의 Skills와 명령을 관리하는 데스크톱 앱입니다.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 앱" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **커뮤니티** • `voice` `tts` `telegram`

papla.media TTS를 감싸고 결과를 Telegram 음성 노트로 보냅니다(거슬리는 자동 재생 없음).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS에서 생성된 Telegram 음성 노트 출력" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

로컬 OpenAI Codex 세션을 목록화, 점검, 모니터링하는 Homebrew 설치 helper입니다(CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub의 CodexMonitor" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab 프린터를 제어하고 문제를 해결합니다: 상태, 작업, 카메라, AMS, 보정 등.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub의 Bambu CLI Skill" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

비엔나 대중교통의 실시간 출발 정보, 운행 중단, 엘리베이터 상태, 경로를 제공합니다.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien Skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay를 통한 영국 학교 급식 예약 자동화. 신뢰할 수 있는 표 셀 클릭을 위해 마우스 좌표를 사용합니다.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3에 업로드하고 안전한 presigned 다운로드 링크를 생성합니다. 원격 OpenClaw 인스턴스에 유용합니다.
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

지도와 음성 녹음을 포함한 완전한 iOS 앱을 만들고, 전 과정을 Telegram 채팅만으로 TestFlight에 배포했습니다.

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight의 iOS 앱" />
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring 데이터와 캘린더, 약속, 헬스장 일정을 통합한 개인 AI 건강 비서입니다.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring 건강 비서" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Opus 4.5 orchestrator가 Codex 워커에게 작업을 위임하는, 하나의 gateway 아래 14개 이상의 에이전트 구성입니다. [기술 문서](https://github.com/adam91holt/orchestrated-ai-articles)와 에이전트 샌드박싱을 위한 [Clawdspace](https://github.com/adam91holt/clawdspace)를 확인하세요.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

에이전트형 워크플로(Claude Code, OpenClaw)와 통합되는 Linear용 CLI입니다. 터미널에서 이슈, 프로젝트, 워크플로를 관리합니다.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop을 통해 메시지를 읽고, 보내고, 보관합니다. Beeper 로컬 MCP API를 사용하므로 에이전트가 iMessage, WhatsApp 등을 포함한 모든 채팅을 한곳에서 관리할 수 있습니다.
</Card>

</CardGroup>

## 자동화 및 워크플로

일정 예약, 브라우저 제어, 지원 루프, 그리고 "그냥 작업을 대신 해줘"에 가까운 제품 측면입니다.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code가 공기청정기 제어를 발견하고 확인한 뒤, OpenClaw가 이를 넘겨받아 실내 공기질을 관리합니다.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw를 통한 Winix 공기청정기 제어" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

지붕 카메라를 통해 트리거됩니다. 하늘이 예뻐 보일 때마다 OpenClaw에게 사진을 찍으라고 요청합니다. Skill을 설계하고 실제로 촬영까지 했습니다.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw가 촬영한 지붕 카메라 하늘 스냅샷" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

예약된 프롬프트가 매일 아침 하나의 장면 이미지를 생성합니다(날씨, 작업, 날짜, 좋아하는 게시물 또는 인용문) — OpenClaw 페르소나를 통해.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 예약 가능 여부 확인기와 예약 CLI입니다. 빈 코트를 다시는 놓치지 마세요.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 스크린샷" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **커뮤니티** • `automation` `email` `pdf`

이메일에서 PDF를 수집하고 세무사를 위한 문서를 준비합니다. 월별 회계가 자동화됩니다.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix를 보면서 Telegram만으로 개인 사이트 전체를 재구축했습니다 — Notion에서 Astro로, 18개의 글을 마이그레이션하고, DNS를 Cloudflare로 옮겼습니다. 노트북을 열지도 않았습니다.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

구인 목록을 검색하고 CV 키워드와 매칭해 관련 기회를 링크와 함께 반환합니다. JSearch API를 사용해 30분 만에 만들었습니다.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw가 Jira에 연결된 뒤, 새 Skill을 즉석에서 생성했습니다(ClawHub에 존재하기도 전에).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist 작업을 자동화하고, OpenClaw가 Telegram 채팅에서 직접 Skill을 생성하게 했습니다.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

브라우저 자동화를 통해 TradingView에 로그인하고, 차트를 스크린샷으로 캡처하며, 요청 시 기술 분석을 수행합니다. API가 아니라 브라우저 제어만 사용합니다.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

회사 Slack 채널을 감시하고, 유용하게 응답하며, 알림을 Telegram으로 전달합니다. 요청받지 않았는데도 배포된 앱의 프로덕션 버그를 자율적으로 수정했습니다.
</Card>

</CardGroup>

## 지식과 메모리

개인 또는 팀 지식을 인덱싱하고, 검색하고, 기억하고, 그 위에서 추론하는 시스템들입니다.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw를 통한 발음 피드백과 학습 흐름을 갖춘 중국어 학습 엔진입니다.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 발음 피드백" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **커뮤니티** • `memory` `transcription` `indexing`

전체 WhatsApp 내보내기를 수집하고, 1천 개 이상의 음성 노트를 전사하며, git 로그와 교차 검증한 뒤, 연결된 markdown 보고서를 출력합니다.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant와 OpenAI 또는 Ollama 임베딩을 사용해 Karakeep 북마크에 벡터 검색을 추가합니다.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **커뮤니티** • `memory` `beliefs` `self-model`

세션 파일을 메모리로, 메모리를 신념으로, 신념을 진화하는 self model로 바꾸는 별도 메모리 관리자입니다.
</Card>

</CardGroup>

## 음성 및 전화

음성 우선 진입점, 전화 브리지, 전사 중심 워크플로입니다.

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 음성 비서에서 OpenClaw HTTP로 연결하는 브리지입니다. 에이전트와 거의 실시간 전화 통화를 할 수 있습니다.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter를 통한 다국어 오디오 전사(Gemini 등). ClawHub에서 사용할 수 있습니다.
</Card>

</CardGroup>

## 인프라 및 배포

OpenClaw를 더 쉽게 실행하고 확장할 수 있게 해주는 패키징, 배포, 통합입니다.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH 터널 지원과 영구 상태를 포함해 Home Assistant OS에서 실행되는 OpenClaw gateway입니다.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

자연어로 Home Assistant 기기를 제어하고 자동화합니다.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

재현 가능한 배포를 위한 배터리 포함 nix 기반 OpenClaw 설정입니다.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

khal과 vdirsyncer를 사용하는 캘린더 Skill입니다. 셀프 호스팅 캘린더 통합입니다.
</Card>

</CardGroup>

## 홈 및 하드웨어

OpenClaw의 물리 세계 측면: 집, 센서, 카메라, 로봇청소기, 기타 기기들입니다.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

인터페이스로 OpenClaw를 사용하고 Grafana 대시보드까지 포함한, Nix 네이티브 홈 자동화입니다.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

자연스러운 대화로 Roborock 로봇청소기를 제어합니다.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## 커뮤니티 프로젝트

하나의 워크플로를 넘어 더 넓은 제품이나 생태계로 성장한 것들입니다.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **커뮤니티** • `marketplace` `astronomy` `webapp`

완전한 천문 장비 마켓플레이스입니다. OpenClaw 생태계와 함께, 그리고 그 위에서 구축되었습니다.
</Card>

</CardGroup>

## 프로젝트 제출

<Steps>
  <Step title="공유하기">
    [Discord의 #self-promotion](https://discord.gg/clawd)에 게시하거나 [@openclaw에 트윗](https://x.com/openclaw)하세요.
  </Step>
  <Step title="세부 정보 포함">
    무엇을 하는지 설명하고, 저장소 또는 데모 링크를 넣고, 가능하면 스크린샷도 공유해 주세요.
  </Step>
  <Step title="소개되기">
    눈에 띄는 프로젝트는 이 페이지에 추가합니다.
  </Step>
</Steps>

## 관련 항목

- [Getting started](/ko/start/getting-started)
- [OpenClaw](/ko/start/openclaw)
