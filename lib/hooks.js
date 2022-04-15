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
    if (!userId) userId = -1 // get rid of 404 on logged out or loading user

    const { 
        data: emails, 
        error,
        mutate: mutateEmails 
    } = useSWR(`/api/settings/email/${userId}`, jsonFetcher)
    
    return { 
        emails,
        mutateEmails,
        loading: error === undefined && emails === undefined
    }
}

export const useNotificationSettings = (userId) => {
    if (!userId) userId = -1 // get rid of 404 on logged out or loading user

    const { 
        data: notificationSettings, 
        error,
        mutate: mutateNotificationSettings 
    } = useSWR(`/api/settings/email/notifications/${ userId }`, jsonFetcher)
    
    return { 
        notificationSettings,
        mutateNotificationSettings,
        loading: error === undefined && notificationSettings === undefined
    }
}

export const useCourses = (userId) => {
    if (!userId) userId = -1 // get rid of 404 on logged out or loading user

    const {
        data: courses,
        error
    } = useSWR(`/api/course/${ userId }`, jsonFetcher)

    return {
        courses,
        error,
        loading: error === undefined && courses === undefined
    }
}

const jsonFetcher = url => fetch(url).then(resp => resp.json())