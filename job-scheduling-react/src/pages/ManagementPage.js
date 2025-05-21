import React from 'react';
import { Tabs, Typography } from 'antd';
import { Box } from '@mui/material';
import TeamManagement from '../components/manage/TeamManager';
import EmployeeManagement from '../components/manage/EmployeeManagement';
import SettingsManagement from '../components/manage/SettingsManagement';
import DashboardLayout from '../components/layouts/DashboardLayout';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

const ManagementPage = ({ defaultTab = 'teams' }) => {
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Title level={2}>Management Dashboard</Title>
        <Paragraph type="secondary">
          Manage your teams and employees, assign team members, and configure organizational settings.
        </Paragraph>
      </Box>
      <Tabs defaultActiveKey={defaultTab}>
        <TabPane tab="Teams" key="teams">
          <TeamManagement />
        </TabPane>
        <TabPane tab="Employees" key="employees">
          <EmployeeManagement />
        </TabPane>
        <TabPane tab="Other" key="other">
          <SettingsManagement />
        </TabPane>
      </Tabs>
    </DashboardLayout>
  );
};

export default ManagementPage; 