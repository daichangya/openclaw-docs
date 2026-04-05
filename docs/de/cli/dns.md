---
read_when:
    - Sie möchten Weitbereichserkennung (DNS-SD) über Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: CLI-Referenz für `openclaw dns` (Hilfen zur Weitbereichserkennung)
title: dns
x-i18n:
    generated_at: "2026-04-05T12:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

DNS-Hilfen für die Weitbereichserkennung (Tailscale + CoreDNS). Derzeit auf macOS + Homebrew CoreDNS fokussiert.

Verwandt:

- Gateway-Erkennung: [Discovery](/gateway/discovery)
- Konfiguration der Weitbereichserkennung: [Configuration](/gateway/configuration)

## Einrichtung

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

CoreDNS-Einrichtung für Unicast-DNS-SD-Erkennung planen oder anwenden.

Optionen:

- `--domain <domain>`: Weitbereichs-Discovery-Domain (zum Beispiel `openclaw.internal`)
- `--apply`: CoreDNS-Konfiguration installieren oder aktualisieren und den Dienst neu starten (erfordert sudo; nur macOS)

Was angezeigt wird:

- aufgelöste Discovery-Domain
- Pfad zur Zonendatei
- aktuelle Tailnet-IPs
- empfohlene `openclaw.json`-Discovery-Konfiguration
- die Tailscale-Split-DNS-Nameserver-/Domain-Werte, die gesetzt werden sollen

Hinweise:

- Ohne `--apply` ist der Befehl nur eine Planungshilfe und gibt die empfohlene Einrichtung aus.
- Wenn `--domain` weggelassen wird, verwendet OpenClaw `discovery.wideArea.domain` aus der Konfiguration.
- `--apply` unterstützt derzeit nur macOS und erwartet Homebrew CoreDNS.
- `--apply` bootstrapped bei Bedarf die Zonendatei, stellt sicher, dass die CoreDNS-Import-Stanza vorhanden ist, und startet den `coredns`-Brew-Dienst neu.
