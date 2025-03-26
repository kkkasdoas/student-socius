
import React from 'react';
import Layout from '@/components/Layout';
import SettingsScreen from '@/components/SettingsScreen';

const SettingsPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <SettingsScreen />
      </div>
    </Layout>
  );
};

export default SettingsPage;
