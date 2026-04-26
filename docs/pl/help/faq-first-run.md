---
read_when:
    - Nowa instalacja, zablokowany onboarding lub błędy przy pierwszym uruchomieniu
    - Wybór autoryzacji i subskrypcji providerów
    - Nie można uzyskać dostępu do docs.openclaw.ai, nie można otworzyć dashboardu, instalacja utknęła
sidebarTitle: First-run FAQ
summary: 'FAQ: szybki start i konfiguracja przy pierwszym uruchomieniu — instalacja, onboarding, autoryzacja, subskrypcje, początkowe błędy'
title: 'FAQ: konfiguracja przy pierwszym uruchomieniu'
x-i18n:
    generated_at: "2026-04-26T11:32:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  Pytania i odpowiedzi dotyczące szybkiego startu i pierwszej konfiguracji. Informacje o codziennej pracy, modelach, autoryzacji, sesjach
  i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Szybki start i konfiguracja przy pierwszym uruchomieniu

  <AccordionGroup>
  <Accordion title="Utknąłem, jaki jest najszybszy sposób, żeby się odblokować">
    Użyj lokalnego agenta AI, który potrafi **widzieć Twoją maszynę**. To jest znacznie skuteczniejsze niż pytanie
    na Discordzie, ponieważ większość przypadków „utknąłem” to **lokalne problemy z konfiguracją lub środowiskiem**,
    których zdalni pomocnicy nie mogą sprawdzić.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Te narzędzia potrafią czytać repozytorium, uruchamiać polecenia, sprawdzać logi i pomagać naprawiać konfigurację
    na poziomie maszyny (PATH, usługi, uprawnienia, pliki autoryzacji). Daj im **pełny checkout kodu źródłowego** przez
    instalację hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To instaluje OpenClaw **z checkoutu git**, więc agent może czytać kod i dokumentację oraz
    analizować dokładnie tę wersję, której używasz. Zawsze możesz później wrócić do wersji stable,
    uruchamiając instalator ponownie bez `--install-method git`.

    Wskazówka: poproś agenta, aby **zaplanował i nadzorował** naprawę (krok po kroku), a następnie wykonał tylko
    potrzebne polecenia. Dzięki temu zmiany są niewielkie i łatwiejsze do audytu.

    Jeśli odkryjesz prawdziwy błąd albo poprawkę, zgłoś issue na GitHub lub wyślij PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Zacznij od tych poleceń (udostępnij ich wyniki, gdy prosisz o pomoc):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Co robią:

    - `openclaw status`: szybka migawka stanu Gateway/agenta + podstawowa konfiguracja.
    - `openclaw models status`: sprawdza autoryzację providera + dostępność modeli.
    - `openclaw doctor`: sprawdza poprawność i naprawia typowe problemy konfiguracji/stanu.

    Inne przydatne kontrole CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Szybka pętla debugowania: [Pierwsze 60 sekund, jeśli coś jest zepsute](#first-60-seconds-if-something-is-broken).
    Dokumentacja instalacji: [Install](/pl/install), [Flagi instalatora](/pl/install/installer), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat stale pomija uruchomienia. Co oznaczają powody pominięcia?">
    Typowe powody pominięcia Heartbeat:

    - `quiet-hours`: poza skonfigurowanym oknem aktywnych godzin
    - `empty-heartbeat-file`: `HEARTBEAT.md` istnieje, ale zawiera tylko pusty szablon lub same nagłówki
    - `no-tasks-due`: tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań jeszcze nie jest należny
    - `alerts-disabled`: cała widoczność Heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wyłączone)

    W trybie zadań znaczniki czasu należności są przesuwane dopiero po zakończeniu
    rzeczywistego uruchomienia Heartbeat. Pominięte uruchomienia nie oznaczają zadań jako ukończonych.

    Dokumentacja: [Heartbeat](/pl/gateway/heartbeat), [Automatyzacja i zadania](/pl/automation).

  </Accordion>

  <Accordion title="Zalecany sposób instalacji i konfiguracji OpenClaw">
    Repozytorium zaleca uruchamianie ze źródeł i użycie onboardingu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Kreator może też automatycznie zbudować zasoby UI. Po onboardingu zazwyczaj uruchamiasz Gateway na porcie **18789**.

    Ze źródeł (współtwórcy/dev):

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

  <Accordion title="Jak otworzyć dashboard po onboardingu?">
    Kreator otwiera przeglądarkę z czystym adresem URL dashboardu (bez tokena) zaraz po onboardingu i wypisuje też link w podsumowaniu. Pozostaw tę kartę otwartą; jeśli nie została uruchomiona, skopiuj/wklej wypisany URL na tej samej maszynie.
  </Accordion>

  <Accordion title="Jak uwierzytelnić dashboard na localhost vs zdalnie?">
    **Localhost (ta sama maszyna):**

    - Otwórz `http://127.0.0.1:18789/`.
    - Jeśli prosi o uwierzytelnienie współdzielonym sekretem, wklej skonfigurowany token lub hasło w ustawieniach Control UI.
    - Źródło tokena: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
    - Źródło hasła: `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
    - Jeśli współdzielony sekret nie jest jeszcze skonfigurowany, wygeneruj token przez `openclaw doctor --generate-gateway-token`.

    **Poza localhost:**

    - **Tailscale Serve** (zalecane): zachowaj dowiązanie do loopback, uruchom `openclaw gateway --tailscale serve`, otwórz `https://<magicdns>/`. Jeśli `gateway.auth.allowTailscale` ma wartość `true`, nagłówki tożsamości spełniają wymagania autoryzacji Control UI/WebSocket (bez wklejania współdzielonego sekretu, przy założeniu zaufanego hosta Gateway); interfejsy HTTP API nadal wymagają autoryzacji współdzielonym sekretem, chyba że celowo użyjesz prywatnego ingress `none` albo HTTP auth zaufanego proxy.
      Nieudane współbieżne próby autoryzacji Serve od tego samego klienta są serializowane, zanim limiter nieudanych autoryzacji je zarejestruje, więc drugie błędne ponowienie może już pokazać `retry later`.
    - **Dowiązanie Tailnet**: uruchom `openclaw gateway --bind tailnet --token "<token>"` (albo skonfiguruj uwierzytelnianie hasłem), otwórz `http://<tailscale-ip>:18789/`, a następnie wklej pasujący współdzielony sekret w ustawieniach dashboardu.
    - **Reverse proxy z uwzględnieniem tożsamości**: pozostaw Gateway za zaufanym proxy innym niż loopback, skonfiguruj `gateway.auth.mode: "trusted-proxy"`, a następnie otwórz URL proxy.
    - **Tunel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`. Uwierzytelnianie współdzielonym sekretem nadal obowiązuje przez tunel; wklej skonfigurowany token lub hasło, jeśli pojawi się monit.

    Zobacz [Dashboard](/pl/web/dashboard) i [Powierzchnie webowe](/pl/web), aby poznać szczegóły trybów dowiązania i autoryzacji.

  </Accordion>

  <Accordion title="Dlaczego są dwie konfiguracje zatwierdzeń exec dla zatwierdzeń na czacie?">
    Kontrolują różne warstwy:

    - `approvals.exec`: przekazuje prompty zatwierdzeń do miejsc docelowych czatu
    - `channels.<channel>.execApprovals`: sprawia, że ten kanał działa jako natywny klient zatwierdzania dla zatwierdzeń exec

    Zasady hosta dla exec nadal są rzeczywistą bramką zatwierdzania. Konfiguracja czatu kontroluje tylko, gdzie pojawiają się
    prompty zatwierdzeń i jak ludzie mogą na nie odpowiadać.

    W większości konfiguracji **nie** potrzebujesz obu:

    - Jeśli czat już obsługuje polecenia i odpowiedzi, `/approve` w tym samym czacie działa przez współdzieloną ścieżkę.
    - Jeśli obsługiwany kanał natywny potrafi bezpiecznie wywnioskować zatwierdzających, OpenClaw teraz automatycznie włącza natywne zatwierdzenia DM-first, gdy `channels.<channel>.execApprovals.enabled` nie jest ustawione albo ma wartość `"auto"`.
    - Gdy dostępne są natywne karty/przyciski zatwierdzeń, ten natywny interfejs jest podstawową ścieżką; agent powinien uwzględniać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.
    - Użyj `approvals.exec` tylko wtedy, gdy prompty muszą być także przekazywane do innych czatów lub jawnych pokojów operacyjnych.
    - Użyj `channels.<channel>.execApprovals.target: "channel"` lub `"both"` tylko wtedy, gdy jawnie chcesz publikować prompty zatwierdzeń z powrotem do pokoju/tematu źródłowego.
    - Zatwierdzenia Pluginów są znowu osobne: domyślnie używają `/approve` w tym samym czacie, opcjonalnego przekazywania `approvals.plugin`, a tylko niektóre kanały natywne dodatkowo zachowują natywną obsługę zatwierdzeń Pluginów.

    W skrócie: przekazywanie służy do trasowania, a konfiguracja natywnego klienta służy do bogatszego UX specyficznego dla kanału.
    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Jakiego środowiska uruchomieniowego potrzebuję?">
    Wymagany jest Node **>= 22**. Zalecany jest `pnpm`. Bun **nie jest zalecany** dla Gateway.
  </Accordion>

  <Accordion title="Czy działa na Raspberry Pi?">
    Tak. Gateway jest lekki — dokumentacja podaje, że do użytku osobistego wystarcza **512MB-1GB RAM**, **1 rdzeń** i około **500MB**
    miejsca na dysku, oraz zaznacza, że **Raspberry Pi 4 może go uruchomić**.

    Jeśli chcesz dodatkowego zapasu (logi, media, inne usługi), zalecane jest **2GB**, ale
    nie jest to twarde minimum.

    Wskazówka: mały Pi/VPS może hostować Gateway, a Ty możesz parować **nodes** na laptopie/telefonie dla
    lokalnego ekranu/kamery/canvas lub wykonywania poleceń. Zobacz [Nodes](/pl/nodes).

  </Accordion>

  <Accordion title="Jakieś wskazówki dotyczące instalacji na Raspberry Pi?">
    Krótko: działa, ale spodziewaj się pewnych niedoskonałości.

    - Używaj systemu **64-bitowego** i utrzymuj Node >= 22.
    - Preferuj instalację **hackable (git)**, aby móc widzieć logi i szybko aktualizować.
    - Zacznij bez kanałów/Skills, a potem dodawaj je po jednym.
    - Jeśli trafisz na dziwne problemy z binariami, zwykle jest to problem **zgodności ARM**.

    Dokumentacja: [Linux](/pl/platforms/linux), [Install](/pl/install).

  </Accordion>

  <Accordion title="Utknęło na wake up my friend / onboarding nie chce się wykluć. Co teraz?">
    Ten ekran zależy od tego, czy Gateway jest osiągalny i uwierzytelniony. TUI także automatycznie wysyła
    „Wake up, my friend!” przy pierwszym wykluciu. Jeśli widzisz tę linię **bez odpowiedzi**
    i tokeny pozostają na 0, agent nigdy się nie uruchomił.

    1. Uruchom ponownie Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Sprawdź status + autoryzację:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jeśli nadal wisi, uruchom:

    ```bash
    openclaw doctor
    ```

    Jeśli Gateway jest zdalny, upewnij się, że tunel/połączenie Tailscale działa i że UI
    wskazuje właściwy Gateway. Zobacz [Dostęp zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Czy mogę przenieść konfigurację na nową maszynę (Mac mini) bez ponownego onboardingu?">
    Tak. Skopiuj **katalog stanu** i **workspace**, a następnie raz uruchom Doctor. Dzięki temu
    bot pozostanie „dokładnie taki sam” (pamięć, historia sesji, autoryzacja i stan
    kanałów), pod warunkiem że skopiujesz **obie** lokalizacje:

    1. Zainstaluj OpenClaw na nowej maszynie.
    2. Skopiuj `$OPENCLAW_STATE_DIR` (domyślnie: `~/.openclaw`) ze starej maszyny.
    3. Skopiuj swój workspace (domyślnie: `~/.openclaw/workspace`).
    4. Uruchom `openclaw doctor` i ponownie uruchom usługę Gateway.

    To zachowuje konfigurację, profile autoryzacji, dane logowania WhatsApp, sesje i pamięć. Jeśli jesteś w
    trybie zdalnym, pamiętaj, że host Gateway jest właścicielem magazynu sesji i workspace.

    **Ważne:** jeśli tylko commitujesz/pushujesz workspace do GitHub, wykonujesz kopię zapasową
    **pamięci + plików bootstrap**, ale **nie** historii sesji ani autoryzacji. To znajduje się
    pod `~/.openclaw/` (na przykład `~/.openclaw/agents/<agentId>/sessions/`).

    Powiązane: [Migracja](/pl/install/migrating), [Gdzie rzeczy znajdują się na dysku](#where-things-live-on-disk),
    [Workspace agenta](/pl/concepts/agent-workspace), [Doctor](/pl/gateway/doctor),
    [Tryb zdalny](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie mogę zobaczyć, co nowego w najnowszej wersji?">
    Sprawdź changelog na GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Najnowsze wpisy są na górze. Jeśli górna sekcja jest oznaczona jako **Unreleased**, następna sekcja z datą
    to najnowsza wydana wersja. Wpisy są grupowane według **Highlights**, **Changes** i
    **Fixes** (plus sekcje docs/inne, gdy to potrzebne).

  </Accordion>

  <Accordion title="Nie można uzyskać dostępu do docs.openclaw.ai (błąd SSL)">
    Niektóre połączenia Comcast/Xfinity niepoprawnie blokują `docs.openclaw.ai` przez Xfinity
    Advanced Security. Wyłącz to albo dodaj `docs.openclaw.ai` do listy dozwolonych, a następnie spróbuj ponownie.
    Pomóż nam to odblokować, zgłaszając tutaj: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jeśli nadal nie możesz uzyskać dostępu do strony, dokumentacja jest mirrorowana na GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Różnica między stable a beta">
    **Stable** i **beta** to **dist-tagi npm**, a nie osobne linie kodu:

    - `latest` = stable
    - `beta` = wczesna kompilacja do testów

    Zwykle stabilne wydanie trafia najpierw na **beta**, a potem jawny
    krok promocji przenosi tę samą wersję na `latest`. Maintainerzy mogą też
    publikować bezpośrednio do `latest`, gdy jest taka potrzeba. Dlatego beta i stable mogą
    wskazywać na **tę samą wersję** po promocji.

    Zobacz, co się zmieniło:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Polecenia instalacyjne w jednym wierszu i różnicę między beta a dev znajdziesz w akordeonie poniżej.

  </Accordion>

  <Accordion title="Jak zainstalować wersję beta i jaka jest różnica między beta a dev?">
    **Beta** to dist-tag npm `beta` (po promocji może odpowiadać `latest`).
    **Dev** to ruchoma główka `main` (git); po publikacji używa dist-tagu npm `dev`.

    Polecenia jednolinijkowe (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalator Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Więcej szczegółów: [Kanały deweloperskie](/pl/install/development-channels) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak wypróbować najnowsze zmiany?">
    Dwie opcje:

    1. **Kanał dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    To przełącza na gałąź `main` i aktualizuje ze źródła.

    2. **Instalacja hackable (ze strony instalatora):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    To daje lokalne repozytorium, które możesz edytować, a potem aktualizować przez git.

    Jeśli wolisz ręcznie zrobić czysty clone, użyj:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentacja: [Update](/pl/cli/update), [Kanały deweloperskie](/pl/install/development-channels),
    [Install](/pl/install).

  </Accordion>

  <Accordion title="Jak długo zwykle trwa instalacja i onboarding?">
    Przybliżone wartości:

    - **Instalacja:** 2-5 minut
    - **Onboarding:** 5-15 minut, zależnie od liczby konfigurowanych kanałów/modeli

    Jeśli proces się zawiesza, użyj [Instalator utknął](#quick-start-and-first-run-setup)
    oraz szybkiej pętli debugowania w [Utknąłem](#quick-start-and-first-run-setup).

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

    Dla instalacji hackable (git):

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

    - Zainstaluj **Git for Windows** i upewnij się, że `git` jest na Twoim PATH.
    - Zamknij i otwórz ponownie PowerShell, a następnie ponownie uruchom instalator.

    **2) openclaw is not recognized po instalacji**

    - Twój globalny katalog bin npm nie jest na PATH.
    - Sprawdź ścieżkę:

      ```powershell
      npm config get prefix
      ```

    - Dodaj ten katalog do swojego użytkownika PATH (na Windows nie potrzeba sufiksu `\bin`; na większości systemów jest to `%AppData%\npm`).
    - Zamknij i otwórz ponownie PowerShell po aktualizacji PATH.

    Jeśli chcesz możliwie najpłynniejszej konfiguracji na Windows, użyj **WSL2** zamiast natywnego Windows.
    Dokumentacja: [Windows](/pl/platforms/windows).

  </Accordion>

  <Accordion title="Dane wyjściowe exec na Windows pokazują zniekształcony tekst chiński - co mam zrobić?">
    Zwykle jest to niedopasowanie strony kodowej konsoli w natywnych powłokach Windows.

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

    Następnie uruchom ponownie Gateway i powtórz polecenie:

    ```powershell
    openclaw gateway restart
    ```

    Jeśli nadal odtwarzasz ten problem na najnowszym OpenClaw, śledź/zgłoś go tutaj:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentacja nie odpowiedziała na moje pytanie - jak uzyskać lepszą odpowiedź?">
    Użyj instalacji **hackable (git)**, aby mieć lokalnie pełny kod źródłowy i dokumentację, a potem zapytaj
    swojego bota (albo Claude/Codex) _z tego katalogu_, aby mógł czytać repozytorium i odpowiadać precyzyjnie.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Więcej szczegółów: [Install](/pl/install) i [Flagi instalatora](/pl/install/installer).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na Linuxie?">
    Krótka odpowiedź: postępuj zgodnie z przewodnikiem dla Linuxa, a następnie uruchom onboarding.

    - Szybka ścieżka dla Linuxa + instalacja usługi: [Linux](/pl/platforms/linux).
    - Pełny przewodnik: [Pierwsze kroki](/pl/start/getting-started).
    - Instalator + aktualizacje: [Instalacja i aktualizacje](/pl/install/updating).

  </Accordion>

  <Accordion title="Jak zainstalować OpenClaw na VPS?">
    Każdy VPS z Linuxem będzie działał. Zainstaluj na serwerze, a następnie używaj SSH/Tailscale, aby uzyskać dostęp do Gateway.

    Przewodniki: [exe.dev](/pl/install/exe-dev), [Hetzner](/pl/install/hetzner), [Fly.io](/pl/install/fly).
    Dostęp zdalny: [Gateway remote](/pl/gateway/remote).

  </Accordion>

  <Accordion title="Gdzie są przewodniki instalacji cloud/VPS?">
    Mamy **hub hostingowy** z popularnymi providerami. Wybierz jednego i postępuj zgodnie z przewodnikiem:

    - [Hosting VPS](/pl/vps) (wszyscy providerzy w jednym miejscu)
    - [Fly.io](/pl/install/fly)
    - [Hetzner](/pl/install/hetzner)
    - [exe.dev](/pl/install/exe-dev)

    Jak to działa w chmurze: **Gateway działa na serwerze**, a Ty uzyskujesz do niego dostęp
    z laptopa/telefonu przez Control UI (albo Tailscale/SSH). Twój stan + workspace
    znajdują się na serwerze, więc traktuj host jako źródło prawdy i twórz jego kopie zapasowe.

    Możesz parować **nodes** (Mac/iOS/Android/headless) z tym cloud Gateway, aby uzyskiwać dostęp do
    lokalnego ekranu/kamery/canvas albo uruchamiać polecenia na laptopie przy jednoczesnym
    pozostawieniu Gateway w chmurze.

    Hub: [Platformy](/pl/platforms). Dostęp zdalny: [Gateway remote](/pl/gateway/remote).
    Nodes: [Nodes](/pl/nodes), [Nodes CLI](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę poprosić OpenClaw, żeby sam się zaktualizował?">
    Krótka odpowiedź: **możliwe, ale niezalecane**. Przepływ aktualizacji może zrestartować
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

    Dokumentacja: [Update](/pl/cli/update), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Co właściwie robi onboarding?">
    `openclaw onboard` to zalecana ścieżka konfiguracji. W **trybie lokalnym** prowadzi przez:

    - **Konfigurację modelu/autoryzacji** (OAuth providera, klucze API, token konfiguracji Anthropic oraz lokalne opcje modeli, takie jak LM Studio)
    - Lokalizację **workspace** + pliki bootstrap
    - **Ustawienia Gateway** (bind/port/auth/tailscale)
    - **Kanały** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage oraz dołączone Pluginy kanałowe, takie jak QQ Bot)
    - **Instalację daemona** (LaunchAgent na macOS; jednostka użytkownika systemd na Linux/WSL2)
    - **Kontrole stanu** i wybór **Skills**

    Ostrzega także, jeśli skonfigurowany model jest nieznany albo brakuje dla niego autoryzacji.

  </Accordion>

  <Accordion title="Czy potrzebuję subskrypcji Claude lub OpenAI, żeby to uruchomić?">
    Nie. Możesz uruchomić OpenClaw z użyciem **kluczy API** (Anthropic/OpenAI/innych) albo z
    **modelami tylko lokalnymi**, aby Twoje dane pozostały na urządzeniu. Subskrypcje (Claude
    Pro/Max albo OpenAI Codex) są opcjonalnymi sposobami uwierzytelniania tych providerów.

    Dla Anthropic w OpenClaw praktyczny podział wygląda tak:

    - **Klucz API Anthropic**: zwykłe rozliczanie API Anthropic
    - **Claude CLI / autoryzacja subskrypcji Claude w OpenClaw**: pracownicy Anthropic
      poinformowali nas, że takie użycie jest znowu dozwolone, a OpenClaw traktuje użycie `claude -p`
      jako autoryzowane dla tej integracji, chyba że Anthropic opublikuje nową
      politykę

    Dla długotrwale działających hostów Gateway klucze API Anthropic są nadal
    bardziej przewidywalną konfiguracją. OAuth OpenAI Codex jest jawnie wspierany dla zewnętrznych
    narzędzi, takich jak OpenClaw.

    OpenClaw obsługuje także inne hostowane opcje w stylu subskrypcyjnym, w tym
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** oraz
    **Z.AI / GLM Coding Plan**.

    Dokumentacja: [Anthropic](/pl/providers/anthropic), [OpenAI](/pl/providers/openai),
    [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax), [Modele GLM](/pl/providers/glm),
    [Modele lokalne](/pl/gateway/local-models), [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać subskrypcji Claude Max bez klucza API?">
    Tak.

    Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc
    OpenClaw traktuje autoryzację subskrypcji Claude i użycie `claude -p` jako autoryzowane
    dla tej integracji, chyba że Anthropic opublikuje nową politykę. Jeśli chcesz
    najbardziej przewidywalnej konfiguracji po stronie serwera, zamiast tego użyj klucza API Anthropic.

  </Accordion>

  <Accordion title="Czy obsługujecie autoryzację subskrypcji Claude (Claude Pro lub Max)?">
    Tak.

    Pracownicy Anthropic poinformowali nas, że takie użycie jest znowu dozwolone, więc OpenClaw traktuje
    ponowne użycie Claude CLI i użycie `claude -p` jako autoryzowane dla tej integracji,
    chyba że Anthropic opublikuje nową politykę.

    Token konfiguracji Anthropic nadal pozostaje obsługiwaną ścieżką tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
    Dla produkcyjnych albo wieloużytkownikowych obciążeń autoryzacja kluczem API Anthropic nadal jest
    bezpieczniejszym i bardziej przewidywalnym wyborem. Jeśli chcesz innych hostowanych opcji
    w stylu subskrypcyjnym w OpenClaw, zobacz [OpenAI](/pl/providers/openai), [Qwen / Model
    Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Modele GLM](/pl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Dlaczego widzę HTTP 429 rate_limit_error od Anthropic?">
    Oznacza to, że Twój **limit/rate limit Anthropic** został wyczerpany w bieżącym oknie. Jeśli
    używasz **Claude CLI**, poczekaj na reset okna albo przejdź na wyższy plan. Jeśli
    używasz **klucza API Anthropic**, sprawdź Anthropic Console
    pod kątem użycia/rozliczeń i w razie potrzeby zwiększ limity.

    Jeśli komunikat brzmi dokładnie:
    `Extra usage is required for long context requests`, żądanie próbuje użyć
    bety 1M context Anthropic (`context1m: true`). To działa tylko wtedy, gdy Twoje
    poświadczenie kwalifikuje się do rozliczania long-context (rozliczanie kluczem API albo
    ścieżka logowania Claude w OpenClaw z włączonym Extra Usage).

    Wskazówka: ustaw **model zapasowy**, aby OpenClaw mógł nadal odpowiadać, gdy provider ma ograniczenie szybkości.
    Zobacz [Models](/pl/cli/models), [OAuth](/pl/concepts/oauth) oraz
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Czy AWS Bedrock jest obsługiwany?">
    Tak. OpenClaw ma dołączonego providera **Amazon Bedrock (Converse)**. Gdy obecne są znaczniki env AWS, OpenClaw może automatycznie wykryć katalog Bedrock dla streamingu/tekstu i scalić go jako niejawnego providera `amazon-bedrock`; w przeciwnym razie możesz jawnie włączyć `plugins.entries.amazon-bedrock.config.discovery.enabled` albo dodać ręczny wpis providera. Zobacz [Amazon Bedrock](/pl/providers/bedrock) i [Providerzy modeli](/pl/providers/models). Jeśli wolisz zarządzany przepływ kluczy, poprawną opcją pozostaje proxy zgodne z OpenAI przed Bedrock.
  </Accordion>

  <Accordion title="Jak działa autoryzacja Codex?">
    OpenClaw obsługuje **OpenAI Code (Codex)** przez OAuth (logowanie ChatGPT). Użyj
    `openai-codex/gpt-5.5` dla OAuth Codex przez domyślny runner PI. Użyj
    `openai/gpt-5.5` dla bezpośredniego dostępu z kluczem API OpenAI. GPT-5.5 może też używać
    subskrypcji/OAuth przez `openai-codex/gpt-5.5` albo natywnych uruchomień serwera aplikacji Codex
    z `openai/gpt-5.5` i `agentRuntime.id: "codex"`.
    Zobacz [Providerzy modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).
  </Accordion>

  <Accordion title="Dlaczego OpenClaw nadal wspomina openai-codex?">
    `openai-codex` to identyfikator providera i profilu autoryzacji dla OAuth ChatGPT/Codex.
    Jest to także jawny prefiks modelu PI dla OAuth Codex:

    - `openai/gpt-5.5` = bieżąca bezpośrednia trasa z kluczem API OpenAI w PI
    - `openai-codex/gpt-5.5` = trasa OAuth Codex w PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = natywna trasa serwera aplikacji Codex
    - `openai-codex:...` = identyfikator profilu autoryzacji, a nie odwołanie do modelu

    Jeśli chcesz bezpośrednią ścieżkę rozliczeń/limitów OpenAI Platform, ustaw
    `OPENAI_API_KEY`. Jeśli chcesz autoryzację subskrypcji ChatGPT/Codex, zaloguj się przez
    `openclaw models auth login --provider openai-codex` i używaj
    odwołań do modeli `openai-codex/*` dla uruchomień PI.

  </Accordion>

  <Accordion title="Dlaczego limity OAuth Codex mogą różnić się od ChatGPT w webie?">
    OAuth Codex używa zarządzanych przez OpenAI okien limitów zależnych od planu. W praktyce
    te limity mogą różnić się od doświadczenia na stronie/aplikacji ChatGPT, nawet gdy
    oba są powiązane z tym samym kontem.

    OpenClaw może pokazać obecnie widoczne okna użycia/limitów providera w
    `openclaw models status`, ale nie wymyśla ani nie normalizuje uprawnień ChatGPT-web
    do bezpośredniego dostępu API. Jeśli chcesz bezpośrednią ścieżkę rozliczeń/limitów OpenAI Platform,
    użyj `openai/*` z kluczem API.

  </Accordion>

  <Accordion title="Czy obsługujecie autoryzację subskrypcji OpenAI (OAuth Codex)?">
    Tak. OpenClaw w pełni obsługuje **subskrypcyjny OAuth OpenAI Code (Codex)**.
    OpenAI jawnie zezwala na użycie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy
    takich jak OpenClaw. Onboarding może uruchomić przepływ OAuth za Ciebie.

    Zobacz [OAuth](/pl/concepts/oauth), [Providerzy modeli](/pl/concepts/model-providers) i [Onboarding (CLI)](/pl/start/wizard).

  </Accordion>

  <Accordion title="Jak skonfigurować Gemini CLI OAuth?">
    Gemini CLI używa **przepływu autoryzacji Pluginu**, a nie identyfikatora klienta ani sekretu w `openclaw.json`.

    Kroki:

    1. Zainstaluj lokalnie Gemini CLI, tak aby `gemini` było na `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Włącz Plugin: `openclaw plugins enable google`
    3. Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Domyślny model po zalogowaniu: `google-gemini-cli/gemini-3-flash-preview`
    5. Jeśli żądania kończą się błędem, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway

    To zapisuje tokeny OAuth w profilach autoryzacji na hoście Gateway. Szczegóły: [Providerzy modeli](/pl/concepts/model-providers).

  </Accordion>

  <Accordion title="Czy model lokalny nadaje się do swobodnych czatów?">
    Zwykle nie. OpenClaw potrzebuje dużego kontekstu i silnych zabezpieczeń; małe modele ucinają kontekst i przepuszczają wycieki. Jeśli musisz, uruchom **największą** kompilację modelu, jaką możesz lokalnie (LM Studio), i zobacz [/gateway/local-models](/pl/gateway/local-models). Mniejsze/kwantyzowane modele zwiększają ryzyko prompt injection — zobacz [Bezpieczeństwo](/pl/gateway/security).
  </Accordion>

  <Accordion title="Jak utrzymać ruch hostowanych modeli w konkretnym regionie?">
    Wybieraj endpointy przypięte do regionu. OpenRouter udostępnia opcje hostowane w USA dla MiniMax, Kimi i GLM; wybierz wariant hostowany w USA, aby utrzymać dane w regionie. Nadal możesz wymienić Anthropic/OpenAI obok nich, używając `models.mode: "merge"`, aby fallbacki pozostały dostępne przy jednoczesnym respektowaniu wybranego providera regionalnego.
  </Accordion>

  <Accordion title="Czy muszę kupić Mac Mini, żeby to zainstalować?">
    Nie. OpenClaw działa na macOS lub Linuxie (Windows przez WSL2). Mac mini jest opcjonalny — niektórzy
    kupują go jako host działający zawsze, ale równie dobrze sprawdzi się mały VPS, serwer domowy albo urządzenie klasy Raspberry Pi.

    Mac jest potrzebny tylko do **narzędzi tylko dla macOS**. Dla iMessage użyj [BlueBubbles](/pl/channels/bluebubbles) (zalecane) — serwer BlueBubbles działa na dowolnym Macu, a Gateway może działać na Linuxie albo gdzie indziej. Jeśli chcesz innych narzędzi tylko dla macOS, uruchom Gateway na Macu albo sparuj Node macOS.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes), [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Czy potrzebuję Mac mini do obsługi iMessage?">
    Potrzebujesz **jakiegoś urządzenia macOS** zalogowanego do Messages. To **nie** musi być Mac mini —
    każdy Mac działa. **Użyj [BlueBubbles](/pl/channels/bluebubbles)** (zalecane) dla iMessage — serwer BlueBubbles działa na macOS, podczas gdy Gateway może działać na Linuxie lub gdzie indziej.

    Typowe konfiguracje:

    - Uruchamiaj Gateway na Linuxie/VPS, a serwer BlueBubbles na dowolnym Macu zalogowanym do Messages.
    - Uruchamiaj wszystko na Macu, jeśli chcesz najprostszą konfigurację na jednej maszynie.

    Dokumentacja: [BlueBubbles](/pl/channels/bluebubbles), [Nodes](/pl/nodes),
    [Tryb zdalny Mac](/pl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jeśli kupię Mac mini do uruchamiania OpenClaw, czy mogę połączyć go z moim MacBookiem Pro?">
    Tak. **Mac mini może uruchamiać Gateway**, a Twój MacBook Pro może połączyć się jako
    **Node** (urządzenie towarzyszące). Nodes nie uruchamiają Gateway — dostarczają dodatkowe
    możliwości, takie jak screen/camera/canvas i `system.run` na tym urządzeniu.

    Typowy wzorzec:

    - Gateway na Mac mini (zawsze włączony).
    - MacBook Pro uruchamia aplikację macOS albo hosta Node i paruje się z Gateway.
    - Użyj `openclaw nodes status` / `openclaw nodes list`, aby to zobaczyć.

    Dokumentacja: [Nodes](/pl/nodes), [Nodes CLI](/pl/cli/nodes).

  </Accordion>

  <Accordion title="Czy mogę używać Bun?">
    Bun **nie jest zalecany**. Widzimy błędy środowiska uruchomieniowego, szczególnie z WhatsApp i Telegram.
    Dla stabilnych Gateway używaj **Node**.

    Jeśli mimo to chcesz eksperymentować z Bun, rób to na nieprodukcyjnym Gateway
    bez WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: co wpisać do allowFrom?">
    `channels.telegram.allowFrom` to **Telegram user ID człowieka-nadawcy** (numeryczne). To nie jest nazwa użytkownika bota.

    Konfiguracja prosi tylko o numeryczne identyfikatory użytkowników. Jeśli masz już starsze wpisy `@username` w konfiguracji, `openclaw doctor --fix` może spróbować je rozwiązać.

    Bezpieczniej (bez bota zewnętrznego):

    - Wyślij DM do swojego bota, a następnie uruchom `openclaw logs --follow` i odczytaj `from.id`.

    Oficjalne Bot API:

    - Wyślij DM do swojego bota, a następnie wywołaj `https://api.telegram.org/bot<bot_token>/getUpdates` i odczytaj `message.from.id`.

    Zewnętrzne rozwiązanie (mniej prywatne):

    - Wyślij DM do `@userinfobot` lub `@getidsbot`.

    Zobacz [/channels/telegram](/pl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Czy wiele osób może używać jednego numeru WhatsApp z różnymi instancjami OpenClaw?">
    Tak, przez **trasowanie wielu agentów**. Powiąż WhatsApp **DM** każdego nadawcy (peer `kind: "direct"`, nadawca E.164 jak `+15551234567`) z innym `agentId`, aby każda osoba miała własny workspace i magazyn sesji. Odpowiedzi nadal będą pochodzić z **tego samego konta WhatsApp**, a kontrola dostępu do DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) jest globalna dla danego konta WhatsApp. Zobacz [Trasowanie wielu agentów](/pl/concepts/multi-agent) i [WhatsApp](/pl/channels/whatsapp).
  </Accordion>

  <Accordion title='Czy mogę uruchomić agenta „szybki czat” i agenta „Opus do kodowania”?'>
    Tak. Użyj trasowania wielu agentów: daj każdemu agentowi własny model domyślny, a następnie powiąż trasy przychodzące (konto providera lub konkretne peery) z każdym agentem. Przykładowa konfiguracja znajduje się w [Trasowaniu wielu agentów](/pl/concepts/multi-agent). Zobacz też [Modele](/pl/concepts/models) i [Konfiguracja](/pl/gateway/configuration).
  </Accordion>

  <Accordion title="Czy Homebrew działa na Linuxie?">
    Tak. Homebrew obsługuje Linux (Linuxbrew). Szybka konfiguracja:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jeśli uruchamiasz OpenClaw przez systemd, upewnij się, że PATH usługi zawiera `/home/linuxbrew/.linuxbrew/bin` (lub prefiks brew), aby narzędzia zainstalowane przez `brew` były rozwiązywane w powłokach niebędących powłokami logowania.
    Nowsze kompilacje dodają też na początku typowe katalogi bin użytkownika w usługach Linux systemd (na przykład `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) i respektują `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` oraz `FNM_DIR`, gdy są ustawione.

  </Accordion>

  <Accordion title="Różnica między instalacją hackable git a instalacją npm">
    - **Instalacja hackable (git):** pełny checkout kodu źródłowego, edytowalna, najlepsza dla współtwórców.
      Budujesz lokalnie i możesz poprawiać kod/dokumentację.
    - **Instalacja npm:** globalna instalacja CLI, bez repozytorium, najlepsza do „po prostu uruchom”.
      Aktualizacje pochodzą z dist-tagów npm.

    Dokumentacja: [Pierwsze kroki](/pl/start/getting-started), [Aktualizowanie](/pl/install/updating).

  </Accordion>

  <Accordion title="Czy mogę później przełączać się między instalacją npm a git?">
    Tak. Użyj `openclaw update --channel ...`, gdy OpenClaw jest już zainstalowany.
    To **nie usuwa Twoich danych** — zmienia tylko instalację kodu OpenClaw.
    Twój stan (`~/.openclaw`) i workspace (`~/.openclaw/workspace`) pozostają nietknięte.

    Z npm na git:

    ```bash
    openclaw update --channel dev
    ```

    Z git na npm:

    ```bash
    openclaw update --channel stable
    ```

    Dodaj `--dry-run`, aby najpierw zobaczyć planowane przełączenie trybu. Aktualizator uruchamia
    działania następcze Doctor, odświeża źródła Pluginów dla docelowego kanału i
    restartuje gateway, chyba że przekażesz `--no-restart`.

    Instalator też może wymusić dowolny tryb:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Wskazówki dotyczące kopii zapasowej: zobacz [Strategia kopii zapasowej](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Czy powinienem uruchamiać Gateway na laptopie czy na VPS?">
    Krótka odpowiedź: **jeśli chcesz niezawodności 24/7, użyj VPS**. Jeśli chcesz
    najmniejszych tarć i akceptujesz uśpienie/restarty, uruchamiaj lokalnie.

    **Laptop (lokalny Gateway)**

    - **Zalety:** brak kosztów serwera, bezpośredni dostęp do plików lokalnych, widoczne okno przeglądarki.
    - **Wady:** uśpienie/utrata sieci = rozłączenia, aktualizacje/rebooty systemu przerywają działanie, musi pozostać wybudzony.

    **VPS / chmura**

    - **Zalety:** zawsze włączony, stabilna sieć, brak problemów z uśpieniem laptopa, łatwiej utrzymać w działaniu.
    - **Wady:** często działanie bezgłowe (używaj zrzutów ekranu), tylko zdalny dostęp do plików, aktualizacje wymagają SSH.

    **Uwaga specyficzna dla OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord działają poprawnie z VPS. Jedyny realny kompromis to **przeglądarka bezgłowa** vs widoczne okno. Zobacz [Przeglądarka](/pl/tools/browser).

    **Zalecane domyślne ustawienie:** VPS, jeśli wcześniej miałeś rozłączenia Gateway. Tryb lokalny jest świetny, gdy aktywnie używasz Maca i chcesz lokalnego dostępu do plików albo automatyzacji UI z widoczną przeglądarką.

  </Accordion>

  <Accordion title="Jak ważne jest uruchamianie OpenClaw na dedykowanej maszynie?">
    Niewymagane, ale **zalecane dla niezawodności i izolacji**.

    - **Dedykowany host (VPS/Mac mini/Pi):** zawsze włączony, mniej przerw z powodu uśpienia/restartów, czystsze uprawnienia, łatwiej utrzymać działanie.
    - **Współdzielony laptop/desktop:** całkowicie w porządku do testów i aktywnego użycia, ale spodziewaj się pauz, gdy maszyna przechodzi w uśpienie albo się aktualizuje.

    Jeśli chcesz połączyć oba podejścia, trzymaj Gateway na dedykowanym hoście i sparuj laptop jako **Node** dla lokalnych narzędzi screen/camera/exec. Zobacz [Nodes](/pl/nodes).
    Wskazówki bezpieczeństwa znajdziesz w [Bezpieczeństwie](/pl/gateway/security).

  </Accordion>

  <Accordion title="Jakie są minimalne wymagania VPS i zalecany system operacyjny?">
    OpenClaw jest lekki. Dla podstawowego Gateway + jednego kanału czatu:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM, ~500MB dysku.
    - **Zalecane:** 1-2 vCPU, 2GB RAM lub więcej dla zapasu (logi, media, wiele kanałów). Narzędzia Node i automatyzacja przeglądarki mogą być zasobożerne.

    System operacyjny: używaj **Ubuntu LTS** (albo dowolnego nowoczesnego Debian/Ubuntu). Ścieżka instalacji dla Linuxa jest tam najlepiej przetestowana.

    Dokumentacja: [Linux](/pl/platforms/linux), [Hosting VPS](/pl/vps).

  </Accordion>

  <Accordion title="Czy mogę uruchomić OpenClaw w VM i jakie są wymagania?">
    Tak. Traktuj VM tak samo jak VPS: musi być zawsze włączona, osiągalna i mieć wystarczająco
    dużo RAM dla Gateway oraz wszystkich włączonych kanałów.

    Podstawowe wskazówki:

    - **Absolutne minimum:** 1 vCPU, 1GB RAM.
    - **Zalecane:** 2GB RAM lub więcej, jeśli uruchamiasz wiele kanałów, automatyzację przeglądarki albo narzędzia medialne.
    - **System operacyjny:** Ubuntu LTS albo inny nowoczesny Debian/Ubuntu.

    Jeśli używasz Windows, **WSL2 to najłatwiejsza konfiguracja w stylu VM** i ma najlepszą
    zgodność narzędziową. Zobacz [Windows](/pl/platforms/windows), [Hosting VPS](/pl/vps).
    Jeśli uruchamiasz macOS w VM, zobacz [macOS VM](/pl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ (modele, sesje, gateway, bezpieczeństwo i więcej)
- [Przegląd instalacji](/pl/install)
- [Pierwsze kroki](/pl/start/getting-started)
- [Rozwiązywanie problemów](/pl/help/troubleshooting)
