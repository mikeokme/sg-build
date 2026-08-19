import * as crypto from 'crypto';

// 会话级 AES-256-GCM 对称加密
// 密钥由全局密钥 + 会话ID 派生，实现"每条会话独立密钥"
const APP_SECRET = process.env.CHAT_SECRET || 'sgbuild-chat-secret-key-2026';

function deriveKey(conversationId: string): Buffer {
  return crypto.createHash('sha256').update(`${APP_SECRET}:${conversationId}`).digest();
}

export function encryptMessage(conversationId: string, content: string): string {
  const key = deriveKey(conversationId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decryptMessage(conversationId: string, payload: string): string {
  try {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    const key = deriveKey(conversationId);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return '[无法解密的消息]';
  }
}

// ── 指定接收人加密：使用随机密码派生密钥 ──
function deriveKeyFromPassword(password: string): Buffer {
  return crypto.createHash('sha256').update(`sgbuild-secret:${password}`).digest();
}

export function encryptWithPassword(password: string, content: string): string {
  const key = deriveKeyFromPassword(password);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decryptWithPassword(password: string, payload: string): string {
  try {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    const key = deriveKeyFromPassword(password);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return '[密码错误或无法解密]';
  }
}

export function generateSecretPassword(): string {
  // 10 位数字+字母，便于复制
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[crypto.randomInt(chars.length)];
  return pwd;
}
