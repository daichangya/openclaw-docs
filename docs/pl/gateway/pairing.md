---
read_when:
    - Implementowanie zatwierdzeń parowania node bez interfejsu macOS UI
    - Dodawanie przepływów CLI do zatwierdzania zdalnych nodeów
    - Rozszerzanie protokołu Gateway o zarządzanie nodeami
summary: Parowanie node zarządzane przez Gateway (opcja B) dla iOS i innych zdalnych nodeów
title: Parowanie zarządzane przez Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

W parowaniu zarządzanym przez Gateway **Gateway** jest źródłem prawdy określającym, które nodey
mogą dołączyć. Interfejsy UI (aplikacja macOS, przyszli klienci) są tylko frontendami,
które zatwierdzają albo odrzucają oczekujące żądania.

**Ważne:** WS nodey używają **parowania urządzeń** (rola `node`) podczas `connect`.
`node.pair.*` to osobny magazyn parowania i **nie** ogranicza handshaku WS.
Tego przepływu używają tylko klienci, którzy jawnie wywołują `node.pair.*`.

## Pojęcia

- **Oczekujące żądanie**: node poprosił o dołączenie; wymaga zatwierdzenia.
- **Sparowany node**: zatwierdzony node z wydanym tokenem uwierzytelniania.
- **Transport**: endpoint Gateway WS przekazuje żądania dalej, ale nie decyduje
  o członkostwie. (Obsługa starszego mostu TCP została usunięta.)

## Jak działa parowanie

1. Node łączy się z Gateway WS i żąda parowania.
2. Gateway zapisuje **oczekujące żądanie** i emituje `node.pair.requested`.
3. Zatwierdzasz albo odrzucasz żądanie (CLI lub UI).
4. Po zatwierdzeniu Gateway wydaje **nowy token** (tokeny są obracane przy ponownym parowaniu).
5. Node łączy się ponownie przy użyciu tokena i jest teraz „sparowany”.

Oczekujące żądania wygasają automatycznie po **5 minutach**.

## Przepływ CLI (przyjazny dla trybu headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` pokazuje sparowane/podłączone nodey i ich możliwości.

## Powierzchnia API (protokół gateway)

Zdarzenia:

- `node.pair.requested` — emitowane, gdy tworzone jest nowe oczekujące żądanie.
- `node.pair.resolved` — emitowane, gdy żądanie zostanie zatwierdzone/odrzucone/wygaśnie.

Metody:

- `node.pair.request` — tworzy albo ponownie używa oczekującego żądania.
- `node.pair.list` — wyświetla oczekujące + sparowane nodey (`operator.pairing`).
- `node.pair.approve` — zatwierdza oczekujące żądanie (wydaje token).
- `node.pair.reject` — odrzuca oczekujące żądanie.
- `node.pair.verify` — weryfikuje `{ nodeId, token }`.

Uwagi:

- `node.pair.request` jest idempotentne per node: powtórzone wywołania zwracają to samo
  oczekujące żądanie.
- Powtórzone żądania dla tego samego oczekującego node odświeżają także zapisane metadane
  node oraz najnowszy snapshot zadeklarowanych poleceń z listy dozwolonych dla widoczności operatora.
- Zatwierdzenie **zawsze** generuje świeży token; żaden token nigdy nie jest zwracany przez
  `node.pair.request`.
