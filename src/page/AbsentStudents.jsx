import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, getDocs, where } from "firebase/firestore";
import { 
  HiOutlinePhone, 
  HiOutlineEye, 
  HiX, 
  HiPhoneIncoming, 
  HiChatAlt2, 
  HiArrowsExpand,
  HiOutlineCalendar
} from "react-icons/hi";

export default function AbsentStudents() {
  const [students, setStudents] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null); 
  const [fullImage, setFullImage] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  // Filters State
  const sessions = ["2024-25", "2025-26", "2026-27"];
  const [session, setSession] = useState("2025-26");
  const [className, setClassName] = useState("All");

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = months[today.getMonth()];

  // 1. Students Collection se data lana (Main List)
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => !s.deletedAt);
      setStudents(list);
    });
    return () => unsub();
  }, []);

  // 2. Applications Collection se Photo aur Details nikalna
  const handleViewApplication = async (student) => {
    setLoadingId(student.id);
    try {
      const appRef = collection(db, "applications");
      const q = query(appRef, where("studentId", "==", student.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Sabse latest application uthana
        const appData = querySnapshot.docs[0].data();
        setSelectedApp({ 
          ...appData, 
          studentPhone: student.phone,
          displayClass: student.className,
          displayRoll: student.rollNumber 
        });
      } else {
        alert("Is student ki koi photo application record mein nahi mili.");
      }
    } catch (err) {
      console.error("Firebase Error:", err);
      alert("Data fetch karne mein dikkat aayi.");
    }
    setLoadingId(null);
  };

  // Filter Logic
  const absentList = students.filter((s) => {
    const matchesSession = s.session === session;
    const matchesClass = className === "All" ? true : s.className === className;
    const dayKey = `${currentMonth}_day_${currentDay}`;
    return matchesClass && matchesSession && s.attendance?.[currentMonth]?.[dayKey] === "A";
  });

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* 🔝 HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
              Absentees Board
            </h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 justify-center md:justify-start">
              <HiOutlineCalendar className="text-blue-500" /> {currentDay} {currentMonth}, {session}
            </p>
          </div>
          
          <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl">
            <select 
              value={className} 
              onChange={(e) => setClassName(e.target.value)} 
              className="bg-white px-5 py-2.5 rounded-xl font-black text-[12px] text-slate-600 outline-none shadow-sm border-none ring-0"
            >
              <option value="All">All Classes</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 📋 TABLE SECTION */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="p-7">Student Information</th>
                  <th className="p-7 hidden md:table-cell">Contact</th>
                  <th className="p-7 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {absentList.length > 0 ? (
                  absentList.map((student) => (
                    <tr key={student.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                      <td className="p-7">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-800 uppercase text-sm group-hover:text-blue-600 transition-colors">
                              {student.name}
                            </div>
                            <div className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                              {student.className} • Roll No: #{student.rollNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-7 hidden md:table-cell">
                        <div className="text-sm font-black text-slate-700">{student.phone}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Father: {student.fatherName}
                        </div>
                      </td>
                      <td className="p-7 text-center">
                        <button 
                          onClick={() => handleViewApplication(student)}
                          disabled={loadingId === student.id}
                          className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-blue-600 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                          {loadingId === student.id ? "FETCHING..." : "VIEW APP"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm italic">
                      No Absentees Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 📄 FULL SCREEN READING MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/98 z-50 flex flex-col md:p-4 p-0 overflow-y-auto scrollbar-hide">
          
          {/* Sticky Header Bar */}
          <div className="sticky top-0 z-[60] flex justify-between items-center bg-white p-5 md:rounded-[2rem] shadow-2xl">
            <div className="flex items-center gap-4">
               <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-200">
                  <HiArrowsExpand size={20}/>
               </div>
               <div>
                  <h3 className="text-base font-black text-slate-800 uppercase leading-none">
                    {selectedApp.studentName}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">
                    Application Document
                  </p>
               </div>
            </div>
            <button 
              onClick={() => setSelectedApp(null)} 
              className="bg-slate-100 p-4 rounded-full hover:bg-red-500 hover:text-white transition-all text-slate-500 shadow-sm"
            >
              <HiX size={24} />
            </button>
          </div>

          {/* DOCUMENT VIEWING AREA (Scrollable) */}
          <div className="flex-grow flex flex-col items-center bg-transparent py-4">
            <div className="w-full max-w-3xl bg-white shadow-2xl relative">
              <img 
                src={selectedApp.photoURL} 
                className="w-full h-auto object-contain cursor-zoom-in" 
                alt="Application Content"
                onClick={() => setFullImage(selectedApp.photoURL)}
              />
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 z-[60] bg-white p-6 md:rounded-[2rem] border-t border-slate-100 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] mt-auto">
             <div className="flex flex-col md:flex-row gap-5 items-center justify-between max-w-4xl mx-auto">
                <div className="text-center md:text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Phone</p>
                   <p className="font-black text-slate-800 text-xl tracking-tighter">{selectedApp.studentPhone}</p>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                   {/* WhatsApp */}
                   <a 
                    href={`https://wa.me/91${selectedApp.studentPhone}?text=Hello, this is from school regarding your child ${selectedApp.studentName}'s absence.`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 md:w-52 bg-emerald-500 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                   >
                     <HiChatAlt2 size={22}/> WhatsApp
                   </a>

                   {/* Call */}
                   <a 
                    href={`tel:${selectedApp.studentPhone}`}
                    className="flex-1 md:w-52 bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
                   >
                     <HiPhoneIncoming size={22}/> Direct Call
                   </a>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ⚡ HD ZOOM PREVIEW */}
      {fullImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300" 
          onClick={() => setFullImage(null)}
        >
          <img 
            src={fullImage} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            alt="High Definition View" 
          />
          <div className="absolute top-8 right-8 flex gap-4">
             <button className="bg-white/10 text-white p-5 rounded-full backdrop-blur-xl hover:bg-red-500 transition-all">
                <HiX size={30} />
             </button>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 font-black text-[10px] uppercase tracking-[0.5em]">
            Tap anywhere to close zoom
          </div>
        </div>
      )}
    </div>
  );
}