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

export const useCategories = (courseId) => {
    const {
        data: categories,
        error
    } = useSWR(
        courseId ? `/api/course/categories/${ courseId }` : null, 
        jsonFetcher
    )

    return {
        categories,
        error,
        loading: error === undefined && categories === undefined
    }
}

export const usePostsInfo = (courseId, page) => {
    const {
        data: paginatedPostsInfo,
        error
    } = useSWR(
        courseId ? `/api/course/postsInfo/${ courseId }/${ page }` : null,
        jsonFetcher
    )

    return {
        paginatedPostsInfo,
        error,
        loading: error === undefined && paginatedPostsInfo === undefined
    }
}

const jsonFetcher = url => fetch(url).then(resp => resp.json())