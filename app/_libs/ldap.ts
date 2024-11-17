import { parsedEnv } from '@/app/_libs/zod_env';
import ldap from 'ldapjs';

console.log('creating client')
const ldap_client = ldap.createClient({
    // ldap://localhost:389/ou=company,dc=company,dc=com
    url: parsedEnv.LDAP_URL,
});

export default ldap_client;