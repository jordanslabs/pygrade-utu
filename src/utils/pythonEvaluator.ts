import type { Problem, TestCase } from '../data/problems';

export type VerdictStatus = 'ACCEPTED' | 'WRONG ANSWER' | 'SYNTAX ERROR' | 'RUNTIME ERROR';

export interface TestCaseResult {
  testCaseId: number;
  isPublic: boolean;
  description: string;
  passed: boolean;
  status: VerdictStatus;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  errorMessage?: string;
}

export interface EvaluationResult {
  verdict: VerdictStatus;
  score: number;
  passedCount: number;
  totalCount: number;
  executionTimeMs: number;
  diagnosis: string;
  testResults: TestCaseResult[];
  mode: 'sample' | 'submit';
}

/* ==========================================================================
   Internal Error Types with Beginner-Friendly Indonesian Diagnostics
   ========================================================================== */

class PySyntaxError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.name = 'PySyntaxError';
    this.line = line;
  }
}

class PyRuntimeError extends Error {
  errorType: string;
  line?: number;
  constructor(errorType: string, message: string, line?: number) {
    super(message);
    this.name = 'PyRuntimeError';
    this.errorType = errorType;
    this.line = line;
  }
}

/* ==========================================================================
   Lexer (Indentation-Aware Python Subset)
   ========================================================================== */

type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'FSTRING'
  | 'IDENT'
  | 'KEYWORD'
  | 'OP'
  | 'NEWLINE'
  | 'INDENT'
  | 'DEDENT'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  line: number;
}

const KEYWORDS = new Set([
  'if',
  'elif',
  'else',
  'for',
  'while',
  'in',
  'def',
  'return',
  'break',
  'continue',
  'pass',
  'and',
  'or',
  'not',
  'is',
  'True',
  'False',
  'None',
]);

const THREE_CHAR_OPS = new Set(['//=', '**=']);
const TWO_CHAR_OPS = new Set([
  '**',
  '//',
  '==',
  '!=',
  '<=',
  '>=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
]);
const ONE_CHAR_OPS = new Set([
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '=',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  ':',
  ',',
  '.',
]);

function tokenize(source: string): Token[] {
  const normalized = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const tokens: Token[] = [];
  const indentStack: number[] = [0];
  const bracketStack: Array<{ ch: string; line: number }> = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    const rawLine = lines[lineIdx];

    // Check blank or comment-only line
    let pos = 0;
    let indentWidth = 0;
    while (pos < rawLine.length && (rawLine[pos] === ' ' || rawLine[pos] === '\t')) {
      indentWidth += rawLine[pos] === '\t' ? 4 : 1;
      pos++;
    }

    if (pos >= rawLine.length || rawLine[pos] === '#') {
      continue;
    }

    // Only manage INDENT/DEDENT when not inside (), [], {}
    if (bracketStack.length === 0) {
      const currentIndent = indentStack[indentStack.length - 1];
      if (indentWidth > currentIndent) {
        indentStack.push(indentWidth);
        tokens.push({ type: 'INDENT', value: '', line: lineNum });
      } else if (indentWidth < currentIndent) {
        while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indentWidth) {
          indentStack.pop();
          tokens.push({ type: 'DEDENT', value: '', line: lineNum });
        }
        if (indentStack[indentStack.length - 1] !== indentWidth) {
          throw new PySyntaxError(
            `IndentationError di baris ${lineNum}: Tingkat indentasi tidak konsisten dengan blok sebelumnya. Gunakan kelipatan 4 spasi secara rapi.`,
            lineNum
          );
        }
      }
    }

    while (pos < rawLine.length) {
      const ch = rawLine[pos];

      if (ch === ' ' || ch === '\t') {
        pos++;
        continue;
      }

      if (ch === '#') {
        break;
      }

      // f-string: f"..." or f'...'
      if (
        (ch === 'f' || ch === 'F') &&
        pos + 1 < rawLine.length &&
        (rawLine[pos + 1] === '"' || rawLine[pos + 1] === "'")
      ) {
        const quote = rawLine[pos + 1];
        pos += 2;
        let strVal = '';
        let closed = false;
        while (pos < rawLine.length) {
          const c = rawLine[pos];
          if (c === '\\' && pos + 1 < rawLine.length) {
            const next = rawLine[pos + 1];
            if (next === 'n') strVal += '\n';
            else if (next === 't') strVal += '\t';
            else if (next === '\\') strVal += '\\';
            else if (next === quote) strVal += quote;
            else strVal += next;
            pos += 2;
            continue;
          }
          if (c === quote) {
            pos++;
            closed = true;
            break;
          }
          strVal += c;
          pos++;
        }
        if (!closed) {
          throw new PySyntaxError(
            `SyntaxError di baris ${lineNum}: Tanda kutip f-string (${quote}) tidak ditutup. Pastikan setiap string memiliki tanda kutip penutup.`,
            lineNum
          );
        }
        tokens.push({ type: 'FSTRING', value: strVal, line: lineNum });
        continue;
      }

      // Regular string literal
      if (ch === '"' || ch === "'") {
        const quote = ch;
        pos++;
        let strVal = '';
        let closed = false;
        while (pos < rawLine.length) {
          const c = rawLine[pos];
          if (c === '\\' && pos + 1 < rawLine.length) {
            const next = rawLine[pos + 1];
            if (next === 'n') strVal += '\n';
            else if (next === 't') strVal += '\t';
            else if (next === '\\') strVal += '\\';
            else if (next === quote) strVal += quote;
            else strVal += next;
            pos += 2;
            continue;
          }
          if (c === quote) {
            pos++;
            closed = true;
            break;
          }
          strVal += c;
          pos++;
        }
        if (!closed) {
          throw new PySyntaxError(
            `SyntaxError di baris ${lineNum}: Tanda kutip string (${quote}) tidak ditutup.`,
            lineNum
          );
        }
        tokens.push({ type: 'STRING', value: strVal, line: lineNum });
        continue;
      }

      // Number literal
      if (
        (ch >= '0' && ch <= '9') ||
        (ch === '.' && pos + 1 < rawLine.length && rawLine[pos + 1] >= '0' && rawLine[pos + 1] <= '9')
      ) {
        const start = pos;
        let hasDot = false;
        while (pos < rawLine.length) {
          const c = rawLine[pos];
          if (c >= '0' && c <= '9') {
            pos++;
          } else if (c === '.' && !hasDot) {
            hasDot = true;
            pos++;
          } else {
            break;
          }
        }
        tokens.push({ type: 'NUMBER', value: rawLine.slice(start, pos), line: lineNum });
        continue;
      }

      // Identifier or keyword
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
        const start = pos;
        while (
          pos < rawLine.length &&
          ((rawLine[pos] >= 'a' && rawLine[pos] <= 'z') ||
            (rawLine[pos] >= 'A' && rawLine[pos] <= 'Z') ||
            (rawLine[pos] >= '0' && rawLine[pos] <= '9') ||
            rawLine[pos] === '_')
        ) {
          pos++;
        }
        const word = rawLine.slice(start, pos);
        tokens.push({
          type: KEYWORDS.has(word) ? 'KEYWORD' : 'IDENT',
          value: word,
          line: lineNum,
        });
        continue;
      }

      // Operators
      const three = rawLine.slice(pos, pos + 3);
      if (THREE_CHAR_OPS.has(three)) {
        tokens.push({ type: 'OP', value: three, line: lineNum });
        pos += 3;
        continue;
      }

      const two = rawLine.slice(pos, pos + 2);
      if (TWO_CHAR_OPS.has(two)) {
        tokens.push({ type: 'OP', value: two, line: lineNum });
        pos += 2;
        continue;
      }

      if (ONE_CHAR_OPS.has(ch)) {
        if (ch === '(' || ch === '[' || ch === '{') {
          bracketStack.push({ ch, line: lineNum });
        } else if (ch === ')' || ch === ']' || ch === '}') {
          const expectedOpen = ch === ')' ? '(' : ch === ']' ? '[' : '{';
          if (bracketStack.length === 0 || bracketStack[bracketStack.length - 1].ch !== expectedOpen) {
            throw new PySyntaxError(
              `SyntaxError di baris ${lineNum}: Tanda kurung penutup '${ch}' tidak memiliki pasangan pembuka '${expectedOpen}'.`,
              lineNum
            );
          }
          bracketStack.pop();
        }
        tokens.push({ type: 'OP', value: ch, line: lineNum });
        pos++;
        continue;
      }

      throw new PySyntaxError(
        `SyntaxError di baris ${lineNum}: Karakter tidak dikenali '${ch}'. Periksa kembali penulisan sintaksis Python Anda.`,
        lineNum
      );
    }

    if (bracketStack.length === 0) {
      tokens.push({ type: 'NEWLINE', value: '\n', line: lineNum });
    }
  }

  if (bracketStack.length > 0) {
    const unclosed = bracketStack[bracketStack.length - 1];
    const closing = unclosed.ch === '(' ? ')' : unclosed.ch === '[' ? ']' : '}';
    throw new PySyntaxError(
      `SyntaxError di baris ${unclosed.line}: Tanda kurung '${unclosed.ch}' dibuka tetapi tidak pernah ditutup dengan '${closing}'.`,
      unclosed.line
    );
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: 'DEDENT', value: '', line: lines.length });
  }

  tokens.push({ type: 'EOF', value: '', line: lines.length });
  return tokens;
}

/* ==========================================================================
   AST Definitions
   ========================================================================== */

type Stmt =
  | { kind: 'ExprStmt'; expr: Expr; line: number }
  | { kind: 'Assign'; targets: AssignTarget[]; value: Expr; line: number }
  | { kind: 'AugAssign'; target: AssignTarget; op: string; value: Expr; line: number }
  | { kind: 'If'; branches: Array<{ test: Expr; body: Stmt[] }>; elseBody: Stmt[]; line: number }
  | { kind: 'While'; test: Expr; body: Stmt[]; line: number }
  | { kind: 'For'; target: AssignTarget; iter: Expr; body: Stmt[]; line: number }
  | { kind: 'Def'; name: string; params: Array<{ name: string; defaultVal?: Expr }>; body: Stmt[]; line: number }
  | { kind: 'Return'; value: Expr | null; line: number }
  | { kind: 'Break'; line: number }
  | { kind: 'Continue'; line: number }
  | { kind: 'Pass'; line: number };

