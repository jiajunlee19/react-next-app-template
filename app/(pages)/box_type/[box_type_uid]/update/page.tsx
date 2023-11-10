import { readBoxTypeById, updateBoxType } from "@/app/_actions/box_type";
import Form from "@/app/_components/basic/form";
import { notFound } from 'next/navigation';
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Template App - Update Box Type',
    description: 'Developed by jiajunlee',
};

export default async function UpdateBoxType({params}: {params: {box_type_uid: string}}) {
    
    const box_type_uid = params.box_type_uid;

    const [box_type] = await Promise.all([
        readBoxTypeById(box_type_uid)
    ]);

    if (!box_type || Object.keys(box_type).length === 0 ) {
        notFound();
    }

    return (
        <Form 
            formTitle="Update Box Type"
            inputType={{
                'box_type_uid': 'hidden',
                'box_part_number': 'readonly',
                'box_max_tray': 'number',
            }}
            rowData={box_type}
            selectOptionData={null}
            action="update"
            formAction={updateBoxType}
            redirectLink="/box_type"
        />
    );
};