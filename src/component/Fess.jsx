import React from "react";

export default function FeesReceipt({
  name,
  studentClass,
  admissionFee = 0,
  monthlyFee = 0,
  payMonth = "",
  paidAt,
  onClose,
}) {
  const date =
    paidAt?.seconds
      ? new Date(paidAt.seconds * 1000).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");



 const monthCount = Array.isArray(payMonth)
  ? payMonth.length
  : typeof payMonth === "string" && payMonth
  ? payMonth.split(",").length
  : 0;
const monthlyTotal = Number(monthlyFee || 0) * monthCount;

const total = Number(admissionFee || 0) + monthlyTotal;




  
  return (
    <>
      <style>
        {`
        /* ================= SCREEN ================= */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 20px;
          z-index: 9999;
        }

        /* ================= PRINT (ONE PAGE FIX) ================= */
        @media print {

          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            margin: 0;
          }

          body * {
            visibility: hidden;
          }

          #print-area, #print-area * {
            visibility: visible;
          }

          #print-area {
            position: static;
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
            page-break-inside: avoid;
          }
        }
        `}
      </style>

      {/* OVERLAY (screen only) */}
      <div className="overlay print:hidden">
        <div
          id="print-area"
          className="bg-white shadow-lg relative"
          style={{
            width: "210mm",   // ✅ EXACT A4 WIDTH
            padding: "20px",
          }}
        >
          {/* CLOSE */}
         
 <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200 font-bold hover:bg-red-200 print:hidden"
          >
            ✖
          </button>
          {/* HEADER */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold">FEES RECEIPT</h1>
            <p className="font-semibold">Bright PUBLIC HIGH SCHOOL</p>
            <p className="text-sm text-gray-600">
              Siddharth Nagar, Uttar Pradesh
            </p>
          </div>

          {/* INFO */}
          <div className="flex justify-between text-sm mb-6">
            <div>
              <p><b>Name:</b> {name}</p>
              <p><b>Class:</b> {studentClass}</p>
            </div>
            <div>
              <p><b>Date:</b> {date}</p>
              <p><b>Paid Month:</b> {payMonth}</p>
            </div>
          </div>

          {/* TABLE */}
          <table className="w-full border text-sm mb-10">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
  <tr>
    <td className="border p-2">Admission Fee</td>
    <td className="border p-2 text-right">{admissionFee}</td>
  </tr>

  <tr>
    <td className="border p-2">
      Monthly Fee ({monthCount} Month{monthCount > 1 ? "s" : ""})
    </td>
    <td className="border p-2 text-right">
      {monthlyFee} × {monthCount} = {monthlyTotal}
    </td>
  </tr>

  <tr className="font-bold bg-gray-100">
    <td className="border p-2">Total Paid</td>
    <td className="border p-2 text-right">{total}</td>
  </tr>
</tbody>

          </table>

          {/* SIGN */}
          <div className="flex justify-between mt-12 text-sm">
            <div className="border-t w-52 text-center pt-2">
              Parent Signature
            </div>
            <div className="border-t w-52 text-center pt-2">
              Authorized Signature
            </div>
          </div>

          {/* PRINT */}
          <div className="text-center mt-10 print:hidden">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-10 py-2 rounded font-semibold"
            >
              🖨 Print Receipt
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
