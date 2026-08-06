import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/MOREBYTES LOGO.png';
import './Sidebar.css';
import { GiFullMotorcycleHelmet } from "react-icons/gi";
import { FaMotorcycle } from "react-icons/fa";
import { MdBarChart } from "react-icons/md";


// React Icons imports from react-icons/lu
import { 
  LuLayoutGrid, 
  LuClipboardList, 
  LuUtensils, 
  LuPackage, 
  LuBike, 
  LuLogOut
} from 'react-icons/lu';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/supervisor/dashboard',
      icon: <LuLayoutGrid size={20} />,
    },
    {
      name: 'Orders',
      path: '/supervisor/orders',
      icon: <LuClipboardList size={20} />,
    },
    {
      name: 'Menu',
      path: '/supervisor/menu',
      icon: <LuUtensils size={20} />, // Fork & Spoon
    },
    {
      name: 'Inventory',
      path: '/supervisor/inventory',
      icon: <LuPackage size={20} />, // Box
    },
    {
      name: 'Dispatch',
      path: '/supervisor/dispatch',
      icon: <FaMotorcycle size={20} />, // Motorcycle
    },
    {
      name: 'Reports',
      path: '/supervisor/reports',
      icon: <MdBarChart size={20} />, // Bar Chart
    },
    {
      name: 'Driver',
      path: '/supervisor/driver',
      icon: <GiFullMotorcycleHelmet size={20} />,
    },
  ];

  const userName = user?.name || 'John Doe';

  // Extract initials (e.g. "John Doe" -> "JD")
  const getInitials = (name) => {
    if (!name) return 'JD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar">
      {/* Top Logo Container */}
      <div className="sidebar-logo-container">
        <img src={logo} alt="Morebytes Food Corner Logo" className="sidebar-logo" />
      </div>

      {/* Divider line between logo and dashboard: #3A3935 weight 0.5 */}
      <div className="sidebar-divider" />

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-active-indicator" />
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom User Section */}
      <div className="sidebar-footer">
        {/* Divider Line above John Doe: #3A3935 */}
        <div className="sidebar-divider" />

        <div className="sidebar-user-row">
          {/* Avatar Circle: #FFA500 with Initial of #FFFFFF */}
          <div className="sidebar-avatar">{getInitials(userName)}</div>

          {/* User Details */}
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName}</span>
            <span className="sidebar-user-role">Administrator</span>
          </div>

          {/* Logout / Exit Icon */}
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LuLogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
