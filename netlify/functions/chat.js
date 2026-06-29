// netlify/functions/chat.js

exports.handler = async (event) => {
  // 1. Handle CORS Preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const { systemPrompt, messages } = JSON.parse(event.body);

    // 2. Call Groq API (Using Llama 3 8B model which has an excellent free tier)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", 
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API Error: ${errorData}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || 'No response generated.';

    // 3. Return response back to your frontend
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ text: replyText })
    };

  } catch (err) {
    console.error("Backend Error:", err.message);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};