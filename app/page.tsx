"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const MAX_INPUT_LENGTH = 20_000;

const styles = [
  {
    id: "quick",
    label: "Quick take",
    detail: "A few clear sentences",
    icon: "↗",
  },
  {
    id: "bullets",
    label: "Key points",
    detail: "The essentials, at a glance",
    icon: "☷",
  },
  {
    id: "detailed",
    label: "Deep dive",
    detail: "A fuller, structured recap",
    icon: "≡",
  },
] as const;

type StyleId = (typeof styles)[number]["id"];

function readErrorMessage(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return null;
  }
  return typeof value.error === "string" ? value.error : null;
}

export default function Home() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<StyleId>("quick");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSummary("");

    if (!text.trim()) {
      setError("Paste in some text first — even a short passage works.");
      return;
    }

    if (text.length > MAX_INPUT_LENGTH) {
      setError(`That’s a little too much text. Keep it under ${MAX_INPUT_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        throw new Error(readErrorMessage(body) ?? "Something went wrong. Please try again.");
      }

      if (!response.body) {
        throw new Error("Your browser couldn’t read the streamed response. Please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          for (const line of eventChunk.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            let chunk: unknown;
            try {
              chunk = JSON.parse(data);
            } catch {
              throw new Error("The AI service sent an unreadable response. Please try again.");
            }

            if (
              typeof chunk === "object" &&
              chunk !== null &&
              "choices" in chunk &&
              Array.isArray(chunk.choices)
            ) {
              const firstChoice: unknown = chunk.choices[0];
              if (
                typeof firstChoice === "object" &&
                firstChoice !== null &&
                "delta" in firstChoice &&
                typeof firstChoice.delta === "object" &&
                firstChoice.delta !== null &&
                "content" in firstChoice.delta &&
                typeof firstChoice.delta.content === "string"
              ) {
                result += firstChoice.delta.content;
                setSummary(result);
              }
            }
          }
        }

        if (done) break;
      }

      if (!result.trim()) {
        throw new Error("No summary came back. Please try again.");
      }
    } catch (caught) {
      setSummary("");
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while creating your summary.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      setError("Couldn’t copy to your clipboard. You can still select the summary and copy it.");
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Briefly home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>briefly<span className="brand-period">.</span></span>
        </Link>
        <div className="topbar-note">
          <span className="status-dot" />
          A little more clarity, coming up
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><span>✳</span> YOUR PERSONAL READING ASSISTANT</div>
        <h1>Make sense of <span>more.</span></h1>
        <p className="hero-copy">
          Big article, long report, overflowing notes? Bring the words.<br className="desktop-break" />
          We’ll find the signal, so you can get on with your day.
        </p>
      </section>

      <form className="workspace" onSubmit={handleSubmit}>
        <section className="input-card" aria-labelledby="input-heading">
          <div className="card-heading">
            <div className="heading-label">
              <span className="step-number">01</span>
              <div>
                <h2 id="input-heading">Start with the text</h2>
                <p>Paste an article, meeting notes, or anything you want to understand faster.</p>
              </div>
            </div>
            <span className="private-note"><span aria-hidden="true">⌑</span> Private by design</span>
          </div>
          <label className="visually-hidden" htmlFor="source-text">Text to summarize</label>
          <textarea
            id="source-text"
            className="text-input"
            placeholder={"Drop your text here...\n\nA news article, research paper, meeting notes — if it has words, we can make it clearer."}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_INPUT_LENGTH + 1}
            disabled={isLoading}
          />
          <div className="input-footer">
            <span className={text.length > MAX_INPUT_LENGTH ? "count count-over" : "count"}>
              {text.length.toLocaleString()} / {MAX_INPUT_LENGTH.toLocaleString()}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setText("");
                setError("");
                setSummary("");
              }}
              disabled={!text || isLoading}
            >
              Clear text <span aria-hidden="true">×</span>
            </button>
          </div>
        </section>

        <section className="style-section" aria-labelledby="style-heading">
          <div className="section-title-row">
            <div className="heading-label">
              <span className="step-number">02</span>
              <div>
                <h2 id="style-heading">Pick your perspective</h2>
                <p>Same source, just the kind of summary you need right now.</p>
              </div>
            </div>
          </div>
          <div className="style-options">
            {styles.map((option) => (
              <button
                className={`style-option${style === option.id ? " selected" : ""}`}
                type="button"
                key={option.id}
                aria-pressed={style === option.id}
                onClick={() => setStyle(option.id)}
                disabled={isLoading}
              >
                <span className="style-icon" aria-hidden="true">{option.icon}</span>
                <span className="style-copy">
                  <span className="style-name">{option.label}</span>
                  <span className="style-detail">{option.detail}</span>
                </span>
                <span className="radio-indicator" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-icon" aria-hidden="true">!</span>
            <span>{error}</span>
          </div>
        )}

        <button className="submit-button" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              Finding the signal…
            </>
          ) : (
            <>
              Make it make sense
              <span className="button-arrow" aria-hidden="true">↗</span>
            </>
          )}
        </button>
        <p className="fine-print">Thoughtful summaries, without the extra noise.</p>
      </form>

      {(summary || isLoading) && (
        <section className="result-card" aria-labelledby="result-heading" aria-live="polite">
          <div className="result-heading">
            <div className="heading-label">
              <span className="result-sparkle" aria-hidden="true">✳</span>
              <div>
                <h2 id="result-heading">{isLoading && !summary ? "Finding the signal…" : "Here’s the gist"}</h2>
                <p>{isLoading ? "Your summary is taking shape." : "The important bits, without the extra noise."}</p>
              </div>
            </div>
            {!isLoading && summary && (
              <button className="copy-button" type="button" onClick={copySummary}>
                <span aria-hidden="true">▢</span> Copy summary
              </button>
            )}
          </div>
          {summary ? (
            <div className="summary-text">{summary}</div>
          ) : (
            <div className="loading-lines" aria-hidden="true">
              <span /><span /><span />
            </div>
          )}
          {isLoading && summary && <span className="streaming-cursor" aria-label="Summary still generating" />}
        </section>
      )}

      <footer className="footer">
        <span>Less wading, more knowing.</span>
        <span>Made for curious minds <span className="footer-heart">♥</span></span>
      </footer>
    </main>
  );
}
