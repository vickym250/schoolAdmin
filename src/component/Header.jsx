import { useSidebar } from "./SidebarContext";
import { FaBars } from "react-icons/fa";

export default function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="w-full bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
        >
          <FaBars size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
      </div>
      
      <button className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 shadow-sm transition-all active:scale-95">
        Logout
      </button>
    </div>
  );
}