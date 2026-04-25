---
read_when:
    - Travail sur le comportement du canal WhatsApp/web ou le routage de la boîte de réception
summary: prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T18:17:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0935e7ac3676c57d83173a6dd9eedc489f77b278dfbc47bd811045078ee7e4d0
    source_path: channels/whatsapp.md
    workflow: 15
---

Statut : prêt pour la production via WhatsApp Web (Baileys). La Gateway gère la ou les session(s) liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose également le flux d’installation lorsque
  le plugin n’est pas encore présent.
- Canal de développement + extraction git : utilise par défaut le chemin du plugin local.
- Stable/Beta : utilise par défaut le package npm `@openclaw/whatsapp`.

L’installation manuelle reste disponible :

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique DM par défaut est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration de la Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles complets de configuration des canaux et exemples.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Configurer la politique d’accès WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Lier WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour rattacher un répertoire d’authentification WhatsApp Web existant/personnalisé avant la connexion :

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Démarrer la Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approuver la première demande d’appairage (si vous utilisez le mode appairage)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Les demandes d’appairage expirent après 1 heure. Les demandes en attente sont limitées à 3 par canal.

  </Step>
</Steps>

<Note>
OpenClaw recommande d’utiliser WhatsApp avec un numéro distinct lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont également prises en charge.)
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    C’est le mode opérationnel le plus propre :

    - identité WhatsApp distincte pour OpenClaw
    - listes d’autorisation DM et limites de routage plus claires
    - risque plus faible de confusion avec l’auto-conversation

    Modèle de politique minimal :

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Solution de repli avec numéro personnel">
    L’onboarding prend en charge le mode numéro personnel et écrit une base adaptée à l’auto-conversation :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    À l’exécution, les protections d’auto-conversation reposent sur le numéro personnel lié et `allowFrom`.

  </Accordion>

  <Accordion title="Périmètre du canal limité à WhatsApp Web">
    Le canal de plateforme de messagerie repose sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie Twilio WhatsApp distinct dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- La Gateway gère le socket WhatsApp et la boucle de reconnexion.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les discussions de statut et de diffusion sont ignorées (`@status`, `@broadcast`).
- Les discussions directes utilisent les règles de session DM (`session.dmScope` ; par défaut, `main` regroupe les DM dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Le transport WhatsApp Web respecte les variables d’environnement proxy standard sur l’hôte de la Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez une configuration proxy au niveau de l’hôte plutôt que des paramètres proxy WhatsApp spécifiques au canal.

## Hooks de plugin et confidentialité

Les messages entrants WhatsApp peuvent contenir du contenu de message personnel, des numéros de téléphone,
des identifiants de groupe, des noms d’expéditeur et des champs de corrélation de session. Pour cette raison,
WhatsApp ne diffuse pas les charges utiles des hooks entrants `message_received` aux plugins
sauf si vous activez explicitement cette option :

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Vous pouvez limiter cette activation à un seul compte :

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

N’activez cela que pour des plugins auxquels vous faites confiance pour recevoir le contenu
et les identifiants des messages entrants WhatsApp.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique DM">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux discussions directes :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte les numéros au format E.164 (normalisés en interne).

    Remplacement multi-comptes : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) ont priorité sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les appairages sont persistés dans le stockage d’autorisations du canal et fusionnés avec `allowFrom` configuré
    - si aucune liste d’autorisation n’est configurée, le numéro personnel lié est autorisé par défaut
    - OpenClaw n’appaire jamais automatiquement les DM sortants `fromMe` (messages que vous vous envoyez à vous-même depuis l’appareil lié)

  </Tab>

  <Tab title="Politique de groupe + listes d’autorisation">
    L’accès aux groupes comporte deux couches :

    1. **Liste d’autorisation des appartenances aux groupes** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont éligibles
       - si `groups` est présent, il agit comme une liste d’autorisation de groupes (`"*"` autorisé)

    2. **Politique d’expéditeur de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : la liste d’autorisation des expéditeurs est contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque tous les messages entrants de groupe

    Repli de la liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution se replie sur `allowFrom` lorsqu’il est disponible
    - les listes d’autorisation des expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe du tout, le repli de politique de groupe à l’exécution est `allowlist` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses dans les groupes nécessitent une mention par défaut.

    La détection de mention inclut :

    - les mentions WhatsApp explicites de l’identité du bot
    - les motifs regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - la détection implicite de réponse au bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Note de sécurité :

    - la citation/réponse satisfait uniquement le contrôle de mention ; elle n’accorde **pas** l’autorisation à l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs non autorisés restent bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de la session (pas la configuration globale). Elle est réservée au propriétaire.

  </Tab>
</Tabs>

## Comportement avec numéro personnel et auto-conversation

Lorsque le numéro personnel lié est aussi présent dans `allowFrom`, les protections d’auto-conversation WhatsApp s’activent :

- ignorer les accusés de lecture pour les tours d’auto-conversation
- ignorer le comportement de déclenchement automatique par mention-JID qui vous notifierait autrement vous-même
- si `messages.responsePrefix` n’est pas défini, les réponses d’auto-conversation utilisent par défaut `[{identity.name}]` ou `[openclaw]`

