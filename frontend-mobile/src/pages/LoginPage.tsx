import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useAppStore } from '../store';
import { authApi } from '../api';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAppStore((s) => s.login);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const res: any = await authApi.login(username, password);
      if (res.accessToken) {
        const user = {
          id: res.sub,
          username: res.username,
          email: '',
          company: 'SG-Build建设有限公司',
          role: res.role || 'employee',
        };
        login(res.accessToken, user);
        onLogin();
      } else {
        Alert.alert('登录失败', res.message || '用户名或密码错误');
      }
    } catch (e: any) {
      Alert.alert('登录失败', e.response?.data?.message || '网络错误，请检查后端服务');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SG</Text>
        </View>
        <Text style={styles.title}>SG-Build</Text>
        <Text style={styles.subtitle}>智慧施工管理系统</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>用户名</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="请输入用户名"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>密码</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="请输入密码"
          placeholderTextColor="#999"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>登 录</Text>}
        </TouchableOpacity>

        <Text style={styles.hint}>默认账号: admin / admin123</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logoSection: { alignItems: 'center', marginBottom: 48 },
  logo: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#1976d2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#999', marginTop: 4 },
  form: { width: '100%' },
  label: { fontSize: 14, color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fafafa', fontSize: 16, color: '#333' },
  button: { backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { backgroundColor: '#90caf9' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 16 },
});
