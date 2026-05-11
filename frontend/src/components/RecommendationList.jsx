// components/RecommendationList.jsx
import ProductCard from "./ProductCard";

/**
 * RecommendationList — horizontal scrollable list of top-K recommendations.
 * Each card shows similarity score + grade badge.
 */
export default function RecommendationList({ recommendations, onSelect }) {
  if (!recommendations?.length) return null;

  const gradeCount = [3, 2, 1, 0].map((g) => ({
    grade: g,
    count: recommendations.filter((r) => r.grade === g).length,
  }));

  return (
    <section className="rec-section">
      <div className="rec-header">
        <h3>Similar Products</h3>
        <div className="rec-stats">
          {gradeCount.map(({ grade, count }) =>
            count > 0 ? (
              <span key={grade} className={`stat-pill grade-${grade}`}>
                Grade {grade}: {count}
              </span>
            ) : null
          )}
        </div>
      </div>

      <div className="rec-scroll">
        {recommendations.map((rec) => (
          <ProductCard
            key={rec.id}
            product={rec}
            onClick={onSelect}
            showScore
          />
        ))}
      </div>
    </section>
  );
}
