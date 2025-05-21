import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import ApiService from '../../services/api';

const DescriptionManager = () => {
  const [descriptions, setDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    category: ''
  });

  // Load descriptions
  useEffect(() => {
    const fetchDescriptions = async () => {
      try {
        setLoading(true);
        
        // Use mock data for now
        const response = await ApiService.mockApi.getDescriptions();
        setDescriptions(response.data || []);
      } catch (err) {
        console.error('Error fetching descriptions:', err);
        setError('Failed to load descriptions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDescriptions();
  }, []);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Submit data (commented out until backend is ready)
      // await ApiService.addDescription(formData);
      
      console.log('Description added:', formData);
      
      // Add to local state for demo
      const newDescription = {
        id: descriptions.length + 1, // Temporary ID for demo
        ...formData
      };
      
      setDescriptions(prev => [...prev, newDescription]);
      
      // Clear form
      setFormData({
        description: '',
        category: ''
      });
      
      setSuccess('Description added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error adding description:', err);
      setError('Failed to add description. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle description deletion
  const handleDelete = async (id) => {
    try {
      // Call API to delete description (commented out until backend is ready)
      // await ApiService.deleteDescription(id);
      
      console.log('Description deleted:', id);
      
      // Update local state
      setDescriptions(prev => prev.filter(desc => desc.id !== id));
      
      setSuccess('Description deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error deleting description:', err);
      setError('Failed to delete description. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader title="Manage Descriptions" />
      <Divider />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={3}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                variant="outlined"
                placeholder="Optional"
              />
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
                sx={{ mt: 2 }}
                fullWidth
              >
                {submitting ? <CircularProgress size={24} /> : 'Add Description'}
              </Button>
            </Grid>
          </Grid>
        </form>
        
        <Box sx={{ mt: 4 }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {descriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No descriptions found</TableCell>
                  </TableRow>
                ) : (
                  descriptions.map((desc) => (
                    <TableRow key={desc.id}>
                      <TableCell>{desc.description}</TableCell>
                      <TableCell>{desc.category || '-'}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="error"
                          onClick={() => handleDelete(desc.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DescriptionManager; 