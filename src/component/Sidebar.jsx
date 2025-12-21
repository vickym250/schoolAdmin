import { NavLink } from "react-router-dom";
import { useSidebar } from "./SidebarContext";
import { FaHome, FaUsers, FaBook, FaBell, FaClipboardList, FaUserTie, FaTimes } from "react-icons/fa";

const Sidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();

  const menuItems = [
    { path: "/", name: "Dashboard", icon: <FaHome /> },
    { path: "/student", name: "Students", icon: <FaUsers /> },
    { path: "/attendance", name: "Attendance", icon: <FaClipboardList /> },
    { path: "/absentstudent", name: "Absent Student", icon: <FaClipboardList /> },
    { path: "/homework", name: "Homework", icon: <FaBook /> },
    { path: "/notice", name: "Notices", icon: <FaBell /> },
    { path: "/result", name: "Result", icon: <FaBell /> },
    { path: "/teacher", name: "Teachers", icon: <FaUserTie /> },
  ];

  return (
    <>
      {/* Overlay for Mobile */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
      )}

      {/* Sidebar */}
      <div className={`
         absolute top-0 left-0 h-screen bg-gray-900 text-white z-50 
        transition-all duration-300 border-r border-gray-700
        ${isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-20 md:translate-x-0"}
        overflow-hidden
      `}>
        {/* Header inside Sidebar (Optional) */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h1 className={`font-bold transition-opacity ${isOpen ? "opacity-100" : "opacity-0 md:hidden"}`}>
            Admin Panel
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-300">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <ul className="p-4 space-y-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-3 rounded-lg transition-all 
                  ${isActive ? "bg-blue-600 shadow-lg" : "hover:bg-gray-700 text-gray-300"}`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`whitespace-nowrap ${!isOpen && "md:hidden"}`}>
                  {item.name}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;