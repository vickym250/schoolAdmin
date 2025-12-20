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
    const month = now.getMonth() + 1;

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

  const handleFatherSelect = (e) => {
    const value = e.target.value;

    if (value === "NEW_FATHER") {
      setAddNewFather(true);
      setForm(prev => ({ ...prev, fatherName: "", phone: "" }));
      return;
    }

    const selected = parents.find(p => p.id === value);
    if (selected) {
      setAddNewFather(false);
      setForm(prev => ({
        ...prev,
        fatherName: selected.fatherName,
        phone: selected.phone,
      }));
    }
  };

  const handlePhoto = (e) => {
    setForm(prev => ({ ...prev, photo: e.target.files[0] }));
  };

  /* ---------------- ATTENDANCE ---------------- */
  const generateAttendance = () => {
    let obj = {};
    months.forEach(m => (obj[m] = { present: 0, absent: 0 }));
    return obj;
  };

  /* ---------------- FEES ---------------- */
  const generateFees = () => {
    let obj = {};
    const monthly = Number(form.totalFees || 0);
    months.forEach(m => {
      obj[m] = { total: monthly, paid: 0 };
    });
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
        obj[m] = {
          total: monthly,
          paid: monthly,
          paidAt: serverTimestamp(), // ✅ ADMIN DATE TIME
        };
        paidList.push(m);
      } else {
        obj[m] = { total: monthly, paid: 0 };
      }
    });

    setPaidMonthsList(paidList);
    return obj;
  };


  /* ---------------- PARENT ---------------- */
  const getOrCreateParent = async (fatherName, phone, userId, password) => {
    const q = query(
      collection(db, "parents"),
      where("fatherName", "==", fatherName),
      where("phone", "==", phone)
    );

    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;

    const parentDoc = await addDoc(collection(db, "parents"), {
      fatherName,
      phone,
      userId,
      password,
      fcmTokens: [],
      students: [],
      createdAt: serverTimestamp(),
    });

    return parentDoc.id;
  };

  const filteredParents = parents.filter(p =>
    p.fatherName.toLowerCase().includes(fatherSearch.toLowerCase()) ||
    p.phone.includes(fatherSearch)
  );

  /* ---------------- SUBMIT ---------------- */
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

      const parentId = await getOrCreateParent(
        form.fatherName,
        form.phone,
        addNewFather ? userId : "",
        addNewFather ? password : ""
      );

      const studentDoc = await addDoc(collection(db, "students"), {
        ...safeForm,
        admissionFees: Number(form.admissionFees),
        totalFees: Number(form.totalFees),
        photoURL,
        parentId,
        attendance: generateAttendance(),
        fees: paidAmount ? generateFeesWithPayment() : generateFees(),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "parents", parentId), {
        students: arrayUnion(studentDoc.id),
      });

      alert("Student Added Successfully!");
      setFess(true);

    } catch (err) {
      console.error(err);
      alert("Error occurred!");
    }

    setLoading(false);
  };




const getPaidAtString = () => {
  if (!paidMonthsList.length) return "";

  const month = paidMonthsList[0]; // first paid month

  // fees object se paidAt nikaalo
  const paidAt =
    paidAmount
      ? new Date() // just-added student (receipt turant)
      : editData?.fees?.[month]?.paidAt?.toDate();

  return paidAt
    ? paidAt.toLocaleString("en-IN")
    : "";
};


  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50">

      {!fess && (
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl relative">
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
            Student Admission Form
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

            {/* STUDENT INFO */}
            <div className="col-span-2 font-semibold text-gray-600 border-b pb-1">
              Student Details
            </div>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Student Name"
              className="border rounded-lg p-2"
              required
            />

            <input
              name="rollNumber"
              value={form.rollNumber}
              readOnly
              placeholder="Roll No (Auto)"
              className="border rounded-lg p-2 bg-gray-100"
            />

            <select
              name="className"
              value={form.className}
              onChange={handleChange}
              className="border rounded-lg p-2"
              required
            >
              <option value="">Select Class</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c => (
                <option key={c}>Class {c}</option>
              ))}
            </select>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="border rounded-lg p-2"
              required
            >
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="border rounded-lg p-2"
              required
            />

            <input
              name="aadhaar"
              value={form.aadhaar}
              onChange={handleChange}
              placeholder="Aadhaar Number"
              className="border rounded-lg p-2"
              required
            />

            <input
              name="session"
              value={form.session}
              readOnly
              className="border rounded-lg p-2 bg-gray-100"
            />

            <input
              name="admissionTime"
              value={form.admissionTime}
              readOnly
              className="border rounded-lg p-2 bg-gray-100"
            />

            {/* PARENT INFO */}
            <div className="col-span-2 font-semibold text-gray-600 border-b pt-4 pb-1">
              Parent Details
            </div>

         {/* 👨‍👦 FATHER SELECT WITH SEARCH */}
