import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { projectApi } from '../api';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待启动', color: '#ff9800' },
  ongoing: { label: '进行中', color: '#4caf50' },
  completed: { label: '已完工', color: '#9e9e9e' },
  paused: { label: '已暂停', color: '#f44336' },
};

export default function ProjectPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setProjects(await projectApi.list()); } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>项目管理</Text>
        <TouchableOpacity style={styles.addBtn}><MaterialCommunityIcons name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      {projects.map((p: any) => {
        const s = STATUS_MAP[p.status] || STATUS_MAP.ongoing;
        return (
          <TouchableOpacity key={p.id} style={styles.card} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.cardLocation}><MaterialCommunityIcons name="map-marker" size={12} color="#999" />{p.location || '未知地点'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: s.color + '15' }]}>
                <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardManager}>负责人: {p.manager || '待定'}</Text>
              <Text style={styles.cardBudget}>预算: ¥{(p.budget || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${p.progress || 0}%` }]} />
              </View>
              <Text style={styles.progressText}>{p.progress || 0}%</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {projects.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="archive-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>暂无项目</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  addBtn: { backgroundColor: '#1976d2', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  cardLocation: { fontSize: 12, color: '#999', marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: { marginTop: 10 },
  cardManager: { fontSize: 13, color: '#666' },
  cardBudget: { fontSize: 13, color: '#666', marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1976d2', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#999', width: 36, textAlign: 'right' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
});
