"""mse-auto — Vertex AI + Cloud TTS proxy (Cloud Run).

The worker calls Vertex AI directly (server-to-server), but running this tiny proxy on
Cloud Run is the easiest way to spend the GCP credit WITHOUT shipping a service-account
key to the worker: Cloud Run's own service account holds the identity (ADC) and billing
goes to the project's credit. The worker just POSTs here with a shared secret.

Routes (POST JSON; header  X-Proxy-Secret: <PROXY_SECRET>):
  /image  { location, model, contents, generationConfig }      -> Vertex generateContent JSON
  /tts    { text, languageCode, voice, speakingRate }          -> { "audioContent": "<base64 mp3>" }
  /       (GET) health check
"""
import os
import base64
import requests
import google.auth
import google.auth.transport.requests
from flask import Flask, request, jsonify, make_response

app = Flask(__name__)
SECRET = os.environ.get("PROXY_SECRET", "")
DEF_PROJECT = os.environ.get("PROJECT", "")
DEF_LOCATION = os.environ.get("LOCATION", "us-central1")

_creds = None


def _token() -> str:
    """Application Default Credentials token (Cloud Run service account)."""
    global _creds
    if _creds is None:
        _creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    if not _creds.valid:
        _creds.refresh(google.auth.transport.requests.Request())
    return _creds.token


def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Proxy-Secret"
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return resp


def _check(req):
    return not (SECRET and req.headers.get("X-Proxy-Secret", "") != SECRET)


@app.route("/", methods=["OPTIONS"])
@app.route("/image", methods=["OPTIONS"])
@app.route("/tts", methods=["OPTIONS"])
def _options():
    return _cors(make_response("", 204))


@app.route("/", methods=["GET"])
def _health():
    return _cors(jsonify({"ok": True, "msg": "mse-auto vertex+tts proxy ayakta"}))


@app.route("/image", methods=["POST"])
def image():
    if not _check(request):
        return _cors(make_response(jsonify({"error": {"message": "Gizli kod yanlis"}}), 403))
    body = request.get_json(force=True, silent=True) or {}
    project = body.get("project") or DEF_PROJECT
    location = body.get("location") or DEF_LOCATION
    model = body.get("model")
    contents = body.get("contents")
    gen_cfg = body.get("generationConfig", {"responseModalities": ["TEXT", "IMAGE"]})
    if not (project and model and contents):
        return _cors(make_response(jsonify({"error": {"message": "project, model ve contents gerekli"}}), 400))

    host = "aiplatform.googleapis.com" if location == "global" else ("%s-aiplatform.googleapis.com" % location)
    url = ("https://%s/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent"
           % (host, project, location, model))
    fwd = {"contents": contents, "generationConfig": gen_cfg}
    # Pass through optional fields when present (system instruction, tools/grounding, safety).
    for k in ("systemInstruction", "system_instruction", "tools", "toolConfig", "safetySettings"):
        if body.get(k) is not None:
            fwd[k] = body[k]
    try:
        r = requests.post(
            url,
            headers={"Authorization": "Bearer %s" % _token(), "Content-Type": "application/json"},
            json=fwd,
            timeout=180,
        )
    except Exception as e:  # noqa: BLE001
        return _cors(make_response(jsonify({"error": {"message": "Vertex istegi basarisiz: %s" % e}}), 502))
    resp = make_response(r.content, r.status_code)
    resp.headers["Content-Type"] = "application/json"
    return _cors(resp)


@app.route("/tts", methods=["POST"])
def tts():
    if not _check(request):
        return _cors(make_response(jsonify({"error": {"message": "Gizli kod yanlis"}}), 403))
    body = request.get_json(force=True, silent=True) or {}
    text = body.get("text")
    if not text:
        return _cors(make_response(jsonify({"error": {"message": "text gerekli"}}), 400))
    lang = body.get("languageCode", "tr-TR")
    voice = body.get("voice", "tr-TR-Chirp3-HD-Charon")
    rate = float(body.get("speakingRate", 1.0))
    try:
        r = requests.post(
            "https://texttospeech.googleapis.com/v1/text:synthesize",
            headers={"Authorization": "Bearer %s" % _token(), "Content-Type": "application/json"},
            json={
                "input": {"text": text[:4800]},
                "voice": {"languageCode": lang, "name": voice},
                "audioConfig": {"audioEncoding": "MP3", "speakingRate": rate},
            },
            timeout=120,
        )
    except Exception as e:  # noqa: BLE001
        return _cors(make_response(jsonify({"error": {"message": "TTS istegi basarisiz: %s" % e}}), 502))
    resp = make_response(r.content, r.status_code)
    resp.headers["Content-Type"] = "application/json"
    return _cors(resp)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
