// this script regenerates expectations for `fn _066_prompt` in `cli/tests/integration/run_tests.rs`
// before running, run `apt install expect` and generate a `./script.exp` file by using `autoexpect ./target/debug/deno repl`

import stripAnsi from 'https://esm.sh/strip-ansi@7.0.1'

const x: string = await Deno.readTextFile('./script.exp')

const unescapedQuot = /(?:(?<=(?<!\\)(?:\\{2})*)")/

const re = new RegExp(String.raw`(?<=^|\n)(send|expect)\s+([^"\n]+)\s+${unescapedQuot.source}([\s\S]+?)${unescapedQuot.source}`, 'gu')

const startIdx = x.search(re)

const parseExpectContentString = (str: string) => eval(`"${str.replaceAll('\n', '\\n')}"`)
const toRustString = (str: string) => `"${[...str].map(ch => {
	const json = JSON.stringify(ch).slice(1, -1)
	if (/^\\u00/.test(json)) {
		return `\\x${json.slice(4)}`
	} else if (/^\\u[^{]/.test(json)) {
		return `\\u{${parseInt(json.slice(2), 16).toString(16)}}`
	}

	return json
}).join('')}"`

type Instruction = 'send' | 'expect'
type Match = {
	content: string
	args: string
	instruction: Instruction
	raw: string
}

const matches: Match[] = [...x.matchAll(re)].map((m) => {
	const instruction = m[1] as Instruction
	const args = m[2]
	const raw = parseExpectContentString(m[3])
	const content = instruction === 'expect' ? stripAnsi(raw) : raw

	return { instruction, args, content, raw }
})

let idxs: number[] = []

for (const [i, m] of matches.entries()) {
	const { instruction, content } = m
	const lastExpect = matches.slice(0, i).findLast((x) => x.instruction === 'expect')

	if (i === 0) {
		idxs.push(i)
	} else if (instruction === 'expect' && lastExpect && !content.trimEnd().startsWith(lastExpect.content.trimEnd())) {
		idxs.push(i - 1)
	} else if (i === matches.length - 1 && instruction === 'send') {
		idxs.push(i)
	}
}

idxs = [...new Set([...idxs].sort((a, b) => a - b))]

const chunks: Match[] = []

let lastIdx = idxs[0]
for (const idx of idxs.slice(1)) {
	const ch = matches.slice(lastIdx, idx)

	const sends = ch.filter(x => x.instruction === 'send')

	const send = sends.length ? {
		...sends[0],
		content: sends.map(x => x.content).join(''),
		raw: sends.map(x => x.raw).join(''),
	} : null

	const expect = ch.findLast(x => x.instruction === 'expect')

	if (send) chunks.push(send!)
	if (expect) chunks.push(expect!)

	lastIdx = idx
}

await Deno.writeTextFile('script-out.exp', `${x.slice(0, startIdx).replace('set timeout -1', 'set timeout 5')}
expect_before {
	timeout { puts "timeout"; exit 2 }
	eof { puts "eof"; exit 1 }
}

sleep 1

${chunks
	.slice(chunks[0].instruction === 'expect' ? 1 : 0)
	.map(ch => `${ch.instruction} ${ch.args} ${JSON.stringify(ch.raw).replaceAll('[', '\\[')}`).join('\n')
}
`)

console.info(
	chunks.map((ch) => `${' '.repeat(8)}${ch.instruction === 'expect' ? 'Output' : 'Input'}(${toRustString(ch.content)}),`).join('\n')
)
