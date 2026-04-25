---
read_when:
    - Implementowanie lub aktualizowanie klientów WS Gateway
    - Debugowanie niezgodności protokołu lub błędów połączenia
    - Regenerowanie schematu/modeli protokołu
summary: 'Protokół WebSocket Gateway: handshake, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Protokół WebSocket Gateway to **jedyna płaszczyzna sterowania + transport Node** dla
OpenClaw. Wszyscy klienci (CLI, web UI, aplikacja macOS, Node iOS/Android, Node headless)
łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** w
czasie handshake.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.
- Ramki przed połączeniem są ograniczone do 64 KiB. Po udanym handshake klienci
  powinni przestrzegać limitów `hello-ok.policy.maxPayload` i
  `hello-ok.policy.maxBufferedBytes`. Przy włączonej diagnostyce
  zbyt duże ramki przychodzące i wolne bufory wychodzące emitują zdarzenia `payload.large`
  zanim gateway zamknie połączenie lub odrzuci daną ramkę. Zdarzenia te zachowują
  rozmiary, limity, powierzchnie i bezpieczne kody przyczyn. Nie zachowują treści wiadomości,
  zawartości załączników, surowej treści ramki, tokenów, cookies ani wartości sekretów.

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
raportuje uzgodnioną rolę/zakresy, gdy są dostępne, i zawiera `deviceToken`,
gdy gateway go wydaje.

Gdy nie jest wydawany token urządzenia, `hello-ok.auth` nadal może raportować uzgodnione
uprawnienia:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Gdy wydawany jest token urządzenia, `hello-ok` zawiera również:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Podczas zaufanego przekazania bootstrap `hello-ok.auth` może także zawierać dodatkowe
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

