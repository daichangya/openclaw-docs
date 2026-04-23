---
read_when:
    - Implementowanie lub aktualizowanie klientów Gateway WS
    - Debugowanie niedopasowań protokołu lub błędów połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół Gateway WebSocket: handshake, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-23T10:01:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokół Gateway (WebSocket)

Protokół Gateway WS to **pojedyncza płaszczyzna sterowania + transport Node** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, Node iOS/Android, Node
bezgłowe) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** w
momencie handshake.

## Transport

- WebSocket, ramki tekstowe z ładunkiem JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym handshake klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia
  `payload.large`, zanim gateway zamknie połączenie lub odrzuci daną ramkę. Zdarzenia te zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody przyczyn. Nie zachowują
  treści wiadomości, zawartości załączników, surowej treści ramki, tokenów, cookies ani wartości sekretów.

## Handshake (connect)

Gateway → klient (wyzwanie przed połączeniem):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Klient → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → klient:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` i `policy` są wymagane przez schemat
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` jest opcjonalne. `auth`
zgłasza wynegocjowaną rolę/zakresy, gdy są dostępne, i zawiera `deviceToken`,
gdy gateway go wystawi.

Gdy token urządzenia nie jest wystawiany, `hello-ok.auth` nadal może zgłaszać wynegocjowane
uprawnienia:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Gdy token urządzenia jest wystawiany, `hello-ok` zawiera także:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Podczas przekazania zaufanego bootstrapu `hello-ok.auth` może także zawierać dodatkowe
ograniczone wpisy ról w `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Dla wbudowanego przepływu bootstrapu Node/operator podstawowy token Node pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do allowlisty operatora bootstrapu (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresu bootstrapu pozostają
prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal potrzebują zakresów pod własnym prefiksem roli.

### Przykład Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Ramkowanie

- **Żądanie**: `{type:"req", id, method, params}`
- **Odpowiedź**: `{type:"res", id, ok, payload|error}`
- **Zdarzenie**: `{type:"event", event, payload, seq?, stateVersion?}`

Metody powodujące skutki uboczne wymagają **kluczy idempotencji** (zobacz schemat).

## Role + zakresy

### Role

- `operator` = klient płaszczyzny sterowania (CLI/UI/automatyzacja).
- `node` = host możliwości (`camera`/`screen`/`canvas`/`system.run`).

### Zakresy (operator)

Typowe zakresy:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` z `includeSecrets: true` wymaga `operator.talk.secrets`
(lub `operator.admin`).

Metody Gateway RPC rejestrowane przez Pluginy mogą żądać własnego zakresu operatora, ale
zastrzeżone główne prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązują się do `operator.admin`.

Zakres metody to tylko pierwsza bramka. Niektóre polecenia slash osiągane przez
`chat.send` nakładają dodatkowo bardziej rygorystyczne kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma też dodatkową kontrolę zakresu w chwili zatwierdzania ponad
bazowy zakres metody:

- żądania bez poleceń: `operator.pairing`
- żądania z poleceniami Node innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node deklarują roszczenia możliwości przy połączeniu:

