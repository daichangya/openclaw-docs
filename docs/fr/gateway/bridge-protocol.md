---
read_when:
    - Création ou débogage de clients de nœud (iOS/Android/macOS mode nœud)
    - Enquêter sur des échecs d’appairage ou d’authentification du pont
    - Auditer la surface de nœud exposée par le gateway
summary: 'Protocole de pont historique (nœuds hérités) : TCP JSONL, appairage, RPC limité au périmètre'
title: Protocole de pont
x-i18n:
    generated_at: "2026-04-24T07:09:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protocole de pont (transport de nœud hérité)

<Warning>
Le pont TCP a été **supprimé**. Les versions actuelles d’OpenClaw ne fournissent plus l’écouteur de pont et les clés de configuration `bridge.*` ne font plus partie du schéma. Cette page est conservée uniquement comme référence historique. Utilisez le [Protocole Gateway](/fr/gateway/protocol) pour tous les clients de nœud/opérateur.
</Warning>

## Pourquoi il existait

- **Limite de sécurité** : le pont expose une petite liste d’autorisation au lieu de la
  surface API complète du gateway.
- **Appairage + identité du nœud** : l’admission des nœuds appartient au gateway et est liée
  à un jeton par nœud.
- **Expérience de découverte** : les nœuds peuvent découvrir des gateways via Bonjour sur le LAN, ou se connecter
  directement sur un tailnet.
- **WS loopback** : tout le plan de contrôle WS reste local sauf s’il est tunnelisé via SSH.

## Transport

- TCP, un objet JSON par ligne (JSONL).
- TLS facultatif (lorsque `bridge.tls.enabled` vaut true).
- Le port historique d’écoute par défaut était `18790` (les versions actuelles ne démarrent plus de
  pont TCP).

Lorsque TLS est activé, les enregistrements TXT de découverte incluent `bridgeTls=1` ainsi que
`bridgeTlsSha256` comme indication non secrète. Notez que les enregistrements TXT Bonjour/mDNS ne sont pas
authentifiés ; les clients ne doivent pas traiter l’empreinte annoncée comme une épingle autoritaire sans intention explicite de l’utilisateur ou autre vérification hors bande.

## Poignée de main + appairage

1. Le client envoie `hello` avec les métadonnées du nœud + le jeton (s’il est déjà appairé).
2. S’il n’est pas appairé, le gateway répond avec `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Le client envoie `pair-request`.
4. Le gateway attend l’approbation, puis envoie `pair-ok` et `hello-ok`.

Historiquement, `hello-ok` renvoyait `serverName` et pouvait inclure
`canvasHostUrl`.

## Trames

Client → Gateway :

- `req` / `res` : RPC gateway limitée au périmètre (chat, sessions, config, health, voicewake, skills.bins)
- `event` : signaux du nœud (transcription vocale, requête d’agent, abonnement au chat, cycle de vie exec)

Gateway → Client :

- `invoke` / `invoke-res` : commandes de nœud (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event` : mises à jour de chat pour les sessions abonnées
- `ping` / `pong` : keepalive

L’application historique de la liste d’autorisation vivait dans `src/gateway/server-bridge.ts` (supprimé).

## Événements du cycle de vie exec

Les nœuds peuvent émettre des événements `exec.finished` ou `exec.denied` pour exposer l’activité de system.run.
Ils sont mappés à des événements système dans le gateway. (Les nœuds hérités peuvent encore émettre `exec.started`.)

Champs de charge utile (tous facultatifs sauf indication contraire) :

- `sessionKey` (requis) : session d’agent qui doit recevoir l’événement système.
- `runId` : ID exec unique pour le regroupement.
- `command` : chaîne de commande brute ou formatée.
- `exitCode`, `timedOut`, `success`, `output` : détails d’achèvement (finished uniquement).
- `reason` : motif du refus (denied uniquement).

## Utilisation historique du tailnet

- Lier le pont à une IP tailnet : `bridge.bind: "tailnet"` dans
  `~/.openclaw/openclaw.json` (historique uniquement ; `bridge.*` n’est plus valide).
- Les clients se connectent via le nom MagicDNS ou l’IP tailnet.
- Bonjour ne traverse **pas** les réseaux ; utilisez un hôte/port manuel ou DNS‑SD étendu
  si nécessaire.

## Gestion des versions

Le pont était une **v1 implicite** (sans négociation min/max). Cette section est une
référence historique uniquement ; les clients actuels de nœud/opérateur utilisent le WebSocket
[Protocole Gateway](/fr/gateway/protocol).

## Associé

- [Protocole Gateway](/fr/gateway/protocol)
- [Nœuds](/fr/nodes)
