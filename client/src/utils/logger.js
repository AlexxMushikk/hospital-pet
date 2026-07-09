const isDev = import.meta.env.DEV

export const logger = {
    error: (context, ...args) => { if (isDev) console.error(`[${context}]`, ...args) },
    warn:  (context, ...args) => { if (isDev) console.warn(`[${context}]`, ...args) },
}
