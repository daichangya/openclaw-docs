---
read_when:
    - Le nœud est connecté mais les outils camera/canvas/screen/exec échouent
    - Vous avez besoin du modèle mental pairing de nœud versus approbations
summary: Résoudre les problèmes de pairing de nœud, d’exigences de premier plan, d’autorisations et d’échecs d’outils
title: Dépannage des nœuds
x-i18n:
    generated_at: "2026-04-05T12:47:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Dépannage des nœuds

Utilisez cette page lorsqu’un nœud est visible dans le statut mais que les outils de nœud échouent.

## Échelle de commandes

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Ensuite, exécutez les vérifications spécifiques au nœud :

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Signaux sains :

- Le nœud est connecté et pairé pour le rôle `node`.
- `nodes describe` inclut la capacité que vous appelez.
- Les approbations exec affichent le mode/la liste d’autorisation attendus.

## Exigences de premier plan

`canvas.*`, `camera.*` et `screen.*` ne fonctionnent qu’au premier plan sur les nœuds iOS/Android.

Vérification et correction rapides :

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si vous voyez `NODE_BACKGROUND_UNAVAILABLE`, ramenez l’application du nœud au premier plan et réessayez.

## Matrice des autorisations

| Capacité                     | iOS                                      | Android                                     | App de nœud macOS            | Code d’échec typique          |
| ---------------------------- | ---------------------------------------- | ------------------------------------------- | ---------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Caméra (+ micro pour l’audio de clip)    | Caméra (+ micro pour l’audio de clip)       | Caméra (+ micro pour l’audio de clip) | `*_PERMISSION_REQUIRED` |
| `screen.record`              | Enregistrement d’écran (+ micro facultatif) | Invite de capture d’écran (+ micro facultatif) | Enregistrement d’écran       | `*_PERMISSION_REQUIRED`       |
| `location.get`               | Pendant l’utilisation ou toujours (selon le mode) | Localisation au premier plan/en arrière-plan selon le mode | Autorisation de localisation | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (chemin node host)                   | n/a (chemin node host)                      | Approbations exec requises   | `SYSTEM_RUN_DENIED`           |

## Pairing versus approbations

Ce sont deux barrières différentes :

1. **Pairing d’appareil** : ce nœud peut-il se connecter à la gateway ?
2. **Politique de commande de nœud gateway** : l’ID de commande RPC est-il autorisé par `gateway.nodes.allowCommands` / `denyCommands` et par les valeurs par défaut de la plateforme ?
3. **Approbations exec** : ce nœud peut-il exécuter localement une commande shell spécifique ?

Vérifications rapides :

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Si le pairing est absent, approuvez d’abord l’appareil du nœud.
Si `nodes describe` n’inclut pas une commande, vérifiez la politique de commande de nœud de la gateway et si le nœud a réellement déclaré cette commande lors de la connexion.
Si le pairing est correct mais que `system.run` échoue, corrigez les approbations exec/la liste d’autorisation sur ce nœud.

Le pairing de nœud est une barrière d’identité/de confiance, pas une surface d’approbation par commande. Pour `system.run`, la politique par nœud se trouve dans le fichier d’approbations exec de ce nœud (`openclaw approvals get --node ...`), pas dans l’enregistrement de pairing de la gateway.

Pour les exécutions `host=node` adossées à une approbation, la gateway lie également l’exécution au
`systemRunPlan` canonique préparé. Si un appelant ultérieur modifie la commande/le `cwd` ou les
métadonnées de session avant le transfert de l’exécution approuvée, la gateway rejette
l’exécution comme incompatibilité d’approbation au lieu de faire confiance à la charge utile modifiée.

## Codes d’erreur de nœud courants

- `NODE_BACKGROUND_UNAVAILABLE` → l’application est en arrière-plan ; ramenez-la au premier plan.
- `CAMERA_DISABLED` → le bouton caméra est désactivé dans les paramètres du nœud.
- `*_PERMISSION_REQUIRED` → autorisation du système d’exploitation manquante/refusée.
- `LOCATION_DISABLED` → le mode de localisation est désactivé.
- `LOCATION_PERMISSION_REQUIRED` → le mode de localisation demandé n’a pas été accordé.
- `LOCATION_BACKGROUND_UNAVAILABLE` → l’application est en arrière-plan mais seule l’autorisation Pendant l’utilisation existe.
- `SYSTEM_RUN_DENIED: approval required` → la requête exec nécessite une approbation explicite.
- `SYSTEM_RUN_DENIED: allowlist miss` → la commande est bloquée par le mode liste d’autorisation.
  Sur les hôtes de nœud Windows, les formes d’enveloppe shell comme `cmd.exe /c ...` sont traitées comme des absences de correspondance dans la liste d’autorisation en
  mode allowlist, sauf si elles sont approuvées via le flux ask.

## Boucle de récupération rapide

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si vous êtes toujours bloqué :

- Réapprouvez le pairing de l’appareil.
- Rouvrez l’application du nœud (au premier plan).
- Réaccordez les autorisations du système d’exploitation.
- Recréez/ajustez la politique d’approbation exec.

Liens associés :

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
