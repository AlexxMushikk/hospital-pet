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

    if (!CATALOG_KEY.test(issue.message)) {
        const err = new Error(issue.message)
        err.status = 400
        throw err
    }

    throw buildError(issue.message, 400, paramsFromIssue(issue))
}

module.exports = validate
