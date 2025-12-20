import React, { useEffect, useState } from "react";
import {
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import { AddTeacherPopup } from "../component/TeacherAdd";
import SalaryReceipt from "../component/SalaryReceipt";

/* ================= MONTHS (APRIL–MARCH) ================= */
const months = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March"
];

export default function TeachersManagementPage() {
  const [month, setMonth] = useState(months[0]);
  const [teachers, setTeachers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);

  /* RECEIPT */
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  /* ================= LOAD TEACHERS ================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teachers"), (snap) => {
      setTeachers(
        snap.docs.map((d) => ({
          id: d.id,
          attendance: d.data().attendance || {},
          salaryDetails: d.data().salaryDetails || {},
          ...d.data(),
        }))
      );
    });
    return unsub;
  }, []);

  /* ================= DAYS IN MONTH ================= */
  const getDaysInMonth = (m) => {
    const idx = months.indexOf(m);
    const year = new Date().getFullYear();
    return new Date(year, idx + 4, 0).getDate();
  };

  /* ================= COUNT PRESENT / ABSENT ================= */
  const getMonthlyCounts = (attendance, month) => {
    let present = 0;
    let absent = 0;

    Object.keys(attendance || {}).forEach((key) => {
      if (key.startsWith(month)) {
        if (attendance[key] === "P") present++;
        if (attendance[key] === "A") absent++;
      }
    });

    return { present, absent };
  };

  /* ================= PAY SALARY ================= */
  const handlePay = (teacher, calculatedSalary) => {
    toast((t) => (
      <div>
        <p className="font-semibold mb-2">
          Pay salary for <b>{month}</b>?
        </p>

        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              await updateDoc(doc(db, "teachers", teacher.id), {
                [`salaryDetails.${month}.total`]: calculatedSalary,
                [`salaryDetails.${month}.paid`]: calculatedSalary,
                [`salaryDetails.${month}.paidAt`]: serverTimestamp(),
              });

              toast.dismiss(t.id);
              toast.success(`${month} Salary Paid`);
            }}
          >
            Yes
          </button>

          <button
            className="bg-gray-300 px-3 py-1 rounded"
            onClick={() => toast.dismiss(t.id)}
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (confirm("Delete teacher?")) {
      await deleteDoc(doc(db, "teachers", id));
      toast.success("Teacher deleted");
    }
  };

  return (
    <div className="p-4 md:p-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border px-3 py-2 rounded w-full sm:w-auto"
          >
            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <h1 className="text-xl md:text-2xl font-bold">
            Teachers Management
          </h1>
        </div>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto"
          onClick={() => {
            setEditTeacher(null);
            setShowAdd(true);
          }}
        >
          + Add Teacher
        </button>
      </div>

      {/* ================= ADD / EDIT POPUP ================= */}
      {showAdd && (
        <AddTeacherPopup
          close={() => setShowAdd(false)}
          editData={editTeacher}
        />
      )}

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2">Teacher</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Present</th>
              <th className="p-2">Absent</th>
              <th className="p-2">Salary</th>
              <th className="p-2">Calculated</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
              <th className="p-2">Delete</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((t) => {
              const { present, absent } = getMonthlyCounts(t.attendance, month);
              const days = getDaysInMonth(month);
              const monthlySalary = Number(t.salary) || 0;
              const perDay = monthlySalary / days;
              const calculated = Math.round(perDay * present);
              const salaryInfo = t.salaryDetails?.[month];
              const isPaid = Boolean(salaryInfo?.paidAt);

              return (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 flex items-center gap-3">
                    {t.photoURL ? (
                      <img src={t.photoURL} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full" />
                    )}
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      {t.isClassTeacher && (
                        <div className="text-xs text-blue-600">
                          Class Teacher: {t.classTeacherOf}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-2">{t.subject}</td>
                  <td className="p-2">{t.phone}</td>
                  <td className="p-2 text-green-600 font-bold">{present}</td>
                  <td className="p-2 text-red-600 font-bold">{absent}</td>
                  <td className="p-2">₹ {monthlySalary}</td>
                  <td className="p-2 text-purple-600 font-semibold">₹ {calculated}</td>

                  <td className="p-2">
                    <span className={`px-3 py-1 rounded text-white ${
                      isPaid ? "bg-green-600" : "bg-orange-500"
                    }`}>
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>

                  <td className="p-2">
                    {!isPaid ? (
                      <button
                        onClick={() => handlePay(t, calculated)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Pay
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setReceiptData({ teacher: t, month, salaryInfo });
                          setShowReceipt(true);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Receipt
                      </button>
                    )}
                  </td>

                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="md:hidden space-y-4">
        {teachers.map((t) => {
          const { present, absent } = getMonthlyCounts(t.attendance, month);
          const days = getDaysInMonth(month);
          const monthlySalary = Number(t.salary) || 0;
          const perDay = monthlySalary / days;
          const calculated = Math.round(perDay * present);
          const salaryInfo = t.salaryDetails?.[month];
          const isPaid = Boolean(salaryInfo?.paidAt);

          return (
            <div key={t.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex gap-3 items-center">
                {t.photoURL ? (
                  <img src={t.photoURL} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full" />
                )}
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-600">{t.subject}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                <div><b>Present:</b> <span className="text-green-600">{present}</span></div>
                <div><b>Absent:</b> <span className="text-red-600">{absent}</span></div>
                <div><b>Salary:</b> ₹{monthlySalary}</div>
                <div><b>Calculated:</b> ₹{calculated}</div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {!isPaid ? (
                  <button
                    onClick={() => handlePay(t, calculated)}
                    className="bg-green-600 text-white py-2 rounded"
                  >
                    Pay Salary
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setReceiptData({ teacher: t, month, salaryInfo });
                      setShowReceipt(true);
                    }}
                    className="bg-blue-600 text-white py-2 rounded"
                  >
                    View Receipt
                  </button>
                )}

                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= RECEIPT ================= */}
      {showReceipt && receiptData && (
        <SalaryReceipt
          teacherName={receiptData.teacher.name}
          subject={receiptData.teacher.subject}
          phone={receiptData.teacher.phone}
          month={receiptData.month}
          totalAmount={receiptData.salaryInfo.total}
          paidAmount={receiptData.salaryInfo.paid}
          paidAt={receiptData.salaryInfo.paidAt}
          receiptNo={`SAL-${receiptData.month}-${receiptData.teacher.userId}`}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
