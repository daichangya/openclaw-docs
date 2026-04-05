---
read_when:
    - Débogage des problèmes de découverte Bonjour sur macOS/iOS
    - Modification des types de service mDNS, des enregistrements TXT ou de l’UX de découverte
summary: Découverte Bonjour/mDNS + débogage (balises de passerelle, clients et modes de défaillance courants)
title: Découverte Bonjour
x-i18n:
    generated_at: "2026-04-05T12:41:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Découverte Bonjour / mDNS

OpenClaw utilise Bonjour (mDNS / DNS-SD) pour découvrir une passerelle active (point de terminaison WebSocket).
La navigation multicast `local.` est une **commodité limitée au LAN**. Pour la découverte inter-réseaux, la
même balise peut aussi être publiée via un domaine DNS-SD étendu configuré. La découverte reste
en meilleur effort et **ne remplace pas** la connectivité via SSH ou Tailnet.

## Bonjour étendu (DNS-SD unicast) sur Tailscale

Si le nœud et la passerelle se trouvent sur des réseaux différents, mDNS multicast ne traversera pas
cette frontière. Vous pouvez conserver la même UX de découverte en passant à **DNS-SD unicast**
("Bonjour étendu") via Tailscale.

Étapes générales :

1. Exécutez un serveur DNS sur l’hôte de la passerelle (accessible via Tailnet).
2. Publiez des enregistrements DNS-SD pour `_openclaw-gw._tcp` sous une zone dédiée
   (exemple : `openclaw.internal.`).
3. Configurez le **split DNS** Tailscale afin que votre domaine choisi soit résolu via ce
   serveur DNS pour les clients (y compris iOS).

OpenClaw prend en charge n’importe quel domaine de découverte ; `openclaw.internal.` n’est qu’un exemple.
Les nœuds iOS/Android parcourent à la fois `local.` et votre domaine étendu configuré.

### Configuration de la passerelle (recommandée)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Configuration initiale unique du serveur DNS (hôte de la passerelle)

```bash
openclaw dns setup --apply
```

Cela installe CoreDNS et le configure pour :

- écouter sur le port 53 uniquement sur les interfaces Tailscale de la passerelle
- servir votre domaine choisi (exemple : `openclaw.internal.`) à partir de `~/.openclaw/dns/<domain>.db`

Validez depuis une machine connectée au tailnet :

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Paramètres DNS Tailscale

Dans la console d’administration Tailscale :

- Ajoutez un serveur de noms pointant vers l’IP tailnet de la passerelle (UDP/TCP 53).
- Ajoutez un split DNS afin que votre domaine de découverte utilise ce serveur de noms.

Une fois que les clients acceptent le DNS tailnet, les nœuds iOS et la découverte CLI peuvent parcourir
`_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité de l’écoute de la passerelle (recommandée)

Le port WS de la passerelle (par défaut `18789`) est lié à loopback par défaut. Pour un accès LAN/tailnet,
liez-le explicitement et conservez l’authentification activée.

Pour les configurations tailnet uniquement :

- Définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json`.
- Redémarrez la passerelle (ou redémarrez l’application macOS de la barre de menus).

## Ce qui publie

Seule la passerelle publie `_openclaw-gw._tcp`.

## Types de service

- `_openclaw-gw._tcp` — balise de transport de passerelle (utilisée par les nœuds macOS/iOS/Android).

## Clés TXT (indices non secrets)

La passerelle publie de petits indices non secrets pour faciliter les flux d’interface :

- `role=gateway`
- `displayName=<nom convivial>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (WS + HTTP de la passerelle)
- `gatewayTls=1` (uniquement lorsque TLS est activé)
- `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
- `canvasPort=<port>` (uniquement lorsque le canvas host est activé ; actuellement identique à `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (indice facultatif lorsque Tailnet est disponible)
- `sshPort=<port>` (mode mDNS complet uniquement ; le DNS-SD étendu peut l’omettre)
- `cliPath=<path>` (mode mDNS complet uniquement ; le DNS-SD étendu l’écrit toujours comme indice d’installation distante)

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients ne doivent pas traiter TXT comme un routage faisant autorité.
- Les clients doivent router en utilisant le point de terminaison de service résolu (SRV + A/AAAA). Traitez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` uniquement comme des indices.
- Le ciblage automatique SSH doit également utiliser l’hôte de service résolu, pas uniquement les indices TXT.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` publié de remplacer une empreinte précédemment stockée.
- Les nœuds iOS/Android doivent traiter les connexions directes basées sur la découverte comme **TLS uniquement** et exiger une confirmation explicite de l’utilisateur avant de faire confiance à une empreinte vue pour la première fois.

## Débogage sur macOS

Outils intégrés utiles :

- Parcourir les instances :

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Résoudre une instance (remplacez `<instance>`) :

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Si la navigation fonctionne mais que la résolution échoue, vous rencontrez généralement un problème de politique LAN ou
de résolveur mDNS.

## Débogage dans les journaux de la passerelle

La passerelle écrit un fichier journal tournant (affiché au démarrage sous la forme
`gateway log file: ...`). Recherchez les lignes `bonjour:`, notamment :

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Débogage sur le nœud iOS

Le nœud iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour capturer les journaux :

- Réglages → Passerelle → Avancé → **Journaux de débogage de découverte**
- Réglages → Passerelle → Avancé → **Journaux de découverte** → reproduire → **Copier**

Le journal inclut les transitions d’état du navigateur et les changements d’ensemble de résultats.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez Tailnet ou SSH.
- **Multicast bloqué** : certains réseaux Wi‑Fi désactivent mDNS.
- **Veille / changements d’interface** : macOS peut temporairement perdre les résultats mDNS ; réessayez.
- **La navigation fonctionne mais la résolution échoue** : gardez des noms de machine simples (évitez les emojis ou
  la ponctuation), puis redémarrez la passerelle. Le nom d’instance de service est dérivé du
  nom d’hôte, donc des noms trop complexes peuvent perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS-SD échappe souvent des octets dans les noms d’instance de service sous la forme de séquences décimales `\DDD`
(par ex. les espaces deviennent `\032`).

- C’est normal au niveau du protocole.
- Les interfaces doivent décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Désactivation / configuration

- `OPENCLAW_DISABLE_BONJOUR=1` désactive la publication (hérité : `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison de la passerelle.
- `OPENCLAW_SSH_PORT` remplace le port SSH lorsque `sshPort` est publié (hérité : `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publie un indice MagicDNS dans TXT (hérité : `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI publié (hérité : `OPENCLAW_CLI_PATH`).

## Documentation associée

- Politique de découverte et sélection du transport : [Discovery](/gateway/discovery)
- Pairage + approbations des nœuds : [Pairage de la passerelle](/gateway/pairing)
