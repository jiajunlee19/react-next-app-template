import { createBoxType } from "@/app/_actions/box_type";
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";
import Form from "@/app/_components/basic/form";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Template App - Create Box Type',
    description: 'Developed by jiajunlee',
};

export default function CreateBoxType() {
    
    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "Box Type", href: "/box_type", active: false},
                {label: "Create", href: "/box_type/create", active: true}
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
                formAction={createBoxType}
                redirectLink="/box_type"
            />
        </>
    );
};