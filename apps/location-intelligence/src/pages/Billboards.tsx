import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billboardService } from "@/services/billboard.service";
import BillboardForm from "@/components/forms/BillboardForm";
import BillboardCard from "@/components/cards/BillboardCard";
import { Billboard } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, AlertCircle, Sparkles, CheckCircle2, Trash2, Menu } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function Billboards() {
  const queryClient = useQueryClient();
  const [editingBillboard, setEditingBillboard] = useState<Billboard | undefined>(undefined);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Success Notification Helper
  const addToast = (message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Queries & Mutations
  const { data: billboards = [], isLoading, isError } = useQuery({
    queryKey: ["billboards"],
    queryFn: billboardService.getBillboards,
  });

  const createMutation = useMutation({
    mutationFn: billboardService.createBillboard,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["billboards"] });
      addToast(`Billboard "${data.name}" successfully registered!`);
    },
    onError: (error: any) => {
      addToast(error.message || "Failed to register billboard", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Billboard> }) =>
      billboardService.updateBillboard(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["billboards"] });
      setEditingBillboard(undefined);
      addToast(`Billboard "${data.name}" successfully updated!`);
    },
    onError: (error: any) => {
      addToast(error.message || "Failed to update billboard", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: billboardService.deleteBillboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billboards"] });
      addToast("Billboard successfully deleted.", "info");
      setConfirmDeleteId(null);
    },
    onError: (error: any) => {
      addToast(error.message || "Failed to delete billboard", "error");
    },
  });

  const handleSubmit = (values: any) => {
    if (editingBillboard) {
      updateMutation.mutate({
        id: editingBillboard.id,
        data: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (billboard: Billboard) => {
    setEditingBillboard(billboard);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      deleteMutation.mutate(confirmDeleteId);
    }
  };

  return (
    <div className="relative min-h-screen pb-16 bg-background text-foreground overflow-x-hidden">
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md ${
                toast.type === "success"
                  ? "bg-emerald-950/85 border-emerald-500/30 text-emerald-300"
                  : toast.type === "error"
                  ? "bg-rose-950/85 border-rose-500/30 text-rose-300"
                  : "bg-zinc-900/85 border-zinc-700/60 text-zinc-300"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
              )}
              <span className="text-xs font-semibold leading-relaxed">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-premium text-foreground"
            >
              <div className="flex items-center gap-3 text-destructive mb-3">
                <Trash2 className="h-6 w-6" />
                <h3 className="text-md font-bold">Remove Asset</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Are you sure you want to delete billboard <span className="text-foreground font-semibold">{confirmDeleteId}</span>? This action is permanent and cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3.5">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-3 py-1.5 border border-border hover:bg-secondary rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-1.5 bg-destructive text-destructive-foreground hover:opacity-90 rounded-lg text-xs font-bold transition-all"
                >
                  Delete Asset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Landing page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-sidebar"))}
              className="md:hidden p-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground mr-1"
              title="Open Navigation Menu"
            >
              <Menu size={16} />
            </button>
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm shadow-primary/10">
              <Layers size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent tracking-wide">
                Aculion  Intelligence Engine
              </h1>
              <p className="text-xs text-muted-foreground">
                Enterprise Billboard Campaign & Site Analytics Manager
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-card border border-border px-3 py-1.5 rounded-xl font-bold text-muted-foreground shadow-sm">
            <Sparkles size={14} className="text-primary" />
            <span>SaaS Control Plane v1.0.3</span>
          </div>
        </header>

        {/* Section 1: Registration Form */}
        <section className="mb-12">
          <BillboardForm
            key={editingBillboard ? `edit-${editingBillboard.id}` : "register"}
            onSubmit={handleSubmit}
            initialValues={editingBillboard}
            onCancel={editingBillboard ? () => setEditingBillboard(undefined) : undefined}
          />
        </section>

        {/* Section 2: Billboard Cards */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div>
              <h2 className="text-sm font-extrabold tracking-wider uppercase text-muted-foreground">
                Managed Billboard Sites
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Click "Open Dashboard" to access geospatial & POI demographics.
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full font-mono">
              Count: {billboards.length}
            </span>
          </div>

          {isLoading ? (
            // Skeleton Loader Grid
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-card/40 border border-border/60 rounded-2xl p-5 h-[320px] animate-pulse space-y-4"
                >
                  <div className="h-6 w-20 bg-muted/40 rounded-full" />
                  <div className="h-5 w-40 bg-muted/40 rounded" />
                  <div className="h-4 w-28 bg-muted/40 rounded" />
                  <div className="space-y-2 pt-4">
                    <div className="h-4 w-full bg-muted/40 rounded" />
                    <div className="h-4 w-5/6 bg-muted/40 rounded" />
                  </div>
                  <div className="border-t border-border/40 pt-4 flex justify-between">
                    <div className="h-4 w-24 bg-muted/40 rounded" />
                    <div className="h-8 w-28 bg-primary/20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="glassmorphism p-8 rounded-2xl border border-rose-500/20 text-center max-w-md mx-auto space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-400 mx-auto animate-bounce" />
              <h3 className="text-sm font-bold text-rose-300">Data Fetching Failed</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We encountered an error loading the billboard repository. Make sure the database seeds file is present and retry.
              </p>
            </div>
          ) : billboards.length === 0 ? (
            <div className="glassmorphism p-12 rounded-2xl border border-border text-center max-w-md mx-auto space-y-4">
              <Layers className="h-10 w-10 text-muted-foreground/60 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No Registered Billboards</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add your first outdoor display site using the registration form above to begin geocoding and intelligence mapping.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {billboards.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    <BillboardCard
                      billboard={b}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
