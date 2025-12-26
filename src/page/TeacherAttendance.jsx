import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import toast from "react-hot-toast";
import { UserCheck, ChevronRight } from "lucide-react";

export default function TeacherAttendance() {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "teachers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeachers(list);
    });
    return () => unsubscribe();
  }, []);

  const getDaysInMonth = () => {
    const m = months.indexOf(month);
    const year = new Date().getFullYear();
    return new Date(year, m + 1, 0).getDate();
  };

  const markAttendance = async (teacher, day, status) => {
    const dateKey = `${month}_day_${day}`;
    if (teacher.attendance?.[dateKey]) {
      toast.error("Locked!");
      return;
    }
    try {
      await updateDoc(doc(db, "teachers", teacher.id), {
        [`attendance.${dateKey}`]: status,
      });
      toast.success(`${status} marked`);
    } catch (err) {
      toast.error("Error");
    }
  };

  return (
    // "h-screen" ensures the layout fits exactly in the device height without outer page scroll
    <div className=" container mx-auto  rounded-2xl shadow-xl overflow-hidden">
      
      {/* MAIN WRAPPER */}
      <div className=" w-full coverflow-x-auto overflow-y-auto  relative">
        
        {/* HEADER: Fixes at top */}
        <div className="  flex-none bg-white p-3 md:p-5 rounded-xl shadow-sm border mb-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-blue-600 p-2 rounded-lg text-white shrink-0">
              <UserCheck size={20} />
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">Teacher Attendance</h2>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full sm:w-auto border-2 px-3 py-1.5 rounded-lg bg-slate-50 font-bold text-slate-700 outline-none text-sm focus:border-blue-500 transition-all cursor-pointer"
            >
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* TABLE AREA: Scrollable middle part */}
        <div className="flex-1 min-h-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative">
          
          <div className="overflow-auto relative grow scrollbar-hide">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-30 shadow-sm">
                <tr className="bg-slate-50">
                  {/* Sticky Header for Teacher Name */}
                  <th className="p-3 text-left border-b border-r sticky top-0 left-0 bg-slate-50 z-40 min-w-[120px] sm:min-w-[150px] md:min-w-[180px] text-slate-600 font-bold text-[10px] md:text-xs uppercase tracking-wider">
                    Teacher Name
                  </th>
                  {[...Array(getDaysInMonth())].map((_, i) => (
                    <th key={i} className="p-2 border-b border-r text-center sticky top-0 bg-slate-50 z-20 text-[10px] font-black text-slate-500 min-w-[40px] sm:min-w-[45px]">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-blue-50/30 transition-colors">
                    
                    {/* Sticky Left Name Column with Shadow Effect */}
                    <td className="p-2 md:p-3 border-r sticky left-0 bg-white z-20 flex items-center gap-2 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 border shrink-0 flex items-center justify-center font-bold text-blue-500 text-[10px] md:text-xs overflow-hidden">
                        {teacher.photoURL ? (
                          <img src={teacher.photoURL} className="w-full h-full object-cover" alt="t" />
                        ) : (
                          teacher.name?.[0]
                        )}
                      </div>
                      <span className="font-bold text-slate-700 truncate text-[10px] md:text-xs max-w-[80px] sm:max-w-none">
                        {teacher.name}
                      </span>
                    </td>

                    {/* Attendance P/A Buttons */}
                    {[...Array(getDaysInMonth())].map((_, i) => {
                      const day = i + 1;
                      const dateKey = `${month}_day_${day}`;
                      const status = teacher.attendance?.[dateKey] || "";

                      return (
                        <td key={i} className="p-1 border-r text-center h-10 md:h-12 min-w-[42px]">
                          {status ? (
                            <div className={`w-full h-7 md:h-8 flex items-center justify-center rounded font-black text-white text-[9px] md:text-[10px] shadow-sm animate-in fade-in zoom-in duration-300 ${status === 'P' ? 'bg-green-500' : 'bg-red-500'}`}>
                              {status}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5 items-center justify-center">
                              <button 
                                onClick={() => markAttendance(teacher, day, "P")} 
                                className="w-8 h-3.5 md:h-4 text-[7px] md:text-[8px] font-bold rounded bg-slate-100 text-slate-400 hover:bg-green-500 hover:text-white transition-all active:scale-90"
                              >
                                P
                              </button>
                              <button 
                                onClick={() => markAttendance(teacher, day, "A")} 
                                className="w-8 h-3.5 md:h-4 text-[7px] md:text-[8px] font-bold rounded bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                              >
                                A
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER: Fixed at bottom */}
        <div className="flex-none p-3 flex flex-wrap gap-x-4 gap-y-2 justify-center items-center text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white mt-2 rounded-lg border">
           <div className="flex items-center gap-1.5">
             <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div> 
             <span>Present</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div> 
             <span>Absent</span>
           </div>
           <div className="hidden sm:block text-slate-300">|</div>
           <div className="flex items-center gap-1 text-slate-400 font-normal italic lowercase">
             <ChevronRight size={10} /> Scroll right for all dates
           </div>
        </div>

      </div>
    </div>
  );
}