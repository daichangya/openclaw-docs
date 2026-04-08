---
read_when:
    - Odpowiadasz na typowe pytania dotyczące konfiguracji, instalacji, onboardingu lub wsparcia środowiska uruchomieniowego
    - Triagujesz problemy zgłaszane przez użytkowników przed głębszym debugowaniem
summary: Często zadawane pytania dotyczące konfiguracji, ustawień i używania OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-08T02:21:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 001b4605966b45b08108606f76ae937ec348c2179b04cf6fb34fef94833705e6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Szybkie odpowiedzi oraz głębsze wskazówki dotyczące rozwiązywania problemów dla rzeczywistych konfiguracji (lokalny development, VPS, wiele agentów, OAuth/klucze API, failover modeli). W przypadku diagnostyki środowiska uruchomieniowego zobacz [Rozwiązywanie problemów](/pl/gateway/troubleshooting). Pełny opis konfiguracji znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Pierwsze 60 sekund, jeśli coś nie działa

1. **Szybki status (pierwsza kontrola)**

   ```bash
   openclaw status
   ```

   Szybkie lokalne podsumowanie: system operacyjny + aktualizacja, dostępność gatewaya/usługi, agenci/sesje, konfiguracja providera + problemy środowiska uruchomieniowego (gdy gateway jest osiągalny).

2. **Raport do wklejenia (bezpieczny do udostępnienia)**

   ```bash
   openclaw status --all
   ```

   Diagnostyka tylko do odczytu z końcówką logu (tokeny zredagowane).

3. **Stan demona + portu**

   ```bash
   openclaw gateway status
   ```

   Pokazuje środowisko uruchomieniowe supervisora względem osiągalności RPC, docelowy adres URL sondy oraz której konfiguracji usługa prawdopodobnie użyła.

4. **Głębokie sondy**

   ```bash
   openclaw status --deep
   ```

   Uruchamia aktywną sondę kondycji gatewaya, w tym sondy kanałów tam, gdzie są obsługiwane
   (wymaga osiągalnego gatewaya). Zobacz [Kondycja](/pl/gateway/health).

5. **Podejrzyj najnowszy log**

   ```bash
   openclaw logs --follow
   ```

   Jeśli RPC nie działa, użyj zamiast tego:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Logi plikowe są oddzielone od logów usługi; zobacz [Logowanie](/pl/logging) i [Rozwiązywanie problemów](/pl/gateway/troubleshooting).

6. **Uruchom Doctor (naprawy)**

   ```bash
   openclaw doctor
   ```

   Naprawia/migruje konfigurację i stan + uruchamia kontrole kondycji. Zobacz [Doctor](/pl/gateway/doctor).

7. **Migawka gatewaya**

   ```bash
   openclaw health --json
   openclaw health --verbose   # pokazuje docelowy URL + ścieżkę konfiguracji przy błędach
   ```

   Prosi uruchomiony gateway o pełną migawkę (tylko WS). Zobacz [Kondycja](/pl/gateway/health).

## Szybki start i konfiguracja przy pierwszym uruchomieniu

