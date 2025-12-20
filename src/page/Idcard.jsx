import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function IDCardGenerator() {
  const [className, setClassName] = useState("Class 1");
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("rollNumber", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => !s.deletedAt);
      setStudents(data);
    });
    return () => unsub();
  }, []);

  const filteredStudents = students.filter(
    (s) => s.className?.toLowerCase() === className.toLowerCase()
  );

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    let cardsHTML = "";
    filteredStudents.forEach((s) => {
      // APNI WEBSITE KA URL YAHA DALO (Example niche hai)
      const profileUrl = `https://your-school-site.com/profile/${s.id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(profileUrl)}`;

      cardsHTML += `
        <div class="id-card">
          <div class="header">
            <div style="font-weight:bold; font-size:16px;">Bright Future School</div>
            <div style="font-size:10px;">Dumariya, Uttar Pradesh, 272189</div>
          </div>
          <div class="body">
            <div class="photo">
              ${s.photoURL ? `<img src="${s.photoURL}" />` : `<span>${s.name?.charAt(0)}</span>`}
            </div>
            <div class="info">
              <p><b>Name:</b> ${s.name}</p>
              <p><b>Roll No:</b> ${s.rollNumber}</p>
              <p><b>Class:</b> ${s.className}</p>
              <p><b>Father:</b> ${s.fatherName}</p>
              <p><b>Phone:</b> ${s.phone || "---"}</p>
            </div>
            <div class="qr-container">
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div style="font-size:7px; text-align:center; margin-top:2px;">SCAN ME</div>
            </div>
          </div>
          <div class="footer">
            <span>Session 2024-25</span>
            <span>Principal Sign</span>
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Printing ID Cards...</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; margin: 0; }
            .id-card {
              width: 330px; height: 210px; border: 2px solid #1e3a8a;
              display: inline-block; margin: 10px; position: relative;
              vertical-align: top; -webkit-print-color-adjust: exact;
              background: #fff;
            }
            .header { background: #1e3a8a !important; color: white !important; text-align: center; padding: 8px 5px; }
            .body { display: flex; padding: 10px; position: relative; }
            .photo { width: 75px; height: 95px; border: 1px solid #ccc; margin-right: 10px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; overflow: hidden; border-radius: 5px; }
            .photo img { width: 100%; height: 100%; object-fit: cover; }
            .info { flex: 1; font-size: 11px; line-height: 1.6; }
            .info p { margin: 2px 0; border-bottom: 0.1px solid #eee; }
            
            .qr-container {
               width: 60px; height: 60px; 
               position: absolute; right: 10px; top: 10px;
               text-align: center;
            }
            .qr-container img { width: 100%; height: 100%; }

            .footer { position: absolute; bottom: 0; width: 100%; display: flex; justify-content: space-between; padding: 5px 10px; font-size: 10px; border-top: 1px solid #eee; box-sizing: border-box; }
            @media print {
              .id-card { page-break-inside: avoid; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; flex-wrap: wrap;">${cardsHTML}</div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 800); // 800ms wait taaki QR images load ho jayein
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif", background: "#f5f5f5", minHeight: "100vh" }}>
      <h1 style={{ color: "#1e3a8a" }}>Student ID Card Generator</h1>
      
      <div style={{ background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", display: "inline-block" }}>
        <p style={{ fontWeight: "bold" }}>Step 1: Select Class</p>
        <select 
          value={className} 
          onChange={(e) => setClassName(e.target.value)}
          style={{ padding: "12px", width: "220px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px", marginBottom: "20px" }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>
          ))}
        </select>

        <div style={{ marginTop: "10px" }}>
          <button 
            onClick={handlePrint}
            style={{ 
              padding: "15px 40px", 
              background: "#1e3a8a", 
              color: "#fff",
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "bold"
            }}
          >
            GENERATE & PRINT CARDS
          </button>
        </div>
        <p style={{ marginTop: "15px", color: "#666" }}>
          Students in this class: <b>{filteredStudents.length}</b>
        </p>
      </div>

      <div style={{ marginTop: "40px", color: "#888", fontSize: "14px" }}>
        <p>Tip: Ensure "Background Graphics" is ON in print settings.</p>
      </div>
    </div>
  );
}