---
read_when:
    - Vous souhaitez une découverte étendue (DNS-SD) via Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Référence CLI pour `openclaw dns` (assistants de découverte étendue)
title: dns
x-i18n:
    generated_at: "2026-04-05T12:37:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Assistants DNS pour la découverte étendue (Tailscale + CoreDNS). Actuellement centrés sur macOS + Homebrew CoreDNS.

Liens associés :

- Découverte Gateway : [Discovery](/gateway/discovery)
- Configuration de découverte étendue : [Configuration](/gateway/configuration)

## Configuration

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Planifie ou applique la configuration CoreDNS pour la découverte DNS-SD en monodiffusion.

Options :

- `--domain <domain>` : domaine de découverte étendue (par exemple `openclaw.internal`)
- `--apply` : installe ou met à jour la configuration CoreDNS et redémarre le service (nécessite sudo ; macOS uniquement)

Ce qui est affiché :

- domaine de découverte résolu
- chemin du fichier de zone
- adresses IP tailnet actuelles
- configuration de découverte `openclaw.json` recommandée
- les valeurs de serveur de noms/domaine Tailscale Split DNS à définir

Remarques :

- Sans `--apply`, la commande est uniquement un assistant de planification et affiche la configuration recommandée.
- Si `--domain` est omis, OpenClaw utilise `discovery.wideArea.domain` depuis la configuration.
- `--apply` ne prend actuellement en charge que macOS et suppose Homebrew CoreDNS.
- `--apply` initialise le fichier de zone si nécessaire, s’assure que la directive d’import CoreDNS existe, puis redémarre le service brew `coredns`.