## Normalisation des messages et contexte

<AccordionGroup>
  <Accordion title="Enveloppe entrante + contexte de réponse">
    Les messages entrants WhatsApp sont encapsulés dans l’enveloppe entrante partagée.

    Si une réponse citée existe, le contexte est ajouté sous cette forme :

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Les champs de métadonnées de réponse sont également renseignés lorsqu’ils sont disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 de l’expéditeur).

  </Accordion>

  <Accordion title="Espaces réservés pour les médias et extraction des positions/contacts">
    Les messages entrants contenant uniquement des médias sont normalisés avec des espaces réservés tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les corps des positions utilisent un texte de coordonnées concis. Les libellés/commentaires de position et les détails de contact/vCard sont rendus comme des métadonnées non fiables délimitées, et non comme du texte de prompt en ligne.

  </Accordion>

  <Accordion title="Injection de l’historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est finalement déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Marqueurs d’injection :

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Accusés de lecture">
    Les accusés de lecture sont activés par défaut pour les messages entrants WhatsApp acceptés.

    Désactiver globalement :

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Remplacement par compte :

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Les tours d’auto-conversation ignorent les accusés de lecture même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, découpage et médias

<AccordionGroup>
  <Accordion title="Découpage du texte">
    - limite de découpage par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis se replie sur un découpage sûr par longueur
  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles d’image, de vidéo, d’audio (note vocale PTT) et de document
    - les charges utiles de réponse préservent `audioAsVoice` ; WhatsApp envoie les médias audio comme notes vocales PTT Baileys
    - l’audio non Ogg, y compris la sortie MP3/WebM TTS de Microsoft Edge, est transcodé en Ogg/Opus avant la livraison PTT
    - l’audio Ogg/Opus natif est envoyé avec `audio/ogg; codecs=opus` pour la compatibilité avec les notes vocales
    - la lecture GIF animée est prise en charge via `gifPlayback: true` lors des envois vidéo
    - les légendes sont appliquées au premier élément média lors de l’envoi de charges utiles de réponse multi-médias, sauf que les notes vocales PTT envoient l’audio d’abord et le texte visible séparément, car les clients WhatsApp n’affichent pas les légendes des notes vocales de manière fiable
    - la source du média peut être HTTP(S), `file://` ou des chemins locaux
  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de repli">
    - limite de sauvegarde des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - limite d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont automatiquement optimisées (redimensionnement/balayage de qualité) pour respecter les limites
    - en cas d’échec de l’envoi d’un média, le repli sur le premier élément envoie un avertissement textuel au lieu d’abandonner silencieusement la réponse
  </Accordion>
</AccordionGroup>

## Citation des réponses

WhatsApp prend en charge la citation native des réponses, où les réponses sortantes citent visiblement le message entrant. Contrôlez cela avec `channels.whatsapp.replyToMode`.

| Valeur      | Comportement                                                          |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ne jamais citer ; envoyer comme un message simple                     |
| `"first"`   | Citer uniquement le premier fragment de réponse sortante              |
| `"all"`     | Citer chaque fragment de réponse sortante                             |
| `"batched"` | Citer les réponses groupées en file d’attente tout en laissant les réponses immédiates sans citation |

La valeur par défaut est `"off"`. Les remplacements par compte utilisent `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Niveau de réaction

`channels.whatsapp.reactionLevel` contrôle l’étendue de l’utilisation des réactions emoji par l’agent sur WhatsApp :

| Niveau        | Réactions d’accusé | Réactions initiées par l’agent | Description                                           |
| ------------- | ------------------ | ------------------------------ | ----------------------------------------------------- |
| `"off"`       | Non                | Non                            | Aucune réaction                                       |
| `"ack"`       | Oui                | Non                            | Réactions d’accusé uniquement (accusé avant réponse)  |
| `"minimal"`   | Oui                | Oui (conservateur)             | Accusés + réactions de l’agent avec guidage prudent   |
| `"extensive"` | Oui                | Oui (encouragé)                | Accusés + réactions de l’agent avec guidage encouragé |

Par défaut : `"minimal"`.

Les remplacements par compte utilisent `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Réactions d’accusé

