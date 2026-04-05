---
read_when:
    - Sie möchten die Control UI mit Ihrem aktuellen Token öffnen
    - Sie möchten die URL ausgeben, ohne einen Browser zu starten
summary: CLI-Referenz für `openclaw dashboard` (die Control UI öffnen)
title: dashboard
x-i18n:
    generated_at: "2026-04-05T12:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Öffnen Sie die Control UI mit Ihrer aktuellen Authentifizierung.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Hinweise:

- `dashboard` löst konfigurierte SecretRefs für `gateway.auth.token` nach Möglichkeit auf.
- Bei SecretRef-verwalteten Tokens (aufgelöst oder nicht aufgelöst) gibt/kopiert/öffnet `dashboard` eine nicht tokenisierte URL, um zu vermeiden, dass externe Geheimnisse in Terminalausgaben, der Zwischenablagehistorie oder Browser-Startargumenten offengelegt werden.
- Wenn `gateway.auth.token` über SecretRef verwaltet wird, in diesem Befehlsausführungspfad aber nicht aufgelöst ist, gibt der Befehl eine nicht tokenisierte URL und eine explizite Anleitung zur Behebung aus, statt einen ungültigen Token-Platzhalter einzubetten.
