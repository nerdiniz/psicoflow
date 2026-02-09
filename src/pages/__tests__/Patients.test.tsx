
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Patients } from '@/pages/Patients';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock PDF Generator
vi.mock('@/lib/pdfGenerator', () => ({
    generateAnamnesisPDF: vi.fn()
}));

// Mock AuthContext
const renderWithAuth = (component: React.ReactNode) => {
    return render(
        <AuthContext.Provider value={{ user: { id: '123', email: 'test@test.com', user_metadata: { name: 'Dr. Test' } } } as any}>
            {component}
        </AuthContext.Provider>
    );
};

describe('Patients Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks setup
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnThis(),
        });
    });

    it('should display patients list', async () => {
        const mockPatients = [
            { id: '1', name: 'Alice', status: 'ativo', created_at: new Date().toISOString(), payment_type: 'particular' },
            { id: '2', name: 'Bob', status: 'inativo', created_at: new Date().toISOString(), payment_type: 'plano' }
        ];

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'patients') {
                return {
                    select: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: mockPatients, error: null }),
                };
            }
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: { name: 'Dr Test' }, error: null }),
                };
            }
            if (table === 'plans') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: {}, error: null })
            };
        });

        renderWithAuth(<Patients />);

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });

        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should filter patients list', async () => {
        const mockPatients = [
            { id: '1', name: 'Alice', status: 'ativo', created_at: new Date().toISOString(), payment_type: 'particular' },
            { id: '2', name: 'Bob', status: 'inativo', created_at: new Date().toISOString(), payment_type: 'plano' }
        ];

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'patients') {
                return {
                    select: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: mockPatients, error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
                single: vi.fn().mockResolvedValue({ data: {}, error: null })
            };
        });

        renderWithAuth(<Patients />);

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Buscar por nome ou email...');
        fireEvent.change(searchInput, { target: { value: 'Alice' } });

        await waitFor(() => {
            expect(screen.queryByText('Bob')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should open modal and switch payment type', async () => {
        renderWithAuth(<Patients />);

        const newPatientBtn = screen.getByText('Novo Paciente');
        fireEvent.click(newPatientBtn);

        await waitFor(() => {
            expect(screen.getByText('Nome Completo')).toBeInTheDocument();
        });

        // Default is particular -> check for 'Valor da Sessão' input
        expect(screen.getByText('Valor da Sessão')).toBeInTheDocument();

        // Select 'Plano de Saúde'
        // We might need to find the select by role or label properly
        const paymentSelect = screen.getByRole('combobox', { name: /Tipo de Pagamento/i }); // Assuming there is a label connected, or just find by display value
        // Or getting by display value if it's a simple select
        const selects = screen.getAllByRole('combobox');
        // We can assume the first one is payment type OR use label text interaction if label is properly associated
        // In code: label "Tipo de Pagamento" -> select
        // Let's use getByLabelText

        // Wait, select in component:
        /*
        <label>Tipo de Pagamento</label>
        <select ...>
        */
        // It might not be associated with htmlFor, let's assume getByLabelText might fail if id is missing.
        // fallback: use container

        // Let's rely on finding by value or just query selector if needed, but 'combobox' with name might work if implicit label? No.
        // Let's try changing the value directly on the element found next to the label.

        // Actually, let's just use fireEvent on the select found by display value 'Particular'
        const particularOption = screen.getByText('Particular');
        const select = particularOption.closest('select');
        if (select) {
            fireEvent.change(select, { target: { value: 'plano' } });
        } else {
            // Fallback if structure is different
            const allSelects = screen.getAllByRole('combobox');
            fireEvent.change(allSelects[0], { target: { value: 'plano' } });
        }

        // Check for 'Plano' select instead of Value
        await waitFor(() => {
            expect(screen.queryByText('Valor da Sessão')).not.toBeInTheDocument();
            expect(screen.getByText('Plano')).toBeInTheDocument(); // Label "Plano"
        });
    });
});
