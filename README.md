# Briefly

Briefly is a focused, streaming text summarizer built with Next.js. Paste in an article, report, or meeting notes; choose a quick take, key points, or a deeper recap; and watch the summary arrive as it is generated.

## Run locally

1. Install Node.js 20.9 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set either `GEMINI_API_KEY` (optionally `GEMINI_MODEL`, defaults to `gemini-flash-lite-latest`) or `OPENAI_API_KEY` (optionally `OPENAI_MODEL`, defaults to `gpt-4o-mini`). When both keys are present, Gemini is used.
4. Start the development server with `npm run dev`, then open `http://localhost:3000`.

The API key is read only by the backend route and must never be added to a `NEXT_PUBLIC_` variable. The API accepts up to 20,000 characters per request and streams the model's response.

## Deploy

Import this project into Vercel (or another Next.js host), set `GEMINI_API_KEY` or `OPENAI_API_KEY` in the deployment's server environment variables, and deploy. Set the corresponding model variable only if you want to use a model other than the default. Test a valid summary and the empty-input validation on the deployed URL.
