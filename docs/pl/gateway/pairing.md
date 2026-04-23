---
read_when:
    - Implementowanie zatwierdzeń parowania Node bez interfejsu macOS UI
    - Dodawanie przepływów CLI do zatwierdzania zdalnych Nodeów
    - Rozszerzanie protokołu Gateway o zarządzanie Nodeami
summary: Parowanie Node należące do Gateway (opcja B) dla iOS i innych zdalnych Nodeów
title: Parowanie należące do Gateway
x-i18n:
    generated_at: "2026-04-23T10:01:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Parowanie należące do Gateway (opcja B)

W parowaniu należącym do Gateway **Gateway** jest źródłem prawdy o tym, które Nodey
mogą dołączyć. Interfejsy użytkownika (aplikacja macOS, przyszłe klienty) są tylko frontendami,
które zatwierdzają lub odrzucają oczekujące żądania.

**Ważne:** Nodey WS używają **parowania urządzeń** (rola `node`) podczas `connect`.
`node.pair.*` to osobny magazyn parowania i **nie** kontroluje handshake WS.
Tylko klienty, które jawnie wywołują `node.pair.*`, używają tego przepływu.

## Pojęcia

- **Oczekujące żądanie**: Node poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany Node**: zatwierdzony Node z wydanym tokenem auth.
- **Transport**: endpoint Gateway WS przekazuje żądania dalej, ale nie decyduje
  o członkostwie. (Obsługa starszego mostka TCP została usunięta.)

## Jak działa parowanie

1. Node łączy się z Gateway WS i prosi o parowanie.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz lub odrzucasz żądanie (CLI albo UI).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są rotowane przy ponownym parowaniu).
5. Node łączy się ponownie, używając tokena, i jest teraz „sparowany”.

Oczekujące żądania wygasają automatycznie po **5 minutach**.

## Przepływ CLI (przyjazny dla środowisk headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` pokazuje sparowane/podłączone Nodey i ich możliwości.

## Powierzchnia API (protokół Gateway)

Zdarzenia:

- `node.pair.requested` — emitowane, gdy tworzone jest nowe oczekujące żądanie.
- `node.pair.resolved` — emitowane, gdy żądanie zostanie zatwierdzone/odrzucone/wygaśnie.

Metody:

