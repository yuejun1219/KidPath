import gradio as gr
import requests

API_BASE = "http://localhost:3000/api/v1/ai"

# --- text ---
def ask_text(message):
    try:
        resp = requests.post(f"{API_BASE}/text", json={"message": message})
        return resp.text
    except Exception as e:
        return f"❌ Error: {str(e)}"

# --- voice ---
def ask_voice(audio_file):
    try:
        with open(audio_file, "rb") as f:
            resp = requests.post(f"{API_BASE}/voice", files={"audio": f})
        return resp.text
    except Exception as e:
        return f"❌ Error: {str(e)}"

# --- photo ---
def ask_photo(image_file):
    try:
        with open(image_file, "rb") as f:
            resp = requests.post(f"{API_BASE}/photo", files={"image": f})
        return resp.text
    except Exception as e:
        return f"❌ Error: {str(e)}"

# === Gradio Tabs ===
with gr.Blocks() as demo:
    gr.Markdown("## 🧪 KidPath AI All-in-One Tester (Raw Output)")
    
    with gr.Tab("💬 Text"):
        inp = gr.Textbox(label="Your message")
        out = gr.Textbox(label="Raw Response")
        inp.submit(ask_text, inputs=inp, outputs=out)
        gr.Button("Send").click(ask_text, inputs=inp, outputs=out)
    
    with gr.Tab("🎤 Voice"):
        vinp = gr.Audio(sources=["microphone"], type="filepath")
        vout = gr.Textbox(label="Raw Response")
        gr.Button("Send Voice").click(ask_voice, inputs=vinp, outputs=vout)
    
    with gr.Tab("🖼️ Photo"):
        pinp = gr.Image(type="filepath")
        pout = gr.Textbox(label="Raw Response")
        gr.Button("Send Image").click(ask_photo, inputs=pinp, outputs=pout)

demo.launch(server_name="0.0.0.0", server_port=7862, share=True)
