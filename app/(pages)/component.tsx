"use client"

import Link from "next/link";
import { widgets } from "@/app/_libs/widgets";
import { useMemo, useState } from "react";

export function HomeComponent() {

    const [groupFilter, setGroupFilter] = useState("all");
    const [search, setSearch] = useState("");

    // Get unique groups from widgets: ["GROUP1", "GROUP2", ...]
    const uniqueGroups = useMemo(() => {
        const groups = widgets.map(widget => widget.group);
        return [...new Set(groups)];
    }, []);

    // Group widgets into {"GROUP1": [{name: "Example", group: "GROUP1"}]}
    const groupedWidgets = useMemo(() => {
        const grouped: {[key: string]: typeof widgets} = {};
        widgets.forEach(widget => {
            if (!grouped[widget.group]) {
                grouped[widget.group] = [];
            }
            grouped[widget.group].push(widget);
        })
        return grouped;
    }, []);
    
    return (
        <>
            <h2>Home</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Filter by Group */}
                <div>
                    <label>Widget Filter By Group</label>
                    <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                        <option value="all">-- Show All --</option>
                        {uniqueGroups.map((group) => (
                            <option key={group} value={group}>{group}</option>
                        ))}
                    </select>
                </div>

                {/* Widget Search */}
                <div>
                    <label>Quick Widget Search</label>
                    <input type="text" placeholder="-- Search by widget name --" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            {Object.entries(groupedWidgets).filter(([group]) => groupFilter === "all" || group === groupFilter).map(([group, groupWidgets]) => (
                <div key={group} className="border rounded-sm border-black dark:border-white p-4">
                    {/* Collapsible Group */}
                    <details open>
                        <summary className="text">{group}</summary>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
                            {groupWidgets.filter((widget) => widget.name.toLowerCase().includes(search.toLowerCase()) || widget.description.toLowerCase().includes(search.toLowerCase())).map((widget) => (
                                <Link key={widget.href} href={widget.href} className="no-underline border rounded-lg border-black dark:border-white px-2 pb-2">
                                    <h3>{widget.name}</h3>
                                    <p>{widget.description}</p>
                                </Link>
                            ))}
                        </div>
                    </details>
                </div>
            ))}
        </>
    );
};