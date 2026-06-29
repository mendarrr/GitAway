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
    // Check for Environment Key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing GROQ_API_KEY environment variable. Make sure your local .env file contains GROQ_API_KEY=gsk_..." })
      };
    }

    const { systemPrompt, messages } = JSON.parse(event.body);

    // Secure fallback strategy for global runtimes without built-in fetch configurations
    const fetchMethod = globalThis.fetch || global.fetch;
    if (!fetchMethod) {
      throw new Error("The active Node runtime version environment lacks a native global fetch client module.");
    }

    // 2. Execute external request to upstream Groq endpoints
    const response = await fetchMethod('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Groq Upstream Failure: ${errorText}` })
      };
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || 'No response generated.';

    // 3. Return clean context response
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ text: replyText })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: `Function Execution Interrupted: ${err.message}` })
    };
  }
};