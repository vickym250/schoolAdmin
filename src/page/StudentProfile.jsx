import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function StudentProfile() {
  const { id } = useParams(); // URL se student ID nikalega
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const docRef = doc(db, "students", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudent(docSnap.data());
        } else {
          console.log("No such student!");
        }
      } catch (error) {
        console.error("Error fetching student:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) return <div style={styles.loader}>Loading Profile...</div>;
  if (!student) return <div style={styles.error}>Student Not Found!</div>;

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h2 style={styles.schoolName}>Bright Future School</h2>
        <p style={styles.verifyTag}>✅ Verified Student Profile</p>
      </div>

      {/* Profile Card */}
      <div style={styles.card}>
        <div style={styles.imageContainer}>
          {student.photoURL ? (
            <img src={student.photoURL} alt={student.name} style={styles.profileImg} />
          ) : (
            <div style={styles.placeholderImg}>{student.name?.charAt(0)}</div>
          )}
        </div>

        <h1 style={styles.studentName}>{student.name}</h1>
        <p style={styles.className}>{student.className}</p>

        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.label}>Roll Number</span>
            <span style={styles.value}>{student.rollNumber}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.label}>DOB</span>
            <span style={styles.value}>{student.dob}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.label}>Father's Name</span>
            <span style={styles.value}>{student.fatherName}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.label}>Contact No.</span>
            <span style={styles.value}>{student.phone || "---"}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.label}>Session</span>
            <span style={styles.value}>2024 - 2025</span>
          </div>
        </div>

        <div style={styles.footer}>
          <p>Official Digital Identity Card</p>
          <small>© {new Date().getFullYear()} School Management System</small>
        </div>
      </div>
    </div>
  );
}

// Mobile-Responsive Styles
const styles = {
  container: {
    minHeight: "100vh",
    background: "#f0f4f8",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    padding: "20px",
  },
  loader: { textAlign: "center", marginTop: "50px", fontSize: "18px" },
  error: { textAlign: "center", marginTop: "50px", color: "red", fontWeight: "bold" },
  header: { textAlign: "center", marginBottom: "20px" },
  schoolName: { color: "#1e3a8a", margin: "0", fontSize: "24px" },
  verifyTag: { color: "#10b981", fontWeight: "bold", fontSize: "14px", marginTop: "5px" },
  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    maxWidth: "450px",
    margin: "0 auto",
    textAlign: "center",
  },
  imageContainer: {
    width: "120px",
    height: "120px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    border: "4px solid #1e3a8a",
    padding: "3px",
    overflow: "hidden",
  },
  profileImg: { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" },
  placeholderImg: { 
    width: "100%", height: "100%", background: "#e2e8f0", 
    display: "flex", alignItems: "center", justifyContent: "center", 
    fontSize: "40px", color: "#1e3a8a", borderRadius: "50%" 
  },
  studentName: { margin: "5px 0", fontSize: "26px", color: "#1e293b" },
  className: { color: "#64748b", fontSize: "18px", marginBottom: "25px" },
  detailsGrid: { textAlign: "left", borderTop: "1px solid #eee", paddingTop: "20px" },
  detailItem: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  label: { color: "#94a3b8", fontSize: "14px" },
  value: { color: "#1e293b", fontWeight: "600", fontSize: "15px" },
  footer: { marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "15px", color: "#94a3b8" },
};