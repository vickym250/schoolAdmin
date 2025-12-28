import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateTotalStudents } from "./updateTotalStudents";
import AdmissionDetails from "./AdmisionForm";

export default function AddStudent({ close, editData }) {
  const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
  
  const [form, setForm] = useState({
    name: "", className: "", rollNumber: "", regNo: "", phone: "", address: "", fatherName: "", admissionFees: "", totalFees: "",
    aadhaar: "", gender: "", dob: "", session: "", photo: null, photoURL: "", userId: "", password: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [fatherOpen, setFatherOpen] = useState(false);
  const [parents, setParents] = useState([]);
  const [addNewFather, setAddNewFather] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fess, setFess] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidMonthsList, setPaidMonthsList] = useState([]);
  const [fatherSearch, setFatherSearch] = useState("");
  const [savedStudentId, setSavedStudentId] = useState(null);

  useEffect(() => {
    const now = new Date();
    const session = now.getMonth() + 1 >= 4 ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}` : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
    
    const initData = async () => {
        const nextReg = await generateRegNo();
        setForm(prev => ({ ...prev, session, regNo: nextReg }));
    };
    initData();

    const fetchParents = async () => {
      const snap = await getDocs(collection(db, "parents"));
      setParents(snap.docs.map(d => ({ id: d.id, fatherName: d.data().fatherName, phone: d.data().phone })));
    };
    fetchParents();
  }, []);

  // 🔥 Unique Registration Number Logic
  const generateRegNo = async () => {
    const q = query(collection(db, "students"), orderBy("regNo", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return "1001";
    const lastReg = snap.docs[0].data().regNo;
    return (parseInt(lastReg) + 1).toString();
  };

  // 🔥 Roll Number Logic (Class wise)
  const generateRoll = async (cls, sess) => {
    const q = query(collection(db, "students"), where("className", "==", cls), where("session", "==", sess));
    const snap = await getDocs(q);
    let max = 0;
    snap.forEach(d => { 
        const r = parseInt(d.data().rollNumber);
        if (r > max) max = r; 
    });
    return (max + 1).toString();
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name === "className") {
      const roll = await generateRoll(value, form.session);
      setForm(prev => ({ ...prev, className: value, rollNumber: roll }));
      const classNum = parseInt(value.replace("Class ", ""));
      if (classNum >= 9 && classNum <= 12) {
        setSubjects(["Hindi", "English", "Math", "Science", "S. Science", "Drawing"]);
      } else { setSubjects([]); }
    } else { setForm(prev => ({ ...prev, [name]: value })); }
  };

  const generateFeesWithPayment = () => {
    const monthly = Number(form.totalFees || 0);
    const amount = Number(paidAmount || 0);
    const monthsPaidCount = Math.floor(amount / monthly);
    let obj = {};
    let paidList = [];
    months.forEach((m, index) => {
      if (index < monthsPaidCount) {
        obj[m] = { total: monthly, paid: monthly, paidAt: serverTimestamp() };
        paidList.push(m);
      } else { obj[m] = { total: monthly, paid: 0 }; }
    });
    setPaidMonthsList(paidList);
    return obj;
  };

  const getOrCreateParent = async () => {
    const q = query(collection(db, "parents"), where("fatherName", "==", form.fatherName), where("phone", "==", form.phone));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;
    const parentDoc = await addDoc(collection(db, "parents"), { fatherName: form.fatherName, phone: form.phone, userId: form.userId, password: form.password, students: [], createdAt: serverTimestamp() });
    return parentDoc.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let downloadURL = form.photoURL;
      if (form.photo) {
        const refImg = ref(storage, `students/${Date.now()}_${form.photo.name}`);
        await uploadBytes(refImg, form.photo);
        downloadURL = await getDownloadURL(refImg);
      }

      const pId = await getOrCreateParent();
      const { photo, userId, password, ...safeForm } = form;

      const studentDocRef = await addDoc(collection(db, "students"), {
        ...safeForm,
        admissionFees: Number(form.admissionFees),
        totalFees: Number(form.totalFees),
        photoURL: downloadURL,
        parentId: pId,
        subjects: subjects,
        attendance: months.reduce((acc, m) => ({ ...acc, [m]: { present: 0, absent: 0 } }), {}),
        fees: generateFeesWithPayment(),
        createdAt: serverTimestamp(),
        deletedAt: null
      });

      await updateDoc(doc(db, "parents", pId), { students: arrayUnion(studentDocRef.id) });
      await updateTotalStudents();
      setSavedStudentId(studentDocRef.id);
      
      setTimeout(() => {
        setFess(true);
        setLoading(false);
      }, 800);
    } catch (err) { alert("Error!"); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
      {!fess ? (
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between bg-blue-50">
            <h2 className="text-xl font-bold text-blue-700">Admission Entry (REG: {form.regNo})</h2>
            <button onClick={close} className="text-3xl hover:text-red-500">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            <section className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2 font-bold text-gray-700 border-l-4 border-blue-500 pl-2 uppercase text-xs">Student Info</div>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="border p-2.5 rounded" required />
              <div className="grid grid-cols-2 gap-2">
                <input name="regNo" value={form.regNo} readOnly className="border p-2.5 rounded bg-blue-50 font-bold" title="Registration No" />
                <input name="rollNumber" value={form.rollNumber} readOnly className="border p-2.5 rounded bg-gray-100 italic" title="Roll No" placeholder="Roll Number " />
              </div>
              <select name="className" value={form.className} onChange={handleChange} className="border p-2.5 rounded" required>
                <option value="">Select Class</option>
                {[...Array(12)].map((_, i) => <option key={i} value={`Class ${i+1}`}>Class {i+1}</option>)}
              </select>
              <select name="gender" value={form.gender} onChange={handleChange} className="border p-2.5 rounded" required>
                <option value="">Gender</option><option>Male</option><option>Female</option>
              </select>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} className="border p-2.5 rounded" required />
              <input name="aadhaar" value={form.aadhaar} onChange={handleChange} placeholder="Aadhaar Number" className="border p-2.5 rounded" required />
            </section>

            {subjects.length > 0 && (
              <section className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-blue-700 text-sm">Subjects</h3>
                  <button type="button" onClick={() => setSubjects([...subjects, ""])} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">+ Add</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map((s, i) => (
                    <div key={i} className="flex gap-1">
                      <input value={s} onChange={(e) => { const n = [...subjects]; n[i] = e.target.value; setSubjects(n); }} className="border p-1 text-sm w-full bg-white" />
                      <button type="button" onClick={() => setSubjects(subjects.filter((_, idx) => idx !== i))} className="text-red-500">&times;</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="font-bold text-gray-700 border-l-4 border-green-500 pl-2 uppercase text-xs">Parent Info</div>
              <div className="relative">
                <div onClick={() => setFatherOpen(!fatherOpen)} className="border p-2.5 rounded cursor-pointer bg-white flex justify-between items-center shadow-sm">
                  <span>{form.fatherName ? `${form.fatherName} (${form.phone})` : "Search Father"}</span>
                  <span className="text-xs">▼</span>
                </div>
                {fatherOpen && (
                  <div className="absolute z-10 bg-white border w-full mt-1 rounded shadow-2xl max-h-48 overflow-auto">
                    <input type="text" onChange={(e) => setFatherSearch(e.target.value)} placeholder="Search..." className="p-2 w-full border-b sticky top-0 bg-white" />
                    <div onClick={() => { setAddNewFather(true); setForm(prev => ({ ...prev, fatherName: "", phone: "" })); setFatherOpen(false); }} className="p-3 text-blue-600 font-bold cursor-pointer border-t">+ Add New Parent</div>

                    {parents.filter(p => p.fatherName.toLowerCase().includes(fatherSearch.toLowerCase())).map(p => (
                      <div key={p.id} onClick={() => { setForm(prev => ({ ...prev, fatherName: p.fatherName, phone: p.phone })); setFatherOpen(false); setAddNewFather(false); }} className="p-2.5 hover:bg-blue-50 cursor-pointer border-b">{p.fatherName} ({p.phone})</div>
                    ))}
                  </div>
                )}
              </div>
              {(addNewFather || !form.fatherName) && (
                <div className="grid md:grid-cols-2 gap-4">
                  <input name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Father's Full Name" className="border p-2.5 rounded" required />
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="Mobile Number" className="border p-2.5 rounded" required />
                  {addNewFather && <>
                    <input name="userId" value={form.userId} onChange={handleChange} placeholder="Set Login ID" className="border p-2.5 rounded bg-blue-50" required />
                    <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Set Password" className="border p-2.5 rounded bg-blue-50" required />
                  </>}
                </div>
              )}
            </section>

            <section className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2 font-bold text-gray-700 border-l-4 border-yellow-500 pl-2 uppercase text-xs">Fees & Address</div>
              <input name="admissionFees" value={form.admissionFees} onChange={handleChange} placeholder="Admission Fee" className="border p-2.5 rounded" required />
              <input name="totalFees" value={form.totalFees} onChange={handleChange} placeholder="Monthly Fee" className="border p-2.5 rounded" required />
              <input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Immediate Payment (₹)" className="md:col-span-2 border p-2.5 rounded bg-green-50 font-bold" />
              <textarea name="address" value={form.address} onChange={handleChange} placeholder="Full Address" className="md:col-span-2 border p-2.5 rounded h-16" required />
              <div className="md:col-span-2 border-2 border-dashed p-3 text-center rounded bg-gray-50">
                <input type="file" onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))} className="text-xs" />
              </div>
            </section>
            
            <button disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-xl">
              {loading ? "Registering..." : "SAVE & PRINT FORM"}
            </button>
          </form>
        </div>
      ) : (
        <AdmissionDetails studentId={savedStudentId} paidAmount={paidAmount} paidMonthsList={paidMonthsList} subjects={subjects} onClose={() => { setFess(false); close(); }} />
      )}
    </div>
  );
}