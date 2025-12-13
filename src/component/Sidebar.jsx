import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaBook,
  FaBell,
  FaClipboardList,
  FaUserTie,
  FaUserCheck,
} from "react-icons/fa";

const Sidebar = () => {
  const menuItems = [
    { path: "/", name: "Dashboard", icon: <FaHome /> },
    { path: "/student", name: "Students", icon: <FaUsers /> },
    { path: "/homework", name: "Homework", icon: <FaBook /> },
    { path: "/notice", name: "Notices", icon: <FaBell /> },
    { path: "/attendance", name: "Attendance", icon: <FaClipboardList /> },
    { path: "/test", name: " TestSystem", icon: <FaClipboardList /> },
    { path: "/teacherattendace", name: " TeacherAttendance", icon: <FaClipboardList /> },
    { path: "/teacher", name: "Teachers", icon: <FaUserTie /> },

  ];

  return (
    <div className="h-screen w-64 bg-gray-900/95 backdrop-blur-md text-white p-5 fixed shadow-xl border-r border-gray-700">
      <h1 className="text-3xl font-extrabold mb-10 tracking-wide text-center">
        Admin Panel
      </h1>

      <ul className="space-y-3">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 p-3 rounded-lg transition-all duration-200 
                ${isActive ? "bg-blue-600 shadow-lg scale-105" : "hover:bg-gray-700"}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-lg">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
