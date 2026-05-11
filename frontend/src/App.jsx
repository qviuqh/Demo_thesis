// App.jsx — main state management and layout
import { useEffect, useRef, useState } from "react";
import { api } from "./api/api";
import ProductGrid from "./components/ProductGrid";
import ProductDetail from "./components/ProductDetail";
import RecommendationList from "./components/RecommendationList";

export default function App() {
  // ── State ──────────────────────────────────────────────
  const [backendOk,      setBackendOk]      = useState(null);  // null=checking, true/false
  const [numProducts,    setNumProducts]    = useState(0);
  const [catalog,        setCatalog]        = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading,      setRecLoading]      = useState(false);
  const [recError,        setRecError]        = useState("");

  const topRef = useRef(null);

  // ── Load on mount ──────────────────────────────────────
  useEffect(() => {
    // Health check
    api.health()
      .then((data) => { setBackendOk(true); setNumProducts(data.num_products); })
      .catch(() => setBackendOk(false));

    // Catalog
    api.listProducts(60, 0)
      .then((data) => setCatalog(data.products))
      .catch(console.error)
      .finally(() => setCatalogLoading(false));
  }, []);

  // ── Handlers ───────────────────────────────────────────
  async function handleSelectProduct(product) {
    // Scroll to top smoothly
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    setSelectedProduct(product);
    setRecommendations([]);
    setRecError("");
    setRecLoading(true);

    try {
      const data = await api.recommend(product.id, 10);
      setSelectedProduct(data.query);   // use enriched query from backend
      setRecommendations(data.recommendations);
    } catch (err) {
      setRecError(err.message);
    } finally {
      setRecLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header" ref={topRef}>
        <div className="header-left">
          <span className="header-logo">✦</span>
          <div>
            <h1>Visual-Semantic Fashion Retrieval</h1>
            <p className="header-sub">Multimodal Item-to-Item Recommendation · Thesis Demo</p>
          </div>
        </div>
        <div className="header-right">
          {backendOk === null && <span className="status checking">● Connecting…</span>}
          {backendOk === true  && (
            <span className="status connected">
              ● Backend connected · {numProducts.toLocaleString()} products
            </span>
          )}
          {backendOk === false && <span className="status error">● Backend offline</span>}
        </div>
      </header>

      <main className="app-main">
        {/* ── Selected product detail + recommendations ── */}
        {selectedProduct && (
          <>
            <section className="section">
              <div className="section-label">Selected Item</div>
              <ProductDetail product={selectedProduct} />
            </section>

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

        {/* ── Catalog ── */}
        <section className="section">
          <div className="section-label">
            Product Catalog
            {!selectedProduct && (
              <span className="section-hint"> — click any item to see recommendations</span>
            )}
          </div>
          {catalogLoading
            ? <p className="loading-text">Loading catalog…</p>
            : <ProductGrid
                products={catalog}
                selectedId={selectedProduct?.id}
                onSelect={handleSelectProduct}
              />
          }
        </section>
      </main>

      <footer className="app-footer">
        Multimodal Visual-Semantic Retrieval for Fashion · Thesis Defense Demo
      </footer>
    </div>
  );
}
