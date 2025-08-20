/**
 * @jest-environment jsdom
 */
import {compute, extract, FORMULA_PART_TYPES, parse} from '../../src/libs/Formula';
import type {FormulaContext} from '../../src/libs/Formula';

describe('Formula', () => {
    describe('extract', () => {
        it('should extract formula parts from a string', () => {
            expect(extract('Hello {world} and {test}')).toEqual(['{world}', '{test}']);
            expect(extract('No formulas here')).toEqual([]);
            expect(extract('{single}')).toEqual(['{single}']);
            expect(extract('')).toEqual([]);
        });

        it('should handle nested braces', () => {
            expect(extract('{outer {inner} outer}')).toEqual(['{outer {inner} outer}']);
        });

        it('should handle escaped characters', () => {
            expect(extract('\\{not a formula\\} {real formula}')).toEqual(['{real formula}']);
        });
    });

    describe('parse', () => {
        it('should parse a simple formula into parts', () => {
            const result = parse('Hello {report:type}!');
            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
                definition: 'Hello ',
                type: FORMULA_PART_TYPES.FREETEXT,
                fieldPath: [],
                functions: [],
            });
            expect(result[1]).toEqual({
                definition: '{report:type}',
                type: FORMULA_PART_TYPES.REPORT,
                fieldPath: ['type'],
                functions: [],
            });
            expect(result[2]).toEqual({
                definition: '!',
                type: FORMULA_PART_TYPES.FREETEXT,
                fieldPath: [],
                functions: [],
            });
        });

        it('should handle functions in formula parts', () => {
            const result = parse('{field:email|frontPart}');
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                definition: '{field:email|frontPart}',
                type: FORMULA_PART_TYPES.FIELD,
                fieldPath: ['email'],
                functions: ['frontPart'],
            });
        });

        it('should handle multiple functions', () => {
            const result = parse('{field:name|substr:0:5|domain}');
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                definition: '{field:name|substr:0:5|domain}',
                type: FORMULA_PART_TYPES.FIELD,
                fieldPath: ['name'],
                functions: ['substr:0:5', 'domain'],
            });
        });
    });

    describe('compute', () => {
        const mockContext: FormulaContext = {
            report: {
                reportID: 'R123456',
                type: 'expense',
                total: 12345, // $123.45
                currency: 'USD',
                created: '2025-07-31T21:42:02.000Z',
            } as any,
            policy: {
                name: 'Test Company Policy',
            } as any,
        };

        it('should compute report type', () => {
            const result = compute('{report:type}', mockContext);
            expect(result).toBe('Expense Report');
        });

        it('should compute report total', () => {
            const result = compute('{report:total}', mockContext);
            expect(result).toBe('$123.45');
        });

        it('should compute policy name', () => {
            const result = compute('{report:policyname}', mockContext);
            expect(result).toBe('Test Company Policy');
        });

        it('should handle free text', () => {
            const result = compute('This is just text', mockContext);
            expect(result).toBe('This is just text');
        });

        it('should combine formula parts with free text', () => {
            const result = compute('Report {report:type} for ${report:total}', mockContext);
            expect(result).toBe('Report Expense Report for $123.45');
        });

        it('should handle unknown formula parts', () => {
            const result = compute('{report:unknown}', mockContext);
            expect(result).toBe('{report:unknown}');
        });

        describe('date formatting', () => {
            it('should format dates with basic formats', () => {
                expect(compute('{report:created:yyyy-MM-dd}', mockContext)).toBe('2025-07-31');
                expect(compute('{report:created:MM/dd/yyyy}', mockContext)).toBe('07/31/2025');
                expect(compute('{report:created:dd MMM yyyy}', mockContext)).toBe('31 Jul 2025');
            });

            it('should format day components', () => {
                expect(compute('{report:created:d}', mockContext)).toBe('31');
                expect(compute('{report:created:dd}', mockContext)).toBe('31');
                expect(compute('{report:created:j}', mockContext)).toBe('31');
                expect(compute('{report:created:D}', mockContext)).toBe('Thu');
                expect(compute('{report:created:l}', mockContext)).toBe('Thursday');
                expect(compute('{report:created:N}', mockContext)).toBe('4'); // ISO day of week
                expect(compute('{report:created:w}', mockContext)).toBe('4'); // US day of week
                expect(compute('{report:created:S}', mockContext)).toBe('st'); // Ordinal suffix
            });

            it('should format month components', () => {
                expect(compute('{report:created:F}', mockContext)).toBe('July');
                expect(compute('{report:created:M}', mockContext)).toBe('Jul');
                expect(compute('{report:created:MM}', mockContext)).toBe('07');
                expect(compute('{report:created:n}', mockContext)).toBe('7');
            });

            it('should format year components', () => {
                expect(compute('{report:created:Y}', mockContext)).toBe('2025');
                expect(compute('{report:created:yyyy}', mockContext)).toBe('2025');
                expect(compute('{report:created:y}', mockContext)).toBe('25');
                expect(compute('{report:created:yy}', mockContext)).toBe('25');
            });

            it('should format time components', () => {
                expect(compute('{report:created:H}', mockContext)).toBe('21');
                expect(compute('{report:created:h}', mockContext)).toBe('09');
                expect(compute('{report:created:g}', mockContext)).toBe('9');
                expect(compute('{report:created:G}', mockContext)).toBe('21');
                expect(compute('{report:created:i}', mockContext)).toBe('42');
                expect(compute('{report:created:s}', mockContext)).toBe('02');
                expect(compute('{report:created:a}', mockContext)).toBe('pm');
                expect(compute('{report:created:A}', mockContext)).toBe('PM');
            });

            it('should handle complex date format combinations', () => {
                const result = compute('Created on {report:created:dddd}, {report:created:MMMM} {report:created:j}{report:created:S}, {report:created:yyyy}', mockContext);
                expect(result).toBe('Created on Thursday, July 31st, 2025');
            });

            it('should handle full date/time formats', () => {
                expect(compute('{report:created:c}', mockContext)).toMatch(/2025-07-31T\d{2}:42:02\.\d{3}Z/);
                expect(compute('{report:created:r}', mockContext)).toMatch(/Thu, 31 Jul 2025 \d{2}:42:02 GMT/);
                expect(compute('{report:created:U}', mockContext)).toMatch(/^\d+$/);
            });
        });

        describe('functions', () => {
            it('should apply frontPart function to email', () => {
                const result = compute('{user:email|frontPart}', {
                    ...mockContext,
                    user: {email: 'john.doe@example.com'},
                } as any);
                // Since user computation isn't implemented yet, it returns the original definition
                expect(result).toBe('{user:email|frontPart}');
            });

            it('should handle invalid date strings gracefully', () => {
                const contextWithInvalidDate: FormulaContext = {
                    ...mockContext,
                    report: {
                        ...mockContext.report,
                        created: 'invalid-date',
                    } as any,
                };
                expect(compute('{report:created:yyyy}', contextWithInvalidDate)).toBe('');
            });

            it('should handle missing date gracefully', () => {
                const contextWithoutDate: FormulaContext = {
                    ...mockContext,
                    report: {
                        ...mockContext.report,
                        created: undefined,
                    } as any,
                };
                expect(compute('{report:created:yyyy}', contextWithoutDate)).toBe('');
            });
        });
    });

    describe('edge cases', () => {
        it('should handle empty formula', () => {
            expect(compute('', {} as any)).toBe('');
        });

        it('should handle null/undefined formula', () => {
            expect(compute(null as any, {} as any)).toBe('');
            expect(compute(undefined as any, {} as any)).toBe('');
        });

        it('should handle formula with only whitespace', () => {
            expect(compute('   ', {} as any)).toBe('   ');
        });

        it('should handle malformed braces', () => {
            expect(compute('{incomplete', {} as any)).toBe('{incomplete');
            expect(compute('incomplete}', {} as any)).toBe('incomplete}');
        });
    });
});
