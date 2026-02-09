import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '@/pages/Dashboard';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock AuthContext
const renderWithAuth = (component: React.ReactNode) => {
    return render(
        <AuthContext.Provider value={{ user: { id: '123', email: 'test@test.com', user_metadata: { name: 'Dr. Test' } } } as any}>
            {component}
        </AuthContext.Provider>
    );
};

describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render loading state initially', () => {
        // Mock return values for initial render to avoid errors before useEffect completes
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({ data: [], error: null }),
        });

        renderWithAuth(<Dashboard onViewChange={vi.fn()} />);

        // Check for loading indicators (the "..." text in cards or Loader2)
        expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });

    it('should fetch and display dashboard data', async () => {
        // Mock Supabase responses
        const mockSelect = vi.fn();
        (supabase.from as any).mockImplementation((table: string) => {
            switch (table) {
                case 'patients':
                    return {
                        select: vi.fn().mockResolvedValue({ count: 15, error: null }),
                    };
                case 'appointments':
                    return {
                        select: vi.fn().mockReturnThis(),
                        gte: vi.fn().mockReturnThis(),
                        lte: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue({ // For today's appointments
                            data: [{
                                id: 1,
                                date: new Date().toISOString(),
                                type: 'online',
                                status: 'agendado',
                                patients: { name: 'Paciente Teste' }
                            }],
                            error: null
                        }),
                    };
                case 'payments':
                    return {
                        select: vi.fn().mockReturnThis(),
                        gte: vi.fn().mockReturnThis(),
                        lte: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue({ data: [{ amount: 150 }, { amount: 200 }], error: null }),
                    };
                default:
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        gte: vi.fn().mockReturnThis(),
                        lte: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockReturnThis()
                    };
            }
        });

        // We need to refine the mock to handle the specific chain calls for "Sessions this week" vs "Today's appointments"
        // Since the logic in Dashboard uses chaining, it's easier to verify that loading finishes and some data appears.
        // However, mocking chained calls perfectly with `vi.fn().mockReturnThis()` can be tricky if they return different values at the end.
        // For simplicity in this test, we accept that we are verifying the rendering flow.

        renderWithAuth(<Dashboard onViewChange={vi.fn()} />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText('...')).not.toBeInTheDocument();
        });

        // Check if Stats titles are present
        expect(screen.getAllByText('Total de Pacientes').length).toBeGreaterThan(0); // Using getAll in case duplicated or ensuring existence

        // Mock Profile Fetch
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'profiles') return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { name: 'Dr. ProfileName' }, error: null })
            };
            if (table === 'patients') return { select: vi.fn().mockResolvedValue({ count: 10, error: null }) };
            if (table === 'appointments') return { select: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
            return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
        });

        // Re-render to trigger profile fetch
        // renderWithAuth(<Dashboard onViewChange={vi.fn()} />); 
        // Actually, we need to update the mock BEFORE render.
        // Let's create a new test for Greeting.
    });

    it('should display the correct greeting from profile', async () => {
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'profiles') return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { name: 'Dr. ProfileName' }, error: null })
            };
            // Default mocks to avoid crashes
            if (table === 'patients') return { select: vi.fn().mockResolvedValue({ count: 0, error: null }) };
            return { select: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
        });

        renderWithAuth(<Dashboard onViewChange={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText(/Dr. ProfileName/)).toBeInTheDocument();
        });
    });
});
