const { buildError } = require('../errors')

const CATALOG_KEY = /^(errors|validation)\.[A-Za-z][A-Za-z0-9_]*$/

function paramsFromIssue(issue) {
    if (issue.minimum !== undefined) return { count: Number(issue.minimum) }
    if (issue.maximum !== undefined) return { count: Number(issue.maximum) }
    return undefined
}

function validate(dto, data) {
    const result = dto.safeParse(data)
    if (result.success) return result.data

    const issue = result.error.issues[0]

    // Zod's own messages (missing field, wrong type, unknown enum value) have no catalog key;
    // name the field instead, so the client still gets a translatable code.
    if (!CATALOG_KEY.test(issue.message)) {
        throw buildError('validation.invalid', 400, { field: issue.path.join('.') || 'body' })
    }

    throw buildError(issue.message, 400, paramsFromIssue(issue))
}

module.exports = validate
