---
read_when:
    - Configuration du streaming discret Matrix pour Synapse ou Tuwunel auto-hébergé
    - Les utilisateurs veulent des notifications uniquement sur les blocs terminés, pas sur chaque modification d’aperçu
summary: Règles push Matrix par destinataire pour des modifications d’aperçu finalisées discrètes
title: Règles push Matrix pour des aperçus discrets
x-i18n:
    generated_at: "2026-04-24T07:00:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

Lorsque `channels.matrix.streaming` vaut `"quiet"`, OpenClaw modifie un seul événement d’aperçu sur place et marque la modification finalisée avec un indicateur de contenu personnalisé. Les clients Matrix notifient uniquement sur la modification finale si une règle push par utilisateur correspond à cet indicateur. Cette page s’adresse aux opérateurs qui auto-hébergent Matrix et souhaitent installer cette règle pour chaque compte destinataire.

Si vous voulez uniquement le comportement de notification Matrix standard, utilisez `streaming: "partial"` ou laissez le streaming désactivé. Consultez [Configuration du canal Matrix](/fr/channels/matrix#streaming-previews).

## Prérequis

- utilisateur destinataire = la personne qui doit recevoir la notification
- utilisateur bot = le compte Matrix OpenClaw qui envoie la réponse
- utilisez le jeton d’accès de l’utilisateur destinataire pour les appels API ci-dessous
- faites correspondre `sender` dans la règle push avec le MXID complet de l’utilisateur bot
- le compte destinataire doit déjà avoir des pushers fonctionnels — les règles d’aperçu discret ne fonctionnent que lorsque la livraison push Matrix normale est en bon état

## Étapes

<Steps>
  <Step title="Configurer les aperçus discrets">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Obtenir le jeton d’accès du destinataire">
    Réutilisez si possible un jeton de session client existant. Pour en générer un nouveau :

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Vérifier que des pushers existent">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si aucun pusher n’est renvoyé, corrigez la livraison push Matrix normale pour ce compte avant de continuer.

  </Step>

  <Step title="Installer la règle push d’override">
    OpenClaw marque les modifications d’aperçu finalisées contenant uniquement du texte avec `content["com.openclaw.finalized_preview"] = true`. Installez une règle qui correspond à ce marqueur ainsi qu’au MXID du bot comme expéditeur :

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Remplacez avant l’exécution :

    - `https://matrix.example.org` : l’URL de base de votre homeserver
    - `$USER_ACCESS_TOKEN` : le jeton d’accès de l’utilisateur destinataire
    - `openclaw-finalized-preview-botname` : un ID de règle unique par bot et par destinataire (modèle : `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org` : le MXID de votre bot OpenClaw, et non celui du destinataire

  </Step>

  <Step title="Vérifier">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Ensuite, testez une réponse diffusée en streaming. En mode discret, le salon affiche un brouillon d’aperçu discret et notifie une fois le bloc ou le tour terminé.

  </Step>
</Steps>

Pour supprimer la règle plus tard, envoyez `DELETE` à la même URL de règle avec le jeton du destinataire.

## Notes multi-bot

Les règles push sont indexées par `ruleId` : relancer `PUT` sur le même ID met à jour une seule règle. Pour plusieurs bots OpenClaw notifiant le même destinataire, créez une règle par bot avec une correspondance d’expéditeur distincte.

Les nouvelles règles `override` définies par l’utilisateur sont insérées avant les règles de suppression par défaut ; aucun paramètre d’ordre supplémentaire n’est donc nécessaire. La règle n’affecte que les modifications d’aperçu contenant uniquement du texte qui peuvent être finalisées sur place ; les solutions de repli média et les solutions de repli d’aperçu obsolète utilisent la livraison Matrix normale.

## Notes sur le homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Aucun changement spécial dans `homeserver.yaml` n’est requis. Si les notifications Matrix normales atteignent déjà cet utilisateur, le jeton du destinataire et l’appel `pushrules` ci-dessus constituent l’étape principale de configuration.

    Si vous exécutez Synapse derrière un proxy inverse ou des workers, assurez-vous que `/_matrix/client/.../pushrules/` atteint correctement Synapse. La livraison push est gérée par le processus principal ou par `synapse.app.pusher` / les workers pusher configurés — assurez-vous qu’ils sont en bon état.

  </Accordion>

  <Accordion title="Tuwunel">
    Même flux que pour Synapse ; aucune configuration spécifique à Tuwunel n’est nécessaire pour le marqueur d’aperçu finalisé.

    Si les notifications disparaissent pendant que l’utilisateur est actif sur un autre appareil, vérifiez si `suppress_push_when_active` est activé. Tuwunel a ajouté cette option dans la version 1.4.2 (septembre 2025) et elle peut volontairement supprimer les notifications push vers les autres appareils pendant qu’un appareil est actif.

  </Accordion>
</AccordionGroup>

## Associé

- [Configuration du canal Matrix](/fr/channels/matrix)
- [Concepts de streaming](/fr/concepts/streaming)
