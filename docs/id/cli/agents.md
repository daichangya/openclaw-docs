---
read_when:
    - Anda menginginkan beberapa agent terisolasi (workspace + routing + auth)
summary: Referensi CLI untuk `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-23T09:18:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Kelola agent terisolasi (workspace + auth + routing).

Terkait:

- Perutean multi-agent: [Perutean Multi-Agent](/id/concepts/multi-agent)
- Workspace agent: [Workspace agent](/id/concepts/agent-workspace)
- Konfigurasi visibilitas Skill: [Konfigurasi Skills](/id/tools/skills-config)

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

## Binding perutean

Gunakan binding perutean untuk menyematkan trafik channel masuk ke agent tertentu.

Jika Anda juga menginginkan Skill terlihat yang berbeda per agent, konfigurasikan
`agents.defaults.skills` dan `agents.list[].skills` di `openclaw.json`. Lihat
[Konfigurasi Skills](/id/tools/skills-config) dan
[Referensi Konfigurasi](/id/gateway/configuration-reference#agents-defaults-skills).

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

Jika Anda menghilangkan `accountId` (`--bind <channel>`), OpenClaw akan menyelesaikannya dari default channel dan hook penyiapan plugin bila tersedia.

Jika Anda menghilangkan `--agent` untuk `bind` atau `unbind`, OpenClaw menargetkan agent default saat ini.

### Perilaku scope binding

- Binding tanpa `accountId` hanya cocok dengan akun default channel.
- `accountId: "*"` adalah fallback tingkat channel (semua akun) dan kurang spesifik dibanding binding akun eksplisit.
- Jika agent yang sama sudah memiliki binding channel yang cocok tanpa `accountId`, dan Anda kemudian melakukan bind dengan `accountId` yang eksplisit atau terselesaikan, OpenClaw akan meningkatkan binding yang sudah ada itu di tempat alih-alih menambahkan duplikat.

Contoh:

```bash
# binding awal hanya channel
openclaw agents bind --agent work --bind telegram

# kemudian tingkatkan menjadi binding berscope akun
openclaw agents bind --agent work --bind telegram:ops
```

Setelah peningkatan, perutean untuk binding tersebut dibatasi ke `telegram:ops`. Jika Anda juga menginginkan perutean akun default, tambahkan secara eksplisit (misalnya `--bind telegram:default`).

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
- `--bindings`: sertakan aturan perutean lengkap, bukan hanya hitungan/ringkasan per agent

### `agents add [name]`

Opsi:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (dapat diulang)
- `--non-interactive`
- `--json`

Catatan:

- Memberikan flag add eksplisit apa pun mengalihkan perintah ke jalur non-interaktif.
- Mode non-interaktif memerlukan nama agent dan `--workspace`.
- `main` dicadangkan dan tidak dapat digunakan sebagai id agent baru.

### `agents bindings`

Opsi:

- `--agent <id>`
- `--json`

### `agents bind`

Opsi:

- `--agent <id>` (default ke agent default saat ini)
- `--bind <channel[:accountId]>` (dapat diulang)
- `--json`

### `agents unbind`

Opsi:

- `--agent <id>` (default ke agent default saat ini)
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
- Workspace, state agent, dan direktori transkrip sesi dipindahkan ke Trash, bukan dihapus permanen.

## File identitas

Setiap workspace agent dapat menyertakan `IDENTITY.md` di root workspace:

- Contoh path: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` membaca dari root workspace (atau `--identity-file` yang eksplisit)

Path avatar diselesaikan relatif terhadap root workspace.

## Tetapkan identitas

`set-identity` menulis field ke `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (path relatif workspace, URL http(s), atau URI data)

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

- `--agent` atau `--workspace` dapat digunakan untuk memilih agent target.
- Jika Anda mengandalkan `--workspace` dan beberapa agent berbagi workspace itu, perintah gagal dan meminta Anda memberikan `--agent`.
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
