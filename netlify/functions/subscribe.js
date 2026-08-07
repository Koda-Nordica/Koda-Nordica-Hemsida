// Netlify Function
// Denna fil ska ligga i: netlify/functions/subscribe.js (i repots rot)
// Den blir automatiskt tillgänglig på: /.netlify/functions/subscribe

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

  let email;
  try {
    const body = JSON.parse(event.body);
    email = body.email;
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Ogiltig förfrågan" }) };
  }

  if (!email || !email.includes("@")) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Ogiltig e-postadress" }) };
  }

  // BREVO_LIST_ID: byt ut mot ditt riktiga List ID (siffra, hittas i Brevo under Contacts > Lists)
  const BREVO_LIST_ID = 5;

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    });

    if (!res.ok && res.status !== 400) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Kunde inte lägga till kontakten" }) };
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Serverfel" }) };
  }
};
