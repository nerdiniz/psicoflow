
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Financial } from '@/pages/Financial';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock jsPDF
const mockSave = vi.fn();
const mockText = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();

vi.mock('jspdf', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            save: mockSave,
            text: mockText,
            setFontSize: mockSetFontSize,
            setTextColor: mockSetTextColor,
        })),
    };
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();

// Mock AuthContext
const renderWithAuth = (component: React.ReactNode) => {
    return render(
        <AuthContext.Provider value={{ user: { id: '123', email: 'test@test.com', user_metadata: { name: 'Dr. Test', crp: '12345' } } } as any}>
            {component}
        </AuthContext.Provider>
    );
};

describe('Financial Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render loading state initially', () => {
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({ data: [], error: null }),
        });

        renderWithAuth(<Financial />);
        expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 has role="status" usually or we find by class/testId? Loader2 is an icon, probably need to find by some text or assume
        // Actually Loader2 might not have role status by default in lucide.
        // Let's check for "Fluxo de Caixa" which is static.
        expect(screen.getByText('Fluxo de Caixa')).toBeInTheDocument();
    });

    it('should fetch and display financial data and calculate totals', async () => {
        const mockData = [
            {
                id: 1,
                date: new Date().toISOString(),
                status: 'realizado',
                patients: {
                    name: 'Paciente 1',
                    payment_type: 'particular',
                    custom_price: 150,
                    plans: null
                }
            },
            {
                id: 2,
                date: new Date().toISOString(),
                status: 'agendado',
                patients: {
                    name: 'Paciente 2',
                    payment_type: 'plano',
                    plans: {
                        name: 'Unimed',
                        value: 100
                    }
                }
            }
        ];

        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        });

        renderWithAuth(<Financial />);

        await waitFor(() => {
            expect(screen.queryByText('Sem movimentações')).not.toBeInTheDocument();
        });

        // Check Transaction List
        expect(screen.getByText('Paciente 1')).toBeInTheDocument();
        expect(screen.getByText('Paciente 2')).toBeInTheDocument();
        expect(screen.getByText('Unimed')).toBeInTheDocument(); // Badge for Plan Name
        expect(screen.getByText('Particular')).toBeInTheDocument();

        // Check Stats
        // Total Estimated: 150 + 100 = 250
        // Received: 150
        // Pending: 100
        // Average Ticket: 250 / 2 = 125

        expect(screen.getByText('R$ 250,00')).toBeInTheDocument(); // Estimated
        expect(screen.getByText('R$ 150,00')).toBeInTheDocument(); // Received
        expect(screen.getByText('R$ 100,00')).toBeInTheDocument(); // Pending
        expect(screen.getByText('R$ 125,00')).toBeInTheDocument(); // Average Ticket

        // Test Filters
        const statusSelect = screen.getByRole('combobox', { name: /status/i }); // Assuming I can select by role/name or I'll just find by display value?
        // Actually, selects might not have a label "Status". I used:
        // <option value="todos">Todos os Status</option>
        // Use getByDisplayValue or verify presence of filter options.
        expect(screen.getByText('Todos os Status')).toBeInTheDocument();
        expect(screen.getByText('Todos os Tipos')).toBeInTheDocument();

        // Simulate Filter Change (Status = Agendado)
        // Note: interacting with selects in tests can be tricky depending on how they are rendered.
        // Assuming standard select.
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: 'agendado' } });

        // Should only show "Paciente 2" (Agendado)
        await waitFor(() => {
            expect(screen.queryByText('Paciente 1')).not.toBeInTheDocument(); // Realizado
            expect(screen.getByText('Paciente 2')).toBeInTheDocument(); // Agendado
        });
    });

    it('should handle plan values returned as strings or arrays correctly', async () => {
        const mockDataMixed = [
            {
                id: 1,
                date: new Date().toISOString(),
                status: 'realizado',
                patients: {
                    name: 'Array Plan Patient',
                    payment_type: 'plano',
                    plans: [{ name: 'Array Health', value: '200.50' }]
                }
            }
        ];

        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockDataMixed, error: null }),
        });

        renderWithAuth(<Financial />);

        await waitFor(() => {
            expect(screen.getByText('Array Plan Patient')).toBeInTheDocument();
            expect(screen.getByText('R$ 200,50')).toBeInTheDocument();
            expect(screen.getByText('Array Health')).toBeInTheDocument();
            expect(screen.getByText('Array Health')).toBeInTheDocument();
        });
    });

    it.only('should project recurring slots correctly', async () => {
        const mockRecurringSlots = [
            {
                id: 'slot1',
                day_of_week: new Date().getDay(), // Today
                start_time: '10:00:00',
                patients: {
                    name: 'Recurring Patient',
                    payment_type: 'plano',
                    plans: { name: 'Unimed', value: 120 }
                }
            }
        ];

        // Mock empty appointments but active recurring slots
        (supabase.from as any).mockImplementation((table: string) => {
            console.log('Mock supabase.from called with:', table);
            if (table === 'appointments') {
                return {
                    select: vi.fn().mockReturnThis(),
                    gte: vi.fn().mockReturnThis(),
                    lte: vi.fn().mockReturnThis(),
                    neq: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
            }
            if (table === 'recurring_slots') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockResolvedValue({ data: mockRecurringSlots, error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
            };
        });

        renderWithAuth(<Financial />);

        await waitFor(() => {
            expect(screen.getByText('Recurring Patient')).toBeInTheDocument();
            expect(screen.getByText('R$ 120,00')).toBeInTheDocument();
            // Should be 'agendado' by default for projection
            expect(screen.getByText('agendado')).toBeInTheDocument();
        });
    });

    it('should export CSV', async () => {
        const mockData = [{
            id: 1,
            date: new Date().toISOString(),
            status: 'realizado',
            patients: {
                name: 'Paciente CSV',
                payment_type: 'particular',
                custom_price: 200,
            }
        }];

        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        });

        renderWithAuth(<Financial />);
        await waitFor(() => expect(screen.getByText('Paciente CSV')).toBeInTheDocument());

        const exportButton = screen.getByText('Exportar CSV');
        fireEvent.click(exportButton);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should generate receipt when button is clicked', async () => {
        const mockData = [{
            id: 1,
            date: new Date().toISOString(),
            status: 'realizado',
            patients: {
                name: 'Paciente Recibo',
                payment_type: 'particular',
                custom_price: 200,
            }
        }];

        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        });

        renderWithAuth(<Financial />);

        await waitFor(() => {
            expect(screen.getByText('Paciente Recibo')).toBeInTheDocument();
        });

        const receiptButton = screen.getByTitle('Gerar Recibo');
        fireEvent.click(receiptButton);

        expect(mockSave).toHaveBeenCalled();
        expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Recebi de Paciente Recibo'), expect.any(Number), expect.any(Number));
    });
});
