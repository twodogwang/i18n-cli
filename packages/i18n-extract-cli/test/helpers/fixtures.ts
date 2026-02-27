import { readFileSync } from 'fs'
import { join } from 'path'

const FIXTURES_DIR = join(__dirname, '../fixtures')

export function loadFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, 'input', filename), 'utf-8')
}

export function loadExpected(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, 'expected', filename), 'utf-8')
}
