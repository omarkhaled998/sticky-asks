import { useState, useRef, useCallback } from "react";
import { sendSpecialResponse } from "../api/special";
import "./SpecialPrompt.css";

interface SpecialPromptProps {
  userEmail: string;
}

export function SpecialPrompt({ userEmail }: SpecialPromptProps) {
  const [responded, setResponded] = useState(false);
  const [response, setResponse] = useState<"yes" | "no" | null>(null);
  const [sending, setSending] = useState(false);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const moveNoButton = useCallback(() => {
    if (!noButtonRef.current || !containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const button = noButtonRef.current.getBoundingClientRect();
    
    // Calculate random position within container bounds
    const maxX = container.width - button.width - 40;
    const maxY = container.height - button.height - 40;
    
    const randomX = Math.max(20, Math.random() * maxX);
    const randomY = Math.max(20, Math.random() * maxY);
    
    noButtonRef.current.style.position = "absolute";
    noButtonRef.current.style.left = `${randomX}px`;
    noButtonRef.current.style.top = `${randomY}px`;
    noButtonRef.current.style.transition = "all 0.15s ease-out";
  }, []);

  const handleYes = async () => {
    setSending(true);
    try {
      await sendSpecialResponse("yes");
      setResponse("yes");
      setResponded(true);
    } catch (error) {
      console.error("Failed to send response:", error);
      // Still show the response locally
      setResponse("yes");
      setResponded(true);
    }
    setSending(false);
  };

  const handleNo = async () => {
    setSending(true);
    try {
      await sendSpecialResponse("no");
      setResponse("no");
      setResponded(true);
    } catch (error) {
      console.error("Failed to send response:", error);
      setResponse("no");
      setResponded(true);
    }
    setSending(false);
  };

  if (responded) {
    return (
      <div className="special-prompt-container">
        <div className="special-prompt-card response-card">
          {response === "yes" ? (
            <>
              <div className="response-emoji">💕</div>
              <h1>Yay! 🎉</h1>
              <p className="response-message">
                I can't wait! Get ready for an amazing evening together. 
                I'll make sure it's unforgettable! 💑
              </p>
              <div className="hearts-animation">
                <span>❤️</span>
                <span>💕</span>
                <span>💖</span>
                <span>💗</span>
                <span>💓</span>
              </div>
            </>
          ) : (
            <>
              <div className="response-emoji">🥺</div>
              <h1>Wait... really?</h1>
              <p className="response-message">
                I thought you couldn't say no! 😢
                <br />
                (But I'll keep trying! 💪)
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="special-prompt-container" ref={containerRef}>
      <div className="special-prompt-card">
        <div className="romantic-icon">💝</div>
        <h1>Hey there, beautiful! ✨</h1>
        <p className="romantic-message">
          I've been thinking about how lucky I am to have you… and I'd love to 
          steal you away for dinner tonight. Just you, me, and a table where I 
          get to fall in love with you all over again.
        </p>
        <p className="question">Would you go out for dinner with me? 🌹</p>
        
        <div className="button-container">
          <button 
            className="btn-yes" 
            onClick={handleYes}
            disabled={sending}
          >
            {sending ? "..." : "Yes! 💕"}
          </button>
          <button 
            ref={noButtonRef}
            className="btn-no" 
            onClick={handleNo}
            onMouseEnter={moveNoButton}
            onTouchStart={moveNoButton}
            disabled={sending}
          >
            No
          </button>
        </div>
      </div>
      
      <div className="floating-hearts">
        <span style={{ animationDelay: "0s" }}>💕</span>
        <span style={{ animationDelay: "1s" }}>❤️</span>
        <span style={{ animationDelay: "2s" }}>💖</span>
        <span style={{ animationDelay: "0.5s" }}>💗</span>
        <span style={{ animationDelay: "1.5s" }}>💓</span>
      </div>
    </div>
  );
}
