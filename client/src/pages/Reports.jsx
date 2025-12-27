import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { reportsService } from '../services/reportsService';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState({
    overview: {
      totalRequests: 0,
      completedRequests: 0,
      trends: {
        requests: '0%',
        responseTime: '0%',
        efficiency: '0%'
      }
    },
    teams: [],
    equipment: [],
    recentRequests: [],
    overdueRequests: []
  });

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Load maintenance statistics
      const maintenanceStats = await reportsService.getMaintenanceStats();

      // Load team statistics
      const teamStats = await reportsService.getTeamStats();

      // Load equipment statistics
      const equipmentStats = await reportsService.getEquipmentStats();

      // Process and format the data
      const processedData = {
        overview: {
          totalRequests: maintenanceStats.overview.total || 0,
          completedRequests: maintenanceStats.overview.completed || 0,
          newRequests: maintenanceStats.overview.new || 0,
          inProgressRequests: maintenanceStats.overview.inProgress || 0,
          overdueRequests: maintenanceStats.overview.overdue || 0,
          emergencyRequests: maintenanceStats.overview.emergency || 0,
          criticalRequests: maintenanceStats.overview.critical || 0,
          highRequests: maintenanceStats.overview.high || 0,
          avgResponseTime: maintenanceStats.overview.avgResponseTime || 'N/A',
          teamEfficiency: maintenanceStats.overview.completed && maintenanceStats.overview.total 
            ? `${Math.round((maintenanceStats.overview.completed / maintenanceStats.overview.total) * 100)}%` 
            : '0%',
          trends: maintenanceStats.overview.trends || {
            requests: '0%',
            responseTime: '0%',
            efficiency: '0%'
          }
        },
        teams: teamStats.teams?.map((team, index) => ({
          id: team._id,
          name: team.name,
          type: team.specialization,
          completedRequests: team.stats?.completedRequests || 0,
          totalRequests: team.stats?.totalRequests || 0,
          avgResponseTime: team.stats?.avgResponseTime || 'N/A',
          efficiency: team.stats?.efficiency || '0%',
          trend: '+0%', // Would need historical comparison
          color: ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'][index % 5]
        })) || [],
        equipment: equipmentStats.equipment?.slice(0, 10) || [],
        recentRequests: maintenanceStats.recentRequests || [],
        overdueRequests: maintenanceStats.overdueRequests || []
      };

      setReportData(processedData);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  const reportTypes = [
    { value: 'overview', label: 'Overview', icon: ChartBarIcon },
    { value: 'teams', label: 'Teams Performance', icon: UserGroupIcon },
    { value: 'equipment', label: 'Equipment Analytics', icon: WrenchScrewdriverIcon },
    { value: 'timeline', label: 'Timeline Analysis', icon: CalendarIcon }
  ];

  const getTrendIcon = (trend) => {
    if (!trend) return null;
    if (trend.startsWith('+')) {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    } else if (trend.startsWith('-')) {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = (trend) => {
    if (!trend) return 'text-gray-500';
    if (trend.startsWith('+')) {
      return 'text-green-600';
    } else if (trend.startsWith('-')) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DocumentChartBarIcon className="w-8 h-8 text-purple-600" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">Maintenance performance insights and analytics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {reportTypes.map((report) => {
              const IconComponent = report.icon;
              return (
                <button
                  key={report.value}
                  onClick={() => setSelectedReport(report.value)}
                  className={`${
                    selectedReport === report.value
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <IconComponent className="w-5 h-5" />
                  {report.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalRequests}</p>
                  <div className="flex items-center mt-1">
                    {reportData.overview.trends?.requests ? getTrendIcon(reportData.overview.trends.requests) : null}
                    <span className={`text-sm ml-1 ${reportData.overview.trends?.requests ? getTrendColor(reportData.overview.trends.requests) : 'text-gray-500'}`}>
                      {reportData.overview.trends?.requests || 'No data'} from last {selectedPeriod}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.overview.completedRequests}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">
                      {Math.round((reportData.overview.completedRequests / reportData.overview.totalRequests) * 100)}% completion rate
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.overview.avgResponseTime}</p>
                  <div className="flex items-center mt-1">
                    {reportData.overview.trends?.responseTime ? getTrendIcon(reportData.overview.trends.responseTime) : null}
                    <span className={`text-sm ml-1 ${reportData.overview.trends?.responseTime ? getTrendColor(reportData.overview.trends.responseTime) : 'text-gray-500'}`}>
                      {reportData.overview.trends?.responseTime || 'No data'} from last {selectedPeriod}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.overview.teamEfficiency}</p>
                  <div className="flex items-center mt-1">
                    {reportData.overview.trends?.efficiency ? getTrendIcon(reportData.overview.trends.efficiency) : null}
                    <span className={`text-sm ml-1 ${reportData.overview.trends?.efficiency ? getTrendColor(reportData.overview.trends.efficiency) : 'text-gray-500'}`}>
                      {reportData.overview.trends?.efficiency || 'No data'} from last {selectedPeriod}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Timeline</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chart visualization would be rendered here</p>
                <p className="text-sm text-gray-400 mt-1">Integration with Chart.js or similar library</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'teams' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Team Performance Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">Comparative analysis of team efficiency and productivity</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {reportData.teams.map((team) => (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`${team.color} rounded-lg p-2`}>
                          <UserGroupIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{team.name}</h4>
                          <p className="text-sm text-gray-500">{team.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getTrendIcon(team.trend)}
                        <span className={`text-sm ml-1 ${getTrendColor(team.trend)}`}>
                          {team.trend}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed Requests</span>
                        <span className="text-sm font-medium text-gray-900">{team.completedRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Response Time</span>
                        <span className="text-sm font-medium text-gray-900">{team.avgResponseTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Efficiency Rate</span>
                        <span className="text-sm font-medium text-gray-900">{team.efficiency}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${team.color} h-2 rounded-full`}
                          style={{ width: team.efficiency }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'equipment' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Equipment Category Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">Maintenance requests and costs by equipment category</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requests This Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Downtime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maintenance Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.equipment.map((category, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">{category.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.totalEquipment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.requestsThisMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.avgDowntime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.maintenanceCost}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: category.efficiency }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{category.efficiency}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Request Timeline Analysis</h3>
                <p className="text-sm text-gray-600 mt-1">Monthly trends in maintenance request creation and completion</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
              </div>
            </div>
            
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Timeline chart would be rendered here</p>
                <p className="text-sm text-gray-400 mt-1">Shows request creation vs completion trends</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
              {reportData.timeline.labels.map((month, index) => (
                <div key={month} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{month}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-blue-600">
                      Created: {reportData.timeline.datasets[0].data[index]}
                    </p>
                    <p className="text-xs text-green-600">
                      Completed: {reportData.timeline.datasets[1].data[index]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
            <p className="text-sm text-gray-600 mt-1">Download reports in various formats</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Export PDF
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Export Excel
            </button>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;