---
read_when:
    - Mettre à niveau une installation Matrix existante
    - Migrer l’historique Matrix chiffré et l’état des appareils
summary: Comment OpenClaw met à niveau l’ancien Plugin Matrix sur place, y compris les limites de récupération d’état chiffré et les étapes de récupération manuelle.
title: Migration Matrix
x-i18n:
    generated_at: "2026-04-24T07:17:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

Cette page couvre les mises à niveau depuis l’ancien Plugin public `matrix` vers l’implémentation actuelle.

Pour la plupart des utilisateurs, la mise à niveau se fait sur place :

- le Plugin reste `@openclaw/matrix`
- le canal reste `matrix`
- votre configuration reste sous `channels.matrix`
- les identifiants mis en cache restent sous `~/.openclaw/credentials/matrix/`
- l’état d’exécution reste sous `~/.openclaw/matrix/`

Vous n’avez pas besoin de renommer des clés de configuration ni de réinstaller le Plugin sous un nouveau nom.

## Ce que la migration fait automatiquement

Au démarrage du gateway, et lorsque vous exécutez [`openclaw doctor --fix`](/fr/gateway/doctor), OpenClaw essaie de réparer automatiquement l’ancien état Matrix.
Avant qu’une étape de migration Matrix exploitable ne modifie l’état sur disque, OpenClaw crée ou réutilise un instantané de récupération ciblé.

Lorsque vous utilisez `openclaw update`, le déclencheur exact dépend de la manière dont OpenClaw est installé :

- les installations depuis les sources exécutent `openclaw doctor --fix` pendant le flux de mise à jour, puis redémarrent le gateway par défaut
- les installations via gestionnaire de paquets mettent à jour le paquet, exécutent un passage doctor non interactif, puis s’appuient sur le redémarrage par défaut du gateway pour que le démarrage puisse terminer la migration Matrix
- si vous utilisez `openclaw update --no-restart`, la migration Matrix adossée au démarrage est différée jusqu’à ce que vous exécutiez plus tard `openclaw doctor --fix` et redémarriez le gateway

La migration automatique couvre :

- la création ou réutilisation d’un instantané pré-migration sous `~/Backups/openclaw-migrations/`
- la réutilisation de vos identifiants Matrix mis en cache
- la conservation de la même sélection de compte et de la configuration `channels.matrix`
- le déplacement du plus ancien stockage sync Matrix plat vers l’emplacement actuel limité au compte
- le déplacement du plus ancien stockage crypto Matrix plat vers l’emplacement actuel limité au compte lorsque le compte cible peut être résolu en toute sécurité
- l’extraction d’une clé de déchiffrement de sauvegarde de clé de salle Matrix précédemment enregistrée depuis l’ancien stockage crypto rust, lorsque cette clé existe localement
- la réutilisation de la racine de stockage avec hash de jeton la plus complète existante pour le même compte Matrix, homeserver et utilisateur lorsque le jeton d’accès change plus tard
- l’analyse des racines sœurs de stockage avec hash de jeton pour trouver des métadonnées de restauration d’état chiffré en attente lorsque le jeton d’accès Matrix a changé mais que l’identité de compte/appareil est restée la même
- la restauration des clés de salle sauvegardées dans le nouveau stockage crypto au prochain démarrage Matrix

Détails de l’instantané :

- OpenClaw écrit un fichier marqueur dans `~/.openclaw/matrix/migration-snapshot.json` après un instantané réussi afin que les passages ultérieurs de démarrage et de réparation puissent réutiliser la même archive.
- Ces instantanés automatiques de migration Matrix ne sauvegardent que la configuration + l’état (`includeWorkspace: false`).
- Si Matrix n’a qu’un état de migration avec avertissements uniquement, par exemple parce que `userId` ou `accessToken` manque encore, OpenClaw ne crée pas encore l’instantané car aucune mutation Matrix n’est exploitable.
- Si l’étape d’instantané échoue, OpenClaw ignore la migration Matrix pour cette exécution au lieu de modifier l’état sans point de récupération.

À propos des mises à niveau multi-comptes :

- le plus ancien stockage Matrix plat (`~/.openclaw/matrix/bot-storage.json` et `~/.openclaw/matrix/crypto/`) provenait d’une disposition à stockage unique, donc OpenClaw ne peut le migrer que vers une cible de compte Matrix résolue
- les stockages Matrix hérités déjà limités au compte sont détectés et préparés par compte Matrix configuré

## Ce que la migration ne peut pas faire automatiquement

