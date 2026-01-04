require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk'); // New Library

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// 1. Setup Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 2. Serve website
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/symcheck.html');
});

// --- CHAT ROUTE (GROQ) ---
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    console.log("User asked:", userMessage);

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful medical assistant bot named SymCheck. Keep answers brief (under 100 words). You ask relevant questions to understand the user's symptoms better. Do not provide medical diagnoses or advice."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const aiText = completion.choices[0]?.message?.content || "No response";

        console.log("Groq Replied:", aiText);
        res.json({ reply: aiText });

    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ reply: "Error connecting to AI. Check terminal." });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});