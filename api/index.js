export const config = {
  runtime: "nodejs"
};

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// AUTH
app.post("/auth", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      if (user.password === password) {
        res.json({
          success: true,
          userId: user.id,
          username: user.username,
          msg: "Logged in successfully!",
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Username taken, wrong password.",
        });
      }
    } else {
      const insert = await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
        [username, password]
      );

      res.json({
        success: true,
        userId: insert.rows[0].id,
        username,
        msg: "Account created & logged in!",
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HISTORY
async function saveNewSummary(userId, oldSummary, userMsg, aiMsg) {
  const prompt = `
Previous Patient Summary: "${oldSummary || "None"}"

Current Interaction:
Patient: "${userMsg}"
Doctor: "${aiMsg}"

[TASK]: Update the patient's medical summary.

[RULES]:
1. Remove recovered symptoms
2. Keep allergies, chronic conditions, meds
3. Add new issues
4. Keep under 50 words
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const newSummary = completion.choices[0]?.message?.content;

    await pool.query(
      "INSERT INTO history (user_id, summary) VALUES ($1, $2)",
      [userId, newSummary]
    );
  } catch (err) {
    console.error("Summary failed:", err);
  }
}

// CHAT
app.post("/chat", async (req, res) => {
  const { message, userId } = req.body;

  try {
    let systemContext =
      "You are SymCheck medical assistant. Keep answers under 100 words.";

    let latestSummary = "";

    if (userId) {
      const result = await pool.query(
        "SELECT summary FROM history WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
        [userId]
      );

      if (result.rows.length > 0) {
        latestSummary = result.rows[0].summary;
        systemContext += `\nPATIENT FILE: ${latestSummary}`;
      }
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const aiText = completion.choices[0]?.message?.content || "No response";

    res.json({ reply: aiText });

    if (userId) {
      saveNewSummary(userId, latestSummary, message, aiText);
    }
  } catch (error) {
    res.status(500).json({ reply: "Error connecting to AI." });
  }
});

export default app;