Dla wbudowanego przepływu bootstrap node/operator główny token node pozostaje
`scopes: []`, a każdy przekazany token operator pozostaje ograniczony do bootstrapowej listy dozwolonych operatora (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kontrole zakresów bootstrap pozostają
poprzedzone rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
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

Metody wywołujące skutki uboczne wymagają **kluczy idempotency** (zobacz schemat).

## Role + zakresy

### Role

- `operator` = klient płaszczyzny sterowania (CLI/UI/automatyzacja).
- `node` = host zdolności (`camera/screen/canvas/system.run`).

### Zakresy (operator)

Typowe zakresy:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` z `includeSecrets: true` wymaga `operator.talk.secrets`
(albo `operator.admin`).

Metody gateway RPC rejestrowane przez Plugin mogą żądać własnego zakresu operatora, ale
zastrzeżone rdzeniowe prefiksy administracyjne (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze rozwiązują się do `operator.admin`.

Zakres metody to tylko pierwsza bramka. Niektóre polecenia slash osiągane przez
`chat.send` stosują dodatkowo bardziej rygorystyczne kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w czasie zatwierdzania ponad
bazowy zakres metody:

- żądania bez poleceń: `operator.pairing`
- żądania z poleceniami node innymi niż exec: `operator.pairing` + `operator.write`
- żądania zawierające `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node deklarują roszczenia zdolności w czasie połączenia:

- `caps`: kategorie zdolności wysokiego poziomu.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolonych po stronie serwera.

## Presence

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy presence zawierają `deviceId`, `roles` i `scopes`, aby UI mogły pokazywać jeden wiersz na urządzenie
  nawet wtedy, gdy łączy się ono zarówno jako **operator**, jak i **node**.

## Zakres zdarzeń broadcast

Zdarzenia broadcast WebSocket wypychane przez serwer są bramkowane zakresami, aby sesje ograniczone do pairing lub tylko-node nie otrzymywały biernie treści sesji.

- **Ramki czatu, agenta i wyników narzędzi** (w tym strumieniowane zdarzenia `agent` i wyniki wywołań narzędzi) wymagają co najmniej `operator.read`. Sesje bez `operator.read` całkowicie pomijają te ramki.
- **Broadcasty `plugin.*` zdefiniowane przez Plugin** są bramkowane do `operator.write` lub `operator.admin`, zależnie od sposobu ich zarejestrowania przez Plugin.
- **Zdarzenia statusu i transportu** (`heartbeat`, `presence`, `tick`, cykl życia connect/disconnect itd.) pozostają nieograniczone, aby stan zdrowia transportu był widoczny dla każdej uwierzytelnionej sesji.
- **Nieznane rodziny zdarzeń broadcast** są domyślnie bramkowane zakresami (fail-closed), chyba że zarejestrowany handler jawnie je rozluźni.

Każde połączenie klienta utrzymuje własny numer sekwencyjny per klient, dzięki czemu broadcasty zachowują monotoniczną kolejność na tym gnieździe, nawet gdy różni klienci widzą różne podzbiory strumienia zdarzeń odfiltrowane przez zakresy.

## Typowe rodziny metod RPC

Publiczna powierzchnia WS jest szersza niż przykłady handshake/auth powyżej. To
nie jest wygenerowany zrzut — `hello-ok.features.methods` to zachowawcza
lista odkrywania budowana z `src/gateway/server-methods-list.ts` plus eksportów metod załadowanych Plugin/kanałów. Traktuj ją jako wykrywanie funkcji, a nie pełne
wyliczenie `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System i tożsamość">
    - `health` zwraca zbuforowaną albo świeżo sprawdzoną migawkę stanu zdrowia gateway.
    - `diagnostics.stability` zwraca ostatni ograniczony rejestr stabilności diagnostycznej. Zachowuje metadane operacyjne, takie jak nazwy zdarzeń, liczby, rozmiary bajtowe, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/Plugin i identyfikatory sesji. Nie zachowuje tekstu czatu, treści Webhook, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies ani wartości sekretów. Wymagany jest zakres operator read.
    - `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są dołączane tylko dla klientów operator o zakresie admin.
    - `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i pairing.
    - `system-presence` zwraca bieżącą migawkę presence dla podłączonych urządzeń operator/node.
    - `system-event` dołącza zdarzenie systemowe i może aktualizować/nadawać kontekst presence.
    - `last-heartbeat` zwraca ostatnie utrwalone zdarzenie heartbeat.
    - `set-heartbeats` przełącza przetwarzanie Heartbeat w gateway.
  </Accordion>

  <Accordion title="Modele i użycie">
    - `models.list` zwraca katalog modeli dozwolonych przez runtime.
    - `usage.status` zwraca okna użycia dostawcy/podsumowania pozostałego limitu quota.
    - `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
    - `doctor.memory.status` zwraca gotowość vector-memory / embeddingów dla aktywnego workspace domyślnego agenta.
    - `sessions.usage` zwraca podsumowania użycia per sesja.
    - `sessions.usage.timeseries` zwraca szereg czasowy użycia dla jednej sesji.
    - `sessions.usage.logs` zwraca wpisy logów użycia dla jednej sesji.
  </Accordion>

  <Accordion title="Kanały i pomocniki logowania">
    - `channels.status` zwraca podsumowania statusu wbudowanych + dołączonych kanałów/Plugin.
    - `channels.logout` wylogowuje z konkretnego kanału/konta tam, gdzie kanał obsługuje wylogowanie.
    - `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego dostawcy kanału web obsługującego QR.
    - `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i przy powodzeniu uruchamia kanał.
    - `push.test` wysyła testowy push APNs do zarejestrowanego Node iOS.
    - `voicewake.get` zwraca zapisane wyzwalacze słowa wybudzania.
    - `voicewake.set` aktualizuje wyzwalacze słowa wybudzania i rozgłasza zmianę.
  </Accordion>

  <Accordion title="Wiadomości i logi">
    - `send` to bezpośredni RPC dostarczania wychodzącego dla wysyłek kierowanych na kanał/konto/wątek poza runnerem czatu.
    - `logs.tail` zwraca tail skonfigurowanego pliku logów gateway z kontrolą kursora/limitu i maksymalnej liczby bajtów.
  </Accordion>

  <Accordion title="Talk i TTS">
    - `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets` wymaga `operator.talk.secrets` (albo `operator.admin`).
    - `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów WebChat/Control UI.
    - `talk.speak` syntezuje mowę przez aktywnego dostawcę mowy Talk.
    - `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców fallback i stan konfiguracji dostawcy.
    - `tts.providers` zwraca widoczny spis dostawców TTS.
    - `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
    - `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
    - `tts.convert` uruchamia jednorazową konwersję text-to-speech.
  </Accordion>

  <Accordion title="Sekrety, konfiguracja, aktualizacja i kreator">
    - `secrets.reload` ponownie rozwiązuje aktywne SecretRef i podmienia stan sekretów runtime tylko przy pełnym powodzeniu.
    - `secrets.resolve` rozwiązuje przypisania sekretów docelowych poleceń dla konkretnego zestawu poleceń/celów.
    - `config.get` zwraca bieżącą migawkę konfiguracji i hash.
    - `config.set` zapisuje zwalidowany ładunek konfiguracji.
    - `config.patch` scala częściową aktualizację konfiguracji.
    - `config.apply` waliduje + zastępuje pełny ładunek konfiguracji.
    - `config.schema` zwraca ładunek aktywnego schematu konfiguracji używanego przez Control UI i narzędzia CLI: schemat, `uiHints`, wersję i metadane generacji, w tym metadane schematów Plugin + kanałów, gdy runtime może je załadować. Schemat zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet i tekstu pomocy, których używa UI, w tym zagnieżdżone obiekty, wildcard, elementy tablic oraz gałęzie kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje pasująca dokumentacja pól.
    - `config.schema.lookup` zwraca ładunek lookup ograniczony do ścieżki dla jednej ścieżki konfiguracji: znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz podsumowania bezpośrednich dzieci do drill-down UI/CLI. Węzły schematu lookup zachowują dokumentację skierowaną do użytkownika i typowe pola walidacyjne (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, granice liczbowe/ciągów/tablic/obiektów oraz flagi takie jak `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Podsumowania dzieci udostępniają `key`, znormalizowaną `path`, `type`, `required`, `hasChildren` oraz dopasowane `hint` / `hintPath`.
    - `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy, gdy sama aktualizacja się powiodła.
    - `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają kreator onboardingu przez WS RPC.
  </Accordion>

  <Accordion title="Pomocniki agenta i workspace">
    - `agents.list` zwraca skonfigurowane wpisy agentów.
    - `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów i połączeniami workspace.
    - `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają plikami bootstrap workspace udostępnianymi dla agenta.
    - `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub sesji.
    - `agent.wait` czeka na zakończenie uruchomienia i zwraca końcową migawkę, gdy jest dostępna.
  </Accordion>

  <Accordion title="Sterowanie sesją">
    - `sessions.list` zwraca bieżący indeks sesji.
    - `sessions.subscribe` i `sessions.unsubscribe` przełączają subskrypcje zdarzeń zmian sesji dla bieżącego klienta WS.
    - `sessions.messages.subscribe` i `sessions.messages.unsubscribe` przełączają subskrypcje zdarzeń transkryptu/wiadomości dla jednej sesji.
    - `sessions.preview` zwraca ograniczone podglądy transkryptu dla określonych kluczy sesji.
    - `sessions.resolve` rozwiązuje lub kanonizuje cel sesji.
    - `sessions.create` tworzy nowy wpis sesji.
    - `sessions.send` wysyła wiadomość do istniejącej sesji.
    - `sessions.steer` to wariant interrupt-and-steer dla aktywnej sesji.
    - `sessions.abort` przerywa aktywną pracę dla sesji.
    - `sessions.patch` aktualizuje metadane/nadpisania sesji.
    - `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują utrzymanie sesji.
    - `sessions.get` zwraca pełny zapisany wiersz sesji.
    - Wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i `chat.inject`. `chat.history` jest znormalizowane do wyświetlania dla klientów UI: inline tagi dyrektyw są usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi) i wyciekłe tokeny sterujące modelu ASCII/full-width są usuwane, czysto ciche wiersze asystenta, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami.
  </Accordion>

  <Accordion title="Parowanie urządzeń i tokeny urządzeń">
    - `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
    - `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają rekordami parowania urządzeń.
    - `device.token.rotate` obraca token sparowanego urządzenia w granicach jego zatwierdzonej roli i zakresów.
    - `device.token.revoke` unieważnia token sparowanego urządzenia.
  </Accordion>

  <Accordion title="Parowanie Node, invoke i oczekująca praca">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` i `node.pair.verify` obejmują parowanie Node i weryfikację bootstrap.
    - `node.list` i `node.describe` zwracają stan znanych/podłączonych Node.
    - `node.rename` aktualizuje etykietę sparowanego Node.
    - `node.invoke` przekazuje polecenie do podłączonego Node.
    - `node.invoke.result` zwraca wynik dla żądania invoke.
    - `node.event` przenosi zdarzenia pochodzące z Node z powrotem do gateway.
    - `node.canvas.capability.refresh` odświeża tokeny scoped canvas-capability.
    - `node.pending.pull` i `node.pending.ack` to API kolejek dla podłączonych Node.
    - `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą dla Node offline/rozłączonych.
  </Accordion>

  <Accordion title="Rodziny zatwierdzeń">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzeń exec oraz lookup/replay oczekujących zatwierdzeń.
    - `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca ostateczną decyzję (albo `null` przy timeout).
    - `exec.approvals.get` i `exec.approvals.set` zarządzają migawkami polityki zatwierdzeń exec gateway.
    - `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla Node polityką zatwierdzeń exec przez polecenia relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują przepływy zatwierdzeń zdefiniowane przez Plugin.
  </Accordion>

  <Accordion title="Automatyzacja, Skills i narzędzia">
    - Automatyzacja: `wake` planuje natychmiastowe albo next-heartbeat wstrzyknięcie tekstu wybudzenia; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` zarządzają zaplanowaną pracą.
    - Skills i narzędzia: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  tylko dla transkryptu.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: indeks sesji lub metadane uległy zmianie.
- `presence`: aktualizacje migawek systemowego presence.
- `tick`: okresowe zdarzenie keepalive / liveness.
- `health`: aktualizacja migawki stanu zdrowia gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń Heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania Cron.
- `shutdown`: powiadomienie o wyłączeniu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania Node.
- `node.invoke.request`: broadcast żądania invoke Node.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanego urządzenia.
- `voicewake.changed`: zmieniła się konfiguracja wyzwalacza słowa wybudzania.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia
  zatwierdzania exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzeń Plugin.

### Metody pomocnicze Node

- Node mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych skill
  do automatycznych kontroli dozwolenia.

### Metody pomocnicze operatora

- Operatorzy mogą wywoływać `commands.list` (`operator.read`), aby pobrać runtime
  command inventory dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać workspace domyślnego agenta.
  - `scope` kontroluje, którą powierzchnię wskazuje główne `name`:
    - `text` zwraca główny token polecenia tekstowego bez wiodącego `/`
    - `native` oraz domyślna ścieżka `both` zwracają nazwy natywne świadome dostawcy,
      gdy są dostępne
  - `textAliases` zawiera dokładne aliasy slash, takie jak `/model` i `/m`.
  - `nativeName` zawiera nazwę natywną świadomą dostawcy, gdy taka istnieje.
  - `provider` jest opcjonalne i wpływa tylko na nazewnictwo natywne oraz dostępność natywnych poleceń Plugin.
  - `includeArgs=false` pomija serializowane metadane argumentów z odpowiedzi.
- Operatorzy mogą wywoływać `tools.catalog` (`operator.read`), aby pobrać runtime tool catalog dla
  agenta. Odpowiedź zawiera zgrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` albo `plugin`
  - `pluginId`: właściciel Plugin, gdy `source="plugin"`
  - `optional`: czy narzędzie Plugin jest opcjonalne
- Operatorzy mogą wywoływać `tools.effective` (`operator.read`), aby pobrać runtime-effective tool
  inventory dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst runtime z sesji po stronie serwera zamiast akceptować
    kontekst auth lub dostarczania dostarczony przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna rozmowa może użyć teraz,
    w tym narzędzia core, Plugin i kanałowe.
- Operatorzy mogą wywoływać `skills.status` (`operator.read`), aby pobrać widoczny
  spis Skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać workspace domyślnego agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji i
    zsanityzowane opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywoływać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych odkrywania ClawHub.
- Operatorzy mogą wywoływać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder skill w katalogu `skills/` workspace domyślnego agenta.
  - Tryb instalatora gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywoływać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug albo wszystkie śledzone instalacje ClawHub w
    workspace domyślnego agenta.
  - Tryb konfiguracji poprawia wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, gateway rozgłasza `exec.approval.requested`.
- Klienci operator rozwiązują je, wywołując `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node` `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` albo
  `sessionKey` pomiędzy prepare a ostatecznym zatwierdzonym przekazaniem `system.run`,
  gateway odrzuca uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Fallback dostarczania agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczania wychodzącego.
- `bestEffortDeliver=false` zachowuje ścisłe zachowanie: nierozwiązane albo tylko-wewnętrzne cele dostarczania zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` pozwala na fallback do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej trasy dostarczania (na przykład sesje internal/webchat albo niejednoznaczne konfiguracje wielokanałowe).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niezgodności.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Stałe klienta

Klient referencyjny w `src/gateway/client.ts` używa tych ustawień domyślnych. Wartości są
stabilne w całym protokole v3 i są oczekiwaną bazą dla klientów zewnętrznych.

| Constant                                  | Default                                               | Source                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Limit czasu żądania (na RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Limit czasu preauth / connect-challenge   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Początkowy backoff reconnect              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maksymalny backoff reconnect              | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp szybkiej próby po zamknięciu device-token | `250` ms                                         | `src/gateway/client.ts`                                    |
| Grace force-stop przed `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Domyślny limit czasu `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Domyślny interwał tick (przed `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Zamknięcie przy timeout tick              | kod `4000`, gdy cisza przekracza `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Serwer ogłasza efektywne `policy.tickIntervalMs`, `policy.maxPayload`
i `policy.maxBufferedBytes` w `hello-ok`; klienci powinni respektować te wartości,
a nie ustawienia domyślne sprzed handshake.

## Uwierzytelnianie

- Uwierzytelnianie gateway współdzielonym sekretem używa `connect.params.auth.token` albo
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu auth.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) albo `gateway.auth.mode: "trusted-proxy"` bez loopback,
  spełniają kontrolę uwierzytelniania connect na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect współdzielonym sekretem; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wydaje **device token** ograniczony do roli + zakresów
  połączenia. Jest zwracany w `hello-ok.auth.deviceToken` i powinien zostać
  zachowany przez klienta do przyszłych połączeń.
- Klienci powinni zachowywać główny `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zachowanym** device token powinno również ponownie używać zachowanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Zachowuje to dostęp
  read/probe/status, który został już przyznany, i zapobiega cichemu zawężeniu reconnect do
  węższego niejawnego zakresu tylko admin.
- Składanie client-side connect auth (`selectConnectAuth` w
  `src/gateway/client.ts`):
  - `auth.password` jest ortogonalne i zawsze jest przekazywane, gdy ustawione.
  - `auth.token` jest wypełniane według kolejności priorytetów: najpierw jawny współdzielony token,
    potem jawny `deviceToken`, a następnie zachowany token per-device (kluczowany przez
    `deviceId` + `role`).
  - `auth.bootstrapToken` jest wysyłane tylko wtedy, gdy żadna z powyższych ścieżek nie rozwiązała
    `auth.token`. Współdzielony token albo dowolny rozwiązany device token je wycisza.
  - Automatyczna promocja zachowanego device token przy jednorazowej
    ponownej próbie `AUTH_TOKEN_MISMATCH` jest ograniczona tylko do **zaufanych punktów końcowych** —
    loopback albo `wss://` z przypiętym `tlsFingerprint`. Publiczne `wss://`
    bez pinningu się nie kwalifikuje.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrap.
  Zachowuj je tylko wtedy, gdy połączenie używało bootstrap auth na zaufanym transporcie,
  takim jak `wss://` albo loopback/local pairing.
- Jeśli klient dostarcza **jawny** `deviceToken` albo jawne `scopes`, ten
  zestaw zakresów żądany przez wywołującego pozostaje autorytatywny; zbuforowane zakresy są
  ponownie używane tylko wtedy, gdy klient używa zachowanego tokenu per-device.
- Device tokeny mogą być obracane/unieważniane przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- Wydawanie/obrót tokenów pozostaje ograniczone do zatwierdzonego zestawu ról zapisanego w
  wpisie parowania tego urządzenia; obrót tokenu nie może rozszerzyć urządzenia do
  roli, której zatwierdzenie parowania nigdy nie przyznało.
- Dla sesji tokenów sparowanych urządzeń zarządzanie urządzeniem jest self-scoped, chyba że
  wywołujący ma również `operator.admin`: wywołujący bez admin może usuwać/unieważniać/obracać
  tylko **własny** wpis urządzenia.
- `device.token.rotate` sprawdza także żądany zestaw zakresów operatora względem
  bieżących zakresów sesji wywołującego. Wywołujący bez admin nie mogą obrócić tokenu do
  szerszego zestawu zakresów operatora, niż już posiadają.
- Błędy auth zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną próbę ponowienia z użyciem zbuforowanego tokenu per-device.
  - Jeśli ta próba się nie powiedzie, klienci powinni zatrzymać automatyczne pętle reconnect i pokazać operatorowi wskazówki działania.

## Tożsamość urządzenia + parowanie

- Node powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  fingerprintu pary kluczy.
- Gateway wydają tokeny per urządzenie + rola.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono
  lokalne auto-zatwierdzanie.
- Auto-zatwierdzanie parowania jest skupione na bezpośrednich lokalnych połączeniach loopback.
- OpenClaw ma też wąską ścieżkę self-connect backend/container-local dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia samego hosta przez tailnet albo LAN są nadal traktowane jako zdalne do celów parowania i
  wymagają zatwierdzenia.
- Wszyscy klienci WS muszą dołączać tożsamość `device` podczas `connect` (operator + node).
  Control UI może ją pominąć tylko w tych trybach:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niebezpiecznym HTTP tylko localhost.
  - pomyślne uwierzytelnianie operatora Control UI przy `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (awaryjne, poważne obniżenie bezpieczeństwa).
- Wszystkie połączenia muszą podpisywać nonce `connect.challenge` dostarczone przez serwer.

### Diagnostyka migracji uwierzytelniania urządzeń

Dla starszych klientów, którzy nadal używają zachowania podpisu sprzed challenge, `connect` zwraca teraz
kody szczegółów `DEVICE_AUTH_*` w `error.details.code` ze stabilnym `error.details.reason`.

Typowe błędy migracji:

| Message                     | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (albo wysłał pusty). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał starym/błędnym nonce.              |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Sygnowany timestamp jest poza dozwolonym skew.     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do fingerprintu klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonizacja klucza publicznego nie powiodły się. |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2 zawierający nonce serwera.
- Wysyłaj ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane dla zgodności, ale pinning metadanych
  sparowanego urządzenia nadal steruje polityką poleceń przy reconnect.

## TLS + pinning

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć fingerprint certyfikatu gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` albo CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, modele, czat,
agent, sesje, Node, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.

## Powiązane

- [Bridge protocol](/pl/gateway/bridge-protocol)
- [Runbook Gateway](/pl/gateway)
