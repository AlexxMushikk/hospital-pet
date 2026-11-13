// Academic and courtesy titles that are not part of the name: "Dr. Lisa Cuddy" gives "LC".
// Polish ones included: "lek." (physician), "dr hab.", "prof.".
const TITLES = new Set(['dr', 'prof', 'hab', 'lek', 'med', 'mgr', 'mr', 'mrs', 'ms', 'miss'])

const isTitle = (word) => TITLES.has(word.toLowerCase().replace(/\.$/, ''))

// Two letters for an avatar: first name and last name, ignoring titles.
export function getInitials(name) {
    const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)
    const parts = words.filter(word => !isTitle(word))
    const used  = parts.length ? parts : words

    if (used.length === 0) return '?'

    const first = used[0]
    const last  = used.length > 1 ? used[used.length - 1] : ''
    return (first[0] + (last[0] ?? '')).toLocaleUpperCase()
}
