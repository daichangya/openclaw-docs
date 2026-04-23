---
read_when:
    - Kendi barındırdığınız Synapse veya Tuwunel için Matrix sessiz akışını ayarlama
    - Kullanıcılar her önizleme düzenlemesinde değil, yalnızca tamamlanmış bloklarda bildirim almak istiyor
summary: Sessiz sonlandırılmış önizleme düzenlemeleri için alıcı bazında Matrix push kuralları
title: Sessiz önizlemeler için Matrix push kuralları
x-i18n:
    generated_at: "2026-04-23T14:56:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbfdf2552ca352858d4e8d03a2a0f5f3b420d33b01063c111c0335c0229f0534
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

# Sessiz önizlemeler için Matrix push kuralları

`channels.matrix.streaming` değeri `"quiet"` olduğunda, OpenClaw tek bir önizleme olayını yerinde düzenler ve sonlandırılmış düzenlemeyi özel bir içerik bayrağıyla işaretler. Matrix istemcileri yalnızca kullanıcı başına bir push kuralı bu bayrakla eşleşirse son düzenlemede bildirim gönderir. Bu sayfa, Matrix'i kendi barındıran ve bu kuralı her alıcı hesabı için kurmak isteyen operatörler içindir.

Yalnızca standart Matrix bildirim davranışını istiyorsanız `streaming: "partial"` kullanın veya akışı kapalı bırakın. Bkz. [Matrix kanal kurulumu](/tr/channels/matrix#streaming-previews).

## Önkoşullar

- alıcı kullanıcı = bildirimi alması gereken kişi
- bot kullanıcısı = yanıtı gönderen OpenClaw Matrix hesabı
- aşağıdaki API çağrıları için alıcı kullanıcının erişim anahtarını kullanın
- push kuralındaki `sender` değerini bot kullanıcısının tam MXID'siyle eşleştirin
- alıcı hesabında çalışan pusher'lar zaten olmalıdır — sessiz önizleme kuralları yalnızca normal Matrix push teslimi sağlıklı olduğunda çalışır

## Adımlar

<Steps>
  <Step title="Sessiz önizlemeleri yapılandırın">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Alıcının erişim anahtarını alın">
    Mümkünse mevcut bir istemci oturumu anahtarını yeniden kullanın. Yenisini oluşturmak için:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Pusher'ların var olduğunu doğrulayın">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Hiç pusher dönmezse, devam etmeden önce bu hesap için normal Matrix push teslimini düzeltin.

  </Step>

  <Step title="Override push kuralını kurun">
    OpenClaw, sonlandırılmış yalnızca metin içeren önizleme düzenlemelerini `content["com.openclaw.finalized_preview"] = true` ile işaretler. Bu işaretçiyle ve gönderici olarak bot MXID'siyle eşleşen bir kural kurun:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Çalıştırmadan önce şunları değiştirin:

    - `https://matrix.example.org`: homeserver temel URL'niz
    - `$USER_ACCESS_TOKEN`: alıcı kullanıcının erişim anahtarı
    - `openclaw-finalized-preview-botname`: alıcı başına bot başına benzersiz bir kural kimliği (`openclaw-finalized-preview-<botname>` deseni)
    - `@bot:example.org`: alıcının değil, OpenClaw bot MXID'niz

  </Step>

  <Step title="Doğrulayın">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Ardından akışlı bir yanıtı test edin. Sessiz modda oda sessiz bir taslak önizleme gösterir ve blok veya tur tamamlandığında bir kez bildirim gönderir.

  </Step>
</Steps>

Kuralı daha sonra kaldırmak için aynı kural URL'sine alıcının anahtarıyla `DELETE` gönderin.

## Çoklu bot notları

Push kuralları `ruleId` ile anahtarlanır: aynı kimliğe yeniden `PUT` çalıştırmak tek bir kuralı günceller. Aynı alıcıya bildirim gönderen birden fazla OpenClaw botu için, farklı bir gönderici eşleşmesiyle bot başına bir kural oluşturun.

Yeni kullanıcı tanımlı `override` kuralları varsayılan bastırma kurallarının önüne eklenir, bu nedenle ek bir sıralama parametresine gerek yoktur. Kural yalnızca yerinde sonlandırılabilen yalnızca metin içeren önizleme düzenlemelerini etkiler; medya geri dönüşleri ve bayat önizleme geri dönüşleri normal Matrix teslimini kullanır.

## Homeserver notları

<AccordionGroup>
  <Accordion title="Synapse">
    Özel bir `homeserver.yaml` değişikliği gerekmez. Normal Matrix bildirimleri bu kullanıcıya zaten ulaşıyorsa, alıcı anahtarı + yukarıdaki `pushrules` çağrısı ana kurulum adımıdır.

    Synapse'i bir reverse proxy veya worker'ların arkasında çalıştırıyorsanız `/_matrix/client/.../pushrules/` yolunun Synapse'e doğru ulaştığından emin olun. Push teslimi ana süreç veya `synapse.app.pusher` / yapılandırılmış pusher worker'ları tarafından işlenir — bunların sağlıklı olduğundan emin olun.

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse ile aynı akış; sonlandırılmış önizleme işaretçisi için Tuwunel'e özgü bir yapılandırma gerekmez.

    Kullanıcı başka bir cihazda etkinken bildirimler kayboluyorsa `suppress_push_when_active` etkin mi kontrol edin. Tuwunel bu seçeneği 1.4.2 sürümünde (Eylül 2025) ekledi ve bir cihaz etkinken diğer cihazlara gönderilen push'ları bilerek bastırabilir.

  </Accordion>
</AccordionGroup>

## İlgili

- [Matrix kanal kurulumu](/tr/channels/matrix)
- [Akış kavramları](/tr/concepts/streaming)
