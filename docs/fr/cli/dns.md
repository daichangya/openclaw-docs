---
read_when:
    - Vous souhaitez la découverte étendue (DNS-SD) via Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Référence CLI pour `openclaw dns` (assistants de découverte étendue)
title: DNS
x-i18n:
    generated_at: "2026-04-24T07:04:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Assistants DNS pour la découverte étendue (Tailscale + CoreDNS). Actuellement axés sur macOS + CoreDNS via Homebrew.

Associé :

- Découverte du Gateway : [Discovery](/fr/gateway/discovery)
- Configuration de la découverte étendue : [Configuration](/fr/gateway/configuration)

## Configuration

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Planifie ou applique la configuration CoreDNS pour la découverte DNS-SD unicast.

Options :

- `--domain <domain>` : domaine de découverte étendue (par exemple `openclaw.internal`)
- `--apply` : installe ou met à jour la configuration CoreDNS et redémarre le service (nécessite sudo ; macOS uniquement)

Ce qui est affiché :

- domaine de découverte résolu
- chemin du fichier de zone
- IP actuelles du tailnet
- configuration de découverte `openclaw.json` recommandée
- valeurs de nameserver/domaine Tailscale Split DNS à définir

Remarques :

- Sans `--apply`, la commande est uniquement un assistant de planification et affiche la configuration recommandée.
- Si `--domain` est omis, OpenClaw utilise `discovery.wideArea.domain` depuis la configuration.
- `--apply` prend actuellement en charge macOS uniquement et suppose CoreDNS installé via Homebrew.
- `--apply` initialise le fichier de zone si nécessaire, s’assure que la directive d’import CoreDNS existe et redémarre le service brew `coredns`.

## Associé

- [Référence CLI](/fr/cli)
- [Discovery](/fr/gateway/discovery)
