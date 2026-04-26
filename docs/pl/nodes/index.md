---
read_when:
    - Parowanie Node iOS/Android z Gateway
    - Używanie canvas/camera Node jako kontekstu agenta
    - Dodawanie nowych poleceń Node lub pomocników CLI
summary: 'Nodes: parowanie, możliwości, uprawnienia i pomocniki CLI dla canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-26T11:35:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

**Node** to urządzenie towarzyszące (macOS/iOS/Android/headless), które łączy się z Gateway **WebSocket** (ten sam port co operatorzy) z `role: "node"` i udostępnia powierzchnię poleceń (np. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) przez `node.invoke`. Szczegóły protokołu: [Protokół Gateway](/pl/gateway/protocol).

Starszy transport: [Protokół Bridge](/pl/gateway/bridge-protocol) (TCP JSONL;
wyłącznie historyczny dla obecnych węzłów).

macOS może też działać w **trybie node**: aplikacja paska menu łączy się z serwerem
WS Gateway i udostępnia swoje lokalne polecenia canvas/camera jako node (więc
`openclaw nodes …` działa względem tego Maca). W trybie zdalnego gateway
automatyzację przeglądarki obsługuje host CLI node (`openclaw node run` lub
zainstalowana usługa node), a nie node natywnej aplikacji.

Uwagi:

- Węzły to **urządzenia peryferyjne**, a nie gatewaye. Nie uruchamiają usługi gateway.
- Wiadomości z Telegram/WhatsApp/itp. trafiają do **gateway**, a nie do węzłów.
- Instrukcja rozwiązywania problemów: [/nodes/troubleshooting](/pl/nodes/troubleshooting)

## Parowanie + status

**Węzły WS używają parowania urządzeń.** Węzły przedstawiają tożsamość urządzenia podczas `connect`; Gateway
tworzy żądanie parowania urządzenia dla `role: node`. Zatwierdź przez CLI urządzeń (lub interfejs UI).

Szybkie polecenia CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Jeśli węzeł ponowi próbę z zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie
oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Uruchom ponownie
`openclaw devices list` przed zatwierdzeniem.

Uwagi:

- `nodes status` oznacza węzeł jako **paired**, gdy jego rola parowania urządzenia obejmuje `node`.
- Rekord parowania urządzenia to trwały kontrakt zatwierdzonych ról. Rotacja
  tokena pozostaje w ramach tego kontraktu; nie może zmienić sparowanego węzła na
  inną rolę, której zatwierdzenie parowania nigdy nie przyznało.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) to oddzielny, należący do gateway
  magazyn parowania węzłów; **nie** steruje on uzgadnianiem WS `connect`.
- Zakres zatwierdzenia zależy od poleceń zadeklarowanych w oczekującym żądaniu:
  - żądanie bez poleceń: `operator.pairing`
  - polecenia node bez exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Zdalny host node (`system.run`)

Użyj **hosta node**, gdy Gateway działa na jednej maszynie, a chcesz, aby polecenia
były wykonywane na innej. Model nadal komunikuje się z **gateway**; gateway
przekazuje wywołania `exec` do **hosta node**, gdy wybrano `host=node`.

### Co działa gdzie

- **Host Gateway**: odbiera wiadomości, uruchamia model, kieruje wywołaniami narzędzi.
- **Host node**: wykonuje `system.run`/`system.which` na maszynie węzła.
- **Zatwierdzenia**: wymuszane na hoście node przez `~/.openclaw/exec-approvals.json`.

Uwaga dotycząca zatwierdzeń:

- Uruchomienia node oparte na zatwierdzeniach wiążą dokładny kontekst żądania.
- W przypadku bezpośrednich wykonań powłoki/środowiska uruchomieniowego plików OpenClaw dodatkowo w miarę możliwości wiąże jeden konkretny lokalny
  operand pliku i odrzuca uruchomienie, jeśli ten plik zmieni się przed wykonaniem.
