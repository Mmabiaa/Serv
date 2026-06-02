import { useRef, useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { categories, type Product } from "@/store/pos-data";
import { addProduct, deleteProduct, updateProduct } from "@/store/pos-store";

interface ProductDialogProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDialog({ product, onClose }: ProductDialogProps) {
  const [img, setImg] = useState<string | undefined>(product?.imageUrl);
  const upRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = (ev) => setImg(ev.target?.result as string);
      r.readAsDataURL(f);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">{product ? "Edit Product" : "Add Product"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = fd.get("name") as string;
            const category = fd.get("category") as string;
            const price = Number(fd.get("price"));
            const stock = Number(fd.get("stock"));

            if (product) {
              updateProduct({ ...product, name, category, price, stock, imageUrl: img });
            } else {
              addProduct({
                name,
                category,
                price,
                stock,
                emoji: "📦",
                imageUrl: img,
              });
            }
            onClose();
          }}
          className="space-y-4"
        >
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={() => upRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-primary transition-colors group"
            >
              {img ? (
                <img src={img} alt="" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Photo
                  </span>
                </>
              )}
            </button>
            <input ref={upRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Product name
            </label>
            <input
              name="name"
              defaultValue={product?.name}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Category
              </label>
              <select
                name="category"
                defaultValue={product?.category || categories[1]}
                className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
              >
                {categories.slice(1).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Stock level
              </label>
              <input
                name="stock"
                type="number"
                defaultValue={product?.stock ?? 0}
                className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Unit price (RWF)
            </label>
            <input
              name="price"
              type="number"
              defaultValue={product?.price}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/10"
              required
            />
          </div>

          <div className="pt-4 flex gap-3">
            {product && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this product?")) {
                    deleteProduct(product.id);
                    onClose();
                  }
                }}
                className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive grid place-items-center hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
            >
              {product ? "Save product" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
