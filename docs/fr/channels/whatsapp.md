---
read_when:
    - Travailler sur le comportement du Web/canal WhatsApp ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T07:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

Statut : prêt pour la production via WhatsApp Web (Baileys). Gateway gère la ou les sessions liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le Plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose également le flux d’installation lorsque
  le Plugin n’est pas encore présent.
- Canal de développement + extraction git : utilise par défaut le chemin local du Plugin.
- Stable/Beta : utilise par défaut le package npm `@openclaw/whatsapp`.

L’installation manuelle reste possible :

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique de message privé par défaut est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration de canal.
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

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour attacher un répertoire d’authentification WhatsApp Web existant/personnalisé avant la connexion :

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Démarrer le Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approuver la première demande d’appairage (si vous utilisez le mode d’appairage)">

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
    Il s’agit du mode opérationnel le plus propre :

    - identité WhatsApp distincte pour OpenClaw
    - limites de routage et listes d’autorisation des messages privés plus claires
    - risque plus faible de confusion avec les discussions avec soi-même

    Modèle minimal de politique :

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

  <Accordion title="Solution de secours avec numéro personnel">
    L’onboarding prend en charge le mode numéro personnel et écrit une base adaptée aux discussions avec soi-même :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    À l’exécution, les protections de discussion avec soi-même dépendent du numéro personnel lié et de `allowFrom`.

  </Accordion>

  <Accordion title="Portée du canal WhatsApp Web uniquement">
    Le canal de plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie WhatsApp Twilio distinct dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- Gateway gère le socket WhatsApp et la boucle de reconnexion.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les discussions de statut et de diffusion sont ignorées (`@status`, `@broadcast`).
- Les discussions directes utilisent les règles de session de message privé (`session.dmScope` ; la valeur par défaut `main` regroupe les messages privés dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Le transport WhatsApp Web respecte les variables d’environnement proxy standard sur l’hôte Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez la configuration proxy au niveau de l’hôte aux paramètres proxy WhatsApp spécifiques au canal.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux discussions directes :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte des numéros au format E.164 (normalisés en interne).

    Remplacement multi-comptes : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) sont prioritaires sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les appairages sont conservés dans le magasin d’autorisation du canal et fusionnés avec le `allowFrom` configuré
    - si aucune liste d’autorisation n’est configurée, le numéro personnel lié est autorisé par défaut
    - OpenClaw n’appaire jamais automatiquement les messages privés sortants `fromMe` (messages que vous vous envoyez depuis l’appareil lié)

  </Tab>

  <Tab title="Politique de groupe + listes d’autorisation">
    L’accès de groupe comporte deux couches :

    1. **Liste d’autorisation des appartenances de groupe** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont admissibles
       - si `groups` est présent, il agit comme une liste d’autorisation de groupe (`"*"` autorisé)

    2. **Politique des expéditeurs de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : la liste d’autorisation des expéditeurs est contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque tout le trafic entrant de groupe

    Repli de la liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution revient à `allowFrom` lorsque disponible
    - les listes d’autorisation des expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe, le repli de politique de groupe à l’exécution est `allowlist` (avec un journal d’avertissement), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe exigent une mention par défaut.

    La détection de mention inclut :

    - les mentions WhatsApp explicites de l’identité du bot
    - les motifs regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - la détection implicite de réponse-au-bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Remarque de sécurité :

    - le quote/reply satisfait uniquement le filtrage par mention ; il n’accorde **pas** l’autorisation à l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs non autorisés sont toujours bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de la session (pas la configuration globale). Elle est réservée au propriétaire.

  </Tab>
</Tabs>

## Comportement avec numéro personnel et discussion avec soi-même

Lorsque le numéro personnel lié est également présent dans `allowFrom`, les protections de discussion avec soi-même sur WhatsApp s’activent :

- ignorer les accusés de lecture pour les tours de discussion avec soi-même
- ignorer le comportement de déclenchement automatique par mention-JID qui, sinon, vous notifierait vous-même
- si `messages.responsePrefix` n’est pas défini, les réponses de discussion avec soi-même utilisent par défaut `[{identity.name}]` ou `[openclaw]`

## Normalisation des messages et contexte