L’ancien Plugin public Matrix ne créait **pas** automatiquement de sauvegardes de clés de salle Matrix. Il persistait l’état crypto local et demandait la vérification des appareils, mais il ne garantissait pas que vos clés de salle étaient sauvegardées sur le homeserver.

Cela signifie que certaines installations chiffrées ne peuvent être migrées que partiellement.

OpenClaw ne peut pas récupérer automatiquement :

- les clés de salle uniquement locales qui n’ont jamais été sauvegardées
- l’état chiffré lorsque le compte Matrix cible ne peut pas encore être résolu parce que `homeserver`, `userId` ou `accessToken` ne sont pas encore disponibles
- la migration automatique d’un stockage Matrix plat partagé lorsque plusieurs comptes Matrix sont configurés mais que `channels.matrix.defaultAccount` n’est pas défini
- les installations avec chemin de Plugin personnalisé qui sont épinglées à un chemin de dépôt au lieu du paquet Matrix standard
- une clé de récupération manquante lorsque l’ancien stockage avait des clés sauvegardées mais n’a pas conservé localement la clé de déchiffrement

Portée actuelle des avertissements :

- les installations Matrix avec chemin de Plugin personnalisé sont signalées à la fois par le démarrage du gateway et par `openclaw doctor`

Si votre ancienne installation avait un historique chiffré uniquement local qui n’a jamais été sauvegardé, certains anciens messages chiffrés peuvent rester illisibles après la mise à niveau.

## Flux de mise à niveau recommandé

1. Mettez à jour OpenClaw et le Plugin Matrix normalement.
   Préférez `openclaw update` simple sans `--no-restart` afin que le démarrage puisse terminer immédiatement la migration Matrix.
2. Exécutez :

   ```bash
   openclaw doctor --fix
   ```

   Si Matrix a un travail de migration exploitable, doctor créera ou réutilisera d’abord l’instantané pré-migration et affichera le chemin de l’archive.

3. Démarrez ou redémarrez le gateway.
4. Vérifiez l’état actuel de vérification et de sauvegarde :

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Si OpenClaw vous indique qu’une clé de récupération est nécessaire, exécutez :

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Si cet appareil n’est toujours pas vérifié, exécutez :

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Si vous abandonnez intentionnellement l’ancien historique irrécupérable et voulez une nouvelle base de sauvegarde pour les futurs messages, exécutez :

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. S’il n’existe pas encore de sauvegarde de clés côté serveur, créez-en une pour les futures récupérations :

   ```bash
   openclaw matrix verify bootstrap
   ```

## Comment fonctionne la migration chiffrée

La migration chiffrée est un processus en deux étapes :

1. Le démarrage ou `openclaw doctor --fix` crée ou réutilise l’instantané pré-migration si la migration chiffrée est exploitable.
2. Le démarrage ou `openclaw doctor --fix` inspecte l’ancien stockage crypto Matrix via l’installation active du Plugin Matrix.
3. Si une clé de déchiffrement de sauvegarde est trouvée, OpenClaw l’écrit dans le nouveau flux de clé de récupération et marque la restauration des clés de salle comme en attente.
4. Au prochain démarrage Matrix, OpenClaw restaure automatiquement les clés de salle sauvegardées dans le nouveau stockage crypto.

Si l’ancien stockage signale des clés de salle qui n’ont jamais été sauvegardées, OpenClaw avertit au lieu de prétendre que la récupération a réussi.

## Messages courants et leur signification

### Messages de mise à niveau et de détection

`Matrix plugin upgraded in place.`

- Signification : l’ancien état Matrix sur disque a été détecté et migré vers la disposition actuelle.
- Que faire : rien, sauf si la même sortie inclut aussi des avertissements.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Signification : OpenClaw a créé une archive de récupération avant de modifier l’état Matrix.
- Que faire : conservez le chemin d’archive affiché jusqu’à confirmation que la migration a réussi.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Signification : OpenClaw a trouvé un marqueur d’instantané de migration Matrix existant et a réutilisé cette archive au lieu de créer une sauvegarde en double.
- Que faire : conservez le chemin d’archive affiché jusqu’à confirmation que la migration a réussi.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Signification : un ancien état Matrix existe, mais OpenClaw ne peut pas le mapper à un compte Matrix actuel car Matrix n’est pas configuré.
- Que faire : configurez `channels.matrix`, puis relancez `openclaw doctor --fix` ou redémarrez le gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Signification : OpenClaw a trouvé un ancien état, mais ne peut toujours pas déterminer la racine exacte actuelle du compte/appareil.
- Que faire : démarrez le gateway une fois avec une connexion Matrix fonctionnelle, ou relancez `openclaw doctor --fix` une fois les identifiants mis en cache disponibles.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Signification : OpenClaw a trouvé un stockage Matrix plat partagé, mais refuse de deviner quel compte Matrix nommé doit le recevoir.
- Que faire : définissez `channels.matrix.defaultAccount` sur le compte voulu, puis relancez `openclaw doctor --fix` ou redémarrez le gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Signification : le nouvel emplacement limité au compte possède déjà un stockage sync ou crypto, donc OpenClaw ne l’a pas écrasé automatiquement.
- Que faire : vérifiez que le compte actuel est le bon avant de supprimer ou déplacer manuellement la cible en conflit.

