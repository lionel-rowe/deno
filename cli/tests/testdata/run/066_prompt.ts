// regenerate Rust code:
// const x = await Deno.readTextFile('cli/tests/testdata/run/066_prompt.ts')
// console.info(x.split('\n').filter(line => /^\/\/ (Input|Output)\(/.test(line)).join('\n'))

// TODO: fix this for new logic/new tests; see `_066_prompt` in `cli/tests/integration/run_tests.rs` (line 2435)

alert("Hi");
// Output("Hi [Enter]\r\n"),
alert();
// Output("Alert [Enter]\r\n"),

const userInput = prompt();
// Input("foo\n"),
console.log(`Your input is ${userInput}.`);
// Output("Your input is foo.\r\n"),
const enterDefault = prompt("What is your name?", "Jane Doe");
// Output("What is your name? [Jane Doe]\r\n"),
// Input("\n"),
console.log(`Your name is ${enterDefault}.`);
// Output("Your name is Jane Doe.\r\n"),
const changedDefault = prompt("What is your name?", "Jane Doe");
// Output("What is your name? [Jane Doe]\r\n"),
// Input("John Doe\n"),
console.log(`Your name is ${changedDefault}.`);
// Output("Your name is John Doe.\r\n"),
const enterLinux = prompt("Press enter on Linux");
// Output("Press enter on Linux\r\n"),
console.log(`Your answer is ${JSON.stringify(enterLinux)}`);
// Output("Your answer is \"\"\r\n"),
const enterWin = prompt("Press enter on Windows");
// Output("Press enter on Windows\r\n"),
console.log(`Your answer is ${JSON.stringify(enterWin)}`);
// Output("Your answer is \"\"\r\n"),
const esc = prompt("Press esc");
// Output("Press esc"),
// Input("\x1b"),
console.log(`Your answer is ${JSON.stringify(esc)}`);
// Output("Your answer is null\r\n"),

const answerY = confirm("Yes or no?");
// Output("Yes or no? [Y/n]\r\n"),
// Input("Y\n"),
console.log(`Your answer is ${answerY}`);
const answerN = confirm("Yes or no?");
// Output("Yes or no? [Y/n]\r\n"),
// Input("N\n"),
console.log(`Your answer is ${answerN}`);
// Output("Your answer is false\r\n"),
const answerNo = confirm("Yes or no?");
// Output("Yes or no? [Y/n]\r\n"),
// Input("no\n"),
console.log(`Your answer is ${answerNo}`);
// Output("Your answer is true\r\n"),
const answerArbitrary = confirm("Yes or no?");
// Output("Yes or no? [Y/n]\r\n"),
// Input("abcxyz\n"),
console.log(`Your answer is ${answerArbitrary}`);
// Output("Your answer is true\r\n"),
const answerEnterDefault = confirm();
// Output("Confirm [Y/n]\r\n"),
// Input("\n"),
console.log(`Your answer is ${answerEnterDefault}`);
// Output("Your answer is true\r\n"),
const answerEsc = confirm();
// Output("Confirm [Y/n]\r\n"),
// Input("\x1b"),
console.log(`Your answer is ${answerEsc}`);
// Output("Your answer is false\r\n"),
