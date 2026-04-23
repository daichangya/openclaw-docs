---
description: Real-world OpenClaw projects from the community
read_when:
    - Szukasz rzeczywistych przykładów użycia OpenClaw
    - Aktualizowanie wyróżnionych projektów społecznościowych
summary: Projekty i integracje tworzone przez społeczność, oparte na OpenClaw
title: Prezentacja
x-i18n:
    generated_at: "2026-04-23T10:09:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# Prezentacja

<div className="showcase-hero">
  <p className="showcase-kicker">Tworzone w czatach, terminalach, przeglądarkach i salonach</p>
  <p className="showcase-lead">
    Projekty OpenClaw to nie zabawkowe dema. Ludzie wdrażają pętle przeglądu PR, aplikacje mobilne, automatykę domową,
    systemy głosowe, devtools i workflowy intensywnie korzystające z pamięci z kanałów, których już używają.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Obejrzyj dema</a>
    <a href="#fresh-from-discord">Przeglądaj projekty</a>
    <a href="https://discord.gg/clawd">Udostępnij swój</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Tworzenie natywne dla czatu</strong>
      <span>Workflowy zorientowane na Telegram, WhatsApp, Discord, Beeper, czat webowy i terminal.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Prawdziwa automatyzacja</strong>
      <span>Rezerwacje, zakupy, wsparcie, raportowanie i sterowanie przeglądarką bez czekania na API.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Świat lokalny i fizyczny</strong>
      <span>Drukarki, odkurzacze, kamery, dane zdrowotne, systemy domowe i osobiste bazy wiedzy.</span>
    </div>
  </div>
</div>

