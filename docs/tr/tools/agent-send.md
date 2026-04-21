---
read_when:
    - Betiklerden veya komut satırından ajan çalıştırmalarını tetiklemek istiyorsunuz
    - Ajan yanıtlarını programlı olarak bir sohbet kanalına teslim etmeniz gerekiyor
summary: CLI'den ajan dönüşleri çalıştırın ve isteğe bağlı olarak yanıtları kanallara teslim edin
title: Ajan Gönderimi
x-i18n:
    generated_at: "2026-04-21T09:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Ajan Gönderimi

`openclaw agent`, gelen bir sohbet mesajına ihtiyaç duymadan komut satırından tek bir ajan dönüşü çalıştırır. Bunu betikli iş akışları, testler ve
programlı teslimat için kullanın.

## Hızlı başlangıç

<Steps>
  <Step title="Basit bir ajan dönüşü çalıştırın">
    ```bash
    openclaw agent --message "Bugün hava nasıl?"
    ```

    Bu, mesajı Gateway üzerinden gönderir ve yanıtı yazdırır.

  </Step>

  <Step title="Belirli bir ajanı veya oturumu hedefleyin">
    ```bash
    # Belirli bir ajanı hedefle
    openclaw agent --agent ops --message "Günlükleri özetle"

    # Bir telefon numarasını hedefle (oturum anahtarı türetir)
    openclaw agent --to +15555550123 --message "Durum güncellemesi"

    # Mevcut bir oturumu yeniden kullan
    openclaw agent --session-id abc123 --message "Göreve devam et"
    ```

  </Step>

  <Step title="Yanıtı bir kanala teslim edin">
    ```bash
    # WhatsApp'a teslim et (varsayılan kanal)
    openclaw agent --to +15555550123 --message "Rapor hazır" --deliver

    # Slack'e teslim et
    openclaw agent --agent ops --message "Rapor oluştur" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Bayraklar

| Bayrak                        | Açıklama                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Gönderilecek mesaj (gerekli)                                |
| `--to \<dest\>`               | Bir hedeften oturum anahtarı türet (telefon, sohbet kimliği) |
| `--agent \<id\>`              | Yapılandırılmış bir ajanı hedefle (`main` oturumunu kullanır) |
| `--session-id \<id\>`         | Var olan bir oturumu kimliğe göre yeniden kullan            |
| `--local`                     | Yerel gömülü çalışma zamanını zorla (Gateway'i atla)        |
| `--deliver`                   | Yanıtı bir sohbet kanalına gönder                           |
| `--channel \<name\>`          | Teslimat kanalı (whatsapp, telegram, discord, slack vb.)    |
| `--reply-to \<target\>`       | Teslimat hedefi geçersiz kılması                            |
| `--reply-channel \<name\>`    | Teslimat kanalı geçersiz kılması                            |
| `--reply-account \<id\>`      | Teslimat hesap kimliği geçersiz kılması                     |
| `--thinking \<level\>`        | Seçilen model profili için düşünme düzeyi ayarla            |
| `--verbose \<on\|full\|off\>` | Ayrıntı düzeyini ayarla                                     |
| `--timeout \<seconds\>`       | Ajan zaman aşımını geçersiz kıl                             |
| `--json`                      | Yapılandırılmış JSON çıktısı                                |

## Davranış

- Varsayılan olarak CLI, **Gateway üzerinden** gider. Geçerli makinede gömülü çalışma zamanını zorlamak için `--local` ekleyin.
- Gateway'e ulaşılamazsa CLI, **yerel gömülü çalıştırmaya geri düşer**.
- Oturum seçimi: `--to`, oturum anahtarını türetir (grup/kanal hedefleri
  yalıtımı korur; doğrudan sohbetler `main` içinde birleştirilir).
- Thinking ve verbose bayrakları oturum deposunda kalıcı olur.
- Çıktı: varsayılan olarak düz metin veya yapılandırılmış yük + meta veri için `--json`.

## Örnekler

```bash
# JSON çıktılı basit dönüş
openclaw agent --to +15555550123 --message "Günlükleri izle" --verbose on --json

# Düşünme düzeyiyle dönüş
openclaw agent --session-id 1234 --message "Gelen kutusunu özetle" --thinking medium

# Oturumdan farklı bir kanala teslim et
openclaw agent --agent ops --message "Uyarı" --deliver --reply-channel telegram --reply-to "@admin"
```

## İlgili

- [Ajan CLI başvurusu](/cli/agent)
- [Alt ajanlar](/tr/tools/subagents) — arka planda alt ajan başlatma
- [Oturumlar](/tr/concepts/session) — oturum anahtarlarının nasıl çalıştığı
