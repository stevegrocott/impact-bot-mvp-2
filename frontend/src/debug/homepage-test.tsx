/**
 * Homepage Debug Test
 * Isolates and tests the homepage components step by step
 */

import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../shared/store/store';
import { useAuth } from '../shared/hooks/useAuth';
import { useFramerMotionSafe } from '../hooks/useSafeDependencies';
import AppLayout from '../layouts/AppLayout';
import FoundationDashboard from '../pages/FoundationDashboard';

// Test each component in isolation
export const TestStore = () => {
  try {
    return (
      <Provider store={store}>
        <div>Store works!</div>
      </Provider>
    );
  } catch (error) {
    console.error('Store test failed:', error);
    return <div>Store Error: {String(error)}</div>;
  }
};

export const TestRouter = () => {
  try {
    return (
      <BrowserRouter>
        <div>Router works!</div>
      </BrowserRouter>
    );
  } catch (error) {
    console.error('Router test failed:', error);
    return <div>Router Error: {String(error)}</div>;
  }
};

// Create a wrapper component that properly uses hooks
const AuthTestWrapper = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <div>
      Auth works! Authenticated: {String(isAuthenticated)}, User: {user ? 'loaded' : 'null'}
    </div>
  );
};

export const TestAuth = () => {
  try {
    return <AuthTestWrapper />;
  } catch (error) {
    console.error('Auth test failed:', error);
    return <div>Auth Error: {String(error)}</div>;
  }
};

export const TestAppLayout = () => {
  try {
    return (
      <AppLayout>
        <div>AppLayout works!</div>
      </AppLayout>
    );
  } catch (error) {
    console.error('AppLayout test failed:', error);
    return <div>AppLayout Error: {String(error)}</div>;
  }
};

export const TestFoundationDashboard = () => {
  try {
    return <FoundationDashboard />;
  } catch (error) {
    console.error('FoundationDashboard test failed:', error);
    return <div>FoundationDashboard Error: {String(error)}</div>;
  }
};

// Create a wrapper component that properly uses hooks
const FramerMotionTestWrapper = () => {
  const { motion, isAvailable, error } = useFramerMotionSafe();
  return (
    <div>
      Framer Motion: Available={String(isAvailable)}, Error={error || 'none'}
      {motion && <motion.div>Motion works!</motion.div>}
    </div>
  );
};

export const TestFramerMotion = () => {
  try {
    return <FramerMotionTestWrapper />;
  } catch (error) {
    console.error('Framer Motion test failed:', error);
    return <div>Framer Motion Error: {String(error)}</div>;
  }
};

export const CombinedTest = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Homepage Debug Test</h1>
          
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>Store Test:</h3>
            <TestStore />
          </div>
          
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>Router Test:</h3>
            <TestRouter />
          </div>
          
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>Auth Test:</h3>
            <TestAuth />
          </div>
          
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>Framer Motion Test:</h3>
            <TestFramerMotion />
          </div>
          
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>AppLayout Test:</h3>
            <TestAppLayout />
          </div>
          
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>FoundationDashboard Test:</h3>
            <TestFoundationDashboard />
          </div>
        </div>
      </BrowserRouter>
    </Provider>
  );
};

export default CombinedTest;