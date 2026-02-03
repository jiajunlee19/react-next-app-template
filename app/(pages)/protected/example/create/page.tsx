import { createExample } from "@/app/_actions/example";
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";
import Form from "@/app/_components/basic/form";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Create Example',
    description: 'Developed by jiajunlee',
};

export default function CreateExample() {
    
    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "Example", href: "/protected/example", active: false},
                {label: "Create", href: "/protected/example/create", active: true}
            ]} />
            <Form 
                formTitle="Create Box Example"
                inputType={{
                    'example': 'text',
                }}
                rowData={null}
                selectOptionData={null}
                action="create"
                formAction={createExample}
                redirectLink="/protected/example"
            />
        </>
    );
};