<AccordionGroup>
  <Accordion title="Enveloppe entrante + contexte de réponse">
    Les messages WhatsApp entrants sont encapsulés dans l’enveloppe entrante partagée.

    Si une réponse citée existe, le contexte est ajouté sous cette forme :

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Les champs de métadonnées de réponse sont également renseignés lorsqu’ils sont disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 de l’expéditeur).

  </Accordion>

  <Accordion title="Espaces réservés de média et extraction de position/contact">
    Les messages entrants composés uniquement de médias sont normalisés avec des espaces réservés tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les corps de position utilisent un texte de coordonnées concis. Les libellés/commentaires de position et les détails de contact/vCard sont rendus comme métadonnées non fiables délimitées, et non comme texte de prompt en ligne.

  </Accordion>

  <Accordion title="Injection de l’historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est finalement déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Marqueurs d’injection :

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Accusés de lecture">
    Les accusés de lecture sont activés par défaut pour les messages WhatsApp entrants acceptés.

    Désactiver globalement :

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Remplacement par compte :

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

    Les tours de discussion avec soi-même ignorent les accusés de lecture même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, segmentation et médias

<AccordionGroup>
  <Accordion title="Segmentation du texte">
    - limite de segment par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis revient à une segmentation sûre par longueur
  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles image, vidéo, audio (note vocale PTT) et document
    - `audio/ogg` est réécrit en `audio/ogg; codecs=opus` pour la compatibilité avec les notes vocales
    - la lecture des GIF animés est prise en charge via `gifPlayback: true` lors des envois vidéo
    - les légendes sont appliquées au premier élément média lors de l’envoi de charges utiles de réponse multi-médias
    - la source média peut être HTTP(S), `file://` ou des chemins locaux
  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de secours">
    - limite d’enregistrement des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - limite d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont automatiquement optimisées (redimensionnement/balayage de qualité) pour respecter les limites
    - en cas d’échec d’envoi de média, le secours du premier élément envoie un avertissement texte au lieu de supprimer silencieusement la réponse
  </Accordion>
</AccordionGroup>

## Citation des réponses

WhatsApp prend en charge la citation native des réponses, où les réponses sortantes citent visiblement le message entrant. Contrôlez ce comportement avec `channels.whatsapp.replyToMode`.

| Valeur   | Comportement                                                                        |
| -------- | ----------------------------------------------------------------------------------- |
| `"auto"` | Cite le message entrant lorsque le fournisseur le prend en charge ; sinon ignore la citation |
| `"on"`   | Cite toujours le message entrant ; revient à un envoi simple si la citation est rejetée |
| `"off"`  | Ne cite jamais ; envoie comme message simple                                        |

