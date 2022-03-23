import useSWR from 'swr'
import { useEffect } from 'react'
import Router from 'next/router'

const jsonFetcher = url => fetch(url).then(resp => resp.json())

export const useUser = ({ redirectTo='', redirectIfFound=false }={}) => {
    const { data: user, mutate: mutateUser } = useSWR(`/api/user`, jsonFetcher)

    useEffect(() => {
        if(!redirectTo || !user) return

        if (redirectTo && !redirectIfFound && !user?.authenticated) Router.push(redirectTo)
        if (redirectIfFound && user?.authenticated) Router.push(redirectTo)
    }, [user, redirectIfFound, redirectTo])

    return { user, mutateUser }
}

export const useOrgs = () => {
    const { data: orgs, error } = useSWR(`/api/orgs`, jsonFetcher, {
        revalidateOnMount: true
    })
    return { orgs, error }
}