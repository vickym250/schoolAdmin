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
        logoUrl: "download.jpg",
        phone: "91XXXXXXXX"
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!studentId) return;
            try {
                const schoolSnap = await getDoc(doc(db, "settings", "schoolDetails"));
                if (schoolSnap.exists()) setSchool(schoolSnap.data());

                const docSnap = await getDoc(doc(db, "students", studentId));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStudent(data);
                    
                    if (data.photoURL) {
                        const img = new Image();
                        const proxyUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(data.photoURL)}`;
                        img.crossOrigin = "anonymous";
                        img.src = proxyUrl;
                        img.onload = () => { setFinalPhoto(proxyUrl); setLoading(false); };
                        img.onerror = () => { setFinalPhoto(data.photoURL); setLoading(false); };
                    } else { setLoading(false); }
                } else { setLoading(false); }
            } catch (err) { 
                console.error(err); 
                setLoading(false); 
            }
        };
        fetchData();
    }, [studentId]);

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        let iframe = document.getElementById('print-iframe');
        if (iframe) document.body.removeChild(iframe);

        iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Admission Slip</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        @page { size: A4; margin: 0; }
                        body { margin: 0; padding: 10mm; background: #fff; -webkit-print-color-adjust: exact !important; }
                        .sheet-container { border: 2px solid #000; padding: 20px; margin-bottom: 20px; position: relative; }
                        .page-break { page-break-after: always; border-bottom: 2px dashed #000; margin-bottom: 30px; padding-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.focus();
                                window.print();
                                setTimeout(() => { window.frameElement.remove(); }, 1500);
                            }, 1500);
                        };
                    </script>
                </body>
            </html>
        `);
        doc.close();
    };

    if (loading) return (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center font-bold text-blue-600">
            <div className="mb-4 uppercase italic">Loading Profile...</div>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!student) return null;

    const grandTotal = (Number(student.admissionFees) || 0) + (Number(paidAmount) || 0);

    const DocumentSheet = ({ copyName, isLast }) => (
        <div className={`sheet-container ${!isLast ? 'page-break' : ''}`} style={{ maxWidth: '800px', margin: '0 auto 20px' }}>
            <div className="absolute top-2 right-2 border-2 border-black px-3 py-1 text-[10px] font-black uppercase bg-black text-white">{copyName}</div>
            
            {/* Header */}
            <div className="flex items-center border-b-4 border-black pb-4 gap-4">
                <div className="w-20 h-20 flex-shrink-0">
                    <img src={school.logoUrl || "download.jpg"} alt="logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 text-center pr-10">
                    <h1 className="text-3xl font-black text-blue-900 uppercase leading-tight">{school.name}</h1>
                    <p className="text-[11px] font-bold text-gray-700 uppercase">{school.affiliation} | {school.address}</p>
                    <p className="text-[12px] font-black text-blue-800">Mob: {school.phone || "N/A"}</p>
                </div>
            </div>

            {/* Top Grid: Photo and Basic Info */}
            <div className="flex gap-4 my-4 items-stretch">
                <div className="w-32 h-40 border-4 border-black flex-shrink-0 bg-gray-50 overflow-hidden flex items-center justify-center">
                    {finalPhoto ? (
                        <img src={finalPhoto} alt="S" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[10px] font-bold text-gray-400">PHOTO</span>
                    )}
                </div>
                <div className="flex-1 grid grid-cols-2 border-l-2 border-t-2 border-black">
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Reg Number</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black text-blue-900 uppercase">{student.regNo}</div>
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Class / Section</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black uppercase">{student.className}</div>
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Roll Number</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black uppercase">{student.rollNumber || "---"}</div>
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Receipt Date</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black uppercase">{new Date().toLocaleDateString('en-IN')}</div>
                </div>
            </div>

            {/* Student Profile */}
            <div className="border-t-2 border-l-2 border-black mb-4">
                <div className="grid grid-cols-4">
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Student Name</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black text-blue-900 uppercase col-span-3 text-base">{student.name}</div>
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Father Name</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black uppercase col-span-3">{student.fatherName}</div>
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Date of Birth</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black uppercase">{student.dob}</div>
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Gender</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black uppercase">{student.gender || "---"}</div>
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Contact No.</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-black uppercase text-blue-800">{student.phone || student.contact || "N/A"}</div>
                    <div className="p-2 border-r-2 border-b-2 border-black bg-gray-100 font-bold text-[10px] uppercase">Address</div>
                    <div className="p-2 border-r-2 border-b-2 border-black font-bold text-[10px] uppercase italic">{student.address}</div>
                </div>
            </div>

            {/* Fees Table */}
            <div className="mb-4">
                <table className="w-full border-collapse border-2 border-black">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border border-black p-2 uppercase font-black text-[11px]">Fee Description</th>
                            <th className="border border-black p-2 text-right uppercase font-black text-[11px]">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold">
                        <tr>
                            <td className="border border-black p-2 uppercase italic text-[11px]">Admission & Registration</td>
                            <td className="border border-black p-2 text-right">₹{Number(student.admissionFees).toFixed(2)}</td>
                        </tr>
                        {paidAmount > 0 && (
                            <tr className="text-blue-800">
                                <td className="border border-black p-2 uppercase italic text-[11px]">Tuition Fee (${paidMonthsList?.join(", ")})</td>
                                <td className="border border-black p-2 text-right font-black">₹{Number(paidAmount).toFixed(2)}</td>
                            </tr>
                        )}
                        <tr className="bg-blue-50">
                            <td className="border border-black p-3 text-right font-black uppercase text-sm text-gray-700">Net Payable:</td>
                            <td className="border border-black p-3 text-right text-blue-900 text-xl font-black italic">₹{grandTotal.toFixed(2)}/-</td>
                        </tr>
                    </tbody>
                </table>
                <p className="mt-2 text-[10px] font-black uppercase italic text-gray-600">In Words: {toWords(Math.floor(grandTotal))} Only</p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between px-10 mt-12 pb-2">
                <div className="text-center w-40 border-t-2 border-black pt-1 font-black text-[10px] uppercase">Parent's Signature</div>
                <div className="text-center w-40 border-t-2 border-black pt-1 font-black text-[10px] uppercase">Principal / Seal</div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-200 z-[100] overflow-y-auto p-2 md:p-6">
            <div className="max-w-[800px] mx-auto sticky top-0 bg-white p-3 rounded-xl shadow-lg flex justify-between items-center no-print z-[110] mb-6 border-b-4 border-blue-600">
                <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-black text-sm shadow active:scale-95 transition-all">← EXIT</button>
                <div className="hidden sm:block text-blue-800 font-black text-xs uppercase tracking-widest text-center flex-1">Student Receipt System</div>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-black text-sm shadow-lg active:scale-95 transition-all">PRINT NOW</button>
            </div>
            <div ref={printRef} className="pb-10">
                <DocumentSheet copyName="Office Copy" isLast={false} />
                <div className="no-print text-center text-gray-400 my-8 uppercase text-xs font-bold tracking-[15px]">✂️ CUT HERE ✂️</div>
                <DocumentSheet copyName="Student Copy" isLast={true} />
            </div>
        </div>
    );
}

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