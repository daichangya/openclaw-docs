---
read_when:
    - Implementowanie lub aktualizowanie klientów WS gateway
    - Debugowanie niedopasowań protokołu lub niepowodzeń połączenia
    - Ponowne generowanie schematu/modeli protokołu
summary: 'Protokół Gateway WebSocket: uzgadnianie połączenia, ramki, wersjonowanie'
title: Protokół Gateway
x-i18n:
    generated_at: "2026-04-08T02:15:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8635e3ac1dd311dbd3a770b088868aa1495a8d53b3ebc1eae0dfda3b2bf4694a
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokół Gateway (WebSocket)

Protokół Gateway WS jest **pojedynczą płaszczyzną sterowania + transportem węzłów** dla
OpenClaw. Wszyscy klienci (CLI, interfejs webowy, aplikacja macOS, węzły iOS/Android, bezgłowe
węzły) łączą się przez WebSocket i deklarują swoją **rolę** + **zakres** w czasie
uzgadniania połączenia.

## Transport

- WebSocket, ramki tekstowe z ładunkami JSON.
- Pierwsza ramka **musi** być żądaniem `connect`.

## Uzgadnianie połączenia (connect)

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Gdy zostanie wydany token urządzenia, `hello-ok` zawiera także:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Podczas przekazania w zaufanym przepływie bootstrap, `hello-ok.auth` może także zawierać dodatkowe
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

W przypadku wbudowanego przepływu bootstrap węzła/operatora podstawowy token węzła pozostaje
`scopes: []`, a każdy przekazany token operatora pozostaje ograniczony do listy dozwolonych zakresów
operatora bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Sprawdzenia zakresu bootstrap pozostają
prefiksowane rolą: wpisy operatora spełniają tylko żądania operatora, a role inne niż operator
nadal wymagają zakresów pod własnym prefiksem roli.

### Przykład węzła

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
- `node` = host możliwości (`camera/screen/canvas/system.run`).

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

Metody Gateway RPC rejestrowane przez pluginy mogą żądać własnego zakresu operatora, ale
zastrzeżone prefiksy administracyjne rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze są mapowane na `operator.admin`.

Zakres metody to tylko pierwszy próg kontroli. Niektóre polecenia slash osiągane przez
`chat.send` nakładają dodatkowo bardziej rygorystyczne kontrole na poziomie polecenia. Na przykład trwałe
zapisy `/config set` i `/config unset` wymagają `operator.admin`.

`node.pair.approve` ma także dodatkową kontrolę zakresu w momencie zatwierdzania ponad
bazowy zakres metody:

