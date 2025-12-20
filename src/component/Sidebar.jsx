import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaBook,
  FaBell,
  FaClipboardList,
  FaUserTie,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { path: "/", name: "Dashboard", icon: <FaHome /> },
    { path: "/student", name: "Students", icon: <FaUsers /> },
     { path: "/attendance", name: "Attendance", icon: <FaClipboardList /> },
     { path: "/absentstudent", name: "AbsentStudent", icon: <FaClipboardList /> },
    { path: "/homework", name: "Homework", icon: <FaBook /> },
    { path: "/notice", name: "Notices", icon: <FaBell /> },
    { path: "/result", name: "Result", icon: <FaBell /> },
   
    { path: "/test", name: "Test System", icon: <FaClipboardList /> },
    { path: "/teacherattendace", name: "Teacher Attendance", icon: <FaClipboardList /> },
    { path: "/teacher", name: "Teachers", icon: <FaUserTie /> },
    { path: "/idcard", name: "IdCard", icon: <FaUserTie /> },
  ];

  return (
    <>
      {/* ☰ Mobile Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg"
      >
        <FaBars size={20} />
      </button>

      {/* Overlay (Mobile) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen w-64
          bg-gray-900/95 backdrop-blur-md text-white
          shadow-xl border-r border-gray-700
          z-50 transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h1 className="text-2xl font-extrabold tracking-wide">
            Admin Panel
          </h1>

          {/* ❌ Close (Mobile) */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* MENU (Scrollable) */}
        <ul className="p-4 space-y-3 overflow-y-auto h-[calc(100vh-80px)]">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-3 rounded-lg transition-all duration-200 
                  ${
                    isActive
                      ? "bg-blue-600 shadow-lg scale-105"
                      : "hover:bg-gray-700"
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-base">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
