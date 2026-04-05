---
read_when:
    - Mise à niveau d’une installation Matrix existante
    - Migration de l’historique Matrix chiffré et de l’état de l’appareil
summary: Comment OpenClaw met à niveau l’ancien plugin Matrix sur place, y compris les limites de récupération de l’état chiffré et les étapes de récupération manuelle.
title: Migration Matrix
x-i18n:
    generated_at: "2026-04-05T12:46:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b1ade057d90a524e09756bd981921988c980ea6259f5c4316a796a831e9f83b
    source_path: install/migrating-matrix.md
    workflow: 15
---

# Migration Matrix

Cette page couvre les mises à niveau depuis l’ancien plugin public `matrix` vers l’implémentation actuelle.

Pour la plupart des utilisateurs, la mise à niveau se fait sur place :

- le plugin reste `@openclaw/matrix`
- le canal reste `matrix`
- votre configuration reste sous `channels.matrix`
- les identifiants en cache restent sous `~/.openclaw/credentials/matrix/`
- l’état d’exécution reste sous `~/.openclaw/matrix/`

Vous n’avez pas besoin de renommer les clés de configuration ni de réinstaller le plugin sous un nouveau nom.

## Ce que la migration fait automatiquement

Lorsque la gateway démarre, et lorsque vous exécutez [`openclaw doctor --fix`](/gateway/doctor), OpenClaw essaie de réparer automatiquement l’ancien état Matrix.
Avant qu’une étape exploitable de migration Matrix ne modifie l’état sur disque, OpenClaw crée ou réutilise un instantané de récupération ciblé.

Lorsque vous utilisez `openclaw update`, le déclencheur exact dépend de la façon dont OpenClaw est installé :

- les installations depuis les sources exécutent `openclaw doctor --fix` pendant le flux de mise à jour, puis redémarrent la gateway par défaut
- les installations via gestionnaire de paquets mettent à jour le package, exécutent un passage doctor non interactif, puis s’appuient sur le redémarrage par défaut de la gateway afin que le démarrage puisse terminer la migration Matrix
- si vous utilisez `openclaw update --no-restart`, la migration Matrix adossée au démarrage est différée jusqu’à ce que vous exécutiez plus tard `openclaw doctor --fix` et redémarriez la gateway

La migration automatique couvre :

- la création ou la réutilisation d’un instantané avant migration sous `~/Backups/openclaw-migrations/`
- la réutilisation de vos identifiants Matrix en cache
- la conservation de la même sélection de compte et de la configuration `channels.matrix`
- le déplacement du plus ancien magasin plat de synchronisation Matrix vers l’emplacement actuel à portée de compte
- le déplacement du plus ancien magasin plat de chiffrement Matrix vers l’emplacement actuel à portée de compte lorsque le compte cible peut être résolu en toute sécurité
- l’extraction d’une clé de déchiffrement de sauvegarde de clés de salon Matrix précédemment enregistrée depuis l’ancien magasin de chiffrement rust, lorsque cette clé existe localement
- la réutilisation de la racine de stockage à hachage de jeton existante la plus complète pour le même compte Matrix, homeserver et utilisateur lorsque le jeton d’accès change plus tard
- l’analyse des racines de stockage à hachage de jeton voisines pour détecter les métadonnées de restauration d’état chiffré en attente lorsque le jeton d’accès Matrix a changé mais que l’identité compte/appareil est restée la même
- la restauration des clés de salon sauvegardées dans le nouveau magasin de chiffrement au prochain démarrage Matrix

Détails de l’instantané :

- OpenClaw écrit un fichier marqueur à `~/.openclaw/matrix/migration-snapshot.json` après un instantané réussi afin que les futurs passages de démarrage et de réparation puissent réutiliser la même archive.
- Ces instantanés automatiques de migration Matrix ne sauvegardent que la configuration + l’état (`includeWorkspace: false`).
- Si Matrix n’a qu’un état de migration avec avertissements uniquement, par exemple parce que `userId` ou `accessToken` est encore manquant, OpenClaw ne crée pas encore l’instantané, car aucune mutation Matrix n’est exploitable.
- Si l’étape d’instantané échoue, OpenClaw ignore la migration Matrix pour cette exécution au lieu de modifier l’état sans point de récupération.

À propos des mises à niveau multi-comptes :

- le plus ancien magasin Matrix plat (`~/.openclaw/matrix/bot-storage.json` et `~/.openclaw/matrix/crypto/`) provenait d’un agencement à magasin unique, donc OpenClaw ne peut le migrer que vers une seule cible de compte Matrix résolue
- les magasins Matrix hérités déjà à portée de compte sont détectés et préparés pour chaque compte Matrix configuré

