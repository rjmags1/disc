import { useRouter } from 'next/router'

function Discussion() {
    const router = useRouter()
    const { courseId } = router.query

    return <div className="text-white">{ courseId }</div>
}

export default Discussion