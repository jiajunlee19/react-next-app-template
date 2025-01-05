import { createType } from "@/app/_actions/type";
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";
import Form from "@/app/_components/basic/form";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Create Box Type',
    description: 'Developed by jiajunlee',
};

export default function CreateType() {
    
    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "Box Type", href: "/protected/type", active: false},
                {label: "Create", href: "/protected/type/create", active: true}
            ]} />
            <Form 
                formTitle="Create Box Type"
                inputType={{
                    'box_part_number': 'text',
                    'box_max_tray': 'number',
                }}
                rowData={null}
                selectOptionData={null}
                action="create"
                formAction={createType}
                redirectLink="/protected/type"
            />
        </>
    );
};