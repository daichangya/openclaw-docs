---
read_when:
    - Odpowiedzi na typowe pytania dotyczące konfiguracji, instalacji, wdrażania lub działania w czasie wykonywania
    - Wstępna analiza problemów zgłaszanych przez użytkowników przed głębszym debugowaniem
summary: Najczęściej zadawane pytania dotyczące konfiguracji, ustawień i używania OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-20T09:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae8efda399e34f59f22f6ea8ce218eaf7b872e4117d8596ec19c09891d70813b
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Szybkie odpowiedzi oraz głębsze wskazówki diagnostyczne dla rzeczywistych konfiguracji (lokalne środowisko deweloperskie, VPS, multi-agent, OAuth/klucze API, failover modeli). Informacje o diagnostyce działania znajdziesz w [Rozwiązywaniu problemów](/pl/gateway/troubleshooting). Pełne informacje o konfiguracji znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Pierwsze 60 sekund, jeśli coś nie działa

1. **Szybki status (pierwsze sprawdzenie)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, dostępność gateway/usługi, agenci/sesje, konfiguracja dostawcy + problemy środowiska uruchomieniowego (gdy Gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnoza tylko do odczytu z końcówką logu (tokeny są ukryte).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje stan supervisora podczas działania względem osiągalności RPC, docelowy adres URL sondy oraz konfigurację, której usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną sondę stanu Gateway, w tym sondy kanałów, gdy są obsługiwane
   (wymaga osiągalnego Gateway). Zobacz [Stan zdrowia](/pl/gateway/health).

5. **Podgląd najnowszego logu**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielone od logów usługi; zobacz [Logowanie](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

6. **Uruchom doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację i stan + uruchamia kontrole stanu. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę konfiguracji przy błędach
   ```

   Prosi uruchomiony Gateway o pełną migawkę (tylko WS). Zobacz [Stan zdrowia](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

<AccordionGroup>
  <Accordion title="Utknąłem/utknęłam, jaki jest najszybszy sposób, żeby ruszyć dalej">
    Użyj lokalnego agenta AI, który może **widzieć Twój komputer**. To jest znacznie skuteczniejsze niż pytanie
    na Discord, ponieważ większość przypadków typu „utknąłem/utknęłam” to **lokalne problemy z konfiguracją lub środowiskiem**,
    których zdalni pomagający nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia potrafią czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawić konfigurację
    na poziomie komputera (PATH, usługi, uprawnienia, pliki uwierzytelniania). Udostępnij im **pełny checkout kodu źródłowego**
    przez instalację hackowalną (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, dzięki czemu agent może czytać kod + dokumentację i
    analizować dokładnie tę wersję, której używasz. Zawsze możesz później wrócić do wersji stabilnej,
    ponownie uruchamiając instalator bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a potem wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany są małe i łatwiejsze do sprawdzenia.

    Jeśli odkryjesz prawdziwy błąd lub poprawkę, zgłoś issue na GitHub albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij wyniki, gdy prosisz o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybka migawka stanu gateway/agenta + podstawowej konfiguracji.
    - `openclaw models status`: sprawdza uwierzytelnianie dostawcy + dostępność modeli.
    - `openclaw doctor`: weryfikuje i naprawia typowe problemy z konfiguracją i stanem.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś nie działa](#pierwsze-60-sekund-jeśli-coś-nie-działa).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle pomija uruchomienia. Co oznaczają powody pominięcia?">
    Typowe powody pomijania Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty szkielet lub same nagłówki
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań jeszcze nie jest wymagalny
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu wymagalności są przesuwane dopiero po zakończeniu
    rzeczywistego uruchomienia heartbeat. Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie wdrażania:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może również automatycznie zbudować zasoby interfejsu. Po wdrożeniu zwykle uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (współtwórcy/deweloperzy):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Jeśli nie masz jeszcze instalacji globalnej, uruchom to przez `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Jak otworzyć dashboard po wdrożeniu?">
    Kreator otwiera przeglądarkę z czystym (bez tokena w URL) adresem dashboard zaraz po wdrożeniu i wyświetla też link w podsumowaniu. Nie zamykaj tej karty; jeśli nie została otwarta, skopiuj/wklej wyświetlony adres URL na tym samym komputerze.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost i zdalnie?">
    **Localhost (ten sam komputer):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli pojawi się prośba o uwierzytelnianie wspólnym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokena: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli wspólny sekret nie jest jeszcze skonfigurowany, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Poza localhost:**

    - **Tailscale Serve** (zalecane): pozostaw powiązanie z loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają wymagania uwierzytelniania Control UI/WebSocket (bez wklejania wspólnego sekretu, przy założeniu zaufanego hosta gateway); interfejsy HTTP API nadal wymagają uwierzytelniania wspólnym sekretem, chyba że celowo używasz prywatnego ingress `none` lub uwierzytelniania HTTP zaufanego proxy.
      Nieudane równoległe próby uwierzytelniania Serve z tego samego klienta są serializowane, zanim ogranicznik nieudanych uwierzytelnień je zapisze, więc przy drugiej błędnej próbie może już pojawić się komunikat `retry later`.
    - **Powiązanie tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (lub skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący wspólny sekret w ustawieniach dashboard.
    - **Reverse proxy ze świadomością tożsamości**: pozostaw Gateway za zaufanym proxy innym niż loopback, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz adres URL proxy.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie wspólnym sekretem nadal obowiązuje przez tunel; jeśli pojawi się prośba, wklej skonfigurowany token lub hasło.

    Zobacz [Dashboard](/web/dashboard) i [Powierzchnie webowe](/web), aby poznać szczegóły trybów powiązania i uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzania exec dla zatwierdzeń na czacie?">
    Sterują różnymi warstwami:

    - `approvals.exec`: przekazuje prośby o zatwierdzenie do miejsc docelowych na czacie
    - `channels.<channel>.execApprovals`: sprawia, że dany kanał działa jako natywny klient zatwierdzeń exec

    Zasada hosta dla exec nadal jest rzeczywistą bramką zatwierdzania. Konfiguracja czatu steruje tylko tym,
    gdzie pojawiają się prośby o zatwierdzenie i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat obsługuje już polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez współdzieloną ścieżkę.
    - Jeśli obsługiwany kanał natywny może bezpiecznie wywnioskować osoby zatwierdzające, OpenClaw automatycznie włącza teraz natywne zatwierdzenia wiadomości prywatnych w pierwszej kolejności, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione lub ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, ta natywna ścieżka UI jest podstawową drogą; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną drogą.
    - Używaj `approvals.exec` tylko wtedy, gdy prośby muszą być również przekazywane do innych czatów lub jawnych pokojów operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` albo `"both"` tylko wtedy, gdy chcesz jawnie publikować prośby o zatwierdzenie z powrotem w pokoju/wątku, z którego pochodzą.
    - Zatwierdzenia Plugin są znowu osobne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują dodatkową natywną obsługę zatwierdzania Plugin.

    Krótko: forwarding służy do routingu, a konfiguracja natywnego klienta do bogatszego, specyficznego dla kanału UX.
    Zobacz [Zatwierdzenia Exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje, że do użytku osobistego wystarczy **512 MB-1 GB RAM**, **1 rdzeń** i około **500 MB**
    miejsca na dysku, oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz mieć większy zapas (logi, multimedia, inne usługi), zalecane jest **2 GB**,
    ale nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a Ty możesz sparować **Node** na laptopie/telefonie do
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Node](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się nierówności.

    - Używaj systemu **64-bitowego** i trzymaj Node w wersji >= 22.
    - Preferuj **instalację hackowalną (git)**, aby móc przeglądać logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a następnie dodawaj je po jednym.
    - Jeśli trafisz na dziwne problemy binarne, zwykle chodzi o problem **zgodności ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Zawiesza się na „wake up my friend” / wdrażanie nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI również automatycznie wysyła
    „Wake up, my friend!” przy pierwszym wykluciu. Jeśli widzisz ten wiersz i **brak odpowiedzi**,
    a liczba tokenów pozostaje na 0, agent nigdy się nie uruchomił.

    1. Uruchom ponownie Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Sprawdź status + uwierzytelnianie:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jeśli nadal się zawiesza, uruchom:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że interfejs UI
    jest skierowany na właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść konfigurację na nowy komputer (Mac mini) bez ponownego przechodzenia wdrożenia?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a potem uruchom Doctor jeden raz. To
    zachowuje Twojego bota „dokładnie takiego samego” (pamięć, historia sesji, uwierzytelnianie i
    stan kanałów), o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowym komputerze.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starego komputera.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i ponownie uruchom usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, dane logowania WhatsApp, sesje i pamięć. Jeśli pracujesz w
    trybie zdalnym, pamiętaj, że host gateway zarządza magazynem sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/wypychasz swój workspace do GitHub, tworzysz kopię
    zapasową **pamięci + plików bootstrap**, ale **nie** historii sesji ani uwierzytelniania. One znajdują się
    w `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie co jest przechowywane na dysku](#gdzie-co-jest-przechowywane-na-dysku),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę zobaczyć, co nowego pojawiło się w najnowszej wersji?">
    Sprawdź changelog na GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli najwyższa sekcja jest oznaczona jako **Unreleased**, następna sekcja
    z datą to najnowsza wydana wersja. Wpisy są pogrupowane według **Highlights**, **Changes** i
    **Fixes** (oraz sekcji dokumentacji/innych, gdy są potrzebne).

  </Accordion>

  <Accordion title="Nie można uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz tę funkcję albo dodaj `docs.openclaw.ai` do listy dozwolonych, a potem spróbuj ponownie.
    Pomóż nam odblokować tę domenę, zgłaszając problem tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz otworzyć strony, dokumentacja jest mirrorowana na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to tagi dystrybucyjne **npm dist-tags**, a nie oddzielne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle wydanie stable najpierw trafia do **beta**, a potem jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    opublikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowe polecenia instalacji oraz różnicę między beta i dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to tag dystrybucyjny npm `beta` (po promocji może być taki sam jak `latest`).
    **Dev** to ruchoma główna gałąź `main` (git); po publikacji używa tagu dystrybucyjnego npm `dev`.

    Jednolinijkowe polecenia (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator dla Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Kanały deweloperskie](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze zmiany?">
    Są dwie opcje:

    1. **Kanał dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja hackowalna (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dzięki temu masz lokalne repozytorium, które możesz edytować, a potem aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty clone, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/cli/update), [Kanały deweloperskie](/pl/install/development-channels),
    [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Jak długo zwykle trwa instalacja i wdrażanie?">
    Przybliżone wartości:

    - **Instalacja:** 2-5 minut
    - **Wdrażanie:** 5-15 minut w zależności od liczby konfigurowanych kanałów/modeli

    Jeśli proces się zawiesza, skorzystaj z [Instalator się zawiesił](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania w [Utknąłem/utknęłam](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator się zawiesił? Jak uzyskać więcej informacji?">
    Uruchom instalator ponownie z **szczegółowym wyjściem**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z trybem verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Dla instalacji hackowalnej (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Odpowiednik dla Windows (PowerShell):

    ```powershell
    # install.ps1 nie ma jeszcze dedykowanej flagi -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Więcej opcji: [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Instalacja na Windows mówi git not found albo openclaw not recognized">
    Dwa częste problemy na Windows:

    **1) błąd npm spawn git / git not found**

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w PATH.
    - Zamknij i ponownie otwórz PowerShell, a potem ponownie uruchom instalator.

    **2) openclaw is not recognized po instalacji**

    - Globalny katalog bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do PATH użytkownika (na Windows nie potrzeba przyrostka `\bin`; na większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po zaktualizowaniu PATH.

    Jeśli chcesz mieć możliwie najpłynniejszą konfigurację na Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Dane wyjściowe exec na Windows pokazują zniekształcony chiński tekst — co zrobić?">
    Zwykle jest to problem z niedopasowaniem strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - dane wyjściowe `system.run`/`exec` renderują chiński tekst jako mojibake
    - to samo polecenie wygląda poprawnie w innym profilu terminala

    Szybkie obejście w PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Następnie uruchom ponownie Gateway i spróbuj ponownie wykonać polecenie:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal odtwarzasz ten problem w najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie — jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji hackowalnej (git)**, aby mieć lokalnie pełny kod źródłowy i dokumentację, a potem zapytaj
    swojego bota (lub Claude/Codex) _z tego folderu_, aby mógł czytać repozytorium i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linux?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linux, a potem uruchom wdrażanie.

    - Szybka ścieżka dla Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Każdy VPS z Linux będzie działać. Zainstaluj system na serwerze, a potem użyj SSH/Tailscale, aby uzyskać dostęp do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Gateway remote](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/na VPS?">
    Utrzymujemy **hub hostingowy** z najczęściej używanymi dostawcami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy dostawcy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (albo Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz sparować **Node** (Mac/iOS/Android/headless) z tym chmurowym Gateway, aby uzyskać dostęp do
    lokalnego ekranu/kamery/canvas albo uruchamiać polecenia na laptopie, jednocześnie trzymając
    Gateway w chmurze.

    Hub: [Platformy](/pl/platforms). Dostęp zdalny: [Gateway remote](/pl/gateway/remote).
    Node: [Node](/pl/nodes), [CLI Node](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, żeby zaktualizował się sam?">
    Krótka odpowiedź: **to możliwe, ale niezalecane**. Proces aktualizacji może ponownie uruchomić
    Gateway (co przerywa aktywną sesję), może wymagać czystego checkoutu git i
    może poprosić o potwierdzenie. Bezpieczniej: uruchamiaj aktualizacje z powłoki jako operator.

    Użyj CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jeśli musisz zautomatyzować to z poziomu agenta:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentacja: [Aktualizacja](/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi wdrażanie?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** przeprowadza Cię przez:

    - **Konfigurację modelu/uwierzytelniania** (OAuth dostawcy, klucze API, Anthropic setup-token oraz opcje modeli lokalnych, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone channel plugins, takie jak QQ Bot)
    - **Instalację demona** (LaunchAgent na macOS; jednostka użytkownika systemd na Linux/WSL2)
    - **Kontrole stanu** oraz wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany albo brakuje dla niego uwierzytelniania.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude lub OpenAI, aby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw z użyciem **kluczy API** (Anthropic/OpenAI/innych) albo
    **wyłącznie modeli lokalnych**, dzięki czemu Twoje dane pozostają na urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) to opcjonalne sposoby uwierzytelniania tych dostawców.

    W przypadku Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: standardowe rozliczanie API Anthropic
    - **Claude CLI / uwierzytelnianie subskrypcją Claude w OpenClaw**: pracownicy Anthropic
      poinformowali nas, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako sankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długotrwale działających hostów gateway klucze API Anthropic pozostają jednak
    bardziej przewidywalną konfiguracją. OAuth OpenAI Codex jest jawnie obsługiwany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje też inne hostowane opcje w stylu subskrypcyjnym, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** oraz
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [Modele GLM](/pl/providers/glm),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc
    OpenClaw traktuje uwierzytelnianie subskrypcją Claude i użycie `claude -p` jako sankcjonowane
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że to użycie jest znowu dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako sankcjonowane dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Anthropic setup-token jest nadal dostępny jako obsługiwana ścieżka tokena OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla środowisk produkcyjnych lub obciążeń wieloużytkownikowych uwierzytelnianie kluczem API Anthropic nadal jest
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz inne hostowane
    opcje w stylu subskrypcji w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele
    GLM](/pl/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
Oznacza to, że Twój **limit/rate limit Anthropic** został wyczerpany w bieżącym oknie. Jeśli
używasz **Claude CLI**, poczekaj na reset okna albo podnieś plan. Jeśli
używasz **klucza API Anthropic**, sprawdź Anthropic Console
pod kątem użycia/rozliczeń i w razie potrzeby zwiększ limity.

    Jeśli komunikat brzmi konkretnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    wersji beta 1M kontekstu Anthropic (`context1m: true`). Działa to tylko wtedy, gdy Twoje
    dane uwierzytelniające kwalifikują się do rozliczania long-context (rozliczanie kluczem API lub
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model zapasowy**, aby OpenClaw mógł nadal odpowiadać, gdy dostawca jest ograniczany przez rate limit.
    Zobacz [Modele](/cli/models), [OAuth](/pl/concepts/oauth) i
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma dołączonego dostawcę **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiska AWS, OpenClaw może automatycznie wykryć katalog Bedrock dla streamingu/tekstu i scalić go jako niejawnego dostawcę `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis dostawcy. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Dostawcy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, zgodny z OpenAI proxy przed Bedrock nadal jest prawidłową opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie do ChatGPT). Wdrażanie może uruchomić przepływ OAuth i ustawi domyślny model na `openai-codex/gpt-5.4`, gdy będzie to odpowiednie. Zobacz [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego ChatGPT GPT-5.4 nie odblokowuje openai/gpt-5.4 w OpenClaw?">
    OpenClaw traktuje te dwie ścieżki oddzielnie:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = bezpośrednie API OpenAI Platform

    W OpenClaw logowanie ChatGPT/Codex jest podłączone do ścieżki `openai-codex/*`,
    a nie bezpośredniej ścieżki `openai/*`. Jeśli chcesz w
    OpenClaw korzystać z bezpośredniej ścieżki API, ustaw `OPENAI_API_KEY` (lub równoważną konfigurację dostawcy OpenAI).
    Jeśli chcesz w OpenClaw używać logowania ChatGPT/Codex, użyj `openai-codex/*`.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od ChatGPT w przeglądarce?">
    `openai-codex/*` używa ścieżki OAuth Codex, a jej dostępne okna limitów
    są zarządzane przez OpenAI i zależne od planu. W praktyce te limity mogą różnić się od
    doświadczenia na stronie/aplikacji ChatGPT, nawet gdy oba są powiązane z tym samym kontem.

    OpenClaw może pokazywać obecnie widoczne okna użycia/limitów dostawcy w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu API. Jeśli chcesz bezpośrednią ścieżkę rozliczeń/limitów OpenAI Platform,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie uwierzytelnianie subskrypcją OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjny OAuth OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na użycie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Wdrażanie może przeprowadzić ten przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Dostawcy modeli](/pl/concepts/model-providers) i [Wdrażanie (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu uwierzytelniania Plugin**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    Kroki:

    1. Zainstaluj Gemini CLI lokalnie, tak aby `gemini` było w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania kończą się niepowodzeniem, ustaw `GOOGLE_CLOUD_PROJECT` albo `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway

    To przechowuje tokeny OAuth w profilach uwierzytelniania na hoście gateway. Szczegóły: [Dostawcy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do luźnych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu + silnych zabezpieczeń; małe karty obcinają kontekst i przeciekają. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection — zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch do hostowanych modeli w określonym regionie?">
    Wybierz endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz umieszczać Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, aby modele zapasowe pozostawały dostępne przy jednoczesnym respektowaniu wybranego dostawcy regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, żeby to zainstalować?">
    Nie. OpenClaw działa na macOS albo Linux (Windows przez WSL2). Mac mini jest opcjonalny — niektórzy
    kupują go jako zawsze włączony host, ale mały VPS, serwer domowy albo urządzenie klasy Raspberry Pi też się sprawdzą.

    Potrzebujesz Maca tylko do **narzędzi dostępnych wyłącznie na macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) — serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linux lub gdzie indziej. Jeśli chcesz innych narzędzi tylko dla macOS, uruchom Gateway na Macu albo sparuj Node macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Node](/pl/nodes), [Tryb zdalny na Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia z macOS** zalogowanego do Messages. To **nie** musi być Mac mini —
    wystarczy dowolny Mac. Dla iMessage **użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) — serwer BlueBubbles działa na macOS, podczas gdy Gateway może działać na Linux lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchom Gateway na Linux/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym do Messages.
    - Uruchom wszystko na Macu, jeśli chcesz najprostszej konfiguracji na jednym komputerze.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Node](/pl/nodes),
    [Tryb zdalny na Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może łączyć się jako
    **Node** (urządzenie towarzyszące). Node nie uruchamiają Gateway — zapewniają dodatkowe
    możliwości, takie jak ekran/kamera/canvas i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS albo hosta Node i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby to zobaczyć.

    Dokumentacja: [Node](/pl/nodes), [CLI Node](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy środowiska uruchomieniowego, szczególnie z WhatsApp i Telegram.
    Dla stabilnych gateway używaj **Node**.

    Jeśli mimo to chcesz eksperymentować z Bun, rób to na nieprodukcyjnym gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisuje się w allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram nadawcy** (liczbowy). To nie jest nazwa użytkownika bota.

    Konfiguracja prosi tylko o liczbowe identyfikatory użytkowników. Jeśli masz już w konfiguracji starsze wpisy `@username`, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniejsza metoda (bez zewnętrznego bota):

    - Wyślij wiadomość prywatną do swojego bota, a następnie uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij wiadomość prywatną do swojego bota, a następnie wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne narzędzie (mniej prywatne):

    - Wyślij wiadomość prywatną do `@userinfobot` albo `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing multi-agent**. Przypisz wiadomości prywatne WhatsApp każdego nadawcy **DM** (peer `kind: "direct"`, nadawca E.164, np. `+15551234567`) do innego `agentId`, aby każda osoba miała własny workspace i magazyn sesji. Odpowiedzi nadal będą wychodziły z **tego samego konta WhatsApp**, a kontrola dostępu DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla danego konta WhatsApp. Zobacz [Routing Multi-Agent](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta „fast chat” i agenta „Opus for coding”?'>
    Tak. Użyj routingu multi-agent: nadaj każdemu agentowi własny model domyślny, a następnie przypisz trasy przychodzące (konto dostawcy albo konkretne peery) do każdego agenta. Przykładowa konfiguracja znajduje się w [Routingu Multi-Agent](/pl/concepts/multi-agent). Zobacz też [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linux?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (albo Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były dostępne w powłokach niebędących powłokami logowania.
    Nowsze kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach systemd na Linux (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i honorują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, jeśli są ustawione.

  </Accordion>

  <Accordion title="Różnica między hackowalną instalacją git a npm install">
    - **Instalacja hackowalna (git):** pełny checkout kodu źródłowego, możliwość edycji, najlepsza dla współtwórców.
      Budujesz lokalnie i możesz poprawiać kod/dokumentację.
    - **npm install:** globalna instalacja CLI, bez repozytorium, najlepsza, jeśli chcesz „po prostu to uruchomić”.
      Aktualizacje pochodzą z tagów dystrybucyjnych npm.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacją npm i git?">
    Tak. Zainstaluj drugi wariant, a następnie uruchom Doctor, aby usługa gateway wskazywała nowy punkt wejścia.
    To **nie usuwa Twoich danych** — zmienia tylko instalację kodu OpenClaw. Twój stan
    (`~/.openclaw`) i workspace (`~/.openclaw/workspace`) pozostają nienaruszone.

    Z npm do git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Z git do npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor wykrywa niezgodność punktu wejścia usługi gateway i proponuje przepisanie konfiguracji usługi tak, aby odpowiadała bieżącej instalacji (w automatyzacji użyj `--repair`).

    Wskazówki dotyczące kopii zapasowych: zobacz [Strategia kopii zapasowych](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy powinienem uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    najmniejszego tarcia i nie przeszkadza Ci usypianie/restarty, uruchamiaj go lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztów serwera, bezpośredni dostęp do lokalnych plików, widoczne okno przeglądarki na żywo.
    - **Wady:** usypianie/zaniki sieci = rozłączenia, aktualizacje/restarty systemu przerywają pracę, komputer musi pozostać wybudzony.

    **VPS / chmura**

    - **Zalety:** działa cały czas, stabilna sieć, brak problemów z usypianiem laptopa, łatwiej utrzymać go w działaniu.
    - **Wady:** często działa bez interfejsu (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają bez problemu z VPS. Jedyny realny kompromis to **przeglądarka headless** kontra widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecane ustawienie domyślne:** VPS, jeśli wcześniej zdarzały Ci się rozłączenia gateway. Lokalne uruchomienie jest świetne, gdy aktywnie używasz Maca i chcesz mieć lokalny dostęp do plików albo automatyzację UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest to wymagane, ale **zalecane ze względu na niezawodność i izolację**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw przez usypianie/restarty, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/desktop:** całkowicie w porządku do testów i aktywnego używania, ale spodziewaj się przerw, gdy komputer przejdzie w stan uśpienia albo się zaktualizuje.

    Jeśli chcesz połączyć najlepsze cechy obu rozwiązań, trzymaj Gateway na dedykowanym hoście i sparuj laptop jako **Node** dla lokalnych narzędzi ekranu/kamery/exec. Zobacz [Node](/pl/nodes).
    Wskazówki dotyczące bezpieczeństwa znajdziesz w [Bezpieczeństwie](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM, ~500 MB miejsca na dysku.
    - **Zalecane:** 1-2 vCPU, 2 GB RAM lub więcej zapasu (logi, multimedia, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą zużywać dużo zasobów.

    System operacyjny: używaj **Ubuntu LTS** (albo dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji na Linux jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć dość
    RAM dla Gateway oraz wszystkich włączonych kanałów.

    Podstawowe wytyczne:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki albo narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS albo inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i ma najlepszą
    zgodność narzędzi. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [VM z macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw, w jednym akapicie?">
    OpenClaw to osobisty asystent AI, którego uruchamiasz na własnych urządzeniach. Odpowiada na powierzchniach komunikacyjnych, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz dołączone channel plugins, takie jak QQ Bot), a na obsługiwanych platformach może też oferować głos + aktywny Canvas. **Gateway** to zawsze działająca płaszczyzna sterowania; produktem jest asystent.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw to nie jest „tylko wrapper Claude”. To **local-first control plane**, która pozwala uruchamiać
    zaawansowanego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatowych, których już używasz, z
    utrzymywanymi sesjami, pamięcią i narzędziami — bez oddawania kontroli nad własnymi przepływami pracy
    hostowanemu SaaS.

    Najważniejsze cechy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway, gdzie chcesz (Mac, Linux, VPS), i trzymaj
      workspace + historię sesji lokalnie.
    - **Prawdziwe kanały, a nie sandbox webowy:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      plus głos mobilny i Canvas na obsługiwanych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itd., z routingiem per agent
      i failover.
    - **Opcja tylko lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli tego chcesz.
    - **Routing multi-agent:** oddzielni agenci dla kanału, konta albo zadania, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i hackowalność:** sprawdzaj, rozszerzaj i hostuj samodzielnie bez uzależnienia od dostawcy.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Multi-agent](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Dopiero to skonfigurowałem/skonfigurowałam — co powinienem/powinnam zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbudowanie strony internetowej (WordPress, Shopify albo prosta strona statyczna).
    - Prototypowanie aplikacji mobilnej (zarys, ekrany, plan API).
    - Organizowanie plików i folderów (porządki, nazewnictwo, tagowanie).
    - Podłączenie Gmail i automatyzacja podsumowań albo działań następczych.

    Potrafi obsługiwać duże zadania, ale działa najlepiej, gdy podzielisz je na etapy i
    użyjesz sub-agent do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste odprawy:** podsumowania skrzynki odbiorczej, kalendarza i interesujących Cię wiadomości.
    - **Badania i redagowanie:** szybkie badania, podsumowania i pierwsze wersje e-maili albo dokumentów.
    - **Przypomnienia i działania następcze:** ponaglenia i checklisty uruchamiane przez cron albo heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gateway uruchomić je na serwerze i odbierz wynik z powrotem na czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w lead gen, outreach, reklamach i blogach dla SaaS?">
    Tak, w zakresie **badań, kwalifikacji i redagowania**. Może skanować strony, budować krótkie listy,
    podsumowywać potencjalnych klientów i pisać szkice wiadomości outreach albo copy reklamowego.

    W przypadku **outreach albo uruchamiania reklam** zachowaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform oraz sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to taki, w którym
    OpenClaw przygotowuje szkic, a Ty go zatwierdzasz.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code w tworzeniu stron internetowych?">
    OpenClaw to **osobisty asystent** i warstwa koordynacji, a nie zamiennik IDE. Używaj
    Claude Code albo Codex do najszybszej bezpośredniej pętli programowania wewnątrz repozytorium. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu z wielu urządzeń i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogram, hooki)
    - **Zawsze działający Gateway** (uruchomiony na VPS, interakcja z dowolnego miejsca)
    - **Node** dla lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez utrzymywania brudnego repozytorium?">
    Używaj zarządzanych nadpisań zamiast edytowania kopii w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`, więc zarządzane nadpisania nadal mają pierwszeństwo przed dołączonymi Skills bez dotykania gita. Jeśli potrzebujesz Skill zainstalowanego globalnie, ale widocznego tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność za pomocą `agents.defaults.skills` oraz `agents.list[].skills`. Tylko zmiany warte wniesienia upstream powinny trafiać do repozytorium i wychodzić jako PR.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z niestandardowego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → dołączone → `skills.load.extraDirs`. `clawhub` instaluje domyślnie do `./skills`, które OpenClaw traktuje jako `<workspace>/skills` przy następnej sesji. Jeśli Skill ma być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` albo `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak mogę używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania Cron**: izolowane zadania mogą ustawiać nadpisanie `model` dla każdego zadania.
    - **Sub-agenci**: kieruj zadania do oddzielnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w dowolnym momencie przełączyć model bieżącej sesji.

    Zobacz [Zadania Cron](/pl/automation/cron-jobs), [Routing Multi-Agent](/pl/concepts/multi-agent) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Używaj **sub-agent** do długich albo równoległych zadań. Sub-agenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota o „uruchomienie sub-agenta do tego zadania” albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i sub-agenci zużywają tokeny. Jeśli koszt ma znaczenie, ustaw
    tańszy model dla sub-agent przez `agents.defaults.subagents.model`.

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje sub-agentów powiązane z wątkiem na Discord?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z sub-agentem albo celem sesji, tak aby kolejne wiadomości w tym wątku pozostawały na tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"` dla trwałych wiadomości następczych).
    - Albo powiąż ręcznie przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` oraz `/session max-age <duration|off>`, aby sterować automatycznym odpinaniem fokusu.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Ustawienia domyślne globalne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy uruchomieniu: ustaw `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Odwołanie do konfiguracji](/pl/gateway/configuration-reference), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Sub-agent zakończył pracę, ale aktualizacja o zakończeniu trafiła w niewłaściwe miejsce albo w ogóle nie została opublikowana. Co sprawdzić?">
    Najpierw sprawdź rozstrzygniętą trasę żądającego:

    - Dostarczanie sub-agentów w trybie completion preferuje dowolny powiązany wątek lub trasę konwersacji, jeśli taka istnieje.
    - Jeśli źródło completion zawiera tylko kanał, OpenClaw wraca do zapisanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać, a wynik wraca wtedy do dostarczenia przez kolejkę sesji zamiast natychmiastowej publikacji na czacie.
    - Nieprawidłowe lub nieaktualne cele nadal mogą wymusić powrót do kolejki albo ostateczną awarię dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta potomnego to dokładnie cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo pomija ogłoszenie zamiast publikować starszy, nieaktualny postęp.
    - Jeśli proces potomny przekroczył limit czasu po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe dane wyjściowe narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzie sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron albo przypomnienia nie uruchamiają się. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa nieprzerwanie,
    zaplanowane zadania nie będą się uruchamiać.

    Lista kontrolna:

    - Potwierdź, że cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez usypiania/restartów).
    - Zweryfikuj ustawienia strefy czasowej dla zadania (`--tz` względem strefy czasowej hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Cron się uruchomił, ale nic nie zostało wysłane do kanału. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie należy oczekiwać żadnej zewnętrznej wiadomości.
    - Brakujący albo nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczenie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia to zablokowały.
    - Cichy wynik izolowany (`NO_REPLY` / `no_reply`) jest traktowany jako celowo nienadający się do dostarczenia, więc runner również pomija awaryjne dostarczenie przez kolejkę.

    W przypadku izolowanych zadań cron runner odpowiada za końcowe dostarczenie. Od agenta
    oczekuje się zwrócenia zwykłego podsumowania tekstowego, które runner wyśle. `--no-deliver` zachowuje
    ten wynik wewnętrznie; nie pozwala agentowi wysyłać go bezpośrednio przy użyciu
    message tool.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie cron zmieniło modele albo wykonało jedno ponowienie?">
    Zwykle jest to ścieżka aktywnego przełączania modelu, a nie zduplikowane planowanie.

    Izolowany cron może utrwalić przekazanie modelu w czasie działania i wykonać ponowienie, gdy aktywne
    uruchomienie zwróci `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    dostawcę/model, a jeśli przełączenie zawierało nowe nadpisanie profilu uwierzytelniania, cron
    również je utrwala przed ponowieniem.

    Powiązane reguły wyboru:

    - Najpierw wygrywa nadpisanie modelu hooka Gmail, gdy ma zastosowanie.
    - Następnie `model` per zadanie.
    - Następnie dowolne zapisane nadpisanie modelu sesji cron.
    - Następnie zwykły wybór modelu agenta/domyślny.

    Pętla ponowień jest ograniczona. Po początkowej próbie i 2 ponowieniach przełączenia
    cron przerywa działanie zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills na Linux?">
    Użyj natywnych poleceń `openclaw skills` albo umieść Skills w swoim workspace. Interfejs Skills dla macOS nie jest dostępny na Linux.
    Przeglądaj Skills na [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Natywne `openclaw skills install` zapisuje do aktywnego katalogu workspace `skills/`.
    Osobny CLI `clawhub` instaluj tylko wtedy, gdy chcesz publikować albo
    synchronizować własne Skills. W przypadku współdzielonych instalacji między agentami umieść Skill w
    `~/.openclaw/skills` i użyj `agents.defaults.skills` albo
    `agents.list[].skills`, jeśli chcesz zawęzić, którzy agenci mogą go widzieć.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu albo stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania Cron** do zadań planowanych albo cyklicznych (trwają po restartach).
    - **Heartbeat** do okresowych kontroli „sesji głównej”.
    - **Zadania izolowane** dla autonomicznych agentów, które publikują podsumowania albo dostarczają je na czaty.

    Dokumentacja: [Zadania Cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills Apple tylko dla macOS z Linux?">
    Nie bezpośrednio. Skills macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane binaria, a Skills pojawiają się w prompt systemowym tylko wtedy, gdy kwalifikują się na **hoście Gateway**. Na Linux Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie zostaną załadowane, chyba że nadpiszesz te ograniczenia.

    Masz trzy obsługiwane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprostsze).**
    Uruchom Gateway tam, gdzie istnieją binaria macOS, a następnie łącz się z Linux w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) albo przez Tailscale. Skills ładują się normalnie, ponieważ host Gateway to macOS.

    **Opcja B - użyj Node macOS (bez SSH).**
    Uruchom Gateway na Linux, sparuj Node macOS (aplikacja paska menu) i ustaw **Node Run Commands** na „Always Ask” albo „Always Allow” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane binaria istnieją na Node. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w monicie doda to polecenie do listy dozwolonych.

    **Opcja C - przekazuj binaria macOS przez SSH (zaawansowane).**
    Pozostaw Gateway na Linux, ale spraw, aby wymagane binaria CLI rozwiązywały się do wrapperów SSH uruchamianych na Macu. Następnie nadpisz Skill, aby zezwolić na Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla binarium (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane Skill (workspace albo `~/.openclaw/skills`), aby zezwolić na Linux:

       ```markdown
       ---
       name: apple-notes
       description: Zarządzanie Apple Notes przez CLI memo na macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Rozpocznij nową sesję, aby odświeżyć snapshot Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion albo HeyGen?">
    Obecnie nie jako funkcję wbudowaną.

    Opcje:

    - **Niestandardowy Skill / Plugin:** najlepsze rozwiązanie dla niezawodnego dostępu do API (zarówno Notion, jak i HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej podatna na błędy.

    Jeśli chcesz utrzymywać kontekst dla każdego klienta (przepływy pracy agencji), prosty wzorzec to:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta o pobranie tej strony na początku sesji.

    Jeśli chcesz natywną integrację, otwórz zgłoszenie funkcji albo zbuduj Skill
    kierowany do tych API.

    Instalowanie Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do aktywnego katalogu workspace `skills/`. W przypadku współdzielonych Skills między agentami umieszczaj je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci mają widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują binariów zainstalowanych przez Homebrew; na Linux oznacza to Linuxbrew (zobacz wpis FAQ o Homebrew na Linux powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać istniejącej zalogowanej przeglądarki Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który łączy się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz własnej nazwy, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka może używać lokalnej przeglądarki hosta albo podłączonego browser node. Jeśli Gateway działa gdzie indziej, uruchom hosta node na komputerze z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na `ref`, a nie na selektorach CSS
    - przesyłanie plików wymaga `ref` / `inputRef` i obecnie obsługuje jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobierania i działania wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandboxing i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje osobny dokument o sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). W przypadku konfiguracji specyficznej dla Docker (pełny gateway w Docker albo obrazy sandbox) zobacz [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony — jak włączyć pełne funkcje?">
    Domyślny obraz stawia na bezpieczeństwo i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani dołączonych przeglądarek. Aby uzyskać pełniejszą konfigurację:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby cache przetrwał.
    - Dodaj zależności systemowe do obrazu przez `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przy użyciu dołączonego CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ta ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatność DM, ale uczynić grupy publicznymi/sandboxowanymi przy użyciu jednego agenta?">
    Tak — jeśli Twój ruch prywatny to **DM**, a ruch publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grup/kanałów (klucze inne niż główne) działały w Docker, podczas gdy główna sesja DM pozostaje na hoście. Następnie ogranicz, które narzędzia są dostępne w sesjach sandboxowanych, przez `tools.sandbox.tools`.

    Opis konfiguracji krok po kroku + przykładowa konfiguracja: [Grupy: prywatne DM + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowe odwołanie do konfiguracji: [Konfiguracja Gateway](/pl/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak powiązać folder hosta z sandboxem?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Powiązania globalne i per agent są scalane; powiązania per agent są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że powiązania omijają granice systemu plików sandboxa.

    OpenClaw weryfikuje źródła bind zarówno względem znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązanej przez najgłębszego istniejącego przodka. Oznacza to, że ucieczki przez rodzica będącego symlinkiem nadal kończą się bezpiecznym domknięciem nawet wtedy, gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego katalogu głównego nadal obowiązują po rozwiązaniu symlinka.

    Przykłady i uwagi dotyczące bezpieczeństwa znajdziesz w [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) oraz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w workspace agenta:

    - Codzienne notatki w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia też **cichy flush pamięci przed Compaction**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatycznym Compaction. To działa tylko wtedy, gdy workspace
    jest zapisywalny (sandboxy tylko do odczytu pomijają ten krok). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby zostały?">
    Poproś bota, aby **zapisał fakt do pamięci**. Notatki długoterminowe powinny trafiać do `MEMORY.md`,
    a kontekst krótkoterminowy do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi o zapisywaniu wspomnień;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway przy każdym
    uruchomieniu korzysta z tego samego workspace.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć trwa wiecznie? Jakie są ograniczenia?">
    Pliki pamięci znajdują się na dysku i pozostają tam, dopóki ich nie usuniesz. Ograniczeniem jest
    miejsce na dysku, a nie model. **Kontekst sesji** nadal jest ograniczony przez okno kontekstu
    modelu, więc długie rozmowy mogą zostać poddane Compaction albo obcięte. Dlatego istnieje
    wyszukiwanie pamięci — przywraca do kontekstu tylko odpowiednie fragmenty.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. OAuth Codex obejmuje czat/uzupełnienia i
    **nie** daje dostępu do embeddingów, więc **logowanie przez Codex (OAuth albo
    logowanie przez Codex CLI)** nie pomaga w semantycznym wyszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` albo `models.providers.openai.apiKey`).

    Jeśli jawnie nie ustawisz dostawcy, OpenClaw automatycznie wybiera dostawcę, gdy
    potrafi rozwiązać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` albo zmienne środowiskowe).
    Preferuje OpenAI, jeśli uda się rozwiązać klucz OpenAI, w przeciwnym razie Gemini, jeśli uda się rozwiązać klucz Gemini,
    następnie Voyage, a potem Mistral. Jeśli żaden zdalny klucz nie jest dostępny, wyszukiwanie pamięci
    pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną i obecną ścieżkę do modelu lokalnego, OpenClaw
    preferuje `local`. Ollama jest obsługiwana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (albo
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub local** —
    szczegóły konfiguracji znajdziesz w [Pamięci](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie co jest przechowywane na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie — **stan OpenClaw jest lokalny**, ale **usługi zewnętrzne nadal widzą to, co im wysyłasz**.

    - **Domyślnie lokalne:** sesje, pliki pamięci, konfiguracja i workspace znajdują się na hoście Gateway
      (`~/.openclaw` + katalog workspace).
    - **Zdalne z konieczności:** wiadomości wysyłane do dostawców modeli (Anthropic/OpenAI/itd.) trafiają do
      ich API, a platformy czatowe (WhatsApp/Telegram/Slack/itd.) przechowują dane wiadomości na swoich
      serwerach.
    - **Ty kontrolujesz zakres:** używanie modeli lokalnych utrzymuje prompty na Twoim komputerze, ale ruch kanałów
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Workspace agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się w `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Starszy import OAuth (kopiowany do profili uwierzytelniania przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile uwierzytelniania (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny ładunek sekretów oparty na pliku dla dostawców `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` są czyszczone)   |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan dostawcy (np. `whatsapp/<accountId>/creds.json`)              |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan per agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia konwersacji i stan (per agent)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (per agent)                                         |

    Starsza ścieżka single-agent: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (`AGENTS.md`, pliki pamięci, Skills itd.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (per agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (albo starszy fallback `memory.md`, gdy `MEMORY.md` nie istnieje),
      `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
    - **Katalog stanu (`~/.openclaw`)**: konfiguracja, stan kanału/dostawcy, profile uwierzytelniania, sesje, logi
      oraz współdzielone Skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowany przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, upewnij się, że Gateway przy każdym uruchomieniu używa tego samego
    workspace (i pamiętaj: tryb zdalny używa workspace **hosta gateway**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz trwałego zachowania lub preferencji, poproś bota, aby **zapisał to w
    AGENTS.md albo MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Workspace agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść swój **workspace agenta** w **prywatnym** repozytorium git i twórz jego kopie zapasowe w
    prywatnym miejscu (na przykład prywatny GitHub). To obejmuje pamięć + pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych ładunków sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, twórz oddzielne kopie zapasowe zarówno workspace, jak i katalogu stanu
    (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz osobny przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą działać poza workspace?">
    Tak. Workspace to **domyślny cwd** i kotwica pamięci, a nie twardy sandbox.
    Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych
    lokalizacji hosta, chyba że sandboxing jest włączony. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandbox per agent. Jeśli
    chcesz, by repozytorium było domyślnym katalogiem roboczym, wskaż `workspace`
    tego agenta na katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    workspace osobno, chyba że celowo chcesz, by agent w nim pracował.

    Przykład (repozytorium jako domyślny cwd):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tryb zdalny: gdzie znajduje się magazyn sesji?">
    Stan sesji należy do **hosta gateway**. Jeśli jesteś w trybie zdalnym, interesujący Cię magazyn sesji znajduje się na zdalnej maszynie, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli plik nie istnieje, używane są dość bezpieczne ustawienia domyślne (w tym domyślny workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem/ustawiłam `gateway.bind: "lan"` (albo `"tailnet"`) i teraz nic nie nasłuchuje / UI mówi unauthorized'>
    Powiązania inne niż loopback **wymagają prawidłowej ścieżki uwierzytelniania gateway**. W praktyce oznacza to:

    - uwierzytelnianie wspólnym sekretem: token albo hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym, świadomym tożsamości reverse proxy innym niż loopback

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Uwagi:

    - `gateway.remote.token` / `.password` same z siebie **nie** włączają lokalnego uwierzytelniania gateway.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` wraz z `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie może zostać rozwiązane, rozwiązanie kończy się bezpiecznym domknięciem (bez maskującego fallbacku zdalnego).
    - Konfiguracje wspólnego sekretu Control UI uwierzytelniają się przez `connect.params.auth.token` albo `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby oparte na tożsamości, takie jak Tailscale Serve albo `trusted-proxy`, używają zamiast tego nagłówków żądań. Unikaj umieszczania wspólnych sekretów w adresach URL.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback na tym samym hoście nadal **nie** spełniają wymagań uwierzytelniania trusted-proxy. Zaufane proxy musi być skonfigurowanym źródłem innym niż loopback.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokena na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gateway, także dla loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki uwierzytelniania, uruchomienie gateway przechodzi w tryb tokena i automatycznie go generuje, zapisując do `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. To blokuje innym lokalnym procesom wywoływanie Gateway.

    Jeśli wolisz inną ścieżkę uwierzytelniania, możesz jawnie wybrać tryb hasła (albo, dla reverse proxy innych niż loopback i świadomych tożsamości, `trusted-proxy`). Jeśli **naprawdę** chcesz otwarty loopback, jawnie ustaw w konfiguracji `gateway.auth.mode: "none"`. Doctor może wygenerować token w dowolnym momencie: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy po zmianie konfiguracji muszę wykonać restart?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): bezpieczne zmiany stosowane na gorąco, restart dla zmian krytycznych
    - Obsługiwane są też `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Jak wyłączyć zabawne slogany CLI?">
    Ustaw `cli.banner.taglineMode` w konfiguracji:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ukrywa tekst sloganu, ale zachowuje tytuł banera/wiersz wersji.
    - `default`: za każdym razem używa `All your chats, one OpenClaw.`.
    - `random`: rotujące zabawne/sezonowe slogany (zachowanie domyślne).
    - Jeśli nie chcesz żadnego banera, ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i web fetch)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    dostawcy:

    - Dostawcy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają standardowej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest to nieoficjalna integracja oparta na HTML.
    - SearXNG nie wymaga klucza/jest self-hosted; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz dostawcę.
    Alternatywy przez zmienne środowiskowe:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` albo `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` albo `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` albo `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // opcjonalne; pomiń, aby użyć automatycznego wykrywania
            },
          },
        },
    }
    ```

    Konfiguracja web-search specyficzna dla dostawcy znajduje się teraz pod `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki dostawcy `tools.web.search.*` są jeszcze tymczasowo ładowane dla zgodności, ale nie należy ich używać w nowych konfiguracjach.
    Konfiguracja fallbacku web-fetch dla Firecrawl znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz list dozwolonych, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest domyślnie włączone (chyba że zostanie jawnie wyłączone).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę fallback dla fetch na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo ze środowiska usługi).

    Dokumentacja: [Narzędzia webowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło moją konfigurację. Jak to odzyskać i jak tego uniknąć?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz obiekt częściowy, wszystko
    inne zostanie usunięte.

    Odzyskiwanie:

    - Przywróć z kopii zapasowej (git albo skopiowane `~/.openclaw/openclaw.json`).
    - Jeśli nie masz kopii zapasowej, ponownie uruchom `openclaw doctor` i skonfiguruj kanały/modele na nowo.
    - Jeśli to było nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent programistyczny często potrafi odtworzyć działającą konfigurację z logów albo historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` do małych zmian.
    - Używaj `openclaw configure` do edycji interaktywnych.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich elementów podrzędnych do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; `config.apply` zostaw wyłącznie do pełnej wymiany konfiguracji.
    - Jeśli używasz narzędzia `gateway` tylko dla właściciela z poziomu uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze specjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **Node** i **agenci**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), routingiem i sesjami.
    - **Node (urządzenia):** Mac/iOS/Android łączą się jako urządzenia peryferyjne i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workery):** oddzielne „mózgi”/workspace do wyspecjalizowanych ról (np. „Hetzner ops”, „Dane osobiste”).
    - **Sub-agenci:** uruchamiają pracę w tle z głównego agenta, gdy potrzebujesz równoległości.
    - **TUI:** łączy się z Gateway i przełącza agentów/sesje.

    Dokumentacja: [Node](/pl/nodes), [Dostęp zdalny](/pl/gateway/remote), [Routing Multi-Agent](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać w trybie headless?">
    Tak. To opcja konfiguracji:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Domyślnie jest `false` (z interfejsem). Tryb headless częściej uruchamia kontrole antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Tryb headless używa **tego samego silnika Chromium** i działa w większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (jeśli potrzebujesz obrazu, używaj zrzutów ekranu).
    - Niektóre strony są bardziej restrykcyjne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na plik binarny Brave (lub dowolnej przeglądarki opartej na Chromium) i uruchom ponownie Gateway.
    Pełne przykłady konfiguracji znajdziesz w [Przeglądarce](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gateway i Node

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegram, gateway i Node?">
    Wiadomości Telegram są obsługiwane przez **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje Node przez **Gateway WebSocket**, gdy potrzebne jest narzędzie Node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node nie widzą ruchu przychodzącego od dostawców; otrzymują tylko wywołania RPC Node.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako Node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (ekran, kamera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na zawsze włączonym hoście (VPS/serwer domowy).
    2. Umieść host gateway i swój komputer w tej samej tailnet.
    3. Upewnij się, że WS Gateway jest osiągalny (bind tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Remote over SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako Node.
    5. Zatwierdź Node na Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nie jest wymagany osobny most TCP; Node łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: sparowanie Node macOS pozwala na `system.run` na tej maszynie. Paryj
    tylko zaufane urządzenia i zapoznaj się z [Bezpieczeństwem](/pl/gateway/security).

    Dokumentacja: [Node](/pl/nodes), [Protokół Gateway](/pl/gateway/protocol), [Tryb zdalny macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Stan gateway: `openclaw status`
    - Stan kanałów: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje listy dozwolonych (DM albo grupowe) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to połączyć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatu, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a następnie Bot B odpowie jak zwykle.

    **Most CLI (generyczny):** uruchom skrypt, który wywołuje drugi Gateway przez
    `openclaw agent --message ... --deliver`, kierując wiadomość na czat, którego drugi bot
    nasłuchuje. Jeśli jeden bot działa na zdalnym VPS, skieruj swoje CLI na ten zdalny Gateway
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchamiany z maszyny, która może połączyć się z docelowym Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj ograniczenie, aby oba boty nie zapętliły się bez końca (tylko wzmianki, listy dozwolonych kanałów
    albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [CLI agenta](/cli/agent), [Wysyłanie przez agenta](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję oddzielnych VPS dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, z których każdy ma własny workspace, domyślne modele
    i routing. To jest normalna konfiguracja i jest znacznie tańsza oraz prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj oddzielnych VPS tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie trzymaj jeden Gateway i
    używaj wielu agentów albo sub-agentów.

  </Accordion>

  <Accordion title="Czy używanie Node na moim osobistym laptopie daje korzyści względem SSH z VPS?">
    Tak — Node to podstawowy sposób na dotarcie do laptopa ze zdalnego Gateway i
    oferują więcej niż sam dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (wystarczy mały VPS albo urządzenie klasy Raspberry Pi; 4 GB RAM to dużo), więc typowa
    konfiguracja to zawsze włączony host plus laptop jako Node.

    - **Bez przychodzącego SSH.** Node łączą się wychodząco z Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsza kontrola wykonywania.** `system.run` jest kontrolowane przez listy dozwolonych/zatwierdzenia Node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Node udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj Chrome lokalnie przez hosta node na laptopie albo dołącz do lokalnego Chrome na hoście przez Chrome MCP.

    SSH nadaje się do doraźnego dostępu do powłoki, ale Node są prostsze w bieżących przepływach pracy agenta i
    automatyzacji urządzeń.

    Dokumentacja: [Node](/pl/nodes), [CLI Node](/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy Node uruchamiają usługę gateway?">
    Nie. Na hoście powinien działać tylko **jeden gateway**, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gateway](/pl/gateway/multiple-gateways)). Node to urządzenia peryferyjne łączące się
    z gateway (Node iOS/Android albo „tryb node” macOS w aplikacji paska menu). Informacje o headless hostach node
    i sterowaniu przez CLI znajdziesz w [CLI hosta Node](/cli/node).

    Pełny restart jest wymagany przy zmianach `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje API / RPC do stosowania konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdza jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich elementów podrzędnych przed zapisem
    - `config.get`: pobiera bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (preferowana dla większości edycji RPC); stosuje hot-reload, gdy to możliwe, i wykonuje restart, gdy jest wymagany
    - `config.apply`: waliduje + zastępuje całą konfigurację; stosuje hot-reload, gdy to możliwe, i wykonuje restart, gdy jest wymagany
    - Narzędzie runtime `gateway`, dostępne tylko dla właściciela, nadal odmawia nadpisywania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia Twój workspace i ogranicza, kto może uruchamiać bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z Maca?">
    Minimalne kroki:

    1. **Zainstaluj i zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj i zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tej samej tailnet.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz używać Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    To pozostawia gateway powiązany z loopback i udostępnia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak połączyć Node Mac z zdalnym Gateway (Tailscale Serve)?">
    Serve udostępnia **Gateway Control UI + WS**. Node łączą się przez ten sam endpoint Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS i Mac są w tej samej tailnet**.
    2. **Użyj aplikacji macOS w trybie Remote** (celem SSH może być nazwa hosta tailnet).
       Aplikacja zestawi tunel do portu Gateway i połączy się jako Node.
    3. **Zatwierdź Node** na gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gateway](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [Tryb zdalny macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy powinienem/powinnam zainstalować system na drugim laptopie, czy po prostu dodać Node?">
    Jeśli potrzebujesz tylko **lokalnych narzędzi** (ekran/kamera/exec) na drugim laptopie, dodaj go jako
    **Node**. Dzięki temu zachowujesz jeden Gateway i unikasz duplikowania konfiguracji. Lokalne narzędzia node są
    obecnie dostępne tylko na macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Instaluj drugi Gateway tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie oddzielnych botów.

    Dokumentacja: [Node](/pl/nodes), [CLI Node](/cli/nodes), [Wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie `.env`

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny zapasowy `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden z plików `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też zdefiniować zmienne inline w konfiguracji (stosowane tylko wtedy, gdy brakuje ich w środowisku procesu):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Pełną kolejność pierwszeństwa i źródła znajdziesz w [/environment](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem/uruchomiłam Gateway przez usługę i moje zmienne środowiskowe zniknęły. Co teraz?">
    Dwa częste rozwiązania:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby były pobierane nawet wtedy, gdy usługa nie dziedziczy środowiska Twojej powłoki.
    2. Włącz import powłoki (opcjonalne ułatwienie):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    To uruchamia Twoją powłokę logowania i importuje tylko brakujące oczekiwane klucze (nigdy nie nadpisuje). Odpowiedniki w zmiennych środowiskowych:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ustawiłem/ustawiłam `COPILOT_GITHUB_TOKEN`, ale models status pokazuje "Shell env: off.". Dlaczego?'>
    `openclaw models status` informuje, czy **import środowiska powłoki** jest włączony. „Shell env: off”
    **nie** oznacza, że brakuje Twoich zmiennych środowiskowych — oznacza tylko, że OpenClaw nie będzie
    automatycznie ładować Twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie będzie dziedziczyć środowiska
    Twojej powłoki. Napraw to w jeden z tych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosuje się tylko, gdy go brakuje).

    Następnie uruchom ponownie gateway i sprawdź ponownie:

    ```bash
    openclaw models status
    ```

    Tokeny Copilot są odczytywane z `COPILOT_GITHUB_TOKEN` (również `GH_TOKEN` / `GITHUB_TOKEN`).
    Zobacz [/concepts/model-providers](/pl/concepts/model-providers) oraz [/environment](/pl/help/environment).

  </Accordion>
</AccordionGroup>

## Sesje i wiele czatów

<AccordionGroup>
  <Accordion title="Jak rozpocząć nową rozmowę?">
    Wyślij `/new` albo `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesjami](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygaszanie po bezczynności. Gdy jest włączone, **następna**
    wiadomość po okresie bezczynności rozpoczyna nowy identyfikator sesji dla tego klucza czatu.
    To nie usuwa transkrypcji — po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy istnieje sposób na stworzenie zespołu instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing multi-agent** i **sub-agentów**. Możesz utworzyć jednego agenta
    koordynującego i kilku agentów roboczych z własnymi workspace i modelami.

    Mimo to najlepiej traktować to jako **zabawny eksperyment**. Zużywa dużo tokenów i często
    jest mniej efektywne niż używanie jednego bota z oddzielnymi sesjami. Typowy model, który
    sobie wyobrażamy, to jeden bot, z którym rozmawiasz, z różnymi sesjami do pracy równoległej. Ten
    bot może też w razie potrzeby uruchamiać sub-agentów.

    Dokumentacja: [Routing multi-agent](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [CLI agentów](/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony przez okno modelu. Długie czaty, duże dane wyjściowe narzędzi albo wiele
    plików mogą wywołać Compaction albo obcięcie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Użyj `/compact` przed długimi zadaniami i `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w workspace i poproś bota, aby go ponownie odczytał.
    - Używaj sub-agentów do długiej albo równoległej pracy, aby główny czat pozostawał mniejszy.
    - Wybierz model z większym oknem kontekstu, jeśli to zdarza się często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale zachować instalację?">
    Użyj polecenia reset:

    ```bash
    openclaw reset
    ```

    Pełny reset nieinteraktywny:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Następnie ponownie uruchom konfigurację:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Wdrażanie oferuje też **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Wdrażanie (CLI)](/pl/start/wizard).
    - Jeśli używasz profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślnie to `~/.openclaw-<profile>`).
    - Reset deweloperski: `openclaw gateway --dev --reset` (tylko dla środowiska deweloperskiego; czyści konfigurację dev + poświadczenia + sesje + workspace).

  </Accordion>

  <Accordion title='Dostaję błędy "context too large" — jak wykonać reset albo Compaction?'>
    Użyj jednego z tych sposobów:

    - **Compaction** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby ukierunkować podsumowanie.

    - **Reset** (nowy identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli problem się powtarza:

    - Włącz albo dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby obcinać stare dane wyjściowe narzędzi.
    - Użyj modelu z większym oknem kontekstu.

    Dokumentacja: [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesjami](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji dostawcy: model wygenerował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest nieaktualna albo uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Rozwiązanie: rozpocznij nową sesję przez `/new` (samodzielna wiadomość).

  </Accordion>

  <Accordion title="Dlaczego dostaję wiadomości heartbeat co 30 minut?">
    Heartbeat uruchamia się domyślnie co **30m** (**1h** przy użyciu uwierzytelniania OAuth). Dostosuj albo wyłącz:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // albo "0m", aby wyłączyć
          },
        },
      },
    }
    ```

    Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce puste (tylko puste linie i nagłówki
    markdown, takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzić wywołania API.
    Jeśli pliku nie ma, heartbeat nadal się uruchamia, a model decyduje, co zrobić.

    Nadpisania per agent używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodać „konto bota” do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi grupowe są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** móc uruchamiać odpowiedzi grupowe:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Jak uzyskać JID grupy WhatsApp?">
    Opcja 1 (najszybsza): śledź logi i wyślij wiadomość testową w grupie:

    ```bash
    openclaw logs --follow --json
    ```

    Szukaj `chatId` (albo `from`) kończącego się na `@g.us`, na przykład:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowano/dodano do listy dozwolonych): wyświetl grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Directory](/cli/directory), [Logi](/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie częste przyczyny:

    - Włączone jest blokowanie przez wzmianki (domyślnie). Musisz oznaczyć bota przez @mention (albo dopasować `mentionPatterns`).
    - Skonfigurowano `channels.whatsapp.groups` bez `"*"`, a grupa nie znajduje się na liście dozwolonych.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM?">
    Czaty bezpośrednie są domyślnie zwijane do sesji głównej. Grupy/kanały mają własne klucze sesji, a tematy Telegram / wątki Discord są oddzielnymi sesjami. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile workspace i agentów mogę utworzyć?">
    Nie ma twardych limitów. Dziesiątki (a nawet setki) są w porządku, ale zwracaj uwagę na:

    - **Przyrost miejsca na dysku:** sesje + transkrypcje znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza większe równoczesne użycie modeli.
    - **Narzut operacyjny:** profile uwierzytelniania per agent, workspace i routing kanałów.

    Wskazówki:

    - Zachowuj jeden **aktywny** workspace na agenta (`agents.defaults.workspace`).
    - Czyść stare sesje (usuń wpisy JSONL albo wpisy magazynu), jeśli rośnie zużycie dysku.
    - Używaj `openclaw doctor`, aby wykrywać zbędne workspace i niezgodności profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów albo czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **Routingu Multi-Agent**, aby uruchamiać wiele izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peer. Slack jest obsługiwany jako kanał i może być przypisywany do konkretnych agentów.

    Dostęp do przeglądarki jest potężny, ale nie oznacza „zrób wszystko, co potrafi człowiek” — antyboty, CAPTCHA i MFA nadal mogą
    blokować automatyzację. Aby uzyskać najbardziej niezawodne sterowanie przeglądarką, używaj lokalnego Chrome MCP na hoście
    albo CDP na maszynie, która faktycznie uruchamia przeglądarkę.

    Konfiguracja zgodna z dobrymi praktykami:

    - Zawsze włączony host Gateway (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanały Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP albo Node, gdy jest potrzebna.

    Dokumentacja: [Routing Multi-Agent](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Node](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele: ustawienia domyślne, wybór, aliasy, przełączanie

<AccordionGroup>
  <Accordion title='Co to jest „model domyślny”?'>
    Domyślny model OpenClaw to ten, który ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Modele są wskazywane jako `provider/model` (przykład: `openai/gpt-5.4`). Jeśli pominiesz dostawcę, OpenClaw najpierw spróbuje aliasu, potem jednoznacznego dopasowania do skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu, a dopiero potem użyje skonfigurowanego domyślnego dostawcy jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw przechodzi do pierwszego skonfigurowanego dostawcy/modelu zamiast pokazywać nieaktualny domyślny model z usuniętego dostawcy. Nadal jednak powinno się **jawnie** ustawiać `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecany domyślny wybór:** używaj najsilniejszego modelu najnowszej generacji dostępnego w Twoim stosie dostawców.
    **Dla agentów z włączonymi narzędziami albo z niezaufanym wejściem:** stawiaj siłę modelu ponad koszt.
    **Do rutynowego/niskiego ryzyka czatu:** używaj tańszych modeli zapasowych i kieruj ruchem według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) oraz
    [Modele lokalne](/pl/gateway/local-models).

    Zasada praktyczna: używaj **najlepszego modelu, na jaki Cię stać** do zadań wysokiej wagi, a tańszego
    modelu do rutynowego czatu albo podsumowań. Możesz routować modele per agent i używać sub-agentów do
    pracy równoległej przy długich zadaniach (każdy sub-agent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) oraz
    [Sub-agentów](/pl/tools/subagents).

    Mocne ostrzeżenie: słabsze/nadmiernie kwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowanie. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączać modele bez wyczyszczania konfiguracji?">
    Używaj **poleceń modeli** albo edytuj tylko pola **modelu**. Unikaj pełnej wymiany konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, per sesja)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edycja `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z obiektem częściowym, chyba że zamierzasz zastąpić całą konfigurację.
    W przypadku edycji RPC najpierw sprawdź przez `config.schema.lookup` i preferuj `config.patch`. Ładunek lookup zwraca znormalizowaną ścieżkę, płytką dokumentację/ograniczenia schematu oraz podsumowania bezpośrednich elementów podrzędnych
    dla częściowych aktualizacji.
    Jeśli nadpisałeś/nadpisałaś konfigurację, przywróć ją z kopii zapasowej albo ponownie uruchom `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli self-hosted (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka do modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz model lokalny, na przykład `ollama pull gemma4`
    3. Jeśli chcesz również modeli chmurowych, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje Ci modele chmurowe oraz lokalne modele Ollama
    - modele chmurowe, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobierania
    - do ręcznego przełączania użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze albo silnie kwantyzowane modele są bardziej podatne na prompt
    injection. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli mimo to chcesz małych modeli, włącz sandboxing i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać w czasie; nie ma stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie środowiska uruchomieniowego na każdym gateway przez `openclaw models status`.
    - W przypadku agentów wrażliwych na bezpieczeństwo/z włączonymi narzędziami używaj najsilniejszego modelu najnowszej generacji.
  </Accordion>

  <Accordion title="Jak przełączać modele w locie (bez restartu)?">
    Użyj polecenia `/model` jako samodzielnej wiadomości:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    To są wbudowane aliasy. Własne aliasy można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić przez `/model`, `/model list` albo `/model status`.

    `/model` (i `/model list`) pokazuje kompaktowy numerowany wybierak. Wybierz po numerze:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla dostawcy (per sesja):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany oraz który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje też skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony przez @profile?**

    Ponownie uruchom `/model` **bez** przyrostka `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do domyślnego ustawienia, wybierz je z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.2 do codziennych zadań, a Codex 5.3 do programowania?">
    Tak. Ustaw jeden jako domyślny i przełączaj w razie potrzeby:

    - **Szybkie przełączanie (per sesja):** `/model gpt-5.4` do codziennych zadań, `/model openai-codex/gpt-5.4` do programowania z Codex OAuth.
    - **Domyślny + przełączanie:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.4`, a następnie przełącz na `openai-codex/gpt-5.4` podczas programowania (albo odwrotnie).
    - **Sub-agenci:** kieruj zadania programistyczne do sub-agentów z innym modelem domyślnym.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować fast mode dla GPT 5.4?">
    Użyj przełącznika sesji albo ustawienia domyślnego w konfiguracji:

    - **Per sesja:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.4` albo `openai-codex/gpt-5.4`.
    - **Domyślnie per model:** ustaw `agents.defaults.models["openai/gpt-5.4"].params.fastMode` na `true`.
    - **Również dla Codex OAuth:** jeśli używasz też `openai-codex/gpt-5.4`, ustaw tam tę samą flagę.

    Przykład:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    W przypadku OpenAI fast mode mapuje się do `service_tier = "priority"` przy obsługiwanych natywnych żądaniach Responses. Sesyjne nadpisania `/fast` mają pierwszeństwo przed ustawieniami domyślnymi z konfiguracji.

    Zobacz [Thinking i fast mode](/pl/tools/thinking) oraz [OpenAI fast mode](/pl/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę "Model ... is not allowed", a potem brak odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się to **listą dozwolonych** dla `/model` i wszystkich
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ten błąd jest zwracany **zamiast** zwykłej odpowiedzi. Rozwiązanie: dodaj model do
    `agents.defaults.models`, usuń listę dozwolonych albo wybierz model z `/model list`.

  </Accordion>

  <Accordion title='Dlaczego widzę "Unknown model: minimax/MiniMax-M2.7"?'>
    To oznacza, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani profilu
    uwierzytelniania), więc modelu nie da się rozwiązać.

    Lista kontrolna naprawy:

    1. Zaktualizuj do bieżącej wersji OpenClaw (albo uruchamiaj ze źródeł z `main`), a następnie uruchom ponownie gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator albo JSON) albo że uwierzytelnianie MiniMax
       istnieje w env/profilach uwierzytelniania, tak aby pasujący dostawca mógł zostać wstrzyknięty
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` albo zapisane MiniMax
       OAuth dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z rozróżnieniem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M2.7` albo `minimax/MiniMax-M2.7-highspeed` dla konfiguracji z kluczem API,
       albo `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` na czacie).

    Zobacz [MiniMax](/pl/providers/minimax) i [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego, a OpenAI do złożonych zadań?">
    Tak. Używaj **MiniMax jako domyślnego** i przełączaj modele **per sesja** w razie potrzeby.
    Fallbacki służą do **błędów**, a nie do „trudnych zadań”, więc używaj `/model` albo osobnego agenta.

    **Opcja A: przełączanie per sesja**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Następnie:

    ```
    /model gpt
    ```

    **Opcja B: oddzielni agenci**

    - Domyślny Agent A: MiniMax
    - Domyślny Agent B: OpenAI
    - Kieruj ruchem według agenta albo użyj `/agent` do przełączania

    Dokumentacja: [Modele](/pl/concepts/models), [Routing Multi-Agent](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Czy `opus` / `sonnet` / `gpt` to wbudowane skróty?">
    Tak. OpenClaw zawiera kilka domyślnych skrótów (stosowanych tylko wtedy, gdy model istnieje w `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jeśli ustawisz własny alias o tej samej nazwie, Twoja wartość ma pierwszeństwo.

  </Accordion>

  <Accordion title="Jak zdefiniować/zastąpić skróty modeli (aliasy)?">
    Aliasy pochodzą z `agents.defaults.models.<modelId>.alias`. Przykład:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Wtedy `/model sonnet` (albo `/<alias>`, gdy jest obsługiwane) rozwiązuje się do tego identyfikatora modelu.

  </Accordion>

  <Accordion title="Jak dodać modele od innych dostawców, takich jak OpenRouter albo Z.AI?">
    OpenRouter (płatność za token; wiele modeli):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modele GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Jeśli odwołasz się do `provider/model`, ale zabraknie wymaganego klucza dostawcy, pojawi się błąd uwierzytelniania w czasie działania (np. `No API key found for provider "zai"`).

    **Po dodaniu nowego agenta nie znaleziono klucza API dla dostawcy**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest per agent i
    jest przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze.
    - Albo skopiuj `auth-profiles.json` z `agentDir` głównego agenta do `agentDir` nowego agenta.

    **Nie** używaj tego samego `agentDir` dla wielu agentów; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Fallback modeli i „All models failed”

<AccordionGroup>
  <Accordion title="Jak działa failover?">
    Failover przebiega w dwóch etapach:

    1. **Rotacja profilu uwierzytelniania** w obrębie tego samego dostawcy.
    2. **Fallback modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

    Dla zawodnych profili obowiązują okresy cooldown (wykładniczy backoff), dzięki czemu OpenClaw może nadal odpowiadać, nawet gdy dostawca ma rate limit albo chwilowo nie działa.

    Segment rate limit obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okna użycia (`weekly/monthly limit reached`) jako
    rate limit warte failover.

    Niektóre odpowiedzi wyglądające na problemy rozliczeniowe nie są `402`, a niektóre odpowiedzi HTTP `402`
    również pozostają w tym przejściowym segmencie. Jeśli dostawca zwróci
    jawny tekst rozliczeniowy przy `401` albo `403`, OpenClaw nadal może zachować to
    w ścieżce rozliczeniowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda raczej na możliwe do ponowienia okno użycia albo
    limit wydatków organizacji/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje to jako
    `rate_limit`, a nie długotrwałe wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` albo `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast przechodzić do
    fallbacku modelu.

    Tekst ogólnych błędów serwera jest celowo węższy niż „cokolwiek z
    unknown/error w treści”. OpenClaw traktuje jako warte failover przejściowe kształty specyficzne dla dostawcy,
    takie jak Anthropic z samym `An unknown error occurred`, OpenRouter z samym
    `Provider returned error`, błędy stop-reason takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy takie jak `ModelNotReadyException`, gdy
    pasuje kontekst dostawcy.
    Ogólny wewnętrzny tekst fallback, taki jak `LLM request failed with an unknown
    error.`, pozostaje konserwatywny i sam w sobie nie uruchamia fallbacku modelu.

  </Accordion>

  <Accordion title='Co oznacza "No credentials found for profile anthropic:default"?'>
    Oznacza to, że system próbował użyć identyfikatora profilu uwierzytelniania `anthropic:default`, ale nie znalazł dla niego poświadczeń w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Sprawdź, gdzie znajdują się profile uwierzytelniania** (nowe vs starsze ścieżki)
      - Obecnie: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsze: `~/.openclaw/agent/*` (migrowane przez `openclaw doctor`)
    - **Sprawdź, czy Gateway załadował Twoją zmienną środowiskową**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie odziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje multi-agent oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Kontrola poprawności stanu modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i to, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla "No credentials found for profile anthropic"**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może go znaleźć w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście gateway.
    - **Jeśli zamiast tego chcesz używać klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście gateway**.
      - Wyczyść wszelkie przypięte kolejności wymuszające brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście gateway**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie gateway, a nie na Twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego system próbował też Google Gemini i się nie udało?">
    Jeśli konfiguracja modelu obejmuje Google Gemini jako fallback (albo przełączyłeś/przełączyłaś się na skrót Gemini), OpenClaw spróbuje go podczas fallbacku modelu. Jeśli nie skonfigurowałeś/skonfigurowałaś poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Rozwiązanie: albo podaj uwierzytelnianie Google, albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby fallback tam nie kierował.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki thinking bez sygnatur** (często po
    przerwanym/częściowym streamie). Google Antigravity wymaga sygnatur dla bloków thinking.

    Rozwiązanie: OpenClaw usuwa teraz niepodpisane bloki thinking dla Google Antigravity Claude. Jeśli nadal to widzisz, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile uwierzytelniania: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce wielu kont)

<AccordionGroup>
  <Accordion title="Czym jest profil uwierzytelniania?">
    Profil uwierzytelniania to nazwany rekord poświadczeń (OAuth albo klucz API) powiązany z dostawcą. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Jakie są typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - własne identyfikatory, które wybierzesz (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane dla profili oraz kolejność per dostawca (`auth.order.<provider>`). To **nie** przechowuje sekretów; mapuje identyfikatory na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli jest on w krótkim **cooldownie** (rate limity/timeouty/błędy uwierzytelniania) albo w dłuższym stanie **disabled** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Strojenie: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate limit może być ograniczony do modelu. Profil, który jest w cooldownie
    dla jednego modelu, może nadal nadawać się do użycia dla modelu pokrewnego u tego samego dostawcy,
    podczas gdy okna billing/disabled nadal blokują cały profil.

    Możesz też ustawić nadpisanie kolejności **per agent** (przechowywane w `auth-state.json` tego agenta) przez CLI:

    ```bash
    # Domyślnie dla skonfigurowanego domyślnego agenta (pomiń --agent)
    openclaw models auth order get --provider anthropic

    # Zablokuj rotację do jednego profilu (próbuj tylko tego)
    openclaw models auth order set --provider anthropic anthropic:default

    # Albo ustaw jawny porządek (fallback w obrębie dostawcy)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Wyczyść nadpisanie (powrót do config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Aby wskazać konkretnego agenta:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Aby zweryfikować, co faktycznie będzie próbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, sonda zgłosi
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth vs klucz API — jaka jest różnica?">
    OpenClaw obsługuje oba rozwiązania:

    - **OAuth** często wykorzystuje dostęp subskrypcyjny (tam, gdzie ma to zastosowanie).
    - **Klucze API** korzystają z rozliczania za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth i klucze API.

  </Accordion>
</AccordionGroup>

## Gateway: porty, „already running” i tryb zdalny

<AccordionGroup>
  <Accordion title="Jakiego portu używa Gateway?">
    `gateway.port` steruje pojedynczym multipleksowanym portem dla WebSocket + HTTP (Control UI, hooki itd.).

    Priorytet:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > domyślnie 18789
    ```

  </Accordion>

  <Accordion title='Dlaczego `openclaw gateway status` pokazuje "Runtime: running", ale "Connectivity probe: failed"?'>
    Ponieważ „running” to widok **supervisora** (launchd/systemd/schtasks). Sonda łączności polega natomiast na tym, że CLI faktycznie łączy się z gateway WebSocket.

    Użyj `openclaw gateway status` i ufaj tym wierszom:

    - `Probe target:` (URL, którego sonda faktycznie użyła)
    - `Listening:` (co faktycznie jest powiązane z portem)
    - `Last gateway error:` (częsta przyczyna źródłowa, gdy proces żyje, ale port nie nasłuchuje)

  </Accordion>

  <Accordion title='Dlaczego `openclaw gateway status` pokazuje różne wartości dla "Config (cli)" i "Config (service)"?'>
    Edytujesz jeden plik konfiguracji, podczas gdy usługa działa na innym (często jest to niezgodność `--profile` / `OPENCLAW_STATE_DIR`).

    Naprawa:

    ```bash
    openclaw gateway install --force
    ```

    Uruchom to z tego samego `--profile` / środowiska, którego usługa ma używać.

  </Accordion>

  <Accordion title='Co oznacza "another gateway instance is already listening"?'>
    OpenClaw wymusza blokadę środowiska uruchomieniowego przez natychmiastowe powiązanie nasłuchu WebSocket przy starcie (domyślnie `ws://127.0.0.1:18789`). Jeśli powiązanie nie powiedzie się z `EADDRINUSE`, zgłaszany jest `GatewayLockError`, informujący, że inna instancja już nasłuchuje.

    Rozwiązanie: zatrzymaj drugą instancję, zwolnij port albo uruchom z `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Jak uruchomić OpenClaw w trybie zdalnym (klient łączy się z Gateway gdzie indziej)?">
    Ustaw `gateway.mode: "remote"` i wskaż zdalny adres URL WebSocket, opcjonalnie ze wspólnymi poświadczeniami zdalnymi:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Uwagi:

    - `openclaw gateway` uruchamia się tylko wtedy, gdy `gateway.mode` ma wartość `local` (albo przekażesz flagę nadpisania).
    - Aplikacja macOS obserwuje plik konfiguracji i przełącza tryby na żywo, gdy te wartości się zmieniają.
    - `gateway.remote.token` / `.password` to wyłącznie poświadczenia zdalne po stronie klienta; same z siebie nie włączają lokalnego uwierzytelniania gateway.

  </Accordion>

  <Accordion title='Control UI pokazuje "unauthorized" (albo ciągle się ponownie łączy). Co teraz?'>
    Ścieżka uwierzytelniania gateway i metoda uwierzytelniania UI nie pasują do siebie.

    Fakty (z kodu):

    - Control UI przechowuje token w `sessionStorage` dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway, więc odświeżenie w tej samej karcie nadal działa bez przywracania długotrwałego utrwalania tokenu w localStorage.
    - Przy `AUTH_TOKEN_MISMATCH` zaufani klienci mogą wykonać jedno ograniczone ponowienie z użyciem zbuforowanego tokenu urządzenia, gdy gateway zwraca wskazówki ponowienia (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - To ponowienie z użyciem zbuforowanego tokenu używa teraz ponownie zbuforowanych zatwierdzonych zakresów przechowywanych z tokenem urządzenia. Wywołania z jawnym `deviceToken` / jawnymi `scopes` nadal zachowują żądany zestaw zakresów zamiast dziedziczyć zbuforowane zakresy.
    - Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania połączenia wygląda następująco: jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
    - Kontrole zakresów tokenu bootstrap są prefiksowane rolą. Wbudowana lista dozwolonych operatora bootstrap spełnia tylko żądania operatora; Node albo inne role niebędące operatorem nadal potrzebują zakresów pod własnym prefiksem roli.

    Rozwiązanie:

    - Najszybciej: `openclaw dashboard` (wyświetla + kopiuje adres URL dashboard, próbuje otworzyć; pokazuje wskazówkę SSH, jeśli działa bez interfejsu).
    - Jeśli nie masz jeszcze tokenu: `openclaw doctor --generate-gateway-token`.
    - Jeśli jest zdalnie, najpierw zestaw tunel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a potem otwórz `http://127.0.0.1:18789/`.
    - Tryb wspólnego sekretu: ustaw `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a następnie wklej pasujący sekret w ustawieniach Control UI.
    - Tryb Tailscale Serve: upewnij się, że `gateway.auth.allowTailscale` jest włączone i otwierasz adres URL Serve, a nie surowy adres loopback/tailnet, który omija nagłówki tożsamości Tailscale.
    - Tryb trusted-proxy: upewnij się, że wchodzisz przez skonfigurowane, świadome tożsamości proxy inne niż loopback, a nie przez proxy loopback na tym samym hoście albo surowy adres URL gateway.
    - Jeśli niezgodność utrzymuje się po jednym ponowieniu, obróć/ponownie zatwierdź sparowany token urządzenia:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jeśli wywołanie rotate mówi, że zostało odrzucone, sprawdź dwie rzeczy:
      - sesje sparowanych urządzeń mogą obracać tylko **własne** urządzenie, chyba że mają też `operator.admin`
      - jawne wartości `--scope` nie mogą przekraczać bieżących zakresów operatora wywołującego
    - Nadal utknąłeś/utknęłaś? Uruchom `openclaw status --all` i skorzystaj z [Rozwiązywania problemów](/pl/gateway/troubleshooting). Szczegóły uwierzytelniania znajdziesz w [Dashboard](/web/dashboard).

  </Accordion>

  <Accordion title="Ustawiłem/ustawiłam gateway.bind tailnet, ale nie może się powiązać i nic nie nasłuchuje">
    Powiązanie `tailnet` wybiera adres IP Tailscale z interfejsów sieciowych (100.64.0.0/10). Jeśli maszyna nie jest w Tailscale (albo interfejs jest wyłączony), nie ma do czego się powiązać.

    Rozwiązanie:

    - Uruchom Tailscale na tym hoście (tak aby miał adres 100.x), albo
    - Przełącz na `gateway.bind: "loopback"` / `"lan"`.

    Uwaga: `tailnet` jest jawne. `auto` preferuje loopback; użyj `gateway.bind: "tailnet"`, gdy chcesz powiązania tylko z tailnet.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele Gateway na tym samym hoście?">
    Zwykle nie — jeden Gateway może obsługiwać wiele kanałów komunikacyjnych i agentów. Używaj wielu Gateway tylko wtedy, gdy potrzebujesz redundancji (np. rescue bot) albo twardej izolacji.

    Tak, ale musisz odizolować:

    - `OPENCLAW_CONFIG_PATH` (konfiguracja per instancja)
    - `OPENCLAW_STATE_DIR` (stan per instancja)
    - `agents.defaults.workspace` (izolacja workspace)
    - `gateway.port` (unikalne porty)

    Szybka konfiguracja (zalecana):

    - Używaj `openclaw --profile <name> ...` dla każdej instancji (automatycznie tworzy `~/.openclaw-<name>`).
    - Ustaw unikalne `gateway.port` w konfiguracji każdego profilu (albo przekaż `--port` przy uruchamianiu ręcznym).
    - Zainstaluj usługę per profil: `openclaw --profile <name> gateway install`.

    Profile dodają też sufiksy do nazw usług (`ai.openclaw.<profile>`; starsze `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Pełny przewodnik: [Wiele gateway](/pl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Co oznacza "invalid handshake" / kod 1008?'>
    Gateway to **serwer WebSocket** i oczekuje, że pierwszą wiadomością
    będzie ramka `connect`. Jeśli otrzyma coś innego, zamyka połączenie
    z **kodem 1008** (naruszenie zasad).

    Typowe przyczyny:

    - Otworzyłeś/otworzyłaś adres URL **HTTP** w przeglądarce (`http://...`) zamiast klienta WS.
    - Użyto niewłaściwego portu albo ścieżki.
    - Proxy albo tunel usunęły nagłówki uwierzytelniania albo wysłały żądanie nieprzeznaczone dla Gateway.

    Szybkie rozwiązania:

    1. Użyj adresu URL WS: `ws://<host>:18789` (albo `wss://...`, jeśli używasz HTTPS).
    2. Nie otwieraj portu WS w zwykłej karcie przeglądarki.
    3. Jeśli uwierzytelnianie jest włączone, dołącz token/hasło w ramce `connect`.

    Jeśli używasz CLI albo TUI, adres URL powinien wyglądać tak:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logowanie i debugowanie

<AccordionGroup>
  <Accordion title="Gdzie są logi?">
    Logi plikowe (ustrukturyzowane):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Możesz ustawić stabilną ścieżkę przez `logging.file`. Poziom logowania plikowego jest kontrolowany przez `logging.level`. Szczegółowość konsoli kontrolują `--verbose` i `logging.consoleLevel`.

    Najszybsze śledzenie logów:

    ```bash
    openclaw logs --follow
    ```

    Logi usługi/supervisora (gdy gateway działa przez launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` i `gateway.err.log` (domyślnie: `~/.openclaw/logs/...`; profile używają `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Więcej informacji znajdziesz w [Rozwiązywaniu problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Jak uruchomić/zatrzymać/ponownie uruchomić usługę Gateway?">
    Użyj pomocników gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz gateway ręcznie, `openclaw gateway --force` może odzyskać port. Zobacz [Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Zamknąłem/zamknęłam terminal na Windows — jak ponownie uruchomić OpenClaw?">
    Istnieją **dwa tryby instalacji na Windows**:

    **1) WSL2 (zalecane):** Gateway działa wewnątrz Linux.

    Otwórz PowerShell, wejdź do WSL, a następnie uruchom ponownie:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli nigdy nie zainstalowałeś/zainstalowałaś usługi, uruchom ją na pierwszym planie:

    ```bash
    openclaw gateway run
    ```

    **2) Natywny Windows (niezalecane):** Gateway działa bezpośrednio na Windows.

    Otwórz PowerShell i uruchom:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jeśli uruchamiasz go ręcznie (bez usługi), użyj:

    ```powershell
    openclaw gateway run
    ```

    Dokumentacja: [Windows (WSL2)](/pl/platforms/windows), [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="Gateway działa, ale odpowiedzi nigdy nie docierają. Co sprawdzić?">
    Zacznij od szybkiego przeglądu stanu:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Typowe przyczyny:

    - Uwierzytelnianie modelu nie zostało załadowane na **hoście gateway** (sprawdź `models status`).
    - Parowanie kanału/lista dozwolonych blokują odpowiedzi (sprawdź konfigurację kanału + logi).
    - WebChat/Dashboard jest otwarty bez właściwego tokenu.

    Jeśli działasz zdalnie, upewnij się, że tunel/połączenie Tailscale działa i że
    Gateway WebSocket jest osiągalny.

    Dokumentacja: [Kanały](/pl/channels), [Rozwiązywanie problemów](/pl/gateway/troubleshooting), [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — co teraz?'>
    Zwykle oznacza to, że UI utraciło połączenie WebSocket. Sprawdź:

    1. Czy Gateway działa? `openclaw gateway status`
    2. Czy Gateway jest zdrowy? `openclaw status`
    3. Czy UI ma właściwy token? `openclaw dashboard`
    4. Jeśli działa zdalnie, czy tunel/łącze Tailscale działa?

    Następnie śledź logi:

    ```bash
    openclaw logs --follow
    ```

    Dokumentacja: [Dashboard](/web/dashboard), [Dostęp zdalny](/pl/gateway/remote), [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands w Telegram kończy się niepowodzeniem. Co sprawdzić?">
    Zacznij od logów i statusu kanału:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Następnie dopasuj błąd:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram ma zbyt wiele wpisów. OpenClaw już przycina je do limitu Telegram i ponawia próbę z mniejszą liczbą poleceń, ale niektóre pozycje menu nadal trzeba usunąć. Ogranicz polecenia Plugin/Skill/niestandardowe albo wyłącz `channels.telegram.commands.native`, jeśli nie potrzebujesz menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` albo podobne błędy sieciowe: jeśli jesteś na VPS albo za proxy, upewnij się, że wychodzący HTTPS jest dozwolony, a DNS działa dla `api.telegram.org`.

    Jeśli Gateway jest zdalny, upewnij się, że sprawdzasz logi na hoście Gateway.

    Dokumentacja: [Telegram](/pl/channels/telegram), [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI nie pokazuje żadnych danych wyjściowych. Co sprawdzić?">
    Najpierw potwierdź, że Gateway jest osiągalny i agent może działać:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    W TUI użyj `/status`, aby zobaczyć bieżący stan. Jeśli oczekujesz odpowiedzi w kanale czatu,
    upewnij się, że dostarczanie jest włączone (`/deliver on`).

    Dokumentacja: [TUI](/web/tui), [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak całkowicie zatrzymać, a potem uruchomić Gateway?">
    Jeśli zainstalowałeś/zainstalowałaś usługę:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    To zatrzymuje/uruchamia **nadzorowaną usługę** (launchd na macOS, systemd na Linux).
    Używaj tego, gdy Gateway działa w tle jako demon.

    Jeśli uruchamiasz w trybie pierwszoplanowym, zatrzymaj przez Ctrl-C, a następnie:

    ```bash
    openclaw gateway run
    ```

    Dokumentacja: [Runbook usługi Gateway](/pl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: ponownie uruchamia **usługę działającą w tle** (launchd/systemd).
    - `openclaw gateway`: uruchamia gateway **na pierwszym planie** dla tej sesji terminala.

    Jeśli zainstalowałeś/zainstalowałaś usługę, używaj poleceń gateway. Użyj `openclaw gateway`, gdy
    chcesz jednorazowego uruchomienia na pierwszym planie.

  </Accordion>

  <Accordion title="Najszybszy sposób, aby uzyskać więcej szczegółów, gdy coś się nie powiedzie">
    Uruchom Gateway z `--verbose`, aby uzyskać więcej szczegółów w konsoli. Następnie sprawdź plik logu pod kątem uwierzytelniania kanału, routingu modelu i błędów RPC.
  </Accordion>
</AccordionGroup>

## Multimedia i załączniki

<AccordionGroup>
  <Accordion title="Mój Skill wygenerował obraz/PDF, ale nic nie zostało wysłane">
    Wychodzące załączniki od agenta muszą zawierać wiersz `MEDIA:<path-or-url>` (we własnym wierszu). Zobacz [Konfiguracja asystenta OpenClaw](/pl/start/openclaw) i [Wysyłanie przez agenta](/pl/tools/agent-send).

    Wysyłanie przez CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Sprawdź też:

    - Docelowy kanał obsługuje wychodzące multimedia i nie jest blokowany przez listy dozwolonych.
    - Plik mieści się w limitach rozmiaru dostawcy (obrazy są skalowane do maks. 2048 px).
    - `tools.fs.workspaceOnly=true` ogranicza wysyłanie lokalnych ścieżek do workspace, temp/media-store oraz plików zweryfikowanych przez sandbox.
    - `tools.fs.workspaceOnly=false` pozwala `MEDIA:` wysyłać lokalne pliki hosta, które agent już może odczytać, ale tylko dla multimediów oraz bezpiecznych typów dokumentów (obrazy, audio, wideo, PDF i dokumenty Office). Zwykły tekst i pliki przypominające sekrety nadal są blokowane.

    Zobacz [Obrazy](/pl/nodes/images).

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo i kontrola dostępu

<AccordionGroup>
  <Accordion title="Czy bezpiecznie jest wystawić OpenClaw na przychodzące DM?">
    Traktuj przychodzące DM jako niezaufane dane wejściowe. Ustawienia domyślne zaprojektowano tak, aby ograniczać ryzyko:

    - Domyślne zachowanie na kanałach obsługujących DM to **parowanie**:
      - Nieznani nadawcy dostają kod parowania; bot nie przetwarza ich wiadomości.
      - Zatwierdzenie przez: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Oczekujące prośby są ograniczone do **3 na kanał**; sprawdź `openclaw pairing list --channel <channel> [--account <id>]`, jeśli kod nie dotarł.
    - Publiczne otwarcie DM wymaga jawnego opt-in (`dmPolicy: "open"` i lista dozwolonych `"*"`).

    Uruchom `openclaw doctor`, aby wykryć ryzykowne zasady DM.

  </Accordion>

  <Accordion title="Czy prompt injection dotyczy tylko publicznych botów?">
    Nie. Prompt injection dotyczy **niezaufanej treści**, a nie tylko tego, kto może wysyłać DM do bota.
    Jeśli asystent odczytuje treści zewnętrzne (web search/fetch, strony w przeglądarce, e-maile,
    dokumenty, załączniki, wklejone logi), te treści mogą zawierać instrukcje próbujące
    przejąć model. Może się to zdarzyć nawet wtedy, gdy **Ty jesteś jedynym nadawcą**.

    Największe ryzyko występuje wtedy, gdy włączone są narzędzia: model może zostać nakłoniony do
    wyeksfiltrowania kontekstu albo wywołania narzędzi w Twoim imieniu. Ogranicz skutki przez:

    - używanie agenta „reader” tylko do odczytu albo bez narzędzi do podsumowywania niezaufanych treści
    - wyłączanie `web_search` / `web_fetch` / `browser` dla agentów z włączonymi narzędziami
    - traktowanie zdekodowanego tekstu plików/dokumentów również jako niezaufanego: OpenResponses
      `input_file` i ekstrakcja z załączników multimedialnych opakowują wyodrębniony tekst w
      jawne znaczniki granicy treści zewnętrznej zamiast przekazywać surowy tekst pliku
    - sandboxing i ścisłe listy dozwolonych narzędzi

    Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mój bot powinien mieć własny e-mail, konto GitHub albo numer telefonu?">
    Tak, w większości konfiguracji. Izolowanie bota przez oddzielne konta i numery telefonów
    ogranicza skutki, jeśli coś pójdzie nie tak. Ułatwia to również rotację
    poświadczeń albo cofnięcie dostępu bez wpływu na Twoje osobiste konta.

    Zacznij od małego zakresu. Daj dostęp tylko do narzędzi i kont, których rzeczywiście potrzebujesz, i rozszerzaj
    później, jeśli będzie to konieczne.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security), [Parowanie](/pl/channels/pairing).

  </Accordion>

  <Accordion title="Czy mogę dać mu autonomię nad moimi wiadomościami tekstowymi i czy to bezpieczne?">
    **Nie** zalecamy pełnej autonomii nad Twoimi prywatnymi wiadomościami. Najbezpieczniejszy wzorzec to:

    - Utrzymuj DM w **trybie parowania** albo na ścisłej liście dozwolonych.
    - Używaj **oddzielnego numeru lub konta**, jeśli chcesz, by wysyłał wiadomości w Twoim imieniu.
    - Pozwól mu przygotować szkic, a potem **zatwierdź przed wysłaniem**.

    Jeśli chcesz eksperymentować, rób to na dedykowanym koncie i utrzymuj izolację. Zobacz
    [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Czy mogę używać tańszych modeli do zadań osobistego asystenta?">
    Tak, **jeśli** agent służy tylko do czatu, a dane wejściowe są zaufane. Mniejsze warianty
    są bardziej podatne na przejmowanie przez instrukcje, więc unikaj ich dla agentów z włączonymi narzędziami
    albo podczas odczytywania niezaufanych treści. Jeśli musisz użyć mniejszego modelu, zablokuj
    narzędzia i uruchamiaj wewnątrz sandboxa. Zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Uruchomiłem/uruchomiłam /start w Telegram, ale nie dostałem/dostałam kodu parowania">
    Kody parowania są wysyłane **tylko** wtedy, gdy nieznany nadawca napisze do bota i
    włączone jest `dmPolicy: "pairing"`. Samo `/start` nie generuje kodu.

    Sprawdź oczekujące prośby:

    ```bash
    openclaw pairing list telegram
    ```

    Jeśli chcesz natychmiastowego dostępu, dodaj identyfikator nadawcy do listy dozwolonych albo ustaw `dmPolicy: "open"`
    dla tego konta.

  </Accordion>

  <Accordion title="WhatsApp: czy będzie pisał do moich kontaktów? Jak działa parowanie?">
    Nie. Domyślna zasada DM w WhatsApp to **parowanie**. Nieznani nadawcy dostają tylko kod parowania, a ich wiadomość **nie jest przetwarzana**. OpenClaw odpowiada tylko na czaty, które otrzymuje, albo na jawne wysyłki, które samodzielnie uruchomisz.

    Zatwierdzanie parowania:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Wyświetlanie oczekujących próśb:

    ```bash
    openclaw pairing list whatsapp
    ```

    Monit kreatora o numer telefonu: służy do ustawienia Twojej **listy dozwolonych/właściciela**, aby Twoje własne DM były dozwolone. Nie jest używany do automatycznego wysyłania. Jeśli uruchamiasz system na swoim osobistym numerze WhatsApp, użyj tego numeru i włącz `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Polecenia czatu, przerywanie zadań i „nie chce się zatrzymać”

<AccordionGroup>
  <Accordion title="Jak zatrzymać wyświetlanie wewnętrznych komunikatów systemowych na czacie?">
    Większość komunikatów wewnętrznych albo komunikatów narzędzi pojawia się tylko wtedy, gdy dla tej sesji włączone są **verbose**, **trace** albo **reasoning**.

    Rozwiązanie na czacie, na którym to widzisz:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jeśli nadal jest zbyt głośno, sprawdź ustawienia sesji w Control UI i ustaw verbose
    na **inherit**. Potwierdź też, że nie używasz profilu bota z `verboseDefault` ustawionym
    na `on` w konfiguracji.

    Dokumentacja: [Thinking i verbose](/pl/tools/thinking), [Bezpieczeństwo](/pl/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Jak zatrzymać/anulować uruchomione zadanie?">
    Wyślij dowolne z poniższych **jako samodzielną wiadomość** (bez ukośnika):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Są to wyzwalacze przerwania (nie polecenia slash).

    W przypadku procesów w tle (z narzędzia exec) możesz poprosić agenta o uruchomienie:

    ```
    process action:kill sessionId:XXX
    ```

    Omówienie poleceń slash: zobacz [Polecenia slash](/pl/tools/slash-commands).

    Większość poleceń musi zostać wysłana jako **samodzielna** wiadomość zaczynająca się od `/`, ale kilka skrótów (np. `/status`) działa też inline dla nadawców z listy dozwolonych.

  </Accordion>

  <Accordion title='Jak wysłać wiadomość Discord z Telegram? ("Cross-context messaging denied")'>
    OpenClaw domyślnie blokuje wiadomości **między dostawcami**. Jeśli wywołanie narzędzia jest powiązane
    z Telegram, nie wyśle do Discord, chyba że jawnie na to zezwolisz.

    Włącz wiadomości między dostawcami dla agenta:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Po edycji konfiguracji uruchom ponownie gateway.

  </Accordion>

  <Accordion title='Dlaczego wygląda to tak, jakby bot "ignorował" serię szybkich wiadomości?'>
    Tryb kolejki steruje tym, jak nowe wiadomości wchodzą w interakcję z aktualnie wykonywanym zadaniem. Użyj `/queue`, aby zmienić tryby:

    - `steer` - nowe wiadomości przekierowują bieżące zadanie
    - `followup` - wiadomości są wykonywane jedna po drugiej
    - `collect` - wiadomości są grupowane i odpowiedź przychodzi raz (domyślnie)
    - `steer-backlog` - przekierowanie teraz, potem przetwarzanie backlogu
    - `interrupt` - przerwanie bieżącego uruchomienia i rozpoczęcie od nowa

    Możesz dodać opcje takie jak `debounce:2s cap:25 drop:summarize` dla trybów followup.

  </Accordion>
</AccordionGroup>

## Różne

<AccordionGroup>
  <Accordion title='Jaki jest domyślny model dla Anthropic z kluczem API?'>
    W OpenClaw poświadczenia i wybór modelu są oddzielne. Ustawienie `ANTHROPIC_API_KEY` (albo zapisanie klucza API Anthropic w profilach uwierzytelniania) włącza uwierzytelnianie, ale rzeczywisty model domyślny to ten skonfigurowany w `agents.defaults.model.primary` (na przykład `anthropic/claude-sonnet-4-6` albo `anthropic/claude-opus-4-6`). Jeśli widzisz `No credentials found for profile "anthropic:default"`, oznacza to, że Gateway nie mógł znaleźć poświadczeń Anthropic w oczekiwanym `auth-profiles.json` dla aktualnie uruchomionego agenta.
  </Accordion>
</AccordionGroup>

---

Nadal utknąłeś/utknęłaś? Zapytaj na [Discord](https://discord.com/invite/clawd) albo otwórz [dyskusję na GitHub](https://github.com/openclaw/openclaw/discussions).