`Failed migrating Matrix legacy sync store (...)` ou `Failed migrating Matrix legacy crypto store (...)`

- Signification : OpenClaw a essayé de déplacer l’ancien état Matrix mais l’opération sur le système de fichiers a échoué.
- Que faire : inspectez les permissions du système de fichiers et l’état du disque, puis relancez `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Signification : OpenClaw a trouvé un ancien stockage Matrix chiffré, mais il n’existe aucune configuration Matrix actuelle à laquelle le rattacher.
- Que faire : configurez `channels.matrix`, puis relancez `openclaw doctor --fix` ou redémarrez le gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Signification : le stockage chiffré existe, mais OpenClaw ne peut pas décider en toute sécurité à quel compte/appareil actuel il appartient.
- Que faire : démarrez le gateway une fois avec une connexion Matrix fonctionnelle, ou relancez `openclaw doctor --fix` une fois les identifiants mis en cache disponibles.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Signification : OpenClaw a trouvé un stockage crypto hérité plat partagé, mais refuse de deviner quel compte Matrix nommé doit le recevoir.
- Que faire : définissez `channels.matrix.defaultAccount` sur le compte voulu, puis relancez `openclaw doctor --fix` ou redémarrez le gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Signification : OpenClaw a détecté un ancien état Matrix, mais la migration est encore bloquée par des données d’identité ou d’identifiants manquantes.
- Que faire : terminez la connexion Matrix ou la configuration, puis relancez `openclaw doctor --fix` ou redémarrez le gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Signification : OpenClaw a trouvé un ancien état Matrix chiffré, mais n’a pas pu charger le point d’entrée auxiliaire du Plugin Matrix qui inspecte normalement ce stockage.
- Que faire : réinstallez ou réparez le Plugin Matrix (`openclaw plugins install @openclaw/matrix`, ou `openclaw plugins install ./path/to/local/matrix-plugin` pour un checkout de dépôt), puis relancez `openclaw doctor --fix` ou redémarrez le gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Signification : OpenClaw a trouvé un chemin de fichier auxiliaire qui s’échappe de la racine du Plugin ou échoue aux vérifications de frontière du Plugin, il a donc refusé de l’importer.
- Que faire : réinstallez le Plugin Matrix depuis un chemin de confiance, puis relancez `openclaw doctor --fix` ou redémarrez le gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Signification : OpenClaw a refusé de modifier l’état Matrix parce qu’il n’a pas pu créer d’abord l’instantané de récupération.
- Que faire : corrigez l’erreur de sauvegarde, puis relancez `openclaw doctor --fix` ou redémarrez le gateway.

`Failed migrating legacy Matrix client storage: ...`

- Signification : le repli côté client Matrix a trouvé un ancien stockage plat, mais le déplacement a échoué. OpenClaw interrompt désormais ce repli au lieu de démarrer silencieusement avec un stockage neuf.
- Que faire : inspectez les permissions du système de fichiers ou les conflits, gardez l’ancien état intact, puis réessayez après avoir corrigé l’erreur.

`Matrix is installed from a custom path: ...`

- Signification : Matrix est épinglé à une installation par chemin, donc les mises à jour mainline ne le remplacent pas automatiquement par le paquet Matrix standard du dépôt.
- Que faire : réinstallez avec `openclaw plugins install @openclaw/matrix` lorsque vous voulez revenir au Plugin Matrix par défaut.

### Messages de récupération d’état chiffré

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Signification : les clés de salle sauvegardées ont été restaurées avec succès dans le nouveau stockage crypto.
- Que faire : généralement rien.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Signification : certaines anciennes clés de salle n’existaient que dans l’ancien stockage local et n’avaient jamais été envoyées vers la sauvegarde Matrix.
- Que faire : attendez-vous à ce qu’une partie de l’ancien historique chiffré reste indisponible à moins de pouvoir récupérer manuellement ces clés depuis un autre client Matrix vérifié.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Signification : une sauvegarde existe, mais OpenClaw n’a pas pu récupérer automatiquement la clé de récupération.
- Que faire : exécutez `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Signification : OpenClaw a trouvé l’ancien stockage chiffré, mais n’a pas pu l’inspecter de façon suffisamment sûre pour préparer la récupération.
- Que faire : relancez `openclaw doctor --fix`. Si cela se répète, gardez intact l’ancien répertoire d’état et récupérez via un autre client Matrix vérifié plus `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Signification : OpenClaw a détecté un conflit de clé de sauvegarde et a refusé d’écraser automatiquement le fichier current recovery-key.
- Que faire : vérifiez quelle clé de récupération est correcte avant de réessayer toute commande de restauration.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Signification : il s’agit de la limite stricte de l’ancien format de stockage.
- Que faire : les clés sauvegardées peuvent toujours être restaurées, mais l’historique chiffré uniquement local peut rester indisponible.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Signification : le nouveau Plugin a tenté la restauration mais Matrix a renvoyé une erreur.
- Que faire : exécutez `openclaw matrix verify backup status`, puis réessayez avec `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` si nécessaire.

### Messages de récupération manuelle

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Signification : OpenClaw sait que vous devriez avoir une clé de sauvegarde, mais elle n’est pas active sur cet appareil.
- Que faire : exécutez `openclaw matrix verify backup restore`, ou passez `--recovery-key` si nécessaire.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Signification : cet appareil n’a pas actuellement la clé de récupération stockée.
- Que faire : vérifiez d’abord l’appareil avec votre clé de récupération, puis restaurez la sauvegarde.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Signification : la clé stockée ne correspond pas à la sauvegarde Matrix active.
- Que faire : relancez `openclaw matrix verify device "<your-recovery-key>"` avec la bonne clé.

Si vous acceptez de perdre l’ancien historique chiffré irrécupérable, vous pouvez à la place réinitialiser la
base actuelle de sauvegarde avec `openclaw matrix verify backup reset --yes`. Lorsque le
secret de sauvegarde stocké est cassé, cette réinitialisation peut aussi recréer le stockage secret afin que la
nouvelle clé de sauvegarde puisse se charger correctement après redémarrage.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Signification : la sauvegarde existe, mais cet appareil ne fait pas encore suffisamment confiance à la chaîne de cross-signing.
- Que faire : relancez `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Signification : vous avez essayé une étape de récupération sans fournir de clé de récupération alors qu’elle était requise.
- Que faire : relancez la commande avec votre clé de récupération.

