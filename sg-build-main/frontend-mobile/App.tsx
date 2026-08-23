import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from './src/store';
import LoginPage from './src/pages/LoginPage';
import HomePage from './src/pages/HomePage';
import ProjectPage from './src/pages/ProjectPage';
import ApprovalPage from './src/pages/ApprovalPage';
import ProfilePage from './src/pages/ProfilePage';
import SiteRecordPage from './src/pages/SiteRecordPage';
import MaterialPage from './src/pages/MaterialPage';
import EquipmentPage from './src/pages/EquipmentPage';
import SafetyPage from './src/pages/SafetyPage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function QuickAccessScreen({ navigation }: any) {
  const menus = [
    { icon: 'hard-hat', label: '现场记录', page: 'site-records', color: '#f44336' },
    { icon: 'warehouse', label: '材料管理', page: 'materials', color: '#795548' },
    { icon: 'truck-fast', label: '设备管理', page: 'equipments', color: '#607d8b' },
    { icon: 'shield-check', label: '安全管理', page: 'safety', color: '#009688' },
  ];
  return (
    <View style={styles.container}>
      <Text style={styles.quickTitle}>快捷功能</Text>
      <View style={styles.grid}>
        {menus.map((m) => (
          <TouchableOpacity key={m.page} style={styles.gridItem} onPress={() => navigation.navigate(m.page)}>
            <MaterialCommunityIcons name={m.icon} size={32} color={m.color} />
            <Text style={styles.gridLabel}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            home: ['home', 'home-outline'],
            projects: ['building', 'building-outline'],
            approval: ['clipboard-check', 'clipboard-check-outline'],
            profile: ['account', 'account-outline'],
          };
          const [on, off] = icons[route.name] || [route.name, route.name];
          return <MaterialCommunityIcons name={focused ? on : off} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: { height: 56, paddingBottom: 8 },
      })}
    >
      <Tab.Screen name="home" component={HomePage} />
      <Tab.Screen name="projects" component={ProjectPage} />
      <Tab.Screen name="approval" component={ApprovalPage} />
      <Tab.Screen name="profile" component={ProfilePage} />
    </Tab.Navigator>
  );
}

export default function App() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const [ready, setReady] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 200); }, []);

  if (!ready) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1976d2' }, headerTintColor: '#fff', headerTitleStyle: { fontSize: 17, fontWeight: '600' } }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="site-records" component={SiteRecordPage} options={{ title: '现场记录' }} />
            <Stack.Screen name="materials" component={MaterialPage} options={{ title: '材料管理' }} />
            <Stack.Screen name="equipments" component={EquipmentPage} options={{ title: '设备管理' }} />
            <Stack.Screen name="safety" component={SafetyPage} options={{ title: '安全管理' }} />
            <Stack.Screen name="quick-access" component={QuickAccessScreen} options={{ title: '快捷功能' }} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  quickTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', elevation: 1 },
  gridLabel: { marginTop: 8, fontSize: 13, color: '#333' },
});
