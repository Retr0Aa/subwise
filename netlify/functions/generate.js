import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ text: "" }) };
  }

  try {
    const { username, subscriptions } = JSON.parse(event.body || "{}");

    if (!username || !subscriptions || !subscriptions.length) {
      return { statusCode: 400, body: JSON.stringify({ text: "" }) };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      `Give the user with name ${username} advice for his current subscriptions: ` +
      subscriptions.join(", ");

    const result = await model.generateContent(prompt);

    return {
      statusCode: 200,
      body: JSON.stringify({ text: result.response.text() || "" }),
    };
  } catch (e) {
    console.error("AI generate error:", e);
    return { statusCode: 500, body: JSON.stringify({ text: "Error generating AI advice." }) };
  }
}