type AssignTarget =
  | { kind: 'NameTarget'; name: string }
  | { kind: 'IndexTarget'; object: Expr; index: Expr }
  | { kind: 'TupleTarget'; elements: AssignTarget[] };

type Expr =
  | { kind: 'Literal'; value: number | string | boolean | null; line: number }
  | { kind: 'FString'; raw: string; line: number }
  | { kind: 'Name'; name: string; line: number }
  | { kind: 'List'; elements: Expr[]; line: number }
  | { kind: 'Tuple'; elements: Expr[]; line: number }
  | { kind: 'Dict'; entries: Array<{ key: Expr; value: Expr }>; line: number }
  | { kind: 'ListComp'; expr: Expr; target: AssignTarget; iter: Expr; cond?: Expr; line: number }
  | { kind: 'Unary'; op: string; operand: Expr; line: number }
  | { kind: 'Binary'; op: string; left: Expr; right: Expr; line: number }
  | { kind: 'BoolOp'; op: 'and' | 'or'; left: Expr; right: Expr; line: number }
  | { kind: 'Compare'; left: Expr; ops: string[]; comparators: Expr[]; line: number }
  | { kind: 'Ternary'; body: Expr; test: Expr; orelse: Expr; line: number }
  | { kind: 'Call'; callee: Expr; args: Expr[]; kwargs: Array<{ name: string; value: Expr }>; line: number }
  | { kind: 'Attr'; object: Expr; attr: string; line: number }
  | { kind: 'Subscript'; object: Expr; index: Expr; line: number }
  | { kind: 'Slice'; object: Expr; start: Expr | null; stop: Expr | null; step: Expr | null; line: number };

