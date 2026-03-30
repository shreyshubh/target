import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function MotivationalQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    // Pick a random quote on mount
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
    
    // Rotate every 10 seconds
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = QUOTES[quoteIndex];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(0, 206, 201, 0.05))',
      border: '1px solid rgba(108, 92, 231, 0.2)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-15px',
        left: '10px',
        fontSize: '80px',
        opacity: 0.1,
        color: '#6c5ce7',
        fontFamily: 'serif',
        userSelect: 'none'
      }}>
        "
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={quoteIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.5 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <p style={{ 
            fontSize: '18px', 
            color: '#e0e7ff', 
            margin: '0 0 12px 0', 
            fontStyle: 'italic', 
            fontWeight: 500,
            lineHeight: 1.5
          }}>
            "{currentQuote.text}"
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#a29bfe', 
            margin: 0, 
            fontWeight: 600 
          }}>
            — {currentQuote.author}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
