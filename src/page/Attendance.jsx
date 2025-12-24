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
  const [searchTerm, setSearchTerm] = useState("");

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

  /* ---------------- INIT ATTENDANCE (SAFE) ---------------- */
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

    // SAME STATUS → DO NOTHING
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

    // remove previous
    if (prevStatus === "P") present--;
    if (prevStatus === "A") absent--;

    // add new
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

  /* ---------------- FILTER ---------------- */
  const filteredData = students.filter((s) => {
    if (s.className !== className) return false;
    if (s.session !== session) return false;
    if (
      searchTerm &&
      !s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) return false;
    return true;
  });

  /* ---------------- UI ---------------- */
  return (
    <div className="p-2 md:p-6 bg-gray-50 container">

      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 text-center md:text-left">
        Attendance Dashboard <span className="text-blue-600">({session})</span>
      </h2>

      {/* FILTERS */}
      <div className="grid grid-cols-2 md:flex gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border">
        <select value={session} onChange={(e) => setSession(e.target.value)} className="border p-2 rounded">
          {sessions.map(s => <option key={s}>{s}</option>)}
        </select>

        <select value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2 rounded">
          {months.map(m => <option key={m}>{m}</option>)}
        </select>

        <select value={className} onChange={(e) => setClassName(e.target.value)} className="border p-2 rounded">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i}>Class {i + 1}</option>
          ))}
        </select>

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search student..."
          className="border p-2 rounded col-span-2 md:col-span-1"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white border rounded-xl shadow">
        <table className="min-w-[800px] w-full border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="sticky left-0 bg-slate-800 p-3 text-left w-48">
                Student
              </th>
              {[...Array(getDaysInMonth())].map((_, i) => (
                <th
                  key={i}
                  className={`p-2 text-xs ${
                    i + 1 === currentDay && month === currentMonthName
                      ? "bg-orange-500"
                      : ""
                  }`}
                >
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredData.map(student => {
              const monthData = student.attendance?.[month] || {};
              return (
                <tr key={student.id} className="border-b hover:bg-blue-50">
                  <td className="sticky left-0 bg-white p-3">
                    <div className="font-bold text-sm">{student.name}</div>
                    <div className="text-xs text-gray-400">
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
                      (selectedMonthOrder === currentMonthOrder &&
                        day < currentDay);

                    const isLocked = isPastDate && status;

                    return (
                      <td key={day} className="border-l text-center p-1">
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            disabled={isLocked}
                            onClick={() => markAttendance(student, day, "P")}
                            className={`w-7 h-5 text-[9px] font-bold rounded ${
                              status === "P"
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-400"
                            } ${isLocked ? "opacity-30" : ""}`}
                          >
                            P
                          </button>
                          <button
                            disabled={isLocked}
                            onClick={() => markAttendance(student, day, "A")}
                            className={`w-7 h-5 text-[9px] font-bold rounded ${
                              status === "A"
                                ? "bg-red-600 text-white"
                                : "bg-gray-100 text-gray-400"
                            } ${isLocked ? "opacity-30" : ""}`}
                          >
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

      {filteredData.length === 0 && (
        <div className="p-10 text-center text-gray-500">
          No students found
        </div>
      )}

    </div>
  );
}
