"server-only"

import { parsedEnv } from "@/app/_libs/zod_env";
import ldap_client from '@/app/_libs/ldap';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'; 

export async function getGroupsLDAPService(group: string) {
    "use cache"
    cacheLife("hours");
    cacheTag("checkIfUserInGroups");

    const searchResult = await ldap_client.search(parsedEnv.LDAP_GROUP_BASE_DN, {
        scope: 'sub',
        filter: `cn=${group}`,
        attributes: ["dn", "cn", "uniqueMember", "owner", "contactusername"],
        sizeLimit: 1,
    });

    return searchResult;
};