import React from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import AnalysisForm from '../components/analysis/AnalysisForm';

const AnalysisPage = () => {
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Data Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analyze job performance and financial metrics
        </Typography>
      </Box>
      
      <AnalysisForm />
    </DashboardLayout>
  );
};

export default AnalysisPage; 