import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Reports } from '@/pages/Reports';
import { AuthContext } from '@/contexts/AuthContext';
import * as pdfGenerator from '@/lib/pdfGenerator';
import { supabase } from '@/lib/supabase';

// Mock Supabase
const mockSupabaseChain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => mockSupabaseChain),
        auth: {
            getUser: vi.fn(),
        },
    },
}));

// Mock pdfGenerator
vi.mock('@/lib/pdfGenerator', () => ({
    generateAttendancePDF: vi.fn(),
}));

// Mock AuthContext
const renderWithAuth = (component: React.ReactNode) => {
    return render(
        <AuthContext.Provider value={{ user: { id: '123', email: 'test@test.com', user_metadata: { name: 'Dr. Test' } } } as any}>
            {component}
        </AuthContext.Provider>
    );
};

describe('Reports Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should open attendance modal when clicking the card', () => {
        renderWithAuth(<Reports />);

        const card = screen.getByText('Atestado de Comparecimento');
        fireEvent.click(card);

        expect(screen.getByText('Emitir Atestado')).toBeInTheDocument();
    });

    it('should have patient and date selection fields', () => {
        renderWithAuth(<Reports />);

        // Open modal
        fireEvent.click(screen.getByText('Atestado de Comparecimento'));

        expect(screen.getByText('Paciente')).toBeInTheDocument();
        expect(screen.getByText('Data Início')).toBeInTheDocument();
        expect(screen.getByText('Data Fim')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Gerar Atestado/i })).toBeInTheDocument();
    });
});
