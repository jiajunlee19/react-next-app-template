import {useFormStatus} from 'react-dom'

type SubmitButtonProps = {
    buttonClass: string,
    buttonTitle: string,
    onButtonClick: React.MouseEventHandler,
    submitingButtonTitle: string,
};

export default function SubmitButton( {buttonClass, buttonTitle, onButtonClick, submitingButtonTitle}: SubmitButtonProps ) {

    // useFormStatus gives a pending boolean, use this to tell if the button should be disabled or not
    const { pending } = useFormStatus();

    return (
        <button className={buttonClass} type="submit" disabled={pending} onClick={onButtonClick}>
            {pending ? submitingButtonTitle : buttonTitle}
        </button>
    );
};