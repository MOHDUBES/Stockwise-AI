"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Upload, Trash2, Edit2, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { getProducts, deleteProduct, createProduct, uploadInventoryCSV } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency, STOCK_STATUS_BADGE, STOCK_STATUS_LABEL } from "@/lib/utils";

const CATEGORIES = [
  "Grains & Pulses","Dairy & Eggs","Beverages","Snacks & Confectionery",
  "Household & Cleaning","Personal Care","Spices & Condiments","Oils & Ghee","Other"
];

function UploadZone({ onUploaded }: { onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setStatus("Uploading...");
    try {
      const res = await uploadInventoryCSV(file);
      setStatus(`✅ Imported ${res.imported} products`);
      onUploaded();
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      style={{
        border: `2px dashed ${dragging ? "var(--accent-green)" : "var(--border)"}`,
        borderRadius: 10,
        padding: "20px 24px",
        textAlign: "center",
        background: dragging ? "rgba(0,229,160,0.04)" : "var(--bg-card)",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onClick={() => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = ".csv";
        inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); };
        inp.click();
      }}
      role="button"
      aria-label="Upload CSV inventory file"
      tabIndex={0}
    >
      <Upload size={20} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
      <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>Drop CSV file here or click to upload</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
        Columns: name, category, unit, cost_price, selling_price, current_stock, reorder_point, reorder_qty
      </div>
      {status && <div style={{ marginTop: 8, fontSize: 12, color: status.startsWith("✅") ? "var(--accent-green)" : "var(--accent-red)" }}>{status}</div>}
    </div>
  );
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState<any>({
    name: "", category: "Beverages", unit: "unit",
    cost_price: "", selling_price: "", current_stock: "",
    reorder_point: "", reorder_qty: "", lead_time_days: 2,
  });

  const params = new URLSearchParams({ page: String(page), page_size: "15" });
  if (search) params.set("search", search);
  if (filterStatus) params.set("status", filterStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, search, filterStatus],
    queryFn: () => getProducts(params.toString()),
  });

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setShowAdd(false); },
  });

  const handleCreate = () => {
    const payload = { ...newProduct };
    ["cost_price","selling_price","current_stock","reorder_point","reorder_qty"].forEach(k => {
      payload[k] = parseFloat(payload[k]) || 0;
    });
    payload.lead_time_days = parseInt(payload.lead_time_days) || 2;
    createMut.mutate(payload);
  };

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
    { value: "in_stock", label: "In Stock" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Product Inventory</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {data?.total ?? 0} products · Page {data?.page ?? 1} of {data?.total_pages ?? 1}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={() => setShowAdd(!showAdd)} style={{ fontSize: 12 }}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* CSV Upload */}
      <UploadZone onUploaded={() => qc.invalidateQueries({ queryKey: ["products"] })} />

      {/* Add Product Form */}
      {showAdd && (
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Add New Product</h3>
            <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { key: "name", label: "Product Name", type: "text", colSpan: 3 },
              { key: "category", label: "Category", type: "select" },
              { key: "unit", label: "Unit", type: "text" },
              { key: "supplier", label: "Supplier", type: "text" },
              { key: "cost_price", label: "Cost Price (₹)", type: "number" },
              { key: "selling_price", label: "Selling Price (₹)", type: "number" },
              { key: "current_stock", label: "Current Stock", type: "number" },
              { key: "reorder_point", label: "Reorder Point", type: "number" },
              { key: "reorder_qty", label: "Reorder Qty", type: "number" },
              { key: "lead_time_days", label: "Lead Time (days)", type: "number" },
            ].map(({ key, label, type, colSpan }) => (
              <div key={key} style={{ gridColumn: colSpan ? `span ${colSpan}` : undefined }}>
                <label htmlFor={`add-${key}`} style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>
                  {label}
                </label>
                {type === "select" ? (
                  <select
                    id={`add-${key}`}
                    className="input"
                    value={newProduct[key]}
                    onChange={(e) => setNewProduct({ ...newProduct, [key]: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input
                    id={`add-${key}`}
                    className="input"
                    type={type}
                    min={type === "number" ? 0 : undefined}
                    value={newProduct[key] ?? ""}
                    onChange={(e) => setNewProduct({ ...newProduct, [key]: e.target.value })}
                    placeholder={label}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={createMut.isPending}
              style={{ fontSize: 12 }}
            >
              {createMut.isPending ? "Saving..." : <><Check size={14} /> Save Product</>}
            </button>
            <button className="btn-secondary" onClick={() => setShowAdd(false)} style={{ fontSize: 12 }}>
              Cancel
            </button>
          </div>
          {createMut.isError && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent-red)" }}>
              {(createMut.error as Error).message}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            className="input"
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 32 }}
            aria-label="Search products"
          />
        </div>
        <select
          className="input"
          style={{ width: 150 }}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          aria-label="Filter by stock status"
        >
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <LoadingSpinner message="Loading products..." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" aria-label="Inventory product list">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Reorder Pt.</th>
                  <th scope="col">Cost Price</th>
                  <th scope="col">Selling Price</th>
                  <th scope="col">Margin</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((p: any) => {
                  const margin = p.cost_price > 0
                    ? ((p.selling_price - p.cost_price) / p.cost_price * 100).toFixed(1)
                    : "—";
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.id} · {p.unit}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.category}</span>
                      </td>
                      <td style={{
                        fontWeight: 700,
                        color: p.current_stock === 0 ? "var(--accent-red)"
                          : p.current_stock <= p.reorder_point ? "var(--accent-amber)"
                          : "var(--text-primary)"
                      }}>
                        {p.current_stock}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{p.reorder_point}</td>
                      <td>{formatCurrency(p.cost_price)}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(p.selling_price)}</td>
                      <td style={{ color: parseFloat(margin) > 20 ? "var(--accent-green)" : "var(--accent-amber)" }}>
                        {typeof margin === "string" && margin !== "—" ? `${margin}%` : margin}
                      </td>
                      <td>
                        <span className={STOCK_STATUS_BADGE[p.stock_status] ?? "badge"}>
                          {STOCK_STATUS_LABEL[p.stock_status] ?? p.stock_status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${p.name}"?`)) deleteMut.mutate(p.id);
                          }}
                          aria-label={`Delete ${p.name}`}
                          title="Delete product"
                          style={{
                            background: "none", border: "none",
                            cursor: "pointer", color: "var(--text-muted)",
                            padding: "4px 6px",
                            borderRadius: 6,
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-red)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(data?.total_pages ?? 1) > 1 && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: 12, padding: "12px 20px", borderTop: "1px solid var(--border)"
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Page {page} of {data?.total_pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data?.total_pages, p + 1))}
              disabled={page === data?.total_pages}
              aria-label="Next page"
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