- `caps`: wysokopoziomowe kategorie możliwości.
- `commands`: allowlista poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (na przykład `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i wymusza allowlisty po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, aby UI mogły pokazywać jeden wiersz na urządzenie,
  nawet gdy łączy się ono jednocześnie jako **operator** i **node**.

## Ograniczanie zakresu zdarzeń broadcast

Zdarzenia broadcast WebSocket wypychane przez serwer są ograniczane zakresem, aby sesje o zakresie pairing lub tylko-Node nie otrzymywały pasywnie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Broadcasty `plugin.*` definiowane przez Pluginy** są ograniczane do `operator.write` lub `operator.admin`, zależnie od tego, jak Plugin je zarejestrował.
- **Zdarzenia stanu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia połączenia/rozłączenia itd.) pozostają bez ograniczeń, aby kondycja transportu była obserwowalna dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie ograniczane zakresem (fail-closed), chyba że zarejestrowany handler jawnie to złagodzi.

Każde połączenie klienta utrzymuje własny numer sekwencji per klient, aby broadcasty zachowywały monotoniczną kolejność na tym gnieździe, nawet gdy różni klienci widzą różne podzbiory strumienia zdarzeń odfiltrowane według zakresu.

## Typowe rodziny metod RPC

Ta strona nie jest wygenerowanym pełnym zrzutem, ale publiczna powierzchnia WS jest szersza
niż powyższe przykłady handshake/auth. To główne rodziny metod, które
Gateway udostępnia obecnie.

`hello-ok.features.methods` to zachowawcza lista wykrywania budowana z
`src/gateway/server-methods-list.ts` oraz wyeksportowanych metod załadowanych Pluginów/kanałów.
Traktuj ją jako wykrywanie możliwości, a nie jako wygenerowany zrzut każdej wywoływalnej funkcji pomocniczej
zaimplementowanej w `src/gateway/server-methods/*.ts`.

### System i tożsamość

- `health` zwraca buforowany lub świeżo sondowany snapshot kondycji gateway.
- `diagnostics.stability` zwraca ostatni ograniczony rejestr stabilności diagnostycznej. Przechowuje metadane operacyjne, takie jak nazwy zdarzeń, liczności, rozmiary bajtowe, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/Pluginów i identyfikatory sesji. Nie przechowuje tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies ani wartości sekretów. Wymagany jest zakres odczytu operatora.
- `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są uwzględniane tylko dla klientów operatora z zakresem admin.
- `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i pairing.
- `system-presence` zwraca bieżący snapshot obecności dla połączonych urządzeń operator/node.
- `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst obecności.
- `last-heartbeat` zwraca najnowsze utrwalone zdarzenie Heartbeat.
- `set-heartbeats` przełącza przetwarzanie Heartbeat w gateway.

### Modele i użycie

- `models.list` zwraca katalog modeli dozwolonych w runtime.
- `usage.status` zwraca okna użycia dostawców/podsumowania pozostałego limitu.
- `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
- `doctor.memory.status` zwraca gotowość pamięci wektorowej / embeddingów dla aktywnego domyślnego workspace agenta.
- `sessions.usage` zwraca podsumowania użycia per sesja.
- `sessions.usage.timeseries` zwraca szeregi czasowe użycia dla jednej sesji.
- `sessions.usage.logs` zwraca wpisy logów użycia dla jednej sesji.

### Kanały i pomocniki logowania

- `channels.status` zwraca podsumowania stanu wbudowanych + bundled kanałów/Pluginów.
- `channels.logout` wylogowuje określony kanał/konto tam, gdzie kanał obsługuje wylogowanie.
- `web.login.start` rozpoczyna przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
- `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i po sukcesie uruchamia kanał.
- `push.test` wysyła testowy push APNs do zarejestrowanego Node iOS.
- `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzającego.
- `voicewake.set` aktualizuje wyzwalacze słowa wybudzającego i rozgłasza zmianę.

### Wiadomości i logi

- `send` to bezpośredni RPC dostarczania wychodzącego dla wysyłek skierowanych do kanału/konta/wątku poza runnerem czatu.
- `logs.tail` zwraca skonfigurowany tail logu plikowego gateway z kontrolą kursora/limitu i maksymalnej liczby bajtów.

### Talk i TTS

- `talk.config` zwraca skuteczny payload konfiguracji Talk; `includeSecrets`
  wymaga `operator.talk.secrets` (lub `operator.admin`).
- `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
- `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
- `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców fallback oraz stan konfiguracji dostawców.
- `tts.providers` zwraca widoczny spis dostawców TTS.
- `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
- `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
- `tts.convert` uruchamia jednorazową konwersję tekst-na-mowę.

### Sekrety, konfiguracja, aktualizacja i kreator

- `secrets.reload` ponownie rozwiązuje aktywne SecretRefs i podmienia stan sekretów runtime
  tylko przy pełnym sukcesie.
- `secrets.resolve` rozwiązuje przypisania sekretów skierowane do polecenia dla określonego
  zestawu poleceń/celów.
- `config.get` zwraca bieżący snapshot konfiguracji i hash.
- `config.set` zapisuje zwalidowany payload konfiguracji.
- `config.patch` scala częściową aktualizację konfiguracji.
- `config.apply` waliduje + zastępuje pełny payload konfiguracji.
- `config.schema` zwraca aktywny payload schematu konfiguracji używany przez Control UI i
  narzędzia CLI: schemat, `uiHints`, wersję i metadane generowania, w tym
  metadane schematu Pluginów + kanałów, gdy runtime może je załadować. Schemat
  zawiera metadane pól `title` / `description` wyprowadzone z tych samych etykiet
  i tekstów pomocy używanych przez UI, w tym dla zagnieżdżonych obiektów, wildcardów, elementów tablic
  oraz gałęzi kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca
  dokumentacja pola.
- `config.schema.lookup` zwraca payload wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji:
  znormalizowaną ścieżkę, płytki węzeł schematu, dopasowany hint + `hintPath`, oraz
  podsumowania bezpośrednich elementów podrzędnych dla drill-down w UI/CLI.
  - Węzły schematu lookup zachowują dokumentację widoczną dla użytkownika i typowe pola walidacji:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    ograniczenia numeryczne/ciągów/tablic/obiektów oraz flagi boolean takie jak
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Podsumowania elementów podrzędnych pokazują `key`, znormalizowaną `path`, `type`, `required`,
    `hasChildren`, a także dopasowany `hint` / `hintPath`.
- `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy,
  gdy sama aktualizacja zakończyła się sukcesem.
- `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają
  kreator onboardingu przez WS RPC.

### Istniejące główne rodziny

#### Pomocniki agenta i workspace

- `agents.list` zwraca skonfigurowane wpisy agentów.
- `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz
  połączeniami workspace.
- `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają
  plikami bootstrap workspace udostępnianymi dla agenta.
- `agent.identity.get` zwraca skuteczną tożsamość asystenta dla agenta lub
  sesji.
- `agent.wait` czeka na zakończenie przebiegu i zwraca końcowy snapshot, gdy
  jest dostępny.

#### Sterowanie sesją

- `sessions.list` zwraca bieżący indeks sesji.
- `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji
  dla bieżącego klienta WS.
- `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają
  subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
- `sessions.preview` zwraca ograniczone podglądy transkryptu dla określonych
  kluczy sesji.
- `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
- `sessions.create` tworzy nowy wpis sesji.
- `sessions.send` wysyła wiadomość do istniejącej sesji.
- `sessions.steer` to wariant przerwania i sterowania dla aktywnej sesji.
- `sessions.abort` przerywa aktywną pracę dla sesji.
- `sessions.patch` aktualizuje metadane/nadpisania sesji.
- `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują konserwację
  sesji.
- `sessions.get` zwraca pełny zapisany wiersz sesji.
- wykonanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i
  `chat.inject`.
- `chat.history` jest normalizowane pod kątem wyświetlania dla klientów UI: osadzone tagi dyrektyw są
  usuwane z widocznego tekstu, payloady XML wywołań narzędzi w postaci zwykłego tekstu (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  przycięte bloki wywołań narzędzi) i wyciekłe tokeny sterujące modelem ASCII/full-width
  są usuwane, czyste wiersze asystenta z samym cichym tokenem, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami.

#### Pairing urządzeń i tokeny urządzeń

- `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
- `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają
  rekordami pairingu urządzeń.
- `device.token.rotate` obraca token sparowanego urządzenia w granicach jego zatwierdzonej roli
  i zakresów.
- `device.token.revoke` unieważnia token sparowanego urządzenia.

#### Pairing Node, invoke i oczekująca praca

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` i `node.pair.verify` obejmują pairing Node i
  weryfikację bootstrapu.
- `node.list` i `node.describe` zwracają stan znanych/połączonych Node.
- `node.rename` aktualizuje etykietę sparowanego Node.
- `node.invoke` przekazuje polecenie do połączonego Node.
- `node.invoke.result` zwraca wynik żądania invoke.
- `node.event` przenosi zdarzenia pochodzące z Node z powrotem do gateway.
- `node.canvas.capability.refresh` odświeża tokeny możliwości canvas ograniczone zakresem.
- `node.pending.pull` i `node.pending.ack` to API kolejki połączonego Node.
- `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą
  dla Node offline/rozłączonych.

#### Rodziny approval

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i
  `exec.approval.resolve` obejmują jednorazowe żądania approval exec oraz
  wyszukiwanie/ponowne odtwarzanie oczekujących approval.
- `exec.approval.waitDecision` czeka na jedną oczekującą approval exec i zwraca
  ostateczną decyzję (lub `null` przy timeout).
- `exec.approvals.get` i `exec.approvals.set` zarządzają snapshotami polityki approval exec
  gateway.
- `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla Node polityką approval
  exec przez polecenia relay Node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują
  przepływy approval definiowane przez Pluginy.

#### Inne główne rodziny

- automatyzacja:
  - `wake` planuje natychmiastowe lub przy następnym Heartbeat wstrzyknięcie tekstu wybudzenia
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  dotyczące wyłącznie transkryptu.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje snapshotu obecności systemu.
- `tick`: okresowe zdarzenie keepalive / liveness.
- `health`: aktualizacja snapshotu kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany przebiegu/zadania Cron.
- `shutdown`: powiadomienie o wyłączeniu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia pairingu Node.
- `node.invoke.request`: broadcast żądania invoke Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniła się konfiguracja wyzwalacza słowa wybudzającego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia
  approval exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia approval Pluginu.

### Metody pomocnicze Node

- Node mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych Skills
  do automatycznych kontroli allowlisty.

### Metody pomocnicze operatora

- Operatorzy mogą wywoływać `commands.list` (`operator.read`), aby pobrać spis poleceń runtime
  dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny workspace agenta.
  - `scope` kontroluje, którą powierzchnię wskazuje główne `name`:
    - `text` zwraca główny token polecenia tekstowego bez wiodącego `/`
    - `native` i domyślna ścieżka `both` zwracają nazwy natywne zależne od dostawcy,
      gdy są dostępne
  - `textAliases` zawiera dokładne aliasy slash, takie jak `/model` i `/m`.
  - `nativeName` zawiera nazwę natywną zależną od dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych poleceń Pluginów.
  - `includeArgs=false` pomija zserializowane metadane argumentów w odpowiedzi.
- Operatorzy mogą wywoływać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi runtime dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel Pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie Pluginu jest opcjonalne
- Operatorzy mogą wywoływać `tools.effective` (`operator.read`), aby pobrać skuteczny w runtime
  spis narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime po stronie serwera z sesji zamiast akceptować
    podawany przez wywołującego kontekst uwierzytelniania lub dostarczania.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna rozmowa może używać teraz,
    w tym narzędzi core, Pluginów i kanałów.
- Operatorzy mogą wywoływać `skills.status` (`operator.read`), aby pobrać widoczny
  spis Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny workspace agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz
    sanityzowane opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywoływać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych wykrywania ClawHub.
- Operatorzy mogą wywoływać `skills.install` (`operator.admin`) w dwóch trybach:
  - tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder Skill do katalogu `skills/` domyślnego workspace agenta.
  - tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywoływać `skills.update` (`operator.admin`) w dwóch trybach:
  - tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym workspace agenta.
  - tryb config łata wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

## Approval exec

- Gdy żądanie exec wymaga approval, gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozwiązują to przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po approval przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między prepare a końcowym zatwierdzonym przekazaniem `system.run`,
  gateway odrzuca przebieg zamiast ufać zmodyfikowanemu payloadowi.

## Zapasowe dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` utrzymuje ścisłe zachowanie: nierozwiązane lub tylko wewnętrzne cele dostarczenia zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala wrócić do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej dostarczalnej trasy (na przykład sesje internal/webchat lub niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niedopasowania.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Referencyjny klient w `src/gateway/client.ts` używa tych wartości domyślnych. Wartości te są
stabilne w całym protokole v3 i stanowią oczekiwaną bazę dla klientów zewnętrznych.

| Stała                                     | Domyślna wartość                                      | Źródło                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Limit czasu preauth / connect-challenge   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Początkowy backoff ponownego połączenia   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maksymalny backoff ponownego połączenia   | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Ograniczenie szybkiej ponownej próby po zamknięciu z tokenem urządzenia | `250` ms                                  | `src/gateway/client.ts`                                    |
| Grace period wymuszonego zatrzymania przed `terminate()` | `250` ms                                  | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Zamknięcie przy limicie czasu tick        | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Serwer ogłasza skuteczne wartości `policy.tickIntervalMs`, `policy.maxPayload`
i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości
zamiast domyślnych wartości sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie gateway przez współdzielony sekret używa `connect.params.auth.token` lub
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) lub `gateway.auth.mode: "trusted-proxy"` dla połączeń innych niż loopback,
  spełniają kontrolę uwierzytelniania connect na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress z `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect przez współdzielony sekret; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wystawia **token urządzenia** ograniczony do roli + zakresów
  połączenia. Jest zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalany przez klienta do przyszłych połączeń.
- Klienci powinni utrwalać podstawowy `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z użyciem tego **zapisanego** tokenu urządzenia powinno także ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to już przyznany dostęp
  do odczytu/sond/statusu i pozwala uniknąć cichego zawężenia ponownych połączeń do
  węższego, domyślnie tylko administracyjnego zakresu.
- Składanie uwierzytelniania connect po stronie klienta (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest ortogonalne i zawsze jest przekazywane, gdy jest ustawione.
  - `auth.token` jest uzupełniane w kolejności priorytetów: najpierw jawny współdzielony token,
    potem jawny `deviceToken`, a następnie zapisany token per urządzenie (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłany tylko wtedy, gdy żaden z powyższych sposobów nie rozwiąże
    `auth.token`. Współdzielony token lub dowolny rozwiązany token urządzenia go tłumi.
  - Automatyczne promowanie zapisanego tokenu urządzenia przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczone wyłącznie do **zaufanych endpointów** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez pinningu się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrapu.
  Utrwalaj je tylko wtedy, gdy połączenie używało uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` lub loopback/local pairing.
- Jeśli klient dostarczy **jawny** `deviceToken` lub jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; buforowane zakresy są ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokenu per urządzenie.
- Tokeny urządzeń można obracać/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- Wystawianie/obracanie tokenów pozostaje ograniczone do zatwierdzonego zestawu ról zapisanego w
  wpisie pairingu tego urządzenia; obrót tokenu nie może rozszerzyć urządzenia do
  roli, której approval pairingu nigdy nie przyznał.
- Dla sesji z tokenami sparowanych urządzeń zarządzanie urządzeniem jest ograniczone do samego siebie, chyba że
  wywołujący ma także `operator.admin`: wywołujący bez admin może usuwać/unieważniać/obracać
  tylko **własny** wpis urządzenia.
- `device.token.rotate` sprawdza także żądany zestaw zakresów operatora względem
  bieżących zakresów sesji wywołującego. Wywołujący bez admin nie mogą obrócić tokenu do
  szerszego zestawu zakresów operatora, niż już posiadają.
- Niepowodzenia uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną ponowną próbę z buforowanym tokenem per urządzenie.
  - Jeśli ta ponowna próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i pokazać operatorowi wskazówki dotyczące wymaganych działań.

## Tożsamość urządzenia + pairing

- Node powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateway wystawia tokeny per urządzenie + rola.
- Approval pairingu są wymagane dla nowych `device.id`, chyba że włączono lokalne automatyczne approval.
- Automatyczne approval pairingu jest skoncentrowane na bezpośrednich lokalnych połączeniach loopback.
- OpenClaw ma też wąską ścieżkę samopołączenia backend/container-local dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia tailnet lub LAN z tego samego hosta są nadal traktowane jak zdalne na potrzeby pairingu i
  wymagają approval.
- Wszyscy klienci WS muszą dołączać tożsamość `device` podczas `connect` (operator + node).
  Control UI może ją pominąć tylko w tych trybach:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niezabezpieczonym HTTP tylko na localhost.
  - pomyślne uwierzytelnianie operatora Control UI z `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (opcja awaryjna, poważne obniżenie bezpieczeństwa).
- Wszystkie połączenia muszą podpisywać nonce `connect.challenge` dostarczony przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, które nadal używają podpisywania sprzed mechanizmu challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` wraz ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                              |
| --------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------------ |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (lub wysłał pustą wartość). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał przestarzałym/złym nonce.              |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload podpisu nie odpowiada payloadowi v2.           |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Sygnowany znacznik czasu jest poza dozwolonym skew.    |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego się nie powiodły. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj payload v2 zawierający nonce serwera.
- Wysyłaj ten sam nonce w `connect.params.device.nonce`.
- Preferowany payload podpisu to `v3`, który wiąże `platform` i `deviceFamily` oprócz pól urządzenia/klienta/roli/zakresów/tokenu/nonce.
- Starsze podpisy `v2` pozostają akceptowane ze względu na zgodność, ale pinning metadanych sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + pinning

- TLS jest obsługiwane dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` lub flagę CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, modele, czat,
agent, sesje, Node, approval itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.
