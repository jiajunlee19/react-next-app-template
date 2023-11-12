// not-found.tsx is rendered when not-found() is being called.

export default function notFoundPage() {
    return (
        <div className="h-[100vh] align-middle flex flex-column items-center justify-center">
            <h3 className="mr-5">404</h3>
            <span className="font-medium">This page could not be found.</span>
        </div>
    );
};