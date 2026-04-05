---
read_when:
    - Travail sur le comportement du canal WhatsApp/web ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T12:37:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canal Web)

Statut : prêt pour la production via WhatsApp Web (Baileys). La Gateway possède la ou les sessions liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose également le flux d’installation lorsque
  le plugin n’est pas encore présent.
- Canal de dev + extraction git : utilise par défaut le chemin du plugin local.
- Stable/Beta : utilise par défaut le package npm `@openclaw/whatsapp`.

L’installation manuelle reste disponible :

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/channels/pairing">
    La politique DM par défaut est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage du canal" icon="wrench" href="/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration de la Gateway" icon="settings" href="/gateway/configuration">
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

    Pour un compte spécifique :

```bash
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
OpenClaw recommande d’exécuter WhatsApp sur un numéro distinct lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont également prises en charge.)
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    Il s’agit du mode opérationnel le plus propre :

    - identité WhatsApp distincte pour OpenClaw
    - limites de routage et listes d’autorisation DM plus claires
    - risque plus faible de confusion avec l’auto-discussion

    Modèle de politique minimale :

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
    L’onboarding prend en charge le mode numéro personnel et écrit une base adaptée à l’auto-discussion :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    À l’exécution, les protections d’auto-discussion dépendent du numéro lié à soi-même et de `allowFrom`.

  </Accordion>

  <Accordion title="Portée du canal WhatsApp Web uniquement">
    Le canal de plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie WhatsApp Twilio distinct dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- La Gateway possède le socket WhatsApp et la boucle de reconnexion.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les discussions de statut et de diffusion sont ignorées (`@status`, `@broadcast`).
- Les discussions directes utilisent les règles de session DM (`session.dmScope` ; par défaut `main` regroupe les DM dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique DM">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux discussions directes :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte des numéros au format E.164 (normalisés en interne).

    Remplacement multi-comptes : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) ont priorité sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les appairages sont persistés dans le magasin d’autorisations du canal et fusionnés avec `allowFrom` configuré
    - si aucune liste d’autorisation n’est configurée, le numéro lié à soi-même est autorisé par défaut
    - les DM sortants `fromMe` ne sont jamais appairés automatiquement

  </Tab>

  <Tab title="Politique de groupe + listes d’autorisation">
    L’accès aux groupes comporte deux couches :

    1. **Liste d’autorisation d’appartenance aux groupes** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont éligibles
       - si `groups` est présent, il agit comme une liste d’autorisation de groupes (`"*"` autorisé)

    2. **Politique d’expéditeur de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : la liste d’autorisation des expéditeurs est contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque toutes les entrées de groupe

    Solution de repli pour la liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution revient à `allowFrom` lorsqu’il est disponible
    - les listes d’autorisation des expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe, la solution de repli de politique de groupe à l’exécution est `allowlist` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe nécessitent une mention par défaut.

    La détection de mention inclut :

    - mentions WhatsApp explicites de l’identité du bot
    - motifs regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, solution de repli `messages.groupChat.mentionPatterns`)
    - détection implicite de réponse-au-bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Remarque de sécurité :

    - la citation/réponse satisfait uniquement le filtrage par mention ; elle **n’accorde pas** l’autorisation à l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs non autorisés restent bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de la session (pas la configuration globale). Elle est protégée par propriétaire.

  </Tab>
</Tabs>

## Comportement avec numéro personnel et auto-discussion

Lorsque le numéro lié à soi-même est également présent dans `allowFrom`, les protections d’auto-discussion WhatsApp s’activent :

- ignorer les accusés de lecture pour les tours d’auto-discussion
- ignorer le comportement de déclenchement automatique par mention-JID qui vous notifierait autrement vous-même
- si `messages.responsePrefix` n’est pas défini, les réponses d’auto-discussion utilisent par défaut `[{identity.name}]` ou `[openclaw]`

## Normalisation des messages et contexte

<AccordionGroup>
  <Accordion title="Enveloppe entrante + contexte de réponse">
    Les messages WhatsApp entrants sont encapsulés dans l’enveloppe entrante partagée.

    Si une réponse citée existe, le contexte est ajouté sous cette forme :

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Les champs de métadonnées de réponse sont également renseignés lorsqu’ils sont disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, expéditeur JID/E.164).

  </Accordion>

  <Accordion title="Espaces réservés média et extraction des lieux/contacts">
    Les messages entrants composés uniquement de média sont normalisés avec des espaces réservés tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les charges utiles de lieu et de contact sont normalisées en contexte textuel avant le routage.

  </Accordion>

  <Accordion title="Injection d’historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est finalement déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`
    - solution de repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Marqueurs d’injection :

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Accusés de lecture">
    Les accusés de lecture sont activés par défaut pour les messages WhatsApp entrants acceptés.

    Désactivation globale :

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

    Les tours d’auto-discussion ignorent les accusés de lecture même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, segmentation et médias

