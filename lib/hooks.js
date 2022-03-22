import useSWR from 'swr'
import { useEffect } from 'react'
import Router from 'next/router'

const jsonFetcher = url => fetch(url).then(res => res.json())

export const useUser = ({ redirectTo='', redirectIfFound=false }={}) => {
    const { data: user, mutate: mutateUser } = useSWR(`/api/user`, jsonFetcher)

    useEffect(() => {
        if(!redirectTo || !user) return

        if (redirectTo && !redirectIfFound && !user?.authenticated) Router.push(redirectTo)
        if (redirectIfFound && user?.authenticated) Router.push(redirectTo)
    }, [user, redirectIfFound, redirectTo])

    return { user, mutateUser }
}