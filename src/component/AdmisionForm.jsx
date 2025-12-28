import React, { useRef, useState, useEffect } from "react";
import { db } from "../firebase"; 
import { doc, getDoc } from "firebase/firestore";

export default function AdmissionDetails({ studentId, paidAmount, paidMonthsList, onClose }) {
    const printRef = useRef();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finalPhoto, setFinalPhoto] = useState(null);
    
    // Naya state school details ke liye
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
                // 1. School Settings Fetch Karein
                const schoolSnap = await getDoc(doc(db, "settings", "schoolDetails"));
                if (schoolSnap.exists()) {
                    setSchool(schoolSnap.data());
                }

                // 2. Student Data Fetch Karein
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
        const win = window.open('', '_blank', 'width=900,height=900');
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
                            .page-break { page-break-after: always; }
                        }
                        .sheet-container { margin-bottom: 10px; position: relative; }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div>${printContent}</div>
                </body>
            </html>
        `);
        win.document.close();
    };

    if (loading) return <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center font-bold italic text-blue-600">GENERATING 2 COPIES...</div>;
    if (!student) return null;

    const grandTotal = (Number(student.admissionFees) || 0) + (Number(paidAmount) || 0);

    const DocumentSheet = ({ copyName }) => (
        <div className="max-w-[800px] mx-auto bg-white p-6 border-[1px] border-black shadow-xl relative text-sm min-h-[520px] sheet-container page-break">
            
            <div className="absolute top-2 right-2 border border-black px-2 py-0.5 text-[10px] font-bold uppercase">
                {copyName}
            </div>

            {/* Dynamic School Header */}
            <div className="flex items-center border-b-2 border-black pb-3 mb-4 gap-4">
                <div className="w-20 h-20 flex-shrink-0">
                    <img 
                        src={school.logoUrl || "download.jpg"} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                </div>

                <div className="flex-1 text-center pr-20">
                    <h1 className="text-3xl font-black text-blue-900 uppercase leading-none">
                        {school.name}
                    </h1>
                    <p className="font-bold text-[10px] tracking-widest mt-1 uppercase text-gray-600">
                        {school.affiliation} | {school.address}
                    </p>
                    <div className="mt-2 inline-block border-2 border-black px-4 py-0.5 bg-black text-white font-bold text-xs tracking-wider">
                        ADMISSION RECORD: {student.session || "2024-25"}
                    </div>
                </div>
            </div>

            {/* Top Grid & Photo */}
            <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex-1 grid grid-cols-2 border-l border-t border-black text-[11px]">
                    <div className="border-r border-b border-black p-1.5 font-bold bg-gray-100">REGISTRATION NO.</div>
                    <div className="border-r border-b border-black p-1.5 font-black text-blue-800 uppercase">{student.regNo}</div>
                    <div className="border-r border-b border-black p-1.5 font-bold bg-gray-100">ROLL NUMBER</div>
                    <div className="border-r border-b border-black p-1.5 font-black uppercase">{student.rollNumber || "---"}</div>
                    <div className="border-r border-b border-black p-1.5 font-bold bg-gray-100">CLASS / GRADE</div>
                    <div className="border-r border-b border-black p-1.5 font-black text-blue-800 italic uppercase">{student.className}</div>
                    <div className="border-r border-b border-black p-1.5 font-bold bg-gray-100">DATE</div>
                    <div className="border-r border-b border-black p-1.5 font-bold">{new Date().toLocaleDateString('en-IN')}</div>
                </div>
                
                <div className="w-24 h-32 border-2 border-black flex items-center justify-center overflow-hidden bg-gray-50">
                    {finalPhoto ? <img src={finalPhoto} className="w-full h-full object-cover" alt="S" /> : <span className="text-[8px] font-bold text-gray-400 uppercase text-center">PHOTO</span>}
                </div>
            </div>

            {/* Student Profile */}
            <div className="border-t border-l border-black mb-3">
                <h3 className="bg-blue-900 text-white font-black px-2 py-0.5 border-r border-b border-black text-[10px] uppercase">Student Profile</h3>
                <div className="grid grid-cols-4 text-[11px]">
                    <div className="p-1.5 border-r border-b border-black font-bold bg-gray-50">STUDENT NAME</div>
                    <div className="p-1.5 border-r border-b border-black font-black uppercase col-span-3 text-blue-900">{student.name}</div>
                    <div className="p-1.5 border-r border-b border-black font-bold bg-gray-50">FATHER'S NAME</div>
                    <div className="p-1.5 border-r border-b border-black font-bold uppercase col-span-3">{student.fatherName}</div>
                    <div className="p-1.5 border-r border-b border-black font-bold bg-gray-50">DOB</div>
                    <div className="p-1.5 border-r border-b border-black font-bold uppercase col-span-3">{student.dob}</div>
                    <div className="p-1.5 border-r border-b border-black font-bold bg-gray-50 uppercase">Aadhaar / Address</div>
                    <div className="p-1.5 border-r border-b border-black col-span-3 text-[10px] font-bold">{student.aadhaar} | {student.address}</div>
                </div>
            </div>

            {/* Subjects */}
            <div className="border-t border-l border-black mb-3">
                <div className="grid grid-cols-4 text-[11px]">
                    <div className="p-1.5 border-r border-b border-black font-bold bg-gray-50">SUBJECTS</div>
                    <div className="p-1.5 border-r border-b border-black col-span-3 font-bold uppercase text-blue-800 italic">
                        {student.subjects?.length > 0 ? student.subjects.join(" • ") : "Regular Subjects"}
                    </div>
                </div>
            </div>

            {/* Fees Table */}
            <div className="mb-4">
                <table className="w-full border-collapse border-2 border-black text-[11px]">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-black p-1 text-left font-black">FEE DESCRIPTION</th>
                            <th className="border border-black p-1 text-right font-black">AMOUNT (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold">
                        <tr>
                            <td className="border border-black p-1 font-normal uppercase italic">Admission & Registration Fees</td>
                            <td className="border border-black p-1 text-right italic">₹{Number(student.admissionFees).toFixed(2)}</td>
                        </tr>
                        {paidAmount > 0 && (
                            <tr className="bg-green-50">
                                <td className="border border-black p-1 font-normal uppercase text-blue-700">Tuition Fees ({paidMonthsList?.join(", ")})</td>
                                <td className="border border-black p-1 text-right italic">₹{Number(paidAmount).toFixed(2)}</td>
                            </tr>
                        )}
                        <tr className="bg-blue-50">
                            <td className="border border-black p-1.5 text-right font-black uppercase">Grand Total:</td>
                            <td className="border border-black p-1.5 text-right text-blue-900 text-lg font-black italic">₹{grandTotal.toFixed(2)}/-</td>
                        </tr>
                    </tbody>
                </table>
                <p className="mt-1 text-[9px] font-black uppercase italic text-gray-500">In Words: {toWords(Math.floor(grandTotal))} Only</p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between px-10 mt-10">
                <div className="text-center w-32 border-t border-black pt-1 font-bold text-[10px] uppercase">Parent Sign</div>
                <div className="text-center w-32 border-t border-black pt-1 font-bold text-[10px] uppercase">Principal/Seal</div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-200 z-[100] overflow-y-auto p-4">
            <div className="max-w-[800px] mx-auto flex justify-between mb-4 no-print bg-white p-3 rounded-lg shadow-md border-b-2 border-blue-600">
                <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all">← Close</button>
                <div className="font-bold text-blue-700 text-sm animate-pulse uppercase tracking-tighter">Ready for A4 Print (2 Slips)</div>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg text-sm font-black shadow-lg transition-all tracking-widest">PRINT NOW</button>
            </div>

            <div ref={printRef}>
                <DocumentSheet copyName="Office Copy" />
                <div className="my-6 border-b-2 border-dashed border-gray-400 no-print flex justify-center italic text-gray-400 text-xs uppercase font-bold tracking-widest">✂️ Cut along this line ✂️</div>
                <DocumentSheet copyName="Student Copy" />
            </div>
        </div>
    );
}

// Helper function toWords (Wahi purana)
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