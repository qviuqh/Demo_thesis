# Fashion Retrieval Demo

**Multimodal Visual-Semantic Retrieval for Fashion Item Recommendation**  
*Thesis Defense Demo — Item-to-Item Recommendation using Precomputed Embeddings*

---

## Prerequisites

| Tool | Min Version |
|------|-------------|
| Python | 3.10 |
| Node.js | 18 |
| pip | – |
| npm | – |

---

## Quick Start

### Step 1 — Prepare artifacts (Kaggle / Colab)

Run `backend/prepare_artifacts.py` in your Kaggle notebook, then download:

```
demo_products.csv
demo_embeddings.npy
demo_faiss.index
demo_images/
```

Place all of them inside `backend/`.

### Step 2 — Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verify:** http://localhost:8000/health  
**API docs:** http://localhost:8000/docs

### Step 3 — Start Frontend

```bash
cd frontend
npm install
npm run dev
```

**Open:** http://localhost:5173

---

## Integrity Check

The backend performs this check on startup and will crash loudly if it fails:

```
len(demo_products.csv) == demo_embeddings.npy.shape[0] == demo_faiss.index.ntotal
```

This ensures metadata, embeddings, and FAISS index are in the same order.

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Backend liveness + stats |
| `/products?limit=60&offset=0` | GET | Paginated product catalog |
| `/products/{item_id}` | GET | Single product detail |
| `/recommend/{item_id}?k=10` | GET | Top-K similar items |
| `/images/{filename}` | GET | Serve product image |

---

## Graded Relevance Logic

| Score | Grade | Label |
|-------|-------|-------|
| ≥ 7 | 3 | Highly Relevant |
| ≥ 5 | 2 | Relevant |
| ≥ 3 | 1 | Partially Relevant |
| < 3 | 0 | Not Relevant |

Scoring breakdown: `articleType` (+3) · `gender` (+2) · `usage` (+2) · `baseColour` (+1) · `season` (+1)  
Hard boundary: different `masterCategory` → Grade 0 immediately.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Backend: offline (red badge) | Check uvicorn is running on port 8000 |
| Broken images | Ensure `placeholder.jpg` is in `demo_images/` |
| `AssertionError` on startup | Re-run `prepare_artifacts.py` and re-download |
| CORS error in browser console | Add your frontend URL to `allow_origins` in `main.py` |
| `faiss-cpu` install fails (Windows) | `conda install -c pytorch faiss-cpu` |
| Grade 0 for all results | Check CSV has `masterCategory` column |
