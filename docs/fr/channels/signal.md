---
read_when:
    - Configurer la prise en charge de Signal
    - Déboguer l'envoi/la réception de Signal
summary: Prise en charge de Signal via signal-cli (JSON-RPC + SSE), chemins de configuration et modèle de numéro
title: Signal
x-i18n:
    generated_at: "2026-04-05T12:36:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Statut : intégration CLI externe. La gateway communique avec `signal-cli` via HTTP JSON-RPC + SSE.

## Prérequis

- OpenClaw installé sur votre serveur (le flux Linux ci-dessous a été testé sur Ubuntu 24).
- `signal-cli` disponible sur l'hôte où la gateway s'exécute.
- Un numéro de téléphone capable de recevoir un SMS de vérification (pour le parcours d'inscription par SMS).
- Un accès navigateur pour le captcha Signal (`signalcaptchas.org`) pendant l'inscription.

## Configuration rapide (débutant)

1. Utilisez un **numéro Signal distinct** pour le bot (recommandé).
2. Installez `signal-cli` (Java est requis si vous utilisez la build JVM).
3. Choisissez un parcours de configuration :
   - **Parcours A (liaison QR) :** `signal-cli link -n "OpenClaw"` puis scannez avec Signal.
   - **Parcours B (inscription SMS) :** inscrivez un numéro dédié avec captcha + vérification SMS.
4. Configurez OpenClaw et redémarrez la gateway.
5. Envoyez un premier message privé et approuvez le jumelage (`openclaw pairing approve signal <CODE>`).

Configuration minimale :

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Référence des champs :

| Champ       | Description                                         |
| ----------- | --------------------------------------------------- |
| `account`   | Numéro de téléphone du bot au format E.164 (`+15551234567`) |
| `cliPath`   | Chemin vers `signal-cli` (`signal-cli` s'il est dans le `PATH`) |
| `dmPolicy`  | Politique d'accès aux messages privés (`pairing` recommandé) |
| `allowFrom` | Numéros de téléphone ou valeurs `uuid:<id>` autorisés à envoyer des messages privés |

## Ce que c'est

- Canal Signal via `signal-cli` (pas de libsignal intégrée).
- Routage déterministe : les réponses reviennent toujours vers Signal.
- Les messages privés partagent la session principale de l'agent ; les groupes sont isolés (`agent:<agentId>:signal:group:<groupId>`).

## Écritures de configuration

Par défaut, Signal est autorisé à écrire des mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Désactivez avec :

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Le modèle de numéro (important)

- La gateway se connecte à un **appareil Signal** (le compte `signal-cli`).
- Si vous exécutez le bot sur **votre compte Signal personnel**, il ignorera vos propres messages (protection contre les boucles).
- Pour « j'envoie un message au bot et il répond », utilisez un **numéro de bot distinct**.

## Parcours de configuration A : lier un compte Signal existant (QR)

1. Installez `signal-cli` (build JVM ou native).
2. Liez un compte bot :
   - `signal-cli link -n "OpenClaw"` puis scannez le QR dans Signal.
3. Configurez Signal et démarrez la gateway.

Exemple :

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Prise en charge multi-comptes : utilisez `channels.signal.accounts` avec une configuration par compte et un `name` facultatif. Voir [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels) pour le modèle partagé.

## Parcours de configuration B : inscrire un numéro de bot dédié (SMS, Linux)

Utilisez cette option si vous souhaitez un numéro de bot dédié au lieu de lier un compte d'application Signal existant.

1. Obtenez un numéro capable de recevoir des SMS (ou une vérification vocale pour les lignes fixes).
   - Utilisez un numéro de bot dédié pour éviter les conflits de compte/session.
2. Installez `signal-cli` sur l'hôte gateway :

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si vous utilisez la build JVM (`signal-cli-${VERSION}.tar.gz`), installez d'abord JRE 25+.
Maintenez `signal-cli` à jour ; l'amont indique que les anciennes versions peuvent cesser de fonctionner à mesure que les API serveur de Signal évoluent.

3. Inscrivez et vérifiez le numéro :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si un captcha est requis :

1. Ouvrez `https://signalcaptchas.org/registration/generate.html`.
2. Effectuez le captcha, copiez la cible du lien `signalcaptcha://...` depuis « Open Signal ».
3. Exécutez depuis la même IP externe que la session navigateur si possible.
4. Relancez immédiatement l'inscription (les jetons captcha expirent rapidement) :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configurez OpenClaw, redémarrez la gateway, vérifiez le canal :

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Jumelez l'expéditeur de votre message privé :
   - Envoyez n'importe quel message au numéro du bot.
   - Approuvez le code sur le serveur : `openclaw pairing approve signal <PAIRING_CODE>`.
   - Enregistrez le numéro du bot comme contact sur votre téléphone pour éviter « Unknown contact ».

Important : inscrire un compte de numéro de téléphone avec `signal-cli` peut désauthentifier la session principale de l'application Signal pour ce numéro. Préférez un numéro de bot dédié, ou utilisez le mode de liaison QR si vous devez conserver la configuration de votre application téléphonique existante.

Références amont :

- README `signal-cli` : `https://github.com/AsamK/signal-cli`
- Flux captcha : `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flux de liaison : `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode daemon externe (`httpUrl`)

Si vous souhaitez gérer `signal-cli` vous-même (démarrages à froid JVM lents, initialisation de conteneur ou CPU partagés), exécutez le daemon séparément et pointez OpenClaw vers lui :

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Cela ignore le démarrage automatique et l'attente au démarrage dans OpenClaw. Pour des démarrages lents avec lancement automatique, définissez `channels.signal.startupTimeoutMs`.

## Contrôle d'accès (messages privés + groupes)

Messages privés :

- Par défaut : `channels.signal.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code de jumelage ; les messages sont ignorés jusqu'à approbation (les codes expirent après 1 heure).
- Approuver via :
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Le jumelage est l'échange de jetons par défaut pour les messages privés Signal. Détails : [Jumelage](/channels/pairing)
- Les expéditeurs UUID uniquement (depuis `sourceUuid`) sont stockés comme `uuid:<id>` dans `channels.signal.allowFrom`.

Groupes :

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` contrôle qui peut déclencher dans les groupes lorsque `allowlist` est défini.
- `channels.signal.groups["<group-id>" | "*"]` peut remplacer le comportement de groupe avec `requireMention`, `tools` et `toolsBySender`.
- Utilisez `channels.signal.accounts.<id>.groups` pour des remplacements par compte dans les configurations multi-comptes.
- Note d'exécution : si `channels.signal` est complètement absent, l'exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

## Fonctionnement (comportement)

- `signal-cli` s'exécute comme daemon ; la gateway lit les événements via SSE.
- Les messages entrants sont normalisés dans l'enveloppe de canal partagée.
- Les réponses sont toujours routées vers le même numéro ou groupe.

## Médias + limites

- Le texte sortant est segmenté selon `channels.signal.textChunkLimit` (4000 par défaut).
- Segmentation facultative par nouvelles lignes : définissez `channels.signal.chunkMode="newline"` pour découper sur les lignes vides (limites de paragraphe) avant la segmentation par longueur.
- Pièces jointes prises en charge (base64 récupéré depuis `signal-cli`).
- Limite média par défaut : `channels.signal.mediaMaxMb` (8 par défaut).
- Utilisez `channels.signal.ignoreAttachments` pour ignorer le téléchargement des médias.
- Le contexte d'historique de groupe utilise `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), avec repli sur `messages.groupChat.historyLimit`. Définissez `0` pour désactiver (50 par défaut).

## Saisie + accusés de lecture

- **Indicateurs de saisie** : OpenClaw envoie des signaux de saisie via `signal-cli sendTyping` et les actualise pendant qu'une réponse est en cours.
- **Accusés de lecture** : lorsque `channels.signal.sendReadReceipts` est vrai, OpenClaw transmet les accusés de lecture pour les messages privés autorisés.
- Signal-cli n'expose pas les accusés de lecture pour les groupes.

## Réactions (outil de message)

- Utilisez `message action=react` avec `channel=signal`.
- Cibles : E.164 de l'expéditeur ou UUID (utilisez `uuid:<id>` depuis la sortie du jumelage ; un UUID nu fonctionne aussi).
- `messageId` est l'horodatage Signal du message auquel vous réagissez.
- Les réactions de groupe nécessitent `targetAuthor` ou `targetAuthorUuid`.

Exemples :

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuration :

- `channels.signal.actions.reactions` : activer/désactiver les actions de réaction (true par défaut).
- `channels.signal.reactionLevel` : `off | ack | minimal | extensive`.
  - `off`/`ack` désactive les réactions de l'agent (l'outil de message `react` renverra une erreur).
  - `minimal`/`extensive` active les réactions de l'agent et définit le niveau de guidage.
- Remplacements par compte : `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Cibles de livraison (CLI/cron)

- Messages privés : `signal:+15551234567` (ou E.164 brut).
- Messages privés UUID : `uuid:<id>` (ou UUID nu).
- Groupes : `signal:group:<groupId>`.
- Noms d'utilisateur : `username:<name>` (si pris en charge par votre compte Signal).

## Dépannage

Exécutez d'abord cette séquence :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Puis confirmez l'état du jumelage des messages privés si nécessaire :

```bash
openclaw pairing list signal
```

Échecs courants :

- Daemon accessible mais aucune réponse : vérifiez les paramètres de compte/daemon (`httpUrl`, `account`) et le mode de réception.
- Messages privés ignorés : l'expéditeur est en attente d'approbation de jumelage.
- Messages de groupe ignorés : le filtrage par expéditeur/mention du groupe bloque la remise.
- Erreurs de validation de configuration après modification : exécutez `openclaw doctor --fix`.
- Signal absent des diagnostics : confirmez `channels.signal.enabled: true`.

Vérifications supplémentaires :

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Pour le flux de triage : [/channels/troubleshooting](/channels/troubleshooting).

## Notes de sécurité

- `signal-cli` stocke les clés de compte localement (généralement `~/.local/share/signal-cli/data/`).
- Sauvegardez l'état du compte Signal avant une migration ou une reconstruction du serveur.
- Conservez `channels.signal.dmPolicy: "pairing"` sauf si vous souhaitez explicitement un accès plus large aux messages privés.
- La vérification par SMS n'est nécessaire que pour l'inscription ou les flux de récupération, mais perdre le contrôle du numéro/compte peut compliquer la réinscription.

## Référence de configuration (Signal)

Configuration complète : [Configuration](/gateway/configuration)

Options du fournisseur :

- `channels.signal.enabled` : activer/désactiver le démarrage du canal.
- `channels.signal.account` : E.164 pour le compte bot.
- `channels.signal.cliPath` : chemin vers `signal-cli`.
- `channels.signal.httpUrl` : URL complète du daemon (remplace l'hôte/le port).
- `channels.signal.httpHost`, `channels.signal.httpPort` : liaison du daemon (par défaut `127.0.0.1:8080`).
- `channels.signal.autoStart` : lancer automatiquement le daemon (true par défaut si `httpUrl` n'est pas défini).
- `channels.signal.startupTimeoutMs` : délai d'attente de démarrage en ms (plafond 120000).
- `channels.signal.receiveMode` : `on-start | manual`.
- `channels.signal.ignoreAttachments` : ignorer les téléchargements de pièces jointes.
- `channels.signal.ignoreStories` : ignorer les stories du daemon.
- `channels.signal.sendReadReceipts` : transmettre les accusés de lecture.
- `channels.signal.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.signal.allowFrom` : liste d'autorisation pour les messages privés (E.164 ou `uuid:<id>`). `open` nécessite `"*"`. Signal n'a pas de noms d'utilisateur ; utilisez les identifiants téléphone/UUID.
- `channels.signal.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist).
- `channels.signal.groupAllowFrom` : liste d'autorisation des expéditeurs de groupe.
- `channels.signal.groups` : remplacements par groupe indexés par ID de groupe Signal (ou `"*"`). Champs pris en charge : `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups` : version par compte de `channels.signal.groups` pour les configurations multi-comptes.
- `channels.signal.historyLimit` : nombre maximal de messages de groupe à inclure comme contexte (0 désactive).
- `channels.signal.dmHistoryLimit` : limite d'historique des messages privés en tours utilisateur. Remplacements par utilisateur : `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit` : taille des segments sortants (caractères).
- `channels.signal.chunkMode` : `length` (par défaut) ou `newline` pour découper sur des lignes vides (limites de paragraphe) avant la segmentation par longueur.
- `channels.signal.mediaMaxMb` : limite de médias entrants/sortants (Mo).

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (Signal ne prend pas en charge les mentions natives).
- `messages.groupChat.mentionPatterns` (repli global).
- `messages.responsePrefix`.

## Lié

- [Vue d'ensemble des canaux](/channels) — tous les canaux pris en charge
- [Jumelage](/channels/pairing) — authentification en message privé et flux de jumelage
- [Groupes](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/gateway/security) — modèle d'accès et durcissement
