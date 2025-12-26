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
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import FeesReceipt from "./Fess";
import { updateTotalStudents } from "./updateTotalStudents";

export default function AddStudent({ close, editData }) {
  /* ---------------- MONTHS ---------------- */
  const months = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March"
  ];

  /* ---------------- STATES ---------------- */
  const [form, setForm] = useState({
    name: "",
    className: "",
    rollNumber: "",
    phone: "",
    address: "",
    fatherName: "",
    admissionFees: "",
    totalFees: "",
    aadhaar: "",
    gender: "",
    dob: "",
    admissionTime: "",
    session: "",
    photo: null,
    photoURL: "",
    userId: "",
    password: "",
  });
  const [fatherOpen, setFatherOpen] = useState(false);
  const [parents, setParents] = useState([]);
  const [addNewFather, setAddNewFather] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fess, setFess] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidMonthsList, setPaidMonthsList] = useState([]);
  const [fatherSearch, setFatherSearch] = useState("");

  /* ---------------- SESSION + TIME ---------------- */
useEffect(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1 = Jan ... 12 = Dec

  // 🔥 Academic Session: April to March
  const session =
    month >= 4
      ? `${year}-${String(year + 1).slice(-2)}`
      : `${year - 1}-${String(year).slice(-2)}`;

  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  setForm(prev => ({
    ...prev,
    session,
    admissionTime: time,
  }));
}, []);


  /* ---------------- LOAD PARENTS ---------------- */
  useEffect(() => {
    const loadParents = async () => {
      const snap = await getDocs(collection(db, "parents"));
      setParents(
        snap.docs.map(d => ({
          id: d.id,
          fatherName: d.data().fatherName,
          phone: d.data().phone,
        }))
      );
    };
    loadParents();
  }, []);

  /* ---------------- AUTO ROLL ---------------- */
  const generateRollNumber = async (className, session) => {
    if (!className || !session) return "";
    const q = query(
      collection(db, "students"),
      where("className", "==", className),
      where("session", "==", session)
    );
    const snap = await getDocs(q);
    let maxRoll = 0;
    snap.forEach(d => {
      const r = parseInt(d.data().rollNumber, 10);
      if (!isNaN(r) && r > maxRoll) maxRoll = r;
    });
    return (maxRoll + 1).toString();
  };

  /* ---------------- EDIT MODE ---------------- */
  useEffect(() => {
    if (editData) {
      setForm(prev => ({
        ...prev,
        ...editData,
        photo: null,
        photoURL: editData.photoURL || "",
      }));
    }
  }, [editData]);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name === "className") {
      const roll = await generateRollNumber(value, form.session);
      setForm(prev => ({ ...prev, className: value, rollNumber: roll }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateAttendance = () => {
    let obj = {};
    months.forEach(m => (obj[m] = { present: 0, absent: 0 }));
    return obj;
  };

  const generateFees = () => {
    let obj = {};
    const monthly = Number(form.totalFees || 0);
    months.forEach(m => { obj[m] = { total: monthly, paid: 0 }; });
    return obj;
  };

  const generateFeesWithPayment = () => {
    const monthly = Number(form.totalFees || 0);
    const amount = Number(paidAmount || 0);
    const monthsPaid = Math.floor(amount / monthly);
    let obj = {};
    let paidList = [];
    months.forEach((m, index) => {
      if (index < monthsPaid) {
        obj[m] = { total: monthly, paid: monthly, paidAt: serverTimestamp() };
        paidList.push(m);
      } else {
        obj[m] = { total: monthly, paid: 0 };
      }
    });
    setPaidMonthsList(paidList);
    return obj;
  };

  const getOrCreateParent = async (fatherName, phone, userId, password) => {
    const q = query(collection(db, "parents"), where("fatherName", "==", fatherName), where("phone", "==", phone));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;
    const parentDoc = await addDoc(collection(db, "parents"), {
      fatherName, phone, userId, password, fcmTokens: [], students: [], createdAt: serverTimestamp(),
    });
    return parentDoc.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalRoll = await generateRollNumber(form.className, form.session);
      if (finalRoll !== form.rollNumber) {
        setForm(prev => ({ ...prev, rollNumber: finalRoll }));
        alert("Roll updated, save again");
        setLoading(false);
        return;
      }
      let photoURL = form.photoURL;
      if (form.photo) {
        const imageRef = ref(storage, `students/${Date.now()}_${form.photo.name}`);
        await uploadBytes(imageRef, form.photo);
        photoURL = await getDownloadURL(imageRef);
      }
      const { photo, userId, password, ...safeForm } = form;
      const parentId = await getOrCreateParent(form.fatherName, form.phone, addNewFather ? userId : "", addNewFather ? password : "");
      const studentDoc = await addDoc(collection(db, "students"), {
        ...safeForm, admissionFees: Number(form.admissionFees), totalFees: Number(form.totalFees), photoURL, parentId, attendance: generateAttendance(), fees: paidAmount ? generateFeesWithPayment() : generateFees(), createdAt: serverTimestamp(),deletedAt: null, 
      });
      await updateDoc(doc(db, "parents", parentId), { students: arrayUnion(studentDoc.id) });
      alert("Student Added Successfully!");
       await updateTotalStudents();
      setFess(true);
    } catch (err) {
      console.error(err);
      alert("Error occurred!");
    }
    setLoading(false);
  };

  const getPaidAtString = () => {
    if (!paidMonthsList.length) return "";
    const month = paidMonthsList[0];
    const paidAt = paidAmount ? new Date() : editData?.fees?.[month]?.paidAt?.toDate();
    return paidAt ? paidAt.toLocaleString("en-IN") : "";
  };

  const filteredParents = parents.filter(p =>
    p.fatherName.toLowerCase().includes(fatherSearch.toLowerCase()) || p.phone.includes(fatherSearch)
  );

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
      {!fess && (
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-blue-50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-blue-700">Admission Form</h2>
            <button onClick={close} className="text-gray-500 hover:text-red-600 text-3xl">&times;</button>
          </div>

          {/* Form Content - Scrollable on Mobile */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            
            {/* Student Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 font-bold text-gray-700 border-l-4 border-blue-500 pl-2">Student Details</div>
              
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-500 ml-1">Student Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none" required />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-500 ml-1">Roll Number (Auto)</label>
                <input name="rollNumber" value={form.rollNumber} readOnly className="border rounded-lg p-2.5 bg-gray-100 italic" />
              </div>

              <select name="className" value={form.className} onChange={handleChange} className="border rounded-lg p-2.5" required>
                <option value="">Select Class</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c => <option key={c} value={`Class ${c}`}>Class {c}</option>)}
              </select>

              <select name="gender" value={form.gender} onChange={handleChange} className="border rounded-lg p-2.5" required>
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-500 ml-1">Date of Birth</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} className="border rounded-lg p-2.5" required />
              </div>

              <input name="aadhaar" value={form.aadhaar} onChange={handleChange} placeholder="Aadhaar Number" className="border rounded-lg p-2.5" required />
            </section>

            {/* Parent Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 font-bold text-gray-700 border-l-4 border-green-500 pl-2">Parent Details</div>
              
              <div className="md:col-span-2 relative">
                <div onClick={() => setFatherOpen(!fatherOpen)} className="border p-2.5 rounded-lg cursor-pointer bg-white flex justify-between items-center">
                  <span>{form.fatherName ? `${form.fatherName} (${form.phone})` : "Search & Select Father"}</span>
                  <span className="text-xs text-gray-400">▼</span>
                </div>

                {fatherOpen && (
                  <div className="absolute z-[60] bg-white border w-full mt-1 rounded-lg shadow-xl max-h-48 overflow-auto">
                    <input type="text" value={fatherSearch} onChange={(e) => setFatherSearch(e.target.value)} placeholder="Search Name or Phone..." className="sticky top-0 bg-white border-b p-2 w-full outline-none" autoFocus />
                    {filteredParents.map(p => (
                      <div key={p.id} onClick={() => { setForm(prev => ({ ...prev, fatherName: p.fatherName, phone: p.phone })); setAddNewFather(false); setFatherOpen(false); setFatherSearch(""); }} className="p-3 hover:bg-blue-50 border-b last:border-0 cursor-pointer text-sm">
                        {p.fatherName} <span className="text-gray-500">({p.phone})</span>
                      </div>
                    ))}
                    <div onClick={() => { setAddNewFather(true); setForm(prev => ({ ...prev, fatherName: "", phone: "" })); setFatherOpen(false); }} className="p-3 text-blue-600 font-bold hover:bg-blue-50 cursor-pointer border-t italic">
                      + Add New Parent Record
                    </div>
                  </div>
                )}
              </div>

              <input name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Father's Name" className="border rounded-lg p-2.5" required />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" className="border rounded-lg p-2.5" required />

              {addNewFather && (
                <>
                  <input name="userId" value={form.userId} onChange={handleChange} placeholder="Set Login ID" className="border rounded-lg p-2.5 bg-blue-50" required />
                  <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Set Password" className="border rounded-lg p-2.5 bg-blue-50" required />
                </>
              )}
            </section>

            {/* Fees Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 font-bold text-gray-700 border-l-4 border-yellow-500 pl-2">Fees & Address</div>
              <input name="admissionFees" value={form.admissionFees} onChange={handleChange} placeholder="Admission Fee" className="border rounded-lg p-2.5" required />
              <input name="totalFees" value={form.totalFees} onChange={handleChange} placeholder="Monthly Fee" className="border rounded-lg p-2.5" required />
              <input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Immediate Payment (Optional)" className="border rounded-lg p-2.5 md:col-span-2 bg-green-50" />
              <textarea name="address" value={form.address} onChange={handleChange} placeholder="Full Address" className="border rounded-lg p-2.5 md:col-span-2 h-20" required />
            </section>

            {/* Photo Section */}
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
              <label className="block text-sm font-bold text-gray-600 mb-2">Student Photo</label>
              <input type="file" onChange={(e) => setForm(prev => ({ ...prev, photo: e.target.files[0] }))} className="text-sm w-full" />
            </div>

            {/* Submit Button - Sticky at bottom of form */}
            <button disabled={loading} className={`w-full py-3.5 rounded-xl text-white text-lg font-bold shadow-lg transition-all ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}>
              {loading ? "Processing..." : "Save & Print Receipt"}
            </button>
          </form>
        </div>
      )}

      {fess && (
        <FeesReceipt
          name={form.name}
          studentClass={form.className}
          admissionFee={Number(form.admissionFees)}
          monthlyFee={Number(form.totalFees)}
          payMonth={paidMonthsList.join(", ")}
          paidAt={getPaidAtString()}
          onClose={() => { setFess(false); close(); }}
        />
      )}
    </div>
  );
}