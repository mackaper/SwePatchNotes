require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }
  console.log("API Key found (starts with):", apiKey.substring(0, 5));

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash"
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      console.log(`${modelName} response:`, result.response.text());
    } catch (error) {
      console.error(`Error testing ${modelName}:`, error.message);
    }
  }
}

test();
