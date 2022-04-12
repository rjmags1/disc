import { useUser } from '../../../lib/hooks'

import ProfileCardAvatar from './ProfileCardAvatar'

function ProfileCard() {
    const {
        user,
        loading: loadingUser
    } = useUser({ redirectTo: '/login' })

    if (loadingUser) return null

    const { 
        f_name: fName, 
        l_name: lName, 
        primary_email: primaryEmail 
    } = user

    return (
        <div data-testid="profile-card-container">
            <h2 className="text-2xl ml-4">Profile</h2>
            <div className="w-max">
                <div className="flex border-2 border-light-gray rounded-md
                    mt-3 p-4 pr-8">
                    <ProfileCardAvatar />
                    <div className="ml-8 flex flex-col justify-center">
                        <h3 className="text-xl my-1">{ `${fName} ${lName}` }</h3>
                        <h4 className="text-xs my-1">{ primaryEmail }</h4>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default ProfileCard