/* ==========================================================================
   Recursive Descent Parser
   ========================================================================== */

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    if (this.pos < this.tokens.length - 1) this.pos++;
    return tok;
  }

  private match(type: TokenType, value?: string): boolean {
    const tok = this.peek();
    if (tok.type !== type) return false;
    if (value !== undefined && tok.value !== value) return false;
    this.advance();
    return true;
  }

  private check(type: TokenType, value?: string): boolean {
    const tok = this.peek();
    if (tok.type !== type) return false;
    if (value !== undefined && tok.value !== value) return false;
    return true;
  }

  private expectColon(keyword: string, line: number): void {
    if (!this.match('OP', ':')) {
      throw new PySyntaxError(
        `SyntaxError di baris ${line}: Kehilangan tanda titik dua (':') di akhir pernyataan '${keyword}'. Pastikan setiap blok if/elif/else/for/while/def diakhiri dengan ':'.`,
        line
      );
    }
  }

  private skipNewlines(): void {
    while (this.check('NEWLINE')) {
      this.advance();
    }
  }

  parseProgram(): Stmt[] {
    const body: Stmt[] = [];
    this.skipNewlines();
    while (!this.check('EOF')) {
      if (this.check('INDENT')) {
        const tok = this.peek();
        throw new PySyntaxError(
          `IndentationError di baris ${tok.line}: Indentasi tidak terduga (unexpected indent). Baris ini tidak berada di dalam blok kontrol atau fungsi.`,
          tok.line
        );
      }
      body.push(this.parseStatement());
      this.skipNewlines();
    }
    return body;
  }

  private parseBlock(headerLine: number, keyword: string): Stmt[] {
    // Support single-line inline suite like `if x > 0: return x`
    if (!this.check('NEWLINE')) {
      const stmt = this.parseSimpleStatement();
      this.skipNewlines();
      return [stmt];
    }

    this.skipNewlines();
    if (!this.match('INDENT')) {
      const tok = this.peek();
      throw new PySyntaxError(
        `IndentationError di baris ${tok.line}: Blok kode setelah '${keyword}:' (baris ${headerLine}) wajib diindentasi menggunakan 4 spasi.`,
        tok.line
      );
    }

    const stmts: Stmt[] = [];
    this.skipNewlines();
    while (!this.check('DEDENT') && !this.check('EOF')) {
      stmts.push(this.parseStatement());
      this.skipNewlines();
    }
    this.match('DEDENT');
    return stmts;
  }

  private parseStatement(): Stmt {
    const tok = this.peek();
    if (tok.type === 'KEYWORD') {
      if (tok.value === 'if') return this.parseIf();
      if (tok.value === 'while') return this.parseWhile();
      if (tok.value === 'for') return this.parseFor();
      if (tok.value === 'def') return this.parseDef();
      if (tok.value === 'elif' || tok.value === 'else') {
        throw new PySyntaxError(
          `SyntaxError di baris ${tok.line}: Pernyataan '${tok.value}' ditemukan tanpa pasangan 'if' sebelumnya.`,
          tok.line
        );
      }
    }
    const stmt = this.parseSimpleStatement();
    if (!this.check('EOF') && !this.check('DEDENT')) {
      if (!this.match('NEWLINE')) {
        const bad = this.peek();
        throw new PySyntaxError(
          `SyntaxError di baris ${bad.line}: Token tidak terduga '${bad.value}'. Periksa kembali sintaksis pada baris tersebut.`,
          bad.line
        );
      }
    }
    return stmt;
  }

  private parseIf(): Stmt {
    const ifTok = this.advance();
    const branches: Array<{ test: Expr; body: Stmt[] }> = [];
    const firstTest = this.parseExpr();
    this.expectColon('if', ifTok.line);
    const firstBody = this.parseBlock(ifTok.line, 'if');
    branches.push({ test: firstTest, body: firstBody });

    while (this.check('KEYWORD', 'elif')) {
      const elifTok = this.advance();
      const test = this.parseExpr();
      this.expectColon('elif', elifTok.line);
      const body = this.parseBlock(elifTok.line, 'elif');
      branches.push({ test, body });
    }

    let elseBody: Stmt[] = [];
    if (this.check('KEYWORD', 'else')) {
      const elseTok = this.advance();
      this.expectColon('else', elseTok.line);
      elseBody = this.parseBlock(elseTok.line, 'else');
    }

    return { kind: 'If', branches, elseBody, line: ifTok.line };
  }

  private parseWhile(): Stmt {
    const whileTok = this.advance();
    const test = this.parseExpr();
    this.expectColon('while', whileTok.line);
    const body = this.parseBlock(whileTok.line, 'while');
    return { kind: 'While', test, body, line: whileTok.line };
  }

  private parseFor(): Stmt {
    const forTok = this.advance();
    const target = this.parseForTarget(forTok.line);
    if (!this.match('KEYWORD', 'in')) {
      throw new PySyntaxError(
        `SyntaxError di baris ${forTok.line}: Pernyataan 'for' harus menggunakan kata kunci 'in' (contoh: for i in range(n):).`,
        forTok.line
      );
    }
    const iter = this.parseExprListOrSingle();
    this.expectColon('for', forTok.line);
    const body = this.parseBlock(forTok.line, 'for');
    return { kind: 'For', target, iter, body, line: forTok.line };
  }

  private parseForTarget(line: number): AssignTarget {
    const names: AssignTarget[] = [];
    const first = this.peek();
    if (first.type !== 'IDENT') {
      throw new PySyntaxError(
        `SyntaxError di baris ${line}: Variabel iterasi setelah 'for' tidak valid.`,
        line
      );
    }
    this.advance();
    names.push({ kind: 'NameTarget', name: first.value });
    while (this.match('OP', ',')) {
      const next = this.peek();
      if (next.type !== 'IDENT') {
        throw new PySyntaxError(
          `SyntaxError di baris ${line}: Nama variabel iterasi tidak valid setelah koma.`,
          line
        );
      }
      this.advance();
      names.push({ kind: 'NameTarget', name: next.value });
    }
    return names.length === 1 ? names[0] : { kind: 'TupleTarget', elements: names };
  }

  private parseDef(): Stmt {
    const defTok = this.advance();
    const nameTok = this.peek();
    if (nameTok.type !== 'IDENT') {
      throw new PySyntaxError(
        `SyntaxError di baris ${defTok.line}: Nama fungsi setelah 'def' tidak valid.`,
        defTok.line
      );
    }
    this.advance();

    if (!this.match('OP', '(')) {
      throw new PySyntaxError(
        `SyntaxError di baris ${defTok.line}: Definisi fungsi '${nameTok.value}' harus diikuti tanda kurung '('.`,
        defTok.line
      );
    }

    const params: Array<{ name: string; defaultVal?: Expr }> = [];
    if (!this.check('OP', ')')) {
      do {
        const pTok = this.peek();
        if (pTok.type !== 'IDENT') {
          throw new PySyntaxError(
            `SyntaxError di baris ${pTok.line}: Parameter fungsi tidak valid.`,
            pTok.line
          );
        }
        this.advance();
        let defaultVal: Expr | undefined;
        if (this.match('OP', '=')) {
          defaultVal = this.parseExpr();
        }
        params.push({ name: pTok.value, defaultVal });
      } while (this.match('OP', ','));
    }

    if (!this.match('OP', ')')) {
      throw new PySyntaxError(
        `SyntaxError di baris ${defTok.line}: Tanda kurung penutup ')' pada definisi fungsi '${nameTok.value}' tidak ditemukan.`,
        defTok.line
      );
    }

    this.expectColon('def', defTok.line);
    const body = this.parseBlock(defTok.line, 'def');
    return { kind: 'Def', name: nameTok.value, params, body, line: defTok.line };
  }

  private parseSimpleStatement(): Stmt {
    const tok = this.peek();
    if (tok.type === 'KEYWORD') {
      if (tok.value === 'return') {
        this.advance();
        if (this.check('NEWLINE') || this.check('EOF') || this.check('DEDENT')) {
          return { kind: 'Return', value: null, line: tok.line };
        }
        return { kind: 'Return', value: this.parseExprListOrSingle(), line: tok.line };
      }
      if (tok.value === 'break') {
        this.advance();
        return { kind: 'Break', line: tok.line };
      }
      if (tok.value === 'continue') {
        this.advance();
        return { kind: 'Continue', line: tok.line };
      }
      if (tok.value === 'pass') {
        this.advance();
        return { kind: 'Pass', line: tok.line };
      }
    }

    const expr = this.parseExprListOrSingle();
    const next = this.peek();

    // Standard assignment (supports chained or tuple unpacking)
    if (next.type === 'OP' && next.value === '=') {
      const targets: AssignTarget[] = [this.exprToTarget(expr, next.line)];
      while (this.match('OP', '=')) {
        const rhs = this.parseExprListOrSingle();
        if (this.check('OP', '=')) {
          targets.push(this.exprToTarget(rhs, this.peek().line));
        } else {
          return { kind: 'Assign', targets, value: rhs, line: tok.line };
        }
      }
    }

    // Augmented assignment (+=, -=, *=, /=, //=, %=, **=)
    if (
      next.type === 'OP' &&
      ['+=', '-=', '*=', '/=', '//=', '%=', '**='].includes(next.value)
    ) {
      this.advance();
      const rhs = this.parseExpr();
      return {
        kind: 'AugAssign',
        target: this.exprToTarget(expr, next.line),
        op: next.value.slice(0, -1),
        value: rhs,
        line: tok.line,
      };
    }

    return { kind: 'ExprStmt', expr, line: tok.line };
  }

  private exprToTarget(expr: Expr, line: number): AssignTarget {
    if (expr.kind === 'Name') {
      return { kind: 'NameTarget', name: expr.name };
    }
    if (expr.kind === 'Subscript') {
      return { kind: 'IndexTarget', object: expr.object, index: expr.index };
    }
    if (expr.kind === 'Tuple' || expr.kind === 'List') {
      return {
        kind: 'TupleTarget',
        elements: expr.elements.map((e) => this.exprToTarget(e, line)),
      };
    }
    throw new PySyntaxError(
      `SyntaxError di baris ${line}: Target assignment tidak valid. Hanya variabel, elemen list, atau tuple variabel yang dapat diberi nilai.`,
      line
    );
  }

  parseExprListOrSingle(): Expr {
    const first = this.parseExpr();
    if (!this.check('OP', ',')) {
      return first;
    }
    const elements: Expr[] = [first];
    while (this.match('OP', ',')) {
      if (
        this.check('NEWLINE') ||
        this.check('EOF') ||
        this.check('OP', '=') ||
        this.check('OP', ':') ||
        this.check('OP', ')')
      ) {
        break;
      }
      elements.push(this.parseExpr());
    }
    return { kind: 'Tuple', elements, line: first.line };
  }

  parseExpr(): Expr {
    const expr = this.parseOr();
    // Conditional ternary expression: a if cond else b
    if (this.match('KEYWORD', 'if')) {
      const test = this.parseOr();
      if (!this.match('KEYWORD', 'else')) {
        throw new PySyntaxError(
          `SyntaxError di baris ${expr.line}: Ekspresi kondisional 'if' sebaris harus diikuti kata kunci 'else'.`,
          expr.line
        );
      }
      const orelse = this.parseExpr();
      return { kind: 'Ternary', body: expr, test, orelse, line: expr.line };
    }
    return expr;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.match('KEYWORD', 'or')) {
      const right = this.parseAnd();
      left = { kind: 'BoolOp', op: 'or', left, right, line: left.line };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.match('KEYWORD', 'and')) {
      const right = this.parseNot();
      left = { kind: 'BoolOp', op: 'and', left, right, line: left.line };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.check('KEYWORD', 'not')) {
      const tok = this.advance();
      const operand = this.parseNot();
      return { kind: 'Unary', op: 'not', operand, line: tok.line };
    }
    return this.parseCompare();
  }

  private parseCompare(): Expr {
    const left = this.parseAdditive();
    const ops: string[] = [];
    const comparators: Expr[] = [];

    while (true) {
      const tok = this.peek();
      if (
        tok.type === 'OP' &&
        ['==', '!=', '<', '<=', '>', '>='].includes(tok.value)
      ) {
        this.advance();
        ops.push(tok.value);
        comparators.push(this.parseAdditive());
      } else if (tok.type === 'KEYWORD' && tok.value === 'in') {
        this.advance();
        ops.push('in');
        comparators.push(this.parseAdditive());
      } else if (
        tok.type === 'KEYWORD' &&
        tok.value === 'not' &&
        this.peek(1).type === 'KEYWORD' &&
        this.peek(1).value === 'in'
      ) {
        this.advance();
        this.advance();
        ops.push('not in');
        comparators.push(this.parseAdditive());
      } else if (tok.type === 'KEYWORD' && tok.value === 'is') {
        this.advance();
        if (this.match('KEYWORD', 'not')) {
          ops.push('is not');
        } else {
          ops.push('is');
        }
        comparators.push(this.parseAdditive());
      } else {
        break;
      }
    }

    if (ops.length === 0) return left;
    return { kind: 'Compare', left, ops, comparators, line: left.line };
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.check('OP', '+') || this.check('OP', '-')) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { kind: 'Binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (
      this.check('OP', '*') ||
      this.check('OP', '/') ||
      this.check('OP', '//') ||
      this.check('OP', '%')
    ) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: 'Binary', op, left, right, line: left.line };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.check('OP', '-') || this.check('OP', '+')) {
      const tok = this.advance();
      const operand = this.parseUnary();
      return { kind: 'Unary', op: tok.value, operand, line: tok.line };
    }
    return this.parsePower();
  }

  private parsePower(): Expr {
    const left = this.parsePostfix();
    if (this.match('OP', '**')) {
      const right = this.parseUnary();
      return { kind: 'Binary', op: '**', left, right, line: left.line };
    }
    return left;
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (true) {
      if (this.match('OP', '(')) {
        const args: Expr[] = [];
        const kwargs: Array<{ name: string; value: Expr }> = [];
        if (!this.check('OP', ')')) {
          do {
            if (this.check('OP', ')')) break;
            // Check keyword argument name=value
            if (
              this.peek().type === 'IDENT' &&
              this.peek(1).type === 'OP' &&
              this.peek(1).value === '='
            ) {
              const kwName = this.advance().value;
              this.advance(); // '='
              kwargs.push({ name: kwName, value: this.parseExpr() });
            } else {
              args.push(this.parseExpr());
            }
          } while (this.match('OP', ','));
        }
        if (!this.match('OP', ')')) {
          throw new PySyntaxError(
            `SyntaxError di baris ${expr.line}: Tanda kurung penutup ')' pada pemanggilan fungsi tidak ditemukan.`,
            expr.line
          );
        }
        expr = { kind: 'Call', callee: expr, args, kwargs, line: expr.line };
      } else if (this.match('OP', '.')) {
        const attrTok = this.peek();
        if (attrTok.type !== 'IDENT') {
          throw new PySyntaxError(
            `SyntaxError di baris ${attrTok.line}: Nama metode/atribut setelah tanda titik '.' tidak valid.`,
            attrTok.line
          );
        }
        this.advance();
        expr = { kind: 'Attr', object: expr, attr: attrTok.value, line: attrTok.line };
      } else if (this.match('OP', '[')) {
        // Handle indexing or slicing [start:stop:step]
        let start: Expr | null = null;
        if (!this.check('OP', ':')) {
          start = this.parseExpr();
        }
        if (this.match('OP', ':')) {
          let stop: Expr | null = null;
          let step: Expr | null = null;
          if (!this.check('OP', ':') && !this.check('OP', ']')) {
            stop = this.parseExpr();
          }
          if (this.match('OP', ':')) {
            if (!this.check('OP', ']')) {
              step = this.parseExpr();
            }
          }
          if (!this.match('OP', ']')) {
            throw new PySyntaxError(
              `SyntaxError di baris ${expr.line}: Tanda kurung siku penutup ']' pada slicing tidak ditemukan.`,
              expr.line
            );
          }
          expr = { kind: 'Slice', object: expr, start, stop, step, line: expr.line };
        } else {
          if (!this.match('OP', ']')) {
            throw new PySyntaxError(
              `SyntaxError di baris ${expr.line}: Tanda kurung siku penutup ']' pada pengindeksan tidak ditemukan.`,
              expr.line
            );
          }
          expr = { kind: 'Subscript', object: expr, index: start!, line: expr.line };
        }
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimary(): Expr {
    const tok = this.peek();

    if (tok.type === 'NUMBER') {
      this.advance();
      return { kind: 'Literal', value: Number(tok.value), line: tok.line };
    }

    if (tok.type === 'STRING') {
      this.advance();
      return { kind: 'Literal', value: tok.value, line: tok.line };
    }

    if (tok.type === 'FSTRING') {
      this.advance();
      return { kind: 'FString', raw: tok.value, line: tok.line };
    }

    if (tok.type === 'KEYWORD') {
      if (tok.value === 'True') {
        this.advance();
        return { kind: 'Literal', value: true, line: tok.line };
      }
      if (tok.value === 'False') {
        this.advance();
        return { kind: 'Literal', value: false, line: tok.line };
      }
      if (tok.value === 'None') {
        this.advance();
        return { kind: 'Literal', value: null, line: tok.line };
      }
    }

    if (tok.type === 'IDENT') {
      this.advance();
      return { kind: 'Name', name: tok.value, line: tok.line };
    }

    if (this.match('OP', '(')) {
      if (this.match('OP', ')')) {
        return { kind: 'Tuple', elements: [], line: tok.line };
      }
      const first = this.parseExpr();
      if (this.match('OP', ',')) {
        const elements: Expr[] = [first];
        while (!this.check('OP', ')') && !this.check('EOF')) {
          elements.push(this.parseExpr());
          if (!this.match('OP', ',')) break;
        }
        if (!this.match('OP', ')')) {
          throw new PySyntaxError(
            `SyntaxError di baris ${tok.line}: Tanda kurung '(' tidak ditutup dengan ')'.`,
            tok.line
          );
        }
        return { kind: 'Tuple', elements, line: tok.line };
      }
      if (!this.match('OP', ')')) {
        throw new PySyntaxError(
          `SyntaxError di baris ${tok.line}: Tanda kurung '(' tidak ditutup dengan ')'.`,
          tok.line
        );
      }
      return first;
    }

    if (this.match('OP', '[')) {
      if (this.match('OP', ']')) {
        return { kind: 'List', elements: [], line: tok.line };
      }
      const first = this.parseExpr();
      // List comprehension: [expr for target in iter (if cond)?]
      if (this.match('KEYWORD', 'for')) {
        const target = this.parseForTarget(tok.line);
        if (!this.match('KEYWORD', 'in')) {
          throw new PySyntaxError(
            `SyntaxError di baris ${tok.line}: List comprehension membutuhkan kata kunci 'in'.`,
            tok.line
          );
        }
        const iter = this.parseOr();
        let cond: Expr | undefined;
        if (this.match('KEYWORD', 'if')) {
          cond = this.parseExpr();
        }
        if (!this.match('OP', ']')) {
          throw new PySyntaxError(
            `SyntaxError di baris ${tok.line}: List comprehension tidak ditutup dengan ']'.`,
            tok.line
          );
        }
        return { kind: 'ListComp', expr: first, target, iter, cond, line: tok.line };
      }
      const elements: Expr[] = [first];
      while (this.match('OP', ',')) {
        if (this.check('OP', ']')) break;
        elements.push(this.parseExpr());
      }
      if (!this.match('OP', ']')) {
        throw new PySyntaxError(
          `SyntaxError di baris ${tok.line}: List '[' tidak ditutup dengan ']'.`,
          tok.line
        );
      }
      return { kind: 'List', elements, line: tok.line };
    }

    if (this.match('OP', '{')) {
      const entries: Array<{ key: Expr; value: Expr }> = [];
      if (!this.check('OP', '}')) {
        do {
          if (this.check('OP', '}')) break;
          const key = this.parseExpr();
          if (!this.match('OP', ':')) {
            throw new PySyntaxError(
              `SyntaxError di baris ${tok.line}: Dictionary membutuhkan tanda ':' antara key dan value.`,
              tok.line
            );
          }
          const value = this.parseExpr();
          entries.push({ key, value });
        } while (this.match('OP', ','));
      }
      if (!this.match('OP', '}')) {
        throw new PySyntaxError(
          `SyntaxError di baris ${tok.line}: Dictionary '{' tidak ditutup dengan '}'.`,
          tok.line
        );
      }
      return { kind: 'Dict', entries, line: tok.line };
    }

    throw new PySyntaxError(
      `SyntaxError di baris ${tok.line}: Ekspresi tidak valid di dekat '${tok.value || 'akhir baris'}'.`,
      tok.line
    );
  }
}

/* ==========================================================================
   Runtime Values & Tree-Walking Interpreter
   ========================================================================== */

interface PyUserFunc {
  __pyType: 'user_func';
  name: string;
  params: Array<{ name: string; defaultVal?: Expr }>;
  body: Stmt[];
  closure: Env;
}

interface PyBuiltinFunc {
  __pyType: 'builtin';
  name: string;
  call: (args: PyVal[], kwargs: Record<string, PyVal>, line: number) => PyVal;
}

interface PyTuple {
  __pyType: 'tuple';
  items: PyVal[];
}

interface PyDict {
  __pyType: 'dict';
  map: Map<string, PyVal>;
}

type PyVal =
  | number
  | string
  | boolean
  | null
  | PyVal[]
  | PyTuple
  | PyDict
  | PyUserFunc
  | PyBuiltinFunc;

class Env {
  private values = new Map<string, PyVal>();
  parent: Env | null;

  constructor(parent: Env | null = null) {
    this.parent = parent;
  }

  get(name: string, line: number): PyVal {
    if (this.values.has(name)) {
      return this.values.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name, line);
    }
    throw new PyRuntimeError(
      'NameError',
      `NameError di baris ${line}: Variabel atau fungsi '${name}' belum didefinisikan. Periksa ejaan atau pastikan variabel sudah diberi nilai sebelum digunakan.`,
      line
    );
  }

  set(name: string, val: PyVal): void {
    this.values.set(name, val);
  }
}

class ReturnSignal {
  value: PyVal;
  constructor(value: PyVal) {
    this.value = value;
  }
}
class BreakSignal {}
class ContinueSignal {}

function isTuple(v: PyVal): v is PyTuple {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && '__pyType' in v && v.__pyType === 'tuple';
}

function isDict(v: PyVal): v is PyDict {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && '__pyType' in v && v.__pyType === 'dict';
}

function isCallable(v: PyVal): v is PyUserFunc | PyBuiltinFunc {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    '__pyType' in v &&
    (v.__pyType === 'user_func' || v.__pyType === 'builtin')
  );
}

