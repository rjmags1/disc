import Layout from '../../components/layout/Layout'
import Loading from '../../components/lib/Loading'
import CategoryPane from '../../components/discussion/CategoryPane'
import PostListingsPane from '../../components/discussion/PostListingsPane'
import Post from '../../components/discussion/Post'
import { useRouter } from 'next/router'
import Head from 'next/head'
import {  useRef } from 'react'
import { useUser, useCourse } from '../../lib/hooks'

function Discussion() {
    const router = useRouter()
    const catPaneRef = useRef(null)

    const {
        user,
        loading: loadingUser
    } = useUser({ redirectTo: '/login' })

    const {
        course,
        loading: loadingCourse
    } = useCourse(router.query.courseId)
    
    if (loadingUser || !user.authenticated || loadingCourse) return <Loading />

    const { termName, code, section } = course
    const title = `${ termName } ${ code }-${ section } - Discussion`
    return (
        <>
            <Head><title>{ title }</title></Head>
            <div data-testid="discussion-container" className="flex h-full">
                <CategoryPane catPaneRef={ catPaneRef }/>
                <div className="flex-auto text-white flex" data-testid="posts-section">
                    <PostListingsPane catPaneRef={ catPaneRef } />
                    <Post />
                </div>
            </div>
        </>
    )
}

Discussion.getLayout = function getLayout(page) {
    const router = useRouter()
    const {
        course,
        loading: loadingCourse,
        error
    } = useCourse(router.query.courseId)

    const pageName = loadingCourse || error ? 
                        "" : 
                        `${ course.termName } ${ course.courseName }`

    return (
        <Layout pageName={ pageName }>{ page }</Layout>
    )
}

export default Discussion