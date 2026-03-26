import { createWidget } from "@/app/_actions/widget";
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";
import Form from "@/app/_components/basic/form";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Create Widget',
    description: 'Developed by jiajunlee',
};

export default function CreateWidget() {
    
    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "Widget", href: "/authenticated/widget", active: false},
                {label: "Create", href: "/protected/widget/create", active: true}
            ]} />
            <Form 
                formTitle="Create Widget"
                inputType={{
                    'widget_name': 'text',
                    'widget_description': 'text',
                    'widget_group': 'text',
                    'widget_href': 'text',
                    'widget_tabs': 'text',
                    'widget_owners': 'text',
                    'widget_viewers': 'text',
                }}
                rowData={null}
                selectOptionData={null}
                action="create"
                formAction={createWidget}
                redirectLink="/authenticated/widget"
            />
        </>
    );
};