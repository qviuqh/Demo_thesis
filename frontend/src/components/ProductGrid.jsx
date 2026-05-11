// components/ProductGrid.jsx
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, selectedId, onSelect }) {
  if (!products?.length) {
    return <p className="empty-msg">No products found.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={product.id === selectedId}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}
