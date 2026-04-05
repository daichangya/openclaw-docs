---
read_when:
    - Créer ou déboguer des clients de nœud (mode node iOS/Android/macOS)
    - Étudier les échecs de pairing ou d’authentification bridge
    - Auditer la surface de nœud exposée par la gateway
summary: 'Protocole bridge historique (nœuds legacy) : TCP JSONL, pairing, RPC à portée limitée'
title: Protocole Bridge
x-i18n:
    generated_at: "2026-04-05T12:41:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protocole bridge (transport de nœud legacy)

<Warning>
Le bridge TCP a été **supprimé**. Les builds actuelles d’OpenClaw ne fournissent plus l’écouteur bridge et les clés de configuration `bridge.*` ne figurent plus dans le schéma. Cette page est conservée uniquement à titre de référence historique. Utilisez le [Gateway Protocol](/gateway/protocol) pour tous les clients de nœud/opérateur.
</Warning>

## Pourquoi il existait

- **Limite de sécurité** : le bridge expose une petite liste d’autorisation au lieu de la
  surface API gateway complète.
- **Pairing + identité de nœud** : l’admission des nœuds est gérée par la gateway et liée
  à un jeton par nœud.
- **UX de découverte** : les nœuds peuvent découvrir les gateways via Bonjour sur le LAN, ou se connecter
  directement sur un tailnet.
- **WS loopback** : le plan de contrôle WS complet reste local sauf s’il est tunnelé via SSH.

## Transport

- TCP, un objet JSON par ligne (JSONL).
- TLS facultatif (lorsque `bridge.tls.enabled` vaut true).
- Le port d’écoute par défaut historique était `18790` (les builds actuelles ne démarrent pas de
  bridge TCP).

Lorsque TLS est activé, les enregistrements TXT de découverte incluent `bridgeTls=1` ainsi que
`bridgeTlsSha256` comme indice non secret. Notez que les enregistrements TXT Bonjour/mDNS ne sont
pas authentifiés ; les clients ne doivent pas traiter l’empreinte annoncée comme un pin
faisant autorité sans intention explicite de l’utilisateur ou autre vérification hors bande.

## Handshake + pairing

1. Le client envoie `hello` avec les métadonnées du nœud + le jeton (s’il est déjà pairé).
2. S’il n’est pas pairé, la gateway répond avec `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Le client envoie `pair-request`.
4. La gateway attend l’approbation, puis envoie `pair-ok` et `hello-ok`.

Historiquement, `hello-ok` renvoyait `serverName` et pouvait inclure
`canvasHostUrl`.

## Frames

Client → Gateway :

- `req` / `res` : RPC gateway à portée limitée (chat, sessions, config, health, voicewake, skills.bins)
- `event` : signaux de nœud (transcription vocale, requête d’agent, abonnement au chat, cycle de vie exec)

Gateway → Client :

- `invoke` / `invoke-res` : commandes de nœud (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event` : mises à jour de chat pour les sessions abonnées
- `ping` / `pong` : keepalive

L’application historique de la liste d’autorisation se trouvait dans `src/gateway/server-bridge.ts` (supprimé).

## Événements du cycle de vie exec

Les nœuds peuvent émettre des événements `exec.finished` ou `exec.denied` pour exposer l’activité system.run.
Ils sont mappés à des événements système dans la gateway. (Les nœuds legacy peuvent encore émettre `exec.started`.)

Champs de la charge utile (tous facultatifs sauf indication contraire) :

- `sessionKey` (obligatoire) : session d’agent devant recevoir l’événement système.
- `runId` : ID exec unique pour le regroupement.
- `command` : chaîne de commande brute ou formatée.
- `exitCode`, `timedOut`, `success`, `output` : détails de fin d’exécution (finished uniquement).
- `reason` : motif du refus (denied uniquement).

## Utilisation historique du tailnet

- Lier le bridge à une IP tailnet : `bridge.bind: "tailnet"` dans
  `~/.openclaw/openclaw.json` (historique uniquement ; `bridge.*` n’est plus valide).
- Les clients se connectent via le nom MagicDNS ou l’IP tailnet.
- Bonjour ne traverse **pas** les réseaux ; utilisez un hôte/port manuel ou DNS‑SD étendu
  si nécessaire.

## Versionnement

Le bridge était un **v1 implicite** (sans négociation min/max). Cette section n’est
qu’une référence historique ; les clients actuels de nœud/opérateur utilisent le
[Gateway Protocol](/gateway/protocol).
