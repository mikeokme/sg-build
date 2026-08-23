import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { equipmentApi } from '../api';

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { try { setEquipments(await equipmentApi.list()); } catch (e) {} };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>设备管理</Text>
        <TouchableOpacity style={styles.addBtn}><MaterialCommunityIcons name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      {equipments.map((e: any) => (
        <View key={e.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconWrap}><MaterialCommunityIcons name="truck-trailer" size={24} color="#607d8b" /></View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{e.name}</Text>
              <Text style={styles.cardModel}>{e.model || '—'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: e.status === 'available' ? '#e8f5e9' : e.status === 'in_use' ? '#e3f2fd' : '#fff3e0' }]}>
              <Text style={[styles.statusText, { color: e.status === 'available' ? '#4caf50' : e.status === 'in_use' ? '#1976d2' : '#ff9800' }]}>
                {e.status === 'available' ? '可用' : e.status === 'in_use' ? '使用中' : '维修中'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardLocation}><MaterialCommunityIcons name="map-marker" size={14} color="#999" />{e.location || '未指定'}</Text>
        </View>
      ))}

      {equipments.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="truck-fast" size={48} color="#ccc" />
          <Text style={styles.emptyText}>暂无设备数据</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  addBtn: { backgroundColor: '#607d8b', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#eceff1', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  cardModel: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardLocation: { fontSize: 12, color: '#999', marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
});
