---
read_when:
    - OpenClaw nie działa i potrzebujesz najszybszej drogi do rozwiązania problemu
    - Potrzebujesz procesu triage, zanim przejdziesz do szczegółowych instrukcji operacyjnych
summary: Centrum rozwiązywania problemów OpenClaw oparte na objawach
title: Ogólne rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-20T09:59:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc5d8c9f804084985c672c5a003ce866e8142ab99fe81abb7a0d38e22aea4b88
    source_path: help/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów

Jeśli masz tylko 2 minuty, użyj tej strony jako punktu wejścia do triage.

## Pierwsze 60 sekund

Uruchom dokładnie tę sekwencję poleceń w podanej kolejności:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Prawidłowe wyjście w jednym wierszu:

- `openclaw status` → pokazuje skonfigurowane kanały i brak oczywistych błędów uwierzytelniania.
- `openclaw status --all` → pełny raport jest dostępny i nadaje się do udostępnienia.
- `openclaw gateway probe` → oczekiwany cel Gateway jest osiągalny (`Reachable: yes`). `Capability: ...` informuje, jaki poziom uwierzytelniania udało się potwierdzić sondą, a `Read probe: limited - missing scope: operator.read` oznacza pogorszoną diagnostykę, a nie błąd połączenia.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` i wiarygodny wiersz `Capability: ...`. Użyj `--require-rpc`, jeśli potrzebujesz także potwierdzenia RPC w zakresie odczytu.
- `openclaw doctor` → brak blokujących błędów konfiguracji/usługi.
- `openclaw channels status --probe` → osiągalny Gateway zwraca aktywny stan transportu dla każdego konta
  oraz wyniki sondy/audytu, takie jak `works` lub `audit ok`; jeśli
  Gateway jest nieosiągalny, polecenie przechodzi awaryjnie do podsumowań opartych wyłącznie na konfiguracji.
- `openclaw logs --follow` → stabilna aktywność, brak powtarzających się krytycznych błędów.

## Anthropic long context 429

Jeśli widzisz:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
przejdź do [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/pl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Lokalny backend zgodny z OpenAI działa bezpośrednio, ale nie działa w OpenClaw

Jeśli lokalny lub self-hosted backend `/v1` odpowiada na małe bezpośrednie
sondy `/v1/chat/completions`, ale kończy się błędem przy `openclaw infer model run` lub zwykłych
turach agenta:

1. Jeśli błąd wspomina o oczekiwaniu ciągu znaków w `messages[].content`, ustaw
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Jeśli backend nadal kończy się błędem tylko podczas tur agenta OpenClaw, ustaw
   `models.providers.<provider>.models[].compat.supportsTools: false` i spróbuj ponownie.
3. Jeśli małe bezpośrednie wywołania nadal działają, ale większe prompty OpenClaw powodują awarię
   backendu, potraktuj pozostały problem jako ograniczenie modelu/serwera po stronie upstream i
   przejdź dalej do szczegółowej instrukcji operacyjnej:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/pl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Instalacja Plugin kończy się błędem z brakującym openclaw extensions

Jeśli instalacja kończy się błędem `package.json missing openclaw.extensions`, pakiet Plugin
używa starej struktury, której OpenClaw już nie akceptuje.

Naprawa w pakiecie Plugin:

1. Dodaj `openclaw.extensions` do `package.json`.
2. Skieruj wpisy na zbudowane pliki runtime (zwykle `./dist/index.js`).
3. Opublikuj Plugin ponownie i uruchom `openclaw plugins install <package>` jeszcze raz.

Przykład:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Odniesienie: [Architektura Plugin](/pl/plugins/architecture)

## Drzewo decyzji

```mermaid
flowchart TD
  A[OpenClaw nie działa] --> B{Co psuje się najpierw}
  B --> C[Brak odpowiedzi]
  B --> D[Dashboard lub Control UI nie może się połączyć]
  B --> E[Gateway nie uruchamia się lub usługa nie działa]
  B --> F[Kanał łączy się, ale wiadomości nie przepływają]
  B --> G[Cron lub Heartbeat nie uruchomił się albo nic nie dostarczył]
  B --> H[Node jest sparowany, ale camera canvas screen exec kończy się błędem]
  B --> I[Narzędzie Browser kończy się błędem]

  C --> C1[/Sekcja Brak odpowiedzi/]
  D --> D1[/Sekcja Control UI/]
  E --> E1[/Sekcja Gateway/]
  F --> F1[/Sekcja przepływu kanałów/]
  G --> G1[/Sekcja automatyzacji/]
  H --> H1[/Sekcja narzędzi Node/]
  I --> I1[/Sekcja Browser/]
