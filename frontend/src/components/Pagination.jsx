// components/Pagination.jsx
// Smart pagination: shows first, last, current ± 2, with ellipsis gaps

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build the sequence of page numbers + ellipsis markers
  function buildRange() {
    const delta = 2; // pages shown on each side of current
    const range = [];

    // Middle pages (around current)
    const left  = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    for (let i = left; i <= right; i++) range.push(i);

    // Ellipsis left gap
    if (left > 2)          range.unshift("…left");
    // Ellipsis right gap
    if (right < totalPages - 1) range.push("…right");

    // Always include first and last
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);

    return range;
  }

  const pages = buildRange();

  return (
    <nav className="pagination" aria-label="Catalog pages">
      {/* Prev */}
      <button
        className="page-btn page-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        typeof page === "string" ? (
          <span key={page} className="page-ellipsis">…</span>
        ) : (
          <button
            key={page}
            className={`page-btn ${page === currentPage ? "active" : ""}`}
            onClick={() => page !== currentPage && onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        className="page-btn page-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}
