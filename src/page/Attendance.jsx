import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function Attendance() {

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [className, setClassName] = useState("Class 10");
  const [students, setStudents] = useState([]);
  
  // 🔥 SEARCH & TOGGLE STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [showAbsentOnly, setShowAbsentOnly] = useState(false);

  // Aaj ki date nikaalne ke liye (Absent filter ke liye)
  const todayDay = new Date().getDate();

  // 🔥 Load Students Realtime
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(s => !s.deletedAt); 

      setStudents(list);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic: Class + Search + Absent Toggle
  const data = students.filter((s) => {
    const matchesClass = s.className === className;
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Agar toggle on hai, toh check karo ki aaj 'A' mark hai ya nahi
    if (showAbsentOnly) {
      const dateKey = `${month}_day_${todayDay}`;
      return matchesClass && matchesSearch && s.attendance?.[dateKey] === "A";
    }

    return matchesClass && matchesSearch;
  });

  // Selected month → total days
  const getDaysInMonth = () => {
    const m = months.indexOf(month);
    const year = new Date().getFullYear();
    return new Date(year, m + 1, 0).getDate();
  };

  // ⭐ Mark Attendance
  const markAttendance = async (student, day, status) => {
    const dateKey = `${month}_day_${day}`;

    try {
      await updateDoc(doc(db, "students", student.id), {
        [`attendance.${dateKey}`]: status, // "P" or "A"
      });

      toast.success(`${student.name} → ${status}`);
    } catch (err) {
      toast.error("Error updating attendance");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h2 className="text-2xl font-bold mb-4">Attendance Management</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          {months.map((m) => <option key={m}>{m}</option>)}
        </select>

        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
            <option key={c}>Class {c}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded-lg outline-none focus:border-blue-500"
        />

        {/* 🔥 TOGGLE ABSENT BUTTON */}
        <button
          onClick={() => setShowAbsentOnly(!showAbsentOnly)}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            showAbsentOnly 
            ? "bg-red-600 text-white shadow-lg" 
            : "bg-white border border-red-500 text-red-600"
          }`}
        >
          {showAbsentOnly ? "Showing Absent Students" : "Filter Absentees"}
        </button>
      </div>

      {/* Attendance Table */}
      <div className="overflow-auto border rounded-lg bg-white">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Student</th>

              {/* DATE HEADERS */}
              {[...Array(getDaysInMonth())].map((_, i) => (
                <th key={i} className="p-1 border text-center">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((student) => (
              <tr key={student.id} className="border-b">
                <td className="p-2 font-semibold border">
                  {student.name}
                </td>

                {/* Each Day Attendance */}
                {[...Array(getDaysInMonth())].map((_, i) => {
                  const day = i + 1;
                  const dateKey = `${month}_day_${day}`;
                  const status = student.attendance?.[dateKey] || "";

                  return (
                    <td key={i} className="border text-center">

                      {/* PRESENT */}
                      <button
                        className={`px-2 py-1 text-xs rounded ${
                          status === "P"
                            ? "bg-green-500 text-white"
                            : "bg-gray-200"
                        }`}
                        onClick={() => markAttendance(student, day, "P")}
                      >
                        P
                      </button>

                      {/* ABSENT */}
                      <button
                        className={`px-2 py-1 ml-1 text-xs rounded ${
                          status === "A"
                            ? "bg-red-500 text-white"
                            : "bg-gray-200"
                        }`}
                        onClick={() => markAttendance(student, day, "A")}
                      >
                        A
                      </button>

                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No students found matching this criteria.
          </div>
        )}
      </div>
    </div>
  );
}