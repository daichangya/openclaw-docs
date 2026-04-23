---
read_when:
    - Zatwierdzasz żądania parowania urządzeń
    - Musisz obrócić lub unieważnić tokeny urządzeń
summary: Dokumentacja CLI dla `openclaw devices` (parowanie urządzeń + rotacja/unieważnianie tokenów)
title: urządzenia
x-i18n:
    generated_at: "2026-04-23T09:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
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

Wynik dla oczekujących żądań pokazuje żądany dostęp obok aktualnie
zatwierdzonego dostępu urządzenia, jeśli urządzenie jest już sparowane. Dzięki
temu rozszerzenia zakresu/roli są widoczne zamiast sprawiać wrażenie, że
parowanie zostało utracone.

### `openclaw devices remove <deviceId>`

Usuń pojedynczy wpis sparowanego urządzenia.

Gdy uwierzytelniasz się za pomocą tokenu sparowanego urządzenia, wywołujący bez
uprawnień administratora mogą usuwać tylko **własny** wpis urządzenia. Usunięcie
innego urządzenia wymaga `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Wyczyść zbiorczo sparowane urządzenia.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Zatwierdź oczekujące żądanie parowania urządzenia według dokładnego `requestId`. Jeśli `requestId`
zostanie pominięte lub zostanie przekazane `--latest`, OpenClaw tylko wyświetli wybrane oczekujące
żądanie i zakończy działanie; uruchom zatwierdzenie ponownie z dokładnym ID żądania po zweryfikowaniu
szczegółów.

Uwaga: jeśli urządzenie ponowi próbę parowania ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz
publiczny), OpenClaw zastępuje poprzedni oczekujący wpis i wystawia nowe
`requestId`. Uruchom `openclaw devices list` bezpośrednio przed zatwierdzeniem, aby użyć
aktualnego ID.

Jeśli urządzenie jest już sparowane i prosi o szersze zakresy lub szerszą rolę,
OpenClaw zachowuje istniejące zatwierdzenie i tworzy nowe oczekujące żądanie
rozszerzenia. Przejrzyj kolumny `Requested` i `Approved` w `openclaw devices list`
lub użyj `openclaw devices approve --latest`, aby podejrzeć dokładne rozszerzenie przed
zatwierdzeniem.

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
Docelowa rola musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia;
rotacja nie może utworzyć nowej niezatwierdzonej roli.
Jeśli pominiesz `--scope`, późniejsze ponowne połączenia z użyciem zapisanego obróconego tokenu
użyją zapisanych w cache zatwierdzonych zakresów tego tokenu. Jeśli przekażesz jawne wartości `--scope`,
staną się one zapisanym zestawem zakresów dla przyszłych ponownych połączeń z tokenem z cache.
Wywołujący ze sparowanego urządzenia bez uprawnień administratora mogą obracać tylko **własny** token urządzenia.
Dodatkowo wszelkie jawne wartości `--scope` muszą mieścić się w zakresach operatora bieżącej sesji wywołującego;
rotacja nie może utworzyć szerszego tokenu operatora, niż wywołujący już posiada.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Zwraca nowy payload tokenu jako JSON.

### `openclaw devices revoke --device <id> --role <role>`

Unieważnij token urządzenia dla określonej roli.

Wywołujący ze sparowanego urządzenia bez uprawnień administratora mogą unieważniać tylko **własny** token urządzenia.
Unieważnienie tokenu innego urządzenia wymaga `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Zwraca wynik unieważnienia jako JSON.

## Wspólne opcje

- `--url <url>`: URL WebSocket Gateway (domyślnie `gateway.remote.url`, jeśli skonfigurowano).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--password <password>`: hasło Gateway (uwierzytelnianie hasłem).
- `--timeout <ms>`: timeout RPC.
- `--json`: wyjście JSON (zalecane do skryptów).

Uwaga: gdy ustawisz `--url`, CLI nie używa fallbacku do poświadczeń z konfiguracji ani środowiska.
Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

## Uwagi

- Rotacja tokenu zwraca nowy token (wrażliwy). Traktuj go jak sekret.
- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`).
- Rotacja tokenu pozostaje w obrębie zatwierdzonego zestawu ról parowania i zatwierdzonej
  bazowej linii zakresów dla tego urządzenia. Przypadkowy wpis tokenu w cache nie przyznaje nowego
  celu rotacji.
- Dla sesji tokenów sparowanych urządzeń zarządzanie między urządzeniami jest tylko dla administratora:
  `remove`, `rotate` i `revoke` działają tylko na własnym urządzeniu, chyba że wywołujący ma
  `operator.admin`.
- `devices clear` jest celowo zabezpieczone przez `--yes`.
- Jeśli zakres parowania jest niedostępny na local loopback (i nie przekazano jawnego `--url`), `list`/`approve` mogą użyć lokalnego fallbacku parowania.
- `devices approve` wymaga jawnego ID żądania przed wystawieniem tokenów; pominięcie `requestId` lub przekazanie `--latest` tylko wyświetla podgląd najnowszego oczekującego żądania.

## Checklista odzyskiwania po dryfie tokenu

Użyj jej, gdy Control UI lub inni klienci stale kończą się błędem `AUTH_TOKEN_MISMATCH` lub `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Potwierdź aktualne źródło tokenu Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Wyświetl sparowane urządzenia i zidentyfikuj problematyczne ID urządzenia:

```bash
openclaw devices list
```

3. Obróć token operatora dla problematycznego urządzenia:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jeśli rotacja nie wystarczy, usuń nieaktualne parowanie i zatwierdź ponownie:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Ponów próbę połączenia klienta przy użyciu aktualnego współdzielonego tokenu/hasła.

Uwagi:

- Normalna kolejność pierwszeństwa uwierzytelniania przy ponownym połączeniu to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
- Zaufane odzyskiwanie po `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać razem współdzielony token i zapisany token urządzenia w ramach jednej ograniczonej ponownej próby.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem Dashboard](/pl/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)
