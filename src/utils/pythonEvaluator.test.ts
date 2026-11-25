import test from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEMS } from '../data/problems';
import { evaluatePythonSubmission, executePythonCode } from './pythonEvaluator';

test('All 4 reference solutions pass 100% of test cases on submit', () => {
  for (const problem of PROBLEMS) {
    const res = evaluatePythonSubmission(problem.referenceSolution, problem, 'submit');
    assert.equal(res.verdict, 'ACCEPTED', `Problem ${problem.number} failed: ${res.diagnosis}`);
    assert.equal(res.score, 100);
    assert.equal(res.passedCount, 4);
    assert.equal(res.totalCount, 4);
  }
});

test('Sample mode runs only 1 public test case', () => {
  const res = evaluatePythonSubmission(PROBLEMS[0].referenceSolution, PROBLEMS[0], 'sample');
  assert.equal(res.verdict, 'ACCEPTED');
  assert.equal(res.totalCount, 1);
  assert.equal(res.testResults.length, 1);
  assert.equal(res.testResults[0].isPublic, true);
});

test('Alternative student solutions work accurately (while loop, chained comparison, list comprehension)', () => {
  // Problem 2 using chained comparison
  const p2Alt = `nilai = int(input())
if nilai >= 70:
    print("LULUS")
elif 50 <= nilai < 70:
    print("REMEDIAL")
else:
    print("TIDAK LULUS")`;
  assert.equal(evaluatePythonSubmission(p2Alt, PROBLEMS[1], 'submit').verdict, 'ACCEPTED');

  // Problem 3 using while loop
  const p3Alt = `n = int(input())
i = 1
s = 0
while i <= n:
    s = s + i
    i += 1
print(s)`;
  assert.equal(evaluatePythonSubmission(p3Alt, PROBLEMS[2], 'submit').verdict, 'ACCEPTED');

  // Problem 4 using list comprehension & len
  const p4Alt = `def hitung_lulus(daftar_nilai):
    return len([x for x in daftar_nilai if x >= 70])

data = list(map(int, input().split()))
print(hitung_lulus(data))`;
  assert.equal(evaluatePythonSubmission(p4Alt, PROBLEMS[3], 'submit').verdict, 'ACCEPTED');
});

test('Detects syntax errors with beginner-friendly Indonesian diagnostics', () => {
  // Missing colon
  const missingColon = `x = int(input())
if x > 10
    print("Besar")`;
  const r1 = evaluatePythonSubmission(missingColon, PROBLEMS[0], 'sample');
  assert.equal(r1.verdict, 'SYNTAX ERROR');
  assert.match(r1.diagnosis, /titik dua/i);

  // Unclosed parenthesis
  const unclosedParen = `print("Halo"`;
  const r2 = evaluatePythonSubmission(unclosedParen, PROBLEMS[0], 'sample');
  assert.equal(r2.verdict, 'SYNTAX ERROR');
  assert.match(r2.diagnosis, /kurung/i);

  // Missing indentation after colon
  const badIndent = `if True:
print("Salah indent")`;
  const r3 = evaluatePythonSubmission(badIndent, PROBLEMS[0], 'sample');
  assert.equal(r3.verdict, 'SYNTAX ERROR');
  assert.match(r3.diagnosis, /indent/i);
});

test('Detects runtime errors (ZeroDivisionError, ValueError, NameError, TimeoutError)', () => {
  // ZeroDivisionError
  const rZero = executePythonCode(`x = 10 / 0\nprint(x)`, '');
  assert.equal(rZero.status, 'RUNTIME ERROR');
  assert.match(rZero.errorMessage ?? '', /ZeroDivisionError/);

  // ValueError
  const rVal = executePythonCode(`x = int("bukan_angka")`, '');
  assert.equal(rVal.status, 'RUNTIME ERROR');
  assert.match(rVal.errorMessage ?? '', /ValueError/);

  // NameError
  const rName = executePythonCode(`print(variabel_tidak_ada)`, '');
  assert.equal(rName.status, 'RUNTIME ERROR');
  assert.match(rName.errorMessage ?? '', /NameError/);

  // Infinite loop TimeoutError
  const rInf = executePythonCode(`i = 0\nwhile True:\n    i += 1`, '');
  assert.equal(rInf.status, 'RUNTIME ERROR');
  assert.match(rInf.errorMessage ?? '', /TimeoutError/);
});

test('Wrong answer calculates partial score accurately', () => {
  // Starter code for Problem 01 prints "0" -> 0/4 passed against 15000, 24000, 30000, 10000
  const rWrong = evaluatePythonSubmission(PROBLEMS[0].starterCode, PROBLEMS[0], 'submit');
  assert.equal(rWrong.verdict, 'WRONG ANSWER');
  assert.equal(rWrong.score, 0);
  assert.equal(rWrong.passedCount, 0);
});
