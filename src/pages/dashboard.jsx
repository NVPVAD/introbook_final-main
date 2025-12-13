import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import Layout from '../components/Layout';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import LoadingDashboard from '../components/LoadingDashboard';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState('main_user');
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    const checkUserPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const permissionsResponse = await axios.get('user-permissions/', {
          headers: { Authorization: `Token ${token}` }
        });
        setUserType(permissionsResponse.data.user_type);
        setCanEdit(permissionsResponse.data.permissions?.can_edit_profile || false);
        localStorage.setItem('userInfo', JSON.stringify(permissionsResponse.data));
      } catch (error) {
        console.error('Error checking permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserPermissions();
  }, []);

  if (loading) return (
    <Layout title={t('dashboard')}>
      <LoadingDashboard />
    </Layout>
  );

  return (
    <Layout title={t('dashboard')}>
      <LanguageToggle />
      <AnalyticsDashboard />
    </Layout>
  );
};

export default Dashboard;