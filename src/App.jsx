import { BrowserRouter, Routes, Route } from "react-router-dom";
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




export default function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar/>

        <div className="ml-64 w-full">
          <Header/>

          <Routes>
            <Route path="/" element={<Dashboard/>} />
            <Route path="/student" element={<StudentList/>} />
            <Route path="/attendance" element={<Attendance/>} />
            <Route path="/homework" element={<HomeworkPage/>} />
            <Route path="/notice" element={<NoticePage/>} />
            <Route path="/test" element={<TestPage/>} />
            <Route path="/teacher" element={<TeachersManagementPage/>} />
            <Route path="/teacherattendace" element={<TeacherAttendance/>} />
            <Route path="/result" element={<FinalResultPage/>} />
            <Route path="/fees" element={<FeesReceipt/>} />
    
            
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
