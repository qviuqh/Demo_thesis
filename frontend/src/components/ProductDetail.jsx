// components/ProductDetail.jsx
import { useState } from "react";

const META_FIELDS = [
  ["gender",         "Gender"],
  ["masterCategory", "Category"],
  ["subCategory",    "Sub-Category"],
  ["articleType",    "Article Type"],
  ["baseColour",     "Colour"],
  ["season",         "Season"],
  ["usage",          "Usage"],
];

/**
 * ProductDetail — two-column layout: large image | metadata table.
 */
export default function ProductDetail({ product }) {
  const [imgError, setImgError] = useState(false);
  const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  if (!product) return null;

  return (
    <div className="product-detail">
      {/* Left — large image */}
      <div className="detail-img-wrap">
        <img
          src={imgError ? `${BASE}/images/placeholder.jpg` : product.image_url}
          alt={product.productDisplayName}
          onError={() => setImgError(true)}
        />
      </div>

      {/* Right — metadata */}
      <div className="detail-info">
        <h2 className="detail-name">{product.productDisplayName}</h2>
        <p className="detail-id">ID: {product.id}</p>

        <table className="detail-table">
          <tbody>
            {META_FIELDS.map(([key, label]) =>
              product[key] ? (
                <tr key={key}>
                  <th>{label}</th>
                  <td>{product[key]}</td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>

        {product.description && product.description !== "nan" && (
          <p className="detail-desc">{product.description}</p>
        )}
      </div>
    </div>
  );
}
