function PageHeader({ pageName }) {
    return (
        <div data-testid="page-header-container" className="p-1 sm:p-2 mr-auto ml-1">
            <h3 className="font-mono text-md sm:text-lg text-white">
                { pageName }
            </h3>
        </div>
    )
}

export default PageHeader