function isTruthy(v: PyVal): boolean {
  if (v === null || v === false) return false;
  if (v === true) return true;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (isTuple(v)) return v.items.length > 0;
  if (isDict(v)) return v.map.size > 0;
  return true;
}

function toIterable(v: PyVal, line: number): PyVal[] {
  if (Array.isArray(v)) return v;
  if (isTuple(v)) return v.items;
  if (typeof v === 'string') return Array.from(v);
  if (isDict(v)) return Array.from(v.map.keys());
  throw new PyRuntimeError(
    'TypeError',
    `TypeError di baris ${line}: Nilai bertipe ini tidak dapat diiterasi (not iterable).`,
    line
  );
}

function pyToString(v: PyVal, repr = false): string {
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'number') {
    if (Object.is(v, -0)) return '0';
    return String(v);
  }
  if (typeof v === 'string') {
    return repr ? `'${v}'` : v;
  }
  if (Array.isArray(v)) {
    return `[${v.map((item) => pyToString(item, true)).join(', ')}]`;
  }
  if (isTuple(v)) {
    if (v.items.length === 1) {
      return `(${pyToString(v.items[0], true)},)`;
    }
    return `(${v.items.map((item) => pyToString(item, true)).join(', ')})`;
  }
  if (isDict(v)) {
    const parts: string[] = [];
    v.map.forEach((val, key) => {
      parts.push(`'${key}': ${pyToString(val, true)}`);
    });
    return `{${parts.join(', ')}}`;
  }
  if (isCallable(v)) {
    return `<function ${v.name}>`;
  }
  return String(v);
}

function pyEquals(a: PyVal, b: PyVal): boolean {
  if (typeof a === 'boolean' && typeof b === 'number') return (a ? 1 : 0) === b;
  if (typeof a === 'number' && typeof b === 'boolean') return a === (b ? 1 : 0);
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((el, idx) => pyEquals(el, b[idx]));
  }
  if (isTuple(a) && isTuple(b)) {
    return a.items.length === b.items.length && a.items.every((el, idx) => pyEquals(el, b.items[idx]));
  }
  return false;
}

function formatWithSpec(val: PyVal, spec: string): string {
  if (!spec) return pyToString(val);
  // Support .Nf (e.g., .2f), d, s, width padding
  const match = spec.match(/^([<>^]?)(0?)(\d*)(?:\.(\d+))?([fds]?)$/);
  if (!match) return pyToString(val);
  const [, align, zeroPad, widthStr, precStr, type] = match;
  let result: string;

  if (type === 'f') {
    const num = Number(val);
    const prec = precStr !== undefined ? Number(precStr) : 6;
    result = Number.isNaN(num) ? pyToString(val) : num.toFixed(prec);
  } else if (type === 'd') {
    const num = Number(val);
    result = Number.isNaN(num) ? pyToString(val) : String(Math.trunc(num));
  } else {
    result = pyToString(val);
    if (precStr !== undefined) {
      result = result.slice(0, Number(precStr));
    }
  }

  const width = widthStr ? Number(widthStr) : 0;
  if (width > result.length) {
    const padChar = zeroPad === '0' ? '0' : ' ';
    const diff = width - result.length;
    if (align === '<') {
      result = result + padChar.repeat(diff);
    } else if (align === '^') {
      const left = Math.floor(diff / 2);
      result = padChar.repeat(left) + result + padChar.repeat(diff - left);
    } else {
      result = padChar.repeat(diff) + result;
    }
  }
  return result;
}

class Interpreter {
  private stdinLines: string[];
  private stdinIdx = 0;
  private stdoutChunks: string[] = [];
  private steps = 0;
  private readonly MAX_STEPS = 80000;
  private readonly MAX_RECURSION = 200;
  private callDepth = 0;
  private globalEnv: Env;

  constructor(stdin: string) {
    const cleaned = stdin.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    this.stdinLines = cleaned.length === 0 ? [] : cleaned.split('\n');
    this.globalEnv = this.createGlobalEnv();
  }

  private tick(line: number): void {
    this.steps++;
    if (this.steps > this.MAX_STEPS) {
      throw new PyRuntimeError(
        'TimeoutError',
        `TimeoutError di baris ${line}: Eksekusi melebihi batas waktu 2 detik (terindikasi perulangan tak berujung / infinite loop). Periksa kondisi berhenti pada while atau for Anda.`,
        line
      );
    }
  }

