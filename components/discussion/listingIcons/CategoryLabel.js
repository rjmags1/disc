function CategoryLabel({ category, color }) {
    return (
        <div className="mr-2" style={{ color: color }}>
            { category }
        </div>
    )
}

export default CategoryLabel