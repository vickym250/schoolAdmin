import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./component/Sidebar";
import Header from "./component/Header";
import Dashboard from "./page/Dashboard";
import StudentList from "./page/Student";
import Attendance from "./page/Attendance";
import HomeworkPage from "./page/HomeworkPage";
import NoticePage from "./page/NoticePage";
import TestPage from "./page/TestAdd";
import TeachersManagementPage from "./page/Teachermanage";
import TeacherAttendance from "./page/TeacherAttendance";
import FinalResultPage from "./page/Result";
import FeesReceipt from "./component/Fess";
import IDCardGenerator from "./page/Idcard";
import StudentProfile from "./page/StudentProfile";
import AbsentStudents from "./page/AbsentStudents";
import MarksSheet from "./component/Anual";

import Login from "./page/Login";

import { useSidebar } from "./component/SidebarContext";
import ProtectedRoute from "./component/ProtectedRoute";
import HelpPage from "./page/HelpLine";

export default function App() {
  const { isOpen } = useSidebar();

  return (
    <BrowserRouter>
      <Routes>

        {/* 🔓 PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/profile/:id" element={<StudentProfile />} />

        {/* 🔐 PROTECTED ADMIN ROUTES */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-gray-100">
                
                {/* Sidebar */}
                <Sidebar />

                {/* Content */}
                <div
                  className={`flex-1 flex flex-col transition-all duration-300 ${
                    isOpen ? "ml-64" : "ml-0 md:ml-20"
                  }`}
                >
                  <Header />

                  <main className="p-4 md:p-6 flex-grow">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dash" element={<Dashboard />} />

                      <Route path="/student" element={<StudentList />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/homework" element={<HomeworkPage />} />
                      <Route path="/notice" element={<NoticePage />} />
                      <Route path="/test" element={<TestPage />} />
                      <Route path="/teacher" element={<TeachersManagementPage />} />
                      <Route path="/teacherattendace" element={<TeacherAttendance />} />
                      <Route path="/result" element={<FinalResultPage />} />
                      <Route path="/fees" element={<FeesReceipt />} />
                      <Route path="/idcard" element={<IDCardGenerator />} />
                      <Route path="/absentstudent" element={<AbsentStudents />} />
                      <Route path="/marksheet/:studentId" element={<MarksSheet />} />
                      <Route path="/help" element={< HelpPage/>} />

                      {/* ❌ Wrong URL → Dashboard */}
                      <Route path="*" element={<Navigate to="/dash" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
