import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer
} from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Dashboard() {

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [fees, setFees] = useState([]);

  const [attendanceData, setAttendanceData] = useState([]);
  const [feeData, setFeeData] = useState([]);

  /* --------------------------------------------------
      🔥 REALTIME STUDENTS
  -------------------------------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "students"), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  /* --------------------------------------------------
      🔥 REALTIME TEACHERS
  -------------------------------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teachers"), (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  /* --------------------------------------------------
      🔥 REALTIME FEES
  -------------------------------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fees"), (snap) => {
      setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  /* --------------------------------------------------
      🔥 TODAY DATE
  -------------------------------------------------- */
  const today = new Date().toLocaleDateString("en-IN");

  /* --------------------------------------------------
      🔥 TOTAL + TODAY STUDENTS PRESENT
  -------------------------------------------------- */
  const totalStudents = students.length;

  const presentStudents = students.reduce((count, s) => {
    if (!s.attendance) return count;

    const todayKey = Object.keys(s.attendance).find(
      (k) => s.attendance[k].date === today
    );

    if (todayKey && s.attendance[todayKey].status === "P") {
      return count + 1;
    }
    return count;
  }, 0);

  /* --------------------------------------------------
      🔥 TOTAL + PRESENT TEACHERS COUNT
  -------------------------------------------------- */
  const totalTeachers = teachers.length;

  const presentTeachers = teachers.reduce((count, t) => {
    if (!t.attendance) return count;

    const pCount = Object.values(t.attendance).filter((v) => v === "P").length;
    return count + pCount;
  }, 0);

  /* --------------------------------------------------
      🔥 TOTAL + TODAY FEES COLLECTION
  -------------------------------------------------- */
  const totalFees = fees.reduce((sum, f) => sum + Number(f.amount || 0), 0);

  const todayCollection = fees
    .filter((f) => f.date === today)
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  /* --------------------------------------------------
      🔥 WEEKLY ATTENDANCE (BACKEND DATA)
  -------------------------------------------------- */
  useEffect(() => {
    if (students.length === 0 || teachers.length === 0) return;

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    let weekly = days.map((d) => ({
      day: d,
      students: 0,
      teachers: 0
    }));

    // Students Attendance
    students.forEach((stu) => {
      if (!stu.attendance) return;
      Object.values(stu.attendance).forEach((att) => {
        const day = new Date(att.date).getDay();
        if (att.status === "P") {
          weekly[day].students += 1;
        }
      });
    });

    // Teachers Attendance
    teachers.forEach((tch) => {
      if (!tch.attendance) return;
      Object.keys(tch.attendance).forEach((dateKey) => {
        if (tch.attendance[dateKey] === "P") {
          const day = new Date(dateKey).getDay();
          weekly[day].teachers += 1;
        }
      });
    });

    setAttendanceData(weekly);
  }, [students, teachers]);

  /* --------------------------------------------------
      🔥 MONTHLY FEES (BACKEND DATA)
  -------------------------------------------------- */
  useEffect(() => {
    if (fees.length === 0) return;

    let map = {};

    fees.forEach((f) => {
      const d = new Date(f.date.split("/").reverse().join("-"));
      const month = d.toLocaleString("en-IN", { month: "short" });

      if (!map[month]) map[month] = 0;
      map[month] += Number(f.amount || 0);
    });

    const result = Object.keys(map).map((m) => ({
      month: m,
      fee: map[m],
    }));

    setFeeData(result);
  }, [fees]);

  /* --------------------------------------------------
      🔥 UI STARTS
  -------------------------------------------------- */
  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">📊 Dashboard Overview</h1>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white shadow-lg p-6 rounded-xl">
          <p className="text-gray-500 text-sm">Total Students</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{totalStudents}</p>
        </div>

        <div className="bg-white shadow-lg p-6 rounded-xl">
          <p className="text-gray-500 text-sm">Present Students (Today)</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{presentStudents}</p>
        </div>

        <div className="bg-white shadow-lg p-6 rounded-xl">
          <p className="text-gray-500 text-sm">Total Teachers</p>
          <p className="text-4xl font-bold text-purple-600 mt-2">{totalTeachers}</p>
        </div>

        <div className="bg-white shadow-lg p-6 rounded-xl">
          <p className="text-gray-500 text-sm">Teachers Present</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{presentTeachers}</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-lg p-6 rounded-xl col-span-1 md:col-span-2">
          <p className="text-sm">Total Fee Collection</p>
          <p className="text-4xl font-bold mt-2">₹ {totalFees}</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-lime-400 text-white shadow-lg p-6 rounded-xl col-span-1 md:col-span-2">
          <p className="text-sm">Today's Fee Collection</p>
          <p className="text-4xl font-bold mt-2">₹ {todayCollection}</p>
        </div>

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        
        <div className="bg-white shadow-lg p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Weekly Attendance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attendanceData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="students" stroke="blue" strokeWidth={3} />
              <Line type="monotone" dataKey="teachers" stroke="green" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow-lg p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Monthly Fee Collection</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={feeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="fee" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}