## Ce que la migration ne peut pas faire automatiquement

L’ancien plugin public Matrix ne créait **pas** automatiquement de sauvegardes de clés de salon Matrix. Il persistait l’état de chiffrement local et demandait la vérification de l’appareil, mais il ne garantissait pas que vos clés de salon étaient sauvegardées sur le homeserver.

Cela signifie que certaines installations chiffrées ne peuvent être migrées que partiellement.

OpenClaw ne peut pas récupérer automatiquement :

- les clés de salon locales uniquement qui n’ont jamais été sauvegardées
- l’état chiffré lorsque le compte Matrix cible ne peut pas encore être résolu parce que `homeserver`, `userId` ou `accessToken` ne sont pas encore disponibles
- la migration automatique d’un magasin Matrix plat partagé lorsqu’il y a plusieurs comptes Matrix configurés mais que `channels.matrix.defaultAccount` n’est pas défini
- les installations à chemin de plugin personnalisé qui sont épinglées à un chemin du dépôt au lieu du package Matrix standard
- une clé de récupération manquante lorsque l’ancien magasin avait des clés sauvegardées mais n’a pas conservé localement la clé de déchiffrement

Portée actuelle des avertissements :

- les installations du plugin Matrix depuis un chemin personnalisé sont signalées à la fois au démarrage de la gateway et par `openclaw doctor`

Si votre ancienne installation avait un historique chiffré local uniquement qui n’a jamais été sauvegardé, certains anciens messages chiffrés peuvent rester illisibles après la mise à niveau.

## Flux de mise à niveau recommandé

1. Mettez à jour OpenClaw et le plugin Matrix normalement.
   Préférez `openclaw update` simple sans `--no-restart` afin que le démarrage puisse terminer immédiatement la migration Matrix.
2. Exécutez :

   ```bash
   openclaw doctor --fix
   ```

   Si Matrix a un travail de migration exploitable, doctor créera ou réutilisera d’abord l’instantané avant migration et affichera le chemin de l’archive.

3. Démarrez ou redémarrez la gateway.
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

7. Si vous abandonnez intentionnellement un ancien historique irrécupérable et voulez une nouvelle base de sauvegarde pour les futurs messages, exécutez :

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Si aucune sauvegarde de clés côté serveur n’existe encore, créez-en une pour les récupérations futures :

   ```bash
   openclaw matrix verify bootstrap
   ```

## Comment fonctionne la migration chiffrée

La migration chiffrée est un processus en deux étapes :

1. Le démarrage ou `openclaw doctor --fix` crée ou réutilise l’instantané avant migration si la migration chiffrée est exploitable.
2. Le démarrage ou `openclaw doctor --fix` inspecte l’ancien magasin de chiffrement Matrix via l’installation active du plugin Matrix.
3. Si une clé de déchiffrement de sauvegarde est trouvée, OpenClaw l’écrit dans le nouveau flux de clé de récupération et marque la restauration des clés de salon comme en attente.
4. Au prochain démarrage Matrix, OpenClaw restaure automatiquement les clés de salon sauvegardées dans le nouveau magasin de chiffrement.

Si l’ancien magasin signale des clés de salon qui n’ont jamais été sauvegardées, OpenClaw émet un avertissement au lieu de faire croire que la récupération a réussi.

## Messages courants et leur signification

### Messages de mise à niveau et de détection

`Matrix plugin upgraded in place.`

- Signification : l’ancien état Matrix sur disque a été détecté et migré vers la disposition actuelle.
- Que faire : rien, sauf si la même sortie inclut aussi des avertissements.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Signification : OpenClaw a créé une archive de récupération avant de modifier l’état Matrix.
- Que faire : conservez le chemin d’archive affiché jusqu’à confirmation de la réussite de la migration.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Signification : OpenClaw a trouvé un marqueur d’instantané de migration Matrix existant et a réutilisé cette archive au lieu de créer une sauvegarde en double.
- Que faire : conservez le chemin d’archive affiché jusqu’à confirmation de la réussite de la migration.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Signification : un ancien état Matrix existe, mais OpenClaw ne peut pas l’associer à un compte Matrix actuel parce que Matrix n’est pas configuré.
- Que faire : configurez `channels.matrix`, puis relancez `openclaw doctor --fix` ou redémarrez la gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Signification : OpenClaw a trouvé un ancien état, mais il ne peut toujours pas déterminer la racine exacte actuelle compte/appareil.
- Que faire : démarrez la gateway une fois avec une connexion Matrix fonctionnelle, ou relancez `openclaw doctor --fix` après que les identifiants en cache existent.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Signification : OpenClaw a trouvé un magasin Matrix partagé unique, mais refuse de deviner quel compte Matrix nommé doit le recevoir.
- Que faire : définissez `channels.matrix.defaultAccount` sur le compte voulu, puis relancez `openclaw doctor --fix` ou redémarrez la gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Signification : le nouvel emplacement à portée de compte possède déjà un magasin de synchronisation ou de chiffrement, donc OpenClaw ne l’a pas écrasé automatiquement.
- Que faire : vérifiez que le compte actuel est le bon avant de supprimer ou déplacer manuellement la cible en conflit.

