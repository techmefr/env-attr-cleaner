import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

const run = cmd => execSync(cmd, { stdio: 'inherit' })

// Generate changelog and bump root version
run('changelogen --bump')

// Read bumped version
const root = JSON.parse(readFileSync('package.json', 'utf8'))
const { version } = root

// Sync version to packages
for (const path of ['packages/unplugin/package.json', 'packages/bun/package.json']) {
    const pkg = JSON.parse(readFileSync(path, 'utf8'))
    pkg.version = version
    writeFileSync(path, JSON.stringify(pkg, null, 4) + '\n')
}

// Commit and tag
run('git add CHANGELOG.md package.json packages/unplugin/package.json packages/bun/package.json')
run(`git commit -m "chore(release): v${version}"`)
run(`git tag -a v${version} -m "v${version}"`)

console.log(`\nReleased v${version} — push with: git push --follow-tags`)
