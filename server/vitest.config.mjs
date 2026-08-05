import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',

        pool: 'forks',

        include: ['tests/**/*.test.js'],

        env: {
            NODE_ENV:           'test',
            DB_PATH:            ':memory:',
            LOG_LEVEL:          'silent',
            JWT_ACCESS_SECRET:  'test_access_secret',
            JWT_REFRESH_SECRET: 'test_refresh_secret',
        },
    },
})
