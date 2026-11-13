import { describe, it, expect } from 'vitest'

import { getInitials } from './initials'

describe('getInitials', () => {
    it.each([
        ['skips a leading title',                 'Dr. Alex Karev',        'AK'],
        ['skips a title without the dot',         'Dr Lisa Cuddy',         'LC'],
        ['skips several Polish titles',           'prof. dr hab. Jan Nowak', 'JN'],
        ['uses first and last name',              'Mary Ann Smith',        'MS'],
        ['handles a single name',                 'Cher',                  'C'],
        ['keeps Polish letters',                  'Łukasz Żak',            'ŁŻ'],
        ['ignores extra spaces',                  '  Dr.   Gregory   House ', 'GH'],
        ['falls back to the title if that is all', 'Dr.',                  'D'],
        ['shows a placeholder without a name',    '',                      '?'],
        ['copes with a missing name',             undefined,               '?'],
    ])('%s: %s → %s', (_case, name, expected) => {
        expect(getInitials(name)).toBe(expected)
    })
})
