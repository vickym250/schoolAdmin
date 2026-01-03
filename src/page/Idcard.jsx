import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";

export default function IDCardGenerator() {
  const { studentId } = useParams();
  const [className, setClassName] = useState("Class 1");
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState({
    name: "Bright Future School",
    address: "Dumariya, Uttar Pradesh, 272189",
    logoUrl: ""
  });

  useEffect(() => {
    // 1. School Details Fetch
    const fetchSchool = async () => {
      const docRef = doc(db, "settings", "schoolDetails");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSchool(docSnap.data());
      }
    };
    fetchSchool();

    // 2. Students Fetch
    const q = query(collection(db, "students"), orderBy("rollNumber", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => !s.deletedAt);
      setStudents(data);
    });
    return () => unsub();
  }, []);

  const filteredStudents = studentId
    ? students.filter((s) => s.id === studentId)
    : students.filter(
        (s) => s.className?.toLowerCase() === className.toLowerCase()
      );

  const handlePrint = () => {
    // Mobile support ke liye hidden iframe create kar rahe hain
    let printFrame = document.getElementById("printFrame");
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "printFrame";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "none";
      document.body.appendChild(printFrame);
    }

    let cardsHTML = "";
    filteredStudents.forEach((s) => {
      const profileUrl = `https://school-admin-pi.vercel.app/profile/${s.id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(profileUrl)}`;

      cardsHTML += `
        <div class="id-card">
          <div class="header">
            ${school.logoUrl ? `<img src="${school.logoUrl}" style="height:25px; vertical-align:middle; margin-right:5px;" />` : ""}
            <div style="font-weight:bold; font-size:16px; display:inline-block; vertical-align:middle;">${school.name}</div>
            <div style="font-size:9px;">${school.address}</div>
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

    const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 10px; margin: 0; background: #fff; }
        .id-card {
          width: 330px; height: 210px; border: 2px solid #1e3a8a;
          display: inline-block; margin: 10px; position: relative;
          vertical-align: top; background: #fff;
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        .header { 
          background: #1e3a8a !important; 
          color: white !important; 
          text-align: center; 
          padding: 8px 5px;
          -webkit-print-color-adjust: exact;
        }
        .body { display: flex; padding: 10px; position: relative; }
        .photo { width: 75px; height: 95px; border: 1px solid #ccc; margin-right: 10px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; overflow: hidden; border-radius: 5px; }
        .photo img { width: 100%; height: 100%; object-fit: cover; }
        .info { flex: 1; font-size: 11px; line-height: 1.6; color: #000; }
        .info p { margin: 2px 0; border-bottom: 0.1px solid #eee; }
        .qr-container { width: 60px; height: 60px; position: absolute; right: 10px; top: 10px; text-align: center; }
        .qr-container img { width: 100%; height: 100%; }
        .footer { position: absolute; bottom: 0; width: 100%; display: flex; justify-content: space-between; padding: 5px 10px; font-size: 10px; border-top: 1px solid #eee; box-sizing: border-box; color: #333; }
        @media print {
          body { padding: 0; }
          .id-card { page-break-inside: avoid; }
        }
      </style>
    `;

    const fullHTML = `
      <html>
        <head><title>Print ID Cards</title>${style}</head>
        <body>
          <div style="display: flex; flex-wrap: wrap; justify-content: center;">${cardsHTML}</div>
        </body>
      </html>
    `;

    const pri = printFrame.contentWindow;
    pri.document.open();
    pri.document.write(fullHTML);
    pri.document.close();

    // Images load hone ke liye 1.5 second ka wait
    setTimeout(() => {
      pri.focus();
      pri.print();
    }, 1500);
  };

  return (
    <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: "sans-serif", background: "#f5f5f5", minHeight: "100vh" }}>
      <h1 style={{ color: "#1e3a8a", fontSize: "24px" }}>Student ID Card Generator</h1>

      <div style={{ background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", display: "inline-block", width: "100%", maxWidth: "400px" }}>
        {studentId ? (
           <p style={{ color: "#22c55e", fontWeight: "bold" }}>Single Student Mode Active</p>
        ) : (
          <div>
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>Step 1: Select Class</p>
            <select 
              value={className} 
              onChange={(e) => setClassName(e.target.value)}
              style={{ padding: "12px", width: "100%", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px", marginBottom: "20px" }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <button 
            onClick={handlePrint}
            style={{ 
              padding: "15px 20px", 
              background: "#1e3a8a", 
              color: "#fff",
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              width: "100%"
            }}
          >
            GENERATE & PRINT CARDS
          </button>
        </div>
        <p style={{ marginTop: "15px", color: "#666" }}>
          Students found: <b>{filteredStudents.length}</b>
        </p>
      </div>

      <div style={{ marginTop: "40px", color: "#888", fontSize: "13px" }}>
        <p><b>Note for Mobile:</b> Chrome/Safari mein "Print" option aane par "Save as PDF" select karein.</p>
        <p>School: {school.name}</p>
      </div>
    </div>
  );
}