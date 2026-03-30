import { useState, useEffect, useMemo } from 'react';
import './SplashScreen.css';

const QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Learn as if you will live forever, live like you will die tomorrow.", author: "Mahatma Gandhi" },
  { text: "It does not matter how slowly you go as long as you don't stop.", author: "Confucius" },
  { text: "Education is the passport to the future.", author: "Malcolm X" },
  { text: "The beautiful thing about learning is nobody can take it from you.", author: "B.B. King" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
];

const TIPS = [
  "💡 Use the Pomodoro timer for focused study sessions",
  "📊 Check your analytics dashboard for study insights",
  "✅ Break big topics into smaller checkboxes",
  "📅 Mark your attendance daily for better tracking",
  "🎯 Set daily goals in the To-Do section",
];

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Pick a random starting quote
  const startQuote = useMemo(() => Math.floor(Math.random() * QUOTES.length), []);

  // Simulated progress bar — slow ramp that feels real
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 1.2;
        if (prev < 60) return prev + 0.6;
        if (prev < 85) return prev + 0.3;
        if (prev < 95) return prev + 0.1;
        return prev; // Stall at 95 until server responds
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate tips every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[(startQuote + quoteIndex) % QUOTES.length];
  const tip = TIPS[tipIndex];

  return (
    <div className="splash-screen">
      {/* Animated background particles */}
      <div className="splash-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="splash-particle"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--size': `${Math.random() * 4 + 2}px`,
              '--duration': `${Math.random() * 8 + 4}s`,
              '--delay': `${Math.random() * 4}s`,
              '--opacity': Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Animated rings */}
      <div className="splash-rings">
        <div className="splash-ring splash-ring-1"></div>
        <div className="splash-ring splash-ring-2"></div>
        <div className="splash-ring splash-ring-3"></div>
      </div>

      {/* Main content */}
      <div className="splash-content">
        {/* Logo / Icon */}
        <div className="splash-logo">
          <div className="splash-logo-icon">
            <span className="splash-emoji">📚</span>
          </div>
          <h1 className="splash-title">CS Master Syllabus</h1>
          <p className="splash-subtitle">Preparing your workspace{dots}</p>
        </div>

        {/* Progress bar */}
        <div className="splash-progress-wrapper">
          <div className="splash-progress-track">
            <div
              className="splash-progress-fill"
              style={{ width: `${Math.min(progress, 98)}%` }}
            />
            <div className="splash-progress-glow" style={{ left: `${Math.min(progress, 98)}%` }} />
          </div>
          <div className="splash-progress-text">
            <span>Waking up the server</span>
            <span>{Math.round(Math.min(progress, 98))}%</span>
          </div>
        </div>

        {/* Status message */}
        <div className="splash-status">
          <div className="splash-status-dot"></div>
          <span>Free-tier servers sleep after inactivity — hang tight!</span>
        </div>

        {/* Motivational quote */}
        <div className="splash-quote" key={quoteIndex}>
          <p className="splash-quote-text">"{quote.text}"</p>
          <p className="splash-quote-author">— {quote.author}</p>
        </div>

        {/* Tip */}
        <div className="splash-tip" key={`tip-${tipIndex}`}>
          {tip}
        </div>
      </div>
    </div>
  );
}
