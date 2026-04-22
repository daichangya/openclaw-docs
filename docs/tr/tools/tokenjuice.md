---
read_when:
    - OpenClaw içinde daha kısa `exec` veya `bash` araç sonuçları istiyorsunuz
    - Paketlenmiş tokenjuice Plugin'ini etkinleştirmek istiyorsunuz
    - tokenjuice'ın neyi değiştirdiğini ve neyi ham bıraktığını anlamanız gerekiyor
summary: İsteğe bağlı paketlenmiş bir Plugin ile gürültülü exec ve bash araç sonuçlarını sıkıştırın
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-22T08:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice`, komut zaten çalıştırıldıktan sonra gürültülü `exec` ve `bash`
araç sonuçlarını sıkıştıran isteğe bağlı paketlenmiş bir Plugin'dir.

Komutun kendisini değil, döndürülen `tool_result` değerini değiştirir.
Tokenjuice shell girdisini yeniden yazmaz, komutları yeniden çalıştırmaz veya
çıkış kodlarını değiştirmez.

Bugün bu, Tokenjuice'ın gömülü `tool_result` yoluna bağlandığı ve oturuma geri
dönen çıktıyı kırptığı Pi gömülü çalıştırmaları için geçerlidir.

## Plugin'i etkinleştirin

Hızlı yol:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Eşdeğeri:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw bu Plugin'i zaten içerir. Ayrı bir `plugins install`
veya `tokenjuice install openclaw` adımı yoktur.

Yapılandırmayı doğrudan düzenlemeyi tercih ederseniz:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice neyi değiştirir

- Gürültülü `exec` ve `bash` sonuçlarını, oturuma geri beslenmeden önce sıkıştırır.
- Özgün komut çalıştırmasını değiştirmeden bırakır.
- Tokenjuice'ın ham bırakması gereken tam dosya içeriği okumalarını ve diğer komutları korur.
- İsteğe bağlı kalır: her yerde birebir çıktı istiyorsanız Plugin'i devre dışı bırakın.

## Çalıştığını doğrulayın

1. Plugin'i etkinleştirin.
2. `exec` çağırabilen bir oturum başlatın.
3. `git status` gibi gürültülü bir komut çalıştırın.
4. Döndürülen araç sonucunun ham shell çıktısından daha kısa ve daha yapılandırılmış olduğunu kontrol edin.

## Plugin'i devre dışı bırakın

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Veya:

```bash
openclaw plugins disable tokenjuice
```
