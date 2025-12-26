import { useSidebar } from "./SidebarContext";
import { FaBars, FaSignOutAlt } from "react-icons/fa"; // Icon bhi sundar kar diya
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Firebase signout ke liye
import { signOut } from "firebase/auth";

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Kya aap sach mein logout karna chahte hain?");
    if (confirmLogout) {
      try {
        // 1. Firebase se logout karein
        await signOut(auth);
        
        // 2. Redirect to Login
        alert("Logged out successfully!");
        navigate("/");
      } catch (error) {
        console.error("Logout Error:", error);
        // Agar auth nahi bhi hai, tab bhi login par bhej do
        navigate("/");
      }
    }
  };

  return (
    <div className="w-full bg-white shadow-sm p-4 sticky top-0 z-40 border-b border-gray-100">
      {/* Left Side: Toggle & Title */}
      <div className="container flex justify-between items-center ">

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
          title="Toggle Sidebar"
        >
          <FaBars size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 leading-none">Admin Panel</h1>
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">School Management</p>
        </div>
      </div>
      
      {/* Right Side: Logout Button */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white border border-red-100 shadow-sm transition-all duration-300 active:scale-95 font-semibold text-sm"
      >
        <FaSignOutAlt />
        <span className="hidden sm:inline">Logout</span>
      </button>
      </div>

    </div>
  );
}