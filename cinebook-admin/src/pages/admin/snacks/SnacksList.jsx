import { useEffect, useState } from "react"
import { Pencil, Plus, Popcorn, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, PageHeader, TableSkeleton } from "../../../components/ui"
import { money } from "../../../lib/format"
import SnackForm from "./SnackForm"

export default function SnacksList() {
  const [snacks, setSnacks] = useState(null)
  const [editing, setEditing] = useState(undefined) // undefined closed, null new, object edit
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    api.get("/snacks").then((res) => setSnacks(res.data)).catch((err) => {
      toast.error(errorMessage(err))
      setSnacks([])
    })

  useEffect(() => {
    load()
  }, [])

  const toggle = async (s) => {
    try {
      await api.put(`/snacks/${s.id}`, { ...s, active: !s.active })
      toast.success(`${s.name} ${s.active ? "taken off sale" : "back on sale"}`)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.delete(`/snacks/${toDelete.id}`)
      toast.success(`${toDelete.name} deleted`)
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete"))
    } finally {
      setBusy(false)
    }
  }

  const currency = snacks?.[0]?.currency || "lkr"
  const add = <button onClick={() => setEditing(null)} className="btn-primary"><Plus size={16} /> New snack</button>

  return (
    <div>
      <PageHeader
        title="Snacks & combos"
        subtitle="Customers can add these at checkout. They're paid with the tickets and collected at the counter."
        actions={add}
      />

      <div className="card overflow-hidden">
        {!snacks ? (
          <TableSkeleton />
        ) : snacks.length === 0 ? (
          <Empty icon={Popcorn} title="No snacks yet" text="Add popcorn, drinks or a combo to sell them with tickets." action={add} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <th className="table-th">Snack</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Sold (paid)</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {snacks.map((s) => (
                  <tr key={s.id} className={`hover:bg-surface-2/40 ${s.active ? "" : "opacity-60"}`}>
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {s.imageUrl ? (
                          <img src={s.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-faint"><Popcorn size={17} /></span>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold">{s.name}</p>
                          {s.description && <p className="truncate text-xs text-muted">{s.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-sm">{s.category || "-"}</td>
                    <td className="table-td font-semibold tabular-nums">{money(s.price, s.currency)}</td>
                    <td className="table-td tabular-nums">{s.unitsSold}</td>
                    <td className="table-td">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.active
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>
                        {s.active ? "On sale" : "Off"}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex justify-end gap-0.5">
                        <button className={`btn-icon ${s.active ? "hover:text-amber-600!" : "hover:text-emerald-600!"}`} title={s.active ? "Take off sale" : "Put on sale"} onClick={() => toggle(s)}><Power size={17} /></button>
                        <button className="btn-icon" title="Edit" onClick={() => setEditing(s)}><Pencil size={17} /></button>
                        {s.unitsSold === 0 && (
                          <button className="btn-icon hover:text-red-600!" title="Delete" onClick={() => setToDelete(s)}><Trash2 size={17} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== undefined && (
        <SnackForm snack={editing} currency={currency} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load() }} />
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete snack?"
        message={`${toDelete?.name} will be removed from the menu.`}
        busy={busy}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
