export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'docs', 'chore', 'refactor', 'test', 'ci', 'perf'],
        ],
        'scope-empty': [2, 'never'],
        'subject-max-length': [2, 'always', 72],
        'subject-full-stop': [2, 'never', '.'],
        'subject-case': [2, 'always', 'lower-case'],
    },
}
