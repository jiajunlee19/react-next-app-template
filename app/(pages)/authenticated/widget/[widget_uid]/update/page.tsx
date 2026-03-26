import { readWidgetByUid, updateWidget } from "@/app/_actions/widget";
import Form from "@/app/_components/basic/form";
import { notFound } from 'next/navigation';
import type { Metadata } from 'next'
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";

export const metadata: Metadata = {
    title: 'Update Widget',
    description: 'Developed by jiajunlee',
};

export default async function UpdateWidget(props: {params: Promise<{widget_uid: string}>}) {
    const params = await props.params;

    const widget_uid = params.widget_uid;

    let widget;
    try {
        [widget] = await Promise.all([
            readWidgetByUid(widget_uid)
        ]);
    } catch (err) {
        widget = null; 
    }

    if (!widget) {
        notFound();
    }

    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "Widget", href: "/authenticated/widget", active: false},
                {label: `Update ${widget_uid}`, href: `/authenticated/widget/${widget_uid}/update`, active: true}
            ]} />
            <Form 
                formTitle="Update Widget"
                inputType={{
                    'widget_uid': 'hidden',
                    'widget_name': 'text',
                    'widget_description': 'text',
                    'widget_group': 'text',
                    'widget_href': 'readonly',
                    'widget_tabs': 'text',
                    'widget_owners': 'text',
                    'widget_viewers': 'text',
                }}
                rowData={{
                    ...widget,
                    widget_tabs: widget.widget_tabs ? JSON.stringify(widget.widget_tabs) : '',
                    widget_owners: widget.widget_owners ? widget.widget_owners.join(',') : '',
                    widget_viewers: widget.widget_viewers ? widget.widget_viewers.join(',') : '',
                }}
                selectOptionData={null}
                action="update"
                formAction={updateWidget}
                redirectLink="/authenticated/widget"
            />
        </>
    );
};