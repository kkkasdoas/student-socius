
import React from 'react';
import Layout from '@/components/Layout';
import LoginScreen from '@/components/LoginScreen';

const LoginPage: React.FC = () => {
  return (
    <Layout hideNav>
      <LoginScreen />
    </Layout>
  );
};

export default LoginPage;
