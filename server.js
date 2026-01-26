require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3307
});

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.post('/api/auth', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length > 0) {
            const user = rows[0];
            if (user.password === password) {
                res.json({ success: true, userId: user.id, username: user.username, msg: "Logged in successfully!" });
            } else {
                res.status(401).json({ success: false, message: "Username taken, wrong password." });
            }
        } else {
            const [result] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
            res.json({ success: true, userId: result.insertId, username: username, msg: "Account created & logged in!" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// HISTORY
async function saveNewSummary(userId, oldSummary, userMsg, aiMsg) {
    const prompt = `
    Previous Patient Summary: "${oldSummary || 'None'}"
    
    Current Interaction:
    Patient: "${userMsg}"
    Doctor: "${aiMsg}"
    
    Task: Create a NEW updated summary that merges the old info with this new interaction. 
    Keep it under 50 words.
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });
        
        const newSummary = completion.choices[0]?.message?.content;
        
        await db.query('INSERT INTO history (user_id, summary) VALUES (?, ?)', [userId, newSummary]);
        console.log(`[History] Added new summary row for User ${userId}`);
        
    } catch (err) {
        console.error("Summary failed:", err);
    }
}

// CHAT
app.post('/api/chat', async (req, res) => {
    const { message, userId } = req.body; 
    console.log(`User ${userId || 'Guest'} asked:`, message);

    try {
        let systemContext = "You are a helpful medical assistant bot named SymCheck. Keep answers brief (under 100 words). You provide immediate remedy with given symptoms. You also provide detailed review of medicines and their side effects neatly displayed. Do not use any special characters.";
        
        let latestSummary = "";

        if (userId) {
            const [rows] = await db.query(
                'SELECT summary FROM history WHERE user_id = ? ORDER BY id DESC LIMIT 1', 
                [userId]
            );
            
            if (rows.length > 0) {
                latestSummary = rows[0].summary;
                systemContext += `\n\nPATIENT FILE: ${latestSummary}\n(Use this file to personalize the response)`;
            }
        }

        // AI
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemContext },
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const aiText = completion.choices[0]?.message?.content || "No response";

        res.json({ reply: aiText });

        if (userId) {
            saveNewSummary(userId, latestSummary, message, aiText);
        }

    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ reply: "Error connecting to AI." });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});