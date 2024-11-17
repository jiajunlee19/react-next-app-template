import { parsedEnv } from '@/app/_libs/zod_env';
import ldap from 'ldapjs';

const ldapClientSingleton = () => {
    console.log('creating client')
    return ldap.createClient({
        // ldap://localhost:389/ou=company,dc=company,dc=com
        url: parsedEnv.LDAP_URL,
    });
  }
  
  type ldapClientSingleton = ReturnType<typeof ldapClientSingleton>
  
  const globalForLDAP = globalThis as unknown as {
    ldap_client: ldapClientSingleton | undefined
  }
  
  const ldap_client = globalForLDAP.ldap_client ?? ldapClientSingleton()
  
  export default ldap_client
  
  if (process.env.NODE_ENV !== 'production') globalForLDAP.ldap_client = ldap_client