#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const environment = process.argv[2]
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const semverPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const packageVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function fail(message) {
    console.error(`Erro: ${message}`)
    process.exit(1)
}

function git(args, options = {}) {
    const output = execFileSync('git', args, {
        encoding: 'utf8',
        stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    })

    return typeof output === 'string' ? output.trim() : ''
}

function tagExists(tag) {
    try {
        git(['show-ref', '--verify', '--quiet', `refs/tags/${tag}`])
        return true
    } catch {
        return false
    }
}

function readPackageVersion(reference) {
    const packageContents = reference
        ? git(['show', `${reference}:package.json`])
        : readFileSync('package.json', 'utf8')

    return JSON.parse(packageContents).version
}

function incrementVersion(version, versionType) {
    const match = packageVersionPattern.exec(version)

    if (!match) {
        fail(`package.json possui uma versão inválida: ${version}.`)
    }

    let [, major, minor, patch] = match.map(Number)

    if (versionType === 'major') {
        major += 1
        minor = 0
        patch = 0
    } else if (versionType === 'minor') {
        minor += 1
        patch = 0
    } else {
        patch += 1
    }

    return `${major}.${minor}.${patch}`
}

async function chooseVersionType() {
    const choices = new Map([
        ['1', 'patch'],
        ['2', 'minor'],
        ['3', 'major'],
        ['patch', 'patch'],
        ['minor', 'minor'],
        ['major', 'major'],
    ])
    const prompt = createInterface({ input: stdin, output: stdout })

    try {
        while (true) {
            const answer = (
                await prompt.question(
                    'Tipo da versão (1: patch, 2: minor, 3: major): ',
                )
            )
                .trim()
                .toLowerCase()
            const selected = choices.get(answer)

            if (selected) {
                return selected
            }

            console.log(
                'Escolha inválida. Digite 1, 2, 3, patch, minor ou major.',
            )
        }
    } finally {
        prompt.close()
    }
}

async function chooseHomologatedTag(tags) {
    const prompt = createInterface({ input: stdin, output: stdout })

    try {
        console.log('Versões homologadas disponíveis:')
        tags.forEach((tag, index) => console.log(`${index + 1}: ${tag}`))

        while (true) {
            const answer = await prompt.question('Versão para produção: ')
            const selectedIndex = Number(answer.trim()) - 1

            if (
                Number.isInteger(selectedIndex) &&
                selectedIndex >= 0 &&
                selectedIndex < tags.length
            ) {
                return tags[selectedIndex]
            }

            console.log(`Escolha um número entre 1 e ${tags.length}.`)
        }
    } finally {
        prompt.close()
    }
}

function validateRepository() {
    const projectRoot = git(['rev-parse', '--show-toplevel'])
    process.chdir(projectRoot)

    if (git(['branch', '--show-current']) !== 'main') {
        fail('execute a release a partir da branch main.')
    }

    if (git(['status', '--porcelain'])) {
        fail('a árvore de trabalho possui alterações não commitadas.')
    }

    console.log('Atualizando referências do remoto...')
    git(['fetch', 'origin', 'main', '--tags'], { inherit: true })

    if (git(['rev-parse', 'HEAD']) !== git(['rev-parse', 'origin/main'])) {
        fail('a branch main local deve estar sincronizada com origin/main.')
    }
}

async function createHomologationRelease() {
    const versionType = await chooseVersionType()
    const version = incrementVersion(readPackageVersion(), versionType)
    const versionName = `v${version}`
    const tag = `hml/${versionName}`

    if (tagExists(tag)) {
        fail(`a tag ${tag} já existe.`)
    }

    execFileSync(npmCommand, ['version', version, '--no-git-tag-version'], {
        stdio: 'inherit',
    })

    if (!semverPattern.test(versionName)) {
        fail(`a versão gerada não é SemVer válida: ${versionName}.`)
    }

    git(['add', 'package.json', 'package-lock.json'], { inherit: true })
    git(['commit', '-m', `chore(release): ${versionName}`], { inherit: true })
    git(['tag', '-a', tag, '-m', `Homologação ${versionName}`], {
        inherit: true,
    })

    console.log(`Enviando main e ${tag} atomicamente...`)
    git(['push', '--atomic', 'origin', 'main', tag], { inherit: true })
    console.log(`Release de homologação criada: ${tag}`)
}

async function createProductionRelease() {
    const remoteHomologationTags = new Set(
        git(['ls-remote', '--tags', '--refs', 'origin', 'hml/v*'])
            .split('\n')
            .filter(Boolean)
            .map((line) => line.split(/\s+/)[1])
            .filter(Boolean)
            .map((reference) => reference.replace('refs/tags/', '')),
    )
    const homologationTags = git([
        'tag',
        '--list',
        'hml/v*',
        '--sort=-v:refname',
    ])
        .split('\n')
        .filter(Boolean)
        .filter((tag) => remoteHomologationTags.has(tag))
        .filter((tag) => semverPattern.test(tag.slice('hml/'.length)))
        .filter((tag) => !tagExists(`prd/${tag.slice('hml/'.length)}`))

    if (homologationTags.length === 0) {
        fail('não há versões homologadas pendentes de promoção.')
    }

    const homologationTag = await chooseHomologatedTag(homologationTags)
    const versionName = homologationTag.slice('hml/'.length)
    const productionTag = `prd/${versionName}`
    const commit = git(['rev-list', '-n', '1', homologationTag])
    const packageVersion = readPackageVersion(commit)

    if (`v${packageVersion}` !== versionName) {
        fail(
            `${homologationTag} aponta para package.json ${packageVersion}, não ${versionName}.`,
        )
    }

    try {
        git(['merge-base', '--is-ancestor', commit, 'origin/main'])
    } catch {
        fail(`${homologationTag} não pertence ao histórico de origin/main.`)
    }

    git(['tag', '-a', productionTag, commit, '-m', `Produção ${versionName}`], {
        inherit: true,
    })

    console.log(`Enviando ${productionTag}...`)
    git(['push', 'origin', productionTag], { inherit: true })
    console.log(
        `Release de produção criada: ${productionTag} (${commit.slice(0, 7)})`,
    )
}

if (!['hml', 'prd'].includes(environment)) {
    fail('informe o ambiente: hml ou prd.')
}

try {
    validateRepository()

    if (environment === 'hml') {
        await createHomologationRelease()
    } else {
        await createProductionRelease()
    }
} catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    fail(
        `${message}\nO script não desfez alterações locais; revise git status e as tags locais.`,
    )
}
