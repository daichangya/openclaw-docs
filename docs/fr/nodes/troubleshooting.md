---
read_when:
    - Le nœud est connecté mais les outils camera/canvas/screen/exec échouent
    - Vous avez besoin du modèle mental association des nœuds vs approbations
summary: dépanner l’association des nœuds, les exigences de premier plan, les autorisations et les échecs d’outils
title: dépannage des nœuds
x-i18n:
    generated_at: "2026-04-24T07:19:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Utilisez cette page lorsqu’un nœud est visible dans l’état mais que les outils de nœud échouent.

## Échelle de commandes

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Ensuite, exécutez des vérifications spécifiques aux nœuds :

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Signaux sains :

- Le nœud est connecté et associé pour le rôle `node`.
- `nodes describe` inclut la capacité que vous appelez.
- Les approbations exec affichent le mode/la liste d’autorisation attendus.

## Exigences de premier plan

`canvas.*`, `camera.*` et `screen.*` sont limités au premier plan sur les nœuds iOS/Android.

Vérification et correctif rapides :

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si vous voyez `NODE_BACKGROUND_UNAVAILABLE`, mettez l’app du nœud au premier plan et réessayez.

## Matrice des autorisations

| Capacité                     | iOS                                     | Android                                      | app de nœud macOS             | Code d’échec typique          |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Caméra (+ micro pour l’audio des clips) | Caméra (+ micro pour l’audio des clips)      | Caméra (+ micro pour l’audio des clips) | `*_PERMISSION_REQUIRED` |
| `screen.record`              | Enregistrement d’écran (+ micro facultatif) | Invite de capture d’écran (+ micro facultatif) | Enregistrement d’écran     | `*_PERMISSION_REQUIRED`       |
| `location.get`               | During Use ou Always (selon le mode)    | Localisation au premier plan/en arrière-plan selon le mode | Autorisation de localisation | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (chemin hôte du nœud)               | n/a (chemin hôte du nœud)                    | Approbations exec requises    | `SYSTEM_RUN_DENIED`           |

## Association vs approbations

Ce sont des barrières différentes :

1. **Association d’appareil** : ce nœud peut-il se connecter à la gateway ?
2. **Politique Gateway des commandes de nœud** : l’ID de commande RPC est-il autorisé par `gateway.nodes.allowCommands` / `denyCommands` et les valeurs par défaut de la plateforme ?
3. **Approbations exec** : ce nœud peut-il exécuter une commande shell locale spécifique ?

Vérifications rapides :

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Si l’association manque, approuvez d’abord l’appareil du nœud.
Si une commande manque dans `nodes describe`, vérifiez la politique Gateway des commandes de nœud et si le nœud a réellement déclaré cette commande lors de la connexion.
Si l’association est correcte mais que `system.run` échoue, corrigez les approbations exec/la liste d’autorisation sur ce nœud.

L’association du nœud est une barrière d’identité/confiance, pas une surface d’approbation par commande. Pour `system.run`, la politique par nœud se trouve dans le fichier d’approbations exec de ce nœud (`openclaw approvals get --node ...`), pas dans l’enregistrement d’association de la gateway.

Pour les exécutions `host=node` adossées à des approbations, la gateway lie aussi l’exécution au
`systemRunPlan` canonique préparé. Si un appelant ultérieur modifie la commande/le cwd ou
les métadonnées de session avant que l’exécution approuvée ne soit transmise, la gateway rejette
l’exécution comme une incompatibilité d’approbation au lieu de faire confiance à la charge utile modifiée.

## Codes d’erreur de nœud courants

- `NODE_BACKGROUND_UNAVAILABLE` → l’app est en arrière-plan ; remettez-la au premier plan.
- `CAMERA_DISABLED` → le bouton caméra est désactivé dans les paramètres du nœud.
- `*_PERMISSION_REQUIRED` → autorisation OS manquante/refusée.
- `LOCATION_DISABLED` → le mode localisation est désactivé.
- `LOCATION_PERMISSION_REQUIRED` → le mode de localisation demandé n’est pas accordé.
- `LOCATION_BACKGROUND_UNAVAILABLE` → l’app est en arrière-plan mais seule l’autorisation While Using existe.
- `SYSTEM_RUN_DENIED: approval required` → la requête exec nécessite une approbation explicite.
- `SYSTEM_RUN_DENIED: allowlist miss` → la commande est bloquée par le mode liste d’autorisation.
  Sur les hôtes de nœud Windows, les formes avec wrapper shell comme `cmd.exe /c ...` sont traitées comme des absences dans la liste d’autorisation en
  mode liste d’autorisation, sauf si elles sont approuvées via le flux ask.

## Boucle de récupération rapide

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si vous êtes toujours bloqué :

- Réapprouvez l’association de l’appareil.
- Rouvrez l’app du nœud (premier plan).
- Réaccordez les autorisations de l’OS.
- Recréez/ajustez la politique d’approbation exec.

Liens associés :

- [/nodes/index](/fr/nodes/index)
- [/nodes/camera](/fr/nodes/camera)
- [/nodes/location-command](/fr/nodes/location-command)
- [/tools/exec-approvals](/fr/tools/exec-approvals)
- [/gateway/pairing](/fr/gateway/pairing)

## Liens associés

- [Vue d’ensemble des nœuds](/fr/nodes)
- [Dépannage de la Gateway](/fr/gateway/troubleshooting)
- [Dépannage des canaux](/fr/channels/troubleshooting)
