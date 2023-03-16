// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
const core = globalThis.Deno.core;
const primordials = globalThis.__bootstrap.primordials;
import { isatty } from "internal:runtime/40_tty.js";
import { stdin } from "internal:deno_io/12_io.js";
const {
  ArrayPrototypeFill,
  ArrayPrototypeJoin,
  ArrayPrototypePop,
  ArrayPrototypePush,
  StringPrototypeCharCodeAt,
  Uint8Array
} = primordials;
const LF = StringPrototypeCharCodeAt("\n", 0);
const CR = StringPrototypeCharCodeAt("\r", 0);
const SP = StringPrototypeCharCodeAt(" ", 0);
const HYPHEN = StringPrototypeCharCodeAt("-", 0);
const ETX = 0x03; // Ctrl+C
const EOT = 0x04; // Ctrl+D
const ESC = 0x1b;
const DEL = 0x7f; // Backspace
const ETB = 0x17; // Ctrl+Backspace (Unix)
const BS = 0x08; // Ctrl+Backspace (Windows)

const LINE_UP = "\x1b[1A";
const LINE_CLEAR = "\x1b[2K";
const CYAN = "\x1b[36m";
const CLEAR_FMT = "\x1b[39m";

function alert(message = "Alert") {
  if (!isatty(stdin.rid)) {
    return;
  }

  readLineFromStdinSync(`${message} [Enter]`);
}

function confirm(message = "Confirm") {
  if (!isatty(stdin.rid)) {
    return false;
  }

  const answer = readLineFromStdinSync(`${message} [Y/n]`);

  return answer != null && answer !== "n" && answer !== "N";
}

function prompt(message = "Prompt", defaultValue = "") {
  if (!isatty(stdin.rid)) {
    return null;
  }

  return readLineFromStdinSync(message, defaultValue);
}

function readLineFromStdinSync(promptText, defaultValue = "") {
  stdin.setRaw(true);

  promptText = formatPrompt(promptText)
  const buf = [...core.encode(defaultValue)];
  let canceled = false;
  let prevPhysicalLines = wrap(promptText).length;

  while (true) {
    prevPhysicalLines = writeLine(promptText, buf, prevPhysicalLines);

    const c = new Uint8Array(4);
    const n = stdin.readSync(c);

    if (n === null || n === 0 || byteMatch(c, [CR]) || byteMatch(c, [LF]) || byteMatch(c, [CR, LF])) {
      break;
    }
    if (byteMatch(c, [ESC]) || byteMatch(c, [ETX]) || byteMatch(c, [EOT])) {
      canceled = true;
      break;
    }
    if (byteMatch(c, [DEL])) {
      while (buf.length) {
        const byte = ArrayPrototypePop(buf);
        if (isFirstByteOfUtf8Char(byte)) {
          break;
        }
      }
    } else if (byteMatch(c, [ETB]) || byteMatch(c, [BS])) {
      while (buf.length) {
        ArrayPrototypePop(buf);
        const prevByte = buf[buf.length - 1];
        if (prevByte === SP || prevByte === HYPHEN) {
          break;
        }
      }
      prevPhysicalLines = writeLine(promptText, buf, prevPhysicalLines);
    } else {
      const utf8ByteLength = getUtf8ByteLength(c[0]);

      if (utf8ByteLength === 1 && (c[1] || c[2] || c[3])) {
        // is control char
        continue;
      }

      for (let i = 0; i < utf8ByteLength; ++i) {
        ArrayPrototypePush(buf, c[i]);
      }
    }
  }

  core.print("\n", false);

  stdin.setRaw(false);
  return canceled ? null : core.decode(new Uint8Array(buf));
}

function getUtf8ByteLength(firstByte) {
  if ((firstByte & 0x80) === 0x00) return 1;
  if ((firstByte & 0xE0) === 0xC0) return 2;
  if ((firstByte & 0xF0) === 0xE0) return 3;
  if ((firstByte & 0xF8) === 0xF0) return 4;

  return -1;
}

function isFirstByteOfUtf8Char(byte) {
  return (byte & 0xC0) !== 0x80;
}

function byteMatch(actualBytes, bytesToMatch) {
  for (let i = 0; i < bytesToMatch.length; ++i) {
    if (actualBytes[i] !== bytesToMatch[i]) return false;
  }

  for (let i = bytesToMatch.length; i < 4; ++i) {
    if (actualBytes[i]) return false;
  }

  return true;
}

function formatPrompt(str) {
  return `${CYAN}${str}${CLEAR_FMT} `;
}

function wrap(str) {
  const { columns } = consoleSize();

  if (!columns) return [""];

  const wrapped = [""];
  const words = StringPrototypeSplit(str, /(?<=[ -])/);

  for (let word of words) {
    if (wrapped[wrapped.length - 1].length + word.length <= columns) {
      wrapped[wrapped.length - 1] += word;
    } else if (word.length <= columns) {
      ArrayPrototypePush(wrapped, word);
    } else {
      while (word.length) {
        ArrayPrototypePush(wrapped, StringPrototypeSlice(word, 0, columns));
        word = StringPrototypeSlice(word, columns);
      }
    }
  }

  return wrapped;
}

function writeLine(promptText, buf, prevPhysicalLines) {
  const wrapped = wrap(`${promptText}${core.decode(new Uint8Array(buf))}`);
  const clear = ArrayPrototypeJoin(ArrayPrototypeFill(new Array(prevPhysicalLines), LINE_CLEAR), LINE_UP);

  core.print(`${clear}\r${ArrayPrototypeJoin(wrapped, "\n")}`, false);

  return wrapped.length;
}

export { alert, confirm, prompt };
