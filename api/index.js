import { Pool } from "pg";
import Groq from "groq-sdk";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  const { url, method } = req;

  // AUTH
  if (url.includes("/auth") && method === "POST") {
    const { username, password } = req.body;

    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];

        if (user.password === password) {
          return res.json({
            success: true,
            userId: user.id,
            username: user.username,
            msg: "Logged in successfully!",
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Wrong password.",
          });
        }
      } else {
        const insert = await pool.query(
          "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
          [username, password]
        );

        return res.json({
          success: true,
          userId: insert.rows[0].id,
          username,
          msg: "Account created!",
        });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // CHAT
  if (url.includes("/chat") && method === "POST") {
    const { message } = req.body;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: message }],
        model: "llama-3.3-70b-versatile",
      });

      const aiText = completion.choices[0]?.message?.content || "No response";

      return res.json({ reply: aiText });
    } catch (err) {
      return res.status(500).json({ error: "AI error" });
    }
  }

  return res.status(404).json({ error: "Not found" });
}