`Invalid Matrix recovery key: ...`

- Signification : la clé fournie n’a pas pu être analysée ou ne correspond pas au format attendu.
- Que faire : réessayez avec la clé de récupération exacte depuis votre client Matrix ou le fichier recovery-key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Signification : la clé a été appliquée, mais l’appareil n’a toujours pas pu terminer la vérification.
- Que faire : confirmez que vous avez utilisé la bonne clé et que le cross-signing est disponible sur le compte, puis réessayez.

`Matrix key backup is not active on this device after loading from secret storage.`

- Signification : le stockage secret n’a pas produit de session de sauvegarde active sur cet appareil.
- Que faire : vérifiez d’abord l’appareil, puis revérifiez avec `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Signification : cet appareil ne peut pas restaurer depuis le stockage secret tant que la vérification de l’appareil n’est pas terminée.
- Que faire : exécutez d’abord `openclaw matrix verify device "<your-recovery-key>"`.

### Messages d’installation de Plugin personnalisé

`Matrix is installed from a custom path that no longer exists: ...`

- Signification : votre enregistrement d’installation de Plugin pointe vers un chemin local qui n’existe plus.
- Que faire : réinstallez avec `openclaw plugins install @openclaw/matrix`, ou si vous exécutez depuis un checkout de dépôt, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Si l’historique chiffré ne revient toujours pas

Exécutez ces vérifications dans l’ordre :

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Si la sauvegarde est restaurée avec succès mais que certains anciens salons n’ont toujours pas d’historique, ces clés manquantes n’ont probablement jamais été sauvegardées par l’ancien Plugin.

## Si vous voulez repartir à zéro pour les futurs messages

Si vous acceptez de perdre l’ancien historique chiffré irrécupérable et voulez seulement une base propre de sauvegarde pour l’avenir, exécutez ces commandes dans l’ordre :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si l’appareil n’est toujours pas vérifié après cela, terminez la vérification depuis votre client Matrix en comparant les emoji SAS ou les codes décimaux et en confirmant qu’ils correspondent.

## Pages liées

- [Matrix](/fr/channels/matrix)
- [Doctor](/fr/gateway/doctor)
- [Migration](/fr/install/migrating)
- [Plugins](/fr/tools/plugin)