- żądania bez poleceń: `operator.pairing`
- żądania z poleceniami węzła innymi niż exec: `operator.pairing` + `operator.write`
- żądania obejmujące `system.run`, `system.run.prepare` lub `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Węzły deklarują roszczenia możliwości w czasie połączenia:

- `caps`: wysokopoziomowe kategorie możliwości.
- `commands`: lista dozwolonych poleceń dla invoke.
- `permissions`: szczegółowe przełączniki (np. `screen.record`, `camera.capture`).

Gateway traktuje je jako **roszczenia** i egzekwuje listy dozwolonych po stronie serwera.

## Obecność

- `system-presence` zwraca wpisy kluczowane tożsamością urządzenia.
- Wpisy obecności zawierają `deviceId`, `roles` i `scopes`, aby interfejsy mogły pokazywać jeden wiersz na urządzenie,
  nawet gdy łączy się ono zarówno jako **operator**, jak i **node**.

## Typowe rodziny metod RPC

Ta strona nie jest wygenerowanym pełnym zrzutem, ale publiczna powierzchnia WS jest szersza
niż przykłady uzgadniania połączenia/uwierzytelniania powyżej. To są główne rodziny metod, które
Gateway udostępnia obecnie.

`hello-ok.features.methods` to zachowawcza lista wykrywania zbudowana z
`src/gateway/server-methods-list.ts` oraz załadowanych eksportów metod pluginów/kanałów.
Traktuj ją jako wykrywanie funkcji, a nie wygenerowany zrzut każdego pomocniczego wywołania
zaimplementowanego w `src/gateway/server-methods/*.ts`.

### System i tożsamość

- `health` zwraca buforowany lub świeżo sprawdzony snapshot kondycji gateway.
- `status` zwraca podsumowanie gateway w stylu `/status`; pola wrażliwe są
  dołączane tylko dla klientów operatora z zakresem admin.
- `gateway.identity.get` zwraca tożsamość urządzenia gateway używaną przez przepływy relay i
  parowania.
- `system-presence` zwraca bieżący snapshot obecności dla połączonych
  urządzeń operatora/węzła.
- `system-event` dopisuje zdarzenie systemowe i może aktualizować/rozgłaszać kontekst
  obecności.
- `last-heartbeat` zwraca najnowsze zapisane zdarzenie heartbeat.
- `set-heartbeats` przełącza przetwarzanie heartbeat w gateway.

### Modele i użycie

- `models.list` zwraca katalog modeli dozwolonych w czasie działania.
- `usage.status` zwraca okna użycia dostawcy/podsumowania pozostałego limitu.
- `usage.cost` zwraca zagregowane podsumowania kosztów użycia dla zakresu dat.
- `doctor.memory.status` zwraca gotowość pamięci wektorowej / embeddingów dla
  aktywnego domyślnego obszaru roboczego agenta.
- `sessions.usage` zwraca podsumowania użycia dla poszczególnych sesji.
- `sessions.usage.timeseries` zwraca szereg czasowy użycia dla jednej sesji.
- `sessions.usage.logs` zwraca wpisy dziennika użycia dla jednej sesji.

### Kanały i pomocniki logowania

- `channels.status` zwraca podsumowania statusu wbudowanych + dołączonych kanałów/pluginów.
- `channels.logout` wylogowuje z określonego kanału/konta tam, gdzie kanał
  obsługuje wylogowanie.
- `web.login.start` uruchamia przepływ logowania QR/web dla bieżącego
  dostawcy kanału web obsługującego QR.
- `web.login.wait` czeka na zakończenie tego przepływu logowania QR/web i przy powodzeniu uruchamia
  kanał.
- `push.test` wysyła testowe powiadomienie APNs do zarejestrowanego węzła iOS.
- `voicewake.get` zwraca zapisane wyzwalacze słowa aktywującego.
- `voicewake.set` aktualizuje wyzwalacze słowa aktywującego i rozgłasza zmianę.

### Wiadomości i logi

- `send` jest bezpośrednim wywołaniem RPC dostarczania wychodzącego dla
  wysyłek kierowanych do kanału/konta/wątku poza runnerem czatu.
- `logs.tail` zwraca ogon skonfigurowanego dziennika plikowego gateway z kursorem/limitem oraz
  kontrolami maksymalnej liczby bajtów.

### Talk i TTS

- `talk.config` zwraca efektywny ładunek konfiguracji Talk; `includeSecrets`
  wymaga `operator.talk.secrets` (lub `operator.admin`).
- `talk.mode` ustawia/rozgłasza bieżący stan trybu Talk dla klientów
  WebChat/Control UI.
- `talk.speak` syntetyzuje mowę przez aktywnego dostawcę mowy Talk.
- `tts.status` zwraca stan włączenia TTS, aktywnego dostawcę, dostawców zapasowych
  oraz stan konfiguracji dostawcy.
- `tts.providers` zwraca widoczny spis dostawców TTS.
- `tts.enable` i `tts.disable` przełączają stan preferencji TTS.
- `tts.setProvider` aktualizuje preferowanego dostawcę TTS.
- `tts.convert` uruchamia jednorazową konwersję tekstu na mowę.

### Sekrety, konfiguracja, aktualizacja i kreator

- `secrets.reload` ponownie rozwiązuje aktywne SecretRef i podmienia stan sekretów w czasie działania
  tylko przy pełnym powodzeniu.
- `secrets.resolve` rozwiązuje przypisania sekretów docelowych poleceń dla określonego
  zestawu poleceń/celów.
- `config.get` zwraca bieżący snapshot konfiguracji i hash.
- `config.set` zapisuje zwalidowany ładunek konfiguracji.
- `config.patch` scala częściową aktualizację konfiguracji.
- `config.apply` waliduje i zastępuje pełny ładunek konfiguracji.
- `config.schema` zwraca ładunek aktywnego schematu konfiguracji używany przez Control UI i
  narzędzia CLI: schemat, `uiHints`, wersję oraz metadane generowania, w tym
  metadane schematu pluginów + kanałów, gdy środowisko wykonawcze może je załadować. Schemat
  zawiera metadane pól `title` / `description` pochodzące z tych samych etykiet
  i tekstów pomocy używanych przez UI, w tym zagnieżdżone obiekty, wildcard, elementy tablic
  oraz gałęzie kompozycji `anyOf` / `oneOf` / `allOf`, gdy istnieje odpowiadająca
  dokumentacja pól.
- `config.schema.lookup` zwraca ładunek wyszukiwania ograniczony do ścieżki dla jednej ścieżki konfiguracji:
  znormalizowaną ścieżkę, płytki węzeł schematu, dopasowaną wskazówkę + `hintPath` oraz
  podsumowania bezpośrednich elementów potomnych do drążenia w UI/CLI.
  - Węzły schematu wyszukiwania zachowują dokumentację skierowaną do użytkownika i typowe pola walidacji:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    ograniczenia liczb/ciągów/tablic/obiektów oraz flagi logiczne takie jak
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Podsumowania elementów potomnych udostępniają `key`, znormalizowaną `path`, `type`, `required`,
    `hasChildren` oraz dopasowane `hint` / `hintPath`.
- `update.run` uruchamia przepływ aktualizacji gateway i planuje restart tylko wtedy,
  gdy sama aktualizacja się powiodła.
- `wizard.start`, `wizard.next`, `wizard.status` i `wizard.cancel` udostępniają
  kreator wdrożenia przez WS RPC.

### Istniejące główne rodziny

#### Pomocniki agenta i obszaru roboczego

- `agents.list` zwraca skonfigurowane wpisy agentów.
- `agents.create`, `agents.update` i `agents.delete` zarządzają rekordami agentów oraz
  powiązaniami obszaru roboczego.
- `agents.files.list`, `agents.files.get` i `agents.files.set` zarządzają
  plikami obszaru roboczego bootstrap udostępnianymi dla agenta.
- `agent.identity.get` zwraca efektywną tożsamość asystenta dla agenta lub
  sesji.
- `agent.wait` czeka na zakończenie uruchomienia i zwraca końcowy snapshot, gdy
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
- `sessions.steer` jest wariantem przerwania i sterowania dla aktywnej sesji.
- `sessions.abort` przerywa aktywną pracę dla sesji.
- `sessions.patch` aktualizuje metadane/nadpisania sesji.
- `sessions.reset`, `sessions.delete` i `sessions.compact` wykonują
  konserwację sesji.
- `sessions.get` zwraca pełny zapisany wiersz sesji.
- wykonywanie czatu nadal używa `chat.history`, `chat.send`, `chat.abort` i
  `chat.inject`.
- `chat.history` jest znormalizowane pod kątem wyświetlania dla klientów UI: wbudowane tagi dyrektyw są
  usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w zwykłym tekście (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  obcięte bloki wywołań narzędzi) i wyciekłe tokeny sterowania modelem ASCII/full-width
  są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami.

#### Parowanie urządzeń i tokeny urządzeń

- `device.pair.list` zwraca oczekujące i zatwierdzone sparowane urządzenia.
- `device.pair.approve`, `device.pair.reject` i `device.pair.remove` zarządzają
  rekordami parowania urządzeń.
- `device.token.rotate` obraca token sparowanego urządzenia w granicach zatwierdzonej roli
  i zakresów.
- `device.token.revoke` unieważnia token sparowanego urządzenia.

#### Parowanie węzłów, invoke i oczekująca praca

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` i `node.pair.verify` obejmują parowanie węzłów i bootstrap
  verification.
- `node.list` i `node.describe` zwracają stan znanych/połączonych węzłów.
- `node.rename` aktualizuje etykietę sparowanego węzła.
- `node.invoke` przekazuje polecenie do połączonego węzła.
- `node.invoke.result` zwraca wynik żądania invoke.
- `node.event` przenosi zdarzenia pochodzące z węzła z powrotem do gateway.
- `node.canvas.capability.refresh` odświeża ograniczone tokeny możliwości canvas.
- `node.pending.pull` i `node.pending.ack` to interfejsy API kolejki połączonych węzłów.
- `node.pending.enqueue` i `node.pending.drain` zarządzają trwałą oczekującą pracą
  dla węzłów offline/rozłączonych.

#### Rodziny zatwierdzeń

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` i
  `exec.approval.resolve` obejmują jednorazowe żądania zatwierdzenia exec oraz oczekujące
  wyszukiwanie/odtwarzanie zatwierdzeń.
- `exec.approval.waitDecision` czeka na jedno oczekujące zatwierdzenie exec i zwraca
  ostateczną decyzję (lub `null` przy przekroczeniu czasu).
- `exec.approvals.get` i `exec.approvals.set` zarządzają snapshotami polityki zatwierdzeń exec
  gateway.
- `exec.approvals.node.get` i `exec.approvals.node.set` zarządzają lokalną dla węzła
  polityką zatwierdzeń exec przez polecenia relay węzła.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` i `plugin.approval.resolve` obejmują
  przepływy zatwierdzeń definiowane przez pluginy.

#### Inne główne rodziny

- automatyzacja:
  - `wake` planuje natychmiastowe lub przy następnym heartbeat wstrzyknięcie tekstu wybudzającego
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `skills.*`, `tools.catalog`, `tools.effective`

### Typowe rodziny zdarzeń

- `chat`: aktualizacje czatu UI, takie jak `chat.inject` i inne zdarzenia czatu
  tylko dla transkryptu.
- `session.message` i `session.tool`: aktualizacje transkryptu/strumienia zdarzeń dla
  subskrybowanej sesji.
- `sessions.changed`: zmienił się indeks sesji lub metadane.
- `presence`: aktualizacje snapshotu obecności systemu.
- `tick`: okresowe zdarzenie keepalive / żywotności.
- `health`: aktualizacja snapshotu kondycji gateway.
- `heartbeat`: aktualizacja strumienia zdarzeń heartbeat.
- `cron`: zdarzenie zmiany uruchomienia/zadania cron.
- `shutdown`: powiadomienie o wyłączeniu gateway.
- `node.pair.requested` / `node.pair.resolved`: cykl życia parowania węzłów.
- `node.invoke.request`: rozgłoszenie żądania invoke węzła.
- `device.pair.requested` / `device.pair.resolved`: cykl życia sparowanych urządzeń.
- `voicewake.changed`: zmieniła się konfiguracja wyzwalacza słowa aktywującego.
- `exec.approval.requested` / `exec.approval.resolved`: cykl życia zatwierdzeń exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: cykl życia zatwierdzeń pluginów.

### Metody pomocnicze węzłów

- Węzły mogą wywoływać `skills.bins`, aby pobrać bieżącą listę plików wykonywalnych skill
  na potrzeby automatycznych kontroli listy dozwolonych.

### Metody pomocnicze operatora

- Operatorzy mogą wywoływać `tools.catalog` (`operator.read`), aby pobrać katalog narzędzi środowiska wykonawczego dla
  agenta. Odpowiedź zawiera pogrupowane narzędzia i metadane pochodzenia:
  - `source`: `core` lub `plugin`
  - `pluginId`: właściciel pluginu, gdy `source="plugin"`
  - `optional`: czy narzędzie pluginu jest opcjonalne
- Operatorzy mogą wywoływać `tools.effective` (`operator.read`), aby pobrać efektywny w czasie działania
  spis narzędzi dla sesji.
  - `sessionKey` jest wymagane.
  - Gateway wyprowadza zaufany kontekst środowiska wykonawczego po stronie serwera z sesji zamiast akceptować
    kontekst uwierzytelniania lub dostarczenia dostarczony przez wywołującego.
  - Odpowiedź jest ograniczona do sesji i odzwierciedla to, czego aktywna rozmowa może użyć w danej chwili,
    w tym narzędzia rdzenia, pluginów i kanałów.
- Operatorzy mogą wywoływać `skills.status` (`operator.read`), aby pobrać widoczny
  spis skills dla agenta.
  - `agentId` jest opcjonalne; pomiń je, aby odczytać domyślny obszar roboczy agenta.
  - Odpowiedź zawiera kwalifikowalność, brakujące wymagania, kontrole konfiguracji oraz
    zsanityzowane opcje instalacji bez ujawniania surowych wartości sekretów.
- Operatorzy mogą wywoływać `skills.search` i `skills.detail` (`operator.read`) dla
  metadanych wykrywania ClawHub.
- Operatorzy mogą wywoływać `skills.install` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub: `{ source: "clawhub", slug, version?, force? }` instaluje
    folder skill w katalogu `skills/` domyślnego obszaru roboczego agenta.
  - Tryb instalatora Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    uruchamia zadeklarowaną akcję `metadata.openclaw.install` na hoście gateway.
- Operatorzy mogą wywoływać `skills.update` (`operator.admin`) w dwóch trybach:
  - Tryb ClawHub aktualizuje jeden śledzony slug lub wszystkie śledzone instalacje ClawHub w
    domyślnym obszarze roboczym agenta.
  - Tryb konfiguracji łata wartości `skills.entries.<skillKey>`, takie jak `enabled`,
    `apiKey` i `env`.

## Zatwierdzenia exec

- Gdy żądanie exec wymaga zatwierdzenia, gateway rozgłasza `exec.approval.requested`.
- Klienci operatora rozwiązują je przez wywołanie `exec.approval.resolve` (wymaga zakresu `operator.approvals`).
- Dla `host=node`, `exec.approval.request` musi zawierać `systemRunPlan` (kanoniczne `argv`/`cwd`/`rawCommand`/metadane sesji). Żądania bez `systemRunPlan` są odrzucane.
- Po zatwierdzeniu przekazane wywołania `node.invoke system.run` ponownie używają tego kanonicznego
  `systemRunPlan` jako autorytatywnego kontekstu polecenia/cwd/sesji.
- Jeśli wywołujący zmieni `command`, `rawCommand`, `cwd`, `agentId` lub
  `sessionKey` między prepare a końcowym zatwierdzonym przekazaniem `system.run`,
  gateway odrzuci uruchomienie zamiast ufać zmodyfikowanemu ładunkowi.

## Zapasowe dostarczanie agenta

- Żądania `agent` mogą zawierać `deliver=true`, aby zażądać dostarczenia wychodzącego.
- `bestEffortDeliver=false` zachowuje rygorystyczne działanie: nierozwiązane lub wyłącznie wewnętrzne cele dostarczenia zwracają `INVALID_REQUEST`.
- `bestEffortDeliver=true` umożliwia przejście awaryjne do wykonania tylko w sesji, gdy nie można rozwiązać żadnej zewnętrznej trasy dostarczenia (na przykład sesje internal/webchat lub niejednoznaczne konfiguracje wielu kanałów).

## Wersjonowanie

- `PROTOCOL_VERSION` znajduje się w `src/gateway/protocol/schema.ts`.
- Klienci wysyłają `minProtocol` + `maxProtocol`; serwer odrzuca niedopasowania.
- Schematy + modele są generowane z definicji TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Uwierzytelnianie

- Uwierzytelnianie gateway współdzielonym sekretem używa `connect.params.auth.token` lub
  `connect.params.auth.password`, zależnie od skonfigurowanego trybu uwierzytelniania.
- Tryby niosące tożsamość, takie jak Tailscale Serve
  (`gateway.auth.allowTailscale: true`) lub `gateway.auth.mode: "trusted-proxy"` inne niż
  local loopback, spełniają kontrolę uwierzytelniania connect na podstawie
  nagłówków żądania zamiast `connect.params.auth.*`.
- Prywatny ingress `gateway.auth.mode: "none"` całkowicie pomija uwierzytelnianie connect współdzielonym sekretem; nie wystawiaj tego trybu na publiczny/niezaufany ingress.
- Po sparowaniu Gateway wydaje **token urządzenia** ograniczony do roli + zakresów połączenia.
  Jest on zwracany w `hello-ok.auth.deviceToken` i powinien być
  utrwalony przez klienta na potrzeby przyszłych połączeń.
- Klienci powinni utrwalać podstawowy `hello-ok.auth.deviceToken` po każdym
  udanym połączeniu.
- Ponowne łączenie z tym **zapisanym** tokenem urządzenia powinno także ponownie używać zapisanego
  zatwierdzonego zestawu zakresów dla tego tokenu. Pozwala to zachować już przyznany
  dostęp do odczytu/sprawdzeń/statusu i unika cichego zawężenia ponownych połączeń do
  węższego, domyślnego zakresu tylko admin.
- Zwykła kolejność pierwszeństwa uwierzytelniania connect to najpierw jawny współdzielony token/hasło, potem
  jawny `deviceToken`, potem zapisany token per urządzenie, a następnie token bootstrap.
- Dodatkowe wpisy `hello-ok.auth.deviceTokens` to tokeny przekazania bootstrap.
  Utrwalaj je tylko wtedy, gdy połączenie użyło uwierzytelniania bootstrap na zaufanym transporcie,
  takim jak `wss://` lub loopback/local pairing.
- Jeśli klient dostarczy **jawny** `deviceToken` lub jawne `scopes`, ten
  żądany przez wywołującego zestaw zakresów pozostaje autorytatywny; zakresy z pamięci podręcznej są ponownie używane tylko wtedy, gdy klient ponownie używa zapisanego tokenu per urządzenie.
- Tokeny urządzeń można obracać/unieważniać przez `device.token.rotate` i
  `device.token.revoke` (wymaga zakresu `operator.pairing`).
- Wydawanie/obracanie tokenów pozostaje ograniczone do zatwierdzonego zestawu ról zapisanych w
  wpisie parowania tego urządzenia; obrót tokenu nie może rozszerzyć urządzenia do
  roli, której zatwierdzenie parowania nigdy nie nadało.
- Dla sesji tokenów sparowanych urządzeń zarządzanie urządzeniem jest ograniczone do własnego zakresu, chyba że
  wywołujący ma także `operator.admin`: użytkownicy bez admina mogą usuwać/unieważniać/obracać
  tylko **własny** wpis urządzenia.
- `device.token.rotate` sprawdza także żądany zestaw zakresów operatora względem
  bieżących zakresów sesji wywołującego. Użytkownicy bez admina nie mogą obracać tokenu do
  szerszego zestawu zakresów operatora, niż już posiadają.
- Niepowodzenia uwierzytelniania zawierają `error.details.code` oraz wskazówki odzyskiwania:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Zachowanie klienta dla `AUTH_TOKEN_MISMATCH`:
  - Zaufani klienci mogą podjąć jedną ograniczoną próbę ponowienia z tokenem per urządzenie z pamięci podręcznej.
  - Jeśli to ponowienie się nie powiedzie, klienci powinni zatrzymać automatyczne pętle ponownego łączenia i wyświetlić operatorowi wskazówki dotyczące działania.

## Tożsamość urządzenia + parowanie

- Węzły powinny zawierać stabilną tożsamość urządzenia (`device.id`) wyprowadzoną z
  odcisku palca pary kluczy.
- Gateway wydaje tokeny dla każdego urządzenia + roli.
- Zatwierdzenia parowania są wymagane dla nowych identyfikatorów urządzeń, chyba że włączono
  lokalne automatyczne zatwierdzanie.
- Automatyczne zatwierdzanie parowania jest skoncentrowane na bezpośrednich lokalnych połączeniach local loopback.
- OpenClaw ma także wąską ścieżkę samopołączenia backend/kontener-local dla
  zaufanych przepływów pomocniczych ze współdzielonym sekretem.
- Połączenia tailnet lub LAN z tego samego hosta są nadal traktowane jako zdalne na potrzeby parowania i
  wymagają zatwierdzenia.
- Wszyscy klienci WS muszą dołączać tożsamość `device` podczas `connect` (operator + node).
  Control UI może ją pominąć tylko w tych trybach:
  - `gateway.controlUi.allowInsecureAuth=true` dla zgodności z niezabezpieczonym HTTP tylko na localhost.
  - udane uwierzytelnianie operatora Control UI z `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tryb awaryjny, poważne obniżenie bezpieczeństwa).
- Wszystkie połączenia muszą podpisywać nonce dostarczone przez serwer w `connect.challenge`.

### Diagnostyka migracji uwierzytelniania urządzenia

Dla starszych klientów, którzy nadal używają zachowania podpisywania sprzed wyzwania, `connect` teraz zwraca
kody szczegółów `DEVICE_AUTH_*` pod `error.details.code` ze stabilnym `error.details.reason`.

Typowe niepowodzenia migracji:

| Komunikat                   | details.code                     | details.reason           | Znaczenie                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klient pominął `device.nonce` (lub wysłał pusty).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klient podpisał starym/błędnym nonce.              |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ładunek podpisu nie pasuje do ładunku v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Podpisany znacznik czasu jest poza dozwolonym odchyleniem. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` nie pasuje do odcisku palca klucza publicznego. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonikalizacja klucza publicznego nie powiodły się.         |

Cel migracji:

- Zawsze czekaj na `connect.challenge`.
- Podpisuj ładunek v2, który zawiera nonce serwera.
- Wyślij ten sam nonce w `connect.params.device.nonce`.
- Preferowany ładunek podpisu to `v3`, który wiąże `platform` i `deviceFamily`
  oprócz pól device/client/role/scopes/token/nonce.
- Starsze podpisy `v2` pozostają akceptowane ze względu na zgodność, ale przypinanie metadanych sparowanego urządzenia nadal kontroluje politykę poleceń przy ponownym połączeniu.

## TLS + pinning

- TLS jest obsługiwany dla połączeń WS.
- Klienci mogą opcjonalnie przypiąć odcisk palca certyfikatu gateway (zobacz konfigurację `gateway.tls`
  oraz `gateway.remote.tlsFingerprint` lub flagę CLI `--tls-fingerprint`).

## Zakres

Ten protokół udostępnia **pełne API gateway** (status, kanały, modele, czat,
agent, sesje, węzły, zatwierdzenia itd.). Dokładna powierzchnia jest zdefiniowana przez
schematy TypeBox w `src/gateway/protocol/schema.ts`.
