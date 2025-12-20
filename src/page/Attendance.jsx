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
  const sessions = ["2024-25", "2025-26", "2026-27"];
  const [session, setSession] = useState("2025-26");

  // School Session Order (April to March)
  const months = [
    "April", "May", "June", "July", "August", "September", 
    "October", "November", "December", "January", "February", "March"
  ];

  const today = new Date();
  const currentMonthName = today.toLocaleString('en-US', { month: 'long' });
  const currentDay = today.getDate();

  const [month, setMonth] = useState(currentMonthName);
  const [className, setClassName] = useState("Class 10");
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => !s.deletedAt);
      setStudents(list);
    });
    return () => unsub();
  }, []);

  // 📅 Dino ki sankhya nikalne ke liye sahi saal ka chunav
  const getDaysInMonth = () => {
    const mIndex = months.indexOf(month);
    const startYear = parseInt(session.split("-")[0]);
    // Agar mahina Jan, Feb, March hai toh saal +1 hoga (e.g. 2026)
    const actualYear = mIndex >= 9 ? startYear + 1 : startYear;
    
    // JS Date mein month 0-indexed hota hai, isliye hum month name se index nikalenge
    const dateObj = new Date(`${month} 1, ${actualYear}`);
    return new Date(actualYear, dateObj.getMonth() + 1, 0).getDate();
  };

  /* ⭐ MARK ATTENDANCE */
  const markAttendance = async (student, day, status) => {
    const dateKey = `${session}_${month}_day_${day}`;
    const existingStatus = student.attendance?.[dateKey];

    // 🔒 SMART LOCK LOGIC (Session Aware)
    const selectedMonthOrder = months.indexOf(month);
    const currentMonthOrder = months.indexOf(currentMonthName);

    // Past date check based on school session order
    const isPastMonth = selectedMonthOrder < currentMonthOrder;
    const isCurrentMonthPastDay = (selectedMonthOrder === currentMonthOrder) && (day < currentDay);
    
    // Agar pichla session hai ya pichla mahina/din isi session ka
    const isPastDate = (session < "2025-26") || isPastMonth || isCurrentMonthPastDay;

    if (isPastDate && (existingStatus === "P" || existingStatus === "A")) {
      toast.error("Locked: Bhari hui purani attendance badal nahi sakte");
      return;
    }

    try {
      await updateDoc(doc(db, "students", student.id), {
        [`attendance.${dateKey}`]: status,
      });
      toast.success(`${student.name} marked ${status}`);
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const filteredData = students.filter((s) => {
    if (s.className !== className) return false;
    // Sirf wahi students dikhe jo is session ke admitted hain
    if (s.session !== session) return false; 
    if (searchTerm && !s.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center md:text-left">
        Attendance Dashboard ({session})
      </h2>

      {/* FILTERS SECTION */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-col min-w-[120px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Session</label>
          <select value={session} onChange={(e) => setSession(e.target.value)} className="border px-3 py-2 rounded-lg bg-blue-50 border-blue-100 font-semibold">
            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col min-w-[120px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border px-3 py-2 rounded-lg">
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="flex flex-col min-w-[120px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Class</label>
          <select value={className} onChange={(e) => setClassName(e.target.value)} className="border px-3 py-2 rounded-lg">
            {Array.from({ length: 12 }, (_, i) => (<option key={i}>Class {i + 1}</option>))}
          </select>
        </div>

        <div className="flex flex-col flex-grow">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Search Student</label>
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name..." className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-auto border rounded-xl bg-white shadow-lg">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="border-b p-4 sticky left-0 bg-slate-800 z-20 text-left w-64">Student Details</th>
              {[...Array(getDaysInMonth())].map((_, i) => (
                <th key={i} className={`border-b p-2 text-xs font-bold ${(i + 1 === currentDay && month === currentMonthName) ? "bg-orange-500" : ""}`}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(student => (
              <tr key={student.id} className="hover:bg-blue-50 transition-colors border-b">
                <td className="p-3 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-10">
                  <div className="font-bold text-gray-700 truncate">{student.name}</div>
                  <div className="text-[10px] text-gray-400 italic font-medium">Roll: {student.rollNumber}</div>
                </td>
                
                {[...Array(getDaysInMonth())].map((_, i) => {
                  const day = i + 1;
                  const key = `${session}_${month}_day_${day}`;
                  const status = student.attendance?.[key];
                  
                  // Logic: School Session sequence ke hisab se lock
                  const selectedMonthOrder = months.indexOf(month);
                  const currentMonthOrder = months.indexOf(currentMonthName);
                  const isPastDate = (session < "2025-26") || (selectedMonthOrder < currentMonthOrder) || (selectedMonthOrder === currentMonthOrder && day < currentDay);

                  const isLocked = isPastDate && (status === "P" || status === "A");

                  return (
                    <td key={day} className={`border-l p-1 text-center ${isPastDate && !status ? "bg-yellow-50" : ""}`}>
                      <div className="flex flex-col gap-1 items-center">
                        <button
                          disabled={isLocked}
                          onClick={() => markAttendance(student, day, "P")}
                          className={`w-7 h-6 text-[10px] font-black rounded transition-all ${
                            status === "P" ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-400 hover:bg-green-200"
                          } ${isLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-90"}`}
                        > P </button>
                        <button
                          disabled={isLocked}
                          onClick={() => markAttendance(student, day, "A")}
                          className={`w-7 h-6 text-[10px] font-black rounded transition-all ${
                            status === "A" ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-400 hover:bg-red-200"
                          } ${isLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-90"}`}
                        > A </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredData.length === 0 && (
        <div className="bg-white p-10 text-center border-b rounded-b-xl text-gray-500 font-medium">
          No students found for {className} in session {session}.
        </div>
      )}
    </div>
  );
}