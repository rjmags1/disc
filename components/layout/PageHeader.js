function PageHeader({ pageName }) {
    return (
        <div data-testid="page-header-container">
            <h3>{ pageName }</h3>
        </div>
    )
}

export default PageHeader