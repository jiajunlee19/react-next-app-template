This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

<br>

# Tailwind CSS Styling
1. Tailwind configs are setup in [tailwin.config.ts](/tailwind.config.ts)
    - To let tailwind knows where to apply tailwind styling, App directory is defined in contents.
        ```
        contents: {
            ... ,

            './app/**/*.{js,ts,jsx,tsx,mdx
        }'
        ```
    - `darkMode: class` is added to control toggle between light/dark theme with `className="dark: ..."`.
2. [globals.css](/app/globals.css)

<br>

# Optimizing Font & Images
1. `next/font` module is used to display fonts and it's defined in [layout.tsx](/app/layout.tsx).
    - Font files are downloaded at build time into static assest, minimizing additional network requests.
    - `Antialiased` class is used to smooth out the font touch.
    ```
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

# Seed the database
1. Initial placeholder-data to be loaded is defined in [data_placeholder.js](app/_scripts/data_placeholder.js).
2. Seed functions are defined in [seed.ts](app/_scripts/seed.ts).
3. In [package.json](package.json), `"seed": " dotenv -e .env -- npx esrun ./app/_script/seed.ts"` is included in scripts.
    ```
    scripts: {
        ... ,

        "seed": " dotenv -e .env -- npx esrun ./app/_script/seed.ts"
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