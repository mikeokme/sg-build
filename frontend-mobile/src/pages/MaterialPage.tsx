import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { materialApi } from '../api';

export default function MaterialPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { try { setMaterials(await materialApi.list()); } catch (e) {} };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>材料管理</Text>
        <TouchableOpacity style={styles.addBtn}><MaterialCommunityIcons name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{materials.length}</Text>
          <Text style={styles.summaryLabel}>材料种类</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{materials.filter((m) => m.status === 'low').length}</Text>
          <Text style={styles.summaryLabel}>库存预警</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{materials.filter((m) => m.status === 'available').length}</Text>
          <Text style={styles.summaryLabel}>可用库存</Text>
        </View>
      </View>

      {materials.map((m: any) => (
        <View key={m.id} style={styles.card}>
          <View style={styles.cardTop}>
            <MaterialCommunityIcons name={m.category === '钢筋' ? 'numeric' : m.category === '水泥' ? 'cube' : 'package-variant'} size={24} color="#1976d2" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{m.name}</Text>
              <Text style={styles.cardCat}>{m.category || '未分类'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: m.status === 'available' ? '#e8f5e9' : m.status === 'low' ? '#fff3e0' : '#e3f2fd' }]}>
              <Text style={[styles.statusText, { color: m.status === 'available' ? '#4caf50' : m.status === 'low' ? '#ff9800' : '#1976d2' }]}>
                {m.status === 'available' ? '可用' : m.status === 'low' ? '不足' : '在用'}
              </Text>
            </View>
          </View>
          <View style={styles.cardStats}>
            <Text style={styles.statText}>数量: <Text style={styles.statValue}>{m.quantity || 0} {m.unit || '批'}</Text></Text>
          </View>
        </View>
      ))}

      {materials.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="warehouse" size={48} color="#ccc" />
          <Text style={styles.emptyText}>暂无材料数据</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  addBtn: { backgroundColor: '#795548', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  summaryLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 12, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  cardCat: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardStats: { marginTop: 10, flexDirection: 'row', gap: 16 },
  statText: { fontSize: 13, color: '#666' },
  statValue: { color: '#1976d2', fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
});
