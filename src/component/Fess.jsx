import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function FeesReceipt({
  name,
  studentClass,
  admissionFee = 0,
  monthlyFee = 0,
  payMonth = "",
  paidAt,
  onClose,
}) {
  const [school, setSchool] = useState({
    name: "BRIGHT PUBLIC HIGH SCHOOL",
    address: "Siddharth Nagar, Uttar Pradesh",
    logoUrl: ""
  });

  // Database se school details lana
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const schoolSnap = await getDoc(doc(db, "settings", "schoolDetails"));
        if (schoolSnap.exists()) {
          setSchool(schoolSnap.data());
        }
      } catch (err) {
        console.error("Error fetching school details:", err);
      }
    };
    fetchSchool();
  }, []);

  const date = paidAt?.seconds
    ? new Date(paidAt.seconds * 1000).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const monthCount = Array.isArray(payMonth)
    ? payMonth.length
    : typeof payMonth === "string" && payMonth
    ? payMonth.split(",").length
    : 0;
    
  const monthlyTotal = Number(monthlyFee || 0) * monthCount;
  const total = Number(admissionFee || 0) + monthlyTotal;

  // Reusable Receipt UI
  const ReceiptContent = ({ copyName }) => (
    <div className="bg-white border-2 border-black p-6 mb-4 relative receipt-block" style={{ height: "135mm" }}>
      <div className="absolute top-2 right-2 border border-black px-2 py-0.5 text-[10px] font-bold uppercase">
        {copyName}
      </div>

      {/* HEADER */}
      <div className="text-center mb-6">
        {school.logoUrl && <img src={school.logoUrl} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />}
        <h1 className="text-2xl font-extrabold uppercase">{school.name}</h1>
        <p className="text-sm text-gray-600 uppercase">{school.address}</p>
        <h2 className="text-lg font-bold mt-2 border-y border-black inline-block px-4">FEES RECEIPT</h2>
      </div>

      {/* INFO */}
      <div className="flex justify-between text-sm mb-6">
        <div className="space-y-1">
          <p><b>Name:</b> <span className="uppercase">{name}</span></p>
          <p><b>Class:</b> <span className="uppercase">{studentClass}</span></p>
        </div>
        <div className="text-right space-y-1">
          <p><b>Date:</b> {date}</p>
          <p><b>Paid Month:</b> <span className="italic">{Array.isArray(payMonth) ? payMonth.join(", ") : payMonth}</span></p>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border border-black text-sm mb-10">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left">Description</th>
            <th className="border border-black p-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2">Admission Fee</td>
            <td className="border border-black p-2 text-right">{Number(admissionFee).toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border border-black p-2">
              Monthly Fee ({monthCount} Month{monthCount > 1 ? "s" : ""})
            </td>
            <td className="border border-black p-2 text-right">
              {monthlyFee} × {monthCount} = {monthlyTotal.toFixed(2)}
            </td>
          </tr>
          <tr className="font-bold bg-gray-100">
            <td className="border border-black p-2">Total Paid</td>
            <td className="border border-black p-2 text-right">₹{total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* SIGN */}
      <div className="flex justify-between mt-12 text-sm font-bold">
        <div className="border-t border-black w-48 text-center pt-1 uppercase">
          Parent Signature
        </div>
        <div className="border-t border-black w-48 text-center pt-1 uppercase">
          Authorized Signature
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>
        {`
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; justify-content: center; align-items: flex-start;
          padding: 20px; z-index: 9999; overflow-y: auto;
        }

        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background: white; }
          .overlay { position: static; background: none; padding: 0; display: block; }
          .no-print { display: none !important; }
          .print-container { width: 100% !important; box-shadow: none !important; margin: 0 !important; }
          .receipt-block { border-bottom: 2px dashed #000 !important; page-break-inside: avoid; }
        }
        `}
      </style>

      <div className="overlay">
        <div className="print-container relative" style={{ width: "210mm" }}>
          
          {/* Action Buttons (Screen Only) */}
          <div className="no-print flex justify-between bg-white p-4 mb-2 shadow rounded">
             <button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded font-bold">CLOSE</button>
             <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-10 py-2 rounded font-black shadow-lg"
              >
                🖨 PRINT 2 COPIES
              </button>
          </div>

          {/* PRINT AREA */}
          <div id="print-area" className="bg-white">
            <ReceiptContent copyName="Office Copy" />
            <div className="no-print text-center text-gray-400 py-2 italic">✂️ Cut along this line ✂️</div>
            <ReceiptContent copyName="Student Copy" />
          </div>
        </div>
      </div>
    </>
  );
}