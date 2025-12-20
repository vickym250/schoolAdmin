import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function AbsentStudents() {
  const sessions = ["2024-25", "2025-26", "2026-27"];
  const [session, setSession] = useState("2025-26");
  
  // 🟢 "All" ko default state banaya
  const [className, setClassName] = useState("All"); 
  const [students, setStudents] = useState([]);
  
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = months[today.getMonth()];
  const todayKey = `${session}_${currentMonth}_day_${currentDay}`;

  /* 🔥 FETCH STUDENTS */
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => !s.deletedAt);
      setStudents(list);
    });
    return () => unsub();
  }, []);

  /* 🔍 FILTER ABSENT STUDENTS (All Classes Logic) */
  const absentList = students.filter((s) => {
    // Agar "All" select hai toh class skip karo, warna match karo
    const matchesClass = className === "All" ? true : s.className === className;
    const isAbsentToday = s.attendance?.[todayKey] === "A";
    const matchesSession = s.session === session;

    return matchesClass && isAbsentToday && matchesSession;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <div>
            <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
              Absentees List <span className="animate-pulse">🔴</span>
            </h2>
            <p className="text-gray-500 font-medium">
              {currentDay} {currentMonth}, {session} | {className === "All" ? "All Classes" : className}
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
             <select 
              value={session} 
              onChange={(e) => setSession(e.target.value)} 
              className="border px-4 py-2 rounded-xl bg-gray-50 font-semibold outline-none focus:ring-2 focus:ring-red-400"
            >
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              value={className} 
              onChange={(e) => setClassName(e.target.value)} 
              className="border px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="All">All Classes</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border text-center">
            <p className="text-xs text-gray-400 uppercase font-black tracking-wider">Filtered Students</p>
            <p className="text-3xl font-black text-gray-800">
              {students.filter(s => (className === "All" ? true : s.className === className) && s.session === session).length}
            </p>
          </div>
          <div className="bg-red-600 p-5 rounded-xl shadow-lg text-center text-white">
            <p className="text-xs opacity-80 uppercase font-black tracking-wider">Total Absentees</p>
            <p className="text-3xl font-black">{absentList.length}</p>
          </div>
        </div>

        {/* LIST */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                  <th className="p-4 border-b">Roll & Class</th>
                  <th className="p-4 border-b">Student Details</th>
                  <th className="p-4 border-b">Guardian</th>
                  <th className="p-4 border-b">Phone</th>
                  <th className="p-4 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {absentList.length > 0 ? (
                  absentList.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-red-50 transition-all">
                      <td className="p-4">
                        <div className="font-black text-red-600">#{student.rollNumber || '0'}</div>
                        <div className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full inline-block font-bold text-gray-600">
                          {student.className}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-800 uppercase text-sm">{student.name}</div>
                        <div className="text-xs text-gray-400">{student.gender}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-medium">
                        {student.fatherName}
                      </td>
                      <td className="p-4">
                         <div className="text-sm font-bold text-blue-600">{student.phone}</div>
                      </td>
                      <td className="p-4 text-center">
                        <a 
                          href={`tel:${student.phone}`} 
                          className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 shadow-md active:scale-95 transition-all"
                        >
                           📞 CALL
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-20 text-center">
                      <div className="text-6xl mb-4">🏆</div>
                      <p className="text-xl font-bold text-gray-800">100% Attendance!</p>
                      <p className="text-gray-400">Sabhi bacche aaj school aaye hain.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}