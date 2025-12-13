import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";

export default function TeacherAttendance() {

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [teachers, setTeachers] = useState([]);

  // ⭐ Load Teachers Realtime
  useEffect(() => {
    const q = query(collection(db, "teachers"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeachers(list);
    });

    return () => unsubscribe();
  }, []);

  // ⭐ Selected month → total days
  const getDaysInMonth = () => {
    const m = months.indexOf(month);
    const year = new Date().getFullYear();
    return new Date(year, m + 1, 0).getDate();
  };

  // ⭐ Mark Attendance
  const markAttendance = async (teacher, day, status) => {
    const dateKey = `${month}_day_${day}`;

    try {
      await updateDoc(doc(db, "teachers", teacher.id), {
        [`attendance.${dateKey}`]: status, // "P" or "A"
      });

      toast.success(`${teacher.name} → ${status}`);
    } catch (err) {
      toast.error("Error updating attendance");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h2 className="text-2xl font-bold mb-4">Teacher Attendance</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          {months.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Attendance Table */}
      <div className="overflow-auto border rounded-lg bg-white">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Teacher</th>

              {/* DATE HEADERS */}
              {[...Array(getDaysInMonth())].map((_, i) => (
                <th key={i} className="p-1 border text-center">{i + 1}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="border-b">

                {/* Teacher Name + Photo */}
                <td className="p-2 font-semibold border flex items-center gap-3">
                  {teacher.photoURL ? (
                    <img
                      src={teacher.photoURL}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : null}

                  {teacher.name}
                </td>

                {/* Each Day Attendance Buttons */}
                {[...Array(getDaysInMonth())].map((_, i) => {
                  const day = i + 1;
                  const dateKey = `${month}_day_${day}`;
                  const status = teacher.attendance?.[dateKey] || "";

                  return (
                    <td key={i} className="border text-center">

                      {/* PRESENT BUTTON */}
                      <button
                        className={`px-2 py-1 text-xs rounded ${
                          status === "P" ? "bg-green-500 text-white" : "bg-gray-200"
                        }`}
                        onClick={() => markAttendance(teacher, day, "P")}
                      >
                        P
                      </button>

                      {/* ABSENT BUTTON */}
                      <button
                        className={`px-2 py-1 ml-1 text-xs rounded ${
                          status === "A" ? "bg-red-500 text-white" : "bg-gray-200"
                        }`}
                        onClick={() => markAttendance(teacher, day, "A")}
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
      </div>
    </div>
  );
}
