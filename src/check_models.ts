import 'dotenv/config';

// Script to check available Gemini models
async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Error: NO_API_KEY found in .env (GEMINI_API_KEY or GOOGLE_API_KEY)");
    process.exit(1);
  }

  const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;

  console.log(`Querying: ${url.replace(apiKey, 'HIDDEN_KEY')}`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        console.error("API Error:", JSON.stringify(data, null, 2));
        return;
    }

    if (data.models) {
        console.log("\nAvailable Models:");
        data.models.forEach((m: any) => {
            if (m.name.includes('gemini')) {
                console.log(`- ${m.name} (${m.displayName}) - Supported generation methods: ${m.supportedGenerationMethods}`);
            }
        });
    } else {
        console.log("No models found in response:", data);
    }

  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

checkModels();
