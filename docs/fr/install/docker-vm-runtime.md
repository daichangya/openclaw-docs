---
read_when:
    - Vous déployez OpenClaw sur une VM cloud avec Docker
    - Vous avez besoin du flux partagé de bake binaire, de persistance et de mise à jour
summary: Étapes de runtime Docker VM partagées pour les hôtes OpenClaw Gateway de longue durée
title: Runtime Docker VM
x-i18n:
    generated_at: "2026-04-05T12:45:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Runtime Docker VM

Étapes de runtime partagées pour les installations Docker sur VM comme GCP, Hetzner et autres fournisseurs VPS similaires.

## Intégrer les binaires requis dans l’image

Installer des binaires dans un conteneur en cours d’exécution est un piège.
Tout ce qui est installé au runtime sera perdu au redémarrage.

Tous les binaires externes requis par les Skills doivent être installés au moment de la construction de l’image.

Les exemples ci-dessous montrent seulement trois binaires courants :

- `gog` pour l’accès à Gmail
- `goplaces` pour Google Places
- `wacli` pour WhatsApp

Ce sont des exemples, pas une liste complète.
Vous pouvez installer autant de binaires que nécessaire en suivant le même modèle.

Si vous ajoutez plus tard de nouvelles Skills qui dépendent de binaires supplémentaires, vous devez :

1. Mettre à jour le Dockerfile
2. Reconstruire l’image
3. Redémarrer les conteneurs

**Exemple de Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
Les URL de téléchargement ci-dessus sont pour x86_64 (amd64). Pour les VM basées sur ARM (par ex. Hetzner ARM, GCP Tau T2A), remplacez les URL de téléchargement par les variantes ARM64 appropriées depuis la page de publication de chaque outil.
</Note>

## Construire et lancer

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Si la construction échoue avec `Killed` ou `exit code 137` pendant `pnpm install --frozen-lockfile`, la VM manque de mémoire.
Utilisez une classe de machine plus grande avant de réessayer.

Vérifier les binaires :

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Sortie attendue :

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Vérifier la passerelle :

```bash
docker compose logs -f openclaw-gateway
```

Sortie attendue :

```
[gateway] listening on ws://0.0.0.0:18789
```

## Ce qui persiste et où

OpenClaw s’exécute dans Docker, mais Docker n’est pas la source de vérité.
Tout l’état de longue durée doit survivre aux redémarrages, reconstructions et redémarrages machine.

| Composant           | Emplacement                       | Mécanisme de persistance | Remarques                                                     |
| ------------------- | --------------------------------- | ------------------------ | ------------------------------------------------------------- |
| Configuration de la passerelle | `/home/node/.openclaw/`           | Montage de volume hôte   | Inclut `openclaw.json`, `.env`                                |
| Profils d’authentification des modèles | `/home/node/.openclaw/agents/`    | Montage de volume hôte   | `agents/<agentId>/agent/auth-profiles.json` (OAuth, clés API) |
| Configurations de Skills | `/home/node/.openclaw/skills/`    | Montage de volume hôte   | État au niveau des Skills                                     |
| Espace de travail de l’agent | `/home/node/.openclaw/workspace/` | Montage de volume hôte   | Code et artefacts d’agent                                     |
| Session WhatsApp    | `/home/node/.openclaw/`           | Montage de volume hôte   | Préserve la connexion QR                                      |
| Trousseau Gmail     | `/home/node/.openclaw/`           | Volume hôte + mot de passe | Nécessite `GOG_KEYRING_PASSWORD`                              |
| Binaires externes   | `/usr/local/bin/`                 | Image Docker             | Doivent être intégrés au moment de la construction            |
| Runtime Node        | Système de fichiers du conteneur  | Image Docker             | Reconstruit à chaque build d’image                            |
| Packages OS         | Système de fichiers du conteneur  | Image Docker             | Ne pas installer au runtime                                   |
| Conteneur Docker    | Éphémère                          | Redémarrable             | Peut être détruit sans risque                                 |

## Mises à jour

Pour mettre à jour OpenClaw sur la VM :

```bash
git pull
docker compose build
docker compose up -d
```
