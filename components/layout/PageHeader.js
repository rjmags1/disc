function PageHeader({ pageName }) {
    return (
        <header data-testid="page-header-container"
            className="p-1 sm:p-2 mr-2 ml-1 flex-shrink sm:flex-none 
                whitespace-nowrap overflow-hidden">
            <h3 className="font-mono text-md sm:text-lg text-white 
                overflow-hidden text-ellipsis">
                { pageName }
            </h3>
        </header>
    )
}

export default PageHeader