`Failed migrating Matrix legacy sync store (...)` ou `Failed migrating Matrix legacy crypto store (...)`

- Signification : OpenClaw a essayé de déplacer un ancien état Matrix mais l’opération système de fichiers a échoué.
- Que faire : inspectez les autorisations du système de fichiers et l’état du disque, puis relancez `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Signification : OpenClaw a trouvé un ancien magasin Matrix chiffré, mais il n’existe pas de configuration Matrix actuelle à laquelle l’attacher.
- Que faire : configurez `channels.matrix`, puis relancez `openclaw doctor --fix` ou redémarrez la gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Signification : le magasin chiffré existe, mais OpenClaw ne peut pas décider en toute sécurité à quel compte/appareil actuel il appartient.
- Que faire : démarrez la gateway une fois avec une connexion Matrix fonctionnelle, ou relancez `openclaw doctor --fix` après que les identifiants en cache soient disponibles.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Signification : OpenClaw a trouvé un ancien magasin de chiffrement partagé unique, mais refuse de deviner quel compte Matrix nommé doit le recevoir.
- Que faire : définissez `channels.matrix.defaultAccount` sur le compte voulu, puis relancez `openclaw doctor --fix` ou redémarrez la gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Signification : OpenClaw a détecté un ancien état Matrix, mais la migration est encore bloquée par des données d’identité ou d’identifiants manquantes.
- Que faire : terminez la connexion Matrix ou la configuration, puis relancez `openclaw doctor --fix` ou redémarrez la gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Signification : OpenClaw a trouvé un ancien état Matrix chiffré, mais n’a pas pu charger le point d’entrée utilitaire du plugin Matrix qui inspecte normalement ce magasin.
- Que faire : réinstallez ou réparez le plugin Matrix (`openclaw plugins install @openclaw/matrix`, ou `openclaw plugins install ./path/to/local/matrix-plugin` pour une extraction du dépôt), puis relancez `openclaw doctor --fix` ou redémarrez la gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Signification : OpenClaw a trouvé un chemin de fichier utilitaire qui sort de la racine du plugin ou échoue aux vérifications de frontière du plugin, il a donc refusé de l’importer.
- Que faire : réinstallez le plugin Matrix depuis un chemin de confiance, puis relancez `openclaw doctor --fix` ou redémarrez la gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Signification : OpenClaw a refusé de modifier l’état Matrix parce qu’il n’a pas pu créer d’abord l’instantané de récupération.
- Que faire : résolvez l’erreur de sauvegarde, puis relancez `openclaw doctor --fix` ou redémarrez la gateway.

`Failed migrating legacy Matrix client storage: ...`

- Signification : la solution de repli côté client Matrix a trouvé un ancien stockage plat, mais le déplacement a échoué. OpenClaw interrompt maintenant cette solution de repli au lieu de démarrer silencieusement avec un nouveau magasin.
- Que faire : inspectez les autorisations du système de fichiers ou les conflits, conservez l’ancien état intact et réessayez après avoir corrigé l’erreur.

`Matrix is installed from a custom path: ...`

- Signification : Matrix est épinglé à une installation par chemin, donc les mises à jour principales ne le remplacent pas automatiquement par le package Matrix standard du dépôt.
- Que faire : réinstallez avec `openclaw plugins install @openclaw/matrix` lorsque vous voulez revenir au plugin Matrix par défaut.

### Messages de récupération d’état chiffré

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Signification : les clés de salon sauvegardées ont été restaurées avec succès dans le nouveau magasin de chiffrement.
- Que faire : généralement rien.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Signification : certaines anciennes clés de salon n’existaient que dans l’ancien magasin local et n’avaient jamais été envoyées à la sauvegarde Matrix.
- Que faire : attendez-vous à ce qu’une partie de l’ancien historique chiffré reste indisponible, sauf si vous pouvez récupérer manuellement ces clés depuis un autre client vérifié.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Signification : une sauvegarde existe, mais OpenClaw n’a pas pu récupérer automatiquement la clé de récupération.
- Que faire : exécutez `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Signification : OpenClaw a trouvé l’ancien magasin chiffré, mais n’a pas pu l’inspecter de manière suffisamment sûre pour préparer la récupération.
- Que faire : relancez `openclaw doctor --fix`. Si cela se répète, conservez intact l’ancien répertoire d’état et récupérez en utilisant un autre client Matrix vérifié plus `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Signification : OpenClaw a détecté un conflit de clé de sauvegarde et a refusé d’écraser automatiquement le fichier recovery-key actuel.
- Que faire : vérifiez quelle clé de récupération est correcte avant de réessayer une commande de restauration.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Signification : il s’agit de la limite stricte de l’ancien format de stockage.
- Que faire : les clés sauvegardées peuvent toujours être restaurées, mais l’historique chiffré local uniquement peut rester indisponible.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Signification : le nouveau plugin a tenté la restauration mais Matrix a renvoyé une erreur.
- Que faire : exécutez `openclaw matrix verify backup status`, puis réessayez avec `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` si nécessaire.

### Messages de récupération manuelle

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Signification : OpenClaw sait que vous devriez avoir une clé de sauvegarde, mais elle n’est pas active sur cet appareil.
- Que faire : exécutez `openclaw matrix verify backup restore`, ou passez `--recovery-key` si nécessaire.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Signification : cet appareil ne possède pas actuellement la clé de récupération enregistrée.
- Que faire : vérifiez d’abord l’appareil avec votre clé de récupération, puis restaurez la sauvegarde.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Signification : la clé stockée ne correspond pas à la sauvegarde Matrix active.
- Que faire : relancez `openclaw matrix verify device "<your-recovery-key>"` avec la bonne clé.

Si vous acceptez de perdre l’ancien historique chiffré irrécupérable, vous pouvez à la place réinitialiser la
base actuelle de sauvegarde avec `openclaw matrix verify backup reset --yes`. Lorsque le
secret de sauvegarde stocké est cassé, cette réinitialisation peut aussi recréer le stockage des secrets afin que la
nouvelle clé de sauvegarde puisse se charger correctement après redémarrage.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Signification : la sauvegarde existe, mais cet appareil ne fait pas encore suffisamment confiance à la chaîne de cross-signing.
- Que faire : relancez `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Signification : vous avez essayé une étape de récupération sans fournir la clé de récupération alors qu’elle était requise.
- Que faire : relancez la commande avec votre clé de récupération.

