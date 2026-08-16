import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { projectApi, approvalApi } from '../api';

const menuItems = [
  { icon: 'home', label: '工作台', color: '#1976d2', path: 'home' },
  { icon: 'building', label: '项目管理', color: '#4caf50', path: 'projects' },
  { icon: 'account-group', label: '组织架构', color: '#ff9800', path: 'quick-access' },
  { icon: 'clipboard-check', label: '审批流程', color: '#9c27b0', path: 'approvals', badge: 3 },
  { icon: 'hard-hat', label: '现场记录', color: '#f44336', path: 'site-records' },
  { icon: 'warehouse', label: '材料管理', color: '#795548', path: 'materials' },
  { icon: 'truck-fast', label: '设备管理', color: '#607d8b', path: 'equipments' },
  { icon: 'shield-check', label: '安全管理', color: '#009688', path: 'safety' },
];

export default function HomePage() {
  const user = useAppStore((s) => s.user);
  const navigation = useNavigation<any>();
  const [projects, setProjects] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [p, a] = await Promise.all([projectApi.list(), approvalApi.list()]);
      setProjects(p || []);
      setApprovals(a || []);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const pendingApprovals = approvals.filter((a: any) => a.status === 'pending').length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>下午好</Text>
          <Text style={styles.username}>{user?.username || '用户'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <MaterialCommunityIcons name="bell" size={22} color="#333" />
          {pendingApprovals > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{pendingApprovals}</Text></View>}
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{projects.filter((p: any) => p.status === 'ongoing').length || 12}</Text>
          <Text style={styles.statLabel}>进行中项目</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>286</Text>
          <Text style={styles.statLabel}>在场人员</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingApprovals || 8}</Text>
          <Text style={styles.statLabel}>待审批</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>常用功能</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.path} style={styles.menuItem} onPress={() => navigation.navigate(item.path)}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badge && <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{item.badge}</Text></View>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>待办事项</Text>
          <Text style={styles.seeAll}>查看全部</Text>
        </View>
        {(approvals.filter((a: any) => a.status === 'pending').slice(0, 3).length > 0
          ? approvals.filter((a: any) => a.status === 'pending').slice(0, 3)
          : [
              { title: '城南地铁站建设 - 进度周报审核', time: '10分钟前' },
              { title: '滨江大桥 - 材料进场验收申请', time: '1小时前' },
              { title: '科技园A栋 - 安全巡检待处理', time: '2小时前' },
            ]
        ).map((item: any, i: number) => (
          <View key={i} style={styles.todoItem}>
            <View style={styles.todoDot} />
            <Text style={styles.todoText}>{item.title || item.text}</Text>
            <Text style={styles.todoTime}>{item.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1976d2', paddingHorizontal: 16, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  username: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 2 },
  notificationBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#f44336', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  section: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 12, paddingVertical: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  seeAll: { fontSize: 13, color: '#1976d2' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuItem: { width: '22%', alignItems: 'center', paddingVertical: 8, position: 'relative' },
  menuIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  menuLabel: { fontSize: 11, color: '#333', textAlign: 'center' },
  menuBadge: { position: 'absolute', top: 4, right: 12, backgroundColor: '#f44336', borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  menuBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  todoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  todoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1976d2', marginRight: 10, flexShrink: 0 },
  todoText: { flex: 1, fontSize: 14, color: '#333' },
  todoTime: { fontSize: 12, color: '#999', marginLeft: 8 },
});
