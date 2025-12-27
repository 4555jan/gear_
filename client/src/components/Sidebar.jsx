import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import clsx from 'clsx'
import {
  HomeIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'technician', 'employee'] },
  { name: 'Equipment', href: '/equipment', icon: CogIcon, roles: ['admin', 'technician'] },
  { name: 'Maintenance', href: '/maintenance', icon: WrenchScrewdriverIcon, roles: ['admin', 'technician', 'employee'] },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon, roles: ['admin', 'technician', 'employee'] },
  { name: 'Teams', href: '/teams', icon: UserGroupIcon, roles: ['admin', 'technician'] },
  { name: 'Users', href: '/users', icon: UsersIcon, roles: ['admin'] },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['admin', 'technician'] },
]

const Sidebar = ({ onClose }) => {
  const location = useLocation()
  const { user } = useAuthStore()

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  )

  return (
    <div className="flex flex-col w-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CogIcon className="h-8 w-8 text-primary-600" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">CMMS</h1>
            <p className="text-xs text-gray-500">Enterprise</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'sidebar-link',
                isActive ? 'active' : ''
              )}
              onClick={onClose}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar