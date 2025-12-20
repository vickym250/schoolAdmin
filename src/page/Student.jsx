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
  serverTimestamp,
} from "firebase/firestore";

import toast from "react-hot-toast";

export default function StudentList() {

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [className, setClassName] = useState("Class 10");
  const [open, setOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptStudent, setReceiptStudent] = useState(null);

  // --- NAYA STATE SEARCH KE LIYE ---
  const [searchTerm, setSearchTerm] = useState("");

  /* ---------------- FETCH STUDENTS ---------------- */
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => !s.deletedAt); // soft delete filter

      setStudents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ---------------- FILTER BY CLASS & SEARCH ---------------- */
  // Isme hum class aur search term dono ko ek saath filter kar rahe hain
  const filteredStudents = students.filter((s) => {
    const matchesClass = s.className?.toLowerCase() === className.toLowerCase();
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.rollNumber?.toString().includes(searchTerm);

    return matchesClass && matchesSearch;
  });

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
        <p className="font-semibold">
          Pay full fees ₹{total} for {month}?
        </p>
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

  /* ---------------- DELETE (SOFT DELETE) ---------------- */
  const handleDelete = (id) => {
    toast((t) => (
      <div>
        <p className="font-semibold text-red-600">
          Delete this student? (Data will be kept safe)
        </p>
        <div className="flex gap-2 mt-2">
          <button
            className="bg-red-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              await updateDoc(doc(db, "students", id), {
                deletedAt: serverTimestamp(),
              });
              toast.dismiss(t.id);
              toast.success("Student Archived Successfully!");
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

        {/* FILTERS & SEARCH */}
        <div className="flex flex-wrap gap-4 mb-4 items-center">
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

          {/* --- NAYA SEARCH INPUT --- */}
          <input
            type="text"
            placeholder="Search by name or roll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded-lg flex-1 min-w-[200px] outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            onClick={() => { setEditStudent(null); setOpen(true); }}
            className="bg-amber-300 px-4 py-2 rounded font-bold"
          >
            Add Student
          </button>
        </div>

        {/* TABLE */}
        {!loading && (
          <div className="overflow-x-auto rounded-2xl border bg-white shadow">
            <table className="w-full text-base text-left">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700">
                <tr>
                  <th className="p-4">Photo</th>
                  <th className="p-4">Roll</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Father</th>
                  <th className="p-4 text-center">Attendance</th>
                  <th className="p-4 text-center">Total</th>
                  <th className="p-4 text-center">Paid</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((s) => {

                  const fee = s.fees?.[month] || { total: 0, paid: 0 };
                  const totalFees = Number(fee.total);
                  const paidFees = Number(fee.paid);

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
                      className="border-b hover:bg-blue-50 transition"
                    >

                      {/* PHOTO */}
                      <td className="p-4">
                        {s.photoURL ? (
                          <img
                            src={s.photoURL}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-bold">
                            {s.name?.charAt(0)}
                          </div>
                        )}
                      </td>

                      {/* ROLL */}
                      <td className="p-4 font-semibold text-gray-700">
                        {s.rollNumber}
                      </td>

                      {/* NAME */}
                      <td className="p-4 font-bold text-gray-900">
                        {s.name}
                      </td>

                      {/* CLASS */}
                      <td className="p-4">
                        {s.className}
                      </td>

                      {/* FATHER */}
                      <td className="p-4">
                        {s.fatherName}
                      </td>

                      {/* ATTENDANCE */}
                      <td className="p-4 text-center space-x-2">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                          P: {presentCount}
                        </span>
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                          A: {absentCount}
                        </span>
                      </td>

                      {/* TOTAL */}
                      <td className="p-4 text-center font-semibold text-green-700">
                        ₹{totalFees}
                      </td>

                      {/* PAID */}
                      <td className="p-4 text-center font-semibold text-purple-700">
                        ₹{paidFees}
                      </td>

                      {/* STATUS */}
                      <td className="p-4 text-center">
                        {paidFees >= totalFees ? (
                          <span className="px-4 py-1 rounded-full text-sm font-bold
                    bg-green-100 text-green-700 border border-green-300">
                            PAID
                          </span>
                        ) : (
                          <span className="px-4 py-1 rounded-full text-sm font-bold
                    bg-orange-100 text-orange-700 border border-orange-300">
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
                            className="px-4 py-2 rounded-lg text-sm font-semibold
                      bg-gradient-to-r from-purple-600 to-purple-500
                      text-white shadow hover:from-purple-700 hover:to-purple-600
                      transition"
                          >
                            Receipt
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePayFees(s)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold
                      bg-gradient-to-r from-blue-600 to-blue-500
                      text-white shadow hover:from-blue-700 hover:to-blue-600
                      transition"
                          >
                            Pay
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(s.id)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold
                    border border-red-500 text-red-600
                    hover:bg-red-600 hover:text-white
                    transition"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Agar search result khali ho */}
            {filteredStudents.length === 0 && (
              <div className="p-10 text-center text-gray-500">
                No students found matching your search.
              </div>
            )}
          </div>
        )}

      </div>

      {open && (
        <AddStudent
          close={() => { setOpen(false); setEditStudent(null); }}
          editData={editStudent}
        />
      )}

      {showReceipt && receiptStudent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowReceipt(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <FeesReceipt
              name={receiptStudent.name}
              studentClass={receiptStudent.className}
              monthlyFee={receiptStudent.fees?.[month]?.paid}
              payMonth={month}
              paidAt={receiptStudent.fees?.[month]?.paidAt}
              onClose={() => setShowReceipt(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}