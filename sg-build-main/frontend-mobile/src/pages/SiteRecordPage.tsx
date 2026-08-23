import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { siteApi } from '../api';

export default function SiteRecordPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setRecords(await siteApi.list()); } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>现场记录</Text>
        <TouchableOpacity style={styles.addBtn}><MaterialCommunityIcons name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      {records.map((r: any) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}><MaterialCommunityIcons name="account" size={16} color="#1976d2" /></View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{r.project || '未知项目'}</Text>
              <Text style={styles.cardMeta}>{r.reportedBy || '未署名'} · {new Date(r.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>{r.description || '暂无描述'}</Text>
          {r.location && <View style={styles.locationRow}><MaterialCommunityIcons name="map-marker" size={14} color="#999" /><Text style={styles.locationText}>{r.location}</Text></View>}
        </View>
      ))}

      {records.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>暂无现场记录</Text>
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
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  cardMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  cardDesc: { fontSize: 14, color: '#333', marginTop: 10, lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  locationText: { fontSize: 12, color: '#999' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
});
