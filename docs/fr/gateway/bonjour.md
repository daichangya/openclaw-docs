---
read_when:
    - Débogage des problèmes de découverte Bonjour sur macOS/iOS
    - Modification des types de service mDNS, des enregistrements TXT ou de l’expérience de découverte
summary: Découverte Bonjour/mDNS + débogage (balises Gateway, clients et modes de défaillance courants)
title: Découverte Bonjour
x-i18n:
    generated_at: "2026-04-24T07:09:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Découverte Bonjour / mDNS

OpenClaw utilise Bonjour (mDNS / DNS-SD) pour découvrir un Gateway actif (point de terminaison WebSocket).
La navigation multicast `local.` est une **commodité réservée au LAN**. Le plugin `bonjour`
inclus gère la publication sur le LAN et est activé par défaut. Pour la découverte inter-réseaux,
la même balise peut aussi être publiée via un domaine DNS-SD étendu configuré.
La découverte reste en mode best-effort et **ne remplace pas** la connectivité via SSH ou Tailnet.

## Bonjour étendu (DNS-SD unicast) via Tailscale

Si le Node et le gateway sont sur des réseaux différents, le mDNS multicast ne traversera pas
la frontière. Vous pouvez conserver la même expérience de découverte en passant à **DNS-SD unicast**
(« Bonjour étendu ») via Tailscale.

Étapes générales :

1. Exécuter un serveur DNS sur l’hôte du gateway (accessible via Tailnet).
2. Publier les enregistrements DNS-SD pour `_openclaw-gw._tcp` sous une zone dédiée
   (exemple : `openclaw.internal.`).
3. Configurer le **split DNS** Tailscale afin que votre domaine choisi soit résolu via ce
   serveur DNS pour les clients (y compris iOS).

OpenClaw prend en charge n’importe quel domaine de découverte ; `openclaw.internal.` n’est qu’un exemple.
Les Node iOS/Android parcourent à la fois `local.` et votre domaine étendu configuré.

### Configuration Gateway (recommandée)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet uniquement (recommandé)
  discovery: { wideArea: { enabled: true } }, // active la publication DNS-SD étendue
}
```

### Configuration initiale unique du serveur DNS (hôte gateway)

```bash
openclaw dns setup --apply
```

Cela installe CoreDNS et le configure pour :

- écouter sur le port 53 uniquement sur les interfaces Tailscale du gateway
- servir votre domaine choisi (exemple : `openclaw.internal.`) depuis `~/.openclaw/dns/<domain>.db`

Valider depuis une machine connectée au tailnet :

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Paramètres DNS Tailscale

Dans la console d’administration Tailscale :

- Ajoutez un serveur de noms pointant vers l’IP tailnet du gateway (UDP/TCP 53).
- Ajoutez un split DNS afin que votre domaine de découverte utilise ce serveur de noms.

Une fois que les clients acceptent le DNS tailnet, les Node iOS et la découverte CLI peuvent parcourir
`_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité de l’écouteur Gateway (recommandée)

Le port WS du Gateway (par défaut `18789`) est lié au loopback par défaut. Pour un accès LAN/tailnet,
effectuez une liaison explicite et gardez l’authentification activée.

Pour les configurations tailnet uniquement :

- Définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json`.
- Redémarrez le Gateway (ou redémarrez l’app de barre de menu macOS).

## Ce qui est annoncé

Seul le Gateway annonce `_openclaw-gw._tcp`. La publication multicast LAN est
fournie par le plugin `bonjour` inclus ; la publication DNS-SD étendue reste
gérée par le Gateway.

## Types de service

- `_openclaw-gw._tcp` — balise de transport gateway (utilisée par les Node macOS/iOS/Android).

## Clés TXT (indications non secrètes)

Le Gateway annonce de petites indications non secrètes pour rendre les flux UI pratiques :

- `role=gateway`
- `displayName=<nom convivial>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (uniquement lorsque TLS est activé)
- `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
- `canvasPort=<port>` (uniquement lorsque l’hôte canvas est activé ; actuellement identique à `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mode mDNS complet uniquement, indication facultative lorsque Tailnet est disponible)
- `sshPort=<port>` (mode mDNS complet uniquement ; le DNS-SD étendu peut l’omettre)
- `cliPath=<path>` (mode mDNS complet uniquement ; le DNS-SD étendu l’écrit toujours comme indication d’installation distante)

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients ne doivent pas traiter TXT comme un routage faisant autorité.
- Les clients doivent router en utilisant le point de terminaison de service résolu (SRV + A/AAAA). Traitez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` uniquement comme des indications.
- Le ciblage SSH automatique doit lui aussi utiliser l’hôte de service résolu, et non des indications TXT seules.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer une empreinte déjà stockée.
- Les Node iOS/Android doivent traiter les connexions directes basées sur la découverte comme **TLS uniquement** et exiger une confirmation explicite de l’utilisateur avant de faire confiance à une empreinte vue pour la première fois.

## Débogage sur macOS

Outils intégrés utiles :

- Parcourir les instances :

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Résoudre une instance (remplacez `<instance>`) :

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Si la navigation fonctionne mais que la résolution échoue, vous êtes généralement confronté à une politique LAN ou
à un problème de résolveur mDNS.

## Débogage dans les journaux Gateway

Le Gateway écrit un fichier journal rotatif (affiché au démarrage sous la forme
`gateway log file: ...`). Recherchez les lignes `bonjour:`, en particulier :

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Débogage sur un Node iOS

Le Node iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour capturer les journaux :

- Réglages → Gateway → Avancé → **Discovery Debug Logs**
- Réglages → Gateway → Avancé → **Discovery Logs** → reproduire → **Copy**

Le journal inclut les transitions d’état du navigateur et les changements d’ensemble de résultats.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez Tailnet ou SSH.
- **Multicast bloqué** : certains réseaux Wi‑Fi désactivent mDNS.
- **Veille / churn d’interface** : macOS peut temporairement perdre les résultats mDNS ; réessayez.
- **La navigation fonctionne mais la résolution échoue** : gardez des noms de machine simples (évitez les émojis ou
  la ponctuation), puis redémarrez le Gateway. Le nom d’instance du service est dérivé du
  nom d’hôte ; des noms trop complexes peuvent perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS-SD échappe souvent des octets dans les noms d’instance de service sous forme de séquences décimales `\DDD`
(par ex. les espaces deviennent `\032`).

- C’est normal au niveau du protocole.
- Les interfaces doivent décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Désactivation / configuration

- `openclaw plugins disable bonjour` désactive la publication multicast LAN en désactivant le plugin inclus.
- `openclaw plugins enable bonjour` rétablit le plugin de découverte LAN par défaut.
- `OPENCLAW_DISABLE_BONJOUR=1` désactive la publication multicast LAN sans modifier la configuration du plugin ; les valeurs vraies acceptées sont `1`, `true`, `yes` et `on` (hérité : `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH lorsque `sshPort` est annoncé (hérité : `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publie une indication MagicDNS dans TXT lorsque le mode mDNS complet est activé (hérité : `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé (hérité : `OPENCLAW_CLI_PATH`).

## Documentation liée

- Politique de découverte et sélection de transport : [Découverte](/fr/gateway/discovery)
- Appairage et approbations des Node : [Appairage Gateway](/fr/gateway/pairing)
