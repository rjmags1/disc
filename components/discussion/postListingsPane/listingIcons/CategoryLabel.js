function CategoryLabel({ category, color }) {
    return (
        <label className="mr-2" style={{ color: color }}>
            { category }
        </label>
    )
}

export default CategoryLabel