<div className="col-span-2 relative">

  {/* SELECT BOX */}
  <div
    onClick={() => setFatherOpen(!fatherOpen)}
    className="border p-2 rounded cursor-pointer bg-white"
  >
    {form.fatherName
      ? `${form.fatherName} (${form.phone})`
      : "Select Father"}
  </div>

  {/* DROPDOWN */}
  {fatherOpen && (
    <div className="absolute z-50 bg-white border w-full mt-1 rounded shadow max-h-60 overflow-auto">

      {/* 🔍 SEARCH INPUT */}
      <input
        type="text"
        value={fatherSearch}
        onChange={(e) => setFatherSearch(e.target.value)}
        placeholder="Search Father by Name or Phone"
        className="border-b p-2 w-full outline-none"
        autoFocus
      />

      {/* 👨‍👦 LIST */}
      {filteredParents.map(p => (
        <div
          key={p.id}
          onClick={() => {
            setForm(prev => ({
              ...prev,
              fatherName: p.fatherName,
              phone: p.phone,
            }));
            setAddNewFather(false);
            setFatherOpen(false);
            setFatherSearch("");
          }}
          className="p-2 hover:bg-blue-100 cursor-pointer"
        >
          {p.fatherName} ({p.phone})
        </div>
      ))}

      {/* ➕ NEW FATHER */}
      <div
        onClick={() => {
          setAddNewFather(true);
          setForm(prev => ({ ...prev, fatherName: "", phone: "" }));
          setFatherOpen(false);
        }}
        className="p-2 text-blue-600 font-semibold hover:bg-blue-50 cursor-pointer"
      >
        ➕ Add New Father
      </div>
    </div>
  )}
</div>

            <input
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
              placeholder="Father Name"
              className="border rounded-lg p-2"
              required
            />

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="border rounded-lg p-2"
              required
            />

            {addNewFather && (
              <>
                <input
                  name="userId"
                  value={form.userId}
                  onChange={handleChange}
                  placeholder="Parent User ID"
                  className="border rounded-lg p-2"
                  required
                />
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Parent Password"
                  className="border rounded-lg p-2"
                  required
                />
              </>
            )}

            {/* FEES */}
            <div className="col-span-2 font-semibold text-gray-600 border-b pt-4 pb-1">
              Fees Details
            </div>

            <input
              name="admissionFees"
              value={form.admissionFees}
              onChange={handleChange}
              placeholder="Admission Fee"
              className="border rounded-lg p-2"
              required
            />

            <input
              name="totalFees"
              value={form.totalFees}
              onChange={handleChange}
              placeholder="Monthly Fee"
              className="border rounded-lg p-2"
              required
            />

            <input
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="Paid Amount (optional)"
              className="border rounded-lg p-2 col-span-2"
            />

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              className="border rounded-lg p-2 col-span-2"
            />

            {/* PHOTO */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-600">Student Photo</label>
              <input type="file" onChange={handlePhoto} className="mt-1" />
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-lg col-span-2 text-lg font-semibold"
            >
              {loading ? "Saving..." : "Save & Generate Receipt"}
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
