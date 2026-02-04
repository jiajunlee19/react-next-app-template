'use client'

import { HomeIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline"
import { useSession } from "next-auth/react"
import { useMemo, useState } from "react";
import Link from "next/link";
import SearchBar from "@/app/_components/basic/search_bar";
import { usePathname } from "next/navigation"
import { twMerge } from "tailwind-merge";
import { CrossIcon, DarkIcon, HamburgerIcon, LightIcon, SearchIcon } from "@/app/_components/basic/icons";
import { useThemeContext } from "@/app/_context/theme-context";
import { widgets } from "../_libs/widgets";

export default function Header() {

    const { data: session } = useSession();

    const leftNavLinks = [
        { name: "Home", href: "/", icon: <HomeIcon className="h-6" /> },
    ];

    const midNavLinks = [
        { name: "Help", href: "/help", icon: <QuestionMarkCircleIcon className="h-6" /> },
    ];

    const rightNavLinksA = [
        { name: session?.user.role === "user" ? session?.user.username : session?.user.username + " (Admin)", href: "/auth/user/" + session?.user.user_uid, icon: "" },
        { name: "Sign Out", href: "/auth/signOut", icon: "" },
    ];

    const rightNavLinksB = [
        { name: "Sign In", href: "/auth/signIn", icon: "" },
        // { name: "Sign Up", href: "/auth/signUp", icon: "" },
    ];

    const sideNavLinks = [
        { name: "Home", href: "/", icon: "" },
        { name: "Example", href: "/authenticated/example", icon: "" },
    ];

    const sideNavLinksProtected = [
        { name: "User List", href: "/protected/auth/user", icon: "" },
    ];

    const sideNavLinksRestricted = [
        { name: "User List", href: "/restricted/auth/user", icon: "" },
    ];

    const pathname = usePathname();

    const [isShowNav, setIsShowNav] = useState(false);

    // Find current widget and its tabs based on pathname
    const currentWidget = useMemo(() => {
        for (const widget of widgets) {
            if (pathname.startsWith(widget.href)) {
                return widget;
            }
        }
        return null;
    }, [pathname])

    const handleNavClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsShowNav(!isShowNav);
    };
    
    const handleResize = () => {
        setIsShowNav(false);
    };
    typeof window !== "undefined" && window.addEventListener("resize", handleResize);
    
    const {darkMode, setDarkMode} = useThemeContext();

    const handleThemeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setDarkMode(!darkMode);
    };

    return (

        <>
            <div className="contents lg:block lg:w-64 lg:px-6 lg:pb-8 lg:pt-4 xl:w-72">
                {/* Left nav block thats only appear when > lg */}
                <div className="hidden lg:block">
                    <nav className="flex gap-5 items-center">
                        {leftNavLinks.map((link) => {
                            return (
                                <Link key={link.name} className={twMerge("no-underline", (pathname === link.href || pathname === "/") && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>
                                    {link.icon ? link.icon : link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Border lines that only appears when > lg */}
                    {/* Top Left Horizontal Border line */}
                    {/* Left Vertical Border Line */}
                    <div className="absolute inset-x-0 top-14 h-1 transition bg-zinc-900 dark:bg-white lg:w-64 xl:w-72" />
                    <div className="absolute inset-y-0 w-1 h-full transition bg-zinc-900 dark:bg-white lg:left-64 xl:left-72" />
                </div>
                
                {/* Flexbox for entire header row, offset left by 64 for lg, offset left by 72 for xl */}
                <div className="flex fixed inset-x-0 top-0 h-14 items-center justify-between gap-12 px-4 transition lg:left-64 xl:left-72 bg-white dark:bg-zinc-900">
                    
                    {/* Top Horizontal Border Line */}
                    <div className="absolute inset-x-0 top-full h-1 transition bg-zinc-900 dark:bg-white" />

                    {/* Left nav bar that only appears when > lg */}
                    <div className="flex gap-5 items-center lg:hidden">
                        {!isShowNav ? 
                            <button type="button" className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/50 dark:hover:bg-white/50" aria-label="Toggle navigation" onClick={handleNavClick}>
                                <HamburgerIcon className="w-2.5 stroke-zinc-900 dark:stroke-white" />
                            </button>
                            :
                            <button type="button" className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/50 dark:hover:bg-white/50" aria-label="Toggle navigation" onClick={handleNavClick}>
                                <CrossIcon className="w-2.5 stroke-zinc-900 dark:stroke-white" />
                            </button>
                        }
                        <nav className="flex items-center gap-4">
                            {leftNavLinks.map((link) => {
                                return (
                                    <Link key={link.name} className={twMerge("no-underline", (pathname === link.href || pathname === "/") && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>{link.icon ? link.icon : link.name}</Link>
                                );
                            })}

                            {/* Divider between Home and Widget */}
                            {currentWidget && <div className="flex-shrink-0 block h-5 w-px bg-zinc-900 dark:bg-white" />}

                            {/* Dynamically show current widget */}
                            {currentWidget && <Link key={currentWidget.name} href={currentWidget.href} className={twMerge("no-underline", (pathname === currentWidget.href) && "font-semibold text-purple-500 dark:text-purple-200")}>{currentWidget.name}</Link>}

                            {/* Divider between Widget and Tabs */}
                            {currentWidget && currentWidget.tabs && currentWidget.tabs.length > 0 && <div className="flex-shrink-0 block h-5 w-px bg-zinc-900 dark:bg-white" />}

                            {/* Dynamic tabs between leftNav and middleNav */}
                            <div>
                                {currentWidget && currentWidget.tabs && currentWidget.tabs.length > 0 && (
                                    <nav className="flex items-center gap-4 overflow-x-auto">
                                        {currentWidget.tabs.map((tab) => {
                                            return (
                                                <Link key={tab.name} href={tab.href} className={twMerge("no-underline", (pathname === tab.href) && "font-semibold text-purple-500 dark:text-purple-200")}>
                                                    {tab.name}
                                                </Link>
                                            )
                                        })}
                                    </nav>
                                )}
                            </div>
                        </nav>
                    </div>

                    {/* placeholder div to keep left and right spaced apart (can replace this with a SearchBar if needed) */}
                    <div></div>

                    {/* Flexbox for middleNav and rightNav */}
                    <div className="flex items-center gap-5">
    
                        {/* middleNav that only appears when > md */}
                        <nav className="hidden md:flex md:items-center md:gap-8">
                            {midNavLinks.map((link) => {
                                return (
                                    <Link key={link.name} className={twMerge("no-underline", pathname === link.href && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>
                                        {link.icon ? link.icon : link.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Divider between middleNav and rightNav, only appears when > md */}
                        <div className="hidden md:block md:h-5 md:w-px md:bg-zinc-900 md:dark:bg-white" />

                        {/* Flexbox for icons between middleNav and rightNav */}
                        <div className="flex gap-4">
                            {/* Theme Icon */}  
                            <button type="button" className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/50 dark:hover:bg-white/50" aria-label="Toggle theme" onClick={handleThemeClick}>
                                <LightIcon className="h-5 w-5 stroke-zinc-900 dark:hidden" />
                                <DarkIcon className="hidden h-5 w-5 stroke-white dark:block" />
                            </button>
                        </div>

                        {/* rightNav that only appears when > sm */}
                        <div className="hidden sm:contents">
                            <>
                                {(session ? rightNavLinksA : rightNavLinksB).map((link) => {
                                    return (
                                        <Link key={link.name} className={twMerge("no-underline", pathname === link.href && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>
                                            {link.icon ? link.icon : link.name}
                                        </Link>
                                    );
                                })}
                            </>
                        </div>

                    </div>
                </div>

                {/* Left nav block that only appears after hamburger is clicked */}
                <nav className={isShowNav ? 
                    "max-lg:fixed max-lg:z-20 max-lg:bg-white max-lg:top-16 max-lg:right-0 max-lg:bottom-0 max-lg:left-4 max-lg:w-56 max-lg:mb-14 max-lg:overflow-y-scroll lg:block lg:mt-10 dark:bg-zinc-900" 
                    : 
                    "hidden lg:block lg:mt-10"
                    }>

                    {/* Dynamic sideNavs for current widget */}
                    {currentWidget && currentWidget.tabs && currentWidget.tabs.length > 0 ? (
                        <li>
                            <h2>{currentWidget.name}</h2>
                            <div className="relative my-3 pl-2">
                                <div className="absolute inset-x-0 top-0 h-16 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5 origin-[50%_50%_1px]" />
                                <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/50 transform-none origin-[50%_50%_1px]" />
                                <ul role="list">
                                    {currentWidget.tabs.map((link) => {
                                        return (
                                            <li key={link.name} className="relative">
                                                <Link key={link.name} className={twMerge("no-underline py-1 pl-4 pr-3 truncate", pathname === link.href && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>
                                                    {link.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </li>
                    ) :
                    (
                        // Default to landing page if no widget is selected yet
                        <li>
                            <h2>Landing Page</h2>
                            <div className="relative my-6 pl-2">
                                <div className="absolute inset-x-0 top-0 h-16 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5 origin-[50%_50%_1px]" />
                                <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/50 transform-none origin-[50%_50%_1px]" />
                            </div>
                        </li>
                    )}


                    <li>
                        {(session?.user.role === 'admin' || session?.user.role === 'boss') &&
                        <>
                            <h2>Protected Actions</h2>
                            <div className="relative my-3 pl-2">
                                <div className="absolute inset-x-0 top-0 h-16 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5 origin-[50%_50%_1px]" />
                                <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/50 transform-none origin-[50%_50%_1px]" />
                                <ul role="list">
                                    {sideNavLinksProtected.map((link) => {
                                        return (
                                            <li key={link.name} className="relative">
                                                <Link key={link.name} className={twMerge("no-underline py-1 pl-4 pr-3 truncate", pathname === link.href && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>
                                                    {link.icon ? link.icon : link.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </>
                        }

                        {session?.user.role === 'boss' &&
                        <>
                            <h2>Restricted Actions</h2>
                            <div className="relative my-3 pl-2">
                                <div className="absolute inset-x-0 top-0 h-16 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5 origin-[50%_50%_1px]" />
                                <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/50 transform-none origin-[50%_50%_1px]" />
                                <ul role="list">
                                    {sideNavLinksRestricted.map((link) => {
                                        return (
                                            <li key={link.name} className="relative">
                                                <Link key={link.name} className={twMerge("no-underline py-1 pl-4 pr-3 truncate", pathname === link.href && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>
                                                    {link.icon ? link.icon : link.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </>
                        }
                    </li>

                    <li className="pt-3 md:hidden">
                        <h2>Links</h2>
                        <div className="relative my-3 pl-2">
                            <div className="absolute inset-x-0 top-0 h-16 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5 origin-[50%_50%_1px]" />
                            <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/50 transform-none origin-[50%_50%_1px]" />
                            <ul role="list">
                                {midNavLinks.map((link) => {
                                    return (
                                        <li key={link.name} className="relative">
                                            <Link key={link.name} className={twMerge("no-underline py-1 pl-4 pr-3 truncate", pathname === link.href && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>
                                                {link.icon ? link.icon : link.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </li>
                        
                    <li className="pt-3 sm:hidden">
                        <h2>Auth</h2>
                        <div className="relative pl-2 my-3 bottom-0">
                            <div className="absolute inset-x-0 top-0 h-16 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5 origin-[50%_50%_1px]" />
                            <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/50 transform-none origin-[50%_50%_1px]" />
                            <ul role="list">
                                {(session ? rightNavLinksA : rightNavLinksB).map((link) => {
                                    return (
                                        <li key={link.name} className="relative">
                                            <Link key={link.name} className={twMerge("no-underline py-1 pl-4 pr-3 truncate", pathname === link.href && "font-semibold text-purple-500 dark:text-purple-200")} href={link.href}>
                                                {link.icon ? link.icon : link.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </li>
                </nav>
            </div>
        </>
    );
}; 