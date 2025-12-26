import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AllReport() {
  // 1. Variable name consistent rakhein (className)
  const { className } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
    
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);

        // DATABASE MATCH: Agar param "10" hai toh ye "Class 10" banayega
        // className variable ko hi use karein jo useParams se aya hai
        const dbClassName = className.startsWith("Class") 
          ? className 
          : `Class ${className}`;

        const q = query(
          collection(db, "examResults"), 
          where("className", "==", dbClassName)
        );
        
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });

        // Sorting by Roll Number
        results.sort((a, b) => Number(a.roll) - Number(b.roll));
        
        setData(results);
      } catch (error) {
        console.error("Error fetching data: ", error);
        alert("Data load karne mein masla hua!");
      } finally {
        setLoading(false);
      }
    };

    if (className) {
      fetchResults();
    }
  }, [className]); // Dependency array mein sahi variable rakhein

  const handlePrint = () => window.print();
  const onClose = () => navigate(-1);

  if (loading) {
    return <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center text-white text-xl font-bold italic tracking-widest">LOADING REPORTS...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="fixed inset-0 bg-zinc-900 flex flex-col items-center justify-center text-white text-center p-4">
        <p className="mb-4 text-lg">Is class ({className}) ka koi record nahi mila.</p>
        <button onClick={onClose} className="px-6 py-2 bg-red-600 hover:bg-red-700 transition-colors rounded-lg font-bold">Wapis Jayein</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-zinc-800 z-[999] flex justify-center items-start overflow-y-auto p-4 md:p-10 no-scrollbar">
      
      {/* PRINT OPTIMIZED CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
          }
          .page {
            margin: 0 !important;
            border: 15px double #1e3a8a !important;
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
          }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 no-print z-[1000]">
        <button
          onClick={handlePrint}
          className="px-8 py-3 bg-emerald-600 text-white font-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>🖨️</span> PRINT ALL ({data.length})
        </button>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-white text-red-600 font-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all text-center"
        >
          CLOSE
        </button>
      </div>

      {/* ALL STUDENTS REPORTS */}
      <div className="print-area w-full flex flex-col items-center gap-10">
        {data.map((student, idx) => {
          const rows = student.rows || [];
          const grandTotalObt = rows.reduce((s, r) => s + (Number(r.marks) || 0), 0);
          const grandTotalMax = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
          const percent = grandTotalMax ? ((grandTotalObt / grandTotalMax) * 100).toFixed(2) : "0.00";
          const gradeStatus = Number(percent) >= 33 ? "PASS" : "FAIL";

          return (
            <div
              key={student.id || idx}
              className="page bg-white w-[210mm] h-[297mm] border-[12px] border-double border-blue-900 p-12 font-serif shadow-2xl relative flex flex-col"
            >
              {/* HEADER */}
              <div className="text-center border-b-4 border-blue-900 pb-4 mb-8">
                <h1 className="text-3xl font-black uppercase text-blue-900 tracking-tighter">
                  Board of Intermediate & Secondary Education
                </h1>
                <div className="mt-2 inline-block px-4 py-1 bg-blue-900 text-white font-bold tracking-widest uppercase text-sm">
                  Provisional Result Card - {student.className}
                </div>
              </div>

              {/* BASIC INFO */}
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-3 text-lg">
                  <p className="flex gap-2"><b>Candidate:</b> <span className="uppercase border-b border-dotted border-black px-2">{student.name}</span></p>
                  <p className="flex gap-2"><b>Roll No:</b> <span className="font-mono bg-gray-100 px-2">{student.roll}</span></p>
                  <p className="flex gap-2"><b>Father Name:</b> <span className="uppercase border-b border-dotted border-black px-2">{student.fatherName}</span></p>
                  <p className="flex gap-2"><b>Class:</b> <span>{student.className}</span></p>
                </div>

                <div className="w-32 h-36 border-4 border-blue-900 rounded shadow-inner overflow-hidden bg-gray-50 flex items-center justify-center">
                  {student.photoURL ? (
                    <img src={student.photoURL} alt="student" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-400 font-sans">PHOTO</span>
                  )}
                </div>
              </div>

              {/* MARKS TABLE */}
              <table className="w-full border-collapse border-2 border-black mb-8">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="border border-black p-2 w-12">SR.</th>
                    <th className="border border-black p-2 text-left">SUBJECT NAME</th>
                    <th className="border border-black p-2 w-28">MAX MARKS</th>
                    <th className="border border-black p-2 w-28">OBTAINED</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="text-md">
                      <td className="border border-black p-2 text-center">{i + 1}</td>
                      <td className="border border-black p-2 uppercase font-bold text-blue-900">{r.subject}</td>
                      <td className="border border-black p-2 text-center">{r.total}</td>
                      <td className="border border-black p-2 text-center font-black">{r.marks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-200 font-black">
                    <td colSpan="2" className="border border-black p-3 text-right">AGGREGATE TOTAL:</td>
                    <td className="border border-black p-3 text-center">{grandTotalMax}</td>
                    <td className="border border-black p-3 text-center text-blue-900">{grandTotalObt}</td>
                  </tr>
                </tfoot>
              </table>

              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="border-2 border-blue-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Percentage</p>
                  <p className="text-xl font-black text-blue-900">{percent}%</p>
                </div>
                <div className="border-2 border-blue-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Status</p>
                  <p className={`text-xl font-black ${gradeStatus === "FAIL" ? "text-red-600" : "text-green-600"}`}>
                    {gradeStatus}
                  </p>
                </div>
                <div className="border-2 border-blue-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Division</p>
                  <p className="text-xl font-black text-blue-900">
                    {Number(percent) >= 60 ? "First" : Number(percent) >= 45 ? "Second" : "Third"}
                  </p>
                </div>
              </div>

              {/* SIGNATURES */}
              <div className="mt-auto flex justify-between items-end pb-16">
                <div className="text-center">
                  <div className="w-40 border-t-2 border-black mb-1"></div>
                  <p className="text-[10px] font-bold uppercase">Controller of Examination</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-t-2 border-black mb-1"></div>
                  <p className="text-[10px] font-bold uppercase">Principal Signature</p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="absolute bottom-6 left-0 right-0 text-center px-12">
                <p className="text-[9px] text-gray-400 italic leading-tight">
                  This is a computer-generated document. Generated on: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}