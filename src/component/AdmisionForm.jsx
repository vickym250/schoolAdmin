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
                // 1. School Details Fetch Karein
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
                        // Photo Preloading logic taaki printing mein blank na aaye
                        const img = new Image();
                        const proxyUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(data.photoURL)}`;
                        
                        img.crossOrigin = "anonymous";
                        img.src = proxyUrl;

                        img.onload = () => {
                            setFinalPhoto(proxyUrl);
                            setLoading(false);
                        };
                        img.onerror = () => {
                            setFinalPhoto(data.photoURL); 
                            setLoading(false);
                        };
                    } else {
                        setLoading(false);
                    }
                } else {
                    setLoading(false);
                }
            } catch (err) { 
                console.error(err); 
                setLoading(false); 
            }
        };
        fetchData();
    }, [studentId]);

    // Stable Mobile Print Logic
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
                    <title>Print Receipt</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        @page { size: A4; margin: 0; }
                        body { margin: 0; padding: 10mm; background: #fff; -webkit-print-color-adjust: exact !important; }
                        .sheet-container { border: 2px solid #000; padding: 15px; margin-bottom: 20px; position: relative; min-height: 480px; }
                        .page-break { page-break-after: always; border-bottom: 2px dashed #000; margin-bottom: 30px; padding-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 12px; }
                        .uppercase { text-transform: uppercase; }
                        .text-blue { color: #1e3a8a; }
                        .bg-gray { background-color: #f3f4f6; }
                        img { display: block; }
                        @media print { .no-print { display: none; } body { padding: 0; } }
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
            <div className="mb-4 animate-pulse uppercase italic">Loading Admission Data...</div>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!student) return null;

    const grandTotal = (Number(student.admissionFees) || 0) + (Number(paidAmount) || 0);

    const DocumentSheet = ({ copyName, isLast }) => (
        <div className={`sheet-container ${!isLast ? 'page-break' : ''}`} style={{ maxWidth: '800px', margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', top: '5px', right: '5px', border: '1px solid #000', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', background: '#fff' }}>
                {copyName}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
                <div style={{ width: '70px', height: '70px' }}>
                    <img src={school.logoUrl || "download.jpg"} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#1e3a8a', fontWeight: '900' }} className="uppercase">{school.name}</h1>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold' }}>{school.affiliation} | {school.address}</p>
                    <div style={{ background: '#000', color: '#fff', display: 'inline-block', padding: '3px 15px', marginTop: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                        ADMISSION RECORD: {student.session || "2024-25"}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                    <table style={{ fontSize: '11px' }}>
                        <tbody>
                            <tr><td className="bg-gray font-bold" style={{ width: '40%' }}>REG NO.</td><td className="font-bold text-blue uppercase">{student.regNo}</td></tr>
                            <tr><td className="bg-gray font-bold">CLASS</td><td className="font-bold uppercase italic">{student.className}</td></tr>
                            <tr><td className="bg-gray font-bold">GENDER</td><td className="font-bold uppercase">{student.gender || "---"}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div style={{ width: '90px', height: '110px', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', overflow: 'hidden' }}>
                    {finalPhoto ? (
                        <img src={finalPhoto} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#999' }}>PHOTO</span>
                    )}
                </div>
            </div>

            <table style={{ marginBottom: '15px' }}>
                <tbody>
                    <tr><td className="bg-gray font-bold uppercase" style={{ width: '30%' }}>Student Name</td><td className="font-bold text-blue uppercase" style={{ fontSize: '14px' }}>{student.name}</td></tr>
                    <tr><td className="bg-gray font-bold uppercase">Father Name</td><td className="font-bold uppercase">{student.fatherName}</td></tr>
                    <tr><td className="bg-gray font-bold uppercase">Date of Birth</td><td className="font-bold uppercase">{student.dob}</td></tr>
                    <tr><td className="bg-gray font-bold uppercase">Aadhaar/Add.</td><td style={{ fontSize: '10px' }}>{student.aadhaar} | {student.address}</td></tr>
                </tbody>
            </table>

            <table style={{ marginBottom: '10px' }}>
                <thead>
                    <tr style={{ background: '#f3f4f6' }}><th className="uppercase font-bold">Fee Description</th><th style={{ textAlign: 'right', fontWeight: 'bold' }}>Amount (₹)</th></tr>
                </thead>
                <tbody>
                    <tr><td className="uppercase italic">Admission & Registration Fees</td><td style={{ textAlign: 'right' }}>₹{Number(student.admissionFees).toFixed(2)}</td></tr>
                    {paidAmount > 0 && (
                        <tr><td className="uppercase italic" style={{ color: '#1e40af' }}>Tuition Fees (${paidMonthsList?.join(", ")})</td><td style={{ textAlign: 'right' }}>₹{Number(paidAmount).toFixed(2)}</td></tr>
                    )}
                    <tr style={{ background: '#eff6ff' }}>
                        <td style={{ fontWeight: '900', textTransform: 'uppercase' }}>Grand Total Amount:</td>
                        <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '18px', color: '#1e3a8a' }}>₹{grandTotal.toFixed(2)}/-</td>
                    </tr>
                </tbody>
            </table>
            <p style={{ margin: '5px 0', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', fontStyle: 'italic', color: '#666' }}>In Words: {toWords(Math.floor(grandTotal))} Only</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '0 30px' }}>
                <div style={{ textAlign: 'center', width: '120px', borderTop: '1.5px solid #000', fontSize: '10px', fontWeight: 'bold' }} className="uppercase">Parent's Signature</div>
                <div style={{ textAlign: 'center', width: '120px', borderTop: '1.5px solid #000', fontSize: '10px', fontWeight: 'bold' }} className="uppercase">Principal / Seal</div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-100 z-[100] overflow-y-auto p-2 md:p-4">
            <div className="max-w-[800px] mx-auto sticky top-0 bg-white p-3 rounded-lg shadow-md flex justify-between items-center no-print z-[110] mb-6 border-b-4 border-blue-600">
                <button onClick={onClose} className="bg-red-500 text-white px-4 py-1.5 rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all">← Close</button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-1.5 rounded-lg font-black text-sm shadow-lg tracking-widest active:scale-95 transition-all">PRINT NOW</button>
            </div>

            <div ref={printRef}>
                <DocumentSheet copyName="Office Copy" isLast={false} />
                <div className="no-print text-center text-gray-400 my-6 uppercase text-xs font-bold tracking-[10px]">✂️✂️✂️✂️✂️</div>
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