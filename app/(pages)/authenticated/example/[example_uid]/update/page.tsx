import { readExampleById, updateExample } from "@/app/_actions/example";
import Form from "@/app/_components/basic/form";
import { notFound } from 'next/navigation';
import type { Metadata } from 'next'
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";

export const metadata: Metadata = {
    title: 'Update Example',
    description: 'Developed by jiajunlee',
};

export default async function UpdateExample(props: {params: Promise<{example_uid: string}>}) {
    const params = await props.params;

    const example_uid = params.example_uid;

    let example;
    try {
        [example] = await Promise.all([
            readExampleById(example_uid)
        ]);
    } catch (err) {
        example = null; 
    }

    if (!example) {
        notFound();
    }

    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "Example", href: "/authenticated/example", active: false},
                {label: `Update ${example_uid}`, href: `/authenticated/example/${example_uid}/update`, active: true}
            ]} />
            <Form 
                formTitle="Update Example"
                inputType={{
                    'example_uid': 'hidden',
                    'example': 'readonly',
                }}
                rowData={example}
                selectOptionData={null}
                action="update"
                formAction={updateExample}
                redirectLink="/authenticated/example"
            />
        </>
    );
};