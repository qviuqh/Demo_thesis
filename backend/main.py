"""
FastAPI Backend — Multimodal Visual-Semantic Retrieval for Fashion
Demo for Thesis Defense
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import pandas as pd
import numpy as np
import faiss
import os

# Paths
BASE_DIR      = Path(__file__).parent
CSV_PATH      = BASE_DIR / "demo_products.csv"
EMB_PATH      = BASE_DIR / "demo_embeddings.npy"
INDEX_PATH    = BASE_DIR / "demo_faiss.index"
IMAGES_DIR    = BASE_DIR / "demo_images"
PLACEHOLDER   = IMAGES_DIR / "placeholder.jpg"


# Startup: load artifacts once into memory

print("Loading artifacts …")
df          = pd.read_csv(CSV_PATH)
embeddings  = np.load(EMB_PATH).astype("float32")
index       = faiss.read_index(str(INDEX_PATH))

# Critical integrity check
assert len(df) == embeddings.shape[0] == index.ntotal, (
    f"Size mismatch: df={len(df)}, emb={embeddings.shape[0]}, "
    f"faiss={index.ntotal}"
)

# Build fast lookup: item_id → row position
id_to_idx = {int(row["id"]): i for i, row in df.iterrows()}

EMBEDDING_DIM = embeddings.shape[1]
print(f"  ✓ {len(df):,} products  |  dim={EMBEDDING_DIM}  |  FAISS ntotal={index.ntotal}")



# Helpers

def row_to_dict(row: pd.Series, base_url: str = "http://localhost:8000") -> dict:
    """Convert a DataFrame row to a clean product dict."""
    item_id = int(row["id"])
    return {
        "id":                 item_id,
        "productDisplayName": str(row.get("productDisplayName", "")),
        "gender":             str(row.get("gender", "")),
        "masterCategory":     str(row.get("masterCategory", "")),
        "subCategory":        str(row.get("subCategory", "")),
        "articleType":        str(row.get("articleType", "")),
        "baseColour":         str(row.get("baseColour", "")),
        "season":             str(row.get("season", "")),
        "usage":              str(row.get("usage", "")),
        "description":        str(row.get("productDescription", row.get("description", ""))),
        "image_url":          f"{base_url}/images/{item_id}.jpg",
    }


def compute_grade(q: pd.Series, c: pd.Series) -> int:
    """
    Graded relevance as defined in thesis Chapter 3.
    Hard boundary on masterCategory; score remaining attributes.
    """
    if str(q.get("masterCategory", "")) != str(c.get("masterCategory", "")):
        return 0

    score = 0
    if str(q.get("articleType", "")) == str(c.get("articleType", "")): score += 3
    if str(q.get("gender",      "")) == str(c.get("gender",      "")): score += 2
    if str(q.get("usage",       "")) == str(c.get("usage",       "")): score += 2
    if str(q.get("baseColour",  "")) == str(c.get("baseColour",  "")): score += 1
    if str(q.get("season",      "")) == str(c.get("season",      "")): score += 1

    if score >= 7: return 3   # Highly Relevant
    if score >= 5: return 2   # Relevant
    if score >= 3: return 1   # Partially Relevant
    return 0                  # Not Relevant


GRADE_LABELS = {3: "Highly Relevant", 2: "Relevant", 1: "Partially Relevant", 0: "Not Relevant"}



# App

app = FastAPI(
    title="Fashion Retrieval Demo API",
    description="Visual-Semantic Item-to-Item Recommendation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve product images as static files
app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")



# Endpoints


@app.get("/health")
def health():
    """Backend liveness check — called by frontend to show 'connected' badge."""
    return {
        "status":        "ok",
        "num_products":  len(df),
        "embedding_dim": EMBEDDING_DIM,
    }


@app.get("/products")
def list_products(
    limit:  int = Query(default=60, ge=1, le=200),
    offset: int = Query(default=0,  ge=0),
):
    """
    Paginated product catalog.
    Returns slim product cards (no description) for the grid view.
    """
    subset = df.iloc[offset: offset + limit]
    products = [row_to_dict(row) for _, row in subset.iterrows()]
    return {
        "total":    len(df),
        "offset":   offset,
        "limit":    limit,
        "products": products,
    }


@app.get("/products/{item_id}")
def get_product(item_id: int):
    """Full product detail for a single item."""
    if item_id not in id_to_idx:
        raise HTTPException(status_code=404, detail=f"Product {item_id} not found")
    row = df.iloc[id_to_idx[item_id]]
    return row_to_dict(row)


@app.get("/recommend/{item_id}")
def recommend(
    item_id: int,
    k:       int = Query(default=10, ge=1, le=50),
):
    """
    Top-K nearest-neighbor recommendations via FAISS.

    Returns:
      - query: full product dict
      - recommendations: list of k products with rank, similarity, grade, grade_label
    """
    if item_id not in id_to_idx:
        raise HTTPException(status_code=404, detail=f"Product {item_id} not found")

    query_idx = id_to_idx[item_id]
    query_row = df.iloc[query_idx]
    query_vec = embeddings[query_idx].reshape(1, -1)

    # Search with extra buffer to account for self-exclusion
    n_search  = min(k + 20, index.ntotal)
    scores, indices = index.search(query_vec, n_search)

    results    = []
    rank       = 1

    for score, idx in zip(scores[0], indices[0]):
        if idx == query_idx:          # skip the query item itself
            continue
        if idx < 0 or idx >= len(df): # FAISS sentinel -1
            continue

        cand_row  = df.iloc[idx]
        grade     = compute_grade(query_row, cand_row)
        prod_dict = row_to_dict(cand_row)

        results.append({
            "rank":        rank,
            "similarity":  round(float(score), 4),
            "grade":       grade,
            "grade_label": GRADE_LABELS[grade],
            **prod_dict,
        })
        rank += 1

        if rank > k:
            break

    return {
        "query":           row_to_dict(query_row),
        "recommendations": results,
    }