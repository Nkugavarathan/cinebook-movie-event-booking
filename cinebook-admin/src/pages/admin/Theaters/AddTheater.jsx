import { useEffect, useState } from "react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { Modal, Spinner } from "../../../components/ui"

const EMPTY = { name: "", city: "", address: "", facilities: "" }

/** Add / edit theater dialog. Pass `theater` to edit. */
export default function TheaterFormModal({ open, theater, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(theater ? { ...EMPTY, ...theater } : EMPTY)
  }, [open, theater])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { name: form.name, city: form.city, address: form.address, facilities: form.facilities }
      const res = theater ? await api.put(`/theaters/${theater.id}`, body) : await api.post("/theaters", body)
      toast.success(theater ? "Theater updated" : "Theater added")
      onSaved(res.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not save theater"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={theater ? "Edit theater" : "Add theater"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button form="theater-form" className="btn-primary" disabled={saving}>{saving && <Spinner size={16} />} Save</button>
        </>
      }
    >
      <form id="theater-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="t-name">Name *</label>
          <input id="t-name" className="input" required value={form.name} onChange={set("name")} placeholder="CineBook Grand" />
        </div>
        <div>
          <label className="label" htmlFor="t-city">City *</label>
          <input id="t-city" className="input" required value={form.city} onChange={set("city")} placeholder="Colombo" />
        </div>
        <div>
          <label className="label" htmlFor="t-address">Address</label>
          <input id="t-address" className="input" value={form.address || ""} onChange={set("address")} />
        </div>
        <div>
          <label className="label" htmlFor="t-fac">Facilities</label>
          <input id="t-fac" className="input" value={form.facilities || ""} onChange={set("facilities")} placeholder="Parking, Food Court, Dolby Atmos" />
          <p className="mt-1 text-xs text-muted">Comma separated. Shown to customers.</p>
        </div>
      </form>
    </Modal>
  )
}
