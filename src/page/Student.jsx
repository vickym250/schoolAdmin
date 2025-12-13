import React, { useState, useEffect } from "react";
import AddStudent from "../component/AddStudent";
import FeesReceipt from "../component/Fess";
import { db } from "../firebase";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import toast from "react-hot-toast";

export default function StudentList() {

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [className, setClassName] = useState("Class 10");
  const [open, setOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptStudent, setReceiptStudent] = useState(null);

  /* ---------------- FETCH STUDENTS ---------------- */
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ---------------- FILTER BY CLASS ---------------- */
  const studentsByClass = students.filter(
    s => s.className?.toLowerCase() === className.toLowerCase()
  );

  /* ---------------- PAY FEES ---------------- */
  const handlePayFees = async (student) => {
    const fee = student.fees?.[month] || { total: 0, paid: 0 };
    const total = Number(fee.total);
    const paid = Number(fee.paid);

    if (paid >= total) {
      toast.error("Already Paid!");
      return;
    }

    toast((t) => (
      <div>
        <p className="font-semibold">Pay full fees ₹{total}?</p>
        <div className="flex gap-2 mt-2">
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              await updateDoc(doc(db, "students", student.id), {
                [`fees.${month}.paid`]: total,
                [`fees.${month}.paidAt`]: serverTimestamp(),
              });
              toast.dismiss(t.id);
              toast.success("Fees Paid Successfully!");
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
    ));
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = (id) => {
    toast((t) => (
      <div>
        <p className="font-semibold text-red-600">Delete this student?</p>
        <div className="flex gap-2 mt-2">
          <button
            className="bg-red-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              await deleteDoc(doc(db, "students", id));
              toast.dismiss(t.id);
              toast.success("Student Deleted!");
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
    ));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <div className={`bg-white p-6 rounded-xl shadow ${open ? "blur-2xl" : ""}`}>
        <h2 className="text-2xl font-bold mb-4">Student List</h2>

        {/* FILTERS */}
        <div className="flex gap-4 mb-4 items-center">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            {months.map(m => <option key={m}>{m}</option>)}
          </select>

          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i}>Class {i + 1}</option>
            ))}
          </select>

          <button
            onClick={() => { setEditStudent(null); setOpen(true); }}
            className="bg-amber-300 px-4 py-2 rounded font-bold"
          >
            Add Student
          </button>
        </div>

        {/* TABLE */}
        {!loading && (
        <div className="overflow-x-auto rounded-xl border bg-white">
  <table className="w-full text-base text-left">
    <thead className="bg-gray-100 text-gray-700">
      <tr>
        <th className="p-4 font-semibold">Photo</th>
        <th className="p-4 font-semibold">Roll</th>
        <th className="p-4 font-semibold">Name</th>
        <th className="p-4 font-semibold">Class</th>
        <th className="p-4 text-center font-semibold">Attendance</th>
        <th className="p-4 text-center font-semibold">Total</th>
        <th className="p-4 text-center font-semibold">Paid</th>
        <th className="p-4 text-center font-semibold">Status</th>
        <th className="p-4 text-center font-semibold">Action</th>
      </tr>
    </thead>

    <tbody>
      {studentsByClass.map((s) => {

        /* -------- FEES -------- */
        const fee = s.fees?.[month] || { total: 0, paid: 0 };
        const totalFees = Number(fee.total);
        const paidFees = Number(fee.paid);

        /* -------- ATTENDANCE -------- */
        const attendanceRoot = s.attendance || {};

        const dayEntries = Object.entries(attendanceRoot).filter(
          ([key, value]) =>
            key.startsWith(`${month}_day_`) &&
            (value === "P" || value === "A")
        );

        const presentCount = dayEntries.filter(([_, v]) => v === "P").length;
        const absentCount = dayEntries.filter(([_, v]) => v === "A").length;

        return (
          <tr
            key={s.id}
            className="border-b hover:bg-gray-50 transition"
          >

            {/* PHOTO */}
            <td className="p-4">
              {s.photoURL ? (
                <img
                  src={s.photoURL}
                  alt={s.name}
                  className="w-12 h-12 rounded-full object-cover border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-bold text-base">
                  {s.name?.charAt(0)}
                </div>
              )}
            </td>

            {/* ROLL */}
            <td className="p-4 text-base font-medium">
              {s.rollNumber}
            </td>

            {/* NAME */}
            <td className="p-4 text-base font-semibold text-gray-800">
              {s.name}
            </td>

            {/* CLASS */}
            <td className="p-4 text-base">
              {s.className}
            </td>

            {/* ATTENDANCE */}
            <td className="p-4 text-center text-[20px] font-semibold">
              <div className="text-green-700">P: {presentCount}</div>
              <div className="text-red-600">A: {absentCount}</div>
            </td>

            {/* TOTAL FEES */}
            <td className="p-4 text-center text-base font-semibold text-green-700">
              ₹{totalFees}
            </td>

            {/* PAID FEES */}
            <td className="p-4 text-center text-base font-semibold text-purple-700">
              ₹{paidFees}
            </td>

            {/* STATUS */}
            <td className="p-4 text-center">
              {paidFees >= totalFees ? (
                <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold">
                  PAID
                </span>
              ) : (
                <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-bold">
                  PENDING
                </span>
              )}
            </td>

            {/* ACTION */}
            <td className="p-4 flex gap-2 justify-center">
              {paidFees >= totalFees ? (
                <button
                  onClick={() => {
                    setReceiptStudent(s);
                    setShowReceipt(true);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-semibold"
                >
                  Receipt
                </button>
              ) : (
                <button
                  onClick={() => handlePayFees(s)}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold"
                >
                  Pay
                </button>
              )}

              <button
                onClick={() => {
                  setEditStudent(s);
                  setOpen(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(s.id)}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                Delete
              </button>
            </td>

          </tr>
        );
      })}
    </tbody>
  </table>
</div>

        )}
      </div>

      {/* ADD / EDIT */}
      {open && (
        <AddStudent
          close={() => { setOpen(false); setEditStudent(null); }}
          editData={editStudent}
        />
      )}

      {/* RECEIPT */}
      {showReceipt && receiptStudent && (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={() => setShowReceipt(false)}   // backdrop click close
  >
    <div onClick={(e) => e.stopPropagation()}>
     <FeesReceipt
  name={receiptStudent.name}
  studentClass={receiptStudent.className}   // ✅ FIX
  
  monthlyFee={receiptStudent.fees?.[month]?.paid}
  payMonth={month}
  paidAt={receiptStudent.fees?.[month]?.paidAt} // ✅ REAL DATE
  onClose={() => setShowReceipt(false)}
/>

    </div>
  </div>
)}


    </div>
  );
}
