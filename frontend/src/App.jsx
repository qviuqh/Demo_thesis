import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "./api/api";
import ProductGrid from "./components/ProductGrid";
import ProductDetail from "./components/ProductDetail";
import RecommendationList from "./components/RecommendationList";
import Pagination from "./components/Pagination";

const LIMIT = 60;

function getCatalogTarget(location) {
  return location.state?.from || "/";
}

export default function App() {
  const [backendOk, setBackendOk] = useState(null);
  const [numProducts, setNumProducts] = useState(0);
  const topRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isProductRoute = location.pathname.startsWith("/product/");
  const catalogTarget = getCatalogTarget(location);

  useEffect(() => {
    api
      .health()
      .then((data) => {
        setBackendOk(true);
        setNumProducts(data.num_products);
      })
      .catch(() => setBackendOk(false));
  }, []);

  function handleBackToCatalog() {
    navigate(catalogTarget);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="app">
      <header className="app-header" ref={topRef}>
        <div className="header-left">
          {isProductRoute && (
            <button
              className="back-btn"
              onClick={handleBackToCatalog}
              title="Back to catalog"
            >
              Back
            </button>
          )}
          <div>
            <h1>Visual-Semantic Fashion Retrieval</h1>
            <p className="header-sub">
              Multimodal Item-to-Item Recommendation - Thesis Demo
            </p>
          </div>
        </div>

        <div className="header-right">
          {backendOk === null && (
            <span className="status checking">Connecting...</span>
          )}
          {backendOk === true && (
            <span className="status connected">Backend connected</span>
          )}
          {backendOk === false && (
            <span className="status error">Backend offline</span>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={<CatalogPage numProducts={numProducts} topRef={topRef} />}
          />
          <Route path="/product/:productId" element={<ProductPage topRef={topRef} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        Multimodal Visual-Semantic Retrieval for Fashion
      </footer>
    </div>
  );
}

function CatalogPage({ numProducts, topRef }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const rawPage = searchParams.get("page");
  const pageFromUrl = rawPage === null ? 1 : Number(rawPage);
  const hasValidPage = Number.isInteger(pageFromUrl) && pageFromUrl > 0;
  const currentPage = hasValidPage ? pageFromUrl : 1;
  const totalPages = numProducts > 0 ? Math.ceil(numProducts / LIMIT) : 1;

  useEffect(() => {
    if (!hasValidPage) {
      setSearchParams({}, { replace: true });
    }
  }, [hasValidPage, setSearchParams]);

  useEffect(() => {
    if (numProducts > 0 && currentPage > totalPages) {
      if (totalPages <= 1) {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ page: String(totalPages) }, { replace: true });
      }
    }
  }, [currentPage, numProducts, setSearchParams, totalPages]);

  useEffect(() => {
    let ignore = false;

    setCatalogLoading(true);
    const offset = (currentPage - 1) * LIMIT;

    api
      .listProducts(LIMIT, offset)
      .then((data) => {
        if (!ignore) {
          setCatalog(data.products);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!ignore) {
          setCatalogLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [currentPage]);

  function handleSelectProduct(product) {
    navigate(`/product/${product.id}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  }

  function handlePageChange(page) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    navigate({
      pathname: "/",
      search: nextPage === 1 ? "" : `?page=${nextPage}`,
    });

    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="section">
      <div className="section-label">
        Product Catalog
        <span className="section-hint">
          {" "}
          - click any item to see recommendations
        </span>
      </div>

      {catalogLoading ? (
        <p className="loading-text">Loading catalog...</p>
      ) : (
        <>
          <ProductGrid products={catalog} onSelect={handleSelectProduct} />

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
  );
}

function ProductPage({ topRef }) {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState("");

  const catalogTarget = getCatalogTarget(location);

  useEffect(() => {
    let ignore = false;
    const numericProductId = Number(productId);

    topRef.current?.scrollIntoView({ behavior: "smooth" });
    setSelectedProduct(null);
    setRecommendations([]);
    setRecError("");

    if (!Number.isInteger(numericProductId) || numericProductId <= 0) {
      setRecLoading(false);
      setRecError("Invalid product ID.");
      return () => {
        ignore = true;
      };
    }

    setRecLoading(true);

    api
      .recommend(productId, 10)
      .then((data) => {
        if (!ignore) {
          setSelectedProduct(data.query);
          setRecommendations(data.recommendations);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setRecError(err.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setRecLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [productId, topRef]);

  function handleBack() {
    navigate(catalogTarget);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSelectProduct(product) {
    navigate(`/product/${product.id}`, {
      state: { from: catalogTarget },
    });
  }

  return (
    <>
      <nav className="breadcrumb">
        <button className="breadcrumb-link" onClick={handleBack}>
          Catalog
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">
          {selectedProduct?.productDisplayName || `Product ${productId}`}
        </span>
      </nav>

      {recLoading && !selectedProduct && (
        <section className="section">
          <p className="loading-text">Loading product...</p>
        </section>
      )}

      {recError && !selectedProduct && (
        <section className="section">
          <p className="error-msg">Error: {recError}</p>
        </section>
      )}

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
                <p>Searching embedding space...</p>
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
    </>
  );
}
