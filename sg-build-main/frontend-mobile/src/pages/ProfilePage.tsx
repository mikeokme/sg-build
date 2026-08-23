import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store';

export default function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.username || '用户'}</Text>
        <Text style={styles.company}>{user?.company || 'SG-Build建设有限公司'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === 'admin' ? '管理员' : '员工'}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {[
          { icon: 'account-details', label: '个人信息' },
          { icon: 'bell-outline', label: '消息通知' },
          { icon: 'shield-account', label: '安全设置' },
          { icon: 'file-document', label: '操作日志' },
          { icon: 'help-circle-outline', label: '帮助中心' },
          { icon: 'cog-outline', label: '系统设置' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name={item.icon} size={22} color="#1976d2" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>

      <Text style={styles.version}>SG-Build v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileHeader: { backgroundColor: '#1976d2', paddingVertical: 32, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  company: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  roleBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  roleText: { color: '#fff', fontSize: 12 },
  menuSection: { backgroundColor: '#fff', marginTop: 12, borderRadius: 12, marginHorizontal: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuIconWrap: { width: 32, alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: '#333', marginLeft: 12 },
  logoutBtn: { marginHorizontal: 12, marginTop: 24, paddingVertical: 14, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#f44336' },
  logoutText: { color: '#f44336', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', color: '#ccc', fontSize: 12, marginTop: 24, marginBottom: 32 },
});
