---
read_when:
    - Préparation d’un rapport de bogue ou d’une demande de support
    - Débogage des plantages du Gateway, des redémarrages, de la pression mémoire ou des charges utiles surdimensionnées
    - Examen des données de diagnostic enregistrées ou expurgées
summary: Créer des bundles de diagnostics Gateway partageables pour les rapports de bogue
title: Export de diagnostics
x-i18n:
    generated_at: "2026-04-24T07:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw peut créer un zip de diagnostics local pouvant être joint en toute sécurité à des rapports de bogue.
Il combine un état Gateway nettoyé, la santé, les journaux, la forme de la configuration, et
les événements récents de stabilité sans charge utile.

## Démarrage rapide

```bash
openclaw gateway diagnostics export
```

La commande affiche le chemin du zip écrit. Pour choisir un chemin :

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Pour l’automatisation :

```bash
openclaw gateway diagnostics export --json
```

## Contenu de l’export

Le zip inclut :

- `summary.md` : aperçu lisible par l’humain pour le support.
- `diagnostics.json` : résumé lisible par machine de la configuration, des journaux, de l’état, de la santé,
  et des données de stabilité.
- `manifest.json` : métadonnées de l’export et liste des fichiers.
- Forme de configuration nettoyée et détails de configuration non secrets.
- Résumés de journaux nettoyés et lignes de journal récentes expurgées.
- Instantanés en mode best-effort de l’état et de la santé du Gateway.
- `stability/latest.json` : bundle de stabilité persisté le plus récent, lorsqu’il est disponible.

L’export est utile même lorsque le Gateway n’est pas sain. Si le Gateway ne peut pas
répondre aux requêtes d’état ou de santé, les journaux locaux, la forme de configuration et le dernier
bundle de stabilité sont tout de même collectés lorsqu’ils sont disponibles.

## Modèle de confidentialité

Les diagnostics sont conçus pour être partageables. L’export conserve des données opérationnelles
utiles au débogage, telles que :

- noms de sous-systèmes, identifiants de plugin, identifiants de fournisseur, identifiants de canal et modes configurés
- codes d’état, durées, nombres d’octets, état de la file d’attente et mesures mémoire
- métadonnées de journal nettoyées et messages opérationnels expurgés
- forme de configuration et réglages de fonctionnalités non secrets

L’export omet ou expurge :

- texte du chat, prompts, instructions, corps de Webhook et sorties d’outils
- identifiants, clés API, jetons, cookies et valeurs secrètes
- corps bruts de requête ou de réponse
- identifiants de compte, identifiants de message, identifiants de session bruts, noms d’hôte et noms d’utilisateur locaux

Lorsqu’un message de journal ressemble à du texte de charge utile utilisateur, chat, prompt ou outil, l’export
conserve uniquement le fait qu’un message a été omis ainsi que son nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité borné, sans charge utile, lorsque
les diagnostics sont activés. Il est destiné aux faits opérationnels, pas au contenu.

Inspecter l’enregistreur actif :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecter le bundle de stabilité persisté le plus récent après une sortie fatale, un délai d’arrêt
dépassé, ou un échec de démarrage après redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créer un zip de diagnostics à partir du bundle persisté le plus récent :

```bash
openclaw gateway stability --bundle latest --export
```

Les bundles persistés se trouvent sous `~/.openclaw/logs/stability/` lorsqu’il existe des événements.

## Options utiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>` : écrire vers un chemin zip spécifique.
- `--log-lines <count>` : nombre maximal de lignes de journal nettoyées à inclure.
- `--log-bytes <bytes>` : nombre maximal d’octets de journal à inspecter.
- `--url <url>` : URL WebSocket du Gateway pour les instantanés d’état et de santé.
- `--token <token>` : jeton du Gateway pour les instantanés d’état et de santé.
- `--password <password>` : mot de passe du Gateway pour les instantanés d’état et de santé.
- `--timeout <ms>` : délai d’expiration des instantanés d’état et de santé.
- `--no-stability-bundle` : ignorer la recherche du bundle de stabilité persisté.
- `--json` : afficher des métadonnées d’export lisibles par machine.

## Désactiver les diagnostics

Les diagnostics sont activés par défaut. Pour désactiver l’enregistreur de stabilité et
la collecte d’événements diagnostiques :

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

La désactivation des diagnostics réduit le niveau de détail des rapports de bogue. Elle n’affecte pas la
journalisation normale du Gateway.

## Documentation liée

- [Vérifications de santé](/fr/gateway/health)
- [CLI Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole Gateway](/fr/gateway/protocol#system-and-identity)
- [Journalisation](/fr/logging)
