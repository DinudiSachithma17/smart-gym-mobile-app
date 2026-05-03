import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LandingScreen from '../screens/public/LandingScreen';
import TrainerRegisterScreen from '../screens/public/TrainerRegisterScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import PackageManagement from '../screens/admin/PackageManagement';
import TrainerManagement from '../screens/admin/TrainerManagement';
import ComplaintManagement from '../screens/admin/ComplaintManagement';
import NotificationManagement from '../screens/admin/NotificationManagement';
import FeedbackManagement from '../screens/admin/FeedbackManagement';
import MembershipManagement from '../screens/admin/MembershipManagement';
import ClassManagement from '../screens/admin/ClassManagement';

// Member Screens
import MemberDashboard from '../screens/member/MemberDashboard';
import PackagesScreen from '../screens/member/PackagesScreen';
import MembershipScreen from '../screens/member/MembershipScreen';
import TrainersScreen from '../screens/member/TrainersScreen';
import ComplaintsScreen from '../screens/member/ComplaintsScreen';
import FeedbackScreen from '../screens/member/FeedbackScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';
import MemberProfile from '../screens/member/MemberProfile';
import PaymentScreen from '../screens/member/PaymentScreen';

// Trainer Screens
import TrainerDashboard from '../screens/trainer/TrainerDashboard';
import TrainerProfile from '../screens/trainer/TrainerProfile';
import TrainerClasses from '../screens/trainer/TrainerClasses';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // You could put a splash screen here

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Not logged in
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="TrainerRegister" component={TrainerRegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'Admin' ? (
        // Admin
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="PackageManagement" component={PackageManagement} />
          <Stack.Screen name="TrainerManagement" component={TrainerManagement} />
          <Stack.Screen name="ComplaintManagement" component={ComplaintManagement} />
          <Stack.Screen name="NotificationManagement" component={NotificationManagement} />
          <Stack.Screen name="FeedbackManagement" component={FeedbackManagement} />
          <Stack.Screen name="MembershipManagement" component={MembershipManagement} />
          <Stack.Screen name="ClassManagement" component={ClassManagement} />
        </>
      ) : user.role === 'Trainer' ? (
        // Trainer
        <>
          <Stack.Screen name="TrainerDashboard" component={TrainerDashboard} />
          <Stack.Screen name="TrainerProfile" component={TrainerProfile} />
          <Stack.Screen name="TrainerClasses" component={TrainerClasses} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      ) : (
        // Member
        <>
          <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
          <Stack.Screen name="Packages" component={PackagesScreen} />
          <Stack.Screen name="Memberships" component={MembershipScreen} />
          <Stack.Screen name="Trainers" component={TrainersScreen} />
          <Stack.Screen name="Complaints" component={ComplaintsScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="MemberProfile" component={MemberProfile} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