  private createGlobalEnv(): Env {
    const env = new Env(null);

    const addBuiltin = (
      name: string,
      call: (args: PyVal[], kwargs: Record<string, PyVal>, line: number) => PyVal
    ) => {
      env.set(name, { __pyType: 'builtin', name, call });
    };

    addBuiltin('print', (args, kwargs) => {
      const sep = kwargs.sep !== undefined ? pyToString(kwargs.sep) : ' ';
      const end = kwargs.end !== undefined ? pyToString(kwargs.end) : '\n';
      this.stdoutChunks.push(args.map((a) => pyToString(a)).join(sep) + end);
      return null;
    });

    addBuiltin('input', (_args, _kwargs, line) => {
      if (this.stdinIdx >= this.stdinLines.length) {
        throw new PyRuntimeError(
          'EOFError',
          `EOFError di baris ${line}: Fungsi input() dipanggil lebih banyak daripada jumlah baris data masukan yang tersedia.`,
          line
        );
      }
      return this.stdinLines[this.stdinIdx++];
    });

    addBuiltin('int', (args, _kwargs, line) => {
      if (args.length === 0) return 0;
      const v = args[0];
      if (typeof v === 'number') return Math.trunc(v);
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (!/^[+-]?\d+$/.test(trimmed)) {
          throw new PyRuntimeError(
            'ValueError',
            `ValueError di baris ${line}: Tidak dapat mengonversi '${v}' menjadi bilangan bulat int(). Pastikan input berupa angka bulat yang valid.`,
            line
          );
        }
        return parseInt(trimmed, 10);
      }
      throw new PyRuntimeError(
        'TypeError',
        `TypeError di baris ${line}: Argumen untuk int() tidak dapat dikonversi menjadi bilangan bulat.`,
        line
      );
    });

