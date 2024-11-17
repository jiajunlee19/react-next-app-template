# Intro
- This is a template react-next-all built on top of [Next.js](https://nextjs.org/) by [jiajunlee](https://github.com/jiajunlee19). 
- Most important concepts used in this project are described in below sections.
- [Create a new repo with this template](https://github.com/new?template_name=react-next-app-template&template_owner=jiajunlee19)

<br>

# Getting Started
1. Duplicate [.env.template](.env.template) into [.env](.env), and set environment variables there.
2. Initialize by `npm i`, then run the development server by `npm run dev`.
    ```bash
    npm i
    npm run dev
    ```
3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

<br>

# Metadata
1. In the main [layout.tsx](/app/layout.tsx), metadata title template and default are defined.
    ```ts
    import type { Metadata } from 'next';

    export const metadata: Metadata = {
        title: {
            template: '%s | Template App',
            default: 'Template App',
        },
        description: 'Developed by jiajunlee',
        metadataBase: new URL('https://github.com/jiajunlee19'),
    };
    ```
2. Each page.tsx can have its own metadata title, their title will be replacing `%s` defined in main [layout.tsx](/app/layout.tsx).
    ```ts
    // this page title will be "Home | Template App"
    export const metadata: Metadata = {
        title: 'Home',
        description: 'Developed by jiajunlee',
    };
    ```

<br>

# Security
1. While using `target="_blank"` to launch a link in a new tab, it's important to add `rel="noopener noreferrer"` to prevent tabnabbing. 
    ```ts
    <a href="https://github.com/jiajunlee19" target="_blank" rel="noopener noreferrer">
    ```
2. Secrets can be safely stored in `.env` files or `server-side actions`. They will not be sent to client-side.
3. Its important to mark a `server component` to be `Server-only` to prevent the component being accidentally used and exposed to client side.
    ```ts
    import "server-only";

    // your server-only component will throw an error if called in client side
    ```
4. Keep authorization logic check as close as possible to the source-action (eg: Right Before calling server CRUD actions), filtering data based on need-to-principle, before sending over to the client side. 
5. To prevent request overhead and brute-force attacks, use [Rate lLimiting](/app/_libs/rate_limit.ts) techniques to limit the number of requests that can be sent over to the server.
    ```ts
    import { rateLimitByUid, rateLimitByIP } from "@/app/_libs/rate_limit";

    export async function updateUser(formData: FormData | unknown): StatePromise {

        ...

        // Throw error if the user submitted more than 20 requests in 60 seconds
        if (await rateLimitByUid(parsedForm.data.user_uid, 20, 1000*60)) {
            throw new Error('You submitted too many requests ! Try again later !');
        };

        ...
    };
    ```

<br>

# Tailwind CSS Styling
1. Tailwind configs are setup in [tailwind.config.ts](/tailwind.config.ts)
    - To let tailwind knows where to apply tailwind styling, App directory is defined in contents.
        ```js
        content: [
            './pages/**/*.{js,ts,jsx,tsx,mdx}',
            './components/**/*.{js,ts,jsx,tsx,mdx}',
            './app/**/*.{js,ts,jsx,tsx,mdx}',
        ],
        ```
    - `darkMode: class` is added to control toggle between light/dark theme with `className="dark: ..."`.
2. Default base styles are globally applied in [globals.css](/app/globals.css).

<br>

# Global Error Hander
[global-error.tsx](/app/global-error.tsx) is defined to handle global unexpected errors, allow users to retry/refresh the page.

<br>

# Optimizing Font & Images
1. `next/font` module is used to display fonts and it's defined in [layout.tsx](/app/layout.tsx).
    - Font files are downloaded at build time into static assest, minimizing additional network requests.
    - `Antialiased` class is used to smooth out the font touch.
    ```ts
    import { Inter } from 'next/font/google'
    const inter = Inter({ subsets: ['latin'] })

    ...

    <body className={`${inter.className} antialiased`}>

    ...
    ```


2. `next/image` module is used to display images. 
    - It prevents layout shift while images are loading.
    - Images are auto-resizing accordingly on viewport size
    - Images are lazy-loaded as they enter viewport.
    ```
    import Image from "next/image";
    <Image
        src="/desktop.png"
        width={1000}
        height={760}
        className="hidden md:block"
        alt="This is a desktop image"
    />
    ```

<br>

# Improving Accessibility
1. In [form.tsx](/app/_components/basic/form.tsx), aria relations are established to politely notify user when the error is updated.
    ```js
    <input aria-describedby={key+"-error"} ... />
    <p id={key+"-error"} aria-live="polite" ... >
        ...
    </p>
    ```
2. In [package.json](package.json), `"lint": "next lint"`` is added to help catching accessibility issues.
    ```js
    "scripts": {
        ...

        "lint": "next lint"
    },
    ```
3. Run `npm run lint` in terminal to check if there's any accessibility issues to be fixed.

<br>

# Navigating between pages
1. `next/link` is used to navigate between pages without rerendering the whole page.
2. Conditionally render link color to indicate what page the user is currently viewing in [header.tsx](/app/_components/header.tsx).
    ```ts
    import Link from 'next/link';
    import { usePathname } from 'next/navigation';
    import { twMerge } from "tailwind-merge";

    ...

    const pathname = usePathname();

    return (
    <Link key={link.name} 
        className={twMerge("no-underline", (pathname === link.href || pathname === "/") && 
                    "text-purple-500 dark:text-purple-200")} 
        href={link.href}>{link.name}
    </Link>
    );
    ```
3. Similarly, [breadcrumbs.tsx](/app/_components/basic/breadcrumbs.tsx) is used to conditional provide navbar on top of subpages.
    ```
    <main-page-label> / <current-page-label>
    ```
    - Example can be found in [/box_type/create/page.tsx](/app/\(pages\)/box_type/create/page.tsx).

<br>

# Creating dev database for local development
1. For local development, run a local Postgres/LDAP server with docker, defined in [/dev-db/compose.yaml](/dev-db/compose.yaml)
    ```
    docker compose --env-file=../.env up -d
    ```
2. To initialize the LDAP server, run below commands:
    ```bash
    # Create bash shell
    docker exec -it ldap /bin/bash
    
    # Create org unit
    ldapadd -x -w admin -D "cn=admin,dc=company,dc=com" << EOF
    dn: ou=company,dc=company,dc=com
    objectClass: organizationalUnit
    ou: company
    EOF

    # Create user
    ldapadd -x -w admin -D "cn=admin,dc=company,dc=com" << EOF
    dn: cn=user,ou=company,dc=company,dc=com
    objectClass: person
    cn: user
    sn: user
    userPassword: 12345678
    EOF

    # Grant read access to user
    ldapmodify -H ldapi:/// -Y EXTERNAL << EOF
    dn: olcDatabase={1}mdb,cn=config
    changetype: modify
    add: olcAccess
    olcAccess: {2}to * by dn="cn=user,ou=company,dc=company,dc=com" read
    EOF

    # Verify user access
    ldapsearch -x -D "cn=user,ou=company,dc=company,dc=com" -w user -b "dc=company,dc=com"

    # To delete user
    ldapdelete -x -D "cn=admin,dc=company,dc=com" -w admin "cn=user,ou=company,dc=company,dc=com"

    ```
3. Run `npx prisma generate` and `npx prisma db push` to initialize the local database.
4. To visualize the database / schema, run `npx prisma studio` and navigate to [http://localhost:5555/](http://localhost:5555/).
5. See next section on how to seed the database with pre-defined placeholder data.

<br>

# Seeding the database
1. Initial placeholder-data to be loaded is defined in [data_placeholder.js](/app/_scripts/data_placeholder.js).
2. Seed functions are defined in [seed.ts](/app/_scripts/seed.ts). 
    - `Promise.all` is used to initiate all promises and receive all responses at the same time in single transaction.
3. In [package.json](package.json), `"seed": " dotenv -e .env -- npx esrun /app/_script/seed.ts"` is included in scripts.
    ```js
    scripts: {
        ... ,

        "seed": " dotenv -e .env -- npx esrun /app/_script/seed.ts"
    }
    ```
4. Run `npm run seed`
5. The database should be seeded with initial data, result of `console.log` messages should be shown in the terminal. 
    ```
    { success: 'Successfully seed users' }
    { success: 'Successfully seed box_type' }
    { success: 'Successfully seed tray_type' }
    { success: 'Successfully seed shipdocs' }
    { success: 'Successfully seed box' }
    { success: 'Successfully seed trays' }
    { success: 'Successfully seed lots' }
    ```

<br>

# Data fetching with Server Action
1. No API layer is required, server actions can directly query database from server-side.
2. See example on one of the server action [/_actions/box_type.ts](/app/_actions/box_type.ts).
    - CRUD async/await functions are used to execute CRUD operations on database
    - [Prisma](/prisma/prisma.ts) is used as an ORM via `import prisma from '@/prisma/prisma';`
    - `revalidatePath` is used to remove the stored cache and force-fetch the latest data after the CRUD operation.
3. For actions requiring dynamic rendering, `noStore()` is specified to prevent the response from being cached.
    ```ts
    import { unstable_noStore as noStore } from 'next/cache';

    export async function fetch() {
        // This is equivalent to in fetch(..., {cache: 'no-store'}).
        noStore();
        ...
    }
    ```
4. As Server Actions are directly communicating to database, they need to be carefully designed to prevent data leakage and avoid malicious attack.
    - Always treat the input arguments as `unknown` type, they must be sanitized to ensure only those with expected formats are used downstream.
        ```ts
            export async function updateUser(formData: FormData | unknown): StatePromise {

                // Verify input format
                if (!(formData instanceof FormData)) {
                    throw new Error('Invalid input provided !');
                };

                // Verify input data
                const parsedForm = updateUserSchema.safeParse({
                    user_uid: formData.get("user_uid"),
                    password: formData.get("password"),
                });

                if (!parsedForm.success) {
                    return { 
                        error: parsedForm.error.flatten().fieldErrors,
                        message: "Invalid input provided, failed to update user!"
                    };
                };

                // Verify authorization if required
                const session = await getServerSession(options);

                if (!session || (session.user.role !== 'boss' && session.user.user_uid != parsedForm.data.user_uid )) {
                    redirect("/denied");
                }

                // Apply rate-limiting to avoid server overhead or malicious attack
                if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
                    redirect("/tooManyRequests");
                }

                // Good to go ! Now, its safe to execute database actions after all the checks !
            };
        ```

<br>

# Server Action Form & Error Handling
1. See example of server action [/_actions/box_type.ts](/app/_actions/box_type.ts) , flatten field errors are being returned.
    ```ts
        ...

        return { 
        error: parsedForm.error.flatten().fieldErrors,
        message: "Invalid input provided, failed to create box_type!"
    };
    ```
2. In [form.tsx](/app/_components/basic/form.tsx), each form field is handled with `state.error` with the help of `useActionState`.
    ```ts
    import { useActionState } from "react-dom";

    const initialState  = { message: null, errors: {} };
    const [state, dispatch] = useActionState(formAction, initialState);

    ...
    <form>
        ...

        {state.error?.[key] && 
        <p id={key+"-error"} aria-live="polite" className="mb-[2%] font-semibold text-red-500 dark:text-red-500">
            {state.error[key][0]}
        </p>
        }

        ...
    </form>
    ```
3. In [button_submit.tsx](/app/_components/basic/button_submit.tsx), `useFormStatus` is used to conditionally disable the submit button during form submission.
    ```ts
    import {useFormStatus} from 'react-dom';
    ...

    // useFormStatus gives a pending boolean, use this to tell if the button should be disabled or not
    const { pending } = useFormStatus();

        ...
        return (
            <button className={buttonClass} type="submit" disabled={pending} onClick={onButtonClick}>
                {pending ? submitingButtonTitle : buttonTitle}
            </button>
        );

    ...
    ```

<br>

# State Management with SearchParams
1. Instead of managing state using `useState`, `useSearchParams` is used to manage state embedded in url.
    - User can save the current state by bookmarking the url for revisit or share to other users.
    - User can navigate pages back or forth.
    - URL parameters are directly comsumed on server-side, making it easier to render the page's initial state.
2. The user input is always keep in-sync with the URL SearchParams.
    ```ts
    import { useSearchParams, usePathname, useRouter } from "next/navigation";

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        // URLSearchParams is used for manipulating the URL query parameters
        const params = new URLSearchParams(searchParams);

        // set params with value and delete params if no value
        if (e.target.value) {
            params.set('query', e.target.value);
        }
        else {
            params.delete('query');
        }

        // replace url with params, without refreshing the page
        replace(`${pathname}?${params.toString()}`)

    };

    ...
        <input ... defaultValue={params.get('query')?.toString()} />
    ...
    ```
    - Example can be found in [/restricted/auth/updateRoleByUsername/component.tsx](/app/\(pages\)/restricted/auth/updateRoleByUsername/component.tsx).

<br>

# Debouncing Technique
1. We do not want to send query the database on every keystroke, to save database resource and optimize performance.
2. Deboucing technique is a good practice that limits the rate at which a function can fire.
3. `use-debounce` is used here. The function will only fire when either of the below conditions are met.
    - the user has stop typing for a specific duration
    - the input field losses focus or become blur
    ```ts
    <input ... onBlur={handleInputChange} onChange={useDebouncedCallback(handleInputChange, 1000)} />
    ```

<br>

# Streaming / Partial-Rendering
1. Without streaming, the page is as fast as your slowest data load.
    - Simulate slow data loading with `await new Promise((resolve) => setTimeout(resolve, 3000));`.
    - The page will only loads when all required data in the page is loaded.
2. Streaming is implemented to prevent slow data requests from blocking your whole page
    - [loading.tsx](/app/loading.tsx) is built on top of Suspense, which fallback to a skeleton UI while page content is loading.
    - To be more granular to stream specific components, the specific components can be wrapped with Suspense fallback to [skeletons.tsx](/app/_components/basic/skeletons.tsx).
        ```ts
        import { Suspense } from 'react';
        ...

        <Suspense fallback={<>Loading</>}>
            ...
        </Suspense>
        ```
    - It is a good practice to move data fetching down to the components that need it, to stream specific component granularly.

<br>

# Pagination
1. Page list is generated with `generatePagination` defined in [pagination.ts](/app/_libs/pagination.ts)
    - If totalPage <= 7, show [1, 2, 3, 4, 5, 6, 7]
    - If totalPage > 7 and currentPage is within first 3 page, show like [1, 2, 3, ..., 9, 10]
    - If totalPage > 7 and currentPage is within the last 3 pages, show like [1, 2, ..., 8, 9, 10]
    - If totalPage > 7 and currentPage is somewhere in the middle, show like [1, ..., 4, 5, 6, ..., 10]
2. Page nav component is generated in [pagination.tsx](/app/_components/basic/pagination.tsx).
3. Pagination is achieved by getting `currentPage` from searchParams and `totalPage` from server action.
    ```ts
        export default async function BoxType(
            props: { searchParams?: Promise<{ itemsPerPage?: string, currentPage?: string, query?: string }> }
        ) {
            const searchParams = await props.searchParams;

            const itemsPerPage = Number(searchParams?.itemsPerPage) || 10;
            const currentPage = Number(searchParams?.currentPage) || 1;
            const query = searchParams?.query || undefined;

            const totalPage = await readBoxTypeTotalPage(itemsPerPage, query);

        ...

        return (
            <>
                ...
                <Pagination totalPage={totalPage} />
            </>
        );
    };
    ```

<br>

# Search Query
1. Search query is achieved by getting `query` from searchParams.
    ```ts
    export default async function BoxType(
        props: { searchParams?: Promise<{ ... query?: string }> }
    ) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || undefined;

    ...
    }
    ```
2. In server actions, query is passed as argument. The search is implemeneted with `FullTextSearch` for `prisma` or `like` for `raw query`.
3. See examples in [_actions/box_types.ts](/app/_actions/box_types.ts) and [/box_type/page.tsx](/app/\(pages\)/box_type/page.tsx).

<br>

# Authentication & Authorization
1. Authentication is enabled with nextAuth.
    - Options are defined in [nextAuth_options.ts](/app/_libs/nextAuth_options.ts).
    - API Handler are defined in [/api/auth/[...nextauth]/route.ts](/app/api/auth/[...nextauth]/route.ts).
2. To use nextAuth, [layout.tsx](/app/layout.tsx) is wrapped with [auth_provider](/app/_components/auth_provider.tsx).
    ```
    import AuthProvider from '@/app/_components/auth_provider'
    import { getServerSession } from "next-auth/next"
    import { options } from '@/app/_libs/nextAuth_options'

    ...ts
    const session = await getServerSession(options);

        ...
        <AuthProvider session={session}>
            {children}
        </AuthProvider>
        
        ...
    ```
3. Each specified page/routes are protected by [middleware.ts](middleware.ts). Keep in mind that middleware are typically used for protecting routes. For public endpoint protection, you should also perform authorization check before calling the server actions.
    ```ts
    export const config = { matcher: ["/protected/:path*", "/restricted/:path*"] }
    ```
4. Authorization is also defined in [middleware.ts](middleware.ts) with `role`.
    - User without logging in has no access to generic contents, except url start with `"/authenticated"`, `"/protected"` and `"/restricted"`.
    - User with `role="user"` has access to all contents, except url start with `"/protected"` and `"/restricted"`.
    - User with `role="admin"` has access to all contents, except url start with `"/restricted"`.
    - User with `role="boss"` has access to all contents.
    ```ts
    if (request.nextUrl.pathname.startsWith("/authenticated")
        && !request.nextauth.token)
    {
        return NextResponse.rewrite(
            new URL("/denied", request.url)
        )
    }

    if (request.nextUrl.pathname.startsWith("/protected")
        && request.nextauth.token?.role !== "admin"
        && request.nextauth.token?.role !== "boss")
    {
        return NextResponse.rewrite(
            new URL("/denied", request.url)
        )
    }

    if (request.nextUrl.pathname.startsWith("/restricted")
            && request.nextauth.token?.role !== "boss") 
        {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }
    ```
5. Sign Up Page is defined in [/auth/signUp/page.tsx](/app/\(pages\)/auth/signUp/page.tsx).
6. Sign In Page is defined in [/auth/signIn/page.tsx](/app/\(pages\)/auth/signIn/page.tsx).
7. Sign Out Page is defined in [/auth/signOut/page.tsx](/app/\(pages\)/auth/signOut/page.tsx).
8. New user are defaulted as `role="user"`.
9. User with `role="admin"` can update any user's role to `user` or `admin` in [/protected/auth/updateRoleByUsername/page.tsx](/app/\(pages\)/protected/auth/updateRoleByUsername/page.tsx).
10. User with `role="boss"` can view all users in [/restricted/auth/user/page.tsx](/app/\(pages\)/restricted/auth/user/page.tsx).
11. User with `role="boss"` can update any user's role in [/restricted/auth/user/[user_uid]/updateRole/page.tsx](/app/\(pages\)/restricted/auth/user/[user_uid]/updateRole/page.tsx) or [/restricted/auth/updateRoleByUsername/page.tsx](/app/\(pages\)/restricted/auth/updateRoleByUsername/page.tsx).

<br>

# Learn More
To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Next.js GitHub repository](https://github.com/vercel/next.js/) - check out Next.js repo.

<br>

# Deploy on Vercel
The easiest way to deploy the Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

<br>

# Containerize with Docker
1. Configure `standalone` output in [next.config.js](/next.config.js)
    ```js
    const nextConfig = {
        output: 'standalone',
    }
    ```
2. [Dockerfile](/Dockerfile) is created to build docker image. 
    - It uses multi-stage concept (base -> deps -> builder -> runner) and pass only relevant files between stages.
    - Production image generated from runner stage, contains only the necessary files needed to run the app.
    - Instead of the `root` user, the production image will be run as a normal privileged `nextjs` user.

3. [compose.yaml](/compose.yaml) is created to easily manage docker run process (including network creation, container creation etc.)
    - Use `docker compose --env-file .env up -d` to startup the docker container.
    - Use `docker compose down` to shutdown the docker container.

<br>

# CI/CD with Jenkins
Jenkins is a DevOps tool. Jenkins pipeline can be designed to automate the install/build/deploy process, triggered by dedicated events. 

Check out the [jenkins-template](https://github.com/jiajunlee19/jenkins-template).

<br>

# Others
1. [https://erd.dbdesigner.net/](https://erd.dbdesigner.net/) is a useful database schema diagram creating tool.
2. [https://draw.io/](https://draw.io/) is a useful flowchart creating tool.