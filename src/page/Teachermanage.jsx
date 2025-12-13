import React, { useEffect, useState } from "react";
import {
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    doc,
    collection,
} from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import { AddTeacherPopup } from "../component/TeacherAdd";

export default function TeachersManagementPage() {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const [month, setMonth] = useState(months[new Date().getMonth()]);
    const [teachers, setTeachers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [editTeacher, setEditTeacher] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "teachers"), (snap) =>
            setTeachers(
                snap.docs.map((d) => ({
                    id: d.id,
                    attendance: d.data().attendance || {},
                    status: d.data().status || {},   // VERY IMPORTANT ✔
                    ...d.data(),
                }))
            )
        );
        return unsub;
    }, []);

    // Days in month
    const getDaysInMonth = (m) => {
        const idx = months.indexOf(m);
        return new Date(new Date().getFullYear(), idx + 1, 0).getDate();
    };

    // Count P / A from attendance object
    const getMonthlyCounts = (attendance, month) => {
        let present = 0, absent = 0;

        Object.keys(attendance || {}).forEach((key) => {
            if (key.startsWith(month)) {
                if (attendance[key] === "P") present++;
                if (attendance[key] === "A") absent++;
            }
        });

        return { present, absent };
    };

    // 💰 Make month-wise salary Paid
    const handlePay = async (id) => {
        toast((t) => (
            <div>
                <p className="font-semibold mb-2">Pay salary for {month}?</p>

                <div className="flex gap-2">
                    <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={async () => {
                            await updateDoc(doc(db, "teachers", id), {
                                [`status.${month}`]: "Paid",
                            });
                            toast.dismiss(t.id);
                            toast.success(`${month} Salary Paid!`);
                        }}
                    >
                        Yes
                    </button>

                    <button
                        className="bg-gray-300 px-3 py-1 rounded"
                        onClick={() => {
                            toast.dismiss(t.id);
                            toast.error("Cancelled");
                        }}
                    >
                        No
                    </button>
                </div>
            </div>
        ));
    };

    const handleDelete = async (id) => {
        if (confirm("Delete teacher?")) {
            await deleteDoc(doc(db, "teachers", id));
            toast.success("Teacher deleted!");
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between mb-4">
                <div className="flex gap-3 items-center">
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="border px-3 py-2 rounded"
                    >
                        {months.map((m) => (
                            <option key={m}>{m}</option>
                        ))}
                    </select>

                    <h1 className="text-2xl font-bold">Teacher List</h1>
                </div>

                <button
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    onClick={() => {
                        setEditTeacher(null);
                        setShowAdd(true);
                    }}
                >
                    + Add Teacher
                </button>
            </div>

            {showAdd && <AddTeacherPopup close={() => setShowAdd(false)} editData={editTeacher} />}

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Name</th>
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

                            const monthlySalary = Number(t.salary) || 0;
                            const daysInMonth = getDaysInMonth(month);
                            const perDay = monthlySalary / daysInMonth;
                            const calculated = Math.round(perDay * present);

                            return (
                                <tr key={t.id} className="border-b hover:bg-gray-50">

                                    {/* Photo + Name */}
                                    <td className="p-2 flex items-center gap-3">
                                        {t.photoURL ? (
                                            <img src={t.photoURL} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-300 rounded-full" />
                                        )}
                                        {t.name}
                                    </td>

                                    <td className="p-2">{t.subject}</td>
                                    <td className="p-2">{t.phone}</td>

                                    <td className="p-2 text-green-600 font-bold">{present} days</td>
                                    <td className="p-2 text-red-600 font-bold">{absent} days</td>

                                    <td className="p-2 font-semibold">₹ {monthlySalary}</td>
                                    <td className="p-2 font-semibold text-purple-600">₹ {calculated}</td>

                                    {/* MONTH-WISE STATUS */}
                                    <td className="p-2">
                                        <span
                                            className={`px-3 py-1 rounded text-white ${t.status?.[month] === "Paid"
                                                ? "bg-green-600"
                                                : "bg-orange-500"
                                                }`}
                                        >
                                            {t.status?.[month] || "Pending"}
                                        </span>
                                    </td>

                                    {/* ACTION BUTTON */}
                                    <td className="p-2 flex gap-2">
                                        {/* PAY BUTTON ONLY IF STATUS PENDING */}
                                        {t.status?.[month] !== "Paid" && (
                                            <button
                                                onClick={() => handlePay(t.id)}
                                                className="bg-green-600 text-white px-3 py-1 rounded"
                                            >
                                                Pay
                                            </button>
                                        )}
                                    </td>

                                    <td >

                                        {/* EDIT BUTTON ALWAYS SHOWS */}
                                        <button
                                            onClick={() => {
                                                setEditTeacher(t);
                                                setShowAdd(true);
                                            }}
                                            className="px-3 py-1 border rounded text-gray-700"
                                        >
                                            Edit
                                        </button>


                                        <button className="p-2 text-red-600 cursor-pointer"
                                            onClick={() => handleDelete(t.id)} >

                                            Delete
                                        </button>
                                    </td>

                                </tr>
                            );
                        })}
                    </tbody>

                </table>
                {showAdd ? <AddTeacherPopup
                    close={() => setShowAdd(false)}
                    editData={editTeacher}
                /> : ""}
            </div>

        </div>

    );
}
