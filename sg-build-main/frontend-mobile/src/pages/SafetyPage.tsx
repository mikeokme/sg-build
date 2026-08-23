import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { safetyApi } from '../api';

const RISK_COLORS: Record<string, string> = {
  low: '#4caf50', medium: '#ff9800', high: '#f44336', critical: '#9c27b0',
};

export default function SafetyPage() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { try { setItems(await safetyApi.list()); } catch (e) {} };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>安全管理</Text>
        <TouchableOpacity style={styles.addBtn}><MaterialCommunityIcons name="plus" size={20} color="#fff" /></TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}><Text style={{...styles.summaryValue, color: '#4caf50'}}>{items.filter((i) => i.riskLevel === 'low').length}</Text><Text style={styles.summaryLabel}>低风险</Text></View>
        <View style={styles.summaryCard}><Text style={{...styles.summaryValue, color: '#ff9800'}}>{items.filter((i) => i.riskLevel === 'medium').length}</Text><Text style={styles.summaryLabel}>中风险</Text></View>
        <View style={styles.summaryCard}><Text style={{...styles.summaryValue, color: '#f44336'}}>{items.filter((i) => i.riskLevel === 'high').length}</Text><Text style={styles.summaryLabel}>高风险</Text></View>
      </View>

      {items.map((s: any) => {
        const color = RISK_COLORS[s.riskLevel] || '#999';
        return (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardTop}>
              <MaterialCommunityIcons name="shield-alert" size={24} color={color} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{s.project || '未知项目'}</Text>
                <Text style={styles.cardInspector}>{s.inspector || '未署名'} · {new Date(s.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.riskBadge, { borderColor: color }]}>
                <Text style={[styles.riskText, { color }]}>{s.riskLevel === 'low' ? '低' : s.riskLevel === 'medium' ? '中' : s.riskLevel === 'high' ? '高' : '危'}</Text>
              </View>
            </View>
            {s.issues && s.issues.length > 0 && (
              <View style={styles.issuesWrap}>
                <Text style={styles.issuesTitle}>隐患内容:</Text>
                {s.issues.slice(0, 2).map((issue: string, i: number) => (
                  <View key={i} style={styles.issueItem}><Text style={styles.issueText}>• {issue}</Text></View>
                ))}
              </View>
            )}
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: s.status === 'resolved' ? '#4caf50' : '#ff9800' }]}>
                {s.status === 'resolved' ? '已整改' : '待处理'}
              </Text>
            </View>
          </View>
        );
      })}

      {items.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="shield-check" size={48} color="#ccc" />
          <Text style={styles.emptyText}>暂无安全检查记录</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  addBtn: { backgroundColor: '#009688', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: 'bold' },
  summaryLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  cardInspector: { fontSize: 12, color: '#999', marginTop: 2 },
  riskBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  riskText: { fontSize: 12, fontWeight: '600' },
  issuesWrap: { marginTop: 10, paddingLeft: 4 },
  issuesTitle: { fontSize: 12, color: '#999', marginBottom: 4 },
  issueItem: { paddingVertical: 2 },
  issueText: { fontSize: 13, color: '#333' },
  statusRow: { marginTop: 10, alignItems: 'flex-end' },
  statusText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
});
