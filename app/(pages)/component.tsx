"use client"

import Link from "next/link";
import { widgets } from "@/app/_libs/widgets";
import { useMemo, useState, useEffect } from "react";
import { type TReadWidgetSchema } from "@/app/_libs/zod_server";

export function HomeComponent({ baseUrl }: { baseUrl: string }) {

    const [widgets, setWidgets] = useState<TReadWidgetSchema[]>([]);
    useEffect(() => {
        const fetchWidgets = async () => {
            try {
                const res = await fetch(`${baseUrl}/api/readWidgets`);
                const data = await res.json();
                setWidgets(data.widgets ?? []);
            } catch {
                setWidgets([]);
            }
        };
        fetchWidgets();
    }, [baseUrl]);

    const [groupFilter, setGroupFilter] = useState("all");
    const [search, setSearch] = useState("");

    // Get unique groups from widgets: ["GROUP1", "GROUP2", ...]
    const uniqueGroups = useMemo(() => {
        const groups = widgets.map(widget => widget.widget_group);
        return [...new Set(groups)];
    }, [widgets]);

    // Group widgets into {"GROUP1": [{name: "Example", group: "GROUP1"}]}
    const groupedWidgets = useMemo(() => {
        const grouped: {[key: string]: typeof widgets} = {};
        widgets.forEach(widget => {
            if (!widget.widget_group) return;
            if (!grouped[widget.widget_group]) {
                grouped[widget.widget_group] = [];
            }
            grouped[widget.widget_group].push(widget);
        })
        return grouped;
    }, [widgets]);
    
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
                            {groupWidgets.filter((widget) => (widget.widget_name ?? "").toLowerCase().includes(search.toLowerCase()) || (widget.widget_description ?? "").toLowerCase().includes(search.toLowerCase())).map((widget) => (
                                <Link key={widget.widget_href} href={widget.widget_href ?? "#"} className="no-underline border rounded-lg border-black dark:border-white px-2 pb-2">
                                    <h3>{widget.widget_name}</h3>
                                    <p>{widget.widget_description}</p>
                                </Link>
                            ))}
                        </div>
                    </details>
                </div>
            ))}
        </>
    );
};