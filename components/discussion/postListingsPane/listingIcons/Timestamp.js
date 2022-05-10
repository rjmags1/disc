import { toTimestampString } from "../../../../lib/time"

function Timestamp({ createdAt }) {
    return (
        <label className="mx-2 italic truncate pr-0.5">
            { toTimestampString(createdAt) }
        </label>
    )
}

export default Timestamp