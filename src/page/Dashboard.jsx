import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");

  const today = new Date();
  const todayDay = today.getDate();
  const currentMonth = today.toLocaleString("en-IN", { month: "long" });

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  useEffect(() => {
    return onSnapshot(collection(db, "students"), (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => !s.deletedAt);
      setStudents(list);
    });
  }, []);

  const classes = ["All", ...new Set(students.map(s => s.className))];
  const filteredStudents = selectedClass === "All" ? students : students.filter(s => s.className === selectedClass);

  const totalStudents = filteredStudents.length;
  const presentStudentsToday = filteredStudents.filter((s) => {
    const key = `${currentMonth}_day_${todayDay}`;
    return s.attendance?.[key] === "P";
  }).length;

  const totalFeesAll = filteredStudents.reduce((sum, s) => {
    months.forEach(m => { sum += s.fees?.[m]?.total || 0; });
    return sum;
  }, 0);

  const totalCollectionAll = filteredStudents.reduce((sum, s) => {
    months.forEach(m => { sum += s.fees?.[m]?.paid || 0; });
    return sum;
  }, 0);

  const totalPendingFees = totalFeesAll - totalCollectionAll;

  const classStats = classes.filter(c => c !== "All").map(cls => ({
    className: cls,
    count: students.filter(s => s.className === cls).length,
  }));

  return (
    /* md:ml-20 (Laptop icon-sidebar ke liye) lg:ml-64 (Bade sidebar ke liye) */
    <div className="container mx-auto bg-gray-50 p-4 md:p-6 lg:p-8  transition-all duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 mt-10 md:mt-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">
            📊 School Dashboard
          </h1>
          <p className="text-gray-500 text-sm">Welcome back, Admin</p>
        </div>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full sm:w-48 px-4 py-2.5 rounded-xl border-gray-200 border bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
        >
          {classes.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* TOP CARDS - Multi-screen responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <StatCard title="Total Students" value={totalStudents} icon="🎓" gradient="from-blue-500 to-blue-700" />
        <StatCard title="Present Today" value={presentStudentsToday} icon="✅" gradient="from-emerald-500 to-teal-600" />
        <StatCard title="Total Fees" value={`₹${totalFeesAll}`} icon="💰" gradient="from-indigo-500 to-purple-600" />
        <StatCard title="Collection" value={`₹${totalCollectionAll}`} icon="🏦" gradient="from-orange-400 to-amber-600" />
        <StatCard title="Pending" value={`₹${totalPendingFees}`} icon="⚠️" gradient="from-rose-500 to-red-600" />
      </div>

      {/* EXTRA SECTIONS */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* QUICK SUMMARY */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-5 text-gray-800 flex items-center gap-2">
            📌 Quick Summary
          </h2>
          <div className="space-y-4">
            <Row label="Total Students" value={totalStudents} />
            <Row label="Present Today" value={presentStudentsToday} valueClass="text-emerald-600 bg-emerald-50 px-2 rounded" />
            <Row label="Total Fees" value={`₹${totalFeesAll}`} />
            <Row label="Total Paid" value={`₹${totalCollectionAll}`} />
            <Row label="Total Pending" value={`₹${totalPendingFees}`} valueClass="text-rose-600 bg-rose-50 px-2 rounded" />
          </div>
        </div>

        {/* CLASS WISE - Scrollable on small screens */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-lg font-bold mb-5 text-gray-800">
            🏫 Class-wise Strength
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {classStats.map(cls => (
              <div
                key={cls.className}
                className="group border border-gray-100 rounded-xl p-4 text-center bg-gray-50 hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                <p className="text-xs text-gray-500 group-hover:text-blue-100 uppercase font-bold tracking-wider">{cls.className}</p>
                <p className="text-2xl font-black mt-1">
                  {cls.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 py-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
        <p>Session : 2025 – 26</p>
        <p className="bg-white px-4 py-1 rounded-full shadow-sm">Last Sync: {new Date().toLocaleTimeString()}</p>
      </footer>

    </div>
  );
}

/* ================= MINI COMPONENTS ================= */

const StatCard = ({ title, value, icon, gradient }) => (
  <div className={`relative overflow-hidden rounded-2xl shadow-md text-white bg-gradient-to-br ${gradient} p-5 transition-transform hover:scale-[1.02] active:scale-95`}>
    <div className="relative z-10 flex flex-col justify-between h-full">
       <div className="flex justify-between items-start">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</p>
          <span className="text-2xl">{icon}</span>
       </div>
       <p className="text-2xl md:text-3xl font-black mt-4 truncate">{value}</p>
    </div>
    {/* Decorative Circle */}
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
  </div>
);

const Row = ({ label, value, valueClass = "" }) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-600 font-medium">{label}</span>
    <span className={`font-bold text-sm md:text-base ${valueClass}`}>{value}</span>
  </div>
);