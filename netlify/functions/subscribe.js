exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let email;
  try {
    const body = JSON.parse(event.body || "{}");
    email = (body.email || "").trim();
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Ogiltig förfrågan" }),
    };
  }

  if (!email || !email.includes("@")) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Ogiltig e-postadress" }),
    };
  }

  const BREVO_LIST_ID = 5; // ← byt till ditt riktiga List ID
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error("BREVO_API_KEY saknas i miljövariabler");
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Serverkonfiguration saknas" }),
    };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email,
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    });

    const responseText = await res.text();
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch {}

    console.log("Brevo status:", res.status, data);

    // 201 = skapad, 204 = uppdaterad
    if (res.ok || res.status === 201 || res.status === 204) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true }),
      };
    }

    // Redan finns → behandla som success
    if (
      res.status === 400 &&
      (data.code === "duplicate_parameter" ||
        (responseText && responseText.toLowerCase().includes("already")))
    ) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: "Redan registrerad" }),
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Kunde inte lägga till kontakten",
        details: data.message || data.code || responseText || "Okänt fel",
      }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Serverfel", details: err.message }),
    };
  }
};
