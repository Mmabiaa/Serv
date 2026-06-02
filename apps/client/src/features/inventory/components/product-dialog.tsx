import { useRef, useState, useEffect } from "react";
import { X, Upload, Trash2, Link, Image as ImageIcon, Loader2 } from "lucide-react";
import { type Product } from "@/store/pos-data";
import { addProduct, deleteProduct, updateProduct, useCategories, fetchCategories, addCategory } from "@/store/pos-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductDialogProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDialog({ product, onClose }: ProductDialogProps) {
  const [img, setImg] = useState<string | undefined>(product?.image_url);
  const [imgSource, setImgSource] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const upRef = useRef<HTMLInputElement>(null);
  const categories = useCategories();

  useEffect(() => {
    if (product) {
      const cat = categories.find(c => c.id === product.category_id);
      if (cat) setCategoryName(cat.name);
    }
  }, [product, categories]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = (ev) => setImg(ev.target?.result as string);
      r.readAsDataURL(f);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const price = Number(fd.get("price"));
    const quantity = Number(fd.get("stock"));
    const finalImg = imgSource === "url" ? (fd.get("imgUrl") as string) : img;

    try {
      // Find or create category
      let category_id = "";
      const existing = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (existing) {
        category_id = existing.id;
      } else {
        const newCat = await addCategory(categoryName);
        category_id = newCat.id;
      }

      if (product) {
        await updateProduct({ ...product, name, category_id, price, quantity, image_url: finalImg });
        toast.success("Product updated successfully");
      } else {
        await addProduct({
          name,
          category_id,
          price,
          quantity,
          image_url: finalImg,
        });
        toast.success("Product added successfully");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setLoading(false)
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
            disabled={loading}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setImgSource("file")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  imgSource === "file" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ImageIcon className="w-3 h-3" /> File Upload
              </button>
              <button
                type="button"
                onClick={() => setImgSource("url")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  imgSource === "url" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link className="w-3 h-3" /> Image URL
              </button>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => imgSource === "file" && upRef.current?.click()}
                disabled={loading}
                className={cn(
                  "w-32 h-32 rounded-3xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 overflow-hidden transition-all group disabled:opacity-50",
                  imgSource === "file" && "hover:border-primary cursor-pointer",
                  imgSource === "url" && "cursor-default border-solid"
                )}
              >
                {img ? (
                  <img src={img} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = ""; // Clear on error
                    toast.error("Failed to load image preview");
                  }} />
                ) : (
                  <>
                    {imgSource === "file" ? (
                      <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {imgSource === "file" ? "Upload Photo" : "Image Preview"}
                    </span>
                  </>
                )}
              </button>
              <input ref={upRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={loading} />
            </div>

            {imgSource === "url" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Image URL
                </label>
                <input
                  name="imgUrl"
                  type="url"
                  defaultValue={product?.image_url}
                  placeholder="https://example.com/image.png"
                  className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                  disabled={loading}
                  onChange={(e) => setImg(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Product name
            </label>
            <input
              name="name"
              defaultValue={product?.name}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Category
              </label>
              <input
                name="category"
                list="category-list"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                required
                disabled={loading}
                placeholder="Type or select..."
              />
              <datalist id="category-list">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Price
              </label>
              <input
                name="price"
                type="number"
                defaultValue={product?.price}
                className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Initial Stock
            </label>
            <input
              name="stock"
              type="number"
              defaultValue={product?.quantity}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {product ? "Save changes" : "Create product"}
            </button>
            {product && (
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  if (confirm("Delete this product?")) {
                    setLoading(true);
                    try {
                      await deleteProduct(product.id);
                      toast.success("Product deleted successfully");
                      onClose();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to delete product");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="w-full bg-rose-50 text-rose-600 py-4 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Delete product
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