WhatsApp prend en charge les réactions d’accusé immédiates à la réception via `channels.whatsapp.ackReaction`.
Les réactions d’accusé sont contrôlées par `reactionLevel` — elles sont supprimées lorsque `reactionLevel` vaut `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Remarques sur le comportement :

- envoyées immédiatement après l’acceptation du message entrant (avant la réponse)
- les échecs sont journalisés mais ne bloquent pas la livraison normale de la réponse
- le mode groupe `mentions` réagit sur les tours déclenchés par mention ; l’activation de groupe `always` agit comme un contournement de cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Multi-comptes et identifiants

<AccordionGroup>
  <Accordion title="Sélection du compte et valeurs par défaut">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s’il est présent, sinon premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la recherche
  </Accordion>

  <Accordion title="Chemins des identifiants et compatibilité avec l’ancien format">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l’ancienne authentification par défaut dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux du compte par défaut
  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp pour ce compte.

    Dans les anciens répertoires d’authentification, `oauth.json` est conservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils de l’agent inclut l’action de réaction WhatsApp (`react`).
- Contrôles d’action :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactivez-les via `channels.whatsapp.configWrites=false`).

## Dépannage

<AccordionGroup>
  <Accordion title="Non lié (QR requis)">
    Symptôme : l’état du canal indique qu’il n’est pas lié.

    Correctif :

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Lié mais déconnecté / boucle de reconnexion">
    Symptôme : compte lié avec déconnexions répétées ou tentatives de reconnexion.

    Correctif :

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si nécessaire, reliez avec `channels login`.

  </Accordion>

  <Accordion title="Aucun écouteur actif lors de l’envoi">
    Les envois sortants échouent immédiatement lorsqu’aucun écouteur Gateway actif n’existe pour le compte cible.

    Assurez-vous que la Gateway fonctionne et que le compte est lié.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de manière inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de la liste d’autorisation `groups`
    - contrôle par mention (`requireMention` + motifs de mention)
    - clés dupliquées dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, conservez donc un seul `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d’exécution Bun">
    L’exécution de la Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible pour un fonctionnement stable de la Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge des prompts système de type Telegram pour les groupes et les discussions directes via les maps `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La map `groups` effective est déterminée en premier : si le compte définit sa propre map `groups`, elle remplace entièrement la map `groups` racine (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur cette map unique résultante :

1. **Prompt système spécifique au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le joker est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système joker de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique est totalement absente de la map, ou lorsqu’elle existe mais ne définit pas de clé `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La map `direct` effective est déterminée en premier : si le compte définit sa propre map `direct`, elle remplace entièrement la map `direct` racine (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur cette map unique résultante :

1. **Prompt système spécifique au message direct** (`direct["<peerId>"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le joker est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système joker pour message direct** (`direct["*"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique est totalement absente de la map, ou lorsqu’elle existe mais ne définit pas de clé `systemPrompt`.

Remarque : `dms` reste le compartiment léger de remplacement d’historique par DM (`dms.<id>.historyLimit`) ; les remplacements de prompt se trouvent sous `direct`.

**Différence par rapport au comportement multi-comptes de Telegram :** Dans Telegram, `groups` racine est volontairement supprimé pour tous les comptes dans une configuration multi-comptes — même pour les comptes qui ne définissent pas leurs propres `groups` — afin d’empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : `groups` racine et `direct` racine sont toujours hérités par les comptes qui ne définissent aucun remplacement au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-comptes, si vous souhaitez des prompts de groupe ou directs par compte, définissez explicitement la map complète sous chaque compte au lieu de vous appuyer sur les valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une map de configuration par groupe et la liste d’autorisation de groupes au niveau du chat. À la racine comme au niveau du compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- N’ajoutez un `systemPrompt` de groupe joker que si vous voulez déjà que cette portée admette tous les groupes. Si vous voulez toujours que seul un ensemble fixe d’identifiants de groupe soit éligible, n’utilisez pas `groups["*"]` comme prompt par défaut. Répétez plutôt le prompt sur chaque entrée de groupe explicitement autorisée.
- L’admission au groupe et l’autorisation de l’expéditeur sont deux vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes pouvant atteindre le traitement de groupe, mais n’autorise pas à lui seul tous les expéditeurs de ces groupes. L’accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet de bord pour les DM. `direct["*"]` fournit uniquement une configuration de discussion directe par défaut après qu’un DM a déjà été admis par `dmPolicy` plus `allowFrom` ou les règles du stockage d’appairage.

Exemple :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // À utiliser uniquement si tous les groupes doivent être admis à la portée racine.
        // S’applique à tous les comptes qui ne définissent pas leur propre map groups.
        "*": { systemPrompt: "Prompt par défaut pour tous les groupes." },
      },
      direct: {
        // S’applique à tous les comptes qui ne définissent pas leur propre map direct.
        "*": { systemPrompt: "Prompt par défaut pour toutes les discussions directes." },
      },
      accounts: {
        work: {
          groups: {
            // Ce compte définit ses propres groups, donc les groups racine sont entièrement
            // remplacés. Pour conserver un joker, définissez explicitement "*" ici aussi.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentrez-vous sur la gestion de projet.",
            },
            // À utiliser uniquement si tous les groupes doivent être admis dans ce compte.
            "*": { systemPrompt: "Prompt par défaut pour les groupes professionnels." },
          },
          direct: {
            // Ce compte définit sa propre map direct, donc les entrées direct racine sont
            // entièrement remplacées. Pour conserver un joker, définissez explicitement "*" ici aussi.
            "+15551234567": { systemPrompt: "Prompt pour une discussion directe professionnelle spécifique." },
            "*": { systemPrompt: "Prompt par défaut pour les discussions directes professionnelles." },
          },
        },
      },
    },
  },
}
```

## Indications vers la référence de configuration

Référence principale :

- [Référence de configuration - WhatsApp](/fr/gateway/config-channels#whatsapp)

Champs WhatsApp à fort signal :

- accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-comptes : `accounts.<id>.enabled`, `accounts.<id>.authDir`, remplacements au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Voir aussi

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
