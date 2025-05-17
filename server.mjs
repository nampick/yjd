import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/completion", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const completion = await openai.completions.create({
      model: "text-davinci-003",
      prompt,
      max_tokens: 200
    });
    res.json({ content: completion.choices[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenAI error", detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 