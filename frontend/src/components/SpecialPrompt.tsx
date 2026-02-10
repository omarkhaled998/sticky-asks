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

  const moveNoButton = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent click from registering on mobile
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!noButtonRef.current) return;
    
    const button = noButtonRef.current.getBoundingClientRect();
    const buttonWidth = button.width || 100;
    const buttonHeight = button.height || 50;
    
    // Use viewport dimensions with padding to keep button visible
    const padding = 20;
    const maxX = window.innerWidth - buttonWidth - padding;
    const maxY = window.innerHeight - buttonHeight - padding;
    
    // Generate random position within safe viewport bounds
    const randomX = Math.max(padding, Math.random() * maxX);
    const randomY = Math.max(padding, Math.random() * maxY);
    
    // Use fixed positioning to keep it in viewport
    noButtonRef.current.style.position = "fixed";
    noButtonRef.current.style.left = `${randomX}px`;
    noButtonRef.current.style.top = `${randomY}px`;
    noButtonRef.current.style.transition = "all 0.2s ease-out";
    noButtonRef.current.style.zIndex = "10000";
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
            onMouseEnter={moveNoButton}
            onMouseDown={moveNoButton}
            onTouchStart={moveNoButton}
            onTouchMove={moveNoButton}
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
