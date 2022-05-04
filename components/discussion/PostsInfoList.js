import Loading from '../lib/Loading'
import PostsLoading from '../lib/ButtonLoading'
import { useRouter } from 'next/router'
import React, { useState, useEffect, useMemo } from 'react'
import { useCourse, useUser } from '../../lib/hooks'
import PostInfo from './PostInfo'
import LoadMoreButton from './LoadMoreButton'
import { LIGHT_RAINBOW_HEX } from'../../lib/colors'
import { filterTest } from '../../lib/filter'


const PostsInfoList = React.memo(function({ categoryFilter, filterText, attributeFilter }) {
    const router = useRouter()
    const { courseId } = router.query
    const { course } = useCourse(courseId)
    const { user } = useUser()
    const categoriesToLightRainbowHex = useMemo(() => {
        if (!course?.categories) return null

        const mapped = {}
        const { categories } = course
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i]
            mapped[category] = LIGHT_RAINBOW_HEX[i % LIGHT_RAINBOW_HEX.length]
        }
        return mapped
    }, [course])

    const [loadedAllPosts, setLoadedAllPosts] = useState(false)
    const [loadingMorePosts, setLoadingMorePosts] = useState(false)
    const [apiPage, setApiPage] = useState(1)
    const [initialLoadTime] = useState(Date.now())
    const [allPosts, setAllPosts] = useState([])
    const [displayedPosts, setDisplayedPosts] = useState([])


    useEffect(async () => {
        if (!categoriesToLightRainbowHex) return
        
        setLoadingMorePosts(apiPage > 1)
        const response = await fetch(
            `/api/course/postsInfo/${ courseId }/${ apiPage }/${ initialLoadTime }`
        )

        const { nextPage, posts: newPostInfo } = await response.json()
        setLoadedAllPosts(nextPage === null)

        const newPosts = newPostInfo.map((postInfo, i) => {
            const catColor = categoriesToLightRainbowHex[postInfo.category]
            const component = (
                <PostInfo info={ postInfo } categoryColor={ catColor } key={i + allPosts.length } />)
            return { i, postInfo, component }
        })
        setAllPosts([...allPosts, ...newPosts])
    }, [apiPage, categoriesToLightRainbowHex])

    useEffect(() => {
        if (!user) return

        const filters = [categoryFilter, filterText, attributeFilter]
        const filtered = allPosts.filter(
            post => filterTest(post.postInfo, user, filters)).map(
                filteredPost => filteredPost.component)
        setDisplayedPosts(filtered)
        setLoadingMorePosts(false)
    }, [allPosts, categoryFilter, filterText, attributeFilter, user])


    return (
        <div data-testid="post-listings-container" id="post-listings-container"
            className="w-full overflow-auto" >
            { displayedPosts.length === 0 ? <Loading /> : displayedPosts }

            { (displayedPosts.length > 0 && !loadedAllPosts && !loadingMorePosts) 
            && <LoadMoreButton handleClick={
                () => setApiPage(apiPage => apiPage + 1) } /> }

            { (displayedPosts.length > 0 && !loadedAllPosts && loadingMorePosts) 
            && 
            <div className="w-full h-[60px] flex items-center justify-center">
                <PostsLoading />
            </div>}

            { loadedAllPosts && 
            <div className="h-max text-center py-2 bg-zinc-900
                border-t border-gray-500 border-r">
                No more posts!
            </div>
            }
        </div>
    )
})

export default PostsInfoList