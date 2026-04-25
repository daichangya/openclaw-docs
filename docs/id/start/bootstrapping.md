---
read_when:
    - Memahami apa yang terjadi pada proses pertama agen
    - Menjelaskan lokasi file bootstrapping
    - Men-debug penyiapan identitas onboarding
sidebarTitle: Bootstrapping
summary: Ritual bootstrapping agen yang menanamkan file workspace dan identitas
title: Bootstrapping agen
x-i18n:
    generated_at: "2026-04-25T13:56:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

Bootstrapping adalah ritual **proses pertama** yang menyiapkan workspace agen dan
mengumpulkan detail identitas. Ini terjadi setelah onboarding, saat agen mulai
berjalan untuk pertama kalinya.

## Apa yang dilakukan bootstrapping

Pada proses pertama agen, OpenClaw melakukan bootstrapping pada workspace (default
`~/.openclaw/workspace`):

- Menanamkan `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Menjalankan ritual tanya jawab singkat (satu pertanyaan pada satu waktu).
- Menulis identitas + preferensi ke `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Menghapus `BOOTSTRAP.md` saat selesai agar hanya berjalan sekali.

## Melewati bootstrapping

Untuk melewati ini pada workspace yang sudah ditanamkan sebelumnya, jalankan `openclaw onboard --skip-bootstrap`.

## Lokasi proses berjalan

Bootstrapping selalu berjalan di **host gateway**. Jika aplikasi macOS terhubung ke
Gateway jarak jauh, workspace dan file bootstrapping berada di mesin
jarak jauh tersebut.

<Note>
Saat Gateway berjalan di mesin lain, edit file workspace di host gateway
(misalnya, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Dokumen terkait

- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Tata letak workspace: [Workspace agen](/id/concepts/agent-workspace)
