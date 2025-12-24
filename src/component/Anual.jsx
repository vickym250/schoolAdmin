import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";

export default function MarksSheet() {
  const { studentId } = useParams();
 console.log(studentId);
 
  const [half, setHalf] = useState(null);
  const [annual, setAnnual] = useState(null);
  const [loading, setLoading] = useState(true);
const [rollNo, setRollNo] = useState("—");

// useEffect ke andar ye add karo
const fetchStudentInfo = async () => {
  try {
    const ref = doc(db, "students", studentId); // 🔥 direct doc
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      setRollNo(data.rollNumber); // yahan pura student object
    } else {
      console.log("Student not found");
    }
  } catch (err) {
    console.error("Error fetching student:", err);
  }
};








  /* ===========================
     Subject Normalizer
     =========================== */
  const normalize = (str = "") =>
    str.toLowerCase().replace(/[^a-z]/g, "");

  /* ===========================
     Fetch Half + Annual Result
     =========================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "examResults"),
          where("studentId", "==", studentId)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => d.data());

        setHalf(results.find(r => r.exam === "Half-Yearly") || null);
        setAnnual(results.find(r => r.exam === "Annual") || null);
      } catch (err) {
        console.error("Error loading marksheet:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    fetchStudentInfo();
  }, [studentId]);

  if (loading) {
    return <div className="p-20 text-center">Loading marksheet…</div>;
  }

  if (!half || !annual) {
    return (
      <div className="p-20 text-center text-red-600">
        Half-Yearly ya Annual result available nahi hai
      </div>
    );
  }

  /* ===========================
     Subjects
     =========================== */
  const subjects = [
    "Hindi I",
    "English I",
    "Maths",
    "Science",
    "Social Study",
    "Sanskrit",
    "Art",
    "Computer",
    "G.K.",
  ];

  const getRow = (exam, subject) =>
    exam.rows.find(r =>
      normalize(r.subject).includes(normalize(subject)) ||
      normalize(subject).includes(normalize(r.subject))
    ) || { total: 0, marks: 0 };

  /* ===========================
     Grand Total
     =========================== */
  const totalHalfMax = subjects.reduce(
    (s, sub) => s + Number(getRow(half, sub).total || 0),
    0
  );
  const totalHalfObt = subjects.reduce(
    (s, sub) => s + Number(getRow(half, sub).marks || 0),
    0
  );

  const totalAnnualMax = subjects.reduce(
    (s, sub) => s + Number(getRow(annual, sub).total || 0),
    0
  );
  const totalAnnualObt = subjects.reduce(
    (s, sub) => s + Number(getRow(annual, sub).marks || 0),
    0
  );

  const grandMax = totalHalfMax + totalAnnualMax;
  const grandObt = totalHalfObt + totalAnnualObt;

  const percentage = grandMax
    ? ((grandObt / grandMax) * 100).toFixed(2)
    : "0.00";

  const finalResult = percentage >= 33 ? "PASS" : "FAIL";

  const division =
    percentage >= 60 ? "1st" :
    percentage >= 45 ? "2nd" :
    percentage >= 33 ? "3rd" : "-";

  return (
    <div className="bg-gray-300 min-h-screen flex justify-center items-start p-6">

      {/* 🔥 PRINT LANDSCAPE FIX */}
<style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 0; /* Margin zero taaki browser khud space na le */
            }
            html, body {
              height: 100%;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden; /* Doosra page banne se rokega */
            }
            .print-hidden {
              display: none !important;
            }
            #print-area {
              width: 297mm;
              height: 210mm; /* Fixed height */
              max-height: 210mm;
              padding: 10mm !important;
              box-sizing: border-box;
              border: none !important;
              position: absolute;
              top: 0;
              left: 0;
            }
          }
        `}
      </style>


{/* ================= A4 LANDSCAPE PAGE ================= */}
<div
  id="print-area"
  className="bg-white w-[297mm] h-[210mm] border-2 border-gray-700 p-8 text-[13px] flex flex-col justify-between mx-auto"
>
  <div>
    {/* HEADER */}
    <div className="text-center font-bold text-lg  border-b pb-2">
      KRISHNA PUBLIC SCHOOL Mannijot Siddhaartnagar &nbsp;&nbsp;
      <span className="text-sm font-normal underline">Session: {annual.session}</span>
    </div>

    {/* STUDENT INFO */}
    <div className="grid grid-cols-4 text-xs mb-6 font-semibold uppercase">
      <div>Student Name : <b>{annual.name}</b></div>
      <div>Class : <b>{annual.className}</b></div>
      <div>Section : <b>A</b></div>
      <div>Roll : <b>{rollNo}</b></div>
    </div>

    {/* TABLE - Rows fail kar poora page bharengi */}
    <table className="w-full border-collapse border border-black">
      <thead className="bg-gray-50">
        <tr className="h-12">
          <th rowSpan="2" className="border border-black p-1">S.N.</th>
          <th rowSpan="2" className="border border-black p-1 text-base">Subject</th>
          <th colSpan="3" className="border border-black p-1">Half Yearly</th>
          <th colSpan="3" className="border border-black p-1">Annual</th>
          <th colSpan="2" className="border border-black p-1 bg-gray-100">Total</th>
          <th rowSpan="2" className="border border-black p-1">Result</th>
        </tr>
        <tr className="h-10">
          <th className="border border-black p-1">Max</th>
          <th className="border border-black p-1">Min</th>
          <th className="border border-black p-1">Obt</th>
          <th className="border border-black p-1">Max</th>
          <th className="border border-black p-1">Min</th>
          <th className="border border-black p-1">Obt</th>
          <th className="border border-black p-1">Max</th>
          <th className="border border-black p-1 text-blue-800">Obt</th>
        </tr>
      </thead>

      <tbody>
        {subjects.map((sub, i) => {
          const h = getRow(half, sub);
          const a = getRow(annual, sub);
          const gMax = Number(h.total) + Number(a.total);
          const gObt = Number(h.marks) + Number(a.marks);

          return (
            <tr key={i} className="h-[10mm] text-center">
              <td className="border border-black p-1">{i + 1}</td>
              <td className="border border-black p-1 text-left px-4 font-semibold text-sm">{sub}</td>
              <td className="border border-black p-1">{h.total}</td>
              <td className="border border-black p-1 text-gray-500">{Math.ceil(h.total * 0.33)}</td>
              <td className="border border-black p-1 font-bold">{h.marks}</td>
              <td className="border border-black p-1">{a.total}</td>
              <td className="border border-black p-1 text-gray-500">{Math.ceil(a.total * 0.33)}</td>
              <td className="border border-black p-1 font-bold">{a.marks}</td>
              <td className="border border-black p-1">{gMax}</td>
              <td className="border border-black p-1 font-black bg-gray-50 text-base">{gObt}</td>
              <td className="border border-black p-1 font-bold">
                {gObt >= gMax * 0.33 ? "PASS" : "FAIL"}
              </td>
            </tr>
          );
        })}
      </tbody>

      <tfoot>
        <tr className="bg-gray-100 font-bold h-14">
          <td colSpan="2" className="border border-black p-1 text-center text-base">GRAND TOTAL</td>
          <td className="border border-black p-1">{totalHalfMax}</td>
          <td className="border border-black p-1">—</td>
          <td className="border border-black p-1">{totalHalfObt}</td>
          <td className="border border-black p-1">{totalAnnualMax}</td>
          <td className="border border-black p-1">—</td>
          <td className="border border-black p-1">{totalAnnualObt}</td>
          <td className="border border-black p-1 font-bold">{grandMax}</td>
          <td className="border border-black p-1 font-black text-lg bg-yellow-50">{grandObt}</td>
          <td className="border border-black p-1">{finalResult}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  {/* FOOTER - Ab niche chipak jayega */}
  <div className="grid grid-cols-2 gap-10 mt-6 border-t pt-4">
    <div className="space-y-3 font-semibold">
      Attendance : <span className="inline-block border-b border-black w-32"></span><br />
      Checked by : <span className="inline-block border-b border-black w-32"></span><br />
      Class Teacher : <span className="inline-block border-b border-black w-32"></span><br />
      Principal : <span className="inline-block border-b border-black w-32"></span>
    </div>
    <div className="border-2 border-black p-4 bg-gray-50 flex flex-col justify-center space-y-1">
      <div className="flex justify-between">Result : <b>{finalResult}</b></div>
      <div className="flex justify-between">Percentage : <b>{percentage}%</b></div>
      <div className="flex justify-between">Division : <b>{division}</b></div>
    </div>
  </div>
</div>

      {/* PRINT BUTTON */}
      <div className="fixed bottom-6 right-6 print-hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow"
        >
          Print
        </button>
      </div>
    </div>
  );
}