<AccordionGroup>
  <Accordion title="Utknąłem, jaki jest najszybszy sposób, żeby się odblokować">
    Użyj lokalnego agenta AI, który potrafi **widzieć Twój komputer**. To jest znacznie skuteczniejsze niż pytanie
    na Discordzie, ponieważ większość przypadków typu „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**,
    których zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia mogą odczytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawić konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki uwierzytelniania). Przekaż im **pełne checkout źródeł**
    przez instalację hackowalną (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, dzięki czemu agent może czytać kod + dokumentację i
    analizować dokładnie tę wersję, której używasz. Zawsze możesz później wrócić do wersji stable,
    uruchamiając instalator ponownie bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    niezbędne polecenia. Dzięki temu zmiany są mniejsze i łatwiejsze do audytu.

    Jeśli odkryjesz prawdziwy błąd lub poprawkę, zgłoś issue na GitHubie albo wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij ich wyniki, gdy prosisz o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybka migawka kondycji gatewaya/agenta + podstawowej konfiguracji.
    - `openclaw models status`: sprawdza uwierzytelnienie providera + dostępność modeli.
    - `openclaw doctor`: sprawdza poprawność i naprawia typowe problemy z konfiguracją/stanem.

    Inne przydatne kontrole w CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś nie działa](#pierwsze-60-sekund-jeśli-coś-nie-działa).
    Dokumentacja instalacji: [Instalacja](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat ciągle jest pomijany. Co oznaczają powody pominięcia?">
    Typowe powody pomijania heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pustą strukturę/nagłówki
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden interwał zadania nie jest jeszcze należny
    - `alerts-disabled`: cała widoczność heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu należności są przesuwane dopiero po zakończeniu
    rzeczywistego uruchomienia heartbeat. Pominięte uruchomienia nie oznaczają zadań jako wykonanych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może także automatycznie zbudować zasoby UI. Po onboardingu zwykle uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (współtwórcy/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # automatycznie instaluje zależności UI przy pierwszym uruchomieniu
    openclaw onboard
    ```

    Jeśli nie masz jeszcze instalacji globalnej, uruchom to przez `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Jak otworzyć dashboard po onboardingu?">
    Kreator otwiera przeglądarkę z czystym (bez tokenu w URL) adresem dashboardu zaraz po onboardingu i wypisuje także link w podsumowaniu. Zachowaj tę kartę otwartą; jeśli się nie uruchomiła, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost vs zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli pojawi się prośba o uwierzytelnienie wspólnym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokenu: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli wspólny sekret nie jest jeszcze skonfigurowany, wygeneruj token poleceniem `openclaw doctor --generate-gateway-token`.

    **Poza localhost:**

    - **Tailscale Serve** (zalecane): pozostaw bindowanie loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają wymagania uwierzytelniania Control UI/WebSocket (bez wklejania wspólnego sekretu, przy założeniu zaufanego hosta gatewaya); interfejsy HTTP API nadal wymagają uwierzytelnienia wspólnym sekretem, chyba że celowo używasz prywatnego ingress `none` albo uwierzytelnienia HTTP przez zaufane proxy.
      Nieudane równoległe próby uwierzytelnienia Serve z tego samego klienta są serializowane, zanim ogranicznik nieudanego uwierzytelnienia je zarejestruje, więc druga błędna próba może już pokazać `retry later`.
    - **Tailnet bind**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (albo skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący wspólny sekret w ustawieniach dashboardu.
    - **Reverse proxy świadome tożsamości**: trzymaj Gateway za zaufanym proxy non-loopback, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie wspólnym sekretem nadal obowiązuje przez tunel; jeśli pojawi się monit, wklej skonfigurowany token lub hasło.

    Zobacz [Dashboard](/web/dashboard) i [Powierzchnie webowe](/web), aby poznać tryby bindowania i szczegóły uwierzytelniania.

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzania exec dla zatwierdzeń na czacie?">
    Sterują różnymi warstwami:

    - `approvals.exec`: przekazuje prompty zatwierdzania do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzania dla zatwierdzeń exec

    Zasada exec hosta nadal pozostaje faktyczną bramką zatwierdzania. Konfiguracja czatu steruje tylko tym,
    gdzie pojawiają się prompty zatwierdzania i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez współdzieloną ścieżkę.
    - Jeśli obsługiwany kanał natywny potrafi bezpiecznie wywnioskować osoby zatwierdzające, OpenClaw teraz automatycznie włącza natywne zatwierdzenia DM-first, gdy `channels.<channel>.execApprovals.enabled` jest nieustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzania, to właśnie natywny interfejs jest główną ścieżką; agent powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną drogą.
    - Używaj `approvals.exec` tylko wtedy, gdy prompty muszą być także przekazywane do innych czatów lub wyraźnie wskazanych pokoi operacyjnych.
    - Używaj `channels.<channel>.execApprovals.target: "channel"` lub `"both"` tylko wtedy, gdy wyraźnie chcesz publikować prompty zatwierdzenia z powrotem do pokoju/wątku źródłowego.
    - Zatwierdzenia pluginów są znowu oddzielne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne zachowują dodatkową obsługę plugin-approval-native.

    W skrócie: przekazywanie służy do routingu, a konfiguracja natywnego klienta służy do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gatewaya.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje, że do użytku osobistego wystarczy **512 MB-1 GB RAM**, **1 rdzeń** i około **500 MB**
    miejsca na dysku, i zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz trochę większy zapas (logi, media, inne usługi), **zalecane jest 2 GB**,
    ale nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a Ty możesz sparować **nodes** na laptopie/telefonie dla
    lokalnego ekranu/kamery/canvas albo wykonywania poleceń. Zobacz [Nodes](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    Krótka odpowiedź: działa, ale spodziewaj się ostrych krawędzi.

    - Używaj systemu **64-bitowego** i utrzymuj Node >= 22.
    - Preferuj **instalację hackowalną (git)**, aby móc oglądać logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je jeden po drugim.
    - Jeśli trafisz na dziwne problemy binarne, zwykle jest to problem **zgodności z ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI wysyła też
    „Wake up, my friend!” automatycznie przy pierwszym hatch. Jeśli widzisz tę linię i **brak odpowiedzi**,
    a liczba tokenów pozostaje 0, agent nigdy się nie uruchomił.

    1. Zrestartuj Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Sprawdź status + uwierzytelnienie:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jeśli nadal się zawiesza, uruchom:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że UI
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść konfigurację na nową maszynę (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie uruchom raz Doctor. To
    zachowuje bota „dokładnie takim samym” (pamięć, historia sesji, uwierzytelnienie i
    stan kanałów), o ile skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i zrestartuj usługę Gateway.

    To zachowuje konfigurację, profile uwierzytelniania, dane uwierzytelniające WhatsApp, sesje i pamięć. Jeśli działasz w
    trybie zdalnym, pamiętaj, że host gatewaya jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz workspace do GitHuba, tworzysz kopię zapasową
    **pamięci + plików bootstrap**, ale **nie** historii sesji ani uwierzytelnienia. To znajduje się
    pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](#gdzie-rzeczy-znajdują-się-na-dysku),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie zobaczyć, co nowego pojawiło się w najnowszej wersji?">
    Sprawdź changelog na GitHubie:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna sekcja z datą
    jest najnowszą wydaną wersją. Wpisy są grupowane na **Highlights**, **Changes** i
    **Fixes** (oraz sekcje docs/inne, jeśli są potrzebne).

  </Accordion>

  <Accordion title="Nie mogę uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity błędnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do allowlisty, a następnie spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz dotrzeć do strony, dokumentacja jest mirrorowana na GitHubie:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **npm dist-tags**, a nie osobne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle wydanie stable trafia najpierw na **beta**, a następnie jawny
    krok promocji przenosi tę samą wersję do `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest to potrzebne. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Jednolinijkowe polecenia instalacji i różnicę między beta a dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to npm dist-tag `beta` (może odpowiadać `latest` po promocji).
    **Dev** to ruchoma głowa `main` (git); po publikacji używa npm dist-tag `dev`.

    Jednolinijkowce (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Kanały developerskie](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze zmiany?">
    Masz dwie opcje:

    1. **Kanał dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródeł.

    2. **Instalacja hackowalna (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To daje Ci lokalne repozytorium, które możesz edytować, a następnie aktualizować przez git.

    Jeśli wolisz ręcznie wykonać czysty clone, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Aktualizacja](/cli/update), [Kanały developerskie](/pl/install/development-channels),
    [Instalacja](/pl/install).

  </Accordion>

  <Accordion title="Jak długo zwykle trwa instalacja i onboarding?">
    Przybliżony przewodnik:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut, zależnie od liczby konfigurowanych kanałów/modeli

    Jeśli się zawiesza, użyj [Instalator utknął](#quick-start-and-first-run-setup)
    i szybkiej pętli debugowania z [Utknąłem](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Instalator utknął? Jak uzyskać więcej informacji zwrotnej?">
    Uruchom instalator ponownie z **szczegółowym wyjściem**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalacja beta z verbose:

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

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest w Twoim PATH.
    - Zamknij i ponownie otwórz PowerShell, a potem ponownie uruchom instalator.

    **2) openclaw is not recognized po instalacji**

    - Twój globalny katalog bin npm nie jest w PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do PATH użytkownika (na Windows nie potrzebujesz sufiksu `\bin`; w większości systemów jest to `%AppData%\npm`).
    - Zamknij i ponownie otwórz PowerShell po aktualizacji PATH.

    Jeśli chcesz możliwie najpłynniejszej konfiguracji na Windows, używaj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Wyjście exec na Windows pokazuje zniekształcony tekst chiński - co powinienem zrobić?">
    Zwykle oznacza to niedopasowanie strony kodowej konsoli w natywnych powłokach Windows.

    Objawy:

    - wyjście `system.run`/`exec` renderuje chiński jako mojibake
    - to samo polecenie wygląda poprawnie w innym profilu terminala

    Szybkie obejście w PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Następnie zrestartuj Gateway i ponów próbę polecenia:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal odtwarzasz ten problem w najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj **instalacji hackowalnej (git)**, aby mieć lokalnie pełne źródła i dokumentację, a następnie zapytaj
    swojego bota (albo Claude/Codex) _z tego folderu_, aby mógł czytać repozytorium i odpowiedzieć precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Instalacja](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linuxie?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linuksa, a następnie uruchom onboarding.

    - Szybka ścieżka Linux + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Każdy VPS z Linuksem działa. Zainstaluj na serwerze, a następnie użyj SSH/Tailscale, aby połączyć się z Gatewayem.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Gateway remote](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji w chmurze/VPS?">
    Mamy **hub hostingowy** z najczęściej używanymi providerami. Wybierz jeden i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy providerzy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (albo Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz sparować **nodes** (Mac/iOS/Android/headless) z tym chmurowym Gatewayem, aby uzyskać dostęp do
    lokalnego ekranu/kamery/canvas lub uruchamiać polecenia na swoim laptopie, jednocześnie trzymając
    Gateway w chmurze.

    Hub: [Platformy](/pl/platforms). Dostęp zdalny: [Gateway remote](/pl/gateway/remote).
    Nodes: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, żeby sam się zaktualizował?">
    Krótka odpowiedź: **to możliwe, ale niezalecane**. Proces aktualizacji może zrestartować
    Gateway (co zrywa aktywną sesję), może wymagać czystego checkoutu git i
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

    Dokumentacja: [Aktualizacja](/cli/update), [Aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** przeprowadza Cię przez:

    - **Konfigurację modelu/uwierzytelniania** (OAuth providera, klucze API, Anthropic setup-token oraz lokalne opcje modeli, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gatewaya** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz bundlowane pluginy kanałów, takie jak QQ Bot)
    - **Instalację demona** (LaunchAgent na macOS; systemd user unit na Linux/WSL2)
    - **Kontrole kondycji** oraz wybór **Skills**

    Ostrzega też, jeśli skonfigurowany model jest nieznany albo brakuje dla niego uwierzytelnienia.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude lub OpenAI, żeby to uruchomić?">
    Nie. Możesz uruchamiać OpenClaw za pomocą **kluczy API** (Anthropic/OpenAI/inni) albo z
    **wyłącznie lokalnymi modelami**, aby Twoje dane pozostawały na urządzeniu. Subskrypcje (Claude
    Pro/Max lub OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania tych providerów.

    W praktyce podział dla Anthropic w OpenClaw wygląda tak:

    - **Klucz API Anthropic**: normalne rozliczanie API Anthropic
    - **Uwierzytelnienie Claude CLI / subskrypcja Claude w OpenClaw**: pracownicy Anthropic
      powiedzieli nam, że to użycie jest ponownie dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długowiecznych hostów gatewaya klucze API Anthropic pozostają bardziej
    przewidywalnym rozwiązaniem. OpenAI Codex OAuth jest wyraźnie wspierany dla zewnętrznych
    narzędzi takich jak OpenClaw.

    OpenClaw obsługuje także inne hostowane opcje subskrypcyjne, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** i
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [Modele GLM](/pl/providers/glm),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc
    OpenClaw traktuje uwierzytelnianie subskrypcją Claude i użycie `claude -p` jako usankcjonowane
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnego rozwiązania po stronie serwera, użyj zamiast tego klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy wspieracie uwierzytelnianie subskrypcją Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic powiedzieli nam, że to użycie jest znowu dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI oraz użycie `claude -p` jako usankcjonowane dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Anthropic setup-token jest nadal dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla środowisk produkcyjnych lub obciążeń wieloużytkownikowych uwierzytelnianie kluczem API Anthropic pozostaje
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz inne hostowane opcje
    subskrypcyjne w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele
    GLM](/pl/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
To oznacza, że Twój **limit/quota Anthropic** został wyczerpany dla bieżącego okna. Jeśli
używasz **Claude CLI**, poczekaj, aż okno się zresetuje, albo podnieś plan. Jeśli
używasz **klucza API Anthropic**, sprawdź konsolę Anthropic
pod kątem użycia/rozliczeń i w razie potrzeby podnieś limity.

    Jeśli komunikat brzmi dokładnie:
    `Extra usage is required for long context requests`, to żądanie próbuje użyć
    wersji beta 1M kontekstu Anthropic (`context1m: true`). To działa tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania długiego kontekstu (rozliczenie kluczem API lub
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model fallback**, aby OpenClaw mógł nadal odpowiadać, gdy provider jest objęty rate limitingiem.
    Zobacz [Modele](/cli/models), [OAuth](/pl/concepts/oauth) i
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest wspierany?">
    Tak. OpenClaw ma bundlowanego providera **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki środowiskowe AWS, OpenClaw może automatycznie wykryć katalog streaming/text Bedrock i scalić go jako niejawnego providera `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis providera. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Providerzy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, proxy zgodne z OpenAI przed Bedrock nadal jest poprawną opcją.
  </Accordion>

  <Accordion title="Jak działa uwierzytelnianie Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Onboarding może uruchomić przepływ OAuth i ustawi domyślny model na `openai-codex/gpt-5.4`, gdy będzie to właściwe. Zobacz [Providerzy modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego ChatGPT GPT-5.4 nie odblokowuje openai/gpt-5.4 w OpenClaw?">
    OpenClaw traktuje te dwie ścieżki osobno:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = bezpośrednie API platformy OpenAI

    W OpenClaw logowanie ChatGPT/Codex jest podłączone do ścieżki `openai-codex/*`,
    a nie bezpośredniej ścieżki `openai/*`. Jeśli chcesz w
    OpenClaw korzystać z bezpośredniej ścieżki API, ustaw `OPENAI_API_KEY` (lub równoważną konfigurację providera OpenAI).
    Jeśli chcesz logowania ChatGPT/Codex w OpenClaw, używaj `openai-codex/*`.

  </Accordion>

  <Accordion title="Dlaczego limity Codex OAuth mogą różnić się od ChatGPT web?">
    `openai-codex/*` używa ścieżki OAuth Codex, a jego użyteczne okna quota są
    zarządzane przez OpenAI i zależne od planu. W praktyce limity te mogą różnić się od
    doświadczenia w witrynie/aplikacji ChatGPT, nawet gdy oba są powiązane z tym samym kontem.

    OpenClaw może pokazać aktualnie widoczne okna użycia/quota providera w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu do API. Jeśli chcesz bezpośredniej ścieżki rozliczeń/limitów platformy OpenAI,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy wspieracie uwierzytelnianie subskrypcją OpenAI (Codex OAuth)?">
    Tak. OpenClaw w pełni wspiera **subskrypcyjny OAuth OpenAI Code (Codex)**.
    OpenAI wyraźnie pozwala na używanie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Onboarding może przeprowadzić ten przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Providerzy modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu uwierzytelniania pluginu**, a nie client id ani secret w `openclaw.json`.

    Kroki:

    1. Zainstaluj lokalnie Gemini CLI, aby `gemini` było w `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania kończą się błędem, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gatewaya

    To zapisuje tokeny OAuth w profilach uwierzytelniania na hoście gatewaya. Szczegóły: [Providerzy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy lokalny model nadaje się do zwykłych rozmów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnego bezpieczeństwa; małe karty obcinają kontekst i osłabiają ochronę. Jeśli musisz, uruchom lokalnie **największą** kompilację modelu, jaką możesz (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection — zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch do hostowanych modeli w określonym regionie?">
    Wybieraj endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymieniać obok nich Anthropic/OpenAI, używając `models.mode: "merge"`, aby fallbacki pozostały dostępne przy jednoczesnym poszanowaniu wybranego providera regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, żeby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linuxie (Windows przez WSL2). Mac mini jest opcjonalny — niektórzy
    kupują go jako host zawsze włączony, ale mały VPS, serwer domowy lub urządzenie klasy Raspberry Pi też się nada.

    Maca potrzebujesz tylko do **narzędzi wyłącznie dla macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) — serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linuxie lub gdzie indziej. Jeśli chcesz innych narzędzi tylko dla macOS, uruchom Gateway na Macu albo sparuj node macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes), [Zdalny tryb Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia z macOS** zalogowanego do Wiadomości. **Nie** musi to być Mac mini —
    każdy Mac się nada. Dla iMessage **użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) — serwer BlueBubbles działa na macOS, podczas gdy Gateway może działać na Linuxie lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchamiaj Gateway na Linuxie/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym do Wiadomości.
    - Uruchamiaj wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes),
    [Zdalny tryb Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **node** (urządzenie towarzyszące). Nodes nie uruchamiają Gatewaya — zapewniają dodatkowe
    możliwości, takie jak screen/camera/canvas i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS lub host node i paruje się z Gatewayem.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby go zobaczyć.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy środowiska uruchomieniowego, szczególnie z WhatsApp i Telegram.
    Dla stabilnych gatewayów używaj **Node**.

    Jeśli mimo to chcesz eksperymentować z Bun, rób to na nieprodukcyjnym gatewayu
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisuje się do allowFrom?">
    `channels.telegram.allowFrom` to **identyfikator użytkownika Telegram osoby wysyłającej** (liczbowy). To nie jest nazwa użytkownika bota.

    Onboarding przyjmuje wejście `@username` i rozwiązuje je do identyfikatora liczbowego, ale autoryzacja OpenClaw używa wyłącznie identyfikatorów liczbowych.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, a następnie uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, a następnie wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrznie (mniejsza prywatność):

    - Wyślij DM do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **routing wielu agentów**. Powiąż DM WhatsApp każdego nadawcy (**DM**) (peer `kind: "direct"`, nadawca E.164 jak `+15551234567`) z innym `agentId`, aby każda osoba miała własny workspace i magazyn sesji. Odpowiedzi nadal będą pochodzić z **tego samego konta WhatsApp**, a kontrola dostępu do DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla danego konta WhatsApp. Zobacz [Routing wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta „fast chat” i agenta „Opus do kodowania”?'>
    Tak. Użyj routingu wielu agentów: daj każdemu agentowi własny domyślny model, a następnie powiąż trasy wejściowe (konto providera albo określonych peerów) z każdym agentem. Przykładowa konfiguracja znajduje się w [Routing wielu agentów](/pl/concepts/multi-agent). Zobacz także [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linuxie?">
    Tak. Homebrew wspiera Linuksa (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (lub Twój prefiks brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach bez logowania.
    Najnowsze kompilacje dodają też na początku typowe katalogi user bin w usługach systemd na Linuxie (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i honorują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między instalacją hackowalną git a npm install">
    - **Instalacja hackowalna (git):** pełny checkout źródeł, możliwość edycji, najlepsza dla współtwórców.
      Budujesz lokalnie i możesz poprawiać kod/dokumentację.
    - **npm install:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z npm dist-tags.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizacja](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacją npm i git?">
    Tak. Zainstaluj drugi wariant, a następnie uruchom Doctor, aby usługa gatewaya wskazywała nowy entrypoint.
    To **nie usuwa Twoich danych** — zmienia tylko instalację kodu OpenClaw. Twój stan
    (`~/.openclaw`) i workspace (`~/.openclaw/workspace`) pozostają nietknięte.

    Z npm na git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Z git na npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor wykrywa niedopasowanie entrypointu usługi gatewaya i proponuje przepisanie konfiguracji usługi tak, aby pasowała do bieżącej instalacji (w automatyzacji użyj `--repair`).

    Wskazówki dotyczące kopii zapasowych: zobacz [Strategia kopii zapasowych](#gdzie-rzeczy-znajdują-się-na-dysku).

  </Accordion>

  <Accordion title="Czy powinienem uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    najmniejszego tarcia i akceptujesz uśpienia/restarty, uruchamiaj lokalnie.

    **Laptop (lokalny Gateway)**

    - **Plusy:** brak kosztów serwera, bezpośredni dostęp do lokalnych plików, widoczne okno przeglądarki.
    - **Minusy:** uśpienie/zaniki sieci = rozłączenia, aktualizacje/restarty systemu przerywają, maszyna musi pozostać wybudzona.

    **VPS / chmura**

    - **Plusy:** zawsze włączony, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiej utrzymać działanie.
    - **Minusy:** często działa headless (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają dobrze z VPS. Jedyny realny kompromis to **przeglądarka headless** vs widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecany domyślny wybór:** VPS, jeśli wcześniej miałeś rozłączenia gatewaya. Lokalnie jest świetnie, gdy aktywnie używasz Maca i chcesz lokalnego dostępu do plików albo automatyzacji UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Nie jest wymagane, ale **zalecane dla niezawodności i izolacji**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw przez uśpienia/restarty, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/desktop:** całkowicie OK do testów i aktywnego użycia, ale spodziewaj się przerw, gdy maszyna śpi lub się aktualizuje.

    Jeśli chcesz mieć to, co najlepsze z obu światów, trzymaj Gateway na dedykowanym hoście, a laptop sparuj jako **node** dla lokalnych narzędzi screen/camera/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki bezpieczeństwa znajdziesz w [Bezpieczeństwie](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i jaki system operacyjny jest zalecany?">
    OpenClaw jest lekki. Dla podstawowego Gatewaya + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM, ~500 MB dysku.
    - **Zalecane:** 1-2 vCPU, 2 GB RAM lub więcej dla zapasu (logi, media, wiele kanałów). Narzędzia node i automatyzacja przeglądarki mogą być zasobożerne.

    System operacyjny: używaj **Ubuntu LTS** (lub dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji Linux jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć dość
    RAM dla Gatewaya i wszystkich włączonych kanałów.

    Wskazówki bazowe:

    - **Absolutne minimum:** 1 vCPU, 1 GB RAM.
    - **Zalecane:** 2 GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki albo narzędzia multimedialne.
    - **System operacyjny:** Ubuntu LTS albo inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i ma najlepszą
    zgodność z narzędziami. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [VM z macOS](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Czym jest OpenClaw?

<AccordionGroup>
  <Accordion title="Czym jest OpenClaw, w jednym akapicie?">
    OpenClaw to osobisty asystent AI uruchamiany na własnych urządzeniach. Odpowiada na powierzchniach wiadomości, których już używasz (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat oraz bundlowane pluginy kanałów takie jak QQ Bot) i potrafi też obsługiwać głos + live Canvas na wspieranych platformach. **Gateway** to zawsze włączona płaszczyzna sterowania; asystent jest produktem.
  </Accordion>

  <Accordion title="Propozycja wartości">
    OpenClaw nie jest „po prostu wrapperem na Claude”. To **lokalna płaszczyzna sterowania** pozwalająca uruchamiać
    zdolnego asystenta na **własnym sprzęcie**, dostępnego z aplikacji czatowych, których już używasz, z
    utrwalonymi sesjami, pamięcią i narzędziami — bez oddawania kontroli nad swoimi przepływami pracy hostowanemu
    SaaS.

    Najważniejsze elementy:

    - **Twoje urządzenia, Twoje dane:** uruchamiaj Gateway tam, gdzie chcesz (Mac, Linux, VPS), i trzymaj
      workspace + historię sesji lokalnie.
    - **Prawdziwe kanały, nie webowy sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus mobilny głos i Canvas na wspieranych platformach.
    - **Niezależność od modelu:** używaj Anthropic, OpenAI, MiniMax, OpenRouter itp., z routingiem
      i failoverem per agent.
    - **Opcja wyłącznie lokalna:** uruchamiaj modele lokalne, aby **wszystkie dane mogły pozostać na Twoim urządzeniu**, jeśli chcesz.
    - **Routing wielu agentów:** oddzielni agenci dla kanału, konta lub zadania, każdy z własnym
      workspace i ustawieniami domyślnymi.
    - **Open source i hackowalność:** sprawdzaj, rozszerzaj i self-hostuj bez vendor lock-in.

    Dokumentacja: [Gateway](/pl/gateway), [Kanały](/pl/channels), [Wieloagentowość](/pl/concepts/multi-agent),
    [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Właśnie to skonfigurowałem - co powinienem zrobić najpierw?">
    Dobre pierwsze projekty:

    - Zbuduj stronę internetową (WordPress, Shopify albo prostą stronę statyczną).
    - Stwórz prototyp aplikacji mobilnej (zarys, ekrany, plan API).
    - Zorganizuj pliki i foldery (sprzątanie, nazewnictwo, tagowanie).
    - Podłącz Gmail i zautomatyzuj podsumowania albo follow-upy.

    Potrafi obsługiwać duże zadania, ale działa najlepiej, gdy podzielisz je na etapy i
    użyjesz sub agentów do pracy równoległej.

  </Accordion>

  <Accordion title="Jakie jest pięć najważniejszych codziennych zastosowań OpenClaw?">
    Codzienne korzyści zwykle wyglądają tak:

    - **Osobiste briefingi:** podsumowania skrzynki, kalendarza i interesujących Cię wiadomości.
    - **Badania i szkice:** szybkie badania, podsumowania i pierwsze szkice e-maili lub dokumentów.
    - **Przypomnienia i follow-upy:** szturchnięcia i checklisty napędzane cronem lub heartbeat.
    - **Automatyzacja przeglądarki:** wypełnianie formularzy, zbieranie danych i powtarzanie zadań webowych.
    - **Koordynacja między urządzeniami:** wyślij zadanie z telefonu, pozwól Gatewayowi wykonać je na serwerze i odbierz wynik z powrotem na czacie.

  </Accordion>

  <Accordion title="Czy OpenClaw może pomóc w lead gen, outreach, reklamach i blogach dla SaaS?">
    Tak, w zakresie **badań, kwalifikacji i szkicowania**. Potrafi skanować strony, budować krótkie listy,
    podsumowywać potencjalnych klientów i pisać szkice outreachu albo tekstów reklamowych.

    Przy **outreachu lub uruchamianiu reklam** trzymaj człowieka w pętli. Unikaj spamu, przestrzegaj lokalnych przepisów i
    zasad platform, i sprawdzaj wszystko przed wysłaniem. Najbezpieczniejszy wzorzec to:
    OpenClaw tworzy szkic, a Ty go zatwierdzasz.

    Dokumentacja: [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są zalety względem Claude Code przy development webowym?">
    OpenClaw jest **osobistym asystentem** i warstwą koordynacji, a nie zamiennikiem IDE. Używaj
    Claude Code lub Codex do najszybszej bezpośredniej pętli kodowania w repozytorium. Używaj OpenClaw, gdy
    chcesz trwałej pamięci, dostępu między urządzeniami i orkiestracji narzędzi.

    Zalety:

    - **Trwała pamięć + workspace** między sesjami
    - **Dostęp wieloplatformowy** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkiestracja narzędzi** (przeglądarka, pliki, harmonogramy, hooki)
    - **Gateway zawsze włączony** (uruchamiaj na VPS i korzystaj skądkolwiek)
    - **Nodes** do lokalnej przeglądarki/ekranu/kamery/exec

    Prezentacja: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills i automatyzacja

<AccordionGroup>
  <Accordion title="Jak dostosować Skills bez brudzenia repozytorium?">
    Używaj zarządzanych override'ów zamiast edytować kopię w repozytorium. Umieść zmiany w `~/.openclaw/skills/<name>/SKILL.md` (albo dodaj folder przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json`). Priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundlowane → `skills.load.extraDirs`, więc zarządzane override'y nadal wygrywają z bundlowanymi Skills bez dotykania gita. Jeśli potrzebujesz, aby skill był zainstalowany globalnie, ale widoczny tylko dla niektórych agentów, trzymaj współdzieloną kopię w `~/.openclaw/skills` i kontroluj widoczność przez `agents.defaults.skills` i `agents.list[].skills`. Tylko zmiany warte upstreamu powinny trafiać do repozytorium i wychodzić jako PR.
  </Accordion>

  <Accordion title="Czy mogę ładować Skills z własnego folderu?">
    Tak. Dodaj dodatkowe katalogi przez `skills.load.extraDirs` w `~/.openclaw/openclaw.json` (najniższy priorytet). Domyślny priorytet to `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundlowane → `skills.load.extraDirs`. `clawhub` domyślnie instaluje do `./skills`, co OpenClaw traktuje jako `<workspace>/skills` przy następnej sesji. Jeśli skill ma być widoczny tylko dla określonych agentów, połącz to z `agents.defaults.skills` albo `agents.list[].skills`.
  </Accordion>

  <Accordion title="Jak mogę używać różnych modeli do różnych zadań?">
    Obecnie obsługiwane wzorce to:

    - **Zadania cron**: izolowane zadania mogą ustawiać override `model` per zadanie.
    - **Sub-agenci**: kieruj zadania do osobnych agentów z różnymi modelami domyślnymi.
    - **Przełączanie na żądanie**: użyj `/model`, aby w każdej chwili przełączyć model bieżącej sesji.

    Zobacz [Zadania cron](/pl/automation/cron-jobs), [Routing wielu agentów](/pl/concepts/multi-agent) i [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot zawiesza się podczas ciężkiej pracy. Jak to odciążyć?">
    Używaj **sub agentów** do długich lub równoległych zadań. Sub-agenci działają we własnej sesji,
    zwracają podsumowanie i utrzymują responsywność głównego czatu.

    Poproś bota o „spawn a sub-agent for this task” albo użyj `/subagents`.
    Użyj `/status` na czacie, aby zobaczyć, co Gateway robi teraz (i czy jest zajęty).

    Wskazówka dotycząca tokenów: długie zadania i sub-agenci oba zużywają tokeny. Jeśli koszty są problemem, ustaw
    tańszy model dla sub agentów przez `agents.defaults.subagents.model`.

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Jak działają sesje subagenta powiązane z wątkiem na Discordzie?">
    Używaj powiązań wątków. Możesz powiązać wątek Discord z celem subagenta albo sesji, aby kolejne wiadomości w tym wątku pozostawały przy tej powiązanej sesji.

    Podstawowy przepływ:

    - Uruchom przez `sessions_spawn` z `thread: true` (oraz opcjonalnie `mode: "session"` dla trwałego dalszego ciągu).
    - Albo ręcznie powiąż przez `/focus <target>`.
    - Użyj `/agents`, aby sprawdzić stan powiązania.
    - Użyj `/session idle <duration|off>` i `/session max-age <duration|off>`, aby kontrolować automatyczne odwiązanie.
    - Użyj `/unfocus`, aby odłączyć wątek.

    Wymagana konfiguracja:

    - Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Nadpisania dla Discorda: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatyczne powiązanie przy spawn: ustaw `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Discord](/pl/channels/discord), [Opis konfiguracji](/pl/gateway/configuration-reference), [Slash commands](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent zakończył pracę, ale aktualizacja ukończenia trafiła w złe miejsce albo nigdy się nie opublikowała. Co sprawdzić?">
    Najpierw sprawdź rozwiązaną trasę requestera:

    - Dostarczanie completion-mode subagenta preferuje każdy powiązany wątek lub trasę rozmowy, jeśli istnieje.
    - Jeśli źródło ukończenia zawiera tylko kanał, OpenClaw wraca do zapisanej trasy sesji requestera (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal mogło się udać.
    - Jeśli nie istnieje ani powiązana trasa, ani użyteczna zapisana trasa, bezpośrednie dostarczenie może się nie udać i wynik wraca do kolejkowanego dostarczania sesji zamiast natychmiastowej publikacji na czacie.
    - Nieprawidłowe albo przestarzałe cele nadal mogą wymusić fallback do kolejki albo ostateczną porażkę dostarczenia.
    - Jeśli ostatnia widoczna odpowiedź asystenta dziecka to dokładnie cichy token `NO_REPLY` / `no_reply` albo dokładnie `ANNOUNCE_SKIP`, OpenClaw celowo tłumi ogłoszenie zamiast publikować przestarzały wcześniejszy postęp.
    - Jeśli dziecko przekroczyło timeout po samych wywołaniach narzędzi, ogłoszenie może zwinąć to do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzi.

    Debugowanie:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Sub-agenci](/pl/tools/subagents), [Zadania w tle](/pl/automation/tasks), [Narzędzie sesji](/pl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron lub przypomnienia się nie uruchamiają. Co sprawdzić?">
    Cron działa wewnątrz procesu Gateway. Jeśli Gateway nie działa bez przerwy,
    zaplanowane zadania nie będą uruchamiane.

    Lista kontrolna:

    - Potwierdź, że cron jest włączony (`cron.enabled`) i `OPENCLAW_SKIP_CRON` nie jest ustawione.
    - Sprawdź, czy Gateway działa 24/7 (bez uśpień/restartów).
    - Zweryfikuj ustawienia strefy czasowej dla zadania (`--tz` vs strefa czasowa hosta).

    Debugowanie:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentacja: [Zadania cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Cron się uruchomił, ale nic nie zostało wysłane na kanał. Dlaczego?">
    Najpierw sprawdź tryb dostarczania:

    - `--no-deliver` / `delivery.mode: "none"` oznacza, że nie należy oczekiwać zewnętrznej wiadomości.
    - Brakujący albo nieprawidłowy cel ogłoszenia (`channel` / `to`) oznacza, że runner pominął dostarczanie wychodzące.
    - Błędy uwierzytelniania kanału (`unauthorized`, `Forbidden`) oznaczają, że runner próbował dostarczyć wiadomość, ale poświadczenia to zablokowały.
    - Cichy izolowany wynik (`NO_REPLY` / `no_reply` tylko) jest traktowany jako celowo nienadający się do dostarczenia, więc runner tłumi też kolejkowany fallback dostarczania.

    W przypadku izolowanych zadań cron to runner zarządza końcowym dostarczeniem. Od agenta oczekuje się
    zwrócenia zwykłego tekstowego podsumowania, które runner wyśle. `--no-deliver` zatrzymuje
    ten wynik wewnętrznie; nie pozwala agentowi wysłać go bezpośrednio za pomocą
    narzędzia message.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania cron](/pl/automation/cron-jobs), [Zadania w tle](/pl/automation/tasks).

  </Accordion>

  <Accordion title="Dlaczego izolowane uruchomienie cron przełączyło modele albo raz ponowiło próbę?">
    Zwykle jest to ścieżka przełączania żywego modelu, a nie podwójne planowanie.

    Izolowany cron może utrwalić przekazanie modelu w trakcie działania i ponowić próbę, gdy aktywne
    uruchomienie rzuci `LiveSessionModelSwitchError`. Ponowienie zachowuje przełączonego
    providera/model, a jeśli przełączenie zawierało nowe override profilu uwierzytelniania, cron
    utrwala to również przed ponowną próbą.

    Powiązane reguły wyboru:

    - Override modelu hooka Gmail wygrywa jako pierwszy, gdy ma zastosowanie.
    - Następnie per-zadanie `model`.
    - Potem każdy zapisany override modelu sesji cron.
    - Następnie normalny wybór modelu domyślnego/agenta.

    Pętla ponawiania jest ograniczona. Po pierwszej próbie plus 2 ponowieniach przełączenia,
    cron przerywa zamiast zapętlać się bez końca.

    Debugowanie:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentacja: [Zadania cron](/pl/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Jak zainstalować Skills na Linuxie?">
    Używaj natywnych poleceń `openclaw skills` albo wrzucaj Skills do workspace. Interfejs Skills UI dla macOS nie jest dostępny na Linuxie.
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

    Natywne `openclaw skills install` zapisuje do aktywnego katalogu `skills/`
    w workspace. Osobne CLI `clawhub` instaluj tylko wtedy, gdy chcesz publikować albo
    synchronizować własne Skills. W przypadku instalacji współdzielonych między agentami umieść skill pod
    `~/.openclaw/skills` i użyj `agents.defaults.skills` albo
    `agents.list[].skills`, jeśli chcesz ograniczyć, którzy agenci go widzą.

  </Accordion>

  <Accordion title="Czy OpenClaw może uruchamiać zadania według harmonogramu albo stale w tle?">
    Tak. Użyj harmonogramu Gateway:

    - **Zadania cron** dla zadań zaplanowanych lub cyklicznych (utrwalane po restartach).
    - **Heartbeat** dla okresowych kontroli „głównej sesji”.
    - **Zadania izolowane** dla autonomicznych agentów, które publikują podsumowania albo dostarczają je do czatów.

    Dokumentacja: [Zadania cron](/pl/automation/cron-jobs), [Automatyzacja i zadania](/pl/automation),
    [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Czy mogę uruchamiać Skills Apple tylko dla macOS z Linuksa?">
    Nie bezpośrednio. Skills dla macOS są ograniczane przez `metadata.openclaw.os` oraz wymagane binarki, a Skills pojawiają się w promcie systemowym tylko wtedy, gdy kwalifikują się na **hoście Gatewaya**. Na Linuxie Skills tylko dla `darwin` (takie jak `apple-notes`, `apple-reminders`, `things-mac`) nie będą ładowane, chyba że nadpiszesz bramkowanie.

    Masz trzy wspierane wzorce:

    **Opcja A - uruchom Gateway na Macu (najprościej).**
    Uruchamiaj Gateway tam, gdzie istnieją binarki macOS, a następnie łącz się z Linuksa w [trybie zdalnym](#gateway-ports-already-running-and-remote-mode) lub przez Tailscale. Skills ładują się normalnie, ponieważ host Gatewaya to macOS.

    **Opcja B - użyj node macOS (bez SSH).**
    Uruchamiaj Gateway na Linuxie, sparuj node macOS (aplikacja w pasku menu) i ustaw **Node Run Commands** na „Always Ask” lub „Always Allow” na Macu. OpenClaw może traktować Skills tylko dla macOS jako kwalifikujące się, gdy wymagane binarki istnieją na node. Agent uruchamia te Skills przez narzędzie `nodes`. Jeśli wybierzesz „Always Ask”, zatwierdzenie „Always Allow” w monicie doda to polecenie do allowlisty.

    **Opcja C - proxy binarek macOS przez SSH (zaawansowane).**
    Trzymaj Gateway na Linuxie, ale spraw, aby wymagane binarki CLI były rozwiązywane do wrapperów SSH uruchamianych na Macu. Następnie nadpisz skill tak, aby dopuszczał Linux, dzięki czemu pozostanie kwalifikujący się.

    1. Utwórz wrapper SSH dla binarki (przykład: `memo` dla Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Umieść wrapper w `PATH` na hoście Linux (na przykład `~/bin/memo`).
    3. Nadpisz metadane skilla (workspace albo `~/.openclaw/skills`), aby dopuścić Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Rozpocznij nową sesję, aby odświeżyć migawkę Skills.

  </Accordion>

  <Accordion title="Czy macie integrację z Notion albo HeyGen?">
    Na dziś nie jest wbudowana.

    Opcje:

    - **Własny skill / plugin:** najlepszy dla niezawodnego dostępu do API (zarówno Notion, jak i HeyGen mają API).
    - **Automatyzacja przeglądarki:** działa bez kodu, ale jest wolniejsza i bardziej krucha.

    Jeśli chcesz utrzymywać kontekst per klient (przepływy agencyjne), prosty wzorzec jest taki:

    - Jedna strona Notion na klienta (kontekst + preferencje + aktywna praca).
    - Poproś agenta, aby pobrał tę stronę na początku sesji.

    Jeśli chcesz natywnej integracji, otwórz feature request albo zbuduj skill
    celujący w te API.

    Instalacja Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne instalacje trafiają do aktywnego katalogu `skills/` w workspace. Dla współdzielonych Skills między agentami umieść je w `~/.openclaw/skills/<name>/SKILL.md`. Jeśli tylko niektórzy agenci mają widzieć współdzieloną instalację, skonfiguruj `agents.defaults.skills` albo `agents.list[].skills`. Niektóre Skills oczekują binarek instalowanych przez Homebrew; na Linuxie oznacza to Linuxbrew (zobacz wpis FAQ o Homebrew na Linuxie powyżej). Zobacz [Skills](/pl/tools/skills), [Konfiguracja Skills](/pl/tools/skills-config) i [ClawHub](/pl/tools/clawhub).

  </Accordion>

  <Accordion title="Jak używać istniejącego zalogowanego Chrome z OpenClaw?">
    Użyj wbudowanego profilu przeglądarki `user`, który dołącza się przez Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jeśli chcesz własną nazwę, utwórz jawny profil MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ta ścieżka jest lokalna dla hosta. Jeśli Gateway działa gdzie indziej, uruchom hosta node na maszynie z przeglądarką albo użyj zdalnego CDP.

    Obecne ograniczenia `existing-session` / `user`:

    - akcje są oparte na refach, a nie selektorach CSS
    - uploady wymagają `ref` / `inputRef` i obecnie obsługują tylko jeden plik naraz
    - `responsebody`, eksport PDF, przechwytywanie pobrań i akcje wsadowe nadal wymagają zarządzanej przeglądarki albo surowego profilu CDP

  </Accordion>
</AccordionGroup>

## Sandbox i pamięć

<AccordionGroup>
  <Accordion title="Czy istnieje osobna dokumentacja sandboxingu?">
    Tak. Zobacz [Sandboxing](/pl/gateway/sandboxing). Dla konfiguracji specyficznej dla Dockera (pełny gateway w Dockerze albo obrazy sandbox) zobacz [Docker](/pl/install/docker).
  </Accordion>

  <Accordion title="Docker wydaje się ograniczony - jak włączyć pełne funkcje?">
    Domyślny obraz stawia bezpieczeństwo na pierwszym miejscu i działa jako użytkownik `node`, więc nie
    zawiera pakietów systemowych, Homebrew ani bundlowanych przeglądarek. Dla pełniejszej konfiguracji:

    - Utrwal `/home/node` za pomocą `OPENCLAW_HOME_VOLUME`, aby cache przetrwały.
    - Wypiecz zależności systemowe do obrazu za pomocą `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Zainstaluj przeglądarki Playwright przez bundlowane CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Ustaw `PLAYWRIGHT_BROWSERS_PATH` i upewnij się, że ta ścieżka jest utrwalana.

    Dokumentacja: [Docker](/pl/install/docker), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy mogę zachować prywatne DM-y, a grupy uczynić publicznymi/sandboxowanymi jednym agentem?">
    Tak — jeśli Twój ruch prywatny to **DM-y**, a publiczny to **grupy**.

    Użyj `agents.defaults.sandbox.mode: "non-main"`, aby sesje grupowe/kanałowe (klucze non-main) działały w Dockerze, podczas gdy główna sesja DM pozostaje na hoście. Następnie ogranicz dostępne narzędzia w sandboxowanych sesjach przez `tools.sandbox.tools`.

    Przewodnik konfiguracji + przykładowa konfiguracja: [Grupy: prywatne DM-y + publiczne grupy](/pl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Kluczowy opis konfiguracji: [Konfiguracja Gatewaya](/pl/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Jak podłączyć folder hosta do sandboxa?">
    Ustaw `agents.defaults.sandbox.docker.binds` na `["host:path:mode"]` (np. `"/home/user/src:/src:ro"`). Globalne + per-agent bindy scalają się; bindy per-agent są ignorowane, gdy `scope: "shared"`. Używaj `:ro` dla wszystkiego, co wrażliwe, i pamiętaj, że bindy omijają granice systemu plików sandboxa.

    OpenClaw sprawdza źródła bind względem zarówno znormalizowanej ścieżki, jak i ścieżki kanonicznej rozwiązywanej przez najgłębszego istniejącego przodka. To oznacza, że ucieczki przez symlink-parent nadal kończą się bezpiecznym zamknięciem, nawet gdy ostatni segment ścieżki jeszcze nie istnieje, a kontrole dozwolonego root nadal obowiązują po rozwiązaniu symlinków.

    Zobacz [Sandboxing](/pl/gateway/sandboxing#custom-bind-mounts) i [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check), aby poznać przykłady i uwagi dotyczące bezpieczeństwa.

  </Accordion>

  <Accordion title="Jak działa pamięć?">
    Pamięć OpenClaw to po prostu pliki Markdown w workspace agenta:

    - Dzienne notatki w `memory/YYYY-MM-DD.md`
    - Wyselekcjonowane notatki długoterminowe w `MEMORY.md` (tylko sesje główne/prywatne)

    OpenClaw uruchamia też **ciche opróżnienie pamięci przed kompaktowaniem**, aby przypomnieć modelowi
    o zapisaniu trwałych notatek przed automatycznym kompaktowaniem. Działa to tylko wtedy, gdy workspace
    jest zapisywalny (sandboxy tylko do odczytu to pomijają). Zobacz [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Pamięć ciągle zapomina rzeczy. Jak sprawić, żeby się utrwaliły?">
    Poproś bota, aby **zapisał fakt do pamięci**. Notatki długoterminowe powinny trafiać do `MEMORY.md`,
    a kontekst krótkoterminowy do `memory/YYYY-MM-DD.md`.

    To nadal obszar, który ulepszamy. Pomaga przypominanie modelowi o zapisywaniu wspomnień;
    będzie wiedział, co zrobić. Jeśli nadal zapomina, sprawdź, czy Gateway używa
    tego samego workspace przy każdym uruchomieniu.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Czy pamięć utrzymuje się bez końca? Jakie są limity?">
    Pliki pamięci znajdują się na dysku i utrzymują się, dopóki ich nie usuniesz. Limitem jest
    miejsce na dysku, a nie model. **Kontekst sesji** nadal jest ograniczony oknem kontekstowym modelu,
    więc długie rozmowy mogą zostać skompaktowane albo obcięte. Dlatego istnieje
    wyszukiwanie w pamięci — przywraca do kontekstu tylko odpowiednie fragmenty.

    Dokumentacja: [Pamięć](/pl/concepts/memory), [Kontekst](/pl/concepts/context).

  </Accordion>

  <Accordion title="Czy semantyczne wyszukiwanie pamięci wymaga klucza API OpenAI?">
    Tylko jeśli używasz **embeddingów OpenAI**. Codex OAuth obejmuje chat/completions i
    **nie** daje dostępu do embeddingów, więc **logowanie przez Codex (OAuth albo
    logowanie Codex CLI)** nie pomaga w semantycznym wyszukiwaniu pamięci. Embeddingi OpenAI
    nadal wymagają prawdziwego klucza API (`OPENAI_API_KEY` albo `models.providers.openai.apiKey`).

    Jeśli nie ustawisz jawnie providera, OpenClaw automatycznie wybiera providera, kiedy
    potrafi rozwiązać klucz API (profile uwierzytelniania, `models.providers.*.apiKey` albo zmienne środowiskowe).
    Preferuje OpenAI, jeśli uda się rozwiązać klucz OpenAI, w przeciwnym razie Gemini, jeśli uda się rozwiązać klucz Gemini,
    potem Voyage, a następnie Mistral. Jeśli żaden zdalny klucz nie jest dostępny, wyszukiwanie pamięci
    pozostaje wyłączone, dopóki go nie skonfigurujesz. Jeśli masz skonfigurowaną i obecną ścieżkę lokalnego modelu, OpenClaw
    preferuje `local`. Ollama jest wspierana, gdy jawnie ustawisz
    `memorySearch.provider = "ollama"`.

    Jeśli wolisz pozostać lokalnie, ustaw `memorySearch.provider = "local"` (i opcjonalnie
    `memorySearch.fallback = "none"`). Jeśli chcesz embeddingów Gemini, ustaw
    `memorySearch.provider = "gemini"` i podaj `GEMINI_API_KEY` (albo
    `memorySearch.remote.apiKey`). Obsługujemy modele embeddingów **OpenAI, Gemini, Voyage, Mistral, Ollama lub local**
    — szczegóły konfiguracji znajdziesz w [Pamięci](/pl/concepts/memory).

  </Accordion>
</AccordionGroup>

## Gdzie rzeczy znajdują się na dysku

<AccordionGroup>
  <Accordion title="Czy wszystkie dane używane z OpenClaw są zapisywane lokalnie?">
    Nie — **stan OpenClaw jest lokalny**, ale **zewnętrzne usługi nadal widzą to, co do nich wysyłasz**.

    - **Lokalnie domyślnie:** sesje, pliki pamięci, konfiguracja i workspace znajdują się na hoście Gatewaya
      (`~/.openclaw` + katalog workspace).
    - **Zdalnie z konieczności:** wiadomości wysyłane do providerów modeli (Anthropic/OpenAI/etc.) trafiają do
      ich API, a platformy czatowe (WhatsApp/Telegram/Slack/etc.) przechowują dane wiadomości na swoich
      serwerach.
    - **Ty kontrolujesz ślad:** używanie modeli lokalnych utrzymuje prompty na Twojej maszynie, ale ruch kanałowy
      nadal przechodzi przez serwery danego kanału.

    Powiązane: [Workspace agenta](/pl/concepts/agent-workspace), [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Gdzie OpenClaw przechowuje swoje dane?">
    Wszystko znajduje się pod `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`):

    | Path                                                            | Cel                                                                |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Główna konfiguracja (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Starszy import OAuth (kopiowany do profili auth przy pierwszym użyciu) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profile auth (OAuth, klucze API oraz opcjonalne `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Opcjonalny ładunek sekretów oparty na plikach dla providerów `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Starszy plik zgodności (statyczne wpisy `api_key` oczyszczone)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stan providera (np. `whatsapp/<accountId>/creds.json`)             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stan per agent (agentDir + sesje)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historia i stan rozmów (per agent)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadane sesji (per agent)                                         |

    Starsza ścieżka pojedynczego agenta: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).

    Twój **workspace** (AGENTS.md, pliki pamięci, Skills itp.) jest oddzielny i konfigurowany przez `agents.defaults.workspace` (domyślnie: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Gdzie powinny znajdować się AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Te pliki znajdują się w **workspace agenta**, a nie w `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (albo starszy fallback `memory.md`, gdy `MEMORY.md` nie istnieje),
      `memory/YYYY-MM-DD.md`, opcjonalnie `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: konfiguracja, stan kanałów/providerów, profile auth, sesje, logi
      i współdzielone Skills (`~/.openclaw/skills`).

    Domyślny workspace to `~/.openclaw/workspace`, konfigurowalny przez:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jeśli bot „zapomina” po restarcie, potwierdź, że Gateway używa tego samego
    workspace przy każdym uruchomieniu (i pamiętaj: tryb zdalny używa **workspace hosta gatewaya**,
    a nie Twojego lokalnego laptopa).

    Wskazówka: jeśli chcesz utrwalić zachowanie albo preferencję, poproś bota, aby **zapisał to do
    AGENTS.md albo MEMORY.md**, zamiast polegać na historii czatu.

    Zobacz [Workspace agenta](/pl/concepts/agent-workspace) i [Pamięć](/pl/concepts/memory).

  </Accordion>

  <Accordion title="Zalecana strategia kopii zapasowych">
    Umieść **workspace agenta** w **prywatnym** repozytorium git i twórz jego kopię zapasową w
    prywatnym miejscu (na przykład GitHub private). To zapisuje pamięć + pliki AGENTS/SOUL/USER
    i pozwala później odtworzyć „umysł” asystenta.

    **Nie** commituj niczego z `~/.openclaw` (poświadczeń, sesji, tokenów ani zaszyfrowanych payloadów sekretów).
    Jeśli potrzebujesz pełnego odtworzenia, twórz kopie zapasowe zarówno workspace, jak i katalogu stanu
    osobno (zobacz pytanie o migrację powyżej).

    Dokumentacja: [Workspace agenta](/pl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Jak całkowicie odinstalować OpenClaw?">
    Zobacz osobny przewodnik: [Odinstalowanie](/pl/install/uninstall).
  </Accordion>

  <Accordion title="Czy agenci mogą pracować poza workspace?">
    Tak. Workspace to **domyślny cwd** i kotwica pamięci, a nie twardy sandbox.
    Ścieżki względne rozwiązywane są wewnątrz workspace, ale ścieżki bezwzględne mogą uzyskać dostęp do innych
    lokalizacji hosta, chyba że włączony jest sandboxing. Jeśli potrzebujesz izolacji, użyj
    [`agents.defaults.sandbox`](/pl/gateway/sandboxing) albo ustawień sandbox per agent. Jeśli chcesz,
    aby repozytorium było domyślnym katalogiem roboczym, wskaż w `workspace`
    tego agenta katalog główny repozytorium. Repozytorium OpenClaw to tylko kod źródłowy; trzymaj
    workspace osobno, chyba że celowo chcesz, aby agent pracował w nim.

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
    Właścicielem stanu sesji jest **host gatewaya**. Jeśli jesteś w trybie zdalnym, magazyn sesji, który Cię interesuje, znajduje się na zdalnej maszynie, a nie na Twoim lokalnym laptopie. Zobacz [Zarządzanie sesją](/pl/concepts/session).
  </Accordion>
</AccordionGroup>

## Podstawy konfiguracji

<AccordionGroup>
  <Accordion title="Jaki format ma konfiguracja? Gdzie się znajduje?">
    OpenClaw odczytuje opcjonalną konfigurację **JSON5** z `$OPENCLAW_CONFIG_PATH` (domyślnie: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jeśli pliku nie ma, używane są dość bezpieczne wartości domyślne (w tym domyślny workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ustawiłem gateway.bind: "lan" (albo "tailnet") i teraz nic nie nasłuchuje / UI mówi unauthorized'>
    Bindowanie non-loopback **wymaga poprawnej ścieżki uwierzytelniania gatewaya**. W praktyce oznacza to:

    - uwierzytelnianie wspólnym sekretem: token albo hasło
    - `gateway.auth.mode: "trusted-proxy"` za poprawnie skonfigurowanym reverse proxy świadomym tożsamości non-loopback

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

    - `gateway.remote.token` / `.password` same z siebie **nie** włączają lokalnego uwierzytelniania gatewaya.
    - Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
    - Dla uwierzytelniania hasłem ustaw zamiast tego `gateway.auth.mode: "password"` oraz `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się bezpiecznym zamknięciem (bez maskującego zdalnego fallbacku).
    - Konfiguracje Control UI ze wspólnym sekretem uwierzytelniają się przez `connect.params.auth.token` lub `connect.params.auth.password` (przechowywane w ustawieniach aplikacji/UI). Tryby przenoszące tożsamość, takie jak Tailscale Serve albo `trusted-proxy`, używają zamiast tego nagłówków żądań. Unikaj umieszczania wspólnych sekretów w URL.
    - Przy `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback na tym samym hoście nadal **nie** spełniają uwierzytelniania trusted-proxy. Zaufane proxy musi być skonfigurowanym źródłem non-loopback.

  </Accordion>

  <Accordion title="Dlaczego teraz potrzebuję tokenu na localhost?">
    OpenClaw domyślnie wymusza uwierzytelnianie gatewaya, również na loopback. W normalnej domyślnej ścieżce oznacza to uwierzytelnianie tokenem: jeśli nie skonfigurowano jawnej ścieżki auth, podczas startu gateway rozwiązuje się to do trybu tokenu i automatycznie generuje token, zapisując go do `gateway.auth.token`, więc **lokalni klienci WS muszą się uwierzytelnić**. Blokuje to innym lokalnym procesom możliwość wywoływania Gatewaya.

    Jeśli wolisz inną ścieżkę auth, możesz jawnie wybrać tryb hasła (lub, dla reverse proxy świadomych tożsamości non-loopback, `trusted-proxy`). Jeśli **naprawdę** chcesz otwartego loopback, ustaw jawnie `gateway.auth.mode: "none"` w konfiguracji. Doctor może w każdej chwili wygenerować Ci token: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Czy muszę restartować po zmianie konfiguracji?">
    Gateway obserwuje konfigurację i obsługuje hot-reload:

    - `gateway.reload.mode: "hybrid"` (domyślnie): stosuje bezpieczne zmiany na gorąco, a dla krytycznych wykonuje restart
    - obsługiwane są też `hot`, `restart`, `off`

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

    - `off`: ukrywa tekst sloganu, ale zachowuje tytuł banera/linię wersji.
    - `default`: zawsze używa `All your chats, one OpenClaw.`.
    - `random`: rotacyjne zabawne/sezonowe slogany (domyślne zachowanie).
    - Jeśli nie chcesz żadnego banera, ustaw env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Jak włączyć wyszukiwanie w sieci (i web fetch)?">
    `web_fetch` działa bez klucza API. `web_search` zależy od wybranego
    providera:

    - Providerzy oparci na API, tacy jak Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity i Tavily, wymagają normalnej konfiguracji klucza API.
    - Ollama Web Search nie wymaga klucza, ale używa skonfigurowanego hosta Ollama i wymaga `ollama signin`.
    - DuckDuckGo nie wymaga klucza, ale jest nieoficjalną integracją opartą na HTML.
    - SearXNG jest bezkluczowy/self-hosted; skonfiguruj `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Zalecane:** uruchom `openclaw configure --section web` i wybierz providera.
    Alternatywy w zmiennych środowiskowych:

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
              provider: "firecrawl", // opcjonalne; pomiń dla auto-detect
            },
          },
        },
    }
    ```

    Konfiguracja wyszukiwania webowego specyficzna dla providera znajduje się teraz pod `plugins.entries.<plugin>.config.webSearch.*`.
    Starsze ścieżki providera `tools.web.search.*` nadal tymczasowo się ładują ze względu na zgodność, ale nie powinny być używane w nowych konfiguracjach.
    Konfiguracja fallbacku Firecrawl web-fetch znajduje się pod `plugins.entries.firecrawl.config.webFetch.*`.

    Uwagi:

    - Jeśli używasz allowlist, dodaj `web_search`/`web_fetch`/`x_search` albo `group:web`.
    - `web_fetch` jest włączone domyślnie (chyba że jawnie je wyłączysz).
    - Jeśli `tools.web.fetch.provider` zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego providera fetch fallback na podstawie dostępnych poświadczeń. Obecnie bundlowanym providerem jest Firecrawl.
    - Demony odczytują zmienne środowiskowe z `~/.openclaw/.env` (albo środowiska usługi).

    Dokumentacja: [Narzędzia webowe](/pl/tools/web).

  </Accordion>

  <Accordion title="config.apply wyczyściło mi konfigurację. Jak to odzyskać i jak tego uniknąć?">
    `config.apply` zastępuje **całą konfigurację**. Jeśli wyślesz obiekt częściowy, wszystko
    inne zostanie usunięte.

    Odzyskiwanie:

    - Przywróć z kopii zapasowej (git albo skopiowane `~/.openclaw/openclaw.json`).
    - Jeśli nie masz kopii zapasowej, uruchom ponownie `openclaw doctor` i skonfiguruj kanały/modele.
    - Jeśli to było nieoczekiwane, zgłoś błąd i dołącz ostatnią znaną konfigurację albo dowolną kopię zapasową.
    - Lokalny agent do kodowania często potrafi odtworzyć działającą konfigurację z logów lub historii.

    Jak tego uniknąć:

    - Używaj `openclaw config set` dla małych zmian.
    - Używaj `openclaw configure` do edycji interaktywnych.
    - Najpierw użyj `config.schema.lookup`, gdy nie masz pewności co do dokładnej ścieżki lub kształtu pola; zwraca płytki węzeł schematu oraz podsumowania bezpośrednich dzieci do dalszego zagłębiania.
    - Używaj `config.patch` do częściowych edycji RPC; `config.apply` zostaw wyłącznie do pełnej wymiany konfiguracji.
    - Jeśli używasz narzędzia `gateway` dostępnego tylko dla właściciela z poziomu uruchomienia agenta, nadal będzie ono odrzucać zapisy do `tools.exec.ask` / `tools.exec.security` (w tym starsze aliasy `tools.bash.*`, które normalizują się do tych samych chronionych ścieżek exec).

    Dokumentacja: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Jak uruchomić centralny Gateway ze wyspecjalizowanymi workerami na różnych urządzeniach?">
    Typowy wzorzec to **jeden Gateway** (np. Raspberry Pi) plus **nodes** i **agenci**:

    - **Gateway (centralny):** zarządza kanałami (Signal/WhatsApp), routingiem i sesjami.
    - **Nodes (urządzenia):** Maci/iOS/Android łączą się jako peryferia i udostępniają lokalne narzędzia (`system.run`, `canvas`, `camera`).
    - **Agenci (workery):** oddzielne „mózgi”/workspace dla wyspecjalizowanych ról (np. „Hetzner ops”, „Dane osobowe”).
    - **Sub-agenci:** uruchamiaj pracę w tle z głównego agenta, gdy chcesz równoległości.
    - **TUI:** połącz się z Gatewayem i przełączaj agentów/sesje.

    Dokumentacja: [Nodes](/pl/nodes), [Dostęp zdalny](/pl/gateway/remote), [Routing wielu agentów](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Czy przeglądarka OpenClaw może działać headless?">
    Tak. To opcja konfiguracyjna:

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

    Domyślnie jest `false` (z widocznym oknem). Tryb headless częściej uruchamia kontrole antybotowe na niektórych stronach. Zobacz [Przeglądarka](/pl/tools/browser).

    Headless używa **tego samego silnika Chromium** i działa przy większości automatyzacji (formularze, kliknięcia, scraping, logowania). Główne różnice:

    - Brak widocznego okna przeglądarki (jeśli potrzebujesz wizualiów, używaj zrzutów ekranu).
    - Niektóre strony są bardziej rygorystyczne wobec automatyzacji w trybie headless (CAPTCHA, antybot).
      Na przykład X/Twitter często blokuje sesje headless.

  </Accordion>

  <Accordion title="Jak używać Brave do sterowania przeglądarką?">
    Ustaw `browser.executablePath` na binarkę Brave (lub dowolnej przeglądarki opartej na Chromium) i zrestartuj Gateway.
    Pełne przykłady konfiguracji znajdziesz w [Przeglądarce](/pl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Zdalne gatewaye i nodes

<AccordionGroup>
  <Accordion title="Jak polecenia propagują się między Telegramem, gatewayem i nodes?">
    Wiadomości z Telegrama obsługuje **gateway**. Gateway uruchamia agenta i
    dopiero potem wywołuje nodes przez **Gateway WebSocket**, gdy potrzebne jest narzędzie node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes nie widzą ruchu wejściowego providera; otrzymują tylko wywołania node RPC.

  </Accordion>

  <Accordion title="Jak mój agent może uzyskać dostęp do mojego komputera, jeśli Gateway jest hostowany zdalnie?">
    Krótka odpowiedź: **sparuj swój komputer jako node**. Gateway działa gdzie indziej, ale może
    wywoływać narzędzia `node.*` (screen, camera, system) na Twojej lokalnej maszynie przez Gateway WebSocket.

    Typowa konfiguracja:

    1. Uruchom Gateway na zawsze włączonym hoście (VPS/serwer domowy).
    2. Dodaj host Gatewaya + swój komputer do tego samego tailnetu.
    3. Upewnij się, że Gateway WS jest osiągalny (bind tailnet albo tunel SSH).
    4. Otwórz lokalnie aplikację macOS i połącz się w trybie **Remote over SSH** (albo bezpośrednio przez tailnet),
       aby mogła zarejestrować się jako node.
    5. Zatwierdź node na Gatewayu:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Oddzielny most TCP nie jest wymagany; nodes łączą się przez Gateway WebSocket.

    Przypomnienie o bezpieczeństwie: sparowanie node macOS pozwala na `system.run` na tej maszynie. Paruj
    tylko urządzenia, którym ufasz, i przeczytaj [Bezpieczeństwo](/pl/gateway/security).

    Dokumentacja: [Nodes](/pl/nodes), [Protokół Gatewaya](/pl/gateway/protocol), [zdalny tryb macOS](/pl/platforms/mac/remote), [Bezpieczeństwo](/pl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale jest połączony, ale nie dostaję odpowiedzi. Co teraz?">
    Sprawdź podstawy:

    - Gateway działa: `openclaw gateway status`
    - Kondycja Gatewaya: `openclaw status`
    - Kondycja kanałów: `openclaw channels status`

    Następnie zweryfikuj uwierzytelnianie i routing:

    - Jeśli używasz Tailscale Serve, upewnij się, że `gateway.auth.allowTailscale` jest ustawione poprawnie.
    - Jeśli łączysz się przez tunel SSH, potwierdź, że lokalny tunel działa i wskazuje właściwy port.
    - Potwierdź, że Twoje allowlisty (DM albo grupy) obejmują Twoje konto.

    Dokumentacja: [Tailscale](/pl/gateway/tailscale), [Dostęp zdalny](/pl/gateway/remote), [Kanały](/pl/channels).

  </Accordion>

  <Accordion title="Czy dwie instancje OpenClaw mogą rozmawiać ze sobą (lokalna + VPS)?">
    Tak. Nie ma wbudowanego mostu „bot-do-bota”, ale można to spiąć na kilka
    niezawodnych sposobów:

    **Najprościej:** użyj zwykłego kanału czatowego, do którego oba boty mają dostęp (Telegram/Slack/WhatsApp).
    Niech Bot A wyśle wiadomość do Bota B, a potem Bot B odpowie jak zwykle.

    **Most CLI (ogólny):** uruchom skrypt, który wywoła drugi Gateway przez
    `openclaw agent --message ... --deliver`, kierując wiadomość do czatu, którego ten drugi bot
    nasłuchuje. Jeśli jeden bot działa na zdalnym VPS, skieruj CLI do tego zdalnego Gatewaya
    przez SSH/Tailscale (zobacz [Dostęp zdalny](/pl/gateway/remote)).

    Przykładowy wzorzec (uruchom z maszyny, która potrafi dotrzeć do docelowego Gatewaya):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Wskazówka: dodaj guardrail, aby oba boty nie zapętlały się bez końca (odpowiedzi tylko po wzmiance, allowlisty kanałów
    albo reguła „nie odpowiadaj na wiadomości botów”).

    Dokumentacja: [Dostęp zdalny](/pl/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/pl/tools/agent-send).

  </Accordion>

  <Accordion title="Czy potrzebuję osobnych VPS-ów dla wielu agentów?">
    Nie. Jeden Gateway może hostować wielu agentów, każdy z własnym workspace, domyślnymi modelami
    i routingiem. To jest normalna konfiguracja i jest znacznie tańsza oraz prostsza niż uruchamianie
    jednego VPS na agenta.

    Używaj osobnych VPS-ów tylko wtedy, gdy potrzebujesz twardej izolacji (granic bezpieczeństwa) albo bardzo
    różnych konfiguracji, których nie chcesz współdzielić. W przeciwnym razie trzymaj jeden Gateway i
    używaj wielu agentów albo sub agentów.

  </Accordion>

  <Accordion title="Czy używanie node na moim prywatnym laptopie zamiast SSH z VPS daje jakieś korzyści?">
    Tak — nodes to pierwszoklasowy sposób docierania do laptopa ze zdalnego Gatewaya i
    odblokowują więcej niż sam dostęp do powłoki. Gateway działa na macOS/Linux (Windows przez WSL2) i jest
    lekki (wystarczy mały VPS lub urządzenie klasy Raspberry Pi; 4 GB RAM to aż nadto), więc typową
    konfiguracją jest host zawsze włączony plus Twój laptop jako node.

    - **Nie wymaga przychodzącego SSH.** Nodes łączą się wychodząco do Gateway WebSocket i używają parowania urządzeń.
    - **Bezpieczniejsze sterowanie wykonaniem.** `system.run` jest bramkowane przez allowlisty/zatwierdzenia node na tym laptopie.
    - **Więcej narzędzi urządzenia.** Nodes udostępniają `canvas`, `camera` i `screen` oprócz `system.run`.
    - **Lokalna automatyzacja przeglądarki.** Trzymaj Gateway na VPS, ale uruchamiaj lokalnie Chrome przez hosta node na laptopie albo dołączaj do lokalnego Chrome na hoście przez Chrome MCP.

    SSH jest w porządku dla doraźnego dostępu do powłoki, ale nodes są prostsze dla ciągłych przepływów pracy agentów i
    automatyzacji urządzeń.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes), [Przeglądarka](/pl/tools/browser).

  </Accordion>

  <Accordion title="Czy nodes uruchamiają usługę gateway?">
    Nie. Na hoście powinien działać tylko **jeden gateway**, chyba że celowo uruchamiasz profile izolowane (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)). Nodes to peryferia łączące się
    z gatewayem (nodes iOS/Android albo macOS „tryb node” w aplikacji menu bar). Informacje o headless
    hostach node i sterowaniu z CLI znajdziesz w [Node host CLI](/cli/node).

    Pełny restart jest wymagany dla zmian `gateway`, `discovery` i `canvasHost`.

  </Accordion>

  <Accordion title="Czy istnieje API / RPC do stosowania konfiguracji?">
    Tak.

    - `config.schema.lookup`: sprawdza jedno poddrzewo konfiguracji wraz z jego płytkim węzłem schematu, dopasowaną wskazówką UI i podsumowaniami bezpośrednich dzieci przed zapisem
    - `config.get`: pobiera bieżącą migawkę + hash
    - `config.patch`: bezpieczna częściowa aktualizacja (zalecana dla większości edycji RPC); wykonuje hot-reload, gdy to możliwe, i restartuje, gdy to wymagane
    - `config.apply`: waliduje + zastępuje pełną konfigurację; wykonuje hot-reload, gdy to możliwe, i restartuje, gdy to wymagane
    - Narzędzie runtime `gateway` dostępne tylko dla właściciela nadal odmawia przepisania `tools.exec.ask` / `tools.exec.security`; starsze aliasy `tools.bash.*` normalizują się do tych samych chronionych ścieżek exec

  </Accordion>

  <Accordion title="Minimalna sensowna konfiguracja dla pierwszej instalacji">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    To ustawia workspace i ogranicza, kto może wyzwolić bota.

  </Accordion>

  <Accordion title="Jak skonfigurować Tailscale na VPS i połączyć się z niego z Maca?">
    Minimalne kroki:

    1. **Zainstaluj + zaloguj się na VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Zainstaluj + zaloguj się na Macu**
       - Użyj aplikacji Tailscale i zaloguj się do tego samego tailnetu.
    3. **Włącz MagicDNS (zalecane)**
       - W konsoli administracyjnej Tailscale włącz MagicDNS, aby VPS miał stabilną nazwę.
    4. **Użyj nazwy hosta tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jeśli chcesz Control UI bez SSH, użyj Tailscale Serve na VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    To utrzymuje gateway zbindowany do loopback i wystawia HTTPS przez Tailscale. Zobacz [Tailscale](/pl/gateway/tailscale).

  </Accordion>

  <Accordion title="Jak podłączyć node Mac do zdalnego Gatewaya (Tailscale Serve)?">
    Serve wystawia **Control UI + WS Gatewaya**. Nodes łączą się przez ten sam endpoint Gateway WS.

    Zalecana konfiguracja:

    1. **Upewnij się, że VPS + Mac są w tym samym tailnecie**.
    2. **Użyj aplikacji macOS w trybie zdalnym** (celem SSH może być nazwa hosta tailnet).
       Aplikacja tuneluje port Gatewaya i połączy się jako node.
    3. **Zatwierdź node** na gatewayu:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentacja: [Protokół Gatewaya](/pl/gateway/protocol), [Discovery](/pl/gateway/discovery), [zdalny tryb macOS](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy powinienem instalować na drugim laptopie, czy tylko dodać node?">
    Jeśli potrzebujesz tylko **lokalnych narzędzi** (screen/camera/exec) na drugim laptopie, dodaj go jako
    **node**. Dzięki temu utrzymujesz jeden Gateway i unikasz duplikowania konfiguracji. Lokalne narzędzia node są
    obecnie tylko dla macOS, ale planujemy rozszerzyć je na inne systemy operacyjne.

    Drugi Gateway instaluj tylko wtedy, gdy potrzebujesz **twardej izolacji** albo dwóch całkowicie osobnych botów.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/cli/nodes), [Wiele gatewayów](/pl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe i ładowanie .env

<AccordionGroup>
  <Accordion title="Jak OpenClaw ładuje zmienne środowiskowe?">
    OpenClaw odczytuje zmienne środowiskowe z procesu nadrzędnego (powłoka, launchd/systemd, CI itd.) i dodatkowo ładuje:

    - `.env` z bieżącego katalogu roboczego
    - globalny fallback `.env` z `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`)

    Żaden z tych plików `.env` nie nadpisuje istniejących zmiennych środowiskowych.

    Możesz też zdefiniować inline env vars w konfiguracji (stosowane tylko wtedy, gdy brakuje ich w process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Pełny opis priorytetów i źródeł znajdziesz w [/environment](/pl/help/environment).

  </Accordion>

  <Accordion title="Uruchomiłem Gateway przez usługę i moje env vars zniknęły. Co teraz?">
    Dwie częste poprawki:

    1. Umieść brakujące klucze w `~/.openclaw/.env`, aby zostały odczytane nawet wtedy, gdy usługa nie dziedziczy env z Twojej powłoki.
    2. Włącz import powłoki (wygoda typu opt-in):

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

  <Accordion title='Ustawiłem COPILOT_GITHUB_TOKEN, ale models status pokazuje "Shell env: off." Dlaczego?'>
    `openclaw models status` raportuje, czy **import env z powłoki** jest włączony. „Shell env: off”
    **nie** oznacza, że Twoich zmiennych środowiskowych brakuje — oznacza tylko, że OpenClaw nie załaduje
    automatycznie Twojej powłoki logowania.

    Jeśli Gateway działa jako usługa (launchd/systemd), nie odziedziczy środowiska
    Twojej powłoki. Napraw to jednym z poniższych sposobów:

    1. Umieść token w `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Albo włącz import powłoki (`env.shellEnv.enabled: true`).
    3. Albo dodaj go do bloku `env` w konfiguracji (stosuje się tylko, jeśli go brakuje).

    Następnie zrestartuj gateway i sprawdź ponownie:

    ```bash
    openclaw models status
    ```

    Tokeny Copilot są odczytywane z `COPILOT_GITHUB_TOKEN` (również `GH_TOKEN` / `GITHUB_TOKEN`).
    Zobacz [/concepts/model-providers](/pl/concepts/model-providers) i [/environment](/pl/help/environment).

  </Accordion>
</AccordionGroup>

## Sesje i wiele czatów

<AccordionGroup>
  <Accordion title="Jak rozpocząć nową rozmowę?">
    Wyślij `/new` albo `/reset` jako samodzielną wiadomość. Zobacz [Zarządzanie sesją](/pl/concepts/session).
  </Accordion>

  <Accordion title="Czy sesje resetują się automatycznie, jeśli nigdy nie wyślę /new?">
    Sesje mogą wygasać po `session.idleMinutes`, ale jest to **domyślnie wyłączone** (domyślnie **0**).
    Ustaw wartość dodatnią, aby włączyć wygasanie z bezczynności. Gdy jest włączone, **następna**
    wiadomość po okresie bezczynności uruchamia nowy identyfikator sesji dla tego klucza czatu.
    To nie usuwa transkryptów — po prostu rozpoczyna nową sesję.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Czy jest sposób, aby stworzyć zespół instancji OpenClaw (jeden CEO i wielu agentów)?">
    Tak, przez **routing wielu agentów** i **sub-agentów**. Możesz utworzyć jednego
    agenta koordynującego i kilku agentów roboczych z własnymi workspace i modelami.

    Mimo to najlepiej traktować to jako **zabawny eksperyment**. Jest to kosztowne tokenowo i często
    mniej efektywne niż używanie jednego bota z oddzielnymi sesjami. Typowy model, jaki
    sobie wyobrażamy, to jeden bot, z którym rozmawiasz, z różnymi sesjami do pracy równoległej. Taki
    bot może też w razie potrzeby uruchamiać sub-agentów.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Sub-agenci](/pl/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Dlaczego kontekst został obcięty w trakcie zadania? Jak temu zapobiec?">
    Kontekst sesji jest ograniczony oknem modelu. Długie czaty, duże wyjścia narzędzi albo wiele
    plików mogą uruchomić kompaktowanie albo obcinanie.

    Co pomaga:

    - Poproś bota o podsumowanie bieżącego stanu i zapisanie go do pliku.
    - Używaj `/compact` przed długimi zadaniami, a `/new` przy zmianie tematu.
    - Trzymaj ważny kontekst w workspace i poproś bota, aby go ponownie odczytał.
    - Używaj sub-agentów do długiej lub równoległej pracy, aby główny czat był mniejszy.
    - Wybierz model z większym oknem kontekstowym, jeśli dzieje się to często.

  </Accordion>

  <Accordion title="Jak całkowicie zresetować OpenClaw, ale pozostawić go zainstalowanego?">
    Użyj polecenia reset:

    ```bash
    openclaw reset
    ```

    Pełny reset bez interakcji:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Następnie ponownie uruchom konfigurację:

    ```bash
    openclaw onboard --install-daemon
    ```

    Uwagi:

    - Onboarding także oferuje **Reset**, jeśli wykryje istniejącą konfigurację. Zobacz [Onboarding (CLI)](/pl/start/wizard).
    - Jeśli używałeś profili (`--profile` / `OPENCLAW_PROFILE`), zresetuj każdy katalog stanu (domyślne to `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (tylko dev; czyści konfigurację dev + poświadczenia + sesje + workspace).

  </Accordion>

  <Accordion title='Dostaję błędy "context too large" - jak zresetować albo skompaktować?'>
    Użyj jednego z tych sposobów:

    - **Kompaktowanie** (zachowuje rozmowę, ale podsumowuje starsze tury):

      ```
      /compact
      ```

      albo `/compact <instructions>`, aby pokierować podsumowaniem.

    - **Reset** (świeży identyfikator sesji dla tego samego klucza czatu):

      ```
      /new
      /reset
      ```

    Jeśli to się powtarza:

    - Włącz albo dostrój **przycinanie sesji** (`agents.defaults.contextPruning`), aby obcinać stare wyjścia narzędzi.
    - Użyj modelu z większym oknem kontekstowym.

    Dokumentacja: [Kompaktowanie](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning), [Zarządzanie sesją](/pl/concepts/session).

  </Accordion>

  <Accordion title='Dlaczego widzę "LLM request rejected: messages.content.tool_use.input field required"?'>
    To błąd walidacji providera: model wyemitował blok `tool_use` bez wymaganego
    `input`. Zwykle oznacza to, że historia sesji jest stara albo uszkodzona (często po długich wątkach
    albo zmianie narzędzia/schematu).

    Naprawa: rozpocznij nową sesję przez `/new` (samodzielna wiadomość).

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

    Jeśli `HEARTBEAT.md` istnieje, ale jest w praktyce pusty (tylko puste linie i nagłówki markdown
    takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzać wywołania API.
    Jeśli pliku brakuje, heartbeat nadal się uruchamia, a model sam decyduje, co zrobić.

    Nadpisania per agent używają `agents.list[].heartbeat`. Dokumentacja: [Heartbeat](/pl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Czy muszę dodawać „konto bota” do grupy WhatsApp?'>
    Nie. OpenClaw działa na **Twoim własnym koncie**, więc jeśli jesteś w grupie, OpenClaw może ją widzieć.
    Domyślnie odpowiedzi w grupach są blokowane, dopóki nie zezwolisz nadawcom (`groupPolicy: "allowlist"`).

    Jeśli chcesz, aby tylko **Ty** mógł wyzwalać odpowiedzi w grupie:

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
    Opcja 1 (najszybciej): podejrzyj logi i wyślij testową wiadomość do grupy:

    ```bash
    openclaw logs --follow --json
    ```

    Szukaj `chatId` (albo `from`) kończącego się na `@g.us`, np.:
    `1234567890-1234567890@g.us`.

    Opcja 2 (jeśli już skonfigurowane/na allowliście): wypisz grupy z konfiguracji:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Directory](/cli/directory), [Logi](/cli/logs).

  </Accordion>

  <Accordion title="Dlaczego OpenClaw nie odpowiada w grupie?">
    Dwie częste przyczyny:

    - Włączona jest bramka wzmianki (domyślnie). Musisz oznaczyć bota @wzmianką (albo dopasować `mentionPatterns`).
    - Skonfigurowałeś `channels.whatsapp.groups` bez `"*"`, a grupa nie jest na allowliście.

    Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).

  </Accordion>

  <Accordion title="Czy grupy/wątki współdzielą kontekst z DM-ami?">
    Bezpośrednie czaty domyślnie zapadają się do głównej sesji. Grupy/kanały mają własne klucze sesji, a tematy Telegrama / wątki Discorda są osobnymi sesjami. Zobacz [Grupy](/pl/channels/groups) i [Wiadomości grupowe](/pl/channels/group-messages).
  </Accordion>

  <Accordion title="Ile workspace i agentów mogę utworzyć?">
    Nie ma twardych limitów. Dziesiątki (a nawet setki) są w porządku, ale uważaj na:

    - **Wzrost miejsca na dysku:** sesje + transkrypty znajdują się w `~/.openclaw/agents/<agentId>/sessions/`.
    - **Koszt tokenów:** więcej agentów oznacza więcej równoczesnego użycia modeli.
    - **Narzut operacyjny:** profile auth per agent, workspace i routing kanałów.

    Wskazówki:

    - Utrzymuj jeden **aktywny** workspace na agenta (`agents.defaults.workspace`).
    - Przycinaj stare sesje (usuwaj JSONL albo wpisy magazynu), jeśli dysk rośnie.
    - Używaj `openclaw doctor`, aby wykrywać zbędne workspace i niedopasowania profili.

  </Accordion>

  <Accordion title="Czy mogę uruchamiać wiele botów albo czatów jednocześnie (Slack) i jak to skonfigurować?">
    Tak. Użyj **Routingu wielu agentów**, aby uruchamiać wiele izolowanych agentów i kierować wiadomości przychodzące według
    kanału/konta/peera. Slack jest obsługiwany jako kanał i może być powiązany z określonymi agentami.

    Dostęp do przeglądarki jest potężny, ale nie oznacza „zrób wszystko, co człowiek” — antyboty, CAPTCHAs i MFA nadal mogą
    blokować automatyzację. Dla najbardziej niezawodnego sterowania przeglądarką używaj lokalnego Chrome MCP na hoście
    albo CDP na maszynie, na której faktycznie działa przeglądarka.

    Konfiguracja zgodna z dobrymi praktykami:

    - Host Gatewaya zawsze włączony (VPS/Mac mini).
    - Jeden agent na rolę (powiązania).
    - Kanał(y) Slack przypisane do tych agentów.
    - Lokalna przeglądarka przez Chrome MCP albo node, gdy to potrzebne.

    Dokumentacja: [Routing wielu agentów](/pl/concepts/multi-agent), [Slack](/pl/channels/slack),
    [Przeglądarka](/pl/tools/browser), [Nodes](/pl/nodes).

  </Accordion>
</AccordionGroup>

## Modele: ustawienia domyślne, wybór, aliasy, przełączanie

<AccordionGroup>
  <Accordion title='Czym jest „domyślny model”?'>
    Domyślny model OpenClaw to to, co ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Do modeli odwołuje się jako `provider/model` (przykład: `openai/gpt-5.4`). Jeśli pominiesz providera, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania dokładnego identyfikatora modelu wśród skonfigurowanych providerów, a dopiero potem wraca do skonfigurowanego domyślnego providera jako przestarzałej ścieżki zgodności. Jeśli ten provider nie udostępnia już skonfigurowanego modelu domy