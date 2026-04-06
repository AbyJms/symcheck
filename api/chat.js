import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

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