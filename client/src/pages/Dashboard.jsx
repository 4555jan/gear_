import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { dashboardService } from '../services/dashboardService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    recentActivity: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, activityData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(5)
      ]);

      setDashboardData({
        overview: overviewData,
        recentActivity: activityData
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening in your maintenance system today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">
                  {user?.role === 'admin' 
                    ? 'Open Requests'
                    : user?.role === 'technician'
                    ? 'My Assignments'
                    : 'My Requests'
                  }
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {user?.role === 'admin' 
                    ? (dashboardData.overview.maintenance?.open || 0)
                    : user?.role === 'technician'
                    ? (dashboardData.overview.assignedRequests || 0)
                    : (dashboardData.overview.myRequests || 0)
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">
                  {user?.role === 'admin' 
                    ? 'Completed Today'
                    : user?.role === 'technician'
                    ? 'Team Requests'
                    : 'My Completed'
                  }
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {user?.role === 'admin' 
                    ? (dashboardData.overview.maintenance?.completedToday || 0)
                    : user?.role === 'technician'
                    ? (dashboardData.overview.teamRequests || 0)
                    : (dashboardData.overview.completedRequests || 0)
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">
                  {user?.role === 'admin' 
                    ? 'Overdue'
                    : 'N/A'
                  }
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {user?.role === 'admin' 
                    ? (dashboardData.overview.maintenance?.overdue || 0)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">
                  {user?.role === 'admin' 
                    ? 'Active Equipment'
                    : user?.role === 'technician'
                    ? 'Team Equipment'
                    : 'N/A'
                  }
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {user?.role === 'admin' 
                    ? (dashboardData.overview.equipment?.active || 0)
                    : user?.role === 'technician'
                    ? (dashboardData.overview.teamEquipment || 0)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific content */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
            </div>
            <div className="card-body">
              <p className="text-gray-600">Manage teams and assign technicians to maintenance tasks.</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Teams</span>
                  <span className="badge badge-primary">{dashboardData.overview.activeTeams || 0} teams</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Technicians</span>
                  <span className="badge badge-success">{dashboardData.overview.users?.technicians || 0} technicians</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Users</span>
                  <span className="badge badge-info">{dashboardData.overview.users?.total || 0} users</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">System Health</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Equipment Status</span>
                  <span className="badge badge-success">
                    {dashboardData.overview.equipment?.total ? 
                      `${Math.round((dashboardData.overview.equipment.active / dashboardData.overview.equipment.total) * 100)}%` : 
                      '0%'
                    } Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Maintenance Completion</span>
                  <span className="badge badge-success">
                    {dashboardData.overview.maintenance?.total ? 
                      `${Math.round((dashboardData.overview.maintenance.completed / dashboardData.overview.maintenance.total) * 100)}%` : 
                      '0%'
                    } Complete
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overdue Requests</span>
                  <span className={`badge ${dashboardData.overview.maintenance?.overdue > 0 ? 'badge-danger' : 'badge-success'}`}>
                    {dashboardData.overview.maintenance?.overdue || 0} overdue
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className={`badge ${
                      activity.status === 'Completed' ? 'badge-success' :
                      activity.status === 'In Progress' ? 'badge-warning' :
                      activity.status === 'New' ? 'badge-primary' :
                      'badge-secondary'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title} - {activity.equipment}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.status === 'Completed' && activity.assignedTo
                        ? `Completed by ${activity.assignedTo}`
                        : activity.status === 'In Progress' && activity.assignedTo
                        ? `Assigned to ${activity.assignedTo}`
                        : `Reported by ${activity.createdBy}`
                      } • {activity.age === 0 ? 'Today' : `${activity.age} days ago`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard