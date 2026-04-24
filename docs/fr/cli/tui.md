---
read_when:
    - Vous souhaitez une interface terminal pour le Gateway (adaptée au mode distant)
    - Vous souhaitez transmettre url/token/session depuis des scripts
    - Vous souhaitez exécuter la TUI en mode intégré local sans Gateway
    - Vous souhaitez utiliser openclaw chat ou openclaw tui --local
summary: Référence CLI pour `openclaw tui` (interface terminal intégrée locale ou adossée au Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-24T07:06:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Ouvrir l’interface terminal connectée au Gateway, ou l’exécuter en mode
intégré local.

Associé :

- Guide TUI : [TUI](/fr/web/tui)

Remarques :

- `chat` et `terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- `tui` résout les SecretRef d’authentification Gateway configurés pour l’authentification par jeton/mot de passe lorsque c’est possible (fournisseurs `env`/`file`/`exec`).
- Lorsqu’elle est lancée depuis l’intérieur d’un répertoire d’espace de travail d’agent configuré, la TUI sélectionne automatiquement cet agent comme valeur par défaut de clé de session (sauf si `--session` est explicitement `agent:<id>:...`).
- Le mode local utilise directement le runtime d’agent intégré. La plupart des outils locaux fonctionnent, mais les fonctionnalités réservées au Gateway ne sont pas disponibles.
- Le mode local ajoute `/auth [provider]` dans la surface de commande de la TUI.
- Les paliers d’approbation de Plugin s’appliquent toujours en mode local. Les outils qui nécessitent une approbation demandent une décision dans le terminal ; rien n’est automatiquement approuvé en silence, car le Gateway n’est pas impliqué.

## Exemples

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Boucle de réparation de configuration

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous voulez que l’agent
intégré l’inspecte, la compare à la documentation et aide à la réparer
depuis le même terminal :

Si `openclaw config validate` échoue déjà, utilisez d’abord `openclaw configure` ou
`openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection contre une
configuration invalide.

```bash
openclaw chat
```

Puis dans la TUI :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Appliquez des correctifs ciblés avec `openclaw config set` ou `openclaw configure`, puis
relancez `openclaw config validate`. Voir [TUI](/fr/web/tui) et [Config](/fr/cli/config).

## Associé

- [Référence CLI](/fr/cli)
- [TUI](/fr/web/tui)