<Info>
**Chcesz zostać wyróżniony?** Udostępnij swój projekt w [#self-promotion na Discord](https://discord.gg/clawd) lub [oznacz @openclaw na X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Wideo</a>
  <a href="#fresh-from-discord">Nowości z Discorda</a>
  <a href="#automation-workflows">Automatyzacja</a>
  <a href="#knowledge-memory">Pamięć</a>
  <a href="#voice-phone">Głos i telefon</a>
  <a href="#infrastructure-deployment">Infrastruktura</a>
  <a href="#home-hardware">Dom i sprzęt</a>
  <a href="#community-projects">Społeczność</a>
  <a href="#submit-your-project">Dodaj projekt</a>
</div>

## Wideo

<p className="showcase-section-intro">
  Zacznij tutaj, jeśli chcesz najkrótszej drogi od „co to jest?” do „okej, rozumiem”.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Pełny przewodnik konfiguracji</h3>
    <p>VelvetShark, 28 minut. Instalacja, onboarding i uruchomienie pierwszego działającego asystenta od początku do końca.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Oglądaj na YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Przegląd projektów społeczności</h3>
    <p>Szybszy przelot przez prawdziwe projekty, surfaces i workflowy zbudowane wokół OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Oglądaj na YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Projekty w praktyce</h3>
    <p>Przykłady ze społeczności, od pętli kodowania natywnych dla czatu po sprzęt i osobistą automatyzację.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Oglądaj na YouTube</a>
  </div>
</div>

## Nowości z Discorda

<p className="showcase-section-intro">
  Ostatnie wyróżniające się projekty z obszarów kodowania, devtools, mobile i budowania produktów natywnych dla czatu.
</p>

<CardGroup cols={2}>

<Card title="Przegląd PR → feedback w Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode kończy zmianę → otwiera PR → OpenClaw przegląda diff i odpowiada w Telegramie „drobne sugestie” oraz jasny werdykt dotyczący mergowania (w tym krytyczne poprawki do zastosowania najpierw).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Skill do piwniczki win w kilka minut" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Poproszono „Robby’ego” (@openclaw) o lokalny skill do piwniczki win. Prosi o przykładowy eksport CSV i miejsce zapisu, a potem szybko buduje i testuje skill (w przykładzie 962 butelki).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Autopilot zakupów Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Tygodniowy plan posiłków → stałe produkty → rezerwacja terminu dostawy → potwierdzenie zamówienia. Bez API, tylko sterowanie przeglądarką.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Skrót klawiszowy dla fragmentu ekranu → Gemini vision → natychmiastowy Markdown w schowku.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplikacja desktopowa do zarządzania skills / poleceniami w Agents, Claude, Codex i OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Notatki głosowe Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Społeczność** • `voice` `tts` `telegram`

Opakowuje TTS papla.media i wysyła wyniki jako notatki głosowe Telegram (bez irytującego autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Pomocnik instalowany przez Homebrew do listowania / sprawdzania / śledzenia lokalnych sesji OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Sterowanie drukarką 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Sterowanie i rozwiązywanie problemów drukarek BambuLab: status, zadania, kamera, AMS, kalibracja i więcej.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Transport wiedeński (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Odjazdy w czasie rzeczywistym, utrudnienia, status wind i routing dla komunikacji publicznej Wiednia.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="Szkolne posiłki ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Zautomatyzowana rezerwacja szkolnych posiłków w UK przez ParentPay. Używa współrzędnych myszy do niezawodnego klikania komórek tabeli.
</Card>

<Card title="R2 Upload (Wyślij mi moje pliki)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Przesyłanie do Cloudflare R2 / S3 i generowanie bezpiecznych presigned linków do pobierania. Idealne dla zdalnych instancji OpenClaw.
</Card>

<Card title="Aplikacja iOS przez Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Kompletna aplikacja iOS z mapami i nagrywaniem głosu, wdrożona do TestFlight całkowicie przez czat w Telegramie.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS app on TestFlight" />
</Card>

<Card title="Asystent zdrowotny Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Osobisty asystent zdrowotny AI integrujący dane Oura ring z kalendarzem, wizytami i harmonogramem siłowni.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>
<Card title="Dream Team Keva (14+ agentów)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Ponad 14 agentów pod jednym Gateway z orkiestratorem Opus 4.5 delegującym pracę do workerów Codex. Obszerne [opracowanie techniczne](https://github.com/adam91holt/orchestrated-ai-articles) obejmujące skład Dream Teamu, wybór modeli, sandboxing, webhooki, Heartbeat i przepływy delegowania. [Clawdspace](https://github.com/adam91holt/clawdspace) do sandboxingu agentów. [Wpis na blogu](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI do Linear integrujące się z workflowami agentowymi (Claude Code, OpenClaw). Zarządzanie zgłoszeniami, projektami i workflowami z terminala. Pierwszy zewnętrzny PR został zmergowany!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Odczytywanie, wysyłanie i archiwizowanie wiadomości przez Beeper Desktop. Używa lokalnego API MCP Beeper, dzięki czemu agenci mogą zarządzać wszystkimi Twoimi czatami (iMessage, WhatsApp itd.) z jednego miejsca.
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## Automatyzacja i workflowy

<p className="showcase-section-intro">
  Harmonogramowanie, sterowanie przeglądarką, pętle wsparcia i ta strona produktu, która mówi „po prostu zrób to za mnie”.
</p>

<CardGroup cols={2}>

<Card title="Sterowanie oczyszczaczem powietrza Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code wykrył i potwierdził sterowanie oczyszczaczem, a potem OpenClaw przejął zarządzanie jakością powietrza w pomieszczeniu.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Ładne zdjęcia nieba z kamery" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Wyzwalane przez kamerę dachową: poproś OpenClaw o zrobienie zdjęcia nieba, kiedy wygląda pięknie — zaprojektował skill i zrobił zdjęcie.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Wizualna poranna scena briefingowa" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Zaplanowany prompt generuje każdego ranka pojedynczy obraz „sceny” (pogoda, zadania, data, ulubiony post / cytat) przez personę OpenClaw.
</Card>

<Card title="Rezerwacja kortów do padla" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Checker dostępności Playtomic + CLI do rezerwacji. Już nigdy nie przegapisz wolnego kortu.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Obsługa księgowości" icon="file-invoice-dollar">
  **Społeczność** • `automation` `email` `pdf`
  
  Zbiera PDF-y z e-maili i przygotowuje dokumenty dla doradcy podatkowego. Miesięczna księgowość na autopilocie.
</Card>

<Card title="Tryb deweloperski z kanapy" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Odtworzył całą swoją stronę osobistą przez Telegram podczas oglądania Netflixa — Notion → Astro, zmigrowano 18 wpisów, DNS do Cloudflare. Ani razu nie otworzył laptopa.
</Card>

<Card title="Agent do wyszukiwania pracy" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Wyszukuje oferty pracy, dopasowuje je do słów kluczowych z CV i zwraca trafne możliwości z linkami. Zbudowany w 30 minut przy użyciu API JSearch.
</Card>

<Card title="Generator skilla Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw połączył się z Jira, a następnie wygenerował nowy skill w locie (zanim jeszcze istniał w ClawHub).
</Card>

<Card title="Skill Todoist przez Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Zautomatyzował zadania Todoist i kazał OpenClaw wygenerować skill bezpośrednio w czacie Telegram.
</Card>

<Card title="Analiza TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Loguje się do TradingView przez automatyzację przeglądarki, robi zrzuty wykresów i wykonuje analizę techniczną na żądanie. Bez API — tylko sterowanie przeglądarką.
</Card>

<Card title="Automatyczne wsparcie w Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Obserwuje firmowy kanał Slack, odpowiada pomocnie i przekazuje powiadomienia do Telegram. Samodzielnie naprawił błąd produkcyjny w wdrożonej aplikacji bez proszenia.
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## Wiedza i pamięć

<p className="showcase-section-intro">
  Systemy, które indeksują, przeszukują, zapamiętują i rozumują na podstawie wiedzy osobistej lub zespołowej.
</p>

<CardGroup cols={2}>

<Card title="xuezh Chinese Learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Silnik do nauki chińskiego z informacją zwrotną o wymowie i przepływami nauki przez OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="Skarbiec pamięci WhatsApp" icon="vault">
  **Społeczność** • `memory` `transcription` `indexing`
  
  Wczytuje pełne eksporty WhatsApp, transkrybuje ponad 1000 notatek głosowych, porównuje je z logami git i tworzy powiązane raporty Markdown.
</Card>

<Card title="Wyszukiwanie semantyczne Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Dodaje wyszukiwanie wektorowe do zakładek Karakeep przy użyciu embeddingów Qdrant + OpenAI / Ollama.
</Card>

<Card title="Pamięć Inside-Out-2" icon="brain">
  **Społeczność** • `memory` `beliefs` `self-model`
  
  Osobny menedżer pamięci, który zamienia pliki sesji w wspomnienia → przekonania → rozwijający się model siebie.
</Card>

</CardGroup>

<a id="voice-phone"></a>

## Głos i telefon

<p className="showcase-section-intro">
  Punkty wejścia speech-first, mosty telefoniczne i workflowy intensywnie korzystające z transkrypcji.
</p>

<CardGroup cols={2}>

<Card title="Most telefoniczny Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Most asystenta głosowego Vapi ↔ HTTP OpenClaw. Połączenia telefoniczne z agentem niemal w czasie rzeczywistym.
</Card>

<Card title="Transkrypcja OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Wielojęzyczna transkrypcja audio przez OpenRouter (Gemini itd.). Dostępne w ClawHub.
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## Infrastruktura i wdrożenie

<p className="showcase-section-intro">
  Pakowanie, wdrożenia i integracje, które ułatwiają uruchamianie i rozszerzanie OpenClaw.
</p>

<CardGroup cols={2}>

<Card title="Dodatek Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw działający na Home Assistant OS z obsługą tunelu SSH i trwałym stanem.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Sterowanie i automatyzacja urządzeń Home Assistant za pomocą języka naturalnego.
</Card>

<Card title="Pakowanie Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Kompletny, oparty na Nix sposób konfiguracji OpenClaw do powtarzalnych wdrożeń.
</Card>

<Card title="Kalendarz CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill kalendarza używający khal / vdirsyncer. Integracja z samohostowanym kalendarzem.
</Card>

</CardGroup>

<a id="home-hardware"></a>

## Dom i sprzęt

<p className="showcase-section-intro">
  Fizyczna strona OpenClaw: domy, czujniki, kamery, odkurzacze i inne urządzenia.
</p>

<CardGroup cols={2}>

<Card title="Automatyzacja GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automatyzacja domu oparta natywnie na Nix z OpenClaw jako interfejsem oraz pięknymi dashboardami Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Odkurzacz Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Steruj swoim robotem sprzątającym Roborock za pomocą naturalnej rozmowy.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Projekty społeczności

<p className="showcase-section-intro">
  Rzeczy, które wyrosły poza pojedynczy workflow i stały się szerszymi produktami lub ekosystemami.
</p>

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Społeczność** • `marketplace` `astronomy` `webapp`
  
  Kompletny marketplace sprzętu astronomicznego. Zbudowany z / wokół ekosystemu OpenClaw.
</Card>

</CardGroup>

---

## Dodaj swój projekt

<p className="showcase-section-intro">
  Jeśli tworzysz coś ciekawego z OpenClaw, wyślij nam to. Mocne zrzuty ekranu i konkretne efekty pomagają.
</p>

Masz coś do pokazania? Chętnie to wyróżnimy!

<Steps>
  <Step title="Udostępnij">
    Opublikuj w [#self-promotion na Discord](https://discord.gg/clawd) lub [napisz do @openclaw na X](https://x.com/openclaw)
  </Step>
  <Step title="Dodaj szczegóły">
    Opowiedz nam, co to robi, podaj link do repo / dema i dodaj zrzut ekranu, jeśli go masz
  </Step>
  <Step title="Zostań wyróżniony">
    Dodamy wyróżniające się projekty do tej strony
  </Step>
</Steps>
