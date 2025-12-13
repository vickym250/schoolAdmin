import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, addDoc, getDocs, query, where, serverTimestamp,
  doc, deleteDoc              // <-- ADD THIS
} from "firebase/firestore";

import toast, { Toaster } from "react-hot-toast";

export default function FinalResultPage() {
  const classes = [
    "Class 1","Class 2","Class 3","Class 4","Class 5","Class 6",
    "Class 7","Class 8","Class 9","Class 10","Class 11","Class 12",
  ];

  const examTypes = ["Quarterly", "Half-Yearly", "Annual"];

  // ---------------- Form States ----------------
  const [showForm, setShowForm] = useState(false); // 🔥 Toggle for popup form
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [roll, setRoll] = useState("");
  const [exam, setExam] = useState("");

  const [rows, setRows] = useState([{ subject: "", total: "", marks: "" }]);

  const addRow = () => {
    setRows([...rows, { subject: "", total: "", marks: "" }]);
  };

  // ------------ SAVE RESULT ----------------
  const saveResult = async () => {
    let totalMarks = rows.reduce((sum, r) => sum + Number(r.total), 0);
    let obtained = rows.reduce((sum, r) => sum + Number(r.marks), 0);
    let percent = ((obtained / totalMarks) * 100).toFixed(2);

    let grade =
      percent >= 90 ? "A+" :
      percent >= 80 ? "A" :
      percent >= 70 ? "B" :
      percent >= 60 ? "C" :
      percent >= 50 ? "D" : "Fail";

    await addDoc(collection(db, "examResults"), {
      name,
      className: cls,
      roll,
      exam,
      rows,
      totalMarks,
      obtained,
      percent,
      grade,
      createdAt: serverTimestamp(),
    });

    toast.success("Result saved successfully!");

    // Reset + Close form
    setName("");
    setCls("");
    setRoll("");
    setExam("");
    setRows([{ subject: "", total: "", marks: "" }]);
    setShowForm(false);
  };

  // ----------------- RESULT TABLE -----------------
  const [filterClass, setFilterClass] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [resultList, setResultList] = useState([]);

  const loadResults = async () => {
    if (!filterClass || !filterExam) return;

    const q1 = query(
      collection(db, "examResults"),
      where("className", "==", filterClass),
      where("exam", "==", filterExam)
    );

    const snap = await getDocs(q1);

    let arr = [];
    snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
    setResultList(arr);
  };

  useEffect(() => {
    loadResults();
  }, [filterClass, filterExam]);

const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this result?")) return;

  await deleteDoc(doc(db, "examResults", id));

  toast.success("Result Deleted!");

  // list refresh
  setResultList(resultList.filter((item) => item.id !== id));
};

  return (
    <div className="p-8 relative">

      <Toaster />

      <h1 className="text-3xl font-bold mb-6">Student Result System</h1>

      {/* ADD RESULT BUTTON */}
      <button
        onClick={() => setShowForm(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded mb-6 hover:bg-blue-700 transition"
      >
        ➕ Add Result
      </button>

      {/* -------------------- POPUP FORM WITH ANIMATION -------------------- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start z-50">

          <div className="bg-white w-full max-w-2xl p-6 rounded-t-2xl shadow-lg animate-slide-up">

            <h2 className="text-2xl font-bold mb-4">Add Student Result</h2>

            <input
              className="border p-2 w-full mb-3"
              placeholder="Student Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex gap-3 mb-3">
              <select
                className="border p-2 w-full"
                value={cls}
                onChange={(e) => setCls(e.target.value)}
              >
                <option>Select Class</option>
                {classes.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <select
                className="border p-2 w-full"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
              >
                <option>Select Exam</option>
                {examTypes.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </div>

            <input
              className="border p-2 w-full mb-4"
              placeholder="Roll Number"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
            />

            <h3 className="text-xl font-semibold mb-2">Marks Table</h3>

            <table className="w-full border mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Subject</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Marks</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="border p-1">
                      <input
                        className="w-full p-1 border"
                        value={r.subject}
                        onChange={(e) => {
                          r.subject = e.target.value;
                          setRows([...rows]);
                        }}
                      />
                    </td>

                    <td className="border p-1">
                      <input
                        type="number"
                        className="w-full p-1 border"
                        value={r.total}
                        onChange={(e) => {
                          r.total = e.target.value;
                          setRows([...rows]);
                        }}
                      />
                    </td>

                    <td className="border p-1">
                      <input
                        type="number"
                        className="w-full p-1 border"
                        value={r.marks}
                        onChange={(e) => {
                          r.marks = e.target.value;
                          setRows([...rows]);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={addRow}
            >
              + Add Subject
            </button>

            <button
              className="bg-blue-600 text-white px-6 py-2 rounded w-full mt-4"
              onClick={saveResult}
            >
              SAVE RESULT
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="text-red-600 text-center w-full mt-4 font-bold"
            >
              CLOSE
            </button>

          </div>
        </div>
      )}

      {/* ------------------------ CLASS RESULT TABLE ------------------------- */}
     <div className="border p-6 rounded bg-white shadow">

  <h2 className="text-2xl font-bold mb-4">Class Result Sheet</h2>

  <div className="flex gap-3 mb-4">
    <select
      className="border p-2 w-full"
      value={filterClass}
      onChange={(e) => setFilterClass(e.target.value)}
    >
      <option>Select Class</option>
      {classes.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </select>

    <select
      className="border p-2 w-full"
      value={filterExam}
      onChange={(e) => setFilterExam(e.target.value)}
    >
      <option>Select Exam</option>
      {examTypes.map((e) => (
        <option key={e}>{e}</option>
      ))}
    </select>
  </div>

  <table className="w-full border">
    <thead>
      <tr className="bg-gray-200">
        <th className="border p-2">Roll</th>
        <th className="border p-2">Name</th>
        <th className="border p-2">Total</th>
        <th className="border p-2">Obtained</th>
        <th className="border p-2">%</th>
        <th className="border p-2">Grade</th>
        <th className="border p-2">Action</th>
      </tr>
    </thead>

    <tbody>
      {resultList.map((r) => (
        <tr key={r.id}>
          <td className="border p-2">{r.roll}</td>
          <td className="border p-2">{r.name}</td>
          <td className="border p-2">{r.totalMarks}</td>
          <td className="border p-2">{r.obtained}</td>
          <td className="border p-2">{r.percent}%</td>
          <td className="border p-2">{r.grade}</td>

          {/* DELETE BUTTON */}
          <td className="border p-2 text-center">
            <button
              onClick={() => handleDelete(r.id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

</div>

      {/* -------- Animation CSS -------- */}
      <style>{`
        .animate-slide-up {
          animation: slideUp 0.35s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
