---
read_when:
    - Le transport du canal indique qu’il est connecté, mais les réponses échouent
    - Vous avez besoin de vérifications spécifiques au canal avant de consulter en profondeur la documentation du fournisseur
summary: dépannage rapide au niveau des canaux avec signatures de panne et correctifs par canal
title: dépannage des canaux
x-i18n:
    generated_at: "2026-04-24T07:02:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

Utilisez cette page lorsqu’un canal se connecte mais que le comportement est incorrect.

## Échelle de commandes

Exécutez d’abord celles-ci dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Base saine :

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` ou `admin-capable`
- La sonde du canal montre que le transport est connecté et, lorsque pris en charge, `works` ou `audit ok`

## WhatsApp

### Signatures de panne WhatsApp

| Symptôme                        | Vérification la plus rapide                          | Correctif                                               |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| Connecté mais aucune réponse en DM | `openclaw pairing list whatsapp`                  | Approuvez l’expéditeur ou changez la politique DM/la liste d’autorisation. |
| Messages de groupe ignorés      | Vérifiez `requireMention` + les motifs de mention dans la config | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe. |
| Déconnexions aléatoires/boucles de reconnexion | `openclaw channels status --probe` + journaux | Reconnectez-vous et vérifiez que le répertoire d’identifiants est sain. |

Dépannage complet : [Dépannage WhatsApp](/fr/channels/whatsapp#troubleshooting)

## Telegram

### Signatures de panne Telegram

| Symptôme                            | Vérification la plus rapide                    | Correctif                                                                 |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `/start` mais aucun flux de réponse exploitable | `openclaw pairing list telegram`    | Approuvez l’association ou modifiez la politique DM.                      |
| Bot en ligne mais groupe silencieux | Vérifiez l’exigence de mention et le mode confidentialité du bot | Désactivez le mode confidentialité pour la visibilité dans le groupe ou mentionnez le bot. |
| Échecs d’envoi avec erreurs réseau  | Inspectez les journaux pour les échecs d’appel à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.               |
| Le polling se bloque ou se reconnecte lentement | `openclaw logs --follow` pour les diagnostics de polling | Mettez à jour ; si les redémarrages sont des faux positifs, ajustez `pollingStallThresholdMs`. Les blocages persistants pointent toujours vers proxy/DNS/IPv6. |
| `setMyCommands` rejeté au démarrage | Inspectez les journaux pour `BOT_COMMANDS_TOO_MUCH` | Réduisez les commandes Telegram de Plugin/Skills/personnalisées ou désactivez les menus natifs. |
| Mise à niveau effectuée et la liste d’autorisation vous bloque | `openclaw security audit` et les listes d’autorisation de config | Exécutez `openclaw doctor --fix` ou remplacez `@username` par des ID d’expéditeur numériques. |

Dépannage complet : [Dépannage Telegram](/fr/channels/telegram#troubleshooting)

## Discord

### Signatures de panne Discord

| Symptôme                        | Vérification la plus rapide          | Correctif                                                  |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Bot en ligne mais aucune réponse sur le serveur | `openclaw channels status --probe` | Autorisez le serveur/canal et vérifiez Message Content Intent. |
| Messages de groupe ignorés      | Vérifiez dans les journaux les suppressions dues au filtrage par mention | Mentionnez le bot ou définissez `requireMention: false` pour le serveur/canal. |
| Réponses DM manquantes          | `openclaw pairing list discord`      | Approuvez l’association DM ou ajustez la politique DM.     |

Dépannage complet : [Dépannage Discord](/fr/channels/discord#troubleshooting)

## Slack

### Signatures de panne Slack

| Symptôme                               | Vérification la plus rapide              | Correctif                                                                                                                                              |
| -------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket mode connecté mais aucune réponse | `openclaw channels status --probe`     | Vérifiez le jeton d’application + le jeton de bot et les scopes requis ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` dans les configurations adossées à SecretRef. |
| DM bloqués                             | `openclaw pairing list slack`            | Approuvez l’association ou assouplissez la politique DM.                                                                                               |
| Message de canal ignoré                | Vérifiez `groupPolicy` et la liste d’autorisation du canal | Autorisez le canal ou passez la politique à `open`.                                                                                                    |

