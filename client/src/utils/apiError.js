import i18n from '../i18n'

// Turns a failed API call into a message in the current language.
// The server answers with a catalog code (e.g. 'errors.SLOT_TAKEN', 'validation.nameMin')
// and optional params, which match the client catalogs one to one.
export function apiErrorMessage(err, fallbackKey = 'errors.INTERNAL') {
    if (!err?.response) return i18n.t('errors.NETWORK')

    const { code, params } = err.response.data ?? {}
    const options = params ?? {}

    if (code && i18n.exists(code, options)) return i18n.t(code, options)

    return i18n.t(fallbackKey)
}
