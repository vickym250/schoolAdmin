import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function Attendance() {
  /* ---------------- STATES ---------------- */
  const sessions = ["2024-25", "2025-26", "2026-27"];
  const [session, setSession] = useState("2025-26");
  const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
  const today = new Date();
  const currentMonthName = today.toLocaleString("en-US", { month: "long" });
  const currentDay = today.getDate();

  const [month, setMonth] = useState(currentMonthName);
  const [className, setClassName] = useState("Class 10");
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [holidays, setHolidays] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null); // Mobile tap support ke liye

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.deletedAt));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const holidayDocRef = doc(db, "metadata", `holidays_${session}_${month}`);
    const unsub = onSnapshot(holidayDocRef, (docSnap) => {
      setHolidays(docSnap.exists() ? docSnap.data() : {});
    });
    return () => unsub();
  }, [session, month]);

  /* ---------------- HELPERS ---------------- */
  const getActualYear = () => {
    const mIndex = months.indexOf(month);
    const startYear = parseInt(session.split("-")[0]);
    return mIndex >= 9 ? startYear + 1 : startYear;
  };

  const getDaysInMonth = () => {
    const actualYear = getActualYear();
    const dateObj = new Date(`${month} 1, ${actualYear}`);
    return new Date(actualYear, dateObj.getMonth() + 1, 0).getDate();
  };

  const isSunday = (day) => {
    const actualYear = getActualYear();
    return new Date(`${month} ${day}, ${actualYear}`).getDay() === 0;
  };

  /* ---------------- ACTIONS ---------------- */
  const toggleHoliday = async (day) => {
    if (isSunday(day)) return toast.error("Sunday is default holiday");
    const dayKey = `day_${day}`;
    if (holidays[dayKey]) return toast.error("Holiday is already locked!");

    let holidayReason = prompt(`Enter Holiday Reason for Day ${day}:`);
    if (!holidayReason) return;

    try {
      const actualYear = getActualYear();
      const holidayDate = `${day} ${month} ${actualYear}`;

      // 1. Lock Holiday in Metadata (Attendance logic ke liye)
      await setDoc(doc(db, "metadata", `holidays_${session}_${month}`), { 
        [dayKey]: true, 
        [`${dayKey}_reason`]: holidayReason 
      }, { merge: true });

      // 2. Add to Notices Collection (Students ko dikhane ke liye)
      await addDoc(collection(db, "notices"), {
        title: "Holiday Notice 🚩",
        description: `School will remain closed on ${holidayDate} due to: ${holidayReason}`,
        date: holidayDate,
        createdAt: serverTimestamp(),
        audience: "student",
        type: "holiday",
        session: session
      });

      toast.success("Holiday Locked & Notice Published!");
    } catch (e) { 
      console.error(e);
      toast.error("Error setting holiday!"); 
    }
  };

  const markAttendance = async (student, day, status) => {
    if (holidays[`day_${day}`] || isSunday(day)) return toast.error("Locked!");
    const dayKey = `${month}_day_${day}`;
    const monthData = student.attendance?.[month] || {};
    const prevStatus = monthData[dayKey];
    if (prevStatus === status) return;

    // Past Date Lock
    const selectedMonthOrder = months.indexOf(month);
    const currentMonthOrder = months.indexOf(currentMonthName);
    const isPastDate = session < "2025-26" || selectedMonthOrder < currentMonthOrder || (selectedMonthOrder === currentMonthOrder && day < currentDay);
    if (isPastDate && prevStatus) return toast.error("Locked: Past Attendance!");

    let present = monthData.present || 0;
    let absent = monthData.absent || 0;
    if (prevStatus === "P") present--; if (prevStatus === "A") absent--;
    if (status === "P") present++; if (status === "A") absent++;

    try {
      await updateDoc(doc(db, "students", student.id), {
        [`attendance.${month}.${dayKey}`]: status,
        [`attendance.${month}.present`]: present,
        [`attendance.${month}.absent`]: absent,
      });
      toast.success("Updated!");
    } catch (e) { toast.error("Failed!"); }
  };

  const filteredData = students.filter(s => s.className === className && s.session === session && s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4 sm:px-6 md:py-8 font-sans" onClick={() => setActiveTooltip(null)}>
      <div className="container mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">Attendance Pro <span className="text-blue-600 block sm:inline">({session})</span></h2>
          <p className="text-xs font-bold text-gray-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase">📅 {month}, {getActualYear()}</p>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-2 lg:flex lg:flex-nowrap gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <select value={session} onChange={(e) => setSession(e.target.value)} className="border border-gray-300 p-2 rounded-lg text-sm w-full outline-none">{sessions.map(s => <option key={s}>{s}</option>)}</select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border border-gray-300 p-2 rounded-lg text-sm w-full outline-none">{months.map(m => <option key={m}>{m}</option>)}</select>
          <select value={className} onChange={(e) => setClassName(e.target.value)} className="border border-gray-300 p-2 rounded-lg text-sm w-full outline-none">{Array.from({ length: 12 }, (_, i) => <option key={i}>Class {i + 1}</option>)}</select>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="border border-gray-300 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh] relative">
            <table className="w-full border-separate border-spacing-0 table-fixed">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="sticky left-0 z-40 bg-slate-800 p-4 text-left w-[140px] sm:w-[200px] border-b border-slate-700 shadow-md">Student Info</th>
                  {[...Array(getDaysInMonth())].map((_, i) => {
                    const day = i + 1;
                    const sun = isSunday(day);
                    const isH = holidays[`day_${day}`];
                    return (
                      <th key={i} className={`p-2 text-center border-b border-slate-700 w-[50px] sm:w-[55px] ${day === currentDay && month === currentMonthName ? "bg-orange-500" : ""}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold">{day}</span>
                          <button onClick={() => toggleHoliday(day)} className={`text-[9px] px-1 py-0.5 rounded border transition-all ${sun ? "bg-red-700 text-white border-red-800" : isH ? "bg-red-50 text-white border-red-400" : "bg-slate-700 text-gray-400 border-slate-600 hover:text-white"}`}>{sun ? "S" : isH ? "H" : "D"}</button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredData.map(student => {
                  const monthData = student.attendance?.[month] || {};
                  return (
                    <tr key={student.id} className="group hover:bg-blue-50/20">
                      <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-50 p-3 sm:p-4 border-r border-gray-100 font-bold text-xs sm:text-sm text-gray-800 truncate">
                        {student.name}
                        <div className="text-[9px] text-gray-400 font-normal italic">Roll: {student.rollNumber}</div>
                      </td>

                      {[...Array(getDaysInMonth())].map((_, i) => {
                        const day = i + 1;
                        const sun = isSunday(day);
                        const dayKey = `day_${day}`;
                        const isH = holidays[dayKey] || sun;
                        const reason = sun ? "SUNDAY" : (holidays[`${dayKey}_reason`] || "HOLIDAY");
                        const status = monthData[`${month}_day_${day}`];
                        const tooltipKey = `${student.id}_${day}`;

                        return (
                          <td key={day} className={`text-center p-1 sm:p-2 relative group/cell ${isH ? "bg-red-50/40" : ""}`}>
                            {isH ? (
                              <div 
                                className="relative flex items-center justify-center h-[55px] w-full cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTooltip(activeTooltip === tooltipKey ? null : tooltipKey);
                                }}
                              >
                                {/* Holiday Label */}
                                <span className={`text-[8px] font-black rotate-[-90deg] uppercase tracking-tighter ${sun ? "text-red-800" : "text-red-500"}`}>HOLIDAY</span>
                                
                                {/* BADA BOX (Mobile & Desktop) */}
                                {(activeTooltip === tooltipKey) && (
                                  <div className="fixed z-[1000] -translate-y-20 -translate-x-1/2 left-1/2 md:absolute md:-translate-y-24 md:left-1/2 pointer-events-auto">
                                    <div className="bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 min-w-[180px] max-w-[260px] text-center animate-in fade-in zoom-in duration-200">
                                      <div className="text-[10px] font-bold text-red-400 uppercase mb-2 tracking-[0.2em] border-b border-slate-700 pb-2">🚩 Reason</div>
                                      <div className="text-sm font-extrabold text-slate-100 leading-relaxed italic">"{reason}"</div>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 items-center">
                                <button onClick={() => markAttendance(student, day, "P")} className={`w-9 h-7 text-[10px] font-black rounded-lg ${status === "P" ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-400 hover:bg-green-100"}`}>P</button>
                                <button onClick={() => markAttendance(student, day, "A")} className={`w-9 h-7 text-[10px] font-black rounded-lg ${status === "A" ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-400 hover:bg-red-100"}`}>A</button>
                              </div>
                            )}
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
      </div>
    </div>
  );
}