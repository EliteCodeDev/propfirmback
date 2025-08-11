import * as bcrypt from 'bcrypt';

export class BcryptUtil {
  static async hash(password: string): Promise<string> {
    console.log('🔐 BCRYPT HASH - Input password length:', password?.length);
    const hash = await bcrypt.hash(password, 12);
    console.log('🔐 BCRYPT HASH - Generated hash:', hash);
    return hash;
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    console.log('🔐 BCRYPT COMPARE - Starting comparison');
    console.log('🔐 Input password:', password);
    console.log('🔐 Input password length:', password?.length);
    console.log('🔐 Input hash:', hash);
    console.log('🔐 Input hash length:', hash?.length);
    
    if (!password || !hash) {
      console.log('❌ BCRYPT COMPARE - Missing password or hash');
      return false;
    }

    try {
      const result = await bcrypt.compare(password, hash);
      console.log('🔐 BCRYPT COMPARE - Result:', result);
      return result;
    } catch (error) {
      console.error('❌ BCRYPT COMPARE - Error during comparison:', error);
      return false;
    }
  }
}