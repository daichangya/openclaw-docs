---
read_when:
    - Sie möchten Weitbereichserkennung (DNS-SD) über Tailscale + CoreDNS via Tailscale
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: CLI-Referenz für `openclaw dns` (Hilfsprogramme für die Weitbereichserkennung)
title: DNS
x-i18n:
    generated_at: "2026-04-24T06:31:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

DNS-Hilfsprogramme für die Weitbereichserkennung (Tailscale + CoreDNS). Derzeit auf macOS + Homebrew CoreDNS fokussiert.

Verwandt:

- Gateway-Erkennung: [Discovery](/de/gateway/discovery)
- Konfiguration der Weitbereichserkennung: [Configuration](/de/gateway/configuration)

## Einrichtung

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

CoreDNS-Einrichtung für Unicast-DNS-SD-Erkennung planen oder anwenden.

Optionen:

- `--domain <domain>`: Domain für die Weitbereichserkennung (zum Beispiel `openclaw.internal`)
- `--apply`: CoreDNS-Konfiguration installieren oder aktualisieren und den Dienst neu starten (erfordert sudo; nur macOS)

Was angezeigt wird:

- aufgelöste Discovery-Domain
- Zone-File-Pfad
- aktuelle Tailnet-IPs
- empfohlene `openclaw.json`-Discovery-Konfiguration
- die festzulegenden Tailscale-Split-DNS-Nameserver-/Domain-Werte

Hinweise:

- Ohne `--apply` ist der Befehl nur ein Planungshilfsmittel und gibt die empfohlene Einrichtung aus.
- Wenn `--domain` weggelassen wird, verwendet OpenClaw `discovery.wideArea.domain` aus der Konfiguration.
- `--apply` unterstützt derzeit nur macOS und erwartet Homebrew CoreDNS.
- `--apply` bootstrapped bei Bedarf das Zone-File, stellt sicher, dass die CoreDNS-Import-Stanza vorhanden ist, und startet den `coredns`-Brew-Service neu.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Discovery](/de/gateway/discovery)
