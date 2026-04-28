const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const volunteers = [
  { id: 1,  name: "Raj Kumar",  skills: ["medical", "first aid"],        available: true,  distance: 2  },
  { id: 2,  name: "Priya S",    skills: ["nursing", "medical"],           available: true,  distance: 5  },
  { id: 3,  name: "Arjun M",    skills: ["teaching", "tutoring"],         available: true,  distance: 3  },
  { id: 4,  name: "Divya R",    skills: ["counseling", "mental health"],  available: false, distance: 4  },
  { id: 5,  name: "Karthik V",  skills: ["logistics", "driving"],         available: true,  distance: 6  },
  { id: 6,  name: "Meena L",    skills: ["medical", "pharmacy"],          available: true,  distance: 3  },
  { id: 7,  name: "Suresh P",   skills: ["engineering", "construction"],  available: true,  distance: 8  },
  { id: 8,  name: "Anitha B",   skills: ["teaching", "childcare"],        available: true,  distance: 4  },
  { id: 9,  name: "Vijay N",    skills: ["it", "technical support"],      available: false, distance: 2  },
  { id: 10, name: "Lakshmi T",  skills: ["nursing", "elderly care"],      available: true,  distance: 7  },
];

const keywordMap = {
  medical:      ["medical", "first aid", "nursing", "pharmacy", "doctor", "health", "camp"],
  teaching:     ["teaching", "tutoring", "education", "school", "children", "childcare", "kids"],
  logistics:    ["logistics", "driving", "transport", "supply", "delivery", "flood", "relief"],
  it:           ["it", "technical", "computer", "software", "tech", "support"],
  counseling:   ["counseling", "mental", "health", "psychology", "stress"],
  engineering:  ["engineering", "construction", "building", "repair", "infrastructure"],
  nursing:      ["nursing", "nurse", "patient", "elderly", "care", "hospital"],
};

function matchVolunteers(message) {
  const msg = message.toLowerCase();
  const available = volunteers.filter(v => v.available);

  const scored = available.map(v => {
    let score = 0;
    for (const [category, keywords] of Object.entries(keywordMap)) {
      const msgMatch    = keywords.some(k => msg.includes(k));
      const skillMatch  = v.skills.some(s => keywords.includes(s) || keywords.some(k => s.includes(k)));
      if (msgMatch && skillMatch) score += 60;
      else if (skillMatch)        score += 20;
      else if (msgMatch)          score += 10;
    }
    // Distance penalty
    score -= v.distance * 2;
    // Add some variation
    score += Math.floor(Math.random() * 10);
    return { ...v, score: Math.min(99, Math.max(50, score)) };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

app.get("/", (req, res) => {
  res.json({ status: "✅ Volunteer Bot API is running!" });
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    // Try Gemini first
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a Volunteer Allocation Assistant.
Volunteers: ${JSON.stringify(volunteers.filter(v => v.available))}
Request: "${message}"
Return top 3-5 matches EXACTLY in this format, nothing else:
Here are the best matched volunteers:
- Name (Skill | Xkm away) — Match: XX%`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (response.ok && data.candidates) {
      const reply = data.candidates[0].content.parts[0].text;
      return res.json({ reply });
    }

    // Fallback to smart mock
    throw new Error("Gemini unavailable");

  } catch (error) {
    // Smart mock fallback
    const matched = matchVolunteers(message);
    let reply = "Here are the best matched volunteers:\n\n";
    matched.forEach(v => {
      const skill = v.skills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ");
      reply += `- ${v.name} (${skill} | ${v.distance}km away) — Match: ${v.score}%\n`;
    });
    res.json({ reply });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});