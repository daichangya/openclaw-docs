---
description: Real-world OpenClaw projects from the community
read_when:
    - Szukasz rzeczywistych przykładów użycia OpenClaw
    - Aktualizowanie wyróżnionych projektów społecznościowych
summary: Projekty i integracje tworzone przez społeczność, oparte na OpenClaw
title: Prezentacja
x-i18n:
    generated_at: "2026-04-15T09:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 797d0b85c9eca920240c79d870eb9636216714f3eba871c5ebd0f7f40cf7bbf1
    source_path: start/showcase.md
    workflow: 15
---

<!-- markdownlint-disable MD033 -->

# Prezentacja

<div className="showcase-hero">
  <p className="showcase-kicker">Tworzone w czatach, terminalach, przeglądarkach i salonach</p>
  <p className="showcase-lead">
    Projekty OpenClaw to nie są zabawkowe dema. Ludzie wdrażają pętle przeglądu PR, aplikacje mobilne, automatykę domową,
    systemy głosowe, narzędzia deweloperskie i przepływy pracy intensywnie korzystające z pamięci z kanałów, których już używają.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Obejrzyj dema</a>
    <a href="#fresh-from-discord">Przeglądaj projekty</a>
    <a href="https://discord.gg/clawd">Udostępnij swój</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Tworzenie natywne dla czatu</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, czat webowy i przepływy pracy z terminalem na pierwszym planie.</span>
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
**Chcesz zostać wyróżniony?** Udostępnij swój projekt w [#self-promotion na Discordzie](https://discord.gg/clawd) albo [oznacz @openclaw na X](https://x.com/openclaw).
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

<h2 id="videos">Wideo</h2>

<p className="showcase-section-intro">
  Zacznij tutaj, jeśli chcesz przejść najkrótszą drogę od „co to jest?” do „okej, rozumiem”.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: Self-hostowane AI, którym Siri powinna była być (pełna konfiguracja)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Pełny przewodnik po konfiguracji</h3>
    <p>VelvetShark, 28 minut. Instalacja, onboarding i uruchomienie pierwszego działającego asystenta od początku do końca.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Obejrzyj na YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="Wideo prezentujące OpenClaw"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Przegląd projektów społeczności</h3>
    <p>Szybszy przegląd prawdziwych projektów, powierzchni i przepływów pracy zbudowanych wokół OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Obejrzyj na YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="Prezentacja społeczności OpenClaw"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Projekty w praktyce</h3>
    <p>Przykłady ze społeczności — od pętli programowania natywnych dla czatu po sprzęt i osobistą automatyzację.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Obejrzyj na YouTube</a>
  </div>
</div>

<h2 id="fresh-from-discord">Nowości z Discorda</h2>

<p className="showcase-section-intro">
  Ostatnie wyróżniające się przykłady z obszaru kodowania, narzędzi deweloperskich, mobile i budowania produktów natywnych dla czatu.
</p>

<CardGroup cols={2}>

<Card title="Przegląd PR → Informacja zwrotna na Telegramie" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode kończy zmianę → otwiera PR → OpenClaw przegląda diff i odpowiada na Telegramie „drobne sugestie” oraz jasny werdykt dotyczący mergowania (w tym krytyczne poprawki do zastosowania najpierw).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Informacja zwrotna z przeglądu PR OpenClaw dostarczona na Telegramie" />
</Card>

<Card title="Skill do piwniczki z winem w kilka minut" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Poproszono „Robby’ego” (@openclaw) o lokalny skill do piwniczki z winem. Prosi o przykładowy eksport CSV i miejsce jego przechowywania, a następnie szybko buduje/testuje skill (962 butelki w przykładzie).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw budujący lokalny skill do piwniczki z winem na podstawie CSV" />
</Card>

<Card title="Autopilot zakupów Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Tygodniowy plan posiłków → produkty stałe → rezerwacja terminu dostawy → potwierdzenie zamówienia. Bez API, tylko sterowanie przeglądarką.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatyzacja zakupów Tesco przez czat" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Skrót klawiszowy do zaznaczenia obszaru ekranu → wizja Gemini → natychmiastowy Markdown w schowku.

  <img src="/assets/showcase/snag.png" alt="Narzędzie SNAG screenshot-to-markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplikacja desktopowa do zarządzania Skills/poleceniami w Agents, Claude, Codex i OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplikacja Agents UI" />
</Card>

<Card title="Notatki głosowe Telegrama (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Społeczność** • `voice` `tts` `telegram`

Opakowuje TTS papla.media i wysyła wyniki jako notatki głosowe Telegrama (bez irytującego automatycznego odtwarzania).

  <img src="/assets/showcase/papla-tts.jpg" alt="Wyjście TTS jako notatka głosowa Telegrama" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Pomocnik instalowany przez Homebrew do listowania/sprawdzania/śledzenia lokalnych sesji OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor w ClawHub" />
</Card>

<Card title="Sterowanie drukarką 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Sterowanie i diagnozowanie drukarek BambuLab: status, zadania, kamera, AMS, kalibracja i nie tylko.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI w ClawHub" />
</Card>

<Card title="Transport wiedeński (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Odjazdy w czasie rzeczywistym, zakłócenia, status wind i wyznaczanie tras dla transportu publicznego w Wiedniu.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien w ClawHub" />
</Card>

<Card title="Posiłki szkolne ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Zautomatyzowana rezerwacja posiłków szkolnych w Wielkiej Brytanii przez ParentPay. Używa współrzędnych myszy do niezawodnego klikania komórek tabeli.
</Card>

<Card title="Przesyłanie do R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Przesyłaj do Cloudflare R2/S3 i generuj bezpieczne presigned linki do pobierania. Idealne dla zdalnych instancji OpenClaw.
</Card>

<Card title="Aplikacja iOS przez Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Zbudowano kompletną aplikację iOS z mapami i nagrywaniem głosu, wdrożoną do TestFlight całkowicie przez czat na Telegramie.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Aplikacja iOS w TestFlight" />
</Card>

<Card title="Asystent zdrowia Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Osobisty asystent zdrowia AI integrujący dane Oura ring z kalendarzem, wizytami i planem siłowni.

  <img src="/assets/showcase/oura-health.png" alt="Asystent zdrowia Oura ring" />
</Card>
<Card title="Kev's Dream Team (14+ agentów)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Ponad 14 agentów pod jedną bramą z orkiestratorem Opus 4.5 delegującym do workerów Codex. Kompleksowy [opis techniczny](https://github.com/adam91holt/orchestrated-ai-articles) obejmujący skład Dream Team, wybór modeli, sandboxing, webhooki, Heartbeat i przepływy delegowania. [Clawdspace](https://github.com/adam91holt/clawdspace) do sandboxingu agentów. [Wpis na blogu](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI dla Linear, które integruje się z przepływami pracy agentowych systemów (Claude Code, OpenClaw). Zarządzaj zgłoszeniami, projektami i przepływami pracy z terminala. Pierwszy zewnętrzny PR został zmergowany!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Odczytuj, wysyłaj i archiwizuj wiadomości przez Beeper Desktop. Używa lokalnego API MCP Beeper, dzięki czemu agenci mogą zarządzać wszystkimi Twoimi czatami (iMessage, WhatsApp itd.) w jednym miejscu.
</Card>

</CardGroup>

<h2 id="automation-workflows">Automatyzacja i przepływy pracy</h2>

<p className="showcase-section-intro">
  Planowanie, sterowanie przeglądarką, pętle wsparcia i ta strona produktu, która mówi „po prostu zrób to zadanie za mnie”.
</p>

<CardGroup cols={2}>

<Card title="Sterowanie oczyszczaczem powietrza Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code wykrył i potwierdził sterowanie oczyszczaczem, a potem OpenClaw przejmuje zarządzanie jakością powietrza w pomieszczeniu.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Sterowanie oczyszczaczem powietrza Winix przez OpenClaw" />
</Card>

<Card title="Ładne ujęcia nieba z kamery" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Wyzwalane przez kamerę na dachu: poproś OpenClaw o zrobienie zdjęcia nieba, kiedy wygląda pięknie — zaprojektował skill i wykonał zdjęcie.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Migawka nieba z kamery dachowej wykonana przez OpenClaw" />
</Card>

<Card title="Wizualna poranna scena informacyjna" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Zaplanowany prompt generuje każdego ranka pojedynczy obraz „sceny” (pogoda, zadania, data, ulubiony post/cytat) przez personę OpenClaw.
</Card>

<Card title="Rezerwacja kortu do padla" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Sprawdzanie dostępności w Playtomic + CLI do rezerwacji. Nigdy więcej nie przegap wolnego kortu.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Zrzut ekranu padel-cli" />
</Card>

<Card title="Przyjmowanie dokumentów księgowych" icon="file-invoice-dollar">
  **Społeczność** • `automation` `email` `pdf`
  
  Zbiera pliki PDF z e-maila, przygotowuje dokumenty dla doradcy podatkowego. Miesięczna księgowość na autopilocie.
</Card>

<Card title="Tryb programisty z kanapy" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Zbudował od nowa całą osobistą stronę przez Telegram, oglądając Netflix — Notion → Astro, przeniesionych 18 wpisów, DNS do Cloudflare. Ani razu nie otworzył laptopa.
</Card>

<Card title="Agent do szukania pracy" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Przeszukuje oferty pracy, dopasowuje je do słów kluczowych z CV i zwraca odpowiednie możliwości wraz z linkami. Zbudowany w 30 minut przy użyciu API JSearch.
</Card>

<Card title="Generator skilla Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw połączył się z Jira, a następnie wygenerował nowy skill na bieżąco (zanim pojawił się w ClawHub).
</Card>

<Card title="Skill Todoist przez Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Zautomatyzował zadania Todoist i kazał OpenClaw wygenerować skill bezpośrednio w czacie Telegrama.
</Card>

<Card title="Analiza TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Loguje się do TradingView przez automatyzację przeglądarki, robi zrzuty wykresów i na żądanie wykonuje analizę techniczną. Bez API — tylko sterowanie przeglądarką.
</Card>

<Card title="Automatyczne wsparcie na Slacku" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Obserwuje firmowy kanał Slack, pomocnie odpowiada i przekazuje powiadomienia do Telegrama. Samodzielnie naprawił błąd produkcyjny we wdrożonej aplikacji bez żadnej prośby.
</Card>

</CardGroup>

<h2 id="knowledge-memory">Wiedza i pamięć</h2>

<p className="showcase-section-intro">
  Systemy, które indeksują, wyszukują, zapamiętują i rozumują na podstawie wiedzy osobistej lub zespołowej.
</p>

<CardGroup cols={2}>

<Card title="xuezh do nauki chińskiego" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Silnik do nauki chińskiego z informacją zwrotną o wymowie i przepływami nauki przez OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Informacja zwrotna o wymowie w xuezh" />
</Card>

<Card title="Skarbiec pamięci WhatsApp" icon="vault">
  **Społeczność** • `memory` `transcription` `indexing`
  
  Importuje pełne eksporty WhatsApp, transkrybuje ponad 1 tys. notatek głosowych, porównuje je z logami git i generuje powiązane raporty w Markdownie.
</Card>

<Card title="Wyszukiwanie semantyczne Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Dodaje wyszukiwanie wektorowe do zakładek Karakeep przy użyciu embeddingów Qdrant + OpenAI/Ollama.
</Card>

<Card title="Pamięć Inside-Out-2" icon="brain">
  **Społeczność** • `memory` `beliefs` `self-model`
  
  Osobny menedżer pamięci, który zamienia pliki sesji w wspomnienia → przekonania → ewoluujący model siebie.
</Card>

</CardGroup>

<h2 id="voice-phone">Głos i telefon</h2>

<p className="showcase-section-intro">
  Punkty wejścia oparte na mowie, mosty telefoniczne i przepływy pracy intensywnie korzystające z transkrypcji.
</p>

<CardGroup cols={2}>

<Card title="Most telefoniczny Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Most HTTP Vapi voice assistant ↔ OpenClaw. Rozmowy telefoniczne z Twoim agentem niemal w czasie rzeczywistym.
</Card>

<Card title="Transkrypcja OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Wielojęzyczna transkrypcja audio przez OpenRouter (Gemini itd.). Dostępne w ClawHub.
</Card>

</CardGroup>

<h2 id="infrastructure-deployment">Infrastruktura i wdrożenie</h2>

<p className="showcase-section-intro">
  Pakowanie, wdrażanie i integracje, które ułatwiają uruchamianie i rozszerzanie OpenClaw.
</p>

<CardGroup cols={2}>

<Card title="Dodatek Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw działający w Home Assistant OS z obsługą tunelu SSH i trwałym stanem.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Steruj urządzeniami Home Assistant i automatyzuj je za pomocą języka naturalnego.
</Card>

<Card title="Pakietowanie Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Kompletny, oparty na Nix zestaw konfiguracji OpenClaw do powtarzalnych wdrożeń.
</Card>

<Card title="Kalendarz CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill kalendarza używający khal/vdirsyncer. Self-hostowana integracja kalendarza.
</Card>

</CardGroup>

<h2 id="home-hardware">Dom i sprzęt</h2>

<p className="showcase-section-intro">
  Fizyczna strona OpenClaw: domy, czujniki, kamery, odkurzacze i inne urządzenia.
</p>

<CardGroup cols={2}>

<Card title="Automatyzacja GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automatyka domowa natywna dla Nix z OpenClaw jako interfejsem oraz pięknymi pulpitami Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Pulpit Grafana GoHome" />
</Card>

<Card title="Odkurzacz Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Steruj swoim robotem sprzątającym Roborock za pomocą naturalnej rozmowy.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status Roborock" />
</Card>

</CardGroup>

<h2 id="community-projects">Projekty społeczności</h2>

<p className="showcase-section-intro">
  Rzeczy, które wyrosły poza pojedynczy przepływ pracy i stały się szerszymi produktami lub ekosystemami.
</p>

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Społeczność** • `marketplace` `astronomy` `webapp`
  
  Pełnoprawny marketplace sprzętu astronomicznego. Zbudowany z użyciem ekosystemu OpenClaw lub wokół niego.
</Card>

</CardGroup>

---

<h2 id="submit-your-project">Dodaj swój projekt</h2>

<p className="showcase-section-intro">
  Jeśli tworzysz coś ciekawego z OpenClaw, prześlij to. Mocne zrzuty ekranu i konkretne rezultaty pomagają.
</p>

Masz coś do pokazania? Chętnie to wyróżnimy!

<Steps>
  <Step title="Udostępnij">
    Opublikuj w [#self-promotion na Discordzie](https://discord.gg/clawd) albo [napisz do @openclaw na X](https://x.com/openclaw)
  </Step>
  <Step title="Dodaj szczegóły">
    Powiedz nam, co to robi, podaj link do repo/demo i dołącz zrzut ekranu, jeśli go masz
  </Step>
  <Step title="Zostań wyróżniony">
    Dodamy wyróżniające się projekty do tej strony
  </Step>
</Steps>
