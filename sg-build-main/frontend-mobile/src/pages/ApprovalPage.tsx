import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { approvalApi } from '../api';

const TYPE_MAP: Record<string, { icon: string; label: string }> = {
  leave: { icon: 'account-eye', label: '请假申请' },
  purchase: { icon: 'shopping', label: '采购申请' },
  material: { icon: 'warehouse', label: '材料申请' },
  equipment: { icon: 'truck-trailer', label: '设备申请' },
  safety: { icon: 'shield-check', label: '安全检查' },
  other: { icon: 'clipboard-text', label: '其他申请' },
};

export default function ApprovalPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setApprovals(await approvalApi.list()); } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = approvals.filter((a: any) => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'done') return a.status !== 'pending';
    return true;
  });

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await approvalApi[action](id, { remark: '同意' });
      await load();
    } catch (e) {}
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>审批流程</Text>
        <Text style={styles.subtitle}>{approvals.filter((a: any) => a.status === 'pending').length} 条待审批</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'pending', 'done'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? '全部' : f === 'pending' ? '待审批' : '已处理'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.map((a: any) => {
        const type = TYPE_MAP[a.type] || TYPE_MAP.other;
        return (
          <View key={a.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={type.icon} size={20} color="#1976d2" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{type.label}</Text>
                <Text style={styles.cardSubtitle}>{a.title}</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: a.status === 'pending' ? '#ff9800' + '20' : a.status === 'approved' ? '#4caf50' + '20' : '#f44336' + '20' }]}>
                <Text style={[styles.statusChipText, { color: a.status === 'pending' ? '#ff9800' : a.status === 'approved' ? '#4caf50' : '#f44336' }]}>
                  {a.status === 'pending' ? '待审批' : a.status === 'approved' ? '已通过' : '已驳回'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>{a.applicant} · {new Date(a.createdAt).toLocaleDateString()}</Text>
            {a.status === 'pending' && (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(a.id, 'reject')}>
                  <Text style={styles.rejectText}>驳回</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(a.id, 'approve')}>
                  <Text style={styles.approveText}>通过</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {filtered.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="check-decagram" size={48} color="#ccc" />
          <Text style={styles.emptyText}>暂无审批</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#1976d2', marginTop: 2 },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#1976d2' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 12, padding: 14, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  cardSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusChipText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { fontSize: 12, color: '#999', marginTop: 10 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  rejectBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff3e0', alignItems: 'center' },
  rejectText: { fontSize: 14, color: '#f44336', fontWeight: '600' },
  approveBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#e8f5e9', alignItems: 'center' },
  approveText: { fontSize: 14, color: '#4caf50', fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
});