```

<AccordionGroup>
  <Accordion title="Brak odpowiedzi">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Prawidłowe wyjście wygląda tak:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` lub `admin-capable`
    - Twój kanał pokazuje podłączony transport i, tam gdzie to obsługiwane, `works` lub `audit ok` w `channels status --probe`
    - Nadawca jest oznaczony jako zatwierdzony (albo polityka DM jest otwarta/lista dozwolonych)

    Typowe sygnatury logów:

    - `drop guild message (mention required` → wymóg wzmianki zablokował wiadomość w Discord.
    - `pairing request` → nadawca nie jest zatwierdzony i czeka na zatwierdzenie parowania w DM.
    - `blocked` / `allowlist` w logach kanału → nadawca, pokój lub grupa są filtrowane.

    Szczegółowe strony:

    - [/gateway/troubleshooting#no-replies](/pl/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/pl/channels/troubleshooting)
    - [/channels/pairing](/pl/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard lub Control UI nie może się połączyć">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Prawidłowe wyjście wygląda tak:

    - `Dashboard: http://...` jest pokazane w `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` lub `admin-capable`
    - Brak pętli uwierzytelniania w logach

    Typowe sygnatury logów:

    - `device identity required` → HTTP/kontekst niezabezpieczony nie może zakończyć uwierzytelniania urządzenia.
    - `origin not allowed` → `Origin` przeglądarki nie jest dozwolony dla
      celu Gateway w Control UI.
    - `AUTH_TOKEN_MISMATCH` z podpowiedziami ponowienia (`canRetryWithDeviceToken=true`) → automatycznie może zostać wykonana jedna ponowna próba z zaufanym tokenem urządzenia.
    - Ta ponowna próba z tokenem z pamięci podręcznej używa tego samego zestawu zakresów zapisanego razem ze sparowanym
      tokenem urządzenia. Wywołania z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego
      żądany zestaw zakresów.
    - W asynchronicznej ścieżce Tailscale Serve dla Control UI nieudane próby dla tego samego
      `{scope, ip}` są serializowane, zanim limiter zarejestruje niepowodzenie, więc
      druga równoległa błędna próba może już pokazać `retry later`.
    - `too many failed authentication attempts (retry later)` z lokalnego
      źródła przeglądarki localhost → powtarzające się błędy z tego samego `Origin` są tymczasowo
      blokowane; inne źródło localhost używa osobnego koszyka.
    - powtarzające się `unauthorized` po tej ponownej próbie → zły token/hasło, niezgodność trybu uwierzytelniania lub nieaktualny sparowany token urządzenia.
    - `gateway connect failed:` → UI wskazuje zły URL/port albo nieosiągalny Gateway.

    Szczegółowe strony:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/pl/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway nie uruchamia się lub usługa jest zainstalowana, ale nie działa">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Prawidłowe wyjście wygląda tak:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` lub `admin-capable`

    Typowe sygnatury logów:

    - `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → tryb Gateway jest ustawiony na zdalny albo w pliku konfiguracji brakuje znacznika trybu lokalnego i należy go naprawić.
    - `refusing to bind gateway ... without auth` → bindowanie poza loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło lub `trusted-proxy`, jeśli skonfigurowano).
    - `another gateway instance is already listening` lub `EADDRINUSE` → port jest już zajęty.

    Szczegółowe strony:

    - [/gateway/troubleshooting#gateway-service-not-running](/pl/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/pl/gateway/background-process)
    - [/gateway/configuration](/pl/gateway/configuration)

  </Accordion>

  <Accordion title="Kanał łączy się, ale wiadomości nie przepływają">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Prawidłowe wyjście wygląda tak:

    - Transport kanału jest połączony.
    - Kontrole parowania/listy dozwolonych przechodzą pomyślnie.
    - Wzmianki są wykrywane tam, gdzie są wymagane.

    Typowe sygnatury logów:

    - `mention required` → blokada wymogu wzmianki w grupie zablokowała przetwarzanie.
    - `pairing` / `pending` → nadawca DM nie jest jeszcze zatwierdzony.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problem z tokenem uprawnień kanału.

    Szczegółowe strony:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/pl/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/pl/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron lub Heartbeat nie uruchomił się albo nic nie dostarczył">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Prawidłowe wyjście wygląda tak:

    - `cron.status` pokazuje, że jest włączony i ma następne wybudzenie.
    - `cron runs` pokazuje ostatnie wpisy `ok`.
    - Heartbeat jest włączony i nie znajduje się poza aktywnymi godzinami.

    Typowe sygnatury logów:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron jest wyłączony.
    - `heartbeat skipped` z `reason=quiet-hours` → poza skonfigurowanymi aktywnymi godzinami.
    - `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko pustą treść/szkielet nagłówków.
    - `heartbeat skipped` z `reason=no-tasks-due` → tryb zadań `HEARTBEAT.md` jest aktywny, ale żaden z interwałów zadań jeszcze nie jest należny.
    - `heartbeat skipped` z `reason=alerts-disabled` → cała widoczność Heartbeat jest wyłączona (`showOk`, `showAlerts` i `useIndicator` są wszystkie wyłączone).
    - `requests-in-flight` → główny tor jest zajęty; wybudzenie Heartbeat zostało odroczone.
    - `unknown accountId` → docelowe konto dostarczania Heartbeat nie istnieje.

    Szczegółowe strony:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/pl/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/pl/gateway/heartbeat)

    </Accordion>

    <Accordion title="Node jest sparowany, ale narzędzie kończy się błędem camera canvas screen exec">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Prawidłowe wyjście wygląda tak:

      - Node jest wymieniony jako połączony i sparowany dla roli `node`.
      - Istnieje Capability dla wywoływanego polecenia.
      - Stan uprawnień jest przyznany dla narzędzia.

      Typowe sygnatury logów:

      - `NODE_BACKGROUND_UNAVAILABLE` → przenieś aplikację Node na pierwszy plan.
      - `*_PERMISSION_REQUIRED` → uprawnienie systemowe zostało odrzucone/brakuje go.
      - `SYSTEM_RUN_DENIED: approval required` → zatwierdzenie exec oczekuje.
      - `SYSTEM_RUN_DENIED: allowlist miss` → polecenia nie ma na liście dozwolonych dla exec.

      Szczegółowe strony:

      - [/gateway/troubleshooting#node-paired-tool-fails](/pl/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/pl/nodes/troubleshooting)
      - [/tools/exec-approvals](/pl/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec nagle prosi o zatwierdzenie">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      Co się zmieniło:

      - Jeśli `tools.exec.host` nie jest ustawione, wartością domyślną jest `auto`.
      - `host=auto` rozstrzyga się do `sandbox`, gdy aktywne jest środowisko sandbox, w przeciwnym razie do `gateway`.
      - `host=auto` dotyczy tylko routingu; zachowanie bez potwierdzeń typu „YOLO” wynika z `security=full` wraz z `ask=off` na gateway/node.
      - Dla `gateway` i `node` brak ustawienia `tools.exec.security` oznacza domyślnie `full`.
      - Brak ustawienia `tools.exec.ask` oznacza domyślnie `off`.
      - W rezultacie: jeśli widzisz żądania zatwierdzenia, jakaś lokalna dla hosta lub specyficzna dla sesji polityka zaostrzyła reguły exec względem obecnych ustawień domyślnych.

      Przywróć bieżące domyślne zachowanie bez zatwierdzeń:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Bezpieczniejsze alternatywy:

      - Ustaw tylko `tools.exec.host=gateway`, jeśli chcesz po prostu stabilnego routingu hosta.
      - Użyj `security=allowlist` z `ask=on-miss`, jeśli chcesz exec na hoście, ale nadal chcesz przeglądu przy brakach na liście dozwolonych.
      - Włącz tryb sandbox, jeśli chcesz, aby `host=auto` ponownie rozstrzygał się do `sandbox`.

      Typowe sygnatury logów:

      - `Approval required.` → polecenie czeka na `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → zatwierdzenie exec na hoście Node oczekuje.
      - `exec host=sandbox requires a sandbox runtime for this session` → niejawny/jawny wybór sandbox, ale tryb sandbox jest wyłączony.

      Szczegółowe strony:

      - [/tools/exec](/pl/tools/exec)
      - [/tools/exec-approvals](/pl/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/pl/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="Narzędzie Browser kończy się błędem">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      Prawidłowe wyjście wygląda tak:

      - Status Browser pokazuje `running: true` oraz wybraną przeglądarkę/profil.
      - `openclaw` uruchamia się albo `user` widzi lokalne karty Chrome.

      Typowe sygnatury logów:

      - `unknown command "browser"` lub `unknown command 'browser'` → ustawiono `plugins.allow` i nie zawiera ono `browser`.
      - `Failed to start Chrome CDP on port` → nie udało się uruchomić lokalnej przeglądarki.
      - `browser.executablePath not found` → skonfigurowana ścieżka do binarki jest nieprawidłowa.
      - `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu.
      - `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy lub spoza zakresu port.
      - `No Chrome tabs found for profile="user"` → profil podłączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
      - `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny endpoint CDP jest nieosiągalny z tego hosta.
      - `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko do podłączenia nie ma aktywnego celu CDP.
      - nieaktualne nadpisania viewport / dark-mode / locale / offline na profilach tylko do podłączenia lub zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji bez restartowania Gateway.

      Szczegółowe strony:

      - [/gateway/troubleshooting#browser-tool-fails](/pl/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/pl/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/pl/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — często zadawane pytania
- [Gateway Troubleshooting](/pl/gateway/troubleshooting) — problemy specyficzne dla Gateway
- [Doctor](/pl/gateway/doctor) — zautomatyzowane kontrole kondycji i naprawy
- [Channel Troubleshooting](/pl/channels/troubleshooting) — problemy z łącznością kanałów
- [Automation Troubleshooting](/pl/automation/cron-jobs#troubleshooting) — problemy z Cron i Heartbeat
