function PageHeader({ pageName }) {
    return (
        <div data-testid="page-header-container"
            className="p-1 sm:p-2 mr-2 ml-1 flex-shrink sm:flex-none truncate">
            <h3 className="font-mono text-md sm:text-lg text-white text-ellipsis">
                { pageName }
            </h3>
        </div>
    )
}

export default PageHeader