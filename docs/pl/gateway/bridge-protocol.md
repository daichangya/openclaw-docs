---
read_when:
    - Tworzenie lub debugowanie klientów Node (tryb Node na iOS/Android/macOS)
    - Badanie awarii parowania lub autoryzacji bridge
    - Audyt powierzchni Node udostępnianej przez gateway
summary: 'Historyczny protokół bridge (starsze Node): TCP JSONL, parowanie, RPC z ograniczonym zakresem'
title: Protokół bridge
x-i18n:
    generated_at: "2026-04-25T13:46:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
TCP bridge został **usunięty**. Bieżące kompilacje OpenClaw nie zawierają listenera bridge, a klucze konfiguracji `bridge.*` nie są już częścią schematu. Ta strona jest zachowana wyłącznie jako odniesienie historyczne. Używaj [Protokołu Gateway](/pl/gateway/protocol) dla wszystkich klientów Node/operatora.
</Warning>

## Dlaczego istniał

- **Granica bezpieczeństwa**: bridge udostępnia małą listę dozwolonych elementów zamiast
  pełnej powierzchni API gateway.
- **Parowanie + tożsamość Node**: dopuszczenie Node jest zarządzane przez gateway i powiązane
  z tokenem per Node.
- **UX wykrywania**: Node mogą wykrywać gateway przez Bonjour w sieci LAN albo łączyć się
  bezpośrednio przez tailnet.
- **Loopback WS**: pełna płaszczyzna sterowania WS pozostaje lokalna, chyba że zostanie tunelowana przez SSH.

## Transport

- TCP, jeden obiekt JSON na linię (JSONL).
- Opcjonalny TLS (gdy `bridge.tls.enabled` ma wartość true).
- Historyczny domyślny port listenera to `18790` (bieżące kompilacje nie uruchamiają
  TCP bridge).

Gdy TLS jest włączony, rekordy discovery TXT zawierają `bridgeTls=1` oraz
`bridgeTlsSha256` jako niejawną podpowiedź. Pamiętaj, że rekordy TXT Bonjour/mDNS są
nieuwierzytelnione; klienci nie mogą traktować reklamowanego fingerprint jako
autorytatywnego pinu bez wyraźnej intencji użytkownika lub innej weryfikacji poza pasmem.

## Handshake + parowanie

1. Klient wysyła `hello` z metadanymi Node + tokenem (jeśli jest już sparowany).
2. Jeśli nie jest sparowany, gateway odpowiada `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klient wysyła `pair-request`.
4. Gateway czeka na zatwierdzenie, a następnie wysyła `pair-ok` i `hello-ok`.

Historycznie `hello-ok` zwracał `serverName` i mógł zawierać
`canvasHostUrl`.

## Ramki

Klient → Gateway:

- `req` / `res`: RPC gateway o ograniczonym zakresie (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sygnały Node (transkrypcja głosu, żądanie agenta, subskrypcja czatu, cykl życia exec)

Gateway → Klient:

- `invoke` / `invoke-res`: polecenia Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aktualizacje czatu dla subskrybowanych sesji
- `ping` / `pong`: keepalive

Historyczne egzekwowanie listy dozwolonych znajdowało się w `src/gateway/server-bridge.ts` (usunięte).

## Zdarzenia cyklu życia exec

Node mogą emitować zdarzenia `exec.finished` lub `exec.denied`, aby ujawniać aktywność system.run.
Są one mapowane na zdarzenia systemowe w gateway. (Starsze Node mogą nadal emitować `exec.started`.)

Pola payloadu (wszystkie opcjonalne, chyba że zaznaczono inaczej):

- `sessionKey` (wymagane): sesja agenta, która ma otrzymać zdarzenie systemowe.
- `runId`: unikalny identyfikator exec do grupowania.
- `command`: surowy lub sformatowany ciąg polecenia.
- `exitCode`, `timedOut`, `success`, `output`: szczegóły zakończenia (tylko finished).
- `reason`: powód odmowy (tylko denied).

## Historyczne użycie tailnet

- Powiąż bridge z adresem IP tailnet: `bridge.bind: "tailnet"` w
  `~/.openclaw/openclaw.json` (tylko historycznie; `bridge.*` nie jest już prawidłowe).
- Klienci łączą się przez nazwę MagicDNS albo adres IP tailnet.
- Bonjour **nie** działa między sieciami; w razie potrzeby użyj ręcznie hosta/portu albo DNS‑SD dla szerokiego obszaru.

## Wersjonowanie

Bridge był **niejawną wersją v1** (bez negocjacji min/max). Ta sekcja stanowi
wyłącznie odniesienie historyczne; bieżący klienci Node/operatora używają WebSocket
[Protokołu Gateway](/pl/gateway/protocol).

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)
- [Node](/pl/nodes)
