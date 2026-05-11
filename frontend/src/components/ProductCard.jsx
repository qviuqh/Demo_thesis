// components/ProductCard.jsx
import { useState } from "react";

const GRADE_CONFIG = {
  3: { label: "Highly Relevant", color: "#16a34a" },
  2: { label: "Relevant",        color: "#2563eb" },
  1: { label: "Partial",         color: "#d97706" },
  0: { label: "Not Relevant",    color: "#9ca3af" },
};

/**
 * ProductCard — used in both catalog grid and recommendation list.
 *
 * Props:
 *   product     — product object from API
 *   onClick     — called with product when card is clicked
 *   isSelected  — highlight border when this card is the active query
 *   showScore   — show similarity + grade badge (recommendation mode)
 */
export default function ProductCard({ product, onClick, isSelected, showScore }) {
  const [imgError, setImgError] = useState(false);
  const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const grade = GRADE_CONFIG[product.grade] ?? null;

  return (
    <div
      className={`product-card ${isSelected ? "selected" : ""}`}
      onClick={() => onClick?.(product)}
      title={product.productDisplayName}
    >
      {/* ── Image ── */}
      <div className="card-img-wrap">
        <img
          src={imgError ? `${BASE}/images/placeholder.jpg` : product.image_url}
          alt={product.productDisplayName}
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {showScore && product.similarity != null && (
          <div className="score-badge">
            {(product.similarity * 100).toFixed(1)}%
          </div>
        )}
      </div>

      {/* ── Text ── */}
      <div className="card-body">
        <p className="card-name">{product.productDisplayName}</p>
        <p className="card-meta">{product.articleType}</p>
        <p className="card-meta secondary">
          {[product.gender, product.usage, product.baseColour]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Grade badge — recommendation mode only */}
        {showScore && grade && (
          <span className="grade-badge" style={{ color: grade.color, borderColor: grade.color }}>
            Grade {product.grade} — {grade.label}
          </span>
        )}
      </div>
    </div>
  );
}
