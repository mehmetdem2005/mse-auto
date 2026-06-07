# Vertex AI + Cloud TTS Proxy — Kurulum (telefondan, $1000 krediyle)

Bu proxy'yi **bir kez** Cloud Run'a kurarsın. Sonra mse-auto worker'ı bu proxy üzerinden
görsel (Vertex AI) ve ses (Cloud TTS) üretir; kullanım **GCP kredinden** düşer ve worker'da
**hiçbir Google anahtarı durmaz** (sadece proxy URL + gizli kod). Hepsi telefonda tarayıcıdan
**Cloud Shell** ile yapılır, PC gerekmez.

## Adımlar (Cloud Shell — tarayıcı)

1. Telefonda aç: **https://shell.cloud.google.com** → Google ile gir.

2. Kredinin bağlı olduğu projeyi seç:
   ```
   gcloud config set project PROJE_ID
   ```

3. Gerekli servisleri aç (Vertex + TTS + Run + Build):
   ```
   gcloud services enable aiplatform.googleapis.com texttospeech.googleapis.com run.googleapis.com cloudbuild.googleapis.com
   ```

4. Kodu al (mse-auto reposu, proxy klasörü):
   ```
   git clone https://github.com/mehmetdem2005/mse-auto
   cd mse-auto/proxy
   ```

5. Cloud Run'ı çalıştıran servis hesabına Vertex izni ver:
   ```
   PN=$(gcloud projects describe PROJE_ID --format='value(projectNumber)')
   gcloud projects add-iam-policy-binding PROJE_ID \
     --member="serviceAccount:${PN}-compute@developer.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

6. Deploy et (kendi gizli kodunu `PROXY_SECRET`'e yaz, PROJE_ID'yi değiştir):
   ```
   gcloud run deploy mse-vertex-proxy --source . --region us-central1 \
     --allow-unauthenticated --memory 512Mi --timeout 300 \
     --set-env-vars PROXY_SECRET=gizli-kodun,PROJECT=PROJE_ID,LOCATION=us-central1
   ```
   Bitince bir **Service URL** verir, örn: `https://mse-vertex-proxy-xxxxx-uc.a.run.app`

## Sonra
Bana şu ikisini ver, ben Render worker env'ine girip deploy ederim:
- **Service URL** (yukarıdaki)
- **Gizli kod** (`PROXY_SECRET`'e yazdığın)

Worker tarafında karşılıkları: `VERTEX_PROXY_URL`, `VERTEX_PROXY_SECRET`.

## Model / kalite
- Varsayılan görsel modeli: `gemini-2.5-flash-image-preview` (Nano Banana — hızlı/ucuz, Shorts için ideal).
- **4K / en yüksek kalite** istersen worker env'ine: `VERTEX_IMAGE_MODEL=gemini-3-pro-image-preview`
  ve `VERTEX_LOCATION=global` (Pro çoğu zaman sadece `global`'de). Maliyet artar; kredin bol.
- Ses: Cloud TTS **Chirp 3 HD** (`tr-TR-Chirp3-HD-Charon`). Değiştirmek için `GCP_TTS_VOICE`.

## Notlar
- URL `--allow-unauthenticated` olduğu için **URL + gizli kodu paylaşma** (gizli kod kötüye kullanımı engeller).
- Durdurmak: `gcloud run services delete mse-vertex-proxy --region us-central1`.
- Harcamayı doğrula: **Billing → Reports → Vertex AI / Cloud Text-to-Speech** + Credits düşüşü.