- Żądania mogą zawierać `silent: true` jako wskazówkę dla przepływów automatycznego zatwierdzania.
- `node.pair.approve` używa zadeklarowanych poleceń oczekującego żądania do wymuszenia
  dodatkowych zakresów zatwierdzenia:
  - żądanie bez poleceń: `operator.pairing`
  - żądanie poleceń bez exec: `operator.pairing` + `operator.write`
  - żądanie `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Ważne:

- Parowanie node to przepływ zaufania/tożsamości oraz wydawania tokena.
- Nie przypina ono aktywnej powierzchni poleceń node per node.
- Aktywne polecenia node pochodzą z tego, co node deklaruje przy `connect` po zastosowaniu
  globalnych zasad poleceń node gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- Zasady `system.run` allow/ask per node znajdują się na node w
  `exec.approvals.node.*`, a nie w rekordzie parowania.

## Ograniczanie poleceń node (2026.3.31+)

<Warning>
**Zmiana niekompatybilna:** Począwszy od `2026.3.31`, polecenia node są wyłączone, dopóki parowanie node nie zostanie zatwierdzone. Samo parowanie urządzenia nie wystarcza już do udostępnienia zadeklarowanych poleceń node.
</Warning>

Gdy node łączy się po raz pierwszy, parowanie jest żądane automatycznie. Dopóki żądanie parowania nie zostanie zatwierdzone, wszystkie oczekujące polecenia node z tego node są filtrowane i nie zostaną wykonane. Po ustanowieniu zaufania przez zatwierdzenie parowania zadeklarowane polecenia node stają się dostępne zgodnie ze zwykłymi zasadami poleceń.

Oznacza to, że:

- Nodey, które wcześniej polegały wyłącznie na parowaniu urządzenia do ujawniania poleceń, muszą teraz ukończyć parowanie node.
- Polecenia zakolejkowane przed zatwierdzeniem parowania są odrzucane, a nie odraczane.

## Granice zaufania zdarzeń node (2026.3.31+)

<Warning>
**Zmiana niekompatybilna:** Uruchomienia pochodzące z node pozostają teraz na ograniczonej powierzchni zaufanej.
</Warning>

Podsumowania pochodzące z node i powiązane zdarzenia sesji są ograniczone do zamierzonej zaufanej powierzchni. Przepływy wywoływane powiadomieniami lub uruchamiane przez node, które wcześniej polegały na szerszym dostępie do narzędzi hosta lub sesji, mogą wymagać dostosowania. To utwardzenie zapewnia, że zdarzenia node nie mogą eskalować do dostępu do narzędzi poziomu hosta poza granice zaufania dozwolone dla danego node.

## Automatyczne zatwierdzanie (aplikacja macOS)

Aplikacja macOS może opcjonalnie spróbować **cichego zatwierdzenia**, gdy:

- żądanie jest oznaczone jako `silent`, oraz
- aplikacja może zweryfikować połączenie SSH z hostem gateway przy użyciu tego samego użytkownika.

Jeśli ciche zatwierdzenie się nie powiedzie, następuje powrót do zwykłego monitu „Approve/Reject”.

## Automatyczne zatwierdzanie urządzeń z zaufanym CIDR

Parowanie urządzeń WS dla `role: node` domyślnie pozostaje ręczne. W przypadku prywatnych
sieci node, w których Gateway już ufa ścieżce sieciowej, operatorzy mogą
włączyć to jawnie za pomocą CIDR-ów lub dokładnych adresów IP:

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
- Nie istnieje żaden ogólny tryb automatycznego zatwierdzania całej sieci LAN lub sieci prywatnej.
- Kwalifikuje się tylko świeże parowanie urządzenia `role: node` bez żądanych zakresów.
- Klienci operator, browser, Control UI i WebChat pozostają ręczni.
- Rozszerzenia ról, zakresów, metadanych i kluczy publicznych pozostają ręczne.
- Ścieżki nagłówków trusted-proxy loopback tego samego hosta nie kwalifikują się, ponieważ
  ta ścieżka może być podszyta przez lokalnych wywołujących.

## Automatyczne zatwierdzanie rozszerzeń metadanych

Gdy już sparowane urządzenie łączy się ponownie tylko ze zmianami metadanych
niewrażliwymi z punktu widzenia bezpieczeństwa (na przykład nazwa wyświetlana albo wskazówki platformy klienta), OpenClaw traktuje
to jako `metadata-upgrade`. Ciche automatyczne zatwierdzanie jest wąskie: dotyczy tylko
zaufanych lokalnych ponownych połączeń CLI/helper, które już dowiodły posiadania
współdzielonego tokena albo hasła przez loopback. Klienci browser/Control UI i klienci zdalni
nadal używają jawnego przepływu ponownego zatwierdzania. Rozszerzenia zakresów (z read do
write/admin) i zmiany klucza publicznego **nie** kwalifikują się do automatycznego zatwierdzania
`metadata-upgrade` — pozostają jawnymi żądaniami ponownego zatwierdzenia.

## Pomocnicy parowania QR

`/pair qr` renderuje ładunek parowania jako ustrukturyzowane media, aby klienci mobilni i przeglądarkowi mogli skanować go bezpośrednio.

Usunięcie urządzenia usuwa też wszelkie nieaktualne oczekujące żądania parowania dla tego
ID urządzenia, więc `nodes pending` nie pokazuje osieroconych wierszy po unieważnieniu.

## Lokalność i nagłówki przekazane dalej

Parowanie Gateway traktuje połączenie jako loopback tylko wtedy, gdy zarówno surowe gniazdo,
jak i wszelkie dowody proxy upstream są zgodne. Jeśli żądanie przychodzi przez loopback,
ale zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, które
wskazują na nielokalne źródło, te dowody z nagłówków przekazanych dalej unieważniają
twierdzenie o lokalności loopback. Ścieżka parowania wymaga wtedy jawnego zatwierdzenia
zamiast cicho traktować żądanie jako połączenie z tego samego hosta. Zobacz
[Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth), aby poznać równoważną zasadę dla
uwierzytelniania operatora.

## Przechowywanie (lokalne, prywatne)

Stan parowania jest przechowywany pod katalogiem stanu Gateway (domyślnie `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jeśli nadpiszesz `OPENCLAW_STATE_DIR`, folder `nodes/` przeniesie się razem z nim.

Uwagi dotyczące bezpieczeństwa:

- Tokeny są sekretami; traktuj `paired.json` jako dane wrażliwe.
- Obrócenie tokena wymaga ponownego zatwierdzenia (albo usunięcia wpisu node).

## Zachowanie transportu

- Transport jest **bezstanowy**; nie przechowuje członkostwa.
- Jeśli Gateway jest offline albo parowanie jest wyłączone, nodey nie mogą się parować.
- Jeśli Gateway działa w trybie zdalnym, parowanie nadal odbywa się względem magazynu zdalnego Gateway.

## Powiązane

- [Parowanie kanałów](/pl/channels/pairing)
- [Nodes](/pl/nodes)
- [CLI Devices](/pl/cli/devices)
