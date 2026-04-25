---
read_when:
    - Anda menginginkan beberapa agen terisolasi (workspace + routing + auth)
summary: Referensi CLI untuk `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agen
x-i18n:
    generated_at: "2026-04-25T13:42:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Kelola agen terisolasi (workspace + auth + routing).

Terkait:

- Routing multi-agen: [Multi-Agent Routing](/id/concepts/multi-agent)
- Workspace agen: [Agent workspace](/id/concepts/agent-workspace)
- Konfigurasi visibilitas Skills: [Skills config](/id/tools/skills-config)

## Contoh

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Binding routing

Gunakan binding routing untuk menetapkan trafik kanal masuk ke agen tertentu.

Jika Anda juga menginginkan Skills yang terlihat berbeda per agen, konfigurasikan
`agents.defaults.skills` dan `agents.list[].skills` di `openclaw.json`. Lihat
[Skills config](/id/tools/skills-config) dan
[Configuration Reference](/id/gateway/config-agents#agents-defaults-skills).

Daftar binding:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Tambahkan binding:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Jika Anda menghilangkan `accountId` (`--bind <channel>`), OpenClaw akan me-resolve-nya dari default kanal dan hook penyiapan Plugin saat tersedia.

Jika Anda menghilangkan `--agent` untuk `bind` atau `unbind`, OpenClaw menargetkan agen default saat ini.

### Perilaku cakupan binding

- Binding tanpa `accountId` hanya cocok dengan akun default kanal.
- `accountId: "*"` adalah fallback seluruh kanal (semua akun) dan kurang spesifik dibanding binding akun eksplisit.
- Jika agen yang sama sudah memiliki binding kanal yang cocok tanpa `accountId`, lalu Anda kemudian melakukan bind dengan `accountId` yang eksplisit atau yang sudah di-resolve, OpenClaw akan meningkatkan binding yang ada itu di tempat alih-alih menambahkan duplikat.

Contoh:

```bash
# binding awal hanya-kanal
openclaw agents bind --agent work --bind telegram

# kemudian tingkatkan menjadi binding dengan cakupan akun
openclaw agents bind --agent work --bind telegram:ops
```

Setelah peningkatan, routing untuk binding tersebut dibatasi ke `telegram:ops`. Jika Anda juga menginginkan routing akun default, tambahkan secara eksplisit (misalnya `--bind telegram:default`).

Hapus binding:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` menerima `--all` atau satu atau lebih nilai `--bind`, bukan keduanya.

## Surface perintah

### `agents`

Menjalankan `openclaw agents` tanpa subperintah setara dengan `openclaw agents list`.

### `agents list`

Opsi:

- `--json`
- `--bindings`: sertakan aturan routing lengkap, bukan hanya jumlah/ringkasan per agen

### `agents add [name]`

Opsi:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (dapat diulang)
- `--non-interactive`
- `--json`

Catatan:

- Meneruskan flag add eksplisit apa pun mengalihkan perintah ke jalur non-interaktif.
- Mode non-interaktif memerlukan nama agen dan `--workspace`.
- `main` dicadangkan dan tidak dapat digunakan sebagai id agen baru.

### `agents bindings`

Opsi:

- `--agent <id>`
- `--json`

### `agents bind`

Opsi:

- `--agent <id>` (default ke agen default saat ini)
- `--bind <channel[:accountId]>` (dapat diulang)
- `--json`

### `agents unbind`

Opsi:

- `--agent <id>` (default ke agen default saat ini)
- `--bind <channel[:accountId]>` (dapat diulang)
- `--all`
- `--json`

### `agents delete <id>`

Opsi:

- `--force`
- `--json`

Catatan:

- `main` tidak dapat dihapus.
- Tanpa `--force`, konfirmasi interaktif diperlukan.
- Direktori workspace, status agen, dan transkrip sesi dipindahkan ke Trash, bukan dihapus permanen.
- Jika workspace agen lain adalah path yang sama, berada di dalam workspace ini, atau berisi workspace ini,
  workspace akan dipertahankan dan `--json` melaporkan `workspaceRetained`,
  `workspaceRetainedReason`, dan `workspaceSharedWith`.

## File identitas

Setiap workspace agen dapat menyertakan `IDENTITY.md` di root workspace:

- Contoh path: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` membaca dari root workspace (atau `--identity-file` yang eksplisit)

Path avatar di-resolve relatif terhadap root workspace.

## Set identitas

`set-identity` menulis field ke `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (path relatif-workspace, URL http(s), atau data URI)

Opsi:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Catatan:

- `--agent` atau `--workspace` dapat digunakan untuk memilih agen target.
- Jika Anda bergantung pada `--workspace` dan beberapa agen berbagi workspace tersebut, perintah gagal dan meminta Anda meneruskan `--agent`.
- Saat tidak ada field identitas eksplisit yang diberikan, perintah membaca data identitas dari `IDENTITY.md`.

Muat dari `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Override field secara eksplisit:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Contoh konfigurasi:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "lobster luar angkasa",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Terkait

- [CLI reference](/id/cli)
- [Multi-agent routing](/id/concepts/multi-agent)
- [Agent workspace](/id/concepts/agent-workspace)
