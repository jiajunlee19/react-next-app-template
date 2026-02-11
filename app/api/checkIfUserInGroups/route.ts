import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIP } from "@/app/_libs/rate_limit";
import { parsedEnv } from '@/app/_libs/zod_env';
import { groupsUserSchema } from '@/app/_libs/zod_auth';
import ldap_client from '@/app/_libs/ldap';
import { getErrorMessage } from '@/app/_libs/error_handler';

export async function POST(request: NextRequest) {
    try {
        const { groups, username } = await request.json();

        const parsedForm = groupsUserSchema.safeParse({
            groups: groups,
            username: username,
        });

        if (!parsedForm.success) {
            return NextResponse.json({
                error: parsedForm.error.flatten().fieldErrors,
                message: "Invalid input provided, failed to check if user in groups!"
            }, { status: 400 });
        }

        if (await rateLimitByIP(5, 1000*60)) {
            return { 
                error: {error: ["Too many requests, try again later."]},
                message: "Too many requests, try again later."
            };
        }

        const results = await Promise.all(parsedForm.data.groups.map(async (group) => {
            try {
                const searchResult = await ldap_client.search(parsedEnv.LDAP_GROUP_BASE_DN, {
                    scope: 'sub',
                    filter: `cn=${group}`,
                    attributes: ["dn", "cn", "uniqueMember", "owner", "contactusername"],
                    sizeLimit: 1,
                });

                // Return false if group is not found
                if (searchResult.searchEntries.length <= 0 || !("uniqueMember" in searchResult.searchEntries[0])) {
                    return { group: group, isMember: false };
                }

                const uniqueMember = searchResult.searchEntries[0]["uniqueMember"];
                const members = Array.isArray(uniqueMember) ? uniqueMember : [uniqueMember];

                // Extract uid and check if the user is part of the member
                const memberUids = members.map(memberDN => {
                    const uidMatch = memberDN.toString().match(/^uid=([^,]+)/);
                    return uidMatch ? uidMatch[1].toLowerCase() : null
                }).filter(uid => uid !== null);

                return { group: group, isMember: memberUids.includes(parsedForm.data.username) };

            } catch (error) {
                return { group: group, isMember: false };
            }
        }));

        const groupMembership: { [groupName: string]: boolean } = {};
        results.forEach(({group, isMember}) => {
            groupMembership[group] = isMember;
        });

        return NextResponse.json({
            isUserInGroups: results.some(({isMember}) => isMember),
            groupMembership: groupMembership,
        });

    } catch (error) {
        await ldap_client.unbind();
        return NextResponse.json({
            error: {error: [getErrorMessage(error)]},
            message: getErrorMessage(error),
        }, { status: 500 });
    }
};