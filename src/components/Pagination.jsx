import './Pagination.css';

/**
 * Compute the list of page-number tokens to render.
 * Returns an array of numbers and the string '…' as an ellipsis marker.
 * Always includes the first page, the last page, the current page, and
 * up to one neighbour on each side of the current page.
 *
 * Examples (current=5, total=20):
 *   [1, '…', 4, 5, 6, '…', 20]
 * Examples (current=1, total=5):
 *   [1, 2, 3, 4, 5]
 *
 * @param {number} current  1-based current page
 * @param {number} total    total number of pages
 * @returns {Array<number|string>}
 */
function getPageNumbers(current, total) {
  if (total <= 7) {
    // Show all pages — no ellipsis needed
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  // Window: current ± 1
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  pages.push(1);

  if (rangeStart > 2) {
    pages.push('…');
  }

  for (let p = rangeStart; p <= rangeEnd; p++) {
    pages.push(p);
  }

  if (rangeEnd < total - 1) {
    pages.push('…');
  }

  pages.push(total);

  return pages;
}

/**
 * Pagination component.
 *
 * Props:
 *   currentPage   {number}  – 1-based current page (controlled from outside)
 *   totalItems    {number}  – total number of items to paginate
 *   pageSize      {number}  – items per page (default 10)
 *   onPageChange  {function} – called with the new page number
 *
 * Renders nothing when totalItems ≤ pageSize (single page → no pagination needed).
 */
export default function Pagination({ currentPage, totalItems, pageSize = 10, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Don't render when everything fits on one page
  if (totalItems <= pageSize) return null;

  // Clamp the current page to a valid range
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const pageNumbers = getPageNumbers(safePage, totalPages);

  return (
    <nav className="pagination-nav" aria-label="Transactions pagination">
      <span className="pagination-info">
        Showing {startItem}–{endItem} of {totalItems}
      </span>

      <div className="pagination-controls">
        {/* Previous */}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {/* Page number buttons */}
        {pageNumbers.map((token, idx) => {
          if (token === '…') {
            // Using idx as key is safe here — ellipsis positions are stable
            // relative to the fixed first/last page slots.
            return (
              <span
                key={`ellipsis-${idx}`}
                className="pagination-ellipsis"
                aria-hidden="true"
              >
                …
              </span>
            );
          }

          const isActive = token === safePage;
          return (
            <button
              key={token}
              className={`pagination-btn pagination-btn--page${isActive ? ' pagination-btn--active' : ''}`}
              onClick={() => !isActive && onPageChange(token)}
              aria-label={`Go to page ${token}`}
              aria-current={isActive ? 'page' : undefined}
              disabled={isActive}
            >
              {token}
            </button>
          );
        })}

        {/* Next */}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </nav>
  );
}
