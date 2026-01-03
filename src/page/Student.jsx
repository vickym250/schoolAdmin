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
import { useNavigate } from "react-router-dom";
import { updateTotalStudents } from "../component/updateTotalStudents";

export default function StudentList() {
  /* =================== BASIC =================== */
  let navigator = useNavigate()
  const sessions = ["2024-25", "2025-26", "2026-27"];
  const [session, setSession] = useState("2025-26");

  const months = [
    "April", "May", "June",
    "July", "August", "September",
    "October", "November", "December",
    "January", "February", "March",
  ];

  const [month, setMonth] = useState("April");
  const [className, setClassName] = useState("Class 10");

  /* =================== UI =================== */
  const [open, setOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptStudent, setReceiptStudent] = useState(null);

  /* =================== DATA =================== */
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  /* =================== LOAD STUDENTS =================== */
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => !s.deletedAt);
      setStudents(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* =================== FILTER & SORT (ASCENDING ORDER) =================== */
  const filteredStudents = students
    .filter((s) => {
      const matchSession = s.session === session;
      const matchClass =
        s.className?.toLowerCase() === className.toLowerCase();
      const matchSearch =
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber?.toString().includes(searchTerm);

      return matchSession && matchClass && matchSearch;
    })
    // 🟢 Yahan Ascending Sort add kiya hai
    .sort((a, b) => parseInt(a.rollNumber || 0) - parseInt(b.rollNumber || 0));

  /* =================== PAY FEES =================== */
  const handlePayFees = async (student) => {
    const fee = student.fees?.[month] || { total: 0, paid: 0 };
    const total = Number(fee.total || student.admissionFees || 0);
    const paid = Number(fee.paid || 0);

    if (paid >= total && total > 0) {
      toast.error("Already Paid!");
      return;
    }

    toast((t) => (
      <div>
        <p className="font-semibold">
          Pay full fees ₹{total} for {month} ({session})?
        </p>
        <div className="flex gap-2 mt-3">
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              await updateDoc(doc(db, "students", student.id), {
                [`fees.${month}.paid`]: total,
                [`fees.${month}.total`]: total,
                [`fees.${month}.paidAt`]: serverTimestamp(),
              });
              toast.dismiss(t.id);
              toast.success("Fees Paid Successfully");
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

  /* =================== DELETE =================== */
  const handleDelete = async(id) => {
    toast((t) => (
      <div>
        <p className="font-semibold text-red-600">Delete this student?</p>
        <div className="flex gap-2 mt-3">
          <button
            className="bg-red-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              await updateDoc(doc(db, "students", id), {
                deletedAt: serverTimestamp(),
              });
              toast.dismiss(t.id);
              toast.success("Student Archived");
              await updateTotalStudents();
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

  /* =================== EDIT HANDLER =================== */
  const handleEdit = (student) => {
    setEditStudent(student);
    setOpen(true);
  };

  /* =================== UI =================== */
  return (
    <div className="p-6 bg-gray-100 mx-auto container">
      <div className={`bg-white p-6 rounded-xl shadow ${open ? "blur-sm" : ""}`}>
        <h2 className="text-2xl font-bold mb-4">
          Student List ({session})
        </h2>

        {/* CONTROLS */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <select value={session} onChange={(e) => setSession(e.target.value)}
            className="border px-3 py-2 rounded font-bold bg-blue-50">
            {sessions.map((s) => <option key={s}>{s}</option>)}
          </select>

          <select value={month} onChange={(e) => setMonth(e.target.value)}
            className="border px-3 py-2 rounded">
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>

          <select value={className} onChange={(e) => setClassName(e.target.value)}
            className="border px-3 py-2 rounded">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i}>Class {i + 1}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search name / roll"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded flex-1 min-w-[200px]"
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
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3">Photo</th>
                  <th className="p-3">Roll</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Father</th>
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 text-center">Paid</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((s) => {
                  const fee = s.fees?.[month] || { total: 0, paid: 0 };
                  const total = Number(fee.total || s.admissionFees || 0);
                  const paid = Number(fee.paid || 0);

                  return (
                    <tr key={s.id} className="border-b hover:bg-blue-50">
                      <td className="p-3">
                        {s.photoURL ? (
                          <img src={s.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            {s.name?.[0]}
                          </div>
                        )}
                      </td>
                      <td className="p-3">{s.rollNumber}</td>
                      <td className="p-3 font-bold">{s.name}</td>
                      <td className="p-3">{s.className}</td>
                      <td className="p-3">{s.fatherName}</td>
                      <td className="p-3 text-center">₹{total}</td>
                      <td className="p-3 text-center">₹{paid}</td>
                      <td className="p-3 text-center">
                        {paid >= total && total > 0 ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">PAID</span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">PENDING</span>
                        )}
                      </td>
                      <td className="p-3 text-center flex flex-wrap gap-2 justify-center">
                        {paid >= total && total > 0 ? (
                          <button
                            onClick={() => { setReceiptStudent(s); setShowReceipt(true); }}
                            className="bg-purple-600 text-white px-3 py-1 rounded text-xs">
                            Receipt
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePayFees(s)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                            Pay
                          </button>
                        )}
                        {/* 🟢 EDIT BUTTON */}
                        <button
                          onClick={() => handleEdit(s)}
                          className="bg-amber-500 text-white px-3 py-1 rounded text-xs">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="border border-red-500 text-red-600 px-3 py-1 rounded text-xs">
                          Delete
                        </button>
                        <button
                          onClick={() => navigator(`/idcard/${s.id}`)}
                          className="border border-blue-500 text-blue-600 px-3 py-1 rounded text-xs">
                          IdCard
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No students found
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
              payMonth={`${month} (${session})`}
              paidAt={receiptStudent.fees?.[month]?.paidAt}
              onClose={() => setShowReceipt(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}