- Jeśli OpenClaw nie może zidentyfikować dokładnie jednego konkretnego lokalnego pliku dla polecenia interpretera/środowiska uruchomieniowego,
  wykonanie oparte na zatwierdzeniu jest odrzucane zamiast udawania pełnego pokrycia środowiska uruchomieniowego. Użyj sandboxingu,
  oddzielnych hostów albo jawnej zaufanej listy dozwolonych elementów/pełnego przepływu pracy dla szerszej semantyki interpretera.

### Uruchamianie hosta node (na pierwszym planie)

Na maszynie węzła:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Zdalny gateway przez tunel SSH (powiązanie loopback)

Jeśli Gateway nasłuchuje na loopback (`gateway.bind=loopback`, domyślnie w trybie lokalnym),
zdalne hosty node nie mogą łączyć się bezpośrednio. Utwórz tunel SSH i skieruj
hosta node na lokalny koniec tunelu.

Przykład (host node -> host gateway):

```bash
# Terminal A (pozostaw uruchomiony): przekieruj lokalny 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: wyeksportuj token gateway i połącz przez tunel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Uwagi:

- `openclaw node run` obsługuje uwierzytelnianie tokenem lub hasłem.
- Preferowane są zmienne środowiskowe: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Zapasowa konfiguracja to `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host node celowo ignoruje `gateway.remote.token` / `gateway.remote.password`.
- W trybie zdalnym `gateway.remote.token` / `gateway.remote.password` kwalifikują się zgodnie z regułami pierwszeństwa dla trybu zdalnego.
- Jeśli skonfigurowano aktywne lokalne SecretRefs `gateway.auth.*`, ale nie zostały rozwiązane, uwierzytelnianie hosta node kończy się odmową.
- Rozwiązywanie uwierzytelniania hosta node uwzględnia tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

### Uruchamianie hosta node (usługa)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Parowanie + nazwa

Na hoście gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Jeśli węzeł ponowi próbę z zmienionymi danymi uwierzytelniania, uruchom ponownie `openclaw devices list`
i zatwierdź bieżący `requestId`.

Opcje nazewnictwa:

- `--display-name` w `openclaw node run` / `openclaw node install` (utrwalane w `~/.openclaw/node.json` na węźle).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (nadpisanie po stronie gateway).

### Dodawanie poleceń do listy dozwolonych

Zatwierdzenia exec są **przypisane do konkretnego hosta node**. Dodaj wpisy listy dozwolonych z poziomu gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Zatwierdzenia znajdują się na hoście node w `~/.openclaw/exec-approvals.json`.

### Kierowanie exec do węzła

