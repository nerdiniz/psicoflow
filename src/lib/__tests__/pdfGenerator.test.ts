import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAnamnesisPDF, generateAttendancePDF } from '@/lib/pdfGenerator';
import * as dateFns from 'date-fns';

// Mock jsPDF
const mockJsPDFInstance = {
    internal: {
        pageSize: {
            getWidth: vi.fn().mockReturnValue(210),
            getHeight: vi.fn().mockReturnValue(297),
        },
        getNumberOfPages: vi.fn().mockReturnValue(1),
    },
    setFillColor: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    setFontSize: vi.fn().mockReturnThis(),
    setTextColor: vi.fn().mockReturnThis(),
    setFont: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    setDrawColor: vi.fn().mockReturnThis(),
    line: vi.fn().mockReturnThis(),
    splitTextToSize: vi.fn().mockImplementation((text) => [text]),
    save: vi.fn().mockReturnThis(),
    setPage: vi.fn().mockReturnThis(),
    lastAutoTable: { finalY: 50 },
};

vi.mock('jspdf', () => {
    return {
        default: class MockJsPDF {
            constructor() {
                return mockJsPDFInstance;
            }
        }
    };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
    default: vi.fn(),
}));

describe('pdfGenerator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateAnamnesisPDF', () => {
        it('should generate a PDF for blank anamnesis', () => {
            generateAnamnesisPDF({
                patientName: '',
                data: {},
                isBlank: true,
                psychologistName: 'Dr. Test',
                crp: '123456',
            });

            expect(mockJsPDFInstance.text).toHaveBeenCalledWith('PsicoFlow', 20, 20);
            expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Prontuário de Anamnese Psicológica', 20, 28);
            expect(mockJsPDFInstance.text).toHaveBeenCalledWith('DR. TEST - CRP: 123456', 20, 35);
            expect(mockJsPDFInstance.save).toHaveBeenCalledWith('Anamnese_em_Branco.pdf');
        });

        it('should generate a PDF for filled anamnesis', () => {
            const mockData = {
                identificacao: { nome: 'João Silva' },
            };

            generateAnamnesisPDF({
                patientName: 'João Silva',
                data: mockData,
                isBlank: false,
                psychologistName: 'Dr. Test',
                crp: '123456',
            });

            expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Paciente: João Silva', 190, 33, { align: 'right' });
            expect(mockJsPDFInstance.save).toHaveBeenCalledWith('Anamnese_João_Silva.pdf');
        });
    });

    describe('generateAttendancePDF', () => {
        it('should generate an attendance PDF correctly', () => {
            const mockSessions = [
                { date: '2023-10-01T10:00:00', type: 'online' },
                { date: '2023-10-08T10:00:00', type: 'presencial' },
            ];

            generateAttendancePDF({
                patientName: 'Maria Souza',
                sessions: mockSessions,
                psychologistName: 'Dr. Test',
                crp: '123456',
                startDate: '2023-10-01',
                endDate: '2023-10-31',
            });

            expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Atestado de Comparecimento', 20, 28);
            expect(mockJsPDFInstance.text).toHaveBeenCalledWith('ATESTADO DE COMPARECIMENTO', 105, 60, { align: 'center' });
            expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Dr. Test', 105, expect.any(Number), { align: 'center' });
            expect(mockJsPDFInstance.save).toHaveBeenCalledWith('Atestado_Maria_Souza.pdf');
        });
    });
});
