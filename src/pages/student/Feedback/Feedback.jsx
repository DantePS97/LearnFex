import React, { useState, useEffect } from "react";
import "./Feedback.css";

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);

  // Cargar feedbacks guardados
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("feedbacks")) || [];
    setFeedbacks(stored);
  }, []);

  // Guardar nuevo feedback
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message || rating === 0) return;

    const newFeedback = {
      id: Date.now(),
      message,
      rating,
    };

    const updated = [...feedbacks, newFeedback];
    setFeedbacks(updated);
    localStorage.setItem("feedbacks", JSON.stringify(updated));

    setMessage("");
    setRating(0);
  };

  return (
    <div className="feedback-container">
      <h2>💬 Feedback</h2>

      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Escribe tu opinión..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={star <= rating ? "active" : ""}
              onClick={() => setRating(star)}
            >
              ⭐
            </span>
          ))}
        </div>

        <button type="submit">Enviar</button>
      </form>

      <div className="feedback-list">
        <h3>Opiniones</h3>
        {feedbacks.length === 0 ? (
          <p>No hay comentarios aún.</p>
        ) : (
          feedbacks.map((fb) => (
            <div key={fb.id} className="feedback-item">
              <p>{fb.message}</p>
              <span>{"⭐".repeat(fb.rating)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feedback;
