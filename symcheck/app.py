from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import requests

load_dotenv()

app = Flask(__name__)
API_KEY = os.getenv("API_KEY")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_msg = request.json.get("message")

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mistralai/mistral-7b-instruct",
                "messages": [
                    {"role": "system", "content": "You are SymCheck, a helpful AI that guides users based on symptoms. Never diagnose. Make the answers short and precise. Respond clearly with short paragraphs, bullet points, and line breaks for readability."},
                    {"role": "user", "content": user_msg}
                ]
            }
        )
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        return jsonify({"reply": reply})
    except Exception as e:
        print("API error:", e)
        return jsonify({"reply": "Oops, something went wrong."})

if __name__ == "__main__":
    app.run(debug=True)
