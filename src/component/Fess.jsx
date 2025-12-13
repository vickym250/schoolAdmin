import React from "react";

export default function FeesReceipt({
  name = "",
  studentClass = "",          // ✅ FIX: className → studentClass
  admissionFee = 0,
  monthlyFee = 0,             // paid amount
  payMonth = "",
  paidAt = null,              // ✅ REAL PAID DATE
  onClose,
}) {

  // 🔥 Date sirf paidAt se hi niklegi
  const receiptDate = paidAt?.seconds
    ? new Date(paidAt.seconds * 1000).toLocaleDateString("en-IN")
    : paidAt
    ? new Date(paidAt).toLocaleDateString("en-IN")
    : "-";

  const grandTotal = Number(admissionFee) + Number(monthlyFee);

  const handlePrint = () => window.print();

  return (
    <>
      {/* ✅ PRINT FIX */}
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; }
            #print-area {
              width: 12cm !important;
              page-break-inside: avoid;
            }
            @page { margin: 0; }
          }
        `}
      </style>

      <div
        id="print-area"
        className="bg-white mx-auto p-4 border rounded-lg shadow print:shadow-none relative"
        style={{ width: "12cm" }}
      >
        {/* ❌ Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-2 text-xl font-bold text-gray-600 print:hidden"
        >
          ✖
        </button>

        {/* HEADER */}
        <div className="text-center mb-3">
          <h1 className="text-xl font-bold">JN INTERGAL PUBLIC SCHOOL</h1>
          <p className="text-gray-600 text-sm">Fees Receipt</p>
        </div>

        <hr className="mb-3" />

        {/* INFO */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <p className="font-semibold">Name</p>
            <p>{name}</p>
          </div>

          <div>
            <p className="font-semibold">Class</p>
            <p>{studentClass}</p>
          </div>

          <div>
            <p className="font-semibold">Date</p>
            <p>{receiptDate}</p>
          </div>

          <div>
            <p className="font-semibold">Paid Month</p>
            <p className="text-green-600 font-bold">{payMonth}</p>
          </div>
        </div>

        <hr className="my-3" />

        {/* FEES TABLE */}
        <table className="w-full border text-sm">
          <tbody>
            <tr>
              <td className="border p-2">Admission Fee</td>
              <td className="border p-2 text-center">₹ {admissionFee}</td>
            </tr>

            <tr className="bg-green-100 font-semibold">
              <td className="border p-2">Monthly Fee Paid</td>
              <td className="border p-2 text-center">₹ {monthlyFee}</td>
            </tr>

            <tr className="bg-gray-100 font-bold">
              <td className="border p-2">Grand Total</td>
              <td className="border p-2 text-center">₹ {grandTotal}</td>
            </tr>
          </tbody>
        </table>

        {/* PRINT */}
        <div className="text-center mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-5 py-1 rounded-lg"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </>
  );
}