Dépannage complet : [Dépannage Slack](/fr/channels/slack#troubleshooting)

## iMessage et BlueBubbles

### Signatures de panne iMessage et BlueBubbles

| Symptôme                         | Vérification la plus rapide                                      | Correctif                                             |
| -------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Aucun événement entrant          | Vérifiez l’accessibilité du webhook/serveur et les autorisations de l’application | Corrigez l’URL du webhook ou l’état du serveur BlueBubbles. |
| Peut envoyer mais ne reçoit rien sur macOS | Vérifiez les autorisations de confidentialité macOS pour l’automatisation de Messages | Réaccordez les autorisations TCC et redémarrez le processus du canal. |
| Expéditeur DM bloqué             | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Approuvez l’association ou mettez à jour la liste d’autorisation. |

Dépannage complet :

- [Dépannage iMessage](/fr/channels/imessage#troubleshooting)
- [Dépannage BlueBubbles](/fr/channels/bluebubbles#troubleshooting)

## Signal

### Signatures de panne Signal

| Symptôme                        | Vérification la plus rapide             | Correctif                                                |
| ------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| Démon joignable mais bot silencieux | `openclaw channels status --probe`   | Vérifiez l’URL/le compte du démon `signal-cli` et le mode de réception. |
| DM bloqué                       | `openclaw pairing list signal`          | Approuvez l’expéditeur ou ajustez la politique DM.       |
| Les réponses de groupe ne se déclenchent pas | Vérifiez la liste d’autorisation du groupe et les motifs de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage. |

Dépannage complet : [Dépannage Signal](/fr/channels/signal#troubleshooting)

## QQ Bot

### Signatures de panne QQ Bot

| Symptôme                        | Vérification la plus rapide                | Correctif                                                       |
| ------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| Le bot répond « gone to Mars »  | Vérifiez `appId` et `clientSecret` dans la config | Définissez les identifiants ou redémarrez la Gateway.          |
| Aucun message entrant           | `openclaw channels status --probe`         | Vérifiez les identifiants sur la QQ Open Platform.             |
| La voix n’est pas transcrite    | Vérifiez la configuration du fournisseur STT | Configurez `channels.qqbot.stt` ou `tools.media.audio`.        |
| Les messages proactifs n’arrivent pas | Vérifiez les exigences d’interaction de la plateforme QQ | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [Dépannage QQ Bot](/fr/channels/qqbot#troubleshooting)

## Matrix

### Signatures de panne Matrix

| Symptôme                            | Vérification la plus rapide             | Correctif                                                                    |
| ----------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| Connecté mais ignore les messages de salon | `openclaw channels status --probe` | Vérifiez `groupPolicy`, la liste d’autorisation des salons et le filtrage par mention. |
| Les DM ne sont pas traités          | `openclaw pairing list matrix`          | Approuvez l’expéditeur ou ajustez la politique DM.                          |
| Les salons chiffrés échouent        | `openclaw matrix verify status`         | Revérifiez l’appareil, puis vérifiez `openclaw matrix verify backup status`. |
| La restauration de sauvegarde est en attente/en panne | `openclaw matrix verify backup status` | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération. |
| Le cross-signing/bootstrap semble incorrect | `openclaw matrix verify bootstrap` | Réparez le stockage secret, le cross-signing et l’état de sauvegarde en une seule passe. |

Configuration et installation complètes : [Matrix](/fr/channels/matrix)

## Liens associés

- [Association](/fr/channels/pairing)
- [Routage des canaux](/fr/channels/channel-routing)
- [Dépannage de la Gateway](/fr/gateway/troubleshooting)
