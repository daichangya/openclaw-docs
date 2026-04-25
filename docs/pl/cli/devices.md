---
read_when:
    - Zatwierdzasz żądania parowania urządzeń
    - Musisz obrócić lub unieważnić tokeny urządzeń
summary: Dokumentacja referencyjna CLI dla `openclaw devices` (parowanie urządzeń + rotacja/unieważnianie tokenów)
title: Urządzenia
x-i18n:
    generated_at: "2026-04-25T13:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Zarządzaj żądaniami parowania urządzeń i tokenami o zakresie urządzenia.

## Polecenia

### `openclaw devices list`

Wyświetl oczekujące żądania parowania i sparowane urządzenia.

```
openclaw devices list
openclaw devices list --json
```

W danych wyjściowych oczekującego żądania żądany dostęp jest pokazywany obok bieżącego
zatwierdzonego dostępu urządzenia, gdy urządzenie jest już sparowane. Dzięki temu
rozszerzenia zakresu/roli są widoczne zamiast sprawiać wrażenie, że parowanie zostało utracone.

### `openclaw devices remove <deviceId>`

Usuń jeden wpis sparowanego urządzenia.

Gdy uwierzytelniasz się za pomocą tokena sparowanego urządzenia, wywołujący bez uprawnień administratora mogą
usuwać tylko wpis **własnego** urządzenia. Usunięcie innego urządzenia wymaga
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Wyczyść sparowane urządzenia zbiorczo.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Zatwierdź oczekujące żądanie parowania urządzenia według dokładnego `requestId`. Jeśli `requestId`
zostanie pominięte lub zostanie przekazane `--latest`, OpenClaw tylko wyświetli wybrane
oczekujące żądanie i zakończy działanie; uruchom zatwierdzanie ponownie z dokładnym ID
żądania po zweryfikowaniu szczegółów.

Uwaga: jeśli urządzenie ponawia próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz
publiczny), OpenClaw zastępuje poprzedni oczekujący wpis i wydaje nowe
`requestId`. Uruchom `openclaw devices list` bezpośrednio przed zatwierdzeniem, aby użyć
bieżącego ID.

Jeśli urządzenie jest już sparowane i prosi o szersze zakresy lub szerszą rolę,
OpenClaw zachowuje istniejące zatwierdzenie i tworzy nowe oczekujące żądanie
rozszerzenia. Przejrzyj kolumny `Requested` i `Approved` w `openclaw devices list`
albo użyj `openclaw devices approve --latest`, aby podejrzeć dokładne rozszerzenie przed
jego zatwierdzeniem.

Jeśli Gateway jest jawnie skonfigurowany z
`gateway.nodes.pairing.autoApproveCidrs`, żądania `role: node` od nowych urządzeń z
pasujących adresów IP klientów mogą zostać zatwierdzone, zanim pojawią się na tej liście. Ta zasada
jest domyślnie wyłączona i nigdy nie dotyczy klientów operator/browser ani żądań rozszerzenia.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Odrzuć oczekujące żądanie parowania urządzenia.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Obróć token urządzenia dla określonej roli (opcjonalnie aktualizując zakresy).
Rola docelowa musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia;
rotacja nie może wygenerować nowej niezatwierdzonej roli.
Jeśli pominiesz `--scope`, późniejsze ponowne połączenia ze zapisanym obróconym tokenem ponownie użyją
buforowanych zatwierdzonych zakresów tego tokena. Jeśli przekażesz jawne wartości `--scope`,
staną się one zapisanym zestawem zakresów dla przyszłych ponownych połączeń z tokenem z pamięci podręcznej.
Wywołujący bez uprawnień administratora, używający sparowanego urządzenia, mogą obracać tylko
token **własnego** urządzenia.
Ponadto wszelkie jawne wartości `--scope` muszą mieścić się w zakresie własnych
zakresów operatora sesji wywołującego; rotacja nie może wygenerować szerszego tokena operatora niż ten,
który wywołujący już ma.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Zwraca nowy ładunek tokena jako JSON.

### `openclaw devices revoke --device <id> --role <role>`

Unieważnij token urządzenia dla określonej roli.

Wywołujący bez uprawnień administratora, używający sparowanego urządzenia, mogą unieważniać tylko
token **własnego** urządzenia.
Unieważnienie tokena innego urządzenia wymaga `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Zwraca wynik unieważnienia jako JSON.

## Typowe opcje

- `--url <url>`: URL WebSocket Gateway (domyślnie `gateway.remote.url`, jeśli skonfigurowano).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--password <password>`: hasło Gateway (uwierzytelnianie hasłem).
- `--timeout <ms>`: limit czasu RPC.
- `--json`: wyjście JSON (zalecane do skryptów).

Uwaga: gdy ustawisz `--url`, CLI nie używa zapasowo poświadczeń z config ani środowiska.
Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

## Uwagi

- Rotacja tokena zwraca nowy token (wrażliwy). Traktuj go jak sekret.
- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` to opcjonalna zasada Gateway dla
  parowania tylko nowych urządzeń node; nie zmienia uprawnień zatwierdzania w CLI.
- Rotacja tokena pozostaje w granicach zatwierdzonego zestawu ról parowania i zatwierdzonej
  bazowej linii zakresów dla tego urządzenia. Przypadkowy wpis tokena z pamięci podręcznej nie przyznaje
  nowego celu rotacji.
- W przypadku sesji tokena sparowanego urządzenia zarządzanie między urządzeniami jest tylko dla administratora:
  `remove`, `rotate` i `revoke` dotyczą tylko własnego urządzenia, chyba że wywołujący ma
  `operator.admin`.
- `devices clear` jest celowo chronione przez `--yes`.
- Jeśli zakres parowania jest niedostępny w local loopback (i nie przekazano jawnie `--url`), `list`/`approve` mogą użyć lokalnego trybu zapasowego parowania.
- `devices approve` wymaga jawnego ID żądania przed wygenerowaniem tokenów; pominięcie `requestId` lub przekazanie `--latest` tylko wyświetla podgląd najnowszego oczekującego żądania.

## Lista kontrolna odzyskiwania po rozjechaniu tokenów

Użyj jej, gdy Control UI lub inni klienci nadal zawodzą z `AUTH_TOKEN_MISMATCH` lub `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Potwierdź bieżące źródło tokena gateway:

```bash
openclaw config get gateway.auth.token
```

2. Wyświetl sparowane urządzenia i zidentyfikuj ID problematycznego urządzenia:

```bash
openclaw devices list
```

3. Obróć token operatora dla problematycznego urządzenia:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jeśli rotacja nie wystarcza, usuń nieaktualne parowanie i zatwierdź ponownie:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Ponów próbę połączenia klienta z bieżącym współdzielonym tokenem/hasłem.

Uwagi:

- Zwykła kolejność pierwszeństwa uwierzytelniania przy ponownym połączeniu to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, następnie zapisany token urządzenia, a na końcu token bootstrap.
- Zaufane odzyskiwanie po `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać razem zarówno współdzielony token, jak i zapisany token urządzenia dla jednej ograniczonej próby ponowienia.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem Dashboard](/pl/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Nodes](/pl/nodes)
