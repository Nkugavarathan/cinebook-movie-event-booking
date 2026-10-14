import { useState } from "react"
import { Popcorn } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { Modal, Spinner } from "../../../components/ui"

const CATEGORIES = ["Popcorn", "Drinks", "Snacks", "Combos"]

/** Create / edit a snack. Mounted only while open. */
export default function SnackForm({ snack, currency = "lkr", onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    name: snack?.name || "",
    description: snack?.description || "",
    category: snack?.category || "Popcorn",
    price: snack?.price ?? "",
    imageUrl: snack?.imageUrl || "",
    active: snack ? snack.active : true,
  }))
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value })
  const cur = currency.toUpperCase()

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...f, price: f.price === "" ? null : Number(f.price) }
    try {
      const res = snack ? await api.put(`/snacks/${snack.id}`, body) : await api.post("/snacks", body)
      toast.success(snack ? `${res.data.name} updated` : `${res.data.name} added`)
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Could not save snack"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={snack ? `Edit ${snack.name}` : "New snack"} onClose={onClose}
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button form="snack-form" className="btn-primary" disabled={saving}>{saving && <Spinner size={16} />} {snack ? "Save" : "Add snack"}</button>
      </>}>
      <form id="snack-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="s-name">Name</label>
          <input id="s-name" className="input" required maxLength={80} placeholder="Large caramel popcorn" value={f.name} onChange={set("name")} />
        </div>
        <div>
          <label className="label" htmlFor="s-desc">Description <span className="font-normal text-muted">(optional)</span></label>
          <input id="s-desc" className="input" maxLength={300} placeholder="Sharing size, sweet and crunchy" value={f.description} onChange={set("description")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-cat">Category</label>
            <input id="s-cat" className="input" list="snack-categories" maxLength={40} value={f.category} onChange={set("category")} />
            <datalist id="snack-categories">
              {CATEGORIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="s-price">Price ({cur})</label>
            <input id="s-price" type="number" min="0.01" step="0.01" required className="input" placeholder="800" value={f.price} onChange={set("price")} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="s-img">Image URL <span className="font-normal text-muted">(optional)</span></label>
          <div className="flex items-center gap-3">
            {f.imageUrl ? (
              <img src={f.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover" />
            ) : (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-faint"><Popcorn size={18} /></span>
            )}
            <input id="s-img" type="url" className="input" maxLength={1000} placeholder="https://..." value={f.imageUrl} onChange={set("imageUrl")} />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="h-4 w-4 accent-brand" checked={f.active} onChange={set("active")} />
          <span className="text-sm font-medium">On sale - customers can add it at checkout</span>
        </label>
      </form>
    </Modal>
  )
}