`Invalid Matrix recovery key: ...`

- Signification : la clé fournie n’a pas pu être analysée ou ne correspond pas au format attendu.
- Que faire : réessayez avec la clé de récupération exacte depuis votre client Matrix ou votre fichier recovery-key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Signification : la clé a été appliquée, mais l’appareil n’a toujours pas pu terminer la vérification.
- Que faire : confirmez que vous avez utilisé la bonne clé et que le cross-signing est disponible sur le compte, puis réessayez.

`Matrix key backup is not active on this device after loading from secret storage.`

- Signification : le stockage des secrets n’a pas produit de session de sauvegarde active sur cet appareil.
- Que faire : vérifiez d’abord l’appareil, puis revérifiez avec `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Signification : cet appareil ne peut pas restaurer depuis le stockage des secrets tant que la vérification de l’appareil n’est pas terminée.
- Que faire : exécutez d’abord `openclaw matrix verify device "<your-recovery-key>"`.

### Messages d’installation de plugin personnalisé

`Matrix is installed from a custom path that no longer exists: ...`

- Signification : votre enregistrement d’installation du plugin pointe vers un chemin local qui n’existe plus.
- Que faire : réinstallez avec `openclaw plugins install @openclaw/matrix`, ou si vous travaillez depuis une extraction du dépôt, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Si l’historique chiffré ne revient toujours pas

Exécutez ces vérifications dans l’ordre :

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Si la sauvegarde se restaure avec succès mais que certains anciens salons n’ont toujours pas d’historique, ces clés manquantes n’ont probablement jamais été sauvegardées par l’ancien plugin.

## Si vous voulez repartir de zéro pour les futurs messages

Si vous acceptez de perdre l’ancien historique chiffré irrécupérable et voulez seulement une base de sauvegarde propre pour la suite, exécutez ces commandes dans l’ordre :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si l’appareil n’est toujours pas vérifié après cela, terminez la vérification depuis votre client Matrix en comparant les emoji SAS ou les codes décimaux et en confirmant qu’ils correspondent.

## Pages associées

- [Matrix](/channels/matrix)
- [Doctor](/gateway/doctor)
- [Migration](/install/migrating)
- [Plugins](/tools/plugin)