    addBuiltin('float', (args, _kwargs, line) => {
      if (args.length === 0) return 0;
      const v = args[0];
      if (typeof v === 'number') return v;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed === '' || Number.isNaN(Number(trimmed))) {
          throw new PyRuntimeError(
            'ValueError',
            `ValueError di baris ${line}: Tidak dapat mengonversi '${v}' menjadi bilangan desimal float().`,
            line
          );
        }
        return Number(trimmed);
      }
      throw new PyRuntimeError(
        'TypeError',
        `TypeError di baris ${line}: Argumen untuk float() tidak valid.`,
        line
      );
    });

    addBuiltin('str', (args) => (args.length === 0 ? '' : pyToString(args[0])));
    addBuiltin('bool', (args) => (args.length === 0 ? false : isTruthy(args[0])));

    addBuiltin('len', (args, _kwargs, line) => {
      if (args.length !== 1) {
        throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: len() membutuhkan tepat 1 argumen.`, line);
      }
      const v = args[0];
      if (typeof v === 'string' || Array.isArray(v)) return v.length;
      if (isTuple(v)) return v.items.length;
      if (isDict(v)) return v.map.size;
      throw new PyRuntimeError(
        'TypeError',
        `TypeError di baris ${line}: Objek ini tidak memiliki panjang (tidak mendukung len()).`,
        line
      );
    });

    addBuiltin('list', (args, _kwargs, line) => {
      if (args.length === 0) return [];
      return [...toIterable(args[0], line)];
    });

    addBuiltin('tuple', (args, _kwargs, line) => {
      if (args.length === 0) return { __pyType: 'tuple', items: [] };
      return { __pyType: 'tuple', items: [...toIterable(args[0], line)] };
    });

    addBuiltin('range', (args, _kwargs, line) => {
      if (args.length < 1 || args.length > 3) {
        throw new PyRuntimeError(
          'TypeError',
          `TypeError di baris ${line}: range() menerima 1 hingga 3 argumen bilangan bulat.`,
          line
        );
      }
      const nums = args.map((a) => {
        if (typeof a !== 'number' || !Number.isInteger(a)) {
          throw new PyRuntimeError(
            'TypeError',
            `TypeError di baris ${line}: Argumen range() harus berupa bilangan bulat (int).`,
            line
          );
        }
        return a;
      });
      const start = nums.length === 1 ? 0 : nums[0];
      const stop = nums.length === 1 ? nums[0] : nums[1];
      const step = nums.length === 3 ? nums[2] : 1;
      if (step === 0) {
        throw new PyRuntimeError(
          'ValueError',
          `ValueError di baris ${line}: Argumen step pada range() tidak boleh bernilai 0.`,
          line
        );
      }
      const result: number[] = [];
      if (step > 0) {
        for (let i = start; i < stop; i += step) {
          this.tick(line);
          result.push(i);
        }
      } else {
        for (let i = start; i > stop; i += step) {
          this.tick(line);
          result.push(i);
        }
      }
      return result;
    });

    addBuiltin('map', (args, _kwargs, line) => {
      if (args.length !== 2) {
        throw new PyRuntimeError(
          'TypeError',
          `TypeError di baris ${line}: map() membutuhkan 2 argumen (fungsi dan iterable).`,
          line
        );
      }
      const fn = args[0];
      if (!isCallable(fn)) {
        throw new PyRuntimeError(
          'TypeError',
          `TypeError di baris ${line}: Argumen pertama map() harus berupa fungsi (misal int, float, atau str).`,
          line
        );
      }
      const items = toIterable(args[1], line);
      return items.map((item) => this.invokeCallable(fn, [item], {}, line));
    });

    addBuiltin('sum', (args, _kwargs, line) => {
      if (args.length < 1 || args.length > 2) {
        throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: sum() menerima 1 atau 2 argumen.`, line);
      }
      const items = toIterable(args[0], line);
      let acc = args.length === 2 && typeof args[1] === 'number' ? args[1] : 0;
      for (const item of items) {
        if (typeof item !== 'number') {
          throw new PyRuntimeError(
            'TypeError',
            `TypeError di baris ${line}: sum() hanya dapat menjumlahkan elemen bertipe numerik.`,
            line
          );
        }
        acc += item;
      }
      return acc;
    });

    addBuiltin('max', (args, _kwargs, line) => {
      if (args.length === 0) {
        throw new PyRuntimeError('ValueError', `ValueError di baris ${line}: max() membutuhkan minimal 1 argumen.`, line);
      }
      const items = args.length === 1 ? toIterable(args[0], line) : args;
      if (items.length === 0) {
        throw new PyRuntimeError('ValueError', `ValueError di baris ${line}: max() tidak dapat memproses list kosong.`, line);
      }
      let best = items[0];
      for (let i = 1; i < items.length; i++) {
        if (this.compareTwo('>', items[i], best, line)) best = items[i];
      }
      return best;
    });

    addBuiltin('min', (args, _kwargs, line) => {
      if (args.length === 0) {
        throw new PyRuntimeError('ValueError', `ValueError di baris ${line}: min() membutuhkan minimal 1 argumen.`, line);
      }
      const items = args.length === 1 ? toIterable(args[0], line) : args;
      if (items.length === 0) {
        throw new PyRuntimeError('ValueError', `ValueError di baris ${line}: min() tidak dapat memproses list kosong.`, line);
      }
      let best = items[0];
      for (let i = 1; i < items.length; i++) {
        if (this.compareTwo('<', items[i], best, line)) best = items[i];
      }
      return best;
    });

    addBuiltin('abs', (args, _kwargs, line) => {
      if (args.length !== 1 || typeof args[0] !== 'number') {
        throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: abs() membutuhkan 1 argumen numerik.`, line);
      }
      return Math.abs(args[0]);
    });

    addBuiltin('round', (args, _kwargs, line) => {
      if (args.length < 1 || args.length > 2 || typeof args[0] !== 'number') {
        throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Argumen round() harus bertipe angka.`, line);
      }
      if (args.length === 1) return Math.round(args[0]);
      const digits = Number(args[1]);
      const factor = Math.pow(10, digits);
      return Math.round(args[0] * factor) / factor;
    });

    addBuiltin('sorted', (args, kwargs, line) => {
      if (args.length !== 1) {
        throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: sorted() membutuhkan 1 iterable.`, line);
      }
      const items = [...toIterable(args[0], line)];
      const reverse = kwargs.reverse ? isTruthy(kwargs.reverse) : false;
      items.sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return reverse ? b - a : a - b;
        return reverse ? pyToString(b).localeCompare(pyToString(a)) : pyToString(a).localeCompare(pyToString(b));
      });
      return items;
    });

    addBuiltin('reversed', (args, _kwargs, line) => {
      if (args.length !== 1) {
        throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: reversed() membutuhkan 1 argumen.`, line);
      }
      return [...toIterable(args[0], line)].reverse();
    });

    addBuiltin('enumerate', (args, _kwargs, line) => {
      if (args.length < 1 || args.length > 2) {
        throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: enumerate() menerima 1 atau 2 argumen.`, line);
      }
      const items = toIterable(args[0], line);
      const start = args.length === 2 && typeof args[1] === 'number' ? args[1] : 0;
      return items.map((item, idx) => ({ __pyType: 'tuple' as const, items: [start + idx, item] }));
    });

    addBuiltin('pow', (args, _kwargs, line) => {
      if (args.length !== 2 || typeof args[0] !== 'number' || typeof args[1] !== 'number') {
        throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: pow() membutuhkan 2 argumen numerik.`, line);
      }
      return Math.pow(args[0], args[1]);
    });

    return env;
  }

  run(stmts: Stmt[]): string {
    this.execBlock(stmts, this.globalEnv);
    return this.stdoutChunks.join('');
  }

  private execBlock(stmts: Stmt[], env: Env): void {
    for (const stmt of stmts) {
      this.execStmt(stmt, env);
    }
  }

  private execStmt(stmt: Stmt, env: Env): void {
    this.tick(stmt.line);

    switch (stmt.kind) {
      case 'Pass':
        return;
      case 'Break':
        throw new BreakSignal();
      case 'Continue':
        throw new ContinueSignal();
      case 'Return': {
        const val = stmt.value ? this.evalExpr(stmt.value, env) : null;
        throw new ReturnSignal(val);
      }
      case 'ExprStmt':
        this.evalExpr(stmt.expr, env);
        return;
      case 'Assign': {
        const val = this.evalExpr(stmt.value, env);
        for (const target of stmt.targets) {
          this.assignTarget(target, val, env, stmt.line);
        }
        return;
      }
      case 'AugAssign': {
        const current = this.readTarget(stmt.target, env, stmt.line);
        const rhs = this.evalExpr(stmt.value, env);
        const nextVal = this.applyBinary(stmt.op, current, rhs, stmt.line);
        this.assignTarget(stmt.target, nextVal, env, stmt.line);
        return;
      }
      case 'If': {
        for (const branch of stmt.branches) {
          if (isTruthy(this.evalExpr(branch.test, env))) {
            this.execBlock(branch.body, env);
            return;
          }
        }
        if (stmt.elseBody.length > 0) {
          this.execBlock(stmt.elseBody, env);
        }
        return;
      }
      case 'While': {
        while (isTruthy(this.evalExpr(stmt.test, env))) {
          this.tick(stmt.line);
          try {
            this.execBlock(stmt.body, env);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return;
      }
      case 'For': {
        const iterVal = this.evalExpr(stmt.iter, env);
        const items = toIterable(iterVal, stmt.line);
        for (const item of items) {
          this.tick(stmt.line);
          this.assignTarget(stmt.target, item, env, stmt.line);
          try {
            this.execBlock(stmt.body, env);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return;
      }
      case 'Def': {
        const fn: PyUserFunc = {
          __pyType: 'user_func',
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          closure: env,
        };
        env.set(stmt.name, fn);
        return;
      }
    }
  }

  private readTarget(target: AssignTarget, env: Env, line: number): PyVal {
    if (target.kind === 'NameTarget') {
      return env.get(target.name, line);
    }
    if (target.kind === 'IndexTarget') {
      const obj = this.evalExpr(target.object, env);
      const idx = this.evalExpr(target.index, env);
      return this.getSubscript(obj, idx, line);
    }
    throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Operasi assignment bertingkat tidak didukung untuk tuple.`, line);
  }

  private assignTarget(target: AssignTarget, value: PyVal, env: Env, line: number): void {
    if (target.kind === 'NameTarget') {
      env.set(target.name, value);
      return;
    }
    if (target.kind === 'IndexTarget') {
      const obj = this.evalExpr(target.object, env);
      const idx = this.evalExpr(target.index, env);
      if (Array.isArray(obj)) {
        if (typeof idx !== 'number' || !Number.isInteger(idx)) {
          throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Indeks list harus berupa bilangan bulat.`, line);
        }
        const realIdx = idx < 0 ? obj.length + idx : idx;
        if (realIdx < 0 || realIdx >= obj.length) {
          throw new PyRuntimeError('IndexError', `IndexError di baris ${line}: Indeks list ${idx} berada di luar batas panjang list (${obj.length}).`, line);
        }
        obj[realIdx] = value;
        return;
      }
      if (isDict(obj)) {
        obj.map.set(pyToString(idx), value);
        return;
      }
      throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Objek ini tidak mendukung pengubahan elemen berdasarkan indeks.`, line);
    }
    if (target.kind === 'TupleTarget') {
      const items = toIterable(value, line);
      if (items.length !== target.elements.length) {
        throw new PyRuntimeError(
          'ValueError',
          `ValueError di baris ${line}: Jumlah nilai yang di-unpack (${items.length}) tidak sesuai dengan jumlah variabel target (${target.elements.length}).`,
          line
        );
      }
      for (let i = 0; i < target.elements.length; i++) {
        this.assignTarget(target.elements[i], items[i], env, line);
      }
    }
  }

  private evalExpr(expr: Expr, env: Env): PyVal {
    this.tick(expr.line);

    switch (expr.kind) {
      case 'Literal':
        return expr.value;
      case 'Name':
        return env.get(expr.name, expr.line);
      case 'List':
        return expr.elements.map((e) => this.evalExpr(e, env));
      case 'Tuple':
        return { __pyType: 'tuple', items: expr.elements.map((e) => this.evalExpr(e, env)) };
      case 'Dict': {
        const map = new Map<string, PyVal>();
        for (const entry of expr.entries) {
          const k = pyToString(this.evalExpr(entry.key, env));
          const v = this.evalExpr(entry.value, env);
          map.set(k, v);
        }
        return { __pyType: 'dict', map };
      }
      case 'ListComp': {
        const iterVal = this.evalExpr(expr.iter, env);
        const items = toIterable(iterVal, expr.line);
        const result: PyVal[] = [];
        const compEnv = new Env(env);
        for (const item of items) {
          this.tick(expr.line);
          this.assignTarget(expr.target, item, compEnv, expr.line);
          if (!expr.cond || isTruthy(this.evalExpr(expr.cond, compEnv))) {
            result.push(this.evalExpr(expr.expr, compEnv));
          }
        }
        return result;
      }
      case 'FString':
        return this.evalFString(expr.raw, env, expr.line);
      case 'Unary': {
        const v = this.evalExpr(expr.operand, env);
        if (expr.op === 'not') return !isTruthy(v);
        if (typeof v !== 'number') {
          throw new PyRuntimeError(
            'TypeError',
            `TypeError di baris ${expr.line}: Operator unary '${expr.op}' hanya dapat digunakan pada angka.`,
            expr.line
          );
        }
        return expr.op === '-' ? -v : +v;
      }
      case 'Binary': {
        const left = this.evalExpr(expr.left, env);
        const right = this.evalExpr(expr.right, env);
        return this.applyBinary(expr.op, left, right, expr.line);
      }
      case 'BoolOp': {
        const left = this.evalExpr(expr.left, env);
        if (expr.op === 'and') {
          return isTruthy(left) ? this.evalExpr(expr.right, env) : left;
        }
        return isTruthy(left) ? left : this.evalExpr(expr.right, env);
      }
      case 'Compare': {
        let left = this.evalExpr(expr.left, env);
        for (let i = 0; i < expr.ops.length; i++) {
          const right = this.evalExpr(expr.comparators[i], env);
          if (!this.compareTwo(expr.ops[i], left, right, expr.line)) {
            return false;
          }
          left = right;
        }
        return true;
      }
      case 'Ternary':
        return isTruthy(this.evalExpr(expr.test, env))
          ? this.evalExpr(expr.body, env)
          : this.evalExpr(expr.orelse, env);
      case 'Subscript': {
        const obj = this.evalExpr(expr.object, env);
        const idx = this.evalExpr(expr.index, env);
        return this.getSubscript(obj, idx, expr.line);
      }
      case 'Slice': {
        const obj = this.evalExpr(expr.object, env);
        const startVal = expr.start ? this.evalExpr(expr.start, env) : null;
        const stopVal = expr.stop ? this.evalExpr(expr.stop, env) : null;
        const stepVal = expr.step ? this.evalExpr(expr.step, env) : null;
        return this.applySlice(obj, startVal, stopVal, stepVal, expr.line);
      }
      case 'Attr': {
        const obj = this.evalExpr(expr.object, env);
        return this.getAttribute(obj, expr.attr, expr.line);
      }
      case 'Call': {
        const callee = this.evalExpr(expr.callee, env);
        const args = expr.args.map((a) => this.evalExpr(a, env));
        const kwargs: Record<string, PyVal> = {};
        for (const kw of expr.kwargs) {
          kwargs[kw.name] = this.evalExpr(kw.value, env);
        }
        return this.invokeCallable(callee, args, kwargs, expr.line);
      }
    }
  }

  private evalFString(raw: string, env: Env, line: number): string {
    let out = '';
    let i = 0;
    while (i < raw.length) {
      if (raw[i] === '{') {
        if (raw[i + 1] === '{') {
          out += '{';
          i += 2;
          continue;
        }
        let depth = 1;
        let j = i + 1;
        while (j < raw.length && depth > 0) {
          if (raw[j] === '{') depth++;
          else if (raw[j] === '}') depth--;
          j++;
        }
        if (depth !== 0) {
          throw new PySyntaxError(`SyntaxError di baris ${line}: Kurung kurawal '{' pada f-string tidak ditutup.`, line);
        }
        const inside = raw.slice(i + 1, j - 1);
        // Split top-level format specifier ':'
        let colonIdx = -1;
        let pDepth = 0;
        for (let k = 0; k < inside.length; k++) {
          const c = inside[k];
          if (c === '(' || c === '[') pDepth++;
          else if (c === ')' || c === ']') pDepth--;
          else if (c === ':' && pDepth === 0) {
            colonIdx = k;
            break;
          }
        }
        const exprSrc = (colonIdx === -1 ? inside : inside.slice(0, colonIdx)).trim();
        const spec = colonIdx === -1 ? '' : inside.slice(colonIdx + 1).trim();
        const subTokens = tokenize(exprSrc);
        const subParser = new Parser(subTokens);
        const subExpr = subParser.parseExpr();
        const val = this.evalExpr(subExpr, env);
        out += formatWithSpec(val, spec);
        i = j;
      } else if (raw[i] === '}' && raw[i + 1] === '}') {
        out += '}';
        i += 2;
      } else {
        out += raw[i];
        i++;
      }
    }
    return out;
  }

  private applyBinary(op: string, left: PyVal, right: PyVal, line: number): PyVal {
    // String & list concatenation / repetition / printf formatting
    if (op === '+') {
      if (typeof left === 'number' && typeof right === 'number') return left + right;
      if (typeof left === 'string' && typeof right === 'string') return left + right;
      if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right];
      throw new PyRuntimeError(
        'TypeError',
        `TypeError di baris ${line}: Operator '+' tidak dapat menggabungkan tipe data yang berbeda (misalnya string dengan angka). Gunakan str() atau int() untuk konversi.`,
        line
      );
    }

    if (op === '*') {
      if (typeof left === 'number' && typeof right === 'number') return left * right;
      if (typeof left === 'string' && typeof right === 'number') return left.repeat(Math.max(0, Math.trunc(right)));
      if (typeof left === 'number' && typeof right === 'string') return right.repeat(Math.max(0, Math.trunc(left)));
      if (Array.isArray(left) && typeof right === 'number') {
        const res: PyVal[] = [];
        for (let i = 0; i < Math.max(0, Math.trunc(right)); i++) res.push(...left);
        return res;
      }
      throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Operator '*' tidak mendukung kombinasi tipe data tersebut.`, line);
    }

    if (op === '%' && typeof left === 'string') {
      const vals = isTuple(right) ? right.items : [right];
      let idx = 0;
      return left.replace(/%(\.\d+)?([dfs])/g, (_m, prec, type) => {
        const v = vals[idx++] ?? '';
        const spec = (prec ?? '') + type;
        return formatWithSpec(v, spec);
      });
    }

    if (typeof left !== 'number' || typeof right !== 'number') {
      throw new PyRuntimeError(
        'TypeError',
        `TypeError di baris ${line}: Operator aritmatika '${op}' hanya dapat digunakan pada bilangan (int/float).`,
        line
      );
    }

    switch (op) {
      case '-':
        return left - right;
      case '/':
        if (right === 0) {
          throw new PyRuntimeError(
            'ZeroDivisionError',
            `ZeroDivisionError di baris ${line}: Pembagian dengan nol tidak diperbolehkan. Pastikan penyebut tidak bernilai 0.`,
            line
          );
        }
        return left / right;
      case '//':
        if (right === 0) {
          throw new PyRuntimeError(
            'ZeroDivisionError',
            `ZeroDivisionError di baris ${line}: Pembagian bulat (//) dengan nol tidak diperbolehkan.`,
            line
          );
        }
        return Math.floor(left / right);
      case '%':
        if (right === 0) {
          throw new PyRuntimeError(
            'ZeroDivisionError',
            `ZeroDivisionError di baris ${line}: Operasi modulo (%) dengan nol tidak diperbolehkan.`,
            line
          );
        }
        return ((left % right) + right) % right;
      case '**':
        return Math.pow(left, right);
      default:
        throw new PyRuntimeError('TypeError', `Operator '${op}' tidak dikenali.`, line);
    }
  }

  private compareTwo(op: string, left: PyVal, right: PyVal, line: number): boolean {
    switch (op) {
      case '==':
        return pyEquals(left, right);
      case '!=':
        return !pyEquals(left, right);
      case 'is':
        return left === right;
      case 'is not':
        return left !== right;
      case 'in':
      case 'not in': {
        let found = false;
        if (typeof right === 'string' && typeof left === 'string') {
          found = right.includes(left);
        } else if (Array.isArray(right)) {
          found = right.some((el) => pyEquals(el, left));
        } else if (isTuple(right)) {
          found = right.items.some((el) => pyEquals(el, left));
        } else if (isDict(right)) {
          found = right.map.has(pyToString(left));
        } else {
          throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Operator '${op}' membutuhkan container (list/string/dict).`, line);
        }
        return op === 'in' ? found : !found;
      }
      case '<':
      case '<=':
      case '>':
      case '>=': {
        if (
          (typeof left === 'number' && typeof right === 'number') ||
          (typeof left === 'string' && typeof right === 'string')
        ) {
          if (op === '<') return left < right;
          if (op === '<=') return left <= right;
          if (op === '>') return left > right;
          return left >= right;
        }
        throw new PyRuntimeError(
          'TypeError',
          `TypeError di baris ${line}: Tidak dapat membandingkan tipe data berbeda menggunakan operator '${op}'.`,
          line
        );
      }
      default:
        return false;
    }
  }

  private getSubscript(obj: PyVal, idx: PyVal, line: number): PyVal {
    if (isDict(obj)) {
      const k = pyToString(idx);
      if (!obj.map.has(k)) {
        throw new PyRuntimeError('KeyError', `KeyError di baris ${line}: Kunci '${k}' tidak ditemukan di dalam dictionary.`, line);
      }
      return obj.map.get(k)!;
    }
    if (typeof idx !== 'number' || !Number.isInteger(idx)) {
      throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Indeks harus berupa bilangan bulat (int).`, line);
    }
    if (Array.isArray(obj)) {
      const realIdx = idx < 0 ? obj.length + idx : idx;
      if (realIdx < 0 || realIdx >= obj.length) {
        throw new PyRuntimeError('IndexError', `IndexError di baris ${line}: Indeks ${idx} di luar batas panjang list (${obj.length}).`, line);
      }
      return obj[realIdx];
    }
    if (isTuple(obj)) {
      const realIdx = idx < 0 ? obj.items.length + idx : idx;
      if (realIdx < 0 || realIdx >= obj.items.length) {
        throw new PyRuntimeError('IndexError', `IndexError di baris ${line}: Indeks ${idx} di luar batas panjang tuple.`, line);
      }
      return obj.items[realIdx];
    }
    if (typeof obj === 'string') {
      const realIdx = idx < 0 ? obj.length + idx : idx;
      if (realIdx < 0 || realIdx >= obj.length) {
        throw new PyRuntimeError('IndexError', `IndexError di baris ${line}: Indeks string ${idx} di luar batas.`, line);
      }
      return obj[realIdx];
    }
    throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Objek ini tidak mendukung pengindeksan [].`, line);
  }

  private applySlice(obj: PyVal, startVal: PyVal, stopVal: PyVal, stepVal: PyVal, line: number): PyVal {
    const step = stepVal === null ? 1 : Number(stepVal);
    if (!Number.isInteger(step) || step === 0) {
      throw new PyRuntimeError('ValueError', `ValueError di baris ${line}: Step pada slicing harus bilangan bulat bukan nol.`, line);
    }
    const items = typeof obj === 'string' ? Array.from(obj) : Array.isArray(obj) ? obj : isTuple(obj) ? obj.items : null;
    if (!items) {
      throw new PyRuntimeError('TypeError', `TypeError di baris ${line}: Objek ini tidak mendukung slicing.`, line);
    }
    const len = items.length;
    const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
    let start: number;
    let stop: number;
    if (step > 0) {
      start = startVal === null ? 0 : Number(startVal) < 0 ? len + Number(startVal) : Number(startVal);
      stop = stopVal === null ? len : Number(stopVal) < 0 ? len + Number(stopVal) : Number(stopVal);
      start = clamp(start, 0, len);
      stop = clamp(stop, 0, len);
    } else {
      start = startVal === null ? len - 1 : Number(startVal) < 0 ? len + Number(startVal) : Number(startVal);
      stop = stopVal === null ? -1 : Number(stopVal) < 0 ? len + Number(stopVal) : Number(stopVal);
      start = clamp(start, -1, len - 1);
      stop = clamp(stop, -1, len - 1);
    }
    const out: PyVal[] = [];
    if (step > 0) {
      for (let i = start; i < stop; i += step) out.push(items[i]);
    } else {
      for (let i = start; i > stop; i += step) out.push(items[i]);
    }
    if (typeof obj === 'string') return out.join('');
    if (isTuple(obj)) return { __pyType: 'tuple', items: out };
    return out;
  }

  private getAttribute(obj: PyVal, attr: string, line: number): PyVal {
    // String methods
    if (typeof obj === 'string') {
      const makeStrMethod = (fn: (args: PyVal[]) => PyVal): PyBuiltinFunc => ({
        __pyType: 'builtin',
        name: `str.${attr}`,
        call: (args) => fn(args),
      });
      switch (attr) {
        case 'split':
          return makeStrMethod((args) => {
            if (args.length === 0 || args[0] === null) {
              const trimmed = obj.trim();
              return trimmed === '' ? [] : trimmed.split(/\s+/);
            }
            return obj.split(pyToString(args[0]));
          });
        case 'strip':
          return makeStrMethod(() => obj.trim());
        case 'lstrip':
          return makeStrMethod(() => obj.trimStart());
        case 'rstrip':
          return makeStrMethod(() => obj.trimEnd());
        case 'lower':
          return makeStrMethod(() => obj.toLowerCase());
        case 'upper':
          return makeStrMethod(() => obj.toUpperCase());
        case 'title':
          return makeStrMethod(() =>
            obj.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          );
        case 'replace':
          return makeStrMethod((args) => obj.split(pyToString(args[0] ?? '')).join(pyToString(args[1] ?? '')));
        case 'join':
          return makeStrMethod((args) => toIterable(args[0], line).map((x) => pyToString(x)).join(obj));
        case 'startswith':
          return makeStrMethod((args) => obj.startsWith(pyToString(args[0] ?? '')));
        case 'endswith':
          return makeStrMethod((args) => obj.endsWith(pyToString(args[0] ?? '')));
        case 'isdigit':
          return makeStrMethod(() => /^\d+$/.test(obj));
        case 'count':
          return makeStrMethod((args) => {
            const sub = pyToString(args[0] ?? '');
            return sub === '' ? obj.length + 1 : obj.split(sub).length - 1;
          });
        case 'format':
          return makeStrMethod((args) => {
            let idx = 0;
            return obj.replace(/\{([^}]*)\}/g, (_m, inside) => {
              const colonIdx = inside.indexOf(':');
              const spec = colonIdx >= 0 ? inside.slice(colonIdx + 1) : '';
              const argIdx = colonIdx >= 0 ? inside.slice(0, colonIdx) : inside;
              const val = argIdx !== '' && !Number.isNaN(Number(argIdx)) ? args[Number(argIdx)] : args[idx++];
              return formatWithSpec(val ?? '', spec);
            });
          });
      }
    }

    // List methods
    if (Array.isArray(obj)) {
      const makeListMethod = (fn: (args: PyVal[]) => PyVal): PyBuiltinFunc => ({
        __pyType: 'builtin',
        name: `list.${attr}`,
        call: (args) => fn(args),
      });
      switch (attr) {
        case 'append':
          return makeListMethod((args) => {
            obj.push(args[0] ?? null);
            return null;
          });
        case 'extend':
          return makeListMethod((args) => {
            obj.push(...toIterable(args[0], line));
            return null;
          });
        case 'pop':
          return makeListMethod((args) => {
            if (obj.length === 0) {
              throw new PyRuntimeError('IndexError', `IndexError di baris ${line}: Tidak dapat melakukan pop() pada list kosong.`, line);
            }
            if (args.length === 0) return obj.pop()!;
            const idx = Number(args[0]);
            const realIdx = idx < 0 ? obj.length + idx : idx;
            return obj.splice(realIdx, 1)[0];
          });
        case 'insert':
          return makeListMethod((args) => {
            obj.splice(Number(args[0] ?? 0), 0, args[1] ?? null);
            return null;
          });
        case 'remove':
          return makeListMethod((args) => {
            const idx = obj.findIndex((el) => pyEquals(el, args[0]));
            if (idx === -1) {
              throw new PyRuntimeError('ValueError', `ValueError di baris ${line}: Elemen tidak ditemukan di dalam list saat memanggil remove().`, line);
            }
            obj.splice(idx, 1);
            return null;
          });
        case 'sort':
          return makeListMethod(() => {
            obj.sort((a, b) =>
              typeof a === 'number' && typeof b === 'number'
                ? a - b
                : pyToString(a).localeCompare(pyToString(b))
            );
            return null;
          });
        case 'reverse':
          return makeListMethod(() => {
            obj.reverse();
            return null;
          });
        case 'count':
          return makeListMethod((args) => obj.filter((el) => pyEquals(el, args[0])).length);
        case 'index':
          return makeListMethod((args) => {
            const idx = obj.findIndex((el) => pyEquals(el, args[0]));
            if (idx === -1) {
              throw new PyRuntimeError('ValueError', `ValueError di baris ${line}: Elemen tidak ditemukan pada list.index().`, line);
            }
            return idx;
          });
        case 'copy':
          return makeListMethod(() => [...obj]);
      }
    }

    // Dict methods
    if (isDict(obj)) {
      const makeDictMethod = (fn: (args: PyVal[]) => PyVal): PyBuiltinFunc => ({
        __pyType: 'builtin',
        name: `dict.${attr}`,
        call: (args) => fn(args),
      });
      switch (attr) {
        case 'get':
          return makeDictMethod((args) => {
            const k = pyToString(args[0] ?? '');
            return obj.map.has(k) ? obj.map.get(k)! : (args[1] ?? null);
          });
        case 'keys':
          return makeDictMethod(() => Array.from(obj.map.keys()));
        case 'values':
          return makeDictMethod(() => Array.from(obj.map.values()));
      }
    }

    throw new PyRuntimeError(
      'AttributeError',
      `AttributeError di baris ${line}: Metode atau atribut '.${attr}' tidak tersedia pada objek ini.`,
      line
    );
  }

  private invokeCallable(
    callee: PyVal,
    args: PyVal[],
    kwargs: Record<string, PyVal>,
    line: number
  ): PyVal {
    if (!isCallable(callee)) {
      throw new PyRuntimeError(
        'TypeError',
        `TypeError di baris ${line}: Objek ini bukan fungsi dan tidak dapat dipanggil dengan '()'.`,
        line
      );
    }
    if (callee.__pyType === 'builtin') {
      return callee.call(args, kwargs, line);
    }

    this.callDepth++;
    if (this.callDepth > this.MAX_RECURSION) {
      throw new PyRuntimeError(
        'RecursionError',
        `RecursionError di baris ${line}: Batas kedalaman rekursi maksimum terlampaui saat memanggil '${callee.name}()'.`,
        line
      );
    }

    const fnEnv = new Env(callee.closure);
    for (let i = 0; i < callee.params.length; i++) {
      const param = callee.params[i];
      if (i < args.length) {
        fnEnv.set(param.name, args[i]);
      } else if (param.name in kwargs) {
        fnEnv.set(param.name, kwargs[param.name]);
      } else if (param.defaultVal) {
        fnEnv.set(param.name, this.evalExpr(param.defaultVal, callee.closure));
      } else {
        this.callDepth--;
        throw new PyRuntimeError(
          'TypeError',
          `TypeError di baris ${line}: Fungsi '${callee.name}()' kekurangan argumen wajib '${param.name}'.`,
          line
        );
      }
    }

    try {
      this.execBlock(callee.body, fnEnv);
      return null;
    } catch (sig) {
      if (sig instanceof ReturnSignal) {
        return sig.value;
      }
      throw sig;
    } finally {
      this.callDepth--;
    }
  }
}

/* ==========================================================================
   Public Evaluation API
   ========================================================================== */

export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

export function executePythonCode(
  source: string,
  stdin: string
): {
  status: 'OK' | 'SYNTAX ERROR' | 'RUNTIME ERROR';
  output: string;
  errorMessage?: string;
  executionTimeMs: number;
} {
  const start = performance.now();

  if (!source.trim()) {
    return {
      status: 'SYNTAX ERROR',
      output: '',
      errorMessage: 'Kode editor masih kosong. Tuliskan solusi Python Anda terlebih dahulu.',
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
    };
  }

  let ast: Stmt[];
  try {
    const tokens = tokenize(source);
    const parser = new Parser(tokens);
    ast = parser.parseProgram();
  } catch (err) {
    const message =
      err instanceof PySyntaxError
        ? err.message
        : `SyntaxError: Terjadi kesalahan struktur sintaksis Python (${String(err)}).`;
    return {
      status: 'SYNTAX ERROR',
      output: '',
      errorMessage: message,
      executionTimeMs: Number((performance.now() - start).toFixed(2)),
    };
  }

  try {
    const interpreter = new Interpreter(stdin);
    const output = interpreter.run(ast);
    return {
      status: 'OK',
      output,
      executionTimeMs: Number(Math.max(0.4, performance.now() - start).toFixed(2)),
    };
  } catch (err) {
    const message =
      err instanceof PyRuntimeError
        ? err.message
        : `RuntimeError: Terjadi kesalahan saat menjalankan program (${String(err)}).`;
    return {
      status: 'RUNTIME ERROR',
      output: '',
      errorMessage: message,
      executionTimeMs: Number(Math.max(0.4, performance.now() - start).toFixed(2)),
    };
  }
}

export function evaluatePythonSubmission(
  source: string,
  problem: Problem,
  mode: 'sample' | 'submit'
): EvaluationResult {
  const selectedCases: TestCase[] =
    mode === 'sample'
      ? problem.testCases.filter((tc) => tc.isPublic).slice(0, 1)
      : problem.testCases;

  const totalStart = performance.now();

  // First check syntax once on the full source
  if (!source.trim()) {
    return {
      verdict: 'SYNTAX ERROR',
      score: 0,
      passedCount: 0,
      totalCount: selectedCases.length,
      executionTimeMs: Number((performance.now() - totalStart).toFixed(2)),
      diagnosis: 'Editor kode masih kosong. Tuliskan solusi Python sesuai instruksi soal.',
      testResults: [],
      mode,
    };
  }

  let ast: Stmt[];
  try {
    const tokens = tokenize(source);
    const parser = new Parser(tokens);
    ast = parser.parseProgram();
  } catch (err) {
    const message =
      err instanceof PySyntaxError
        ? err.message
        : `SyntaxError: Kode Python tidak dapat diparsing (${String(err)}).`;
    return {
      verdict: 'SYNTAX ERROR',
      score: 0,
      passedCount: 0,
      totalCount: selectedCases.length,
      executionTimeMs: Number(Math.max(0.5, performance.now() - totalStart).toFixed(2)),
      diagnosis: message,
      testResults: [],
      mode,
    };
  }

  const testResults: TestCaseResult[] = [];
  let hasRuntimeError = false;
  let firstRuntimeMsg = '';

  for (const tc of selectedCases) {
    const caseStart = performance.now();
    try {
      const interpreter = new Interpreter(tc.input);
      const rawOut = interpreter.run(ast);
      const actualNorm = normalizeOutput(rawOut);
      const expectedNorm = normalizeOutput(tc.expectedOutput);
      const passed = actualNorm === expectedNorm;
      const elapsed = Number(Math.max(0.3, performance.now() - caseStart).toFixed(2));

      testResults.push({
        testCaseId: tc.id,
        isPublic: tc.isPublic,
        description: tc.description,
        passed,
        status: passed ? 'ACCEPTED' : 'WRONG ANSWER',
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: actualNorm === '' ? '(tidak ada output)' : actualNorm,
        executionTimeMs: elapsed,
      });
    } catch (err) {
      hasRuntimeError = true;
      const msg =
        err instanceof PyRuntimeError
          ? err.message
          : `RuntimeError: Kesalahan eksekusi (${String(err)}).`;
      if (!firstRuntimeMsg) firstRuntimeMsg = msg;
      const elapsed = Number(Math.max(0.3, performance.now() - caseStart).toFixed(2));

      testResults.push({
        testCaseId: tc.id,
        isPublic: tc.isPublic,
        description: tc.description,
        passed: false,
        status: 'RUNTIME ERROR',
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: '',
        executionTimeMs: elapsed,
        errorMessage: msg,
      });
    }
  }

  const passedCount = testResults.filter((r) => r.passed).length;
  const totalCount = selectedCases.length;
  const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const totalElapsed = Number(
    Math.max(
      1.2,
      testResults.reduce((acc, r) => acc + r.executionTimeMs, 0)
    ).toFixed(2)
  );

  let verdict: VerdictStatus;
  let diagnosis: string;

  if (passedCount === totalCount) {
    verdict = 'ACCEPTED';
    diagnosis =
      mode === 'sample'
        ? 'Sampel uji publik berhasil lolos! Lanjutkan dengan klik "Submit & Nilai Otomatis" untuk menguji seluruh 4 test case termasuk kasus tersembunyi.'
        : 'Luar biasa! Seluruh 4 test case (1 publik & 3 hidden) berhasil lolos dengan skor sempurna 100.';
  } else if (hasRuntimeError) {
    verdict = 'RUNTIME ERROR';
    diagnosis = firstRuntimeMsg;
  } else {
    verdict = 'WRONG ANSWER';
    diagnosis =
      mode === 'sample'
        ? 'Output program belum sesuai dengan Output Diharapkan pada kasus uji publik. Bandingkan hasil aktual di bawah dan periksa kembali logika Anda.'
        : `${passedCount} dari ${totalCount} test case lolos. Periksa kembali kasus batas (edge cases) dan format keluaran program Anda.`;
  }

  return {
    verdict,
    score,
    passedCount,
    totalCount,
    executionTimeMs: totalElapsed,
    diagnosis,
    testResults,
    mode,
  };
}
