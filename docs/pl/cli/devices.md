---
read_when:
    - Zatwierdzasz żądania parowania urządzeń
    - Musisz obrócić lub unieważnić tokeny urządzeń
summary: Dokumentacja CLI dla `openclaw devices` (parowanie urządzenia + rotacja/unieważnianie tokenów)
title: Urządzenia
x-i18n:
    generated_at: "2026-04-26T11:26:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Zarządzanie żądaniami parowania urządzeń i tokenami o zakresie urządzenia.

## Polecenia

### `openclaw devices list`

Wyświetla oczekujące żądania parowania i sparowane urządzenia.

```
openclaw devices list
openclaw devices list --json
```

Wyjście dla oczekujących żądań pokazuje żądany dostęp obok aktualnie
zatwierdzonego dostępu urządzenia, gdy urządzenie jest już sparowane. Dzięki temu
rozszerzenia zakresu/roli są jawne zamiast wyglądać tak, jakby parowanie zostało utracone.

### `openclaw devices remove <deviceId>`

Usuwa jeden wpis sparowanego urządzenia.

Gdy jesteś uwierzytelniony tokenem sparowanego urządzenia, wywołujący niebędący administratorem może
usunąć tylko **własny** wpis urządzenia. Usunięcie innego urządzenia wymaga
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Czyści sparowane urządzenia zbiorczo.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Zatwierdza oczekujące żądanie parowania urządzenia według dokładnego `requestId`. Jeśli `requestId`
zostanie pominięty albo przekazane zostanie `--latest`, OpenClaw tylko wyświetli wybrane oczekujące
żądanie i zakończy działanie; uruchom zatwierdzanie ponownie z dokładnym identyfikatorem żądania po zweryfikowaniu szczegółów.

Uwaga: jeśli urządzenie ponowi próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz
publiczny), OpenClaw zastępuje poprzedni oczekujący wpis i wydaje nowy
`requestId`. Uruchom `openclaw devices list` tuż przed zatwierdzeniem, aby użyć
aktualnego identyfikatora.

Jeśli urządzenie jest już sparowane i prosi o szersze zakresy lub szerszą rolę,
OpenClaw pozostawia istniejące zatwierdzenie na miejscu i tworzy nowe oczekujące żądanie
rozszerzenia. Sprawdź kolumny `Requested` i `Approved` w `openclaw devices list`
albo użyj `openclaw devices approve --latest`, aby podejrzeć dokładne rozszerzenie przed
jego zatwierdzeniem.

Jeśli Gateway jest jawnie skonfigurowany z
`gateway.nodes.pairing.autoApproveCidrs`, żądania pierwszego parowania `role: node` z
dopasowanych adresów IP klientów mogą zostać zatwierdzone, zanim pojawią się na tej liście. Ta polityka
jest domyślnie wyłączona i nigdy nie dotyczy klientów operator/browser ani żądań rozszerzenia.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Odrzuca oczekujące żądanie parowania urządzenia.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Obraca token urządzenia dla określonej roli (opcjonalnie aktualizując zakresy).
Docelowa rola musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia;
rotacja nie może utworzyć nowej niezatwierdzonej roli.
Jeśli pominiesz `--scope`, późniejsze ponowne połączenia z zapisanym obróconym tokenem ponownie użyją
zbuforowanych zatwierdzonych zakresów tego tokena. Jeśli przekażesz jawne wartości `--scope`, staną się one
zapisanym zestawem zakresów dla przyszłych ponownych połączeń z zbuforowanym tokenem.
Wywołujący niebędący administratorem, korzystający ze sparowanego urządzenia, może obrócić tylko **własny** token urządzenia.
Docelowy zestaw zakresów tokena musi mieścić się w zestawie zakresów operatora bieżącej sesji wywołującego;
rotacja nie może utworzyć ani zachować szerszego tokena operatora niż ten,
który wywołujący już posiada.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Zwraca nowy ładunek tokena jako JSON.

### `openclaw devices revoke --device <id> --role <role>`

Unieważnia token urządzenia dla określonej roli.

Wywołujący niebędący administratorem, korzystający ze sparowanego urządzenia, może unieważnić tylko **własny** token urządzenia.
Unieważnienie tokena innego urządzenia wymaga `operator.admin`.
Docelowy zestaw zakresów tokena również musi mieścić się w zestawie zakresów operatora bieżącej sesji wywołującego;
wywołujący z samym zakresem parowania nie mogą unieważniać tokenów operatora admin/write.

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

Uwaga: po ustawieniu `--url` CLI nie używa fallback do poświadczeń z konfiguracji ani środowiska.
Przekaż jawnie `--token` albo `--password`. Brak jawnych poświadczeń jest błędem.

## Uwagi

- Rotacja tokena zwraca nowy token (wrażliwy). Traktuj go jak sekret.
- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` to polityka Gateway typu opt-in tylko dla
  świeżego parowania urządzeń node; nie zmienia uprawnień zatwierdzania w CLI.
- Rotacja i unieważnianie tokenów pozostają w obrębie zatwierdzonego zestawu ról parowania oraz
  bazowego zatwierdzonego zestawu zakresów dla tego urządzenia. Przypadkowy wpis zbuforowanego tokena nie
  daje docelowego uprawnienia do zarządzania tokenami.
- Dla sesji tokenów sparowanych urządzeń zarządzanie między urządzeniami jest tylko dla administratora:
  `remove`, `rotate` i `revoke` są ograniczone do własnego urządzenia, chyba że wywołujący ma
  `operator.admin`.
- Mutacja tokena jest również ograniczona zakresem wywołującego: sesja tylko do parowania nie może
  obrócić ani unieważnić tokena, który obecnie ma `operator.admin` albo
  `operator.write`.
- `devices clear` jest celowo zabezpieczone przez `--yes`.
- Jeśli zakres parowania nie jest dostępny w local loopback (i nie przekazano jawnego `--url`), `list`/`approve` mogą użyć lokalnego fallback parowania.
- `devices approve` wymaga jawnego identyfikatora żądania przed utworzeniem tokenów; pominięcie `requestId` lub przekazanie `--latest` powoduje tylko podgląd najnowszego oczekującego żądania.

## Lista kontrolna odzyskiwania po dryfie tokena

Użyj tego, gdy Control UI lub inni klienci nadal kończą się błędem `AUTH_TOKEN_MISMATCH` albo `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Potwierdź bieżące źródło tokena gateway:

```bash
openclaw config get gateway.auth.token
```

2. Wyświetl sparowane urządzenia i zidentyfikuj identyfikator problematycznego urządzenia:

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

- Normalna kolejność uwierzytelniania przy ponownym połączeniu to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, następnie zapisany token urządzenia, a na końcu token bootstrap.
- Zaufane odzyskiwanie po `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać razem zarówno współdzielony token, jak i zapisany token urządzenia dla jednej ograniczonej ponownej próby.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem Dashboard](/pl/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Node](/pl/nodes)
