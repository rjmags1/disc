import useSWR from 'swr'
import { useEffect } from 'react'
import Router from 'next/router'

export const useUser = ({ redirectTo='', redirectIfFound=false }={}) => {
    const { 
        data: user, 
        mutate: mutateUser, 
        error 
    } = useSWR(`/api/auth/user`, jsonFetcher)
    
    // redirect based on user auth status + param options
    useEffect(() => { 
        if(!redirectTo || !user) return

        if (redirectTo && !redirectIfFound && !user?.authenticated) {
            Router.push(redirectTo)
        }
        if (redirectIfFound && user?.authenticated) {
            Router.push(redirectTo)
        }
    }, [user, redirectIfFound, redirectTo])

    return { 
        user,
        mutateUser,
        loading: error === undefined && user === undefined
    }
}

export const useOrgs = () => {
    const {
        data: orgs, 
        error 
    } = useSWR(`/api/auth/orgs`, jsonFetcher, { revalidateOnMount: true })

    return {
        orgs,
        loading: error === undefined && orgs === undefined
    }
}

export const useEmails = (userId) => {
    const { 
        data: emails, 
        error,
        mutate: mutateEmails 
    } = useSWR(userId ? `/api/settings/email/${userId}` : null, jsonFetcher)
    
    return { 
        emails,
        mutateEmails,
        loading: error === undefined && emails === undefined
    }
}

export const useNotificationSettings = (userId) => {
    const { 
        data: notificationSettings, 
        error,
        mutate: mutateNotificationSettings 
    } = useSWR(
        userId ? `/api/settings/email/notifications/${ userId }` : null, 
        jsonFetcher
    )
    
    return { 
        notificationSettings,
        mutateNotificationSettings,
        loading: error === undefined && notificationSettings === undefined
    }
}

export const useCourses = (userId) => {
    const {
        data: courses,
        error
    } = useSWR(userId ? `/api/course/${ userId }` : null, jsonFetcher)

    return {
        courses,
        error,
        loading: error === undefined && courses === undefined
    }
}

export const useCourse = (courseId) => {
    const {
        data: course,
        error
    } = useSWR(
        courseId ? `/api/course/info/${ courseId }` : null, 
        jsonFetcher
    )

    return {
        course,
        error,
        loading: error === undefined && course === undefined
    }
}

export const useAnnouncementsPinned = (courseId) => {
    const {
        data,
        error
    } = useSWR(
            courseId ? 
            `/api/course/postsInfo/announcementsAndPinned/${ courseId }`
                : null,
            jsonFetcher,
            {
                revalidateIfStale: false,
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
            }
        )
    
    const announcements = data?.announcements
    const pinned = data?.pinned
    return {
        announcements, pinned,
        error,
        loading: error === undefined && data === undefined
    }
}

export const usePostContent = (postId, authorId, page, loadBefore) => {
    const doFetch = [postId, authorId, page, loadBefore].every(param => !!param)
    const {
        data,
        error
    } = useSWR(
        doFetch ? 
        `/api/course/postsInfo/${ postId }/content/${ authorId }/${ page }/${ loadBefore }`
        : null,
        jsonFetcher,
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    )

    if (!data) return { content: undefined, error, loading: doFetch }
    const { nextPage, postInfo, ancestorInfo, descendantInfo } = data
    return {
        content: { nextPage, postInfo, ancestorInfo, descendantInfo },
        error,
        loading: error === undefined && data === undefined
    }
}

export const useMoreReplies = (postId, ancestorId, page, threadOffset) => {
    const doFetch = [postId, ancestorId, page, threadOffset].every(param => !!param)
    const {
        data,
        error
    } = useSWR(
        doFetch ? 
        `/api/course/postsInfo/${ postId }/content/replies/${ ancestorId }/${ page }/${ threadOffset }`
        : null,
        jsonFetcher,
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    )

    if (!data) return { replies: undefined, error, loading: doFetch }
    const { replies, nextPage } = data
    return {
        replies, nextPage, error, 
        loading: error === undefined && data === undefined
    }
}

const jsonFetcher = url => fetch(url).then(resp => resp.json())