<AccordionGroup>
  <Accordion title="Segmentation du texte">
    - limite de segment par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis revient à une segmentation sûre par longueur
  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles image, vidéo, audio (note vocale PTT) et document
    - `audio/ogg` est réécrit en `audio/ogg; codecs=opus` pour la compatibilité des notes vocales
    - la lecture GIF animée est prise en charge via `gifPlayback: true` lors des envois vidéo
    - les légendes sont appliquées au premier élément média lors de l’envoi de charges utiles de réponse multimédia
    - la source média peut être HTTP(S), `file://` ou des chemins locaux
  </Accordion>

  <Accordion title="Limites de taille média et comportement de repli">
    - limite de sauvegarde des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - limite d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont automatiquement optimisées (redimensionnement/balayage qualité) pour respecter les limites
    - en cas d’échec d’envoi média, le repli du premier élément envoie un avertissement texte au lieu d’ignorer silencieusement la réponse
  </Accordion>
</AccordionGroup>

## Niveau de réaction

`channels.whatsapp.reactionLevel` contrôle l’ampleur de l’utilisation des réactions emoji par l’agent sur WhatsApp :

| Niveau        | Réactions d’accusé | Réactions initiées par l’agent | Description                                      |
| ------------- | ------------------ | ------------------------------ | ------------------------------------------------ |
| `"off"`       | Non                | Non                            | Aucune réaction                                  |
| `"ack"`       | Oui                | Non                            | Réactions d’accusé uniquement (accusé pré-réponse) |
| `"minimal"`   | Oui                | Oui (conservateur)             | Accusé + réactions agent avec recommandations conservatrices |
| `"extensive"` | Oui                | Oui (encouragé)                | Accusé + réactions agent avec recommandations encouragées |

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

Remarques sur le comportement :

- envoyées immédiatement après l’acceptation de l’entrée (avant réponse)
- les échecs sont journalisés mais ne bloquent pas la livraison normale de la réponse
- le mode de groupe `mentions` réagit lors des tours déclenchés par mention ; l’activation de groupe `always` agit comme contournement de cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Multi-comptes et identifiants

<AccordionGroup>
  <Accordion title="Sélection du compte et valeurs par défaut">
    - les ID de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s’il est présent, sinon le premier ID de compte configuré (trié)
    - les ID de compte sont normalisés en interne pour la recherche
  </Accordion>

  <Accordion title="Chemins des identifiants et compatibilité héritée">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l’ancienne authentification par défaut dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux de compte par défaut
  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp pour ce compte.

    Dans les anciens répertoires d’authentification, `oauth.json` est conservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils d’agent inclut l’action de réaction WhatsApp (`react`).
- Barrières d’action :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées depuis le canal sont activées par défaut (désactivation via `channels.whatsapp.configWrites=false`).

## Dépannage

<AccordionGroup>
  <Accordion title="Non lié (QR requis)">
    Symptôme : le statut du canal indique qu’il n’est pas lié.

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
    Les envois sortants échouent rapidement lorsqu’aucun écouteur Gateway actif n’existe pour le compte cible.

    Assurez-vous que la Gateway est en cours d’exécution et que le compte est lié.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de manière inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de liste d’autorisation `groups`
    - filtrage par mention (`requireMention` + motifs de mention)
    - clés dupliquées dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, donc gardez un seul `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d’exécution Bun">
    L’exécution Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible avec un fonctionnement stable de la Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Pointeurs de référence de configuration

Référence principale :

- [Référence de configuration - WhatsApp](/gateway/configuration-reference#whatsapp)

Champs WhatsApp à fort signal :

- accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-comptes : `accounts.<id>.enabled`, `accounts.<id>.authDir`, remplacements au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Lié

- [Appairage](/channels/pairing)
- [Groupes](/channels/groups)
- [Sécurité](/gateway/security)
- [Routage des canaux](/channels/channel-routing)
- [Routage multi-agent](/concepts/multi-agent)
- [Dépannage](/channels/troubleshooting)
