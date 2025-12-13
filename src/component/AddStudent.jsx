import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import FeesReceipt from "./Fess";

export default function AddStudent({ close, editData }) {

  const months = [
    "April","May","June","July","August","September",
    "October","November","December","January","February","March"
  ];

  const [form, setForm] = useState({
    name: "",
    className: "",
    phone: "",
    address: "",
    fatherName: "",
    rollNumber: "",
    admissionFees: "",
    totalFees: "",
    photo: null,        // ❌ never save in Firestore
    photoURL: "",
    userId: "",
    password: "",
  });

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fess, setFess] = useState(false);

  // 🔥 fees logic
  const [paidAmount, setPaidAmount] = useState("");
  const [paidMonthsList, setPaidMonthsList] = useState([]);

  // ⭐ Edit fill
  useEffect(() => {
    if (editData) {
      setForm(prev => ({
        ...prev,
        ...editData,
        photo: null,
        photoURL: editData.photoURL || "",
      }));
    }
    setTimeout(() => setShow(true), 10);
  }, [editData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoto = (e) => {
    setForm({ ...form, photo: e.target.files[0] });
  };

  // Attendance
  const generateAttendance = () => {
    let obj = {};
    months.forEach(m => {
      obj[m] = { present: 0, absent: 0 };
    });
    return obj;
  };

  // Default fees
  const generateFees = () => {
    let obj = {};
    const monthly = Number(form.totalFees || 0);
    months.forEach(m => {
      obj[m] = { total: monthly, paid: 0 };
    });
    return obj;
  };

  // 🔥 Paid amount → auto months
  const generateFeesWithPayment = () => {
    const monthly = Number(form.totalFees || 0);
    const amount = Number(paidAmount || 0);
    const monthsPaid = Math.floor(amount / monthly);

    let obj = {};
    let paidList = [];

    months.forEach((m, index) => {
      if (index < monthsPaid) {
        obj[m] = { total: monthly, paid: monthly };
        paidList.push(m);
      } else {
        obj[m] = { total: monthly, paid: 0 };
      }
    });

    setPaidMonthsList(paidList);
    return obj;
  };

  // ⭐ SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoURL = form.photoURL;

      // 🔥 upload image to STORAGE only
      if (form.photo) {
        const imageRef = ref(
          storage,
          `students/${Date.now()}_${form.photo.name}`
        );
        await uploadBytes(imageRef, form.photo);
        photoURL = await getDownloadURL(imageRef);
      }

      // ❌ REMOVE photo before Firestore
      const { photo, ...safeForm } = form;

      if (editData) {
        await updateDoc(doc(db, "students", editData.id), {
          ...safeForm,
          admissionFees: Number(form.admissionFees),
          totalFees: Number(form.totalFees),
          photoURL,
        });
        alert("Student Updated Successfully!");
      } else {
        await addDoc(collection(db, "students"), {
          ...safeForm,
          admissionFees: Number(form.admissionFees),
          totalFees: Number(form.totalFees),
          photoURL,
          attendance: generateAttendance(),
          fees: paidAmount ? generateFeesWithPayment() : generateFees(),

          // 🔔 NOTIFICATION READY FIELDS (NEW)
          pushToken: "",                // student app login pe fill hoga
          notificationsEnabled: true,   // default ON

          createdAt: new Date(),
        });

        alert("Student Added Successfully!");
        setShow(false);
        setTimeout(() => setFess(true), 300);
      }

    } catch (err) {
      console.error(err);
      alert("Error occurred!");
    }

    setLoading(false);
  };

  const handleClose = () => {
    setShow(false);
    setFess(false);
    setTimeout(() => close(), 200);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-50">

      {/* FORM */}
      {!fess && (
        <div
          className={`bg-white shadow-lg rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto transition-all ${
            show ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-xl font-bold text-gray-500"
          >
            ✖
          </button>

          <h2 className="text-2xl font-bold mb-6 text-center">
            {editData ? "Update Student" : "Add Student"}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              className="border p-2 rounded"
            />

            <input
              name="rollNumber"
              value={form.rollNumber}
              onChange={handleChange}
              placeholder="Roll No"
              className="border p-2 rounded"
            />

            <select
              name="className"
              value={form.className}
              onChange={handleChange}
              className="border p-2 rounded"
            >
              <option value="">Select Class</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(c => (
                <option key={c}>Class {c}</option>
              ))}
            </select>

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="border p-2 rounded"
            />

            <input
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
              placeholder="Father Name"
              className="border p-2 rounded"
            />

            <input
              name="admissionFees"
              value={form.admissionFees}
              onChange={handleChange}
              placeholder="Admission Fee"
              className="border p-2 rounded"
            />

            <input
              name="totalFees"
              value={form.totalFees}
              onChange={handleChange}
              placeholder="Monthly Fee"
              className="border p-2 rounded"
            />

            {/* 🔐 LOGIN DETAILS */}
            <input
              name="userId"
              value={form.userId}
              onChange={handleChange}
              placeholder="User ID"
              className="border p-2 rounded"
            />

            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="border p-2 rounded"
            />

            {/* 🔥 PAID AMOUNT */}
            <input
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="Paid Amount (500=1 month, 1000=2 months)"
              className="border p-2 rounded col-span-2"
            />

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              className="border p-2 rounded col-span-2"
            />

            <input
              type="file"
              onChange={handlePhoto}
              className="col-span-2"
            />

            <button className="bg-blue-600 text-white py-2 rounded col-span-2">
              {loading ? "Saving..." : "Save & Generate Receipt"}
            </button>

          </form>
        </div>
      )}

      {/* RECEIPT */}
      {fess && (
        <FeesReceipt
          name={form.name}
          className={form.className}
          admissionFee={Number(form.admissionFees)}
          monthlyFee={Number(paidAmount || 0)}
          payMonth={paidMonthsList.join(", ")}
          date={new Date().toLocaleDateString("en-IN")}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