La valeur par défaut est `"auto"`. Les remplacements par compte utilisent `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Niveau de réaction

`channels.whatsapp.reactionLevel` contrôle l’étendue de l’usage des réactions emoji par l’agent sur WhatsApp :

| Niveau        | Réactions d’accusé | Réactions initiées par l’agent | Description                                      |
| ------------- | ------------------ | ------------------------------ | ------------------------------------------------ |
| `"off"`       | Non                | Non                            | Aucune réaction                                  |
| `"ack"`       | Oui                | Non                            | Réactions d’accusé uniquement (réception avant réponse) |
| `"minimal"`   | Oui                | Oui (prudentes)                | Accusé + réactions d’agent avec directives prudentes |
| `"extensive"` | Oui                | Oui (encouragées)              | Accusé + réactions d’agent avec directives encouragées |

Par défaut : `"minimal"`.

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

## Réactions d’accusé de réception

WhatsApp prend en charge les réactions d’accusé immédiates à la réception entrante via `channels.whatsapp.ackReaction`.
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

Remarques sur le comportement :

- envoyées immédiatement après l’acceptation de l’entrée (avant la réponse)
- les échecs sont consignés, mais ne bloquent pas la livraison normale des réponses
- le mode de groupe `mentions` réagit aux tours déclenchés par mention ; l’activation de groupe `always` agit comme contournement pour cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Multi-comptes et identifiants

<AccordionGroup>
  <Accordion title="Sélection du compte et valeurs par défaut">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s’il est présent, sinon premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la recherche
  </Accordion>

  <Accordion title="Chemins des identifiants et compatibilité héritée">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l’authentification par défaut héritée dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux du compte par défaut
  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp pour ce compte.

    Dans les répertoires d’authentification hérités, `oauth.json` est conservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils d’agent inclut l’action de réaction WhatsApp (`react`).
- Contrôles des actions :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactivez via `channels.whatsapp.configWrites=false`).

## Dépannage

<AccordionGroup>
  <Accordion title="Non lié (QR requis)">
    Symptôme : l’état du canal signale qu’il n’est pas lié.

    Correction :

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Lié mais déconnecté / boucle de reconnexion">
    Symptôme : compte lié avec déconnexions répétées ou tentatives de reconnexion.

    Correction :

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si nécessaire, reliez de nouveau avec `channels login`.

  </Accordion>

  <Accordion title="Aucun écouteur actif lors de l’envoi">
    Les envois sortants échouent immédiatement lorsqu’aucun écouteur Gateway actif n’existe pour le compte cible.

    Assurez-vous que Gateway est en cours d’exécution et que le compte est lié.

  </Accordion>

  <Accordion title="Les messages de groupe sont ignorés de façon inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - les entrées de liste d’autorisation `groups`
    - le filtrage par mention (`requireMention` + motifs de mention)
    - les clés en double dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, gardez donc une seule valeur `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d’exécution Bun">
    L’exécution Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible pour un fonctionnement stable de Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge des prompts système de style Telegram pour les groupes et les discussions directes via les maps `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La map `groups` effective est déterminée en premier : si le compte définit sa propre map `groups`, elle remplace entièrement la map `groups` racine (pas de fusion profonde). La recherche du prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système spécifique au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé si l’entrée du groupe spécifique définit un `systemPrompt`.
2. **Prompt système joker de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique est absente ou ne définit pas de `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La map `direct` effective est déterminée en premier : si le compte définit sa propre map `direct`, elle remplace entièrement la map `direct` racine (pas de fusion profonde). La recherche du prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système spécifique au direct** (`direct["<peerId>"].systemPrompt`) : utilisé si l’entrée du pair spécifique définit un `systemPrompt`.
2. **Prompt système joker de direct** (`direct["*"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique est absente ou ne définit pas de `systemPrompt`.

Remarque : `dms` reste le compartiment léger de remplacement d’historique par message privé (`dms.<id>.historyLimit`) ; les remplacements de prompt vivent sous `direct`.

**Différence avec le comportement multi-comptes de Telegram :** dans Telegram, `groups` à la racine est volontairement supprimé pour tous les comptes dans une configuration multi-comptes — même les comptes qui ne définissent pas leurs propres `groups` — afin d’empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : `groups` et `direct` à la racine sont toujours hérités par les comptes qui ne définissent pas de remplacement au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-comptes, si vous voulez des prompts de groupe ou directs par compte, définissez la map complète sous chaque compte explicitement au lieu de vous appuyer sur les valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une map de configuration par groupe et la liste d’autorisation de groupe au niveau du chat. À la racine comme à la portée du compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- Ajoutez un `systemPrompt` de groupe joker uniquement si vous voulez déjà que cette portée admette tous les groupes. Si vous souhaitez toujours qu’un ensemble fixe d’identifiants de groupe seulement soit admissible, n’utilisez pas `groups["*"]` comme valeur par défaut du prompt. Répétez plutôt le prompt sur chaque entrée de groupe explicitement autorisée.
- L’admission dans un groupe et l’autorisation de l’expéditeur sont des vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes pouvant atteindre la gestion de groupe, mais n’autorise pas à lui seul tous les expéditeurs de ces groupes. L’accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet secondaire pour les messages privés. `direct["*"]` fournit seulement une configuration par défaut de discussion directe une fois qu’un message privé a déjà été admis par `dmPolicy` plus `allowFrom` ou les règles du magasin d’appairage.

Exemple :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Pointeurs de référence de configuration

Référence principale :

- [Référence de configuration - WhatsApp](/fr/gateway/config-channels#whatsapp)

Champs WhatsApp à fort signal :

- accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-comptes : `accounts.<id>.enabled`, `accounts.<id>.authDir`, remplacements au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Voir aussi

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agents](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
