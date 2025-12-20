import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");

  /* ================= DATE ================= */
  const today = new Date();
  const todayDay = today.getDate();
  const currentMonth = today.toLocaleString("en-IN", { month: "long" });

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  /* ================= STUDENTS ================= */
  useEffect(() => {
    return onSnapshot(collection(db, "students"), (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => !s.deletedAt);

      setStudents(list);
    });
  }, []);

  /* ================= CLASS FILTER ================= */
  const classes = ["All", ...new Set(students.map(s => s.className))];

  const filteredStudents =
    selectedClass === "All"
      ? students
      : students.filter(s => s.className === selectedClass);

  /* ================= COUNTS ================= */
  const totalStudents = filteredStudents.length;

  const presentStudentsToday = filteredStudents.filter((s) => {
    const key = `${currentMonth}_day_${todayDay}`;
    return s.attendance?.[key] === "P";
  }).length;

  /* ================= FEES ================= */
  const totalFeesAll = filteredStudents.reduce((sum, s) => {
    months.forEach(m => {
      sum += s.fees?.[m]?.total || 0;
    });
    return sum;
  }, 0);

  const totalCollectionAll = filteredStudents.reduce((sum, s) => {
    months.forEach(m => {
      sum += s.fees?.[m]?.paid || 0;
    });
    return sum;
  }, 0);

  const totalPendingFees = totalFeesAll - totalCollectionAll;

  /* ================= CLASS STATS ================= */
  const classStats = classes
    .filter(c => c !== "All")
    .map(cls => ({
      className: cls,
      count: students.filter(s => s.className === cls).length,
    }));

  /* ================= UI ================= */
  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          📊 School Dashboard
        </h1>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="mt-4 md:mt-0 px-4 py-2 rounded-lg border bg-white shadow
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {classes.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Students" value={totalStudents} icon="🎓" gradient="from-blue-500 to-blue-600" />
        <StatCard title="Present Today" value={presentStudentsToday} icon="✅" gradient="from-green-500 to-emerald-600" />
        <StatCard title="Total Fees" value={`₹ ${totalFeesAll}`} icon="💰" gradient="from-purple-500 to-indigo-600" />
        <StatCard title="Total Collection" value={`₹ ${totalCollectionAll}`} icon="🏦" gradient="from-orange-500 to-amber-500" />
        <StatCard title="Pending Fees" value={`₹ ${totalPendingFees}`} icon="⚠️" gradient="from-red-500 to-rose-600" />
      </div>

      {/* EXTRA SECTIONS */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* QUICK SUMMARY */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            📌 Quick Summary
          </h2>

          <div className="space-y-3 text-gray-700">
            <Row label="Total Students" value={totalStudents} />
            <Row label="Present Today" value={presentStudentsToday} valueClass="text-green-600" />
            <Row label="Total Fees" value={`₹ ${totalFeesAll}`} />
            <Row label="Total Collection" value={`₹ ${totalCollectionAll}`} />
            <Row label="Pending Fees" value={`₹ ${totalPendingFees}`} valueClass="text-red-600" />
          </div>
        </div>

        {/* CLASS WISE */}
        <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            🏫 Class-wise Students
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {classStats.map(cls => (
              <div
                key={cls.className}
                className="border rounded-lg p-4 text-center bg-gray-50
                           hover:shadow-md transition"
              >
                <p className="text-sm text-gray-500">{cls.className}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {cls.count}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Session : 2025 – 26</p>
        <p>Last Updated : {new Date().toLocaleString("en-IN")}</p>
      </div>

    </div>
  );
}

/* ================= COMPONENTS ================= */

const StatCard = ({ title, value, icon, gradient }) => (
  <div
    className={`rounded-xl shadow-lg text-white bg-gradient-to-r ${gradient}
      transform transition hover:scale-[1.03]`}
  >
    <div className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  </div>
);

const Row = ({ label, value, valueClass = "" }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span className={`font-bold ${valueClass}`}>{value}</span>
  </div>
);