- `node.pair.request` — tworzy albo ponownie używa oczekującego żądania.
- `node.pair.list` — wyświetla oczekujące + sparowane Nodey (`operator.pairing`).
- `node.pair.approve` — zatwierdza oczekujące żądanie (wydaje token).
- `node.pair.reject` — odrzuca oczekujące żądanie.
- `node.pair.verify` — weryfikuje `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne per Node: powtarzane wywołania zwracają to samo
  oczekujące żądanie.
- Powtarzane żądania dla tego samego oczekującego Node również odświeżają zapisane metadane
  Node oraz najnowszy snapshot zadeklarowanych poleceń z allowlist dla widoczności operatora.
- Zatwierdzenie **zawsze** generuje nowy token; żaden token nigdy nie jest zwracany przez
  `node.pair.request`.
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów automatycznego zatwierdzania.
- `node.pair.approve` używa zadeklarowanych poleceń z oczekującego żądania, aby wymusić
  dodatkowe zakresy zatwierdzania:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie z poleceniem niebędącym exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Ważne:

- Parowanie Node to przepływ zaufania/tożsamości plus wydawanie tokenów.
- Nie przypina ono aktywnej powierzchni poleceń Node per Node.
- Aktywne polecenia Node pochodzą z tego, co Node deklaruje przy `connect`, po zastosowaniu
  globalnej polityki poleceń Node w gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- Polityka allow/ask per Node dla `system.run` znajduje się na Node w
  `exec.approvals.node.*`, a nie w rekordzie parowania.

## Brakowanie poleceń Node (2026.3.31+)

<Warning>
**Breaking change:** Od wersji `2026.3.31` polecenia Node są wyłączone, dopóki parowanie Node nie zostanie zatwierdzone. Samo parowanie urządzenia nie wystarcza już do ujawnienia zadeklarowanych poleceń Node.
</Warning>

Gdy Node łączy się po raz pierwszy, parowanie jest automatycznie żądane. Dopóki żądanie parowania nie zostanie zatwierdzone, wszystkie oczekujące polecenia Node z tego Node są filtrowane i nie zostaną wykonane. Po ustanowieniu zaufania przez zatwierdzenie parowania zadeklarowane polecenia Node stają się dostępne zgodnie ze zwykłą polityką poleceń.

Oznacza to, że:

- Nodey, które wcześniej polegały wyłącznie na parowaniu urządzenia do ujawniania poleceń, muszą teraz ukończyć parowanie Node.
- Polecenia zakolejkowane przed zatwierdzeniem parowania są porzucane, a nie odraczane.

## Granice zaufania zdarzeń Node (2026.3.31+)

<Warning>
**Breaking change:** Przebiegi inicjowane przez Node pozostają teraz na ograniczonej powierzchni zaufanej.
</Warning>

Podsumowania pochodzące od Node i powiązane zdarzenia sesji są ograniczone do zamierzonej zaufanej powierzchni. Przepływy wyzwalane powiadomieniami lub przez Node, które wcześniej opierały się na szerszym dostępie do narzędzi hosta lub sesji, mogą wymagać dostosowania. To utwardzenie zapewnia, że zdarzenia Node nie mogą eskalować do dostępu do narzędzi na poziomie hosta poza tym, na co pozwala granica zaufania Node.

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie próbować **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem gateway przy użyciu tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje powrót do zwykłego promptu „Approve/Reject”.

## Automatyczne zatwierdzanie aktualizacji metadanych

Gdy już sparowane urządzenie łączy się ponownie tylko ze zmianami metadanych
niewrażliwych na bezpieczeństwo (na przykład nazwa wyświetlana albo wskazówki platformy klienta), OpenClaw traktuje
to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie ma wąski zakres: dotyczy tylko
zaufanych lokalnych ponownych połączeń CLI/helperów, które już udowodniły posiadanie
współdzielonego tokena lub hasła przez loopback. Klienty przeglądarkowe/Control UI oraz
zdalne klienty nadal używają jawnego przepływu ponownego zatwierdzania. Rozszerzenia zakresu
(read do write/admin) i zmiany kluczy publicznych **nie** kwalifikują się do
automatycznego zatwierdzania `metadata-upgrade` — pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Helpery parowania QR

`/pair qr` renderuje ładunek parowania jako ustrukturyzowane multimedia, aby klienty
mobilne i przeglądarkowe mogły skanować go bezpośrednio.

Usunięcie urządzenia usuwa również wszystkie stare oczekujące żądania parowania dla tego
identyfikatora urządzenia, więc `nodes pending` nie pokazuje osieroconych wierszy po
odwołaniu.

## Lokalność i nagłówki przekazywane dalej

Parowanie Gateway traktuje połączenie jako loopback tylko wtedy, gdy zarówno surowe gniazdo,
jak i wszelkie dowody z upstream proxy są zgodne. Jeśli żądanie dociera przez loopback, ale
zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, które
wskazują na nielokalne źródło, ten dowód z przekazanych nagłówków unieważnia deklarację
lokalności loopback. Ścieżka parowania wymaga wtedy jawnego zatwierdzenia zamiast
cicho traktować żądanie jako połączenie z tego samego hosta. Zobacz
[Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth), aby poznać równoważną regułę dla
uwierzytelniania operatora.

## Przechowywanie (lokalne, prywatne)

Stan parowania jest przechowywany w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jeśli nadpiszesz `OPENCLAW_STATE_DIR`, folder `nodes/` przeniesie się razem z nim.

Uwagi dotyczące bezpieczeństwa:

- Tokeny są sekretami; traktuj `paired.json` jako dane wrażliwe.
- Rotacja tokena wymaga ponownego zatwierdzenia (albo usunięcia wpisu Node).

## Zachowanie transportu

- Transport jest **bezstanowy**; nie przechowuje członkostwa.
- Jeśli Gateway jest offline albo parowanie jest wyłączone, Nodey nie mogą się sparować.
- Jeśli Gateway działa w trybie zdalnym, parowanie nadal odbywa się względem magazynu zdalnego Gateway.
