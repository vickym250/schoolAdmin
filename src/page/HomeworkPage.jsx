import React, { useEffect, useState } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";

export default function HomeworkPage() {
  const [className, setClassName] = useState("Class 1");
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    file: null
  });

  // 🔥 Fetch Homework Realtime
  useEffect(() => {
    const q = query(collection(db, "homework"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setHomeworkList(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Class wise filter
  const filteredHomework = homeworkList.filter(h => h.className === className);

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.loading("Uploading...", { id: "load" });

    let fileURL = "";

    try {
      // File upload
      if (form.file) {
        const fileRef = ref(storage, `homework/${Date.now()}_${form.file.name}`);
        await uploadBytes(fileRef, form.file);
        fileURL = await getDownloadURL(fileRef);
      }

      // Save Homework
      await addDoc(collection(db, "homework"), {
        className,
        title: form.title,
        description: form.description,
        date: form.date,
        fileURL,
        createdAt: new Date()
      });

      toast.success("Homework Added!", { id: "load" });
      setOpen(false);

      setForm({ title: "", description: "", date: "", file: null });

    } catch (err) {
      toast.error("Error adding homework", { id: "load" });
    }
  };

  // Delete Homework
  const handleDelete = (id) => {
    toast(
      (t) => (
        <div>
          <p className="font-semibold">Delete Homework?</p>

          <div className="flex gap-2 mt-2">
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={async () => {
                await deleteDoc(doc(db, "homework", id));
                toast.dismiss(t.id);
                toast.success("Deleted!");
              }}
            >
              Yes
            </button>

            <button
              className="bg-gray-300 px-3 py-1 rounded"
              onClick={() => toast.dismiss(t.id)}
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h2 className="text-2xl font-bold mb-4">Homework (Class Wise)</h2>

      {/* Class Filter */}
      <div className="flex gap-4 mb-6">
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          {[...Array(12)].map((_, i) => (
            <option key={i}>Class {i + 1}</option>
          ))}
        </select>

        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Add Homework
        </button>
      </div>

      {/* Homework List */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredHomework.length === 0 ? (
        <p>No homework for this class.</p>
      ) : (
        <div className="grid gap-4">
          {filteredHomework.map((h) => (
            <div key={h.id} className="p-4 bg-white shadow rounded-lg">
              <h3 className="text-xl font-bold">{h.title}</h3>
              <p className="text-gray-700">{h.description}</p>
              <p className="text-sm text-gray-500 mt-1">Date: {h.date}</p>

              {h.fileURL && (
                <a
                  href={h.fileURL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline mt-2 block"
                >
                  View File
                </a>
              )}

              <button
                className="mt-3 bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => handleDelete(h.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Homework Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">

            <h2 className="text-xl font-semibold mb-4">Add Homework</h2>

            <form onSubmit={handleSubmit} className="grid gap-4">

              <input
                type="text"
                placeholder="Homework Title"
                className="border p-2 rounded"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <textarea
                placeholder="Description"
                className="border p-2 rounded"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />

              <input
                type="date"
                className="border p-2 rounded"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />

              <input
                type="file"
                className="border p-2 rounded"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
              />

              <button className="bg-blue-600 text-white py-2 rounded-lg">
                Add Homework
              </button>

            </form>

            <button
              className="mt-3 text-red-500 font-bold"
              onClick={() => setOpen(false)}
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
