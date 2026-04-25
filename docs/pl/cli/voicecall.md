---
read_when:
    - Używasz Plugin połączeń głosowych i chcesz poznać punkty wejścia CLI
    - Chcesz zobaczyć szybkie przykłady dla `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Dokumentacja CLI dla `openclaw voicecall` (powierzchnia poleceń Plugin połączeń głosowych)
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T13:44:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` to polecenie dostarczane przez Plugin. Pojawia się tylko wtedy, gdy Plugin połączeń głosowych jest zainstalowany i włączony.

Główna dokumentacja:

- Plugin połączeń głosowych: [Voice Call](/pl/plugins/voice-call)

## Typowe polecenia

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` domyślnie wypisuje czytelne dla człowieka kontrole gotowości. Użyj `--json` w
skryptach:

```bash
openclaw voicecall setup --json
```

W przypadku zewnętrznych providerów (`twilio`, `telnyx`, `plivo`) setup musi rozwiązać publiczny
URL Webhook z `publicUrl`, tunelu lub ekspozycji Tailscale. Fallback do lokalnego/prywatnego
serwowania jest odrzucany, ponieważ operatorzy nie mogą do niego dotrzeć.

`smoke` uruchamia te same kontrole gotowości. Nie wykona prawdziwego połączenia telefonicznego,
chyba że obecne są jednocześnie `--to` i `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # test na sucho
openclaw voicecall smoke --to "+15555550123" --yes  # rzeczywiste połączenie notify
```

## Udostępnianie Webhooków (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Uwaga dotycząca bezpieczeństwa: udostępniaj punkt końcowy Webhook tylko sieciom, którym ufasz. Gdy to możliwe, preferuj Tailscale Serve zamiast Funnel.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Plugin połączeń głosowych](/pl/plugins/voice-call)
