import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, addDoc, getDocs, query, where, serverTimestamp,
  doc, deleteDoc 
} from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";

// --- 1. REPORT CARD MODAL (Professional Format) ---
const ReportCardModal = ({ data, onClose }) => {
  if (!data) return null;

  // Pichle marks ko subjects mein divide karne ka logic
  const getSubjectWisePrevMarks = (totalPrevMarks) => {
    if (!totalPrevMarks || !data.rows || data.rows.length === 0) return 0;
    return Math.round(totalPrevMarks / data.rows.length);
  };

  const isQuarterly = data.exam === "Quarterly";
  const isHalfYearly = data.exam === "Half-Yearly";
  const isAnnual = data.exam === "Annual";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[60] p-4 overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-4xl p-8 rounded-lg shadow-2xl relative print:p-0 print:shadow-none print:m-0 print:rounded-none">
        
        {/* Buttons (Hidden on Print) */}
        <div className="absolute top-4 right-4 flex gap-2 print:hidden">
          <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg">🖨️ Print Marksheet</button>
          <button onClick={onClose} className="bg-slate-100 text-slate-600 px-5 py-2 rounded-xl font-bold border">❌ Close</button>
        </div>

        <div className="border-[8px] border-double border-slate-900 p-8 bg-white min-h-[800px] flex flex-col">
          <div className="text-center border-b-4 border-slate-900 pb-4 mb-8">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Academic Progress Report</h1>
            <p className="font-bold text-slate-600 uppercase tracking-widest mt-1">Session: {data.session} | {data.exam} Examination</p>
          </div>

          {/* Student Info Section */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-[13px] mb-8 pb-6 border-b-2 border-slate-100 font-bold uppercase text-slate-700">
            <div className="flex justify-between border-b border-slate-200 pb-1"><span>Student Name:</span> <span className="text-slate-900 font-black">{data.name}</span></div>
            <div className="flex justify-between border-b border-slate-200 pb-1"><span>Roll Number:</span> <span className="text-slate-900 font-black">{data.roll}</span></div>
            <div className="flex justify-between border-b border-slate-200 pb-1"><span>Father's Name:</span> <span className="text-slate-900 font-black">{data.fatherName}</span></div>
            <div className="flex justify-between border-b border-slate-200 pb-1"><span>Class:</span> <span className="text-slate-900 font-black">{data.className}</span></div>
            <div className="flex justify-between border-b border-slate-200 pb-1"><span>Date of Birth:</span> <span className="text-slate-900 font-black">{data.dob}</span></div>
            <div className="flex justify-between border-b border-slate-200 pb-1"><span>Gender:</span> <span className="text-slate-900 font-black">{data.gender}</span></div>
          </div>

          {/* Dynamic Marks Table */}
          <div className="flex-grow">
            <table className="w-full border-collapse border-[3px] border-slate-900 text-center uppercase tracking-tighter">
              <thead>
                <tr className="bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest">
                  <th className="border-2 border-slate-700 p-4 text-left">Subjects Name</th>
                  <th className="border-2 border-slate-700 p-4 w-24">Quarterly</th>
                  {(isHalfYearly || isAnnual) && <th className="border-2 border-slate-700 p-4 w-24">Half-Yearly</th>}
                  {isAnnual && <th className="border-2 border-slate-700 p-4 w-24 bg-slate-800">Annual</th>}
                  <th className="border-2 border-slate-700 p-4 w-28 bg-indigo-800">Sub. Total</th>
                </tr>
              </thead>
              <tbody className="text-[14px] font-black text-slate-800 uppercase">
                {data.rows.map((row, i) => {
                  const qMarks = getSubjectWisePrevMarks(data.quarterlyMarks);
                  const hyMarks = getSubjectWisePrevMarks(data.halfYearlyMarks);
                  
                  let subTotal = Number(row.marks);
                  if (isHalfYearly) subTotal += Number(qMarks);
                  if (isAnnual) subTotal += Number(qMarks) + Number(hyMarks);

                  return (
                    <tr key={i}>
                      <td className="border-2 border-slate-900 p-3 text-left bg-slate-50 font-black">{row.subject}</td>
                      <td className="border-2 border-slate-900 p-3">{isQuarterly ? row.marks : qMarks}</td>
                      {(isHalfYearly || isAnnual) && <td className="border-2 border-slate-900 p-3">{isHalfYearly ? row.marks : hyMarks}</td>}
                      {isAnnual && <td className="border-2 border-slate-900 p-3 bg-amber-50">{row.marks}</td>}
                      <td className="border-2 border-slate-900 p-3 bg-indigo-50 text-indigo-700 font-black">{subTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-[15px]">
                  <td className="border-2 border-slate-900 p-4 text-right pr-6">GRAND TOTAL MARKS</td>
                  <td className="border-2 border-slate-900 p-4 text-center">{isQuarterly ? data.obtained : data.quarterlyMarks}</td>
                  {(isHalfYearly || isAnnual) && <td className="border-2 border-slate-900 p-4 text-center">{isHalfYearly ? data.obtained : data.halfYearlyMarks}</td>}
                  {isAnnual && <td className="border-2 border-slate-900 p-4 text-center">{data.obtained}</td>}
                  <td className="border-2 border-slate-900 p-4 bg-indigo-700 text-center font-black">
                    {isAnnual ? data.grandTotal : (isHalfYearly ? (Number(data.quarterlyMarks) + Number(data.obtained)) : data.obtained)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Performance Box */}
          <div className="mt-8 flex justify-between items-center bg-slate-50 border-2 border-slate-900 p-5 rounded-2xl font-black uppercase">
              <div className="text-center flex-1">
                <p className="text-[10px] text-slate-400">Total Marks</p>
                <p className="text-2xl">{isAnnual ? data.grandTotal : (isHalfYearly ? (Number(data.quarterlyMarks) + Number(data.obtained)) : data.obtained)} / {isAnnual ? data.grandMaxMarks : (isHalfYearly ? data.totalMarks * 2 : data.totalMarks)}</p>
              </div>
              <div className="text-center flex-1 border-x-2 border-slate-200 px-4">
                <p className="text-[10px] text-indigo-400">Percentage</p>
                <p className="text-3xl text-indigo-600">{data.percent}%</p>
              </div>
              <div className="text-center flex-1 uppercase">
                <p className="text-[10px] text-slate-400 uppercase">Grade</p>
                <p className={`text-3xl font-black ${data.grade === 'Fail' ? 'text-red-600' : 'text-emerald-600'}`}>{data.grade}</p>
              </div>
          </div>

          <div className="mt-16 flex justify-between items-end px-4 uppercase font-black text-[11px] text-slate-600 tracking-widest">
            <div className="text-center"><div className="w-40 border-b-2 border-slate-900 mb-2"></div><p>Class Teacher</p></div>
            <div className="text-center mb-4 text-[10px] text-slate-800 tracking-widest">Issue Date: {data.issueDate}</div>
            <div className="text-center"><div className="w-40 border-b-2 border-slate-900 mb-2"></div><p>Principal</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. MAIN COMPONENT ---
export default function FinalResultPage() {
  const sessions = ["2024-25", "2025-26", "2026-27"];
  const classesList = ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];
  const examTypes = ["Quarterly", "Half-Yearly", "Annual"];

  const [session, setSession] = useState("2025-26");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  
  const [allStudents, setAllStudents] = useState([]); 
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [roll, setRoll] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [exam, setExam] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState([{ subject: "", total: "100", marks: "" }]);

  const [filterClass, setFilterClass] = useState("Class 10");
  const [filterExam, setFilterExam] = useState("Annual");
  const [resultList, setResultList] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!cls || !showForm) return;
      const q = query(collection(db, "students"), where("session", "==", session), where("className", "==", cls));
      const snap = await getDocs(q);
      setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchStudents();
  }, [cls, session, showForm]);

  const filteredStudents = allStudents.filter((s) => 
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.rollNumber?.toString().includes(studentSearch)
  );

  const handleStudentSelect = (student) => {
    setSelectedStudentId(student.id);
    setName(student.name);
    setRoll(student.rollNumber || "");
    setFatherName(student.fatherName || "");
    setDob(student.dob || "");
    setGender(student.gender || "");
    setStudentSearch(student.name);
  };

  const addRow = () => setRows([...rows, { subject: "", total: "100", marks: "" }]);

  const saveResult = async () => {
    if (!selectedStudentId || !exam) {
      toast.error("Adhura data bharein!");
      return;
    }
    setLoading(true);
    try {
      let currentObtained = rows.reduce((sum, r) => sum + Number(r.marks), 0);
      let currentTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);
      
      let resultData = {
        session, issueDate, studentId: selectedStudentId, name, className: cls,
        roll, fatherName, dob, gender, exam, rows,
        obtained: currentObtained, totalMarks: currentTotal, createdAt: serverTimestamp(),
      };

      const q = query(collection(db, "examResults"), where("studentId", "==", selectedStudentId), where("session", "==", session));
      const prevSnap = await getDocs(q);
      let q_marks = 0; let hy_marks = 0;
      prevSnap.forEach((doc) => {
        const d = doc.data();
        if (d.exam === "Quarterly") q_marks = d.obtained;
        if (d.exam === "Half-Yearly") hy_marks = d.obtained;
      });

      resultData.quarterlyMarks = q_marks;
      resultData.halfYearlyMarks = hy_marks;

      if (exam === "Annual") {
        resultData.grandTotal = q_marks + hy_marks + currentObtained;
        resultData.grandMaxMarks = currentTotal * 3; 
        resultData.percent = ((resultData.grandTotal / resultData.grandMaxMarks) * 100).toFixed(2);
      } else if (exam === "Half-Yearly") {
        resultData.grandTotal = q_marks + currentObtained;
        resultData.grandMaxMarks = currentTotal * 2;
        resultData.percent = ((resultData.grandTotal / resultData.grandMaxMarks) * 100).toFixed(2);
      } else {
        resultData.grandTotal = currentObtained;
        resultData.percent = ((currentObtained / currentTotal) * 100).toFixed(2);
      }

      let p = resultData.percent;
      resultData.grade = p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : p >= 50 ? "D" : "Fail";

      await addDoc(collection(db, "examResults"), resultData);
      toast.success("Saved Successfully!");
      setShowForm(false); resetForm(); loadResults();
    } catch (e) { toast.error("Saving Failed!"); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setSelectedStudentId(""); setStudentSearch(""); setRows([{ subject: "", total: "100", marks: "" }]);
  };

  const loadResults = async () => {
    if (!filterClass || !filterExam) return;
    const q = query(collection(db, "examResults"), where("session", "==", session), where("className", "==", filterClass), where("exam", "==", filterExam));
    const snap = await getDocs(q);
    setResultList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { loadResults(); }, [filterClass, filterExam, session]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete record?")) {
      await deleteDoc(doc(db, "examResults", id));
      loadResults();
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen font-sans tracking-tight">
      <Toaster />
      {showModal && <ReportCardModal data={selectedResult} onClose={() => setShowModal(false)} />}

      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border">
        <h1 className="text-2xl font-black text-slate-800">📊 EXAM PANEL</h1>
        <select value={session} onChange={(e) => setSession(e.target.value)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold outline-none">
          {sessions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-10 py-4 rounded-2xl mb-8 shadow-xl font-black hover:scale-105 transition-all">
        ➕ CREATE NEW MARKSHEET
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl p-8 rounded-[40px] shadow-2xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-6 text-indigo-600 uppercase border-b-2 pb-4 tracking-tighter">New Result Entry</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <select className="border-2 p-3 rounded-2xl font-bold bg-slate-50" value={cls} onChange={(e) => {setCls(e.target.value); resetForm();}}><option value="">Select Class</option>{classesList.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select className="border-2 p-3 rounded-2xl font-bold bg-slate-50" value={exam} onChange={(e) => setExam(e.target.value)}><option value="">Select Exam</option>{examTypes.map(e => <option key={e} value={e}>{e}</option>)}</select>
              <input type="date" className="border-2 p-3 rounded-2xl font-bold bg-slate-50" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            
            <div className="mb-6 relative">
              <input type="text" placeholder="🔍 Search student by name or roll..." className="border-2 p-4 w-full rounded-2xl font-bold bg-indigo-50/50 outline-none focus:border-indigo-600" value={studentSearch} onChange={(e) => {setStudentSearch(e.target.value); setSelectedStudentId("");}} />
              {studentSearch && !selectedStudentId && (
                <div className="absolute top-full w-full bg-white border-2 rounded-2xl z-10 max-h-48 overflow-y-auto shadow-2xl p-2">
                  {filteredStudents.map(s => <div key={s.id} onClick={() => handleStudentSelect(s)} className="p-4 hover:bg-indigo-600 hover:text-white cursor-pointer font-black border-b last:border-0 rounded-xl mb-1 flex justify-between"><span>{s.name}</span> <span className="opacity-40">ROLL: {s.rollNumber}</span></div>)}
                </div>
              )}
            </div>

            {selectedStudentId && <div className="p-5 bg-slate-800 text-white rounded-3xl mb-8 font-black flex justify-between items-center shadow-inner"><span>Student: {name}</span> <span className="text-indigo-400 uppercase text-xs tracking-widest">Selected ✅</span></div>}
            
            <div className="border-2 rounded-3xl overflow-hidden mb-6 bg-slate-50">
              <table className="w-full">
                <thead className="bg-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <tr><th className="p-4 text-left">Subject Name</th><th className="p-4 text-center w-32">Total Max</th><th className="p-4 text-center w-32">Obtained</th></tr>
                </thead>
                <tbody className="divide-y-2 divide-white">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td><input className="w-full p-4 font-black uppercase bg-transparent outline-none" placeholder="Mathematics" value={r.subject} onChange={(e) => { r.subject = e.target.value; setRows([...rows]); }} /></td>
                      <td><input type="number" className="w-full p-4 text-center font-black bg-transparent outline-none" value={r.total} onChange={(e) => { r.total = e.target.value; setRows([...rows]); }} /></td>
                      <td><input type="number" className="w-full p-4 text-center font-black text-indigo-600 bg-transparent outline-none" placeholder="00" value={r.marks} onChange={(e) => { r.marks = e.target.value; setRows([...rows]); }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addRow} className="text-indigo-600 font-black text-[10px] mb-8 uppercase tracking-widest bg-indigo-50 px-6 py-2 rounded-xl transition-all hover:bg-indigo-100 shadow-sm">+ Add New Subject</button>

            <div className="flex gap-4">
               <button className="flex-1 bg-slate-100 py-5 rounded-3xl font-black text-slate-400 uppercase tracking-widest" onClick={() => setShowForm(false)}>Cancel</button>
               <button disabled={loading} className={`flex-1 ${loading ? 'bg-slate-300' : 'bg-blue-600'} text-white py-5 rounded-3xl font-black uppercase shadow-xl transition-all active:scale-95`} onClick={saveResult}>{loading ? "Saving..." : "Publish Result"}</button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT LIST TABLE */}
      <div className="bg-white rounded-[40px] shadow-sm border p-6 md:p-10">
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-end">
          <div className="flex-1 w-full"><label className="text-[10px] font-black text-slate-400 mb-1 uppercase pl-2 tracking-widest">Filter Class</label>
            <select className="border-2 p-4 w-full rounded-2xl font-black bg-slate-50 outline-none" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>{classesList.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <div className="flex-1 w-full"><label className="text-[10px] font-black text-slate-400 mb-1 uppercase pl-2 tracking-widest">Filter Exam</label>
            <select className="border-2 p-4 w-full rounded-2xl font-black bg-slate-50 outline-none" value={filterExam} onChange={(e) => setFilterExam(e.target.value)}>{examTypes.map(e => <option key={e} value={e}>{e}</option>)}</select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-slate-400 text-[10px] font-black uppercase border-b-2 tracking-widest">
              <tr><th className="pb-5 text-left">Student Info</th><th className="pb-5 text-center">Score Card</th><th className="pb-5 text-center">Grade</th><th className="pb-5 text-right pr-4">Action</th></tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {resultList.map(r => (
                <tr key={r.id} className="hover:bg-indigo-50/30 transition-all group font-black uppercase text-sm tracking-tighter">
                  <td className="py-6 pl-4">
                    <p className="text-slate-800">{r.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Roll: {r.roll} | {r.fatherName}</p>
                  </td>
                  <td className="py-6 text-center">
                    <div className="font-black text-indigo-600 text-lg">{r.percent}%</div>
                    <p className="text-[9px] text-slate-400">{r.obtained} Obtained</p>
                  </td>
                  <td className="py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${r.grade === 'Fail' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>GRADE {r.grade}</span>
                  </td>
                  <td className="py-6 text-right pr-4">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setSelectedResult(r); setShowModal(true); }} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] shadow-lg shadow-indigo-100 uppercase tracking-widest hover:bg-indigo-700 active:scale-95">Show</button>
                      <button onClick={() => handleDelete(r.id)} className="bg-red-50 text-red-400 px-6 py-2 rounded-xl text-[10px] uppercase border-2 border-red-50 hover:bg-red-100 transition-all">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resultList.length === 0 && <div className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">No matching results found</div>}
        </div>
      </div>
    </div>
  );
}