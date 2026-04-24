---
read_when:
    - Sie möchten die Control UI mit Ihrem aktuellen Token öffnen
    - Sie möchten die URL ausgeben, ohne einen Browser zu starten
summary: CLI-Referenz für `openclaw dashboard` (die Control UI öffnen)
title: Dashboard
x-i18n:
    generated_at: "2026-04-24T06:31:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
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
- Für durch SecretRef verwaltete Tokens (aufgelöst oder nicht aufgelöst) gibt `dashboard` eine nicht tokenisierte URL aus, kopiert oder öffnet sie, um zu vermeiden, dass externe Secrets in Terminalausgaben, der Zwischenablage-Historie oder Browser-Startargumenten offengelegt werden.
- Wenn `gateway.auth.token` in diesem Befehlsablauf durch SecretRef verwaltet wird, aber nicht aufgelöst ist, gibt der Befehl eine nicht tokenisierte URL und explizite Hinweise zur Behebung aus, anstatt einen ungültigen Token-Platzhalter einzubetten.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Dashboard](/de/web/dashboard)
