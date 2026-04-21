---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Mengapa sebuah tool diblokir: runtime sandbox, kebijakan izinkan/tolak tool, dan gate exec dengan hak lebih tinggi'
title: Sandbox vs Kebijakan Tool vs Elevated
x-i18n:
    generated_at: "2026-04-21T09:18:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs Kebijakan Tool vs Elevated

OpenClaw memiliki tiga kontrol yang saling terkait (tetapi berbeda):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) menentukan **di mana tool berjalan** (backend sandbox vs host).
2. **Kebijakan tool** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) menentukan **tool mana yang tersedia/diizinkan**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) adalah **jalur keluar khusus exec** untuk berjalan di luar sandbox ketika Anda berada dalam sandbox (`gateway` secara default, atau `node` ketika target exec dikonfigurasi ke `node`).

## Debug cepat

Gunakan inspector untuk melihat apa yang _sebenarnya_ dilakukan OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Perintah ini mencetak:

- mode/scope/akses workspace sandbox yang efektif
- apakah sesi saat ini sedang berada dalam sandbox (utama vs non-utama)
- izinkan/tolak tool sandbox yang efektif (dan apakah berasal dari agent/global/default)
- gate elevated dan path kunci untuk perbaikan

## Sandbox: di mana tool berjalan

Sandboxing dikendalikan oleh `agents.defaults.sandbox.mode`:

- `"off"`: semuanya berjalan di host.
- `"non-main"`: hanya sesi non-utama yang berada dalam sandbox (sering menjadi “kejutan” umum untuk grup/channel).
- `"all"`: semuanya berada dalam sandbox.

Lihat [Sandboxing](/id/gateway/sandboxing) untuk matriks lengkap (scope, mount workspace, image).

### Bind mount (pemeriksaan cepat keamanan)

- `docker.binds` _menembus_ filesystem sandbox: apa pun yang Anda mount akan terlihat di dalam container dengan mode yang Anda tetapkan (`:ro` atau `:rw`).
- Default-nya read-write jika Anda menghilangkan mode; pilih `:ro` untuk source/secret.
- `scope: "shared"` mengabaikan bind per-agent (hanya bind global yang berlaku).
- OpenClaw memvalidasi sumber bind dua kali: pertama pada path sumber yang sudah dinormalisasi, lalu lagi setelah resolusi melalui leluhur yang ada terdalam. Escape parent symlink tidak melewati pemeriksaan blocked-path atau allowed-root.
- Path leaf yang belum ada tetap diperiksa dengan aman. Jika `/workspace/alias-out/new-file` di-resolve melalui parent tersymlink ke path yang diblokir atau di luar root yang diizinkan yang dikonfigurasi, bind ditolak.
- Mengikat `/var/run/docker.sock` secara efektif memberikan kontrol host kepada sandbox; lakukan ini hanya dengan sengaja.
- Akses workspace (`workspaceAccess: "ro"`/`"rw"`) bersifat independen dari mode bind.

## Kebijakan tool: tool mana yang ada/dapat dipanggil

Dua lapisan yang penting:

- **Profil tool**: `tools.profile` dan `agents.list[].tools.profile` (allowlist dasar)
- **Profil tool provider**: `tools.byProvider[provider].profile` dan `agents.list[].tools.byProvider[provider].profile`
- **Kebijakan tool global/per-agent**: `tools.allow`/`tools.deny` dan `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Kebijakan tool provider**: `tools.byProvider[provider].allow/deny` dan `agents.list[].tools.byProvider[provider].allow/deny`
- **Kebijakan tool sandbox** (hanya berlaku saat dalam sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` dan `agents.list[].tools.sandbox.tools.*`

Aturan praktis:

- `deny` selalu menang.
- Jika `allow` tidak kosong, semua yang lain dianggap diblokir.
- Kebijakan tool adalah penghentian keras: `/exec` tidak dapat meng-override tool `exec` yang ditolak.
- `/exec` hanya mengubah default sesi untuk pengirim yang berwenang; perintah ini tidak memberikan akses tool.
  Kunci tool provider menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).

### Grup tool (singkatan)

Kebijakan tool (global, agent, sandbox) mendukung entri `group:*` yang diperluas menjadi beberapa tool:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Grup yang tersedia:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` diterima sebagai
  alias untuk `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: semua tool OpenClaw bawaan (tidak termasuk plugin provider)

## Elevated: khusus exec "jalankan di host"

Elevated **tidak** memberikan tool tambahan; elevated hanya memengaruhi `exec`.

- Jika Anda berada dalam sandbox, `/elevated on` (atau `exec` dengan `elevated: true`) berjalan di luar sandbox (persetujuan mungkin tetap berlaku).
- Gunakan `/elevated full` untuk melewati persetujuan exec untuk sesi tersebut.
- Jika Anda sudah berjalan secara langsung, elevated secara efektif tidak berpengaruh (tetap digate).
- Elevated **tidak** dicakup oleh skill dan **tidak** meng-override izinkan/tolak tool.
- Elevated tidak memberikan override lintas host arbitrer dari `host=auto`; elevated mengikuti aturan target exec normal dan hanya mempertahankan `node` ketika target yang dikonfigurasi/sesi memang sudah `node`.
- `/exec` terpisah dari elevated. Perintah ini hanya menyesuaikan default exec per sesi untuk pengirim yang berwenang.

Gate:

- Pengaktifan: `tools.elevated.enabled` (dan opsional `agents.list[].tools.elevated.enabled`)
- Allowlist pengirim: `tools.elevated.allowFrom.<provider>` (dan opsional `agents.list[].tools.elevated.allowFrom.<provider>`)

Lihat [Elevated Mode](/id/tools/elevated).

## Perbaikan umum "penjara sandbox"

### "Tool X diblokir oleh kebijakan tool sandbox"

Kunci perbaikan (pilih satu):

- Nonaktifkan sandbox: `agents.defaults.sandbox.mode=off` (atau per-agent `agents.list[].sandbox.mode=off`)
- Izinkan tool tersebut di dalam sandbox:
  - hapus dari `tools.sandbox.tools.deny` (atau per-agent `agents.list[].tools.sandbox.tools.deny`)
  - atau tambahkan ke `tools.sandbox.tools.allow` (atau allow per-agent)

### "Saya kira ini main, kenapa berada dalam sandbox?"

Dalam mode `"non-main"`, kunci grup/channel _bukan_ main. Gunakan session key utama (ditampilkan oleh `sandbox explain`) atau ubah mode menjadi `"off"`.

## Lihat juga

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap (mode, scope, backend, image)
- [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) -- override dan prioritas per-agent
- [Elevated Mode](/id/tools/elevated)
