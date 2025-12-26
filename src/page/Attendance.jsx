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

  /* ---------------- SESSION / MONTH ---------------- */
  const sessions = ["2024-25", "2025-26", "2026-27"];
  const [session, setSession] = useState("2025-26");

  const months = [
    "April","May","June","July","August","September",
    "October","November","December","January","February","March"
  ];

  const today = new Date();
  const currentMonthName = today.toLocaleString("en-US", { month: "long" });
  const currentDay = today.getDate();

  const [month, setMonth] = useState(currentMonthName);
  const [className, setClassName] = useState("Class 10");
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 Search State

  /* ---------------- LOAD STUDENTS ---------------- */
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

  /* ---------------- INIT ATTENDANCE ---------------- */
  useEffect(() => {
    students.forEach(async (student) => {
      if (student.attendance === undefined) {
        try {
          await updateDoc(doc(db, "students", student.id), {
            attendance: {}
          });
        } catch (e) {
          console.error("Attendance init failed", e);
        }
      }
    });
  }, [students]);

  /* ---------------- DAYS IN MONTH ---------------- */
  const getDaysInMonth = () => {
    const mIndex = months.indexOf(month);
    const startYear = parseInt(session.split("-")[0]);
    const actualYear = mIndex >= 9 ? startYear + 1 : startYear;
    const dateObj = new Date(`${month} 1, ${actualYear}`);
    return new Date(actualYear, dateObj.getMonth() + 1, 0).getDate();
  };

  /* ---------------- MARK ATTENDANCE ---------------- */
  const markAttendance = async (student, day, status) => {
    const dayKey = `${month}_day_${day}`;
    const monthData = student.attendance?.[month] || {};
    const prevStatus = monthData[dayKey];

    if (prevStatus === status) return;

    const selectedMonthOrder = months.indexOf(month);
    const currentMonthOrder = months.indexOf(currentMonthName);

    const isPastDate =
      session < "2025-26" ||
      selectedMonthOrder < currentMonthOrder ||
      (selectedMonthOrder === currentMonthOrder && day < currentDay);

    if (isPastDate && prevStatus) {
      toast.error("Locked: Cannot change past attendance");
      return;
    }

    let present = monthData.present || 0;
    let absent = monthData.absent || 0;

    if (prevStatus === "P") present--;
    if (prevStatus === "A") absent--;

    if (status === "P") present++;
    if (status === "A") absent++;

    try {
      await updateDoc(doc(db, "students", student.id), {
        [`attendance.${month}.${dayKey}`]: status,
        [`attendance.${month}.present`]: present,
        [`attendance.${month}.absent`]: absent,
      });
      toast.success(`${student.name} marked ${status}`);
    } catch (e) {
      toast.error("Update failed");
    }
  };

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredData = students.filter((s) => {
    // 1. Class filter
    const matchClass = s.className === className;
    // 2. Session filter
    const matchSession = s.session === session;
    // 3. Name Search filter (Case Insensitive)
    const matchSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchClass && matchSession && matchSearch;
  });

return (
  <div className="min-h-screen bg-gray-50 px-2 py-4 sm:px-6 md:py-8 font-sans">
    <div className="container mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-tight">
          Attendance Dashboard <span className="text-blue-600 block sm:inline">({session})</span>
        </h2>
        <p className="text-xs font-medium text-gray-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 self-start md:self-center">
          📅 {month}, {session}
        </p>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="grid grid-cols-2 lg:flex lg:flex-nowrap gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <select value={session} onChange={(e) => setSession(e.target.value)}
          className="border border-gray-300 p-2.5 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
          {sessions.map(s => <option key={s}>{s}</option>)}
        </select>

        <select value={month} onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-300 p-2.5 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
          {months.map(m => <option key={m}>{m}</option>)}
        </select>

        <select value={className} onChange={(e) => setClassName(e.target.value)}
          className="border border-gray-300 p-2.5 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i}>Class {i + 1}</option>
          ))}
        </select>

        {/* 🔍 Active Search Input */}
        <div className="border border-gray-300 p-2.5 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student by name..."
            className="border border-gray-300 p-2.5 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* MOBILE SWIPE HINT */}
      <div className="flex items-center gap-2 mb-3 text-[11px] font-medium text-blue-500 md:hidden animate-pulse">
        <span>⬅️ Swipe left/right for dates</span>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh] relative">
          <table className="w-full border-separate border-spacing-0 table-fixed">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="sticky left-0 z-30 bg-slate-800 p-4 text-left w-[140px] sm:w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.1)] border-b border-slate-700">
                  Student Name
                </th>
                {[...Array(getDaysInMonth())].map((_, i) => (
                  <th key={i}
                    className={`p-2 text-center text-[10px] sm:text-xs font-bold border-b border-slate-700 w-[45px] sm:w-[55px]
                    ${i + 1 === currentDay && month === currentMonthName ? "bg-orange-500" : ""}`}>
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredData.map(student => {
                const monthData = student.attendance?.[month] || {};
                return (
                  <tr key={student.id} className="group hover:bg-blue-50/50 transition-colors">
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-50 p-3 sm:p-4 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-colors">
                      <div className="font-bold text-xs sm:text-sm text-gray-800 truncate">
                        {student.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        Roll: {student.rollNumber}
                      </div>
                    </td>

                    {[...Array(getDaysInMonth())].map((_, i) => {
                      const day = i + 1;
                      const status = monthData[`${month}_day_${day}`];
                      const selectedMonthOrder = months.indexOf(month);
                      const currentMonthOrder = months.indexOf(currentMonthName);

                      const isPastDate =
                        session < "2025-26" ||
                        selectedMonthOrder < currentMonthOrder ||
                        (selectedMonthOrder === currentMonthOrder && day < currentDay);

                      const isLocked = isPastDate && status;

                      return (
                        <td key={day} className="text-center p-1 sm:p-2">
                          <div className="flex flex-col gap-1 items-center">
                            <button
                              disabled={isLocked}
                              onClick={() => markAttendance(student, day, "P")}
                              className={`w-8 h-7 sm:w-10 sm:h-8 text-[10px] font-black rounded-md transition-all
                                ${status === "P" ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}
                                ${isLocked ? "opacity-25 cursor-not-allowed" : "active:scale-90"}`}>
                              P
                            </button>
                            <button
                              disabled={isLocked}
                              onClick={() => markAttendance(student, day, "A")}
                              className={`w-8 h-7 sm:w-10 sm:h-8 text-[10px] font-black rounded-md transition-all
                                ${status === "A" ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}
                                ${isLocked ? "opacity-25 cursor-not-allowed" : "active:scale-90"}`}>
                              A
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredData.length === 0 && (
        <div className="p-16 text-center bg-white mt-4 rounded-2xl border-2 border-dashed border-gray-200 shadow-inner">
          <div className="text-4xl mb-3 animate-bounce">🔍</div>
          <p className="text-gray-500 font-bold">No students found matching your search or filters.</p>
        </div>
      )}
    </div>
  </div>
);
}