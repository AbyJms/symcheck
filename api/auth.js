import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      msg: "Username and password are required",
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    // EXISTING USER
    if (result.rows.length > 0) {
      const user = result.rows[0];

      if (user.password === password) {
        return res.status(200).json({
          success: true,
          userId: user.id,
          username: user.username,
          msg: "Logged in successfully",
        });
      } else {
        return res.status(401).json({
          success: false,
          msg: "Incorrect password",
        });
      }
    }

    // NEW USER → SIGN UP
    const insert = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, password]
    );

    return res.status(201).json({
      success: true,
      userId: insert.rows[0].id,
      username,
      msg: "Account created successfully",
    });

  } catch (err) {
    console.error("Auth error:", err);

    return res.status(500).json({
      success: false,
      msg: "Internal server error",
    });
  }
}