Skonfiguruj wartości domyślne (konfiguracja gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Lub dla sesji:

```
/exec host=node security=allowlist node=<id-or-name>
```

Po ustawieniu każde wywołanie `exec` z `host=node` działa na hoście node (z zastrzeżeniem
listy dozwolonych/zatwierdzeń węzła).

`host=auto` nie wybierze automatycznie węzła samodzielnie, ale jawne żądanie `host=node` dla pojedynczego wywołania jest dozwolone z `auto`. Jeśli chcesz, aby exec na węźle był domyślny dla sesji, ustaw jawnie `tools.exec.host=node` lub `/exec host=node ...`.

Powiązane:

- [CLI hosta node](/pl/cli/node)
- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Wywoływanie poleceń

Niski poziom (surowe RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Istnieją też pomocnicze polecenia wyższego poziomu dla typowych przepływów pracy „przekaż agentowi załącznik MEDIA”.

## Zrzuty ekranu (migawki canvas)

Jeśli węzeł wyświetla Canvas (WebView), `canvas.snapshot` zwraca `{ format, base64 }`.

Pomocnik CLI (zapisuje do pliku tymczasowego i wypisuje `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Sterowanie Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Uwagi:

- `canvas present` akceptuje adresy URL lub lokalne ścieżki plików (`--target`), a także opcjonalne `--x/--y/--width/--height` do pozycjonowania.
- `canvas eval` akceptuje JS inline (`--js`) albo argument pozycyjny.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Uwagi:

- Obsługiwany jest tylko A2UI v0.8 JSONL (v0.9/createSurface jest odrzucane).

## Zdjęcia + wideo (kamera node)

Zdjęcia (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # domyślnie: obie strony (2 wiersze MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Klipy wideo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Uwagi:

- Węzeł musi działać **na pierwszym planie** dla `canvas.*` i `camera.*` (wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`).
- Czas trwania klipu jest ograniczany (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków base64.
- Android poprosi o uprawnienia `CAMERA`/`RECORD_AUDIO`, gdy to możliwe; odrzucone uprawnienia kończą się błędem `*_PERMISSION_REQUIRED`.

## Nagrania ekranu (węzły)

Obsługiwane węzły udostępniają `screen.record` (mp4). Przykład:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Uwagi:

- Dostępność `screen.record` zależy od platformy węzła.
- Nagrania ekranu są ograniczane do `<= 60s`.
- `--no-audio` wyłącza przechwytywanie mikrofonu na obsługiwanych platformach.
- Użyj `--screen <index>`, aby wybrać ekran, gdy dostępnych jest kilka ekranów.

## Lokalizacja (węzły)

Węzły udostępniają `location.get`, gdy lokalizacja jest włączona w ustawieniach.

Pomocnik CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Uwagi:

- Lokalizacja jest **domyślnie wyłączona**.
- „Always” wymaga uprawnienia systemowego; pobieranie w tle działa na zasadzie best-effort.
- Odpowiedź zawiera szer./dł. geogr., dokładność (w metrach) i znacznik czasu.

## SMS (węzły Android)

Węzły Android mogą udostępniać `sms.send`, gdy użytkownik przyzna uprawnienie **SMS**, a urządzenie obsługuje telefonię.

Wywołanie niskopoziomowe:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Uwagi:

- Monit o uprawnienie musi zostać zaakceptowany na urządzeniu Android, zanim funkcja zostanie ogłoszona.
- Urządzenia tylko z Wi‑Fi bez obsługi telefonii nie będą ogłaszać `sms.send`.

## Polecenia urządzenia Android + danych osobistych

Węzły Android mogą ogłaszać dodatkowe rodziny poleceń, gdy odpowiednie możliwości są włączone.

Dostępne rodziny:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Przykładowe wywołania:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Uwagi:

- Polecenia ruchu są ograniczane przez dostępne czujniki.

## Polecenia systemowe (host node / mac node)

Węzeł macOS udostępnia `system.run`, `system.notify` i `system.execApprovals.get/set`.
Headless host node udostępnia `system.run`, `system.which` i `system.execApprovals.get/set`.

Przykłady:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Uwagi:

- `system.run` zwraca stdout/stderr/kod wyjścia w ładunku.
- Wykonanie powłoki odbywa się teraz przez narzędzie `exec` z `host=node`; `nodes` pozostaje bezpośrednią powierzchnią RPC dla jawnych poleceń node.
- `nodes invoke` nie udostępnia `system.run` ani `system.run.prepare`; pozostają one wyłącznie na ścieżce exec.
- Ścieżka exec przygotowuje kanoniczny `systemRunPlan` przed zatwierdzeniem. Gdy
  zatwierdzenie zostanie przyznane, gateway przekazuje ten zapisany plan, a nie żadne później
  zmienione przez wywołującego pola command/cwd/session.
- `system.notify` uwzględnia stan uprawnień powiadomień w aplikacji macOS.
- Nierozpoznane metadane node `platform` / `deviceFamily` używają konserwatywnej domyślnej listy dozwolonych poleceń, która wyklucza `system.run` i `system.which`. Jeśli celowo potrzebujesz tych poleceń dla nieznanej platformy, dodaj je jawnie przez `gateway.nodes.allowCommands`.
- `system.run` obsługuje `--cwd`, `--env KEY=VAL`, `--command-timeout` i `--needs-screen-recording`.
- Dla wrapperów powłoki (`bash|sh|zsh ... -c/-lc`) wartości `--env` o zakresie żądania są redukowane do jawnej listy dozwolonych (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- W przypadku decyzji allow-always w trybie listy dozwolonych znane wrappery dyspozycji (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają wewnętrzne ścieżki plików wykonywalnych zamiast ścieżek wrapperów. Jeśli rozpakowanie nie jest bezpieczne, żaden wpis listy dozwolonych nie jest utrwalany automatycznie.
- Na hostach node Windows w trybie listy dozwolonych uruchomienia wrappera powłoki przez `cmd.exe /c` wymagają zatwierdzenia (sam wpis na liście dozwolonych nie powoduje automatycznego zezwolenia na formę wrappera).
- `system.notify` obsługuje `--priority <passive|active|timeSensitive>` i `--delivery <system|overlay|auto>`.
- Hosty node ignorują nadpisania `PATH` i usuwają niebezpieczne klucze startowe/powłoki (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Jeśli potrzebujesz dodatkowych wpisów PATH, skonfiguruj środowisko usługi hosta node (lub zainstaluj narzędzia w standardowych lokalizacjach) zamiast przekazywać `PATH` przez `--env`.
- W trybie macOS node `system.run` jest ograniczane przez zatwierdzenia exec w aplikacji macOS (Ustawienia → Exec approvals).
  Ask/allowlist/full działają tak samo jak w headless hoście node; odrzucone prompty zwracają `SYSTEM_RUN_DENIED`.
- W headless hoście node `system.run` jest ograniczane przez zatwierdzenia exec (`~/.openclaw/exec-approvals.json`).

## Powiązanie exec z node

Gdy dostępnych jest wiele węzłów, możesz powiązać exec z określonym węzłem.
Ustawia to domyślny węzeł dla `exec host=node` (i może zostać nadpisane dla agenta).

Domyślnie globalnie:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Nadpisanie dla agenta:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Usuń ustawienie, aby zezwolić na dowolny węzeł:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa uprawnień

Węzły mogą zawierać mapę `permissions` w `node.list` / `node.describe`, z kluczami będącymi nazwami uprawnień (np. `screenRecording`, `accessibility`) i wartościami logicznymi (`true` = przyznane).

## Headless host node (wieloplatformowy)

OpenClaw może uruchamiać **headless host node** (bez interfejsu UI), który łączy się z Gateway
WebSocket i udostępnia `system.run` / `system.which`. Jest to przydatne na Linux/Windows
lub do uruchamiania minimalnego węzła obok serwera.

Uruchamianie:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Uwagi:

- Parowanie jest nadal wymagane (Gateway pokaże prompt parowania urządzenia).
- Host node przechowuje swój identyfikator node, token, nazwę wyświetlaną i informacje o połączeniu z gateway w `~/.openclaw/node.json`.
- Zatwierdzenia exec są wymuszane lokalnie przez `~/.openclaw/exec-approvals.json`
  (zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals)).
- Na macOS headless host node domyślnie wykonuje `system.run` lokalnie. Ustaw
  `OPENCLAW_NODE_EXEC_HOST=app`, aby kierować `system.run` przez host exec aplikacji towarzyszącej; dodaj
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, aby wymagać hosta aplikacji i kończyć się odmową, jeśli jest niedostępny.
- Dodaj `--tls` / `--tls-fingerprint`, gdy Gateway WS używa TLS.

## Tryb macOS node

- Aplikacja paska menu macOS łączy się z serwerem Gateway WS jako node (więc `openclaw nodes …` działa względem tego Maca).
- W trybie zdalnym aplikacja otwiera tunel SSH dla portu Gateway i łączy się z `localhost`.
