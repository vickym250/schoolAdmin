import React, { useEffect, useState } from "react";
import { addDoc, updateDoc, doc, collection } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";

export function AddTeacherPopup({ close, editData }) {
  const [form, setForm] = useState({
    name: "",
    subject: "",
    phone: "",
    salary: "",
    userId: "",
    password: "",
    address: "",
    photo: null,
    photoURL: "",
    attendance: {}, // for months
    status: {},     // month wise status
  });

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm((s) => ({
        ...s,
        ...editData,
        photo: null, // prevent File upload issue
      }));
    }

    setTimeout(() => setShow(true), 10);
  }, [editData]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePhoto = (e) =>
    setForm((prev) => ({ ...prev, photo: e.target.files[0] }));

  const handleClose = () => {
    setShow(false);
    setTimeout(() => close(), 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoURL = form.photoURL;

      // Upload new photo
      if (form.photo) {
        const imageRef = ref(storage, `teachers/${Date.now()}_${form.photo.name}`);
        await uploadBytes(imageRef, form.photo);
        photoURL = await getDownloadURL(imageRef);
      }

      // Firestore-safe object (remove File + attendance)
      const { photo, attendance, ...safeForm } = form;

      safeForm.salary = Number(form.salary);
      safeForm.photoURL = photoURL;

      if (editData) {
        await updateDoc(doc(db, "teachers", editData.id), safeForm);
        toast.success("Teacher Updated Successfully!");
      } else {
        await addDoc(collection(db, "teachers"), {
          ...safeForm,
          createdAt: new Date(),
        });
        toast.success("Teacher Added Successfully!");
      }

      handleClose();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div
        className={`bg-white p-6 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto transition-all duration-300 ${
          show ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-xl text-gray-700"
        >
          ✖
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">
          {editData ? "Update Teacher" : "Add Teacher"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
            className="border px-3 py-2 rounded"
          />

          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Subject"
            required
            className="border px-3 py-2 rounded"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
            required
            className="border px-3 py-2 rounded"
          />

          <input
            name="salary"
            type="number"
            value={form.salary}
            onChange={handleChange}
            placeholder="Monthly Salary (₹)"
            required
            className="border px-3 py-2 rounded"
          />

          <input
            name="userId"
            value={form.userId}
            onChange={handleChange}
            placeholder="User ID"
            className="border px-3 py-2 rounded"
          />

          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="border px-3 py-2 rounded"
          />

          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
            className="col-span-2 border px-3 py-2 rounded"
          />

          <input
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="col-span-2 border px-3 py-2 rounded"
          />

          {form.photoURL && !form.photo && (
            <img
              src={form.photoURL}
              className="w-24 h-24 rounded border col-span-2"
              alt="teacher"
            />
          )}

          <button
            disabled={loading}
            className="col-span-2 bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Saving..." : editData ? "Update" : "Add"}
          </button>
        </form>
      </div>
    </div>
  );
}
