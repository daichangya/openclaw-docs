---
read_when:
    - Implementowanie zatwierdzeń Pairing węzłów bez interfejsu macOS UI
    - Dodawanie przepływów CLI do zatwierdzania zdalnych Node
    - Rozszerzanie protokołu Gateway o zarządzanie Node
summary: Pairing węzłów zarządzane przez Gateway (Opcja B) dla iOS i innych zdalnych Node
title: Pairing zarządzany przez Gateway
x-i18n:
    generated_at: "2026-04-26T11:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

W pairing zarządzanym przez Gateway to **Gateway** jest źródłem prawdy o tym, które Node mogą dołączyć. Interfejsy użytkownika (aplikacja macOS, przyszli klienci) są tylko frontendami do zatwierdzania lub odrzucania oczekujących żądań.

**Ważne:** Node WS używają **device pairing** (rola `node`) podczas `connect`.
`node.pair.*` to osobny magazyn Pairing i **nie** bramkuje handshake WS.
Tego przepływu używają tylko klienci, którzy jawnie wywołują `node.pair.*`.

## Pojęcia

- **Oczekujące żądanie**: Node poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany Node**: zatwierdzony Node z wydanym tokenem uwierzytelniającym.
- **Transport**: endpoint Gateway WS przekazuje żądania dalej, ale nie decyduje o członkostwie. (Obsługa starszego mostka TCP została usunięta.)

## Jak działa Pairing

1. Node łączy się z Gateway WS i żąda Pairing.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz lub odrzucasz żądanie (CLI lub UI).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są rotowane przy ponownym Pairing).
5. Node łączy się ponownie, używając tokena, i jest teraz „sparowany”.

Oczekujące żądania wygasają automatycznie po **5 minutach**.

## Przepływ CLI (przyjazny dla środowiska headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` pokazuje sparowane/podłączone Node i ich możliwości.

## Powierzchnia API (protokół Gateway)

Zdarzenia:

- `node.pair.requested` — emitowane, gdy tworzone jest nowe oczekujące żądanie.
- `node.pair.resolved` — emitowane, gdy żądanie zostaje zatwierdzone/odrzucone/wygasa.

Metody:

