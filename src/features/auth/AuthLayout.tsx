import { useState, type MouseEvent, type ReactNode } from "react";
import { ArrowUpRight, Coffee, ListTodo, MessageSquare, Moon, Sun } from "lucide-react";
import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import { useTheme } from "@/lib/theme";
import "./auth.css";

const WEBSITE_URL = "https://zoe.w3dev.app";

export function AuthLayout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useTheme();
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  async function openWebsite(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setWebsiteError(null);
    try {
      if (isTauri()) {
        await open(WEBSITE_URL);
      } else {
        window.open(WEBSITE_URL, "_blank", "noopener,noreferrer");
      }
    } catch {
      setWebsiteError("Couldn’t open the website. Visit zoe.w3dev.app in your browser.");
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="auth-brand">
          <img src="/brand/zoe-agent.svg" alt="" width={36} height={36} />
          <span>Zoe Agent</span>
        </div>
        <button
          className="auth-theme-toggle"
          type="button"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
        </button>
      </header>

      <main className="auth-main">
        <section className="auth-intro" aria-labelledby="auth-intro-title">
          <div className="auth-intro-grid" aria-hidden="true" />
          <div className="auth-intro-content">
            <p className="auth-eyebrow">A calmer way to work</p>
            <h1 id="auth-intro-title">
              Make room for <span>focused work.</span>
            </h1>
            <p className="auth-intro-description">
              Your tasks, your team, and a little more clarity. Bring your workday together with Zoe.
            </p>
            <ul className="auth-features">
              <li>
                <span className="auth-feature-icon">
                  <ListTodo size={19} aria-hidden="true" />
                </span>
                <div>
                  <strong>Find your focus</strong>
                  <p>A clear plan for the work ahead.</p>
                </div>
              </li>
              <li>
                <span className="auth-feature-icon">
                  <MessageSquare size={19} aria-hidden="true" />
                </span>
                <div>
                  <strong>Stay in the loop</strong>
                  <p>Your team’s mentions, all in one place.</p>
                </div>
              </li>
              <li>
                <span className="auth-feature-icon">
                  <Coffee size={19} aria-hidden="true" />
                </span>
                <div>
                  <strong>Make space to recharge</strong>
                  <p>Step away. Come back with clarity.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>
        <section className="auth-card" aria-label="Zoe Agent sign in">
          {children}
        </section>
      </main>

      <footer className="auth-footer">
        <span>Your workday, a little clearer.</span>
        <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" onClick={openWebsite}>
          Meet Zoe <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        {websiteError && (
          <p className="auth-website-status" role="status">
            {websiteError}
          </p>
        )}
      </footer>
    </div>
  );
}
