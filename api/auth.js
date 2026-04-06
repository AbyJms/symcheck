import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

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
        });
      } else {
        return res.status(401).json({ error: "Wrong password" });
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
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}