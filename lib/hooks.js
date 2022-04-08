import useSWR from 'swr'
import { useEffect } from 'react'
import Router from 'next/router'

const jsonFetcher = url => fetch(url).then(resp => resp.json())

export const useUser = ({ redirectTo='', redirectIfFound=false }={}) => {
    const { data: user, mutate: mutateUser, error } = useSWR(`/api/auth/user`, jsonFetcher)

    useEffect(() => {
        if(!redirectTo || !user) return

        if (redirectTo && !redirectIfFound && !user?.authenticated) Router.push(redirectTo)
        if (redirectIfFound && user?.authenticated) Router.push(redirectTo)
    }, [user, redirectIfFound, redirectTo])

    return { 
        user,
        mutateUser,
        loadingUserFromCache: error === undefined && user === undefined
    }
}

export const useOrgs = () => {
    const { data: orgs, error } = useSWR(`/api/auth/orgs`, jsonFetcher, {
        revalidateOnMount: true
    })
    return { orgs, error }
}

export const useEmails = (userId) => {
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