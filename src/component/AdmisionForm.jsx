import React, { useRef, useState, useEffect } from "react";
import { db } from "../firebase"; 
import { doc, getDoc } from "firebase/firestore";

export default function AdmissionDetails({ studentId, paidAmount, paidMonthsList, onClose }) {
    const printRef = useRef();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finalPhoto, setFinalPhoto] = useState(null);
    
    const [school, setSchool] = useState({
        name: "Your School Name",
        address: "School Address",
        affiliation: "Affiliation Info",
        logoUrl: "download.jpg"
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!studentId) return;
            try {
                const schoolSnap = await getDoc(doc(db, "settings", "schoolDetails"));
                if (schoolSnap.exists()) {
                    setSchool(schoolSnap.data());
                }

                const docSnap = await getDoc(doc(db, "students", studentId));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStudent(data);
                    
                    if (data.photoURL) {
                        const img = new Image();
                        const proxyUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(data.photoURL)}`;
                        img.src = proxyUrl;
                        img.crossOrigin = "anonymous"; 
                        img.onload = () => { setFinalPhoto(proxyUrl); setLoading(false); };
                        img.onerror = () => { setFinalPhoto(data.photoURL); setLoading(false); };
                    } else { setLoading(false); }
                }
            } catch (err) { 
                console.error(err); 
                setLoading(false); 
            }
        };
        fetchData();
    }, [studentId]);

const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        
        win.document.write(`
            <html>
                <head>
                    <title>Admission - ${student?.name}</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        @page { size: A4; margin: 5mm; }
                        @media print {
                            .no-print { display: none; }
                            body { -webkit-print-color-adjust: exact !important; margin: 0; padding: 0; }
                        }
                        .sheet-container { margin-bottom: 10px; position: relative; border: 1px solid black; }
                    </style>
                </head>
                <body>
                    <div>${printContent}</div>
                    <script>
                        // Ye script wait karegi jab tak sab load na ho jaye
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 500); // 0.5 second ka delay
                        };
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    };
    if (loading) return <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center font-bold italic text-blue-600 tracking-widest">LOADING ADMISSION SLIP...</div>;
    if (!student) return null;

    const grandTotal = (Number(student.admissionFees) || 0) + (Number(paidAmount) || 0);

    const DocumentSheet = ({ copyName }) => (
        <div className="w-full max-w-[800px] mx-auto bg-white p-3 md:p-5 border-[1px] border-black shadow-xl relative text-sm min-h-[500px] sheet-container page-break overflow-hidden mb-4">
            
            <div className="absolute top-1 right-1 border border-black px-1.5 py-0.5 text-[8px] md:text-[10px] font-bold uppercase bg-white">
                {copyName}
            </div>

            {/* School Header */}
            <div className="flex items-center border-b-2 border-black pb-2 mb-3 gap-2 md:gap-4">
                <div className="w-14 h-14 md:w-20 md:h-20 flex-shrink-0">
                    <img src={school.logoUrl || "download.jpg"} alt="Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                </div>
                <div className="flex-1 text-center pr-8 md:pr-20">
                    <h1 className="text-xl md:text-3xl font-black text-blue-900 uppercase leading-none">{school.name}</h1>
                    <p className="font-bold text-[8px] md:text-[10px] mt-1 uppercase text-gray-600">{school.affiliation} | {school.address}</p>
                    <div className="mt-1 inline-block border border-black px-3 py-0.5 bg-black text-white font-bold text-[9px] md:text-xs uppercase">ADMISSION RECORD: {student.session || "2024-25"}</div>
                </div>
            </div>

            {/* Registration & Photo Section */}
            <div className="flex justify-between items-start mb-3 gap-2 md:gap-4">
                <div className="flex-1 grid grid-cols-2 border-l border-t border-black text-[9px] md:text-[11px]">
                    <div className="border-r border-b border-black p-1 md:p-1.5 font-bold bg-gray-100 uppercase">Reg No.</div>
                    <div className="border-r border-b border-black p-1 md:p-1.5 font-black text-blue-800 uppercase">{student.regNo}</div>
                    <div className="border-r border-b border-black p-1 md:p-1.5 font-bold bg-gray-100 uppercase">Class</div>
                    <div className="border-r border-b border-black p-1 md:p-1.5 font-black uppercase italic">{student.className}</div>
                    <div className="border-r border-b border-black p-1 md:p-1.5 font-bold bg-gray-100 uppercase">Roll No.</div>
                    <div className="border-r border-b border-black p-1 md:p-1.5 font-black uppercase">{student.rollNumber || "---"}</div>
                    <div className="border-r border-b border-black p-1 md:p-1.5 font-bold bg-gray-100 uppercase">Date</div>
                    <div className="border-r border-b border-black p-1 md:p-1.5 font-bold">{new Date().toLocaleDateString('en-IN')}</div>
                </div>
                
                <div className="w-16 h-20 md:w-24 md:h-30 border-2 border-black flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                    {finalPhoto ? <img src={finalPhoto} className="w-full h-full object-cover" alt="S" /> : <span className="text-[8px] font-bold text-gray-400 uppercase text-center">PHOTO</span>}
                </div>
            </div>

            {/* Student Profile Section (DOB & Gender Included) */}
            <div className="border-t border-l border-black mb-3">
                <h3 className="bg-blue-900 text-white font-black px-2 py-0.5 border-r border-b border-black text-[9px] md:text-[10px] uppercase">Student Profile</h3>
                <div className="grid grid-cols-4 text-[10px] md:text-[11px]">
                    <div className="p-1 md:p-1.5 border-r border-b border-black font-bold bg-gray-50">STUDENT NAME</div>
                    <div className="p-1 md:p-1.5 border-r border-b border-black font-black uppercase col-span-3 text-blue-900">{student.name}</div>
                    
                    <div className="p-1 md:p-1.5 border-r border-b border-black font-bold bg-gray-50">FATHER NAME</div>
                    <div className="p-1 md:p-1.5 border-r border-b border-black font-bold uppercase col-span-3">{student.fatherName}</div>
                    
                    {/* New Row for DOB and Gender */}
                    <div className="p-1 md:p-1.5 border-r border-b border-black font-bold bg-gray-50 uppercase">Date of Birth</div>
                    <div className="p-1 md:p-1.5 border-r border-b border-black font-bold uppercase">{student.dob}</div>
                    <div className="p-1 md:p-1.5 border-r border-b border-black font-bold bg-gray-50 uppercase">Gender</div>
                    <div className="p-1 md:p-1.5 border-r border-b border-black font-bold uppercase text-blue-800">{student.gender || "---"}</div>

                    <div className="p-1 md:p-1.5 border-r border-b border-black font-bold bg-gray-50 uppercase">Aadhaar/Add.</div>
                    <div className="p-1 md:p-1.5 border-r border-b border-black col-span-3 text-[9px] md:text-[10px] font-bold uppercase">{student.aadhaar} | {student.address}</div>
                </div>
            </div>

            {/* Fees Table */}
            <div className="mb-3">
                <table className="w-full border-collapse border-2 border-black text-[10px] md:text-[11px]">
                    <thead className="bg-gray-100 uppercase">
                        <tr>
                            <th className="border border-black p-1 text-left font-black">Fee Description</th>
                            <th className="border border-black p-1 text-right font-black">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold italic">
                        <tr>
                            <td className="border border-black p-1 font-normal uppercase">Admission & Reg. Fees</td>
                            <td className="border border-black p-1 text-right">₹{Number(student.admissionFees).toFixed(2)}</td>
                        </tr>
                        {paidAmount > 0 && (
                            <tr className="bg-green-50 text-blue-800">
                                <td className="border border-black p-1 font-normal uppercase">Tuition Fee ({paidMonthsList?.join(", ")})</td>
                                <td className="border border-black p-1 text-right">₹{Number(paidAmount).toFixed(2)}</td>
                            </tr>
                        )}
                        <tr className="bg-blue-50 not-italic">
                            <td className="border border-black p-1.5 text-right font-black uppercase text-xs">Grand Total:</td>
                            <td className="border border-black p-1.5 text-right text-blue-900 text-sm md:text-lg font-black italic">₹{grandTotal.toFixed(2)}/-</td>
                        </tr>
                    </tbody>
                </table>
                <p className="mt-1 text-[8px] md:text-[9px] font-black uppercase italic text-gray-500">In Words: {toWords(Math.floor(grandTotal))} Only</p>
            </div>

            {/* Signature Area */}
            <div className="flex justify-between px-6 md:px-10 mt-6 md:mt-10">
                <div className="text-center w-24 md:w-32 border-t border-black pt-1 font-bold text-[9px] md:text-[10px] uppercase">Parent's Sign</div>
                <div className="text-center w-24 md:w-32 border-t border-black pt-1 font-bold text-[9px] md:text-[10px] uppercase">Principal / Seal</div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-100 z-[100] overflow-y-auto p-2 md:p-4">
            {/* Header with Print/Back Buttons */}
            <div className="max-w-[800px] mx-auto sticky top-0 z-[110] flex items-center justify-between mb-4 no-print bg-white p-2 md:p-3 rounded-lg shadow-md border-b-4 border-blue-600">
                <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-md">← Close</button>
                <div className="font-bold text-blue-800 text-[10px] md:text-xs uppercase tracking-tight text-center">Receipt Generator (A4)</div>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-md text-xs font-black shadow-lg tracking-widest transition-all">PRINT NOW</button>
            </div>

            {/* Print Area */}
            <div ref={printRef}>
                <DocumentSheet copyName="Office Copy" />
                <div className="my-2 md:my-4 border-b-2 border-dashed border-gray-400 no-print flex justify-center italic text-gray-400 text-[9px] uppercase font-bold py-2">
                    ✂️ Cut Along This Line (Student Receipt Below) ✂️
                </div>
                <DocumentSheet copyName="Student Copy" />
            </div>
        </div>
    );
}

// Function to convert Number to Words
function toWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero';
    function convert(n) {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
        return n;
    }
    return convert(num);
}