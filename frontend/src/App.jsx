// App.jsx — main state management, routing, and pagination
import { useEffect, useRef, useState } from "react";
import { api } from "./api/api";
import ProductGrid from "./components/ProductGrid";
import ProductDetail from "./components/ProductDetail";
import RecommendationList from "./components/RecommendationList";
import Pagination from "./components/Pagination";

const LIMIT = 60; // products per page

export default function App() {
  // ── Backend ────────────────────────────────────────────
  const [backendOk,   setBackendOk]   = useState(null); // null=checking
  const [numProducts, setNumProducts] = useState(0);

  // ── Routing ────────────────────────────────────────────
  // view: 'catalog' | 'product'
  const [view, setView] = useState("catalog");

  // ── Catalog + Pagination ───────────────────────────────
  const [catalog,        setCatalog]        = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [currentPage,    setCurrentPage]    = useState(1);

  const totalPages = numProducts > 0 ? Math.ceil(numProducts / LIMIT) : 1;

  // ── Product detail ─────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading,      setRecLoading]      = useState(false);
  const [recError,        setRecError]        = useState("");

  const topRef = useRef(null);

  // ── Health check (once) ────────────────────────────────
  useEffect(() => {
    api.health()
      .then((data) => {
        setBackendOk(true);
        setNumProducts(data.num_products);
      })
      .catch(() => setBackendOk(false));
  }, []);

  // ── Load catalog whenever page changes ─────────────────
  useEffect(() => {
    setCatalogLoading(true);
    const offset = (currentPage - 1) * LIMIT;
    api.listProducts(LIMIT, offset)
      .then((data) => setCatalog(data.products))
      .catch(console.error)
      .finally(() => setCatalogLoading(false));
  }, [currentPage]);

  // ── Handlers ───────────────────────────────────────────
  async function handleSelectProduct(product) {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    setView("product");
    setSelectedProduct(product);
    setRecommendations([]);
    setRecError("");
    setRecLoading(true);

    try {
      const data = await api.recommend(product.id, 10);
      setSelectedProduct(data.query); // enriched query from backend
      setRecommendations(data.recommendations);
    } catch (err) {
      setRecError(err.message);
    } finally {
      setRecLoading(false);
    }
  }

  function handleBack() {
    setView("catalog");
    setSelectedProduct(null);
    setRecommendations([]);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handlePageChange(page) {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="app-header" ref={topRef}>
        <div className="header-left">
          {view === "product" && (
            <button className="back-btn" onClick={handleBack} title="Back to catalog">
              ← Back
            </button>
          )}
          <span className="header-logo">✦</span>
          <div>
            <h1>Visual-Semantic Fashion Retrieval</h1>
            <p className="header-sub">
              Multimodal Item-to-Item Recommendation · Thesis Demo
            </p>
          </div>
        </div>

        <div className="header-right">
          {backendOk === null && (
            <span className="status checking">● Connecting…</span>
          )}
          {backendOk === true && (
            <span className="status connected">
              ● Backend connected
            </span>
          )}
          {backendOk === false && (
            <span className="status error">● Backend offline</span>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="app-main">

        {/* ════════════ CATALOG VIEW ════════════ */}
        {view === "catalog" && (
          <section className="section">
            <div className="section-label">
              Product Catalog
              <span className="section-hint">
                {" "}— click any item to see recommendations
              </span>
            </div>

            {catalogLoading ? (
              <p className="loading-text">Loading catalog…</p>
            ) : (
              <>
                <ProductGrid
                  products={catalog}
                  selectedId={selectedProduct?.id}
                  onSelect={handleSelectProduct}
                />

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </section>
        )}

        {/* ════════════ PRODUCT VIEW ════════════ */}
        {view === "product" && selectedProduct && (
          <>
            {/* Breadcrumb */}
            <nav className="breadcrumb">
              <button className="breadcrumb-link" onClick={handleBack}>
                Catalog
              </button>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">
                {selectedProduct.productDisplayName}
              </span>
            </nav>

            {/* Selected item */}
            <section className="section">
              <div className="section-label">Selected Item</div>
              <ProductDetail product={selectedProduct} />
            </section>

            {/* Recommendations */}
            <section className="section">
              <div className="section-label">Top-10 Recommendations</div>

              {recLoading && (
                <div className="loading-bar">
                  <div className="loading-bar-fill" />
                  <p>Searching embedding space…</p>
                </div>
              )}
              {recError && <p className="error-msg">Error: {recError}</p>}
              {!recLoading && !recError && (
                <RecommendationList
                  recommendations={recommendations}
                  onSelect={handleSelectProduct}
                />
              )}
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        Multimodal Visual-Semantic Retrieval for Fashion · Thesis Defense Demo
      </footer>
    </div>
  );
}