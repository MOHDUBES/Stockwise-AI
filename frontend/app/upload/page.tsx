"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<{ imported: number; errors: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith(".csv")) {
        setError("Please select a valid CSV file.");
        setFile(null);
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      // We use raw fetch here because our `request` helper in `api.ts` sets Content-Type to JSON automatically
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/v1/upload/inventory", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to upload file");
      }

      setStats({ imported: data.imported, errors: data.errors });
      setSuccess(true);
      
      // Give user time to see success message before redirecting
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="depth-card max-w-lg w-full p-8 flex flex-col items-center text-center">
        
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-6">
          <Upload size={32} />
        </div>

        <h1 className="text-2xl font-bold mb-2">Upload Inventory Data</h1>
        <p className="text-text-secondary mb-8 text-sm">
          To get started, upload your inventory in CSV format. The system needs this data to generate insights, charts, and AI recommendations.
        </p>

        {success ? (
          <div className="w-full flex flex-col items-center p-6 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500 mb-6">
            <CheckCircle2 size={48} className="mb-4" />
            <h3 className="text-xl font-bold">Upload Successful!</h3>
            <p className="mt-2 text-sm">
              Imported {stats?.imported} products. {stats?.errors ? `${stats.errors} errors.` : ""}
            </p>
            <p className="mt-4 text-sm opacity-80">Preparing your dashboard...</p>
          </div>
        ) : (
          <div className="w-full">
            <label 
              htmlFor="csv-upload" 
              className={`
                flex flex-col items-center justify-center w-full h-40 
                border-2 border-dashed rounded-xl cursor-pointer
                transition-all duration-200
                ${file ? "border-accent bg-accent/5" : "border-border-subtle hover:bg-bg-subtle hover:border-accent/50"}
              `}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <FileUp size={36} className="text-accent mb-3" />
                    <p className="text-sm font-semibold text-accent">{file.name}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={36} className="text-text-secondary mb-3 opacity-50" />
                    <p className="mb-2 text-sm text-text-secondary">
                      <span className="font-semibold text-accent">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-text-tertiary">CSV files only</p>
                  </>
                )}
              </div>
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv"
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-2 text-left">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`
                w-full mt-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2
                transition-all duration-200 shadow-md shadow-accent/20
                ${!file || isUploading 
                  ? "bg-bg-subtle text-text-tertiary cursor-not-allowed" 
                  : "bg-accent text-white hover:bg-accent-hover hover:-translate-y-0.5"
                }
              `}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload Data"
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-sm text-text-tertiary max-w-md text-center">
        <p className="mb-2 font-medium">Expected CSV Columns:</p>
        <p className="opacity-80">
          name, category, unit, cost_price, selling_price, current_stock, reorder_point, reorder_qty, lead_time_days
        </p>
      </div>
    </div>
  );
}
