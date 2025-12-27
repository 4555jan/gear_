import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { commonStyles, colors, spacing, typography } from '../utils/styles';
import { responsive, isScreenSize } from '../utils/platform';

const DashboardScreen = () => {
  const { user } = useAuthStore();

  const statsData = [
    { title: 'Open Requests', value: '24', color: colors.primary[600], icon: '📊' },
    { title: 'Completed Today', value: '8', color: colors.green[600], icon: '✅' },
    { title: 'Overdue', value: '3', color: colors.red[600], icon: '⚠️' },
    { title: 'Active Equipment', value: '156', color: colors.blue[600], icon: '⚙️' }
  ];

  const activities = [
    {
      id: 1,
      title: 'HVAC Unit Maintenance - Building A',
      description: 'Completed by John Doe • 2 hours ago',
      status: 'Completed',
      statusColor: colors.green[600]
    },
    {
      id: 2,
      title: 'Electrical Panel Inspection - Building B',
      description: 'Assigned to Sarah Smith • Started 1 hour ago',
      status: 'In Progress',
      statusColor: colors.yellow[600]
    },
    {
      id: 3,
      title: 'Plumbing Leak Report - Building C',
      description: 'Reported by Mike Johnson • 30 minutes ago',
      status: 'New',
      statusColor: colors.primary[600]
    }
  ];

  const renderStatCard = (stat, index) => (
    <View key={index} style={[commonStyles.card, styles.statCard]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{stat.icon}</Text>
        <View style={styles.statInfo}>
          <Text style={[commonStyles.caption, styles.statTitle]}>{stat.title}</Text>
          <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
        </View>
      </View>
    </View>
  );

  const renderActivityItem = (activity) => (
    <View key={activity.id} style={styles.activityItem}>
      <View style={styles.activityStatus}>
        <View style={[styles.statusBadge, { backgroundColor: activity.statusColor }]} />
        <Text style={[styles.statusText, { color: activity.statusColor }]}>
          {activity.status}
        </Text>
      </View>
      <Text style={styles.activityTitle}>{activity.title}</Text>
      <Text style={styles.activityDescription}>{activity.description}</Text>
    </View>
  );

  const isTablet = isScreenSize('md');
  const statsPerRow = isTablet ? 4 : 2;

  return (
    <ScrollView style={commonStyles.container}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={commonStyles.title}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </Text>
          <Text style={commonStyles.body}>
            Here's what's happening in your maintenance system today.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { flexDirection: isTablet ? 'row' : 'column' }]}>
          {statsData.map((stat, index) => {
            if (isTablet) {
              return (
                <View key={index} style={{ flex: 1, marginHorizontal: spacing.xs }}>
                  {renderStatCard(stat, index)}
                </View>
              );
            }
            
            if (index % 2 === 0) {
              return (
                <View key={index} style={styles.statRow}>
                  <View style={{ flex: 1, marginRight: spacing.xs }}>
                    {renderStatCard(statsData[index], index)}
                  </View>
                  {statsData[index + 1] && (
                    <View style={{ flex: 1, marginLeft: spacing.xs }}>
                      {renderStatCard(statsData[index + 1], index + 1)}
                    </View>
                  )}
                </View>
              );
            }
            return null;
          })}
        </View>

        {/* Role-specific content */}
        {user?.role === 'admin' && (
          <View style={styles.adminSection}>
            <View style={[commonStyles.card, styles.managementCard]}>
              <Text style={commonStyles.subtitle}>Team Management</Text>
              <Text style={[commonStyles.body, styles.cardDescription]}>
                Manage teams and assign technicians to maintenance tasks.
              </Text>
              <View style={styles.teamList}>
                {[
                  { name: 'Electrical Team', members: 5, status: 'success' },
                  { name: 'HVAC Team', members: 3, status: 'success' },
                  { name: 'Mechanical Team', members: 2, status: 'warning' }
                ].map((team, index) => (
                  <View key={index} style={styles.teamItem}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <View style={[
                      commonStyles.badge,
                      team.status === 'success' ? commonStyles.badgeSuccess : commonStyles.badgeWarning
                    ]}>
                      <Text style={[
                        commonStyles.badgeText,
                        team.status === 'success' ? commonStyles.badgeTextSuccess : commonStyles.badgeTextWarning
                      ]}>
                        {team.members} members
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={[commonStyles.card, styles.healthCard]}>
              <Text style={commonStyles.subtitle}>System Health</Text>
              <View style={styles.healthList}>
                {[
                  { label: 'Equipment Status', value: '98% Operational', status: 'success' },
                  { label: 'Team Utilization', value: '75% Capacity', status: 'warning' },
                  { label: 'Response Time', value: '2.3 hrs avg', status: 'success' }
                ].map((item, index) => (
                  <View key={index} style={styles.healthItem}>
                    <Text style={styles.healthLabel}>{item.label}</Text>
                    <View style={[
                      commonStyles.badge,
                      item.status === 'success' ? commonStyles.badgeSuccess : commonStyles.badgeWarning
                    ]}>
                      <Text style={[
                        commonStyles.badgeText,
                        item.status === 'success' ? commonStyles.badgeTextSuccess : commonStyles.badgeTextWarning
                      ]}>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={[commonStyles.card, styles.activityCard]}>
          <View style={commonStyles.cardHeader}>
            <Text style={commonStyles.subtitle}>Recent Activity</Text>
          </View>
          <View style={commonStyles.cardBody}>
            {activities.map(renderActivityItem)}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  welcomeSection: {
    marginBottom: spacing.lg,
  },
  statsGrid: {
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  statCard: {
    padding: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: typography['2xl'],
    marginRight: spacing.sm,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography['2xl'],
    fontWeight: 'bold',
  },
  adminSection: {
    marginBottom: spacing.lg,
  },
  managementCard: {
    marginBottom: spacing.md,
  },
  healthCard: {
    marginBottom: spacing.md,
  },
  cardDescription: {
    marginBottom: spacing.md,
  },
  teamList: {
    gap: spacing.sm,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontSize: typography.sm,
    color: colors.gray[700],
  },
  healthList: {
    gap: spacing.md,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: typography.sm,
    color: colors.gray[600],
  },
  activityCard: {
    marginBottom: spacing.lg,
  },
  activityItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.sm,
    fontWeight: '600',
  },
  activityTitle: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  activityDescription: {
    fontSize: typography.sm,
    color: colors.gray[600],
  },
});

export default DashboardScreen;