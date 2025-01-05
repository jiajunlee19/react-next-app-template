import { readTypeById, updateType } from "@/app/_actions/type";
import Form from "@/app/_components/basic/form";
import { notFound } from 'next/navigation';
import type { Metadata } from 'next'
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";

export const metadata: Metadata = {
    title: 'Update Box Type',
    description: 'Developed by jiajunlee',
};

export default async function UpdateType(props: {params: Promise<{type_uid: string}>}) {
    const params = await props.params;

    const type_uid = params.type_uid;

    let type;
    try {
        [type] = await Promise.all([
            readTypeById(type_uid)
        ]);
    } catch (err) {
        type = null; 
    }

    if (!type) {
        notFound();
    }

    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "Box Type", href: "/protected/type", active: false},
                {label: `Update ${type_uid}`, href: `/protected/type/${type_uid}/update`, active: true}
            ]} />
            <Form 
                formTitle="Update Box Type"
                inputType={{
                    'type_uid': 'hidden',
                    'box_part_number': 'readonly',
                    'box_max_tray': 'number',
                }}
                rowData={type}
                selectOptionData={null}
                action="update"
                formAction={updateType}
                redirectLink="/protected/type"
            />
        </>
    );
};