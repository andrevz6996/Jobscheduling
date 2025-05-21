import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSyncContext } from '../../contexts/SyncContext';

const EmployeeManagement = () => {
  const {
    employees,
    teams,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    syncWithAmplify,
    fetchAllData
  } = useSyncContext();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();

  // Ensure data is loaded when the component mounts
  useEffect(() => {
    // Check if we need to fetch data
    if (employees.length === 0 && !loading) {
      console.log("No employees found, fetching data...");
      fetchAllData();
    } else {
      console.log("Found", employees.length, "employees in context");
    }
  }, [employees, loading, fetchAllData]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({ 
      ...employee,
      teamId: employee.team?.id || employee.teamId
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (employeeId) => {
    try {
      await deleteEmployee(employeeId);
      await syncWithAmplify();
      message.success('Employee deleted. Data synced with cloud.');
    } catch (err) {
      message.error('Failed to delete employee. ' + (err.message || ''));
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, values);
        message.success('Employee updated locally.');
      } else {
        await addEmployee(values);
        message.success('Employee added locally.');
      }
      await syncWithAmplify();
      message.success('Data synced with cloud.');
      setIsModalVisible(false);
      form.resetFields();
    } catch (err) {
      message.error('Failed to save employee. ' + (err.message || ''));
    }
  };

  const handleTeamAssignmentChange = async (employeeId, newTeamId) => {
    try {
      await updateEmployee(employeeId, { teamId: newTeamId });
      await syncWithAmplify();
      message.success('Team assignment updated and synced.');
    } catch (err) {
      message.error('Failed to update team assignment.');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => name || <span style={{ color: '#aaa', fontStyle: 'italic' }}>No name provided</span>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Team',
      dataIndex: 'teamId',
      key: 'teamId',
      render: (teamId, record) => {
        const team = teams.find((t) => t.id === teamId);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{team?.name || <span style={{ color: '#aaa' }}>None</span>}</span>
            <Select
              style={{ width: 150 }}
              placeholder="Assign team"
              allowClear
              value={teamId}
              onChange={(newTeamId) => handleTeamAssignmentChange(record.id, newTeamId)}
              loading={loading}
            >
              {teams.map((t) => (
                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
              ))}
            </Select>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ marginRight: 8 }} />
          <Popconfirm title="Delete employee?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </>
      ),
    },
  ];

  if (loading && !employees.length && !teams.length) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading data...</div>;
  }

  // Add debugging information during development
  console.log('Employee data:', employees);

  // Add a debug section to verify data loading (only visible in development/testing)
  const DebugPanel = () => (
    <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
      <h3>Debug Information</h3>
      <p>Employee Count: {employees.length}</p>
      <p>Loading State: {loading ? 'true' : 'false'}</p>
      <p>Error State: {error ? error : 'none'}</p>
      <p>Employees Data: {JSON.stringify(employees.map(e => e.name))}</p>
      {error && (
        <Button 
          type="primary" 
          onClick={() => {
            console.log("Manually retrying data fetch");
            fetchAllData();
          }}
          style={{ marginTop: 8 }}
        >
          Retry Loading Data
        </Button>
      )}
    </div>
  );

  return (
    <div style={{ padding: 0 }}>
      {process.env.NODE_ENV !== 'production' && <DebugPanel />}
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">Employees</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Employee
        </Button>
      </div>
      {employees.length === 0 && !loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
          No employees found. Click "Add Employee" to add your first employee.
        </div>
      ) : (
        <Table 
          columns={columns} 
          dataSource={employees} 
          rowKey="id" 
          bordered 
          loading={loading} 
        />
      )}

      <Modal
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical" initialValues={{ teamId: null }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input employee name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="teamId" label="Team">
            <Select placeholder="Select a team" allowClear loading={loading}>
              {teams.map(team => (
                <Select.Option key={team.id} value={team.id}>{team.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingEmployee ? 'Save Changes' : 'Add Employee'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement; 