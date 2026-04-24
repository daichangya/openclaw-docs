---
read_when:
    - Vous utilisez toujours `openclaw daemon ...` dans des scripts
    - Vous avez besoin de commandes de cycle de vie du service (install/start/stop/restart/status)
summary: Référence CLI pour `openclaw daemon` (alias hérité pour la gestion du service Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-04-24T07:03:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Alias hérité pour les commandes de gestion du service Gateway.

`openclaw daemon ...` correspond à la même surface de contrôle de service que les commandes de service `openclaw gateway ...`.

## Utilisation

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Sous-commandes

- `status` : afficher l’état d’installation du service et sonder l’état du Gateway
- `install` : installer le service (`launchd`/`systemd`/`schtasks`)
- `uninstall` : supprimer le service
- `start` : démarrer le service
- `stop` : arrêter le service
- `restart` : redémarrer le service

## Options courantes

- `status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- cycle de vie (`uninstall|start|stop|restart`) : `--json`

Remarques :

- `status` résout les SecretRefs d’authentification configurés lorsque cela est possible pour l’authentification de sonde.
- Si un SecretRef d’authentification requis n’est pas résolu dans ce chemin de commande, `daemon status --json` signale `rpc.authWarning` lorsque la connectivité/authentification de la sonde échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source du secret.
- Si la sonde réussit, les avertissements sur les références d’authentification non résolues sont supprimés afin d’éviter les faux positifs.
- `status --deep` ajoute une analyse au mieux du système au niveau du service. Lorsqu’elle trouve d’autres services de type gateway, la sortie lisible affiche des conseils de nettoyage et avertit qu’un seul gateway par machine reste la recommandation normale.
- Sur les installations Linux systemd, les vérifications de dérive de jeton de `status` incluent à la fois les sources d’unité `Environment=` et `EnvironmentFile=`.
- Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` en utilisant l’environnement d’exécution fusionné (environnement de commande du service d’abord, puis repli sur l’environnement du processus).
- Si l’authentification par jeton n’est pas effectivement active (mode `gateway.auth.mode` explicite `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut l’emporter et où aucun candidat jeton ne peut l’emporter), les vérifications de dérive de jeton ignorent la résolution du jeton de configuration.
- Lorsque l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, `install` valide que le SecretRef peut être résolu mais ne conserve pas le jeton résolu dans les métadonnées d’environnement du service.
- Si l’authentification par jeton exige un jeton et que le SecretRef du jeton configuré n’est pas résolu, l’installation échoue en mode fermé.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Si vous exécutez intentionnellement plusieurs gateways sur un même hôte, isolez les ports, la configuration/l’état et les espaces de travail ; voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

## Préférer

Utilisez [`openclaw gateway`](/fr/cli/gateway) pour la documentation et les exemples actuels.

## Articles connexes

- [Référence CLI](/fr/cli)
- [Guide d’exploitation du Gateway](/fr/gateway)
