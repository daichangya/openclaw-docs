---
read_when:
    - Chcesz otworzyć interfejs Control UI przy użyciu bieżącego tokenu
    - Chcesz wypisać URL bez uruchamiania przeglądarki
summary: Dokumentacja CLI dla `openclaw dashboard` (otwórz interfejs Control UI)
title: Pulpit nawigacyjny
x-i18n:
    generated_at: "2026-04-25T13:44:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Otwórz interfejs Control UI przy użyciu bieżącego uwierzytelniania.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Uwagi:

- `dashboard` rozwiązuje skonfigurowane SecretRef `gateway.auth.token`, gdy to możliwe.
- `dashboard` przestrzega `gateway.tls.enabled`: gatewaye z włączonym TLS wypisują/otwierają
  adresy URL interfejsu Control UI z `https://` i łączą się przez `wss://`.
- Dla tokenów zarządzanych przez SecretRef (rozwiązanych lub nierozwiązanych) `dashboard` wypisuje/kopiuje/otwiera URL bez tokenu, aby uniknąć ujawniania zewnętrznych sekretów w wyjściu terminala, historii schowka lub argumentach uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, ale nierozwiązany w tej ścieżce polecenia, polecenie wypisuje URL bez tokenu oraz jawne wskazówki naprawcze zamiast osadzać nieprawidłowy placeholder tokenu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Pulpit nawigacyjny](/pl/web/dashboard)
