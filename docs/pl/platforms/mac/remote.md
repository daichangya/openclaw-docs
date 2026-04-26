---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania komputerem Mac
summary: Przepływ aplikacji macOS do sterowania zdalnym Gateway OpenClaw przez SSH
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-04-26T11:35:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Zdalny OpenClaw (macOS ⇄ host zdalny)

Ten przepływ pozwala aplikacji macOS działać jako pełnoprawne zdalne sterowanie dla Gateway OpenClaw uruchomionego na innym hoście (komputerze stacjonarnym/serwerze). To funkcja aplikacji **Remote over SSH** (zdalne uruchamianie). Wszystkie funkcje — kontrole kondycji, przekazywanie Voice Wake i Web Chat — używają tej samej zdalnej konfiguracji SSH z _Settings → General_.

## Tryby

- **Lokalnie (ten Mac)**: wszystko działa na laptopie. SSH nie jest używane.
- **Remote over SSH (domyślnie)**: polecenia OpenClaw są wykonywane na zdalnym hoście. Aplikacja mac otwiera połączenie SSH z `-o BatchMode` oraz wybranym przez Ciebie plikiem tożsamości/kluczem i lokalnym przekierowaniem portu.
- **Remote direct (ws/wss)**: bez tunelu SSH. Aplikacja mac łączy się bezpośrednio z adresem URL Gateway (na przykład przez Tailscale Serve albo publiczny odwrotny serwer proxy HTTPS).

## Zdalne transporty

Tryb zdalny obsługuje dwa transporty:

- **Tunel SSH** (domyślnie): używa `ssh -N -L ...` do przekierowania portu Gateway na localhost. Gateway będzie widzieć adres IP Node jako `127.0.0.1`, ponieważ tunel jest local loopback.
- **Direct (ws/wss)**: łączy się bezpośrednio z adresem URL Gateway. Gateway widzi prawdziwy adres IP klienta.

W trybie tunelu SSH wykryte nazwy hostów LAN/tailnet są zapisywane jako
`gateway.remote.sshTarget`. Aplikacja utrzymuje `gateway.remote.url` ustawione na lokalny
punkt końcowy tunelu, na przykład `ws://127.0.0.1:18789`, dzięki czemu CLI, Web Chat i
lokalna usługa hosta Node używają tego samego bezpiecznego transportu loopback.

Automatyzacja przeglądarki w trybie zdalnym należy do hosta Node CLI, a nie do
natywnego Node aplikacji macOS. Aplikacja uruchamia zainstalowaną usługę hosta Node, gdy
to możliwe; jeśli potrzebujesz sterowania przeglądarką z tego Maca, zainstaluj/uruchom ją za pomocą
`openclaw node install ...` i `openclaw node start` (lub uruchom
`openclaw node run ...` na pierwszym planie), a następnie wskaż ten Node
z obsługą przeglądarki.

## Wymagania wstępne na zdalnym hoście

1. Zainstaluj Node + pnpm oraz zbuduj/zainstaluj CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` jest na PATH dla nieinteraktywnych powłok (w razie potrzeby utwórz dowiązanie symboliczne w `/usr/local/bin` lub `/opt/homebrew/bin`).
3. Włącz SSH z uwierzytelnianiem kluczem. Zalecamy adresy IP **Tailscale** dla stabilnej osiągalności poza LAN.

## Konfiguracja aplikacji macOS

1. Otwórz _Settings → General_.
2. W sekcji **OpenClaw runs** wybierz **Remote over SSH** i ustaw:
   - **Transport**: **SSH tunnel** albo **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opcjonalnie `:port`).
     - Jeśli Gateway znajduje się w tej samej sieci LAN i rozgłasza Bonjour, wybierz go z wykrytej listy, aby automatycznie wypełnić to pole.
   - **Gateway URL** (tylko Direct): `wss://gateway.example.ts.net` (albo `ws://...` dla lokalnego/LAN).
   - **Identity file** (zaawansowane): ścieżka do Twojego klucza.
   - **Project root** (zaawansowane): ścieżka do zdalnego checkoutu używana dla poleceń.
   - **CLI path** (zaawansowane): opcjonalna ścieżka do uruchamialnego entrypointu/pliku binarnego `openclaw` (automatycznie wypełniana, gdy jest rozgłaszana).
3. Kliknij **Test remote**. Powodzenie oznacza, że zdalne `openclaw status --json` uruchamia się poprawnie. Niepowodzenia zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie zostało znalezione zdalnie.
4. Kontrole kondycji i Web Chat będą teraz automatycznie działać przez ten tunel SSH.

## Web Chat

- **Tunel SSH**: Web Chat łączy się z Gateway przez przekierowany port sterowania WebSocket (domyślnie 18789).
- **Direct (ws/wss)**: Web Chat łączy się bezpośrednio ze skonfigurowanym adresem URL Gateway.
- Nie ma już osobnego serwera HTTP WebChat.

## Uprawnienia

- Zdalny host potrzebuje tych samych zgód TCC co lokalny (Automatyzacja, Dostępność, Nagrywanie ekranu, Mikrofon, Rozpoznawanie mowy, Powiadomienia). Uruchom onboarding na tej maszynie, aby przyznać je jednorazowo.
- Node ogłaszają swój stan uprawnień przez `node.list` / `node.describe`, aby agenci wiedzieli, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj powiązania loopback na zdalnym hoście i łącz się przez SSH albo Tailscale.
- Tunelowanie SSH używa ścisłego sprawdzania klucza hosta; najpierw zaufaj kluczowi hosta, aby istniał w `~/.ssh/known_hosts`.
- Jeśli powiążesz Gateway z interfejsem innym niż loopback, wymagaj prawidłowego uwierzytelniania Gateway: tokena, hasła albo odwrotnego serwera proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Security](/pl/gateway/security) i [Tailscale](/pl/gateway/tailscale).

## Przepływ logowania WhatsApp (zdalnie)

- Uruchom `openclaw channels login --verbose` **na zdalnym hoście**. Zeskanuj kod QR za pomocą WhatsApp na telefonie.
- Uruchom logowanie ponownie na tym hoście, jeśli uwierzytelnienie wygaśnie. Kontrola kondycji pokaże problemy z połączeniem.

## Rozwiązywanie problemów

- **exit 127 / not found**: `openclaw` nie znajduje się na PATH dla powłok niebędących powłokami logowania. Dodaj je do `/etc/paths`, pliku rc swojej powłoki albo utwórz dowiązanie symboliczne w `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: sprawdź dostępność SSH, PATH oraz czy Baileys jest zalogowany (`openclaw status --json`).
- **Web Chat stuck**: potwierdź, że Gateway działa na zdalnym hoście i że przekierowany port odpowiada portowi WS Gateway; interfejs wymaga zdrowego połączenia WS.
- **Node IP shows 127.0.0.1**: to oczekiwane przy tunelu SSH. Przełącz **Transport** na **Direct (ws/wss)**, jeśli chcesz, aby Gateway widział prawdziwy adres IP klienta.
- **Voice Wake**: frazy wybudzające są przekazywane automatycznie w trybie zdalnym; nie jest potrzebny osobny forwarder.

## Dźwięki powiadomień

Wybieraj dźwięki osobno dla każdego powiadomienia ze skryptów za pomocą `openclaw` i `node.invoke`, na przykład:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

W aplikacji nie ma już globalnego przełącznika „domyślny dźwięk”; wywołujący wybierają dźwięk (albo jego brak) dla każdego żądania osobno.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Dostęp zdalny](/pl/gateway/remote)