- `node.pair.request` — tworzy lub ponownie używa oczekującego żądania.
- `node.pair.list` — wyświetla oczekujące + sparowane Node (`operator.pairing`).
- `node.pair.approve` — zatwierdza oczekujące żądanie (wydaje token).
- `node.pair.reject` — odrzuca oczekujące żądanie.
- `node.pair.verify` — weryfikuje `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne per Node: powtarzane wywołania zwracają to samo oczekujące żądanie.
- Powtarzane żądania dla tego samego oczekującego Node odświeżają też zapisane metadane Node oraz najnowszą migawkę zadeklarowanych poleceń z listy dozwolonych dla widoczności operatora.
- Zatwierdzenie **zawsze** generuje świeży token; żaden token nigdy nie jest zwracany z `node.pair.request`.
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów automatycznego zatwierdzania.
- `node.pair.approve` używa zadeklarowanych poleceń oczekującego żądania do egzekwowania dodatkowych zakresów zatwierdzania:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie polecenia innego niż exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Ważne:

- Pairing Node to przepływ zaufania/tożsamości plus wydawanie tokenów.
- **Nie** przypina on aktywnej powierzchni poleceń Node dla konkretnego Node.
- Aktywne polecenia Node pochodzą z tego, co Node deklaruje przy połączeniu po zastosowaniu globalnej polityki poleceń Node w Gateway (`gateway.nodes.allowCommands` / `denyCommands`).
- Polityka per Node dla `system.run` typu allow/ask znajduje się na Node w `exec.approvals.node.*`, a nie w rekordzie Pairing.

## Bramkowanie poleceń Node (2026.3.31+)

<Warning>
**Breaking change:** Począwszy od `2026.3.31`, polecenia Node są wyłączone do czasu zatwierdzenia Pairing Node. Sam device pairing nie wystarcza już do ujawnienia zadeklarowanych poleceń Node.
</Warning>

Gdy Node łączy się po raz pierwszy, Pairing jest żądany automatycznie. Dopóki żądanie Pairing nie zostanie zatwierdzone, wszystkie oczekujące polecenia Node z tego Node są filtrowane i nie zostaną wykonane. Gdy zaufanie zostanie ustanowione przez zatwierdzenie Pairing, zadeklarowane polecenia Node stają się dostępne zgodnie z normalną polityką poleceń.

Oznacza to, że:

- Node, które wcześniej polegały wyłącznie na device pairing do ujawniania poleceń, muszą teraz ukończyć node pairing.
- Polecenia zakolejkowane przed zatwierdzeniem Pairing są odrzucane, a nie odraczane.

## Granice zaufania zdarzeń Node (2026.3.31+)

<Warning>
**Breaking change:** Przebiegi pochodzące z Node pozostają teraz na ograniczonej zaufanej powierzchni.
</Warning>

Podsumowania pochodzące z Node i powiązane zdarzenia sesji są ograniczone do zamierzonej zaufanej powierzchni. Przepływy sterowane powiadomieniami lub wyzwalane przez Node, które wcześniej polegały na szerszym dostępie do narzędzi hosta lub sesji, mogą wymagać dostosowania. To utwardzenie zapewnia, że zdarzenia Node nie mogą eskalować do dostępu do narzędzi na poziomie hosta poza granicami zaufania dozwolonymi dla tego Node.

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie podjąć próbę **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem Gateway z użyciem tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje fallback do zwykłego promptu „Approve/Reject”.

## Automatyczne zatwierdzanie urządzeń z zaufanych CIDR

Device pairing WS dla `role: node` domyślnie pozostaje ręczne. Dla prywatnych
sieci Node, w których Gateway już ufa ścieżce sieciowej, operatorzy mogą
włączyć opt-in za pomocą jawnych CIDR lub dokładnych adresów IP:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Granica bezpieczeństwa:

- Wyłączone, gdy `gateway.nodes.pairing.autoApproveCidrs` nie jest ustawione.
- Nie istnieje ogólny tryb automatycznego zatwierdzania dla LAN ani sieci prywatnych.
- Kwalifikuje się tylko świeży device pairing `role: node` bez żądanych zakresów.
- Klienci operator, browser, Control UI i WebChat pozostają ręczni.
- Aktualizacje roli, zakresów, metadanych i klucza publicznego pozostają ręczne.
- Ścieżki nagłówków trusted-proxy z local loopback na tym samym hoście nie kwalifikują się, ponieważ ta ścieżka może być spoofowana przez lokalnych wywołujących.

## Automatyczne zatwierdzanie aktualizacji metadanych

Gdy już sparowane urządzenie łączy się ponownie tylko ze zmianami w niewrażliwych
metadanych (na przykład wyświetlana nazwa lub wskazówki platformy klienta), OpenClaw traktuje to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie jest wąskie: dotyczy tylko zaufanych lokalnych ponownych połączeń nieprzeglądarkowych, które już udowodniły posiadanie lokalnych lub współdzielonych poświadczeń, w tym ponownych połączeń natywnych aplikacji na tym samym hoście po zmianach metadanych wersji systemu operacyjnego. Klienci browser/Control UI oraz klienci zdalni nadal używają jawnego przepływu ponownego zatwierdzania. Aktualizacje zakresów (read do write/admin) oraz zmiany klucza publicznego **nie** kwalifikują się do automatycznego zatwierdzania `metadata-upgrade` — pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Helpery Pairing QR

`/pair qr` renderuje payload Pairing jako ustrukturyzowane media, dzięki czemu klienci mobilni i przeglądarkowi mogą go bezpośrednio skanować.

Usunięcie urządzenia czyści także wszelkie nieaktualne oczekujące żądania Pairing dla tego identyfikatora urządzenia, dzięki czemu `nodes pending` nie pokazuje osieroconych wierszy po cofnięciu uprawnień.

## Lokalność i przekazywane nagłówki

Gateway Pairing traktuje połączenie jako local loopback tylko wtedy, gdy zarówno surowe gniazdo, jak i wszelkie dowody z upstream proxy są zgodne. Jeśli żądanie dociera przez loopback, ale zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, które wskazują na źródło nielokalne, ten dowód z przekazywanych nagłówków dyskwalifikuje twierdzenie o lokalności loopback. Ścieżka Pairing wymaga wtedy jawnego zatwierdzenia zamiast cichego traktowania żądania jako połączenia z tego samego hosta. Zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth), aby poznać równoważną regułę dla uwierzytelniania operatora.

## Przechowywanie (lokalne, prywatne)

Stan Pairing jest przechowywany w katalogu stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jeśli nadpiszesz `OPENCLAW_STATE_DIR`, folder `nodes/` zostanie przeniesiony razem z nim.

Uwagi bezpieczeństwa:

- Tokeny są sekretami; traktuj `paired.json` jako dane wrażliwe.
- Rotacja tokena wymaga ponownego zatwierdzenia (albo usunięcia wpisu Node).

## Zachowanie transportu

- Transport jest **bezstanowy**; nie przechowuje członkostwa.
- Jeśli Gateway jest offline albo Pairing jest wyłączony, Node nie mogą wykonać Pairing.
- Jeśli Gateway działa w trybie zdalnym, Pairing nadal odbywa się względem magazynu zdalnego Gateway.

## Powiązane

- [Channel pairing](/pl/channels/pairing)
- [Nodes](/pl/nodes)
- [Devices CLI](/pl/cli/devices)
